import Status = require('../../system/Status');
import Product = require('../../catalog/Product');
import PinterestProduct = require('./PinterestProduct');
import PinterestAvailability = require('./PinterestAvailability');

/**
 * PinterestFeedHooks interface containing extension points for customizing Pinterest export feeds.
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
 * {"name": "dw.extensions.pinterest.feed.transformProduct", "script": "./hooks.ds"}
 * ]
 * ```
 * 
 * A hook entry has a 'name' and a 'script' property.
 * 
 * - The 'name' contains the extension point, the hook name.
 * - The 'script' contains the script relative to the hooks file, with the exported hook function.
 */
declare interface PinterestFeedHooks {
    /**
     * The extension point name extensionPointTransformAvailability.
     */
    readonly extensionPointTransformAvailability: "dw.extensions.pinterest.feed.transformAvailability";
    /**
     * The extension point name extensionPointTransformProduct.
     */
    readonly extensionPointTransformProduct: "dw.extensions.pinterest.feed.transformProduct";
    /**
     * Called after default transformation of given Demandware product to Pinterest availability as part of the
     * availability feed export.
     */
    transformAvailability(product: Product<any>, pinterestAvailability: PinterestAvailability): Status;
    /**
     * Called after default transformation of given Demandware product to Pinterest product as part of the catalog feed
     * export.
     */
    transformProduct(product: Product<any>, pinterestProduct: PinterestProduct): Status;
}

export = PinterestFeedHooks;
