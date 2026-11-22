from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING, DESCENDING
from app.config import settings

client: AsyncIOMotorClient = None
db = None


async def connect_to_mongo():
    global client, db
    
    # Try configured MONGODB_URL (e.g. Atlas) first
    connected = False
    try:
        candidate_client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=4000)
        await candidate_client.admin.command("ping")
        client = candidate_client
        db = client[settings.DB_NAME]
        print(f"✅ Connected to Primary MongoDB: {settings.MONGODB_URL.split('@')[-1] if '@' in settings.MONGODB_URL else settings.MONGODB_URL}")
        connected = True
    except Exception as e:
        print(f"⚠️ Primary MongoDB connection failed: {e}")
        if settings.MONGODB_URL != "mongodb://localhost:27017":
            try:
                print("🔄 Falling back to local MongoDB (mongodb://localhost:27017)...")
                fallback_client = AsyncIOMotorClient("mongodb://localhost:27017", serverSelectionTimeoutMS=3000)
                await fallback_client.admin.command("ping")
                client = fallback_client
                db = client[settings.DB_NAME]
                print("✅ Connected to local MongoDB fallback")
                connected = True
            except Exception as fe:
                print(f"❌ Local MongoDB fallback also failed: {fe}")

    if not connected:
        # Re-raise or assign to allow retry
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
