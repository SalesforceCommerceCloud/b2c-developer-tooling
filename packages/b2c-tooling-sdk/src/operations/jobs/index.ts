/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Job execution operations for B2C Commerce.
 *
 * SDK consumers should call SCAPI ops directly via the free functions
 * exported from `./scapi-ops` (or, for legacy code, the OCAPI free
 * functions exported from `./run`). The CLI's `BackendDispatcher`
 * arbitrates between them based on the user's `apiBackend` preference;
 * that policy lives in the CLI layer.
 *
 * @module operations/jobs
 */

// OCAPI ops (legacy — will be removed when OCAPI is deprecated)
export {
  executeJob,
  getJobExecution,
  waitForJob,
  searchJobExecutions,
  findRunningJobExecution,
  getJobLog,
  getJobErrorMessage,
  JobExecutionError,
} from './run.js';

export type {
  JobExecution,
  JobStepExecution,
  JobExecutionStatus,
  JobExecutionParameter,
  ExecuteJobOptions,
  WaitForJobOptions,
  WaitForJobPollInfo,
  SearchJobExecutionsOptions,
  JobExecutionSearchResult,
} from './run.js';

// SCAPI ops + canonical types (primary surface)
export {
  executeJob as scapiExecuteJob,
  getJobExecution as scapiGetJobExecution,
  searchJobExecutions as scapiSearchJobExecutions,
  deleteJobExecution as scapiDeleteJobExecution,
  getJobLog as scapiGetJobLog,
} from './scapi-ops.js';
export type {ExecuteJobScapiOptions, SearchJobExecutionsScapiOptions} from './scapi-ops.js';
export type {JobExecutionInfo, JobStepExecutionResult, JobExecutionSearchResults} from './types.js';

// Backend-agnostic helpers
export {waitForJobExecution, CanonicalJobExecutionError} from './wait-canonical.js';
export {mapOcapiExecution, mapOcapiSearchResult} from './ocapi-mapping.js';

// Site archive import/export (uses OCAPI WebDAV path)
export {
  siteArchiveImport,
  siteArchiveExport,
  siteArchiveExportToBuffer,
  siteArchiveExportToPath,
} from './site-archive.js';

export type {
  SiteArchiveImportOptions,
  SiteArchiveImportResult,
  SiteArchiveExportOptions,
  SiteArchiveExportResult,
  ExportDataUnitsConfiguration,
  ExportSitesConfiguration,
  ExportGlobalDataConfiguration,
} from './site-archive.js';
