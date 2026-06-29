import utilIterator = require('./Iterator');

/**
 * Represents a collection of objects.
 */
declare class Collection<T> {
    /**
     * Returns true if the collection is empty.
     */
    readonly empty: boolean;
    /**
     * Returns the length of the collection. This is similar to
     * to a ECMA array of 'products.length'.
     */
    readonly length: number;
    /**
     * Adds the specified objects to the collection. The method can also
     * be called with an ECMA array as argument.
     * 
     * If called with a single ECMA array as argument the individual elements of
     * that array are added to the collection. If the array object itself should
     * be added use the method add1().
     */
    add(...values: T[]): boolean;
    /**
     * The method adds a single object to the collection.
     */
    add1(object: T): boolean;
    /**
     * Adds the collection of objects to the collection.
     */
    addAll(objs: Collection<T>): boolean;
    /**
     * Clears the collection.
     */
    clear(): void;
    /**
     * Returns true if the collection contains the specified object.
     */
    contains(obj: T): boolean;
    /**
     * Returns true if the collection contains all of the objects
     * in the specified collection.
     */
    containsAll(objs: Collection<T>): boolean;
    /**
     * Returns the length of the collection. This is similar to
     * to a ECMA array of 'products.length'.
     */
    getLength(): number;
    /**
     * Returns true if the collection is empty.
     */
    isEmpty(): boolean;
    /**
     * Returns an iterator that can be used to access
     * the members of the collection.
     */
    iterator(): utilIterator<T>;
    /**
     * Removes the specified object from the collection.
     */
    remove(obj: T): boolean;
    /**
     * Removes all of object in the specified object from the collection.
     */
    removeAll(objs: Collection<T>): boolean;
    /**
     * Removes all of object in the collection that are not in the
     * specified collection.
     */
    retainAll(objs: Collection<T>): boolean;
    /**
     * Returns the size of the collection.
     */
    size(): number;
    /**
     * Returns all elements of this collection in a newly created array. The returned array is independent of this collection and
     * can be modified without changing the collection. The elements in the array are in the same order as they are returned when
     * iterating over this collection.
     */
    toArray(): T[];
    /**
     * Returns a subset of the elements of this collection in a newly created array. The returned array is independent of this collection and
     * can be modified without changing the collection. The elements in the array are in the same order as they are returned when
     * iterating over this collection.
     */
    toArray(start: number, size: number): T[];
}

export = Collection;
