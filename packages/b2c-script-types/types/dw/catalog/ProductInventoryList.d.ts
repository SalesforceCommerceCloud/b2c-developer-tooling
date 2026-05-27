import ExtensibleObject = require('../object/ExtensibleObject');
import CustomAttributes = require('../object/CustomAttributes');
import ProductInventoryRecord = require('./ProductInventoryRecord');
import Product = require('./Product');

declare global {
    module ICustomAttributes {
        interface ProductInventoryList extends CustomAttributes {
        }
    }
}

/**
 * The ProductInventoryList provides access to ID, description and defaultInStockFlag of the list. Furthermore inventory
 * records can be accessed by product or product ID.
 * 
 * When using Omnichannel Inventory (OCI):
 * 
 * - B2C Commerce uses ProductInventoryLists to reference and expose OCI Locations and Location Groups. They're
 * required for synchronizing availability data and creating reservations.
 * - Create a ProductInventoryList in B2C Commerce for each OCI Location and Location Group that B2C Commerce will
 * access. The ProductInventoryList ID must match the External Reference field on the corresponding Location or Location
 * Group.
 * - A ProductInventoryList ID/External Reference must have between 2 and 128 characters (inclusive). It can include
 * only lowercase letters, uppercase letters, digits, hyphens, and underscores.
 */
declare class ProductInventoryList extends ExtensibleObject<ICustomAttributes.ProductInventoryList> {
    /**
     * Returns the ID of the inventory list.
     */
    readonly ID: string;
    /**
     * Returns the default in-stock flag of the inventory list.
     */
    readonly defaultInStockFlag: boolean;
    /**
     * Returns the description of the inventory list.
     */
    readonly description: string;
    private constructor();
    /**
     * Returns the default in-stock flag of the inventory list.
     */
    getDefaultInStockFlag(): boolean;
    /**
     * Returns the description of the inventory list.
     */
    getDescription(): string;
    /**
     * Returns the ID of the inventory list.
     */
    getID(): string;
    /**
     * Returns the inventory record for the specified product or null
     * if there is no record for the product in this list.
     */
    getRecord(product: Product<any>): ProductInventoryRecord | null;
    /**
     * Returns the inventory record for the specified product ID or null
     * if there is no record for the product id in this list.
     */
    getRecord(productID: string): ProductInventoryRecord | null;
}

export = ProductInventoryList;
