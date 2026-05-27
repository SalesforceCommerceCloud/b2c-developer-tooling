import Money = require('../value/Money');
import Quantity = require('../value/Quantity');
import PriceBook = require('./PriceBook');
import Collection = require('../util/Collection');

/**
 * A ProductPriceTable is a map of quantities to prices representing the
 * potentially tiered prices of a product in Commerce Cloud Digital. The price
 * of a product is the price associated with the largest quantity in
 * the ProductPriceTable which does not exceed the purchase quantity.
 */
declare class ProductPriceTable {
    /**
     * Returns all quantities stored in the price table.
     */
    readonly quantities: Collection<Quantity>;
    private constructor();
    /**
     * Returns the quantity following the passed quantity in the price table.
     * If the passed quantity is the last entry in the price table, null is
     * returned.
     */
    getNextQuantity(quantity: Quantity): Quantity | null;
    /**
     * Returns the percentage off value of the price related to the passed quantity,
     * calculated based on the price of the products minimum order quantity.
     */
    getPercentage(quantity: Quantity): number;
    /**
     * Returns the monetary price for the passed order quantity. If
     * no price is defined for the passed quantity, null is returned. This
     * can happen if for example no price is defined for a single item.
     */
    getPrice(quantity: Quantity): Money | null;
    /**
     * Returns the price book which defined the monetary price for the passed
     * order quantity. If no price is defined for the passed quantity, null is
     * returned. This can happen if for example no price is defined for a single
     * item.
     */
    getPriceBook(quantity: Quantity): PriceBook | null;
    /**
     * Returns all quantities stored in the price table.
     */
    getQuantities(): Collection<Quantity>;
}

export = ProductPriceTable;
