# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""SCAPI implementation of the scripts (code-version) backend.

Mirrors ``src/operations/code/scapi-scripts-backend.ts``.
"""

from __future__ import annotations

from typing import Any, Literal

from b2c_tooling_sdk.clients import (
    SCAPI_SCRIPTS_READ_SCOPES,
    SCAPI_SCRIPTS_RW_SCOPES,
    ScapiClientConfig,
    ScapiScriptsClient,
    ScopeTierManager,
    build_tenant_scope,
    create_scapi_request_error,
    create_scapi_scripts_client,
    to_organization_id,
)
from b2c_tooling_sdk.clients.dual_backend_factory import ScapiBackendCtorConfig
from b2c_tooling_sdk.clients.models.scapi_scripts import CodeVersion as ScapiCodeVersion
from b2c_tooling_sdk.logging import get_logger
from b2c_tooling_sdk.operations.code.scripts_types import CodeVersionInfo
from b2c_tooling_sdk.operations.code.versions import CodeVersionActivationResult

#: Configuration for :class:`ScapiScriptsBackend`.
#:
#: Alias of :class:`~b2c_tooling_sdk.clients.dual_backend_factory.ScapiBackendCtorConfig`
#: — the dual-backend factory constructs this backend directly from that shape
#: (``instance`` is accepted for compatibility with the factory but unused by
#: Scripts).
ScapiScriptsBackendConfig = ScapiBackendCtorConfig


def _map_scapi_code_version(scapi: ScapiCodeVersion) -> CodeVersionInfo:
    return CodeVersionInfo(
        id=scapi.id or "",
        active=scapi.active,
        cartridges=[c.root for c in scapi.cartridges] if scapi.cartridges else None,
        compatibility_mode=scapi.compatibilityMode,
        activation_time=scapi.activationTime.isoformat() if scapi.activationTime else None,
        last_modification_time=scapi.lastModificationTime.isoformat() if scapi.lastModificationTime else None,
        rollback=scapi.rollback,
        total_size=scapi.totalSize,
        web_dav_url=scapi.webDavUrl,
        raw=scapi,
    )


class ScapiScriptsBackend:
    """Code-version operations against the SCAPI Scripts DX API."""

    def __init__(self, config: ScapiScriptsBackendConfig) -> None:
        self._config = config
        self._organization_id = to_organization_id(config.tenant_id)
        self._scope_tier: ScopeTierManager[ScapiScriptsClient] = ScopeTierManager(
            build_client=self._build_client,
            rw_scopes=SCAPI_SCRIPTS_RW_SCOPES,
            read_scopes=SCAPI_SCRIPTS_READ_SCOPES,
            domain_name="Scripts",
        )

    @property
    def name(self) -> Literal["scapi"]:
        return "scapi"

    async def list_code_versions(self) -> list[CodeVersionInfo]:
        async def _read(client: ScapiScriptsClient) -> list[CodeVersionInfo]:
            result = await client.get(
                "/organizations/{organizationId}/code-versions",
                {"params": {"path": {"organizationId": self._organization_id}}},
            )
            if result.error or result.data is None:
                raise create_scapi_request_error(result.error, result.response, "Failed to list code versions")
            data: dict[str, Any] = result.data
            versions = [ScapiCodeVersion.model_validate(v) for v in data.get("data") or []]
            return [_map_scapi_code_version(v) for v in versions]

        return await self._scope_tier.try_read(_read)

    async def get_active_code_version(self) -> CodeVersionInfo | None:
        versions = await self.list_code_versions()
        return next((v for v in versions if v.active), None)

    async def activate_code_version(self, code_version_id: str) -> CodeVersionActivationResult:
        client = self._scope_tier.get_client_for_write()
        logger = get_logger("operations.code")
        logger.debug("Activating code version %s", code_version_id)

        result = await client.patch(
            "/organizations/{organizationId}/code-versions/{codeVersionId}",
            {
                "params": {"path": {"organizationId": self._organization_id, "codeVersionId": code_version_id}},
                "body": {"active": True},
            },
        )
        if result.error:
            raise create_scapi_request_error(
                result.error, result.response, f"Failed to activate code version {code_version_id}"
            )
        logger.debug("Code version %s activated", code_version_id)
        # SCAPI PATCH active=true is idempotent and does not surface a distinct
        # "already active" fault the way OCAPI does, so report a normal activation.
        return CodeVersionActivationResult(already_active=False)

    async def delete_code_version(self, code_version_id: str) -> None:
        client = self._scope_tier.get_client_for_write()
        result = await client.delete(
            "/organizations/{organizationId}/code-versions/{codeVersionId}",
            {"params": {"path": {"organizationId": self._organization_id, "codeVersionId": code_version_id}}},
        )
        if result.error:
            raise create_scapi_request_error(
                result.error, result.response, f"Failed to delete code version {code_version_id}"
            )

    async def create_code_version(self, code_version_id: str) -> None:
        client = self._scope_tier.get_client_for_write()
        result = await client.put(
            "/organizations/{organizationId}/code-versions/{codeVersionId}",
            {"params": {"path": {"organizationId": self._organization_id, "codeVersionId": code_version_id}}},
        )
        if result.error:
            raise create_scapi_request_error(
                result.error, result.response, f"Failed to create code version {code_version_id}"
            )

    def _build_client(self, scopes: list[str]) -> ScapiScriptsClient:
        client_config = ScapiClientConfig(
            short_code=self._config.short_code,
            tenant_id=self._config.tenant_id,
            scopes=[*scopes, build_tenant_scope(self._config.tenant_id)],
        )
        return create_scapi_scripts_client(client_config, self._config.auth)


__all__ = ["ScapiScriptsBackend", "ScapiScriptsBackendConfig"]
