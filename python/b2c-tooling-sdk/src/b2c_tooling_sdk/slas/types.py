# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Types for SLAS Shopper Login token retrieval.

Mirrors ``src/slas/types.ts``. :class:`SlasTokenConfig` and
:class:`SlasRegisteredLoginConfig` describe the inputs for the guest and
registered-customer flows, and :class:`SlasTokenResponse` mirrors the JSON body
returned by the SLAS ``/oauth2/token`` endpoint.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(kw_only=True)
class SlasTokenResponse:
    """Response from SLAS token endpoints.

    :ivar access_token: The shopper access token (JWT).
    :ivar refresh_token: The refresh token for silent renewal.
    :ivar expires_in: Access-token lifetime in seconds.
    :ivar token_type: The token type (typically ``Bearer``).
    :ivar usid: The unique shopper identifier.
    :ivar customer_id: The customer identifier.
    :ivar id_token: Optional OpenID Connect ID token.
    """

    access_token: str
    refresh_token: str
    expires_in: int
    token_type: str
    usid: str
    customer_id: str
    id_token: str | None = None

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> SlasTokenResponse:
        """Build a :class:`SlasTokenResponse` from a raw SLAS JSON body."""
        return cls(
            access_token=data["access_token"],
            refresh_token=data["refresh_token"],
            expires_in=data["expires_in"],
            token_type=data["token_type"],
            usid=data["usid"],
            customer_id=data["customer_id"],
            id_token=data.get("id_token"),
        )


@dataclass(kw_only=True)
class SlasTokenConfig:
    """Configuration for SLAS shopper token retrieval.

    :ivar short_code: SCAPI short code.
    :ivar organization_id: Organization ID in ``f_ecom_xxxx_yyy`` format.
    :ivar slas_client_id: SLAS client ID.
    :ivar site_id: B2C Commerce site/channel ID.
    :ivar redirect_uri: OAuth redirect URI.
    :ivar slas_client_secret: SLAS client secret (``None`` = public client).
    """

    short_code: str
    organization_id: str
    slas_client_id: str
    site_id: str
    redirect_uri: str
    slas_client_secret: str | None = None


@dataclass(kw_only=True)
class SlasRegisteredLoginConfig(SlasTokenConfig):
    """Configuration for registered customer login.

    :ivar shopper_login: Shopper login/username.
    :ivar shopper_password: Shopper password.
    """

    shopper_login: str
    shopper_password: str


__all__ = ["SlasTokenConfig", "SlasTokenResponse", "SlasRegisteredLoginConfig"]
