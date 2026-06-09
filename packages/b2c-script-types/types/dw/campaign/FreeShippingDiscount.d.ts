import Discount = require('./Discount');

/**
 * Represents a free shipping discount in the discount plan, for example
 * "Free shipping on all iPods."
 */
declare class FreeShippingDiscount extends Discount {
    private constructor();
}

export = FreeShippingDiscount;
