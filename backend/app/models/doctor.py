from pydantic import BaseModel, Field
from typing import List, Optional


class BreakPeriod(BaseModel):
    start: str  # "HH:MM" e.g. "13:00"
    end: str    # "HH:MM" e.g. "14:00"


class DayAvailability(BaseModel):
    day: str                        # "monday" | "tuesday" | ...
    start_time: str                 # "09:00"
    end_time: str                   # "17:00"
    breaks: List[BreakPeriod] = []
    is_available: bool = True


class DoctorUpdate(BaseModel):
    specialty: Optional[str] = None
    consultation_duration: Optional[int] = Field(None, ge=5, le=180)
    availability: Optional[List[DayAvailability]] = None


class DoctorResponse(BaseModel):
    id: str
    user_id: str
    name: str
    email: str
    specialty: str
    consultation_duration: int
    availability: List[DayAvailability]
