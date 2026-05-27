import Discount = require('./Discount');

/**
 * Represents a fixed price shipping discount in the discount plan, for
 * example "Shipping only 0.99 for iPods."
 */
declare class FixedPriceShippingDiscount extends Discount {
    /**
     * Returns the fixed price amount, for example 0.99 for a "Shipping only $0.99"
     * discount.
     */
    readonly fixedPrice: number;
    /**
     * Create a fixed-price-shipping-discount on the fly. Can be used to create a custom price adjustment.
     */
    constructor(amount: number);
    /**
     * Returns the fixed price amount, for example 0.99 for a "Shipping only $0.99"
     * discount.
     */
    getFixedPrice(): number;
}

export = FixedPriceShippingDiscount;
