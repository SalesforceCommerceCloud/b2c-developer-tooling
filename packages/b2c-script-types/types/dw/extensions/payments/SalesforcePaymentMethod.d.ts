import SalesforcePaymentDetails = require('./SalesforcePaymentDetails');
import OrderPaymentInstrument = require('../../order/OrderPaymentInstrument');

/**
 * 
 * 
 * Salesforce Payments representation of a payment method object. See Salesforce Payments documentation for how
 * to gain access and configure it for use on your sites.
 * 
 * A payment method contains information about a credential used by a shopper to attempt payment, such as a payment card
 * or bank account. The available information differs for each type of payment method. It includes only limited
 * information that can be safely presented to a shopper to remind them what credential they used, and specifically not
 * complete card, account, or other numbers that could be used to make future payments.
 */
declare class SalesforcePaymentMethod {
    /**
     * Represents the Afterpay Clearpay payment method.
     */
    static readonly TYPE_AFTERPAY_CLEARPAY = "afterpay_clearpay";
    /**
     * Represents the Bancontact payment method.
     */
    static readonly TYPE_BANCONTACT = "bancontact";
    /**
     * Represents a credit card type of payment method.
     */
    static readonly TYPE_CARD = "card";
    /**
     * Represents the EPS (Electronic Payment Standard) payment method.
     */
    static readonly TYPE_EPS = "eps";
    /**
     * Represents the iDEAL payment method.
     */
    static readonly TYPE_IDEAL = "ideal";
    /**
     * Represents the Klarna payment method.
     */
    static readonly TYPE_KLARNA = "klarna";
    /**
     * Represents the SEPA Debit payment method.
     */
    static readonly TYPE_SEPA_DEBIT = "sepa_debit";
    /**
     * Returns the identifier of this payment method.
     */
    readonly ID: string;
    /**
     * Returns the bank of this payment method, or `null` if none is available. Available on
     * SalesforcePaymentMethod.TYPE_IDEAL and SalesforcePaymentMethod.TYPE_EPS type methods.
     */
    readonly bank: string | null;
    /**
     * Returns the bank code of this payment method, or `null` if none is available. Available on
     * SalesforcePaymentMethod.TYPE_SEPA_DEBIT and SalesforcePaymentMethod.TYPE_BANCONTACT type methods.
     */
    readonly bankCode: string | null;
    /**
     * Returns the bank name of this payment method, or `null` if none is available. Available on
     * SalesforcePaymentMethod.TYPE_BANCONTACT type methods.
     */
    readonly bankName: string | null;
    /**
     * Returns the bank branch code of this payment method, or `null` if none is available. Available on
     * SalesforcePaymentMethod.TYPE_SEPA_DEBIT type methods.
     */
    readonly branchCode: string | null;
    /**
     * Returns the brand of this payment method, or `null` if none is available. Available on
     * SalesforcePaymentMethod.TYPE_CARD type methods.
     */
    readonly brand: string | null;
    /**
     * Returns the country of this payment method, or `null` if none is available. Available on
     * SalesforcePaymentMethod.TYPE_SEPA_DEBIT type methods.
     */
    readonly country: string | null;
    /**
     * Returns the last 4 digits of the credential for this payment method, or `null` if none is available.
     * Available on SalesforcePaymentMethod.TYPE_CARD, SalesforcePaymentMethod.TYPE_SEPA_DEBIT, and
     * SalesforcePaymentMethod.TYPE_BANCONTACT type methods.
     */
    readonly last4: string | null;
    /**
     * Returns the payment method category of this payment method, or `null` if none is available. Available
     * on SalesforcePaymentMethod.TYPE_KLARNA type methods.
     */
    readonly paymentMethodCategory: string | null;
    /**
     * Returns the type of this payment method.
     * @see SalesforcePaymentMethod.TYPE_BANCONTACT
     * @see SalesforcePaymentMethod.TYPE_CARD
     * @see SalesforcePaymentMethod.TYPE_EPS
     * @see SalesforcePaymentMethod.TYPE_AFTERPAY_CLEARPAY
     * @see SalesforcePaymentMethod.TYPE_IDEAL
     * @see SalesforcePaymentMethod.TYPE_SEPA_DEBIT
     */
    readonly type: string;
    private constructor();
    /**
     * Returns the bank of this payment method, or `null` if none is available. Available on
     * SalesforcePaymentMethod.TYPE_IDEAL and SalesforcePaymentMethod.TYPE_EPS type methods.
     */
    getBank(): string | null;
    /**
     * Returns the bank code of this payment method, or `null` if none is available. Available on
     * SalesforcePaymentMethod.TYPE_SEPA_DEBIT and SalesforcePaymentMethod.TYPE_BANCONTACT type methods.
     */
    getBankCode(): string | null;
    /**
     * Returns the bank name of this payment method, or `null` if none is available. Available on
     * SalesforcePaymentMethod.TYPE_BANCONTACT type methods.
     */
    getBankName(): string | null;
    /**
     * Returns the bank branch code of this payment method, or `null` if none is available. Available on
     * SalesforcePaymentMethod.TYPE_SEPA_DEBIT type methods.
     */
    getBranchCode(): string | null;
    /**
     * Returns the brand of this payment method, or `null` if none is available. Available on
     * SalesforcePaymentMethod.TYPE_CARD type methods.
     */
    getBrand(): string | null;
    /**
     * Returns the country of this payment method, or `null` if none is available. Available on
     * SalesforcePaymentMethod.TYPE_SEPA_DEBIT type methods.
     */
    getCountry(): string | null;
    /**
     * Returns the identifier of this payment method.
     */
    getID(): string;
    /**
     * Returns the last 4 digits of the credential for this payment method, or `null` if none is available.
     * Available on SalesforcePaymentMethod.TYPE_CARD, SalesforcePaymentMethod.TYPE_SEPA_DEBIT, and
     * SalesforcePaymentMethod.TYPE_BANCONTACT type methods.
     */
    getLast4(): string | null;
    /**
     * Returns the details to the Salesforce Payments payment for this payment method, using the given payment
     * instrument.
     */
    getPaymentDetails(paymentInstrument: OrderPaymentInstrument): SalesforcePaymentDetails;
    /**
     * Returns the payment method category of this payment method, or `null` if none is available. Available
     * on SalesforcePaymentMethod.TYPE_KLARNA type methods.
     */
    getPaymentMethodCategory(): string | null;
    /**
     * Returns the type of this payment method.
     * @see SalesforcePaymentMethod.TYPE_BANCONTACT
     * @see SalesforcePaymentMethod.TYPE_CARD
     * @see SalesforcePaymentMethod.TYPE_EPS
     * @see SalesforcePaymentMethod.TYPE_AFTERPAY_CLEARPAY
     * @see SalesforcePaymentMethod.TYPE_IDEAL
     * @see SalesforcePaymentMethod.TYPE_SEPA_DEBIT
     */
    getType(): string;
}

export = SalesforcePaymentMethod;
