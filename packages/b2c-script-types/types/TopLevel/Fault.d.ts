/**
 * This error indicates an RPC related error in the system. The Fault
 * is always related to a systems internal Java exception. The class provides
 * access to some more details about this internal Java exception. In particular
 * it provides details about the error send from the remote system.
 */
declare class Fault extends Error {
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
     * Provides some information on who cause the fault along the message
     * path.
     */
    faultActor: string;
    /**
     * An identifier for the specific fault.
     */
    faultCode: string;
    /**
     * More detailed information about the fault.
     */
    faultDetail: string;
    /**
     * A human readable description for the fault.
     */
    faultString: string;
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

export = Fault;
