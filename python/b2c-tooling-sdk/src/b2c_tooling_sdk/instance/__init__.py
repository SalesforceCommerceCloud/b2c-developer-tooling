# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""B2C instance management.

Mirrors ``src/instance/index.ts``. The :class:`B2CInstance` class represents a
connection to a specific B2C Commerce instance, combining instance configuration
with authentication to provide lazy, typed API clients (WebDAV, OCAPI).

Typically an instance is built from resolved configuration
(``resolve_config(...).create_b2c_instance()``) rather than constructed directly.
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from typing import Literal

from b2c_tooling_sdk.auth.basic import BasicAuthStrategy
from b2c_tooling_sdk.auth.oauth import OAuthConfig, OAuthStrategy
from b2c_tooling_sdk.auth.oauth_jwt import JwtOAuthConfig, JwtOAuthStrategy
from b2c_tooling_sdk.auth.resolve import resolve_auth_strategy
from b2c_tooling_sdk.auth.types import AuthConfig, AuthCredentials, AuthMethod, AuthStrategy
from b2c_tooling_sdk.clients.ocapi import OcapiClient, create_ocapi_client
from b2c_tooling_sdk.clients.tls import TlsOptions, create_tls_transport
from b2c_tooling_sdk.clients.webdav import WebDavClient
from b2c_tooling_sdk.defaults import DEFAULT_ACCOUNT_MANAGER_HOST

ApiBackend = Literal["ocapi", "scapi", "auto"]

#: OAuth methods eligible for the OCAPI / WebDAV OAuth path (JWT is equivalent to
#: client-credentials once it holds an AM token).
_OAUTH_METHODS: list[AuthMethod] = ["client-credentials", "jwt", "user", "implicit"]

#: Stateless, scope-flexible methods eligible for SCAPI (can request arbitrary
#: ``sfcc.*`` scopes from Account Manager per request).
_SYSTEM_METHODS: list[AuthMethod] = ["client-credentials", "jwt"]


@dataclass
class ScapiClientConfig:
    """SCAPI connection coordinates plus a scope-flexible auth strategy.

    Returned by :attr:`B2CInstance.scapi_client_config` only when the instance
    carries both a ``short_code`` and ``tenant_id`` and is configured with a
    stateless OAuth flow (client-credentials or JWT Bearer) able to request
    arbitrary ``sfcc.*`` scopes per request.
    """

    short_code: str
    tenant_id: str
    auth: AuthStrategy


@dataclass
class InstanceConfig:
    """Instance configuration (hostname, code version, SCAPI coordinates, TLS)."""

    hostname: str
    code_version: str | None = None
    webdav_hostname: str | None = None
    tls_options: TlsOptions | None = None
    short_code: str | None = None
    tenant_id: str | None = None
    api_backend: ApiBackend | None = None


@dataclass
class B2CInstanceOptions:
    """Optional runtime dependencies for a :class:`B2CInstance`.

    ``oauth_strategy`` lets callers reuse their own session-aware auth resolution
    (PKCE refresh, implicit fallback) without eagerly starting browser auth for
    Basic-only WebDAV work. It may be a strategy instance or a zero-arg factory.
    """

    oauth_strategy: AuthStrategy | Callable[[], AuthStrategy] | None = None


