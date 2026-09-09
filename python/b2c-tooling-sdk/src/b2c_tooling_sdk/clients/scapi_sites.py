# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""SCAPI Sites client for B2C Commerce.

Mirrors ``src/clients/scapi-sites.ts``. Provides a client for the SCAPI Sites
Admin API (``site/sites/v1``), using a per-operation scope cascade (reads try
``sfcc.sites.rw`` first, then fall back to ``sfcc.sites``; writes require
``sfcc.sites.rw``).

Returns a configured :class:`~b2c_tooling_sdk.clients._core.HttpClient`; callers
use ``client.get(path, {...})`` etc., each returning a
:class:`~b2c_tooling_sdk.clients._core.ClientResult`.
"""

from __future__ import annotations

from b2c_tooling_sdk.auth.types import AuthStrategy
from b2c_tooling_sdk.clients._core import HttpClient
from b2c_tooling_sdk.clients.custom_apis import build_tenant_scope, normalize_tenant_id, to_organization_id
from b2c_tooling_sdk.clients.middleware import ScopeCascade
from b2c_tooling_sdk.clients.models.scapi_sites import Site, SiteCustomCartridges, Sites, SiteSearchResult
from b2c_tooling_sdk.clients.scapi_client_factory import BuildScapiClientOptions, ScapiClientConfig, build_scapi_client

#: The typed SCAPI Sites client. Aliased to :class:`HttpClient` (the
#: ``openapi-fetch`` ``Client`` analog).
ScapiSitesClient = HttpClient

#: Configuration for creating a SCAPI Sites client. Alias of the shared
#: :class:`ScapiClientConfig`.
ScapiSitesClientConfig = ScapiClientConfig

#: Per-operation scope cascade for SCAPI Sites.
#:
#: The Sites API exposes both read and cartridge-path write operations and
#: supports both a read-only (``sfcc.sites``) and read-write (``sfcc.sites.rw``)
#: scope. A given API client may have been granted only one of them, so reads
#: try ``rw`` first (which also grants read) and fall back to the read-only
#: scope. Write operations use the rw tier exclusively.
SCAPI_SITES_CASCADE = ScopeCascade(read=[["sfcc.sites.rw"], ["sfcc.sites"]], write=[["sfcc.sites.rw"]])


def create_scapi_sites_client(config: ScapiSitesClientConfig, auth: AuthStrategy) -> ScapiSitesClient:
    """Create a typed SCAPI Sites Admin API client.

    :param config: SCAPI client configuration including short code and tenant ID.
    :param auth: Authentication strategy (typically OAuth).
    :returns: A configured :class:`HttpClient`.
    """
    return build_scapi_client(
        BuildScapiClientOptions(
            path_segment="site/sites/v1",
            domain_key="scapi-sites",
            scope_cascade=SCAPI_SITES_CASCADE,
            log_prefix="SCAPI-SITES",
        ),
        config,
        auth,
    )


__all__ = [
    "SCAPI_SITES_CASCADE",
    "ScapiSitesClient",
    "ScapiSitesClientConfig",
    "Site",
    "SiteCustomCartridges",
    "SiteSearchResult",
    "Sites",
    "build_tenant_scope",
    "create_scapi_sites_client",
    "normalize_tenant_id",
    "to_organization_id",
]
