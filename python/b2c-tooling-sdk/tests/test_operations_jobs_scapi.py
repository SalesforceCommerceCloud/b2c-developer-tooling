# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for the SCAPI job operations, the backend-agnostic poll loop, and the
OCAPI <-> canonical mapping helpers."""

from __future__ import annotations

from typing import Any

import pytest

from b2c_tooling_sdk.clients.scapi_backend_utils import ScapiRequestError
from b2c_tooling_sdk.operations.jobs.ocapi_mapping import (
    map_canonical_to_ocapi_execution,
    map_ocapi_execution,
    map_ocapi_search_result,
)
from b2c_tooling_sdk.operations.jobs.run import JobExecutionSearchResult
from b2c_tooling_sdk.operations.jobs.scapi_ops import (
    ExecuteJobScapiOptions,
    ScapiJobStartError,
    SearchJobExecutionsScapiOptions,
    delete_job_execution,
    execute_job,
    get_job_execution,
    get_job_log,
    search_job_executions,
)
from b2c_tooling_sdk.operations.jobs.types import JobExecutionInfo, JobExitStatus
from b2c_tooling_sdk.operations.jobs.wait_canonical import (
    CanonicalJobExecutionError,
    wait_for_job_execution,
)
from tests._jobs_test_helpers import (
    FakeHttpClient,
    FakeInstance,
    FakeWebDav,
    err,
    noop_sleep,
    ok,
)

TENANT = "zzxy_prd"
ORG = "f_ecom_zzxy_prd"


def _scapi_execution(**overrides: Any) -> dict[str, Any]:
    base = {"id": "e1", "jobId": "my-job", "executionStatus": "finished"}
    base.update(overrides)
    return base


# --- execute_job (SCAPI) -----------------------------------------------------


async def test_scapi_execute_job_success_maps_camel_case() -> None:
    client = FakeHttpClient(
        lambda m, p, o: ok(_scapi_execution(exitStatus={"code": "OK", "status": "ok"}, logFilePath="/Sites/x"))
    )

    result = await execute_job(client, "my-job", ExecuteJobScapiOptions(tenant_id=TENANT))  # type: ignore[arg-type]

    assert isinstance(result, JobExecutionInfo)
    assert result.id == "e1"
    assert result.job_id == "my-job"
    assert result.exit_status is not None and result.exit_status.code == "OK"
    _, path, options = client.calls[0]
    assert path == "/organizations/{organizationId}/jobs/{jobId}/executions"
    assert options["params"]["path"]["organizationId"] == ORG


async def test_scapi_execute_job_already_running_polls_then_retries() -> None:
    posts = {"count": 0}

    def handler(method: str, path: str, options: dict[str, Any]) -> Any:
        if method == "POST" and path.endswith("/executions"):
            posts["count"] += 1
            if posts["count"] == 1:
                return err(400, {"type": "job-already-running", "title": "Job Already Running"})
            return ok(_scapi_execution(id="fresh"))
        if path.endswith("/job-execution-search"):
            return ok(
                {
                    "total": 1,
                    "limit": 1,
                    "offset": 0,
                    "hits": [_scapi_execution(id="running", executionStatus="running")],
                }
            )
        if method == "GET":
            return ok(_scapi_execution(id="running", executionStatus="finished"))
        raise AssertionError(f"unexpected {method} {path}")

    client = FakeHttpClient(handler)

    result = await execute_job(
        client,  # type: ignore[arg-type]
        "my-job",
        ExecuteJobScapiOptions(tenant_id=TENANT, sleep=noop_sleep),
    )

    assert result.id == "fresh"
    assert posts["count"] == 2


async def test_scapi_execute_job_rejection_raises_start_error() -> None:
    client = FakeHttpClient(lambda m, p, o: err(400, {"detail": "invalid job"}))

    with pytest.raises(ScapiJobStartError) as exc_info:
        await execute_job(client, "my-job", ExecuteJobScapiOptions(tenant_id=TENANT))  # type: ignore[arg-type]

    assert exc_info.value.status == 400
    assert "invalid job" in str(exc_info.value)


async def test_scapi_execute_job_already_running_without_wait_raises() -> None:
    client = FakeHttpClient(lambda m, p, o: err(400, {"type": "job-already-running"}))

    with pytest.raises(RuntimeError, match="already running"):
        await execute_job(
            client,  # type: ignore[arg-type]
            "my-job",
            ExecuteJobScapiOptions(tenant_id=TENANT, wait_for_running=False),
        )


# --- get_job_execution / search / delete (SCAPI) -----------------------------


async def test_scapi_get_job_execution_success() -> None:
    client = FakeHttpClient(lambda m, p, o: ok(_scapi_execution(executionStatus="running")))

    result = await get_job_execution(client, "my-job", "e1", TENANT)  # type: ignore[arg-type]

    assert result.execution_status == "running"


async def test_scapi_get_job_execution_failure_raises_request_error() -> None:
    client = FakeHttpClient(lambda m, p, o: err(404, {"detail": "missing"}))

    with pytest.raises(ScapiRequestError) as exc_info:
        await get_job_execution(client, "my-job", "e1", TENANT)  # type: ignore[arg-type]

    assert exc_info.value.status == 404


async def test_scapi_search_uses_camelcase_wrappers_and_snake_fields() -> None:
    captured: dict[str, Any] = {}

    def handler(method: str, path: str, options: dict[str, Any]) -> Any:
        captured.update(options["body"])
        return ok({"total": 1, "limit": 25, "offset": 0, "hits": [_scapi_execution()]})

    client = FakeHttpClient(handler)

    result = await search_job_executions(
        client,  # type: ignore[arg-type]
        SearchJobExecutionsScapiOptions(tenant_id=TENANT, job_id="my-job"),
    )

    assert result.total == 1
    assert len(result.hits) == 1 and result.hits[0].id == "e1"
    assert captured["query"] == {"termQuery": {"fields": ["job_id"], "operator": "is", "values": ["my-job"]}}
    assert captured["limit"] == 25 and captured["offset"] == 0
    assert captured["sorts"] == [{"field": "start_time", "sortOrder": "desc"}]


async def test_scapi_search_match_all_when_no_filters() -> None:
    captured: dict[str, Any] = {}

    def handler(method: str, path: str, options: dict[str, Any]) -> Any:
        captured.update(options["body"])
        return ok({"total": 0, "limit": 25, "offset": 0, "hits": []})

    client = FakeHttpClient(handler)
    await search_job_executions(client, SearchJobExecutionsScapiOptions(tenant_id=TENANT))  # type: ignore[arg-type]

    assert captured["query"] == {"matchAllQuery": {}}


async def test_scapi_delete_job_execution_success() -> None:
    client = FakeHttpClient(lambda m, p, o: ok(None))

    await delete_job_execution(client, "my-job", "e1", TENANT)  # type: ignore[arg-type]

    method, path, _ = client.calls[0]
    assert method == "DELETE"
    assert path == "/organizations/{organizationId}/jobs/{jobId}/executions/{executionId}"


async def test_scapi_delete_job_execution_failure_raises() -> None:
    client = FakeHttpClient(lambda m, p, o: err(403, {"detail": "no"}))

    with pytest.raises(ScapiRequestError):
        await delete_job_execution(client, "my-job", "e1", TENANT)  # type: ignore[arg-type]


async def test_scapi_get_job_log_strips_prefix() -> None:
    webdav = FakeWebDav()
    webdav.files["LOGS/jobs/log.txt"] = b"scapi log"
    instance = FakeInstance(webdav=webdav)
    execution = JobExecutionInfo(
        id="e1",
        job_id="my-job",
        execution_status="finished",
        log_file_path="/Sites/LOGS/jobs/log.txt",
        is_log_file_existing=True,
    )

    assert await get_job_log(instance, execution) == "scapi log"  # type: ignore[arg-type]


# --- wait_for_job_execution --------------------------------------------------


async def test_wait_for_job_execution_returns_on_finished() -> None:
    async def get_execution(job_id: str, execution_id: str) -> JobExecutionInfo:
        return JobExecutionInfo(id=execution_id, job_id=job_id, execution_status="finished")

    from b2c_tooling_sdk.operations.jobs.run import WaitForJobOptions

    result = await wait_for_job_execution(get_execution, "my-job", "e1", WaitForJobOptions(sleep=noop_sleep))

    assert result.execution_status == "finished"


async def test_wait_for_job_execution_raises_on_error_exit_status() -> None:
    async def get_execution(job_id: str, execution_id: str) -> JobExecutionInfo:
        return JobExecutionInfo(
            id=execution_id,
            job_id=job_id,
            execution_status="finished",
            exit_status=JobExitStatus(code="ERROR", status="error"),
        )

    from b2c_tooling_sdk.operations.jobs.run import WaitForJobOptions

    with pytest.raises(CanonicalJobExecutionError):
        await wait_for_job_execution(get_execution, "my-job", "e1", WaitForJobOptions(sleep=noop_sleep))


# --- ocapi_mapping -----------------------------------------------------------


def test_map_ocapi_execution_maps_fields() -> None:
    ocapi = {
        "id": "e1",
        "job_id": "my-job",
        "execution_status": "finished",
        "exit_status": {"code": "OK", "status": "ok", "message": "done"},
        "step_executions": [{"id": "s1", "step_id": "step", "execution_status": "finished", "duration": 5}],
        "log_file_path": "/Sites/x",
    }

    info = map_ocapi_execution(ocapi)

    assert info.id == "e1"
    assert info.exit_status is not None and info.exit_status.code == "OK"
    assert info.step_executions is not None and info.step_executions[0].step_id == "step"
    assert info.raw is ocapi


def test_map_canonical_to_ocapi_round_trip_prefers_raw() -> None:
    ocapi = {"id": "e1", "job_id": "my-job", "execution_status": "finished"}
    info = map_ocapi_execution(ocapi)

    assert map_canonical_to_ocapi_execution(info) is ocapi


def test_map_canonical_to_ocapi_projects_when_no_raw() -> None:
    info = JobExecutionInfo(
        id="e1",
        job_id="my-job",
        execution_status="finished",
        exit_status=JobExitStatus(code="OK", status="ok"),
    )

    projected = map_canonical_to_ocapi_execution(info)

    assert projected["id"] == "e1"
    assert projected["execution_status"] == "finished"
    assert projected["exit_status"] == {"code": "OK", "message": None, "status": "ok"}


def test_map_ocapi_search_result_maps_pagination() -> None:
    search = JobExecutionSearchResult(
        total=2,
        count=1,
        start=0,
        hits=[{"id": "e1", "job_id": "my-job", "execution_status": "finished"}],
    )

    mapped = map_ocapi_search_result(search)

    assert mapped.total == 2
    assert mapped.limit == 1
    assert mapped.offset == 0
    assert mapped.hits[0].id == "e1"
