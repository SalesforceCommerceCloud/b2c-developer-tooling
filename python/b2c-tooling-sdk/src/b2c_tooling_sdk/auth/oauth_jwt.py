# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""JWT Bearer OAuth authentication strategy (RFC 7523).

Mirrors ``src/auth/oauth-jwt.ts``. Implements the OAuth 2.0 JWT Bearer Token flow
for Account Manager: a self-signed, short-lived (60s) RS256 assertion sent as
``client_assertion`` in the POST **body** (not the Authorization header). Uses a
client certificate/key pair instead of a client secret.
"""

from __future__ import annotations

import base64
import json
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlencode

import httpx
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives.asymmetric.rsa import RSAPrivateKey

from b2c_tooling_sdk.auth.dispatch_fetch import dispatch_fetch
from b2c_tooling_sdk.auth.jwt_utils import decode_jwt
from b2c_tooling_sdk.auth.middleware import (
    apply_auth_request_middleware,
    apply_auth_response_middleware,
    global_auth_middleware_registry,
)
from b2c_tooling_sdk.auth.oauth import (
    find_cached_token_satisfying,
    get_cached_oauth_token,
    get_oauth_cache_key,
    invalidate_cached_tokens_for_identity,
    set_cached_oauth_token,
)
from b2c_tooling_sdk.auth.types import AccessTokenResponse, DecodedJWT
from b2c_tooling_sdk.errors.network_error import wrap_network_error
from b2c_tooling_sdk.logging import get_logger

# Default token lifetime (seconds) when AM omits expires_in.
_DEFAULT_EXPIRES_IN = 1800
# JWT assertion lifetime (seconds).
_ASSERTION_LIFETIME = 60


def _base64url_encode(data: bytes) -> str:
    """Encode bytes as unpadded base64url (RFC 4648 §5)."""
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


class JwtOAuthConfig:
    """Configuration for :class:`JwtOAuthStrategy`."""

    def __init__(
        self,
        client_id: str,
        cert_path: str,
        key_path: str,
        account_manager_host: str,
        passphrase: str | None = None,
        scopes: list[str] | None = None,
    ) -> None:
        self.client_id = client_id
        self.cert_path = cert_path
        self.key_path = key_path
        self.account_manager_host = account_manager_host
        self.passphrase = passphrase
        self.scopes = scopes


class JwtOAuthStrategy:
    """OAuth 2.0 JWT Bearer authentication strategy (RFC 7523).

    Differs from client credentials: uses a public/private key pair instead of a
    secret, sends a self-signed short-lived JWT as ``client_assertion`` in the POST
    body, and shares the module-level token cache under the ``jwt`` method.
    """

    def __init__(self, config: JwtOAuthConfig) -> None:
        self._validate_config(config)
        self._config = config
        self._logger = get_logger("auth.oauth_jwt")
        self._cache_key = get_oauth_cache_key(config.client_id, "jwt", config.account_manager_host, config.scopes)
        self._identity_prefix = f"{config.account_manager_host}:{config.client_id}:jwt:"
        self._has_had_success = False
        # Cache the private key to avoid file I/O on every token request.
        self._private_key = self._load_private_key(config.key_path, config.passphrase)

    @staticmethod
    def _load_private_key(key_path: str, passphrase: str | None) -> Any:
        key_bytes = Path(key_path).read_bytes()
        password = passphrase.encode("utf-8") if passphrase else None
        return serialization.load_pem_private_key(key_bytes, password=password)

    def _validate_config(self, config: JwtOAuthConfig) -> None:
        if not config.client_id:
            raise ValueError("JWT authentication requires clientId")
        if not config.cert_path:
            raise ValueError("JWT authentication requires certificate path (--jwt-cert)")
        if not config.key_path:
            raise ValueError("JWT authentication requires private key path (--jwt-key)")
        if not config.account_manager_host:
            raise ValueError("JWT authentication requires accountManagerHost")

        cert = Path(config.cert_path)
        if not cert.exists():
            raise ValueError(
                f"JWT certificate file not found: {config.cert_path}\n"
                "Generate a certificate pair with: "
                "openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes"
            )
        cert_content = cert.read_text(encoding="utf-8", errors="replace")
        if "BEGIN CERTIFICATE" not in cert_content:
            raise ValueError(
                f"Invalid certificate format in {config.cert_path}. Expected PEM format (BEGIN CERTIFICATE)."
            )

        key = Path(config.key_path)
        if not key.exists():
            raise ValueError(
                f"JWT private key file not found: {config.key_path}\n"
                "Generate a key pair with: "
                "openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes"
            )
        key_content = key.read_text(encoding="utf-8", errors="replace")
        if "BEGIN" not in key_content or "PRIVATE KEY" not in key_content:
            raise ValueError(
                f"Invalid private key format in {config.key_path}. "
                "Expected PEM format (BEGIN PRIVATE KEY or BEGIN RSA PRIVATE KEY)."
            )

        # Validate the key loads (surfacing encrypted-key / wrong-passphrase issues).
        password = config.passphrase.encode("utf-8") if config.passphrase else None
        try:
            serialization.load_pem_private_key(key.read_bytes(), password=password)
        except TypeError as error:
            # cryptography raises TypeError when a password is needed but absent, or given but not needed.
            message = str(error).lower()
            if "encrypted" in message or "password" in message:
                raise ValueError(
                    "JWT private key is encrypted but no passphrase provided.\n"
                    "Use --jwt-passphrase flag or SFCC_JWT_PASSPHRASE environment variable."
                ) from error
            raise ValueError(f"Invalid JWT private key at {config.key_path}: {error}") from error
        except ValueError as error:
            raise ValueError(
                "Invalid passphrase for encrypted JWT private key.\n"
                "Use --jwt-passphrase flag or SFCC_JWT_PASSPHRASE environment variable to provide the passphrase."
            ) from error

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
        """Perform a request with JWT Bearer auth, retrying once on a post-success 401."""
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
        """Return the full token response, using the cache when valid."""
        cached = get_cached_oauth_token(self._cache_key, self._config.scopes or [])
        if cached is not None:
            self._logger.debug("[JwtOAuthStrategy] Reusing cached access token")
            return cached
        return await self._request_new_token()

    def invalidate_token(self) -> None:
        """Evict every cached token for this client/AM-host JWT identity."""
        invalidate_cached_tokens_for_identity(self._identity_prefix)

    def with_additional_scopes(self, additional_scopes: list[str]) -> JwtOAuthStrategy:
        """Return a new strategy with ``additional_scopes`` merged into the configured scopes."""
        merged = list(dict.fromkeys([*(self._config.scopes or []), *additional_scopes]))
        return JwtOAuthStrategy(
            JwtOAuthConfig(
                client_id=self._config.client_id,
                cert_path=self._config.cert_path,
                key_path=self._config.key_path,
                account_manager_host=self._config.account_manager_host,
                passphrase=self._config.passphrase,
                scopes=merged,
            )
        )

    async def get_access_token_for_cascade(self, candidates: list[list[str]]) -> str:
        """Resolve a scope cascade for the JWT flow (mirrors :meth:`OAuthStrategy.get_access_token_for_cascade`)."""
        base_scopes = self._config.scopes or []
        for candidate in candidates:
            required = list(dict.fromkeys([*base_scopes, *candidate]))
            cached = find_cached_token_satisfying(self._identity_prefix, required)
            if cached is not None:
                self._logger.debug("[JwtOAuthStrategy] Cache hit for cascade candidate %s", candidate)
                return cached.access_token

        last_error: BaseException | None = None
        for candidate in candidates:
            merged = list(dict.fromkeys([*base_scopes, *candidate]))
            try:
                self._logger.debug("[JwtOAuthStrategy] Cascade trying scopes %s", candidate)
                token_response = await self._request_new_token_for_scopes(merged)
                return token_response.access_token
            except Exception as error:  # noqa: BLE001 - invalid_scope expected; others rethrow
                if "invalid_scope" in str(error):
                    self._logger.debug(
                        "[JwtOAuthStrategy] Candidate %s rejected (invalid_scope), trying next", candidate
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
            return cached.access_token
        token_response = await self._request_new_token()
        return token_response.access_token

    async def _request_new_token(self) -> AccessTokenResponse:
        return await self._request_new_token_for_scopes(self._config.scopes)

    async def _request_new_token_for_scopes(self, scopes: list[str] | None) -> AccessTokenResponse:
        assertion = self._create_signed_jwt()
        token_url = f"https://{self._config.account_manager_host}/dwsso/oauth2/access_token"

        # JWT credentials go in the POST body, NOT the Authorization header.
        params: dict[str, str] = {
            "grant_type": "client_credentials",
            "client_assertion_type": "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
            "client_assertion": assertion,
        }
        if scopes:
            params["scope"] = " ".join(scopes)
        body = urlencode(params)

        headers = {"Content-Type": "application/x-www-form-urlencoded"}
        middleware = global_auth_middleware_registry.get_middleware()

        async with httpx.AsyncClient() as client:
            request = client.build_request("POST", token_url, content=body, headers=headers)
            request = await apply_auth_request_middleware(request, middleware)
            try:
                response = await client.send(request)
            except Exception as err:  # noqa: BLE001 - wrapped only if network-level
                host = httpx.URL(token_url).host
                raise wrap_network_error(err, operation="OAuth JWT token request", host=host) from err
            response = await apply_auth_response_middleware(request, response, middleware)

            if not response.is_success:
                error_text = response.text
                self._logger.error("[JwtOAuthStrategy] JWT authentication failed: %s", response.status_code)
                if response.status_code == 401:
                    raise RuntimeError(
                        f"JWT authentication failed (401): Invalid JWT signature or unregistered certificate. "
                        f"Ensure the certificate ({self._config.cert_path}) is registered in Account Manager."
                    )
                if response.status_code == 400:
                    raise RuntimeError(f"JWT authentication failed (400): {error_text}")
                raise RuntimeError(
                    f"JWT authentication failed: {response.status_code} {response.reason_phrase}\n{error_text}"
                )
            data = response.json()

        access_token = data.get("access_token")
        if not access_token:
            raise RuntimeError("No access token in response from Account Manager")

        expires_in = data.get("expires_in") or _DEFAULT_EXPIRES_IN
        expiry = datetime.now(tz=timezone.utc) + timedelta(seconds=expires_in)

        decoded = decode_jwt(access_token)
        scope = decoded.payload.get("scope")
        if isinstance(scope, list):
            token_scopes = [str(s) for s in scope]
        elif isinstance(scope, str):
            token_scopes = scope.split(" ")
        else:
            token_scopes = scopes or []

        token_response = AccessTokenResponse(access_token=access_token, expires=expiry, scopes=token_scopes)
        cache_key = get_oauth_cache_key(self._config.client_id, "jwt", self._config.account_manager_host, scopes)
        set_cached_oauth_token(cache_key, token_response)
        return token_response

    def _create_signed_jwt(self) -> str:
        header = {"alg": "RS256", "typ": "JWT"}
        encoded_header = _base64url_encode(json.dumps(header).encode("utf-8"))
        now = int(time.time())
        token_url = f"https://{self._config.account_manager_host}/dwsso/oauth2/access_token"
        payload = {
            "iss": self._config.client_id,
            "sub": self._config.client_id,
            "aud": token_url,
            "exp": now + _ASSERTION_LIFETIME,
        }
        encoded_payload = _base64url_encode(json.dumps(payload).encode("utf-8"))
        signature_input = f"{encoded_header}.{encoded_payload}".encode("ascii")
        if not isinstance(self._private_key, RSAPrivateKey):
            raise ValueError("JWT Bearer flow requires an RSA private key")
        signature = self._private_key.sign(signature_input, padding.PKCS1v15(), hashes.SHA256())
        encoded_signature = _base64url_encode(signature)
        return f"{encoded_header}.{encoded_payload}.{encoded_signature}"


__all__ = ["JwtOAuthConfig", "JwtOAuthStrategy"]
