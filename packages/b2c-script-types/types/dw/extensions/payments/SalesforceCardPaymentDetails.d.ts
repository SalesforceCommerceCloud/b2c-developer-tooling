import SalesforcePaymentDetails = require('./SalesforcePaymentDetails');

/**
 * 
 * 
 * Details to a Salesforce Payments payment of type SalesforcePaymentMethod.TYPE_CARD. See Salesforce Payments
 * documentation for how to gain access and configure it for use on your sites.
 */
declare class SalesforceCardPaymentDetails extends SalesforcePaymentDetails {
    /**
     * Returns the card brand, or `null` if not known.
     * @see SalesforcePaymentMethod.getBrand
     */
    readonly brand: string | null;
    /**
     * Returns the last 4 digits of the card number, or `null` if not known.
     * @see SalesforcePaymentMethod.getLast4
     */
    readonly last4: string | null;
    /**
     * Returns the type of wallet used to make the card payment, or `null` if not known.
     */
    readonly walletType: string | null;
    private constructor();
    /**
     * Returns the card brand, or `null` if not known.
     * @see SalesforcePaymentMethod.getBrand
     */
    getBrand(): string | null;
    /**
     * Returns the last 4 digits of the card number, or `null` if not known.
     * @see SalesforcePaymentMethod.getLast4
     */
    getLast4(): string | null;
    /**
     * Returns the type of wallet used to make the card payment, or `null` if not known.
     */
    getWalletType(): string | null;
}

export = SalesforceCardPaymentDetails;
