from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.database import get_db
from app.middleware.auth_middleware import get_current_user, require_patient
from app.models.waitlist import URGENCY_PRIORITY_MAP, WaitlistCreate

router = APIRouter(prefix="/waitlist", tags=["Waitlist"])


@router.post("", status_code=201)
async def join_waitlist(
    data: WaitlistCreate,
    current_user=Depends(require_patient),
    db=Depends(get_db),
):
    """Add the current patient to the waitlist for a doctor on a given date."""
    date_str = data.preferred_date.strftime("%Y-%m-%d")

    # Prevent duplicate waitlist entries
    existing = await db.waitlist.find_one(
        {
            "doctor_id": ObjectId(data.doctor_id),
            "patient_id": current_user["_id"],
            "preferred_date": date_str,
            "status": "waiting",
        }
    )
    if existing:
        raise HTTPException(400, "You are already on the waitlist for this doctor on this date.")

    priority = URGENCY_PRIORITY_MAP[data.urgency_level.value]

    entry = {
        "doctor_id": ObjectId(data.doctor_id),
        "patient_id": current_user["_id"],
        "preferred_date": date_str,
        "urgency_level": data.urgency_level.value,
        "priority": priority,
        "status": "waiting",
        "created_at": datetime.now(timezone.utc).replace(tzinfo=None),
    }

    result = await db.waitlist.insert_one(entry)
    return {
        "message": "Added to waitlist successfully",
        "waitlist_id": str(result.inserted_id),
        "priority": priority,
        "urgency_label": data.urgency_level.value,
    }


@router.get("/me")
async def my_waitlist(current_user=Depends(get_current_user), db=Depends(get_db)):
    """Return all waiting entries for the current user."""
    entries = []
    async for entry in db.waitlist.find(
        {"patient_id": current_user["_id"], "status": "waiting"}
    ).sort("created_at", 1):
        doctor = await db.doctors.find_one({"_id": entry["doctor_id"]})
        doctor_user = (
            await db.users.find_one({"_id": doctor["user_id"]}) if doctor else None
        )
        entries.append(
            {
                "id": str(entry["_id"]),
                "doctor_id": str(entry["doctor_id"]),
                "doctor_name": doctor_user["name"] if doctor_user else "Unknown",
                "preferred_date": entry["preferred_date"],
                "urgency_level": entry["urgency_level"],
                "priority": entry["priority"],
                "status": entry["status"],
                "created_at": entry["created_at"].isoformat() + "Z",
            }
        )
    return entries


@router.delete("/{waitlist_id}")
async def leave_waitlist(
    waitlist_id: str,
    current_user=Depends(require_patient),
    db=Depends(get_db),
):
    entry = await db.waitlist.find_one(
        {"_id": ObjectId(waitlist_id), "patient_id": current_user["_id"]}
    )
    if not entry:
        raise HTTPException(404, "Waitlist entry not found")

    await db.waitlist.delete_one({"_id": ObjectId(waitlist_id)})
    return {"message": "Removed from waitlist"}
