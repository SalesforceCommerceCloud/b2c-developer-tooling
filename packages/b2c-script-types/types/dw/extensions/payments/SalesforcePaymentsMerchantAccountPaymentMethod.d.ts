import SalesforcePaymentsMerchantAccount = require('./SalesforcePaymentsMerchantAccount');
import Collection = require('../../util/Collection');

/**
 * Contains information about a payment method to be presented to a payer, as configured for a Salesforce Payments
 * merchant account. See Salesforce Payments documentation for how to gain access and configure it for use on your
 * sites.
 */
declare class SalesforcePaymentsMerchantAccountPaymentMethod {
    /**
     * Returns the merchant account configured for this payment method.
     */
    readonly merchantAccount: SalesforcePaymentsMerchantAccount;
    /**
     * Returns the constant indicating the type of payment method to be presented, such as
     * SalesforcePaymentMethod.TYPE_CARD.
     */
    readonly paymentMethodType: string;
    /**
     * Returns a collection containing the payment modes for which this payment method is to be presented, such as
     * `"Express"`.
     */
    readonly paymentModes: Collection<any>;
    private constructor();
    /**
     * Returns the merchant account configured for this payment method.
     */
    getMerchantAccount(): SalesforcePaymentsMerchantAccount;
    /**
     * Returns the constant indicating the type of payment method to be presented, such as
     * SalesforcePaymentMethod.TYPE_CARD.
     */
    getPaymentMethodType(): string;
    /**
     * Returns a collection containing the payment modes for which this payment method is to be presented, such as
     * `"Express"`.
     */
    getPaymentModes(): Collection<any>;
}

export = SalesforcePaymentsMerchantAccountPaymentMethod;
