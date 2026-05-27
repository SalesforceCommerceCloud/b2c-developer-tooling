/**
 * Deprecated. Formerly used to contain the various statuses that a coupon may
 * be in.
 * @deprecated Use dw.campaign.CouponStatusCodes instead.
 */
declare class CampaignStatusCodes {
    /**
     * Indicates that the coupon has already been applied to the basket.
     * @deprecated Use dw.campaign.CouponStatusCodes.COUPON_CODE_ALREADY_IN_BASKET,
     * dw.campaign.CouponStatusCodes.COUPON_ALREADY_IN_BASKET instead.
     */
    static readonly COUPON_ALREADY_APPLIED = "COUPON_ALREADY_APPLIED";
    /**
     * Indicates that the coupon has already been redeemed.
     * @deprecated Use dw.campaign.CouponStatusCodes.COUPON_CODE_ALREADY_REDEEMED instead.
     */
    static readonly COUPON_ALREADY_REDEEMED = "COUPON_ALREADY_REDEEMED";
    /**
     * Indicates that the coupon is not currently redeemable.
     * @deprecated Use dw.campaign.CouponStatusCodes.COUPON_DISABLED,
     * dw.campaign.CouponStatusCodes.COUPON_CODE_UNKNOWN,
     * dw.campaign.CouponStatusCodes.REDEMPTION_LIMIT_EXCEEDED,
     * dw.campaign.CouponStatusCodes.CUSTOMER_REDEMPTION_LIMIT_EXCEEDED,
     * dw.campaign.CouponStatusCodes.TIMEFRAME_REDEMPTION_LIMIT_EXCEEDED or
     * dw.campaign.CouponStatusCodes.NO_APPLICABLE_PROMOTION
     */
    static readonly COUPON_NOT_REDEEMABLE = "COUPON_NOT_REDEEMABLE";
    /**
     * Indicates that the coupon code is not valid.
     * @deprecated Use dw.campaign.CouponStatusCodes.COUPON_CODE_UNKNOWN instead
     */
    static readonly COUPON_UNKNOWN = "COUPON_UNKNOWN";
    private constructor();
}

export = CampaignStatusCodes;
