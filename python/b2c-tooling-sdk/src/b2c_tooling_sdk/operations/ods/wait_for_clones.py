# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Polls a batch of sandbox clones (1 to many cloning) until they all reach a terminal state.

Mirrors ``src/operations/ods/wait-for-clones.ts``.
"""

from __future__ import annotations

import asyncio
import time
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import Any

from b2c_tooling_sdk.clients import OdsClient
from b2c_tooling_sdk.logging import get_logger
from b2c_tooling_sdk.operations.ods.wait_for_clone import CloneState


@dataclass
class CloneBatchMemberStatus:
    """Status of a single clone within a batch, as observed on one poll tick."""

    clone_id: str
    status: CloneState
    progress_percentage: int | None = None


class CloneBatchPollingTimeoutError(Exception):
    """Raised when a batch of sandbox clones does not all reach a terminal state within the timeout."""

    def __init__(
        self,
        sandbox_id: str,
        clone_ids: list[str],
        timeout_seconds: float,
        last_statuses: list[CloneBatchMemberStatus],
    ) -> None:
        pending = [s for s in last_statuses if s.status not in ("COMPLETED", "FAILED")]
        super().__init__(
            f"Timeout waiting for {len(clone_ids)} clone(s) of sandbox {sandbox_id} after {timeout_seconds} "
            f"seconds ({len(pending)} of {len(clone_ids)} still pending)"
        )
        self.name = "CloneBatchPollingTimeoutError"
        self.sandbox_id = sandbox_id
        self.clone_ids = clone_ids
        self.timeout_seconds = timeout_seconds
        self.last_statuses = last_statuses


class CloneBatchPollingError(Exception):
    """Raised when an API request to fetch the status of a clone in a batch fails."""

    def __init__(self, sandbox_id: str, clone_id: str, message: str) -> None:
        super().__init__(f"Failed to fetch clone status for {clone_id} of sandbox {sandbox_id}: {message}")
        self.name = "CloneBatchPollingError"
        self.sandbox_id = sandbox_id
        self.clone_id = clone_id
        self.message = message


class CloneBatchFailedError(Exception):
    """Raised when one or more clones in a batch enter the ``FAILED`` state.

    All clones in the batch reached a terminal state, but at least one of them failed.
    """

    def __init__(
        self,
        sandbox_id: str,
        failed_clone_ids: list[str],
        statuses: list[CloneBatchMemberStatus],
    ) -> None:
        super().__init__(f"{len(failed_clone_ids)} of {len(statuses)} clone(s) failed for sandbox {sandbox_id}")
        self.name = "CloneBatchFailedError"
        self.sandbox_id = sandbox_id
        self.failed_clone_ids = failed_clone_ids
        self.statuses = statuses


@dataclass
class WaitForClonesPollInfo:
    """Information passed to the ``on_poll`` callback on each poll tick while waiting for a batch of clones."""

    sandbox_id: str
    elapsed_seconds: float
    completed: int
    total: int
    clones: list[CloneBatchMemberStatus]


async def _default_sleep(seconds: float) -> None:
    await asyncio.sleep(seconds)


@dataclass
class WaitForClonesOptions:
    """Configuration options for :func:`wait_for_clones` batch polling behavior."""

    sandbox_id: str
    clone_ids: list[str]
    poll_interval_seconds: float
    timeout_seconds: float
    on_poll: Callable[[WaitForClonesPollInfo], None] | None = None
    #: Optional custom sleep function (primarily for testing). Receives the sleep
    #: duration in seconds.
    sleep: Callable[[float], Awaitable[None]] = _default_sleep


def _is_terminal(status: CloneState) -> bool:
    return status in ("COMPLETED", "FAILED")


async def wait_for_clones(client: OdsClient, options: WaitForClonesOptions) -> list[CloneBatchMemberStatus]:
    """Wait for a batch of sandbox clones (created via 1 to many cloning) to all reach a terminal state.

    Polls at ``poll_interval_seconds`` until every clone in ``clone_ids`` reaches
    ``COMPLETED`` or ``FAILED``, or the configured timeout is exceeded. An
    initial poll delay equal to ``poll_interval_seconds`` is applied before the
    first status check.

    :param client: ODS client for API calls.
    :param options: Polling configuration options.
    :returns: The final status of every clone once all reach a terminal state.
    :raises CloneBatchPollingTimeoutError: If the timeout is exceeded before all clones complete.
    :raises CloneBatchPollingError: If an API request fails.
    :raises CloneBatchFailedError: If one or more clones enter the ``FAILED`` state.
    """
    logger = get_logger("operations.ods")
    sandbox_id = options.sandbox_id
    clone_ids = options.clone_ids
    poll_interval_seconds = options.poll_interval_seconds
    timeout_seconds = options.timeout_seconds

    sleep_fn = options.sleep
    start_time = time.monotonic()

    await sleep_fn(poll_interval_seconds)

    status_by_clone_id: dict[str, CloneBatchMemberStatus] = {
        clone_id: CloneBatchMemberStatus(clone_id=clone_id, status="PENDING") for clone_id in clone_ids
    }

    async def _poll_one(clone_id: str) -> None:
        result = await client.get(
            "/sandboxes/{sandboxId}/clones/{cloneId}",
            {"params": {"path": {"sandboxId": sandbox_id, "cloneId": clone_id}}},
        )

        clone: dict[str, Any] | None = result.data.get("data") if isinstance(result.data, dict) else None
        if not clone:
            reason = result.response.reason_phrase if result.response is not None else ""
            raise CloneBatchPollingError(sandbox_id, clone_id, reason or "Unknown error")

        status_by_clone_id[clone_id] = CloneBatchMemberStatus(
            clone_id=clone_id,
            status=clone.get("status") or "PENDING",
            progress_percentage=clone.get("progressPercentage"),
        )

    while True:
        elapsed_seconds = round(time.monotonic() - start_time)

        if timeout_seconds > 0 and time.monotonic() - start_time > timeout_seconds:
            raise CloneBatchPollingTimeoutError(
                sandbox_id, clone_ids, timeout_seconds, list(status_by_clone_id.values())
            )

        pending_clone_ids = [
            clone_id for clone_id in clone_ids if not _is_terminal(status_by_clone_id[clone_id].status)
        ]

        await asyncio.gather(*(_poll_one(clone_id) for clone_id in pending_clone_ids))

        last_statuses = [status_by_clone_id[clone_id] for clone_id in clone_ids]
        completed = sum(1 for s in last_statuses if _is_terminal(s.status))

        logger.debug(
            "[ODS] Clone batch poll: sandbox_id=%s clone_ids=%s elapsed_seconds=%s statuses=%s",
            sandbox_id,
            clone_ids,
            elapsed_seconds,
            last_statuses,
        )
        if options.on_poll is not None:
            options.on_poll(
                WaitForClonesPollInfo(
                    sandbox_id=sandbox_id,
                    elapsed_seconds=elapsed_seconds,
                    completed=completed,
                    total=len(clone_ids),
                    clones=last_statuses,
                )
            )

        if completed == len(clone_ids):
            failed_clone_ids = [s.clone_id for s in last_statuses if s.status == "FAILED"]
            if failed_clone_ids:
                raise CloneBatchFailedError(sandbox_id, failed_clone_ids, last_statuses)
            return last_statuses

        await sleep_fn(poll_interval_seconds)


__all__ = [
    "CloneBatchFailedError",
    "CloneBatchMemberStatus",
    "CloneBatchPollingError",
    "CloneBatchPollingTimeoutError",
    "WaitForClonesOptions",
    "WaitForClonesPollInfo",
    "wait_for_clones",
]
