from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import close_mongo_connection, connect_to_mongo
from app.routes import auth, doctors, patients, appointments, waitlist, websocket


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()


app = FastAPI(
    title="CarePulse - Hospital Scheduling System",
    description=(
        "CrestCode Internship Assignment\n\n"
        "Features: JWT Auth · Dynamic Slot Engine · "
        "Double-booking Prevention · Priority Waitlist · WebSockets"
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS (allow all origins in dev; restrict in prod) ──────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(doctors.router)
app.include_router(patients.router)
app.include_router(appointments.router)
app.include_router(waitlist.router)
app.include_router(websocket.router)


@app.get("/", tags=["Health"])
async def root():
    return {
        "app": "Hospital Scheduling System",
        "docs": "/docs",
        "redoc": "/redoc",
        "status": "running",
    }


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok"}
