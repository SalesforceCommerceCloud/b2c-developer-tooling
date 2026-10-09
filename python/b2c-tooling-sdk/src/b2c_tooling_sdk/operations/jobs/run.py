# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""OCAPI job execution operations for B2C Commerce.

Mirrors ``src/operations/jobs/run.ts``. Provides functions for executing and
monitoring jobs on B2C Commerce instances over the legacy OCAPI Data API.

These are the transitional OCAPI ops; SCAPI ops (the primary surface) live in
:mod:`b2c_tooling_sdk.operations.jobs.scapi_ops`.
"""

from __future__ import annotations

import asyncio
import time
from collections.abc import Awaitable, Callable
from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Any, cast

from b2c_tooling_sdk.clients.error_utils import (
    OcapiDeprecatedError,
    get_api_error_message,
    is_ocapi_deprecated_fault,
)
from b2c_tooling_sdk.clients.scapi_jobs import SCAPI_JOBS_CASCADE
from b2c_tooling_sdk.logging import get_logger

if TYPE_CHECKING:
    from b2c_tooling_sdk.instance import B2CInstance

#: Raw OCAPI job execution. The TypeScript SDK aliases the generated schema type;
#: the Python port surfaces the parsed JSON body as a plain ``dict``.
JobExecution = dict[str, Any]

#: Raw OCAPI job step execution (parsed JSON ``dict``).
JobStepExecution = dict[str, Any]

#: OCAPI execution status string (e.g. ``"running"``, ``"finished"``).
JobExecutionStatus = str

#: Job execution parameter for starting jobs (``{"name": ..., "value": ...}``).
JobExecutionParameter = dict[str, Any]


def _flatten_unique(cascade: list[list[str]]) -> list[str]:
    """Flatten a scope cascade preserving first-seen order (dedupe)."""
    seen: dict[str, None] = {}
    for group in cascade:
        for scope in group:
            seen.setdefault(scope, None)
    return list(seen.keys())


# SCAPI Jobs scopes named in the OCAPI-deprecation message, derived from the
# canonical cascade so they can't drift. Reads accept either tier; writes
# (execute) require the rw scope.
JOBS_READ_SCOPES = _flatten_unique(SCAPI_JOBS_CASCADE.read)
JOBS_RW_SCOPES = _flatten_unique(SCAPI_JOBS_CASCADE.write)


@dataclass
class ExecuteJobOptions:
    """Options for executing a job."""

    #: Job parameters to pass (standard jobs).
    parameters: list[JobExecutionParameter] = field(default_factory=list)
    #: Raw request body (for system jobs with non-standard schemas).
    body: dict[str, Any] | None = None
    #: Wait for running jobs to finish before starting (default: ``True``).
    wait_for_running: bool = True


@dataclass
class WaitForJobPollInfo:
    """Poll info passed to the ``on_poll`` callback during job waiting."""

    #: Job ID being waited on.
    job_id: str
    #: Execution ID being waited on.
    execution_id: str
    #: Seconds elapsed since waiting started.
    elapsed_seconds: int
    #: Current execution status (e.g. ``"running"``, ``"finished"``).
    status: str


@dataclass
class WaitForJobOptions:
    """Options for waiting on a job."""

    #: Polling interval in seconds (default: 3).
    poll_interval_seconds: float = 3
    #: Maximum time to wait in seconds (default: no limit, 0 = no timeout).
    timeout_seconds: float = 0
    #: Callback invoked on each poll with current status.
    on_poll: Callable[[WaitForJobPollInfo], None] | None = None
    #: Injectable async sleep (seconds); defaults to :func:`asyncio.sleep`.
    sleep: Callable[[float], Awaitable[None]] = asyncio.sleep


async def execute_job(
    instance: B2CInstance,
    job_id: str,
    options: ExecuteJobOptions | None = None,
) -> JobExecution:
    """Execute a job on a B2C Commerce instance (OCAPI).

    Starts a job execution and returns immediately with the execution details.
    Use :func:`wait_for_job` to wait for completion.

    :raises RuntimeError: if the job is already running (when ``wait_for_running``
        is ``False``) or the job cannot be executed.
    :raises OcapiDeprecatedError: when OCAPI is deprecated for the instance.
    """
    opts = options or ExecuteJobOptions()
    logger = get_logger("operations.jobs")
    parameters = opts.parameters
    raw_body = opts.body

    body: dict[str, Any] | None
    if raw_body:
        body = raw_body
        logger.debug("Executing job %s with raw body", job_id)
    elif parameters:
        body = {"parameters": parameters}
        logger.debug("Executing job %s with parameters", job_id)
    else:
        body = None
        logger.debug("Executing job %s", job_id)

    result = await instance.ocapi.post(
        "/jobs/{job_id}/executions",
        {"params": {"path": {"job_id": job_id}}, "body": body},
    )
    data, error, response = result.data, result.error, result.response

    # Handle JobAlreadyRunningException.
    if response is not None and response.status_code == 400:
        error_body = response.text or ""
        if "JobAlreadyRunningException" in error_body:
            if opts.wait_for_running:
                logger.warning("Job %s already running, waiting for it to finish...", job_id)
                running_execution = await find_running_job_execution(instance, job_id)
                if running_execution:
                    logger.debug("Found running execution %s", running_execution.get("id"))
                    await wait_for_job(instance, job_id, running_execution["id"])
                    return await execute_job(instance, job_id, _without_wait(opts))
                return await execute_job(instance, job_id, _without_wait(opts))
            raise RuntimeError(f"Job {job_id} is already running")

    if error or not data:
        if is_ocapi_deprecated_fault(error):
            raise OcapiDeprecatedError(cause=error, required_scopes=JOBS_RW_SCOPES)
        message = _fault_message(error) or f"Failed to execute job {job_id}"
        raise RuntimeError(message)

    logger.debug("Job %s started: %s", job_id, data.get("id"))
    return cast("JobExecution", data)


async def get_job_execution(instance: B2CInstance, job_id: str, execution_id: str) -> JobExecution:
    """Get the current status of a job execution (OCAPI).

    :raises RuntimeError: if the execution is not found.
    :raises OcapiDeprecatedError: when OCAPI is deprecated for the instance.
    """
    result = await instance.ocapi.get(
        "/jobs/{job_id}/executions/{id}",
        {"params": {"path": {"job_id": job_id, "id": execution_id}}},
    )
    data, error = result.data, result.error

    if error or not data:
        if is_ocapi_deprecated_fault(error):
            raise OcapiDeprecatedError(cause=error, required_scopes=JOBS_READ_SCOPES)
        message = _fault_message(error) or f"Failed to get job execution {execution_id}"
        raise RuntimeError(message)

    return cast("JobExecution", data)


async def wait_for_job(
    instance: B2CInstance,
    job_id: str,
    execution_id: str,
    options: WaitForJobOptions | None = None,
) -> JobExecution:
    """Wait for a job execution to complete (OCAPI).

    Polls the job status until it reaches a terminal state (finished or aborted).

    :raises JobExecutionError: if the job fails (status ERROR or aborted).
    :raises RuntimeError: if the timeout is exceeded.
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

        execution = await get_job_execution(instance, job_id, execution_id)
        current_status = execution.get("execution_status") or "unknown"

        if on_poll:
            on_poll(WaitForJobPollInfo(job_id, execution_id, elapsed_seconds, current_status))

        exit_status = execution.get("exit_status") or {}
        if execution.get("execution_status") == "aborted" or exit_status.get("code") == "ERROR":
            raise JobExecutionError(f"Job {job_id} failed", execution)

        if execution.get("execution_status") == "finished":
            return execution

        await sleep_fn(poll_interval_seconds)


