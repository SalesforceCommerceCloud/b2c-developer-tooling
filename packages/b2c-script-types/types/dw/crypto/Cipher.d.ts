import CertificateRef = require('./CertificateRef');
import Bytes = require('../util/Bytes');
import KeyRef = require('./KeyRef');

/**
 * This class allows access to encryption services offered through the Java
 * Cryptography Architecture (JCA). At this time the implementation of the
 * encryption/decryption methods is based on the default JCE provider of the JDK.
 * See the Java documentation for a reference guide to the underlying security
 * provider and information about the Secure Sockets Extension.
 * 
 * You can find a good overview of the essential purposes of cryptography and
 * some common implementations in the Wikipedia article on cryptography.
 * Also see the website of the National Institute of Standards and Technology.
 * The format of various files used to hold keys, certificate signing requests,
 * and the like, as well as some related algorithms, are defined in the PKCS series of
 * documents published by RSALabs (the research arm of RSA Security).
 * 
 * Many internet standards documenting security protocols and concepts are described
 * in documents originally described as "Request For Comment" and thus widely known
 * as RFCs. Many of them are available on the Internet FAQ Archives website.
 * 
 * dw.crypto.Cipher is intentionally an Adapter to the full cryptography power supplied
 * in the security provider implementation.
 * 
 * Note: this class handles sensitive security-related data.
 * Pay special attention to PCI DSS v3 requirements 2, 4, and 12.
 */
