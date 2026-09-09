# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""OAuth 2.0 client-credentials strategy and the shared module-level token cache.

Mirrors ``src/auth/oauth.ts``. :class:`OAuthStrategy` implements the client
credentials grant for automated/server-side auth, with token caching, expiry
handling, single-flight token requests (so concurrent callers coalesce onto one
token-endpoint round trip), 401 retry, and scope-cascade resolution.

The token cache and in-flight request maps are module-level so multiple strategy
instances sharing a client id reuse the same tokens, exactly as the TS SDK does.
"""

from __future__ import annotations

import asyncio
from datetime import datetime, timedelta, timezone
from typing import Any
from urllib.parse import urlencode

import httpx

from b2c_tooling_sdk.auth.client_credentials import encode_basic_client_credentials
from b2c_tooling_sdk.auth.dispatch_fetch import dispatch_fetch
from b2c_tooling_sdk.auth.jwt_utils import decode_jwt
from b2c_tooling_sdk.auth.middleware import (
    apply_auth_request_middleware,
    apply_auth_response_middleware,
    global_auth_middleware_registry,
)
from b2c_tooling_sdk.auth.types import AccessTokenResponse, DecodedJWT
from b2c_tooling_sdk.defaults import DEFAULT_ACCOUNT_MANAGER_HOST
from b2c_tooling_sdk.errors.network_error import wrap_network_error
from b2c_tooling_sdk.logging import get_logger

# re-exported for parity with the TS module, which defines decodeJWT here.
__all__ = [
    "OAuthConfig",
    "OAuthStrategy",
    "decode_jwt",
    "get_oauth_cache_key",
    "get_cached_oauth_token",
    "set_cached_oauth_token",
    "find_cached_token_satisfying",
    "invalidate_cached_tokens_for_identity",
    "reset_oauth_cache_for_testing",
]

# Module-level token cache to support multiple instances with the same clientId.
_ACCESS_TOKEN_CACHE: dict[str, AccessTokenResponse] = {}

# In-flight token requests keyed by cache key, so concurrent callers coalesce onto
# a single token-endpoint round trip instead of stampeding the server.
_PENDING_TOKEN_REQUESTS: dict[str, asyncio.Future[AccessTokenResponse]] = {}


class OAuthConfig:
    """Configuration for :class:`OAuthStrategy` (client-credentials grant)."""

    def __init__(
        self,
        client_id: str,
        client_secret: str,
        scopes: list[str] | None = None,
        account_manager_host: str | None = None,
    ) -> None:
        self.client_id = client_id
        self.client_secret = client_secret
        self.scopes = scopes
        self.account_manager_host = account_manager_host


def get_oauth_cache_key(
    client_id: str,
    method: str,
    account_manager_host: str,
    scopes: list[str] | None = None,
) -> str:
    """Build a token cache key. Includes the auth method to keep grants distinct."""
    scopes_key = ",".join(sorted(scopes)) if scopes else ""
    return f"{account_manager_host}:{client_id}:{method}:{scopes_key}"


def get_cached_oauth_token(cache_key: str, required_scopes: list[str] | None = None) -> AccessTokenResponse | None:
    """Return a cached token if present, unexpired, and covering ``required_scopes``."""
    required_scopes = required_scopes or []
    cached = _ACCESS_TOKEN_CACHE.get(cache_key)
    if cached is None:
        return None
    now = datetime.now(tz=timezone.utc)
    has_all_scopes = all(scope in cached.scopes for scope in required_scopes)
    if not has_all_scopes or now > cached.expires:
        _ACCESS_TOKEN_CACHE.pop(cache_key, None)
        return None
    return cached


def set_cached_oauth_token(cache_key: str, token_response: AccessTokenResponse) -> None:
    """Store a token in the global cache."""
    _ACCESS_TOKEN_CACHE[cache_key] = token_response


def find_cached_token_satisfying(
    identity_prefix: str,
    required_scopes: list[str],
) -> AccessTokenResponse | None:
    """Return the first non-expired cached token (matching ``identity_prefix``) whose scopes ⊇ ``required_scopes``.

    Used by cascade resolution: a token granted with broader scopes automatically
    satisfies a later request needing a narrower scope, with no extra AM round trip.
    """
    now = datetime.now(tz=timezone.utc)
    for key in list(_ACCESS_TOKEN_CACHE.keys()):
        if not key.startswith(identity_prefix):
            continue
        entry = _ACCESS_TOKEN_CACHE[key]
        if now > entry.expires:
            _ACCESS_TOKEN_CACHE.pop(key, None)
            continue
        if all(s in entry.scopes for s in required_scopes):
            return entry
    return None


def invalidate_cached_tokens_for_identity(identity_prefix: str) -> None:
    """Evict every cached token for an identity prefix (host:clientId:method:).

    Cascade-resolving strategies cache tokens under merged-scope keys, so deleting
    only the base key on a 401 would leave a rejected merged token cached. Clearing
    by identity prefix evicts all of them so the retry re-requests from AM.
    """
    for key in list(_ACCESS_TOKEN_CACHE.keys()):
        if key.startswith(identity_prefix):
            _ACCESS_TOKEN_CACHE.pop(key, None)


def reset_oauth_cache_for_testing() -> None:
    """Clear the module-level token cache and pending-request map (tests only)."""
    _ACCESS_TOKEN_CACHE.clear()
    _PENDING_TOKEN_REQUESTS.clear()


class OAuthStrategy:
    """OAuth 2.0 client-credentials authentication strategy.

    :example:

    .. code-block:: python

        from b2c_tooling_sdk.auth import OAuthStrategy

        auth = OAuthStrategy(OAuthConfig(
            client_id="your-client-id",
            client_secret="your-client-secret",
            scopes=["sfcc.products"],
        ))
        response = await auth.fetch("https://api.example.com/products")
    """

    def __init__(self, config: OAuthConfig) -> None:
        self._config = config
        self._account_manager_host = config.account_manager_host or DEFAULT_ACCOUNT_MANAGER_HOST
        self._has_had_success = False
        self._cache_key = get_oauth_cache_key(
            config.client_id,
            "client-credentials",
            self._account_manager_host,
            config.scopes,
        )
        self._identity_prefix = f"{self._account_manager_host}:{config.client_id}:client-credentials:"

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
        """Perform an authenticated request, injecting a bearer token and retrying once on a post-success 401."""
        token = await self._get_access_token()
        request_headers = dict(headers or {})
        request_headers["Authorization"] = f"Bearer {token}"
        request_headers["x-dw-client-id"] = self._config.client_id

        response = await dispatch_fetch(
            url, method=method, headers=request_headers, content=content, dispatcher=dispatcher, **kwargs
        )

        if response.status_code != 401:
            self._has_had_success = True

        # RESILIENCE: if a previously-successful request now 401s, the token likely
        # expired. Retry once with a fresh token. Skip retry on an initial 401 to
        # avoid retrying with bad credentials.
        if response.status_code == 401 and self._has_had_success:
            self.invalidate_token()
            new_token = await self._get_access_token()
            request_headers["Authorization"] = f"Bearer {new_token}"
            response = await dispatch_fetch(
                url, method=method, headers=request_headers, content=content, dispatcher=dispatcher, **kwargs
            )

        return response

    async def get_authorization_header(self) -> str:
        """Return the ``Authorization`` header value (``Bearer <token>``)."""
        token = await self._get_access_token()
        return f"Bearer {token}"

    async def get_jwt(self) -> DecodedJWT:
        """Return the decoded (unverified) access-token JWT."""
        token = await self._get_access_token()
        return decode_jwt(token)

    async def get_token_response(self) -> AccessTokenResponse:
        """Return the full token response (token + expiry + scopes), using the cache when valid."""
        cached = get_cached_oauth_token(self._cache_key, self._config.scopes or [])
        if cached is not None:
            get_logger("auth.oauth").debug("[OAuthStrategy] Reusing cached access token")
            return cached
        return await self._refresh_token_for_scopes(self._config.scopes)

    def invalidate_token(self) -> None:
        """Invalidate every cached token for this client/method/AM-host identity."""
        invalidate_cached_tokens_for_identity(self._identity_prefix)

    def with_additional_scopes(self, additional_scopes: list[str]) -> OAuthStrategy:
        """Return a new strategy with ``additional_scopes`` merged into the configured scopes."""
        merged = list(dict.fromkeys([*(self._config.scopes or []), *additional_scopes]))
        return OAuthStrategy(
            OAuthConfig(
                client_id=self._config.client_id,
                client_secret=self._config.client_secret,
                scopes=merged,
                account_manager_host=self._config.account_manager_host,
            )
        )

    async def get_access_token_for_cascade(self, candidates: list[list[str]]) -> str:
        """Resolve a scope cascade, returning the first token AM accepts.

        Each candidate is merged with this strategy's base scopes. Pass 1 scans the
        cache for a token satisfying any candidate; pass 2 requests each candidate
        from AM in order, skipping ``invalid_scope`` rejections and rethrowing anything else.
        """
        logger = get_logger("auth.oauth")
        base_scopes = self._config.scopes or []

        # Pass 1: cache scan.
        for candidate in candidates:
            required = list(dict.fromkeys([*base_scopes, *candidate]))
            cached = find_cached_token_satisfying(self._identity_prefix, required)
            if cached is not None:
                logger.debug("[OAuthStrategy] Cache hit: cached token satisfies cascade candidate %s", candidate)
                return cached.access_token

        # Pass 2: try each candidate against AM in order.
        last_error: BaseException | None = None
        for candidate in candidates:
            merged = list(dict.fromkeys([*base_scopes, *candidate]))
            try:
                logger.debug("[OAuthStrategy] Cascade trying scopes %s", candidate)
                token_response = await self._refresh_token_for_scopes(merged)
                return token_response.access_token
            except Exception as error:  # noqa: BLE001 - invalid_scope is expected; others rethrow
                if "invalid_scope" in str(error):
                    logger.debug(
                        "[OAuthStrategy] Cascade candidate %s rejected (invalid_scope), trying next", candidate
                    )
                    last_error = error
                    continue
                raise

        if last_error is not None:
            raise last_error
        raise RuntimeError("All scope cascade candidates failed")

    async def _get_access_token(self) -> str:
        cached = get_cached_oauth_token(self._cache_key, self._config.scopes or [])
        if cached is not None:
            get_logger("auth.oauth").debug("[OAuthStrategy] Reusing cached access token")
            return cached.access_token
        token_response = await self._refresh_token_for_scopes(self._config.scopes)
        return token_response.access_token

    async def _refresh_token_for_scopes(self, scopes: list[str] | None) -> AccessTokenResponse:
        """Fetch a token for a specific scope set, coalescing concurrent callers (single-flight)."""
        cache_key = get_oauth_cache_key(
            self._config.client_id, "client-credentials", self._account_manager_host, scopes
        )
        existing = _PENDING_TOKEN_REQUESTS.get(cache_key)
        if existing is not None:
            get_logger("auth.oauth").debug("[OAuthStrategy] Joining in-flight token request")
            return await existing

        async def _do() -> AccessTokenResponse:
            get_logger("auth.oauth").debug("[OAuthStrategy] Requesting new access token")
            token_response = await self._client_credentials_grant(scopes)
            set_cached_oauth_token(cache_key, token_response)
            return token_response

        task: asyncio.Future[AccessTokenResponse] = asyncio.ensure_future(_do())
        _PENDING_TOKEN_REQUESTS[cache_key] = task
        try:
            return await task
        finally:
            _PENDING_TOKEN_REQUESTS.pop(cache_key, None)

    async def _client_credentials_grant(self, scope_override: list[str] | None = None) -> AccessTokenResponse:
        """Perform the client-credentials grant against Account Manager."""
        logger = get_logger("auth.oauth")
        requested_scopes = scope_override if scope_override is not None else self._config.scopes
        url = f"https://{self._account_manager_host}/dwsso/oauth2/access_token"

        params: dict[str, str] = {"grant_type": "client_credentials"}
        if requested_scopes:
            params["scope"] = " ".join(requested_scopes)
        body = urlencode(params)

        credentials = encode_basic_client_credentials(self._config.client_id, self._config.client_secret)
        headers = {
            "Authorization": f"Basic {credentials}",
            "Content-Type": "application/x-www-form-urlencoded",
        }

        middleware = global_auth_middleware_registry.get_middleware()

        logger.debug("[Auth] Using OAuth client_credentials grant for client: %s", self._config.client_id)
        logger.debug("[Auth REQ] POST %s", url)

        async with httpx.AsyncClient() as client:
            request = client.build_request("POST", url, content=body, headers=headers)
            request = await apply_auth_request_middleware(request, middleware)
            try:
                response = await client.send(request)
            except Exception as err:  # noqa: BLE001 - wrapped only if network-level
                host = httpx.URL(url).host
                raise wrap_network_error(err, operation="OAuth token request", host=host) from err
            response = await apply_auth_response_middleware(request, response, middleware)

            logger.debug("[Auth RESP] POST %s %s", url, response.status_code)

            if not response.is_success:
                error_text = response.text
                raise RuntimeError(
                    f"Failed to get access token: {response.status_code} {response.reason_phrase} - {error_text}"
                )
            data = response.json()

        jwt = decode_jwt(data["access_token"])
        logger.debug("[Auth] JWT payload sub=%s", jwt.payload.get("sub"))

        now = datetime.now(tz=timezone.utc)
        expiration = now + timedelta(seconds=data["expires_in"])
        # AM normally echoes granted scopes; some configs omit `scope`. Fall back to
        # what we requested so cache satisfies-checks (cascade resolution) still work.
        scope = data.get("scope")
        scopes = scope.split(" ") if scope else (requested_scopes or [])

        return AccessTokenResponse(access_token=data["access_token"], expires=expiration, scopes=scopes)
