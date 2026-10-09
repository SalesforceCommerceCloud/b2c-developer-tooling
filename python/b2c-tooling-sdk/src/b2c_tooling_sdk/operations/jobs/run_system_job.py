# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Dual-backend runner for B2C Commerce system jobs.

Mirrors ``src/operations/jobs/run-system-job.ts``. System jobs (site-archive
import/export, CAP install/uninstall) all follow the same shape: trigger a named
system job, wait for it to finish, and surface the job log on failure. This
module centralizes that flow over either backend so each operation declares only
its job ID and request body — not the OCAPI-vs-SCAPI plumbing.

The public result/error types of every caller expose the raw OCAPI
:data:`JobExecution` (snake_case). The SCAPI path maps its canonical result back
to the OCAPI shape via :func:`map_canonical_to_ocapi_execution`, and a SCAPI job
failure is re-raised as the raw :class:`JobExecutionError`.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, Any

from b2c_tooling_sdk.clients.error_utils import OcapiDeprecatedError, is_ocapi_deprecated_fault
from b2c_tooling_sdk.clients.scapi_backend_utils import is_fallback_trigger, scapi_unavailable_message
from b2c_tooling_sdk.clients.scapi_jobs import ScapiJobsClient, ScapiJobsClientConfig, create_scapi_jobs_client
from b2c_tooling_sdk.logging import get_logger
from b2c_tooling_sdk.operations.jobs.ocapi_mapping import map_canonical_to_ocapi_execution
from b2c_tooling_sdk.operations.jobs.run import (
    JobExecution,
    JobExecutionError,
    WaitForJobOptions,
    wait_for_job,
)
from b2c_tooling_sdk.operations.jobs.scapi_ops import ExecuteJobScapiOptions
from b2c_tooling_sdk.operations.jobs.scapi_ops import execute_job as scapi_execute_job
from b2c_tooling_sdk.operations.jobs.scapi_ops import get_job_execution as scapi_get_job_execution
from b2c_tooling_sdk.operations.jobs.types import JobExecutionInfo
from b2c_tooling_sdk.operations.jobs.wait_canonical import CanonicalJobExecutionError, wait_for_job_execution

if TYPE_CHECKING:
    from b2c_tooling_sdk.instance import B2CInstance, ScapiClientConfig


def _is_safe_start_fallback(error: object) -> bool:
    """Return ``True`` when a SCAPI start failure provably created no job."""
    return is_fallback_trigger(error)


@dataclass
class SystemJobSpec:
    """Declarative description of a system job to run."""

    #: System job ID, e.g. ``sfcc-site-archive-import``.
    job_id: str
    #: OCAPI "shorthand" request body tried first on the OCAPI path. When the
    #: instance rejects it with ``UnknownPropertyException``, the OCAPI path
    #: retries with :attr:`parameters`.
    ocapi_body: dict[str, Any]
    #: Job parameters (``[{name, value}]``). Used as the OCAPI internal-user
    #: retry body and as the SCAPI request body.
    parameters: list[dict[str, str]]
    #: Human-readable verb for error messages, e.g. ``"execute import job"``.
    fail_verb: str
    #: Scopes named in the OCAPI-deprecation error (the rw jobs scope).
    deprecated_scopes: list[str] | None = None
    #: Whether to wait for completion (default: ``True``).
    wait: bool = True
    #: Wait options forwarded to the poll loop.
    wait_options: WaitForJobOptions | None = None


async def run_system_job(instance: B2CInstance, spec: SystemJobSpec) -> JobExecution:
    """Start a system job (waiting for completion unless ``spec.wait`` is ``False``).

    :returns: the raw OCAPI :data:`JobExecution`.
    :raises JobExecutionError: (raw) when the job fails.
    :raises OcapiDeprecatedError: when the only reachable backend is a deprecated OCAPI.
    """
    preference = instance.api_backend
    scapi_config = instance.scapi_client_config

    if preference == "ocapi":
        return await _run_ocapi_system_job(instance, spec)

    if preference == "scapi":
        if not scapi_config:
            # Domain label (not the job ID) so the message reads "Jobs SCAPI
            # backend requires...", consistent with resolve_scapi_or_ocapi.
            raise RuntimeError(scapi_unavailable_message("Jobs"))
        return await _run_scapi_system_job(instance, scapi_config, spec)

    # auto
    if not scapi_config:
        return await _run_ocapi_system_job(instance, spec)

    client = create_scapi_jobs_client(
        ScapiJobsClientConfig(short_code=scapi_config.short_code, tenant_id=scapi_config.tenant_id),
        scapi_config.auth,
    )
    try:
        started = await _start_scapi_job(client, scapi_config.tenant_id, spec)
    except Exception as error:  # noqa: BLE001 - classified below
        # Fall back to OCAPI ONLY when the SCAPI start provably created no job.
        # An ambiguous failure (network drop after dispatch, timeout, 5xx) must
        # propagate — re-running a mutating system job over OCAPI could execute
        # it twice.
        if not _is_safe_start_fallback(error):
            raise
        get_logger("operations.jobs").info("SCAPI %s start rejected, falling back to OCAPI: %s", spec.job_id, error)
        return await _run_ocapi_system_job(instance, spec)
    return await _finish_scapi_job(client, scapi_config.tenant_id, spec, started)


