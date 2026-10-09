# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for the OCAPI job operations in ``operations/jobs/run.py``."""

from __future__ import annotations

import time
from typing import Any

import pytest

from b2c_tooling_sdk.clients.error_utils import OcapiDeprecatedError
from b2c_tooling_sdk.operations.jobs import run as run_module
from b2c_tooling_sdk.operations.jobs.run import (
    ExecuteJobOptions,
    JobExecutionError,
    SearchJobExecutionsOptions,
    WaitForJobOptions,
    WaitForJobPollInfo,
    execute_job,
    find_running_job_execution,
    get_job_error_message,
    get_job_execution,
    get_job_log,
    search_job_executions,
    wait_for_job,
)
from tests._jobs_test_helpers import (
    FakeClock,
    FakeHttpClient,
    FakeInstance,
    FakeWebDav,
    err,
    noop_sleep,
    ok,
)

# --- execute_job -------------------------------------------------------------


async def test_execute_job_success_no_params() -> None:
    instance = FakeInstance(ocapi=FakeHttpClient(lambda m, p, o: ok({"id": "exec-1", "execution_status": "running"})))

    result = await execute_job(instance, "my-job")  # type: ignore[arg-type]

    assert result["id"] == "exec-1"
    method, path, options = instance.ocapi.calls[0]
    assert method == "POST"
    assert path == "/jobs/{job_id}/executions"
    assert options["body"] is None
    assert options["params"]["path"]["job_id"] == "my-job"


async def test_execute_job_sends_parameters_body() -> None:
    instance = FakeInstance(ocapi=FakeHttpClient(lambda m, p, o: ok({"id": "exec-2"})))

    await execute_job(instance, "my-job", ExecuteJobOptions(parameters=[{"name": "A", "value": "1"}]))  # type: ignore[arg-type]

    _, _, options = instance.ocapi.calls[0]
    assert options["body"] == {"parameters": [{"name": "A", "value": "1"}]}


async def test_execute_job_already_running_waits_then_retries(monkeypatch: pytest.MonkeyPatch) -> None:
    posts = {"count": 0}

    def handler(method: str, path: str, options: dict[str, Any]) -> Any:
        if method == "POST" and path.endswith("/executions"):
            posts["count"] += 1
            if posts["count"] == 1:
                return err(400, None, text="com.demandware.JobAlreadyRunningException: busy")
            return ok({"id": "exec-fresh"})
        if path == "/job_execution_search":
            return ok(
                {"total": 1, "count": 1, "start": 0, "hits": [{"id": "running-1", "execution_status": "running"}]}
            )
        raise AssertionError(f"unexpected {method} {path}")

    waited: list[str] = []

    async def fake_wait(instance: Any, job_id: str, execution_id: str, options: Any = None) -> dict[str, Any]:
        waited.append(execution_id)
        return {"id": execution_id, "execution_status": "finished"}

    monkeypatch.setattr(run_module, "wait_for_job", fake_wait)
    instance = FakeInstance(ocapi=FakeHttpClient(handler))

    result = await execute_job(instance, "my-job")  # type: ignore[arg-type]

    assert result["id"] == "exec-fresh"
    assert waited == ["running-1"]
    assert posts["count"] == 2


async def test_execute_job_already_running_without_wait_raises() -> None:
    instance = FakeInstance(ocapi=FakeHttpClient(lambda m, p, o: err(400, None, text="JobAlreadyRunningException")))

    with pytest.raises(RuntimeError, match="already running"):
        await execute_job(instance, "my-job", ExecuteJobOptions(wait_for_running=False))  # type: ignore[arg-type]


async def test_execute_job_generic_failure_raises_runtime_error() -> None:
    instance = FakeInstance(ocapi=FakeHttpClient(lambda m, p, o: err(500, {"fault": {"message": "boom"}})))

    with pytest.raises(RuntimeError, match="boom"):
        await execute_job(instance, "my-job")  # type: ignore[arg-type]


async def test_execute_job_deprecated_ocapi_raises() -> None:
    instance = FakeInstance(
        ocapi=FakeHttpClient(lambda m, p, o: err(403, {"fault": {"type": "OcapiDeprecatedException", "message": "x"}}))
    )

    with pytest.raises(OcapiDeprecatedError):
        await execute_job(instance, "my-job")  # type: ignore[arg-type]


# --- get_job_execution -------------------------------------------------------


async def test_get_job_execution_success() -> None:
    instance = FakeInstance(ocapi=FakeHttpClient(lambda m, p, o: ok({"id": "e1", "execution_status": "finished"})))

    result = await get_job_execution(instance, "my-job", "e1")  # type: ignore[arg-type]

    assert result["execution_status"] == "finished"
    _, path, options = instance.ocapi.calls[0]
    assert path == "/jobs/{job_id}/executions/{id}"
    assert options["params"]["path"] == {"job_id": "my-job", "id": "e1"}


async def test_get_job_execution_failure_raises() -> None:
    instance = FakeInstance(ocapi=FakeHttpClient(lambda m, p, o: err(404, {"fault": {"message": "gone"}})))

    with pytest.raises(RuntimeError, match="gone"):
        await get_job_execution(instance, "my-job", "e1")  # type: ignore[arg-type]


# --- wait_for_job ------------------------------------------------------------


