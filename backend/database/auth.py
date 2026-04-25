from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time
from typing import Any


TOKEN_TTL_SECONDS = 60 * 60 
AUTH_SECRET = os.getenv("AUTH_SECRET", "change-this-secret")


def _base64url_encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")


def _base64url_decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def create_access_token(user_id: int) -> str:
    payload = {
        "sub": user_id,
        "exp": int(time.time()) + TOKEN_TTL_SECONDS,
    }
    payload_json = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    payload_part = _base64url_encode(payload_json)
    signature = hmac.new(
        AUTH_SECRET.encode("utf-8"),
        payload_part.encode("ascii"),
        hashlib.sha256,
    ).digest()
    return f"{payload_part}.{_base64url_encode(signature)}"


def decode_access_token(token: str) -> dict[str, Any] | None:
    try:
        payload_part, signature_part = token.split(".", 1)
        expected_signature = hmac.new(
            AUTH_SECRET.encode("utf-8"),
            payload_part.encode("ascii"),
            hashlib.sha256,
        ).digest()
        provided_signature = _base64url_decode(signature_part)

        if not hmac.compare_digest(expected_signature, provided_signature):
            return None

        payload = json.loads(_base64url_decode(payload_part))
        if int(payload.get("exp", 0)) < int(time.time()):
            return None

        return payload
    except (ValueError, TypeError, json.JSONDecodeError):
        return None
