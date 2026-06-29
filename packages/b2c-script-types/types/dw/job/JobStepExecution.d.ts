import JobExecution = require('./JobExecution');

/**
 * Represents an execution of a step that belongs to a job. The job execution this step execution belongs to can be
 * accessed via getJobExecution. If a pipeline is used to implement a step this step execution is available
 * in the pipeline dictionary under the key 'JobStepExecution'. If a script module is used to implement a step this step
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
declare class JobStepExecution {
    /**
     * Returns the ID of this step execution.
     */
    readonly ID: string;
    /**
     * Returns the job execution this step execution belongs to.
     */
    readonly jobExecution: JobExecution;
    /**
     * Returns the ID of the step this step execution belongs to.
     */
    readonly stepID: string;
    /**
     * Returns the ID of the step type of the step this step execution belongs to.
     */
    readonly stepTypeID: string;
    private constructor();
    /**
     * Returns the ID of this step execution.
     */
    getID(): string;
    /**
     * Returns the job execution this step execution belongs to.
     */
    getJobExecution(): JobExecution;
    /**
     * Returns the value of the parameter of the step this step execution belongs to.
     */
    getParameterValue(name: string): any;
    /**
     * Returns the ID of the step this step execution belongs to.
     */
    getStepID(): string;
    /**
     * Returns the ID of the step type of the step this step execution belongs to.
     */
    getStepTypeID(): string;
}

export = JobStepExecution;
