# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for config/config_source_registry (mirrors the TS
``config/config-source-registry`` suite).
"""

from __future__ import annotations

from b2c_tooling_sdk.config.config_source_registry import ConfigSourceRegistry
from b2c_tooling_sdk.config.types import ConfigLoadResult, ResolveConfigOptions


class _StubSource:
    """Minimal :class:`ConfigSource` implementation for registry tests."""

    def __init__(self, name: str, priority: int | None = None) -> None:
        self.name = name
        self.priority = priority

    def load(self, options: ResolveConfigOptions) -> ConfigLoadResult | None:  # noqa: ARG002
        return None


def test_register_adds_sources_and_get_source_names_returns_them() -> None:
    registry = ConfigSourceRegistry()

    registry.register(_StubSource("s1"))
    registry.register(_StubSource("s2"))

    assert registry.size == 2
    assert registry.get_source_names() == ["s1", "s2"]


def test_register_silently_ignores_duplicate_source_names() -> None:
    registry = ConfigSourceRegistry()
    registry.register(_StubSource("s1"))
    registry.register(_StubSource("s1"))

    assert registry.size == 1
    assert registry.get_source_names() == ["s1"]


def test_unregister_removes_an_existing_source_by_name() -> None:
    registry = ConfigSourceRegistry()
    registry.register(_StubSource("s1"))

    assert registry.size == 1
    assert registry.unregister("s1") is True
    assert registry.size == 0


def test_unregister_returns_false_when_source_does_not_exist() -> None:
    registry = ConfigSourceRegistry()
    registry.register(_StubSource("s1"))

    assert registry.unregister("missing") is False
    assert registry.size == 1


def test_get_sources_returns_a_copy_of_registered_sources() -> None:
    registry = ConfigSourceRegistry()
    source = _StubSource("s1")
    registry.register(source)

    sources = registry.get_sources()
    assert len(sources) == 1
    assert sources[0] is source

    # Mutating the returned list should not affect the registry.
    sources.append(_StubSource("s2"))
    assert registry.size == 1


def test_clear_removes_all_sources() -> None:
    registry = ConfigSourceRegistry()
    registry.register(_StubSource("s1"))
    registry.register(_StubSource("s2"))

    assert registry.size == 2
    registry.clear()
    assert registry.size == 0
    assert registry.get_source_names() == []
