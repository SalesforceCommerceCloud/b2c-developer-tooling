# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Backend-agnostic code-version types shared by the OCAPI and SCAPI script backends.

Mirrors ``src/operations/code/scripts-types.ts``.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Protocol, runtime_checkable

from b2c_tooling_sdk.clients.scapi_backend_utils import BackendBase
from b2c_tooling_sdk.operations.code.versions import CodeVersionActivationResult


@dataclass
class CodeVersionInfo:
    """A code version, normalized across the OCAPI and SCAPI representations.

    ``activation_time``/``last_modification_time`` are kept as ISO-8601 strings
    (matching the TypeScript ``string`` fields) even though the underlying
    generated Pydantic models parse them as ``datetime`` — each backend
    converts via ``.isoformat()`` at the mapping boundary.
    """

    id: str
    active: bool | None = None
    cartridges: list[str] | None = None
    compatibility_mode: str | None = None
    activation_time: str | None = None
    last_modification_time: str | None = None
    rollback: bool | None = None
    total_size: int | None = None
    web_dav_url: str | None = None
    #: The raw backend-specific payload, for callers that need details this
    #: normalized shape doesn't expose.
    raw: Any = None


@runtime_checkable
class ScriptsBackend(BackendBase, Protocol):
    """Backend-agnostic interface for code-version operations.

    Implemented by :class:`~b2c_tooling_sdk.operations.code.ocapi_scripts_backend.OcapiScriptsBackend`
    and :class:`~b2c_tooling_sdk.operations.code.scapi_scripts_backend.ScapiScriptsBackend`.
    """

    async def list_code_versions(self) -> list[CodeVersionInfo]: ...

    async def get_active_code_version(self) -> CodeVersionInfo | None: ...

    async def activate_code_version(self, code_version_id: str) -> CodeVersionActivationResult: ...

    async def delete_code_version(self, code_version_id: str) -> None: ...

    async def create_code_version(self, code_version_id: str) -> None: ...


__all__ = ["CodeVersionInfo", "ScriptsBackend"]
