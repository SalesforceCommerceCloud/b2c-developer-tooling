/**
 * A Nested Diagnostic Context, or NDC in short, is an instrument to distinguish
 * interleaved log output from different sources. Log output is typically
 * interleaved when a server handles multiple script calls near-simultaneously.
 */
declare class LogNDC {
    private constructor();
    /**
     * Looks at the last diagnostic context at the top of this NDC without
     * removing it.
     * The returned value is the value that was pushed last. If no context is
     * available, then the empty string "" is returned.
     */
    peek(): string;
    /**
     * Clients should call this method before leaving a diagnostic context.
     * The returned value is the value that was pushed last.
     * If no context is available, then the empty string "" is returned.
     * NOTE: The NDC is removed after every script execution.
     */
    pop(): string;
    /**
     * Push new diagnostic context information for the current script execution.
     */
    push(message: string): void;
    /**
     * Remove the diagnostic context for this script call.
     */
    remove(): void;
}

export = LogNDC;
