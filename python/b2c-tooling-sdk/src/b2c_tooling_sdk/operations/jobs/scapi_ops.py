# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""SCAPI Jobs operations.

Mirrors ``src/operations/jobs/scapi-ops.ts``. Free functions over a
:data:`~b2c_tooling_sdk.clients.scapi_jobs.ScapiJobsClient`. Each operation
declares its scope tier (``read`` or ``write``) via the ``x-b2c-scope-mode``
header; the auth middleware resolves the appropriate scope cascade.

These are named plainly here (``execute_job`` etc.); the package barrel
re-exports them under the ``scapi_*`` names to match the TypeScript aliases.
"""

from __future__ import annotations

import asyncio
from collections.abc import Awaitable, Callable
from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Any

from b2c_tooling_sdk.clients.middleware import SCOPE_MODE_HEADER
from b2c_tooling_sdk.clients.scapi_backend_utils import ScapiRequestError, create_scapi_request_error
from b2c_tooling_sdk.clients.scapi_jobs import ScapiJobsClient, to_organization_id
from b2c_tooling_sdk.logging import get_logger
from b2c_tooling_sdk.operations.jobs.types import (
    JobExecutionInfo,
    JobExecutionSearchResults,
    JobExitStatus,
    JobStepExecutionResult,
)

if TYPE_CHECKING:
    from b2c_tooling_sdk.instance import B2CInstance

_READ_HEADERS = {SCOPE_MODE_HEADER: "read"}
_WRITE_HEADERS = {SCOPE_MODE_HEADER: "write"}


class ScapiJobStartError(ScapiRequestError):
    """Raised when the SCAPI job-start POST is rejected with a response (non-2xx).

    Carries the received HTTP ``status`` so callers can tell a *request
    rejection* (server refused before starting the job — safe to treat as "no
    job created") from an ambiguous failure. A network/timeout error during the
    POST does NOT produce this — it surfaces as a raw thrown error with no
    status, because the request may have reached the server.
    """

    def __init__(self, message: str, status: int) -> None:
        super().__init__(message, status)
        self.name = "ScapiJobStartError"


def _map_exit_status(exit_status: dict[str, Any] | None) -> JobExitStatus | None:
    if not exit_status:
        return None
    return JobExitStatus(
        code=exit_status.get("code") or "",
        message=exit_status.get("message"),
        status=exit_status.get("status"),
    )


def _map_step_execution(step: dict[str, Any]) -> JobStepExecutionResult:
    return JobStepExecutionResult(
        id=step.get("id"),
        step_id=step.get("stepId"),
        execution_status=step.get("executionStatus"),
        exit_status=_map_exit_status(step.get("exitStatus")),
        duration=step.get("duration"),
    )


def _map_scapi_execution(scapi: dict[str, Any]) -> JobExecutionInfo:
    step_executions = scapi.get("stepExecutions")
    return JobExecutionInfo(
        id=scapi.get("id") or "",
        job_id=scapi.get("jobId") or "",
        execution_status=scapi.get("executionStatus") or "unknown",
        exit_status=_map_exit_status(scapi.get("exitStatus")),
        start_time=scapi.get("startTime"),
        end_time=scapi.get("endTime"),
        duration=scapi.get("duration"),
        step_executions=[_map_step_execution(s) for s in step_executions] if step_executions else None,
        log_file_path=scapi.get("logFilePath"),
        is_log_file_existing=scapi.get("isLogFileExisting"),
        parameters=scapi.get("parameters"),
        raw=scapi,
    )


@dataclass
class ExecuteJobScapiOptions:
    """Options for :func:`execute_job` (SCAPI)."""

    #: Tenant ID for the organization path param. Required.
    tenant_id: str
    #: Job parameters to pass (standard jobs).
    parameters: list[dict[str, Any]] = field(default_factory=list)
    #: Raw request body (for system jobs with non-standard schemas).
    body: dict[str, Any] | None = None
    #: Wait for running jobs to finish before starting (default: ``True``).
    wait_for_running: bool = True
    #: Injectable async sleep (seconds); used while polling a prior run to a
    #: terminal state. Defaults to :func:`asyncio.sleep`.
    sleep: Callable[[float], Awaitable[None]] = asyncio.sleep


@dataclass
class SearchJobExecutionsScapiOptions:
    """Options for :func:`search_job_executions` (SCAPI)."""

    #: Tenant ID for the organization path param. Required.
    tenant_id: str
    #: Filter by job ID.
    job_id: str | None = None
    #: Filter by status (``RUNNING``, ``PENDING``, ...).
    status: str | list[str] | None = None
    #: Maximum results to return (default: 25).
    count: int = 25
    #: Starting index for pagination.
    start: int = 0
    #: Sort by field (default: ``start_time``).
    sort_by: str = "start_time"
    #: Sort order (``asc`` or ``desc``).
    sort_order: str = "desc"


async def execute_job(
    client: ScapiJobsClient,
    job_id: str,
    options: ExecuteJobScapiOptions,
) -> JobExecutionInfo:
    """Execute a job (SCAPI). Requires the rw scope (no ro fallback for writes).

    If the job is already running and ``wait_for_running`` is not ``False``,
    polls until the prior run reaches a terminal state, then retries.

    :raises ScapiJobStartError: when the server rejects the start with a response.
    :raises RuntimeError: when the job is already running and ``wait_for_running``
        is ``False``.
    """
    organization_id = to_organization_id(options.tenant_id)
    parameters = options.parameters
    raw_body = options.body

    request_body: dict[str, Any] | None
    if raw_body:
        request_body = raw_body
    elif parameters:
        request_body = {"parameters": parameters}
    else:
        request_body = None

    result = await client.post(
        "/organizations/{organizationId}/jobs/{jobId}/executions",
        {
            "params": {"path": {"organizationId": organization_id, "jobId": job_id}},
            "headers": _WRITE_HEADERS,
            "body": request_body,
        },
    )
    data, error, response = result.data, result.error, result.response

    if response is not None and response.status_code == 400:
        error_body = error if isinstance(error, dict) else {}
        type_value = error_body.get("type") or ""
        if "job-already-running" in type_value or error_body.get("title") == "Job Already Running":
            if options.wait_for_running is not False:
                get_logger("operations.jobs").warning("Job %s already running, waiting for it to finish...", job_id)
                running = await _find_running_execution(client, job_id, options.tenant_id)
                if running:
                    await _wait_for_terminal(client, job_id, running.id, options.tenant_id, options.sleep)
                return await execute_job(client, job_id, _without_wait(options))
            raise RuntimeError(f"Job {job_id} is already running")

    if error or not data:
        error_body = error if isinstance(error, dict) else {}
        message = error_body.get("detail") or error_body.get("title") or f"Failed to execute job {job_id}"
        status = response.status_code if response is not None else 0
        raise ScapiJobStartError(message, status)

    return _map_scapi_execution(data)


async def get_job_execution(
    client: ScapiJobsClient,
    job_id: str,
    execution_id: str,
    tenant_id: str,
) -> JobExecutionInfo:
    """Get a job execution by ID (SCAPI).

    :raises ScapiRequestError: on a failed request.
    """
    organization_id = to_organization_id(tenant_id)

    result = await client.get(
        "/organizations/{organizationId}/jobs/{jobId}/executions/{executionId}",
        {
            "params": {"path": {"organizationId": organization_id, "jobId": job_id, "executionId": execution_id}},
            "headers": _READ_HEADERS,
        },
    )
    data, error, response = result.data, result.error, result.response

    if error or not data:
        raise create_scapi_request_error(error, response, f"Failed to get job execution {execution_id}")

    return _map_scapi_execution(data)


async def search_job_executions(
    client: ScapiJobsClient,
    options: SearchJobExecutionsScapiOptions,
) -> JobExecutionSearchResults:
    """Search for job executions (SCAPI).

    :raises ScapiRequestError: on a failed request.
    """
    organization_id = to_organization_id(options.tenant_id)
    count = options.count
    start = options.start

    # The SCAPI search DSL uses camelCase wrapper names (``termQuery``,
    # ``boolQuery``), but the underlying searchable/sortable field names on this
    # endpoint are the legacy OCAPI snake_case identifiers (``job_id``,
    # ``status``, ``start_time``). Don't rename these to camelCase.
    queries: list[Any] = []
    if options.job_id:
        queries.append({"termQuery": {"fields": ["job_id"], "operator": "is", "values": [options.job_id]}})
    if options.status:
        status_values = options.status if isinstance(options.status, list) else [options.status]
        queries.append({"termQuery": {"fields": ["status"], "operator": "one_of", "values": status_values}})

    query: Any
    if not queries:
        query = {"matchAllQuery": {}}
    elif len(queries) == 1:
        query = queries[0]
    else:
        query = {"boolQuery": {"must": queries}}

    result = await client.post(
        "/organizations/{organizationId}/job-execution-search",
        {
            "params": {"path": {"organizationId": organization_id}},
            "headers": _READ_HEADERS,
            "body": {
                "query": query,
                "limit": count,
                "offset": start,
                "sorts": [{"field": options.sort_by, "sortOrder": options.sort_order}],
            },
        },
    )
    data, error, response = result.data, result.error, result.response

    if error or not data:
        raise create_scapi_request_error(error, response, "Failed to search job executions")

    hits = data.get("hits") or []
    return JobExecutionSearchResults(
        total=data.get("total") or 0,
        limit=data.get("limit") if data.get("limit") is not None else count,
        offset=data.get("offset") if data.get("offset") is not None else start,
        hits=[_map_scapi_execution(h) for h in hits],
    )


async def delete_job_execution(
    client: ScapiJobsClient,
    job_id: str,
    execution_id: str,
    tenant_id: str,
) -> None:
    """Delete a job execution (SCAPI).

    :raises ScapiRequestError: on a failed request.
    """
    organization_id = to_organization_id(tenant_id)

    result = await client.delete(
        "/organizations/{organizationId}/jobs/{jobId}/executions/{executionId}",
        {
            "params": {"path": {"organizationId": organization_id, "jobId": job_id, "executionId": execution_id}},
            "headers": _WRITE_HEADERS,
        },
    )
    if result.error:
        raise create_scapi_request_error(
            result.error, result.response, f"Failed to delete job execution {execution_id}"
        )


async def get_job_log(instance: B2CInstance, execution: JobExecutionInfo) -> str:
    """Retrieve a job's log file content over WebDAV.

    Both backends (SCAPI and OCAPI) expose ``log_file_path`` under
    ``/Sites/LOGS/...``; WebDAV is shared.

    :raises RuntimeError: if the log file path is missing or the file does not exist.
    """
    if not execution.log_file_path:
        raise RuntimeError("No log file path available")
    if not execution.is_log_file_existing:
        raise RuntimeError("Log file does not exist")
    log_path = execution.log_file_path
    if log_path.startswith("/Sites/"):
        log_path = log_path[len("/Sites/") :]
    content = await instance.webdav.get(log_path)
    return content.decode("utf-8")


async def _find_running_execution(
    client: ScapiJobsClient,
    job_id: str,
    tenant_id: str,
) -> JobExecutionInfo | None:
    results = await search_job_executions(
        client,
        SearchJobExecutionsScapiOptions(
            tenant_id=tenant_id,
            job_id=job_id,
            status=["RUNNING", "PENDING"],
            sort_by="start_time",
            sort_order="asc",
            count=1,
        ),
    )
    return results.hits[0] if results.hits else None


async def _wait_for_terminal(
    client: ScapiJobsClient,
    job_id: str,
    execution_id: str,
    tenant_id: str,
    sleep: Callable[[float], Awaitable[None]],
) -> None:
    while True:
        await sleep(3)
        execution = await get_job_execution(client, job_id, execution_id, tenant_id)
        if execution.execution_status in ("finished", "aborted"):
            return


def _without_wait(options: ExecuteJobScapiOptions) -> ExecuteJobScapiOptions:
    return ExecuteJobScapiOptions(
        tenant_id=options.tenant_id,
        parameters=options.parameters,
        body=options.body,
        wait_for_running=False,
        sleep=options.sleep,
    )


__all__ = [
    "ExecuteJobScapiOptions",
    "ScapiJobStartError",
    "SearchJobExecutionsScapiOptions",
    "delete_job_execution",
    "execute_job",
    "get_job_execution",
    "get_job_log",
    "search_job_executions",
]
