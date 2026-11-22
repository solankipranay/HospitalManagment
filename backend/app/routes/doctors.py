from datetime import date, datetime, timedelta

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query

from app.database import get_db
from app.middleware.auth_middleware import require_doctor
from app.models.doctor import DoctorUpdate
from app.services.slot_engine import generate_slots

router = APIRouter(prefix="/doctors", tags=["Doctors"])


def _fmt_doctor(doc: dict, user: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "user_id": str(doc["user_id"]),
        "name": user["name"],
        "email": user["email"],
        "specialty": doc.get("specialty", ""),
        "consultation_duration": doc.get("consultation_duration", 15),
        "availability": doc.get("availability", []),
    }


@router.get("")
async def list_doctors(specialty: str = Query(None), db=Depends(get_db)):
    """List all doctors. Optionally filter by specialty (case-insensitive)."""
    pipeline = [
        {
            "$lookup": {
                "from": "users",
                "localField": "user_id",
                "foreignField": "_id",
                "as": "user",
            }
        },
        {"$unwind": "$user"},
    ]
    if specialty:
        pipeline.append(
            {"$match": {"specialty": {"$regex": specialty, "$options": "i"}}}
        )

    result = []
    async for doc in db.doctors.aggregate(pipeline):
        result.append({
            "id": str(doc["_id"]),
            "user_id": str(doc["user_id"]),
            "name": doc["user"]["name"],
            "email": doc["user"]["email"],
            "specialty": doc.get("specialty", ""),
            "consultation_duration": doc.get("consultation_duration", 15),
            "availability": doc.get("availability", []),
        })
    return result


@router.get("/me")
async def get_my_profile(current_user=Depends(require_doctor), db=Depends(get_db)):
    doctor = await db.doctors.find_one({"user_id": current_user["_id"]})
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    return _fmt_doctor(doctor, current_user)


@router.put("/me/profile")
async def update_my_profile(
    profile: DoctorUpdate,
    current_user=Depends(require_doctor),
    db=Depends(get_db),
):
    update: dict = {}
    if profile.specialty is not None:
        update["specialty"] = profile.specialty
    if profile.consultation_duration is not None:
        update["consultation_duration"] = profile.consultation_duration
    if profile.availability is not None:
        update["availability"] = [a.model_dump() for a in profile.availability]

    if not update:
        return {"message": "Nothing to update"}

    await db.doctors.update_one({"user_id": current_user["_id"]}, {"$set": update})
    return {"message": "Profile updated successfully"}


@router.get("/{doctor_id}")
async def get_doctor(doctor_id: str, db=Depends(get_db)):
    try:
        oid = ObjectId(doctor_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid doctor ID")

    doctor = await db.doctors.find_one({"_id": oid})
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    user = await db.users.find_one({"_id": doctor["user_id"]})
    return _fmt_doctor(doctor, user)


@router.get("/{doctor_id}/slots")
async def get_available_slots(
    doctor_id: str,
    date: date = Query(..., description="Date in YYYY-MM-DD format"),
    db=Depends(get_db),
):
    """
    Dynamically generate available booking slots for a doctor on a given date.
    Returns UTC ISO-8601 datetimes; the frontend converts to local time.
    """
    try:
        oid = ObjectId(doctor_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid doctor ID")

    doctor = await db.doctors.find_one({"_id": oid})
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    # Fetch existing active appointments for this date (UTC window)
    start_of_day = datetime.combine(date, datetime.min.time())
    end_of_day = start_of_day + timedelta(days=1)

    existing = []
    async for appt in db.appointments.find(
        {
            "doctor_id": oid,
            "start_time": {"$gte": start_of_day, "$lt": end_of_day},
            "status": {"$in": ["Scheduled", "In_Progress"]},
        }
    ):
        existing.append(appt)

    slots = generate_slots(doctor, date, existing)
    return {
        "doctor_id": doctor_id,
        "date": str(date),
        "consultation_duration": doctor.get("consultation_duration", 15),
        "slots": [s.isoformat() + "Z" for s in slots],
    }
