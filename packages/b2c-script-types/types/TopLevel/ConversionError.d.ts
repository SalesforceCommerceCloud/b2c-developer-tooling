/**
 * Represents a conversion error.
 */
declare class ConversionError extends Error {
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

export = ConversionError;
