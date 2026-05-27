import File = require('./File');
import Bytes = require('../util/Bytes');

/**
 * Instances of this class support reading from a random access file. A random
 * access file behaves like a large array of bytes stored in the file system.
 * There is a kind of cursor, or index into the implied array, called the file
 * pointer. Read operations read bytes starting at the file pointer and advance
 * the file pointer past the bytes read. The file pointer can be read by the
 * getPosition method and set by the setPosition method.
 */
declare class RandomAccessFileReader {
    /**
     * The maximum number of bytes that a single call to readBytes can return == 10KB
     */
    static readonly MAX_READ_BYTES = 10240;
    /**
     * Returns the current offset in this file.
     * @throws IOException if an I/O error occurs.
     */
    position: number;
    /**
     * Construct a reader for random read access to the provided file.
     * 
     * To release system resources, close the reader by calling close.
     * @throws IOException If the given file object does not denote an existing regular file
     */
    constructor(file: File);
    /**
     * Closes this random access file reader and releases any system resources
     * associated with the stream.
     * @throws IOException if an I/O error occurs.
     */
    close(): void;
    /**
     * Returns the current offset in this file.
     * @throws IOException if an I/O error occurs.
     */
    getPosition(): number;
    /**
     * Returns the length of this file.
     * @throws IOException if an I/O error occurs.
     */
    length(): number;
    /**
     * Reads a signed eight-bit value from the file starting from the current
     * file pointer. Since the byte is interpreted as signed, the value returned
     * will always be between -128 and +127.
     * @throws IOException if an I/O error occurs or if this file has reached the end.
     */
    readByte(): number;
    /**
     * Reads up to n bytes from the file starting at the current file pointer.
     * If there are fewer than n bytes remaining in the file, then as many bytes
     * as possible are read. If no bytes remain in the file, then null is
     * returned.
     * @throws IOException if an I/O error occurs.
     * @throws IllegalArgumentException if numBytes <  0 or numBytes > MAX_READ_BYTES.
     */
    readBytes(numBytes: number): Bytes | null;
    /**
     * Sets the file-pointer offset, measured from the beginning of this file,
     * at which the next read occurs. The offset may be set beyond the end of
     * the file.
     * @throws IOException if position is less than 0 or if an I/O error occurs.
     */
    setPosition(position: number): void;
}

export = RandomAccessFileReader;
