import Money = require('../value/Money');
import PriceBook = require('./PriceBook');

/**
 * Simple class representing a product price point.  This class is useful
 * because it provides additional information beyond just the price.  Since the
 * system calculates sales prices based on applicable price books, it is
 * sometimes useful to know additional information such as which price book
 * defined a price point, what percentage discount off the base price
 * this value represents, and the date range for which this price point is active.
 */
declare class ProductPriceInfo {
    /**
     * Returns the date from which the associated price point is valid. If such a date doesn't exist, e.g. as in the
     * case of a continuous price point, null will be returned.
     */
    readonly onlineFrom: Date | null;
    /**
     * Returns the date until which the associated price point is valid. If such a date doesn't exist, e.g. as in the case
     * of a continuous price point, null will be returned.
     */
    readonly onlineTo: Date | null;
    /**
     * Returns the percentage off value of this price point related to the base
     * price for the product's minimum order quantity.
     */
    readonly percentage: number;
    /**
     * Returns the monetary price for this price point.
     */
    readonly price: Money;
    /**
     * Returns the price book which defined this price point.
     */
    readonly priceBook: PriceBook;
    /**
     * Returns the price info associated with this price point. This is an
     * arbitrary string which a merchant can associate with a price entry. This
     * can be used for example, to track which back-end system the price is
     * derived from.
     */
    readonly priceInfo: string;
    private constructor();
    /**
     * Returns the date from which the associated price point is valid. If such a date doesn't exist, e.g. as in the
     * case of a continuous price point, null will be returned.
     */
    getOnlineFrom(): Date | null;
    /**
     * Returns the date until which the associated price point is valid. If such a date doesn't exist, e.g. as in the case
     * of a continuous price point, null will be returned.
     */
    getOnlineTo(): Date | null;
    /**
     * Returns the percentage off value of this price point related to the base
     * price for the product's minimum order quantity.
     */
    getPercentage(): number;
    /**
     * Returns the monetary price for this price point.
     */
    getPrice(): Money;
    /**
     * Returns the price book which defined this price point.
     */
    getPriceBook(): PriceBook;
    /**
     * Returns the price info associated with this price point. This is an
     * arbitrary string which a merchant can associate with a price entry. This
     * can be used for example, to track which back-end system the price is
     * derived from.
     */
    getPriceInfo(): string;
}

export = ProductPriceInfo;
