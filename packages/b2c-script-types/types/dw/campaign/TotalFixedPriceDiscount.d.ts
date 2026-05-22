import Discount = require('./Discount');

/**
 * Represents a total fix price discount on a group of products in the
 * discount plan.  For example:  "buy 3 products of type X for a total price
 * of $29.99".
 */
declare class TotalFixedPriceDiscount extends Discount {
    /**
     * Returns the total fixed price amount.
     */
    readonly totalFixedPrice: number;
    private constructor();
    /**
     * Returns the total fixed price amount.
     */
    getTotalFixedPrice(): number;
}

export = TotalFixedPriceDiscount;