class B2CInstance:
    """Represents a connection to a B2C Commerce instance.

    Provides lazy, typed API clients for WebDAV and OCAPI. Authentication is
    handled automatically based on the configured credentials: WebDAV prefers
    Basic auth when configured and allowed, otherwise falls back to OAuth; OCAPI
    always uses OAuth.
    """

    def __init__(
        self,
        config: InstanceConfig,
        auth: AuthConfig,
        options: B2CInstanceOptions | None = None,
    ) -> None:
        self.config = config
        self.auth = auth
        self._options = options or B2CInstanceOptions()
        self._webdav: WebDavClient | None = None
        self._ocapi: OcapiClient | None = None
        self._oauth_strategy: AuthStrategy | None = None

    @property
    def webdav_hostname(self) -> str:
        """The hostname used for WebDAV operations (falls back to the main hostname)."""
        return self.config.webdav_hostname or self.config.hostname

    @property
    def api_backend(self) -> ApiBackend:
        """Backend preference for dual-backend operations (defaults to ``"auto"``)."""
        return self.config.api_backend or "auto"

    @property
    def scapi_client_config(self) -> ScapiClientConfig | None:
        """SCAPI coordinates + a scope-flexible auth strategy, or ``None`` if unavailable.

        Returns ``None`` unless ``short_code`` and ``tenant_id`` are configured
        **and** the configured OAuth flow is stateless (client-credentials or JWT
        Bearer). Browser user-auth and fixed-token sessions are excluded because
        SCAPI Admin APIs require system authentication that can request ``sfcc.*``
        scopes per request.
        """
        short_code = self.config.short_code
        tenant_id = self.config.tenant_id
        if not short_code or not tenant_id:
            return None
        auth = self._build_scapi_auth_strategy()
        if auth is None:
            return None
        return ScapiClientConfig(short_code=short_code, tenant_id=tenant_id, auth=auth)

    @property
    def webdav(self) -> WebDavClient:
        """Lazy WebDAV client for file operations."""
        if self._webdav is None:
            transport = create_tls_transport(self.config.tls_options) if self.config.tls_options else None
            self._webdav = WebDavClient(
                self.webdav_hostname,
                self._get_webdav_auth_strategy(),
                transport=transport,
            )
        return self._webdav

    @property
    def ocapi(self) -> OcapiClient:
        """Lazy OCAPI Data API client (always uses OAuth)."""
        if self._ocapi is None:
            self._ocapi = create_ocapi_client(self.config.hostname, self._get_oauth_strategy())
        return self._ocapi

    def _get_webdav_auth_strategy(self) -> AuthStrategy:
        """Return the WebDAV auth strategy (Basic first when allowed, else OAuth)."""
        webdav_methods = self.auth.auth_methods or ["basic", "client-credentials", "user"]
        if "basic" in webdav_methods and self.auth.basic:
            return BasicAuthStrategy(self.auth.basic.username, self.auth.basic.password)
        return self._get_oauth_strategy()

    def _get_oauth_strategy(self) -> AuthStrategy:
        """Return the OAuth strategy, selecting the best allowed method.

        :raises ValueError: when no valid OAuth method is available.
        """
        if self._oauth_strategy is not None:
            return self._oauth_strategy

        configured = self._options.oauth_strategy
        if configured is not None:
            self._oauth_strategy = configured() if callable(configured) else configured
            return self._oauth_strategy

        if not self.auth.oauth:
            raise ValueError("OAuth credentials required. Provide at least client_id.")

        oauth = self.auth.oauth
        credentials = AuthCredentials(
            client_id=oauth.client_id,
            client_secret=oauth.client_secret,
            scopes=oauth.scopes,
            account_manager_host=oauth.account_manager_host,
            redirect_uri=oauth.redirect_uri,
            open_browser=getattr(oauth, "open_browser", None),
        )

        oauth_methods = [m for m in (self.auth.auth_methods or _OAUTH_METHODS) if m in _OAUTH_METHODS]
        if not oauth_methods:
            raise ValueError("No OAuth methods allowed. Check auth_methods configuration.")

        for method in oauth_methods:
            if method in ("client-credentials", "jwt"):
                system_strategy = self._build_system_oauth_strategy(method)
                if system_strategy is not None:
                    self._oauth_strategy = system_strategy
                    return self._oauth_strategy
                continue
            if credentials.client_id:
                self._oauth_strategy = resolve_auth_strategy(credentials, allowed_methods=[method])
                return self._oauth_strategy

        raise ValueError(f"No valid OAuth method available. Allowed methods: [{', '.join(oauth_methods)}].")

    def _build_scapi_auth_strategy(self) -> AuthStrategy | None:
        """Build the scope-flexible OAuth strategy for SCAPI, or ``None`` if ineligible."""
        if not self.auth.oauth:
            return None
        methods = self.auth.auth_methods or _SYSTEM_METHODS
        for method in methods:
            if method in ("client-credentials", "jwt"):
                strategy = self._build_system_oauth_strategy(method)
                if strategy is not None:
                    return strategy
        return None

    def _build_system_oauth_strategy(self, method: str) -> AuthStrategy | None:
        """Build a non-interactive OAuth strategy (client-credentials or JWT) or ``None``."""
        oauth = self.auth.oauth
        if not oauth:
            return None
        account_manager_host = oauth.account_manager_host or DEFAULT_ACCOUNT_MANAGER_HOST

        if method == "client-credentials" and oauth.client_secret:
            return OAuthStrategy(
                OAuthConfig(
                    client_id=oauth.client_id,
                    client_secret=oauth.client_secret,
                    scopes=oauth.scopes,
                    account_manager_host=account_manager_host,
                )
            )

        if method == "jwt" and oauth.jwt_cert_path and oauth.jwt_key_path:
            return JwtOAuthStrategy(
                JwtOAuthConfig(
                    client_id=oauth.client_id,
                    cert_path=oauth.jwt_cert_path,
                    key_path=oauth.jwt_key_path,
                    passphrase=oauth.jwt_passphrase,
                    account_manager_host=account_manager_host,
                    scopes=oauth.scopes,
                )
            )

        return None


__all__ = [
    "ApiBackend",
    "B2CInstance",
    "B2CInstanceOptions",
    "InstanceConfig",
    "ScapiClientConfig",
]
