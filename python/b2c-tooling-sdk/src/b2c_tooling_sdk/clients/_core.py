# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Core HTTP client + middleware chain for typed API clients.

The TypeScript SDK builds its typed clients on ``openapi-fetch``, whose clients
return ``{data, error, response}`` and never throw on 4xx/5xx. Python has no
equivalent, so this module provides the moving parts openapi-fetch gave us:

- :class:`ClientResult` — the ``{data, error, response}`` convention. A 2xx puts
  the parsed body in ``data``; any other status puts the parsed body in
  ``error``. Only *network* failures raise (wrapped in ``NetworkError``); the
  operations layer inspects the result and raises typed exceptions.
- :class:`Middleware` — the openapi-fetch middleware shape (``on_request`` /
  ``on_response`` receiving a context object). ``on_request`` hooks run in
  registration order; ``on_response`` hooks run in **reverse** order (matching
  openapi-fetch), so auth (registered first) finalizes the retry last.
- :class:`HttpClient` — assembles the middleware chain over ``httpx``, templates
  path/query params, JSON-encodes bodies, and re-dispatches for retries.
"""

from __future__ import annotations

import json as json_module
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import Any, Protocol, runtime_checkable
from urllib.parse import quote

import httpx

from b2c_tooling_sdk.errors.network_error import wrap_network_error
from b2c_tooling_sdk.logging import get_logger

#: A re-dispatch function handed to middleware so it can retry a request without
#: re-entering the middleware chain (mirrors openapi-fetch's ``ctx.fetch``).
FetchFn = Callable[[httpx.Request], Awaitable[httpx.Response]]


@dataclass
class ClientResult:
    """Result of a typed client call — mirrors openapi-fetch ``{data, error, response}``.

    Never raised: a successful (2xx) response populates :attr:`data`, any other
    status populates :attr:`error`, and :attr:`response` is always the raw
    :class:`httpx.Response`. Only network failures raise (before a result exists).
    """

    data: Any = None
    error: Any = None
    response: httpx.Response | None = None


@dataclass
class MiddlewareRequestContext:
    """Context passed to a middleware's ``on_request`` hook."""

    request: httpx.Request
    client_type: str
    schema_path: str = ""
    fetch: FetchFn | None = None


@dataclass
class MiddlewareResponseContext:
    """Context passed to a middleware's ``on_response`` hook."""

    request: httpx.Request
    response: httpx.Response
    client_type: str
    schema_path: str = ""
    fetch: FetchFn | None = None


@runtime_checkable
class Middleware(Protocol):
    """Middleware for :class:`HttpClient` (analogous to an openapi-fetch middleware).

    Both hooks are optional. ``on_request`` may mutate ``ctx.request`` in place
    and/or return a replacement request; ``on_response`` may return a replacement
    response (e.g. a retry result). Returning ``None`` keeps the current object.
    """

    async def on_request(self, ctx: MiddlewareRequestContext) -> httpx.Request | None:
        """Called before the request is sent; may mutate or replace it."""
        ...

    async def on_response(self, ctx: MiddlewareResponseContext) -> httpx.Response | None:
        """Called after the response is received; may mutate or replace it."""
        ...


async def apply_request_middleware(
    request: httpx.Request,
    middleware: list[Middleware],
    *,
    client_type: str,
    schema_path: str = "",
    fetch: FetchFn | None = None,
) -> httpx.Request:
    """Run every ``on_request`` hook in registration order, threading the request."""
    current = request
    for m in middleware:
        on_request = getattr(m, "on_request", None)
        if on_request is None:
            continue
        ctx = MiddlewareRequestContext(request=current, client_type=client_type, schema_path=schema_path, fetch=fetch)
        result = await on_request(ctx)
        if result is not None:
            current = result
    return current


async def apply_response_middleware(
    request: httpx.Request,
    response: httpx.Response,
    middleware: list[Middleware],
    *,
    client_type: str,
    schema_path: str = "",
    fetch: FetchFn | None = None,
) -> httpx.Response:
    """Run every ``on_response`` hook in **reverse** registration order (openapi-fetch order)."""
    current = response
    for m in reversed(middleware):
        on_response = getattr(m, "on_response", None)
        if on_response is None:
            continue
        ctx = MiddlewareResponseContext(
            request=request,
            response=current,
            client_type=client_type,
            schema_path=schema_path,
            fetch=fetch,
        )
        result = await on_response(ctx)
        if result is not None:
            current = result
    return current


def _template_path(path: str, path_params: dict[str, Any] | None) -> str:
    """Substitute ``{name}`` placeholders in a path with URL-encoded param values."""
    if not path_params:
        return path
    result = path
    for key, value in path_params.items():
        result = result.replace(f"{{{key}}}", quote(str(value), safe=""))
    return result


def _parse_body(response: httpx.Response) -> Any:
    """Parse a response body as JSON, falling back to text, then ``None`` when empty."""
    raw = response.content
    if not raw:
        return None
    text = response.text
    try:
        return json_module.loads(text)
    except (ValueError, json_module.JSONDecodeError):
        return text


