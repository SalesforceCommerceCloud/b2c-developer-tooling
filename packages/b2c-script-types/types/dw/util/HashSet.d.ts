import utilSet = require('./Set');
import Collection = require('./Collection');

/**
 * Represents a HashSet
 */
declare class HashSet<T> extends utilSet<T> {
    /**
     * Constructs a new HashMap.
     */
    constructor();
    /**
     * Construct a new HashSet by
     * initializing the HashSet with the elements of the
     * given collection.
     */
    constructor(collection: Collection<T>);
    /**
     * Returns a shallow copy of this set.
     */
    clone(): HashSet<any>;
}

export = HashSet;
