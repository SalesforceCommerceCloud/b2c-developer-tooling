# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Mapping helpers between raw OCAPI shapes (snake_case) and canonical
:class:`JobExecutionInfo` (camelCase-ish).

Mirrors ``src/operations/jobs/ocapi-mapping.ts``. Transitional utilities to
bridge the two API shapes; deleted along with the OCAPI ops once OCAPI is
removed.
"""

from __future__ import annotations

from typing import Any

from b2c_tooling_sdk.operations.jobs.run import JobExecution, JobExecutionSearchResult, JobStepExecution
from b2c_tooling_sdk.operations.jobs.types import (
    JobExecutionInfo,
    JobExecutionSearchResults,
    JobExitStatus,
    JobStepExecutionResult,
)


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
        step_id=step.get("step_id"),
        execution_status=step.get("execution_status"),
        exit_status=_map_exit_status(step.get("exit_status")),
        duration=step.get("duration"),
    )


def map_ocapi_execution(ocapi: JobExecution) -> JobExecutionInfo:
    """Map a raw OCAPI :data:`JobExecution` into the canonical shape."""
    step_executions = ocapi.get("step_executions")
    return JobExecutionInfo(
        id=ocapi.get("id") or "",
        job_id=ocapi.get("job_id") or "",
        execution_status=ocapi.get("execution_status") or "unknown",
        exit_status=_map_exit_status(ocapi.get("exit_status")),
        start_time=ocapi.get("start_time"),
        end_time=ocapi.get("end_time"),
        duration=ocapi.get("duration"),
        step_executions=[_map_step_execution(s) for s in step_executions] if step_executions else None,
        log_file_path=ocapi.get("log_file_path"),
        is_log_file_existing=ocapi.get("is_log_file_existing"),
        parameters=ocapi.get("parameters"),
        raw=ocapi,
    )


def _map_canonical_step_execution(step: JobStepExecutionResult) -> JobStepExecution:
    result: JobStepExecution = {
        "id": step.id,
        "step_id": step.step_id,
        "execution_status": step.execution_status,
        "duration": step.duration,
    }
    if step.exit_status is not None:
        result["exit_status"] = {
            "code": step.exit_status.code,
            "message": step.exit_status.message,
            "status": step.exit_status.status,
        }
    else:
        result["exit_status"] = None
    return result


def map_canonical_to_ocapi_execution(canonical: JobExecutionInfo) -> JobExecution:
    """Map a canonical :class:`JobExecutionInfo` back into the raw OCAPI shape.

    The reverse of :func:`map_ocapi_execution`. Prefers the original OCAPI
    payload when present in ``raw`` (lossless round-trip for the OCAPI path);
    otherwise projects the canonical fields.
    """
    raw = canonical.raw
    if isinstance(raw, dict) and "execution_status" in raw:
        return raw

    exit_status = None
    if canonical.exit_status is not None:
        exit_status = {
            "code": canonical.exit_status.code,
            "message": canonical.exit_status.message,
            "status": canonical.exit_status.status,
        }

    step_executions = None
    if canonical.step_executions is not None:
        step_executions = [_map_canonical_step_execution(s) for s in canonical.step_executions]

    return {
        "id": canonical.id,
        "job_id": canonical.job_id,
        "execution_status": canonical.execution_status,
        "exit_status": exit_status,
        "start_time": canonical.start_time,
        "end_time": canonical.end_time,
        "duration": canonical.duration,
        "step_executions": step_executions,
        "log_file_path": canonical.log_file_path,
        "is_log_file_existing": canonical.is_log_file_existing,
        "parameters": canonical.parameters,
    }


def map_ocapi_search_result(result: JobExecutionSearchResult) -> JobExecutionSearchResults:
    """Map a raw OCAPI search result into the canonical shape."""
    return JobExecutionSearchResults(
        total=result.total,
        limit=result.count,
        offset=result.start,
        hits=[map_ocapi_execution(hit) for hit in result.hits],
    )


__all__ = [
    "map_canonical_to_ocapi_execution",
    "map_ocapi_execution",
    "map_ocapi_search_result",
]
