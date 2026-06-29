import CertificateRef = require('./CertificateRef');
import Bytes = require('../util/Bytes');
import KeyRef = require('./KeyRef');

/**
 * This API provides access to Deprecated algorithms.
 * 
 * See Cipher for full documentation. WeakCipher is simply a drop-in replacement that only supports
 * deprecated algorithms and key lengths. This is helpful when you need to deal with weak algorithms for backward
 * compatibility purposes, but Cipher should always be used for new development and for anything intended to be secure.
 * 
 * Note: this class handles sensitive security-related data. Pay special attention to PCI DSS v3 requirements 2,
 * 4, and 12.
 */
declare class WeakCipher {
    /**
     * Strings containing keys, plain texts, cipher texts etc. are internally
     * converted into byte arrays using this encoding (currently UTF8).
     */
    static readonly CHAR_ENCODING = "UTF8";
    private constructor();
    /**
     * Decrypts the message using the given parameters. See
     * Cipher.decrypt_1 for full documentation.
     */
    decrypt(base64Msg: string, key: string, transformation: string, saltOrIV: string, iterations: number): string;
    /**
     * Lower-level decryption API. Decrypts the passed bytes using the specified
     * key and applying the transformations described by the specified
     * parameters. See Cipher.decryptBytes_1 for full
     * documentation.
     * @see decrypt_1
     */
    decryptBytes(encryptedBytes: Bytes, key: string, transformation: string, saltOrIV: string, iterations: number): Bytes;
    /**
     * Encrypt the passed message by using the specified key and applying the
     * transformations described by the specified parameters.
     * 
     * See Cipher.encrypt_1 for full documentation.
     */
    encrypt(message: string, key: string, transformation: string, saltOrIV: string, iterations: number): string;
    /**
     * Lower-level encryption API. Encrypts the passed bytes by using the specified key and applying the transformations
     * described by the specified parameters. See Cipher.encryptBytes_1
     * for full documentation.
     * @see encrypt_1
     */
    encryptBytes(messageBytes: Bytes, key: string, transformation: string, saltOrIV: string, iterations: number): Bytes;
}

export = WeakCipher;
