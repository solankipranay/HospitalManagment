"""
Appointments Router
====================
Key logic:
  - Book: atomic partial-unique-index prevents double-booking
  - Cancel: enforces 2-hour rule → triggers waitlist reallocation
  - Status: doctor-only transitions (Scheduled→In_Progress→Completed)
  - Notes: doctor adds notes/diagnosis after Completed
"""

from datetime import datetime, timedelta, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.errors import DuplicateKeyError

from app.database import get_db
from app.middleware.auth_middleware import get_current_user, require_doctor, require_patient
from app.models.appointment import (
    AppointmentCreate,
    AppointmentNotesUpdate,
    AppointmentStatusUpdate,
)
from app.routes.websocket import manager
from app.services.waitlist_service import process_waitlist_after_cancellation

router = APIRouter(prefix="/appointments", tags=["Appointments"])

VALID_TRANSITIONS = {
    "Scheduled": ["In_Progress"],
    "In_Progress": ["Completed"],
    "Completed": [],
    "Cancelled": [],
}


async def _enrich(appt: dict, db) -> dict:
    """Add doctor_name and patient_name to an appointment document."""
    doctor_doc = await db.doctors.find_one({"_id": appt["doctor_id"]})
    doctor_user = (
        await db.users.find_one({"_id": doctor_doc["user_id"]}) if doctor_doc else None
    )
    patient_user = await db.users.find_one({"_id": appt["patient_id"]})
    return {
        "id": str(appt["_id"]),
        "doctor_id": str(appt["doctor_id"]),
        "patient_id": str(appt["patient_id"]),
        "doctor_name": doctor_user["name"] if doctor_user else "Unknown",
        "patient_name": patient_user["name"] if patient_user else "Unknown",
        "start_time": appt["start_time"].isoformat() + "Z",
        "end_time": appt["end_time"].isoformat() + "Z",
        "status": appt["status"],
        "notes": appt.get("notes"),
        "diagnosis": appt.get("diagnosis"),
        "created_at": appt["created_at"].isoformat() + "Z",
        "auto_assigned": appt.get("auto_assigned", False),
    }


# ─────────────────────────── BOOK ────────────────────────────
@router.post("", status_code=status.HTTP_201_CREATED)
async def book_appointment(
    data: AppointmentCreate,
    current_user=Depends(require_patient),
    db=Depends(get_db),
):
    """
    Book a slot. Double-booking is prevented by a partial unique index on
    (doctor_id, start_time) where status ∈ {Scheduled, In_Progress}.
    If two concurrent requests pass the conflict check, only one insert
    succeeds; the other gets a DuplicateKeyError → 409.
    """
    try:
        doctor_oid = ObjectId(data.doctor_id)
    except Exception:
        raise HTTPException(400, "Invalid doctor ID")

    doctor = await db.doctors.find_one({"_id": doctor_oid})
    if not doctor:
        raise HTTPException(404, "Doctor not found")

    start_time = data.start_time.replace(tzinfo=None)  # store naive UTC
    end_time = start_time + timedelta(minutes=doctor["consultation_duration"])

    # Pre-check (fast path; unique index is the real guard)
    conflict = await db.appointments.find_one(
        {
            "doctor_id": doctor_oid,
            "start_time": start_time,
            "status": {"$in": ["Scheduled", "In_Progress"]},
        }
    )
    if conflict:
        raise HTTPException(409, "This slot is already booked. Please choose another.")

    new_appt = {
        "doctor_id": doctor_oid,
        "patient_id": current_user["_id"],
        "start_time": start_time,
        "end_time": end_time,
        "status": "Scheduled",
        "notes": None,
        "diagnosis": None,
        "auto_assigned": False,
        "created_at": datetime.now(timezone.utc).replace(tzinfo=None),
    }

    try:
        result = await db.appointments.insert_one(new_appt)
    except DuplicateKeyError:
        # Concurrent booking hit the unique index — slot already taken
        raise HTTPException(409, "Slot was just booked by someone else. Please refresh.")

    # Broadcast via WebSocket so other patients see the slot disappear
    date_str = start_time.strftime("%Y-%m-%d")
    await manager.broadcast(
        data.doctor_id, date_str, {"action": "slot_booked", "slot": start_time.isoformat() + "Z"}
    )

    return {
        "message": "Appointment booked successfully",
        "appointment_id": str(result.inserted_id),
        "start_time": start_time.isoformat() + "Z",
        "end_time": end_time.isoformat() + "Z",
    }


