# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Factory selecting between the SCAPI and OCAPI sites backends.

Mirrors ``src/operations/sites/sites-backend.ts``.
"""

from __future__ import annotations

from b2c_tooling_sdk.clients.dual_backend_factory import DualBackendConfig, DualBackendCtors, create_dual_backend
from b2c_tooling_sdk.operations.sites.ocapi_sites_backend import OcapiSitesBackend
from b2c_tooling_sdk.operations.sites.scapi_sites_backend import ScapiSitesBackend
from b2c_tooling_sdk.operations.sites.sites_types import SitesBackend

#: Configuration for :func:`create_sites_backend`. Alias of the shared
#: :class:`~b2c_tooling_sdk.clients.dual_backend_factory.DualBackendConfig`.
SitesBackendConfig = DualBackendConfig


def create_sites_backend(config: SitesBackendConfig) -> SitesBackend:
    """Builds a Sites backend for site and cartridge-path operations.

    In ``auto`` mode (the default) it prefers SCAPI (``site/sites/v1``) and
    falls back to the deprecated OCAPI Data API on a safe capability/auth/request
    rejection.
    """
    return create_dual_backend(
        config,
        DualBackendCtors[SitesBackend](
            domain_name="Sites",
            scapi=lambda cfg: ScapiSitesBackend(cfg),
            ocapi=lambda inst: OcapiSitesBackend(inst),
        ),
    )


__all__ = ["SitesBackendConfig", "create_sites_backend"]
