import Writer = require('./Writer');

/**
 * A Writer that can be used to generate a String.
 * 
 * In most cases it is not necessary to use StringWriter. If the final
 * destination of the output is a file, use dw.io.FileWriter directly.
 * This will help to reduce memory usage. If you wish to transfer a feed to a
 * remote FTP, SFTP or WebDAV server, first write the feed to the file system
 * using FileWriter and optionally dw.io.CSVStreamWriter or
 * dw.io.XMLStreamWriter, then upload the file with
 * dw.net.FTPClient.putBinary,
 * dw.net.SFTPClient.putBinary, or
 * dw.net.WebDAVClient.put.
 * 
 * Note: when this class is used with sensitive data, be careful in persisting sensitive information to disk.
 */
declare class StringWriter extends Writer {
    /**
     * Creates a new StringWriter.
     */
    constructor();
    /**
     * Returns a string representation of this writer.
     */
    toString(): string;
    write(str: string, off: number, len: number): void;
    /**
     * Write the given string to the stream.
     */
    write(str: string): void;
    write(str: string): void;
    /**
     * Write the given string to the stream.
     */
    write(str: string, off: number, len: number): void;
}

export = StringWriter;
