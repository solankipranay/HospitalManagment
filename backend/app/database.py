from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING, DESCENDING
from app.config import settings

client: AsyncIOMotorClient = None
db = None


async def connect_to_mongo():
    global client, db
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DB_NAME]

    # --- Indexes ---
    # Users: unique email
    await db.users.create_index("email", unique=True)

    # Appointments: doctor + start_time must be unique for active appointments
    # Partial unique index — only enforced when status is Scheduled or In_Progress
    # This is MongoDB's atomic double-booking prevention at the DB level
    await db.appointments.create_index(
        [("doctor_id", ASCENDING), ("start_time", ASCENDING)],
        unique=True,
        partialFilterExpression={"status": {"$in": ["Scheduled", "In_Progress"]}},
        name="unique_active_appointment",
    )
    await db.appointments.create_index([("patient_id", ASCENDING)])
    await db.appointments.create_index([("start_time", ASCENDING)])

    # Waitlist: priority DESC, created_at ASC → highest urgency first, then FIFO
    await db.waitlist.create_index(
        [("doctor_id", ASCENDING), ("priority", DESCENDING), ("created_at", ASCENDING)]
    )

    print("✅ Connected to MongoDB and indexes created")


async def close_mongo_connection():
    global client
    if client:
        client.close()
        print("❌ MongoDB connection closed")


def get_db():
    return db
