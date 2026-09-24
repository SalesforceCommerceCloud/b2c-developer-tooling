# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Factory selecting between the SCAPI and OCAPI Business Manager roles backends.

Mirrors ``src/operations/bm-roles/backend.ts``.
"""

from __future__ import annotations

from b2c_tooling_sdk.clients.dual_backend_factory import DualBackendConfig, DualBackendCtors, create_dual_backend
from b2c_tooling_sdk.operations.bm_roles.ocapi_backend import OcapiRolesBackend
from b2c_tooling_sdk.operations.bm_roles.scapi_backend import ScapiRolesBackend
from b2c_tooling_sdk.operations.bm_roles.types import RolesBackend

#: Configuration for :func:`create_roles_backend`. Alias of the shared
#: :class:`~b2c_tooling_sdk.clients.dual_backend_factory.DualBackendConfig`.
RolesBackendConfig = DualBackendConfig


def create_roles_backend(config: RolesBackendConfig) -> RolesBackend:
    """Create a :class:`RolesBackend`, resolving SCAPI/OCAPI per ``config``."""
    return create_dual_backend(
        config,
        DualBackendCtors[RolesBackend](
            domain_name="Roles",
            scapi=lambda cfg: ScapiRolesBackend(cfg),
            ocapi=lambda inst: OcapiRolesBackend(inst),
        ),
    )


__all__ = ["RolesBackendConfig", "create_roles_backend"]
