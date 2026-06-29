/**
 * AgentUserStatusCodes contains constants representing status codes that can be
 * used with a dw.system.Status object to indicate the success or failure of the agent
 * user login process.
 * @see dw.system.Status
 */
declare class AgentUserStatusCodes {
    /**
     * Indicates that the agent user is not available.
     */
    static readonly AGENT_USER_NOT_AVAILABLE: string;
    /**
     * Indicates that the agent user is not logged in.
     */
    static readonly AGENT_USER_NOT_LOGGED_IN: string;
    /**
     * Indicates that the given agent user login or password was wrong.
     */
    static readonly CREDENTIALS_INVALID: string;
    /**
     * Indicates that the customer is disabled.
     */
    static readonly CUSTOMER_DISABLED: string;
    /**
     * Indicates that the customer is either not registered or not registered with the current site.
     */
    static readonly CUSTOMER_UNREGISTERED: string;
    /**
     * Indicates that the current connection is not secure (HTTP instead of HTTPS)
     * and the server is configured to require a secure connection.
     */
    static readonly INSECURE_CONNECTION: string;
    /**
     * Indicates that the given agent user does not have the permission
     * 'Login_Agent' which is required to login to the storefront as an agent
     * user.
     */
    static readonly INSUFFICIENT_PERMISSION: string;
    /**
     * Indicates that the agent user login was successful.
     */
    static readonly LOGIN_SUCCESSFUL: string;
    /**
     * Indicates that the current context is not a storefront request.
     */
    static readonly NO_STOREFRONT: string;
    /**
     * Indicates that the given agent user password has expired and needs to be
     * changed in the Business Manager.
     */
    static readonly PASSWORD_EXPIRED: string;
    /**
     * Indicates that the agent user account has been disabled in the Business
     * Manager.
     */
    static readonly USER_DISABLED: string;
    /**
     * Indicates that the agent user account is locked, because the maximum
     * number of failed login attempts was exceeded.
     */
    static readonly USER_LOCKED: string;
}

export = AgentUserStatusCodes;
