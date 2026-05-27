import Bytes = require('../util/Bytes');

/**
 * Utility class which handles several common character encodings.
 */
declare class Encoding {
    private constructor();
    /**
     * Decode the given string which represents a sequence of characters encoded in base-64 to a byte array. This
     * operation supports both the base-64 and base-64 for URL formats. Characters not in the base-64 alphabet are
     * ignored. An exception is thrown if a null value is passed.
     * 
     * Note: This decoding operation is limited to the maximum number of bytes that a Bytes object can hold. See
     * dw.util.Bytes.
     */
    static fromBase64(string: string): Bytes;
    /**
     * Converts a String representing hexadecimal values into an array of bytes
     * of those same values. The returned byte array will be half the length of
     * the passed, as it takes two characters to represent any given byte. An
     * exception is thrown if the passed string has an odd number of character
     * or if any characters in the string are not valid hexadecimal characters.
     * An exception is thrown if a null value is passed.
     * 
     * Note: This decoding operation is limited to the maximum number of bytes
     * that a Bytes object can hold. See dw.util.Bytes.
     */
    static fromHex(string: string): Bytes;
    /**
     * Decodes a URL safe string into its original form. Escaped characters are
     * converted back to their original representation. An exception is thrown
     * if URL decoding is unsuccessful or if null is passed.
     */
    static fromURI(string: string): string;
    /**
     * Decodes a URL safe string into its original form using the specified
     * encoding. Escaped characters are converted back to their original
     * representation. An exception is thrown if URL decoding is unsuccessful or
     * if the specified encoding is unsupported or if null is passed for either
     * argument.
     */
    static fromURI(string: string, encoding: string): string;
    /**
     * Convert the given byte array to a string encoded in base-64.  This method
     * does not chunk the data by adding line breaks.  An exception is thrown
     * if a null value is passed.
     */
    static toBase64(bytes: Bytes): string;
    /**
     * Convert the given byte array to a string encoded in base-64 for URLs.  This method does not chunk the data by
     * adding line breaks and it does not add any padding.  An exception is thrown if a null value is passed.
     */
    static toBase64URL(bytes: Bytes): string;
    /**
     * Converts an array of bytes into a string representing the hexadecimal
     * values of each byte in order. The returned string will be double the
     * length of the passed array, as it takes two characters to represent any
     * given byte. An exception is thrown if a null value is passed.
     */
    static toHex(bytes: Bytes): string;
    /**
     * Encodes a string into its URL safe form according to the
     * "application/x-www-form-urlencoded" encoding scheme using the default
     * encoding. Unsafe characters are escaped. An exception is thrown if a null
     * value is passed.
     */
    static toURI(string: string): string;
    /**
     * Encodes a string into its URL safe form according to the
     * "application/x-www-form-urlencoded" encoding scheme using the specified
     * encoding. Unsafe characters are escaped. An exception is thrown if the
     * specified encoding is unsupported. An exception is thrown if either
     * argument is null.
     */
    static toURI(string: string, encoding: string): string;
}

export = Encoding;
