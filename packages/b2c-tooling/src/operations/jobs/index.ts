/**
 * Job execution operations for B2C Commerce.
 *
 * This module provides functions for running and monitoring jobs
 * on B2C Commerce instances via OCAPI.
 *
 * ## Functions
 *
 * - {@link runJob} - Start a job execution
 * - {@link getJobStatus} - Check the status of a running job
 *
 * ## Usage
 *
 * ```typescript
 * import { runJob, getJobStatus } from '@salesforce/b2c-tooling/operations/jobs';
 * import { B2CInstance, OAuthStrategy } from '@salesforce/b2c-tooling';
 *
 * const auth = new OAuthStrategy({
 *   clientId: 'your-client-id',
 *   clientSecret: 'your-client-secret',
 * });
 * const instance = new B2CInstance(
 *   { hostname: 'your-sandbox.demandware.net' },
 *   auth
 * );
 *
 * // Start a job
 * const result = await runJob(instance, 'my-job-id');
 *
 * // Poll for completion
 * let status = await getJobStatus(instance, result.jobId, result.executionId);
 * while (status.status === 'running') {
 *   await new Promise(resolve => setTimeout(resolve, 5000));
 *   status = await getJobStatus(instance, result.jobId, result.executionId);
 * }
 * ```
 *
 * ## Authentication
 *
 * Job operations require OAuth authentication with appropriate OCAPI permissions.
 *
 * @module operations/jobs
 */
export {runJob, getJobStatus, JobExecutionResult} from './run.js';
