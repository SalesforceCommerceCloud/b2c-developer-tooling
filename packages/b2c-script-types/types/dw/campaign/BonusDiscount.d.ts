import Discount = require('./Discount');
import Collection = require('../util/Collection');
import Product = require('../catalog/Product');

/**
 * Represents a bonus discount in the discount plan, for example
 * "Get a free DVD with your purchase of any DVD player."
 */
declare class BonusDiscount extends Discount {
    /**
     * Returns the bonus products associated with this discount that are in
     * stock, online and assigned to site catalog.
     */
    readonly bonusProducts: Collection<Product<any>>;
    private constructor();
    /**
     * Returns the bonus products associated with this discount that are in
     * stock, online and assigned to site catalog.
     */
    getBonusProducts(): Collection<Product<any>>;
}

export = BonusDiscount;
