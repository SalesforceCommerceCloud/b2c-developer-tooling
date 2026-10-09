# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Backend-agnostic poll loop over canonical :class:`JobExecutionInfo`.

Mirrors ``src/operations/jobs/wait-canonical.ts``. Takes a ``get_execution``
callback so callers can supply either the SCAPI ops ``get_job_execution`` or an
OCAPI fetch wrapped in :func:`map_ocapi_execution`. Decouples polling logic from
any specific backend abstraction.
"""

from __future__ import annotations

import time
from collections.abc import Awaitable, Callable

from b2c_tooling_sdk.operations.jobs.run import WaitForJobOptions, WaitForJobPollInfo
from b2c_tooling_sdk.operations.jobs.types import JobExecutionInfo


class CanonicalJobExecutionError(Exception):
    """Raised by :func:`wait_for_job_execution` when a job reaches a failure state.

    Carries the canonical :class:`JobExecutionInfo` so callers can read fields
    (``exit_status.code``, ``log_file_path``, ...) without knowing which backend
    served the response.
    """

    def __init__(self, message: str, execution: JobExecutionInfo) -> None:
        super().__init__(message)
        self.name = "CanonicalJobExecutionError"
        self.execution = execution


async def wait_for_job_execution(
    get_execution: Callable[[str, str], Awaitable[JobExecutionInfo]],
    job_id: str,
    execution_id: str,
    options: WaitForJobOptions | None = None,
) -> JobExecutionInfo:
    """Poll ``get_execution(job_id, execution_id)`` until a terminal state.

    :returns: the final :class:`JobExecutionInfo`.
    :raises CanonicalJobExecutionError: on job failure.
    :raises RuntimeError: on timeout.
    """
    opts = options or WaitForJobOptions()
    poll_interval_seconds = opts.poll_interval_seconds
    timeout_seconds = opts.timeout_seconds
    on_poll = opts.on_poll
    sleep_fn = opts.sleep

    start_time = time.monotonic()

    await sleep_fn(poll_interval_seconds)

    while True:
        elapsed = time.monotonic() - start_time
        elapsed_seconds = round(elapsed)

        if timeout_seconds > 0 and elapsed > timeout_seconds:
            raise RuntimeError(f"Timeout waiting for job {job_id} execution {execution_id}")

        execution = await get_execution(job_id, execution_id)
        current_status = execution.execution_status

        if on_poll:
            on_poll(WaitForJobPollInfo(job_id, execution_id, elapsed_seconds, current_status))

        if execution.execution_status == "aborted" or (
            execution.exit_status is not None and execution.exit_status.status == "error"
        ):
            raise CanonicalJobExecutionError(f"Job {job_id} failed", execution)

        if execution.execution_status == "finished":
            return execution

        await sleep_fn(poll_interval_seconds)


__all__ = ["CanonicalJobExecutionError", "wait_for_job_execution"]
