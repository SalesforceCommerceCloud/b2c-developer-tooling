# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""dw.json configuration file loading.

Mirrors ``src/config/dw-json.ts``. Loads B2C Commerce configuration from
``dw.json`` files, the standard format used by B2C development tools.

The TypeScript functions are async (``fs/promises``); config file access is not
a hot path, so this port uses synchronous file IO. Files are written with the
same 2-space indent + trailing newline the TypeScript SDK produces, so a
``dw.json`` edited from Python stays interoperable.

``DwJsonConfig`` / ``DwJsonMultiConfig`` are plain ``dict[str, Any]`` with
camelCase keys (post :func:`normalize_config_keys`), matching the on-disk format.
"""

from __future__ import annotations

import json as json_module
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from b2c_tooling_sdk.config.mapping import normalize_config_keys
from b2c_tooling_sdk.logging import get_logger

#: A single dw.json instance config (camelCase keys, post key-normalization).
DwJsonConfig = dict[str, Any]
#: A dw.json file that may carry a ``configs`` array of named instances.
DwJsonMultiConfig = dict[str, Any]


@dataclass
class LoadDwJsonResult:
    """The selected dw.json config plus the file path it came from."""

    config: DwJsonConfig
    path: str


@dataclass
class LoadFullDwJsonResult:
    """The full (multi-config) dw.json structure plus its file path."""

    config: DwJsonMultiConfig
    path: str


def _default_dw_json_path(
    *,
    path: str | None,
    project_directory: str | None = None,
    working_directory: str | None = None,
) -> str:
    """Resolve the dw.json path: explicit path, else ``<project|working|cwd>/dw.json``."""
    if path is not None:
        return path
    base = project_directory or working_directory or os.getcwd()
    return os.path.join(base, "dw.json")


def find_dw_json(project_directory: str | None = None) -> str | None:
    """Find dw.json by searching upward from ``project_directory`` (defaults to cwd)."""
    start = project_directory or os.getcwd()
    directory = Path(start).resolve()
    root = Path(directory.anchor)

    current = directory
    while current != root:
        candidate = current / "dw.json"
        if candidate.exists():
            return str(candidate)
        current = current.parent
    # Check the filesystem root itself for parity with a top-level dw.json.
    candidate = root / "dw.json"
    return str(candidate) if candidate.exists() else None


def _select_config(json_data: DwJsonMultiConfig, instance_name: str | None = None) -> DwJsonConfig | None:
    """Select a config from a multi-config dw.json.

    Priority: named instance (if requested) -> ``active: true`` -> root config.
    """
    logger = get_logger("config.dw_json")
    configs = json_data.get("configs")

    if not isinstance(configs, list) or len(configs) == 0:
        logger.debug("[DwJsonSource] Selected config %r (single config)", json_data.get("name") or "root")
        return json_data

    entries: list[DwJsonConfig] = configs

    if instance_name:
        if json_data.get("name") == instance_name:
            logger.debug("[DwJsonSource] Selected config %r by name (root)", instance_name)
            return json_data
        for c in entries:
            if c.get("name") == instance_name:
                logger.debug("[DwJsonSource] Selected config %r by name", instance_name)
                return c
        logger.debug("[DwJsonSource] Named instance %r not found", instance_name)
        return None

    for c in entries:
        if c.get("active") is True:
            logger.debug("[DwJsonSource] Selected config %r by active flag", c.get("name"))
            return c

    logger.debug("[DwJsonSource] Selected config %r (default to root)", json_data.get("name") or "root")
    return json_data


def load_full_dw_json(
    *,
    path: str | None = None,
    project_directory: str | None = None,
    working_directory: str | None = None,
) -> LoadFullDwJsonResult | None:
    """Load the raw multi-config dw.json without selecting an instance.

    Returns ``None`` if the file does not exist. Raises on invalid JSON.
    """
    logger = get_logger("config.dw_json")
    dw_json_path = _default_dw_json_path(
        path=path, project_directory=project_directory, working_directory=working_directory
    )

    if not os.path.exists(dw_json_path):
        logger.debug("[DwJsonSource] No config file found: %s", dw_json_path)
        return None

    try:
        with open(dw_json_path, encoding="utf-8") as fh:
            data = json_module.load(fh)
    except Exception as error:
        logger.debug("[DwJsonSource] Failed to parse config file %s: %s", dw_json_path, error)
        raise
    return LoadFullDwJsonResult(config=data, path=dw_json_path)


def save_dw_json(config: DwJsonMultiConfig, file_path: str) -> None:
    """Save a dw.json to disk (2-space indent + trailing newline)."""
    content = json_module.dumps(config, indent=2) + "\n"
    with open(file_path, "w", encoding="utf-8") as fh:
        fh.write(content)


def add_instance(
    instance: DwJsonConfig,
    *,
    path: str | None = None,
    project_directory: str | None = None,
    working_directory: str | None = None,
    set_active: bool = False,
) -> None:
    """Add a new named instance to dw.json, creating the file if needed.

    :raises ValueError: if the instance has no name or the name already exists.
    """
    dw_json_path = _default_dw_json_path(
        path=path, project_directory=project_directory, working_directory=working_directory
    )

    existing: DwJsonMultiConfig = {}
    if os.path.exists(dw_json_path):
        with open(dw_json_path, encoding="utf-8") as fh:
            existing = json_module.load(fh)

    instance_name = instance.get("name")
    if not instance_name:
        raise ValueError("Instance must have a name")

    if existing.get("name") == instance_name:
        raise ValueError(f'Instance "{instance_name}" already exists')

    configs = existing.get("configs")
    if isinstance(configs, list) and any(c.get("name") == instance_name for c in configs):
        raise ValueError(f'Instance "{instance_name}" already exists')

    if set_active:
        instance["active"] = True
        if existing.get("active") is not None:
            existing["active"] = False
        if isinstance(existing.get("configs"), list):
            for c in existing["configs"]:
                if c.get("active") is not None:
                    c["active"] = False

    if not isinstance(existing.get("configs"), list):
        existing["configs"] = []
    existing["configs"].append(instance)

    save_dw_json(existing, dw_json_path)


def remove_instance(
    name: str,
    *,
    path: str | None = None,
    project_directory: str | None = None,
    working_directory: str | None = None,
) -> None:
    """Remove a named instance from dw.json.

    :raises FileNotFoundError: if no dw.json exists.
    :raises ValueError: when removing the root instance or a missing instance.
    """
    dw_json_path = _default_dw_json_path(
        path=path, project_directory=project_directory, working_directory=working_directory
    )
    if not os.path.exists(dw_json_path):
        raise FileNotFoundError("No dw.json file found")

    with open(dw_json_path, encoding="utf-8") as fh:
        existing = json_module.load(fh)

    if existing.get("name") == name:
        raise ValueError(f'Cannot remove root instance "{name}". Edit dw.json manually to remove root config.')

    configs = existing.get("configs")
    if not isinstance(configs, list) or not any(c.get("name") == name for c in configs):
        raise ValueError(f'Instance "{name}" not found')

    existing["configs"] = [c for c in configs if c.get("name") != name]
    save_dw_json(existing, dw_json_path)


def set_active_instance(
    name: str,
    *,
    path: str | None = None,
    project_directory: str | None = None,
    working_directory: str | None = None,
) -> None:
    """Set a named instance as the active default.

    :raises FileNotFoundError: if no dw.json exists.
    :raises ValueError: if the instance is not found.
    """
    dw_json_path = _default_dw_json_path(
        path=path, project_directory=project_directory, working_directory=working_directory
    )
    if not os.path.exists(dw_json_path):
        raise FileNotFoundError("No dw.json file found")

    with open(dw_json_path, encoding="utf-8") as fh:
        existing = json_module.load(fh)

    found = False
    if existing.get("name") == name:
        found = True
        existing["active"] = True
    elif existing.get("active") is not None:
        existing["active"] = False

    if isinstance(existing.get("configs"), list):
        for c in existing["configs"]:
            if c.get("name") == name:
                found = True
                c["active"] = True
            elif c.get("active") is not None:
                c["active"] = False

    if not found:
        raise ValueError(f'Instance "{name}" not found')

    save_dw_json(existing, dw_json_path)


def load_dw_json(
    *,
    instance: str | None = None,
    path: str | None = None,
    project_directory: str | None = None,
    working_directory: str | None = None,
) -> LoadDwJsonResult | None:
    """Load configuration from a dw.json file (no upward directory search).

    Keys are normalized to camelCase and the appropriate instance is selected.
    Returns ``None`` if no file is found or the named instance is absent. Raises
    on invalid JSON.
    """
    logger = get_logger("config.dw_json")
    dw_json_path = _default_dw_json_path(
        path=path, project_directory=project_directory, working_directory=working_directory
    )

    if not os.path.exists(dw_json_path):
        logger.debug("[DwJsonSource] No config file found: %s", dw_json_path)
        return None

    try:
        with open(dw_json_path, encoding="utf-8") as fh:
            raw = json_module.load(fh)
    except Exception as error:
        logger.debug("[DwJsonSource] Failed to parse config file %s: %s", dw_json_path, error)
        raise

    normalized = normalize_config_keys(raw)
    configs = normalized.get("configs")
    if isinstance(configs, list):
        normalized["configs"] = [normalize_config_keys(item) for item in configs]

    config = _select_config(normalized, instance)
    if config is None:
        return None
    return LoadDwJsonResult(config=config, path=dw_json_path)


__all__ = [
    "DwJsonConfig",
    "DwJsonMultiConfig",
    "LoadDwJsonResult",
    "LoadFullDwJsonResult",
    "add_instance",
    "find_dw_json",
    "load_dw_json",
    "load_full_dw_json",
    "remove_instance",
    "save_dw_json",
    "set_active_instance",
]
