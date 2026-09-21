# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Business Manager role operations for B2C Commerce instances.

Mirrors ``src/operations/bm-roles/index.ts``. This module provides functions
for managing instance-level access roles on B2C Commerce instances via the
OCAPI Data API. These are distinct from Account Manager roles managed via
:mod:`b2c_tooling_sdk.operations.roles`.

## Core Role Functions

- :func:`list_bm_roles` -- List all access roles on an instance
- :func:`get_bm_role` -- Get role details with optional expansion
- :func:`create_bm_role` -- Create a new access role
- :func:`delete_bm_role` -- Delete an access role

## User Assignment

- :func:`grant_bm_role` -- Assign a user to a role
- :func:`revoke_bm_role` -- Unassign a user from a role

## Permissions

- :func:`get_bm_role_permissions` -- Get permissions for a role
- :func:`set_bm_role_permissions` -- Replace all permissions for a role

## Usage

.. code-block:: python

    from b2c_tooling_sdk.operations.bm_roles import list_bm_roles, grant_bm_role, get_bm_role_permissions
    from b2c_tooling_sdk.config import resolve_config

    config = resolve_config()
    instance = config.create_b2c_instance()

    # List all roles
    roles = await list_bm_roles(instance)

    # Grant a role to a user
    await grant_bm_role(instance, "Administrator", "user@example.com")

    # Get permissions for a role
    permissions = await get_bm_role_permissions(instance, "Administrator")

## Authentication

BM role operations require OAuth authentication with appropriate OCAPI permissions
for the ``/roles`` resource.

## SCAPI/OCAPI dual backend

:func:`create_roles_backend` resolves a :class:`RolesBackend` (SCAPI-backed by
default, with OCAPI fallback) for callers that want a single interface instead
of the module-level OCAPI-only functions above.
"""

from __future__ import annotations

from b2c_tooling_sdk.operations.bm_roles.backend import RolesBackendConfig, create_roles_backend
from b2c_tooling_sdk.operations.bm_roles.ocapi_backend import OcapiRolesBackend
from b2c_tooling_sdk.operations.bm_roles.roles import (
    BmRole,
    BmRolePermissions,
    BmRoles,
    GetBmRoleOptions,
    ListBmRolesOptions,
    create_bm_role,
    delete_bm_role,
    get_bm_role,
    get_bm_role_permissions,
    grant_bm_role,
    list_bm_roles,
    revoke_bm_role,
    set_bm_role_permissions,
)
from b2c_tooling_sdk.operations.bm_roles.scapi_backend import ScapiRolesBackend, ScapiRolesBackendConfig
from b2c_tooling_sdk.operations.bm_roles.types import (
    CreateRoleInput,
    ListRolesOptions,
    ListRolesResult,
    RoleExpand,
    RoleInfo,
    RolePermissionsInfo,
    RolesBackend,
)

__all__ = [
    "BmRole",
    "BmRolePermissions",
    "BmRoles",
    "CreateRoleInput",
    "GetBmRoleOptions",
    "ListBmRolesOptions",
    "ListRolesOptions",
    "ListRolesResult",
    "OcapiRolesBackend",
    "RoleExpand",
    "RoleInfo",
    "RolePermissionsInfo",
    "RolesBackend",
    "RolesBackendConfig",
    "ScapiRolesBackend",
    "ScapiRolesBackendConfig",
    "create_bm_role",
    "create_roles_backend",
    "delete_bm_role",
    "get_bm_role",
    "get_bm_role_permissions",
    "grant_bm_role",
    "list_bm_roles",
    "revoke_bm_role",
    "set_bm_role_permissions",
]
