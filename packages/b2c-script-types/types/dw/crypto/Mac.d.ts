import Bytes = require('../util/Bytes');

/**
 * This class provides the functionality of a "Message Authentication Code" (MAC) algorithm.
 * A MAC provides a way to check the integrity of information transmitted over or
 * stored in an unreliable medium, based on a secret key.
 * Typically, message authentication codes are used between two parties
 * that share a secret key in order to validate information transmitted between these parties.
 * A MAC mechanism that is based on cryptographic hash functions is referred to as HMAC.
 * HMAC can be used with any cryptographic hash function, e.g., SHA256,
 * in combination with a secret shared key. HMAC is specified in RFC 2104.
 * 
 * Note: this class handles sensitive security-related data.
 * Pay special attention to PCI DSS v3. requirements 2, 4, and 12.
 */
declare class Mac {
    /**
     * Constant representing the HMAC-MD5 keyed-hashing algorithm as defined in RFC 2104 "HMAC: Keyed-Hashing for Message Authentication" (February 1997).
     * This algorithm uses as MD5 cryptographic hash function.
     * @deprecated This algorithm is obsolete and and has been deprecated. Please use HmacSHA256, HmacSHA384 or HmacSHA512.
     */
    static readonly HMAC_MD5 = "HmacMD5";
    /**
     * Constant representing the HmacSHA1 algorithms as defined in RFC 2104 "HMAC: Keyed-Hashing for Message Authentication" (February 1997)
     * with SHA-1 as the message digest algorithm.
     * @deprecated This algorithm is obsolete and and has been deprecated. Please use HmacSHA256, HmacSHA384 or HmacSHA512.
     */
    static readonly HMAC_SHA_1 = "HmacSHA1";
    /**
     * Constant representing the HmacSHA256 algorithms as defined in RFC 2104 "HMAC: Keyed-Hashing for Message Authentication" (February 1997)
     * with SHA-256 as the message digest algorithm.
     */
    static readonly HMAC_SHA_256 = "HmacSHA256";
    /**
     * Constant representing the HmacSHA384 algorithms as defined in RFC 2104 "HMAC: Keyed-Hashing for Message Authentication" (February 1997)
     * with SHA-384 as the message digest algorithm.
     */
    static readonly HMAC_SHA_384 = "HmacSHA384";
    /**
     * Constant representing the HmacSHA512 algorithms as defined in RFC 2104 "HMAC: Keyed-Hashing for Message Authentication" (February 1997)
     * with SHA-512 as the message digest algorithm.
     */
    static readonly HMAC_SHA_512 = "HmacSHA512";
    /**
     * Construct a Mac encryption instance with the specified algorithm name. The
     * supported algorithms are:
     * 
     * - SHA 256
     * - SHA 384
     * - SHA 512
     * @throws NullArgumentException if algorithm is null.
     * @throws IllegalArgumentException if the specified algorithm name is not supported.
     */
    constructor(algorithm: string);
    /**
     * Computes the hash value for the passed string input using the passed secret key.
     * Given input and the given key will be first converted with UTF-8 encoding into a byte array.
     * The resulting hash is typically converted with base64 back into a string.
     * @throws IllegalArgumentException if algorithm is not null and the specified algorithm name is not supported.
     */
    digest(input: string, key: string): Bytes;
    /**
     * Computes the hash value for the passed string input using the passed secret key.
     * Given input will be first converted with UTF-8 encoding into a byte array.
     * The resulting hash is typically converted with base64 back into a string.
     * @throws IllegalArgumentException if algorithm is not null and the specified algorithm name is not supported.
     */
    digest(input: string, key: Bytes): Bytes;
    /**
     * Computes the hash value for the passed bytes input using the passed secret key.
     * @throws IllegalArgumentException if algorithm is not null and the specified algorithm name is not supported.
     */
    digest(input: Bytes, key: Bytes): Bytes;
}

export = Mac;
