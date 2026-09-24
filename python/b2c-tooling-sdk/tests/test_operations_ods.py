# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for ``b2c_tooling_sdk.operations.ods``.

Mirrors ``packages/b2c-tooling-sdk/test/operations/ods/*.test.ts``. Network calls
are intercepted with ``respx``; the timeout-sensitive polling loops (which the TS
tests drive with sinon fake timers) are instead driven by monkeypatching
``time.monotonic`` with a manually-advanced fake clock and injecting a fake
``sleep`` that advances it — so no test ever sleeps for real.
"""

from __future__ import annotations

import time
from collections.abc import Awaitable, Callable
from typing import Any

import httpx
import pytest
import respx

from b2c_tooling_sdk.clients import OdsClientConfig, create_ods_client
from b2c_tooling_sdk.operations.ods import (
    DEFAULT_OCAPI_RESOURCES,
    DEFAULT_WEBDAV_PERMISSIONS,
    BuildSandboxSettingsOptions,
    CloneBatchFailedError,
    CloneBatchPollingError,
    CloneBatchPollingTimeoutError,
    CloneFailedError,
    ClonePollingError,
    ClonePollingTimeoutError,
    SandboxNotFoundError,
    SandboxPollingError,
    SandboxPollingTimeoutError,
    SandboxTerminalStateError,
    WaitForCloneOptions,
    WaitForClonePollInfo,
    WaitForClonesOptions,
    WaitForClonesPollInfo,
    WaitForSandboxOptions,
    WaitForSandboxPollInfo,
    build_sandbox_settings,
    is_friendly_sandbox_id,
    is_uuid,
    parse_friendly_sandbox_id,
    resolve_sandbox_id,
    wait_for_clone,
    wait_for_clones,
    wait_for_sandbox,
)

TEST_HOST = "admin.test.dx.commercecloud.salesforce.com"
BASE_URL = f"https://{TEST_HOST}/api/v1"


class _FakeAuth:
    """Minimal auth strategy for the auth middleware (header injection + 401 retry)."""

    def __init__(self, header: str = "Bearer test-token") -> None:
        self._header = header

    async def get_authorization_header(self) -> str:
        return self._header

    def invalidate_token(self) -> None:
        pass


def _make_client() -> Any:
    return create_ods_client(OdsClientConfig(host=TEST_HOST), _FakeAuth())


class FakeClock:
    """A manually-advanced stand-in for ``time.monotonic`` used by the polling loops."""

    def __init__(self) -> None:
        self.value = 0.0

    def monotonic(self) -> float:
        return self.value

    def advance(self, seconds: float) -> None:
        self.value += seconds


@pytest.fixture
def fake_clock(monkeypatch: pytest.MonkeyPatch) -> FakeClock:
    """Patch the stdlib ``time.monotonic`` (shared by all wait-for-* modules)."""
    clock = FakeClock()
    monkeypatch.setattr(time, "monotonic", clock.monotonic)
    return clock


def make_recording_sleep(clock: FakeClock, step: float = 1.0) -> tuple[list[float], Callable[[float], Awaitable[None]]]:
    """Build a fake ``sleep`` that records call durations and advances the fake clock by ``step``."""
    calls: list[float] = []

    async def _sleep(seconds: float) -> None:
        calls.append(seconds)
        clock.advance(step)

    return calls, _sleep


# --- sandbox-lookup ----------------------------------------------------------


class TestIsUuid:
    def test_valid_uuids(self) -> None:
        assert is_uuid("abc12345-1234-1234-1234-abc123456789")
        assert is_uuid("00000000-0000-0000-0000-000000000000")
        assert is_uuid("AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE")
        assert is_uuid("a1b2c3d4-e5f6-7890-abcd-ef1234567890")

    def test_invalid_uuids(self) -> None:
        assert not is_uuid("not-a-uuid")
        assert not is_uuid("abc12345-1234-1234-1234")
        assert not is_uuid("abc12345-1234-1234-1234-abc12345678")
        assert not is_uuid("abc12345-1234-1234-1234-abc1234567890")
        assert not is_uuid("abcd-123")
        assert not is_uuid("zzzv_456")
        assert not is_uuid("")


class TestIsFriendlySandboxId:
    def test_dash_separator(self) -> None:
        assert is_friendly_sandbox_id("abcd-123")
        assert is_friendly_sandbox_id("zzzv-456")
        assert is_friendly_sandbox_id("ABCD-789")
        assert is_friendly_sandbox_id("a1b2-c3d")

    def test_underscore_separator(self) -> None:
        assert is_friendly_sandbox_id("abcd_123")
        assert is_friendly_sandbox_id("zzzv_456")
        assert is_friendly_sandbox_id("ABCD_789")
        assert is_friendly_sandbox_id("a1b2_c3d")

    def test_with_f_ecom_prefix(self) -> None:
        assert is_friendly_sandbox_id("f_ecom_zzpq_013")
        assert is_friendly_sandbox_id("f_ecom_abcd_123")
        assert is_friendly_sandbox_id("F_ECOM_ZZZV_456")

    def test_invalid_formats(self) -> None:
        assert not is_friendly_sandbox_id("abc-123")  # realm too short
        assert not is_friendly_sandbox_id("abcde-123")  # realm too long
        assert not is_friendly_sandbox_id("abcd123")  # no separator
        assert not is_friendly_sandbox_id("abcd-")  # no instance
        assert not is_friendly_sandbox_id("-123")  # no realm
        assert not is_friendly_sandbox_id("abc12345-1234-1234-1234-abc123456789")  # UUID
        assert not is_friendly_sandbox_id("")


class TestParseFriendlySandboxId:
    def test_dash_separator(self) -> None:
        result = parse_friendly_sandbox_id("abcd-123")
        assert result is not None
        assert (result.realm, result.instance) == ("abcd", "123")

    def test_underscore_separator(self) -> None:
        result = parse_friendly_sandbox_id("zzzv_456")
        assert result is not None
        assert (result.realm, result.instance) == ("zzzv", "456")

    def test_lowercases(self) -> None:
        result = parse_friendly_sandbox_id("ABCD-XYZ")
        assert result is not None
        assert (result.realm, result.instance) == ("abcd", "xyz")

    def test_strips_f_ecom_prefix(self) -> None:
        result = parse_friendly_sandbox_id("f_ecom_zzpq_013")
        assert result is not None
        assert (result.realm, result.instance) == ("zzpq", "013")

    def test_invalid_formats_return_none(self) -> None:
        assert parse_friendly_sandbox_id("abc-123") is None
        assert parse_friendly_sandbox_id("abcde-123") is None
        assert parse_friendly_sandbox_id("not-valid-format") is None
        assert parse_friendly_sandbox_id("abc12345-1234-1234-1234-abc123456789") is None


class TestResolveSandboxId:
    async def test_uuid_returned_directly_without_api_call(self) -> None:
        uuid = "abc12345-1234-1234-1234-abc123456789"
        client = _make_client()
        # No respx route registered - a request would raise, failing the test.
        result = await resolve_sandbox_id(client, uuid)
        assert result == uuid

    @respx.mock
    async def test_looks_up_by_friendly_id_dash(self) -> None:
        expected_uuid = "found-uuid-1234-1234-abc123456789"
        route = respx.get(f"{BASE_URL}/sandboxes").mock(
            return_value=httpx.Response(
                200,
                json={
                    "data": [
                        {"id": expected_uuid, "realm": "zzzv", "instance": "123", "state": "started"},
                        {"id": "other-uuid", "realm": "zzzv", "instance": "456", "state": "stopped"},
                    ]
                },
            )
        )
        client = _make_client()

        result = await resolve_sandbox_id(client, "zzzv-123")

        assert result == expected_uuid
        assert route.calls.last.request.url.params["filter_params"] == "realm=zzzv"

    @respx.mock
    async def test_looks_up_by_friendly_id_underscore(self) -> None:
        expected_uuid = "found-uuid-1234-1234-abc123456789"
        route = respx.get(f"{BASE_URL}/sandboxes").mock(
            return_value=httpx.Response(
                200, json={"data": [{"id": expected_uuid, "realm": "abcd", "instance": "789", "state": "started"}]}
            )
        )
        client = _make_client()

        result = await resolve_sandbox_id(client, "abcd_789")

        assert result == expected_uuid
        assert route.calls.last.request.url.params["filter_params"] == "realm=abcd"

    @respx.mock
    async def test_case_insensitive(self) -> None:
        expected_uuid = "found-uuid-1234-1234-abc123456789"
        respx.get(f"{BASE_URL}/sandboxes").mock(
            return_value=httpx.Response(
                200, json={"data": [{"id": expected_uuid, "realm": "ZZZV", "instance": "ABC", "state": "started"}]}
            )
        )
        client = _make_client()

        result = await resolve_sandbox_id(client, "ZZZV-ABC")

        assert result == expected_uuid

    @respx.mock
    async def test_looks_up_with_f_ecom_prefix(self) -> None:
        expected_uuid = "found-uuid-1234-1234-abc123456789"
        route = respx.get(f"{BASE_URL}/sandboxes").mock(
            return_value=httpx.Response(
                200, json={"data": [{"id": expected_uuid, "realm": "zzpq", "instance": "013", "state": "started"}]}
            )
        )
        client = _make_client()

        result = await resolve_sandbox_id(client, "f_ecom_zzpq_013")

        assert result == expected_uuid
        assert route.calls.last.request.url.params["filter_params"] == "realm=zzpq"

    @respx.mock
    async def test_raises_not_found_when_no_sandboxes(self) -> None:
        respx.get(f"{BASE_URL}/sandboxes").mock(return_value=httpx.Response(200, json={"data": []}))
        client = _make_client()

        with pytest.raises(SandboxNotFoundError) as exc_info:
            await resolve_sandbox_id(client, "zzzv-999")

        error = exc_info.value
        assert error.identifier == "zzzv-999"
        assert error.realm == "zzzv"
        assert error.instance == "999"
        assert "Sandbox not found" in str(error)
        assert "zzzv-999" in str(error)

    @respx.mock
    async def test_raises_not_found_when_instance_not_in_realm(self) -> None:
        respx.get(f"{BASE_URL}/sandboxes").mock(
            return_value=httpx.Response(
                200, json={"data": [{"id": "other-uuid", "realm": "zzzv", "instance": "456", "state": "started"}]}
            )
        )
        client = _make_client()

        with pytest.raises(SandboxNotFoundError):
            await resolve_sandbox_id(client, "zzzv-123")

    @respx.mock
    async def test_raises_not_found_on_api_error(self) -> None:
        respx.get(f"{BASE_URL}/sandboxes").mock(
            return_value=httpx.Response(401, json={"error": {"message": "Unauthorized"}})
        )
        client = _make_client()

        with pytest.raises(SandboxNotFoundError):
            await resolve_sandbox_id(client, "zzzv-123")

    async def test_passes_through_invalid_format_as_is(self) -> None:
        client = _make_client()
        result = await resolve_sandbox_id(client, "invalid")
        assert result == "invalid"


class TestSandboxNotFoundError:
    def test_message_with_identifier_only(self) -> None:
        error = SandboxNotFoundError("test-id")
        assert str(error) == "Sandbox not found: test-id"
        assert error.identifier == "test-id"
        assert error.realm is None
        assert error.instance is None

    def test_message_with_realm_and_instance(self) -> None:
        error = SandboxNotFoundError("zzzv-123", "zzzv", "123")
        assert str(error) == "Sandbox not found: zzzv-123 (realm=zzzv, instance=123)"
        assert error.realm == "zzzv"
        assert error.instance == "123"

    def test_name(self) -> None:
        assert SandboxNotFoundError("test-id").name == "SandboxNotFoundError"


# --- sandbox-settings ---------------------------------------------------------


class TestBuildSandboxSettings:
    def test_grants_default_permissions_to_client_id(self) -> None:
        settings = build_sandbox_settings(BuildSandboxSettingsOptions(client_id="client-123"))

        assert settings is not None
        assert settings["ocapi"] == [{"client_id": "client-123", "resources": DEFAULT_OCAPI_RESOURCES}]
        assert settings["webdav"] == [{"client_id": "client-123", "permissions": DEFAULT_WEBDAV_PERMISSIONS}]

    def test_returns_none_without_client_id_or_custom_settings(self) -> None:
        assert build_sandbox_settings(BuildSandboxSettingsOptions()) is None
        assert build_sandbox_settings(BuildSandboxSettingsOptions(client_id=None)) is None

    def test_custom_ocapi_settings_replace_defaults(self) -> None:
        custom = [{"client_id": "other", "resources": [{"resource_id": "/foo", "methods": ["get"]}]}]
        settings = build_sandbox_settings(BuildSandboxSettingsOptions(client_id="client-123", ocapi_settings=custom))

        assert settings is not None
        assert settings["ocapi"] == custom
        # WebDAV still falls back to defaults for the client ID.
        assert settings["webdav"] == [{"client_id": "client-123", "permissions": DEFAULT_WEBDAV_PERMISSIONS}]

    def test_custom_webdav_settings_replace_defaults(self) -> None:
        custom = [{"client_id": "other", "permissions": [{"path": "/impex", "operations": ["read"]}]}]
        settings = build_sandbox_settings(BuildSandboxSettingsOptions(client_id="client-123", webdav_settings=custom))

        assert settings is not None
        assert settings["webdav"] == custom
        assert settings["ocapi"] == [{"client_id": "client-123", "resources": DEFAULT_OCAPI_RESOURCES}]

    def test_builds_from_custom_values_without_client_id(self) -> None:
        ocapi = [{"client_id": "a", "resources": []}]
        webdav = [{"client_id": "a", "permissions": []}]
        settings = build_sandbox_settings(BuildSandboxSettingsOptions(ocapi_settings=ocapi, webdav_settings=webdav))

        assert settings == {"ocapi": ocapi, "webdav": webdav}


# --- wait-for-sandbox ----------------------------------------------------------


class TestWaitForSandbox:
    @respx.mock
    async def test_resolves_when_target_state_reached(self, fake_clock: FakeClock) -> None:
        responses = [
            httpx.Response(200, json={"data": {"state": "creating"}}),
            httpx.Response(200, json={"data": {"state": "started"}}),
        ]
        call_count = {"n": 0}

        def _responder(_request: httpx.Request) -> httpx.Response:
            idx = min(call_count["n"], len(responses) - 1)
            call_count["n"] += 1
            return responses[idx]

        respx.get(f"{BASE_URL}/sandboxes/test-sandbox").mock(side_effect=_responder)
        _, sleep = make_recording_sleep(fake_clock)
        poll_infos: list[WaitForSandboxPollInfo] = []

        await wait_for_sandbox(
            _make_client(),
            WaitForSandboxOptions(
                sandbox_id="test-sandbox",
                target_state="started",
                poll_interval_seconds=5,
                timeout_seconds=60,
                on_poll=poll_infos.append,
                sleep=sleep,
            ),
        )

        assert [info.state for info in poll_infos] == ["creating", "started"]

    @respx.mock
    async def test_raises_terminal_state_error(self, fake_clock: FakeClock) -> None:
        respx.get(f"{BASE_URL}/sandboxes/test-sandbox").mock(
            return_value=httpx.Response(200, json={"data": {"state": "failed"}})
        )
        _, sleep = make_recording_sleep(fake_clock)

        with pytest.raises(SandboxTerminalStateError) as exc_info:
            await wait_for_sandbox(
                _make_client(),
                WaitForSandboxOptions(
                    sandbox_id="test-sandbox",
                    target_state="started",
                    poll_interval_seconds=5,
                    timeout_seconds=60,
                    sleep=sleep,
                ),
            )

        assert exc_info.value.sandbox_id == "test-sandbox"
        assert exc_info.value.state == "failed"

    @respx.mock
    async def test_raises_timeout_error(self, fake_clock: FakeClock) -> None:
        respx.get(f"{BASE_URL}/sandboxes/test-sandbox").mock(
            return_value=httpx.Response(200, json={"data": {"state": "creating"}})
        )
        _, sleep = make_recording_sleep(fake_clock, step=1.0)

        with pytest.raises(SandboxPollingTimeoutError) as exc_info:
            await wait_for_sandbox(
                _make_client(),
                WaitForSandboxOptions(
                    sandbox_id="test-sandbox",
                    target_state="started",
                    poll_interval_seconds=0,
                    timeout_seconds=1,
                    sleep=sleep,
                ),
            )

        assert exc_info.value.sandbox_id == "test-sandbox"
        assert exc_info.value.last_state == "creating"

    @respx.mock
    async def test_raises_polling_error_when_no_data(self, fake_clock: FakeClock) -> None:
        respx.get(f"{BASE_URL}/sandboxes/test-sandbox").mock(return_value=httpx.Response(200, json={}))
        _, sleep = make_recording_sleep(fake_clock)

        with pytest.raises(SandboxPollingError):
            await wait_for_sandbox(
                _make_client(),
                WaitForSandboxOptions(
                    sandbox_id="test-sandbox",
                    target_state="started",
                    poll_interval_seconds=5,
                    timeout_seconds=60,
                    sleep=sleep,
                ),
            )


# --- wait-for-clone ------------------------------------------------------------


class TestWaitForClone:
    @respx.mock
    async def test_resolves_when_clone_completes(self, fake_clock: FakeClock) -> None:
        responses = [
            httpx.Response(200, json={"data": {"status": "IN_PROGRESS", "progressPercentage": 50}}),
            httpx.Response(200, json={"data": {"status": "COMPLETED", "progressPercentage": 100}}),
        ]
        call_count = {"n": 0}

        def _responder(_request: httpx.Request) -> httpx.Response:
            idx = min(call_count["n"], len(responses) - 1)
            call_count["n"] += 1
            return responses[idx]

        respx.get(f"{BASE_URL}/sandboxes/test-sandbox/clones/test-clone").mock(side_effect=_responder)
        _, sleep = make_recording_sleep(fake_clock)

        await wait_for_clone(
            _make_client(),
            WaitForCloneOptions(
                sandbox_id="test-sandbox",
                clone_id="test-clone",
                poll_interval_seconds=5,
                timeout_seconds=60,
                sleep=sleep,
            ),
        )

    @respx.mock
    async def test_raises_clone_failed_error(self, fake_clock: FakeClock) -> None:
        respx.get(f"{BASE_URL}/sandboxes/test-sandbox/clones/test-clone").mock(
            return_value=httpx.Response(200, json={"data": {"status": "FAILED"}})
        )
        _, sleep = make_recording_sleep(fake_clock)

        with pytest.raises(CloneFailedError) as exc_info:
            await wait_for_clone(
                _make_client(),
                WaitForCloneOptions(
                    sandbox_id="test-sandbox",
                    clone_id="test-clone",
                    poll_interval_seconds=5,
                    timeout_seconds=60,
                    sleep=sleep,
                ),
            )

        assert exc_info.value.clone_id == "test-clone"

    @respx.mock
    async def test_raises_timeout_error(self, fake_clock: FakeClock) -> None:
        respx.get(f"{BASE_URL}/sandboxes/test-sandbox/clones/test-clone").mock(
            return_value=httpx.Response(200, json={"data": {"status": "IN_PROGRESS"}})
        )
        _, sleep = make_recording_sleep(fake_clock, step=1.0)

        with pytest.raises(ClonePollingTimeoutError) as exc_info:
            await wait_for_clone(
                _make_client(),
                WaitForCloneOptions(
                    sandbox_id="test-sandbox",
                    clone_id="test-clone",
                    poll_interval_seconds=0,
                    timeout_seconds=1,
                    sleep=sleep,
                ),
            )

        assert exc_info.value.clone_id == "test-clone"

    @respx.mock
    async def test_raises_polling_error_when_no_data(self, fake_clock: FakeClock) -> None:
        respx.get(f"{BASE_URL}/sandboxes/test-sandbox/clones/test-clone").mock(
            return_value=httpx.Response(200, json={})
        )
        _, sleep = make_recording_sleep(fake_clock)

        with pytest.raises(ClonePollingError):
            await wait_for_clone(
                _make_client(),
                WaitForCloneOptions(
                    sandbox_id="test-sandbox",
                    clone_id="test-clone",
                    poll_interval_seconds=5,
                    timeout_seconds=60,
                    sleep=sleep,
                ),
            )

    @respx.mock
    async def test_on_poll_callback_receives_status_info(self, fake_clock: FakeClock) -> None:
        responses = [
            httpx.Response(200, json={"data": {"status": "PENDING", "progressPercentage": 0}}),
            httpx.Response(200, json={"data": {"status": "IN_PROGRESS", "progressPercentage": 50}}),
            httpx.Response(200, json={"data": {"status": "COMPLETED", "progressPercentage": 100}}),
        ]
        call_count = {"n": 0}

        def _responder(_request: httpx.Request) -> httpx.Response:
            idx = min(call_count["n"], len(responses) - 1)
            call_count["n"] += 1
            return responses[idx]

        respx.get(f"{BASE_URL}/sandboxes/test-sandbox/clones/test-clone").mock(side_effect=_responder)
        _, sleep = make_recording_sleep(fake_clock)
        poll_infos: list[WaitForClonePollInfo] = []

        await wait_for_clone(
            _make_client(),
            WaitForCloneOptions(
                sandbox_id="test-sandbox",
                clone_id="test-clone",
                poll_interval_seconds=5,
                timeout_seconds=60,
                on_poll=poll_infos.append,
                sleep=sleep,
            ),
        )

        assert [info.status for info in poll_infos] == ["PENDING", "IN_PROGRESS", "COMPLETED"]


# --- wait-for-clones -----------------------------------------------------------


def _clone_responder(
    responses: list[httpx.Response], counter: dict[str, int], key: str
) -> Callable[[httpx.Request], httpx.Response]:
    def _respond(_request: httpx.Request) -> httpx.Response:
        idx = min(counter.get(key, 0), len(responses) - 1)
        counter[key] = counter.get(key, 0) + 1
        return responses[idx]

    return _respond


class TestWaitForClones:
    @respx.mock
    async def test_resolves_when_all_clones_complete(self, fake_clock: FakeClock) -> None:
        counter: dict[str, int] = {}
        respx.get(f"{BASE_URL}/sandboxes/test-sandbox/clones/clone-1").mock(
            side_effect=_clone_responder(
                [
                    httpx.Response(200, json={"data": {"status": "IN_PROGRESS", "progressPercentage": 50}}),
                    httpx.Response(200, json={"data": {"status": "COMPLETED", "progressPercentage": 100}}),
                ],
                counter,
                "clone-1",
            )
        )
        respx.get(f"{BASE_URL}/sandboxes/test-sandbox/clones/clone-2").mock(
            side_effect=_clone_responder(
                [
                    httpx.Response(200, json={"data": {"status": "IN_PROGRESS", "progressPercentage": 30}}),
                    httpx.Response(200, json={"data": {"status": "COMPLETED", "progressPercentage": 100}}),
                ],
                counter,
                "clone-2",
            )
        )
        _, sleep = make_recording_sleep(fake_clock)

        statuses = await wait_for_clones(
            _make_client(),
            WaitForClonesOptions(
                sandbox_id="test-sandbox",
                clone_ids=["clone-1", "clone-2"],
                poll_interval_seconds=5,
                timeout_seconds=60,
                sleep=sleep,
            ),
        )

        assert len(statuses) == 2
        assert all(s.status == "COMPLETED" for s in statuses)

    @respx.mock
    async def test_raises_batch_failed_error(self, fake_clock: FakeClock) -> None:
        respx.get(f"{BASE_URL}/sandboxes/test-sandbox/clones/clone-1").mock(
            return_value=httpx.Response(200, json={"data": {"status": "COMPLETED"}})
        )
        respx.get(f"{BASE_URL}/sandboxes/test-sandbox/clones/clone-2").mock(
            return_value=httpx.Response(200, json={"data": {"status": "FAILED"}})
        )
        _, sleep = make_recording_sleep(fake_clock)

        with pytest.raises(CloneBatchFailedError) as exc_info:
            await wait_for_clones(
                _make_client(),
                WaitForClonesOptions(
                    sandbox_id="test-sandbox",
                    clone_ids=["clone-1", "clone-2"],
                    poll_interval_seconds=5,
                    timeout_seconds=60,
                    sleep=sleep,
                ),
            )

        assert exc_info.value.failed_clone_ids == ["clone-2"]

    @respx.mock
    async def test_raises_batch_timeout_error(self, fake_clock: FakeClock) -> None:
        respx.get(f"{BASE_URL}/sandboxes/test-sandbox/clones/clone-1").mock(
            return_value=httpx.Response(200, json={"data": {"status": "IN_PROGRESS"}})
        )
        respx.get(f"{BASE_URL}/sandboxes/test-sandbox/clones/clone-2").mock(
            return_value=httpx.Response(200, json={"data": {"status": "IN_PROGRESS"}})
        )
        _, sleep = make_recording_sleep(fake_clock, step=1.0)

        with pytest.raises(CloneBatchPollingTimeoutError) as exc_info:
            await wait_for_clones(
                _make_client(),
                WaitForClonesOptions(
                    sandbox_id="test-sandbox",
                    clone_ids=["clone-1", "clone-2"],
                    poll_interval_seconds=0,
                    timeout_seconds=1,
                    sleep=sleep,
                ),
            )

        assert exc_info.value.clone_ids == ["clone-1", "clone-2"]

    @respx.mock
    async def test_raises_batch_polling_error_when_no_data(self, fake_clock: FakeClock) -> None:
        respx.get(f"{BASE_URL}/sandboxes/test-sandbox/clones/clone-1").mock(
            return_value=httpx.Response(200, json={"data": {"status": "COMPLETED"}})
        )
        respx.get(f"{BASE_URL}/sandboxes/test-sandbox/clones/clone-2").mock(return_value=httpx.Response(200, json={}))
        _, sleep = make_recording_sleep(fake_clock)

        with pytest.raises(CloneBatchPollingError) as exc_info:
            await wait_for_clones(
                _make_client(),
                WaitForClonesOptions(
                    sandbox_id="test-sandbox",
                    clone_ids=["clone-1", "clone-2"],
                    poll_interval_seconds=5,
                    timeout_seconds=60,
                    sleep=sleep,
                ),
            )

        assert exc_info.value.clone_id == "clone-2"

    @respx.mock
    async def test_on_poll_callback_receives_aggregate_progress(self, fake_clock: FakeClock) -> None:
        counter: dict[str, int] = {}
        respx.get(f"{BASE_URL}/sandboxes/test-sandbox/clones/clone-1").mock(
            side_effect=_clone_responder(
                [
                    httpx.Response(200, json={"data": {"status": "IN_PROGRESS", "progressPercentage": 50}}),
                    httpx.Response(200, json={"data": {"status": "COMPLETED", "progressPercentage": 100}}),
                ],
                counter,
                "clone-1",
            )
        )
        respx.get(f"{BASE_URL}/sandboxes/test-sandbox/clones/clone-2").mock(
            side_effect=_clone_responder(
                [
                    httpx.Response(200, json={"data": {"status": "PENDING", "progressPercentage": 0}}),
                    httpx.Response(200, json={"data": {"status": "COMPLETED", "progressPercentage": 100}}),
                ],
                counter,
                "clone-2",
            )
        )
        _, sleep = make_recording_sleep(fake_clock)
        poll_infos: list[WaitForClonesPollInfo] = []

        await wait_for_clones(
            _make_client(),
            WaitForClonesOptions(
                sandbox_id="test-sandbox",
                clone_ids=["clone-1", "clone-2"],
                poll_interval_seconds=5,
                timeout_seconds=60,
                on_poll=poll_infos.append,
                sleep=sleep,
            ),
        )

        assert [(info.completed, info.total) for info in poll_infos] == [(0, 2), (2, 2)]

    @respx.mock
    async def test_stops_polling_a_clone_once_terminal(self, fake_clock: FakeClock) -> None:
        counter: dict[str, int] = {}
        respx.get(f"{BASE_URL}/sandboxes/test-sandbox/clones/clone-1").mock(
            side_effect=_clone_responder(
                [httpx.Response(200, json={"data": {"status": "COMPLETED", "progressPercentage": 100}})],
                counter,
                "clone-1",
            )
        )
        respx.get(f"{BASE_URL}/sandboxes/test-sandbox/clones/clone-2").mock(
            side_effect=_clone_responder(
                [
                    httpx.Response(200, json={"data": {"status": "IN_PROGRESS", "progressPercentage": 30}}),
                    httpx.Response(200, json={"data": {"status": "IN_PROGRESS", "progressPercentage": 60}}),
                    httpx.Response(200, json={"data": {"status": "COMPLETED", "progressPercentage": 100}}),
                ],
                counter,
                "clone-2",
            )
        )
        _, sleep = make_recording_sleep(fake_clock)

        statuses = await wait_for_clones(
            _make_client(),
            WaitForClonesOptions(
                sandbox_id="test-sandbox",
                clone_ids=["clone-1", "clone-2"],
                poll_interval_seconds=5,
                timeout_seconds=60,
                sleep=sleep,
            ),
        )

        assert all(s.status == "COMPLETED" for s in statuses)
        # clone-1 completes on the first poll; it should not be polled again on
        # the subsequent two ticks needed for clone-2 to complete.
        assert counter["clone-1"] == 1
        assert counter["clone-2"] == 3
