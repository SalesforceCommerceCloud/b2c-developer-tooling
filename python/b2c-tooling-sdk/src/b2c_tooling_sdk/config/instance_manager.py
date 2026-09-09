# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Instance management service.

Mirrors ``src/config/instance-manager.ts``. Aggregates instance-management
operations across the config sources that implement the optional methods
(``list_instances``, ``create_instance``, ``remove_instance``,
``set_active_instance``, ``store_credential``). Sources may implement these
either synchronously or as coroutines; results are awaited when needed.
"""

from __future__ import annotations

import inspect
from typing import Any

from b2c_tooling_sdk.config.types import (
    ConfigSource,
    CreateInstanceOptions,
    InstanceInfo,
    ResolveConfigOptions,
)


async def _maybe_await(value: Any) -> Any:
    """Await ``value`` if it is awaitable, otherwise return it as-is."""
    if inspect.isawaitable(value):
        return await value
    return value


class InstanceManager:
    """Aggregates instance-management operations across multiple config sources."""

    def __init__(self, sources: list[ConfigSource]) -> None:
        self._sources = sources

    async def list_all_instances(self, options: ResolveConfigOptions | None = None) -> list[InstanceInfo]:
        """List instances from every source that implements ``list_instances``."""
        all_instances: list[InstanceInfo] = []
        for source in self._sources:
            list_instances = getattr(source, "list_instances", None)
            if list_instances is not None:
                instances = await _maybe_await(list_instances(options))
                all_instances.extend(instances)
        return all_instances

    def get_instance_sources(self) -> list[ConfigSource]:
        """Return sources that can create instances."""
        return [s for s in self._sources if getattr(s, "create_instance", None) is not None]

    def get_credential_sources(self, field: str) -> list[ConfigSource]:
        """Return sources that can store the given credential field."""
        return [s for s in self._sources if field in (getattr(s, "credential_fields", None) or [])]

    async def create_instance(self, options: CreateInstanceOptions, target_source: str | None = None) -> None:
        """Create an instance in the target source (or the first available one)."""
        instance_sources = self.get_instance_sources()
        if not instance_sources:
            raise ValueError("No config sources support instance creation")

        if target_source:
            source = next((s for s in instance_sources if s.name == target_source), None)
            if source is None:
                raise ValueError(f'Source "{target_source}" not found or does not support instance creation')
        else:
            source = instance_sources[0]

        await _maybe_await(source.create_instance(options))  # type: ignore[attr-defined]

    async def remove_instance(self, name: str, options: ResolveConfigOptions | None = None) -> None:
        """Remove an instance from whichever source contains it."""
        for source in self._sources:
            list_instances = getattr(source, "list_instances", None)
            remove = getattr(source, "remove_instance", None)
            if list_instances is not None and remove is not None:
                instances = await _maybe_await(list_instances(options))
                if any(i.name == name for i in instances):
                    await _maybe_await(remove(name, options))
                    return
        raise ValueError(f'Instance "{name}" not found in any source')

    async def set_active_instance(self, name: str, options: ResolveConfigOptions | None = None) -> None:
        """Set an instance active in whichever source contains it."""
        for source in self._sources:
            list_instances = getattr(source, "list_instances", None)
            set_active = getattr(source, "set_active_instance", None)
            if list_instances is not None and set_active is not None:
                instances = await _maybe_await(list_instances(options))
                if any(i.name == name for i in instances):
                    await _maybe_await(set_active(name, options))
                    return
        raise ValueError(f'Instance "{name}" not found in any source')

    async def store_credential(
        self,
        instance_name: str,
        field: str,
        value: str,
        target_source: str | None = None,
        options: ResolveConfigOptions | None = None,
    ) -> None:
        """Store a credential for an instance in the target credential source."""
        credential_sources = self.get_credential_sources(field)
        if not credential_sources:
            raise ValueError(f'No config sources support storing credential field "{field}"')

        if target_source:
            source = next((s for s in credential_sources if s.name == target_source), None)
            if source is None:
                raise ValueError(f'Source "{target_source}" not found or does not support credential storage')
        else:
            source = credential_sources[0]

        await _maybe_await(source.store_credential(instance_name, field, value, options))  # type: ignore[attr-defined]


def create_instance_manager(sources: list[ConfigSource]) -> InstanceManager:
    """Create an :class:`InstanceManager` with the given sources."""
    return InstanceManager(sources)


__all__ = ["InstanceManager", "create_instance_manager"]
