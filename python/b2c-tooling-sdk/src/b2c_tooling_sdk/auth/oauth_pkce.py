# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""OAuth 2.0 Authorization Code flow with PKCE.

Mirrors ``src/auth/oauth-pkce.ts``. Used for public clients (no client secret);
replaces the legacy implicit flow deprecated for public clients under OAuth 2.1.

Flow:

1. Generate a PKCE verifier + S256 challenge.
2. Open the browser to ``/dwsso/oauth2/authorize?response_type=code&code_challenge=...``.
3. Capture the redirect carrying ``?code=...`` on a localhost listener.
4. POST ``grant_type=authorization_code`` + ``code_verifier`` to ``/dwsso/oauth2/access_token``.

Tokens may include a ``refresh_token`` (depends on Account Manager client registration).
"""

from __future__ import annotations

import asyncio
import base64
import hashlib
import json
import os
import secrets
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

# Module-level caches so multiple instances sharing a clientId coordinate, matching
# the TS ACCESS_TOKEN_CACHE / PENDING_AUTH maps in oauth-pkce.ts.
_ACCESS_TOKEN_CACHE: dict[str, AccessTokenResponse] = {}
_PENDING_AUTH: dict[str, asyncio.Future[AccessTokenResponse]] = {}

# OAuth `error` codes that genuinely indicate the client is not registered as a
# PKCE-capable public client — the only failures the implicit fallback can rescue.
_PKCE_GRANT_UNSUPPORTED_OAUTH_ERRORS = frozenset(
    {
        "invalid_client",
        "unauthorized_client",
        "unsupported_response_type",
        "unsupported_grant_type",
    }
)


def reset_pkce_cache_for_testing() -> None:
    """Clear the module-level PKCE token / pending-auth caches (tests only)."""
    _ACCESS_TOKEN_CACHE.clear()
    _PENDING_AUTH.clear()


class PkceGrantUnsupportedError(Exception):
    """Raised when the Authorization Code + PKCE flow fails because the client is
    not registered for that grant (e.g. a legacy implicit-only public client or a
    missing/mismatched redirect URI) rather than a transient or user-driven failure.

    :class:`~b2c_tooling_sdk.auth.oauth_pkce_fallback.PkceWithImplicitFallbackStrategy`
    keys its automatic fallback off this type so it retries with the legacy implicit
    flow ONLY for grant/registration failures — never for user-cancel, state
    mismatch, or a port-in-use error.
    """

    def __init__(self, message: str, stage: str, oauth_error: str | None = None) -> None:
        super().__init__(message)
        self.stage = stage
        self.oauth_error = oauth_error


def _is_pkce_grant_unsupported_error(oauth_error: str | None) -> bool:
    """True only when an OAuth ``error`` code means the client cannot use the code grant."""
    return oauth_error is not None and oauth_error in _PKCE_GRANT_UNSUPPORTED_OAUTH_ERRORS


def _base64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _generate_pkce_pair() -> tuple[str, str]:
    verifier = _base64url(secrets.token_bytes(32))
    challenge = _base64url(hashlib.sha256(verifier.encode("ascii")).digest())
    return verifier, challenge


def _parse_oauth_error_body(text: str) -> tuple[str | None, str | None]:
    """Parse ``{error, error_description}`` from a token error body; ``(None, None)`` if not JSON."""
    try:
        parsed = json.loads(text)
    except Exception:  # noqa: BLE001 - non-JSON error body
        return None, None
    if not isinstance(parsed, dict):
        return None, None
    error = parsed.get("error")
    description = parsed.get("error_description")
    return (error if isinstance(error, str) else None, description if isinstance(description, str) else None)


class PkceOAuthConfig:
    """Configuration for the OAuth Authorization Code + PKCE flow."""

    def __init__(
        self,
        client_id: str,
        scopes: list[str] | None = None,
        account_manager_host: str | None = None,
        local_port: int | None = None,
        redirect_uri: str | None = None,
        open_browser: Callable[[str], Awaitable[None]] | None = None,
        persist_session: bool = True,
    ) -> None:
        self.client_id = client_id
        self.scopes = scopes
        self.account_manager_host = account_manager_host
        self.local_port = local_port
        self.redirect_uri = redirect_uri
        self.open_browser = open_browser
        self.persist_session = persist_session


class PkceOAuthStrategy:
    """OAuth 2.0 Authorization Code Flow with PKCE (public clients)."""

    auth_method = "user"

    def __init__(self, config: PkceOAuthConfig) -> None:
        self._config = config
        self._logger = get_logger("auth.oauth_pkce")
        self._account_manager_host = config.account_manager_host or DEFAULT_ACCOUNT_MANAGER_HOST
        env_port = os.environ.get("SFCC_OAUTH_LOCAL_PORT")
        self._local_port = config.local_port or _parse_int(env_port) or DEFAULT_LOCAL_PORT
        self._redirect_uri = (
            config.redirect_uri or os.environ.get("SFCC_REDIRECT_URI") or f"http://localhost:{self._local_port}"
        )
        self._persist_session = config.persist_session
        self._has_had_success = False
        self._refresh_token: str | None = None
        self._sub = ""
        self._hydrated = False

    def _hydrate(self) -> None:
        """Load any persisted PKCE session for this clientId. Idempotent."""
        if not self._persist_session or self._hydrated:
            return
        self._hydrated = True
        try:
            stored = find_auth_session(self._config.client_id)
            if stored is None or stored.flow != "pkce":
                return
            self._sub = stored.sub or ""
            self._refresh_token = stored.refresh_token
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
            self._logger.debug("PKCE store hydration failed: %s", error)

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
        """Perform a request with PKCE auth, retrying once on a post-success 401."""
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
        """Return the full token response, refreshing or running the browser flow as needed."""
        self._hydrate()
        cached = _ACCESS_TOKEN_CACHE.get(self._config.client_id)
        if cached is not None and self._is_cached_token_usable(cached):
            return cached
        if self._refresh_token:
            refreshed = await self._try_refresh()
            if refreshed is not None:
                return refreshed
        token_response = await self._run_flow()
        _ACCESS_TOKEN_CACHE[self._config.client_id] = token_response
        return token_response

    def invalidate_token(self) -> None:
        """Drop only the cached access token; the refresh token is preserved for silent renewal."""
        _ACCESS_TOKEN_CACHE.pop(self._config.client_id, None)

    def _is_cached_token_usable(self, cached: AccessTokenResponse) -> bool:
        required_scopes = self._config.scopes or []
        has_all = all(scope in cached.scopes for scope in required_scopes)
        return has_all and _now() <= cached.expires

    async def _get_access_token(self) -> str:
        self._hydrate()
        client_id = self._config.client_id
        cached = _ACCESS_TOKEN_CACHE.get(client_id)
        if cached is not None and self._is_cached_token_usable(cached):
            return cached.access_token
        if cached is not None:
            _ACCESS_TOKEN_CACHE.pop(client_id, None)

        pending = _PENDING_AUTH.get(client_id)
        if pending is not None:
            token_response = await pending
            return token_response.access_token

        async def _auth() -> AccessTokenResponse:
            if self._refresh_token:
                refreshed = await self._try_refresh()
                if refreshed is not None:
                    return refreshed
            return await self._run_flow()

        auth_future = asyncio.ensure_future(_auth())
        _PENDING_AUTH[client_id] = auth_future
        try:
            token_response = await auth_future
            _ACCESS_TOKEN_CACHE[client_id] = token_response
            return token_response.access_token
        finally:
            _PENDING_AUTH.pop(client_id, None)

    async def _try_refresh(self) -> AccessTokenResponse | None:
        """Exchange a stored refresh token for a new access token. ``None`` on failure."""
        if not self._refresh_token:
            return None
        token_url = f"https://{self._account_manager_host}/dwsso/oauth2/access_token"
        params = {
            "grant_type": "refresh_token",
            "refresh_token": self._refresh_token,
            "client_id": self._config.client_id,
        }
        if self._config.scopes:
            params["scope"] = " ".join(self._config.scopes)
        body = _form_encode(params)

        try:
            response = await dispatch_fetch(
                token_url,
                method="POST",
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                content=body,
            )
        except Exception as error:  # noqa: BLE001 - transport failure forgets refresh token
            self._logger.debug("PKCE refresh request failed: %s", error)
            self._refresh_token = None
            return None

        if not response.is_success:
            oauth_error, _ = _parse_oauth_error_body(response.text)
            self._logger.debug("PKCE refresh failed (%s); falling back to browser flow", oauth_error)
            self._refresh_token = None
            return None

        try:
            parsed = response.json()
        except Exception as error:  # noqa: BLE001 - non-JSON refresh response
            self._logger.debug("PKCE refresh returned non-JSON response: %s", error)
            self._refresh_token = None
            return None

        access_token = parsed.get("access_token")
        if not isinstance(access_token, str) or not access_token:
            self._logger.debug("PKCE refresh response did not contain an access token")
            self._refresh_token = None
            return None

        token_response = self._build_token_response(parsed)
        new_refresh = parsed.get("refresh_token")
        if isinstance(new_refresh, str) and new_refresh:
            self._refresh_token = new_refresh
        self._persist_tokens(token_response)
        self._logger.debug("PKCE token refreshed silently")
        return token_response

    def _build_token_response(self, parsed: dict[str, Any]) -> AccessTokenResponse:
        expires_in = parsed.get("expires_in")
        expires_in = expires_in if isinstance(expires_in, (int, float)) else 0
        expires = _now() + timedelta(seconds=expires_in)
        scope = parsed.get("scope")
        scopes = scope.split(" ") if isinstance(scope, str) else (self._config.scopes or [])
        return AccessTokenResponse(access_token=parsed["access_token"], expires=expires, scopes=scopes)

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
            flow="pkce",
            access_token=token_response.access_token,
            refresh_token=self._refresh_token,
            sub=sub,
            expires_at=_to_iso(token_response.expires),
            scopes=token_response.scopes,
            account_manager_host=self._account_manager_host,
        )
        try:
            save_auth_session(record)
        except Exception as error:  # noqa: BLE001 - persistence is best-effort
            self._logger.debug("Failed to persist PKCE session: %s", error)

    async def _run_flow(self) -> AccessTokenResponse:
        verifier, challenge = _generate_pkce_pair()
        state = _base64url(secrets.token_bytes(16))

        params = {
            "client_id": self._config.client_id,
            "redirect_uri": self._redirect_uri,
            "response_type": "code",
            "code_challenge": challenge,
            "code_challenge_method": "S256",
            "state": state,
        }
        if self._config.scopes:
            params["scope"] = " ".join(self._config.scopes)
        authorize_url = f"https://{self._account_manager_host}/dwsso/oauth2/authorize?{_form_encode(params)}"

        self._logger.info("Login URL: %s", authorize_url)
        self._logger.info("If the URL does not open automatically, copy/paste it into a browser on this machine.")

        code = await self._wait_for_auth_code(state, authorize_url)
        self._logger.debug("Got authorization code, exchanging for token")

        token_url = f"https://{self._account_manager_host}/dwsso/oauth2/access_token"
        token_body = _form_encode(
            {
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": self._redirect_uri,
                "client_id": self._config.client_id,
                "code_verifier": verifier,
            }
        )
        token_res = await dispatch_fetch(
            token_url,
            method="POST",
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            content=token_body,
        )
        raw_text = token_res.text
        if not token_res.is_success:
            oauth_error, description = _parse_oauth_error_body(raw_text)
            detail = description or oauth_error
            message = f"PKCE token exchange failed ({token_res.status_code})" + (f": {detail}" if detail else "")
            if _is_pkce_grant_unsupported_error(oauth_error):
                raise PkceGrantUnsupportedError(message, "token", oauth_error)
            raise RuntimeError(message)

        try:
            parsed = json.loads(raw_text)
        except Exception as error:  # noqa: BLE001 - do not echo an untrusted body
            raise RuntimeError("PKCE token exchange returned a non-JSON response") from error

        access_token = parsed.get("access_token")
        if not isinstance(access_token, str) or not access_token:
            raise RuntimeError("PKCE token exchange response did not contain an access token")

        token_response = self._build_token_response(parsed)
        refresh = parsed.get("refresh_token")
        if isinstance(refresh, str) and refresh:
            self._refresh_token = refresh
        self._persist_tokens(token_response)
        return token_response

    async def _wait_for_auth_code(self, expected_state: str, authorize_url: str) -> str:
        opener = self._config.open_browser or open_browser_default

        def _handler(path: str, query: dict[str, list[str]]) -> CallbackResponse:
            code = _first(query, "code")
            state = _first(query, "state") or ""
            error = _first(query, "error")
            error_description = _first(query, "error_description")

            if error:
                message = f"OAuth error: {error_description or error}"
                auth_error: Exception = (
                    PkceGrantUnsupportedError(message, "authorize", error)
                    if _is_pkce_grant_unsupported_error(error)
                    else RuntimeError(message)
                )
                return CallbackResponse(
                    500,
                    "text/plain",
                    f"Authentication failed: {error_description or error}",
                    done=True,
                    error=auth_error,
                )
            if not code:
                return CallbackResponse(404, "text/plain", "Waiting for authorization code...")
            if state != expected_state:
                return CallbackResponse(
                    400,
                    "text/plain",
                    "State mismatch.",
                    done=True,
                    error=RuntimeError("OAuth state mismatch — aborting"),
                )
            return CallbackResponse(
                200,
                "text/plain",
                "Authorization received. Completing authentication in the application...",
                result=code,
                done=True,
            )

        self._logger.info("Waiting for user to authenticate...")

        async def _on_listening() -> None:
            await opener(authorize_url)

        result = await run_callback_server(self._local_port, _handler, _on_listening)
        return str(result)


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
    "PkceOAuthConfig",
    "PkceOAuthStrategy",
    "PkceGrantUnsupportedError",
    "reset_pkce_cache_for_testing",
]
