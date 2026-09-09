# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""OCAPI Data API code-version operations.

Mirrors ``src/operations/code/versions.ts``. These are the legacy (OCAPI-only)
primitives wrapped by :class:`~b2c_tooling_sdk.operations.code.ocapi_scripts_backend.OcapiScriptsBackend`.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, Any

from b2c_tooling_sdk.clients import SCAPI_SCRIPTS_READ_SCOPES, SCAPI_SCRIPTS_RW_SCOPES, throw_ocapi_error
from b2c_tooling_sdk.clients.models.ocapi import CodeVersion, CodeVersionResult
from b2c_tooling_sdk.logging import get_logger

if TYPE_CHECKING:
    from b2c_tooling_sdk.instance import B2CInstance

_logger = get_logger("operations.code")

_READ_AND_RW_SCOPES = [*SCAPI_SCRIPTS_READ_SCOPES, *SCAPI_SCRIPTS_RW_SCOPES]


@dataclass
class CodeVersionActivationResult:
    """Result of requesting activation of a code version."""

    #: ``True`` if the code version was already active (activation was a no-op).
    already_active: bool


def _is_already_active_fault(error: Any, status: int, code_version_id: str) -> bool:
    """Detect OCAPI's "already active" 400 fault so activation is idempotent."""
    if status != 400 or not isinstance(error, dict):
        return False
    fault = error.get("fault")
    if not isinstance(fault, dict):
        return False
    if fault.get("type") != "CodeVersionModificationException":
        return False
    arguments = fault.get("arguments")
    fault_code_version_id = arguments.get("codeVersionId") if isinstance(arguments, dict) else None
    return fault_code_version_id is None or fault_code_version_id == code_version_id


async def list_code_versions(instance: B2CInstance) -> list[CodeVersion]:
    """List all code versions on the instance."""
    result = await instance.ocapi.get("/code_versions", {})
    if result.error or result.data is None:
        response = result.response
        assert response is not None
        throw_ocapi_error(result.error, response, "Failed to list code versions", _READ_AND_RW_SCOPES)

    parsed = CodeVersionResult.model_validate(result.data)
    return parsed.data or []


async def get_active_code_version(instance: B2CInstance) -> CodeVersion | None:
    """Return the currently active code version, or ``None`` if none is active."""
    versions = await list_code_versions(instance)
    return next((v for v in versions if v.active), None)


async def activate_code_version(instance: B2CInstance, code_version_id: str) -> CodeVersionActivationResult:
    """Activate a code version.

    Idempotent: if OCAPI reports the code version is already active, this
    returns ``already_active=True`` rather than raising.
    """
    _logger.debug("Activating code version %s", code_version_id)

    result = await instance.ocapi.patch(
        "/code_versions/{code_version_id}",
        {"params": {"path": {"code_version_id": code_version_id}}, "body": {"active": True}},
    )

    if result.error:
        response = result.response
        assert response is not None
        if _is_already_active_fault(result.error, response.status_code, code_version_id):
            _logger.debug("Code version %s is already active", code_version_id)
            return CodeVersionActivationResult(already_active=True)
        throw_ocapi_error(
            result.error,
            response,
            f'Could not activate code version "{code_version_id}"',
            SCAPI_SCRIPTS_RW_SCOPES,
        )

    _logger.debug("Code version %s activated", code_version_id)
    return CodeVersionActivationResult(already_active=False)


async def delete_code_version(instance: B2CInstance, code_version_id: str) -> None:
    """Delete a code version."""
    _logger.debug("Deleting code version %s", code_version_id)

    result = await instance.ocapi.delete(
        "/code_versions/{code_version_id}",
        {"params": {"path": {"code_version_id": code_version_id}}},
    )
    if result.error:
        response = result.response
        assert response is not None
        throw_ocapi_error(result.error, response, "Failed to delete code version", SCAPI_SCRIPTS_RW_SCOPES)

    _logger.debug("Code version %s deleted", code_version_id)


async def create_code_version(instance: B2CInstance, code_version_id: str) -> None:
    """Create a new (empty) code version."""
    _logger.debug("Creating code version %s", code_version_id)

    result = await instance.ocapi.put(
        "/code_versions/{code_version_id}",
        {"params": {"path": {"code_version_id": code_version_id}}},
    )
    if result.error:
        response = result.response
        assert response is not None
        throw_ocapi_error(result.error, response, "Failed to create code version", SCAPI_SCRIPTS_RW_SCOPES)

    _logger.debug("Code version %s created", code_version_id)


__all__ = [
    "CodeVersion",
    "CodeVersionActivationResult",
    "CodeVersionResult",
    "activate_code_version",
    "create_code_version",
    "delete_code_version",
    "get_active_code_version",
    "list_code_versions",
]
