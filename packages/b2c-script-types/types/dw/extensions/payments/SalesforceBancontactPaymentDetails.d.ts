import SalesforcePaymentDetails = require('./SalesforcePaymentDetails');

/**
 * 
 * 
 * Details to a Salesforce Payments payment of type SalesforcePaymentMethod.TYPE_BANCONTACT. See Salesforce Payments
 * documentation for how to gain access and configure it for use on your sites.
 */
declare class SalesforceBancontactPaymentDetails extends SalesforcePaymentDetails {
    /**
     * Returns the bank name, or `null` if not known.
     * @see SalesforcePaymentMethod.getBankName
     */
    readonly bankName: string | null;
    /**
     * Returns the last 4 digits of the account number, or `null` if not known.
     * @see SalesforcePaymentMethod.getLast4
     */
    readonly last4: string | null;
    private constructor();
    /**
     * Returns the bank name, or `null` if not known.
     * @see SalesforcePaymentMethod.getBankName
     */
    getBankName(): string | null;
    /**
     * Returns the last 4 digits of the account number, or `null` if not known.
     * @see SalesforcePaymentMethod.getLast4
     */
    getLast4(): string | null;
}

export = SalesforceBancontactPaymentDetails;
