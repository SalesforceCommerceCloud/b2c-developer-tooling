import SalesforcePaymentDetails = require('./SalesforcePaymentDetails');

/**
 * 
 * 
 * Details to a Salesforce Payments payment of type SalesforcePaymentMethod.TYPE_SEPA_DEBIT. See Salesforce Payments
 * documentation for how to gain access and configure it for use on your sites.
 */
declare class SalesforceSepaDebitPaymentDetails extends SalesforcePaymentDetails {
    /**
     * Returns the last 4 digits of the account number, or `null` if not known.
     * @see SalesforcePaymentMethod.getLast4
     */
    readonly last4: string | null;
    private constructor();
    /**
     * Returns the last 4 digits of the account number, or `null` if not known.
     * @see SalesforcePaymentMethod.getLast4
     */
    getLast4(): string | null;
}

export = SalesforceSepaDebitPaymentDetails;
