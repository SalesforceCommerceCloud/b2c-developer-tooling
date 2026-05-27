import ProductSearchHit = require('../catalog/ProductSearchHit');

/**
 * This class represents a suggested product.
 * Use getProductSearchHit method to get access to the actual dw.catalog.ProductSearchHit object.
 */
declare class SuggestedProduct {
    /**
     * This method returns the actual dw.catalog.ProductSearchHit object
     * corresponding to this suggested product.
     */
    readonly productSearchHit: ProductSearchHit;
    private constructor();
    /**
     * This method returns the actual dw.catalog.ProductSearchHit object
     * corresponding to this suggested product.
     */
    getProductSearchHit(): ProductSearchHit;
}

export = SuggestedProduct;
