/**
 * Represents the an internal error.
 */
declare class InternalError extends Error {
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

export = InternalError;
