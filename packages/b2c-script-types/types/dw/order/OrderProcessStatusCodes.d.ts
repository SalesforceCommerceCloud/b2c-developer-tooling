/**
 * Contains constants representing different status codes
 * for interacting with an order, such as cancelling
 * or editing an order.
 */
declare class OrderProcessStatusCodes {
    /**
     * Indicates that a coupon in the order is not valid.
     */
    static readonly COUPON_INVALID = "COUPON_INVALID";
    /**
     * Indicates that no inventory could be reserved for the order.
     */
    static readonly INVENTORY_RESERVATION_FAILED = "INVENTORY_RESERVATION_FAILED";
    /**
     * Indicates that the order could not be used because
     * it has already been cancelled.
     */
    static readonly ORDER_ALREADY_CANCELLED = "ORDER_CANCELLED";
    /**
     * Indicates that the order could not be used because it
     * has already been exported.
     */
    static readonly ORDER_ALREADY_EXPORTED = "ORDER_EXPORTED";
    /**
     * Indicates that the order could not be used because
     * it has already been failed.
     */
    static readonly ORDER_ALREADY_FAILED = "ORDER_FAILED";
    /**
     * Indicates that the order could not be used because
     * it has already been replaced.
     */
    static readonly ORDER_ALREADY_REPLACED = "ORDER_REPLACED";
    /**
     * Indicates that the order could not be used because it
     * contains gift certificates.
     */
    static readonly ORDER_CONTAINS_GC = "CANCEL_ORDER_GC";
    /**
     * Indicates that the order could not be used because
     * it is not cancelled.
     */
    static readonly ORDER_NOT_CANCELLED = "ORDER_NOT_CANCELLED";
    /**
     * Indicates that the order could not be used because
     * it has not been failed.
     */
    static readonly ORDER_NOT_FAILED = "ORDER_NOT_FAILED";
    /**
     * Indicates that the order could not be used because
     * it has not been placed.
     */
    static readonly ORDER_NOT_PLACED = "ORDER_NOT_PLACED";
    private constructor();
}

export = OrderProcessStatusCodes;
