# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Authentication strategies and helpers for the B2C tooling SDK.

Mirrors the ``@salesforce/b2c-tooling-sdk/auth`` subpath export. Each strategy
implements the :class:`AuthStrategy` protocol (an async ``fetch`` that injects
credentials and handles retry/refresh). The persistent session store here reads
and writes the *same* ``auth-sessions.json`` file as the B2C CLI, so tokens are
shared across the Python and TypeScript tooling.
"""

from __future__ import annotations

from b2c_tooling_sdk.auth.api_key import ApiKeyStrategy
from b2c_tooling_sdk.auth.basic import BasicAuthStrategy
from b2c_tooling_sdk.auth.client_credentials import encode_basic_client_credentials
from b2c_tooling_sdk.auth.jwt_utils import (
    DEFAULT_EXPIRY_BUFFER_SEC,
    decode_jwt,
    decode_jwt_token_info,
    extract_jwt_scopes,
    is_jwt_token_valid,
)
from b2c_tooling_sdk.auth.middleware import (
    AuthMiddleware,
    AuthMiddlewareProvider,
    AuthMiddlewareRegistry,
    apply_auth_request_middleware,
    apply_auth_response_middleware,
    global_auth_middleware_registry,
)
from b2c_tooling_sdk.auth.oauth import (
    OAuthConfig,
    OAuthStrategy,
    find_cached_token_satisfying,
    get_cached_oauth_token,
    get_oauth_cache_key,
    invalidate_cached_tokens_for_identity,
    reset_oauth_cache_for_testing,
    set_cached_oauth_token,
)
from b2c_tooling_sdk.auth.oauth_implicit import ImplicitOAuthConfig, ImplicitOAuthStrategy
from b2c_tooling_sdk.auth.oauth_jwt import JwtOAuthConfig, JwtOAuthStrategy
from b2c_tooling_sdk.auth.oauth_pkce import (
    PkceGrantUnsupportedError,
    PkceOAuthConfig,
    PkceOAuthStrategy,
)
from b2c_tooling_sdk.auth.oauth_pkce_fallback import (
    PkceWithImplicitFallbackStrategy,
    create_user_auth_strategy,
    is_pkce_fallback_disabled,
)
from b2c_tooling_sdk.auth.resolve import (
    AvailableAuthMethods,
    UnavailableAuthMethod,
    check_available_auth_methods,
    resolve_auth_strategy,
)
from b2c_tooling_sdk.auth.session_store import (
    AuthSession,
    AuthSessionBackend,
    AuthSessionFlow,
    FileAuthSessionBackend,
    InMemoryAuthSessionBackend,
    clear_all_auth_sessions,
    delete_auth_session,
    find_auth_session,
    get_auth_session_backend,
    get_default_data_dir,
    initialize_file_auth_session_store,
    is_auth_session_token_valid,
    list_auth_sessions,
    reset_auth_session_store_for_testing,
    save_auth_session,
    set_auth_session_backend,
)
from b2c_tooling_sdk.auth.stateful_oauth_strategy import (
    StatefulOAuthStrategy,
    StatefulOAuthStrategyOptions,
)
from b2c_tooling_sdk.auth.types import (
    ALL_AUTH_METHODS,
    AccessTokenResponse,
    ApiKeyAuthConfig,
    AuthConfig,
    AuthCredentials,
    AuthMethod,
    AuthStrategy,
    BasicAuthConfig,
    DecodedJWT,
    OAuthAuthConfig,
    ScopedAuthStrategy,
)

__all__ = [
    # types
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
    # strategies
    "OAuthStrategy",
    "OAuthConfig",
    "JwtOAuthStrategy",
    "JwtOAuthConfig",
    "PkceOAuthStrategy",
    "PkceOAuthConfig",
    "PkceGrantUnsupportedError",
    "PkceWithImplicitFallbackStrategy",
    "create_user_auth_strategy",
    "is_pkce_fallback_disabled",
    "ImplicitOAuthStrategy",
    "ImplicitOAuthConfig",
    "StatefulOAuthStrategy",
    "StatefulOAuthStrategyOptions",
    "BasicAuthStrategy",
    "ApiKeyStrategy",
    # resolution
    "resolve_auth_strategy",
    "check_available_auth_methods",
    "AvailableAuthMethods",
    "UnavailableAuthMethod",
    # client credentials
    "encode_basic_client_credentials",
    # jwt
    "DEFAULT_EXPIRY_BUFFER_SEC",
    "decode_jwt",
    "decode_jwt_token_info",
    "extract_jwt_scopes",
    "is_jwt_token_valid",
    # oauth cache
    "get_oauth_cache_key",
    "get_cached_oauth_token",
    "set_cached_oauth_token",
    "find_cached_token_satisfying",
    "invalidate_cached_tokens_for_identity",
    "reset_oauth_cache_for_testing",
    # middleware
    "AuthMiddleware",
    "AuthMiddlewareProvider",
    "AuthMiddlewareRegistry",
    "global_auth_middleware_registry",
    "apply_auth_request_middleware",
    "apply_auth_response_middleware",
    # session store
    "AuthSession",
    "AuthSessionFlow",
    "AuthSessionBackend",
    "FileAuthSessionBackend",
    "InMemoryAuthSessionBackend",
    "get_default_data_dir",
    "set_auth_session_backend",
    "get_auth_session_backend",
    "initialize_file_auth_session_store",
    "find_auth_session",
    "save_auth_session",
    "delete_auth_session",
    "list_auth_sessions",
    "clear_all_auth_sessions",
    "is_auth_session_token_valid",
    "reset_auth_session_store_for_testing",
]
