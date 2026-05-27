import Customer = require('./Customer');

/**
 * Represents the credentials of a customer.
 * 
 * Since 13.6 it is possible to have customers who are not authenticated through a
 * login and password but through an external authentication provider via the OAuth2 protocol.
 * 
 * In such cases, the AuthenticationProviderID will point to an OAuth provider configured in the system
 * and the ExternalID will be the unique identifier of the customer on the Authentication Provider's system.
 * 
 * For example, if an authentication provider with ID "Google123" is configured pointing to Google
 * and the customer has a logged in into Google in the past and has created a profile there, Google
 * assigns a unique number identifier to that customer. If the storefront is configured to allow
 * authentication through Google and a new customer logs into the storefront using Google,
 * the AuthenticationProviderID property of his Credentials will contain "Google123" and
 * the ExternalID property will contain whatever unique identifier Google has assigned to him.
 * 
 * Note: this class handles sensitive security-related data.
 * Pay special attention to PCI DSS v3. requirements 2, 4, and 12.
 */
declare class ExternalProfile {
    /**
     * Returns the authentication provider ID.
     */
    readonly authenticationProviderID: string;
    /**
     * Returns the customer object related to this profile.
     */
    readonly customer: Customer;
    /**
     * Returns the customer's email address.
     */
    email: string;
    /**
     * Returns the external ID.
     */
    readonly externalID: string;
    /**
     * Returns the last login time of the customer through the external provider
     */
    readonly lastLoginTime: Date;
    private constructor();
    /**
     * Returns the authentication provider ID.
     */
    getAuthenticationProviderID(): string;
    /**
     * Returns the customer object related to this profile.
     */
    getCustomer(): Customer;
    /**
     * Returns the customer's email address.
     */
    getEmail(): string;
    /**
     * Returns the external ID.
     */
    getExternalID(): string;
    /**
     * Returns the last login time of the customer through the external provider
     */
    getLastLoginTime(): Date;
    /**
     * Sets the customer's email address.
     */
    setEmail(email: string): void;
}

export = ExternalProfile;
