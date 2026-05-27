import Coupon = require('./Coupon');
import Collection = require('../util/Collection');
import CouponRedemption = require('./CouponRedemption');
import Status = require('../system/Status');

/**
 * Manager to access coupons.
 */
declare class CouponMgr {
    /**
     * Indicates that an error occurred because a valid data domain cannot be found for given siteID.
     */
    static readonly MR_ERROR_INVALID_SITE_ID = "MASKREDEMPTIONS_SITE_NOT_FOUND";
    /**
     * Returns all coupons in the current site in no specific order.
     */
    static readonly coupons: Collection<Coupon>;
    private constructor();
    /**
     * Returns the coupon with the specified ID.
     */
    static getCoupon(couponID: string): Coupon | null;
    /**
     * Tries to find a coupon for the given coupon code. The method first
     * searches for a coupon with a fixed code matching the passed value. If no
     * such fixed coupon is found, it searches for a coupon with a
     * system-generated code matching the passed value. If found, the coupon is
     * returned. Otherwise, the method returns null.
     */
    static getCouponByCode(couponCode: string): Coupon | null;
    /**
     * Returns all coupons in the current site in no specific order.
     */
    static getCoupons(): Collection<Coupon>;
    /**
     * Returns list of CouponRedemptions for the specified coupon and coupon code,
     * sorted by redemption date descending (i.e. last redemption first).
     * Usually, there should only either be 0 or 1 redemption. But if a coupon and code
     * is removed and recreated and re-issued later, there might be multiple such redemption records.
     * Returns an empty list if no redemption record exists in system for the specified coupon and code.
     */
    static getRedemptions(couponID: string, couponCode: string): Collection<CouponRedemption>;
    /**
     * Mask customer email address in coupon redemptions for the given siteID and email address
     */
    static maskRedemptions(siteID: string, email: string): Status;
}

export = CouponMgr;
