import AbstractItemCtnr = require('./AbstractItemCtnr');
import EnumValue = require('../value/EnumValue');
import Invoice = require('./Invoice');
import ShippingMethod = require('./ShippingMethod');
import OrderAddress = require('./OrderAddress');
import FilteringCollection = require('../util/FilteringCollection');
import ShippingOrderItem = require('./ShippingOrderItem');
import Collection = require('../util/Collection');
import TrackingInfo = require('./TrackingInfo');
import OrderItem = require('./OrderItem');
import Quantity = require('../value/Quantity');

/**
 * A shipping order is used to specify items that should be shipped, and is
 * typically exported to, and updated by a back-office warehouse management
 * system.
 * 
 * An dw.order.Order can have n shipping orders expressing how the order
 * is to be shipped. The creation, export and update of shipping orders is
 * largely handled by custom logic in scripts by implementing
 * dw.order.hooks.ShippingOrderHooks. Use method
 * dw.order.Order.createShippingOrder for creation and add items using
 * createShippingOrderItem - each item is related
 * to an order item which in turn represents a product- or shipping- line item
 * in the order.
 * 
 * A shipping order has a status calculated from its item status, one of
 * 
 * - CONFIRMED - shipping order not yet exported, with 0 items, or all items
 * in status CONFIRMED.
 * - WAREHOUSE - shipping order exported, with all items in status WAREHOUSE.
 * - SHIPPED - exported shipping order has been updated, with 1-n items in
 * status SHIPPED and 0-n CANCELLED.
 * - CANCELLED - exported shipping order has been updated, with all items in
 * status CANCELLED.
 * 
 * The following status transitions are supported. Every status transition is
 * documented by the addition of an order note such as 'Shipping order 123456
 * status changed to WAREHOUSE.':
 * 
 * From
 * To
 * When
 * Use
 * 
 * CONFIRMED
 * WAREHOUSE
 * Shipping order exported
 * Call setStatusWarehouse - note this is the only way to set the
 * items to status WAREHOUSE
 * 
 * WAREHOUSE
 * SHIPPED
 * One or more items have been SHIPPED
 * Call dw.order.ShippingOrderItem.setStatus using
 * dw.order.ShippingOrderItem.STATUS_SHIPPED
 * 
 * WAREHOUSE
 * CANCELLED
 * All items have been CANCELLED
 * Call dw.order.ShippingOrderItem.setStatus using
 * dw.order.ShippingOrderItem.STATUS_CANCELLED
 * 
 * Order post-processing APIs (gillian) are now inactive by default and will throw
 * an exception if accessed. Activation needs preliminary approval by Product Management.
 * Please contact support in this case. Existing customers using these APIs are not
 * affected by this change and can use the APIs until further notice.
 */
