# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""SCAPI Catalogs client for B2C Commerce.

Mirrors ``src/clients/scapi-catalogs.ts``. Provides a client for the SCAPI
Catalogs Admin API (``product/catalogs/v1``), using a per-operation scope
cascade (reads try ``sfcc.catalogs.rw`` first, then fall back to
``sfcc.catalogs``; writes require ``sfcc.catalogs.rw``).

Returns a configured :class:`~b2c_tooling_sdk.clients._core.HttpClient`; callers
use ``client.get(path, {...})`` etc., each returning a
:class:`~b2c_tooling_sdk.clients._core.ClientResult`.
"""

from __future__ import annotations

from b2c_tooling_sdk.auth.types import AuthStrategy
from b2c_tooling_sdk.clients._core import HttpClient
from b2c_tooling_sdk.clients.middleware import ScopeCascade
from b2c_tooling_sdk.clients.models.scapi_catalogs import Catalog, Catalogs
from b2c_tooling_sdk.clients.scapi_client_factory import BuildScapiClientOptions, ScapiClientConfig, build_scapi_client

#: The typed SCAPI Catalogs client. Aliased to :class:`HttpClient` (the
#: ``openapi-fetch`` ``Client`` analog).
ScapiCatalogsClient = HttpClient

#: Configuration for creating a SCAPI Catalogs client. Alias of the shared
#: :class:`ScapiClientConfig`.
ScapiCatalogsClientConfig = ScapiClientConfig

#: Per-operation scope cascade for SCAPI Catalogs.
SCAPI_CATALOGS_CASCADE = ScopeCascade(read=[["sfcc.catalogs.rw"], ["sfcc.catalogs"]], write=[["sfcc.catalogs.rw"]])


def create_scapi_catalogs_client(config: ScapiCatalogsClientConfig, auth: AuthStrategy) -> ScapiCatalogsClient:
    """Create a typed SCAPI Catalogs Admin API client.

    :param config: SCAPI client configuration including short code and tenant ID.
    :param auth: Authentication strategy (typically OAuth).
    :returns: A configured :class:`HttpClient`.
    """
    return build_scapi_client(
        BuildScapiClientOptions(
            path_segment="product/catalogs/v1",
            domain_key="scapi-catalogs",
            scope_cascade=SCAPI_CATALOGS_CASCADE,
            log_prefix="SCAPI-CATALOGS",
        ),
        config,
        auth,
    )


__all__ = [
    "SCAPI_CATALOGS_CASCADE",
    "Catalog",
    "Catalogs",
    "ScapiCatalogsClient",
    "ScapiCatalogsClientConfig",
    "create_scapi_catalogs_client",
]
