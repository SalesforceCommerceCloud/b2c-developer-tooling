# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""OAuth strategy backed by a persisted session in the unified auth-session store.

Mirrors ``src/auth/stateful-oauth-strategy.ts``. Used for sessions minted by:

- ``auth client`` — non-interactive client_credentials. NO refresh: when the
  stored access token expires, the user must re-run
  ``auth client --client-id <id> --client-secret <secret>``. Client secrets are
  never persisted.
- ``auth login`` (PKCE) and the implicit flow also write here, but those
  strategies own their refresh logic. This strategy is only constructed when the
  caller decides to use a stored session directly without instantiating a
  flow-specific strategy.

On 401, this strategy clears the session and returns the response — the caller
must re-authenticate (re-run ``auth client`` or ``auth login``). No refresh.
"""

from __future__ import annotations

from typing import Any

import httpx

from b2c_tooling_sdk.auth.dispatch_fetch import dispatch_fetch
from b2c_tooling_sdk.auth.jwt_utils import decode_jwt, decode_jwt_token_info
from b2c_tooling_sdk.auth.session_store import AuthSession, delete_auth_session, find_auth_session
from b2c_tooling_sdk.auth.types import AccessTokenResponse, DecodedJWT
from b2c_tooling_sdk.logging import get_logger


class StatefulOAuthStrategyOptions:
    """Options for :class:`StatefulOAuthStrategy` (kept for API parity with the TS SDK)."""

    def __init__(self, account_manager_host: str, scopes: list[str] | None = None) -> None:
        self.account_manager_host = account_manager_host
        self.scopes = scopes


class StatefulOAuthStrategy:
    """Auth strategy that uses a persisted access token from the unified store.

    No refresh — on expiry/401, the session is cleared and the caller is expected
    to re-authenticate.
    """

    def __init__(self, session: AuthSession, options: StatefulOAuthStrategyOptions | None = None) -> None:
        # ``options`` is accepted for parity with the TS constructor but unused; the
        # session already carries the account manager host and scopes.
        self._session = session
        self._logger = get_logger("auth.stateful")

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
        """Perform a request with the stored token; on 401 clear the session."""
        token = self._get_access_token()
        request_headers = dict(headers or {})
        request_headers["Authorization"] = f"Bearer {token}"
        request_headers["x-dw-client-id"] = self._session.client_id

        response = await dispatch_fetch(
            url, method=method, headers=request_headers, content=content, dispatcher=dispatcher, **kwargs
        )
        if response.status_code == 401:
            self._logger.debug("[StatefulAuth] 401 received; clearing stored session — caller must re-authenticate")
            self.invalidate_token()
        return response

    async def get_authorization_header(self) -> str:
        """Return the ``Authorization`` header value (``Bearer <token>``)."""
        return f"Bearer {self._get_access_token()}"

    async def get_token_response(self) -> AccessTokenResponse:
        """Return the current token as an :class:`AccessTokenResponse` (expires/scopes from the JWT)."""
        token = self._get_access_token()
        expires, scopes = decode_jwt_token_info(token)
        return AccessTokenResponse(access_token=token, expires=expires, scopes=scopes)

    async def get_jwt(self) -> DecodedJWT:
        """Return the decoded (unverified) access-token JWT."""
        return decode_jwt(self._get_access_token())

    def invalidate_token(self) -> None:
        """Delete the persisted session and blank the in-memory access token."""
        delete_auth_session(self._session.client_id)
        self._session = AuthSession(
            client_id=self._session.client_id,
            flow=self._session.flow,
            access_token="",
            pkce_unsupported=self._session.pkce_unsupported,
            refresh_token=self._session.refresh_token,
            sub=self._session.sub,
            expires_at=self._session.expires_at,
            scopes=self._session.scopes,
            account_manager_host=self._session.account_manager_host,
            last_used_at=self._session.last_used_at,
        )

    def _get_access_token(self) -> str:
        session = find_auth_session(self._session.client_id)
        if session is not None and session.access_token:
            self._session = session
            return session.access_token
        raise RuntimeError("Stored session has no access token; please re-authenticate.")


__all__ = ["StatefulOAuthStrategy", "StatefulOAuthStrategyOptions"]
