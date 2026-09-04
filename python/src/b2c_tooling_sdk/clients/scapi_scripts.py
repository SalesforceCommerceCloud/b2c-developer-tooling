# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""SCAPI Scripts client for B2C Commerce.

Mirrors ``src/clients/scapi-scripts.ts``. Provides a client for the SCAPI
Scripts DX API (``dx/scripts/v1``), using a single static read-write scope
(``sfcc.scripts.rw``) for every operation.

Returns a configured :class:`~b2c_tooling_sdk.clients._core.HttpClient`; callers
use ``client.get(path, {...})`` etc., each returning a
:class:`~b2c_tooling_sdk.clients._core.ClientResult`.
"""

from __future__ import annotations

from b2c_tooling_sdk.auth.types import AuthStrategy
from b2c_tooling_sdk.clients._core import HttpClient
from b2c_tooling_sdk.clients.models.scapi_scripts import CodeVersion
from b2c_tooling_sdk.clients.scapi_client_factory import BuildScapiClientOptions, ScapiClientConfig, build_scapi_client

#: The typed SCAPI Scripts client. Aliased to :class:`HttpClient` (the
#: ``openapi-fetch`` ``Client`` analog).
ScapiScriptsClient = HttpClient

#: Configuration for creating a SCAPI Scripts client. Alias of the shared
#: :class:`ScapiClientConfig`.
ScapiScriptsClientConfig = ScapiClientConfig

#: Read-only scope for SCAPI Scripts.
SCAPI_SCRIPTS_READ_SCOPES = ["sfcc.scripts"]

#: Read-write scope for SCAPI Scripts (used by default for every operation).
SCAPI_SCRIPTS_RW_SCOPES = ["sfcc.scripts.rw"]


def create_scapi_scripts_client(config: ScapiScriptsClientConfig, auth: AuthStrategy) -> ScapiScriptsClient:
    """Create a typed SCAPI Scripts DX API client.

    :param config: SCAPI client configuration including short code and tenant ID.
    :param auth: Authentication strategy (typically OAuth).
    :returns: A configured :class:`HttpClient`.
    """
    return build_scapi_client(
        BuildScapiClientOptions(
            path_segment="dx/scripts/v1",
            domain_key="scapi-scripts",
            default_scopes=SCAPI_SCRIPTS_RW_SCOPES,
            log_prefix="SCAPI-SCRIPTS",
        ),
        config,
        auth,
    )


__all__ = [
    "SCAPI_SCRIPTS_READ_SCOPES",
    "SCAPI_SCRIPTS_RW_SCOPES",
    "CodeVersion",
    "ScapiScriptsClient",
    "ScapiScriptsClientConfig",
    "create_scapi_scripts_client",
]
