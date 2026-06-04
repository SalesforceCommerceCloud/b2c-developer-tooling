import File = require('../io/File');
import Bytes = require('../util/Bytes');

/**
 * This represents a part in a multi-part HTTP POST request.
 * 
 * A part always has a name and value. The value may be a String, Bytes, or the contents of a File.
 * 
 * A character encoding may be specified for any of these, and the content type and a file name may additionally be
 * specified for the Bytes and File types.
 * 
 * Note: when this class is used with sensitive data, be careful in persisting sensitive information.
 */
declare class HTTPRequestPart {
    /**
     * Get the Bytes value of the part.
     */
    readonly bytesValue: Bytes | null;
    /**
     * Returns the content type of this part.
     */
    readonly contentType: string | null;
    /**
     * Get the charset to be used to encode the string.
     */
    readonly encoding: string | null;
    /**
     * Get the file name to use when sending a file part.
     */
    readonly fileName: string | null;
    /**
     * Get the file value of the part.
     */
    readonly fileValue: File | null;
    /**
     * Get the name of the part.
     */
    readonly name: string;
    /**
     * Get the string value of the part.
     */
    readonly stringValue: string | null;
    /**
     * Construct a part representing a simple string name/value pair. The HTTP
     * message uses "US-ASCII" as the default character set for the part.
     */
    constructor(name: string, value: string);
    /**
     * Construct a part representing a simple string name/value pair. The HTTP
     * message uses the specified encoding or "US-ASCII" if null is passed
     * for the part.
     */
    constructor(name: string, value: string, encoding: string);
    /**
     * Construct a part representing a name/File pair. The HTTP message will use
     * "application/octet-stream" as the content type and "ISO-8859-1" as the character
     * set for the part.
     */
    constructor(name: string, file: File);
    /**
     * Construct a part representing a name/bytes pair. The HTTP message will use
     * "application/octet-stream" as the content type without a character set.
     */
    constructor(name: string, data: Bytes);
    /**
     * Construct a part representing a name/File pair.
     * 
     * - If both contentType and encoding are null, then the part will be defaulted to use "application/octet-stream"
     * as the content-type without an encoding.
     * - If only the encoding is null, then the contentType will be used without an encoding.
     * - If only the contentType is null, then it will be defaulted to "text/plain".
     */
    constructor(name: string, data: Bytes, contentType: string | null, encoding: string | null, fileName: string | null);
    /**
     * Construct a part representing a name/File pair.
     * 
     * - If both contentType and encoding are null, then the part will be defaulted to use "application/octet-stream"
     * as the content-type and "ISO-8859-1" as the encoding.
     * - If only the encoding is null, then the contentType will be used without an encoding.
     * - If only the contentType is null, then it will be defaulted to "text/plain".
     */
    constructor(name: string, file: File, contentType: string | null, encoding: string | null);
    /**
     * Construct a part representing a name/File pair.
     * 
     * - If both contentType and encoding are null, then the part will be defaulted to use "application/octet-stream"
     * as the content-type and "ISO-8859-1" as the encoding.
     * - If only the encoding is null, then the contentType will be used without an encoding.
     * - If only the contentType is null, then it will be defaulted to "text/plain".
     */
    constructor(name: string, file: File, contentType: string | null, encoding: string | null, fileName: string | null);
    /**
     * Get the Bytes value of the part.
     */
    getBytesValue(): Bytes | null;
    /**
     * Returns the content type of this part.
     */
    getContentType(): string | null;
    /**
     * Get the charset to be used to encode the string.
     */
    getEncoding(): string | null;
    /**
     * Get the file name to use when sending a file part.
     */
    getFileName(): string | null;
    /**
     * Get the file value of the part.
     */
    getFileValue(): File | null;
    /**
     * Get the name of the part.
     */
    getName(): string;
    /**
     * Get the string value of the part.
     */
    getStringValue(): string | null;
}

export = HTTPRequestPart;
