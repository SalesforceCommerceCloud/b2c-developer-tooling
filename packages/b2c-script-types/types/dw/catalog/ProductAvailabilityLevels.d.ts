import Quantity = require('../value/Quantity');

/**
 * Encapsulates the quantity of items available for each availability status.
 */
declare class ProductAvailabilityLevels {
    /**
     * Returns the backorder quantity.
     */
    readonly backorder: Quantity;
    /**
     * Returns the number of attributes that contain non-zero quantities.
     */
    readonly count: number;
    /**
     * Returns the quantity in stock.
     */
    readonly inStock: Quantity;
    /**
     * Returns the quantity that is not available.
     */
    readonly notAvailable: Quantity;
    /**
     * Returns the pre-order quantity.
     */
    readonly preorder: Quantity;
    private constructor();
    /**
     * Returns the backorder quantity.
     */
    getBackorder(): Quantity;
    /**
     * Returns the number of attributes that contain non-zero quantities.
     */
    getCount(): number;
    /**
     * Returns the quantity in stock.
     */
    getInStock(): Quantity;
    /**
     * Returns the quantity that is not available.
     */
    getNotAvailable(): Quantity;
    /**
     * Returns the pre-order quantity.
     */
    getPreorder(): Quantity;
}

export = ProductAvailabilityLevels;
