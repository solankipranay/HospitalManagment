# 🏥 CarePulse — Hospital Scheduling & Management System

> **CrestCode Internship Assignment** — 48-hour take-home project  
> **Role:** Software Engineering Intern | **Stack:** FastAPI + MongoDB + React Native (Expo) PWA

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB running locally (`mongod`)

### 1. Clone & Setup Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate    # Mac/Linux
pip install -r requirements.txt
```

### 2. Configure Environment
```bash
# backend/.env
MONGODB_URL=mongodb://localhost:27017
DB_NAME=hospital_db
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

### 3. Seed the Database
```bash
cd backend
python seed.py
```

### 4. Run Backend
```bash
uvicorn app.main:app --reload --port 8000
# API Docs: http://localhost:8000/docs
```

### 5. Setup & Run Frontend
```bash
cd frontend
npm install
npx expo start --web          # PWA dev mode
# Or build for production:
npx expo export -p web        # Outputs to dist/
```

---

## 🔑 Demo Accounts

| Role | Name | Email | Password |
|---|---|---|---|
| 👨‍⚕️ Doctor | Dr. John Smith | dr.smith@hospital.com | password123 |
| 👨‍⚕️ Doctor | Dr. Priya Patel | dr.patel@hospital.com | password123 |
| 🧑 Patient | Alice Johnson | alice@patient.com | password123 |
| 🧑 Patient | Bob Williams | bob@patient.com | password123 |
| 🧑 Patient | Carol Davis | carol@patient.com | password123 |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   React Native (Expo)               │
│          PWA (web) + iOS + Android                  │
│  ┌────────────┐  ┌──────────┐  ┌────────────────┐  │
│  │ Auth Screen│  │ Patient  │  │ Doctor         │  │
│  │ Login/Reg  │  │ Browse   │  │ Dashboard      │  │
│  │            │  │ Book     │  │ Status Update  │  │
│  │            │  │ Cancel   │  │ Notes/Diagnosis│  │
│  └────────────┘  └──────────┘  └────────────────┘  │
│       Zustand (state) + Axios + WebSocket           │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP/WS
┌──────────────────────▼──────────────────────────────┐
│                  FastAPI Backend                    │
│  ┌──────────┐ ┌───────────┐ ┌───────────────────┐  │
│  │ /auth    │ │ /doctors  │ │ /appointments      │  │
│  │ JWT      │ │ slots API │ │ book/cancel/status │  │
│  └──────────┘ └───────────┘ └───────────────────┘  │
│  ┌──────────────────────────────────────────────┐   │
│  │          Slot Generation Engine              │   │
│  │  Availability → Breaks → Booked → Free Slots│   │
│  └──────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────┐   │
│  │          Priority Waitlist Service           │   │
│  │  Cancel → Check Waitlist → Auto-Assign       │   │
│  └──────────────────────────────────────────────┘   │
│  ┌──────────┐                                       │
│  │ WebSocket│ → Live slot updates to patients       │
│  └──────────┘                                       │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│                    MongoDB                          │
│  users | doctors | patients | appointments | waitlist│
└─────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Choice: MongoDB

### ✅ Why MongoDB (over PostgreSQL / MySQL)

| Reason | Detail |
|---|---|
| **Flexible Schema** | Doctor availability is a complex nested document (days → time ranges → breaks). MongoDB stores this naturally as an embedded array — no 5-table JOIN needed. |
| **Async Driver (Motor)** | Motor is MongoDB's async Python driver, designed for asyncio. It integrates seamlessly with FastAPI's async architecture — no blocking I/O. |
| **Partial Unique Index** | MongoDB supports partial unique indexes: `{ doctor_id, start_time }` enforced only where `status ∈ {Scheduled, In_Progress}`. This provides atomic double-booking prevention at the database level. |
| **Fast Document Reads** | Fetching a doctor's full profile (including their entire availability config) = one document fetch. No JOIN queries. |
| **Schema Flexibility** | As requirements evolve (add more metadata), no migration files needed — just add fields to documents. |

