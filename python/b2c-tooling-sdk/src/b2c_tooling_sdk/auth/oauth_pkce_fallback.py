# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Transitional PKCE→implicit fallback auth strategy.

Mirrors ``src/auth/oauth-pkce-fallback.ts``. Prefers Authorization Code + PKCE
but automatically falls back to the deprecated implicit flow when the configured
Account Manager client is not (yet) registered for the PKCE grant (signalled by
:class:`PkceGrantUnsupportedError`). The fallback is attempted at most once and
then sticks for the lifetime of the instance.

This is a temporary migration aid. Once all public clients are PKCE-capable,
delete this module and stop constructing it. Disable it in the meantime via the
``SFCC_DISABLE_PKCE_FALLBACK`` environment variable.
"""

from __future__ import annotations

import os
from typing import Any

import httpx

from b2c_tooling_sdk.auth.oauth_implicit import ImplicitOAuthConfig, ImplicitOAuthStrategy
from b2c_tooling_sdk.auth.oauth_pkce import PkceGrantUnsupportedError, PkceOAuthConfig, PkceOAuthStrategy
from b2c_tooling_sdk.auth.session_store import find_auth_session
from b2c_tooling_sdk.auth.types import AccessTokenResponse, DecodedJWT
from b2c_tooling_sdk.defaults import DEFAULT_ACCOUNT_MANAGER_HOST
from b2c_tooling_sdk.logging import get_logger


def is_pkce_fallback_disabled() -> bool:
    """True when ``SFCC_DISABLE_PKCE_FALLBACK`` is set to any truthy value."""
    value = os.environ.get("SFCC_DISABLE_PKCE_FALLBACK")
    return value is not None and value != "" and value != "0" and value.lower() != "false"


class PkceWithImplicitFallbackStrategy:
    """Wraps a :class:`PkceOAuthStrategy`, falling back to implicit on a grant error."""

    auth_method = "user"

    def __init__(self, config: PkceOAuthConfig) -> None:
        self._config = config
        self._logger = get_logger("auth.oauth_pkce_fallback")
        self._pkce = PkceOAuthStrategy(config)
        self._implicit: ImplicitOAuthStrategy | None = None
        self._use_implicit = self._has_persisted_unsupported_marker()
        if self._use_implicit:
            self._logger.warning(
                "[Auth] Skipping Authorization Code + PKCE for client %s because Account Manager previously "
                "rejected that grant. Using the deprecated implicit flow. Recommend creating a new public "
                "(PKCE) client in Account Manager and using it to remove this warning.",
                self._config.client_id,
            )

    async def fetch(
        self,
        url: str,
        *,
        method: str = "GET",
        headers: dict[str, str] | None = None,
        content: Any = None,
        dispatcher: httpx.AsyncBaseTransport | None = None,
        **kwargs: Any,
    ) -> httpx.Response:
        """Fetch via PKCE, falling back to implicit on a grant-unsupported error."""
        if self._use_implicit:
            return await self._get_implicit().fetch(
                url, method=method, headers=headers, content=content, dispatcher=dispatcher, **kwargs
            )
        try:
            return await self._pkce.fetch(
                url, method=method, headers=headers, content=content, dispatcher=dispatcher, **kwargs
            )
        except PkceGrantUnsupportedError as error:
            self._warn_and_switch(error)
            return await self._get_implicit().fetch(
                url, method=method, headers=headers, content=content, dispatcher=dispatcher, **kwargs
            )

    async def get_authorization_header(self) -> str:
        """Return the ``Authorization`` header, falling back to implicit on a grant error."""
        if self._use_implicit:
            return await self._get_implicit().get_authorization_header()
        try:
            return await self._pkce.get_authorization_header()
        except PkceGrantUnsupportedError as error:
            self._warn_and_switch(error)
            return await self._get_implicit().get_authorization_header()

    async def get_jwt(self) -> DecodedJWT:
        """Return the decoded access-token JWT, falling back to implicit on a grant error."""
        if self._use_implicit:
            return await self._get_implicit().get_jwt()
        try:
            return await self._pkce.get_jwt()
        except PkceGrantUnsupportedError as error:
            self._warn_and_switch(error)
            return await self._get_implicit().get_jwt()

    async def get_token_response(self) -> AccessTokenResponse:
        """Return the full token response, falling back to implicit on a grant error."""
        if self._use_implicit:
            return await self._get_implicit().get_token_response()
        try:
            return await self._pkce.get_token_response()
        except PkceGrantUnsupportedError as error:
            self._warn_and_switch(error)
            return await self._get_implicit().get_token_response()

    def invalidate_token(self) -> None:
        """Invalidate cached tokens on both the PKCE and (if present) implicit strategies."""
        self._pkce.invalidate_token()
        if self._implicit is not None:
            self._implicit.invalidate_token()

    def _warn_and_switch(self, error: PkceGrantUnsupportedError) -> None:
        self._use_implicit = True
        self._logger.warning(
            "[Auth] Authorization Code + PKCE failed for client %s (%s). Falling back to the deprecated implicit "
            "flow. Recommend creating a new public (PKCE) client in Account Manager and using it to remove this "
            "warning. See https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/authentication.html"
            "#implicit-flow-deprecation",
            self._config.client_id,
            error.oauth_error or str(error),
        )

    def _get_implicit(self) -> ImplicitOAuthStrategy:
        if self._implicit is None:
            self._implicit = ImplicitOAuthStrategy(
                ImplicitOAuthConfig(
                    client_id=self._config.client_id,
                    scopes=self._config.scopes,
                    account_manager_host=self._config.account_manager_host,
                    local_port=self._config.local_port,
                    redirect_uri=self._config.redirect_uri,
                    open_browser=self._config.open_browser,
                    persist_session=self._config.persist_session,
                    pkce_unsupported=True,
                )
            )
        return self._implicit

    @property
    def _account_manager_host(self) -> str:
        return (self._config.account_manager_host or DEFAULT_ACCOUNT_MANAGER_HOST).lower()

    def _has_persisted_unsupported_marker(self) -> bool:
        if self._config.persist_session is False:
            return False
        try:
            stored = find_auth_session(self._config.client_id)
            return (
                stored is not None
                and stored.flow == "implicit"
                and stored.pkce_unsupported is True
                and (stored.account_manager_host or "").lower() == self._account_manager_host
            )
        except Exception as error:  # noqa: BLE001 - marker inspection is best-effort
            self._logger.debug("Failed to inspect persisted PKCE fallback marker: %s", error)
            return False


def create_user_auth_strategy(config: PkceOAuthConfig) -> PkceOAuthStrategy | PkceWithImplicitFallbackStrategy:
    """Build the browser-based "user" auth strategy.

    Returns a plain :class:`PkceOAuthStrategy` when the fallback is disabled
    (``SFCC_DISABLE_PKCE_FALLBACK``), otherwise a
    :class:`PkceWithImplicitFallbackStrategy`.
    """
    if is_pkce_fallback_disabled():
        return PkceOAuthStrategy(config)
    return PkceWithImplicitFallbackStrategy(config)


__all__ = [
    "PkceWithImplicitFallbackStrategy",
    "create_user_auth_strategy",
    "is_pkce_fallback_disabled",
]
