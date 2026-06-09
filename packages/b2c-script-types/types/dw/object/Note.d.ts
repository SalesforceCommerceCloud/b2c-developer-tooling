/**
 * Represents a note that can be attached to any persistent object
 * that supports this feature.
 */
declare class Note {
    /**
     * Return the login ID of user that is stored in the session at the time
     * the note is created.
     */
    readonly createdBy: string;
    /**
     * Return the date and time that the note was created.  This is usually
     * set by the system, but may be specified if the note is generated
     * via an import.
     */
    readonly creationDate: Date;
    /**
     * Return the subject of the note.
     */
    readonly subject: string;
    /**
     * Return the text of the note.
     */
    readonly text: string;
    private constructor();
    /**
     * Return the login ID of user that is stored in the session at the time
     * the note is created.
     */
    getCreatedBy(): string;
    /**
     * Return the date and time that the note was created.  This is usually
     * set by the system, but may be specified if the note is generated
     * via an import.
     */
    getCreationDate(): Date;
    /**
     * Return the subject of the note.
     */
    getSubject(): string;
    /**
     * Return the text of the note.
     */
    getText(): string;
}

export = Note;
