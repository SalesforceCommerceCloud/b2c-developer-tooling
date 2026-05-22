/**
 * Represents an evaluation error.
 */
declare class EvalError extends Error {
    /**
     * Constructs the error.
     */
    constructor();
    /**
     * Constructs the error with the
     * specified message.
     */
    constructor(msg: string);
}

export = EvalError;
