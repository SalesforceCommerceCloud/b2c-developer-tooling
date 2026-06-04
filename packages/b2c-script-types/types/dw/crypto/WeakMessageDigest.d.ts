import Bytes = require('../util/Bytes');

/**
 * This API provides access to Deprecated algorithms.
 * 
 * See MessageDigest for full documentation. WeakMessageDigest is simply a drop-in replacement that only supports
 * deprecated algorithms. This is helpful when you need to deal with weak algorithms for backward
 * compatibility purposes, but MessageDigest should always be used for new development and for anything intended to be secure.
 * 
 * Note: this class handles sensitive security-related data.
 * Pay special attention to PCI DSS v3. requirements 2, 4, and 12.
 */
declare class WeakMessageDigest {
    /**
     * Constant representing the MD2 algorithm.
     * 
     * This algorithm is obsolete. Do not use it for any sensitive data
     */
    static readonly DIGEST_MD2 = "MD2";
    /**
     * Constant representing the MD5 algorithm.
     * 
     * This algorithm is obsolete. Do not use it for any sensitive data
     */
    static readonly DIGEST_MD5 = "MD5";
    /**
     * Constant representing the SHA algorithm.
     * 
     * This algorithm is obsolete. Do not use it for any sensitive data
     */
    static readonly DIGEST_SHA = "SHA";
    /**
     * Constant representing the SHA 1 algorithm.
     * 
     * This algorithm is obsolete. Do not use it for any sensitive data
     */
    static readonly DIGEST_SHA_1 = "SHA-1";
    /**
     * Construct a MessageDigest with the specified algorithm name.
     */
    constructor(algorithm: string);
    /**
     * Digests the passed string and returns a computed hash value as a string.
     * The passed String is first encoded into a sequence of bytes using the
     * platform's default encoding. The digest then performs any prerequisite
     * padding, before computing the hash value. The hash is then converted into
     * a string by converting all digits to hexadecimal.
     * @deprecated Deprecated because the conversion of the input to bytes using
     * the default platform encoding and the hex-encoded return
     * value are not generally appropriate.
     */
    digest(input: string): string;
    /**
     * Computes the hash value for the passed array of bytes. The algorithm
     * argument is optional. If null, then the algorithm established at
     * construction time is used.
     * 
     * The binary representation of the message is typically derived from a
     * string and the resulting hash is typically converted with base64 back
     * into a string. Example:
     * 
     * `
     * Encoding.toBase64( digest( "MD5", new Bytes( "my password", "UTF-8" ) ) );
     * `
     * @deprecated Deprecated because the digest algorithm should be the one
     * set in the constructor.
     */
    digest(algorithm: string | null, input: Bytes): Bytes;
    /**
     * Completes the hash computation by performing final operations such as
     * padding.
     * 
     * The binary representation of the message is typically derived from a
     * string and the resulting hash is typically converted with base64 back
     * into a string. Example:
     * 
     * `
     * Encoding.toBase64( digest() );
     * `
     */
    digest(): Bytes;
    /**
     * Computes the hash value for the passed dw.util.Bytes.
     * 
     * The binary representation of the message is typically derived from a
     * string and the resulting hash is typically converted with base64 back
     * into a string. Example:
     * 
     * `
     * Encoding.toBase64( digest( new Bytes( "my password", "UTF-8" ) ) );
     * `
     */
    digestBytes(input: Bytes): Bytes;
    /**
     * Updates the digest using the passed dw.util.Bytes.
     */
    updateBytes(input: Bytes): void;
}

export = WeakMessageDigest;
