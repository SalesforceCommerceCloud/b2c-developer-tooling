import Customer = require('./Customer');

/**
 * Holds the status of an authentication process.
 */
declare class AuthenticationStatus {
    /**
     * Authentication was successful
     */
    static readonly AUTH_OK = "AUTH_OK";
    /**
     * customer could be found, but is disabled. Password was not verified.
     */
    static readonly ERROR_CUSTOMER_DISABLED = "ERROR_CUSTOMER_DISABLED";
    /**
     * customer could be found, but is locked (too many failed login attempts). Password was verified before.
     */
    static readonly ERROR_CUSTOMER_LOCKED = "ERROR_CUSTOMER_LOCKED";
    /**
     * customer could not be found
     */
    static readonly ERROR_CUSTOMER_NOT_FOUND = "ERROR_CUSTOMER_NOT_FOUND";
    /**
     * Password does match, but is expired.
     */
    static readonly ERROR_PASSWORD_EXPIRED = "ERROR_PASSWORD_EXPIRED";
    /**
     * the used password is not correct
     */
    static readonly ERROR_PASSWORD_MISMATCH = "ERROR_PASSWORD_MISMATCH";
    /**
     * Any other error
     */
    static readonly ERROR_UNKNOWN = "ERROR_UNKNOWN";
    /**
     * checks whether the authentication was successful or not
     */
    readonly authenticated: boolean;
    /**
     * The customer, corresponding to the login used during authentication. This customer is not logged in after authentication.
     */
    readonly customer: Customer;
    /**
     * the status code (see the constants above)
     */
    readonly status: string;
    private constructor();
    /**
     * The customer, corresponding to the login used during authentication. This customer is not logged in after authentication.
     */
    getCustomer(): Customer;
    /**
     * the status code (see the constants above)
     */
    getStatus(): string;
    /**
     * checks whether the authentication was successful or not
     */
    isAuthenticated(): boolean;
}

export = AuthenticationStatus;
