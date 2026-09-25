# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""SCAPI Jobs client for B2C Commerce.

Mirrors ``src/clients/scapi-jobs.ts``. Provides a client for the SCAPI Jobs
Admin API (``operation/jobs/v1``), using a per-operation scope cascade (reads
accept either ``sfcc.jobs.rw`` or ``sfcc.jobs``; writes require
``sfcc.jobs.rw``).

Returns a configured :class:`~b2c_tooling_sdk.clients._core.HttpClient`; callers
use ``client.get(path, {...})`` etc., each returning a
:class:`~b2c_tooling_sdk.clients._core.ClientResult`.
"""

from __future__ import annotations

from b2c_tooling_sdk.auth.types import AuthStrategy
from b2c_tooling_sdk.clients._core import HttpClient
from b2c_tooling_sdk.clients.custom_apis import build_tenant_scope, normalize_tenant_id, to_organization_id
from b2c_tooling_sdk.clients.middleware import ScopeCascade
from b2c_tooling_sdk.clients.models.scapi_jobs import (
    ExecutionStatus,
    ExitStatus,
    JobExecution,
    JobExecutionSearchResult,
    JobParameter,
    JobStepExecution,
)
from b2c_tooling_sdk.clients.scapi_client_factory import BuildScapiClientOptions, ScapiClientConfig, build_scapi_client

#: The typed SCAPI Jobs client. Aliased to :class:`HttpClient` (the
#: ``openapi-fetch`` ``Client`` analog).
ScapiJobsClient = HttpClient

#: Configuration for creating a SCAPI Jobs client. Alias of the shared
#: :class:`ScapiClientConfig`.
ScapiJobsClientConfig = ScapiClientConfig

#: Per-operation scope cascade for SCAPI Jobs.
#:
#: Reads accept either rw or ro; writes require rw. The auth middleware tries
#: each candidate against AM in order, caches the first that survives, and
#: lets a broader cached token satisfy a later narrower request without an
#: extra round trip.
SCAPI_JOBS_CASCADE = ScopeCascade(read=[["sfcc.jobs.rw"], ["sfcc.jobs"]], write=[["sfcc.jobs.rw"]])


def create_scapi_jobs_client(config: ScapiJobsClientConfig, auth: AuthStrategy) -> ScapiJobsClient:
    """Create a typed SCAPI Jobs Admin API client.

    :param config: SCAPI client configuration including short code and tenant ID.
    :param auth: Authentication strategy (typically OAuth).
    :returns: A configured :class:`HttpClient`.
    """
    return build_scapi_client(
        BuildScapiClientOptions(
            path_segment="operation/jobs/v1",
            domain_key="scapi-jobs",
            scope_cascade=SCAPI_JOBS_CASCADE,
            log_prefix="SCAPI-JOBS",
        ),
        config,
        auth,
    )


__all__ = [
    "SCAPI_JOBS_CASCADE",
    "ExecutionStatus",
    "ExitStatus",
    "JobExecution",
    "JobExecutionSearchResult",
    "JobParameter",
    "JobStepExecution",
    "ScapiJobsClient",
    "ScapiJobsClientConfig",
    "build_tenant_scope",
    "create_scapi_jobs_client",
    "normalize_tenant_id",
    "to_organization_id",
]