async def test_wait_for_job_returns_on_finished() -> None:
    polls: list[WaitForJobPollInfo] = []
    instance = FakeInstance(ocapi=FakeHttpClient(lambda m, p, o: ok({"id": "e1", "execution_status": "finished"})))

    result = await wait_for_job(
        instance,  # type: ignore[arg-type]
        "my-job",
        "e1",
        WaitForJobOptions(sleep=noop_sleep, on_poll=polls.append),
    )

    assert result["execution_status"] == "finished"
    assert polls and polls[0].status == "finished"


async def test_wait_for_job_raises_on_error_status() -> None:
    instance = FakeInstance(
        ocapi=FakeHttpClient(
            lambda m, p, o: ok({"id": "e1", "execution_status": "finished", "exit_status": {"code": "ERROR"}})
        )
    )

    with pytest.raises(JobExecutionError):
        await wait_for_job(instance, "my-job", "e1", WaitForJobOptions(sleep=noop_sleep))  # type: ignore[arg-type]


async def test_wait_for_job_times_out(monkeypatch: pytest.MonkeyPatch) -> None:
    clock = FakeClock()
    monkeypatch.setattr(time, "monotonic", clock.monotonic)
    instance = FakeInstance(ocapi=FakeHttpClient(lambda m, p, o: ok({"id": "e1", "execution_status": "running"})))

    with pytest.raises(RuntimeError, match="Timeout"):
        await wait_for_job(
            instance,  # type: ignore[arg-type]
            "my-job",
            "e1",
            WaitForJobOptions(sleep=clock.sleep, poll_interval_seconds=3, timeout_seconds=5),
        )


# --- get_job_error_message ---------------------------------------------------


def test_get_job_error_message_finds_last_error_step() -> None:
    execution = {
        "step_executions": [
            {"exit_status": {"code": "OK"}},
            {"exit_status": {"code": "ERROR", "message": "first error"}},
            {"exit_status": {"code": "ERROR", "message": "last error"}},
        ]
    }

    assert get_job_error_message(execution) == "last error"


def test_get_job_error_message_returns_none_when_no_error() -> None:
    assert get_job_error_message({"step_executions": [{"exit_status": {"code": "OK"}}]}) is None
    assert get_job_error_message({}) is None


# --- search_job_executions / find_running_job_execution ----------------------


async def test_search_job_executions_match_all_when_no_filters() -> None:
    captured: dict[str, Any] = {}

    def handler(method: str, path: str, options: dict[str, Any]) -> Any:
        captured.update(options["body"])
        return ok({"total": 0, "count": 0, "start": 0, "hits": []})

    instance = FakeInstance(ocapi=FakeHttpClient(handler))

    result = await search_job_executions(instance)  # type: ignore[arg-type]

    assert result.total == 0
    assert captured["query"] == {"match_all_query": {}}


async def test_search_job_executions_term_query_for_job_id() -> None:
    captured: dict[str, Any] = {}

    def handler(method: str, path: str, options: dict[str, Any]) -> Any:
        captured.update(options["body"])
        return ok({"total": 1, "count": 1, "start": 0, "hits": [{"id": "e1"}]})

    instance = FakeInstance(ocapi=FakeHttpClient(handler))

    result = await search_job_executions(instance, SearchJobExecutionsOptions(job_id="my-job"))  # type: ignore[arg-type]

    assert result.hits == [{"id": "e1"}]
    assert captured["query"] == {"term_query": {"fields": ["job_id"], "operator": "is", "values": ["my-job"]}}


async def test_search_job_executions_failure_raises() -> None:
    instance = FakeInstance(ocapi=FakeHttpClient(lambda m, p, o: err(500, {"fault": {"message": "bad"}})))

    with pytest.raises(RuntimeError, match="Failed to search job executions: bad"):
        await search_job_executions(instance)  # type: ignore[arg-type]


async def test_find_running_job_execution_returns_first_hit() -> None:
    instance = FakeInstance(
        ocapi=FakeHttpClient(lambda m, p, o: ok({"total": 1, "count": 1, "start": 0, "hits": [{"id": "run-1"}]}))
    )

    running = await find_running_job_execution(instance, "my-job")  # type: ignore[arg-type]

    assert running == {"id": "run-1"}


async def test_find_running_job_execution_returns_none_when_empty() -> None:
    instance = FakeInstance(ocapi=FakeHttpClient(lambda m, p, o: ok({"total": 0, "count": 0, "start": 0, "hits": []})))

    assert await find_running_job_execution(instance, "my-job") is None  # type: ignore[arg-type]


# --- get_job_log -------------------------------------------------------------


async def test_get_job_log_strips_sites_prefix_and_decodes() -> None:
    webdav = FakeWebDav()
    webdav.files["LOGS/jobs/my-job/log.txt"] = b"hello log"
    instance = FakeInstance(webdav=webdav)

    content = await get_job_log(
        instance,  # type: ignore[arg-type]
        {"log_file_path": "/Sites/LOGS/jobs/my-job/log.txt", "is_log_file_existing": True},
    )

    assert content == "hello log"


async def test_get_job_log_raises_when_no_path() -> None:
    with pytest.raises(RuntimeError, match="No log file path"):
        await get_job_log(FakeInstance(webdav=FakeWebDav()), {})  # type: ignore[arg-type]


async def test_get_job_log_raises_when_file_missing() -> None:
    with pytest.raises(RuntimeError, match="Log file does not exist"):
        await get_job_log(
            FakeInstance(webdav=FakeWebDav()),  # type: ignore[arg-type]
            {"log_file_path": "/Sites/LOGS/x.log", "is_log_file_existing": False},
        )
