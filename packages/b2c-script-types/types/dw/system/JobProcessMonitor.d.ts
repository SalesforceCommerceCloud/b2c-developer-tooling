/**
 * Reserved for future use.
 */
declare class JobProcessMonitor {
    /**
     * Reserved for future use. Gets the total work count.
     */
    totalWork: number;
    /**
     * Reserved for future use. Gets the work message.
     */
    workMessage: string;
    private constructor();
    /**
     * Reserved for future use. Gets the total work count.
     */
    getTotalWork(): number;
    /**
     * Reserved for future use. Gets the work message.
     */
    getWorkMessage(): string;
    /**
     * Reserved for future use. Sets the total work count.
     */
    setTotalWork(totalWork: number): void;
    /**
     * Reserved for future use. Sets the work message.
     */
    setWorkMessage(msg: string): void;
    /**
     * Reserved for future use. Increments the count of work items by the value of the specified
     * parameter.
     */
    worked(worked: number): void;
}

export = JobProcessMonitor;
