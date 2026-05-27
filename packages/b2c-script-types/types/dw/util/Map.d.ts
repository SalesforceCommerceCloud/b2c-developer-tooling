import utilSet = require('./Set');
import Collection = require('./Collection');

/**
 * Represents a Map of objects.
 */
declare class Map<K, V> {
    /**
     * Convenience variable, for an empty and immutable list.
     */
    static EMPTY_MAP: Map<any, any>;
    /**
     * Identifies if this map is empty.
     */
    readonly empty: boolean;
    /**
     * REturns the size of the map. This is a bean attribute method and
     * supports the access to the collections
     * length similar to a ECMA array, such as 'products.length'.
     */
    readonly length: number;
    /**
     * Clears the map of all objects.
     */
    clear(): void;
    /**
     * Identifies if this map contains an element identfied
     * by the specified key.
     */
    containsKey(key: K): boolean;
    /**
     * Identifies if this map contains an element identfied
     * by the specified value.
     */
    containsValue(value: V): boolean;
    /**
     * Returns a set of the map's entries. The returned set is actually a view to the entries of this map.
     */
    entrySet(): utilSet<any>;
    /**
     * Returns the object associated with the key or null.
     */
    get(key: K): V | null;
    /**
     * REturns the size of the map. This is a bean attribute method and
     * supports the access to the collections
     * length similar to a ECMA array, such as 'products.length'.
     */
    getLength(): number;
    /**
     * Identifies if this map is empty.
     */
    isEmpty(): boolean;
    /**
     * Returns a set of the map's keys. The returned set is actually a view to the keys of this map.
     */
    keySet(): utilSet<K>;
    /**
     * Puts the specified value into the map using the
     * specified key to identify it.
     */
    put(key: K, value: V): V | null;
    /**
     * Copies all of the objects inside the specified map
     * into this map.
     */
    putAll(other: Map<K, V>): void;
    /**
     * Removes the object from the map that is identified by the key.
     */
    remove(key: K): V | null;
    /**
     * Returns the size of the map.
     */
    size(): number;
    /**
     * Returns a collection of the values contained in this map.
     */
    values(): Collection<V>;
}

export = Map;
