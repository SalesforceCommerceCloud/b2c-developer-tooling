/**
 * 
 * 
 * Base class details to a Salesforce Payments payment. See Salesforce Payments documentation for how to gain access and
 * configure it for use on your sites.
 * 
 * Some payment types like SalesforcePaymentMethod.TYPE_CARD contain additional details like the card brand, or
 * the last 4 digits of the card number. Details to those payments will be of a specific subclass of this class like
 * SalesforceCardPaymentDetails. Other payment types have no additional information so their details are
 * represented by an object of this base type.
 */
declare class SalesforcePaymentDetails {
    /**
     * Returns the payment type.
     * @see SalesforcePaymentMethod.TYPE_BANCONTACT
     * @see SalesforcePaymentMethod.TYPE_CARD
     * @see SalesforcePaymentMethod.TYPE_EPS
     * @see SalesforcePaymentMethod.TYPE_IDEAL
     * @see SalesforcePaymentMethod.TYPE_KLARNA
     * @see SalesforcePaymentMethod.TYPE_SEPA_DEBIT
     * @see SalesforcePayPalOrder.TYPE_PAYPAL
     * @see SalesforcePayPalOrder.TYPE_VENMO
     */
    readonly type: string;
    /**
     * Returns the payment type.
     * @see SalesforcePaymentMethod.TYPE_BANCONTACT
     * @see SalesforcePaymentMethod.TYPE_CARD
     * @see SalesforcePaymentMethod.TYPE_EPS
     * @see SalesforcePaymentMethod.TYPE_IDEAL
     * @see SalesforcePaymentMethod.TYPE_KLARNA
     * @see SalesforcePaymentMethod.TYPE_SEPA_DEBIT
     * @see SalesforcePayPalOrder.TYPE_PAYPAL
     * @see SalesforcePayPalOrder.TYPE_VENMO
     */
    getType(): string;
}

export = SalesforcePaymentDetails;
