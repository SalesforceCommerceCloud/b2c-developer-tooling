# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Helpers for building unsigned test JWTs.

The SDK decodes access tokens without verifying signatures (they are AM tokens it
itself requested), so tests can use tokens with an arbitrary signature segment.
"""

from __future__ import annotations

import base64
import json
import time
from typing import Any


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def make_jwt(
    *,
    exp: int | None = None,
    expires_in: int | None = None,
    scope: Any = None,
    sub: str | None = None,
    extra_payload: dict[str, Any] | None = None,
    signature: str = "sig",
) -> str:
    """Build an unsigned JWT string ``header.payload.signature``.

    :param exp: Absolute expiry (epoch seconds). Overrides ``expires_in``.
    :param expires_in: Seconds from now until expiry (used when ``exp`` is omitted).
    :param scope: ``scope`` claim — a list or a space-delimited string.
    :param sub: Optional subject claim.
    :param extra_payload: Additional claims merged into the payload.
    """
    payload: dict[str, Any] = {}
    if exp is not None:
        payload["exp"] = exp
    elif expires_in is not None:
        payload["exp"] = int(time.time()) + expires_in
    if scope is not None:
        payload["scope"] = scope
    if sub is not None:
        payload["sub"] = sub
    if extra_payload:
        payload.update(extra_payload)
    header = {"alg": "RS256", "typ": "JWT"}
    return ".".join(
        [
            _b64url(json.dumps(header).encode("utf-8")),
            _b64url(json.dumps(payload).encode("utf-8")),
            signature,
        ]
    )
