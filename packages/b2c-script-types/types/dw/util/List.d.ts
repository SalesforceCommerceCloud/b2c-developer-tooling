import Collection = require('./Collection');

/**
 * An ordered collection of objects. The user of a List has precise control over
 * where in the list each element is inserted. The user can access elements by
 * their integer index (position in the list), and search for elements in the
 * list. Lists are zero based similar to arrays. Unlike sets, lists allow
 * duplicate elements.
 */
declare class List<T> extends Collection<T> {
    /**
     * Convenience variable, for an empty and immutable list.
     */
    static EMPTY_LIST: List<any>;
    /**
     * Adds the specified object into the list at the specified index.
     */
    addAt(index: number, value: T): void;
    /**
     * Creates and returns a new List that is the result of concatenating this
     * list with each of the specified values. This list itself is unmodified.
     * If any of the specified values is itself an array or a Collection, then
     * the elements of that Collection or array are appended to the new list
     * rather than the object itself.
     */
    concat(...values: T[]): List<T>;
    /**
     * Replaces all of the elements in the list with the given object.
     */
    fill(obj: T): void;
    /**
     * Returns the object at the specified index.
     */
    get(index: number): T;
    /**
     * Returns the index of the first occurrence of the specified element in
     * this list, or -1 if this list does not contain the element.
     */
    indexOf(value: T): number;
    /**
     * Converts all elements of the list to a string by calling the toString()
     * method and then concatenates them together, with a comma between
     * elements.
     */
    join(): string;
    /**
     * Converts all elements of the list to a string by calling the toString()
     * method and then concatenates them together, with the separator string
     * between elements. If null is passed, then the comma character is used as
     * a separator.
     */
    join(separator: string | null): string;
    /**
     * Returns the index of the last occurrence of the specified element in this
     * list, or -1 if this list does not contain the element.
     */
    lastIndexOf(value: T): number;
    /**
     * Removes and returns the last element from the list.
     */
    pop(): T;
    /**
     * Appends the specified values to the end of the list in order.
     */
    push(...values: T[]): number;
    /**
     * Removes the object at the specified index.
     */
    removeAt(index: number): T;
    /**
     * Replaces all occurrences of oldValue with newValue.
     */
    replaceAll(oldValue: any, newValue: any): boolean;
    /**
     * Reverses the order of the elements in the list.
     */
    reverse(): void;
    /**
     * Rotates the elements in the list by the specified distance.
     */
    rotate(distance: number): void;
    /**
     * Replaces the object at the specified index in this list with the specified object.
     */
    set(index: number, value: T): T;
    /**
     * Removes and returns the first element of the list. If the list is already
     * empty, this method simply returns null.
     */
    shift(): T;
    /**
     * Randomly permutes the elements in the list.
     */
    shuffle(): void;
    /**
     * Returns the size of this list.
     */
    size(): number;
    /**
     * Returns a slice, or sublist, of this list. The returned list contains the
     * element specified by `from` and all subsequent elements up to
     * the end of this list.
     */
    slice(from: number): List<T>;
    /**
     * Returns a slice, or sublist, of this list. The returned list contains the
     * element specified by `from` and all subsequent elements up to,
     * but not including, the element specified by `to`.
     */
    slice(from: number, to: number): List<T>;
    /**
     * Sorts the elements of the list based on their natural
     * order.
     * 
     * This sort is guaranteed to be stable:  equal elements will
     * not be reordered as a result of the sort.
     */
    sort(): void;
    /**
     * Sorts the elements of a list. The order of the elements is
     * determined with a comparator (see PropertyComparator) or with the help
     * of the given function. The function must take two parameters and return
     * a value <0 if the first parameter is smaller than the second, a value
     * of 0 if both are equal and a value if >0 if the first one is greater
     * than the second parameter.
     * 
     * This sort is guaranteed to be stable:  equal elements will
     * not be reordered as a result of the sort.
     */
    sort(comparator: Object): void;
    /**
     * Returns a list containing the elements in this list identified
     * by the specified arguments.
     */
    subList(from: number, to: number): List<T>;
    /**
     * Swaps the elements at the specified positions in the list.
     */
    swap(i: number, j: number): void;
    /**
     * Inserts values at the beginning of the list.  The first argument
     * becomes the new element 0;  the second argument becomes element 1;
     * and so on.
     */
    unshift(...values: any[]): number;
}

export = List;
