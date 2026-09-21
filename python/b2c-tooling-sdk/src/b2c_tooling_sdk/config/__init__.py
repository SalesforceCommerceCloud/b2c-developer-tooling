# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Configuration loading utilities.

Mirrors ``src/config/index.ts``. The preferred high-level API is
:func:`resolve_config`, which returns a rich :class:`ResolvedConfigImpl` with
validation predicates and auth-strategy factory methods.

Resolution priority (highest to lowest): explicit overrides, then configuration
sources (dw.json, ~/.mobify, package.json). Later sources only fill in missing
values. Hostname-mismatch protection prevents mixing credentials across
instances.

To go straight from configuration to a usable client, use
:func:`create_instance_from_config` or :meth:`ResolvedConfigImpl.create_b2c_instance`.

Example::

    from b2c_tooling_sdk.config import resolve_config
    from b2c_tooling_sdk.config.types import NormalizedConfig

    config = await resolve_config(
        NormalizedConfig(hostname="example.com", client_id="...")
    )
    if config.has_oauth_config():
        strategy = config.create_oauth()
"""

from __future__ import annotations

from b2c_tooling_sdk.config.config_source_registry import (
    ConfigSourceRegistry,
    global_config_source_registry,
)
from b2c_tooling_sdk.config.dw_json import (
    DwJsonConfig,
    DwJsonMultiConfig,
    LoadDwJsonResult,
    add_instance,
    find_dw_json,
    load_dw_json,
    load_full_dw_json,
    remove_instance,
    save_dw_json,
    set_active_instance,
)
from b2c_tooling_sdk.config.instance_manager import (
    InstanceManager,
    create_instance_manager,
)
from b2c_tooling_sdk.config.mapping import (
    create_instance_from_config,
    normalize_config_keys,
    resolve_library_entries,
)
from b2c_tooling_sdk.config.project_environment import (
    merge_project_environment,
    read_project_environment,
)
from b2c_tooling_sdk.config.redaction import (
    SENSITIVE_CONFIG_FIELDS,
    is_sensitive_config_field,
    mask_config_value,
    redact_config_values,
)
from b2c_tooling_sdk.config.resolved_config import ResolvedB2CConfig, ResolvedConfigImpl
from b2c_tooling_sdk.config.resolver import (
    ConfigResolver,
    create_config_resolver,
    resolve_config,
)
from b2c_tooling_sdk.config.settings import (
    B2C_SETTINGS_FILENAME,
    get_b2c_config_directory,
    get_b2c_settings_path,
    read_b2c_settings,
    write_b2c_settings,
)
from b2c_tooling_sdk.config.sources import DwJsonSource, EnvSource
from b2c_tooling_sdk.config.types import (
    ConfigCatalogFile,
    ConfigLoadResult,
    ConfigResolutionResult,
    ConfigSource,
    ConfigSourceInfo,
    ConfigWarning,
    CreateB2CInstanceOptions,
    CreateInstanceOptions,
    CreateOAuthOptions,
    InstanceInfo,
    LibraryEntry,
    NormalizedConfig,
    ResolveConfigOptions,
)

__all__ = [
    "B2C_SETTINGS_FILENAME",
    "SENSITIVE_CONFIG_FIELDS",
    "ConfigCatalogFile",
    "ConfigLoadResult",
    "ConfigResolutionResult",
    "ConfigResolver",
    "ConfigSource",
    "ConfigSourceInfo",
    "ConfigSourceRegistry",
    "ConfigWarning",
    "CreateB2CInstanceOptions",
    "CreateInstanceOptions",
    "CreateOAuthOptions",
    "DwJsonConfig",
    "DwJsonMultiConfig",
    "DwJsonSource",
    "EnvSource",
    "InstanceInfo",
    "InstanceManager",
    "LibraryEntry",
    "LoadDwJsonResult",
    "NormalizedConfig",
    "ResolveConfigOptions",
    "ResolvedB2CConfig",
    "ResolvedConfigImpl",
    "add_instance",
    "create_config_resolver",
    "create_instance_from_config",
    "create_instance_manager",
    "find_dw_json",
    "get_b2c_config_directory",
    "get_b2c_settings_path",
    "global_config_source_registry",
    "is_sensitive_config_field",
    "load_dw_json",
    "load_full_dw_json",
    "mask_config_value",
    "merge_project_environment",
    "normalize_config_keys",
    "read_b2c_settings",
    "read_project_environment",
    "redact_config_values",
    "remove_instance",
    "resolve_config",
    "resolve_library_entries",
    "save_dw_json",
    "set_active_instance",
    "write_b2c_settings",
]
