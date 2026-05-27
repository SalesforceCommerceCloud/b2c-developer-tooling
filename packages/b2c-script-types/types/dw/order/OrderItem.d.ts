import LineItem = require('./LineItem');
import EnumValue = require('../value/EnumValue');
import Quantity = require('../value/Quantity');
import Collection = require('../util/Collection');
import Money = require('../value/Money');
import ShippingOrderItem = require('./ShippingOrderItem');

/**
 * Defines extensions to dw.order.ProductLineItems and
 * dw.order.ShippingLineItems belonging to an dw.order.Order order.
 * 
 * The order-item can be accessed using
 * dw.order.ProductLineItem.getOrderItem or
 * dw.order.ShippingLineItem.getOrderItem - these methods return null
 * if the item is associated with a dw.order.Basket basket rather than
 * an dw.order.Order order. Alternative access is available using
 * dw.order.Order.getOrderItem by passing the
 * dw.order.OrderItem.getItemID used to identify the
 * order-item in for example export files. The
 * associated order-item can also be accessed from
 * dw.order.InvoiceItem invoice-items,
 * dw.order.ShippingOrderItem shipping-order-items,
 * dw.order.ReturnItem return-items and dw.order.ReturnCaseItem return-case-items
 * using dw.order.AbstractItem.getOrderItem.
 * 
 * The order-item provides an item-level getStatus and
 * getType, methods for accessing and creating associated items,
 * and methods used to allocateInventory for dw.order.ShippingOrder shipping-order creation.
 * 
 * Order post-processing APIs (gillian) are now inactive by default and will throw
 * an exception if accessed. Activation needs preliminary approval by Product Management.
 * Please contact support in this case. Existing customers using these APIs are not
 * affected by this change and can use the APIs until further notice.
 */
