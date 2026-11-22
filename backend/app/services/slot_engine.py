"""
Dynamic Slot Generation Engine
================================
Algorithm:
  1. Find doctor's availability for the requested day of week
  2. Build a list of blocked time ranges:
       a. Doctor's break periods
       b. Existing active appointments (Scheduled / In_Progress)
  3. Merge + sort blocked ranges
  4. Walk through the working hours in consultation_duration steps,
     skipping any blocked range
  5. Return only future slots (past slots are hidden)

Timezone note:
  - Doctor availability hours are in IST (UTC+05:30)
  - Appointments are stored in UTC (naive)
  - Slots are returned in UTC (naive); frontend converts to local display
"""

from datetime import date, datetime, time, timedelta, timezone
from typing import List

IST_OFFSET = timedelta(hours=5, minutes=30)


def _time_to_minutes(t: str) -> int:
    """Convert 'HH:MM' string to minutes-from-midnight."""
    h, m = map(int, t.split(":"))
    return h * 60 + m


def _utc_to_ist_minutes(dt: datetime) -> int:
    """Convert a UTC datetime to IST minutes-from-midnight."""
    if dt.tzinfo is not None:
        dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
    ist_dt = dt + IST_OFFSET
    return ist_dt.hour * 60 + ist_dt.minute


def generate_slots(
    doctor: dict,
    target_date: date,
    existing_appointments: List[dict],
) -> List[datetime]:
    """
    Return a list of available UTC datetimes for a doctor on target_date.

    Args:
        doctor: doctor document from MongoDB
        target_date: the calendar date requested (IST perspective)
        existing_appointments: list of appointment docs already in DB for that date
    """
    day_name = target_date.strftime("%A").lower()  # e.g. "monday"

    # Step 1 — find this day's availability block
    availability = None
    for avail in doctor.get("availability", []):
        if avail["day"].lower() == day_name and avail.get("is_available", True):
            availability = avail
            break

    if availability is None:
        return []  # doctor not working this day

    duration: int = doctor.get("consultation_duration", 15)  # minutes
    work_start: int = _time_to_minutes(availability["start_time"])
    work_end: int = _time_to_minutes(availability["end_time"])

    # Step 2 — collect all blocked ranges (in IST minutes-from-midnight)
    blocked: List[tuple] = []

    # 2a. Break periods
    for brk in availability.get("breaks", []):
        blocked.append((_time_to_minutes(brk["start"]), _time_to_minutes(brk["end"])))

    # 2b. Existing active appointments
    for appt in existing_appointments:
        if appt.get("status") in ("Scheduled", "In_Progress"):
            s = _utc_to_ist_minutes(appt["start_time"])
            e = _utc_to_ist_minutes(appt["end_time"])
            blocked.append((s, e))

    # Step 3 — sort & merge overlapping blocked ranges
    blocked.sort(key=lambda x: x[0])
    merged: List[list] = []
    for s, e in blocked:
        if merged and s < merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], e)
        else:
            merged.append([s, e])

    # Step 4 — generate slots (offset-naive comparison in IST)
    now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
    now_ist = now_utc + IST_OFFSET
    available: List[datetime] = []
    current = work_start

    while current + duration <= work_end:
        slot_end = current + duration

        # Check against merged blocks
        blocked_by = None
        for bs, be in merged:
            if current < be and slot_end > bs:
                blocked_by = be  # jump past this block
                break

        if blocked_by is not None:
            current = blocked_by
            continue

        # Build IST datetime for this slot (naive)
        slot_ist = datetime.combine(
            target_date,
            time(current // 60, current % 60),
        )

        # Only future slots
        if slot_ist > now_ist:
            # Convert to UTC (naive) for storage / API response
            slot_utc = slot_ist - IST_OFFSET
            available.append(slot_utc)

        current += duration

    return available
