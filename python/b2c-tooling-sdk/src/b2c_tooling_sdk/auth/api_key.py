# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""API key authentication strategy (MRT and external services).

Mirrors ``src/auth/api-key.ts``. Supports two modes:

- Bearer token: when ``header_name`` is ``Authorization``, formats as ``Bearer {key}``.
- Direct key: for other headers (e.g. ``x-api-key``), sets the key directly.
"""

from __future__ import annotations

from typing import Any

import httpx

from b2c_tooling_sdk.auth.dispatch_fetch import dispatch_fetch
from b2c_tooling_sdk.logging import get_logger


class ApiKeyStrategy:
    """API key authentication strategy.

    :example:

    .. code-block:: python

        # MRT API (Bearer token) -> Authorization: Bearer {key}
        auth = ApiKeyStrategy(api_key, "Authorization")

        # Custom header -> x-api-key: {key}
        auth = ApiKeyStrategy(api_key, "x-api-key")
    """

    def __init__(self, key: str, header_name: str = "x-api-key") -> None:
        self._header_name = header_name
        # Authorization uses the Bearer prefix (standard for MRT); other headers use the key directly.
        self._header_value = f"Bearer {key}" if header_name == "Authorization" else key
        key_preview = f"{key[:8]}..." if len(key) > 8 else key
        get_logger("auth.api_key").debug("[Auth] Using API Key authentication (%s): %s", header_name, key_preview)

    async def fetch(
        self,
        url: str,
        *,
        method: str = "GET",
        headers: dict[str, str] | None = None,
        content: Any = None,
        dispatcher: httpx.AsyncBaseTransport | None = None,
        **kwargs: Any,
    ) -> httpx.Response:
        """Perform a request with the API-key header set."""
        request_headers = dict(headers or {})
        request_headers[self._header_name] = self._header_value
        return await dispatch_fetch(
            url, method=method, headers=request_headers, content=content, dispatcher=dispatcher, **kwargs
        )

    async def get_authorization_header(self) -> str:
        """Return the header value (``Bearer {key}`` for Authorization, else the raw key)."""
        return self._header_value


__all__ = ["ApiKeyStrategy"]
