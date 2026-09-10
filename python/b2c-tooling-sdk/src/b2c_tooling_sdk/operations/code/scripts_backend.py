# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Dual SCAPI/OCAPI backend selection for code-version operations.

Mirrors ``src/operations/code/scripts-backend.ts``.
"""

from __future__ import annotations

from b2c_tooling_sdk.clients.dual_backend_factory import DualBackendConfig, DualBackendCtors, create_dual_backend
from b2c_tooling_sdk.operations.code.ocapi_scripts_backend import OcapiScriptsBackend
from b2c_tooling_sdk.operations.code.scapi_scripts_backend import ScapiScriptsBackend
from b2c_tooling_sdk.operations.code.scripts_types import ScriptsBackend

#: Configuration for :func:`create_scripts_backend`. Alias of
#: :class:`~b2c_tooling_sdk.clients.dual_backend_factory.DualBackendConfig`.
ScriptsBackendConfig = DualBackendConfig


def create_scripts_backend(config: ScriptsBackendConfig) -> ScriptsBackend:
    """Create a code-version backend, choosing SCAPI or OCAPI per ``config``.

    Delegates to :func:`~b2c_tooling_sdk.clients.dual_backend_factory.create_dual_backend`.
    """
    return create_dual_backend(
        config,
        DualBackendCtors[ScriptsBackend](
            domain_name="Scripts",
            scapi=lambda cfg: ScapiScriptsBackend(cfg),
            ocapi=lambda inst: OcapiScriptsBackend(inst),
        ),
    )


async def reload_code_version(backend: ScriptsBackend, code_version_id: str | None = None) -> None:
    """Reload (re-activate) a code version using a toggle-activate technique.

    Activates an alternate version, then re-activates the target. This forces
    the instance to reload the code (rebuild caches, re-register custom APIs,
    etc.). Works on top of any :class:`ScriptsBackend` since it only uses
    list/activate primitives.

    :param code_version_id: Code version to reload (defaults to the current active version).
    :raises RuntimeError: if no code version is specified and none is active, or
        if the target is already active and no alternate code version exists to
        toggle through.
    """
    versions = await backend.list_code_versions()
    active_version = next((v for v in versions if v.active), None)
    target_version = code_version_id or (active_version.id if active_version else None)

    if not target_version:
        raise RuntimeError("No code version specified and no active version found")

    if active_version is not None and active_version.id == target_version:
        alternate_version = next((v for v in versions if v.id != target_version), None)
        if alternate_version is None:
            raise RuntimeError("Cannot reload: no alternate code version available for toggle")
        await backend.activate_code_version(alternate_version.id)

    await backend.activate_code_version(target_version)


__all__ = ["ScriptsBackendConfig", "create_scripts_backend", "reload_code_version"]
