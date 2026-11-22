"""
Integration tests for authentication endpoints.
Requires a running MongoDB (uses hospital_db_test).
Run: pytest tests/test_auth.py -v
"""

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.database import connect_to_mongo, close_mongo_connection, get_db
from app.config import settings

# Override DB name for tests
settings.DB_NAME = "hospital_db_test"


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    await connect_to_mongo()
    db = get_db()
    yield db
    await db.users.drop()
    await db.doctors.drop()
    await db.patients.drop()
    await close_mongo_connection()


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac


@pytest.mark.asyncio
async def test_register_doctor(client):
    resp = await client.post(
        "/auth/register",
        json={
            "email": "testdoc@test.com",
            "password": "testpass123",
            "name": "Test Doctor",
            "role": "doctor",
        },
    )
    assert resp.status_code == 201
    assert "user_id" in resp.json()


@pytest.mark.asyncio
async def test_register_patient(client):
    resp = await client.post(
        "/auth/register",
        json={
            "email": "testpatient@test.com",
            "password": "testpass123",
            "name": "Test Patient",
            "role": "patient",
        },
    )
    assert resp.status_code == 201


@pytest.mark.asyncio
async def test_duplicate_email(client):
    # First registration
    await client.post(
        "/auth/register",
        json={
            "email": "dup@test.com",
            "password": "testpass123",
            "name": "First User",
            "role": "doctor",
        },
    )
    # Duplicate registration
    resp = await client.post(
        "/auth/register",
        json={
            "email": "dup@test.com",
            "password": "another",
            "name": "Dup",
            "role": "doctor",
        },
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_login_success(client):
    await client.post(
        "/auth/register",
        json={
            "email": "loginuser@test.com",
            "password": "testpass123",
            "name": "Login User",
            "role": "doctor",
        },
    )
    resp = await client.post(
        "/auth/login",
        json={"email": "loginuser@test.com", "password": "testpass123"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["role"] == "doctor"


@pytest.mark.asyncio
async def test_login_wrong_password(client):
    await client.post(
        "/auth/register",
        json={
            "email": "wrongpw@test.com",
            "password": "correctpassword",
            "name": "User",
            "role": "doctor",
        },
    )
    resp = await client.post(
        "/auth/login",
        json={"email": "wrongpw@test.com", "password": "wrongpassword"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_role_guard_patient_cannot_access_doctor_route(client):
    # Register and login as patient
    await client.post(
        "/auth/register",
        json={
            "email": "patguard@test.com",
            "password": "testpass123",
            "name": "Pat Guard",
            "role": "patient",
        },
    )
    login = await client.post(
        "/auth/login",
        json={"email": "patguard@test.com", "password": "testpass123"},
    )
    token = login.json()["access_token"]
    # Try accessing doctor-only endpoint
    resp = await client.put(
        "/doctors/me/profile",
        json={"specialty": "Cardiology"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 403
