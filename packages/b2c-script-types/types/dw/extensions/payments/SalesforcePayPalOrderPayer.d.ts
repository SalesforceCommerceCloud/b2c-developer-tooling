/**
 * 
 * 
 * Salesforce Payments representation of a PayPal order's payer object. See Salesforce Payments documentation
 * for how to gain access and configure it for use on your sites.
 */
declare class SalesforcePayPalOrderPayer {
    /**
     * Returns the payer's email address.
     */
    readonly emailAddress: string;
    /**
     * Returns the payer's given name.
     */
    readonly givenName: string;
    /**
     * Returns the payer's national phone number.
     */
    readonly phone: string;
    /**
     * Returns the payer's surname.
     */
    readonly surname: string;
    private constructor();
    /**
     * Returns the payer's email address.
     */
    getEmailAddress(): string;
    /**
     * Returns the payer's given name.
     */
    getGivenName(): string;
    /**
     * Returns the payer's national phone number.
     */
    getPhone(): string;
    /**
     * Returns the payer's surname.
     */
    getSurname(): string;
}

export = SalesforcePayPalOrderPayer;
