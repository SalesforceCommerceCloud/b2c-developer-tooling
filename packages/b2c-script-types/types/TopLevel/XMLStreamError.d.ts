/**
 * This error indicates an XML streaming related error in the system. The IOError
 * is always related to a systems internal Java exception. The class provides
 * access to some more details about this internal Java exception. In particular
 * the class informs about the location of the error.
 */
declare class XMLStreamError extends Error {
    /**
     * If the exception is associated with a root cause, the property
     * contains the full name of the associated Java exception.
     */
    causeFullName: string;
    /**
     * If the exception is associated with a root cause, the property
     * contains the message of the associated Java exception.
     */
    causeMessage: string;
    /**
     * If the exception is associated with a root cause, the property
     * contains the simplified name of the associated Java exception.
     */
    causeName: string;
    /**
     * The full name of the underlying Java exception.
     */
    javaFullName: string;
    /**
     * The message of the underlying Java exception.
     */
    javaMessage: string;
    /**
     * The simplified name of the underlying Java exception.
     */
    javaName: string;
    /**
     * The column number where the error occured.
     */
    xmlColumnNumber: number;
    /**
     * The line where the error occured.
     */
    xmlLineNumber: number;
    private constructor();
}

export = XMLStreamError;
