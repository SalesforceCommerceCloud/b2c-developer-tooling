/**
 * Helper class containing status codes for why a coupon code cannot be added
 * to cart or why a coupon code already in cart is not longer valid for redemption.
 */
declare class CouponStatusCodes {
    /**
     * Coupon is currently applied in basket = Coupon code is valid for redemption and
     * Coupon is assigned to one or multiple applicable promotions.
     */
    static readonly APPLIED: string;
    /**
     * Indicates that another code of the same MultiCode/System coupon has already been added to basket.
     */
    static readonly COUPON_ALREADY_IN_BASKET: string;
    /**
     * Indicates that coupon code has already been added to basket.
     */
    static readonly COUPON_CODE_ALREADY_IN_BASKET: string;
    /**
     * Indicates that code of MultiCode/System coupon has already been redeemed.
     */
    static readonly COUPON_CODE_ALREADY_REDEEMED: string;
    /**
     * Indicates that coupon not found for given coupon code or that the code itself was not found.
     */
    static readonly COUPON_CODE_UNKNOWN: string;
    /**
     * Indicates that coupon is not enabled.
     */
    static readonly COUPON_DISABLED: string;
    /**
     * Indicates that No. of redemptions per code & customer exceeded.
     */
    static readonly CUSTOMER_REDEMPTION_LIMIT_EXCEEDED: string;
    /**
     * Indicates that coupon is not assigned to an active promotion.
     */
    static readonly NO_ACTIVE_PROMOTION: string;
    /**
     * Coupon is assigned to one or multiple active promotions, but none of these promotions is currently applicable.
     */
    static readonly NO_APPLICABLE_PROMOTION: string;
    /**
     * Indicates that no. of redemptions per code exceeded.
     * Usually happens for single code coupons
     */
    static readonly REDEMPTION_LIMIT_EXCEEDED: string;
    /**
     * Indicates that No. of redemptions per code,customer & time exceeded.
     */
    static readonly TIMEFRAME_REDEMPTION_LIMIT_EXCEEDED: string;
    private constructor();
}

export = CouponStatusCodes;
