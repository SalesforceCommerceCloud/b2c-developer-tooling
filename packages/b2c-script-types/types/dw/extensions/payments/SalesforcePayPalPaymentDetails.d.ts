import SalesforcePaymentDetails = require('./SalesforcePaymentDetails');

/**
 * 
 * 
 * Details to a Salesforce Payments payment of type SalesforcePayPalOrder.TYPE_PAYPAL. See Salesforce Payments
 * documentation for how to gain access and configure it for use on your sites.
 */
declare class SalesforcePayPalPaymentDetails extends SalesforcePaymentDetails {
    /**
     * Returns the ID of the capture against the PayPal order, or `null` if not known.
     * @see SalesforcePayPalOrder.getCaptureID
     */
    readonly captureID: string | null;
    /**
     * Returns the email address of the payer for the PayPal order, or `null` if not known.
     * @see SalesforcePayPalOrderPayer.getEmailAddress
     */
    readonly payerEmailAddress: string | null;
    private constructor();
    /**
     * Returns the ID of the capture against the PayPal order, or `null` if not known.
     * @see SalesforcePayPalOrder.getCaptureID
     */
    getCaptureID(): string | null;
    /**
     * Returns the email address of the payer for the PayPal order, or `null` if not known.
     * @see SalesforcePayPalOrderPayer.getEmailAddress
     */
    getPayerEmailAddress(): string | null;
}

export = SalesforcePayPalPaymentDetails;
