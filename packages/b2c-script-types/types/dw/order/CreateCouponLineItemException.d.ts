/**
 * This exception could be thrown by LineItemCtnr.createCouponLineItem
 * when the provided coupon code is invalid.
 * 
 * 'errorCode' property is set to one of the following values:
 * 
 * - dw.campaign.CouponStatusCodes.COUPON_CODE_ALREADY_IN_BASKET = Indicates that coupon code has already been added to basket.
 * - dw.campaign.CouponStatusCodes.COUPON_ALREADY_IN_BASKET = Indicates that another code of the same MultiCode/System coupon has already been added to basket.
 * - dw.campaign.CouponStatusCodes.COUPON_CODE_ALREADY_REDEEMED = Indicates that code of MultiCode/System coupon has already been redeemed.
 * - dw.campaign.CouponStatusCodes.COUPON_CODE_UNKNOWN = Indicates that coupon not found for given coupon code or that the code itself was not found.
 * - dw.campaign.CouponStatusCodes.COUPON_DISABLED = Indicates that coupon is not enabled.
 * - dw.campaign.CouponStatusCodes.REDEMPTION_LIMIT_EXCEEDED = Indicates that number of redemptions per code exceeded.
 * - dw.campaign.CouponStatusCodes.CUSTOMER_REDEMPTION_LIMIT_EXCEEDED = Indicates that number of redemptions per code and customer exceeded.
 * - dw.campaign.CouponStatusCodes.TIMEFRAME_REDEMPTION_LIMIT_EXCEEDED = Indicates that number of redemptions per code, customer and time exceeded.
 * - dw.campaign.CouponStatusCodes.NO_ACTIVE_PROMOTION = Indicates that coupon is not assigned to an active promotion.
 */
declare class CreateCouponLineItemException {
    /**
     * Returns one of the error codes listed in the class doc.
     */
    readonly errorCode: string;
    private constructor();
    /**
     * Returns one of the error codes listed in the class doc.
     */
    getErrorCode(): string;
}

export = CreateCouponLineItemException;
