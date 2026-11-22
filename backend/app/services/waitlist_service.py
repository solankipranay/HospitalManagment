"""
Waitlist Auto-Reallocation Service
=====================================
When a patient cancels an appointment:
  1. Query waitlist for the same doctor + date
  2. Order by priority DESC (critical=4 > high=3 > medium=2 > low=1)
     then by created_at ASC (FIFO within same urgency)
  3. Auto-create a new appointment for the top-priority patient
  4. Mark that waitlist entry as 'assigned'
"""

from datetime import datetime
from typing import Optional

from bson import ObjectId


async def process_waitlist_after_cancellation(
    doctor_id: str,
    cancelled_start: datetime,
    cancelled_end: datetime,
    db,
) -> Optional[dict]:
    """
    Returns a dict with patient_id & appointment_id if reallocation happened,
    else None.
    """
    target_date_str = cancelled_start.strftime("%Y-%m-%d")

    # Find highest-priority waiting entry for this doctor on this date
    entry = await db.waitlist.find_one(
        {
            "doctor_id": ObjectId(doctor_id),
            "preferred_date": target_date_str,
            "status": "waiting",
        },
        sort=[("priority", -1), ("created_at", 1)],
    )

    if not entry:
        return None  # nobody is waiting → slot stays open

    # Create a new appointment for the waitlisted patient
    new_appt = {
        "doctor_id": ObjectId(doctor_id),
        "patient_id": entry["patient_id"],
        "start_time": cancelled_start,
        "end_time": cancelled_end,
        "status": "Scheduled",
        "notes": None,
        "diagnosis": None,
        "auto_assigned": True,  # flag so UI can show a badge
        "created_at": datetime.utcnow(),
    }
    result = await db.appointments.insert_one(new_appt)

    # Mark waitlist entry as assigned
    await db.waitlist.update_one(
        {"_id": entry["_id"]},
        {
            "$set": {
                "status": "assigned",
                "appointment_id": result.inserted_id,
                "assigned_at": datetime.utcnow(),
            }
        },
    )

    return {
        "patient_id": str(entry["patient_id"]),
        "appointment_id": str(result.inserted_id),
    }
