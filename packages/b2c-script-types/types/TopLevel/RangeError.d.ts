/**
 * Represents a range error.
 */
declare class RangeError extends Error {
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

export = RangeError;
