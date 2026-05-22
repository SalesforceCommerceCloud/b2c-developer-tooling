import utilMap = require('../util/Map');

/**
 * This class represents an immutable header of a JWS (JSON Web Signature) object.
 */
declare class JWSHeader {
    /**
     * Get the value of the algorithm parameter (`alg`).
     */
    readonly algorithm: string;
    private constructor();
    /**
     * Convert the given Map or JavaScript object into a JWS header.
     * 
     * All keys correspond to JWS parameters. The algorithm parameter (`alg`) is required. See
     * JWS.verify for supported values.
     */
    static parse(map: Object): JWSHeader;
    /**
     * Parse the given string as a Base64URL-encoded JWS header.
     * 
     * The algorithm parameter (`alg`) is required. See JWS.verify for supported
     * values.
     */
    static parseEncoded(base64encoded: string): JWSHeader;
    /**
     * Parse the given string as a JWS header.
     * 
     * The algorithm parameter (`alg`) is required. See JWS.verify for supported
     * values.
     */
    static parseJSON(json: string): JWSHeader;
    /**
     * Get the value of the algorithm parameter (`alg`).
     */
    getAlgorithm(): string;
    /**
     * Get a copy of these headers as a Map.
     */
    toMap(): utilMap<any, any>;
    /**
     * Get the content of the headers as a JSON String.
     */
    toString(): string;
}

export = JWSHeader;
