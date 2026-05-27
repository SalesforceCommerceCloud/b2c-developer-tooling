import Status = require('../../system/Status');
import LineItemCtnr = require('../LineItemCtnr');

/**
 * This interface represents all script hooks that can be registered to customize the order and basket calculation
 * functionality. It contains the extension points (hook names), and the functions that are called by each extension
 * point. A function must be defined inside a JavaScript source and must be exported. The script with the exported hook
 * function must be located inside a site cartridge. Inside the site cartridge a 'package.json' file with a 'hooks'
 * entry must exist.
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
 * {"name": "dw.order.calculate", "script": "./calculate.js"}
 * ]
 * ```
 * 
 * A hook entry has a 'name' and a 'script' property.
 * 
 * - The 'name' contains the extension point, the hook name.
 * - The 'script' contains the script relative to the hooks file, with the exported hook function.
 */
declare interface CalculateHooks {
    /**
     * The extension point name extensionPointCalculate.
     */
    readonly extensionPointCalculate: "dw.order.calculate";
    /**
     * The extension point name extensionPointCalculateShipping.
     */
    readonly extensionPointCalculateShipping: "dw.order.calculateShipping";
    /**
     * The extension point name extensionPointCalculateTax.
     */
    readonly extensionPointCalculateTax: "dw.order.calculateTax";
    /**
     * The function is called by extension point extensionPointCalculate. It provides a single place for
     * the line item container calculation.
     * 
     * To provide a fallback for existing implementations, the default implementation calls the hook
     * dw.ocapi.shop.basket.calculate. However, this hook is deprecated, and calling it will create entries in the
     * deprecated API usage logs. You should override this function to use dw.order.calculate instead.
     * 
     * If you provide your own implementation, you should provide and use the following hooks. Best practice is
     * to use the hook manager to retrieve them in the calculate hook, and avoid calling them directly.
     * 
     * - extensionPointCalculateTax for tax calculation
     * - extensionPointCalculateShipping for shipping calculation
     */
    calculate(lineItemCtnr: LineItemCtnr<any>): Status;
    /**
     * The function is called by extension point extensionPointCalculateShipping. It provides a single
     * place for shipping calculation during the line item container calculation.
     */
    calculateShipping(lineItemCtnr: LineItemCtnr<any>): Status;
    /**
     * The function is called by extension point extensionPointCalculateTax. It provides a single place
     * for tax calculation during the line item container calculation.
     */
    calculateTax(lineItemCtnr: LineItemCtnr<any>): Status;
}

export = CalculateHooks;