async def _run_scapi_system_job(
    instance: B2CInstance,
    scapi_config: ScapiClientConfig,
    spec: SystemJobSpec,
) -> JobExecution:
    client = create_scapi_jobs_client(
        ScapiJobsClientConfig(short_code=scapi_config.short_code, tenant_id=scapi_config.tenant_id),
        scapi_config.auth,
    )
    started = await _start_scapi_job(client, scapi_config.tenant_id, spec)
    return await _finish_scapi_job(client, scapi_config.tenant_id, spec, started)


async def _start_scapi_job(client: ScapiJobsClient, tenant_id: str, spec: SystemJobSpec) -> JobExecutionInfo:
    return await scapi_execute_job(
        client,
        spec.job_id,
        ExecuteJobScapiOptions(tenant_id=tenant_id, parameters=spec.parameters),
    )


async def _finish_scapi_job(
    client: ScapiJobsClient,
    tenant_id: str,
    spec: SystemJobSpec,
    started: JobExecutionInfo,
) -> JobExecution:
    if spec.wait is False:
        return map_canonical_to_ocapi_execution(started)

    async def _get(job_id: str, execution_id: str) -> JobExecutionInfo:
        return await scapi_get_job_execution(client, job_id, execution_id, tenant_id)

    try:
        final = await wait_for_job_execution(
            _get,
            spec.job_id,
            started.id,
            spec.wait_options or WaitForJobOptions(),
        )
        return map_canonical_to_ocapi_execution(final)
    except CanonicalJobExecutionError as error:
        # Re-raise a job FAILURE as the raw JobExecutionError so callers' existing
        # log-fetch handling works identically across backends. Other errors
        # (timeout, network) propagate as-is — never fall back post-start.
        raise JobExecutionError(str(error), map_canonical_to_ocapi_execution(error.execution)) from error


async def _run_ocapi_system_job(instance: B2CInstance, spec: SystemJobSpec) -> JobExecution:
    execution: JobExecution

    result = await instance.ocapi.post(
        "/jobs/{job_id}/executions",
        {"params": {"path": {"job_id": spec.job_id}}, "body": spec.ocapi_body},
    )
    data, error = result.data, result.error

    fault = error.get("fault") if isinstance(error, dict) else None
    arguments = fault.get("arguments") if isinstance(fault, dict) else None
    is_unknown_property = (
        isinstance(fault, dict)
        and fault.get("type") == "UnknownPropertyException"
        and isinstance(arguments, dict)
        and arguments.get("document") == "job_execution_request"
    )

    if is_unknown_property:
        # Retry with parameters format (internal/support users).
        retry = await instance.ocapi.post(
            "/jobs/{job_id}/executions",
            {"params": {"path": {"job_id": spec.job_id}}, "body": {"parameters": spec.parameters}},
        )
        retry_data, retry_error = retry.data, retry.error
        if retry_error or not retry_data:
            if is_ocapi_deprecated_fault(retry_error):
                raise OcapiDeprecatedError(cause=retry_error, required_scopes=spec.deprecated_scopes)
            raise RuntimeError(_fault_message(retry_error) or f"Failed to {spec.fail_verb}")
        execution = retry_data
    elif error or not data:
        if is_ocapi_deprecated_fault(error):
            raise OcapiDeprecatedError(cause=error, required_scopes=spec.deprecated_scopes)
        raise RuntimeError(_fault_message(error) or f"Failed to {spec.fail_verb}")
    else:
        execution = data

    if spec.wait is False:
        return execution

    return await wait_for_job(instance, spec.job_id, execution["id"], spec.wait_options or WaitForJobOptions())


def _fault_message(error: Any) -> str | None:
    if isinstance(error, dict):
        fault = error.get("fault")
        if isinstance(fault, dict):
            message = fault.get("message")
            if isinstance(message, str) and message:
                return message
    return None


__all__ = ["SystemJobSpec", "run_system_job"]
