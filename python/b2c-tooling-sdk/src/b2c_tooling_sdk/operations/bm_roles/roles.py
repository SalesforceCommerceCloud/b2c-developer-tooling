# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Business Manager role operations for B2C Commerce instances.

Mirrors ``src/operations/bm-roles/roles.ts``. Provides functions for managing
instance-level access roles via the OCAPI Data API.

The generic :class:`~b2c_tooling_sdk.clients._core.HttpClient` returns raw parsed
JSON (``dict[str, Any]``) rather than a validated model -- like the TypeScript
``openapi-fetch`` client, whose generated types are compile-time only. ``BmRole``,
``BmRoles``, and ``BmRolePermissions`` are therefore plain JSON aliases.
"""

from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any, cast

from b2c_tooling_sdk.clients.error_utils import throw_ocapi_error
from b2c_tooling_sdk.clients.scapi_merchant_roles import (
    SCAPI_MERCHANT_ROLES_READ_SCOPES,
    SCAPI_MERCHANT_ROLES_RW_SCOPES,
)

if TYPE_CHECKING:
    from b2c_tooling_sdk.instance import B2CInstance

# SCAPI Merchant Roles scopes named in the OCAPI-deprecation message.
_ROLES_READ_SCOPES = [*SCAPI_MERCHANT_ROLES_READ_SCOPES, *SCAPI_MERCHANT_ROLES_RW_SCOPES]
_ROLES_RW_SCOPES = list(SCAPI_MERCHANT_ROLES_RW_SCOPES)

#: BM access role from OCAPI.
BmRole = dict[str, Any]

#: BM access roles collection from OCAPI.
BmRoles = dict[str, Any]

#: BM role permissions from OCAPI.
BmRolePermissions = dict[str, Any]


@dataclass
class ListBmRolesOptions:
    """Options for listing BM roles."""

    #: Start index (default 0).
    start: int | None = None
    #: Number of items to return (default 25).
    count: int | None = None


@dataclass
class GetBmRoleOptions:
    """Options for getting a BM role."""

    #: Expansions to apply (e.g. 'users', 'permissions').
    expand: Sequence[str] | None = None


async def list_bm_roles(instance: B2CInstance, options: ListBmRolesOptions | None = None) -> BmRoles:
    """Lists all access roles on a B2C Commerce instance.

    :param instance: B2C instance to query.
    :param options: Pagination options.
    :returns: Roles collection with pagination info.
    """
    opts = options or ListBmRolesOptions()

    result = await instance.ocapi.get(
        "/roles",
        {"params": {"query": {"start": opts.start, "count": opts.count, "select": "(**)"}}},
    )

    if result.error:
        response = result.response
        assert response is not None
        throw_ocapi_error(result.error, response, "Failed to list roles", _ROLES_READ_SCOPES)

    return cast(BmRoles, result.data)


async def get_bm_role(instance: B2CInstance, role_id: str, options: GetBmRoleOptions | None = None) -> BmRole:
    """Gets details of a specific access role.

    :param instance: B2C instance to query.
    :param role_id: Role ID (e.g. "Administrator").
    :param options: Expand options.
    :returns: Role details.
    """
    opts = options or GetBmRoleOptions()

    result = await instance.ocapi.get(
        "/roles/{id}",
        {"params": {"path": {"id": role_id}, "query": {"expand": opts.expand}}},
    )

    if result.error:
        response = result.response
        assert response is not None
        throw_ocapi_error(result.error, response, f"Failed to get role {role_id}", _ROLES_READ_SCOPES)

    return cast(BmRole, result.data)


async def create_bm_role(instance: B2CInstance, role_id: str, *, description: str | None = None) -> BmRole:
    """Creates a new access role on an instance.

    :param instance: B2C instance.
    :param role_id: Role ID to create.
    :param description: Role description.
    :returns: Created role.
    """
    body: dict[str, Any] = {"id": role_id}
    if description is not None:
        body["description"] = description

    result = await instance.ocapi.put("/roles/{id}", {"params": {"path": {"id": role_id}}, "body": body})

    if result.error:
        response = result.response
        assert response is not None
        throw_ocapi_error(result.error, response, f"Failed to create role {role_id}", _ROLES_RW_SCOPES)

    return cast(BmRole, result.data)


async def delete_bm_role(instance: B2CInstance, role_id: str) -> None:
    """Deletes an access role from an instance.

    System roles (e.g. "Administrator", "Support") cannot be deleted.

    :param instance: B2C instance.
    :param role_id: Role ID to delete.
    """
    result = await instance.ocapi.delete("/roles/{id}", {"params": {"path": {"id": role_id}}})

    if result.error:
        response = result.response
        assert response is not None
        throw_ocapi_error(result.error, response, f"Failed to delete role {role_id}", _ROLES_RW_SCOPES)


async def grant_bm_role(instance: B2CInstance, role_id: str, login: str) -> dict[str, Any]:
    """Assigns a user to an access role on an instance.

    :param instance: B2C instance.
    :param role_id: Role ID to grant.
    :param login: User login (email).
    :returns: The user object after assignment.
    """
    result = await instance.ocapi.put(
        "/roles/{id}/users/{login}", {"params": {"path": {"id": role_id, "login": login}}}
    )

    if result.error:
        response = result.response
        assert response is not None
        throw_ocapi_error(result.error, response, f"Failed to grant role {role_id} to {login}", _ROLES_RW_SCOPES)

    return cast("dict[str, Any]", result.data)


async def revoke_bm_role(instance: B2CInstance, role_id: str, login: str) -> None:
    """Unassigns a user from an access role on an instance.

    :param instance: B2C instance.
    :param role_id: Role ID to revoke.
    :param login: User login (email).
    """
    result = await instance.ocapi.delete(
        "/roles/{id}/users/{login}", {"params": {"path": {"id": role_id, "login": login}}}
    )

    if result.error:
        response = result.response
        assert response is not None
        throw_ocapi_error(result.error, response, f"Failed to revoke role {role_id} from {login}", _ROLES_RW_SCOPES)


async def get_bm_role_permissions(instance: B2CInstance, role_id: str) -> BmRolePermissions:
    """Gets permissions assigned to an access role.

    :param instance: B2C instance.
    :param role_id: Role ID.
    :returns: Role permissions object.
    """
    result = await instance.ocapi.get("/roles/{id}/permissions", {"params": {"path": {"id": role_id}}})

    if result.error:
        response = result.response
        assert response is not None
        throw_ocapi_error(result.error, response, f"Failed to get permissions for role {role_id}", _ROLES_READ_SCOPES)

    return cast(BmRolePermissions, result.data)


async def set_bm_role_permissions(
    instance: B2CInstance, role_id: str, permissions: BmRolePermissions
) -> BmRolePermissions:
    """Sets (replaces) all permissions for an access role.

    This is a full replacement -- all existing permissions are replaced with the
    provided set.

    :param instance: B2C instance.
    :param role_id: Role ID.
    :param permissions: Complete permissions object.
    :returns: Updated permissions.
    """
    result = await instance.ocapi.put(
        "/roles/{id}/permissions", {"params": {"path": {"id": role_id}}, "body": permissions}
    )

    if result.error:
        response = result.response
        assert response is not None
        throw_ocapi_error(result.error, response, f"Failed to set permissions for role {role_id}", _ROLES_RW_SCOPES)

    return cast(BmRolePermissions, result.data)


__all__ = [
    "BmRole",
    "BmRolePermissions",
    "BmRoles",
    "GetBmRoleOptions",
    "ListBmRolesOptions",
    "create_bm_role",
    "delete_bm_role",
    "get_bm_role",
    "get_bm_role_permissions",
    "grant_bm_role",
    "list_bm_roles",
    "revoke_bm_role",
    "set_bm_role_permissions",
]
