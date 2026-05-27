/**
 * Represents a reference error.
 */
declare class ReferenceError extends Error {
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

export = ReferenceError;
