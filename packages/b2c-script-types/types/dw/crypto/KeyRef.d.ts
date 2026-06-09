/**
 * This class is used as a reference to a private key in the keystore
 * which can be managed in the Business Manager.
 * 
 * Note: this class handles sensitive security-related data.
 * Pay special attention to PCI DSS v3. requirements 2, 4, and 12.
 */
declare class KeyRef {
    /**
     * Creates a `KeyRef` from the passed alias. No check
     * is made whether the alias is actually referring to a key in the keystore,
     * this check is made when the `KeyRef` is used.
     */
    constructor(alias: string);
    /**
     * Creates a `KeyRef` from the passed alias. No check
     * is made whether the alias is actually referring to a key in the keystore,
     * this check is made when the `KeyRef` is used.
     * @deprecated use KeyRef instead
     */
    constructor(alias: string, password: string);
    /**
     * Returns the string representation of this KeyRef.
     */
    toString(): string;
}

export = KeyRef;