class JobExecutionError(Exception):
    """Raised when a job execution fails.

    Carries the raw OCAPI :data:`JobExecution` so callers can read fields
    (``exit_status``, ``log_file_path``, ...) for error reporting.
    """

    def __init__(self, message: str, execution: JobExecution) -> None:
        super().__init__(message)
        self.name = "JobExecutionError"
        self.execution = execution


def get_job_error_message(execution: JobExecution) -> str | None:
    """Extract the error message from a failed job execution.

    Looks for the last step execution with ``exit_status.code == 'ERROR'`` and
    returns its message, or ``None`` when none is found.
    """
    step_executions = execution.get("step_executions")
    if not step_executions:
        return None

    for step in reversed(step_executions):
        exit_status = step.get("exit_status") or {}
        if exit_status.get("code") == "ERROR" and exit_status.get("message"):
            return cast("str", exit_status["message"])

    return None


@dataclass
class SearchJobExecutionsOptions:
    """Search options for job executions."""

    #: Filter by job ID.
    job_id: str | None = None
    #: Filter by status (``RUNNING``, ``PENDING``, ``OK``, ``ERROR``, ...).
    status: str | list[str] | None = None
    #: Maximum results to return (default: 25).
    count: int = 25
    #: Starting index for pagination.
    start: int = 0
    #: Sort by field (default: ``start_time``).
    sort_by: str = "start_time"
    #: Sort order (``asc`` or ``desc``).
    sort_order: str = "desc"


