import utilMap = require('./Map');

/**
 * Represents a hash map of objects.
 */
declare class HashMap<K, V> extends utilMap<K, V> {
    /**
     * Constructs a new HashMap.
     */
    constructor();
    /**
     * Returns a shallow copy of this map.
     */
    clone(): HashMap<any, any>;
}

export = HashMap;
