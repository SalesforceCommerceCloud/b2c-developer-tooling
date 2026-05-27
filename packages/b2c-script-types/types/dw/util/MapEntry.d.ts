/**
 * The class represent an entry within a Map.
 */
declare class MapEntry {
    /**
     * Returns the entry's key.
     */
    readonly key: any;
    /**
     * Returns the entry's value.
     */
    readonly value: any;
    private constructor();
    /**
     * Returns the entry's key.
     */
    getKey(): any;
    /**
     * Returns the entry's value.
     */
    getValue(): any;
}

export = MapEntry;
