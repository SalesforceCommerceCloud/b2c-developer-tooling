/**
 * Class used to wrap internal objects to hide them from
 * B2C Commerce Script code.
 */
declare class InternalObject {
    private constructor();
    /**
     * Returns a string representation of this object.
     */
    toString(): string;
    /**
     * Returns a string representation of this object.
     */
    valueOf(): string;
}

export = InternalObject;
