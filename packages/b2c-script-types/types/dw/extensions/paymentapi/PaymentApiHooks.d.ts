import Status = require('../../system/Status');
import Order = require('../../order/Order');
import OrderPaymentInstrument = require('../../order/OrderPaymentInstrument');

/**
 * PaymentApiHooks interface containing extension points for customizing Payment API requests for authorization,
 * and their responses.
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
 * {"name": "dw.extensions.paymentapi.beforeAuthorization", "script": "./payment.ds"}
 * {"name": "dw.extensions.paymentapi.afterAuthorization", "script": "./payment.ds"}
 * ]
 * ```
 * 
 * A hook entry has a 'name' and a 'script' property.
 * 
 * - The 'name' contains the extension point, the hook name.
 * - The 'script' contains the script relative to the hooks file, with the exported hook function.
 */
declare interface PaymentApiHooks {
    /**
     * The extension point name extensionPointAfterAuthorization.
     */
    readonly extensionPointAfterAuthorization: "dw.extensions.paymentapi.afterAuthorization";
    /**
     * The extension point name extensionPointBeforeAuthorization.
     */
    readonly extensionPointBeforeAuthorization: "dw.extensions.paymentapi.beforeAuthorization";
    /**
     * 
     * 
     * Called after the response has been handled for a request to authorize payment for the given order.
     * 
     * The given status is the result of handling the response without customization. That status will be
     * used unless an implementation of this hook returns an alternative status.
     */
    afterAuthorization(order: Order, payment: OrderPaymentInstrument, custom: Object, status: Status): Status;
    /**
     * 
     * 
     * Called when a request is to be made to authorize payment for the given order.
     * 
     * Return an error status to indicate a problem. The request will not be made to the payment provider.
     */
    beforeAuthorization(order: Order, payment: OrderPaymentInstrument, custom: Object): Status;
}

export = PaymentApiHooks;
