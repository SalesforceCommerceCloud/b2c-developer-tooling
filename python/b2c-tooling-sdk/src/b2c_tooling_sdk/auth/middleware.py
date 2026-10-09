# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Auth middleware registry for the B2C SDK.

Mirrors ``src/auth/middleware.ts``. Provides a middleware system specifically for
authentication requests (OAuth token requests), separate from the HTTP client
middleware chain because auth requests bypass the typed-client pipeline. The
primary use is injecting a ``User-Agent`` header onto token requests.

Middleware operates on :class:`httpx.Request` / :class:`httpx.Response` objects.
An ``on_request`` hook may mutate the request in place and return ``None`` (or
return a replacement request); likewise for ``on_response``.
"""

from __future__ import annotations

from typing import Protocol, runtime_checkable

import httpx


@runtime_checkable
class AuthMiddleware(Protocol):
    """Middleware for authentication requests (analogous to openapi-fetch middleware)."""

    async def on_request(self, request: httpx.Request) -> httpx.Request | None:
        """Called before the auth request is sent; may mutate or replace it."""
        ...

    async def on_response(self, request: httpx.Request, response: httpx.Response) -> httpx.Response | None:
        """Called after the auth response is received; may mutate or replace it."""
        ...


@runtime_checkable
class AuthMiddlewareProvider(Protocol):
    """Supplies :class:`AuthMiddleware` for auth requests."""

    name: str

    def get_middleware(self) -> AuthMiddleware | None:
        """Return middleware to apply, or ``None`` to skip."""
        ...


class AuthMiddlewareRegistry:
    """Collects middleware from providers, returning them in registration order."""

    def __init__(self) -> None:
        self._providers: list[AuthMiddlewareProvider] = []

    def register(self, provider: AuthMiddlewareProvider) -> None:
        """Register a middleware provider."""
        self._providers.append(provider)

    def unregister(self, name: str) -> bool:
        """Remove a provider by name; return ``True`` if one was removed."""
        for i, provider in enumerate(self._providers):
            if provider.name == name:
                del self._providers[i]
                return True
        return False

    def get_middleware(self) -> list[AuthMiddleware]:
        """Collect middleware from all providers, in registration order."""
        middleware: list[AuthMiddleware] = []
        for provider in self._providers:
            m = provider.get_middleware()
            if m is not None:
                middleware.append(m)
        return middleware

    def clear(self) -> None:
        """Clear all registered providers (primarily for testing)."""
        self._providers = []

    @property
    def size(self) -> int:
        """Number of registered providers."""
        return len(self._providers)

    def get_provider_names(self) -> list[str]:
        """Return the names of all registered providers."""
        return [p.name for p in self._providers]


#: Default registry used by OAuth strategies. Register providers here to have
#: them applied to token requests.
global_auth_middleware_registry = AuthMiddlewareRegistry()


async def apply_auth_request_middleware(request: httpx.Request, middleware: list[AuthMiddleware]) -> httpx.Request:
    """Apply every ``on_request`` hook in order, accumulating modifications."""
    current = request
    for m in middleware:
        on_request = getattr(m, "on_request", None)
        if on_request is not None:
            result = await on_request(current)
            if result is not None:
                current = result
    return current


async def apply_auth_response_middleware(
    request: httpx.Request,
    response: httpx.Response,
    middleware: list[AuthMiddleware],
) -> httpx.Response:
    """Apply every ``on_response`` hook in order, accumulating modifications."""
    current = response
    for m in middleware:
        on_response = getattr(m, "on_response", None)
        if on_response is not None:
            result = await on_response(request, current)
            if result is not None:
                current = result
    return current


__all__ = [
    "AuthMiddleware",
    "AuthMiddlewareProvider",
    "AuthMiddlewareRegistry",
    "global_auth_middleware_registry",
    "apply_auth_request_middleware",
    "apply_auth_response_middleware",
]
