/**
 * Contains information about a merchant account configured for use with Salesforce Payments. See Salesforce Payments
 * documentation for how to gain access and configure it for use on your sites.
 */
declare class SalesforcePaymentsMerchantAccount {
    /**
     * Returns the ID of the Salesforce Payments merchant account.
     * @see dw.order.PaymentTransaction.setAccountID
     * @see dw.order.PaymentTransaction.getAccountID
     */
    readonly accountId: string;
    /**
     * Returns the type of the Salesforce Payments merchant account and environment, such as `"STRIPE_TEST"`
     * or `"ADYEN_LIVE"`.
     * @see dw.order.PaymentTransaction.setAccountType
     * @see dw.order.PaymentTransaction.getAccountType
     */
    readonly accountType: string;
    /**
     * Returns an opaque configuration object containing gateway-specific information. Do not depend on the structure or
     * contents of this object as they may change at any time.
     */
    readonly config: Object;
    /**
     * Returns `true` if the account takes live payments, or `false` if it takes test payments.
     */
    readonly live: boolean;
    /**
     * Returns the name of the gateway vendor, such as `"Stripe"` or `"Adyen"`.
     */
    readonly vendor: string;
    private constructor();
    /**
     * Returns the ID of the Salesforce Payments merchant account.
     * @see dw.order.PaymentTransaction.setAccountID
     * @see dw.order.PaymentTransaction.getAccountID
     */
    getAccountId(): string;
    /**
     * Returns the type of the Salesforce Payments merchant account and environment, such as `"STRIPE_TEST"`
     * or `"ADYEN_LIVE"`.
     * @see dw.order.PaymentTransaction.setAccountType
     * @see dw.order.PaymentTransaction.getAccountType
     */
    getAccountType(): string;
    /**
     * Returns an opaque configuration object containing gateway-specific information. Do not depend on the structure or
     * contents of this object as they may change at any time.
     */
    getConfig(): Object;
    /**
     * Returns the name of the gateway vendor, such as `"Stripe"` or `"Adyen"`.
     */
    getVendor(): string;
    /**
     * Returns `true` if the account takes live payments, or `false` if it takes test payments.
     */
    isLive(): boolean;
}

export = SalesforcePaymentsMerchantAccount;
