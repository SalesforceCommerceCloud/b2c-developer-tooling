# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""OAuth 2.0 Implicit Grant flow authentication strategy (legacy).

Mirrors ``src/auth/oauth-implicit.ts``. Used when only a client ID is available
(no secret) and the client is not registered for the Authorization Code + PKCE
grant. Opens a browser to Account Manager, then captures the access token from
the OAuth redirect *fragment* via a small HTML shim that re-emits the fragment as
query parameters to the localhost listener.

The implicit access token is valid for ~30 minutes and cannot be renewed; when it
expires the user is prompted again. This flow is deprecated — prefer PKCE.
"""

from __future__ import annotations

import asyncio
import os
from collections.abc import Awaitable, Callable
from datetime import datetime, timedelta, timezone
from typing import Any
from urllib.parse import urlencode

import httpx

from b2c_tooling_sdk.auth.browser import open_browser_default
from b2c_tooling_sdk.auth.callback_server import CallbackResponse, run_callback_server
from b2c_tooling_sdk.auth.dispatch_fetch import dispatch_fetch
from b2c_tooling_sdk.auth.jwt_utils import decode_jwt
from b2c_tooling_sdk.auth.session_store import AuthSession, find_auth_session, save_auth_session
from b2c_tooling_sdk.auth.types import AccessTokenResponse, DecodedJWT
from b2c_tooling_sdk.defaults import DEFAULT_ACCOUNT_MANAGER_HOST, DEFAULT_LOCAL_PORT
from b2c_tooling_sdk.logging import get_logger

# Module-level caches shared across instances with the same clientId, matching the
# TS ACCESS_TOKEN_CACHE / PENDING_AUTH maps in oauth-implicit.ts.
_ACCESS_TOKEN_CACHE: dict[str, AccessTokenResponse] = {}
_PENDING_AUTH: dict[str, asyncio.Future[AccessTokenResponse]] = {}


def reset_implicit_cache_for_testing() -> None:
    """Clear the module-level implicit token / pending-auth caches (tests only)."""
    _ACCESS_TOKEN_CACHE.clear()
    _PENDING_AUTH.clear()


def _redirect_html(redirect_uri: str) -> str:
    """HTML served to the browser to re-emit the URL fragment as query params."""
    return (
        '\n<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n'
        '    <title>OAuth Return Flow</title>\n</head>\n<body onload="doReturnFlow()">\n<script>\n'
        "    function doReturnFlow() {\n"
        f'        document.location = "{redirect_uri}/?" + window.location.hash.substring(1);\n'
        "    }\n</script>\n</body>\n</html>\n"
    )


class ImplicitOAuthConfig:
    """Configuration for the legacy implicit OAuth flow."""

    def __init__(
        self,
        client_id: str,
        scopes: list[str] | None = None,
        account_manager_host: str | None = None,
        local_port: int | None = None,
        redirect_uri: str | None = None,
        open_browser: Callable[[str], Awaitable[None]] | None = None,
        persist_session: bool = True,
        pkce_unsupported: bool = False,
    ) -> None:
        self.client_id = client_id
        self.scopes = scopes
        self.account_manager_host = account_manager_host
        self.local_port = local_port
        self.redirect_uri = redirect_uri
        self.open_browser = open_browser
        self.persist_session = persist_session
        self.pkce_unsupported = pkce_unsupported


class ImplicitOAuthStrategy:
    """OAuth 2.0 Implicit Grant flow (deprecated; public clients only)."""

    auth_method = "implicit"

    def __init__(self, config: ImplicitOAuthConfig) -> None:
        self._config = config
        self._logger = get_logger("auth.oauth_implicit")
        self._account_manager_host = config.account_manager_host or DEFAULT_ACCOUNT_MANAGER_HOST
        env_port = os.environ.get("SFCC_OAUTH_LOCAL_PORT")
        self._local_port = config.local_port or _parse_int(env_port) or DEFAULT_LOCAL_PORT
        self._redirect_uri = (
            config.redirect_uri or os.environ.get("SFCC_REDIRECT_URI") or f"http://localhost:{self._local_port}"
        )
        self._persist_session = config.persist_session
        self._has_had_success = False
        self._sub = ""
        self._hydrated = False

    def _hydrate(self) -> None:
        """Load any persisted implicit session for this clientId. Idempotent."""
        if not self._persist_session or self._hydrated:
            return
        self._hydrated = True
        try:
            stored = find_auth_session(self._config.client_id)
            if stored is None or stored.flow != "implicit":
                return
            self._sub = stored.sub or ""
            if self._config.client_id not in _ACCESS_TOKEN_CACHE and stored.access_token:
                expires = (
                    _parse_iso(stored.expires_at) if stored.expires_at else datetime.fromtimestamp(0, tz=timezone.utc)
                )
                _ACCESS_TOKEN_CACHE[self._config.client_id] = AccessTokenResponse(
                    access_token=stored.access_token,
                    expires=expires,
                    scopes=stored.scopes or [],
                )
        except Exception as error:  # noqa: BLE001 - hydration is best-effort
            self._logger.debug("Implicit store hydration failed: %s", error)

    def _persist_tokens(self, token_response: AccessTokenResponse) -> None:
        if not self._persist_session:
            return
        sub = self._sub
        try:
            decoded = decode_jwt(token_response.access_token)
            payload_sub = decoded.payload.get("sub")
            if isinstance(payload_sub, str) and payload_sub:
                sub = payload_sub
        except Exception:  # noqa: BLE001 - token may not be a JWT
            pass
        self._sub = sub
        record = AuthSession(
            client_id=self._config.client_id,
            flow="implicit",
            pkce_unsupported=True if self._config.pkce_unsupported else None,
            access_token=token_response.access_token,
            refresh_token=None,
            sub=sub,
            expires_at=_to_iso(token_response.expires),
            scopes=token_response.scopes,
            account_manager_host=self._account_manager_host,
        )
        try:
            save_auth_session(record)
        except Exception as error:  # noqa: BLE001 - persistence is best-effort
            self._logger.debug("Failed to persist implicit session: %s", error)

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
        """Perform a request with implicit-flow auth, retrying once on a post-success 401."""
        token = await self._get_access_token()
        request_headers = dict(headers or {})
        request_headers["Authorization"] = f"Bearer {token}"
        request_headers["x-dw-client-id"] = self._config.client_id

        response = await dispatch_fetch(
            url, method=method, headers=request_headers, content=content, dispatcher=dispatcher, **kwargs
        )
        if response.status_code != 401:
            self._has_had_success = True
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
        """Return the full token response, running the browser flow when the cache is stale."""
        self._hydrate()
        cached = _ACCESS_TOKEN_CACHE.get(self._config.client_id)
        if cached is not None and self._is_cached_token_usable(cached):
            return cached
        token_response = await self._implicit_flow_login()
        _ACCESS_TOKEN_CACHE[self._config.client_id] = token_response
        self._persist_tokens(token_response)
        return token_response

    def invalidate_token(self) -> None:
        """Invalidate the cached token, forcing re-authentication on the next request."""
        _ACCESS_TOKEN_CACHE.pop(self._config.client_id, None)

    def _is_cached_token_usable(self, cached: AccessTokenResponse) -> bool:
        required_scopes = self._config.scopes or []
        has_all = all(scope in cached.scopes for scope in required_scopes)
        return has_all and _now() <= cached.expires

    async def _get_access_token(self) -> str:
        self._hydrate()
        client_id = self._config.client_id
        cached = _ACCESS_TOKEN_CACHE.get(client_id)
        if cached is not None:
            if not self._is_cached_token_usable(cached):
                _ACCESS_TOKEN_CACHE.pop(client_id, None)
            else:
                return cached.access_token

        pending = _PENDING_AUTH.get(client_id)
        if pending is not None:
            token_response = await pending
            return token_response.access_token

        auth_future = asyncio.ensure_future(self._implicit_flow_login())
        _PENDING_AUTH[client_id] = auth_future
        try:
            token_response = await auth_future
            _ACCESS_TOKEN_CACHE[client_id] = token_response
            self._persist_tokens(token_response)
            return token_response.access_token
        finally:
            _PENDING_AUTH.pop(client_id, None)

    async def _implicit_flow_login(self) -> AccessTokenResponse:
        params = {
            "client_id": self._config.client_id,
            "redirect_uri": self._redirect_uri,
            "response_type": "token",
        }
        if self._config.scopes:
            params["scope"] = " ".join(self._config.scopes)
        authorize_url = f"https://{self._account_manager_host}/dwsso/oauth2/authorize?{_form_encode(params)}"

        self._logger.info("Login URL: %s", authorize_url)
        self._logger.info("If the URL does not open automatically, copy/paste it into a browser on this machine.")

        def _handler(path: str, query: dict[str, list[str]]) -> CallbackResponse:
            access_token = _first(query, "access_token")
            error = _first(query, "error")
            error_description = _first(query, "error_description")

            if not access_token and not error:
                # First hit: no fragment yet — serve the shim that re-emits it as query params.
                return CallbackResponse(200, "text/html", _redirect_html(self._redirect_uri))
            if access_token:
                expires_in = _parse_int(_first(query, "expires_in")) or 0
                expires = _now() + timedelta(seconds=expires_in)
                scope = _first(query, "scope")
                scopes = scope.split(" ") if scope else []
                token = AccessTokenResponse(access_token=access_token, expires=expires, scopes=scopes)
                return CallbackResponse(
                    200,
                    "text/plain",
                    "Authentication successful! You may close this browser window and return to your terminal.",
                    result=token,
                    done=True,
                )
            message = error_description or error or "unknown_error"
            return CallbackResponse(
                500,
                "text/plain",
                f"Authentication failed: {message}",
                done=True,
                error=RuntimeError(f"OAuth error: {message}"),
            )

        self._logger.info("Waiting for user to authenticate...")
        opener = self._config.open_browser or open_browser_default

        async def _on_listening() -> None:
            await opener(authorize_url)

        result = await run_callback_server(self._local_port, _handler, _on_listening)
        assert isinstance(result, AccessTokenResponse)
        return result


def _parse_int(value: str | None) -> int | None:
    if not value:
        return None
    try:
        return int(value)
    except ValueError:
        return None


def _first(query: dict[str, list[str]], key: str) -> str | None:
    values = query.get(key)
    return values[0] if values else None


def _now() -> datetime:
    return datetime.now(tz=timezone.utc)


def _to_iso(value: datetime) -> str:
    return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def _parse_iso(value: str) -> datetime:
    normalized = value.replace("Z", "+00:00")
    parsed = datetime.fromisoformat(normalized)
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed


def _form_encode(params: dict[str, str]) -> str:
    return urlencode(params)


__all__ = [
    "ImplicitOAuthConfig",
    "ImplicitOAuthStrategy",
    "reset_implicit_cache_for_testing",
]
