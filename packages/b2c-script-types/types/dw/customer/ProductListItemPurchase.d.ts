import ExtensibleObject = require('../object/ExtensibleObject');
import CustomAttributes = require('../object/CustomAttributes');
import Quantity = require('../value/Quantity');
import ProductListItem = require('./ProductListItem');

declare global {
    module ICustomAttributes {
        interface ProductListItemPurchase extends CustomAttributes {
        }
    }
}

/**
 * A record of the purchase of an item contained in a product list.
 */
declare class ProductListItemPurchase extends ExtensibleObject<ICustomAttributes.ProductListItemPurchase> {
    /**
     * Returns the item that was purchased.
     */
    readonly item: ProductListItem;
    /**
     * Returns the number of the order in which the
     * product list item was purchased.
     */
    readonly orderNo: string;
    /**
     * Returns the date on which the product list item was purchased.
     */
    readonly purchaseDate: Date;
    /**
     * Returns the name of the purchaser of the product list item.
     */
    readonly purchaserName: string;
    /**
     * Returns the quantity of the product list item that was purchased.
     */
    readonly quantity: Quantity;
    private constructor();
    /**
     * Returns the item that was purchased.
     */
    getItem(): ProductListItem;
    /**
     * Returns the number of the order in which the
     * product list item was purchased.
     */
    getOrderNo(): string;
    /**
     * Returns the date on which the product list item was purchased.
     */
    getPurchaseDate(): Date;
    /**
     * Returns the name of the purchaser of the product list item.
     */
    getPurchaserName(): string;
    /**
     * Returns the quantity of the product list item that was purchased.
     */
    getQuantity(): Quantity;
}

export = ProductListItemPurchase;
