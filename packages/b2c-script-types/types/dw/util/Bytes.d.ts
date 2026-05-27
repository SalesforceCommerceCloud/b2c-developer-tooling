/**
 * A simple immutable class representing an array of bytes, used for working
 * with binary data in a scripting context.
 * 
 * It acts as a view to TopLevel.ArrayBuffer. The buffer can be accessed through asUint8Array.
 * 
 * Limitation:
 * The size of the resulting byte representation is limited by the quota api.jsArrayBufferSize that is defining the max size for a TopLevel.ArrayBuffer.
 */
declare class Bytes {
    /**
     * The maximum number of bytes that a Bytes object can represent == 10KB
     * @deprecated No longer used by the Bytes class.
     */
    static readonly MAX_BYTES = 10240;
    /**
     * Returns the number of bytes represented by this object.
     */
    readonly length: number;
    /**
     * Construct a Bytes object from the given TopLevel.ArrayBuffer or view. The bytes object also acts as a
     * view on the underlying TopLevel.ArrayBuffer. If a view is given that makes only a part of the storage
     * array visible then this Bytes object will also make only the same part visible. The storage data is not copied.
     * @since 21.2
     */
    constructor(arrayBufferOrView: any);
    /**
     * Construct a Bytes object from the given string using the default
     * encoding. Convenience for Bytes( string, "UTF-8" ).
     * @throws IllegalArgumentException If the encoded byte sequence exceeds the maximum number of bytes.
     */
    constructor(string: string);
    /**
     * Construct a Bytes object from the given string using the given encoding.
     * This method always replaces malformed input and unmappable character
     * sequences with encoding defaults.
     * @throws IllegalArgumentException If the named encoding is not supported or if the encoded byte sequence exceeds the maximum number of bytes.
     */
    constructor(string: string, encoding: string | null);
    /**
     * Returns a TopLevel.Uint8Array based on the TopLevel.ArrayBuffer used for this Bytes object.
     * Changes to the returned TopLevel.ArrayBuffer will be visible in the Bytes object.
     * @since 21.2
     */
    asUint8Array(): Object;
    /**
     * Returns the value of the byte at position index as an integer. If index
     * is out of range an exception is thrown. The byte is interpreted as signed
     * and so the value returned will always be between -128 and +127.
     * @throws IndexOutOfBoundsException If the index argument is negative or not less than the length of this byte array.
     */
    byteAt(index: number): number;
    /**
     * Return a new Bytes object containing the subsequence of this object's bytes specified by the index and length
     * parameters. The returned object is a new view onto the same data, no data is copied.
     * @throws ArrayIndexOutOfBoundsException If index  <  0 or index  >  getLength() or index + length  > getLength()
     * @throws IllegalArgumentException If length  <  0
     */
    bytesAt(index: number, length: number): Bytes;
    /**
     * Returns the number of bytes represented by this object.
     */
    getLength(): number;
    /**
     * Absolute get method for reading a signed integer value (32 bit) in
     * network byte order(= big endian).
     * @throws IndexOutOfBoundsException If index is negative or not smaller than the number of bytes minus three.
     */
    intAt(index: number): number;
    /**
     * Return a new Bytes object which has the same bytes as this one in reverse
     * order.
     */
    reverse(): Bytes;
    /**
     * Absolute get method for reading a signed short value (16 bit) in network
     * byte order(= big endian).
     * @throws IndexOutOfBoundsException If index is negative or not smaller than the number of bytes minus one.
     */
    shortAt(index: number): number;
    /**
     * Constructs a new String by decoding this array of bytes using the
     * default encoding. Convenience for toString( "UTF-8" ).
     * Limitation:
     * The method is protected by the quota api.jsStringLength that prevents creation of too long strings.
     */
    toString(): string;
    toString(): string;
    /**
     * Constructs a new String by decoding this array of bytes using the
     * specified encoding.
     * Limitation:
     * The method is protected by the quota api.jsStringLength that prevents creation of too long strings.
     * @throws IllegalArgumentException If the named encoding is not supported.
     */
    toString(encoding: string): string;
}

export = Bytes;
