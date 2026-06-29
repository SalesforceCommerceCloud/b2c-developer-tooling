/**
 * 
 * 
 * Salesforce Payments representation of an Adyen saved payment method object. See Salesforce Payments documentation for
 * how to gain access and configure it for use on your sites.
 * 
 * An Adyen saved payment method contains information about a credential used by a shopper to attempt payment, such as a
 * payment card or bank account. The available information differs for each type of payment method. It includes only
 * limited information that can be safely presented to a shopper to remind them what credential they used, and
 * specifically not complete card, account, or other numbers that could be used to make future payments.
 */
declare class SalesforceAdyenSavedPaymentMethod {
    /**
     * Represents the Bancontact payment method.
     */
    static readonly TYPE_BANCONTACT = "bancontact";
    /**
     * Represents a credit card type of payment method.
     */
    static readonly TYPE_CARD = "card";
    /**
     * Represents the iDEAL payment method.
     */
    static readonly TYPE_IDEAL = "ideal";
    /**
     * Represents the SEPA Debit payment method.
     */
    static readonly TYPE_SEPA_DEBIT = "sepa_debit";
    /**
     * Returns the identifier of this payment method.
     */
    readonly ID: string;
    /**
     * Returns the brand of this payment method, or `null` if none is available. Available on
     * SalesforceAdyenSavedPaymentMethod.TYPE_CARD type methods.
     */
    readonly brand: string | null;
    /**
     * Returns the expiry month of the card for this payment method, or `null` if none is available.
     * Available on SalesforceAdyenSavedPaymentMethod.TYPE_CARD and
     * SalesforceAdyenSavedPaymentMethod.TYPE_BANCONTACT type methods.
     */
    readonly expiryMonth: string | null;
    /**
     * Returns the expiry year of the card for this payment method, or `null` if none is available. Available
     * on SalesforceAdyenSavedPaymentMethod.TYPE_CARD and
     * SalesforceAdyenSavedPaymentMethod.TYPE_BANCONTACT type methods.
     */
    readonly expiryYear: string | null;
    /**
     * Returns the cardholder name for this payment method, or `null` if none is available. Available on
     * SalesforceAdyenSavedPaymentMethod.TYPE_CARD and SalesforceAdyenSavedPaymentMethod.TYPE_BANCONTACT
     * type methods.
     */
    readonly holderName: string | null;
    /**
     * Returns the last 4 digits of the credential for this payment method, or `null` if none is available.
     * Available on SalesforceAdyenSavedPaymentMethod.TYPE_CARD and
     * SalesforceAdyenSavedPaymentMethod.TYPE_BANCONTACT type methods.
     */
    readonly last4: string | null;
    /**
     * Returns the back account owner name for this payment method, or `null` if none is available. Available
     * on SalesforceAdyenSavedPaymentMethod.TYPE_SEPA_DEBIT and
     * SalesforceAdyenSavedPaymentMethod.TYPE_IDEAL type method.
     */
    readonly ownerName: string | null;
    /**
     * Returns the type of this payment method.
     * @see SalesforceAdyenSavedPaymentMethod.TYPE_BANCONTACT
     * @see SalesforceAdyenSavedPaymentMethod.TYPE_CARD
     * @see SalesforceAdyenSavedPaymentMethod.TYPE_IDEAL
     * @see SalesforceAdyenSavedPaymentMethod.TYPE_SEPA_DEBIT
     */
    readonly type: string;
    private constructor();
    /**
     * Returns the brand of this payment method, or `null` if none is available. Available on
     * SalesforceAdyenSavedPaymentMethod.TYPE_CARD type methods.
     */
    getBrand(): string | null;
    /**
     * Returns the expiry month of the card for this payment method, or `null` if none is available.
     * Available on SalesforceAdyenSavedPaymentMethod.TYPE_CARD and
     * SalesforceAdyenSavedPaymentMethod.TYPE_BANCONTACT type methods.
     */
    getExpiryMonth(): string | null;
    /**
     * Returns the expiry year of the card for this payment method, or `null` if none is available. Available
     * on SalesforceAdyenSavedPaymentMethod.TYPE_CARD and
     * SalesforceAdyenSavedPaymentMethod.TYPE_BANCONTACT type methods.
     */
    getExpiryYear(): string | null;
    /**
     * Returns the cardholder name for this payment method, or `null` if none is available. Available on
     * SalesforceAdyenSavedPaymentMethod.TYPE_CARD and SalesforceAdyenSavedPaymentMethod.TYPE_BANCONTACT
     * type methods.
     */
    getHolderName(): string | null;
    /**
     * Returns the identifier of this payment method.
     */
    getID(): string;
    /**
     * Returns the last 4 digits of the credential for this payment method, or `null` if none is available.
     * Available on SalesforceAdyenSavedPaymentMethod.TYPE_CARD and
     * SalesforceAdyenSavedPaymentMethod.TYPE_BANCONTACT type methods.
     */
    getLast4(): string | null;
    /**
     * Returns the back account owner name for this payment method, or `null` if none is available. Available
     * on SalesforceAdyenSavedPaymentMethod.TYPE_SEPA_DEBIT and
     * SalesforceAdyenSavedPaymentMethod.TYPE_IDEAL type method.
     */
    getOwnerName(): string | null;
    /**
     * Returns the type of this payment method.
     * @see SalesforceAdyenSavedPaymentMethod.TYPE_BANCONTACT
     * @see SalesforceAdyenSavedPaymentMethod.TYPE_CARD
     * @see SalesforceAdyenSavedPaymentMethod.TYPE_IDEAL
     * @see SalesforceAdyenSavedPaymentMethod.TYPE_SEPA_DEBIT
     */
    getType(): string;
}

export = SalesforceAdyenSavedPaymentMethod;
