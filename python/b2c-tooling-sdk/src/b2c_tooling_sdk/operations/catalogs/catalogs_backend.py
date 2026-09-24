# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Factory selecting between the SCAPI and OCAPI catalogs backends.

Mirrors ``src/operations/catalogs/catalogs-backend.ts``.
"""

from __future__ import annotations

from b2c_tooling_sdk.clients.dual_backend_factory import DualBackendConfig, DualBackendCtors, create_dual_backend
from b2c_tooling_sdk.operations.catalogs.catalogs_types import CatalogsBackend
from b2c_tooling_sdk.operations.catalogs.ocapi_catalogs_backend import OcapiCatalogsBackend
from b2c_tooling_sdk.operations.catalogs.scapi_catalogs_backend import ScapiCatalogsBackend

#: Configuration for :func:`create_catalogs_backend`. Alias of the shared
#: :class:`~b2c_tooling_sdk.clients.dual_backend_factory.DualBackendConfig`.
CatalogsBackendConfig = DualBackendConfig


def create_catalogs_backend(config: CatalogsBackendConfig) -> CatalogsBackend:
    """Create a :class:`CatalogsBackend`, resolving SCAPI/OCAPI per ``config``."""
    return create_dual_backend(
        config,
        DualBackendCtors[CatalogsBackend](
            domain_name="Catalogs",
            scapi=lambda cfg: ScapiCatalogsBackend(cfg),
            ocapi=lambda inst: OcapiCatalogsBackend(inst),
        ),
    )


__all__ = ["CatalogsBackendConfig", "create_catalogs_backend"]
