import Extensible = require('../object/Extensible');
import Order = require('./Order');
import FilteringCollection = require('../util/FilteringCollection');
import OrderItem = require('./OrderItem');
import SumItem = require('./SumItem');

/**
 * Basis for item-based objects stemming from a single dw.order.Order, with these common
 * properties (Invoice is used as an example):
 * 
 * -
 * The object has been created from an Order accessible using getOrder
 * - Contains a collection of getItems, each item related to exactly one dw.order.OrderItem which in turn represents
 * an extension to one of the order dw.order.ProductLineItem or one dw.order.ShippingLineItem.
 * Example: an dw.order.Invoice has dw.order.InvoiceItems
 * -
 * The items hold various prices which are summed, resulting in a
 * getProductSubtotal, a
 * getServiceSubtotal and a getGrandTotal,
 * each represented by a dw.order.SumItem.
 * - The object is customizable using custom properties
 */
declare abstract class AbstractItemCtnr extends Extensible {
    /**
     * Created by this user.
     */
    readonly createdBy: string;
    /**
     * The time of creation.
     */
    readonly creationDate: Date;
    /**
     * Returns the sum-item representing the grandtotal for all items.
     */
    readonly grandTotal: SumItem;
    /**
     * Returns the unsorted collection of items
     */
    readonly items: FilteringCollection<OrderItem>;
    /**
     * The last modification time.
     */
    readonly lastModified: Date;
    /**
     * Last modified by this user.
     */
    readonly modifiedBy: string;
    /**
     * Returns the dw.order.Order this object was created for.
     */
    readonly order: Order;
    /**
     * Returns the sum-item representing the subtotal for product items.
     */
    readonly productSubtotal: SumItem;
    /**
     * Returns the sum-item representing the subtotal for service items such as
     * shipping.
     */
    readonly serviceSubtotal: SumItem;
    /**
     * Created by this user.
     */
    getCreatedBy(): string;
    /**
     * The time of creation.
     */
    getCreationDate(): Date;
    /**
     * Returns the sum-item representing the grandtotal for all items.
     */
    getGrandTotal(): SumItem;
    /**
     * Returns the unsorted collection of items
     */
    getItems(): FilteringCollection<OrderItem>;
    /**
     * The last modification time.
     */
    getLastModified(): Date;
    /**
     * Last modified by this user.
     */
    getModifiedBy(): string;
    /**
     * Returns the dw.order.Order this object was created for.
     */
    getOrder(): Order;
    /**
     * Returns the sum-item representing the subtotal for product items.
     */
    getProductSubtotal(): SumItem;
    /**
     * Returns the sum-item representing the subtotal for service items such as
     * shipping.
     */
    getServiceSubtotal(): SumItem;
}

export = AbstractItemCtnr;