class HttpClient:
    """Async HTTP client with a middleware chain, returning :class:`ClientResult`.

    :param base_url: Base URL prefix (e.g. ``https://host/s/-/dw/data/v25_6``).
    :param middleware: Middleware in registration order (auth first, logging last).
    :param client_type: The :data:`~b2c_tooling_sdk.clients.middleware_registry.HttpClientType`
        label passed to middleware contexts.
    :param transport: Optional TLS/mTLS transport (mirrors the undici dispatcher).
    """

    def __init__(
        self,
        base_url: str,
        *,
        middleware: list[Middleware] | None = None,
        client_type: str = "custom",
        transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.middleware: list[Middleware] = list(middleware or [])
        self.client_type = client_type
        self._transport = transport
        self._client: httpx.AsyncClient | None = None

    def use(self, middleware: Middleware) -> None:
        """Append a middleware to the chain (mirrors openapi-fetch ``client.use``)."""
        self.middleware.append(middleware)

    def _http(self) -> httpx.AsyncClient:
        """Return the lazily-created underlying :class:`httpx.AsyncClient`."""
        if self._client is None:
            client_kwargs: dict[str, Any] = {}
            if self._transport is not None:
                client_kwargs["transport"] = self._transport
            self._client = httpx.AsyncClient(**client_kwargs)
        return self._client

    async def aclose(self) -> None:
        """Close the underlying HTTP client and release its connections."""
        if self._client is not None:
            await self._client.aclose()
            self._client = None

    async def _dispatch(self, request: httpx.Request) -> httpx.Response:
        """Send a request through the transport, wrapping transport failures."""
        try:
            return await self._http().send(request)
        except Exception as err:  # noqa: BLE001 - wrapped only if network-level
            host = request.url.host
            raise wrap_network_error(err, operation=f"{request.method} request", host=host) from err

    def _build_request(
        self,
        method: str,
        path: str,
        *,
        params: dict[str, Any] | None,
        body: Any,
        headers: dict[str, str] | None,
    ) -> httpx.Request:
        """Build an :class:`httpx.Request` with templated path/query and JSON body."""
        params = params or {}
        templated = _template_path(path, params.get("path"))
        url = f"{self.base_url}{templated}"

        request_headers: dict[str, str] = dict(headers or {})
        content: bytes | None = None
        if body is not None:
            if isinstance(body, (bytes, bytearray)):
                content = bytes(body)
            elif isinstance(body, str):
                content = body.encode("utf-8")
            else:
                content = json_module.dumps(body).encode("utf-8")
                request_headers.setdefault("Content-Type", "application/json")

        query = params.get("query")
        return self._http().build_request(
            method,
            url,
            params=_clean_query(query),
            headers=request_headers,
            content=content,
        )

    async def request(
        self,
        method: str,
        path: str,
        *,
        params: dict[str, Any] | None = None,
        body: Any = None,
        headers: dict[str, str] | None = None,
    ) -> ClientResult:
        """Perform a request through the middleware chain and return a :class:`ClientResult`.

        :param method: HTTP method (``GET``, ``POST``, ...).
        :param path: Path appended to ``base_url``; may contain ``{name}`` placeholders.
        :param params: Optional ``{"path": {...}, "query": {...}}`` parameters.
        :param body: Optional request body (dict/list → JSON, or raw bytes/str).
        :param headers: Optional extra request headers.
        :raises NetworkError: on transport-level failures (never on 4xx/5xx).
        """
        request = self._build_request(method, path, params=params, body=body, headers=headers)

        request = await apply_request_middleware(
            request,
            self.middleware,
            client_type=self.client_type,
            schema_path=path,
            fetch=self._dispatch,
        )

        get_logger("clients.core").debug("[HttpClient] %s %s", request.method, request.url)
        response = await self._dispatch(request)

        response = await apply_response_middleware(
            request,
            response,
            self.middleware,
            client_type=self.client_type,
            schema_path=path,
            fetch=self._dispatch,
        )

        await response.aread()
        if response.is_success:
            return ClientResult(data=_parse_body(response), error=None, response=response)
        return ClientResult(data=None, error=_parse_body(response), response=response)

    async def get(self, path: str, options: dict[str, Any] | None = None) -> ClientResult:
        """Perform a ``GET`` request. ``options`` may carry ``params``/``headers``."""
        return await self._call("GET", path, options)

    async def post(self, path: str, options: dict[str, Any] | None = None) -> ClientResult:
        """Perform a ``POST`` request. ``options`` may carry ``params``/``body``/``headers``."""
        return await self._call("POST", path, options)

    async def put(self, path: str, options: dict[str, Any] | None = None) -> ClientResult:
        """Perform a ``PUT`` request. ``options`` may carry ``params``/``body``/``headers``."""
        return await self._call("PUT", path, options)

    async def patch(self, path: str, options: dict[str, Any] | None = None) -> ClientResult:
        """Perform a ``PATCH`` request. ``options`` may carry ``params``/``body``/``headers``."""
        return await self._call("PATCH", path, options)

    async def delete(self, path: str, options: dict[str, Any] | None = None) -> ClientResult:
        """Perform a ``DELETE`` request. ``options`` may carry ``params``/``headers``."""
        return await self._call("DELETE", path, options)

    async def _call(self, method: str, path: str, options: dict[str, Any] | None) -> ClientResult:
        """Shared dispatcher for the openapi-fetch-style verb methods."""
        options = options or {}
        return await self.request(
            method,
            path,
            params=options.get("params"),
            body=options.get("body"),
            headers=options.get("headers"),
        )


def _clean_query(query: Any) -> dict[str, Any] | None:
    """Drop ``None`` values from a query-param mapping (openapi-fetch semantics)."""
    if not query or not isinstance(query, dict):
        return None
    return {k: v for k, v in query.items() if v is not None}


__all__ = [
    "ClientResult",
    "FetchFn",
    "HttpClient",
    "Middleware",
    "MiddlewareRequestContext",
    "MiddlewareResponseContext",
    "apply_request_middleware",
    "apply_response_middleware",
]
