# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Shared pytest fixtures.

Provides isolation so tests never touch a developer's real auth-session store,
settings, or dw.json, mirroring the TypeScript ``test-utils/config-isolation``.
"""

from __future__ import annotations

from collections.abc import Iterator
from pathlib import Path

import pytest

from b2c_tooling_sdk.auth.oauth import reset_oauth_cache_for_testing
from b2c_tooling_sdk.auth.oauth_implicit import reset_implicit_cache_for_testing
from b2c_tooling_sdk.auth.oauth_pkce import reset_pkce_cache_for_testing
from b2c_tooling_sdk.auth.session_store import (
    FileAuthSessionBackend,
    InMemoryAuthSessionBackend,
    reset_auth_session_store_for_testing,
    set_auth_session_backend,
)


@pytest.fixture(autouse=True)
def _reset_module_state(tmp_path: Path) -> Iterator[None]:
    """Reset module-level auth caches and isolate the session store before/after each test.

    Installs a temp-dir :class:`FileAuthSessionBackend` as the default so that a test
    which forgets to register its own backend can never touch a developer's real
    ``auth-sessions.json`` (on macOS the default data dir ignores env overrides).
    """
    reset_oauth_cache_for_testing()
    reset_pkce_cache_for_testing()
    reset_implicit_cache_for_testing()
    set_auth_session_backend(FileAuthSessionBackend(tmp_path / "default-store"))
    yield
    reset_oauth_cache_for_testing()
    reset_pkce_cache_for_testing()
    reset_implicit_cache_for_testing()
    reset_auth_session_store_for_testing()


@pytest.fixture
def memory_session_store() -> Iterator[InMemoryAuthSessionBackend]:
    """Install an in-memory auth-session backend for the duration of a test."""
    backend = InMemoryAuthSessionBackend()
    set_auth_session_backend(backend)
    yield backend
    set_auth_session_backend(None)


@pytest.fixture(autouse=True)
def _isolate_env(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    """Point config/data dir env vars at a temp dir so the file backend is isolated by default."""
    data_home = tmp_path / "data"
    config_home = tmp_path / "config"
    data_home.mkdir(parents=True, exist_ok=True)
    config_home.mkdir(parents=True, exist_ok=True)
    monkeypatch.setenv("XDG_DATA_HOME", str(data_home))
    monkeypatch.setenv("XDG_CONFIG_HOME", str(config_home))
    monkeypatch.setenv("LOCALAPPDATA", str(data_home))
    monkeypatch.delenv("B2C_CONFIG_DIR", raising=False)
