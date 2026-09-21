# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Mobify (``~/.mobify``) configuration source for the MRT API key.

Mirrors ``src/config/sources/mobify-source.ts``. Reads the JSON ``~/.mobify``
credentials file and extracts ``api_key`` into ``mrt_api_key``. When a cloud
origin is provided, reads ``~/.mobify--<hostname>`` instead.
"""

from __future__ import annotations

import json as json_module
import os
from pathlib import Path
from urllib.parse import urlparse

from b2c_tooling_sdk.config.types import ConfigLoadResult, NormalizedConfig, ResolveConfigOptions
from b2c_tooling_sdk.logging import get_logger


class MobifySource:
    """Configuration source that loads the MRT API key from ``~/.mobify``."""

    name = "MobifySource"
    priority = 0

    async def load(self, options: ResolveConfigOptions) -> ConfigLoadResult | None:
        """Load the MRT API key, or ``None`` if the file/key is absent."""
        logger = get_logger("config.mobify_source")
        mobify_path = options.credentials_file or self._get_mobify_path(options.cloud_origin)

        logger.debug("[MobifySource] Checking for credentials file: %s", mobify_path)
        if not os.path.exists(mobify_path):
            logger.debug("[MobifySource] No credentials file found: %s", mobify_path)
            return None

        try:
            with open(mobify_path, encoding="utf-8") as fh:
                config = json_module.load(fh)
        except Exception as error:
            logger.debug("[MobifySource] Failed to parse credentials file %s: %s", mobify_path, error)
            raise

        api_key = config.get("api_key")
        if not api_key:
            logger.debug("[MobifySource] Credentials file found but no api_key present: %s", mobify_path)
            return None

        logger.debug("[MobifySource] Loaded credentials from %s", mobify_path)
        return ConfigLoadResult(config=NormalizedConfig(mrt_api_key=api_key), location=mobify_path)

    def _get_mobify_path(self, cloud_origin: str | None) -> str:
        """Resolve the mobify config file path based on cloud origin."""
        home = str(Path.home())
        if cloud_origin:
            hostname = urlparse(cloud_origin).hostname
            suffix = hostname if hostname else cloud_origin
            return os.path.join(home, f".mobify--{suffix}")
        return os.path.join(home, ".mobify")


__all__ = ["MobifySource"]
