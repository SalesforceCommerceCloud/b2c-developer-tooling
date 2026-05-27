import Collection = require('../../util/Collection');
import Money = require('../../value/Money');

/**
 * 
 * 
 * Salesforce Payments representation of a payments zone. See Salesforce Payments documentation for how to gain access
 * and configure payment zones and assign them to sites.
 * 
 * A payments zone contains information about the payment zone for a site and country.
 */
declare class SalesforcePaymentsZone {
    /**
     * Returns `true` if Afterpay Clearpay presentment is enabled, or `false` if not.
     */
    readonly afterpayClearpayEnabled: boolean;
    /**
     * Returns `true` if Apple Pay presentment is enabled, or `false` if not.
     */
    readonly applePayEnabled: boolean;
    /**
     * Returns `true` if Bancontact presentment is enabled, or `false` if not. Note: For Adyen
     * merchant accounts, this setting refers to the "Bancontact Card" payment method.
     */
    readonly bancontactEnabled: boolean;
    /**
     * Returns `true` if Bancontact Mobile presentment is enabled, or `false` if not. Note: This
     * setting is only applicable for Adyen Merchant Accounts
     */
    readonly bancontactMobileEnabled: boolean;
    /**
     * Returns `true` if credit card presentment is enabled, or `false` if not.
     */
    readonly cardEnabled: boolean;
    /**
     * Returns `true` if EPS presentment is enabled, or `false` if not.
     */
    readonly epsEnabled: boolean;
    /**
     * Returns `true` if iDEAL presentment is enabled, or `false` if not.
     */
    readonly idealEnabled: boolean;
    /**
     * Returns `true` if Klarna presentment is enabled, or `false` if not. Note: For Adyen
     * merchant accounts, this setting applies to the Klarna Pay Later payment method.
     */
    readonly klarnaEnabled: boolean;
    /**
     * Returns `true` if Klarna Pay in Installments presentment is enabled, or `false` if not.
     * Note: This setting is only applicable for Adyen Merchant Accounts.
     */
    readonly klarnaPayInInstallmentsEnabled: boolean;
    /**
     * Returns `true` if Klarna Pay Now presentment is enabled, or `false` if not. Note: This
     * setting is only applicable for Adyen Merchant Accounts.
     */
    readonly klarnaPayNowEnabled: boolean;
    /**
     * Returns `true` if PayPal multi-step checkout presentment is enabled, or `false` if not.
     */
    readonly payPalEnabled: boolean;
    /**
     * Returns `true` if PayPal express checkout presentment is enabled, or `false` if not.
     */
    readonly payPalExpressEnabled: boolean;
    /**
     * Returns `true` if W3C Payment Request API button presentment is enabled, or `false` if not.
     */
    readonly paymentRequestEnabled: boolean;
    /**
     * Returns `true` if SEPA Debit presentment is enabled, or `false` if not.
     */
    readonly sepaDebitEnabled: boolean;
    /**
     * Returns `true` if Venmo multi-step checkout presentment is enabled, or `false` if not.
     */
    readonly venmoEnabled: boolean;
    /**
     * Returns `true` if Venmo express checkout presentment is enabled, or `false` if not.
     */
    readonly venmoExpressEnabled: boolean;
    /**
     * Returns the id of the payments zone.
     */
    readonly zoneId: string;
    private constructor();
    /**
     * Returns a collection containing the merchant account payment methods to be presented for this payments zone.
     */
    getPaymentMethods(countryCode: string, amount: Money): Collection<any>;
    /**
     * Returns the id of the payments zone.
     */
    getZoneId(): string;
    /**
     * Returns `true` if Afterpay Clearpay presentment is enabled, or `false` if not.
     */
    isAfterpayClearpayEnabled(): boolean;
    /**
     * Returns `true` if Apple Pay presentment is enabled, or `false` if not.
     */
    isApplePayEnabled(): boolean;
    /**
     * Returns `true` if Bancontact presentment is enabled, or `false` if not. Note: For Adyen
     * merchant accounts, this setting refers to the "Bancontact Card" payment method.
     */
    isBancontactEnabled(): boolean;
    /**
     * Returns `true` if Bancontact Mobile presentment is enabled, or `false` if not. Note: This
     * setting is only applicable for Adyen Merchant Accounts
     */
    isBancontactMobileEnabled(): boolean;
    /**
     * Returns `true` if credit card presentment is enabled, or `false` if not.
     */
    isCardEnabled(): boolean;
    /**
     * Returns `true` if EPS presentment is enabled, or `false` if not.
     */
    isEpsEnabled(): boolean;
    /**
     * Returns `true` if iDEAL presentment is enabled, or `false` if not.
     */
    isIdealEnabled(): boolean;
    /**
     * Returns `true` if Klarna presentment is enabled, or `false` if not. Note: For Adyen
     * merchant accounts, this setting applies to the Klarna Pay Later payment method.
     */
    isKlarnaEnabled(): boolean;
    /**
     * Returns `true` if Klarna Pay in Installments presentment is enabled, or `false` if not.
     * Note: This setting is only applicable for Adyen Merchant Accounts.
     */
    isKlarnaPayInInstallmentsEnabled(): boolean;
    /**
     * Returns `true` if Klarna Pay Now presentment is enabled, or `false` if not. Note: This
     * setting is only applicable for Adyen Merchant Accounts.
     */
    isKlarnaPayNowEnabled(): boolean;
    /**
     * Returns `true` if PayPal multi-step checkout presentment is enabled, or `false` if not.
     */
    isPayPalEnabled(): boolean;
    /**
     * Returns `true` if PayPal express checkout presentment is enabled, or `false` if not.
     */
    isPayPalExpressEnabled(): boolean;
    /**
     * Returns `true` if W3C Payment Request API button presentment is enabled, or `false` if not.
     */
    isPaymentRequestEnabled(): boolean;
    /**
     * Returns `true` if SEPA Debit presentment is enabled, or `false` if not.
     */
    isSepaDebitEnabled(): boolean;
    /**
     * Returns `true` if Venmo multi-step checkout presentment is enabled, or `false` if not.
     */
    isVenmoEnabled(): boolean;
    /**
     * Returns `true` if Venmo express checkout presentment is enabled, or `false` if not.
     */
    isVenmoExpressEnabled(): boolean;
}

export = SalesforcePaymentsZone;
