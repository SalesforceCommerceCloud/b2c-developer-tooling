import Status = require('../../system/Status');
import Order = require('../Order');
import OrderPaymentInstrument = require('../OrderPaymentInstrument');
import Invoice = require('../Invoice');

/**
 * This interface represents all script hooks that can be registered to
 * customize the order center payment functionality. It contains the extension
 * points (hook names), and the functions that are called by each extension
 * point. A function must be defined inside a JavaScript source and must be
 * exported. The script with the exported hook function must be located inside a
 * site cartridge. Inside the site cartridge a 'package.json' file with a
 * 'hooks' entry must exist.
 * 
 * "hooks": "./hooks.json"
 * 
 * The hooks entry links to a json file, relative to the 'package.json' file.
 * This file lists all registered hooks inside the hooks property:
 * 
 * ```
 * "hooks": [
 * {"name": "dw.order.payment.authorize", "script": "./authorize.js"},
 * {"name": "dw.order.payment.validateAuthorization", "script": "./validateAuthorization.js"},
 * ]
 * ```
 * 
 * A hook entry has a 'name' and a 'script' property.
 * 
 * - The 'name' contains the extension point, the hook name.
 * - The 'script' contains the script relative to the hooks file, with the
 * exported hook function.
 */
declare interface PaymentHooks {
    /**
     * The extension point name extensionPointAuthorize.
     * 
     * This hook is optional.
     */
    readonly extensionPointAuthorize: "dw.order.payment.authorize";
    /**
     * The extension point name extensionPointAuthorizeCreditCard.
     * 
     * This hook is optional.
     */
    readonly extensionPointAuthorizeCreditCard: "dw.order.payment.authorizeCreditCard";
    /**
     * The extension point name extensionPointCapture.
     */
    readonly extensionPointCapture: "dw.order.payment.capture";
    /**
     * The extension point name extensionPointReauthorize.
     */
    readonly extensionPointReauthorize: "dw.order.payment.reauthorize";
    /**
     * The extension point name extensionPointRefund.
     */
    readonly extensionPointRefund: "dw.order.payment.refund";
    /**
     * The extension point name extensionPointReleaseAuthorization.
     */
    readonly extensionPointReleaseAuthorization: "dw.order.payment.releaseAuthorization";
    /**
     * The extension point name extensionPointValidateAuthorization.
     */
    readonly extensionPointValidateAuthorization: "dw.order.payment.validateAuthorization";
    /**
     * The function is called by extension point extensionPointAuthorize. Custom payment authorization - modify the
     * order as needed.
     * 
     * - Prerequisite: An order has been created using the data api or via the storefront.
     * - Return Status.OK: Corresponding payment transaction is marked as authorized (usually a custom property is used for this).
     * - Return Status.ERROR: Order is held, authorization needs to be repeated.
     */
    authorize(order: Order, paymentDetails: OrderPaymentInstrument): Status;
    /**
     * The function is called by extension point
     * extensionPointAuthorizeCreditCard. Custom payment authorization
     * of a credit card - modify the order as needed.
     * 
     * - Prerequisite: An order has been created using the data api or via the
     * storefront.
     * - Return Status.OK: Corresponding payment transaction is marked as
     * authorized (usually a custom property is used for this).
     * - Return Status.ERROR: Order is held, authorization needs to be
     * repeated.
     */
    authorizeCreditCard(order: Order, paymentDetails: OrderPaymentInstrument, cvn: string): Status;
    /**
     * The function is called by extension point extensionPointCapture. Custom payment capture - modify the order as needed.
     * 
     * - Prerequisite:
     * 
     * [ either ] As a result of shipping (or part-shipping) a shipping -order the warehouse updates the status of the shipping-order
     * resulting in the creation of an unpaid debit invoice (the creation of the invoice is usually handled in
     * dw.order.hooks.ShippingOrderHooks.changeStatus).
     * 
     * [ or ] A unpaid debit invoice has been created using the data api.
     * - Context: An unpaid debit invoice is passed to the payment system for capture. The capture attempt can either succeed (complete
     * invoice amount captured) or fail. As a result the invoice status is updated by ordercenter for further processing. See dw.order.Invoice.
     * - Hook responsibility: The hook should attempt to capture the amount located in invoice.grandTotal.grossPrice. When successful,
     * the capture hook should also update the invoice by calling
     * dw.order.Invoice.addCaptureTransaction
     * which serves to record the capturedAmount and associate the invoice with the payment-transaction.
     * - Return Status.OK: Indicates capture succeeded: Order Center sets the Invoice status to dw.order.Invoice.STATUS_PAID.
     * - Return Status.ERROR: Indicates capture failed: Order Center sets the Invoice status to dw.order.Invoice.STATUS_FAILED for
     * further processing.
     * - Post processing:  When the capture hook returns with success, order center not only sets the relevant invoice status, but also
     * sets the relevant capturedAmount values on the invoice item. Returning success means the entire invoice total has been captured, so each item
     * within the invoice can also be marked as completely captured. Note the script implementing the hook can take responsibility for this if desired
     * order center will not overwrite existing values, but normally the standard implementation fits. As a result each invoice item and the related
     * order item can return a capturedAmount, useful for calculating possible refunds.
     */
    capture(invoice: Invoice): Status;
    /**
     * The function is called by extension point extensionPointReauthorize. Custom payment authorization - modify the
     * order as needed.
     * 
     * - Prerequisite:
     * 
     * [ either ] Based on a selected dw.order.Order, a dw.order.ShippingOrder (which represents the whole or part of the order which can be shipped)
     * is to be created ready for export to the warehouse system.
     * 
     * [ or ] A dw.order.ShippingOrder is to be directly created using the data api.
     * - Context: The related order is passed to the payment hook to check its authorization has not become invalid. Two hooks are called:
     * 
     * a. validateAuthorization is used to check the orders authorization is still valid
     * 
     * b. reauthorize is called if step a. returns Error
     * 
     * - Return Status.OK: Corresponding payment transaction is marked as authorized (usually a custom property is used for this).
     * If the order had been previously authorized, the custom property values may be overwritten during reauthorization.
     * - Return Status.ERROR: Order is held, authorization needs to be repeated.
     */
    reauthorize(order: Order): Status;
    /**
     * The function is called by extension point extensionPointRefund. Custom payment refund - modify the order as needed.
     * 
     * - Prerequisite:
     * 
     * [ either ] Goods returned by the customer result in the creation of one or more return documents, resulting in the creation of an
     * unpaid customer credit invoice (the creation of the invoice is usually handled in dw.order.hooks.ReturnHooks.changeStatus).
     * 
     * [ or ] An unpaid customer credit invoice is created using the data api (perhaps as a result of the creation of a customer appeasement).
     * - Context: An unpaid credit invoice is passed to the payment system for refund. The refund attempt can either succeed (complete
     * invoice amount refunded) or fail. As a result the invoice status is updated by ordercenter for further processing. See dw.order.Invoice.
     * - Hook responsibility: The hook should attempt to refund the amount located in invoice.grandTotal.grossPrice. When successful,
     * the refund hook should also update the invoice by calling
     * dw.order.Invoice.addRefundTransaction
     * which serves to record the refundedAmount and associate the invoice with the payment-transaction.
     * - Return Status.OK: Indicates refund succeeded: Order Center sets the Invoice status to dw.order.Invoice.STATUS_PAID.
     * - Return Status.ERROR: Indicates refund failed: Order Center sets the Invoice status to dw.order.Invoice.STATUS_FAILED for
     * further processing.
     * - Post processing:  When the refund hook returns with success, order center not only sets the relevant invoice status, but also
     * sets the relevant refundAmount values on the invoice item. Returning success means the entire invoice total has been refunded, so each item
     * within the invoice can also be marked as completely refunded. Note the script implementing the hook can take responsibility for this if desired
     * order center will not overwrite existing values, but normally the standard implementation fits. As a result each invoice item and the related
     * order item can return a refundedAmount, useful for calculating further possible refunds.
     */
    refund(invoice: Invoice): Status;
    /**
     * The function is called by extension point extensionPointReleaseAuthorization.
     * Custom payment release authorization - modify the order as needed.
     * 
     * - Prerequisite: an authorized order is updated resulting in a need to release the remaining authorization. This happens when:
     * 
     * - order is cancelled
     * 
     * - order is complete after remaining order items are cancelled.
     * - Return Status.OK - successful release authorization
     * - Return Status.ERROR - failed release authorization
     */
    releaseAuthorization(order: Order): Status;
    /**
     * The function is called by extension point extensionPointValidateAuthorization. Custom payment authorization - modify the
     * order as needed.
     * 
     * - Context: This hook is called to validate whether a payment authorization exists for the order. It should usually check:
     * 
     * - Whether the authorize or reauthorize hook was previously successfully executed for the order, e.g. by checking whether custom property has been previously set.
     * 
     * - Whether an existing authorization has expired e.g. by comparing a timestamp set on authorization with the current time.
     * - Return Status.OK: indicates the order has a valid payment authorization.
     * - Return Status.ERROR: indicates reauthorize should be called.
     * See reauthorize for more details.
     */
    validateAuthorization(order: Order): Status;
}

export = PaymentHooks;
