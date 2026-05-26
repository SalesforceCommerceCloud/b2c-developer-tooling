import KeyRef = require('./KeyRef');
import Bytes = require('../util/Bytes');
import CertificateRef = require('./CertificateRef');

/**
 * This API provides access to Deprecated algorithms.
 * 
 * See Signature for full documentation. WeakSignature is simply a drop-in replacement that only supports
 * deprecated algorithms. This is helpful when you need to deal with weak algorithms for backward compatibility
 * purposes, but Signature should always be used for new development and for anything intended to be secure.
 * 
 * This class allows access to signature services offered through the Java Cryptography Architecture (JCA). At this time
 * the signature/verification implementation of the methods is based on the default RSA JCE provider of the JDK -
 * sun.security.rsa.SunRsaSign
 * 
 * dw.crypto.WeakSignature is an adapter to the security provider implementation and only covers one digest algorithm:
 * 
 * - SHA1withRSA
 * 
 * Note: this class handles sensitive security-related data. Pay special attention to PCI DSS v3. requirements 2,
 * 4, 12, and other relevant requirements.
 */
declare class WeakSignature {
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

export = WeakSignature;
