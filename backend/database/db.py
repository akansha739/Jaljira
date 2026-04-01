from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

# SQLite database (local dev).
# If you later switch DBs, change this URL.
DATABASE_URL = "sqlite:///./database.db"


# `check_same_thread=False` is required for SQLite when used with FastAPI.
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

class Base(DeclarativeBase):
    pass

def get_db():
    db=SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    # Ensure models are imported so SQLAlchemy knows tables
    from . import models  # noqa: F401

    Base.metadata.create_all(bind=engine)