import utilMap = require('./Map');

/**
 * A map that further guarantees that it will be in ascending key order,
 * sorted according to the natural ordering of its keys,
 * or by a comparator provided at sorted map creation time. This order is reflected
 * when iterating over the sorted map's collection views (returned by the entrySet,
 * keySet and values methods).
 * Note that sorting by natural order is only supported for Number,
 * String, Date, Money and Quantity as key.
 */
declare class SortedMap<K, V> extends utilMap<K, V> {
    /**
     * Constructor to create a new SortedMap.
     */
    constructor();
    /**
     * Constructor to create a new SortedMap.
     * 
     * The constructor takes a compare function as additional parameter. This comparator
     * determines identity and the order of the element keys for this map.
     * The order of the elements is determined with a comparator (see PropertyComparator)
     * or with the help of the given function. The function must take two parameters
     * and return a value <=-1 if the first parameter is smaller than the second,
     * a value if >=1 if the first one is greater than the second parameter
     * and a value in between like 0 if both are equal.
     */
    constructor(comparator: Object);
    /**
     * Returns a shallow copy of this map.
     */
    clone(): SortedMap<any, any>;
    /**
     * Returns the first (lowest) key currently in this sorted map.
     */
    firstKey(): any;
    /**
     * Returns a view of the portion of this map whose keys are strictly less than toKey.
     */
    headMap(key: any): SortedMap<any, any>;
    /**
     * Returns the last (highest) key currently in this sorted map.
     */
    lastKey(): any;
    /**
     * Returns a view of the portion of this map whose keys range from fromKey, inclusive,
     * to toKey, exclusive. (If fromKey and toKey are equal, the returned sorted map is empty.)
     */
    subMap(from: any, to: any): SortedMap<any, any>;
    /**
     * Returns a view of the portion of this map whose keys are greater than or equal
     * to fromKey. The returned sorted map is backed by this map, so changes in the
     * returned sorted map are reflected in this map, and vice-versa. The returned
     * sorted map supports all optional map operations.
     */
    tailMap(key: any): SortedMap<any, any>;
}

export = SortedMap;
