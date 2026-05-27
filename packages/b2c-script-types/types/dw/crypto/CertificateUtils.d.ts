import X509Certificate = require('./X509Certificate');
import CertificateRef = require('./CertificateRef');
import KeyRef = require('./KeyRef');

/**
 * Utilities for managing certificates and keys.
 */
declare class CertificateUtils {
    private constructor();
    /**
     * Gets the certificate from the given certificate reference.
     * @throws Exception if the reference is invalid or does not refer to an X.509 certificate
     */
    static getCertificate(certificateRef: CertificateRef): X509Certificate;
    /**
     * Gets the public certificate from the given private key reference.
     * @throws Exception if the reference is invalid or there is no X.509 certificate
     */
    static getCertificate(keyRef: KeyRef): X509Certificate;
    /**
     * Encode the certificate to the base64-encoded DER format.
     */
    static getEncodedCertificate(certificateRef: CertificateRef): string;
    /**
     * Gets the public key from the given certificate reference.
     * 
     * It is exported in the standard X.509 SubjectPublicKeyInfo format and base64-encoded.
     */
    static getEncodedPublicKey(certificateRef: CertificateRef): string;
    /**
     * Parse the certificate from the base64-encoded DER format.
     */
    static parseEncodedCertificate(certificate: string): CertificateRef;
    /**
     * Parse the public key from the given key in X.509 SubjectPublicKeyInfo format.
     * 
     * The resulting reference contains only the public key. It can be used for cryptographic operations, but not
     * anything that requires the full certificate.
     */
    static parseEncodedPublicKey(algorithm: string, encodedKey: string): CertificateRef;
    /**
     * Parse the public key from the given base64-encoded JWK string.
     * 
     * This returns the public key portion of the JWK, not the `x5c` certificate chain.
     * 
     * Only RSA and EC keys are supported.
     * 
     * The resulting reference contains only the public key. It can be used for cryptographic operations, but not
     * anything that requires the full certificate.
     */
    static parsePublicKeyFromJWK(jwk: string): CertificateRef;
}

export = CertificateUtils;
