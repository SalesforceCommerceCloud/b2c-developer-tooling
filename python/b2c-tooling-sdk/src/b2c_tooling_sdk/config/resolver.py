# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Configuration resolution.

Mirrors ``src/config/resolver.ts``. :class:`ConfigResolver` is the high-level API
for loading B2C configuration from multiple sources with consistent hostname /
credential-group protection. :func:`resolve_config` wraps it and returns a rich
:class:`ResolvedConfigImpl`.
"""

from __future__ import annotations

import copy
import dataclasses
import inspect

from b2c_tooling_sdk.auth.types import AuthCredentials
from b2c_tooling_sdk.config.config_source_registry import global_config_source_registry
from b2c_tooling_sdk.config.mapping import (
    MergeConfigOptions,
    create_instance_from_config,
    get_populated_fields,
    merge_configs_with_protection,
    normalize_origin_url,
)
from b2c_tooling_sdk.config.resolved_config import ResolvedConfigImpl
from b2c_tooling_sdk.config.sources import DwJsonSource, MobifySource, PackageJsonSource
from b2c_tooling_sdk.config.types import (
    ConfigLoadResult,
    ConfigResolutionResult,
    ConfigSource,
    ConfigSourceInfo,
    ConfigWarning,
    NormalizedConfig,
    ResolveConfigOptions,
    source_priority,
)
from b2c_tooling_sdk.instance import B2CInstance
from b2c_tooling_sdk.logging import get_logger

#: Credential groups that must come from the same source. If any field in a group
#: is already set by a higher-priority source, all fields in that group from
#: lower-priority sources are skipped.
CREDENTIAL_GROUPS: list[list[str]] = [
    ["client_id", "client_secret"],
    ["username", "password"],
    ["slas_client_id", "slas_client_secret"],
]


def _get_claimed_credential_groups(config: NormalizedConfig) -> set[int]:
    """Return the indices of credential groups already claimed in ``config``."""
    claimed: set[int] = set()
    for i, group in enumerate(CREDENTIAL_GROUPS):
        if any(getattr(config, f) is not None for f in group):
            claimed.add(i)
    return claimed


def _is_field_in_claimed_group(field: str, claimed_groups: set[int]) -> bool:
    """Whether ``field`` belongs to a credential group in ``claimed_groups``."""
    for i, group in enumerate(CREDENTIAL_GROUPS):
        if field in group:
            return i in claimed_groups
    return False


async def _load_source(source: ConfigSource, options: ResolveConfigOptions) -> ConfigLoadResult | None:
    """Call a source's ``load`` and await the result if it is a coroutine."""
    result = source.load(options)
    if inspect.isawaitable(result):
        return await result
    return result


