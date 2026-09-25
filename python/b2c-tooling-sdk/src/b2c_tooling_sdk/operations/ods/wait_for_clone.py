# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Polls a single sandbox clone operation until it completes or fails.

Mirrors ``src/operations/ods/wait-for-clone.ts``.
"""

from __future__ import annotations

import asyncio
import time
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import Any

from b2c_tooling_sdk.clients import OdsClient
from b2c_tooling_sdk.logging import get_logger

#: Status of a sandbox clone operation in the ODS system.
#:
#: Standard values are ``COMPLETED``, ``FAILED``, ``IN_PROGRESS``, and
#: ``PENDING``. Any other string value is also accepted for forward
#: compatibility with future statuses returned by the API.
CloneState = str


class ClonePollingTimeoutError(Exception):
    """Raised when a sandbox clone operation does not complete within the configured timeout while polling."""

    def __init__(
        self,
        sandbox_id: str,
        clone_id: str,
        timeout_seconds: float,
        last_status: CloneState | None = None,
    ) -> None:
        suffix = f" (lastStatus={last_status})" if last_status else ""
        super().__init__(
            f"Timeout waiting for clone {clone_id} of sandbox {sandbox_id} after {timeout_seconds} seconds{suffix}"
        )
        self.name = "ClonePollingTimeoutError"
        self.sandbox_id = sandbox_id
        self.clone_id = clone_id
        self.timeout_seconds = timeout_seconds
        self.last_status = last_status


class ClonePollingError(Exception):
    """Raised when an API request to fetch clone status fails."""

    def __init__(self, sandbox_id: str, clone_id: str, message: str) -> None:
        super().__init__(f"Failed to fetch clone status for {clone_id} of sandbox {sandbox_id}: {message}")
        self.name = "ClonePollingError"
        self.sandbox_id = sandbox_id
        self.clone_id = clone_id
        self.message = message


class CloneFailedError(Exception):
    """Raised when a sandbox clone operation enters the ``FAILED`` state."""

    def __init__(self, sandbox_id: str, clone_id: str, status: CloneState) -> None:
        super().__init__(f"Clone {clone_id} of sandbox {sandbox_id} failed")
        self.name = "CloneFailedError"
        self.sandbox_id = sandbox_id
        self.clone_id = clone_id
        self.status = status


@dataclass
class WaitForClonePollInfo:
    """Information passed to the ``on_poll`` callback on each clone status poll."""

    sandbox_id: str
    clone_id: str
    elapsed_seconds: float
    status: CloneState
    progress_percentage: int | None = None


async def _default_sleep(seconds: float) -> None:
    await asyncio.sleep(seconds)


@dataclass
class WaitForCloneOptions:
    """Configuration options for :func:`wait_for_clone` polling behavior."""

    sandbox_id: str
    clone_id: str
    poll_interval_seconds: float
    timeout_seconds: float
    on_poll: Callable[[WaitForClonePollInfo], None] | None = None
    #: Optional custom sleep function (primarily for testing). Receives the sleep
    #: duration in seconds.
    sleep: Callable[[float], Awaitable[None]] = _default_sleep


async def wait_for_clone(client: OdsClient, options: WaitForCloneOptions) -> None:
    """Wait for a sandbox clone to reach ``COMPLETED`` or ``FAILED`` state by polling its status.

    Polls at ``poll_interval_seconds`` until the clone completes, the configured
    timeout is exceeded, or the clone enters a failed state. An initial poll
    delay equal to ``poll_interval_seconds`` is applied before the first status
    check.

    :param client: ODS client for API calls.
    :param options: Polling configuration options.
    :raises ClonePollingTimeoutError: If the timeout is exceeded before completion.
    :raises ClonePollingError: If the API request fails.
    :raises CloneFailedError: If the clone enters the ``FAILED`` state.
    """
    logger = get_logger("operations.ods")
    sandbox_id = options.sandbox_id
    clone_id = options.clone_id
    poll_interval_seconds = options.poll_interval_seconds
    timeout_seconds = options.timeout_seconds

    sleep_fn = options.sleep
    start_time = time.monotonic()

    await sleep_fn(poll_interval_seconds)

    last_status: CloneState | None = None

    while True:
        elapsed_seconds = round(time.monotonic() - start_time)

        if timeout_seconds > 0 and time.monotonic() - start_time > timeout_seconds:
            raise ClonePollingTimeoutError(sandbox_id, clone_id, timeout_seconds, last_status)

        result = await client.get(
            "/sandboxes/{sandboxId}/clones/{cloneId}",
            {"params": {"path": {"sandboxId": sandbox_id, "cloneId": clone_id}}},
        )

        clone: dict[str, Any] | None = result.data.get("data") if isinstance(result.data, dict) else None
        if not clone:
            reason = result.response.reason_phrase if result.response is not None else ""
            raise ClonePollingError(sandbox_id, clone_id, reason or "Unknown error")

        current_status: CloneState = clone.get("status") or "unknown"
        last_status = current_status

        logger.debug(
            "[ODS] Clone poll: sandbox_id=%s clone_id=%s elapsed_seconds=%s status=%s",
            sandbox_id,
            clone_id,
            elapsed_seconds,
            current_status,
        )
        if options.on_poll is not None:
            options.on_poll(
                WaitForClonePollInfo(
                    sandbox_id=sandbox_id,
                    clone_id=clone_id,
                    elapsed_seconds=elapsed_seconds,
                    status=current_status,
                    progress_percentage=clone.get("progressPercentage"),
                )
            )

        if current_status == "COMPLETED":
            return

        if current_status == "FAILED":
            raise CloneFailedError(sandbox_id, clone_id, current_status)

        await sleep_fn(poll_interval_seconds)


__all__ = [
    "CloneFailedError",
    "ClonePollingError",
    "ClonePollingTimeoutError",
    "CloneState",
    "WaitForCloneOptions",
    "WaitForClonePollInfo",
    "wait_for_clone",
]
