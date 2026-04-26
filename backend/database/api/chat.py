from __future__ import annotations

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status

from database.auth import decode_access_token
from database.db import SessionLocal
from database.models import Task, TaskComment, User


router = APIRouter(tags=["chat"])

task_connections: dict[int, list[WebSocket]] = {}


def get_user_from_token(token: str) -> User | None:
    payload = decode_access_token(token)
    user_id = payload.get("sub") if payload else None
    if not user_id:
        return None

    db = SessionLocal()
    try:
        return db.query(User).filter(User.id == int(user_id)).first()
    finally:
        db.close()


def task_exists(task_id: int) -> bool:
    db = SessionLocal()
    try:
        return db.query(Task.id).filter(Task.id == task_id).first() is not None
    finally:
        db.close()


async def broadcast_to_task(task_id: int, message: dict):
    disconnected: list[WebSocket] = []

    for connection in task_connections.get(task_id, []):
        try:
            await connection.send_json(message)
        except RuntimeError:
            disconnected.append(connection)

    for connection in disconnected:
        if connection in task_connections.get(task_id, []):
            task_connections[task_id].remove(connection)


@router.websocket("/ws/tasks/{task_id}/chat")
async def task_chat(websocket: WebSocket, task_id: int, token: str):
    user = get_user_from_token(token)
    if not user or not task_exists(task_id):
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await websocket.accept()
    task_connections.setdefault(task_id, []).append(websocket)

    try:
        while True:
            payload = await websocket.receive_json()
            content = str(payload.get("content", "")).strip()
            if not content:
                continue

            db = SessionLocal()
            try:
                comment = TaskComment(
                    task_id=task_id,
                    author_id=user.id,
                    content=content,
                )
                db.add(comment)
                db.commit()
                db.refresh(comment)

                message = {
                    "id": comment.id,
                    "task_id": task_id,
                    "author_id": user.id,
                    "author_email": user.email,
                    "content": comment.content,
                    "created_at": comment.created_at.isoformat(),
                }
            finally:
                db.close()

            await broadcast_to_task(task_id, message)
    except WebSocketDisconnect:
        if websocket in task_connections.get(task_id, []):
            task_connections[task_id].remove(websocket)
        if not task_connections.get(task_id):
            task_connections.pop(task_id, None)
