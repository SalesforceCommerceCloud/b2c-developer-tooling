# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""HTTP error type for API/WebDAV clients."""

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    import httpx


class HttpError(Exception):
    """Raised when an HTTP request fails.

    Wraps the original :class:`httpx.Response` for access to status, headers,
    and body. Mirrors ``HTTPError`` in the TypeScript SDK.

    :ivar response: The response object from the failed request.
    :ivar method: HTTP method used for the request (GET, POST, PUT, ...).
    """

    def __init__(self, message: str, response: httpx.Response, method: str) -> None:
        super().__init__(message)
        self.response = response
        self.method = method
