# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Centralized default values for B2C Commerce APIs.

These defaults are used across auth strategies, clients, and higher-level
operations. They mirror ``src/defaults.ts`` in the TypeScript SDK so both
implementations resolve identical hosts and public client IDs. Override via
environment variables or explicit configuration.
"""

from __future__ import annotations

#: Default Account Manager host for OAuth authentication.
#: Environment variable: ``SFCC_ACCOUNT_MANAGER_HOST``.
DEFAULT_ACCOUNT_MANAGER_HOST = "account.demandware.com"

#: Default On-Demand Sandbox (ODS) API host.
#: Environment variable: ``SFCC_SANDBOX_API_HOST``.
DEFAULT_ODS_HOST = "admin.dx.commercecloud.salesforce.com"

#: Default public client ID for browser-based user authentication
#: (Authorization Code + PKCE). Used as a fallback when no client ID is
#: configured for platform-level operations.
DEFAULT_PUBLIC_CLIENT_ID = "a40a7a9b-e854-4aa6-8078-d5f79872aa65"

#: Legacy public client ID used for the deprecated OAuth implicit flow.
#: Only used when a caller explicitly selects the ``implicit`` auth method.
LEGACY_IMPLICIT_PUBLIC_CLIENT_ID = "7eee11e3-375b-498f-a087-e450a330d202"

#: Host-specific overrides for the default (PKCE-capable) public client ID.
_HOST_CLIENT_ID_OVERRIDES: dict[str, str] = {
    "account-pod5.demandware.net": "3f41a930-b2bb-42c9-907d-f06a33c85849",
}

#: Host-specific legacy implicit clients retained for explicit opt-in only.
_LEGACY_IMPLICIT_HOST_CLIENT_ID_OVERRIDES: dict[str, str] = {
    "account-pod5.demandware.net": "c44527fe-66ff-4455-9eec-7287b2c66485",
}

#: Default local port for the PKCE / implicit browser callback server.
#: Environment variable: ``SFCC_OAUTH_LOCAL_PORT``.
DEFAULT_LOCAL_PORT = 8080


def get_default_public_client_id(account_manager_host: str | None = None) -> str:
    """Return the default PKCE public client ID for the given Account Manager host."""
    if account_manager_host and account_manager_host in _HOST_CLIENT_ID_OVERRIDES:
        return _HOST_CLIENT_ID_OVERRIDES[account_manager_host]
    return DEFAULT_PUBLIC_CLIENT_ID


def get_legacy_implicit_public_client_id(account_manager_host: str | None = None) -> str:
    """Return the legacy implicit public client ID for the given Account Manager host."""
    if account_manager_host and account_manager_host in _LEGACY_IMPLICIT_HOST_CLIENT_ID_OVERRIDES:
        return _LEGACY_IMPLICIT_HOST_CLIENT_ID_OVERRIDES[account_manager_host]
    return LEGACY_IMPLICIT_PUBLIC_CLIENT_ID
