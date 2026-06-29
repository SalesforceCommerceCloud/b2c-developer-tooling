import List = require('./List');
import Collection = require('./Collection');
import utilIterator = require('./Iterator');

/**
 * The ArrayList class is a container for a list of objects.
 */
declare class ArrayList<T> extends List<T> {
    /**
     * Constructor for a new ArrayList.
     */
    constructor();
    /**
     * Constructor for a new ArrayList. The constructor initializes the
     * ArrayList with the elements of the given collection.
     */
    constructor(collection: Collection<T>);
    /**
     * Constructor for a new ArrayList. The constructor initializes the
     * ArrayList with the elements of the given iterator.
     */
    constructor(iterator: utilIterator<any>);
    /**
     * Constructor for a new ArrayList. The constructor initializes the
     * ArrayList with the arguments given as constructor parameters. The method
     * can also be called with an ECMA array as argument.
     * 
     * If called with a single ECMA array as argument the individual elements of
     * that array are used to initialize the ArrayList. To create an ArrayList
     * with a single array as element, create an empty ArrayList and then call
     * the method add1() on it.
     */
    constructor(...values: any[]);
    /**
     * Returns a shallow copy of this array list.
     */
    clone(): ArrayList<any>;
}

export = ArrayList;
