# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Code deployment operations for B2C Commerce.

Mirrors ``src/operations/code/index.ts``. Provides functions for managing
cartridge code versions on B2C Commerce instances via WebDAV and OCAPI/SCAPI.

Cartridge discovery:

- :func:`find_cartridges` - Find cartridges by ``.project`` files.

Code versions:

- :func:`list_code_versions` - List all code versions on an instance.
- :func:`get_active_code_version` - Get the currently active code version.
- :func:`activate_code_version` - Activate a code version.
- :func:`reload_code_version` - Reload (re-activate) a code version.
- :func:`delete_code_version` - Delete a code version.
- :func:`create_code_version` - Create a new code version.

Deployment:

- :func:`find_and_deploy_cartridges` - Find and deploy cartridges to an instance.
- :func:`upload_cartridges` - Low-level cartridge upload.
- :func:`delete_cartridges` - Low-level cartridge deletion.
- :func:`watch_cartridges` - Watch and sync file changes.

Download:

- :func:`download_cartridges` - Download cartridges from an instance.
"""

from __future__ import annotations

from b2c_tooling_sdk.operations.code.cartridges import CartridgeMapping, FindCartridgesOptions, find_cartridges
from b2c_tooling_sdk.operations.code.deploy import (
    DeployOptions,
    DeployResult,
    UploadOptions,
    UploadProgressInfo,
    delete_cartridges,
    find_and_deploy_cartridges,
    upload_cartridges,
)
from b2c_tooling_sdk.operations.code.download import (
    DownloadOptions,
    DownloadProgressInfo,
    DownloadResult,
    download_cartridges,
    download_single_cartridge,
)
from b2c_tooling_sdk.operations.code.ocapi_scripts_backend import OcapiScriptsBackend
from b2c_tooling_sdk.operations.code.scapi_scripts_backend import ScapiScriptsBackend, ScapiScriptsBackendConfig
from b2c_tooling_sdk.operations.code.scripts_backend import (
    ScriptsBackendConfig,
    create_scripts_backend,
    reload_code_version,
)
from b2c_tooling_sdk.operations.code.scripts_types import CodeVersionInfo, ScriptsBackend
from b2c_tooling_sdk.operations.code.upload_files import (
    FileChange,
    UploadFilesOptions,
    file_to_cartridge_path,
    upload_files,
)
from b2c_tooling_sdk.operations.code.versions import (
    CodeVersion,
    CodeVersionActivationResult,
    CodeVersionResult,
    activate_code_version,
    create_code_version,
    delete_code_version,
    get_active_code_version,
    list_code_versions,
)
from b2c_tooling_sdk.operations.code.watch import WatchOptions, WatchResult, watch_cartridges

__all__ = [
    "CartridgeMapping",
    "CodeVersion",
    "CodeVersionActivationResult",
    "CodeVersionInfo",
    "CodeVersionResult",
    "DeployOptions",
    "DeployResult",
    "DownloadOptions",
    "DownloadProgressInfo",
    "DownloadResult",
    "FileChange",
    "FindCartridgesOptions",
    "OcapiScriptsBackend",
    "ScapiScriptsBackend",
    "ScapiScriptsBackendConfig",
    "ScriptsBackend",
    "ScriptsBackendConfig",
    "UploadFilesOptions",
    "UploadOptions",
    "UploadProgressInfo",
    "WatchOptions",
    "WatchResult",
    "activate_code_version",
    "create_code_version",
    "create_scripts_backend",
    "delete_cartridges",
    "delete_code_version",
    "download_cartridges",
    "download_single_cartridge",
    "file_to_cartridge_path",
    "find_and_deploy_cartridges",
    "find_cartridges",
    "get_active_code_version",
    "list_code_versions",
    "reload_code_version",
    "upload_cartridges",
    "upload_files",
    "watch_cartridges",
]
