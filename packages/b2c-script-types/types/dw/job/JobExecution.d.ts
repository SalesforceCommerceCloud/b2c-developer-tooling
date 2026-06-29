import utilMap = require('../util/Map');

/**
 * Represents an execution of a job. The job execution can be accessed from a JobStepExecution via
 * JobStepExecution.getJobExecution. If a pipeline is used to implement a step the step execution is available
 * in the pipeline dictionary under the key 'JobStepExecution'. If a script module is used to implement a step the step
 * execution is available as the second parameter of the module's function that is used to execute the step, e.g.:
 * @example
 * ...
 * exports.execute( parameters, stepExecution)
 * {
 * ...
 * var jobExecution = stepExecution.getJobExecution();
 * ...
 * }
 * ...
 */
declare class JobExecution {
    /**
     * Returns the ID of this job execution.
     */
    readonly ID: string;
    /**
     * Returns the job context which can be used to share data between steps. NOTE: Steps should be self-contained, the
     * job context should only be used when necessary and with caution. If two steps which are running in parallel in
     * the same job store data in the job context using the same key the result is undefined. Don't add any complex data
     * to the job context since only simple data types are supported (for example, String and Integer).
     */
    readonly context: utilMap<any, any>;
    /**
     * Returns the ID of the job this job execution belongs to.
     */
    readonly jobID: string;
    private constructor();
    /**
     * Returns the job context which can be used to share data between steps. NOTE: Steps should be self-contained, the
     * job context should only be used when necessary and with caution. If two steps which are running in parallel in
     * the same job store data in the job context using the same key the result is undefined. Don't add any complex data
     * to the job context since only simple data types are supported (for example, String and Integer).
     */
    getContext(): utilMap<any, any>;
    /**
     * Returns the ID of this job execution.
     */
    getID(): string;
    /**
     * Returns the ID of the job this job execution belongs to.
     */
    getJobID(): string;
}

export = JobExecution;
