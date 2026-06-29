import AbstractItem = require('./AbstractItem');
import EnumValue = require('../value/EnumValue');
import Quantity = require('../value/Quantity');
import TrackingRef = require('./TrackingRef');
import FilteringCollection = require('../util/FilteringCollection');
import Money = require('../value/Money');
import Decimal = require('../util/Decimal');

/**
 * One or more ShippingOrderItems are contained in a
 * dw.order.ShippingOrder, created using
 * dw.order.ShippingOrder.createShippingOrderItem
 * and can be retrieved by
 * dw.order.ShippingOrder.getItems. A
 * ShippingOrderItem references a single
 * dw.order.OrderItem which in turn references a
 * dw.order.LineItem associated with an dw.order.Order.
 * 
 * Order post-processing APIs (gillian) are now inactive by default and will throw
 * an exception if accessed. Activation needs preliminary approval by Product Management.
 * Please contact support in this case. Existing customers using these APIs are not
 * affected by this change and can use the APIs until further notice.
 */
declare class ShippingOrderItem extends AbstractItem {
    /**
     * Constant for Order Item Status CANCELLED
     */
    static readonly STATUS_CANCELLED: string;
    /**
     * Constant for Order Item Status CONFIRMED
     */
    static readonly STATUS_CONFIRMED: string;
    /**
     * Constant for Order Item Status SHIPPED
     */
    static readonly STATUS_SHIPPED: string;
    /**
     * Constant for Order Item Status WAREHOUSE
     */
    static readonly STATUS_WAREHOUSE: string;
    /**
     * Price of a single unit before discount application.
     */
    readonly basePrice: Money;
    /**
     * Returns null or the parent item.
     */
    parentItem: ShippingOrderItem | null;
    /**
     * The quantity of the shipping order item.
     * 
     * The dw.value.Quantity is equal to the related line item quantity.
     */
    readonly quantity: Quantity;
    /**
     * The mandatory shipping order number of the related
     * dw.order.ShippingOrder.
     */
    readonly shippingOrderNumber: string;
    /**
     * Gets the order item status.
     * 
     * The possible values are STATUS_CONFIRMED,
     * STATUS_WAREHOUSE, STATUS_SHIPPED,
     * STATUS_CANCELLED.
     */
    status: EnumValue;
    /**
     * Gets the tracking refs (tracking infos) the shipping order item is
     * assigned to.
     * @see dw.order.TrackingRef
     */
    readonly trackingRefs: FilteringCollection<TrackingRef>;
    private constructor();
    /**
     * A shipping order item can be assigned
     * to one or many dw.order.TrackingInfo tracking infos with
     * different quantities. For example an item with quantity 3 may have been
     * shipped in 2 packages, each represented by its own
     * tracking info - 2
     * dw.order.TrackingRefs would exist with quantities 1 and 2.
     * 
     * This method creates and adds a new tracking
     * reference to this shipping order item for a given
     * tracking info and quantity. The new
     * instance is returned.
     * @see dw.order.TrackingRef
     */
    addTrackingRef(trackingInfoID: string, quantity: Quantity): TrackingRef;
    /**
     * Apply a rate of (factor / divisor) to the prices in this item, with the option to half round up or half round down to the
     * nearest cent if necessary.
     * 
     * Examples:
     * 
     * TaxBasis before  factor  divisor  roundup  Calculation  TaxBasis after
     * $10.00  1  2  true  10*1/2=  $5.00
     * $10.00  9  10  true  10*9/10=  $9.00
     * $10.00  1  3  true  10*1/3=3.3333=  $3.33
     * $2.47  1  2  true  2.47*1/2=1.235=  $1.24
     * $2.47  1  2  false  2.47*1/2=1.235=  $1.23
     * 
     * Which prices are updated?:
     * 
     * The rate described above is applied to tax-basis and tax then the net-price and gross-price are recalculated by adding / subtracting
     * depending on whether the order is based on net price.
     * 
     * Example (order based on net price)
     * 
     * New TaxBasis:$10.00, Tax:$1.00, NetPrice=TaxBasis=$10.00, GrossPrice=TaxBasis+Tax=$11.00
     * 
     * Example (order based on gross price)
     * 
     * New TaxBasis:$10.00, Tax:$1.00, NetPrice=TaxBasis-tax=$9.00, GrossPrice=TaxBasis=$10.00
     * @see dw.order.AbstractItem.getTaxBasis
     * @see dw.order.AbstractItem.getTax
     * @see dw.order.AbstractItem.getNetPrice
     * @see dw.order.AbstractItem.getGrossPrice
     * @see dw.order.TaxMgr.getTaxationPolicy
     */
    applyPriceRate(factor: Decimal, divisor: Decimal, roundUp: boolean): void;
    /**
     * Price of a single unit before discount application.
     */
    getBasePrice(): Money;
    /**
     * Returns null or the parent item.
     */
    getParentItem(): ShippingOrderItem | null;
    /**
     * The quantity of the shipping order item.
     * 
     * The dw.value.Quantity is equal to the related line item quantity.
     */
    getQuantity(): Quantity;
    /**
     * The mandatory shipping order number of the related
     * dw.order.ShippingOrder.
     */
    getShippingOrderNumber(): string;
    /**
     * Gets the order item status.
     * 
     * The possible values are STATUS_CONFIRMED,
     * STATUS_WAREHOUSE, STATUS_SHIPPED,
     * STATUS_CANCELLED.
     */
    getStatus(): EnumValue;
    /**
     * Gets the tracking refs (tracking infos) the shipping order item is
     * assigned to.
     * @see dw.order.TrackingRef
     */
    getTrackingRefs(): FilteringCollection<TrackingRef>;
    /**
     * Set a parent item. The parent item must belong to the same
     * dw.order.ShippingOrder. An infinite parent-child loop is disallowed
     * as is a parent-child depth greater than 10. Setting a parent item
     * indicates a dependency of the child item on the parent item, and can be
     * used to form a parallel structure to that accessed using
     * dw.order.ProductLineItem.getParent.
     */
    setParentItem(parentItem: ShippingOrderItem): void;
    /**
     * Sets the status. See dw.order.ShippingOrder for details of
     * shipping order status transitions. Do not use this method to set a
     * shipping order to status WAREHOUSE, instead use
     * dw.order.ShippingOrder.setStatusWarehouse
     * 
     * This also triggers the setting of the status of the
     * dw.order.LineItem when appropriate. Setting this status can also have an impact on
     * the order status, accessed using dw.order.Order.getStatus and the
     * shipping order status, accessed using dw.order.ShippingOrder.getStatus.
     * @throws NullPointerException if status is  null
     * @throws IllegalArgumentException if the status transition to the status is not allowed
     */
    setStatus(status: string): void;
    /**
     * Split the shipping order item.
     * 
     * This will also lead to a split of the related dw.order.LineItem.
     * Split means that for the passed quantity a new item is created with this
     * quantity as an exact copy of this item. The remaining amount will stay in
     * this item.
     * 
     * If quantity is equal to getQuantity no split is done and this
     * item is returned itself.
     * 
     * This method is equivalent to split called
     * with `splitOrderItem` equals to `true`.
     * @throws IllegalArgumentException if quantity is greater than  getQuantity
     */
    split(quantity: Quantity): ShippingOrderItem;
    /**
     * Split the shipping order item.
     * 
     * This will also lead to a split of the related dw.order.LineItem
     * when `splitOrderItem` is `true`.
     * Split means that for the passed quantity a new item is created with this
     * quantity as an exact copy of this item. The remaining amount will stay in
     * this item.
     * 
     * If quantity is equal to getQuantity no split is done and this
     * item is returned itself.
     * @throws IllegalArgumentException if quantity is greater than  getQuantity
     */
    split(quantity: Quantity, splitOrderItem: boolean): ShippingOrderItem;
}

export = ShippingOrderItem;
