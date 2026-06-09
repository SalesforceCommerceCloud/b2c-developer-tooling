import Status = require('../../system/Status');
import Basket = require('../Basket');
import Customer = require('../../customer/Customer');

/**
 * This interface represents script hooks that can be registered to populate customer details into a basket. It contains
 * the extension points (hook names), and the functions that are called by each extension point. A function must be
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
 * {"name": "dw.order.populateCustomerDetails", "script": "./populateCustomerDetails.js"}
 * ]
 * ```
 * 
 * A hook entry has a 'name' and a 'script' property.
 * 
 * - The 'name' contains the extension point, the hook name.
 * - The 'script' contains the script relative to the hooks file, with the exported hook function.
 */
declare interface CheckoutHooks {
    /**
     * The extension point name extensionPointPopulateCustomerDetails.
     */
    readonly extensionPointPopulateCustomerDetails: "dw.order.populateCustomerDetails";
    /**
     * Populates registered customer details into a basket. This includes the default shipping address and default
     * payment instrument from the registered customer's profile.
     * 
     * If no override script is registered, the system defaults to the platform's standard population logic which copies
     * the customer's default or first address to the basket's default shipment and billing address, then creates a
     * payment instrument from the customer's default or first payment instrument.
     * 
     * This method is automatically invoked when the <codeph>populateCustomerDetails</codeph> query parameter is set to
     * <codeph>true</codeph> on createBasket and transferBasket endpoints.
     */
    populateCustomerDetails(basket: Basket, customer: Customer): Status;
}

export = CheckoutHooks;
