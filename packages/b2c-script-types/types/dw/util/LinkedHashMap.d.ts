import utilMap = require('./Map');

/**
 * This class implements a HashMap, which guarantees a iteration order
 * according the put-order of the elements in the map.
 */
declare class LinkedHashMap<K, V> extends utilMap<K, V> {
    /**
     * Constructs a new LinkedHashMap.
     */
    constructor();
    /**
     * Returns a shallow copy of this map.
     */
    clone(): LinkedHashMap<any, any>;
}

export = LinkedHashMap;