declare class ShippingOrder extends AbstractItemCtnr {
    /**
     * Sorting by item id. Use with method getItems as an argument to
     * method dw.util.FilteringCollection.sort.
     */
    static readonly ORDERBY_ITEMID: any;
    /**
     * Sorting by the position of the related oder item. Use with method
     * getItems as an argument to method
     * dw.util.FilteringCollection.sort.
     */
    static readonly ORDERBY_ITEMPOSITION: any;
    /**
     * Unsorted , as it is. Use with method getItems as an argument
     * to method dw.util.FilteringCollection.sort.
     */
    static readonly ORDERBY_UNSORTED: any;
    /**
     * Selects the product items. Use with method getItems as an
     * argument to method dw.util.FilteringCollection.select.
     */
    static readonly QUALIFIER_PRODUCTITEMS: any;
    /**
     * Selects for the service items. Use with method getItems as an
     * argument to method dw.util.FilteringCollection.select.
     */
    static readonly QUALIFIER_SERVICEITEMS: any;
    /**
     * Constant for Shipping Order Status CANCELLED
     */
    static readonly STATUS_CANCELLED: string;
    /**
     * Constant for Shipping Order Status CONFIRMED
     */
    static readonly STATUS_CONFIRMED: string;
    /**
     * Constant for Shipping Order Status SHIPPED
     */
    static readonly STATUS_SHIPPED: string;
    /**
     * Constant for Shipping Order Status WAREHOUSE
     */
    static readonly STATUS_WAREHOUSE: string;
    /**
     * Returns null or the previously created dw.order.Invoice.
     * @see createInvoice
     */
    readonly invoice: Invoice | null;
    /**
     * Returns `null` or the invoice-number.
     * @see createInvoice
     */
    readonly invoiceNumber: string | null;
    /**
     * Gets the shipping date.
     * 
     * Returns `null` if this shipping order is not yet shipped.
     */
    shipDate: Date | null;
    /**
     * Returns the shipping address (optional, can be null).
     * 
     * Note: the shipping address is not copied into the
     * ShippingOrder but is a link to a
     * dw.order.OrderAddress held in the dw.order.Order.
     */
    shippingAddress: OrderAddress | null;
    /**
     * Returns the shipping method of the shipping order.
     * 
     * Can be `null`.
     */
    readonly shippingMethod: ShippingMethod | null;
    /**
     * Gets the shipping order number.
     */
    readonly shippingOrderNumber: string;
    /**
     * Gets the status of this shipping order. The status is read-only and
     * calculated from the item status. See class documentation for more
     * details.
     * 
     * The possible values are STATUS_CONFIRMED,
     * STATUS_WAREHOUSE, STATUS_SHIPPED,
     * STATUS_CANCELLED.
     */
    readonly status: EnumValue;
    /**
     * Gets all tracking informations for this shipping order.
     * @see dw.order.TrackingInfo
     */
    readonly trackingInfos: Collection<any>;
    private constructor();
    /**
     * Adds a tracking info to this shipping order with the given ID.
     * @see dw.order.TrackingInfo
     */
    addTrackingInfo(trackingInfoID: string): TrackingInfo;
    /**
     * Creates a new dw.order.Invoice based on this
     * ShippingOrder.
     * 
     * The shipping-order-number will be used as the
     * invoice-number. The Invoice can then be accessed using
     * getInvoice or getInvoiceNumber can be used.
     * The method must not be called more than once for a ShippingOrder,
     * nor may 2 Invoices exist with the same invoice-number.
     * 
     * The new Invoice is a debit-invoice with a status
     * dw.order.Invoice.STATUS_NOT_PAID, and will be passed to the
     * capture payment-hook in a separate database transaction for processing.
     */
    createInvoice(): Invoice;
    /**
     * Creates a new dw.order.Invoice based on this ShippingOrder.
     * 
     * The invoice-number must be specified as an argument.The Invoice can then be accessed using
     * getInvoice or getInvoiceNumber can be used.
     * The method must not be called more than once for a ShippingOrder,
     * nor may 2 Invoices exist with the same invoice-number.
     * 
     * The new Invoice is a debit-invoice with a status dw.order.Invoice.STATUS_NOT_PAID, and
     * will be passed to the capture payment-hook in a separate database
     * transaction for processing.
     */
    createInvoice(invoiceNumber: string): Invoice;
    /**
     * Create a dw.order.ShippingOrderItem in the shipping order with
     * the number `shippingOrderNumber`.
     * 
     * The quantity of the new item can be optionally specified. A quantity of
     * `null` indicates the new item should be based on the entire order item and
     * is recommended for dw.order.ShippingLineItems. If a quantity is
     * specified for a dw.order.ProductLineItem which is less than
     * ProductLineItem.getQuantity the
     * ProductLineItem will be split, creating a new
     * ProductLineItem. The new
     * ShippingOrderItem will be associated with the new
     * ProductLineItem, which will receive the specified
     * quantity.
     * See also createShippingOrderItem.
     */
    createShippingOrderItem(orderItem: OrderItem, quantity: Quantity): ShippingOrderItem;
    /**
     * Create a dw.order.ShippingOrderItem in the shipping order with
     * the number `shippingOrderNumber`.
     * 
     * The quantity of the new item can be optionally specified. A quantity of
     * `null` indicates the new item should be based on the entire order item and
     * is recommended for dw.order.ShippingLineItems.
     * If the specified quantity is less than ProductLineItem.getQuantity the
     * ProductLineItem will be split or not depending on `splitIfPartial` parameter.
     * When `split` is `true`, the method is equivalent to
     * createShippingOrderItem.
     */
    createShippingOrderItem(orderItem: OrderItem, quantity: Quantity, splitIfPartial: boolean): ShippingOrderItem;
    /**
     * Returns null or the previously created dw.order.Invoice.
     * @see createInvoice
     */
    getInvoice(): Invoice | null;
    /**
     * Returns `null` or the invoice-number.
     * @see createInvoice
     */
    getInvoiceNumber(): string | null;
    /**
     * Gets the shipping date.
     * 
     * Returns `null` if this shipping order is not yet shipped.
     */
    getShipDate(): Date | null;
    /**
     * Returns the shipping address (optional, can be null).
     * 
     * Note: the shipping address is not copied into the
     * ShippingOrder but is a link to a
     * dw.order.OrderAddress held in the dw.order.Order.
     */
    getShippingAddress(): OrderAddress | null;
    /**
     * Returns the shipping method of the shipping order.
     * 
     * Can be `null`.
     */
    getShippingMethod(): ShippingMethod | null;
    /**
     * Gets the shipping order number.
     */
    getShippingOrderNumber(): string;
    /**
     * Gets the status of this shipping order. The status is read-only and
     * calculated from the item status. See class documentation for more
     * details.
     * 
     * The possible values are STATUS_CONFIRMED,
     * STATUS_WAREHOUSE, STATUS_SHIPPED,
     * STATUS_CANCELLED.
     */
    getStatus(): EnumValue;
    /**
     * Gets a tracking info for this shipping order.
     * @see dw.order.TrackingInfo
     */
    getTrackingInfo(trackingInfoID: string): TrackingInfo | null;
    /**
     * Gets all tracking informations for this shipping order.
     * @see dw.order.TrackingInfo
     */
    getTrackingInfos(): Collection<any>;
    /**
     * Sets the shipping date.
     */
    setShipDate(date: Date): void;
    /**
     * Set a shipping address for the shipping order.
     * @see getShippingAddress
     */
    setShippingAddress(address: OrderAddress): void;
    /**
     * Set the id of shipping method.
     * @see dw.order.ShippingMethod.getID
     */
    setShippingMethodID(shippingMethodID: string): void;
    /**
     * Set a CONFIRMED shipping order (all items in status CONFIRMED) to status
     * WAREHOUSE (all items in status WAREHOUSE).
     * 
     * Note - this method is the only way to transition a shipping order from
     * CONFIRMED to WAREHOUSE.
     * @throws IllegalArgumentException if the shipping order is in a status other than CONFIRMED.
     */
    setStatusWarehouse(): void;
}

export = ShippingOrder;
