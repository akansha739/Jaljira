from contextlib import asynccontextmanager
from multiprocessing import freeze_support

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.api.chat import router as chat_router
from database.api.routes import router as users_router, tasks_router
from database.db import create_tables
from database.middleware import AuthMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()
    yield


app = FastAPI(
    title="JalJira",
    description="It will help to manage your tasks and projects",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(AuthMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):517\d",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users_router)
app.include_router(tasks_router)
app.include_router(chat_router)


if __name__ == "__main__":
    import uvicorn

    freeze_support()
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
