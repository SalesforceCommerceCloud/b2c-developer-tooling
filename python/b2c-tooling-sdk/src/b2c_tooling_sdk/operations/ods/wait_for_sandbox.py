# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Polls a sandbox's status until it reaches a target state.

Mirrors ``src/operations/ods/wait-for-sandbox.ts``.
"""

from __future__ import annotations

import asyncio
import time
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import Any

from b2c_tooling_sdk.clients import OdsClient
from b2c_tooling_sdk.logging import get_logger

#: State of a sandbox in the ODS system.
#:
#: Standard states:
#:
#: - ``deleted`` - Sandbox has been deleted
#: - ``failed`` - Sandbox creation or operation failed
#: - ``started`` - Sandbox is running
#: - ``stopped`` - Sandbox is stopped
#:
#: Also accepts any other string value for forward compatibility with future
#: ODS API states (mirrors the TS ``'deleted' | 'failed' | 'started' | 'stopped'
#: | (string & {})``).
SandboxState = str

#: Sandbox states that terminate polling with an error.
_TERMINAL_STATES = ("failed", "deleted")


class SandboxPollingTimeoutError(Exception):
    """Raised when a sandbox does not reach its target state within the specified timeout period."""

    def __init__(
        self,
        sandbox_id: str,
        target_state: SandboxState,
        timeout_seconds: float,
        last_state: SandboxState | None = None,
    ) -> None:
        suffix = f" (lastState={last_state})" if last_state else ""
        super().__init__(
            f"Timeout waiting for sandbox {sandbox_id} to reach state {target_state} "
            f"after {timeout_seconds} seconds{suffix}"
        )
        self.name = "SandboxPollingTimeoutError"
        self.sandbox_id = sandbox_id
        self.target_state = target_state
        self.timeout_seconds = timeout_seconds
        self.last_state = last_state


class SandboxPollingError(Exception):
    """Raised when fetching sandbox status fails during polling."""

    def __init__(self, sandbox_id: str, message: str) -> None:
        super().__init__(f"Failed to fetch sandbox status for {sandbox_id}: {message}")
        self.name = "SandboxPollingError"
        self.sandbox_id = sandbox_id
        self.message = message


class SandboxTerminalStateError(Exception):
    """Raised when a sandbox reaches a terminal error state (failed or deleted) during polling."""

    def __init__(self, sandbox_id: str, target_state: SandboxState, state: SandboxState) -> None:
        super().__init__(f"Sandbox {sandbox_id} reached terminal state {state} while waiting for {target_state}")
        self.name = "SandboxTerminalStateError"
        self.sandbox_id = sandbox_id
        self.target_state = target_state
        self.state = state


@dataclass
class WaitForSandboxPollInfo:
    """Information provided to the ``on_poll`` callback on each poll during sandbox state monitoring."""

    sandbox_id: str
    elapsed_seconds: float
    state: SandboxState


async def _default_sleep(seconds: float) -> None:
    await asyncio.sleep(seconds)


@dataclass
class WaitForSandboxOptions:
    """Configuration options for :func:`wait_for_sandbox` sandbox state polling."""

    sandbox_id: str
    target_state: SandboxState
    poll_interval_seconds: float
    timeout_seconds: float
    #: Optional callback invoked on each poll with current state.
    on_poll: Callable[[WaitForSandboxPollInfo], None] | None = None
    #: Optional custom sleep function (primarily for testing). Receives the sleep
    #: duration in seconds.
    sleep: Callable[[float], Awaitable[None]] = _default_sleep


async def wait_for_sandbox(client: OdsClient, options: WaitForSandboxOptions) -> None:
    """Wait for a sandbox to reach a target state by polling its status.

    Polls the ODS API at regular intervals until the sandbox reaches the desired
    state, times out, or enters a terminal error state (failed/deleted).

    :param client: ODS client for API calls.
    :param options: Polling configuration options.
    :raises SandboxPollingTimeoutError: If the timeout is exceeded before reaching target state.
    :raises SandboxPollingError: If the API request fails.
    :raises SandboxTerminalStateError: If the sandbox enters a terminal error state.

    :example:
        >>> await wait_for_sandbox(
        ...     ods_client,
        ...     WaitForSandboxOptions(
        ...         sandbox_id="abc-123",
        ...         target_state="started",
        ...         poll_interval_seconds=5,
        ...         timeout_seconds=300,
        ...         on_poll=lambda info: print(f"State: {info.state} ({info.elapsed_seconds}s)"),
        ...     ),
        ... )
    """
    logger = get_logger("operations.ods")
    sandbox_id = options.sandbox_id
    target_state = options.target_state
    poll_interval_seconds = options.poll_interval_seconds
    timeout_seconds = options.timeout_seconds

    sleep_fn = options.sleep
    start_time = time.monotonic()

    await sleep_fn(poll_interval_seconds)

    last_state: SandboxState | None = None

    while True:
        elapsed_seconds = round(time.monotonic() - start_time)

        if timeout_seconds > 0 and time.monotonic() - start_time > timeout_seconds:
            raise SandboxPollingTimeoutError(sandbox_id, target_state, timeout_seconds, last_state)

        result = await client.get("/sandboxes/{sandboxId}", {"params": {"path": {"sandboxId": sandbox_id}}})

        sandbox: dict[str, Any] | None = result.data.get("data") if isinstance(result.data, dict) else None
        if not sandbox:
            reason = result.response.reason_phrase if result.response is not None else ""
            raise SandboxPollingError(sandbox_id, reason or "Unknown error")

        current_state: SandboxState = sandbox.get("state") or "unknown"
        last_state = current_state

        logger.debug(
            "[ODS] Sandbox poll: sandbox_id=%s elapsed_seconds=%s state=%s",
            sandbox_id,
            elapsed_seconds,
            current_state,
        )
        if options.on_poll is not None:
            options.on_poll(
                WaitForSandboxPollInfo(sandbox_id=sandbox_id, elapsed_seconds=elapsed_seconds, state=current_state)
            )

        if current_state == target_state:
            return

        if current_state in _TERMINAL_STATES:
            raise SandboxTerminalStateError(sandbox_id, target_state, current_state)

        await sleep_fn(poll_interval_seconds)


__all__ = [
    "SandboxPollingError",
    "SandboxPollingTimeoutError",
    "SandboxState",
    "SandboxTerminalStateError",
    "WaitForSandboxOptions",
    "WaitForSandboxPollInfo",
    "wait_for_sandbox",
]
