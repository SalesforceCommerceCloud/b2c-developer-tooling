/**
 * Encapsulates the key for a mapping read in with the ImportKeyValueMapping job step. Can be either single or compound keys. For example, a
 * single string (e.g. product id) or multiple string components (e.g. product id and site).
 */
declare class MappingKey {
    /**
     * Gets the (possible compound) key. If the key consists of only of a single value, the string array
     * will simply contain a single element.
     */
    readonly keyComponents: string[];
    /**
     * Gets a key that contains only a single key component (i.e. that is not a compound key). Returns null if this is
     * not a single component key.
     */
    readonly singleComponentKey: string | null;
    /**
     * Instantiates a new key using compound key components. A key can consist of a single string (e.g. product id) or
     * multiple string components (e.g. product id and site). Ctor accepts single string or multiple components for a
     * compound key.
     */
    constructor(...keyComponents: string[]);
    /**
     * Gets the (possible compound) key. If the key consists of only of a single value, the string array
     * will simply contain a single element.
     */
    getKeyComponents(): string[];
    /**
     * Gets a key that contains only a single key component (i.e. that is not a compound key). Returns null if this is
     * not a single component key.
     */
    getSingleComponentKey(): string | null;
}

export = MappingKey;
