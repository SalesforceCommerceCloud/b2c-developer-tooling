# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Canonical types and backend interface for Business Manager role operations.

Mirrors ``src/operations/bm-roles/types.ts``. The OCAPI Data API and the SCAPI
Merchant Roles API both manage instance-level access roles. Permission shapes
are virtually identical across the two APIs -- module/functional/locale/webdav
permission groups -- so the canonical :data:`RolePermissionsInfo` shape is a
plain JSON object (``dict[str, Any]``) that both backends produce and consume;
the OCAPI backend converts between OCAPI's snake_case wire shape and this
camelCase canonical shape.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Literal, Protocol, runtime_checkable

from b2c_tooling_sdk.clients.scapi_backend_utils import BackendBase

#: Expansion values accepted by :meth:`RolesBackend.list_roles` / :meth:`RolesBackend.get_role`.
RoleExpand = Literal["users", "permissions"]

#: Canonical role-permissions shape (module/functional/locale/webdav groups), shared by
#: both backends. Kept as a plain JSON object -- like the raw API payloads it's built
#: from -- rather than a validated model, mirroring the TypeScript source which only
#: type-narrows (no runtime validation) when converting between OCAPI and SCAPI shapes.
RolePermissionsInfo = dict[str, Any]


@dataclass
class RoleInfo:
    """Normalized role summary, shared by both backends."""

    id: str
    description: str | None = None
    user_count: int | None = None
    user_manager: bool | None = None
    permissions: RolePermissionsInfo | None = None
    #: Original backend response, for advanced consumers. Mirrors TS's ``_raw``.
    raw: Any = None


@dataclass
class ListRolesResult:
    """Paginated result of :meth:`RolesBackend.list_roles`."""

    total: int
    start: int
    count: int
    hits: list[RoleInfo] = field(default_factory=list)


@dataclass
class ListRolesOptions:
    """Options for :meth:`RolesBackend.list_roles`."""

    start: int | None = None
    count: int | None = None
    expand: list[RoleExpand] | None = None


@dataclass
class CreateRoleInput:
    """Options for :meth:`RolesBackend.create_role`."""

    description: str | None = None


@runtime_checkable
class RolesBackend(BackendBase, Protocol):
    """Common interface implemented by both roles backends."""

    async def list_roles(self, options: ListRolesOptions | None = None) -> ListRolesResult:
        """List roles, paginated."""
        ...

    async def get_role(self, role_id: str, *, expand: list[RoleExpand] | None = None) -> RoleInfo:
        """Get a single role, optionally expanding ``users`` and/or ``permissions``."""
        ...

    async def create_role(self, role_id: str, role_input: CreateRoleInput | None = None) -> RoleInfo:
        """Create a new role."""
        ...

    async def delete_role(self, role_id: str) -> None:
        """Delete a role."""
        ...

    async def get_permissions(self, role_id: str) -> RolePermissionsInfo:
        """Get permissions assigned to a role."""
        ...

    async def set_permissions(self, role_id: str, permissions: RolePermissionsInfo) -> RolePermissionsInfo:
        """Replace all permissions assigned to a role."""
        ...

    async def grant_role(self, role_id: str, login: str) -> None:
        """Assign a user to a role. OCAPI returns the user but we don't surface that."""
        ...

    async def revoke_role(self, role_id: str, login: str) -> None:
        """Unassign a user from a role."""
        ...


__all__ = [
    "CreateRoleInput",
    "ListRolesOptions",
    "ListRolesResult",
    "RoleExpand",
    "RoleInfo",
    "RolePermissionsInfo",
    "RolesBackend",
]
