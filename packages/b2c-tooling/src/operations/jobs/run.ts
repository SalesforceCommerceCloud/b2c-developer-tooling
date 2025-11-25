import {B2CInstance} from '../../instance/index.js';

export interface JobExecutionResult {
  jobId: string;
  status: 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
}

/**
 * Runs a job on an instance.
 */
export async function runJob(instance: B2CInstance, jobId: string): Promise<JobExecutionResult> {
  console.log(`Running job ${jobId} on ${instance.config.hostname}...`);

  // TODO: Implement actual job execution via OCAPI
  // POST /s/-/dw/data/v21_10/jobs/{job_id}/executions

  return {
    jobId,
    status: 'running',
    startTime: new Date(),
  };
}

/**
 * Gets the status of a job execution.
 */
export async function getJobStatus(
  instance: B2CInstance,
  jobId: string,
  executionId: string,
): Promise<JobExecutionResult> {
  console.log(`Getting status of job ${jobId} execution ${executionId}...`);

  // TODO: Implement actual status check via OCAPI
  // GET /s/-/dw/data/v21_10/jobs/{job_id}/executions/{execution_id}

  return {
    jobId,
    status: 'completed',
    startTime: new Date(),
    endTime: new Date(),
  };
}
