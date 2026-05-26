import utilMap = require('../util/Map');

/**
 * This class represents an immutable header of a JWE (JSON Web Encryption) object.
 */
declare class JWEHeader {
    /**
     * Get the value of the algorithm parameter (`alg`).
     */
    readonly algorithm: string;
    /**
     * Get the value of the encryption algorithm parameter (`enc`).
     */
    readonly encryptionAlgorithm: string;
    private constructor();
    /**
     * Convert the given Map or JavaScript object into a JWE header.
     * 
     * All keys correspond to JWE parameters. The algorithm (`alg`) and encryption method
     * (`enc`) parameters are required. See JWE.decrypt for supported values.
     */
    static parse(map: Object): JWEHeader;
    /**
     * Parse the given string as a Base64URL-encoded JWE header.
     * 
     * The algorithm (`alg`) and encryption method (`enc`) parameters are required. See
     * JWE.decrypt for supported values.
     */
    static parseEncoded(base64encoded: string): JWEHeader;
    /**
     * Parse the given string as a JWE header.
     * 
     * The algorithm (`alg`) and encryption method (`enc`) parameters are required. See
     * JWE.decrypt for supported values.
     */
    static parseJSON(json: string): JWEHeader;
    /**
     * Get the value of the algorithm parameter (`alg`).
     */
    getAlgorithm(): string;
    /**
     * Get the value of the encryption algorithm parameter (`enc`).
     */
    getEncryptionAlgorithm(): string;
    /**
     * Get a copy of these headers as a Map.
     */
    toMap(): utilMap<any, any>;
    /**
     * Get the content of the headers as a JSON String.
     */
    toString(): string;
}

export = JWEHeader;
