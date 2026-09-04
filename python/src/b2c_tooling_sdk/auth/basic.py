# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""HTTP Basic authentication strategy (used for WebDAV).

Mirrors ``src/auth/basic.ts``. Encodes username and access key as Base64 for the
``Authorization: Basic`` header.
"""

from __future__ import annotations

import base64
from typing import Any

import httpx

from b2c_tooling_sdk.auth.dispatch_fetch import dispatch_fetch
from b2c_tooling_sdk.logging import get_logger


class BasicAuthStrategy:
    """Basic authentication strategy.

    :example:

    .. code-block:: python

        from b2c_tooling_sdk.auth import BasicAuthStrategy

        auth = BasicAuthStrategy("username", "access-key")
        response = await auth.fetch("https://webdav.example.com/path")
    """

    def __init__(self, user: str, password: str) -> None:
        self._encoded = base64.b64encode(f"{user}:{password}".encode()).decode("ascii")
        get_logger("auth.basic").debug("[Auth] Using Basic authentication for user: %s", user)

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
        """Perform a request with the ``Authorization: Basic`` header set."""
        request_headers = dict(headers or {})
        request_headers["Authorization"] = f"Basic {self._encoded}"
        return await dispatch_fetch(
            url, method=method, headers=request_headers, content=content, dispatcher=dispatcher, **kwargs
        )

    async def get_authorization_header(self) -> str:
        """Return the ``Authorization: Basic`` header value."""
        return f"Basic {self._encoded}"


__all__ = ["BasicAuthStrategy"]
