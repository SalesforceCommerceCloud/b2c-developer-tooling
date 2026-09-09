# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Helpers for decoding and validating JWT access tokens.

Mirrors ``src/auth/jwt-utils.ts`` (plus ``decodeJWT`` from ``oauth.ts``). Tokens
are decoded **without** signature verification — these are Account Manager
access tokens the SDK itself requested, used only to read ``exp`` / ``scope``.
"""

from __future__ import annotations

import base64
import json
import time
from datetime import datetime, timezone
from typing import Any

from b2c_tooling_sdk.auth.types import DecodedJWT

#: Default buffer (seconds) before token ``exp`` to consider the token expired.
DEFAULT_EXPIRY_BUFFER_SEC = 60


def _b64url_decode(segment: str) -> bytes:
    """Decode a base64url (or plain base64) segment, tolerating missing padding."""
    normalized = segment.replace("-", "+").replace("_", "/")
    padding = "=" * (-len(normalized) % 4)
    return base64.b64decode(normalized + padding)


def decode_jwt(token: str) -> DecodedJWT:
    """Decode a JWT into its header and payload without verifying the signature.

    :raises ValueError: if the token is not a well-formed three-part JWT.
    """
    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError("Invalid JWT format")
    header = json.loads(_b64url_decode(parts[0]))
    payload = json.loads(_b64url_decode(parts[1]))
    return DecodedJWT(header=header, payload=payload)


def extract_jwt_scopes(payload: dict[str, Any]) -> list[str]:
    """Extract ``scope`` from a decoded JWT payload (array or space-delimited string)."""
    scope = payload.get("scope")
    if scope is None:
        return []
    if isinstance(scope, list):
        return [str(s) for s in scope]
    return str(scope).split(" ")


def decode_jwt_token_info(token: str) -> tuple[datetime, list[str]]:
    """Return ``(expires, scopes)`` for a token. Propagates decode errors."""
    decoded = decode_jwt(token)
    exp = decoded.payload.get("exp")
    exp_seconds = exp if isinstance(exp, (int, float)) else 0
    expires = datetime.fromtimestamp(exp_seconds, tz=timezone.utc)
    return expires, extract_jwt_scopes(decoded.payload)


def is_jwt_token_valid(
    token: str,
    required_scopes: list[str] | None = None,
    expiry_buffer_sec: int = DEFAULT_EXPIRY_BUFFER_SEC,
) -> bool:
    """Return ``True`` if the token decodes, is unexpired (with buffer), and has all scopes."""
    if not token:
        return False
    required_scopes = required_scopes or []
    try:
        expires, scopes = decode_jwt_token_info(token)
    except Exception:
        return False
    now_sec = int(time.time())
    exp_sec = int(expires.timestamp())
    if exp_sec == 0 or now_sec >= exp_sec - expiry_buffer_sec:
        return False
    # Empty required_scopes -> all() is vacuously True.
    return all(s in scopes for s in required_scopes)


__all__ = [
    "DEFAULT_EXPIRY_BUFFER_SEC",
    "decode_jwt",
    "extract_jwt_scopes",
    "decode_jwt_token_info",
    "is_jwt_token_valid",
]
