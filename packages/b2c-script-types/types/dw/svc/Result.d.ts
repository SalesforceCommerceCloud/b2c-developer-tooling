/**
 * Represents the result of a service call.
 */
declare class Result {
    /**
     * Status indicating a general service error.
     */
    static readonly ERROR = "ERROR";
    /**
     * Status indicating a successful service call.
     */
    static readonly OK = "OK";
    /**
     * Status indicating the service is unavailable. This includes timeouts, rate limits, and remote server issues.
     */
    static readonly SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE";
    /**
     * Unavailable reason: No call was made because the circuit breaker prevented it.
     */
    static readonly UNAVAILABLE_CIRCUIT_BROKEN = "CIRCUIT_BROKEN";
    /**
     * Unavailable reason: No call was made because the service was not configured correctly.
     */
    static readonly UNAVAILABLE_CONFIG_PROBLEM = "CONFIG_PROBLEM";
    /**
     * Unavailable reason: No call was made because the service is disabled.
     */
    static readonly UNAVAILABLE_DISABLED = "DISABLED";
    /**
     * Unavailable reason: No call was made because the rate limit was hit.
     */
    static readonly UNAVAILABLE_RATE_LIMITED = "RATE_LIMITED";
    /**
     * Unavailable reason: A real call was made but a timeout occurred.
     */
    static readonly UNAVAILABLE_TIMEOUT = "TIMEOUT";
    /**
     * Returns an error-specific code if applicable. For example, this is the HTTP response code for an
     * HTTPService.
     */
    readonly error: number;
    /**
     * Returns an error message on a non-OK status.
     */
    readonly errorMessage: string;
    /**
     * Returns the status of whether the response is the result of a "mock" service call.
     */
    readonly mockResult: boolean;
    /**
     * Returns an extra error message on failure (if any).
     */
    readonly msg: string | null;
    /**
     * Returns the actual object returned by the service when the status is OK.
     */
    readonly object: any;
    /**
     * Returns the status of whether the service call was successful.
     */
    readonly ok: boolean;
    /**
     * Returns the status. This is "OK" on success. Failure codes include "ERROR" and "SERVICE_UNAVAILABLE".
     * 
     * If the status is "SERVICE_UNAVAILABLE", then the unavailableReason is guaranteed to be non-null.
     * @see OK
     * @see ERROR
     * @see SERVICE_UNAVAILABLE
     */
    readonly status: string;
    /**
     * Returns the reason the status is SERVICE_UNAVAILABLE.
     * @see UNAVAILABLE_TIMEOUT
     * @see UNAVAILABLE_CIRCUIT_BROKEN
     * @see UNAVAILABLE_RATE_LIMITED
     * @see UNAVAILABLE_DISABLED
     * @see UNAVAILABLE_CONFIG_PROBLEM
     */
    readonly unavailableReason: string | null;
    /**
     * Constructs a new result instance.
     */
    constructor();
    /**
     * Returns an error-specific code if applicable. For example, this is the HTTP response code for an
     * HTTPService.
     */
    getError(): number;
    /**
     * Returns an error message on a non-OK status.
     */
    getErrorMessage(): string;
    /**
     * Returns an extra error message on failure (if any).
     */
    getMsg(): string | null;
    /**
     * Returns the actual object returned by the service when the status is OK.
     */
    getObject(): any;
    /**
     * Returns the status. This is "OK" on success. Failure codes include "ERROR" and "SERVICE_UNAVAILABLE".
     * 
     * If the status is "SERVICE_UNAVAILABLE", then the unavailableReason is guaranteed to be non-null.
     * @see OK
     * @see ERROR
     * @see SERVICE_UNAVAILABLE
     */
    getStatus(): string;
    /**
     * Returns the reason the status is SERVICE_UNAVAILABLE.
     * @see UNAVAILABLE_TIMEOUT
     * @see UNAVAILABLE_CIRCUIT_BROKEN
     * @see UNAVAILABLE_RATE_LIMITED
     * @see UNAVAILABLE_DISABLED
     * @see UNAVAILABLE_CONFIG_PROBLEM
     */
    getUnavailableReason(): string | null;
    /**
     * Returns the status of whether the response is the result of a "mock" service call.
     */
    isMockResult(): boolean;
    /**
     * Returns the status of whether the service call was successful.
     */
    isOk(): boolean;
    /**
     * Returns a string representation of the result.
     */
    toString(): string;
}

export = Result;
