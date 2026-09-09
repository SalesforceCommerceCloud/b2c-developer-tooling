# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Core authentication types: the ``AuthStrategy`` protocol and config models.

Mirrors ``src/auth/types.ts``. An :class:`AuthStrategy` performs authenticated
HTTP requests, handling header injection and 401 retry/refresh internally. The
optional methods (:meth:`get_authorization_header`, :meth:`invalidate_token`,
:meth:`with_additional_scopes`, :meth:`get_access_token_for_cascade`) let SCAPI
client factories request tenant/per-operation scopes; non-OAuth strategies
(basic, api-key) simply omit them.
"""

from __future__ import annotations

from collections.abc import Awaitable, Callable
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Literal, Protocol, runtime_checkable

import httpx

#: Available authentication methods.
AuthMethod = Literal["client-credentials", "jwt", "user", "implicit", "basic", "api-key"]

#: All available auth methods in default priority order.
ALL_AUTH_METHODS: list[AuthMethod] = [
    "client-credentials",
    "jwt",
    "user",
    "implicit",
    "basic",
    "api-key",
]


@dataclass
class AccessTokenResponse:
    """Access token response from Account Manager."""

    access_token: str
    expires: datetime
    scopes: list[str]


@dataclass
class DecodedJWT:
    """A decoded (unverified) JWT."""

    header: dict[str, Any]
    payload: dict[str, Any]


@runtime_checkable
class AuthStrategy(Protocol):
    """Protocol implemented by every authentication strategy.

    Implementations must inject the auth header and handle their own 401
    retry/refresh inside :meth:`fetch`.
    """

    async def fetch(
        self,
        url: str,
        *,
        method: str = "GET",
        headers: dict[str, str] | None = None,
        content: Any = None,
        **kwargs: Any,
    ) -> httpx.Response:
        """Perform an authenticated request and return the response."""
        ...


@runtime_checkable
class ScopedAuthStrategy(AuthStrategy, Protocol):
    """An :class:`AuthStrategy` that can also mint/return tokens and manage scopes."""

    async def get_authorization_header(self) -> str:
        """Return the full ``Authorization`` header value (e.g. ``Bearer ...``)."""
        ...

    def invalidate_token(self) -> None:
        """Invalidate the cached token, forcing re-auth on the next request."""
        ...

    def with_additional_scopes(self, additional_scopes: list[str]) -> ScopedAuthStrategy:
        """Return a copy of this strategy with ``additional_scopes`` merged in."""
        ...

    async def get_access_token_for_cascade(self, candidates: list[list[str]]) -> str:
        """Resolve a scope cascade, returning the first token Account Manager accepts."""
        ...


@dataclass
class BasicAuthConfig:
    """Basic authentication (username / access-key). Used for WebDAV."""

    username: str
    password: str


@dataclass
class OAuthAuthConfig:
    """OAuth authentication configuration for OCAPI / platform APIs."""

    client_id: str
    client_secret: str | None = None
    scopes: list[str] | None = None
    account_manager_host: str | None = None
    jwt_cert_path: str | None = None
    jwt_key_path: str | None = None
    jwt_passphrase: str | None = None
    redirect_uri: str | None = None
    open_browser: Callable[[str], Awaitable[None]] | None = None


@dataclass
class ApiKeyAuthConfig:
    """API key authentication (MRT and external services)."""

    key: str
    header_name: str | None = None


@dataclass
class AuthConfig:
    """Combined authentication configuration used by :class:`B2CInstance`."""

    basic: BasicAuthConfig | None = None
    oauth: OAuthAuthConfig | None = None
    api_key: ApiKeyAuthConfig | None = None
    auth_methods: list[AuthMethod] | None = None


@dataclass
class AuthCredentials:
    """Flat credential bundle accepted by :func:`resolve_auth_strategy`."""

    client_id: str | None = None
    client_secret: str | None = None
    scopes: list[str] | None = None
    account_manager_host: str | None = None
    username: str | None = None
    password: str | None = None
    api_key: str | None = None
    api_key_header_name: str | None = None
    redirect_uri: str | None = None
    open_browser: Callable[[str], Awaitable[None]] | None = None
    extra: dict[str, Any] = field(default_factory=dict)


__all__ = [
    "AuthMethod",
    "ALL_AUTH_METHODS",
    "AccessTokenResponse",
    "DecodedJWT",
    "AuthStrategy",
    "ScopedAuthStrategy",
    "BasicAuthConfig",
    "OAuthAuthConfig",
    "ApiKeyAuthConfig",
    "AuthConfig",
    "AuthCredentials",
]