### ❌ Why Not PostgreSQL
- Would require 5+ normalized tables (users, doctors, patients, appointments, availability, breaks)
- Slot generation would need complex JOIN queries
- ORM (SQLAlchemy) adds boilerplate compared to Motor's native async
- Schema migrations via Alembic add complexity for a 48-hour project

### ❌ Why Not MySQL
- Same relational constraints as PostgreSQL
- Weaker JSON support than MongoDB for embedding nested configs
- No native async Python driver as ergonomic as Motor

---

## ⚙️ Tech Stack Decisions

### Backend: Python + FastAPI
**Why:** Assignment requirement. FastAPI provides automatic OpenAPI/Swagger docs (`/docs`), Pydantic data validation, and native async support — ideal for a scheduling system.

**Why not Flask:** No built-in async, no auto-generated API docs, more manual work.  
**Why not Django:** Heavy framework, ORM-centric — overkill for this API.

### Frontend: React Native (Expo) + NativeWind
**Why Expo:** Assignment requirement. Write once, run on iOS/Android/Web. `expo export -p web` builds a PWA from the same codebase.  
**Why NativeWind:** Tailwind CSS utility classes for React Native. Faster styling, consistent design system, same mental model as web Tailwind.  
**Why not bare React Native:** Expo managed workflow is faster to set up, handles native configs automatically.

### State Management: Zustand
**Why:** Ultra-lightweight (~1KB), zero boilerplate, simple `useStore` hook. Perfect for auth state + user data.  
**Why not Redux:** Redux requires actions/reducers/dispatchers — massive boilerplate for a project this size.  
**Why not React Context:** Context re-renders the whole tree on state change — performance issues with frequent updates.

### HTTP Client: Axios
**Why:** Interceptors automatically attach JWT tokens to every request and normalize error responses. Much cleaner than manually adding headers with `fetch`.  
**Why not fetch:** No interceptor support, verbose error handling, no timeout config.

### Auth: JWT (python-jose)
**Why:** Stateless tokens — no server-side session storage. Works identically for the web PWA and mobile apps.  
**Why not sessions:** Sessions require server-side storage (Redis/DB), adding infrastructure complexity.

### Real-time: WebSockets (FastAPI built-in)
**Why:** FastAPI has native WebSocket support. When a slot is booked/cancelled, the server broadcasts to all patients viewing that doctor's calendar — they see slots disappear/appear in real-time.

---

## 🔐 Double-Booking Prevention

### Strategy: MongoDB Partial Unique Index + DuplicateKeyError catch

```python
# Created in database.py on startup:
await db.appointments.create_index(
    [("doctor_id", ASCENDING), ("start_time", ASCENDING)],
    unique=True,
    partialFilterExpression={"status": {"$in": ["Scheduled", "In_Progress"]}},
    name="unique_active_appointment"
)
```

**How it works:**
1. The index enforces uniqueness only for ACTIVE appointments (Scheduled/In_Progress)
2. Two patients cannot book the same `(doctor_id, start_time)` simultaneously
3. If two concurrent requests pass the pre-check, only one `insert_one()` succeeds
4. The other gets `DuplicateKeyError` → caught → returns HTTP 409 Conflict
5. This is **atomic at the database level** — no race condition possible

```python
try:
    result = await db.appointments.insert_one(new_appt)
except DuplicateKeyError:
    raise HTTPException(409, "Slot was just booked by someone else. Please refresh.")
```

**Why this over transactions:** MongoDB transactions require a replica set. The partial unique index approach works on standalone MongoDB instances (development) while providing the same atomicity guarantee.

---

## ⏰ Cancellation + Auto-Reallocation Flow

```
Patient: DELETE /appointments/{id}
    │
    ▼
Check: status == "Scheduled"? → else reject
    │
    ▼
Check: start_time - now > 2 hours? → else reject (2-hour rule)
    │
    ▼
Update: status = "Cancelled"
    │
    ▼
Query waitlist WHERE doctor_id = X AND preferred_date = date AND status = "waiting"
ORDER BY priority DESC, created_at ASC   ← Critical first, then FIFO
    │
    ├── Waitlist patient found?
    │       ▼
    │   Insert new appointment for that patient (auto_assigned = true)
    │   Update waitlist entry status = "assigned"
    │   Return: "slot reallocated"
    │
    └── No waitlist?
            ▼
        Slot freed — return: "slot available"

WebSocket: broadcast to all patients viewing that doctor's calendar
```