# ─────────────────────── MY APPOINTMENTS ─────────────────────
@router.get("/me")
async def get_my_appointments(
    current_user=Depends(get_current_user), db=Depends(get_db)
):
    """Return all non-cancelled appointments for the logged-in user (doctor or patient)."""
    if current_user["role"] == "patient":
        query = {
            "patient_id": current_user["_id"],
            "status": {"$ne": "Cancelled"},
        }
    else:
        doctor = await db.doctors.find_one({"user_id": current_user["_id"]})
        if not doctor:
            return []
        query = {
            "doctor_id": doctor["_id"],
            "status": {"$ne": "Cancelled"},
        }

    results = []
    async for appt in db.appointments.find(query).sort("start_time", 1):
        results.append(await _enrich(appt, db))
    return results


# ─────────────────────────── CANCEL ──────────────────────────
@router.delete("/{appointment_id}")
async def cancel_appointment(
    appointment_id: str,
    current_user=Depends(require_patient),
    db=Depends(get_db),
):
    """
    Cancel an appointment.
    Rule: cancellation must happen ≥ 2 hours before the scheduled start time.
    After cancellation the waitlist service auto-assigns the freed slot to the
    highest-priority waiting patient (if any).
    """
    try:
        appt_oid = ObjectId(appointment_id)
    except Exception:
        raise HTTPException(400, "Invalid appointment ID")

    appt = await db.appointments.find_one(
        {"_id": appt_oid, "patient_id": current_user["_id"]}
    )
    if not appt:
        raise HTTPException(404, "Appointment not found")

    if appt["status"] != "Scheduled":
        raise HTTPException(
            400,
            f"Cannot cancel an appointment with status '{appt['status']}'.",
        )

    # ★ 2-hour rule
    now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
    time_left: timedelta = appt["start_time"] - now_utc
    if time_left.total_seconds() < 2 * 3600:
        raise HTTPException(
            400,
            "Cancellation not allowed: appointment starts in less than 2 hours.",
        )

    # Mark cancelled
    await db.appointments.update_one(
        {"_id": appt_oid},
        {"$set": {"status": "Cancelled", "cancelled_at": now_utc}},
    )

    # ★ Auto-reallocate freed slot to priority waitlist patient
    reallocated = await process_waitlist_after_cancellation(
        str(appt["doctor_id"]), appt["start_time"], appt["end_time"], db
    )

    # WebSocket broadcast
    date_str = appt["start_time"].strftime("%Y-%m-%d")
    action = "slot_reallocated" if reallocated else "slot_cancelled"
    await manager.broadcast(
        str(appt["doctor_id"]),
        date_str,
        {"action": action, "slot": appt["start_time"].isoformat() + "Z"},
    )

    resp = {"message": "Appointment cancelled successfully"}
    if reallocated:
        resp["notice"] = "Your slot has been auto-assigned to a priority-waitlisted patient."
    return resp


# ───────────────────── STATUS (Doctor) ───────────────────────
@router.put("/{appointment_id}/status")
async def update_status(
    appointment_id: str,
    body: AppointmentStatusUpdate,
    current_user=Depends(require_doctor),
    db=Depends(get_db),
):
    """
    Doctor transitions appointment status.
    Valid flow: Scheduled → In_Progress → Completed
    """
    doctor = await db.doctors.find_one({"user_id": current_user["_id"]})
    appt = await db.appointments.find_one(
        {"_id": ObjectId(appointment_id), "doctor_id": doctor["_id"]}
    )
    if not appt:
        raise HTTPException(404, "Appointment not found")

    current_status = appt["status"]
    new_status = body.status.value

    if new_status not in VALID_TRANSITIONS.get(current_status, []):
        raise HTTPException(
            400,
            f"Invalid transition: {current_status} → {new_status}. "
            f"Allowed: {VALID_TRANSITIONS[current_status]}",
        )

    await db.appointments.update_one(
        {"_id": ObjectId(appointment_id)}, {"$set": {"status": new_status}}
    )
    return {"message": f"Status updated to '{new_status}'"}


# ───────────────────── NOTES (Doctor) ────────────────────────
@router.put("/{appointment_id}/notes")
async def update_notes(
    appointment_id: str,
    body: AppointmentNotesUpdate,
    current_user=Depends(require_doctor),
    db=Depends(get_db),
):
    """Doctor adds consultation notes and/or diagnosis (only after Completed)."""
    doctor = await db.doctors.find_one({"user_id": current_user["_id"]})
    appt = await db.appointments.find_one(
        {"_id": ObjectId(appointment_id), "doctor_id": doctor["_id"]}
    )
    if not appt:
        raise HTTPException(404, "Appointment not found")
    if appt["status"] != "Completed":
        raise HTTPException(400, "Notes can only be added to Completed appointments.")

    update = {}
    if body.notes is not None:
        update["notes"] = body.notes
    if body.diagnosis is not None:
        update["diagnosis"] = body.diagnosis

    if update:
        await db.appointments.update_one(
            {"_id": ObjectId(appointment_id)}, {"$set": update}
        )
    return {"message": "Notes saved successfully"}
