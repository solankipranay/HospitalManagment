from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.database import get_db
from app.middleware.auth_middleware import require_patient

router = APIRouter(prefix="/patients", tags=["Patients"])


class PatientUpdate(BaseModel):
    age: Optional[int] = None
    medical_history: Optional[str] = None


@router.get("/me")
async def get_my_profile(current_user=Depends(require_patient), db=Depends(get_db)):
    patient = await db.patients.find_one({"user_id": current_user["_id"]})
    return {
        "user_id": str(current_user["_id"]),
        "name": current_user["name"],
        "email": current_user["email"],
        "age": patient.get("age") if patient else None,
        "medical_history": patient.get("medical_history", "") if patient else "",
        "priority_score": patient.get("priority_score", 0) if patient else 0,
    }


@router.put("/me")
async def update_profile(
    profile: PatientUpdate,
    current_user=Depends(require_patient),
    db=Depends(get_db),
):
    update = {k: v for k, v in profile.model_dump().items() if v is not None}
    if update:
        await db.patients.update_one(
            {"user_id": current_user["_id"]}, {"$set": update}
        )
    return {"message": "Profile updated successfully"}
