# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""dw.json configuration source.

Mirrors ``src/config/sources/dw-json-source.ts``. Loads configuration from
``dw.json`` files, honouring the explicit / project-local / global-default file
precedence and building the instance catalog used for named/default selection.
"""

from __future__ import annotations

import os
from typing import Literal

from b2c_tooling_sdk.config.dw_json import (
    LoadDwJsonResult,
    add_instance,
    load_dw_json,
    load_full_dw_json,
    remove_instance,
    save_dw_json,
    set_active_instance,
)
from b2c_tooling_sdk.config.mapping import (
    get_populated_fields,
    map_dw_json_to_normalized_config,
    map_normalized_config_to_dw_json,
)
from b2c_tooling_sdk.config.types import (
    ConfigCatalogFile,
    ConfigLoadResult,
    CreateInstanceOptions,
    InstanceInfo,
    NormalizedConfig,
    ResolveConfigOptions,
)
from b2c_tooling_sdk.logging import get_logger


def _primary_path(options: ResolveConfigOptions) -> str:
    """Absolute path of the primary (explicit or project-local) dw.json."""
    base = options.config_path or os.path.join(
        options.project_directory or options.working_directory or os.getcwd(), "dw.json"
    )
    return os.path.abspath(base)


def _select_config_path(options: ResolveConfigOptions) -> str | None:
    """Select the explicit, project-local, or global-default dw.json path."""
    if options.config_path:
        return options.config_path
    project_config_path = os.path.join(options.project_directory or options.working_directory or os.getcwd(), "dw.json")
    if os.path.exists(project_config_path):
        return project_config_path
    return options.default_config_path


def _select_config_paths(options: ResolveConfigOptions) -> list[str]:
    """Ordered files that contribute instances to the effective catalog."""
    paths: list[str] = []
    primary = _primary_path(options)
    if os.path.exists(primary):
        paths.append(primary)
    default_config_path = os.path.abspath(options.default_config_path) if options.default_config_path else None
    if default_config_path and os.path.exists(default_config_path) and default_config_path not in paths:
        paths.append(default_config_path)
    return paths


def _is_global_config_path(config_path: str, options: ResolveConfigOptions) -> bool:
    """Whether a resolved file came from the shared global setting."""
    if not options.default_config_path:
        return False
    primary = _primary_path(options)
    resolved = os.path.abspath(config_path)
    return resolved != primary and resolved == os.path.abspath(options.default_config_path)


def _create_instance_catalog(
    config_paths: list[str], selected_path: str | None, options: ResolveConfigOptions
) -> list[ConfigCatalogFile]:
    """Describe all files participating in instance selection."""
    normalized_selected = os.path.abspath(selected_path) if selected_path else None
    return [
        ConfigCatalogFile(
            location=config_path,
            scope="global" if _is_global_config_path(config_path, options) else "primary",
            selected=os.path.abspath(config_path) == normalized_selected,
        )
        for config_path in config_paths
    ]


def _list_instances_from_path(source_name: str, config_path: str) -> list[InstanceInfo]:
    """List instances declared in a single dw.json file (empty on read error)."""
    try:
        result = load_full_dw_json(path=config_path)
    except Exception as error:
        get_logger("config.dw_json_source").warning(
            "[DwJsonSource] Failed to read dw.json while listing instances: %s", error
        )
        return []

    if not result:
        return []

    instances: list[InstanceInfo] = []
    config = result.config
    if config.get("name"):
        instances.append(
            InstanceInfo(
                name=config["name"],
                hostname=config.get("hostname"),
                active=config.get("active"),
                source=source_name,
                location=result.path,
            )
        )
    for item in config.get("configs") or []:
        if item.get("name"):
            instances.append(
                InstanceInfo(
                    name=item["name"],
                    hostname=item.get("hostname"),
                    active=item.get("active"),
                    source=source_name,
                    location=result.path,
                )
            )
    return instances


def _load_active_config(config_path: str) -> LoadDwJsonResult | None:
    """Load a file's active instance, if one is flagged."""
    full = load_full_dw_json(path=config_path)
    if not full:
        return None
    for item in full.config.get("configs") or []:
        if item.get("active") is True and item.get("name"):
            return load_dw_json(path=config_path, instance=item["name"])
    if full.config.get("active") is True:
        return load_dw_json(path=config_path, instance=full.config.get("name"))
    return None


