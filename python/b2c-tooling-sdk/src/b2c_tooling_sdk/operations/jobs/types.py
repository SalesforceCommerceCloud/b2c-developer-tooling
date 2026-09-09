# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Canonical, backend-agnostic job execution types.

Mirrors ``src/operations/jobs/types.ts``. SCAPI ops return
:class:`JobExecutionInfo` directly; OCAPI ops return raw ``dict`` payloads which
callers map via :func:`~b2c_tooling_sdk.operations.jobs.ocapi_mapping.map_ocapi_execution`.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Literal

# Re-exported option/result types that originate in ``run.py`` (mirrors the
# ``export type {...}`` lines in ``types.ts``). Imported lazily-safe: ``run`` does
# not import ``types``.
from b2c_tooling_sdk.operations.jobs.run import (
    ExecuteJobOptions,
    SearchJobExecutionsOptions,
    WaitForJobOptions,
)

#: Canonical (backend-agnostic) execution status values.
JobCanonicalStatus = Literal[
    "pending",
    "running",
    "pausing",
    "paused",
    "resuming",
    "resumed",
    "restarting",
    "restarted",
    "retrying",
    "retried",
    "aborting",
    "aborted",
    "finished",
    "unknown",
]


@dataclass
class JobExitStatus:
    """Canonical exit status for a job or step execution."""

    code: str
    message: str | None = None
    status: Literal["ok", "error"] | None = None


@dataclass
class JobStepExecutionResult:
    """Canonical, backend-agnostic step execution."""

    id: str | None = None
    step_id: str | None = None
    execution_status: str | None = None
    exit_status: JobExitStatus | None = None
    duration: int | None = None


@dataclass
class JobExecutionInfo:
    """Canonical, backend-agnostic job execution shape.

    ``raw`` mirrors the TypeScript ``_raw`` field: the original backend payload,
    preserved for a lossless round-trip when mapping back to OCAPI.
    """

    id: str
    job_id: str
    execution_status: JobCanonicalStatus
    exit_status: JobExitStatus | None = None
    start_time: str | None = None
    end_time: str | None = None
    duration: int | None = None
    step_executions: list[JobStepExecutionResult] | None = None
    log_file_path: str | None = None
    is_log_file_existing: bool | None = None
    parameters: list[dict[str, str]] | None = None
    raw: Any = field(default=None)


@dataclass
class JobExecutionSearchResults:
    """Canonical search results over :class:`JobExecutionInfo`."""

    total: int
    limit: int
    offset: int
    hits: list[JobExecutionInfo]


__all__ = [
    "ExecuteJobOptions",
    "JobCanonicalStatus",
    "JobExecutionInfo",
    "JobExecutionSearchResults",
    "JobExitStatus",
    "JobStepExecutionResult",
    "SearchJobExecutionsOptions",
    "WaitForJobOptions",
]
