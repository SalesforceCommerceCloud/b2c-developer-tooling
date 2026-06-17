/**
 * Common base class for all objects in Commerce Cloud Digital that have an
 * identity and can be stored and retrieved.  Each entity is identified by
 * a unique universal identifier (a UUID).
 */
declare class PersistentObject {
    /**
     * Returns the unique universal identifier for this object.
     */
    readonly UUID: string;
    /**
     * Returns the date that this object was created.
     */
    readonly creationDate: Date;
    /**
     * Returns the date that this object was last modified.
     */
    readonly lastModified: Date;
    /**
     * Returns the date that this object was created.
     */
    getCreationDate(): Date;
    /**
     * Returns the date that this object was last modified.
     */
    getLastModified(): Date;
    /**
     * Returns the unique universal identifier for this object.
     */
    getUUID(): string;
}

export = PersistentObject;
