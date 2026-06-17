/**
 * This class is used as a reference to a certificate or public key.
 * 
 * Note: this class handles sensitive security-related data.
 * Pay special attention to PCI DSS v3. requirements 2, 4, and 12.
 */
declare class CertificateRef {
    /**
     * Creates a `CertificateRef` from the passed alias as a reference to a certificate in Business Manager.
     * No check is made whether the alias is actually valid until the time that this `CertificateRef` is
     * used to resolve a certificate or public key.
     */
    constructor(alias: string);
    /**
     * Returns the string representation of this CertificateRef.
     */
    toString(): string;
}

export = CertificateRef;
