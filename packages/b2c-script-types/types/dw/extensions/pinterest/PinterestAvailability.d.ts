/**
 * Represents a row in the Pinterest availability feed export file.
 */
declare class PinterestAvailability {
    /**
     * Returns the ID of the Pinterest product. This is the same as the ID of the Demandware product.
     */
    readonly ID: string;
    /**
     * Returns the availability of the Pinterest product. Possible values are
     * dw.extensions.pinterest.PinterestProduct.AVAILABILITY_IN_STOCK or
     * dw.extensions.pinterest.PinterestProduct.AVAILABILITY_OUT_OF_STOCK.
     */
    availability: string;
    private constructor();
    /**
     * Returns the availability of the Pinterest product. Possible values are
     * dw.extensions.pinterest.PinterestProduct.AVAILABILITY_IN_STOCK or
     * dw.extensions.pinterest.PinterestProduct.AVAILABILITY_OUT_OF_STOCK.
     */
    getAvailability(): string;
    /**
     * Returns the ID of the Pinterest product. This is the same as the ID of the Demandware product.
     */
    getID(): string;
    /**
     * Sets the availability of the Pinterest product. Possible values are
     * dw.extensions.pinterest.PinterestProduct.AVAILABILITY_IN_STOCK or
     * dw.extensions.pinterest.PinterestProduct.AVAILABILITY_OUT_OF_STOCK.
     */
    setAvailability(availability: string): void;
}

export = PinterestAvailability;
