from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from database import models, schema
from database.db import get_db

router = APIRouter(
    prefix="/users",
    tags=["users"],
)

tasks_router = APIRouter(
    prefix="/tasks",
    tags=["tasks"],
)

pwd_context = CryptContext(
    schemes=["argon2"],
    deprecated="auto",
)


@router.post("/register")
def register_user(user: schema.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User already exists",
        )

    hashed_password = pwd_context.hash(user.password_hash)

    new_user = models.User(
        email=user.email,
        password_hash=hashed_password,
        role=user.role,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User registered successfully"}

@tasks_router.post("", response_model=schema.TaskRead)
def create_task(task_in: schema.TaskCreate, db: Session = Depends(get_db)):
    new_task = models.Task(
        title=task_in.title,
        description=task_in.description,
        status=task_in.status,
        assigned_to_id=task_in.assigned_to_id,
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task


@tasks_router.get("/assigned/{user_id}", response_model=list[schema.TaskRead])
def get_tasks_assigned_to_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    tasks = db.query(models.Task).filter(models.Task.assigned_to_id == user_id).all()
    return tasks

@tasks_router.patch("/{task_id}", response_model=schema.TaskRead)
def update_task(task_id: int, task_in: schema.TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    update_data = task_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(task, key, value)

    db.commit()
    db.refresh(task)
    return task
