import SalesforcePaymentDetails = require('./SalesforcePaymentDetails');

/**
 * 
 * 
 * Details to a Salesforce Payments payment of type SalesforcePaymentMethod.TYPE_IDEAL. See Salesforce Payments
 * documentation for how to gain access and configure it for use on your sites.
 */
declare class SalesforceIdealPaymentDetails extends SalesforcePaymentDetails {
    /**
     * Returns the bank used for the payment, or `null` if not known.
     * @see SalesforcePaymentMethod.getBank
     */
    readonly bank: string | null;
    private constructor();
    /**
     * Returns the bank used for the payment, or `null` if not known.
     * @see SalesforcePaymentMethod.getBank
     */
    getBank(): string | null;
}

export = SalesforceIdealPaymentDetails;
