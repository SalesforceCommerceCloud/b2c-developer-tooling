# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Shared middleware for the typed HTTP clients.

Mirrors ``src/clients/middleware.ts`` (minus the safety middleware, which is out
of scope for the Python port). Provides authentication (with 401 retry), the
SCAPI scope-cascade auth, rate limiting (Retry-After / exponential backoff),
logging, User-Agent, and extra-params middleware — all built on the
:class:`~b2c_tooling_sdk.clients._core.Middleware` context shape.
"""

from __future__ import annotations

import asyncio
import json as json_module
import random
from dataclasses import dataclass
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from typing import Any

import httpx

from b2c_tooling_sdk.clients._core import MiddlewareRequestContext, MiddlewareResponseContext
from b2c_tooling_sdk.logging import get_logger


def _headers_with_auth(request: httpx.Request, auth_header: str) -> httpx.Headers:
    """Return a copy of ``request``'s headers with ``Authorization`` set."""
    headers = httpx.Headers(request.headers)
    headers["Authorization"] = auth_header
    return headers


def _rebuild_request(request: httpx.Request, headers: httpx.Headers) -> httpx.Request:
    """Rebuild a request with new headers, preserving method/url/body."""
    return httpx.Request(request.method, request.url, headers=headers, content=request.content)


class _AuthMiddleware:
    """Injects the auth header and retries once on a 401 after a prior success."""

    def __init__(self, auth: Any) -> None:
        self._auth = auth
        self._logger = get_logger("clients.middleware")
        self._has_had_success = False
        self._retried: set[bytes] = set()

    def _get_authorization_header(self) -> Any:
        return getattr(self._auth, "get_authorization_header", None)

    def _invalidate_token(self) -> Any:
        return getattr(self._auth, "invalidate_token", None)

    async def on_request(self, ctx: MiddlewareRequestContext) -> httpx.Request | None:
        get_header = self._get_authorization_header()
        if get_header is not None:
            auth_header = await get_header()
            ctx.request.headers["Authorization"] = auth_header
        return ctx.request

    async def on_response(self, ctx: MiddlewareResponseContext) -> httpx.Response | None:
        response = ctx.response
        request = ctx.request
        if response.status_code != 401:
            self._has_had_success = True

        get_header = self._get_authorization_header()
        invalidate = self._invalidate_token()
        key = _request_identity(request)
        if (
            response.status_code == 401
            and self._has_had_success
            and key not in self._retried
            and invalidate is not None
            and get_header is not None
        ):
            self._logger.debug("[AuthMiddleware] Received 401, invalidating token and retrying")
            self._retried.add(key)
            invalidate()
            new_header = await get_header()
            retry_request = _rebuild_request(request, _headers_with_auth(request, new_header))
            assert ctx.fetch is not None
            retry_response = await ctx.fetch(retry_request)
            self._logger.debug("[AuthMiddleware] Retry response: %s", retry_response.status_code)
            return retry_response

        return response


def create_auth_middleware(auth: Any) -> _AuthMiddleware:
    """Create authentication middleware that injects the auth header and retries on 401.

    On a 401 following a prior successful response (indicating token expiry rather
    than bad credentials), it invalidates the token and retries the request once
    with a fresh token. Requires the strategy to implement
    ``get_authorization_header`` and ``invalidate_token``.
    """
    return _AuthMiddleware(auth)


@dataclass
class ScopeCascade:
    """Scope cascade for a SCAPI domain.

    The SCAPI auth middleware picks :attr:`read` or :attr:`write` based on the
    per-operation scope-mode hint and walks the chosen cascade through the auth
    strategy until one candidate survives at Account Manager. Each candidate is a
    list of scopes; the auth strategy adds any base (e.g. tenant) scopes itself.
    """

    read: list[list[str]]
    write: list[list[str]]


#: Internal request header read by :func:`create_scapi_auth_middleware` to choose
#: a cascade tier. Operations attach ``"read"`` or ``"write"``; the header is
#: stripped before the request leaves the middleware.
SCOPE_MODE_HEADER = "x-b2c-scope-mode"


