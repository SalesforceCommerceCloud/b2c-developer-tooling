import JWEHeader = require('./JWEHeader');
import Bytes = require('../util/Bytes');
import utilMap = require('../util/Map');
import KeyRef = require('./KeyRef');
import CertificateRef = require('./CertificateRef');

/**
 * This class represents a JSON Web Encryption (JWE) object.
 * 
 * Note: this class handles sensitive security-related data.
 * Pay special attention to PCI DSS v3 requirements 2, 4, and 12.
 */
declare class JWE {
    /**
     * Get the algorithm (`alg`) from the header.
     */
    readonly algorithm: string | null;
    /**
     * Get the encryption method (`enc`) from the header.
     */
    readonly encryptionMethod: string | null;
    /**
     * Get a copy of the JWE headers as a Map.
     */
    readonly headerMap: utilMap<any, any>;
    /**
     * Get the key id (`kid`) from the header.
     */
    readonly keyID: string | null;
    /**
     * Get the decrypted payload.
     */
    readonly payload: string | null;
    /**
     * Construct a new JWE for encryption.
     */
    constructor(header: JWEHeader, payload: string);
    /**
     * Construct a new JWE for encryption.
     */
    constructor(header: JWEHeader, payload: Bytes);
    /**
     * Parse a JSON Web Encryption (JWE) object from its compact serialization format.
     */
    static parse(jwe: string): JWE;
    /**
     * Decrypt the payload of this JWE object.
     * 
     * Elliptic Curve (EC) and RSA keys are both supported.
     * 
     * Supported EC key management algorithms:
     * 
     * - ECDH-ES
     * - ECDH-ES+A128KW
     * - ECDH-ES+A192KW
     * - ECDH-ES+A256KW
     * 
     * Supported EC curves:
     * 
     * - P-256
     * - P-384
     * - P-521
     * 
     * Supported RSA key management algorithms:
     * 
     * - RSA-OAEP-256
     * - RSA-OAEP-384
     * - RSA-OAEP-512
     * 
     * Supported content encryption algorithms:
     * 
     * - A128CBC-HS256
     * - A128CBC-HS384
     * - A128CBC-HS512
     * - A128GCM
     * - A192GCM
     * - A256GCM
     */
    decrypt(privateKey: KeyRef): void;
    /**
     * Encrypt the payload of this JWE object.
     * 
     * Elliptic Curve (EC) and RSA keys are both supported.
     * 
     * See decrypt for the list of supported algorithms and encryption methods.
     */
    encrypt(publicKey: CertificateRef): void;
    /**
     * Get the algorithm (`alg`) from the header.
     */
    getAlgorithm(): string | null;
    /**
     * Get the encryption method (`enc`) from the header.
     */
    getEncryptionMethod(): string | null;
    /**
     * Get a copy of the JWE headers as a Map.
     */
    getHeaderMap(): utilMap<any, any>;
    /**
     * Get the key id (`kid`) from the header.
     */
    getKeyID(): string | null;
    /**
     * Get the decrypted payload.
     */
    getPayload(): string | null;
    /**
     * Get this JWE in compact serialization form.
     */
    serialize(): string;
}

export = JWE;
