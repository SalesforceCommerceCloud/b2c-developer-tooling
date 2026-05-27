/**
 * This error indicates an error in the system, which doesn't fall into
 * any of the other error categories like for example IOError. The SystemError
 * is always related to a systems internal Java exception. The class provides
 * access to some more details about this internal Java exception.
 */
declare class SystemError extends Error {
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
    private constructor();
}

export = SystemError;
