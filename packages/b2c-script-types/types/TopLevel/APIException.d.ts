/**
 * This error indicates an exceptional outcome of some business logic. Instances of
 * this exception in general provide additional information about the reason of this case.
 * See the actual type referred by the type property for the description of the properties
 * with this additional information.
 * 
 * Limitation: The sub classes of this APIException shown in this documentation actually do not exist.
 * All instances are of type APIException, but with different property sets as listed in the sub classes.
 * 
 * The APIException is always related to a systems internal Java exception. The class provides
 * access to some more details about this internal Java exception.
 */
declare class APIException extends Error {
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
     * The name of the actual APIException type, without the package name.
     */
    type: string;
    private constructor();
}

export = APIException;
