import CertificateRef = require('./CertificateRef');

/**
 * Represents an X.509 public key certificate as defined in RFC 5280.
 * 
 * It provides access to the standard fields of an X.509 certificate including version, serial number, validity period,
 * distinguished names, and signature algorithm.
 */
declare class X509Certificate extends CertificateRef {
    /**
     * Returns the X.500 distinguished name of the entity that signed this certificate.
     */
    readonly issuerDN: string;
    /**
     * Returns the end date of the certificate validity period.
     */
    readonly notAfter: Date;
    /**
     * Returns the start date of the certificate validity period.
     */
    readonly notBefore: Date;
    /**
     * Returns the certificate serial number in string format. The serial number is a unique positive integer assigned
     * by the CA to each certificate.
     */
    readonly serialNumber: string;
    /**
     * Returns the algorithm used to sign this certificate. The name follows the format defined in RFC 5280 (e.g.,
     * "SHA256withRSA", "SHA384withECDSA").
     */
    readonly sigAlgName: string;
    /**
     * Returns the X.500 distinguished name of the entity this certificate belongs to.
     */
    readonly subjectDN: string;
    /**
     * Returns the X.509 certificate version number.
     */
    readonly version: number;
    private constructor();
    /**
     * Returns the X.500 distinguished name of the entity that signed this certificate.
     */
    getIssuerDN(): string;
    /**
     * Returns the end date of the certificate validity period.
     */
    getNotAfter(): Date;
    /**
     * Returns the start date of the certificate validity period.
     */
    getNotBefore(): Date;
    /**
     * Returns the certificate serial number in string format. The serial number is a unique positive integer assigned
     * by the CA to each certificate.
     */
    getSerialNumber(): string;
    /**
     * Returns the algorithm used to sign this certificate. The name follows the format defined in RFC 5280 (e.g.,
     * "SHA256withRSA", "SHA384withECDSA").
     */
    getSigAlgName(): string;
    /**
     * Returns the X.500 distinguished name of the entity this certificate belongs to.
     */
    getSubjectDN(): string;
    /**
     * Returns the X.509 certificate version number.
     */
    getVersion(): number;
}

export = X509Certificate;
