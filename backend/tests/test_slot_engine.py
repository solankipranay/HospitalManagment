"""
Unit tests for the slot generation engine.
Run: pytest tests/test_slot_engine.py -v
"""

from datetime import date, datetime, timedelta

import pytest

from app.services.slot_engine import generate_slots

# ── Helpers ────────────────────────────────────────────────────
MONDAY = date(2027, 1, 4)   # confirmed Monday

DOCTOR_BASE = {
    "consultation_duration": 15,
    "availability": [
        {
            "day": "monday",
            "start_time": "09:00",
            "end_time": "17:00",
            "breaks": [{"start": "13:00", "end": "14:00"}],
            "is_available": True,
        }
    ],
}


def _appt(hour: int, minute: int = 0, duration: int = 15) -> dict:
    """Build a fake scheduled appointment UTC doc."""
    # IST 09:xx = UTC 03:xx
    ist_offset = timedelta(hours=5, minutes=30)
    start = datetime(2027, 1, 4, hour, minute) - ist_offset
    return {
        "start_time": start,
        "end_time": start + timedelta(minutes=duration),
        "status": "Scheduled",
    }


# ── Tests ──────────────────────────────────────────────────────
class TestSlotEngine:

    def test_no_appointments_returns_slots(self):
        """With no existing bookings, slots fill the working hours minus breaks."""
        slots = generate_slots(DOCTOR_BASE, MONDAY, [])
        # Working 09:00–17:00 minus 13:00–14:00 break = 7 h = 420 min / 15 = 28 slots
        assert len(slots) == 28

    def test_booked_slot_is_excluded(self):
        """A booked slot must not appear in the result."""
        existing = [_appt(9, 0)]   # 09:00 IST booked
        slots = generate_slots(DOCTOR_BASE, MONDAY, existing)
        # 28 - 1 = 27
        assert len(slots) == 27
        # 09:00 IST = 03:30 UTC
        booked_utc = datetime(2027, 1, 4, 3, 30)
        assert booked_utc not in slots

    def test_break_period_excluded(self):
        """Slots during break time must not be generated."""
        slots = generate_slots(DOCTOR_BASE, MONDAY, [])
        ist_offset = timedelta(hours=5, minutes=30)
        # 13:00 IST = 07:30 UTC
        break_start = datetime(2027, 1, 4, 7, 30)
        assert break_start not in slots

    def test_unavailable_day_returns_empty(self):
        """Doctor not working on this day → empty list."""
        sunday = date(2027, 1, 3)   # Sunday
        assert generate_slots(DOCTOR_BASE, sunday, []) == []

    def test_cancelled_appointment_does_not_block(self):
        """Cancelled appointments should NOT block slots."""
        existing = [
            {
                "start_time": datetime(2027, 1, 4, 3, 30),
                "end_time": datetime(2027, 1, 4, 3, 45),
                "status": "Cancelled",
            }
        ]
        slots = generate_slots(DOCTOR_BASE, MONDAY, existing)
        assert len(slots) == 28  # same as no bookings

    def test_45min_duration(self):
        """Doctor with 45-min consultations generates fewer slots."""
        doctor = {**DOCTOR_BASE, "consultation_duration": 45}
        slots = generate_slots(doctor, MONDAY, [])
        # 09:00–13:00 = 4h = 240min / 45 ≈ 5 slots | 14:00–17:00 = 3h = 180min / 45 = 4 slots
        assert len(slots) == 9
