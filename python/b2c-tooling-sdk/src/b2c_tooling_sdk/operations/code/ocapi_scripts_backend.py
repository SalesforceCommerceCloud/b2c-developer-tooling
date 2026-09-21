# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""OCAPI implementation of the scripts (code-version) backend.

Mirrors ``src/operations/code/ocapi-scripts-backend.ts``.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Literal

from b2c_tooling_sdk.clients.models.ocapi import CodeVersion as OcapiCodeVersion
from b2c_tooling_sdk.operations.code.scripts_types import CodeVersionInfo
from b2c_tooling_sdk.operations.code.versions import (
    CodeVersionActivationResult,
    activate_code_version,
    create_code_version,
    delete_code_version,
    get_active_code_version,
    list_code_versions,
)

if TYPE_CHECKING:
    from b2c_tooling_sdk.instance import B2CInstance


def _map_ocapi_code_version(version: OcapiCodeVersion) -> CodeVersionInfo:
    return CodeVersionInfo(
        id=version.id or "",
        active=version.active,
        cartridges=list(version.cartridges) if version.cartridges else None,
        compatibility_mode=version.compatibility_mode,
        activation_time=version.activation_time.isoformat() if version.activation_time else None,
        last_modification_time=version.last_modification_time.isoformat() if version.last_modification_time else None,
        rollback=version.rollback,
        total_size=version.total_size,
        web_dav_url=version.web_dav_url,
        raw=version,
    )


class OcapiScriptsBackend:
    """Code-version operations against the legacy OCAPI Data API."""

    def __init__(self, instance: B2CInstance) -> None:
        self._instance = instance

    @property
    def name(self) -> Literal["ocapi"]:
        return "ocapi"

    async def list_code_versions(self) -> list[CodeVersionInfo]:
        versions = await list_code_versions(self._instance)
        return [_map_ocapi_code_version(v) for v in versions]

    async def get_active_code_version(self) -> CodeVersionInfo | None:
        active = await get_active_code_version(self._instance)
        return _map_ocapi_code_version(active) if active else None

    async def activate_code_version(self, code_version_id: str) -> CodeVersionActivationResult:
        return await activate_code_version(self._instance, code_version_id)

    async def delete_code_version(self, code_version_id: str) -> None:
        await delete_code_version(self._instance, code_version_id)

    async def create_code_version(self, code_version_id: str) -> None:
        await create_code_version(self._instance, code_version_id)


__all__ = ["OcapiScriptsBackend"]
