import Status = require('../../system/Status');
import Order = require('../../order/Order');

/**
 * 
 * 
 * This interface represents all script hooks that can be registered to customize the Salesforce Payments functionality.
 * See Salesforce Payments documentation for how to gain access and configure it for use on your sites.
 * 
 * It contains the extension points (hook names), and the functions that are called by each extension point. A function
 * must be defined inside a JavaScript source and must be exported. The script with the exported hook function must be
 * located inside a site cartridge. Inside the site cartridge a 'package.json' file with a 'hooks' entry must exist.
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
 * {"name": "dw.extensions.payments.asyncPaymentSucceeded", "script": "./payments.js"},
 * {"name": "dw.extensions.payments.adyenNotification", "script": "./payments.js"},
 * {"name": "dw.extensions.payments.adyenFailureNotification", "script": "./payments.js"},
 * {"name": "dw.extensions.payments.sendOrderConfirmationEmail", "script": "./emails.js"}
 * ]
 * ```
 * 
 * A hook entry has a 'name' and a 'script' property.
 * 
 * - The 'name' contains the extension point, the hook name.
 * - The 'script' contains the script relative to the hooks file, with the exported hook function.
 */
declare interface SalesforcePaymentsHooks {
    /**
     * The extension point name extensionPointAdyenFailureNotification.
     */
    readonly extensionPointAdyenFailureNotification: "dw.extensions.payments.adyenFailureNotification";
    /**
     * The extension point name extensionPointAdyenNotification.
     */
    readonly extensionPointAdyenNotification: "dw.extensions.payments.adyenNotification";
    /**
     * The extension point name extensionPointAsyncPaymentSucceeded.
     */
    readonly extensionPointAsyncPaymentSucceeded: "dw.extensions.payments.asyncPaymentSucceeded";
    /**
     * The extension point name extensionPointSendOrderConfirmationEmail.
     */
    readonly extensionPointSendOrderConfirmationEmail: "dw.extensions.payments.sendOrderConfirmationEmail";
    /**
     * The extension point name extensionPointStripePaymentEvent.
     */
    readonly extensionPointStripePaymentEvent: "dw.extensions.payments.stripePaymentEvent";
    /**
     * Called when an Adyen webhook notification with a failed payment is received for the given order.
     */
    adyenFailureNotification(order: Order): Status;
    /**
     * Called when an Adyen webhook notification is received for the given order.
     */
    adyenNotification(order: Order): Status;
    /**
     * Called when asynchronous payment succeeded for the given order.
     */
    asyncPaymentSucceeded(order: Order): Status;
    /**
     * Called to send order confirmation email after successful payment processing.
     */
    sendOrderConfirmationEmail(order: Order): Status;
    /**
     * Called when a Stripe payment event is received for the given order.
     */
    stripePaymentEvent(eventName: string, order: Order): Status;
}

export = SalesforcePaymentsHooks;
