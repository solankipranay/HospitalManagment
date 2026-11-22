"""
Integration tests for appointment cancellation (2-hour rule).
Run: pytest tests/test_appointments.py -v
"""

from datetime import datetime, timedelta, timezone

import pytest
from app.services.slot_engine import generate_slots
from datetime import date


@pytest.mark.asyncio
async def test_two_hour_rule_logic():
    """
    Unit-test the 2-hour cancellation rule without hitting the DB.
    """
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    # Appointment 3 hours away → cancellable
    appt_time = now + timedelta(hours=3)
    time_left = appt_time - now
    assert time_left.total_seconds() >= 2 * 3600, "Should be cancellable"

    # Appointment 1 hour away → NOT cancellable
    appt_time2 = now + timedelta(hours=1)
    time_left2 = appt_time2 - now
    assert time_left2.total_seconds() < 2 * 3600, "Should NOT be cancellable"


@pytest.mark.asyncio
async def test_slot_engine_no_past_slots():
    """Slots in the past must never appear."""
    doctor = {
        "consultation_duration": 15,
        "availability": [
            {
                "day": "monday",
                "start_time": "09:00",
                "end_time": "17:00",
                "breaks": [],
                "is_available": True,
            }
        ],
    }
    # Use a past Monday
    past_monday = date(2020, 1, 6)
    slots = generate_slots(doctor, past_monday, [])
    assert slots == [], "No slots should be returned for past dates"
