/**
 * Job execution operations for B2C Commerce.
 *
 * This module provides functions for running and monitoring jobs
 * on B2C Commerce instances via OCAPI.
 *
 * ## Core Job Functions
 *
 * - {@link executeJob} - Start a job execution
 * - {@link getJobExecution} - Get the status of a job execution
 * - {@link waitForJob} - Wait for a job to complete
 * - {@link searchJobExecutions} - Search for job executions
 * - {@link findRunningJobExecution} - Find a running execution
 * - {@link getJobLog} - Retrieve job log file content
 *
 * ## System Jobs
 *
 * - {@link siteArchiveImport} - Import a site archive
 * - {@link siteArchiveExport} - Export a site archive
 * - {@link siteArchiveExportToPath} - Export and save to local path
 *
 * ## Usage
 *
 * ```typescript
 * import {
 *   executeJob,
 *   waitForJob,
 *   searchJobExecutions,
 *   siteArchiveImport,
 *   siteArchiveExport,
 * } from '@salesforce/b2c-tooling-sdk/operations/jobs';
 * import { B2CInstance } from '@salesforce/b2c-tooling-sdk';
 *
 * const instance = B2CInstance.fromDwJson();
 *
 * // Run a custom job and wait for completion
 * const execution = await executeJob(instance, 'my-job-id');
 * const result = await waitForJob(instance, 'my-job-id', execution.id);
 *
 * // Search for recent job executions
 * const results = await searchJobExecutions(instance, {
 *   jobId: 'my-job-id',
 *   count: 10
 * });
 *
 * // Import a site archive
 * await siteArchiveImport(instance, './my-import-data');
 *
 * // Export site data
 * const exportResult = await siteArchiveExport(instance, {
 *   global_data: { meta_data: true }
 * });
 * ```
 *
 * ## Authentication
 *
 * Job operations require OAuth authentication with appropriate OCAPI permissions
 * for the /jobs and /job_execution_search resources.
 *
 * @module operations/jobs
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
