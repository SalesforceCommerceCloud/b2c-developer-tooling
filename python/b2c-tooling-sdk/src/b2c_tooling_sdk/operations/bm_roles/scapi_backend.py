# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""SCAPI implementation of the Business Manager roles backend.

Mirrors ``src/operations/bm-roles/scapi-backend.ts``. Uses the SCAPI Merchant
Roles Admin API (``merchant/roles/v1``) via :class:`ScopeTierManager`, which
optimistically requests the read-write scope and downgrades to read-only if
Account Manager rejects it for a read operation.
"""

from __future__ import annotations

from typing import Any, Literal, cast

from b2c_tooling_sdk.clients.custom_apis import build_tenant_scope, to_organization_id
from b2c_tooling_sdk.clients.dual_backend_factory import ScapiBackendCtorConfig
from b2c_tooling_sdk.clients.scapi_backend_utils import create_scapi_request_error
from b2c_tooling_sdk.clients.scapi_merchant_roles import (
    SCAPI_MERCHANT_ROLES_READ_SCOPES,
    SCAPI_MERCHANT_ROLES_RW_SCOPES,
    ScapiMerchantRolesClient,
    ScapiMerchantRolesClientConfig,
    create_scapi_merchant_roles_client,
)
from b2c_tooling_sdk.clients.scapi_scope_tier import ScopeTierManager
from b2c_tooling_sdk.operations.bm_roles.types import (
    CreateRoleInput,
    ListRolesOptions,
    ListRolesResult,
    RoleExpand,
    RoleInfo,
    RolePermissionsInfo,
)

#: Configuration for :class:`ScapiRolesBackend`. Alias of the shared
#: :class:`~b2c_tooling_sdk.clients.dual_backend_factory.ScapiBackendCtorConfig`
#: (``short_code``, ``tenant_id``, ``auth``, ``instance``).
ScapiRolesBackendConfig = ScapiBackendCtorConfig


def _map_scapi_role(scapi: dict[str, Any]) -> RoleInfo:
    return RoleInfo(
        id=scapi.get("id") or "",
        description=scapi.get("description"),
        user_count=scapi.get("userCount"),
        user_manager=scapi.get("userManager"),
        permissions=scapi.get("permissions"),
        raw=scapi,
    )


class ScapiRolesBackend:
    """Business Manager roles backend implemented against the SCAPI Merchant Roles API."""

    def __init__(self, config: ScapiRolesBackendConfig) -> None:
        self._config = config
        self._organization_id = to_organization_id(config.tenant_id)
        self._scope_tier: ScopeTierManager[ScapiMerchantRolesClient] = ScopeTierManager(
            build_client=self._build_client,
            rw_scopes=SCAPI_MERCHANT_ROLES_RW_SCOPES,
            read_scopes=SCAPI_MERCHANT_ROLES_READ_SCOPES,
            domain_name="Roles",
        )

    @property
    def name(self) -> Literal["scapi"]:
        return "scapi"

    async def list_roles(self, options: ListRolesOptions | None = None) -> ListRolesResult:
        opts = options or ListRolesOptions()
        start = opts.start if opts.start is not None else 0
        count = opts.count if opts.count is not None else 25
        expand = opts.expand

        async def _read(client: ScapiMerchantRolesClient) -> ListRolesResult:
            result = await client.get(
                "/organizations/{organizationId}/roles",
                {
                    "params": {
                        "path": {"organizationId": self._organization_id},
                        "query": {"limit": count, "offset": start, "expand": expand},
                    }
                },
            )
            if result.error or result.data is None:
                raise create_scapi_request_error(result.error, result.response, "Failed to list roles")
            data: dict[str, Any] = result.data
            hits = cast("list[dict[str, Any]]", data.get("data") or [])
            total = data.get("total")
            offset = data.get("offset")
            limit = data.get("limit")
            return ListRolesResult(
                total=total if total is not None else 0,
                start=offset if offset is not None else start,
                count=limit if limit is not None else count,
                hits=[_map_scapi_role(item) for item in hits],
            )

        return await self._scope_tier.try_read(_read)

    async def get_role(self, role_id: str, *, expand: list[RoleExpand] | None = None) -> RoleInfo:
        async def _read(client: ScapiMerchantRolesClient) -> RoleInfo:
            result = await client.get(
                "/organizations/{organizationId}/roles/{roleId}",
                {
                    "params": {
                        "path": {"organizationId": self._organization_id, "roleId": role_id},
                        "query": {"expand": expand},
                    }
                },
            )
            if result.error or result.data is None:
                raise create_scapi_request_error(result.error, result.response, f"Failed to get role {role_id}")
            return _map_scapi_role(result.data)

        return await self._scope_tier.try_read(_read)

    async def create_role(self, role_id: str, role_input: CreateRoleInput | None = None) -> RoleInfo:
        client = self._scope_tier.get_client_for_write()
        body: dict[str, Any] = {"id": role_id}
        if role_input is not None and role_input.description is not None:
            body["description"] = role_input.description

        result = await client.put(
            "/organizations/{organizationId}/roles/{roleId}",
            {"params": {"path": {"organizationId": self._organization_id, "roleId": role_id}}, "body": body},
        )
        if result.error or result.data is None:
            raise create_scapi_request_error(result.error, result.response, f"Failed to create role {role_id}")
        return _map_scapi_role(result.data)

    async def delete_role(self, role_id: str) -> None:
        client = self._scope_tier.get_client_for_write()
        result = await client.delete(
            "/organizations/{organizationId}/roles/{roleId}",
            {"params": {"path": {"organizationId": self._organization_id, "roleId": role_id}}},
        )
        if result.error:
            raise create_scapi_request_error(result.error, result.response, f"Failed to delete role {role_id}")

    async def get_permissions(self, role_id: str) -> RolePermissionsInfo:
        async def _read(client: ScapiMerchantRolesClient) -> RolePermissionsInfo:
            result = await client.get(
                "/organizations/{organizationId}/roles/{roleId}/permissions",
                {"params": {"path": {"organizationId": self._organization_id, "roleId": role_id}}},
            )
            if result.error or result.data is None:
                raise create_scapi_request_error(
                    result.error, result.response, f"Failed to get permissions for role {role_id}"
                )
            return cast("RolePermissionsInfo", result.data)

        return await self._scope_tier.try_read(_read)

    async def set_permissions(self, role_id: str, permissions: RolePermissionsInfo) -> RolePermissionsInfo:
        client = self._scope_tier.get_client_for_write()
        result = await client.put(
            "/organizations/{organizationId}/roles/{roleId}/permissions",
            {"params": {"path": {"organizationId": self._organization_id, "roleId": role_id}}, "body": permissions},
        )
        if result.error or result.data is None:
            raise create_scapi_request_error(
                result.error, result.response, f"Failed to set permissions for role {role_id}"
            )
        return cast("RolePermissionsInfo", result.data)

    async def grant_role(self, role_id: str, login: str) -> None:
        client = self._scope_tier.get_client_for_write()
        result = await client.put(
            "/organizations/{organizationId}/roles/{roleId}/users/{login}",
            {"params": {"path": {"organizationId": self._organization_id, "roleId": role_id, "login": login}}},
        )
        if result.error:
            raise create_scapi_request_error(
                result.error, result.response, f"Failed to grant role {role_id} to {login}"
            )

    async def revoke_role(self, role_id: str, login: str) -> None:
        client = self._scope_tier.get_client_for_write()
        result = await client.delete(
            "/organizations/{organizationId}/roles/{roleId}/users/{login}",
            {"params": {"path": {"organizationId": self._organization_id, "roleId": role_id, "login": login}}},
        )
        if result.error:
            raise create_scapi_request_error(
                result.error, result.response, f"Failed to revoke role {role_id} from {login}"
            )

    def _build_client(self, scopes: list[str]) -> ScapiMerchantRolesClient:
        client_config = ScapiMerchantRolesClientConfig(
            short_code=self._config.short_code,
            tenant_id=self._config.tenant_id,
            scopes=[*scopes, build_tenant_scope(self._config.tenant_id)],
        )
        return create_scapi_merchant_roles_client(client_config, self._config.auth)


__all__ = ["ScapiRolesBackend", "ScapiRolesBackendConfig"]
