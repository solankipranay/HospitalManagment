from pydantic import BaseModel, EmailStr
from typing import Literal
from datetime import datetime


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: Literal["doctor", "patient"]


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: str
    name: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    created_at: datetime
