import Status = require('../system/Status');

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
 * In such cases the password-related properties of the Credentials will be empty.
 * 
 * Note: this class handles sensitive security-related data.
 * Pay special attention to PCI DSS v3. requirements 2, 4, and 12.
 */
declare class Credentials {
    /**
     * Returns the authentication provider ID.
     * @deprecated As of release 17.2, replaced by methods on the new class ExternalProfile
     * which can be obtained from Customer.getExternalProfiles
     * 
     * Until the method is fully removed from the API it will get the Authentication Provider from
     * the first element of the Customer.getExternalProfiles collection
     */
    authenticationProviderID: string;
    /**
     * Identifies if this customer is enabled and can log in.
     */
    readonly enabled: boolean;
    /**
     * Identifies if this customer is enabled and can log in - same as isEnabled().
     */
    enabledFlag: boolean;
    /**
     * Returns the external ID of the customer.
     * @deprecated As of release 17.2, replaced by methods on the new class ExternalProfile
     * which can be obtained from Customer.getExternalProfiles
     * 
     * Until the method is fully removed from the API it will get the External ID from
     * the first element of the Customer.getExternalProfiles collection
     */
    externalID: string;
    /**
     * Identifies if this customer is temporarily locked out because of invalid
     * login attempts.  If customer locking is not enabled, this method always
     * returns false.
     */
    readonly locked: boolean;
    /**
     * Returns the login of the user. It must be unique.
     */
    login: string;
    /**
     * Returns the answer to the password question for the customer. The answer is used
     * with the password question to confirm the identity of a customer when
     * they are trying to fetch their password.
     */
    passwordAnswer: string;
    /**
     * Returns the password question for the customer. The password question is
     * used with the password answer to confirm the identity of a customer when
     * they are trying to fetch their password.
     */
    passwordQuestion: string;
    /**
     * Returns whether the password is set. Creating externally authenticated customers
     * results in customers with credentials for which the password is not set.
     */
    readonly passwordSet: boolean;
    /**
     * Returns the number of consecutive failed logins after which this customer
     * will be temporarily locked out and prevented from logging in to the
     * current site. This value is based on the number of previous invalid
     * logins for this customer and customer site preferences defining the
     * limits.
     * 
     * If this customer is already locked out, this method will always return 0.
     * If customer locking is disabled altogether, or if the system cannot
     * determine the number of failed login attempts for this customer, then
     * this method will return a negative number.
     */
    readonly remainingLoginAttempts: number;
    private constructor();
    /**
     * Generate a random token which can be used for resetting the password of the underlying Customer. The token is
     * guaranteed to be unique and will be valid for 30 minutes. Any token previously generated for this customer will
     * be invalidated.
     */
    createResetPasswordToken(): string;
    /**
     * Returns the authentication provider ID.
     * @deprecated As of release 17.2, replaced by methods on the new class ExternalProfile
     * which can be obtained from Customer.getExternalProfiles
     * 
     * Until the method is fully removed from the API it will get the Authentication Provider from
     * the first element of the Customer.getExternalProfiles collection
     */
    getAuthenticationProviderID(): string;
    /**
     * Identifies if this customer is enabled and can log in - same as isEnabled().
     */
    getEnabledFlag(): boolean;
    /**
     * Returns the external ID of the customer.
     * @deprecated As of release 17.2, replaced by methods on the new class ExternalProfile
     * which can be obtained from Customer.getExternalProfiles
     * 
     * Until the method is fully removed from the API it will get the External ID from
     * the first element of the Customer.getExternalProfiles collection
     */
    getExternalID(): string;
    /**
     * Returns the login of the user. It must be unique.
     */
    getLogin(): string;
    /**
     * Returns the answer to the password question for the customer. The answer is used
     * with the password question to confirm the identity of a customer when
     * they are trying to fetch their password.
     */
    getPasswordAnswer(): string;
    /**
     * Returns the password question for the customer. The password question is
     * used with the password answer to confirm the identity of a customer when
     * they are trying to fetch their password.
     */
    getPasswordQuestion(): string;
    /**
     * Returns the number of consecutive failed logins after which this customer
     * will be temporarily locked out and prevented from logging in to the
     * current site. This value is based on the number of previous invalid
     * logins for this customer and customer site preferences defining the
     * limits.
     * 
     * If this customer is already locked out, this method will always return 0.
     * If customer locking is disabled altogether, or if the system cannot
     * determine the number of failed login attempts for this customer, then
     * this method will return a negative number.
     */
    getRemainingLoginAttempts(): number;
    /**
     * Identifies if this customer is enabled and can log in.
     */
    isEnabled(): boolean;
    /**
     * Identifies if this customer is temporarily locked out because of invalid
     * login attempts.  If customer locking is not enabled, this method always
     * returns false.
     */
    isLocked(): boolean;
    /**
     * Returns whether the password is set. Creating externally authenticated customers
     * results in customers with credentials for which the password is not set.
     */
    isPasswordSet(): boolean;
    /**
     * Sets the authentication provider ID corresponding to an OAuth provider configured in the system.
     * @deprecated As of release 17.2, replaced by methods on the new class ExternalProfile
     * which can be obtained from Customer.getExternalProfiles
     * 
     * Until the method is fully removed from the API it will set the Authentication Provider on
     * the first element of the Customer.getExternalProfiles collection if there is only one.
     * It will create the collection and add an element if no elements are present.
     * It will not change anything and will log an error if there are more than one elements in the collection.
     */
    setAuthenticationProviderID(authenticationProviderID: string): void;
    /**
     * Sets the enabled status of the customer.
     */
    setEnabledFlag(enabledFlag: boolean): void;
    /**
     * Sets the external ID of the customer at the authentication provider.
     * The value is provided by the authentication provider during the
     * OAuth authentication and is unique within that provider.
     * @deprecated As of release 17.2, replaced by methods on the new class ExternalProfile
     * which can be obtained from Customer.getExternalProfiles
     * 
     * Until the method is fully removed from the API it will set the ExternalID on
     * the first element of the Customer.getExternalProfiles collection if there is only one.
     * It will create the collection and add an element if no elements are present.
     * It will not change anything and will log an error if there are more than one elements in the collection.
     */
    setExternalID(externalID: string): void;
    /**
     * Sets the login value for the customer.
     * 
     * IMPORTANT: This method should no longer be used for the following
     * reasons:
     * 
     * - It changes the login without re-encrypting the password. (The
     * customer password is stored internally using a one-way encryption scheme
     * which uses the login as one of its inputs. Therefore changing the login
     * requires re-encrypting the password.)
     * - It does not validate the structure of the login to ensure that it
     * only uses acceptable characters.
     * - It does not correctly prevent duplicate logins. If the passed login
     * matches a different customer's login exactly, then this method will throw
     * an exception. However, it does not prevent the creation of inexact matches,
     * where two customers have a login differing only by alphabetic case (e.g.
     * "JaneDoe" and "janedoe")
     * @deprecated Use Credentials.setLogin
     */
    setLogin(login: string): void;
    /**
     * Sets the login value for the customer, and also re-encrypt the customer
     * password based on the new login. Customer login must be a sequence of
     * letters, numbers, and the following characters: space, period, ampersand,
     * underscore and dash.
     * 
     * This method fails to set the login and returns false in the following
     * cases:
     * 
     * - newLogin is of an invalid form (e.g. contains invalid characters).
     * - currentPassword is not the customer's correct password.
     * - newLogin is already in use by another customer (i.e. there is another
     * customer in the system with the exact same login name or a name differing
     * only by alphabetic case.)
     * 
     * If newLogin is the same as the existing login, the method does nothing and
     * returns true, regardless of whether currentPassword is the correct
     * password.
     */
    setLogin(newLogin: string, currentPassword: string): boolean;
    /**
     * Sets the password of an authenticated customer.
     * 
     * The method can be called for externally authenticated customers as well but
     * these customers will still be externally authenticated so calling the method
     * for such customers does not have an immediate practical benefit. If such customers
     * are converted back to regularly authenticated (via login and password) the new password
     * will be used.
     * 
     * Method call will fail under any of these conditions:
     * 
     * - customer is not registered
     * - customer is not authenticated
     * - verifyOldPassword=true && oldPassword is empty
     * - verifyOldPassword=true and oldPassword does not match the existing password
     * - newPassword is empty
     * - newPassword does not meet acceptance criteria
     */
    setPassword(newPassword: string, oldPassword: string, verifyOldPassword: boolean): Status;
    /**
     * Sets the answer to the password question for the customer.
     */
    setPasswordAnswer(answer: string): void;
    /**
     * Sets the password question for the customer.
     */
    setPasswordQuestion(question: string): void;
    /**
     * Set the password of the specified customer to the specified value. This operation will fail if the specified
     * token is invalid (i.e. not associated with the specified Customer), the token is expired, or the password does
     * not satisfy system password requirements.
     */
    setPasswordWithToken(token: string, newPassword: string): Status;
}

export = Credentials;
