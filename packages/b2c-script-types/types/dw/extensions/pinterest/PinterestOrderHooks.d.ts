import Status = require('../../system/Status');
import PinterestOrder = require('./PinterestOrder');

/**
 * PinterestOrderHooks interface containing extension points for customizing Pinterest order status.
 * 
 * These hooks are not executed in a transaction.
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
 * {"name": "dw.extensions.pinterest.order.getStatus", "script": "./hooks.ds"}
 * ]
 * ```
 * 
 * A hook entry has a 'name' and a 'script' property.
 * 
 * - The 'name' contains the extension point, the hook name.
 * - The 'script' contains the script relative to the hooks file, with the exported hook function.
 */
declare interface PinterestOrderHooks {
    /**
     * The extension point name extensionPointGetStatus.
     */
    readonly extensionPointGetStatus: "dw.extensions.pinterest.order.getStatus";
    /**
     * Called to retrieve status for the given order. Return a `null` status for unknown orders.
     */
    getStatus(order: PinterestOrder): Status;
}

export = PinterestOrderHooks;
