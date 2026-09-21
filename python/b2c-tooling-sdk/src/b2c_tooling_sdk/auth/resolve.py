# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Auth strategy resolution utilities.

Mirrors ``src/auth/resolve.ts``. Automatically selects and creates the
appropriate authentication strategy based on available credentials and allowed
methods.

Example::

    from b2c_tooling_sdk.auth import AuthCredentials, resolve_auth_strategy

    strategy = resolve_auth_strategy(
        AuthCredentials(client_id="my-client-id", client_secret="secret")
    )
    response = await strategy.fetch("https://example.com/api")

Note: the ``"jwt"`` method is defined in :data:`AuthMethod` but is not
automatically resolvable here, because JWT auth requires file paths
(cert/key) that are not part of the generic :class:`AuthCredentials`. To use
JWT, instantiate :class:`JwtOAuthStrategy` directly.
"""

from __future__ import annotations

from dataclasses import dataclass

from b2c_tooling_sdk.auth.api_key import ApiKeyStrategy
from b2c_tooling_sdk.auth.basic import BasicAuthStrategy
from b2c_tooling_sdk.auth.oauth import OAuthConfig, OAuthStrategy
from b2c_tooling_sdk.auth.oauth_implicit import ImplicitOAuthConfig, ImplicitOAuthStrategy
from b2c_tooling_sdk.auth.oauth_pkce import PkceOAuthConfig
from b2c_tooling_sdk.auth.oauth_pkce_fallback import create_user_auth_strategy
from b2c_tooling_sdk.auth.types import ALL_AUTH_METHODS, AuthCredentials, AuthMethod, AuthStrategy


@dataclass
class UnavailableAuthMethod:
    """A method that is missing at least one required credential."""

    method: AuthMethod
    reason: str


@dataclass
class AvailableAuthMethods:
    """Result of checking which auth methods have credentials available."""

    available: list[AuthMethod]
    unavailable: list[UnavailableAuthMethod]


def check_available_auth_methods(
    credentials: AuthCredentials,
    allowed_methods: list[AuthMethod] | None = None,
) -> AvailableAuthMethods:
    """Check which auth methods have the required credentials available.

    :param credentials: The available credentials.
    :param allowed_methods: Methods to check (defaults to :data:`ALL_AUTH_METHODS`).
    :returns: The available and unavailable methods.
    """
    methods = allowed_methods if allowed_methods is not None else ALL_AUTH_METHODS
    available: list[AuthMethod] = []
    unavailable: list[UnavailableAuthMethod] = []

    for method in methods:
        if method == "client-credentials":
            if credentials.client_id and credentials.client_secret:
                available.append(method)
            elif not credentials.client_id:
                unavailable.append(UnavailableAuthMethod(method, "clientId is required"))
            else:
                unavailable.append(UnavailableAuthMethod(method, "clientSecret is required"))
        elif method in ("user", "implicit"):
            if credentials.client_id:
                available.append(method)
            else:
                unavailable.append(UnavailableAuthMethod(method, "clientId is required"))
        elif method == "basic":
            if credentials.username and credentials.password:
                available.append(method)
            elif not credentials.username:
                unavailable.append(UnavailableAuthMethod(method, "username is required"))
            else:
                unavailable.append(UnavailableAuthMethod(method, "password is required"))
        elif method == "api-key":
            if credentials.api_key:
                available.append(method)
            else:
                unavailable.append(UnavailableAuthMethod(method, "apiKey is required"))

    return AvailableAuthMethods(available=available, unavailable=unavailable)


def resolve_auth_strategy(
    credentials: AuthCredentials,
    allowed_methods: list[AuthMethod] | None = None,
) -> AuthStrategy:
    """Resolve and create the appropriate auth strategy.

    Iterates through allowed methods in priority order and returns the first
    strategy for which the required credentials are available.

    :param credentials: The available credentials.
    :param allowed_methods: Allowed methods in priority order (defaults to
        :data:`ALL_AUTH_METHODS`, where PKCE-based ``user`` auth is preferred over
        the deprecated ``implicit`` flow).
    :raises RuntimeError: if no allowed method has the required credentials.
    """
    methods = allowed_methods if allowed_methods is not None else ALL_AUTH_METHODS

    for method in methods:
        if method == "client-credentials":
            if credentials.client_id and credentials.client_secret:
                return OAuthStrategy(
                    OAuthConfig(
                        client_id=credentials.client_id,
                        client_secret=credentials.client_secret,
                        scopes=credentials.scopes,
                        account_manager_host=credentials.account_manager_host,
                    )
                )
        elif method == "user":
            if credentials.client_id:
                # PKCE with an automatic, WARN-logged fallback to the implicit flow
                # for clients not yet registered for PKCE (see oauth_pkce_fallback).
                return create_user_auth_strategy(
                    PkceOAuthConfig(
                        client_id=credentials.client_id,
                        scopes=credentials.scopes,
                        account_manager_host=credentials.account_manager_host,
                        redirect_uri=credentials.redirect_uri,
                        open_browser=credentials.open_browser,
                    )
                )
        elif method == "implicit":
            if credentials.client_id:
                return ImplicitOAuthStrategy(
                    ImplicitOAuthConfig(
                        client_id=credentials.client_id,
                        scopes=credentials.scopes,
                        account_manager_host=credentials.account_manager_host,
                        redirect_uri=credentials.redirect_uri,
                        open_browser=credentials.open_browser,
                    )
                )
        elif method == "basic":
            if credentials.username and credentials.password:
                return BasicAuthStrategy(credentials.username, credentials.password)
        elif method == "api-key" and credentials.api_key:
            return ApiKeyStrategy(credentials.api_key, credentials.api_key_header_name or "x-api-key")

    # Build a helpful error message.
    result = check_available_auth_methods(credentials, methods)
    details = "; ".join(f"{u.method}: {u.reason}" for u in result.unavailable)
    allowed = ", ".join(methods)
    raise RuntimeError(f"No valid auth method available. Allowed methods: [{allowed}]. Missing credentials: {details}")


__all__ = [
    "AvailableAuthMethods",
    "UnavailableAuthMethod",
    "check_available_auth_methods",
    "resolve_auth_strategy",
]
