# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""SCAPI Merchant Users client for B2C Commerce.

Mirrors ``src/clients/scapi-merchant-users.ts``. Provides a client for the
SCAPI Merchant Users Admin API (``merchant/users/v1``), using a single static
read-write scope (``sfcc.users.rw``) for every operation.

Returns a configured :class:`~b2c_tooling_sdk.clients._core.HttpClient`; callers
use ``client.get(path, {...})`` etc., each returning a
:class:`~b2c_tooling_sdk.clients._core.ClientResult`.
"""

from __future__ import annotations

from b2c_tooling_sdk.auth.types import AuthStrategy
from b2c_tooling_sdk.clients._core import HttpClient
from b2c_tooling_sdk.clients.models.scapi_merchant_users import User, UserSearch, UserUpdateRequest
from b2c_tooling_sdk.clients.scapi_client_factory import BuildScapiClientOptions, ScapiClientConfig, build_scapi_client

#: The typed SCAPI Merchant Users client. Aliased to :class:`HttpClient` (the
#: ``openapi-fetch`` ``Client`` analog).
ScapiMerchantUsersClient = HttpClient

#: Configuration for creating a SCAPI Merchant Users client. Alias of the
#: shared :class:`ScapiClientConfig`.
ScapiMerchantUsersClientConfig = ScapiClientConfig

#: Read-only scope for SCAPI Merchant Users.
SCAPI_MERCHANT_USERS_READ_SCOPES = ["sfcc.users"]

#: Read-write scope for SCAPI Merchant Users (used by default for every operation).
SCAPI_MERCHANT_USERS_RW_SCOPES = ["sfcc.users.rw"]


def create_scapi_merchant_users_client(
    config: ScapiMerchantUsersClientConfig, auth: AuthStrategy
) -> ScapiMerchantUsersClient:
    """Create a typed SCAPI Merchant Users Admin API client.

    :param config: SCAPI client configuration including short code and tenant ID.
    :param auth: Authentication strategy (typically OAuth).
    :returns: A configured :class:`HttpClient`.
    """
    return build_scapi_client(
        BuildScapiClientOptions(
            path_segment="merchant/users/v1",
            domain_key="scapi-merchant-users",
            default_scopes=SCAPI_MERCHANT_USERS_RW_SCOPES,
            log_prefix="SCAPI-USERS",
        ),
        config,
        auth,
    )


__all__ = [
    "SCAPI_MERCHANT_USERS_READ_SCOPES",
    "SCAPI_MERCHANT_USERS_RW_SCOPES",
    "ScapiMerchantUsersClient",
    "ScapiMerchantUsersClientConfig",
    "User",
    "UserSearch",
    "UserUpdateRequest",
    "create_scapi_merchant_users_client",
]
