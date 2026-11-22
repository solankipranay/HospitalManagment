"""
Database Seed Script
======================
Creates demo accounts:
  Doctors  → 2 (different specialties & consultation durations)
  Patients → 3

Also inserts:
  - Past completed appointments (last week)
  - Future scheduled appointments (next available working day)

Usage:
  python seed.py
"""

import asyncio
from datetime import date, datetime, timedelta, timezone

from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext

from app.config import settings

MONGODB_URL = settings.MONGODB_URL
DB_NAME = settings.DB_NAME

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _hash(pw: str) -> str:
    return pwd_context.hash(pw)


def _next_weekday(d: date, weekday: int) -> date:
    """Return the next occurrence of weekday (0=Mon…6=Sun) on or after d."""
    days_ahead = weekday - d.weekday()
    if days_ahead < 0:
        days_ahead += 7
    return d + timedelta(days=days_ahead)


async def seed():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DB_NAME]

    # Wipe existing data
    for col in ["users", "doctors", "patients", "appointments", "waitlist"]:
        await db[col].drop()

    # Recreate indexes
    await db.users.create_index("email", unique=True)
    await db.appointments.create_index(
        [("doctor_id", 1), ("start_time", 1)],
        unique=True,
        partialFilterExpression={"status": {"$in": ["Scheduled", "In_Progress"]}},
        name="unique_active_appointment",
    )

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    today = date.today()

    # ═══════════════════════════ DOCTORS ═══════════════════════
    dr_smith_user = {
        "email": "dr.smith@hospital.com",
        "password_hash": _hash("password123"),
        "name": "Dr. John Smith",
        "role": "doctor",
        "created_at": now,
    }
    dr_patel_user = {
        "email": "dr.patel@hospital.com",
        "password_hash": _hash("password123"),
        "name": "Dr. Priya Patel",
        "role": "doctor",
        "created_at": now,
    }

    smith_id = (await db.users.insert_one(dr_smith_user)).inserted_id
    patel_id = (await db.users.insert_one(dr_patel_user)).inserted_id

    smith_doc_id = (
        await db.doctors.insert_one(
            {
                "user_id": smith_id,
                "specialty": "General Medicine",
                "consultation_duration": 15,  # 15-min checkups
                "availability": [
                    {
                        "day": "monday",
                        "start_time": "09:00",
                        "end_time": "17:00",
                        "breaks": [{"start": "13:00", "end": "14:00"}],
                        "is_available": True,
                    },
                    {
                        "day": "tuesday",
                        "start_time": "09:00",
                        "end_time": "17:00",
                        "breaks": [{"start": "13:00", "end": "14:00"}],
                        "is_available": True,
                    },
                    {
                        "day": "wednesday",
                        "start_time": "09:00",
                        "end_time": "17:00",
                        "breaks": [{"start": "13:00", "end": "14:00"}],
                        "is_available": True,
                    },
                    {
                        "day": "thursday",
                        "start_time": "09:00",
                        "end_time": "17:00",
                        "breaks": [{"start": "13:00", "end": "14:00"}],
                        "is_available": True,
                    },
                    {
                        "day": "friday",
                        "start_time": "09:00",
                        "end_time": "14:00",
                        "breaks": [],
                        "is_available": True,
                    },
                ],
            }
        )
    ).inserted_id

    patel_doc_id = (
        await db.doctors.insert_one(
            {
                "user_id": patel_id,
                "specialty": "Cardiology",
                "consultation_duration": 45,  # 45-min deep diagnostics
                "availability": [
                    {
                        "day": "monday",
                        "start_time": "10:00",
                        "end_time": "18:00",
                        "breaks": [
                            {"start": "13:00", "end": "14:00"},
                            {"start": "16:00", "end": "16:15"},
                        ],
                        "is_available": True,
                    },
                    {
                        "day": "wednesday",
                        "start_time": "10:00",
                        "end_time": "18:00",
                        "breaks": [{"start": "13:00", "end": "14:00"}],
                        "is_available": True,
                    },
                    {
                        "day": "friday",
                        "start_time": "10:00",
                        "end_time": "16:00",
                        "breaks": [{"start": "12:00", "end": "13:00"}],
                        "is_available": True,
                    },
                ],
            }
        )
    ).inserted_id

    # ═══════════════════════════ PATIENTS ══════════════════════
    patients_data = [
        ("Alice Johnson", "alice@patient.com"),
        ("Bob Williams", "bob@patient.com"),
        ("Carol Davis", "carol@patient.com"),
    ]
    patient_user_ids = []
    patient_scores = [0, 2, 1]
    patient_histories = [
        "No prior conditions",
        "Hypertension managed with medication",
        "Asthma",
    ]

    for i, (name, email) in enumerate(patients_data):
        uid = (
            await db.users.insert_one(
                {
                    "email": email,
                    "password_hash": _hash("password123"),
                    "name": name,
                    "role": "patient",
                    "created_at": now,
                }
            )
        ).inserted_id
        patient_user_ids.append(uid)
        await db.patients.insert_one(
            {
                "user_id": uid,
                "age": [35, 52, 28][i],
                "medical_history": patient_histories[i],
                "priority_score": patient_scores[i],
            }
        )

    # ═══════════════════════════ APPOINTMENTS ══════════════════
    # Past — last Tuesday (or any past Monday-Friday)
    past_monday = _next_weekday(today - timedelta(days=14), 0)  # Monday 2 weeks ago
    past_base = datetime(past_monday.year, past_monday.month, past_monday.day, 3, 30)  # 09:00 IST = 03:30 UTC

    past_appointments = [
        {
            "doctor_id": smith_doc_id,
            "patient_id": patient_user_ids[0],
            "start_time": past_base,
            "end_time": past_base + timedelta(minutes=15),
            "status": "Completed",
            "notes": "Patient reported mild fever and sore throat.",
            "diagnosis": "Viral pharyngitis. Prescribed rest, fluids and paracetamol.",
            "auto_assigned": False,
            "created_at": past_base - timedelta(days=2),
        },
        {
            "doctor_id": patel_doc_id,
            "patient_id": patient_user_ids[1],
            "start_time": past_base + timedelta(hours=1),
            "end_time": past_base + timedelta(hours=1, minutes=45),
            "status": "Completed",
            "notes": "Patient reports chest discomfort. ECG normal.",
            "diagnosis": "Mild angina. Medication dosage adjusted.",
            "auto_assigned": False,
            "created_at": past_base - timedelta(days=3),
        },
        {
            "doctor_id": smith_doc_id,
            "patient_id": patient_user_ids[2],
            "start_time": past_base + timedelta(hours=2),
            "end_time": past_base + timedelta(hours=2, minutes=15),
            "status": "Completed",
            "notes": "Asthma follow-up. Peak flow normal.",
            "diagnosis": "Stable asthma. Continue current inhaler regimen.",
            "auto_assigned": False,
            "created_at": past_base - timedelta(days=1),
        },
    ]
    await db.appointments.insert_many(past_appointments)

    # Future — next available Monday for both doctors
    next_monday = _next_weekday(today + timedelta(days=1), 0)
    future_base = datetime(next_monday.year, next_monday.month, next_monday.day, 3, 30)  # 09:00 IST

    next_wednesday = _next_weekday(today + timedelta(days=1), 2)
    future_base2 = datetime(next_wednesday.year, next_wednesday.month, next_wednesday.day, 4, 30)  # 10:00 IST

    future_appointments = [
        {
            "doctor_id": smith_doc_id,
            "patient_id": patient_user_ids[1],
            "start_time": future_base + timedelta(minutes=60),    # 10:00 IST
            "end_time": future_base + timedelta(minutes=75),      # 10:15 IST
            "status": "Scheduled",
            "notes": None,
            "diagnosis": None,
            "auto_assigned": False,
            "created_at": now,
        },
        {
            "doctor_id": smith_doc_id,
            "patient_id": patient_user_ids[2],
            "start_time": future_base + timedelta(minutes=120),   # 11:00 IST
            "end_time": future_base + timedelta(minutes=135),
            "status": "Scheduled",
            "notes": None,
            "diagnosis": None,
            "auto_assigned": False,
            "created_at": now,
        },
        {
            "doctor_id": patel_doc_id,
            "patient_id": patient_user_ids[0],
            "start_time": future_base2,                            # 10:00 IST Wednesday
            "end_time": future_base2 + timedelta(minutes=45),
            "status": "Scheduled",
            "notes": None,
            "diagnosis": None,
            "auto_assigned": False,
            "created_at": now,
        },
    ]
    await db.appointments.insert_many(future_appointments)

    client.close()

    print("\n✅ Database seeded successfully!\n")
    print("=" * 55)
    print("👨‍⚕️  DOCTORS")
    print("  Dr. John Smith  | dr.smith@hospital.com | General Medicine (15 min)")
    print("  Dr. Priya Patel | dr.patel@hospital.com | Cardiology (45 min)")
    print("\n🧑‍💼  PATIENTS")
    print("  Alice Johnson   | alice@patient.com")
    print("  Bob Williams    | bob@patient.com")
    print("  Carol Davis     | carol@patient.com")
    print("\n🔑  All passwords: password123")
    print("=" * 55)


if __name__ == "__main__":
    asyncio.run(seed())
