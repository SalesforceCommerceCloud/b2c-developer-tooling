import Collection = require('./Collection');

/**
 * Represents a set of objects.
 */
declare class Set<T> extends Collection<T> {
    /**
     * Convenience variable, for an empty and immutable list.
     */
    static EMPTY_SET: Set<any>;
}

export = Set;
