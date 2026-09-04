# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""ODS (On-Demand Sandbox) operations.

Mirrors ``src/operations/ods/index.ts``.
"""

from __future__ import annotations

from b2c_tooling_sdk.operations.ods.sandbox_lookup import (
    SandboxNotFoundError,
    is_friendly_sandbox_id,
    is_uuid,
    parse_friendly_sandbox_id,
    resolve_sandbox_id,
)
from b2c_tooling_sdk.operations.ods.sandbox_settings import (
    DEFAULT_OCAPI_RESOURCES,
    DEFAULT_WEBDAV_PERMISSIONS,
    BuildSandboxSettingsOptions,
    build_sandbox_settings,
)
from b2c_tooling_sdk.operations.ods.wait_for_clone import (
    CloneFailedError,
    ClonePollingError,
    ClonePollingTimeoutError,
    CloneState,
    WaitForCloneOptions,
    WaitForClonePollInfo,
    wait_for_clone,
)
from b2c_tooling_sdk.operations.ods.wait_for_clones import (
    CloneBatchFailedError,
    CloneBatchMemberStatus,
    CloneBatchPollingError,
    CloneBatchPollingTimeoutError,
    WaitForClonesOptions,
    WaitForClonesPollInfo,
    wait_for_clones,
)
from b2c_tooling_sdk.operations.ods.wait_for_sandbox import (
    SandboxPollingError,
    SandboxPollingTimeoutError,
    SandboxState,
    SandboxTerminalStateError,
    WaitForSandboxOptions,
    WaitForSandboxPollInfo,
    wait_for_sandbox,
)

__all__ = [
    "DEFAULT_OCAPI_RESOURCES",
    "DEFAULT_WEBDAV_PERMISSIONS",
    "BuildSandboxSettingsOptions",
    "CloneBatchFailedError",
    "CloneBatchMemberStatus",
    "CloneBatchPollingError",
    "CloneBatchPollingTimeoutError",
    "CloneFailedError",
    "ClonePollingError",
    "ClonePollingTimeoutError",
    "CloneState",
    "SandboxNotFoundError",
    "SandboxPollingError",
    "SandboxPollingTimeoutError",
    "SandboxState",
    "SandboxTerminalStateError",
    "WaitForCloneOptions",
    "WaitForClonePollInfo",
    "WaitForClonesOptions",
    "WaitForClonesPollInfo",
    "WaitForSandboxOptions",
    "WaitForSandboxPollInfo",
    "build_sandbox_settings",
    "is_friendly_sandbox_id",
    "is_uuid",
    "parse_friendly_sandbox_id",
    "resolve_sandbox_id",
    "wait_for_clone",
    "wait_for_clones",
    "wait_for_sandbox",
]
