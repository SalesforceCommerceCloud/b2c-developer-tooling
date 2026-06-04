import Writer = require('./Writer');
import File = require('./File');

/**
 * Convenience class for writing character files.
 * 
 * Files are stored in a shared file system where multiple processes could
 * access the same file. The client code is responsible for ensuring that no
 * more than one process writes to a file at a given time.
 * 
 * Note: when this class is used with sensitive data, be careful in persisting sensitive information to disk.
 */
declare class FileWriter extends Writer {
    /**
     * Get the current line separator (e.g. '\n' or '\r\n'), if no value is set the system default '\n' will be used.
     */
    lineSeparator: string;
    /**
     * Constructs the writer for the specified file. Uses "UTF-8" as encoding.
     * 
     * To release system resources, close the writer by calling close.
     */
    constructor(file: File);
    /**
     * Constructs the writer for the specified file. Optional file append mode
     * is supported. Uses "UTF-8" as encoding.
     * 
     * To release system resources, close the writer by calling close.
     */
    constructor(file: File, append: boolean);
    /**
     * Constructs the writer for the specified file with the specified encoding.
     * 
     * To release system resources, close the writer by calling close.
     */
    constructor(file: File, encoding: string);
    /**
     * Constructs the writer for the specified file with the specified encoding.
     * Optional file append mode is supported.
     * 
     * To release system resources, close the writer by calling close.
     */
    constructor(file: File, encoding: string, append: boolean);
    /**
     * Closes the writer.
     */
    close(): void;
    /**
     * Get the current line separator (e.g. '\n' or '\r\n'), if no value is set the system default '\n' will be used.
     */
    getLineSeparator(): string;
    /**
     * Set the line separator (e.g. '\n' or '\r\n'), if no value is set the system default '\n' will be used.
     */
    setLineSeparator(lineSeparator: string): void;
    /**
     * Writes the specified line and appends the line separator.
     */
    writeLine(str: string): void;
}

export = FileWriter;
