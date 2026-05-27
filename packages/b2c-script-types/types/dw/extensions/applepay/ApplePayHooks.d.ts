import ApplePayHookResult = require('./ApplePayHookResult');
import Basket = require('../../order/Basket');
import ShippingMethod = require('../../order/ShippingMethod');
import Order = require('../../order/Order');
import Status = require('../../system/Status');

/**
 * ApplePayHooks interface containing extension points for customizing Apple Pay.
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
 * {"name": "dw.extensions.applepay.getRequest", "script": "./applepay.ds"}
 * {"name": "dw.extensions.applepay.shippingContactSelected", "script": "./applepay.ds"}
 * ]
 * ```
 * 
 * A hook entry has a 'name' and a 'script' property.
 * 
 * - The 'name' contains the extension point, the hook name.
 * - The 'script' contains the script relative to the hooks file, with the exported hook function.
 */
declare interface ApplePayHooks {
    /**
     * The extension point name extensionPointCancel.
     */
    readonly extensionPointCancel: "dw.extensions.applepay.cancel";
    /**
     * The extension point name extensionPointGetRequest.
     */
    readonly extensionPointGetRequest: "dw.extensions.applepay.getRequest";
    /**
     * The extension point name extensionPointPaymentAuthorizedAuthorizeOrderPayment.
     */
    readonly extensionPointPaymentAuthorizedAuthorizeOrderPayment: "dw.extensions.applepay.paymentAuthorized.authorizeOrderPayment";
    /**
     * The extension point name extensionPointPaymentAuthorizedCreateOrder.
     */
    readonly extensionPointPaymentAuthorizedCreateOrder: "dw.extensions.applepay.paymentAuthorized.createOrder";
    /**
     * The extension point name extensionPointPaymentAuthorizedFailOrder.
     */
    readonly extensionPointPaymentAuthorizedFailOrder: "dw.extensions.applepay.paymentAuthorized.failOrder";
    /**
     * The extension point name extensionPointPaymentAuthorizedPlaceOrder.
     */
    readonly extensionPointPaymentAuthorizedPlaceOrder: "dw.extensions.applepay.paymentAuthorized.placeOrder";
    /**
     * The extension point name extensionPointPaymentMethodSelected.
     */
    readonly extensionPointPaymentMethodSelected: "dw.extensions.applepay.paymentMethodSelected";
    /**
     * The extension point name extensionPointPrepareBasket.
     */
    readonly extensionPointPrepareBasket: "dw.extensions.applepay.prepareBasket";
    /**
     * The extension point name extensionPointShippingContactSelected.
     */
    readonly extensionPointShippingContactSelected: "dw.extensions.applepay.shippingContactSelected";
    /**
     * The extension point name extensionPointShippingMethodSelected.
     */
    readonly extensionPointShippingMethodSelected: "dw.extensions.applepay.shippingMethodSelected";
    /**
     * 
     * 
     * Called to authorize the Apple Pay payment for the order. The given order will have been created by the
     * extensionPointPaymentAuthorizedCreateOrder hook, after the basket was populated with data from
     * the `ApplePayPaymentAuthorizedEvent`.
     * 
     * Return a non-error status if you have successfully authorized the payment with your payment service provider.
     * Your hook implementation must set the necessary payment status and transaction identifier data on the order as
     * returned by the provider.
     * 
     * Return an error status to indicate a problem, including unsuccessful authorization. See
     * dw.extensions.applepay.ApplePayHookResult for how to indicate error statuses with detail information to
     * be provided to Apple Pay.
     * 
     * See the Apple Pay JS API Reference for more information.
     */
    authorizeOrderPayment(order: Order, event: Object): Status;
    /**
     * 
     * 
     * Called after the Apple Pay payment sheet was canceled. There is no Apple Pay JS event object for this case. The
     * given basket is the one that was passed to other hooks earlier in the Apple Pay checkout process.
     * 
     * It is not guaranteed that this hook will be executed for all Apple Pay payment sheets canceled by shoppers or
     * otherwise ended without a successful order. Calls to this hook are provided on a best-effort basis.
     * 
     * If the returned result includes a redirect URL, the shopper browser will be navigated to that URL if possible. It
     * is not guaranteed that the response with the hook result will be handled in the shopper browser in all cases.
     */
    cancel(basket: Basket): ApplePayHookResult;
    /**
     * 
     * 
     * Called after handling the given `ApplePayPaymentAuthorizedEvent` for the given basket. Customer
     * information, billing address, and/or shipping address for the default shipment will have already been updated to
     * reflect the available contact information provided by Apple Pay based on the Apple Pay configuration for your
     * site. Any preexisting payment instruments on the basket will have been removed, and a single
     * `DW_APPLE_PAY` payment instrument added for the total amount.
     * 
     * The purpose of this hook is to populate the created order with any necessary information from the basket
     * or the Apple Pay event. Do not use this hook for address verification, or any other validation. Instead
     * use the extensionPointPaymentAuthorizedAuthorizeOrderPayment hook which allows you to return
     * an `ApplePayHookResult` with error status information.
     * 
     * The default implementation of this hook simply calls `OrderMgr.createOrder` and returns the created
     * order.
     * 
     * Throw an error to indicate a problem creating the order.
     */
    createOrder(basket: Basket, event: Object): Order;
    /**
     * 
     * 
     * Called after payment authorization is unsuccessful and the given Apple Pay order must be failed. The purpose
     * of this hook is to fail the order, or return a redirect URL that results in the order being failed when the shopper
     * browser is navigated to it. The given status object is the result of calling the
     * extensionPointPaymentAuthorizedAuthorizeOrderPayment hook.
     * 
     * The default implementation of this hook simply calls `OrderMgr.failOrder`, and returns a result
     * with the given status and no redirect URL.
     * 
     * Return a result with an error status to indicate a problem. See dw.extensions.applepay.ApplePayHookResult
     * for how to indicate error statuses with detail information to be provided to Apple Pay. If the returned result includes
     * a redirect URL, the shopper browser will be navigated to that URL if the Apple Pay payment sheet is canceled.
     */
    failOrder(order: Order, status: Status): ApplePayHookResult;
    /**
     * 
     * 
     * Called to get the Apple Pay JS `PaymentRequest` for the given basket. You can set properties in the
     * given request object to extend or override default properties set automatically based on the Apple Pay
     * configuration for your site.
     * 
     * Return a result with an error status to indicate a problem. See dw.extensions.applepay.ApplePayHookResult
     * for how to indicate error statuses with detail information to be provided to Apple Pay.
     * 
     * If the returned result includes a redirect URL, the shopper browser will be navigated to that URL if the Apple
     * Pay payment sheet is canceled.
     * 
     * See the Apple Pay JS API Reference for more information.
     */
    getRequest(basket: Basket, request: Object): ApplePayHookResult;
    /**
     * 
     * 
     * Called after handling the given `ApplePayPaymentMethodSelectedEvent` for the given basket. This Apple
     * Pay event does not contain payment card or device information.
     * 
     * The given response object will contain properties whose values are to be passed as parameters to the
     * `ApplePaySession.completePaymentMethodSelection` event callback:
     * 
     * - total - Updated total line item object
     * - lineItems - Array of updated line item objects
     * 
     * Return a result with an error status to indicate a problem. See dw.extensions.applepay.ApplePayHookResult
     * for how to indicate error statuses with detail information to be provided to Apple Pay.
     * 
     * If the returned result includes a redirect URL, the shopper browser will be navigated to that URL if the Apple
     * Pay payment sheet is canceled.
     * 
     * See the Apple Pay JS API Reference for more information.
     */
    paymentMethodSelected(basket: Basket, event: Object, response: Object): ApplePayHookResult;
    /**
     * 
     * 
     * Called after payment has been authorized and the given Apple Pay order is ready to be placed. The purpose of this
     * hook is to place the order, or return a redirect URL that results in the order being placed when the shopper
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
     * Return an error status to indicate a problem. See dw.extensions.applepay.ApplePayHookResult for how to
     * indicate error statuses with detail information to be provided to Apple Pay. If the returned result includes a
     * redirect URL, the shopper browser will be navigated to that URL if the Apple Pay payment sheet is canceled.
     */
    placeOrder(order: Order): ApplePayHookResult;
    /**
     * 
     * 
     * Called to prepare the given basket for an Apple Pay checkout. This hook will be executed after the user
     * clicks the Apple Pay button.
     * 
     * The default implementation of this hook calculates the basket. A custom hook implementation that returns a
     * non-null result must calculate the basket.
     * 
     * The given parameters object will contain properties whose values are passed from the
     * `<isapplepay></isapplepay>` tag:
     * 
     * - sku - SKU of product to checkout exclusively
     * 
     * Return a result with an error status to indicate a problem. For this hook there is no opportunity to provide user
     * feedback, so if any error status is returned, the Apple Pay payment sheet will be aborted.
     * 
     * If the returned result includes a redirect URL, the shopper browser will be navigated to that URL after the Apple
     * Pay payment sheet is aborted.
     */
    prepareBasket(basket: Basket, parameters: Object): ApplePayHookResult;
    /**
     * 
     * 
     * Called after handling the given `ApplePayShippingContactSelectedEvent` for the given basket. Basket
     * customer information and/or shipping address for the default shipment will have already been updated to reflect
     * the available shipping contact information provided by Apple Pay based on the Apple Pay configuration for your
     * site. The basket will have already been calculated before this hook is called.
     * 
     * The given response object will contain properties whose values are to be passed as parameters to the
     * `ApplePaySession.completeShippingContactSelection` event callback:
     * 
     * - shippingMethods - Array of applicable shipping method JS objects
     * - total - Updated total line item object
     * - lineItems - Array of updated line item objects
     * 
     * Return a result with an error status to indicate a problem. See dw.extensions.applepay.ApplePayHookResult
     * for how to indicate error statuses with detail information to be provided to Apple Pay.
     * 
     * If the returned result includes a redirect URL, the shopper browser will be navigated to that URL if the Apple
     * Pay payment sheet is canceled.
     * 
     * See the Apple Pay JS API Reference for more information.
     */
    shippingContactSelected(basket: Basket, event: Object, response: Object): ApplePayHookResult;
    /**
     * 
     * 
     * Called after handling the given `ApplePayShippingMethodSelectedEvent` for the given basket. The given
     * shipping method will have already been set on the basket.  The basket will have already been calculated before
     * this hook is called.
     * 
     * The given response object will contain properties whose values are to be passed as parameters to the
     * `ApplePaySession.completeShippingMethodSelection` event callback:
     * 
     * - total - Updated total line item object
     * - lineItems - Array of updated line item objects
     * 
     * Return a result with an error status to indicate a problem. See dw.extensions.applepay.ApplePayHookResult
     * for how to indicate error statuses with detail information to be provided to Apple Pay.
     * 
     * If the returned result includes a redirect URL, the shopper browser will be navigated to that URL if the Apple
     * Pay payment sheet is canceled.
     * 
     * See the Apple Pay JS API Reference for more information.
     */
    shippingMethodSelected(basket: Basket, shippingMethod: ShippingMethod, event: Object, response: Object): ApplePayHookResult;
}

export = ApplePayHooks;
