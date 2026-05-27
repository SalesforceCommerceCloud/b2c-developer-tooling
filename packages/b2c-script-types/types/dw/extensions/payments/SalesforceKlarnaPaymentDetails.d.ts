import SalesforcePaymentDetails = require('./SalesforcePaymentDetails');

/**
 * 
 * 
 * Details to a Salesforce Payments payment of type SalesforcePaymentMethod.TYPE_KLARNA. See Salesforce Payments
 * documentation for how to gain access and configure it for use on your sites.
 */
declare class SalesforceKlarnaPaymentDetails extends SalesforcePaymentDetails {
    /**
     * Returns the payment method category used for the payment, or `null` if not known.
     * @see SalesforcePaymentMethod.getPaymentMethodCategory
     */
    readonly paymentMethodCategory: string | null;
    private constructor();
    /**
     * Returns the payment method category used for the payment, or `null` if not known.
     * @see SalesforcePaymentMethod.getPaymentMethodCategory
     */
    getPaymentMethodCategory(): string | null;
}

export = SalesforceKlarnaPaymentDetails;
