import utilSet = require('./Set');
import Collection = require('./Collection');

/**
 * The class LinkedHashSet implements a hash set with a guaranteed iteration
 * order. The elements are iterated in the order they have been added to the
 * HashSet.
 */
declare class LinkedHashSet<T> extends utilSet<T> {
    /**
     * Constructs a new LinkHashSet.
     */
    constructor();
    /**
     * Constructor for a new LinkedHashSet. The constructor
     * initializes the LinkedHashSet with the elements of the
     * given collection.
     */
    constructor(collection: Collection<T>);
    /**
     * Returns a shallow copy of this set.
     */
    clone(): LinkedHashSet<any>;
}

export = LinkedHashSet;
