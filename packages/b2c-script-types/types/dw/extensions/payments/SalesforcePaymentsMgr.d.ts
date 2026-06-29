import SalesforcePaymentIntent = require('./SalesforcePaymentIntent');
import Basket = require('../../order/Basket');
import Order = require('../../order/Order');
import SalesforcePaymentMethod = require('./SalesforcePaymentMethod');
import Customer = require('../../customer/Customer');
import Collection = require('../../util/Collection');
import Status = require('../../system/Status');
import Shipment = require('../../order/Shipment');
import Money = require('../../value/Money');
import OrderPaymentInstrument = require('../../order/OrderPaymentInstrument');
import SalesforceAdyenSavedPaymentMethod = require('./SalesforceAdyenSavedPaymentMethod');
import SalesforcePayPalOrder = require('./SalesforcePayPalOrder');
import SalesforcePaymentsSiteConfiguration = require('./SalesforcePaymentsSiteConfiguration');
import SalesforcePaymentsZone = require('./SalesforcePaymentsZone');
import SalesforcePaymentDetails = require('./SalesforcePaymentDetails');

/**
 * Contains functionality for use with Salesforce Payments. See Salesforce Payments documentation for how to gain access
 * and configure it for use on your sites.
 */
declare class SalesforcePaymentsMgr {
    /**
     * Cancellation reason indicating customer abandoned payment.
     */
    static readonly CANCELLATION_REASON_ABANDONED = "abandoned";
    /**
     * Cancellation reason indicating payment intent was a duplicate.
     */
    static readonly CANCELLATION_REASON_DUPLICATE = "duplicate";
    /**
     * Cancellation reason indicating payment was fraudulent.
     */
    static readonly CANCELLATION_REASON_FRAUDULENT = "fraudulent";
    /**
     * Cancellation reason indicating customer action or request.
     */
    static readonly CANCELLATION_REASON_REQUESTED_BY_CUSTOMER = "requested_by_customer";
    /**
     * Refund reason indicating payment intent was a duplicate.
     */
    static readonly REFUND_REASON_DUPLICATE = "duplicate";
    /**
     * Refund reason indicating payment was fraudulent.
     */
    static readonly REFUND_REASON_FRAUDULENT = "fraudulent";
    /**
     * Refund reason indicating customer action or request.
     */
    static readonly REFUND_REASON_REQUESTED_BY_CUSTOMER = "requested_by_customer";
    /**
     * Returns a payments site configuration object for the current site.
     * @throws Exception if there is no current site
     */
    static readonly paymentsSiteConfig: SalesforcePaymentsSiteConfiguration | null;
    private constructor();
    /**
     * Attaches the given payment method to the given customer. Use this method to attach a payment method of type
     * SalesforcePaymentMethod.TYPE_CARD to a shopper who registers as a customer after placing an order, and
     * has affirmatively elected to save their card as part of the registration process. This method will throw an error
     * if passed incompatible payment method and/or customer objects.
     * @throws Exception if there was an error attaching the payment method to the customer
     * @deprecated use onCustomerRegistered and
     * savePaymentMethod
     */
    static attachPaymentMethod(paymentMethod: SalesforcePaymentMethod, customer: Customer): void;
    /**
     * Authorizes the given PayPal order.
     * 
     * The PayPal order must be in a status that supports authorization. See the PayPal documentation for more details.
     * @throws Exception if there was an error authorizing the PayPal order
     */
    static authorizePayPalOrder(paypalOrder: SalesforcePayPalOrder): Status;
    /**
     * Cancels the given payment intent. If a payment authorization has been made for the payment intent, the
     * authorization is removed.
     * 
     * The payment intent must be in a status that supports cancel. See the Stripe documentation for more details.
     * 
     * The following Payment Intent property is supported:
     * 
     * - `cancellationReason` - optional payment intent cancellation reason
     * @throws Exception if there was an error canceling the payment intent
     * @see CANCELLATION_REASON_ABANDONED
     * @see CANCELLATION_REASON_DUPLICATE
     * @see CANCELLATION_REASON_FRAUDULENT
     * @see CANCELLATION_REASON_REQUESTED_BY_CUSTOMER
     */
    static cancelPaymentIntent(paymentIntent: SalesforcePaymentIntent, paymentIntentProperties: Object): Status;
    /**
     * Captures funds for the given order payment instrument.
     * 
     * The order payment instrument must be in a state that supports capture.
     * 
     * The `amount` must be less than or equal to the amount available to capture.
     * 
     * The following Transaction properties are supported:
     * 
     * - `reference` - optional reference for the transaction, for example order number
     * @throws Exception if there was an error capturing the payment instrument
     */
    static captureAdyenPayment(orderPaymentInstrument: OrderPaymentInstrument, amount: Money, transactionProperties: Object): Status;
    /**
     * Captures funds for the given PayPal order.
     * 
     * The PayPal order must be in a status that supports capture. See the PayPal documentation for more details.
     * @throws Exception if there was an error capturing the PayPal order
     */
    static capturePayPalOrder(paypalOrder: SalesforcePayPalOrder): Status;
    /**
     * Captures funds for the given payment intent.
     * 
     * The payment intent must be in a status that supports capture. See the Stripe documentation for more details.
     * 
     * If `amount` is not specified, the default is the full amount available to capture. If specified, the
     * amount must be less than or equal to the amount available to capture.
     * @throws Exception if there was an error capturing the payment intent
     */
    static capturePaymentIntent(paymentIntent: SalesforcePaymentIntent, amount: Money): Status;
    /**
     * 
     * 
     * Confirms a new payment intent using the given payment method, and associates it with the given order.
     * 
     * The order must be prepared to contain products, shipments, and any other necessary data, and must be calculated
     * to reflect the correct total amounts. If the order is not for the same dw.customer.Customer as the given
     * payment method, an error is thrown.
     * 
     * The specified payment method must be set up for off session future use or an error is thrown. iDeal and
     * Bancontact implement reuse differently than other payment methods, but they can't be reused themselves.
     * 
     * The following Payment Intent properties are supported:
     * 
     * - `statementDescriptor` - optional statement descriptor
     * - `cardCaptureAutomatic` - optional `true` if the credit card payment should be
     * automatically captured at the time of the sale, or `false` if the credit card payment should be
     * captured later
     * 
     * If `cardCaptureAutomatic` is provided it is used to determine card capture timing, and otherwise the
     * default card capture timing set for the site is used.
     * 
     * If `statementDescriptor` is provided it is used as the complete description that appears on your
     * customers' statements for the payment, and if not a default statement descriptor is used. If a default statement
     * descriptor is set for the site it is used as the default, and otherwise the default statement descriptor for the
     * account will apply.
     * @throws Exception if the parameter validation failed or there's an error confirming the payment intent
     */
    static confirmPaymentIntent(order: Order, paymentMethod: SalesforcePaymentMethod, paymentIntentProperties: Object): Status;
    /**
     * 
     * 
     * Creates an Adyen payment intent using the given information, and associates it with the given order.
     * 
     * The following Payment Intent properties are supported:
     * 
     * - `type` - required payment method type, such as SalesforcePaymentMethod.TYPE_CARD
     * - `cardCaptureAutomatic` - optional `true` if the credit card payment should be
     * automatically captured at the time of the sale, or `false` if the credit card payment should be
     * captured later
     * - `storePaymentMethod` - optional `true` if the payment method should be stored for
     * future usage, or `false` if not
     * 
     * If `cardCaptureAutomatic` is provided it is used to determine card capture timing, and otherwise the
     * default card capture timing set for the site is used.
     */
    static createAdyenPaymentIntent(order: Order, shipment: Shipment, zoneId: string, amount: Money, customerRequired: boolean, paymentData: Object, paymentIntentProperties: Object): Status;
    /**
     * 
     * 
     * Creates a PayPal order using the given information, and associates it with the given basket.
     * 
     * The following PayPal order properties are supported:
     * 
     * - `fundingSource` - required funding source, such as SalesforcePayPalOrder.TYPE_PAYPAL
     * - `intent` - optional order capture timing intent, such as
     * SalesforcePayPalOrder.INTENT_AUTHORIZE or SalesforcePayPalOrder.INTENT_CAPTURE
     * - `shippingPreference` - optional shipping preference, such as `"GET_FROM_FILE"`
     * - `userAction` - optional user action, such as `"PAY_NOW"`
     * 
     * If `intent` is provided it is used to determine manual or automatic capture, and otherwise the default
     * card capture timing set for the site is used.
     */
    static createPayPalOrder(basket: Basket, shipment: Shipment, zoneId: string, amount: Money, paypalOrderProperties: Object): Status;
    /**
     * 
     * 
     * Creates a payment intent using the given information, and associates it with the given basket.
     * 
     * The following Payment Intent properties are supported:
     * 
     * - `type` - required payment method type, such as SalesforcePaymentMethod.TYPE_CARD
     * - `statementDescriptor` - optional statement descriptor
     * - `cardCaptureAutomatic` - optional `true` if the credit card payment should be
     * automatically captured at the time of the sale, or `false` if the credit card payment should be
     * captured later
     * - `setupFutureUsage` - optional future usage setup value, such as
     * SalesforcePaymentIntent.SETUP_FUTURE_USAGE_ON_SESSION
     * 
     * The `stripeCustomerRequired` must be set to `true` if the payment will be set up for future
     * usage, whether on session or off session. If `true` then if a Stripe Customer is associated with the
     * shopper then it will be used, and otherwise a new Stripe Customer will be created. The new Stripe Customer will
     * be associated with the shopper if logged into a registered customer account for the site.
     * 
     * If `cardCaptureAutomatic` is provided it is used to determine card capture timing, and otherwise the
     * default card capture timing set for the site is used.
     * 
     * If `statementDescriptor` is provided it is used as the complete description that appears on your
     * customers' statements for the payment, and if not a default statement descriptor is used. If a default statement
     * descriptor is set for the site it is used as the default, and otherwise the default statement descriptor for the
     * account will apply.
     * 
     * If `setupFutureUsage` is provided it will be used to prepare the payment to be set up for future usage
     * at confirmation time. When set, this future usage setup value must match the value used at confirmation time.
     */
    static createPaymentIntent(basket: Basket, shipment: Shipment, zoneId: string, amount: Money, stripeCustomerRequired: boolean, paymentIntentProperties: Object): Status;
    /**
     * Detaches the given payment method from its associated customer. Once detached the payment method remains
     * associated with payment intents in the payment account, but is no longer saved for use by the customer in future
     * orders.
     * @throws Exception if there was an error detaching the payment method from its customer
     * @deprecated use removeSavedPaymentMethod
     */
    static detachPaymentMethod(paymentMethod: SalesforcePaymentMethod): void;
    /**
     * Returns a collection containing the Adyen payment methods saved to be presented to the given customer for reuse
     * in checkouts. The collection will be empty if there are no payment methods saved for the customer, or there was
     * an error retrieving the saved payment methods.
     * @throws Exception if the given customer is  null  or  undefined , or there is configuration missing that is required to retrieve the saved payment methods
     */
    static getAdyenSavedPaymentMethods(customer: Customer): Collection<SalesforceAdyenSavedPaymentMethod>;
    /**
     * Returns a collection containing the payment methods attached to the given customer. The collection will be empty
     * if there are no payment methods attached to the customer, or there was an error retrieving the attached payment
     * methods.
     * @throws Exception if the given customer is  null  or  undefined
     * @deprecated use getSavedPaymentMethods
     */
    static getAttachedPaymentMethods(customer: Customer): Collection<any>;
    /**
     * Returns a collection containing the payment methods for the given customer set up for future off session reuse.
     * The collection will be empty if there are no off session payment methods for the customer, or there was an error
     * retrieving the off session payment methods.
     * @throws Exception if the given customer is  null  or  undefined , or there is an error getting the off session payment methods
     */
    static getOffSessionPaymentMethods(customer: Customer): Collection<SalesforcePaymentMethod>;
    /**
     * Returns the PayPal order for the given basket, or `null` if the given basket has none.
     * @throws Exception if there was an error retrieving the PayPal order for the basket
     */
    static getPayPalOrder(basket: Basket): SalesforcePayPalOrder | null;
    /**
     * Returns the PayPal order for the given order, or `null` if the given order has none.
     * @throws Exception if there was an error retrieving the PayPal order for the order
     */
    static getPayPalOrder(order: Order): SalesforcePayPalOrder | null;
    /**
     * Returns the details to the Salesforce Payments payment associated with the given payment instrument, or
     * `null` if the given payment instrument has none.
     * @throws Exception if paymentInstrument is null
     */
    static getPaymentDetails(paymentInstrument: OrderPaymentInstrument): SalesforcePaymentDetails | null;
    /**
     * Returns the payment intent for the given basket, or `null` if the given basket has none.
     * @throws Exception if there was an error retrieving the payment intent for the basket
     */
    static getPaymentIntent(basket: Basket): SalesforcePaymentIntent | null;
    /**
     * Returns the payment intent for the given order, or `null` if the given order has none.
     * @throws Exception if there was an error retrieving the payment intent for the order
     */
    static getPaymentIntent(order: Order): SalesforcePaymentIntent | null;
    /**
     * Returns a payments site configuration object for the current site.
     * @throws Exception if there is no current site
     */
    static getPaymentsSiteConfig(): SalesforcePaymentsSiteConfiguration | null;
    /**
     * Returns a payments zone object for the passed in payments zone ID.
     */
    static getPaymentsZone(zoneId: string): SalesforcePaymentsZone | null;
    /**
     * Returns a collection containing the payment methods saved to be presented to the given customer for reuse in
     * checkouts. The collection will be empty if there are no payment methods saved for the customer, or there was an
     * error retrieving the saved payment methods.
     * @throws Exception if the given customer is  null  or  undefined , or there is configuration missing that is required to retrieve the saved payment methods
     */
    static getSavedPaymentMethods(customer: Customer): Collection<SalesforcePaymentMethod>;
    /**
     * 
     * 
     * Handles the given additional Adyen payment details and associates the associated payment with the given order, if
     * applicable.
     * 
     * Pass the state data from the Adyen `onAdditionalDetails` event as-is, without any encoding or other
     * changes to the data or its structure. See the Adyen documentation for more information.
     */
    static handleAdyenAdditionalDetails(order: Order, zoneId: string, data: Object): Status;
    /**
     * Handles the account registration of the shopper who placed the given order. Use this method to ensure the
     * registered customer profile is associated with the order in Salesforce Payments.
     * @throws Exception if there was an error attaching the payment method to the customer
     */
    static onCustomerRegistered(order: Order): void;
    /**
     * Refunds previously captured funds for the given order payment instrument.
     * 
     * The order payment instrument must be in a state that supports refund.
     * 
     * The `amount` must be less than or equal to the amount available to refund.
     * 
     * The following Transaction properties are supported:
     * 
     * - `reference` - optional reference for the transaction, for example order number
     * @throws Exception if there was an error refunding the payment instrument
     */
    static refundAdyenPayment(orderPaymentInstrument: OrderPaymentInstrument, amount: Money, transactionProperties: Object): Status;
    /**
     * Refunds the capture for the given PayPal order.
     * 
     * The PayPal order must have a capture in a status that supports refund. See the PayPal documentation for more
     * details.
     * @throws Exception if there was an error refunding the capture for the PayPal order
     */
    static refundPayPalOrderCapture(paypalOrder: SalesforcePayPalOrder): Status;
    /**
     * Refunds previously captured funds for the given payment intent.
     * 
     * The payment intent must be in a state that supports refund. This includes its status as well as any previous
     * refunds. See the Stripe documentation for more details.
     * 
     * The following Payment Intent property is supported:
     * 
     * - `reason` - optional payment intent refund reason
     * 
     * If `amount` is not specified, the default is the full amount available to refund. If specified, the
     * amount must be less than or equal to the amount available to refund.
     * @throws Exception if there was an error refunding the payment intent
     * @see REFUND_REASON_DUPLICATE
     * @see REFUND_REASON_FRAUDULENT
     * @see REFUND_REASON_REQUESTED_BY_CUSTOMER
     */
    static refundPaymentIntent(paymentIntent: SalesforcePaymentIntent, amount: Money, refundProperties: Object): Status;
    /**
     * Deletes an Adyen saved payment method.
     * @throws Exception if the saved payment method is  null  or  undefined , or there is configuration missing that is required to delete the saved payment method
     */
    static removeAdyenSavedPaymentMethod(savedPaymentMethod: SalesforceAdyenSavedPaymentMethod): void;
    /**
     * Removes the given saved payment method so that it is no longer presented to the given customer for reuse in
     * checkouts. The payment method remains in the payment account, but is no longer saved for use by the customer.
     * @throws Exception if there was an error removing the saved payment method from its customer
     */
    static removeSavedPaymentMethod(paymentMethod: SalesforcePaymentMethod): void;
    /**
     * Resolves and returns the payments zone object for the passed in payments zone properties object. If an empty
     * object is provided, the default payments zone will be returned if it exists.
     * 
     * The following payments zone properties are supported:
     * 
     * - `countryCode` - optional country code of the shopper, or `null` if not known
     * - `currency` - optional basket currency, or `null` if not known
     * @throws Exception if no default payments zone exists
     */
    static resolvePaymentsZone(paymentsZoneProperties: Object): SalesforcePaymentsZone | null;
    /**
     * Reverses the authorisation for the given order payment instrument.
     * 
     * The order payment instrument must be in a state that supports reversal.
     * 
     * The following Transaction properties are supported:
     * 
     * - `reference` - optional reference for the transaction, for example order number
     * @throws Exception if there was an error reversing the payment instrument
     */
    static reverseAdyenPayment(orderPaymentInstrument: OrderPaymentInstrument, transactionProperties: Object): Status;
    /**
     * Saves the given payment method to be presented to the given customer for reuse in subsequent checkouts. This
     * method will throw an error if passed incompatible payment method and/or customer objects.
     * @throws Exception if there was an error saving the payment method for the customer
     */
    static savePaymentMethod(customer: Customer, paymentMethod: SalesforcePaymentMethod): void;
    /**
     * Sets the details to the Salesforce Payments payment associated with the given payment instrument.
     * @throws Exception if either paymentInstrument or paymentDetails is null
     * @see SalesforcePaymentMethod.getPaymentDetails
     * @see SalesforcePayPalOrder.getPaymentDetails
     */
    static setPaymentDetails(paymentInstrument: OrderPaymentInstrument, paymentDetails: SalesforcePaymentDetails): void;
    /**
     * Updates the provided information in the given payment intent.
     * 
     * The payment intent must be in a status that supports update. See the Stripe documentation for more details.
     * 
     * The following Payment Intent properties are supported:
     * 
     * - `statementDescriptor` - optional statement descriptor
     * - `cardCaptureAutomatic` - optional `true` if the credit card payment should be
     * automatically captured at the time of the sale, or `false` if the credit card payment should be
     * captured later
     * 
     * If `cardCaptureAutomatic` is provided it is used to determine card capture timing, and otherwise the
     * default card capture timing set for the site is used.
     * 
     * If `statementDescriptor` is provided it is used as the complete description that appears on your
     * customers' statements for the payment, and if not a default statement descriptor is used. If a default statement
     * descriptor is set for the site it is used as the default, and otherwise the default statement descriptor for the
     * account will apply.
     * @throws Exception if the parameter validation failed or there's an error updating the payment intent
     */
    static updatePaymentIntent(paymentIntent: SalesforcePaymentIntent, shipment: Shipment, amount: Money, orderNo: string, paymentIntentProperties: Object): Status;
    /**
     * Voids the authorization for the given PayPal order.
     * 
     * The PayPal order must have an authorization in a status that supports voiding. See the PayPal documentation for
     * more details.
     * @throws Exception if there was an error voiding the authorization for the PayPal order
     */
    static voidPayPalOrderAuthorization(paypalOrder: SalesforcePayPalOrder): Status;
}

export = SalesforcePaymentsMgr;
