# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Environment variable configuration source.

Mirrors ``src/config/sources/env-source.ts``. Maps ``SFCC_*`` / ``MRT_*`` (and
sfcc-ci legacy) environment variables to :class:`NormalizedConfig` fields. Not
included in default sources — opt-in only via ``sources_before``.
"""

from __future__ import annotations

import os

from b2c_tooling_sdk.config.mapping import get_populated_fields
from b2c_tooling_sdk.config.types import ConfigLoadResult, NormalizedConfig, ResolveConfigOptions
from b2c_tooling_sdk.logging import get_logger

#: Env var name -> NormalizedConfig attribute. Order matters: later entries win
#: when two vars map to the same field (matches the CLI flag precedence).
ENV_VAR_MAP: dict[str, str] = {
    # sfcc-ci legacy aliases — listed first so canonical names below take precedence
    "SFCC_OAUTH_CLIENT_ID": "client_id",
    "SFCC_OAUTH_CLIENT_SECRET": "client_secret",
    "SFCC_LOGIN_URL": "account_manager_host",
    "SFCC_SERVER": "hostname",
    "SFCC_WEBDAV_SERVER": "webdav_hostname",
    "SFCC_CODE_VERSION": "code_version",
    "SFCC_USERNAME": "username",
    "SFCC_PASSWORD": "password",
    "SFCC_CERTIFICATE": "certificate",
    "SFCC_CERTIFICATE_PASSPHRASE": "certificate_passphrase",
    "SFCC_SELFSIGNED": "self_signed",
    "SFCC_CLIENT_ID": "client_id",
    "SFCC_CLIENT_SECRET": "client_secret",
    "SFCC_OAUTH_SCOPES": "scopes",
    "SFCC_SHORT_CODE": "short_code",
    "SFCC_SHORTCODE": "short_code",
    "SFCC_TENANT_ID": "tenant_id",
    "SFCC_SLAS_CLIENT_ID": "slas_client_id",
    "SFCC_SLAS_CLIENT_SECRET": "slas_client_secret",
    "SFCC_SITE_ID": "site_id",
    "SFCC_CARTRIDGES": "cartridges",
    "SFCC_IMPORT_SET_EXCLUDE": "import_set_exclude",
    "SFCC_CATALOGS": "catalogs",
    "SFCC_LIBRARIES": "libraries",
    "SFCC_ASSET_QUERY": "asset_query",
    "SFCC_DOCS_CATEGORIES": "docs_categories",
    "SFCC_AUTH_METHODS": "auth_methods",
    "SFCC_ACCOUNT_MANAGER_HOST": "account_manager_host",
    "SFCC_SANDBOX_API_HOST": "sandbox_api_host",
    "SFCC_API_BACKEND": "api_backend",
    "SFCC_CIP_HOST": "cip_host",
    # JWT Bearer auth env vars
    "SFCC_JWT_CERT": "jwt_cert_path",
    "SFCC_JWT_KEY": "jwt_key_path",
    "SFCC_JWT_PASSPHRASE": "jwt_passphrase",
    # MRT aliases — lowest to highest precedence to match MrtCommand flags
    "SFCC_MRT_API_KEY": "mrt_api_key",
    "MRT_API_KEY": "mrt_api_key",
    "SFCC_MRT_PROJECT": "mrt_project",
    "MRT_PROJECT": "mrt_project",
    "MRT_TARGET": "mrt_environment",
    "SFCC_MRT_ENVIRONMENT": "mrt_environment",
    "MRT_ENVIRONMENT": "mrt_environment",
    "SFCC_MRT_CLOUD_ORIGIN": "mrt_origin",
    "MRT_CLOUD_ORIGIN": "mrt_origin",
}

#: Fields parsed as comma-separated arrays.
ARRAY_FIELDS: frozenset[str] = frozenset(
    {
        "scopes",
        "auth_methods",
        "cartridges",
        "import_set_exclude",
        "catalogs",
        "docs_categories",
        "libraries",
        "asset_query",
    }
)

#: Fields parsed as booleans (``true`` / ``1``).
BOOLEAN_FIELDS: frozenset[str] = frozenset({"self_signed"})

#: Enum-valued fields and their allowed values (values outside the set are skipped).
ENUM_FIELDS: dict[str, tuple[str, ...]] = {"api_backend": ("ocapi", "scapi", "auto")}


class EnvSource:
    """Configuration source that reads CLI configuration environment variables.

    Priority ``-10`` (higher than dw.json at ``0``), matching CLI behaviour where
    env vars override file-based config.
    """

    name = "EnvSource"
    priority = -10

    def __init__(self, env: dict[str, str] | None = None) -> None:
        self._env = env if env is not None else dict(os.environ)

    def load(self, options: ResolveConfigOptions) -> ConfigLoadResult | None:  # noqa: ARG002
        """Load config from environment variables (synchronous)."""
        logger = get_logger("config.env_source")
        config = NormalizedConfig()

        for env_var, config_field in ENV_VAR_MAP.items():
            value = self._env.get(env_var)
            if value is None or value == "":
                continue

            allowed = ENUM_FIELDS.get(config_field)
            if allowed is not None and value not in allowed:
                logger.warning("[EnvSource] Ignoring %s: %r is not one of %s", env_var, value, ", ".join(allowed))
                continue

            if config_field in BOOLEAN_FIELDS:
                setattr(config, config_field, value in ("true", "1"))
            elif config_field in ARRAY_FIELDS:
                items = [s.strip() for s in value.split(",")]
                setattr(config, config_field, [s for s in items if s])
            else:
                setattr(config, config_field, value)

        fields = get_populated_fields(config)
        if not fields:
            logger.debug("[EnvSource] No SFCC_* environment variables found")
            return None

        logger.debug("[EnvSource] Loaded config from environment variables: %s", fields)
        return ConfigLoadResult(config=config, location="environment variables")


__all__ = ["ENV_VAR_MAP", "EnvSource"]
