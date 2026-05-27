import KeyRef = require('./KeyRef');
import Bytes = require('../util/Bytes');
import CertificateRef = require('./CertificateRef');

/**
 * 
 * This class allows access to signature services offered through the Java
 * Cryptography Architecture (JCA). At this time the signature/verification implementation of the
 * methods is based on the default RSA JCE provider of the JDK - sun.security.rsa.SunRsaSign
 * 
 * dw.crypto.Signature is an adapter to the security provider implementation
 * and covers several digest algorithms:
 * 
 * - SHA1withRSA (deprecated)
 * - SHA256withRSA
 * - SHA384withRSA
 * - SHA512withRSA
 * - SHA256withRSA/PSS
 * - SHA384withRSA/PSS
 * - SHA512withRSA/PSS
 * - SHA256withECDSA
 * - SHA384withECDSA
 * - SHA512withECDSA
 * 
 * Key size generally ranges between 512 and 65536 bits (the latter of which is unnecessarily large).
 * 
 * Default key size for RSA is 1024. SHA384withRSA and SHA512withRSA require a key with length of at least 1024 bits.
 * 
 * For ECDSA, the following key sizes are supported:
 * 
 * - SHA256withECDSA: 256-bit key (NIST P-256)
 * - SHA384withECDSA: 384-bit key (NIST P-384)
 * - SHA512withECDSA: 521-bit key (NIST P-521)
 * 
 * When choosing a key size - beware of the tradeoff between security and processing time:
 * 
 * The longer the key, the harder to break it but also it takes more time for the two sides to sign and verify the signature.
 * 
 * An exception will be thrown for keys shorter than 2048 bits in this version of the API.
 * 
 * Note: this class handles sensitive security-related data.
 * Pay special attention to PCI DSS v3. requirements 2, 4, 12, and other relevant requirements.
 */
declare class Signature {
    /**
     * Supported digest algorithms exposed as a string array
     */
    static readonly SUPPORTED_DIGEST_ALGORITHMS_AS_ARRAY: string[];
    private constructor();
    /**
     * Checks to see if a digest algorithm is supported
     */
    isDigestAlgorithmSupported(digestAlgorithm: string): boolean;
    /**
     * Signs a string and returns a string
     */
    sign(contentToSign: string, privateKey: string, digestAlgorithm: string): string;
    /**
     * Signs a string and returns a string
     */
    sign(contentToSign: string, privateKey: KeyRef, digestAlgorithm: string): string;
    /**
     * Signs bytes and returns bytes
     */
    signBytes(contentToSign: Bytes, privateKey: string, digestAlgorithm: string): Bytes;
    /**
     * Signs bytes and returns bytes
     */
    signBytes(contentToSign: Bytes, privateKey: KeyRef, digestAlgorithm: string): Bytes;
    /**
     * Verifies a signature supplied as bytes
     */
    verifyBytesSignature(signature: Bytes, contentToVerify: Bytes, publicKey: string, digestAlgorithm: string): boolean;
    /**
     * Verifies a signature supplied as bytes
     */
    verifyBytesSignature(signature: Bytes, contentToVerify: Bytes, certificate: CertificateRef, digestAlgorithm: string): boolean;
    /**
     * Verifies a signature supplied as string
     */
    verifySignature(signature: string, contentToVerify: string, publicKey: string, digestAlgorithm: string): boolean;
    /**
     * Verifies a signature supplied as string
     */
    verifySignature(signature: string, contentToVerify: string, certificate: CertificateRef, digestAlgorithm: string): boolean;
}

export = Signature;