def _load_default_config(config_path: str) -> LoadDwJsonResult | None:
    """Load a file's root/default entry only when it carries configuration fields."""
    result = load_dw_json(path=config_path)
    if not result:
        return None
    if result.config.get("active") is False:
        return None
    config = map_dw_json_to_normalized_config(result.config)
    return result if len(get_populated_fields(config)) > 0 else None


class DwJsonSource:
    """Configuration source that loads from dw.json files."""

    name = "DwJsonSource"
    priority = 0

    async def load(self, options: ResolveConfigOptions) -> ConfigLoadResult | None:
        """Load configuration for the requested (or active/root) instance."""
        logger = get_logger("config.dw_json_source")
        config_paths = _select_config_paths(options)

        result: LoadDwJsonResult | None = None
        if options.instance:
            for config_path in config_paths:
                result = load_dw_json(instance=options.instance, path=config_path)
                if result:
                    break
        else:
            for config_path in config_paths:
                result = _load_active_config(config_path)
                if not result:
                    result = _load_default_config(config_path)
                if result:
                    break

        instance_catalog = _create_instance_catalog(config_paths, result.path if result else None, options)
        if not result:
            if instance_catalog:
                logger.debug("[DwJsonSource] No matching/default instance; catalog retained")
                return ConfigLoadResult(config=NormalizedConfig(), instance_catalog=instance_catalog)
            return None

        config = map_dw_json_to_normalized_config(result.config)
        scope: Literal["global"] | None = "global" if _is_global_config_path(result.path, options) else None
        logger.debug("[DwJsonSource] Loaded config from %s (scope=%s)", result.path, scope)
        return ConfigLoadResult(config=config, location=result.path, scope=scope, instance_catalog=instance_catalog)

    async def list_instances(self, options: ResolveConfigOptions | None = None) -> list[InstanceInfo]:
        """List all instances across the effective dw.json files (deduped by name)."""
        config_paths = _select_config_paths(options) if options else [os.path.join(os.getcwd(), "dw.json")]
        instances: list[InstanceInfo] = []
        names: set[str] = set()
        for config_path in config_paths:
            for instance in _list_instances_from_path(self.name, config_path):
                if instance.name not in names:
                    names.add(instance.name)
                    instances.append(instance)
        return instances

    async def create_instance(self, options: CreateInstanceOptions) -> None:
        """Create a new instance in dw.json."""
        resolve_options = ResolveConfigOptions(
            config_path=options.config_path,
            project_directory=options.project_directory,
            working_directory=options.working_directory,
            default_config_path=options.default_config_path,
        )
        dw_json_config = map_normalized_config_to_dw_json(options.config, options.name)
        add_instance(
            dw_json_config,
            path=_select_config_path(resolve_options),
            project_directory=options.project_directory or options.working_directory,
            set_active=options.set_active,
        )
        if options.set_active:
            await self.set_active_instance(options.name, resolve_options)

    async def remove_instance(self, name: str, options: ResolveConfigOptions | None = None) -> None:
        """Remove an instance from the dw.json file that contains it."""
        if not options:
            remove_instance(name)
            return
        for config_path in _select_config_paths(options):
            instances = _list_instances_from_path(self.name, config_path)
            if any(instance.name == name for instance in instances):
                remove_instance(name, path=config_path)
                return
        raise ValueError(f'Instance "{name}" not found')

    async def set_active_instance(self, name: str, options: ResolveConfigOptions | None = None) -> None:
        """Set an instance active, clearing active flags in the other catalog files."""
        if not options:
            set_active_instance(name)
            return

        config_paths = _select_config_paths(options)
        target_path: str | None = None
        for config_path in config_paths:
            instances = _list_instances_from_path(self.name, config_path)
            if any(instance.name == name for instance in instances):
                target_path = config_path
                break
        if not target_path:
            raise ValueError(f'Instance "{name}" not found')

        set_active_instance(name, path=target_path)
        for config_path in config_paths:
            if config_path == target_path:
                continue
            result = load_full_dw_json(path=config_path)
            if not result:
                continue
            changed = False
            if result.config.get("active") is True:
                result.config["active"] = False
                changed = True
            for instance in result.config.get("configs") or []:
                if instance.get("active") is True:
                    instance["active"] = False
                    changed = True
            if changed:
                save_dw_json(result.config, config_path)


__all__ = ["DwJsonSource"]
