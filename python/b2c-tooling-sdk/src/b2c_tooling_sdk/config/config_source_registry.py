# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Global registry for :class:`ConfigSource` instances.

Mirrors ``src/config/config-source-registry.ts``. Sources registered here are
automatically included in every :func:`resolve_config` call, sorted by priority
alongside the default and explicitly-passed sources.
"""

from __future__ import annotations

from b2c_tooling_sdk.config.types import ConfigSource


class ConfigSourceRegistry:
    """Registry that collects :class:`ConfigSource` instances for resolution."""

    def __init__(self) -> None:
        self._sources: list[ConfigSource] = []

    def register(self, source: ConfigSource) -> None:
        """Register a source (ignored if a source with the same name exists)."""
        if any(s.name == source.name for s in self._sources):
            return
        self._sources.append(source)

    def unregister(self, name: str) -> bool:
        """Remove a source by name; returns True if one was removed."""
        for index, source in enumerate(self._sources):
            if source.name == name:
                del self._sources[index]
                return True
        return False

    def get_sources(self) -> list[ConfigSource]:
        """Return a shallow copy of all registered sources."""
        return list(self._sources)

    def clear(self) -> None:
        """Remove all registered sources (primarily useful for testing)."""
        self._sources = []

    @property
    def size(self) -> int:
        """Number of registered sources."""
        return len(self._sources)

    def get_source_names(self) -> list[str]:
        """Return the names of all registered sources."""
        return [s.name for s in self._sources]


#: Global registry used by :func:`resolve_config`.
global_config_source_registry = ConfigSourceRegistry()


__all__ = ["ConfigSourceRegistry", "global_config_source_registry"]
