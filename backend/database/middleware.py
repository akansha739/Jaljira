from __future__ import annotations

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from database.auth import decode_access_token
from database.db import SessionLocal
from database.models import User


PUBLIC_PATHS = {
    "/docs",
    "/openapi.json",
    "/redoc",
    "/users/login",
    "/users/register",
}


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_path = request.url.path.rstrip("/") or "/"
        if request.method == "OPTIONS" or request_path in PUBLIC_PATHS:
            return await call_next(request)

        auth_header = request.headers.get("Authorization", "")
        scheme, _, token = auth_header.partition(" ")
        if scheme.lower() != "bearer" or not token:
            return JSONResponse(
                status_code=401,
                content={"detail": "Authentication required"},
            )

        payload = decode_access_token(token)
        user_id = payload.get("sub") if payload else None
        if not user_id:
            return JSONResponse(
                status_code=401,
                content={"detail": "Invalid or expired token"},
            )

        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == int(user_id)).first()
            if not user:
                return JSONResponse(
                    status_code=401,
                    content={"detail": "Invalid or expired token"},
                )
            request.state.user = user
        finally:
            db.close()

        return await call_next(request)
