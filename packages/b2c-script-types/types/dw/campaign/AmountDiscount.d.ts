import Discount = require('./Discount');

/**
 * Represents an amount-off discount in the discount plan, for example
 * "$10 off all orders $100 or more".
 */
declare class AmountDiscount extends Discount {
    /**
     * Returns the discount amount, for example 10.00 for a "$10 off" discount.
     */
    readonly amount: number;
    /**
     * Create an amount-discount on the fly. Can be used to create a custom price adjustment.
     */
    constructor(amount: number);
    /**
     * Returns the discount amount, for example 10.00 for a "$10 off" discount.
     */
    getAmount(): number;
}

export = AmountDiscount;