class _ScapiAuthMiddleware:
    """SCAPI auth middleware with a configured :class:`ScopeCascade`."""

    def __init__(self, auth: Any, cascade: ScopeCascade) -> None:
        self._auth = auth
        self._cascade = cascade
        self._logger = get_logger("clients.middleware")
        self._has_had_success = False
        self._retried: set[bytes] = set()
        self._scope_modes: dict[bytes, str] = {}

    async def _authorize(self, request: httpx.Request) -> None:
        mode = request.headers.get(SCOPE_MODE_HEADER)
        if SCOPE_MODE_HEADER in request.headers:
            del request.headers[SCOPE_MODE_HEADER]

        for_cascade = getattr(self._auth, "get_access_token_for_cascade", None)
        if mode and for_cascade is not None:
            self._scope_modes[_request_identity(request)] = mode
            candidates = self._cascade.read if mode == "read" else self._cascade.write
            token = await for_cascade(candidates)
            request.headers["Authorization"] = f"Bearer {token}"
            return

        get_header = getattr(self._auth, "get_authorization_header", None)
        if get_header is not None:
            request.headers["Authorization"] = await get_header()

    async def on_request(self, ctx: MiddlewareRequestContext) -> httpx.Request | None:
        await self._authorize(ctx.request)
        return ctx.request

    async def on_response(self, ctx: MiddlewareResponseContext) -> httpx.Response | None:
        response = ctx.response
        request = ctx.request
        if response.status_code != 401:
            self._has_had_success = True

        invalidate = getattr(self._auth, "invalidate_token", None)
        key = _request_identity(request)
        if (
            response.status_code == 401
            and self._has_had_success
            and key not in self._retried
            and invalidate is not None
        ):
            self._logger.debug("[ScapiAuthMiddleware] Received 401, invalidating token and retrying")
            self._retried.add(key)
            invalidate()

            retry_request = _rebuild_request(request, httpx.Headers(request.headers))
            for_cascade = getattr(self._auth, "get_access_token_for_cascade", None)
            get_header = getattr(self._auth, "get_authorization_header", None)
            if for_cascade is not None:
                original_mode = self._scope_modes.get(key, "write")
                candidates = self._cascade.read if original_mode == "read" else self._cascade.write
                token = await for_cascade(candidates)
                retry_request.headers["Authorization"] = f"Bearer {token}"
            elif get_header is not None:
                retry_request.headers["Authorization"] = await get_header()

            assert ctx.fetch is not None
            retry_response = await ctx.fetch(retry_request)
            self._logger.debug("[ScapiAuthMiddleware] Retry response: %s", retry_response.status_code)
            return retry_response

        return response


def create_scapi_auth_middleware(auth: Any, cascade: ScopeCascade) -> _ScapiAuthMiddleware:
    """Create SCAPI auth middleware that resolves a :class:`ScopeCascade` per request.

    Reads :data:`SCOPE_MODE_HEADER`, picks the matching cascade, and asks the auth
    strategy to resolve it (cache-first, then AM with ``invalid_scope`` fallback).
    Strips the header before the request is sent. Falls back to
    ``get_authorization_header`` when the strategy lacks ``get_access_token_for_cascade``
    or no scope-mode header was supplied. 401 retry matches
    :func:`create_auth_middleware`.
    """
    return _ScapiAuthMiddleware(auth, cascade)


DEFAULT_RATE_LIMIT_MAX_RETRIES = 3
DEFAULT_RATE_LIMIT_BASE_DELAY_MS = 1000
DEFAULT_RATE_LIMIT_MAX_DELAY_MS = 30000
DEFAULT_RATE_LIMIT_STATUS_CODES = [429]
DEFAULT_RATE_LIMIT_JITTER_RATIO = 0.2


def _parse_retry_after(header_value: str | None) -> float | None:
    """Parse a ``Retry-After`` header into a delay in milliseconds (seconds or HTTP date)."""
    if not header_value:
        return None
    try:
        seconds = float(header_value)
        return max(0.0, round(seconds * 1000))
    except ValueError:
        pass
    try:
        parsed = parsedate_to_datetime(header_value)
    except (TypeError, ValueError):
        return None
    if parsed is None:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    diff_ms = (parsed - datetime.now(timezone.utc)).total_seconds() * 1000
    return diff_ms if diff_ms > 0 else 0.0


def _compute_backoff_delay_ms(attempt: int, base_delay_ms: float, max_delay_ms: float) -> float:
    """Return the next exponential-backoff delay (with jitter), capped at ``max_delay_ms``."""
    delay = base_delay_ms * (2 ** max(0, attempt))
    if delay <= 0:
        return 0.0
    jitter = round(delay * DEFAULT_RATE_LIMIT_JITTER_RATIO * random.random())
    return float(min(delay + jitter, max_delay_ms))


