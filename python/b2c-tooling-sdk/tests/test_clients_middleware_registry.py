# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for the HTTP middleware registry.

Mirrors ``packages/b2c-tooling-sdk/test/clients/middleware-registry.test.ts``.
"""

from __future__ import annotations

import httpx

from b2c_tooling_sdk.clients._core import MiddlewareRequestContext
from b2c_tooling_sdk.clients.middleware_registry import HttpClientType, MiddlewareRegistry, UnifiedMiddleware


class _NullProvider:
    """Provider that returns no middleware for any client type."""

    def __init__(self, name: str) -> None:
        self.name = name

    def get_middleware(self, client_type: HttpClientType) -> UnifiedMiddleware | None:
        return None


class _HeaderMiddleware:
    """Middleware that stamps a header on the request (identity-comparable)."""

    def __init__(self, header: str, value: str) -> None:
        self._header = header
        self._value = value

    async def on_request(self, ctx: MiddlewareRequestContext) -> httpx.Request | None:
        ctx.request.headers[self._header] = self._value
        return ctx.request

    async def on_response(self, ctx: object) -> None:
        return None


class _FixedProvider:
    """Provider that always returns the same middleware instance."""

    def __init__(self, name: str, middleware: UnifiedMiddleware) -> None:
        self.name = name
        self._middleware = middleware

    def get_middleware(self, client_type: HttpClientType) -> UnifiedMiddleware | None:
        return self._middleware


def test_register_adds_providers_and_get_provider_names_returns_them() -> None:
    registry = MiddlewareRegistry()
    registry.register(_NullProvider("p1"))
    registry.register(_NullProvider("p2"))

    assert registry.size == 2
    assert registry.get_provider_names() == ["p1", "p2"]


def test_unregister_removes_existing_provider_by_name() -> None:
    registry = MiddlewareRegistry()
    registry.register(_NullProvider("p1"))

    assert registry.size == 1
    assert registry.unregister("p1") is True
    assert registry.size == 0


def test_unregister_returns_false_when_provider_missing() -> None:
    registry = MiddlewareRegistry()
    registry.register(_NullProvider("p1"))

    assert registry.unregister("missing") is False
    assert registry.size == 1


def test_get_middleware_returns_in_order_and_skips_none() -> None:
    registry = MiddlewareRegistry()
    m1 = _HeaderMiddleware("x-m1", "1")
    m2 = _HeaderMiddleware("x-m2", "2")

    registry.register(_NullProvider("skip"))
    registry.register(_FixedProvider("p1", m1))
    registry.register(_FixedProvider("p2", m2))

    middlewares = registry.get_middleware("ocapi")
    assert len(middlewares) == 2
    assert middlewares[0] is m1
    assert middlewares[1] is m2


def test_clear_removes_all_providers() -> None:
    registry = MiddlewareRegistry()
    registry.register(_NullProvider("p1"))

    assert registry.size == 1
    registry.clear()
    assert registry.size == 0
    assert registry.get_provider_names() == []
