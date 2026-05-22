import Reader = require('./Reader');
import File = require('./File');

/**
 * File reader class.
 */
declare class FileReader extends Reader {
    /**
     * Constructs the reader.
     * 
     * To release system resources, close the reader by calling close.
     */
    constructor(file: File);
    /**
     * Constructs the reader.
     * 
     * To release system resources, close the reader by calling close.
     */
    constructor(file: File, encoding: string);
    /**
     * Closes the reader.
     */
    close(): void;
}

export = FileReader;