declare class OrderItem {
    /**
     * Constant for Order Item Status BACKORDER
     */
    static readonly STATUS_BACKORDER: string;
    /**
     * Constant for Order Item Status CANCELLED
     */
    static readonly STATUS_CANCELLED: string;
    /**
     * Constant for Order Item Status CONFIRMED
     */
    static readonly STATUS_CONFIRMED: string;
    /**
     * Constant for Order Item Status CREATED
     */
    static readonly STATUS_CREATED: string;
    /**
     * Constant for Order Item Status NEW
     */
    static readonly STATUS_NEW: string;
    /**
     * Constant for Order Item Status OPEN
     */
    static readonly STATUS_OPEN: string;
    /**
     * Constant for Order Item Status SHIPPED
     */
    static readonly STATUS_SHIPPED: string;
    /**
     * Constant for Order Item Status WAREHOUSE
     */
    static readonly STATUS_WAREHOUSE: string;
    /**
     * Constant for Order Item Type PRODUCT
     */
    static readonly TYPE_PRODUCT: string;
    /**
     * Constant for Order Item Type SERVICE
     */
    static readonly TYPE_SERVICE: string;
    /**
     * Sum of amounts appeased for this item, calculated by iterating over
     * invoice items associated with the item.
     */
    readonly appeasedAmount: Money;
    /**
     * Sum of amounts captured for this item, calculated by iterating over
     * invoice items associated with the item.
     */
    readonly capturedAmount: Money;
    /**
     * Returns all invoice items associated with this item, each
     * dw.order.InvoiceItem will belong to a different
     * dw.order.Invoice, which can also be accessed using
     * Order.getInvoices or Order.getInvoice.
     */
    readonly invoiceItems: Collection<any>;
    /**
     * The itemID used to identify the OrderItem. Note this is
     * not a UUID, it is created internally when the OrderItem
     * instance is created, and is typically used within export files to
     * identify the item.
     */
    readonly itemID: string;
    /**
     * Returns the line item which is being extended by this instance.
     */
    readonly lineItem: LineItem<any>;
    /**
     * Sum of amounts refunded for this item, calculated by iterating over
     * invoice items associated with the item.
     */
    readonly refundedAmount: Money;
    /**
     * Returns all return case items associated with this item,
     * each dw.order.ReturnCaseItem will belong to a different
     * dw.order.ReturnCase, which can also be accessed using
     * Order.getReturnCases or Order.getReturnCase.
     */
    readonly returnCaseItems: Collection<any>;
    /**
     * The quantity returned, dynamically sum of quantities held by associated
     * ReturnItems.
     */
    readonly returnedQuantity: Quantity;
    /**
     * The last added non-cancelled shipping order item if one exists, otherwise `null`.
     * 
     * Multiple shipping order items that are not in status ShippingOrderItem.STATUS_CANCELLED
     * can exist for one OrderItem, for example if the OrderItem has been split for shipping purposes.
     * The method returns `null` if no non-cancelled shipping order item exists.
     * @deprecated
     */
    readonly shippingOrderItem: ShippingOrderItem | null;
    /**
     * Returns a collection of the ShippingOrderItems created for this item.
     * ShippingOrder items represents the whole or part of this item which could
     * be delivered, and belong to a shipping order.
     * Note that the cancelled shipping order items are returned too.
     * This method is equivalent to getShippingOrderItems
     * called with parameter `true`.
     */
    readonly shippingOrderItems: Collection<any>;
    /**
     * Returns a collection of all split OrderItems associated with this item. Inverse relation to getSplitSourceItem.
     * 
     * Split order items are created when
     * 
     * - creating a ShippingOrderItem for a ShippingOrder, see ShippingOrder.createShippingOrderItem
     * - splitting an existing ShippingOrderItem, see ShippingOrderItem.split
     * 
     * with a specified quantity less than the existing quantity of the associated ProductLineItem. In this case the associated ProductLineItem
     * is split by creating a new ProductLineItem and associating a new ShippingOrderItem with this item. The new ShippingOrderItem
     * receives the specified quantity and the quantity of the item is set to the remaining quantity. All split items are associated to their originating item via
     * the "split source item" association.
     */
    readonly splitItems: Collection<any>;
    /**
     * Returns the split source item associated with this item, if existing. Inverse relation to getSplitItems.
     * 
     * A split source item is associated after the successful creation of a split item with a quantity less than the existing quantity of the item to split.
     * For details see getSplitItems.
     */
    readonly splitSourceItem: OrderItem | null;
    /**
     * Gets the order item status.
     * 
     * The possible values are:
     * 
     * - STATUS_NEW
     * - STATUS_OPEN
     * - STATUS_BACKORDER
     * - STATUS_CONFIRMED
     * - STATUS_WAREHOUSE
     * - STATUS_SHIPPED
     * - STATUS_CANCELLED
     */
    status: EnumValue;
    /**
     * Returns the type of line item with which this instance is associated, one
     * of
     * 
     * - SERVICE (method dw.order.OrderItem.getLineItem returns a
     * dw.order.ShippingLineItem
     * - PRODUCT (method dw.order.OrderItem.getLineItem returns a
     * dw.order.ProductLineItem
     */
    readonly type: EnumValue;
    private constructor();
    /**
     * Please note that this method is disabled by default. Please contact support for enabling it.
     * 
     * Attempts to allocate inventory for the item and returns the quantity that could be allocated or `null`
     * if no allocation was possible.
     * 
     * All dw.order.ProductLineItem.getOptionProductLineItems are allocated with
     * their parent. Note that for items with option product line items no partial allocation is possible. That means
     * the partialAllocation parameter will in this case always be considered as `false`
     */
    allocateInventory(partialAllocation: boolean): Quantity | null;
    /**
     * Sum of amounts appeased for this item, calculated by iterating over
     * invoice items associated with the item.
     */
    getAppeasedAmount(): Money;
    /**
     * Sum of amounts captured for this item, calculated by iterating over
     * invoice items associated with the item.
     */
    getCapturedAmount(): Money;
    /**
     * Returns all invoice items associated with this item, each
     * dw.order.InvoiceItem will belong to a different
     * dw.order.Invoice, which can also be accessed using
     * Order.getInvoices or Order.getInvoice.
     */
    getInvoiceItems(): Collection<any>;
    /**
     * The itemID used to identify the OrderItem. Note this is
     * not a UUID, it is created internally when the OrderItem
     * instance is created, and is typically used within export files to
     * identify the item.
     */
    getItemID(): string;
    /**
     * Returns the line item which is being extended by this instance.
     */
    getLineItem(): LineItem<any>;
    /**
     * Sum of amounts refunded for this item, calculated by iterating over
     * invoice items associated with the item.
     */
    getRefundedAmount(): Money;
    /**
     * Returns all return case items associated with this item,
     * each dw.order.ReturnCaseItem will belong to a different
     * dw.order.ReturnCase, which can also be accessed using
     * Order.getReturnCases or Order.getReturnCase.
     */
    getReturnCaseItems(): Collection<any>;
    /**
     * The quantity returned, dynamically sum of quantities held by associated
     * ReturnItems.
     */
    getReturnedQuantity(): Quantity;
    /**
     * The last added non-cancelled shipping order item if one exists, otherwise `null`.
     * 
     * Multiple shipping order items that are not in status ShippingOrderItem.STATUS_CANCELLED
     * can exist for one OrderItem, for example if the OrderItem has been split for shipping purposes.
     * The method returns `null` if no non-cancelled shipping order item exists.
     * @deprecated
     */
    getShippingOrderItem(): ShippingOrderItem | null;
    /**
     * Returns a collection of the ShippingOrderItems created for this item.
     * ShippingOrder items represents the whole or part of this item which could
     * be delivered, and belong to a shipping order.
     * Note that the cancelled shipping order items are returned too.
     * This method is equivalent to getShippingOrderItems
     * called with parameter `true`.
     */
    getShippingOrderItems(): Collection<any>;
    /**
     * Returns a collection of the ShippingOrderItems created for this item.
     * ShippingOrder items represent the whole or part of this item which could
     * be delivered, and belong to a shipping order.
     * Depending on the `includeCancelled` parameter the cancelled shipping order
     * items will be returned or not.
     */
    getShippingOrderItems(includeCancelled: boolean): Collection<any>;
    /**
     * Returns a collection of all split OrderItems associated with this item. Inverse relation to getSplitSourceItem.
     * 
     * Split order items are created when
     * 
     * - creating a ShippingOrderItem for a ShippingOrder, see ShippingOrder.createShippingOrderItem
     * - splitting an existing ShippingOrderItem, see ShippingOrderItem.split
     * 
     * with a specified quantity less than the existing quantity of the associated ProductLineItem. In this case the associated ProductLineItem
     * is split by creating a new ProductLineItem and associating a new ShippingOrderItem with this item. The new ShippingOrderItem
     * receives the specified quantity and the quantity of the item is set to the remaining quantity. All split items are associated to their originating item via
     * the "split source item" association.
     */
    getSplitItems(): Collection<any>;
    /**
     * Returns the split source item associated with this item, if existing. Inverse relation to getSplitItems.
     * 
     * A split source item is associated after the successful creation of a split item with a quantity less than the existing quantity of the item to split.
     * For details see getSplitItems.
     */
    getSplitSourceItem(): OrderItem | null;
    /**
     * Gets the order item status.
     * 
     * The possible values are:
     * 
     * - STATUS_NEW
     * - STATUS_OPEN
     * - STATUS_BACKORDER
     * - STATUS_CONFIRMED
     * - STATUS_WAREHOUSE
     * - STATUS_SHIPPED
     * - STATUS_CANCELLED
     */
    getStatus(): EnumValue;
    /**
     * Returns the type of line item with which this instance is associated, one
     * of
     * 
     * - SERVICE (method dw.order.OrderItem.getLineItem returns a
     * dw.order.ShippingLineItem
     * - PRODUCT (method dw.order.OrderItem.getLineItem returns a
     * dw.order.ProductLineItem
     */
    getType(): EnumValue;
    /**
     * Set the status of the order item, use one of the values documented in dw.order.OrderItem.getStatus.
     * 
     * If the order item has a related shipping order item (see getShippingOrderItem) the status of the
     * shipping order item will be adjusted to the same status. Setting the status of an order item might also change
     * the status of the related order. The following rules apply in top-down order:
     * 
     * - all items STATUS_CANCELLED - order status is dw.order.Order.ORDER_STATUS_CANCELLED
     * - at least one item in status STATUS_SHIPPED and all other items are STATUS_CANCELLED order
     * status is dw.order.Order.ORDER_STATUS_COMPLETED
     * - at least one item in status STATUS_CREATED, STATUS_OPEN, STATUS_NEW
     * , STATUS_BACKORDER - order status is dw.order.Order.ORDER_STATUS_OPEN, order confirmation status
     * is dw.order.Order.CONFIRMATION_STATUS_NOTCONFIRMED
     * - other combinations will have only items in STATUS_CONFIRMED, STATUS_CANCELLED and
     * STATUS_SHIPPED - order status is dw.order.Order.ORDER_STATUS_OPEN, order confirmation status is
     * dw.order.Order.CONFIRMATION_STATUS_CONFIRMED
     */
    setStatus(status: string): void;
}

export = OrderItem;
