import JWSHeader = require('./JWSHeader');
import Bytes = require('../util/Bytes');
import utilMap = require('../util/Map');
import CertificateRef = require('./CertificateRef');
import KeyRef = require('./KeyRef');

/**
 * This class represents a JSON Web Signature (JWS) object.
 * 
 * Note: this class handles sensitive security-related data.
 * Pay special attention to PCI DSS v3 requirements 2, 4, and 12.
 */
declare class JWS {
    /**
     * Get the algorithm (`alg`) from the header.
     */
    readonly algorithm: string | null;
    /**
     * Get a copy of the JWS header.
     */
    readonly header: JWSHeader;
    /**
     * Get a copy of the JWS header as a Map.
     */
    readonly headerMap: utilMap<any, any>;
    /**
     * Get the payload from this object.
     * 
     * This is available even if the signature has not been verified.
     */
    readonly payload: string;
    /**
     * Construct a new JWS for signing.
     */
    constructor(header: JWSHeader, payload: string);
    /**
     * Construct a new JWS for signing.
     */
    constructor(header: JWSHeader, payload: Bytes);
    /**
     * Parse a JSON Web Signature (JWS) object from its compact serialization format.
     */
    static parse(jws: string): JWS;
    /**
     * Parse a JSON Web Signature (JWS) object from its compact serialization format.
     */
    static parse(jws: string, payload: string): JWS;
    /**
     * Parse a JSON Web Signature (JWS) object from its compact serialization format.
     */
    static parse(jws: string, payload: Bytes): JWS;
    /**
     * Get the algorithm (`alg`) from the header.
     */
    getAlgorithm(): string | null;
    /**
     * Get a copy of the JWS header.
     */
    getHeader(): JWSHeader;
    /**
     * Get a copy of the JWS header as a Map.
     */
    getHeaderMap(): utilMap<any, any>;
    /**
     * Get the payload from this object.
     * 
     * This is available even if the signature has not been verified.
     */
    getPayload(): string;
    /**
     * Get this JWS in compact serialization form.
     */
    serialize(detachPayload: boolean): string;
    /**
     * Sign the payload using the given private key.
     * 
     * The key type and size must match the algorithm given in the JWS header.
     * @throws Exception if there is an error while signing the payload.
     */
    sign(keyRef: KeyRef): void;
    /**
     * Verifies the signature of the payload.
     * 
     * If the `x5c` header parameter is present, then that certificate chain will be used to verify the
     * signature and the given `certificateRef` must be its root certificate. If this parameter is not
     * present then the given `certificateRef` will be used to directly verify the signature.
     * 
     * The following algorithms are supported:
     * 
     * - ES256
     * - ES256K
     * - ES384
     * - ES512
     * - RS256
     * - RS384
     * - RS512
     * - PS256
     * - PS384
     * - PS512
     * @throws Exception if there is an error while processing the certificate (for example if the  x5c is not signed by the given certificate) or the algorithm is unsupported.
     */
    verify(certificateRef: CertificateRef): boolean;
}

export = JWS;