@dataclass
class JobExecutionSearchResult:
    """Search results for job executions (raw OCAPI hits)."""

    #: Total matching executions.
    total: int
    #: Number of results returned.
    count: int
    #: Starting index.
    start: int
    #: Job executions.
    hits: list[JobExecution]


async def search_job_executions(
    instance: B2CInstance,
    options: SearchJobExecutionsOptions | None = None,
) -> JobExecutionSearchResult:
    """Search for job executions (OCAPI).

    :raises RuntimeError: if the search request fails.
    :raises OcapiDeprecatedError: when OCAPI is deprecated for the instance.
    """
    opts = options or SearchJobExecutionsOptions()

    queries: list[Any] = []
    if opts.job_id:
        queries.append({"term_query": {"fields": ["job_id"], "operator": "is", "values": [opts.job_id]}})

    if opts.status:
        status_values = opts.status if isinstance(opts.status, list) else [opts.status]
        queries.append({"term_query": {"fields": ["status"], "operator": "one_of", "values": status_values}})

    query: Any
    if not queries:
        query = {"match_all_query": {}}
    elif len(queries) == 1:
        query = queries[0]
    else:
        query = {"bool_query": {"must": queries}}

    result = await instance.ocapi.post(
        "/job_execution_search",
        {
            "body": {
                "query": query,
                "count": opts.count,
                "start": opts.start,
                "sorts": [{"field": opts.sort_by, "sort_order": opts.sort_order}],
            }
        },
    )
    data, error, response = result.data, result.error, result.response

    if error or not data:
        if is_ocapi_deprecated_fault(error):
            raise OcapiDeprecatedError(cause=error, required_scopes=JOBS_READ_SCOPES)
        if error and response is not None:
            message = get_api_error_message(error, response)
        else:
            message = _fault_message(error) or "Unknown error"
        raise RuntimeError(f"Failed to search job executions: {message}")

    return JobExecutionSearchResult(
        total=data.get("total") or 0,
        count=data.get("count") or 0,
        start=data.get("start") or 0,
        hits=data.get("hits") or [],
    )


async def find_running_job_execution(instance: B2CInstance, job_id: str) -> JobExecution | None:
    """Find a currently running job execution, or ``None`` if none found.

    :raises RuntimeError: if the underlying search request fails.
    """
    results = await search_job_executions(
        instance,
        SearchJobExecutionsOptions(
            job_id=job_id,
            status=["RUNNING", "PENDING"],
            sort_by="start_time",
            sort_order="asc",
            count=1,
        ),
    )
    return results.hits[0] if results.hits else None


async def get_job_log(instance: B2CInstance, execution: JobExecution) -> str:
    """Get the log file content for a job execution over WebDAV.

    :raises RuntimeError: if the log file path is missing or the file does not exist.
    """
    if not execution.get("log_file_path"):
        raise RuntimeError("No log file path available")

    if not execution.get("is_log_file_existing"):
        raise RuntimeError("Log file does not exist")

    # log_file_path from OCAPI is "/Sites/LOGS/jobs/..."; WebDAV client base is
    # /webdav/Sites, so strip the leading /Sites/.
    log_path = _strip_sites_prefix(execution["log_file_path"])
    content = await instance.webdav.get(log_path)
    return content.decode("utf-8")


def _strip_sites_prefix(path: str) -> str:
    """Strip a leading ``/Sites/`` from an OCAPI log file path."""
    if path.startswith("/Sites/"):
        return path[len("/Sites/") :]
    return path


def _fault_message(error: Any) -> str | None:
    """Extract ``fault.message`` from an OCAPI error dict, if present."""
    if isinstance(error, dict):
        fault = error.get("fault")
        if isinstance(fault, dict):
            message = fault.get("message")
            if isinstance(message, str) and message:
                return message
    return None


def _without_wait(options: ExecuteJobOptions) -> ExecuteJobOptions:
    """Return a copy of ``options`` with ``wait_for_running`` disabled."""
    return ExecuteJobOptions(parameters=options.parameters, body=options.body, wait_for_running=False)


__all__ = [
    "JOBS_READ_SCOPES",
    "JOBS_RW_SCOPES",
    "ExecuteJobOptions",
    "JobExecution",
    "JobExecutionError",
    "JobExecutionParameter",
    "JobExecutionSearchResult",
    "JobExecutionStatus",
    "JobStepExecution",
    "SearchJobExecutionsOptions",
    "WaitForJobOptions",
    "WaitForJobPollInfo",
    "execute_job",
    "find_running_job_execution",
    "get_job_error_message",
    "get_job_execution",
    "get_job_log",
    "search_job_executions",
    "wait_for_job",
]
