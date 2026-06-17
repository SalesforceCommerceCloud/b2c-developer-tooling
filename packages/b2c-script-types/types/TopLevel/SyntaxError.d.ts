/**
 * Represents a syntax error.
 */
declare class SyntaxError extends Error {
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

export = SyntaxError;
