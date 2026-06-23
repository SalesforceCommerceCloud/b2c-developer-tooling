/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Commerce App Package (CAP) uninstallation.
 *
 * Runs the sfcc-uninstall-commerce-app system job to remove an installed CAP.
 */
import {B2CInstance} from '../../instance/index.js';
import {getLogger} from '../../logging/logger.js';
import {JobExecutionError, getJobLog, type JobExecution, type WaitForJobOptions} from '../jobs/run.js';
import {runSystemJob} from '../jobs/run-system-job.js';
import {normalizeSiteId} from './install.js';

const UNINSTALL_JOB_ID = 'sfcc-uninstall-commerce-app';

/**
 * Options for CAP uninstallation.
 */
export interface CommerceAppUninstallOptions {
  /** Target site ID to uninstall the app from. */
  siteId: string;
  /** Wait options for job completion. */
  waitOptions?: WaitForJobOptions;
}

/**
 * Result of a CAP uninstallation.
 */
export interface CommerceAppUninstallResult {
  /** Job execution details. */
  execution: JobExecution;
  /** App name that was uninstalled. */
  appName: string;
}

/**
 * Uninstalls a Commerce App from a B2C Commerce instance.
 *
 * Executes the sfcc-uninstall-commerce-app system job which removes cartridges,
 * IMPEX data, and configuration associated with the app from the target site.
 *
 * @param instance - B2C instance to uninstall from
 * @param appName - App ID (from commerce-app.json "id" field, e.g. "avalara-tax")
 * @param appDomain - App domain (e.g. "tax", "shipping")
 * @param options - Uninstall options including required siteId
 * @returns Uninstall result with job execution details
 * @throws JobExecutionError if the uninstall job fails
 *
 * @example
 * ```typescript
 * const result = await commerceAppUninstall(instance, 'avalara-tax', 'tax', {
 *   siteId: 'RefArch',
 * });
 * ```
 */
export async function commerceAppUninstall(
  instance: B2CInstance,
  appName: string,
  appDomain: string,
  options: CommerceAppUninstallOptions,
): Promise<CommerceAppUninstallResult> {
  const logger = getLogger();
  const {siteId: rawSiteId, waitOptions} = options;
  const siteId = normalizeSiteId(rawSiteId);

  logger.debug({jobId: UNINSTALL_JOB_ID, appName, siteId}, `Executing ${UNINSTALL_JOB_ID} job`);

  // Execute the uninstall job (SCAPI when configured, OCAPI fallback in auto).
  let finalExecution: JobExecution;
  try {
    finalExecution = await runSystemJob(instance, {
      jobId: UNINSTALL_JOB_ID,
      ocapiBody: {
        app_name: appName,
        app_domain: appDomain,
        site_id: siteId,
      },
      parameters: [
        {name: 'AppName', value: appName},
        {name: 'AppDomain', value: appDomain},
        {name: 'SiteId', value: siteId},
      ],
      waitOptions,
      failVerb: 'start uninstall job',
    });
  } catch (err) {
    if (err instanceof JobExecutionError) {
      try {
        const log = await getJobLog(instance, err.execution);
        logger.error({jobId: UNINSTALL_JOB_ID, log}, `Job log:\n${log}`);
      } catch {
        logger.error({jobId: UNINSTALL_JOB_ID}, 'Could not retrieve job log');
      }
    }
    throw err;
  }

  return {
    execution: finalExecution,
    appName,
  };
}