class _RateLimitMiddleware:
    """Retries rate-limited responses honoring ``Retry-After`` else exponential backoff."""

    def __init__(
        self,
        *,
        max_retries: int,
        base_delay_ms: float,
        max_delay_ms: float,
        status_codes: list[int],
        prefix: str | None,
    ) -> None:
        self._max_retries = max_retries
        self._base_delay_ms = base_delay_ms
        self._max_delay_ms = max_delay_ms
        self._status_codes = status_codes
        self._logger = get_logger("clients.middleware")
        self._tag = f"[{prefix} RATE]" if prefix else "[RATE]"

    async def on_request(self, ctx: MiddlewareRequestContext) -> httpx.Request | None:
        return ctx.request

    async def on_response(self, ctx: MiddlewareResponseContext) -> httpx.Response | None:
        response = ctx.response
        request = ctx.request
        if response.status_code not in self._status_codes or self._max_retries <= 0 or ctx.fetch is None:
            return response

        last_response = response
        attempt = 0
        while last_response.status_code in self._status_codes and attempt < self._max_retries:
            delay_ms = _parse_retry_after(last_response.headers.get("Retry-After"))
            if delay_ms is None:
                delay_ms = _compute_backoff_delay_ms(attempt, self._base_delay_ms, self._max_delay_ms)

            self._logger.warning(
                "%s Rate limit encountered, retrying after %sms (attempt %s/%s)",
                self._tag,
                delay_ms,
                attempt + 1,
                self._max_retries,
            )
            if delay_ms > 0:
                await asyncio.sleep(delay_ms / 1000)

            attempt += 1
            retry_request = _rebuild_request(request, httpx.Headers(request.headers))
            last_response = await ctx.fetch(retry_request)

        if last_response.status_code in self._status_codes and attempt >= self._max_retries:
            self._logger.debug("%s Max retries reached, not retrying request", self._tag)

        return last_response


def create_rate_limit_middleware(
    *,
    max_retries: int = DEFAULT_RATE_LIMIT_MAX_RETRIES,
    base_delay_ms: float = DEFAULT_RATE_LIMIT_BASE_DELAY_MS,
    max_delay_ms: float = DEFAULT_RATE_LIMIT_MAX_DELAY_MS,
    status_codes: list[int] | None = None,
    prefix: str | None = None,
) -> _RateLimitMiddleware:
    """Create rate-limiting middleware for the typed clients.

    Inspects responses for rate-limit status codes (default ``[429]``), uses the
    ``Retry-After`` header when present, otherwise exponential backoff with
    jitter (base 1s, max 30s), and retries up to ``max_retries`` times.
    """
    return _RateLimitMiddleware(
        max_retries=max_retries,
        base_delay_ms=base_delay_ms,
        max_delay_ms=max_delay_ms,
        status_codes=status_codes if status_codes is not None else list(DEFAULT_RATE_LIMIT_STATUS_CODES),
        prefix=prefix,
    )


def _mask_body(body: Any, keys_to_mask: list[str] | None) -> Any:
    """Mask top-level keys in a dict body for logging (values replaced with ``...``)."""
    if not keys_to_mask or not isinstance(body, dict):
        return body
    masked = dict(body)
    for key in keys_to_mask:
        if key in masked:
            masked[key] = "..."
    return masked


def _try_parse_json(text: str) -> Any:
    """Parse ``text`` as JSON, returning the raw text on failure."""
    try:
        return json_module.loads(text)
    except (ValueError, json_module.JSONDecodeError):
        return text


class _LoggingMiddleware:
    """Logs request/response details at debug level (trace maps to debug in Python)."""

    def __init__(self, prefix: str | None, mask_body_keys: list[str] | None) -> None:
        self._logger = get_logger("clients.middleware")
        self._req_tag = f"[{prefix} REQ]" if prefix else ""
        self._resp_tag = f"[{prefix} RESP]" if prefix else ""
        self._mask_body_keys = mask_body_keys

    async def on_request(self, ctx: MiddlewareRequestContext) -> httpx.Request | None:
        request = ctx.request
        self._logger.debug("%s %s %s", self._req_tag, request.method, request.url)
        if request.content:
            body = _mask_body(_try_parse_json(request.content.decode("utf-8", "replace")), self._mask_body_keys)
            self._logger.debug("%s %s %s body: %s", self._req_tag, request.method, request.url, body)
        return request

    async def on_response(self, ctx: MiddlewareResponseContext) -> httpx.Response | None:
        request = ctx.request
        response = ctx.response
        self._logger.debug("%s %s %s %s", self._resp_tag, request.method, request.url, response.status_code)
        return response


