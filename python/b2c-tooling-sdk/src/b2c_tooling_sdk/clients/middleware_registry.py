# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""HTTP middleware registry for the B2C SDK.

Mirrors ``src/clients/middleware-registry.ts``. Provides a unified middleware
system shared across all HTTP clients (the typed :class:`~b2c_tooling_sdk.clients._core.HttpClient`
clients and the WebDAV client). Providers register with the global registry and
supply per-client-type middleware; client factories collect that middleware in
registration order.
"""

from __future__ import annotations

from typing import Literal, Protocol, runtime_checkable

from b2c_tooling_sdk.clients._core import Middleware

#: Types of HTTP clients that can receive middleware.
HttpClientType = Literal[
    "cip",
    "ocapi",
    "slas",
    "ods",
    "mrt",
    "mrt-b2c",
    "custom-apis",
    "scapi-schemas",
    "metrics",
    "cdn-zones",
    "granular-replications",
    "preferences",
    "webdav",
    "am-users-api",
    "am-roles-api",
    "am-apiclients-api",
    "am-orgs-api",
    "scapi-jobs",
    "scapi-scripts",
    "scapi-merchant-users",
    "scapi-merchant-roles",
    "scapi-sites",
    "scapi-catalogs",
]

#: Middleware interface compatible with the typed clients and WebDAV. Alias of
#: :class:`~b2c_tooling_sdk.clients._core.Middleware`, re-exported for convenience.
UnifiedMiddleware = Middleware


@runtime_checkable
class HttpMiddlewareProvider(Protocol):
    """Supplies middleware for HTTP clients.

    Providers can return different middleware per client type, or ``None`` to
    skip a client type.
    """

    name: str

    def get_middleware(self, client_type: HttpClientType) -> UnifiedMiddleware | None:
        """Return middleware for ``client_type``, or ``None`` to skip it."""
        ...


class MiddlewareRegistry:
    """Registry for HTTP middleware providers.

    Collects middleware from registered providers and returns it in registration
    order when requested by a client factory.
    """

    def __init__(self) -> None:
        self._providers: list[HttpMiddlewareProvider] = []

    def register(self, provider: HttpMiddlewareProvider) -> None:
        """Register a middleware provider (called in registration order)."""
        self._providers.append(provider)

    def unregister(self, name: str) -> bool:
        """Remove a provider by name; return ``True`` if one was removed."""
        for i, provider in enumerate(self._providers):
            if provider.name == name:
                del self._providers[i]
                return True
        return False

    def get_middleware(self, client_type: HttpClientType) -> list[UnifiedMiddleware]:
        """Collect middleware from all providers for ``client_type``, in order."""
        middleware: list[UnifiedMiddleware] = []
        for provider in self._providers:
            m = provider.get_middleware(client_type)
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


#: Global middleware registry used by all B2C SDK clients by default.
global_middleware_registry = MiddlewareRegistry()


__all__ = [
    "HttpClientType",
    "HttpMiddlewareProvider",
    "MiddlewareRegistry",
    "UnifiedMiddleware",
    "global_middleware_registry",
]
