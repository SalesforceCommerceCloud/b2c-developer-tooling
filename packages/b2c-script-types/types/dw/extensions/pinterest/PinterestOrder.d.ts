/**
 * An order that was placed through Pinterest.
 */
declare class PinterestOrder {
    /**
     * Indicates that payment has not been made.
     */
    static readonly PAYMENT_STATUS_NOT_PAID: string;
    /**
     * Indicates that payment is complete.
     */
    static readonly PAYMENT_STATUS_PAID: string;
    /**
     * Indicates that payment is incomplete.
     */
    static readonly PAYMENT_STATUS_PART_PAID: string;
    /**
     * Indicates an order on backorder.
     */
    static readonly STATUS_BACKORDER: string;
    /**
     * Indicates an order that has been canceled.
     */
    static readonly STATUS_CANCELLED: string;
    /**
     * Indicates an order that has been delivered.
     */
    static readonly STATUS_DELIVERED: string;
    /**
     * Indicates an order in progress.
     */
    static readonly STATUS_IN_PROGRESS: string;
    /**
     * Indicates a new order.
     */
    static readonly STATUS_NEW: string;
    /**
     * Indicates an order that has been returned.
     */
    static readonly STATUS_RETURNED: string;
    /**
     * Indicates an order that has shipped.
     */
    static readonly STATUS_SHIPPED: string;
    /**
     * Returns the item ID for this Pinterest order.
     */
    itemId: string;
    /**
     * Returns the order number for this Pinterest order. This is the same as the order number of the Demandware order.
     */
    readonly orderNo: string;
    /**
     * Returns the status of this Pinterest order. Possible values are
     * dw.extensions.pinterest.PinterestOrder.PAYMENT_STATUS_PAID,
     * dw.extensions.pinterest.PinterestOrder.PAYMENT_STATUS_NOT_PAID,
     * or dw.extensions.pinterest.PinterestOrder.PAYMENT_STATUS_PART_PAID.
     */
    paymentStatus: string;
    /**
     * Returns the status of this Pinterest order. Possible values are
     * dw.extensions.pinterest.PinterestOrder.STATUS_NEW,
     * dw.extensions.pinterest.PinterestOrder.STATUS_IN_PROGRESS,
     * dw.extensions.pinterest.PinterestOrder.STATUS_SHIPPED,
     * dw.extensions.pinterest.PinterestOrder.STATUS_BACKORDER,
     * dw.extensions.pinterest.PinterestOrder.STATUS_CANCELLED,
     * dw.extensions.pinterest.PinterestOrder.STATUS_DELIVERED,
     * or dw.extensions.pinterest.PinterestOrder.STATUS_RETURNED.
     */
    status: string;
    private constructor();
    /**
     * Returns the item ID for this Pinterest order.
     */
    getItemId(): string;
    /**
     * Returns the order number for this Pinterest order. This is the same as the order number of the Demandware order.
     */
    getOrderNo(): string;
    /**
     * Returns the status of this Pinterest order. Possible values are
     * dw.extensions.pinterest.PinterestOrder.PAYMENT_STATUS_PAID,
     * dw.extensions.pinterest.PinterestOrder.PAYMENT_STATUS_NOT_PAID,
     * or dw.extensions.pinterest.PinterestOrder.PAYMENT_STATUS_PART_PAID.
     */
    getPaymentStatus(): string;
    /**
     * Returns the status of this Pinterest order. Possible values are
     * dw.extensions.pinterest.PinterestOrder.STATUS_NEW,
     * dw.extensions.pinterest.PinterestOrder.STATUS_IN_PROGRESS,
     * dw.extensions.pinterest.PinterestOrder.STATUS_SHIPPED,
     * dw.extensions.pinterest.PinterestOrder.STATUS_BACKORDER,
     * dw.extensions.pinterest.PinterestOrder.STATUS_CANCELLED,
     * dw.extensions.pinterest.PinterestOrder.STATUS_DELIVERED,
     * or dw.extensions.pinterest.PinterestOrder.STATUS_RETURNED.
     */
    getStatus(): string;
    /**
     * Sets the item ID for this Pinterest order.
     */
    setItemId(itemId: string): void;
    /**
     * Sets the status of this Pinterest order. Possible values are
     * dw.extensions.pinterest.PinterestOrder.PAYMENT_STATUS_PAID,
     * dw.extensions.pinterest.PinterestOrder.PAYMENT_STATUS_NOT_PAID,
     * or dw.extensions.pinterest.PinterestOrder.PAYMENT_STATUS_PART_PAID.
     */
    setPaymentStatus(status: string): void;
    /**
     * Sets the status of this Pinterest order. Possible values are
     * dw.extensions.pinterest.PinterestOrder.STATUS_NEW,
     * dw.extensions.pinterest.PinterestOrder.STATUS_IN_PROGRESS,
     * dw.extensions.pinterest.PinterestOrder.STATUS_SHIPPED,
     * dw.extensions.pinterest.PinterestOrder.STATUS_BACKORDER,
     * dw.extensions.pinterest.PinterestOrder.STATUS_CANCELLED,
     * dw.extensions.pinterest.PinterestOrder.STATUS_DELIVERED,
     * or dw.extensions.pinterest.PinterestOrder.STATUS_RETURNED.
     */
    setStatus(status: string): void;
}

export = PinterestOrder;
