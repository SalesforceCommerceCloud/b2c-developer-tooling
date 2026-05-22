import OutputStream = require('./OutputStream');

/**
 * The class supports writing characters to a stream.
 * 
 * Note: when this class is used with sensitive data, be careful in persisting sensitive information to disk.
 */
declare class Writer {
    /**
     * Create a writer from a stream using UTF-8 character encoding.
     */
    constructor(stream: OutputStream);
    /**
     * Create a writer from a stream using the specified character encoding.
     */
    constructor(stream: OutputStream, encoding: string);
    /**
     * Closes the writer.
     */
    close(): void;
    /**
     * Flushes the buffer.
     */
    flush(): void;
    /**
     * Write the given string to the stream.
     */
    write(str: string): void;
    /**
     * Write the given string to the stream.
     */
    write(str: string, off: number, len: number): void;
}

export = Writer;
