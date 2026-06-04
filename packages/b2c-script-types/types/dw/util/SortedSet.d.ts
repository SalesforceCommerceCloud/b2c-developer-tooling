import utilSet = require('./Set');
import Collection = require('./Collection');

/**
 * A set that further guarantees that its iterator
 * will traverse the set in ascending element order,
 * sorted according to the natural ordering of its
 * elements (only supported for Number, String,
 * Date, Money and Quantity), or by a comparator
 * provided at sorted set creation time.
 */
declare class SortedSet<T> extends utilSet<T> {
    /**
     * Constructor to create a new SortedSet.
     */
    constructor();
    /**
     * Constructor to create a new SortedSet.
     * 
     * The constructor takes a compare function as additional parameter. This comparator
     * determines identity and the order of the elements for this set.
     * The order of the elements is determined with a comparator (see PropertyComparator)
     * or with the help of the given function. The function must take two parameters
     * and return a value <=-1 if the first parameter is smaller than the second,
     * a value if >=1 if the first one is greater than the second parameter
     * and a value in between like 0 if both are equal.
     */
    constructor(comparator: Object);
    /**
     * Constructor for a new SortedSet. The constructor
     * initializes the SortedSet with the elements of the
     * given collection.
     */
    constructor(collection: Collection<T>);
    /**
     * Returns a shallow copy of this set.
     */
    clone(): SortedSet<any>;
    /**
     * Returns the first (lowest) element currently in this sorted set.
     */
    first(): any;
    /**
     * Returns a view of the portion of this sorted set whose elements
     * are strictly less than toElement. The returned sorted set is
     * backed by this sorted set, so changes in the returned sorted
     * set are reflected in this sorted set, and vice-versa. The returned
     * sorted set supports all optional set operations.
     */
    headSet(key: any): SortedSet<any>;
    /**
     * Returns the last (highest) element currently in this sorted set.
     */
    last(): any;
    /**
     * Returns a view of the portion of this sorted set whose elements
     * range from fromElement, inclusive, to toElement, exclusive. (If
     * fromElement and toElement are equal, the returned sorted set is empty.)
     * The returned sorted set is backed by this sorted set, so changes in
     * the returned sorted set are reflected in this sorted set, and vice-versa.
     * The returned sorted set supports all optional set operations that this
     * sorted set supports.
     */
    subSet(from: any, to: any): SortedSet<any>;
    /**
     * Returns a view of the portion of this sorted set whose elements
     * are greater than or equal to fromElement. The returned sorted set
     * is backed by this sorted set, so changes in the returned sorted
     * set are reflected in this sorted set, and vice-versa. The returned
     * sorted set supports all optional set operations.
     */
    tailSet(key: any): SortedSet<any>;
}

export = SortedSet;
