# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Factory selecting between the SCAPI and OCAPI Business Manager users backends.

Mirrors ``src/operations/bm-users/backend.ts``.
"""

from __future__ import annotations

from b2c_tooling_sdk.clients.dual_backend_factory import DualBackendConfig, DualBackendCtors, create_dual_backend
from b2c_tooling_sdk.operations.bm_users.ocapi_backend import OcapiUsersBackend
from b2c_tooling_sdk.operations.bm_users.scapi_backend import ScapiUsersBackend
from b2c_tooling_sdk.operations.bm_users.types import UsersBackend

#: Configuration for :func:`create_users_backend`. Alias of the shared
#: :class:`~b2c_tooling_sdk.clients.dual_backend_factory.DualBackendConfig`.
UsersBackendConfig = DualBackendConfig


def create_users_backend(config: UsersBackendConfig) -> UsersBackend:
    """Create a :class:`UsersBackend`, resolving SCAPI/OCAPI per ``config``."""
    return create_dual_backend(
        config,
        DualBackendCtors[UsersBackend](
            domain_name="Users",
            scapi=lambda cfg: ScapiUsersBackend(cfg),
            ocapi=lambda inst: OcapiUsersBackend(inst),
        ),
    )


__all__ = ["UsersBackendConfig", "create_users_backend"]
