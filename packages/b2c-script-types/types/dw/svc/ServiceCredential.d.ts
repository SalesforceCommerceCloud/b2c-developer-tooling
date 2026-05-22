import EncryptedObject = require('../customer/EncryptedObject');
import ExtensibleObject = require('../object/ExtensibleObject');
import CustomAttributes = require('../object/CustomAttributes');
import CertificateRef = require('../crypto/CertificateRef');

declare global {
    module ICustomAttributes {
        interface ServiceCredential extends ICustomAttributes.EncryptedObject {
        }
    }
}

/**
 * Configuration object for Service Credentials.
 */
declare class ServiceCredential extends EncryptedObject<ICustomAttributes.ServiceCredential> {
    /**
     * Constant for specification of the public key encryption algorithm RSA.
     * @see getEncryptedPassword
     * @deprecated Use dw.crypto.Cipher to encrypt data as needed.
     */
    static readonly ENCRYPTION_ALGORITHM_RSA: string;
    /**
     * Returns the unique Credential ID.
     */
    readonly ID: string;
    /**
     * Return the URL.
     */
    readonly URL: string;
    /**
     * Returns the Password in plain text.
     */
    readonly password: string;
    /**
     * Returns the User ID.
     */
    readonly user: string;
    private constructor();
    /**
     * Encrypts the password from this object with the given algorithm
     * and the public key taken from a certificate in the keystore.
     * Returned is the base64-encoded representation of the result.
     * 
     * See also dw.crypto.Cipher.encrypt_2 on how to generate RSA key pairs.
     * @deprecated Use dw.crypto.Cipher to encrypt data as needed.
     */
    getEncryptedPassword(algorithm: string, publicKey: CertificateRef): string;
    /**
     * Returns the unique Credential ID.
     */
    getID(): string;
    /**
     * Returns the Password in plain text.
     */
    getPassword(): string;
    /**
     * Return the URL.
     */
    getURL(): string;
    /**
     * Returns the User ID.
     */
    getUser(): string;
}

export = ServiceCredential;
