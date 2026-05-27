import Writer = require('./Writer');

/**
 * The class writes a CSV file.
 * 
 * Note: when this class is used with sensitive data, be careful in persisting sensitive information to disk.
 */
declare class CSVStreamWriter {
    /**
     * Create a new CSVStreamWriter with a ',' as separator and '"'
     * as quote character.
     */
    constructor(writer: Writer);
    /**
     * Create a new CSVStreamWriter with the specified separator and '"'
     * as quote character.
     */
    constructor(writer: Writer, separator: string);
    /**
     * Create a new CSVStreamWriter with the specified separator and the
     * specified quote character.
     */
    constructor(writer: Writer, separator: string, quote: string);
    /**
     * Closes the underlying writer.
     */
    close(): void;
    /**
     * Write a single line to the CSV file.
     */
    writeNext(...line: string[]): void;
}

export = CSVStreamWriter;
