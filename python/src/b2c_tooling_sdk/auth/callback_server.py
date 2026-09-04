# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""A minimal localhost HTTP server for OAuth browser redirect callbacks.

The interactive browser flows (Authorization Code + PKCE and the legacy implicit
grant) open the user's browser to Account Manager and capture the redirect back
to ``http://localhost:{port}``. The Node SDK uses ``http.createServer``; the
Python analog here is a tiny :func:`asyncio.start_server` loop that parses the
request line, hands the path + query params to a per-request handler, and writes
the handler's response. The handler decides when the flow is complete (resolving
with a result) or failed (raising).
"""

from __future__ import annotations

import asyncio
import contextlib
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import Any
from urllib.parse import parse_qs, urlsplit

from b2c_tooling_sdk.logging import get_logger


@dataclass
class CallbackResponse:
    """What the callback server writes back to the browser for one request.

    :param status: HTTP status code.
    :param content_type: ``Content-Type`` header value.
    :param body: Response body.
    :param result: When set (not ``sentinel``), completes the flow with this value.
    :param error: When set, fails the flow with this exception.
    """

    status: int
    content_type: str
    body: str
    result: Any = None
    error: Exception | None = None
    done: bool = False


#: Handler signature: receives (path, query_params) and returns a CallbackResponse.
CallbackHandler = Callable[[str, dict[str, list[str]]], CallbackResponse]


async def run_callback_server(
    port: int,
    handler: CallbackHandler,
    on_listening: Callable[[], Awaitable[None]] | None = None,
) -> Any:
    """Run a localhost HTTP server on ``port`` until ``handler`` signals completion.

    :param port: TCP port to listen on (``127.0.0.1``).
    :param handler: Per-request callback. When it returns a response with
        ``done=True``, the server resolves with ``result`` (or raises ``error``).
    :param on_listening: Optional coroutine invoked *after* the socket is bound —
        the browser is opened here so an existing SSO session cannot redirect back
        to a closed port (mirrors Node's ``server.listen(port, cb)``). A failure in
        this callback fails the whole flow.
    :raises RuntimeError: if the port is already in use or the server cannot start.
    """
    logger = get_logger("auth.callback_server")
    loop = asyncio.get_running_loop()
    future: asyncio.Future[Any] = loop.create_future()

    async def _handle(reader: asyncio.StreamReader, writer: asyncio.StreamWriter) -> None:
        try:
            request_line = await reader.readline()
            # Drain the remaining request headers so the client gets a clean response.
            while True:
                line = await reader.readline()
                if line in (b"\r\n", b"\n", b""):
                    break
            target = "/"
            try:
                parts = request_line.decode("latin-1").split(" ")
                if len(parts) >= 2:
                    target = parts[1]
            except Exception:  # noqa: BLE001 - malformed request line -> treat as "/"
                target = "/"

            split = urlsplit(target)
            query = parse_qs(split.query, keep_blank_values=True)
            response = handler(split.path, query)

            body_bytes = response.body.encode("utf-8")
            head = (
                f"HTTP/1.1 {response.status} OK\r\n"
                f"Content-Type: {response.content_type}\r\n"
                f"Content-Length: {len(body_bytes)}\r\n"
                f"Connection: close\r\n\r\n"
            ).encode("latin-1")
            writer.write(head + body_bytes)
            await writer.drain()

            if response.done and not future.done():
                if response.error is not None:
                    future.set_exception(response.error)
                else:
                    future.set_result(response.result)
        except Exception as error:  # noqa: BLE001 - never let a bad request kill the server
            logger.debug("Callback request handling failed: %s", error)
        finally:
            with contextlib.suppress(Exception):
                writer.close()

    try:
        server = await asyncio.start_server(_handle, host="127.0.0.1", port=port)
    except OSError as error:
        hint = ""
        if error.errno in _ADDR_IN_USE_ERRNOS:
            hint = f" Port {port} is in use; set SFCC_OAUTH_LOCAL_PORT or pass local_port to use a different port."
        raise RuntimeError(f"Failed to start OAuth redirect server: {error}.{hint}") from error

    logger.debug("OAuth redirect server listening on port %s", port)
    opener_task: asyncio.Task[None] | None = None
    if on_listening is not None:

        async def _run_opener() -> None:
            try:
                await on_listening()
            except Exception as error:  # noqa: BLE001 - surface a browser-open failure to the caller
                if not future.done():
                    future.set_exception(error)

        opener_task = loop.create_task(_run_opener())

    try:
        async with server:
            return await future
    finally:
        if opener_task is not None and not opener_task.done():
            opener_task.cancel()


# errno values indicating the local port is already bound (POSIX + Windows).
_ADDR_IN_USE_ERRNOS = {48, 98, 10048}


__all__ = ["CallbackResponse", "CallbackHandler", "run_callback_server"]
