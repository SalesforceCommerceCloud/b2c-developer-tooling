import Discount = require('./Discount');

/**
 * Represents a percentage-off options discount in the discount plan, for
 * example "50% off monogramming on shirts".
 */
declare class PercentageOptionDiscount extends Discount {
    /**
     * Returns the percentage discount value, for example 10.00 for a "10% off"
     * discount.
     */
    readonly percentage: number;
    private constructor();
    /**
     * Returns the percentage discount value, for example 10.00 for a "10% off"
     * discount.
     */
    getPercentage(): number;
}

export = PercentageOptionDiscount;
