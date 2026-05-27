import PaymentRequestHookResult = require('./PaymentRequestHookResult');
import Basket = require('../../order/Basket');
import ShippingMethod = require('../../order/ShippingMethod');
import Status = require('../../system/Status');
import Order = require('../../order/Order');

/**
 * PaymentRequestHooks interface containing extension points for customizing Payment Requests.
 * 
 * These hooks are executed in a transaction.
 * 
 * The extension points (hook names), and the functions that are called by each extension point. A function must be
 * defined inside a JavaScript source and must be exported. The script with the exported hook function must be located
 * inside a site cartridge. Inside the site cartridge a 'package.json' file with a 'hooks' entry must exist.
 * 
 * ```
 * "hooks": "./hooks.json"
 * ```
 * 
 * The hooks entry links to a json file, relative to the 'package.json' file. This file lists all registered hooks
 * inside the hooks property:
 * 
 * ```
 * "hooks": [
 * {"name": "dw.extensions.paymentrequest.getPaymentRequest", "script": "./paymentrequest.ds"}
 * {"name": "dw.extensions.paymentrequest.shippingAddressChange", "script": "./paymentrequest.ds"}
 * ]
 * ```
 * 
 * A hook entry has a 'name' and a 'script' property.
 * 
 * - The 'name' contains the extension point, the hook name.
 * - The 'script' contains the script relative to the hooks file, with the exported hook function.
 * @deprecated Salesforce Payments includes support for Google Pay
 */
declare interface PaymentRequestHooks {
    /**
     * The extension point name extensionPointAbort.
     */
    readonly extensionPointAbort: "dw.extensions.paymentrequest.abort";
    /**
     * The extension point name extensionPointGetPaymentRequest.
     */
    readonly extensionPointGetPaymentRequest: "dw.extensions.paymentrequest.getPaymentRequest";
    /**
     * The extension point name extensionPointPaymentAcceptedAuthorizeOrderPayment.
     */
    readonly extensionPointPaymentAcceptedAuthorizeOrderPayment: "dw.extensions.paymentrequest.paymentAccepted.authorizeOrderPayment";
    /**
     * The extension point name extensionPointPaymentAcceptedPlaceOrder.
     */
    readonly extensionPointPaymentAcceptedPlaceOrder: "dw.extensions.paymentrequest.paymentAccepted.placeOrder";
    /**
     * The extension point name extensionPointShippingAddressChange.
     */
    readonly extensionPointShippingAddressChange: "dw.extensions.paymentrequest.shippingAddressChange";
    /**
     * The extension point name extensionPointShippingOptionChange.
     */
    readonly extensionPointShippingOptionChange: "dw.extensions.paymentrequest.shippingOptionChange";
    /**
     * 
     * 
     * Called after the Payment Request user interface was canceled. The given basket is the one that was passed to other
     * hooks earlier in the Payment Request checkout process.
     * 
     * It is not guaranteed that this hook will be executed for all Payment Request user interfaces canceled by shoppers or
     * otherwise ended without a successful order. Calls to this hook are provided on a best-effort basis.
     * 
     * If the returned result includes a redirect URL, the shopper browser will be navigated to that URL if possible. It
     * is not guaranteed that the response with the hook result will be handled in the shopper browser in all cases.
     */
    abort(basket: Basket): PaymentRequestHookResult;
    /**
     * 
     * 
     * Called after the shopper accepts the Payment Request payment for the given order. Basket customer information,
     * billing address, and/or shipping address for the default shipment will have already been updated to reflect the
     * available contact information provided by Payment Request. Any preexisting payment instruments on the basket will
     * have been removed, and a single `DW_ANDROID_PAY` payment instrument added for the total amount. The
     * given order will have been created from this updated basket.
     * 
     * The purpose of this hook is to authorize the Payment Request payment for the order. If a non-error status is returned
     * that means that you have successfully authorized the payment with your payment service provider. Your hook
     * implementation must set the necessary payment status and transaction identifier data on the order as returned by
     * the provider.
     * 
     * Return an error status to indicate a problem, including unsuccessful authorization.
     * 
     * See the Payment Request API for more information.
     */
    authorizeOrderPayment(order: Order, response: Object): Status;
    /**
     * 
     * 
     * Called to get the `PaymentRequest` constructor parameters for the given basket. You can
     * set properties in the given `parameters` object to extend or override default properties set
     * automatically based on the Google Pay configuration for your site.
     * 
     * The `parameters` object will contain the following properties by default:
     * 
     * - `methodData` - array containing payment methods the web site accepts
     * - `details` - information about the transaction that the user is being asked to complete
     * - `options` - information about what options the web page wishes to use from the payment request system
     * 
     * Return a result with an error status to indicate a problem.
     * 
     * If the returned result includes a redirect URL, the shopper browser will be navigated to that URL if the Payment
     * Request user interaction is canceled.
     * 
     * See the Payment Request API for more information.
     */
    getPaymentRequest(basket: Basket, parameters: Object): PaymentRequestHookResult;
    /**
     * 
     * 
     * Called after payment has been authorized and the given Payment Request order is ready to be placed. The purpose of
     * this hook is to place the order, or return a redirect URL that results in the order being placed when the shopper
     * browser is navigated to it.
     * 
     * The default implementation of this hook returns a redirect to `COPlaceOrder-Submit` with URL
     * parameters `order_id` set to dw.order.Order.getOrderNo and `order_token` set to
     * dw.order.Order.getOrderToken which corresponds to SiteGenesis-based implementations. Your hook
     * implementation should return a result with a different redirect URL as necessary to place the order and show an
     * order confirmation.
     * 
     * Alternatively, your hook implementation itself can place the order and return a result with a redirect URL to an
     * order confirmation page that does not place the order. This is inconsistent with SiteGenesis-based
     * implementations so is not the default.
     * 
     * Return an error status to indicate a problem. If the returned result includes a redirect URL, the shopper browser
     * will be navigated to that URL if the Payment Request user interface is canceled.
     */
    placeOrder(order: Order): PaymentRequestHookResult;
    /**
     * 
     * 
     * Called after handling the Payment Request `shippingaddresschange` event for the given basket. Basket
     * customer information and/or shipping address for the default shipment will have already been updated to reflect
     * the available shipping address information provided by Payment Request. The basket will have already been
     * calculated before this hook is called.
     * 
     * Return a result with an error status to indicate a problem.
     * 
     * If the returned result includes a redirect URL, the shopper browser will be navigated to that URL if the Payment
     * Request user interface is canceled.
     * 
     * See the Payment Request API for more information.
     */
    shippingAddressChange(basket: Basket, details: Object): PaymentRequestHookResult;
    /**
     * 
     * 
     * Called after handling the Payment Request `shippingoptionchange` event for the given basket. The given
     * shipping method will have already been set on the basket. The basket will have already been calculated before
     * this hook is called.
     * 
     * Return a result with an error status to indicate a problem.
     * 
     * If the returned result includes a redirect URL, the shopper browser will be navigated to that URL if the
     * Payment Request user interface is canceled.
     * 
     * See the Payment Request API for more information.
     */
    shippingOptionChange(basket: Basket, shippingMethod: ShippingMethod, details: Object): PaymentRequestHookResult;
}

export = PaymentRequestHooks;
