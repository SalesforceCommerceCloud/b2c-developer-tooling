/**
 * Represents a redeemed coupon.
 */
declare class CouponRedemption {
    /**
     * Returns email of redeeming customer.
     */
    readonly customerEmail: string;
    /**
     * Returns number of the order the code was redeemed with.
     */
    readonly orderNo: string;
    /**
     * Returns date of redemption.
     */
    readonly redemptionDate: Date;
    private constructor();
    /**
     * Returns email of redeeming customer.
     */
    getCustomerEmail(): string;
    /**
     * Returns number of the order the code was redeemed with.
     */
    getOrderNo(): string;
    /**
     * Returns date of redemption.
     */
    getRedemptionDate(): Date;
}

export = CouponRedemption;
