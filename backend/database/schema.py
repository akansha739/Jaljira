from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    password_hash: str
    role: str = "developer"


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    role: str
    created_at: datetime


class TaskCreate(BaseModel):
    title: str
    description: str | None = None
    status: str = "open"
    assigned_to_id: int | None = None
    created_by_id: int


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    assigned_to_id: int | None = None
    updated_by_id: int


class TaskRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None
    status: str
    assigned_to_id: int | None
    created_by_id: int | None
    created_at: datetime
    updated_at: datetime


class TaskCommentCreate(BaseModel):
    task_id: int
    author_id: int
    content: str


class TaskCommentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    task_id: int
    author_id: int
    content: str
    created_at: datetime


class TaskActivityCreate(BaseModel):
    task_id: int
    actor_id: int
    action: str
    details: str | None = None


class TaskActivityRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    task_id: int
    actor_id: int
    action: str
    details: str | None
    created_at: datetime
