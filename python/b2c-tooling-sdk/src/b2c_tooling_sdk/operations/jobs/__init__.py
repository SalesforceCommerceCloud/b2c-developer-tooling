# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Job execution operations for B2C Commerce.

Mirrors ``src/operations/jobs/index.ts``. SDK consumers should call the SCAPI
ops directly via the ``scapi_*`` free functions (or, for legacy code, the OCAPI
free functions from :mod:`~b2c_tooling_sdk.operations.jobs.run`). Ordered import
sets use the site-archive/WebDAV workflow.

The SCAPI ops are defined in :mod:`~b2c_tooling_sdk.operations.jobs.scapi_ops`
with plain names (``execute_job`` etc.) and re-exported here under ``scapi_*``
names, matching the TS ``executeJob as scapiExecuteJob`` aliasing.
"""

from __future__ import annotations

from b2c_tooling_sdk.operations.jobs.discover import ExportableUnits, discover_exportable_units
from b2c_tooling_sdk.operations.jobs.import_set import (
    DiscoverImportSetOptions,
    ImportSetEvent,
    ImportSetItem,
    ImportSetItemResult,
    ImportSetLockOwner,
    ImportSetReceipt,
    ImportSetResult,
    ImportSetStateError,
    SiteArchiveImportSetOptions,
    discover_import_set,
    site_archive_import_set,
)
from b2c_tooling_sdk.operations.jobs.ocapi_mapping import (
    map_canonical_to_ocapi_execution,
    map_ocapi_execution,
    map_ocapi_search_result,
)
from b2c_tooling_sdk.operations.jobs.run import (
    ExecuteJobOptions,
    JobExecution,
    JobExecutionError,
    JobExecutionParameter,
    JobExecutionSearchResult,
    JobExecutionStatus,
    JobStepExecution,
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
from b2c_tooling_sdk.operations.jobs.run_system_job import SystemJobSpec, run_system_job
from b2c_tooling_sdk.operations.jobs.scapi_ops import (
    ExecuteJobScapiOptions,
    ScapiJobStartError,
    SearchJobExecutionsScapiOptions,
)
from b2c_tooling_sdk.operations.jobs.scapi_ops import delete_job_execution as scapi_delete_job_execution
from b2c_tooling_sdk.operations.jobs.scapi_ops import execute_job as scapi_execute_job
from b2c_tooling_sdk.operations.jobs.scapi_ops import get_job_execution as scapi_get_job_execution
from b2c_tooling_sdk.operations.jobs.scapi_ops import get_job_log as scapi_get_job_log
from b2c_tooling_sdk.operations.jobs.scapi_ops import search_job_executions as scapi_search_job_executions
from b2c_tooling_sdk.operations.jobs.site_archive import (
    ExportDataUnitsConfiguration,
    ExportGlobalDataConfiguration,
    ExportSitesConfiguration,
    SiteArchiveExportOptions,
    SiteArchiveExportResult,
    SiteArchiveImportOptions,
    SiteArchiveImportResult,
    SiteArchiveImportSplitOptions,
    SplitImportPartInfo,
    SplitImportPlanInfo,
    site_archive_export,
    site_archive_export_to_buffer,
    site_archive_export_to_path,
    site_archive_import,
    site_archive_import_split,
)
from b2c_tooling_sdk.operations.jobs.types import (
    JobExecutionInfo,
    JobExecutionSearchResults,
    JobStepExecutionResult,
)
from b2c_tooling_sdk.operations.jobs.wait_canonical import (
    CanonicalJobExecutionError,
    wait_for_job_execution,
)

__all__ = [
    # OCAPI ops (legacy)
    "execute_job",
    "get_job_execution",
    "wait_for_job",
    "search_job_executions",
    "find_running_job_execution",
    "get_job_log",
    "get_job_error_message",
    "JobExecutionError",
    "JobExecution",
    "JobStepExecution",
    "JobExecutionStatus",
    "JobExecutionParameter",
    "ExecuteJobOptions",
    "WaitForJobOptions",
    "WaitForJobPollInfo",
    "SearchJobExecutionsOptions",
    "JobExecutionSearchResult",
    # SCAPI ops (primary surface) + canonical types
    "scapi_execute_job",
    "scapi_get_job_execution",
    "scapi_search_job_executions",
    "scapi_delete_job_execution",
    "scapi_get_job_log",
    "ScapiJobStartError",
    "ExecuteJobScapiOptions",
    "SearchJobExecutionsScapiOptions",
    "JobExecutionInfo",
    "JobStepExecutionResult",
    "JobExecutionSearchResults",
    # Backend-agnostic helpers
    "wait_for_job_execution",
    "CanonicalJobExecutionError",
    "map_ocapi_execution",
    "map_ocapi_search_result",
    "map_canonical_to_ocapi_execution",
    "run_system_job",
    "SystemJobSpec",
    # Site archive import/export
    "site_archive_import",
    "site_archive_import_split",
    "site_archive_export",
    "site_archive_export_to_buffer",
    "site_archive_export_to_path",
    "SiteArchiveImportOptions",
    "SiteArchiveImportResult",
    "SiteArchiveImportSplitOptions",
    "SplitImportPlanInfo",
    "SplitImportPartInfo",
    "SiteArchiveExportOptions",
    "SiteArchiveExportResult",
    "ExportDataUnitsConfiguration",
    "ExportSitesConfiguration",
    "ExportGlobalDataConfiguration",
    # Ordered, idempotent import sets
    "discover_import_set",
    "site_archive_import_set",
    "ImportSetStateError",
    "DiscoverImportSetOptions",
    "ImportSetItem",
    "ImportSetReceipt",
    "ImportSetItemResult",
    "ImportSetResult",
    "ImportSetEvent",
    "ImportSetLockOwner",
    "SiteArchiveImportSetOptions",
    # Exportable data unit discovery
    "discover_exportable_units",
    "ExportableUnits",
]
