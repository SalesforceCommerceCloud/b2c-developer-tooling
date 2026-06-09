import Discount = require('./Discount');

/**
 * Represents a percentage-off discount in the discount plan, for example
 * "10% off all T-Shirts".
 */
declare class PercentageDiscount extends Discount {
    /**
     * Returns the percentage discount value, for example 10.00 for a "10% off"
     * discount.
     */
    readonly percentage: number;
    /**
     * Create a percentage-discount on the fly. Can be used to create a custom price adjustment.
     */
    constructor(percentage: number);
    /**
     * Returns the percentage discount value, for example 10.00 for a "10% off"
     * discount.
     */
    getPercentage(): number;
}

export = PercentageDiscount;
