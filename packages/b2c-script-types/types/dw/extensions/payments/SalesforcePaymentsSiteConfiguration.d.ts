/**
 * 
 * 
 * Salesforce Payments representation of a payment site configuration object. See Salesforce Payments
 * documentation for how to gain access and configure it for use on your sites.
 * 
 * A payment site configuration contains information about the configuration of the site such as
 * whether the site is activated with Express Checkout, Multi-Step Checkout or both.
 */
declare class SalesforcePaymentsSiteConfiguration {
    /**
     * Returns true if the capture method is set to automatic for credit card Payment Intents created for this site, or
     * false if the capture method is set to manual.
     */
    readonly cardCaptureAutomatic: boolean;
    /**
     * Returns true if Express Checkout is enabled for the site.
     */
    readonly expressCheckoutEnabled: boolean;
    /**
     * Returns true if Express Checkout is enabled on the Cart page.
     */
    readonly expressOnCartEnabled: boolean;
    /**
     * Returns true if Express Checkout is enabled on the Checkout page.
     */
    readonly expressOnCheckoutEnabled: boolean;
    /**
     * Returns true if Express Checkout is enabled on the Mini-Cart.
     */
    readonly expressOnMiniCartEnabled: boolean;
    /**
     * Returns true if Express Checkout is enabled on the Product Detail Page.
     */
    readonly expressOnPdpEnabled: boolean;
    /**
     * Returns true if the payment card credential storage is configured to set up all applicable payments for off
     * session reuse, or false if the credential storage is configured to set up for on session reuse only the payments
     * for which the shopper actively confirms use of saved credentials.
     */
    readonly futureUsageOffSession: boolean;
    /**
     * Returns true if Multi-Step Checkout is enabled for the site.
     */
    readonly multiStepCheckoutEnabled: boolean;
    private constructor();
    /**
     * Returns true if the capture method is set to automatic for credit card Payment Intents created for this site, or
     * false if the capture method is set to manual.
     */
    isCardCaptureAutomatic(): boolean;
    /**
     * Returns true if Express Checkout is enabled for the site.
     */
    isExpressCheckoutEnabled(): boolean;
    /**
     * Returns true if Express Checkout is enabled on the Cart page.
     */
    isExpressOnCartEnabled(): boolean;
    /**
     * Returns true if Express Checkout is enabled on the Checkout page.
     */
    isExpressOnCheckoutEnabled(): boolean;
    /**
     * Returns true if Express Checkout is enabled on the Mini-Cart.
     */
    isExpressOnMiniCartEnabled(): boolean;
    /**
     * Returns true if Express Checkout is enabled on the Product Detail Page.
     */
    isExpressOnPdpEnabled(): boolean;
    /**
     * Returns true if the payment card credential storage is configured to set up all applicable payments for off
     * session reuse, or false if the credential storage is configured to set up for on session reuse only the payments
     * for which the shopper actively confirms use of saved credentials.
     */
    isFutureUsageOffSession(): boolean;
    /**
     * Returns true if Multi-Step Checkout is enabled for the site.
     */
    isMultiStepCheckoutEnabled(): boolean;
}

export = SalesforcePaymentsSiteConfiguration;