def create_logging_middleware(config: str | dict[str, Any] | None = None) -> _LoggingMiddleware:
    """Create logging middleware. Pass a prefix string, or a config dict with
    ``prefix`` and ``mask_body_keys`` (top-level body keys masked in logs)."""
    if isinstance(config, str):
        prefix: str | None = config
        mask_body_keys: list[str] | None = None
    else:
        cfg = config or {}
        prefix = cfg.get("prefix")
        mask_body_keys = cfg.get("mask_body_keys")
    return _LoggingMiddleware(prefix, mask_body_keys)


class _UserAgentMiddleware:
    """Sets ``User-Agent`` and ``sfdc_user_agent`` on every request."""

    def __init__(self, user_agent: str) -> None:
        self._user_agent = user_agent

    async def on_request(self, ctx: MiddlewareRequestContext) -> httpx.Request | None:
        ctx.request.headers["User-Agent"] = self._user_agent
        ctx.request.headers["sfdc_user_agent"] = self._user_agent
        return ctx.request

    async def on_response(self, ctx: MiddlewareResponseContext) -> httpx.Response | None:
        return ctx.response


def create_user_agent_middleware(user_agent: str) -> _UserAgentMiddleware:
    """Create middleware that sets ``User-Agent`` and ``sfdc_user_agent`` headers."""
    return _UserAgentMiddleware(user_agent)


class _ExtraParamsMiddleware:
    """Adds extra headers, query parameters, and/or JSON body fields to requests."""

    def __init__(
        self,
        *,
        query: dict[str, Any] | None,
        body: dict[str, Any] | None,
        headers: dict[str, str] | None,
    ) -> None:
        self._query = query
        self._body = body
        self._headers = headers
        self._logger = get_logger("clients.middleware")

    async def on_request(self, ctx: MiddlewareRequestContext) -> httpx.Request | None:
        request = ctx.request
        method_no_body = request.method.upper() in ("GET", "HEAD")

        headers = httpx.Headers(request.headers)
        if self._headers:
            for key, value in self._headers.items():
                headers[key] = value

        url = request.url
        if self._query:
            params = dict(url.params)
            for key, value in self._query.items():
                if value is not None:
                    params[key] = str(value)
            url = url.copy_with(params=httpx.QueryParams(params))

        content = request.content
        if self._body and not method_no_body:
            content_type = headers.get("content-type")
            if content_type and "application/json" in content_type and request.content:
                parsed = _try_parse_json(request.content.decode("utf-8", "replace"))
                if isinstance(parsed, dict):
                    merged = {**parsed, **self._body}
                    content = json_module.dumps(merged).encode("utf-8")
                else:
                    self._logger.warning("[ExtraParams] Could not parse request body as JSON, skipping body merge")
            elif not request.content:
                headers["content-type"] = "application/json"
                content = json_module.dumps(self._body).encode("utf-8")

        return httpx.Request(request.method, url, headers=headers, content=content)

    async def on_response(self, ctx: MiddlewareResponseContext) -> httpx.Response | None:
        return ctx.response


def create_extra_params_middleware(
    *,
    query: dict[str, Any] | None = None,
    body: dict[str, Any] | None = None,
    headers: dict[str, str] | None = None,
) -> _ExtraParamsMiddleware:
    """Create middleware that adds extra query params, body fields, and/or headers.

    Useful for internal/power-user parameters not present in the typed schema.
    """
    return _ExtraParamsMiddleware(query=query, body=body, headers=headers)


def _request_identity(request: httpx.Request) -> bytes:
    """A stable per-request key (method + URL) for retry de-duplication."""
    return f"{request.method} {request.url}".encode()


__all__ = [
    "SCOPE_MODE_HEADER",
    "ScopeCascade",
    "create_auth_middleware",
    "create_extra_params_middleware",
    "create_logging_middleware",
    "create_rate_limit_middleware",
    "create_scapi_auth_middleware",
    "create_user_agent_middleware",
]
