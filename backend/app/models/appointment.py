from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum


class AppointmentStatus(str, Enum):
    SCHEDULED = "Scheduled"
    IN_PROGRESS = "In_Progress"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"


class AppointmentCreate(BaseModel):
    doctor_id: str
    start_time: datetime  # ISO 8601 UTC datetime from frontend


class AppointmentStatusUpdate(BaseModel):
    status: AppointmentStatus


class AppointmentNotesUpdate(BaseModel):
    notes: Optional[str] = None
    diagnosis: Optional[str] = None


class AppointmentResponse(BaseModel):
    id: str
    doctor_id: str
    patient_id: str
    doctor_name: str
    patient_name: str
    start_time: str
    end_time: str
    status: AppointmentStatus
    notes: Optional[str] = None
    diagnosis: Optional[str] = None
    created_at: str
    auto_assigned: bool = False
