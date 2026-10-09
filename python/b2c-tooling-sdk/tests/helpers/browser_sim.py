# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Helpers that simulate the browser redirect for interactive OAuth flow tests.

The PKCE / implicit strategies run a real localhost TCP server to capture the
OAuth redirect. These helpers make raw HTTP requests to that server via
:func:`asyncio.open_connection`, which deliberately bypasses ``respx`` (respx only
intercepts httpx), so the browser callback and the mocked Account Manager token
endpoint can coexist in one test.
"""

from __future__ import annotations

import asyncio
import contextlib
from urllib.parse import parse_qs, urlsplit


async def http_get(url: str) -> tuple[int, str]:
    """Make a raw HTTP/1.1 GET to ``url`` and return ``(status, body)``."""
    split = urlsplit(url)
    host = split.hostname or "127.0.0.1"
    port = split.port or 80
    path = split.path or "/"
    if split.query:
        path = f"{path}?{split.query}"
    reader, writer = await asyncio.open_connection(host, port)
    writer.write(f"GET {path} HTTP/1.1\r\nHost: {host}\r\nConnection: close\r\n\r\n".encode("latin-1"))
    await writer.drain()
    raw = await reader.read()
    writer.close()
    with contextlib.suppress(Exception):
        await writer.wait_closed()
    head, _, body = raw.partition(b"\r\n\r\n")
    status_line = head.split(b"\r\n", 1)[0].decode("latin-1")
    status = int(status_line.split(" ")[1])
    return status, body.decode("utf-8")


def extract_query_param(url: str, key: str) -> str | None:
    """Return the first value of query param ``key`` in ``url`` (or ``None``)."""
    values = parse_qs(urlsplit(url).query).get(key)
    return values[0] if values else None
