# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""package.json configuration source.

Mirrors ``src/config/sources/package-json-source.ts``. Reads the ``b2c`` key
from ``package.json`` in the project directory (not parents). Lowest priority
(1000); only non-sensitive, project-level defaults are honoured.
"""

from __future__ import annotations

import json as json_module
import os

from b2c_tooling_sdk.config.mapping import get_populated_fields, normalize_config_keys
from b2c_tooling_sdk.config.types import ConfigLoadResult, NormalizedConfig, ResolveConfigOptions
from b2c_tooling_sdk.logging import get_logger

#: Allowed fields, as (camelCase package.json key, NormalizedConfig attribute) pairs.
ALLOWED_FIELDS: list[tuple[str, str]] = [
    ("shortCode", "short_code"),
    ("clientId", "client_id"),
    ("siteId", "site_id"),
    ("contentLibrary", "content_library"),
    ("libraries", "libraries"),
    ("assetQuery", "asset_query"),
    ("mrtProject", "mrt_project"),
    ("mrtOrigin", "mrt_origin"),
    ("accountManagerHost", "account_manager_host"),
    ("sandboxApiHost", "sandbox_api_host"),
    ("realm", "realm"),
    ("importSetExclude", "import_set_exclude"),
]

_ALLOWED_KEYS: frozenset[str] = frozenset(camel for camel, _ in ALLOWED_FIELDS)


class PackageJsonSource:
    """Configuration source that loads from the ``b2c`` key in package.json."""

    name = "PackageJsonSource"
    priority = 1000

    async def load(self, options: ResolveConfigOptions) -> ConfigLoadResult | None:
        """Load non-sensitive project defaults from ``package.json``'s ``b2c`` key."""
        logger = get_logger("config.package_json_source")
        search_dir = options.project_directory or options.working_directory or os.getcwd()
        package_json_path = os.path.join(search_dir, "package.json")

        logger.debug("[PackageJsonSource] Checking for package.json: %s", package_json_path)
        if not os.path.exists(package_json_path):
            logger.debug("[PackageJsonSource] No package.json found")
            return None

        try:
            with open(package_json_path, encoding="utf-8") as fh:
                package_json = json_module.load(fh)
        except Exception as error:
            logger.debug("[PackageJsonSource] Failed to parse package.json %s: %s", package_json_path, error)
            raise

        b2c = package_json.get("b2c")
        if not b2c:
            logger.debug("[PackageJsonSource] No b2c key in package.json")
            return None

        b2c_config = normalize_config_keys(b2c)
        config = NormalizedConfig()
        for camel_key, attr in ALLOWED_FIELDS:
            value = b2c_config.get(camel_key)
            if value is not None:
                setattr(config, attr, value)

        disallowed = [key for key in b2c_config if key not in _ALLOWED_KEYS]
        if disallowed:
            logger.warning(
                "[PackageJsonSource] Ignoring sensitive/instance-specific fields in package.json b2c config: %s",
                disallowed,
            )

        fields = get_populated_fields(config)
        if not fields:
            logger.debug("[PackageJsonSource] b2c key present but no allowed fields populated")
            return None

        logger.debug("[PackageJsonSource] Loaded config from %s: %s", package_json_path, fields)
        return ConfigLoadResult(config=config, location=package_json_path)


__all__ = ["ALLOWED_FIELDS", "PackageJsonSource"]
