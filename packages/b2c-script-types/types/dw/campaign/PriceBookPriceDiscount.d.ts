import Discount = require('./Discount');

/**
 * Discount representing that a product's price has been calculated from a
 * separate sales price book other than the standard price book assigned to the
 * site.
 */
declare class PriceBookPriceDiscount extends Discount {
    /**
     * Returns the price book identifier.
     */
    readonly priceBookID: string;
    private constructor();
    /**
     * Returns the price book identifier.
     */
    getPriceBookID(): string;
}

export = PriceBookPriceDiscount;
