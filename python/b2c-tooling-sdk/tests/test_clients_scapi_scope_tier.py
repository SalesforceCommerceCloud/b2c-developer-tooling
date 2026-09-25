# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for the SCAPI scope-tier manager (``clients/scapi_scope_tier.py``).

Mirrors ``packages/b2c-tooling-sdk/test/clients/scapi-scope-tier.test.ts``: the
lazy rw/read client state machine, the write-after-downgrade guard, and the
``try_read`` downgrade-and-retry-once-on-invalid-scope behavior.
"""

from __future__ import annotations

import pytest

from b2c_tooling_sdk.clients.scapi_backend_utils import ScapiCapabilityUnsupportedError
from b2c_tooling_sdk.clients.scapi_scope_tier import ScopeTierManager


class _FakeClient:
    def __init__(self, scopes: list[str]) -> None:
        self.scopes = scopes


def _manager() -> tuple[ScopeTierManager[_FakeClient], list[list[str]]]:
    built: list[list[str]] = []

    def build(scopes: list[str]) -> _FakeClient:
        built.append(scopes)
        return _FakeClient(scopes)

    manager: ScopeTierManager[_FakeClient] = ScopeTierManager(
        build_client=build,
        rw_scopes=["sfcc.jobs.rw"],
        read_scopes=["sfcc.jobs"],
        domain_name="Jobs",
    )
    return manager, built


def test_initial_tier_is_unresolved() -> None:
    manager, _ = _manager()
    assert manager.resolved_tier is None


def test_first_read_builds_rw_client_and_resolves_rw() -> None:
    manager, built = _manager()
    client = manager.get_client_for_read()
    assert client.scopes == ["sfcc.jobs.rw"]
    assert manager.resolved_tier == "rw"
    assert built == [["sfcc.jobs.rw"]]


def test_rw_client_is_cached_across_calls() -> None:
    manager, built = _manager()
    first = manager.get_client_for_read()
    second = manager.get_client_for_write()
    assert first is second
    assert built == [["sfcc.jobs.rw"]]


def test_write_after_downgrade_raises_capability_error() -> None:
    manager, _ = _manager()
    manager.downgrade_to_read_only()
    with pytest.raises(ScapiCapabilityUnsupportedError, match="sfcc.jobs.rw"):
        manager.get_client_for_write()


def test_read_after_downgrade_uses_read_only_client() -> None:
    manager, built = _manager()
    manager.downgrade_to_read_only()
    client = manager.get_client_for_read()
    assert client.scopes == ["sfcc.jobs"]
    assert manager.resolved_tier == "read-only"


async def test_try_read_succeeds_on_rw_without_downgrade() -> None:
    manager, built = _manager()

    async def read(client: _FakeClient) -> str:
        return "ok"

    result = await manager.try_read(read)
    assert result == "ok"
    assert manager.resolved_tier == "rw"
    assert built == [["sfcc.jobs.rw"]]


async def test_try_read_downgrades_and_retries_on_invalid_scope() -> None:
    manager, built = _manager()
    calls: list[list[str]] = []

    async def read(client: _FakeClient) -> str:
        calls.append(client.scopes)
        if client.scopes == ["sfcc.jobs.rw"]:
            raise Exception("invalid_scope")
        return "ok-on-read-only"

    result = await manager.try_read(read)
    assert result == "ok-on-read-only"
    assert manager.resolved_tier == "read-only"
    assert calls == [["sfcc.jobs.rw"], ["sfcc.jobs"]]
    assert built == [["sfcc.jobs.rw"], ["sfcc.jobs"]]


async def test_try_read_propagates_non_scope_errors() -> None:
    manager, _ = _manager()

    async def read(client: _FakeClient) -> str:
        raise RuntimeError("network down")

    with pytest.raises(RuntimeError, match="network down"):
        await manager.try_read(read)
    # A non-scope failure must not trigger a downgrade.
    assert manager.resolved_tier == "rw"


async def test_try_read_does_not_retry_when_already_read_only() -> None:
    manager, _ = _manager()
    manager.downgrade_to_read_only()
    attempts = 0

    async def read(client: _FakeClient) -> str:
        nonlocal attempts
        attempts += 1
        raise Exception("invalid_scope")

    with pytest.raises(Exception, match="invalid_scope"):
        await manager.try_read(read)
    assert attempts == 1