declare class Cipher {
    /**
     * Strings containing keys, plain texts, cipher texts etc. are internally
     * converted into byte arrays using this encoding (currently UTF8).
     */
    static readonly CHAR_ENCODING = "UTF8";
    private constructor();
    /**
     * Decrypts the passed Base-64 encoded message using the passed key and
     * applying the transformations described by the passed parameters.
     * 
     * Decryption is the process of getting back the original data from the
     * cipher-text using a decryption key.
     */
    decrypt(base64Msg: string, key: string, transformation: string, saltOrIV: string, iterations: number): string;
    /**
     * Lower-level decryption API. Decrypts the passed bytes using the specified
     * key and applying the transformations described by the specified
     * parameters.
     * 
     * Typical usage:
     * @example
     * var base64Msg : String = "some_encoded_encrypted_message";
     * var charset : String = "UTF8";  // or "windows-1252", etc.
     * 
     * var encryptedBytes : Bytes = Encoding.fromBase64(base64Msg);
     * var messageBytes : Bytes = Cipher.decryptBytes(encryptedBytes, key, transformation, salt, iterations);
     * var message : String = messageBytes.toString(charset);
     * @see decrypt_1
     */
    decryptBytes(encryptedBytes: Bytes, key: string, transformation: string, saltOrIV: string, iterations: number): Bytes;
    /**
     * Encrypt the passed message by using the specified key and applying the
     * transformations described by the specified parameters.
     * 
     * Encryption is the process of converting normal data or plain text to
     * something incomprehensible or cipher-text by applying transformations,
     * which are the operation (or set of operations) to be performed on given input
     * to produce some output. A transformation always includes the name of a
     * cryptographic algorithm (for example, RSA) and may be followed by a mode and padding scheme.
     * The supported algorithms are listed in the parameter description below.
     * 
     * The cryptographic algorithms can be partitioned into symmetric
     * and asymmetric (or public key/private key).
     * 
     * Symmetric or "secret key" algorithms use the same key to encrypt
     * and to decrypt the data. Symmetric algorithms are what most people think
     * of as codes: using a well-known algorithm and a secret key to encode information,
     * which can be decoded using the same algorithm and the same key. The algorithm
     * is not secret, the secrecy is inherent to guarding the key. A significant
     * problem with symmetric ciphers is that it is difficult to transfer the keys
     * themselves securely. Symmetric algorithms include password-based algorithms.
     * 
     * AES with key length of 256 bits is the preferred choice for symmetric encryption going forward.
     * Please consider switching to it if you are using any other scheme or if using AES with a
     * shorter key length. The rest of the symmetric algorithms will be deprecated in the future.
     * 
     * Asymmetric or "public key" cryptography uses a public/private key pair, and then publishes the public key.
     * Only the holder of the private key will be able to decrypt.
     * The public key and private key together are also called a "key pair".
     * Data encrypted with one key can only be decrypted using the other key
     * from the pair, and it is not possible to deduce one key from the other.
     * This helps to solve the key distribution problem since it is possible to
     * publicise one of the keys widely (the "public key") and keep the other
     * a closely guarded secret (the "private key"). Many partners can then
     * send data encrypted with the public key, but only the holder of the
     * corresponding private key can decrypt it.
     * 
     * Key pairs for asymmetric ciphers can be generated with an arbitrary tool.
     * One of the most popular options is the open source tool OpenSSL.
     * OpenSSL has a command-line syntax and is available on major platforms.
     * 
     * The following steps are involved in creating an RSA key pair:
     * 
     * - Generate an RSA private key with keylength of 2048 bits. Store this key in a safe place.
     * 
     * ```
     * openssl genrsa -out rsaprivatekey.pem 2048
     * ```
     * 
     * - Generate a public key from the private key. You use the public key to encrypt messages with Cipher.encrypt. OpenSSL saves the key PEM-encoded; this means the key is saved with a base64 encoding. After you removed the header and footer lines you can pass the content directly to the API method.
     * 
     * ```
     * openssl rsa -in rsaprivatekey.pem -out publickey.pem -pubout
     * ```
     * 
     * - Generate a private key in PKCS#8 format. You use that key to decrypt messages with Cipher.decrypt. OpenSSL saves the key PEM-encoded; this means the key is saved with a base64 encoding. After you removed the header and footer lines you can pass the content directly to the API method.
     * 
     * ```
     * openssl pkcs8 -topk8 -in rsaprivatekey.pem -out privatekey.pem -nocrypt
     * ```
     * 
     * Modes
     * 
     * The following modes of operation are block cipher operations that
     * are used with some algorithms.
     * 
     * - "NONE" no mode
     * - "CBC" Cipher Block Chaining (defined in FIPS PUB 81)
     * - "CTR" Counter mode or Segmented Integer Counter mode (defined in FIPS PUB 81)
     * - "CTS" CipherText Streaming mode
     * - "CFB" Cipher Feedback Mode,  can be referred to with key
     * length referenced as "CFB8","CFB16","CFB24".."CFB64" (defined in FIPS PUB 81)
     * - "ECB" Electronic Cook book  as defined in: The National
     * Institute of Standards and Technology (NIST) Federal Information
     * Processing Standard (FIPS) PUB 81, "DES Modes of Operation,"
     * U.S. Department of Commerce, Dec 1980.
     * - "OFB" Output Feedback Mode, can be referred to with key
     * length referenced as "OFB8","OFB16","OFB24".."OFB64" (defined in FIPS PUB 81)
     * - "PCBC" Propagating Cipher Block Chaining (defined in Kerberos V4)
     * 
     * Paddings
     * 
     * - "NoPadding": No padding.
     * - OAEPWith<digest>And<mgf>Padding:
     * 
     * Optimal Asymmetric Encryption
     * Padding scheme defined in PKCS#1, where <digest> should be replaced
     * by the message digest and <mgf> by the mask generation function.
     * 
     * Examples: OAEPWITHSHA-256ANDMGF1PADDING, OAEPWITHSHA-384ANDMGF1PADDING, OAEPWITHSHA-512ANDMGF1PADDING
     * - ISO10126PADDING: the ISO10126-2:1991 DEA padding scheme
     * - PKCS1Padding: Public Key Cryptography Standard #1, a standard
     * for padding from RSA Laboratories that can encrypt messages up
     * to 11 bytes smaller than the modulus size in bytes.
     * - PKCS5Padding: Public Key Cryptography Standard #1, a standard
     * for padding from RSA Laboratories, "PKCS#5: Password-Based Encryption Standard," version 1.5, November 1993.
     * - SSL3Padding: The padding scheme defined in the SSL Protocol Version 3.0, November 18, 1996, section 5.2.3.2 (CBC block cipher)
     */
    encrypt(message: string, key: string, transformation: string, saltOrIV: string, iterations: number): string;
    /**
     * Lower-level encryption API. Encrypts the passed bytes by using the
     * specified key and applying the transformations described by the specified
     * parameters.
     * 
     * Typical usage:
     * @example
     * var message : String = "some_message";
     * var charset : String = "UTF8"; // or "windows-1252", etc.
     * 
     * // encrypt the message
     * var messageBytes : Bytes = new Bytes(message, charset);
     * var encryptedBytes : Bytes = Cipher.encryptBytes(messageBytes, key, transformation, salt, iterations);
     * var encrypted : String = Encoding.toBase64(encryptedBytes);
     * @see encrypt_1
     */
    encryptBytes(messageBytes: Bytes, key: string, transformation: string, saltOrIV: string, iterations: number): Bytes;
}

export = Cipher;
