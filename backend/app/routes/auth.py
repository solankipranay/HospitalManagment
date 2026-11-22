from datetime import datetime, timedelta, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.config import settings
from app.database import get_db
from app.models.user import Token, UserCreate, UserLogin
from app.services.auth_service import (
    create_access_token,
    get_password_hash,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db=Depends(get_db)):
    # Duplicate email check
    if await db.users.find_one({"email": user_data.email}):
        raise HTTPException(status_code=400, detail="Email already registered")

    user_doc = {
        "email": user_data.email,
        "password_hash": get_password_hash(user_data.password),
        "name": user_data.name,
        "role": user_data.role,
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.users.insert_one(user_doc)
    user_id = result.inserted_id

    # Create role-specific profile
    if user_data.role == "doctor":
        await db.doctors.insert_one(
            {
                "user_id": user_id,
                "specialty": "",
                "consultation_duration": 15,
                "availability": [],
            }
        )
    else:
        await db.patients.insert_one(
            {
                "user_id": user_id,
                "age": None,
                "medical_history": "",
                "priority_score": 0,
            }
        )

    return {"message": "Registration successful", "user_id": str(user_id)}


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db=Depends(get_db)):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    token = create_access_token(
        {"sub": str(user["_id"]), "role": user["role"]},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return Token(
        access_token=token,
        token_type="bearer",
        role=user["role"],
        user_id=str(user["_id"]),
        name=user["name"],
    )
