import utilSet = require('../../util/Set');
import Basket = require('../../order/Basket');

/**
 * 
 * 
 * Salesforce Payments request for a shopper to make payment. See Salesforce Payments documentation for how to
 * gain access and configure it for use on your sites.
 * 
 * A request is required to render payment methods and/or express checkout buttons using `<ispayment>`
 * or `<isbuynow>`. You can call methods on the payment request to configure which payment methods
 * and/or express checkout buttons may be presented, and customize their visual presentation.
 * 
 * When used with `<isbuynow>` you must provide the necessary data to prepare the shopper basket to buy
 * the product, and the necessary payment request options for the browser payment app.
 */
declare class SalesforcePaymentRequest {
    /**
     * Element for the Stripe Afterpay/Clearpay message `"afterpayClearpayMessage"`.
     */
    static readonly ELEMENT_AFTERPAY_CLEARPAY_MESSAGE = "afterpayClearpayMessage";
    /**
     * Element for the Stripe credit card CVC field `"cardCvc"`.
     */
    static readonly ELEMENT_CARD_CVC = "cardCvc";
    /**
     * Element for the Stripe credit card expiration date field `"cardExpiry"`.
     */
    static readonly ELEMENT_CARD_EXPIRY = "cardExpiry";
    /**
     * Element for the Stripe credit card number field `"cardNumber"`.
     */
    static readonly ELEMENT_CARD_NUMBER = "cardNumber";
    /**
     * Element for the Stripe EPS bank selection field `"epsBank"`.
     */
    static readonly ELEMENT_EPS_BANK = "epsBank";
    /**
     * Element for the Stripe IBAN field `"iban"`.
     */
    static readonly ELEMENT_IBAN = "iban";
    /**
     * Element for the Stripe iDEAL bank selection field `"idealBank"`.
     */
    static readonly ELEMENT_IDEAL_BANK = "idealBank";
    /**
     * Element for the Stripe payment request button `"paymentRequestButton"`.
     */
    static readonly ELEMENT_PAYMENT_REQUEST_BUTTON = "paymentRequestButton";
    /**
     * Element type name for Afterpay.
     */
    static readonly ELEMENT_TYPE_AFTERPAY_CLEARPAY = "afterpay_clearpay";
    /**
     * Element type name for Afterpay/Clearpay message.
     */
    static readonly ELEMENT_TYPE_AFTERPAY_CLEARPAY_MESSAGE = "afterpayclearpaymessage";
    /**
     * Element type name for Apple Pay payment request buttons.
     */
    static readonly ELEMENT_TYPE_APPLEPAY = "applepay";
    /**
     * Element type name for Bancontact.
     */
    static readonly ELEMENT_TYPE_BANCONTACT = "bancontact";
    /**
     * Element type name for credit cards.
     */
    static readonly ELEMENT_TYPE_CARD = "card";
    /**
     * Element type name for EPS.
     */
    static readonly ELEMENT_TYPE_EPS = "eps";
    /**
     * Element type name for iDEAL.
     */
    static readonly ELEMENT_TYPE_IDEAL = "ideal";
    /**
     * Element type name for other payment request buttons besides Apple Pay, like Google Pay.
     */
    static readonly ELEMENT_TYPE_PAYMENTREQUEST = "paymentrequest";
    /**
     * Element type name for PayPal in multi-step checkout.
     */
    static readonly ELEMENT_TYPE_PAYPAL = "paypal";
    /**
     * Element type name for PayPal in express checkout.
     */
    static readonly ELEMENT_TYPE_PAYPAL_EXPRESS = "paypalexpress";
    /**
     * Element type name for the PayPal messages component.
     */
    static readonly ELEMENT_TYPE_PAYPAL_MESSAGE = "paypalmessage";
    /**
     * Element type name for SEPA debit.
     */
    static readonly ELEMENT_TYPE_SEPA_DEBIT = "sepa_debit";
    /**
     * Element type name for Venmo in multi-step checkout.
     */
    static readonly ELEMENT_TYPE_VENMO = "venmo";
    /**
     * Element type name for Venmo in express checkout.
     */
    static readonly ELEMENT_TYPE_VENMO_EXPRESS = "venmoexpress";
    /**
     * PayPal application context `shipping_preference` value `"GET_FROM_FILE"`, to use the
     * customer-provided shipping address on the PayPal site.
     */
    static readonly PAYPAL_SHIPPING_PREFERENCE_GET_FROM_FILE = "GET_FROM_FILE";
    /**
     * PayPal application context `shipping_preference` value `"NO_SHIPPING"`, to redact the
     * shipping address from the PayPal site. Recommended for digital goods.
     */
    static readonly PAYPAL_SHIPPING_PREFERENCE_NO_SHIPPING = "NO_SHIPPING";
    /**
     * PayPal application context `shipping_preference` value `"SET_PROVIDED_ADDRESS"`, to use the
     * merchant-provided address. The customer cannot change this address on the PayPal site.
     */
    static readonly PAYPAL_SHIPPING_PREFERENCE_SET_PROVIDED_ADDRESS = "SET_PROVIDED_ADDRESS";
    /**
     * PayPal application context `user_action` value `"CONTINUE"`. Use this option when the final
     * amount is not known when the checkout flow is initiated and you want to redirect the customer to the merchant
     * page without processing the payment.
     */
    static readonly PAYPAL_USER_ACTION_CONTINUE = "CONTINUE";
    /**
     * PayPal application context `user_action` value `"PAY_NOW"`. Use this option when the final
     * amount is known when the checkout is initiated and you want to process the payment immediately when the customer
     * clicks Pay Now.
     */
    static readonly PAYPAL_USER_ACTION_PAY_NOW = "PAY_NOW";
    /**
     * Returns the identifier of this payment request.
     */
    readonly ID: string;
    /**
     * Returns a JS object containing the data used to prepare the shopper basket when a Buy Now button is tapped.
     * @see setBasketData
     */
    basketData: Object;
    /**
     * Returns a JS object containing the billing details to use when a Stripe PaymentMethod is created.
     * @see setBillingDetails
     */
    billingDetails: Object;
    /**
     * Returns `true` if the credit card payment should be automatically captured at the time of the sale, or
     * `false` if the credit card payment should be captured later.
     */
    cardCaptureAutomatic: boolean;
    /**
     * 
     * 
     * Returns a set containing the element types to be explicitly excluded from mounted components. See the element
     * type constants in this class for the full list of supported element types.
     * 
     * Note: if an element type is both explicitly included and excluded, it will not be presented.
     * @see addExclude
     */
    readonly exclude: utilSet<any>;
    /**
     * 
     * 
     * Returns a set containing the specific element types to include in mounted components. If the set is
     * empty then all applicable and enabled element types will be included by default. See the element type constants
     * in this class for the full list of supported element types.
     * 
     * Note: if an element type is both explicitly included and excluded, it will not be presented.
     * @see addInclude
     */
    readonly include: utilSet<any>;
    /**
     * Returns the DOM element selector where to mount payment methods and/or express checkout buttons.
     */
    readonly selector: string;
    /**
     * Returns `true` if the payment method should be always saved for future use off session, or
     * `false` if the payment method should be only saved for future use on session when appropriate.
     */
    setupFutureUsage: boolean;
    /**
     * Returns the complete description that appears on your customers' statements for payments made by this request, or
     * `null` if the default statement descriptor for your account will be used.
     */
    statementDescriptor: string | null;
    /**
     * Constructs a payment request using the given identifiers.
     * @throws Exception if id or selector is null
     */
    constructor(id: string, selector: string);
    /**
     * 
     * 
     * Returns a JS object containing the payment request options to use when a Pay Now button is tapped, in the
     * appropriate format for use in client side JavaScript, with data calculated from the given basket. This method is
     * provided as a convenience to calculate updated payment request options when the shopper basket has changed. Data
     * in the given `options` object like `total`, `displayItems`, and
     * `shippingOptions` will be replaced in the returned object by values recalculated from the given
     * `basket` and applicable shipping methods.
     * 
     * The following example shows the resulting output for a basket and sample options.
     * 
     * ```
     * `
     * SalesforcePaymentRequest.calculatePaymentRequestOptions(basket, {
     * requestPayerName: true,
     * requestPayerEmail: true,
     * requestPayerPhone: false,
     * requestShipping: true
     * });
     * `
     * ```
     * 
     * returns
     * @example
     * `
     * {
     * currency: 'gbp',
     * total: {
     * label: 'Total',
     * amount: '2644'
     * },
     * displayItems: [{
     * label: 'Subtotal',
     * amount: '1919'
     * }, {
     * label: 'Tax',
     * amount: '126'
     * }, {
     * label: 'Ground',
     * amount: '599'
     * }],
     * requestPayerName: true,
     * requestPayerEmail: true,
     * requestPayerPhone: false,
     * requestShipping: true,
     * shippingOptions: [{
     * id: 'GBP001',
     * label: 'Ground',
     * detail: 'Order received within 7-10 business days',
     * amount: '599'
     * },{
     * id: 'GBP002',
     * label: 'Express',
     * detail: 'Order received within 2-4 business days',
     * amount: '999'
     * }]
     * }
     * `
     */
    static calculatePaymentRequestOptions(basket: Basket, options: Object): Object;
    /**
     * 
     * 
     * Returns a JS object containing the payment request options to use when a Buy Now button is tapped, in the
     * appropriate format for use in client side JavaScript. This method is provided as a convenience to adjust values
     * in B2C Commerce API standard formats to their equivalents as expected by Stripe JS APIs. The following example
     * shows options set in B2C Commerce API format, and the resulting output.
     * 
     * ```
     * `
     * SalesforcePaymentRequest.format({
     * currency: 'GBP',
     * total: {
     * label: 'Total',
     * amount: '26.44'
     * },
     * displayItems: [{
     * label: 'Subtotal',
     * amount: '19.19'
     * }, {
     * label: 'Tax',
     * amount: '1.26'
     * }, {
     * label: 'Ground',
     * amount: '5.99'
     * }],
     * requestPayerPhone: false,
     * shippingOptions: [{
     * id: 'GBP001',
     * label: 'Ground',
     * detail: 'Order received within 7-10 business days',
     * amount: '5.99'
     * }]
     * });
     * `
     * ```
     * 
     * returns
     * @example
     * `
     * {
     * currency: 'gbp',
     * total: {
     * label: 'Total',
     * amount: '2644'
     * },
     * displayItems: [{
     * label: 'Subtotal',
     * amount: '1919'
     * }, {
     * label: 'Tax',
     * amount: '126'
     * }, {
     * label: 'Ground',
     * amount: '599'
     * }],
     * requestPayerPhone: false,
     * shippingOptions: [{
     * id: 'GBP001',
     * label: 'Ground',
     * detail: 'Order received within 7-10 business days',
     * amount: '599'
     * }]
     * }
     * `
     */
    static format(options: Object): Object;
    /**
     * 
     * 
     * Adds the given element type to explicitly exclude from mounted components. It is not necessary to explicitly
     * exclude element types that are not enabled for the site, or are not applicable for the current shopper and/or
     * their basket. See the element type constants in this class for the full list of supported element types.
     * 
     * Note: if an element type is both explicitly included and excluded, it will not be presented.
     * @see getExclude
     */
    addExclude(elementType: string): void;
    /**
     * 
     * 
     * Adds the given element type to include in mounted components. Call this method to include only a specific list of
     * element types to be presented when applicable and enabled for the site. See the element type constants in this
     * class for the full list of supported element types.
     * 
     * Note: if an element type is both explicitly included and excluded, it will not be presented.
     * @see getInclude
     */
    addInclude(elementType: string): void;
    /**
     * Returns a JS object containing the data used to prepare the shopper basket when a Buy Now button is tapped.
     * @see setBasketData
     */
    getBasketData(): Object;
    /**
     * Returns a JS object containing the billing details to use when a Stripe PaymentMethod is created.
     * @see setBillingDetails
     */
    getBillingDetails(): Object;
    /**
     * Returns `true` if the credit card payment should be automatically captured at the time of the sale, or
     * `false` if the credit card payment should be captured later.
     */
    getCardCaptureAutomatic(): boolean;
    /**
     * 
     * 
     * Returns a set containing the element types to be explicitly excluded from mounted components. See the element
     * type constants in this class for the full list of supported element types.
     * 
     * Note: if an element type is both explicitly included and excluded, it will not be presented.
     * @see addExclude
     */
    getExclude(): utilSet<any>;
    /**
     * Returns the identifier of this payment request.
     */
    getID(): string;
    /**
     * 
     * 
     * Returns a set containing the specific element types to include in mounted components. If the set is
     * empty then all applicable and enabled element types will be included by default. See the element type constants
     * in this class for the full list of supported element types.
     * 
     * Note: if an element type is both explicitly included and excluded, it will not be presented.
     * @see addInclude
     */
    getInclude(): utilSet<any>;
    /**
     * Returns the DOM element selector where to mount payment methods and/or express checkout buttons.
     */
    getSelector(): string;
    /**
     * Returns `true` if the payment method should be always saved for future use off session, or
     * `false` if the payment method should be only saved for future use on session when appropriate.
     */
    getSetupFutureUsage(): boolean;
    /**
     * Returns the complete description that appears on your customers' statements for payments made by this request, or
     * `null` if the default statement descriptor for your account will be used.
     */
    getStatementDescriptor(): string | null;
    /**
     * 
     * 
     * Sets the data used to prepare the shopper basket when a Buy Now button is tapped. For convenience this method
     * accepts a JS object to set all of the following properties at once:
     * 
     * - `sku` - SKU of the product to add exclusively to the basket (required)
     * - `quantity` - integer quantity of the product, default is 1
     * - `shippingMethod` - ID of the shipping method to set on the shipment, default is the site default
     * shipping method for the basket currency
     * - `options` - JS array containing one JS object per selected product option, default is no selected options
     * 
     * - `id` - product option ID
     * - `valueId` - product option value ID
     * 
     * The following example shows how to set all of the supported basket data.
     * @example
     * `
     * request.setBasketData({
     * sku: 'tv-pdp-6010fdM',
     * quantity: 1,
     * shippingMethod: '001',
     * options: [{
     * id: 'tvWarranty',
     * valueId: '000'
     * }]
     * });
     * `
     * @see getBasketData
     */
    setBasketData(basketData: Object): void;
    /**
     * Sets the billing details to use when a Stripe PaymentMethod is created. For convenience this method accepts a
     * JS object to set all details at once. The following example shows how to set details including address.
     * 
     * ```
     * `
     * request.setBillingDetails({
     * address: {
     * city: 'Wien',
     * country: 'AT',
     * line1: 'Opernring 2',
     * postal_code: '1010'
     * },
     * email: 'jhummel@salesforce.com',
     * name: 'Johann Hummel'
     * });
     * `
     * ```
     * 
     * For more information on the available billing details see the Stripe create PaymentMethod API
     * documentation.
     */
    setBillingDetails(billingDetails: Object): void;
    /**
     * Sets if the credit card payment should be automatically captured at the time of the sale.
     */
    setCardCaptureAutomatic(cardCaptureAutomatic: boolean): void;
    /**
     * 
     * 
     * Sets the payment request options to use when a Buy Now button is tapped. For convenience this method accepts a
     * JS object to set all options at once. The following example shows how to set options including currency,
     * labels, and amounts, in B2C Commerce API format.
     * 
     * ```
     * `
     * request.setOptions({
     * currency: 'GBP',
     * total: {
     * label: 'Total',
     * amount: '26.44'
     * },
     * displayItems: [{
     * label: 'Subtotal',
     * amount: '19.19'
     * }, {
     * label: 'Tax',
     * amount: '1.26'
     * }, {
     * label: 'Ground',
     * amount: '5.99'
     * }],
     * requestPayerPhone: false,
     * shippingOptions: [{
     * id: 'GBP001',
     * label: 'Ground',
     * detail: 'Order received within 7-10 business days',
     * amount: '5.99'
     * }]
     * });
     * `
     * ```
     * 
     * The `total` option must match the total that will result from preparing the shopper basket using the
     * data provided to setBasketData in this request. The `id` of each JS object in the
     * `shippingOptions` array must equal the ID of the corresponding site shipping method that the shopper
     * may select in the browser payment app.
     * 
     * For more information on the available payment request options see the Stripe Payment Request object API
     * documentation.
     * 
     * Note: The Stripe Payment Request `country` option will be set automatically to the country of the
     * Salesforce Payments account associated with the Commerce Cloud instance and is not included here.
     */
    setOptions(options: Object): void;
    /**
     * Sets the the options to pass into the `paypal.Buttons` call. For more information see the PayPal
     * Buttons API documentation.
     */
    setPayPalButtonsOptions(options: Object): void;
    /**
     * Sets the PayPal order application context `shipping_preference` value. For more information see the
     * PayPal Orders API documentation.
     * @see PAYPAL_SHIPPING_PREFERENCE_GET_FROM_FILE
     * @see PAYPAL_SHIPPING_PREFERENCE_NO_SHIPPING
     * @see PAYPAL_SHIPPING_PREFERENCE_SET_PROVIDED_ADDRESS
     */
    setPayPalShippingPreference(shippingPreference: string): void;
    /**
     * Sets the PayPal order application context `user_action` value. For more information see the PayPal
     * Orders API documentation.
     * @see PAYPAL_USER_ACTION_CONTINUE
     * @see PAYPAL_USER_ACTION_PAY_NOW
     */
    setPayPalUserAction(userAction: string): void;
    /**
     * Sets the controller to which to redirect when the shopper returns from a 3rd party payment website. Default is
     * the controller for the current page.
     */
    setReturnController(returnController: string): void;
    /**
     * Sets if mounted components may provide a control for the shopper to save their payment method for later use. When
     * set to `false` no control will be provided. When set to `true` a control may be provided,
     * if applicable for the shopper and presented payment method, but is not guaranteed.
     */
    setSavePaymentMethodEnabled(savePaymentMethodEnabled: boolean): void;
    /**
     * Sets if the payment method should be always saved for future use off session.
     */
    setSetupFutureUsage(setupFutureUsage: boolean): void;
    /**
     * Sets the complete description that appears on your customers' statements for payments made by this request. Set
     * this to `null` to use the default statement descriptor for your account.
     */
    setStatementDescriptor(statementDescriptor: string | null): void;
    /**
     * Sets the the options to pass into the Stripe `elements.create` call for the given element type. For
     * more information see the Stripe Elements API documentation.
     * @see ELEMENT_AFTERPAY_CLEARPAY_MESSAGE
     * @see ELEMENT_CARD_CVC
     * @see ELEMENT_CARD_EXPIRY
     * @see ELEMENT_CARD_NUMBER
     * @see ELEMENT_EPS_BANK
     * @see ELEMENT_IBAN
     * @see ELEMENT_IDEAL_BANK
     * @see ELEMENT_PAYMENT_REQUEST_BUTTON
     */
    setStripeCreateElementOptions(element: string, options: Object): void;
    /**
     * Sets the the options to pass into the `stripe.elements` call. For more information see the Stripe
     * Elements API documentation.
     */
    setStripeElementsOptions(options: Object): void;
}

export = SalesforcePaymentRequest;
