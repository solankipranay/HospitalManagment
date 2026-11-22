from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from enum import Enum


class UrgencyLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


# Maps urgency to numeric priority (higher = more urgent)
URGENCY_PRIORITY_MAP = {
    "low": 1,
    "medium": 2,
    "high": 3,
    "critical": 4,
}


class WaitlistCreate(BaseModel):
    doctor_id: str
    preferred_date: date
    urgency_level: UrgencyLevel = UrgencyLevel.MEDIUM


class WaitlistResponse(BaseModel):
    id: str
    doctor_id: str
    patient_id: str
    doctor_name: str
    patient_name: str
    preferred_date: str
    urgency_level: UrgencyLevel
    priority: int
    status: str
    created_at: str
