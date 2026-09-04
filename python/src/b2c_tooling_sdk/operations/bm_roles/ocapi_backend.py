# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""OCAPI implementation of the Business Manager roles backend.

Mirrors ``src/operations/bm-roles/ocapi-backend.ts``. OCAPI uses snake_case for
some innermost permission fields (``locale_id``) while the canonical/SCAPI shape
uses camelCase (``localeId``); this module converts at that boundary.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any, Literal, cast

from b2c_tooling_sdk.operations.bm_roles import roles as _roles
from b2c_tooling_sdk.operations.bm_roles.roles import GetBmRoleOptions, ListBmRolesOptions
from b2c_tooling_sdk.operations.bm_roles.types import (
    CreateRoleInput,
    ListRolesOptions,
    ListRolesResult,
    RoleExpand,
    RoleInfo,
    RolePermissionsInfo,
)

if TYPE_CHECKING:
    from b2c_tooling_sdk.instance import B2CInstance


def _map_module_permission(permission: dict[str, Any]) -> dict[str, Any]:
    return {
        "application": permission.get("application"),
        "name": permission.get("name"),
        "type": permission.get("type"),
        "system": permission.get("system"),
        "value": permission.get("value"),
        "values": permission.get("values"),
    }


def _map_functional_permission(permission: dict[str, Any]) -> dict[str, Any]:
    return {
        "name": permission.get("name"),
        "type": permission.get("type"),
        "value": permission.get("value"),
        "values": permission.get("values"),
    }


def _map_locale_permission(permission: dict[str, Any]) -> dict[str, Any]:
    return {
        "localeId": permission.get("locale_id"),
        "type": permission.get("type"),
        "value": permission.get("value"),
        "values": permission.get("values"),
    }


def _map_webdav_permission(permission: dict[str, Any]) -> dict[str, Any]:
    return {
        "folder": permission.get("folder"),
        "type": permission.get("type"),
        "value": permission.get("value"),
        "values": permission.get("values"),
    }


def _map_ocapi_permissions(ocapi: dict[str, Any]) -> RolePermissionsInfo:
    """OCAPI (snake_case innermost fields) -> canonical (camelCase) permissions shape."""
    result: dict[str, Any] = {}

    module = ocapi.get("module")
    if module:
        result["module"] = {
            "organization": [_map_module_permission(p) for p in (module.get("organization") or [])],
            "site": [_map_module_permission(p) for p in (module.get("site") or [])],
        }

    functional = ocapi.get("functional")
    if functional:
        result["functional"] = {
            "organization": [_map_functional_permission(p) for p in (functional.get("organization") or [])],
            "site": [_map_functional_permission(p) for p in (functional.get("site") or [])],
        }

    locale = ocapi.get("locale")
    if locale:
        result["locale"] = {"unscoped": [_map_locale_permission(p) for p in (locale.get("unscoped") or [])]}

    webdav = ocapi.get("webdav")
    if webdav:
        result["webdav"] = {"unscoped": [_map_webdav_permission(p) for p in (webdav.get("unscoped") or [])]}

    return result


def _map_scapi_permissions_to_ocapi(perms: RolePermissionsInfo) -> dict[str, Any]:
    """Reverse: canonical (camelCase) -> OCAPI (snake_case innermost ``locale_id``)."""
    result: dict[str, Any] = {}

    module = perms.get("module")
    if module:
        result["module"] = {
            "organization": [dict(p) for p in (module.get("organization") or [])],
            "site": [dict(p) for p in (module.get("site") or [])],
        }

    functional = perms.get("functional")
    if functional:
        result["functional"] = {
            "organization": [dict(p) for p in (functional.get("organization") or [])],
            "site": [dict(p) for p in (functional.get("site") or [])],
        }

    locale = perms.get("locale")
    if locale:
        result["locale"] = {
            "unscoped": [
                {
                    "locale_id": p.get("localeId"),
                    "type": p.get("type"),
                    "value": p.get("value"),
                    "values": p.get("values"),
                }
                for p in (locale.get("unscoped") or [])
            ]
        }

    webdav = perms.get("webdav")
    if webdav:
        result["webdav"] = {"unscoped": [dict(p) for p in (webdav.get("unscoped") or [])]}

    return result


def _map_ocapi_role(ocapi: dict[str, Any]) -> RoleInfo:
    permissions = ocapi.get("permissions")
    return RoleInfo(
        id=ocapi.get("id") or "",
        description=ocapi.get("description"),
        user_count=ocapi.get("user_count"),
        user_manager=ocapi.get("user_manager"),
        # OCAPI returns permissions inline on the role when expanded, same as SCAPI.
        # Map snake_case -> camelCase to match the canonical RoleInfo shape so that
        # callers see consistent data after a fallback from SCAPI to OCAPI.
        permissions=_map_ocapi_permissions(permissions) if permissions else None,
        raw=ocapi,
    )


class OcapiRolesBackend:
    """Business Manager roles backend implemented against the OCAPI Data API."""

    def __init__(self, instance: B2CInstance) -> None:
        self._instance = instance

    @property
    def name(self) -> Literal["ocapi"]:
        return "ocapi"

    async def list_roles(self, options: ListRolesOptions | None = None) -> ListRolesResult:
        opts = options or ListRolesOptions()
        result = await _roles.list_bm_roles(self._instance, ListBmRolesOptions(start=opts.start, count=opts.count))
        items = cast("list[dict[str, Any]]", result.get("data") or [])
        count = result.get("count")
        return ListRolesResult(
            total=result.get("total") or 0,
            start=result.get("start") or 0,
            count=count if count is not None else len(items),
            hits=[_map_ocapi_role(item) for item in items],
        )

    async def get_role(self, role_id: str, *, expand: list[RoleExpand] | None = None) -> RoleInfo:
        role = await _roles.get_bm_role(self._instance, role_id, GetBmRoleOptions(expand=expand))
        return _map_ocapi_role(role)

    async def create_role(self, role_id: str, role_input: CreateRoleInput | None = None) -> RoleInfo:
        role = await _roles.create_bm_role(
            self._instance, role_id, description=role_input.description if role_input else None
        )
        return _map_ocapi_role(role)

    async def delete_role(self, role_id: str) -> None:
        await _roles.delete_bm_role(self._instance, role_id)

    async def get_permissions(self, role_id: str) -> RolePermissionsInfo:
        permissions = await _roles.get_bm_role_permissions(self._instance, role_id)
        return _map_ocapi_permissions(permissions)

    async def set_permissions(self, role_id: str, permissions: RolePermissionsInfo) -> RolePermissionsInfo:
        updated = await _roles.set_bm_role_permissions(
            self._instance, role_id, _map_scapi_permissions_to_ocapi(permissions)
        )
        return _map_ocapi_permissions(updated)

    async def grant_role(self, role_id: str, login: str) -> None:
        await _roles.grant_bm_role(self._instance, role_id, login)

    async def revoke_role(self, role_id: str, login: str) -> None:
        await _roles.revoke_bm_role(self._instance, role_id, login)


__all__ = ["OcapiRolesBackend"]
