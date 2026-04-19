from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.api.routes import router as users_router, tasks_router
from database.db import create_tables


app=FastAPI(
    title="JalJira",
    description="It will help to manage your tasks and projects",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

create_tables()
app.include_router(users_router)
app.include_router(tasks_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000,reload=True)