---

## 📡 API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | None | Register as doctor/patient |
| POST | `/auth/login` | None | Login → JWT token |
| GET | `/doctors` | None | List doctors (filter by specialty) |
| GET | `/doctors/{id}` | None | Doctor profile |
| PUT | `/doctors/me/profile` | Doctor | Update specialty, duration, availability |
| GET | `/doctors/{id}/slots?date=` | None | Get available slots |
| GET | `/patients/me` | Patient | My patient profile |
| PUT | `/patients/me` | Patient | Update profile |
| POST | `/appointments` | Patient | Book appointment |
| GET | `/appointments/me` | Any | My appointments |
| DELETE | `/appointments/{id}` | Patient | Cancel (2hr rule) |
| PUT | `/appointments/{id}/status` | Doctor | Transition status |
| PUT | `/appointments/{id}/notes` | Doctor | Add notes/diagnosis |
| POST | `/waitlist` | Patient | Join waitlist |
| GET | `/waitlist/me` | Any | My waitlist entries |
| DELETE | `/waitlist/{id}` | Patient | Leave waitlist |
| WS | `/ws/slots/{doctorId}/{date}` | None | Live slot updates |

---

## 🧪 Running Tests

```bash
cd backend
venv\Scripts\activate
pytest tests/ -v
```

Tests cover:
- Slot generation algorithm (28 slots in 8h working day, breaks excluded)
- 2-hour cancellation rule logic
- Past slots never returned
- Cancelled appointments don't block slots
- 45-min consultation duration generates fewer slots

---

## 📱 PWA Installation

1. Build the web version: `npx expo export -p web`
2. Serve the `dist/` folder (e.g., `npx serve dist`)
3. Open in Chrome → Address bar → Install icon
4. App installs to desktop/home screen with offline support via service worker

---

## 🔮 Assumptions Made

1. **Timezone:** Doctor availability hours are interpreted as IST (UTC+5:30). All times stored in UTC in MongoDB. Frontend displays in user's local time.
2. **Priority Waitlist:** Urgency levels (critical > high > medium > low) determine reallocation order. Within same urgency, FIFO (oldest request first).
3. **Slot Generation:** Slots are generated fresh from doctor availability on every request — not pre-generated and stored. This ensures real-time accuracy.
4. **Consultation Duration:** Doctors have one global consultation duration. Different durations per appointment type are outside scope.
5. **Notes:** Consultation notes can only be added after status = Completed. This prevents premature diagnosis entry.
6. **Fake Data Only:** All demo data is seeded via `seed.py`. No real patient data is used.

---

## 📂 Project Structure

```
HospitalManagment/
├── backend/
│   ├── app/
│   │   ├── main.py           ← FastAPI app + lifespan
│   │   ├── config.py         ← Settings (pydantic-settings)
│   │   ├── database.py       ← MongoDB Motor connection + indexes
│   │   ├── models/           ← Pydantic request/response models
│   │   ├── routes/           ← API route handlers
│   │   ├── services/         ← Business logic
│   │   │   ├── slot_engine.py     ← Dynamic slot generation
│   │   │   ├── auth_service.py    ← JWT + password hashing
│   │   │   └── waitlist_service.py ← Auto-reallocation
│   │   └── middleware/       ← JWT auth guards
│   ├── tests/                ← pytest test suite
│   ├── seed.py               ← Demo data seeder
│   └── requirements.txt
└── frontend/
    ├── app/
    │   ├── (auth)/           ← Login + Register screens
    │   ├── (patient)/        ← Patient flow (home/doctors/book/appointments)
    │   └── (doctor)/         ← Doctor flow (dashboard/availability/appointment detail)
    ├── components/           ← Reusable UI components
    ├── services/             ← API layer (axios)
    ├── store/                ← Zustand auth state
    ├── hooks/                ← WebSocket hook
    └── public/               ← PWA manifest + service worker
```

---

*Built with ❤️ for CrestCode Internship | Fake data only*