class ConfigResolver:
    """Resolves configuration from multiple sources with consistent behaviour."""

    def __init__(self, sources: list[ConfigSource] | None = None) -> None:
        config_sources: list[ConfigSource] = (
            sources if sources is not None else [DwJsonSource(), MobifySource(), PackageJsonSource()]
        )
        # Sort by priority (lower number = higher priority, missing = 0). Python's
        # sort is stable, so equal-priority sources keep their input order.
        self._sources = sorted(config_sources, key=source_priority)

    async def resolve(
        self,
        overrides: NormalizedConfig | None = None,
        options: ResolveConfigOptions | None = None,
    ) -> ConfigResolutionResult:
        """Resolve configuration from all sources, applying override precedence."""
        overrides = overrides if overrides is not None else NormalizedConfig()
        options = options if options is not None else ResolveConfigOptions()
        logger = get_logger("config.resolver")

        source_infos: list[ConfigSourceInfo] = []
        source_warnings: list[ConfigWarning] = []
        base_config = NormalizedConfig()
        hostname_protection = options.hostname_protection is not False

        # Enriched options let later sources (e.g. plugins) use values discovered
        # by earlier sources; CLI-provided options always take precedence.
        enriched_options = copy.copy(options)
        if not enriched_options.account_manager_host and overrides.account_manager_host:
            enriched_options.account_manager_host = overrides.account_manager_host
        if not enriched_options.cloud_origin and overrides.mrt_origin:
            enriched_options.cloud_origin = normalize_origin_url(overrides.mrt_origin)

        for source in self._sources:
            try:
                result = await _load_source(source, enriched_options)
            except Exception as error:
                source_warnings.append(
                    ConfigWarning(
                        code="SOURCE_ERROR",
                        message=f"Failed to load configuration from {source.name}: {error}",
                        details={"source": source.name, "error": str(error)},
                    )
                )
                continue

            if not result or result.config is None:
                continue

            source_config = result.config
            fields = get_populated_fields(source_config)

            if not fields and result.instance_catalog:
                source_infos.append(
                    ConfigSourceInfo(
                        name=source.name,
                        scope=result.scope,
                        location=result.location,
                        fields=[],
                        instance_catalog=result.instance_catalog,
                    )
                )
            if not fields:
                continue

            # Early hostname mismatch detection: skip an instance-bound source whose
            # hostname conflicts with the override so it can't block later sources.
            if (
                hostname_protection
                and overrides.hostname
                and source_config.hostname
                and source_config.hostname != overrides.hostname
            ):
                source_warnings.append(
                    ConfigWarning(
                        code="HOSTNAME_MISMATCH",
                        message=(
                            f'Server override "{overrides.hostname}" differs from config file '
                            f'"{source_config.hostname}". Config file values ignored.'
                        ),
                        details={
                            "provided_hostname": overrides.hostname,
                            "config_hostname": source_config.hostname,
                        },
                    )
                )
                source_infos.append(
                    ConfigSourceInfo(
                        name=source.name,
                        scope=result.scope,
                        location=result.location,
                        fields=[],
                        fields_ignored=fields,
                        instance_catalog=result.instance_catalog,
                    )
                )
                logger.debug("[%s] Skipped due to hostname mismatch", source.name)
                continue

            claimed_groups = _get_claimed_credential_groups(base_config)
            fields_ignored: list[str] = []

            for f in dataclasses.fields(source_config):
                value = getattr(source_config, f.name)
                if value is None:
                    continue
                if getattr(base_config, f.name) is not None:
                    fields_ignored.append(f.name)
                    continue
                if _is_field_in_claimed_group(f.name, claimed_groups):
                    fields_ignored.append(f.name)
                    continue
                setattr(base_config, f.name, value)

            source_infos.append(
                ConfigSourceInfo(
                    name=source.name,
                    scope=result.scope,
                    location=result.location,
                    fields=fields,
                    fields_ignored=fields_ignored or None,
                    instance_catalog=result.instance_catalog,
                )
            )
            logger.debug("[%s] Contributed fields: %s", source.name, fields)

            if not enriched_options.account_manager_host and base_config.account_manager_host:
                enriched_options.account_manager_host = base_config.account_manager_host
            if not enriched_options.cloud_origin and base_config.mrt_origin:
                enriched_options.cloud_origin = base_config.mrt_origin

        merge_result = merge_configs_with_protection(
            overrides,
            base_config,
            MergeConfigOptions(
                hostname_protection=options.hostname_protection,
                client_id_protection=options.client_id_protection,
            ),
        )
        config = merge_result.config
        config.mrt_origin = normalize_origin_url(config.mrt_origin)

        warnings = [*source_warnings, *merge_result.warnings]
        return ConfigResolutionResult(config=config, warnings=warnings, sources=source_infos)

    async def create_auth_credentials(
        self,
        overrides: NormalizedConfig | None = None,
        options: ResolveConfigOptions | None = None,
    ) -> AuthCredentials:
        """Resolve config and return :class:`AuthCredentials` for ``resolve_auth_strategy``."""
        result = await self.resolve(overrides, options)
        config = result.config
        return AuthCredentials(
            client_id=config.client_id,
            client_secret=config.client_secret,
            scopes=config.scopes,
            username=config.username,
            password=config.password,
            api_key=config.mrt_api_key,
        )

    async def create_instance(
        self,
        overrides: NormalizedConfig | None = None,
        options: ResolveConfigOptions | None = None,
    ) -> B2CInstance:
        """Resolve configuration and create a :class:`~b2c_tooling_sdk.instance.B2CInstance`.

        A convenience method combining :meth:`resolve` with instance creation. Any
        resolution warnings are logged.

        :raises ValueError: if no hostname is available in the resolved config.
        """
        result = await self.resolve(overrides, options)
        logger = get_logger("config.resolver")
        for warning in result.warnings:
            logger.warning("[ConfigResolver] %s", warning.message)
        return create_instance_from_config(result.config)


def create_config_resolver() -> ConfigResolver:
    """Create a :class:`ConfigResolver` with the default sources."""
    return ConfigResolver()


async def resolve_config(
    overrides: NormalizedConfig | None = None,
    options: ResolveConfigOptions | None = None,
) -> ResolvedConfigImpl:
    """Resolve configuration and return a rich :class:`ResolvedConfigImpl`.

    Resolution priority (highest to lowest): explicit overrides, ``sources_before``,
    default sources (dw.json, ~/.mobify, package.json), ``sources_after``, and
    globally-registered sources. Set ``options.replace_default_sources`` to omit
    the defaults.
    """
    options = options if options is not None else ResolveConfigOptions()
    global_sources = global_config_source_registry.get_sources()

    before = options.sources_before or []
    after = options.sources_after or []

    sources: list[ConfigSource]
    if options.replace_default_sources:
        sources = [*before, *after, *global_sources]
    else:
        default_sources: list[ConfigSource] = [DwJsonSource(), MobifySource(), PackageJsonSource()]
        sources = [*before, *default_sources, *after, *global_sources]

    resolver = ConfigResolver(sources)
    result = await resolver.resolve(overrides, options)
    return ResolvedConfigImpl(result.config, result.warnings, result.sources)


__all__: list[str] = [
    "CREDENTIAL_GROUPS",
    "ConfigResolver",
    "create_config_resolver",
    "resolve_config",
]
