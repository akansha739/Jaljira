from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import DeclarativeBase, sessionmaker

load_dotenv(Path(__file__).resolve().parents[1] / ".env")


def _build_database_url() -> str:
    postgres_url = os.getenv("POSTGRES_URL")
    if postgres_url:
        return postgres_url

    raise RuntimeError(
        "POSTGRES_URL is not set in backend/.env. Add your PostgreSQL connection "
        "string there before starting the app."
    )


DATABASE_URL = _build_database_url()
engine_kwargs = {"pool_pre_ping": True, "echo": False}
if DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, **engine_kwargs)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    # Ensure models are imported so SQLAlchemy knows tables
    from . import models  # noqa: F401

    try:
        Base.metadata.create_all(bind=engine)
        _ensure_compatible_schema()
    except OperationalError as exc:
        if DATABASE_URL.startswith("postgresql"):
            raise RuntimeError(
                "Database connection failed. Check backend/.env and verify the "
                "PostgreSQL username, password, host, port, and database name."
            ) from exc
        raise


def _ensure_compatible_schema():
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return

    user_columns = {column["name"] for column in inspector.get_columns("users")}
    if "role" in user_columns:
        return

    with engine.begin() as connection:
        connection.execute(
            text("ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'developer'")
        )

        if engine.dialect.name != "sqlite":
            connection.execute(
                text(
                    "UPDATE users SET role = 'developer' "
                    "WHERE role IS NULL OR role = ''"
                )
            )
