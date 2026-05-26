import InputStream = require('./InputStream');
import List = require('../util/List');

/**
 * The class supports reading characters from a stream.
 */
declare class Reader {
    /**
     * The method reads the whole input stream, parses it and returns a list of strings.
     * 
     * Using this method on large feeds is inherently unsafe and may lead to an out-of-memory condition. Instead use
     * method readLine and process one line at a time.
     * @deprecated Use readLines
     */
    readonly lines: List<string>;
    /**
     * The method reads the whole input stream as one string and returns it.
     * 
     * Using this method is unsafe if the length of the input stream is not known and may lead to an out-of-memory
     * condition. Instead use method readN.
     * @throws IOException if something went wrong while reading from the underlying stream
     * @deprecated Use readString
     */
    readonly string: string;
    /**
     * Creates a reader from a string.
     */
    constructor(source: string);
    /**
     * Create a reader from a stream using UTF-8 character encoding.
     */
    constructor(stream: InputStream);
    /**
     * Create a reader from a stream using the specified character encoding.
     */
    constructor(stream: InputStream, encoding: string);
    /**
     * Closes the reader.
     */
    close(): void;
    /**
     * The method reads the whole input stream, parses it and returns a list of strings.
     * 
     * Using this method on large feeds is inherently unsafe and may lead to an out-of-memory condition. Instead use
     * method readLine and process one line at a time.
     * @deprecated Use readLines
     */
    getLines(): List<string>;
    /**
     * The method reads the whole input stream as one string and returns it.
     * 
     * Using this method is unsafe if the length of the input stream is not known and may lead to an out-of-memory
     * condition. Instead use method readN.
     * @throws IOException if something went wrong while reading from the underlying stream
     * @deprecated Use readString
     */
    getString(): string;
    /**
     * Reads a single character from the stream. The method returns null if the end of the stream is reached.
     */
    read(): string | null;
    /**
     * Reads multiple characters from the stream as string. The actual number of characters that were read can be
     * determined from the length of the returned string. If the end of the stream is reached and no more characters can
     * be read, the method exits with an exception.
     * @throws an exception if the stream is exhausted
     * @deprecated use readN instead which does not throw an exception if the stream is exhausted
     */
    read(length: number): string;
    /**
     * Reads the next line.
     */
    readLine(): string | null;
    /**
     * The method reads the whole input stream, parses it and returns a list of strings.
     * 
     * Using this method on large feeds is inherently unsafe and may lead to an out-of-memory condition. Instead use
     * method readLine and process one line at a time.
     */
    readLines(): List<string>;
    /**
     * Reads n characters from the stream as string. The actual number of characters that were read can be determined
     * from the length of the returned string. If the end of the stream is reached and no more characters can be read,
     * the method returns null.
     */
    readN(n: number): string | null;
    /**
     * The method reads the whole input stream as one string and returns it.
     * 
     * Using this method is unsafe if the length of the input stream is not known and may lead to an out-of-memory
     * condition. Instead use method readN.
     * @throws IOException if something went wrong while reading from the underlying stream
     */
    readString(): string;
    /**
     * Identifies if this stream is ready to be read.
     */
    ready(): boolean;
    /**
     * Skips the specified number of characters in the stream.
     */
    skip(n: number): void;
}

export = Reader;
