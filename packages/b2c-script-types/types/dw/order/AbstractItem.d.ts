import Extensible = require('../object/Extensible');
import OrderItem = require('./OrderItem');
import LineItem = require('./LineItem');
import Money = require('../value/Money');
import Collection = require('../util/Collection');

/**
 * An item which references, or in other words is based upon, an dw.order.OrderItem. Provides methods to access the
 * OrderItem, the order dw.order.LineItem which has been extended, and the dw.order.Order. In addition it defines
 * methods to access item level prices and the item id. Supports custom-properties.
 */
declare abstract class AbstractItem extends Extensible {
    /**
     * Gross price of item.
     */
    readonly grossPrice: Money;
    /**
     * The item-id used for referencing between items
     */
    readonly itemID: string;
    /**
     * Returns the Order Product- or Shipping- LineItem associated with this item. Should never return null.
     */
    readonly lineItem: LineItem<any>;
    /**
     * Net price of item.
     */
    readonly netPrice: Money;
    /**
     * Returns the order item extensions related to this item. Should never return null.
     */
    readonly orderItem: OrderItem;
    /**
     * The order-item-id used for referencing the dw.order.OrderItem
     */
    readonly orderItemID: string;
    /**
     * Total tax for item.
     */
    readonly tax: Money;
    /**
     * Price of entire item on which tax calculation is based. Same as getNetPrice
     * or getGrossPrice depending on whether the order is based on net or gross prices.
     */
    readonly taxBasis: Money;
    /**
     * Tax items representing a tax breakdown
     * @see dw.order.TaxItem
     */
    readonly taxItems: Collection<any>;
    /**
     * Gross price of item.
     */
    getGrossPrice(): Money;
    /**
     * The item-id used for referencing between items
     */
    getItemID(): string;
    /**
     * Returns the Order Product- or Shipping- LineItem associated with this item. Should never return null.
     */
    getLineItem(): LineItem<any>;
    /**
     * Net price of item.
     */
    getNetPrice(): Money;
    /**
     * Returns the order item extensions related to this item. Should never return null.
     */
    getOrderItem(): OrderItem;
    /**
     * The order-item-id used for referencing the dw.order.OrderItem
     */
    getOrderItemID(): string;
    /**
     * Total tax for item.
     */
    getTax(): Money;
    /**
     * Price of entire item on which tax calculation is based. Same as getNetPrice
     * or getGrossPrice depending on whether the order is based on net or gross prices.
     */
    getTaxBasis(): Money;
    /**
     * Tax items representing a tax breakdown
     * @see dw.order.TaxItem
     */
    getTaxItems(): Collection<any>;
}

export = AbstractItem;
