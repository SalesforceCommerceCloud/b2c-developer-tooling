import PersistentObject = require('../object/PersistentObject');
import Collection = require('../util/Collection');
import Promotion = require('./Promotion');

/**
 * Represents a coupon in Commerce Cloud Digital.
 */
declare class Coupon extends PersistentObject {
    /**
     * Constant representing coupon type multiple-codes.
     */
    static readonly TYPE_MULTIPLE_CODES: string;
    /**
     * Constant representing coupon type single-code.
     */
    static readonly TYPE_SINGLE_CODE: string;
    /**
     * Constant representing coupon type system-codes.
     */
    static readonly TYPE_SYSTEM_CODES: string;
    /**
     * Returns the ID of the coupon.
     */
    readonly ID: string;
    /**
     * Returns the prefix defined for coupons of type TYPE_SYSTEM_CODES
     * If no prefix is defined, or coupon is of type TYPE_SINGLE_CODE
     * or TYPE_MULTIPLE_CODES, null is returned.
     */
    readonly codePrefix: string | null;
    /**
     * Returns true if coupon is enabled, else false.
     */
    readonly enabled: boolean;
    /**
     * Returns the next unissued code of this coupon.
     * For single-code coupons, the single fixed coupon code is returned.
     * For all multi-code coupons, the next available, unissued coupon code is returned.
     * If all codes of the coupon have been issued, then there is no next code, and null is returned.
     * 
     * A transaction is required when calling this method. This needs to be ensured by the calling script.
     */
    readonly nextCouponCode: string | null;
    /**
     * Returns the coupon-based promotions directly or indirectly (through
     * campaigns) assigned to this coupon.
     */
    readonly promotions: Collection<Promotion>;
    /**
     * Returns the defined limit on redemption per coupon code. Null is
     * returned if no limit is defined, which means that each code can be
     * redeemed an unlimited number of times.
     */
    readonly redemptionLimitPerCode: number;
    /**
     * Returns the defined limit on redemption of this coupon per customer.
     * Null is returned if no limit is defined, which means that customers can
     * redeem this coupon an unlimited number of times.
     */
    readonly redemptionLimitPerCustomer: number;
    /**
     * Returns the defined limit on redemption per customer per time-frame (see
     * getRedemptionLimitTimeFrame. Null is returned if no limit is
     * defined, which means that there is no time-specific redemption limit for
     * customers.
     * @see getRedemptionLimitTimeFrame
     */
    readonly redemptionLimitPerTimeFrame: number;
    /**
     * Returns the time-frame (in days) of the defined limit on redemption per
     * customer per time-frame. Null is returned if no limit is defined, which
     * means that there is no time-specific redemption limit for customers.
     * @see getRedemptionLimitPerTimeFrame
     */
    readonly redemptionLimitTimeFrame: number;
    /**
     * Returns the coupon type.
     * Possible values are TYPE_SINGLE_CODE, TYPE_MULTIPLE_CODES
     * and TYPE_SYSTEM_CODES.
     */
    readonly type: string;
    private constructor();
    /**
     * Returns the prefix defined for coupons of type TYPE_SYSTEM_CODES
     * If no prefix is defined, or coupon is of type TYPE_SINGLE_CODE
     * or TYPE_MULTIPLE_CODES, null is returned.
     */
    getCodePrefix(): string | null;
    /**
     * Returns the ID of the coupon.
     */
    getID(): string;
    /**
     * Returns the next unissued code of this coupon.
     * For single-code coupons, the single fixed coupon code is returned.
     * For all multi-code coupons, the next available, unissued coupon code is returned.
     * If all codes of the coupon have been issued, then there is no next code, and null is returned.
     * 
     * A transaction is required when calling this method. This needs to be ensured by the calling script.
     */
    getNextCouponCode(): string | null;
    /**
     * Returns the coupon-based promotions directly or indirectly (through
     * campaigns) assigned to this coupon.
     */
    getPromotions(): Collection<Promotion>;
    /**
     * Returns the defined limit on redemption per coupon code. Null is
     * returned if no limit is defined, which means that each code can be
     * redeemed an unlimited number of times.
     */
    getRedemptionLimitPerCode(): number;
    /**
     * Returns the defined limit on redemption of this coupon per customer.
     * Null is returned if no limit is defined, which means that customers can
     * redeem this coupon an unlimited number of times.
     */
    getRedemptionLimitPerCustomer(): number;
    /**
     * Returns the defined limit on redemption per customer per time-frame (see
     * getRedemptionLimitTimeFrame. Null is returned if no limit is
     * defined, which means that there is no time-specific redemption limit for
     * customers.
     * @see getRedemptionLimitTimeFrame
     */
    getRedemptionLimitPerTimeFrame(): number;
    /**
     * Returns the time-frame (in days) of the defined limit on redemption per
     * customer per time-frame. Null is returned if no limit is defined, which
     * means that there is no time-specific redemption limit for customers.
     * @see getRedemptionLimitPerTimeFrame
     */
    getRedemptionLimitTimeFrame(): number;
    /**
     * Returns the coupon type.
     * Possible values are TYPE_SINGLE_CODE, TYPE_MULTIPLE_CODES
     * and TYPE_SYSTEM_CODES.
     */
    getType(): string;
    /**
     * Returns true if coupon is enabled, else false.
     */
    isEnabled(): boolean;
}

export = Coupon;
