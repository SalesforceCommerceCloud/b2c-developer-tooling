/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

// Core job execution
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
  SearchJobExecutionsOptions,
  JobExecutionSearchResult,
} from './run.js';

// Site archive import/export
export {siteArchiveImport, siteArchiveExport, siteArchiveExportToPath} from './site-archive.js';

export type {
  SiteArchiveImportOptions,
  SiteArchiveImportResult,
  SiteArchiveExportOptions,
  SiteArchiveExportResult,
  ExportDataUnitsConfiguration,
  ExportSitesConfiguration,
  ExportGlobalDataConfiguration,
} from './site-archive.js';
