import Discount = require('./Discount');

/**
 * Represents a free discount in the discount plan, for example
 * "Free shipping on all orders $25 or more."
 */
declare class FreeDiscount extends Discount {
    private constructor();
}

export = FreeDiscount;
