import List = require('./List');

/**
 * The Iterator class allows you to access items in a collection.
 */
declare class Iterator<T> {
    /**
     * Convert the iterator into a list. After this conversion the
     * iterator is empty and hasNext() will always return false.
     * 
     * Note: This method should be used with care. For example a large database
     * result is pulled into memory completely with this method and can cause
     * an OutOfMemory situation.
     */
    asList(): List<any>;
    /**
     * Converts a sub-sequence within the iterator into a list.
     * 
     * Note: This method should be used with care. For example a large database
     * result is pulled into memory completely with this method and can cause
     * an OutOfMemory situation.
     */
    asList(start: number, size: number): List<any>;
    /**
     * Indicates if there are more elements.
     */
    hasNext(): boolean;
    /**
     * Returns the next element from the Iterator.
     */
    next(): T;
}

export = Iterator;
