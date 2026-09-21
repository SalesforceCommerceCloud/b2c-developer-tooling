# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""SLAS shopper token retrieval.

Mirrors ``src/slas/token.ts``. Supports guest and registered-customer flows for
both public (PKCE) and private (``client_credentials`` / HTTP Basic) SLAS
clients.
"""

from __future__ import annotations

import base64
from urllib.parse import parse_qs, urlencode, urlsplit

import httpx

from b2c_tooling_sdk.auth.client_credentials import encode_basic_client_credentials
from b2c_tooling_sdk.errors.network_error import wrap_network_error
from b2c_tooling_sdk.logging import get_logger
from b2c_tooling_sdk.slas.pkce import generate_code_challenge, generate_code_verifier
from b2c_tooling_sdk.slas.types import SlasRegisteredLoginConfig, SlasTokenConfig, SlasTokenResponse

_logger = get_logger("slas.token")

_FORM_CONTENT_TYPE = "application/x-www-form-urlencoded"


def _build_base_url(short_code: str, organization_id: str) -> str:
    """Build the SLAS shopper auth base URL."""
    return f"https://{short_code}.api.commercecloud.salesforce.com/shopper/auth/v1/organizations/{organization_id}"


def _parse_redirect_code(location_header: str) -> tuple[str, str]:
    """Parse an authorization ``code`` and ``usid`` from a redirect ``Location`` header.

    :raises RuntimeError: If the redirect does not contain the expected ``code`` parameter.
    :returns: A ``(code, usid)`` tuple; ``usid`` defaults to an empty string.
    """
    query = parse_qs(urlsplit(location_header).query)
    code_values = query.get("code")
    code = code_values[0] if code_values else None
    usid_values = query.get("usid")
    usid = usid_values[0] if usid_values else ""

    if not code:
        raise RuntimeError(f"SLAS redirect did not contain authorization code. Location: {location_header}")

    return code, usid


def _check_response(response: httpx.Response, context: str) -> None:
    """Check a SLAS response for errors and raise with details.

    :raises RuntimeError: If the response is not a 2xx.
    """
    if response.is_success:
        return

    detail = ""
    try:
        body = response.text
        detail = f" — {body}" if body else ""
    except Exception:  # noqa: BLE001 - ignore body decode errors
        detail = ""

    raise RuntimeError(f"SLAS {context} failed (HTTP {response.status_code}){detail}")


async def _logged_request(
    client: httpx.AsyncClient,
    method: str,
    url: str,
    *,
    headers: dict[str, str] | None = None,
    content: str | None = None,
) -> httpx.Response:
    """Perform a logged request, wrapping transport failures in a ``NetworkError``.

    Returns the response; the caller must check the status.
    """
    _logger.debug("[SLAS REQ] %s %s", method, url)
    try:
        response = await client.request(method, url, headers=headers, content=content)
    except Exception as err:  # noqa: BLE001 - classified + re-raised via wrap_network_error
        host = urlsplit(url).netloc
        raise wrap_network_error(err, operation="SLAS token request", host=host) from err

    _logger.debug("[SLAS RESP] %s %s %s", method, url, response.status_code)
    return response


async def get_guest_token(config: SlasTokenConfig) -> SlasTokenResponse:
    """Retrieve a guest shopper access token from SLAS.

    - **Private client** (``slas_client_secret`` set): uses the
      ``client_credentials`` grant.
    - **Public client** (no secret): uses the PKCE authorization-code flow with
      ``hint=guest``.

    :param config: SLAS token configuration.
    :returns: The token response including ``access_token`` and ``refresh_token``.
    """
    if config.slas_client_secret:
        return await _get_private_client_guest_token(config)

    _logger.debug("[SLAS] Using public client PKCE guest flow (client_id=%s)", config.slas_client_id)

    base_url = _build_base_url(config.short_code, config.organization_id)
    verifier = generate_code_verifier()
    challenge = generate_code_challenge(verifier)

    async with httpx.AsyncClient(follow_redirects=False) as client:
        # Step 1: Authorize — get authorization code via 303 redirect
        authorize_params = urlencode(
            {
                "client_id": config.slas_client_id,
                "response_type": "code",
                "redirect_uri": config.redirect_uri,
                "hint": "guest",
                "code_challenge": challenge,
            }
        )
        authorize_url = f"{base_url}/oauth2/authorize?{authorize_params}"

        authorize_response = await _logged_request(client, "GET", authorize_url)

        if authorize_response.status_code != 303:
            _check_response(authorize_response, "authorize")
            raise RuntimeError(f"Expected 303 redirect from SLAS authorize, got {authorize_response.status_code}")

        location = authorize_response.headers.get("location")
        if not location:
            raise RuntimeError("SLAS authorize response missing Location header")

        code, usid = _parse_redirect_code(location)
        _logger.debug("[SLAS] Got authorization code (usid=%s)", usid)

        # Step 2: Exchange code for token
        token_body = urlencode(
            {
                "grant_type": "authorization_code_pkce",
                "client_id": config.slas_client_id,
                "code": code,
                "code_verifier": verifier,
                "redirect_uri": config.redirect_uri,
                "channel_id": config.site_id,
                "usid": usid,
            }
        )
        token_url = f"{base_url}/oauth2/token"
        token_response = await _logged_request(
            client,
            "POST",
            token_url,
            headers={"Content-Type": _FORM_CONTENT_TYPE},
            content=token_body,
        )

        _check_response(token_response, "token exchange (authorization_code_pkce)")
        return SlasTokenResponse.from_dict(token_response.json())


async def _get_private_client_guest_token(config: SlasTokenConfig) -> SlasTokenResponse:
    """Retrieve a private-client guest token via the ``client_credentials`` grant."""
    _logger.debug(
        "[SLAS] Using private client client_credentials guest flow (client_id=%s)",
        config.slas_client_id,
    )

    base_url = _build_base_url(config.short_code, config.organization_id)
    assert config.slas_client_secret is not None  # guarded by caller
    basic_auth = encode_basic_client_credentials(config.slas_client_id, config.slas_client_secret)

    token_body = urlencode(
        {
            "grant_type": "client_credentials",
            "channel_id": config.site_id,
        }
    )
    token_url = f"{base_url}/oauth2/token"

    async with httpx.AsyncClient(follow_redirects=False) as client:
        token_response = await _logged_request(
            client,
            "POST",
            token_url,
            headers={
                "Content-Type": _FORM_CONTENT_TYPE,
                "Authorization": f"Basic {basic_auth}",
            },
            content=token_body,
        )

        _check_response(token_response, "token (client_credentials)")
        return SlasTokenResponse.from_dict(token_response.json())


async def get_registered_token(config: SlasRegisteredLoginConfig) -> SlasTokenResponse:
    """Retrieve a registered-customer access token from SLAS.

    Uses the ``/oauth2/login`` endpoint with shopper credentials, then exchanges
    the returned authorization code for an access token.

    The registered-customer flow is PKCE-protected for **both** public and
    private clients: a ``code_challenge`` is always presented at the
    ``/oauth2/login`` step, so the matching ``code_verifier`` must always be sent
    at the token exchange with the ``authorization_code_pkce`` grant.

    - **Public client**: PKCE token exchange (no client secret).
    - **Private client**: PKCE token exchange, plus HTTP Basic authentication
      using the client secret. The client must NOT drop PKCE, or SLAS rejects the
      exchange with ``400 code_verifier is required``.

    :param config: SLAS token configuration including shopper credentials.
    :returns: The token response including ``access_token`` and ``refresh_token``.
    """
    base_url = _build_base_url(config.short_code, config.organization_id)
    is_private = bool(config.slas_client_secret)

    _logger.debug(
        "[SLAS] Using registered customer login flow (client_id=%s, is_private=%s)",
        config.slas_client_id,
        is_private,
    )

    verifier = generate_code_verifier()
    challenge = generate_code_challenge(verifier)

    async with httpx.AsyncClient(follow_redirects=False) as client:
        # Step 1: Login with shopper credentials
        shopper_auth = base64.b64encode(f"{config.shopper_login}:{config.shopper_password}".encode()).decode("ascii")

        login_body = urlencode(
            {
                "client_id": config.slas_client_id,
                "channel_id": config.site_id,
                "code_challenge": challenge,
                "redirect_uri": config.redirect_uri,
            }
        )
        login_url = f"{base_url}/oauth2/login"
        login_response = await _logged_request(
            client,
            "POST",
            login_url,
            headers={
                "Content-Type": _FORM_CONTENT_TYPE,
                "Authorization": f"Basic {shopper_auth}",
            },
            content=login_body,
        )

        if login_response.status_code != 303:
            _check_response(login_response, "login")
            raise RuntimeError(f"Expected 303 redirect from SLAS login, got {login_response.status_code}")

        location = login_response.headers.get("location")
        if not location:
            raise RuntimeError("SLAS login response missing Location header")

        code, usid = _parse_redirect_code(location)
        _logger.debug("[SLAS] Got authorization code from login (usid=%s)", usid)

        # Step 2: Exchange code for token.
        #
        # The login step always presents a ``code_challenge``, so the token
        # exchange must always send the matching ``code_verifier`` with the
        # ``authorization_code_pkce`` grant — for both public and private
        # clients. A private client additionally authenticates with HTTP Basic
        # using its secret; it must NOT downgrade to the plain
        # ``authorization_code`` grant or SLAS rejects the exchange with
        # ``400 code_verifier is required``.
        token_url = f"{base_url}/oauth2/token"
        token_body = urlencode(
            {
                "grant_type": "authorization_code_pkce",
                "client_id": config.slas_client_id,
                "code": code,
                "code_verifier": verifier,
                "redirect_uri": config.redirect_uri,
                "channel_id": config.site_id,
                "usid": usid,
            }
        )

        token_headers: dict[str, str] = {"Content-Type": _FORM_CONTENT_TYPE}
        if is_private:
            assert config.slas_client_secret is not None  # guarded by is_private
            basic_auth = encode_basic_client_credentials(config.slas_client_id, config.slas_client_secret)
            token_headers["Authorization"] = f"Basic {basic_auth}"

        token_response = await _logged_request(
            client,
            "POST",
            token_url,
            headers=token_headers,
            content=token_body,
        )

        _check_response(token_response, "token exchange (authorization_code_pkce)")
        return SlasTokenResponse.from_dict(token_response.json())


__all__ = ["get_guest_token", "get_registered_token"]
