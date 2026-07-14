import Product = require('./Product');
import SeekableIterator = require('../util/SeekableIterator');
import Catalog = require('./Catalog');

/**
 * Provides helper methods for getting products based on Product ID or dw.catalog.Catalog.
 */
declare class ProductMgr {
    private constructor();
    /**
     * Returns the product with the specified id.
     */
    static getProduct(productID: string): Product<any> | null;
    /**
     * Returns all products assigned to the current site.
     * 
     * A product is assigned to a site if
     * 
     * - it is assigned to at least one category of the site catalog or
     * - it is a variant and it's master product is assigned to the current site
     * 
     * It is strongly recommended to call `close()` on the returned SeekableIterator
     * if not all of its elements are being retrieved. This will ensure the proper cleanup of system resources.
     * @see dw.util.SeekableIterator.close
     */
    static queryAllSiteProducts(): SeekableIterator<Product<any>>;
    /**
     * Returns all products assigned to the current site.
     * 
     * Works like queryAllSiteProducts(), but additionally sorts the result set
     * by product ID.
     * 
     * It is strongly recommended to call `close()` on the returned SeekableIterator
     * if not all of its elements are being retrieved. This will ensure the proper cleanup of system resources.
     * @see dw.util.SeekableIterator.close
     */
    static queryAllSiteProductsSorted(): SeekableIterator<Product<any>>;
    /**
     * Returns all products assigned to the the specified catalog, where
     * assignment has the same meaning as it does for queryAllSiteProducts().
     * 
     * It is strongly recommended to call `close()` on the returned SeekableIterator
     * if not all of its elements are being retrieved. This will ensure the proper cleanup of system resources.
     * @see dw.util.SeekableIterator.close
     */
    static queryProductsInCatalog(catalog: Catalog): SeekableIterator<Product<any>>;
    /**
     * Returns all products assigned to the the specified catalog.
     * Works like queryProductsInCatalog(), but additionally sorts the result
     * set by product ID.
     * 
     * It is strongly recommended to call `close()` on the returned SeekableIterator
     * if not all of its elements are being retrieved. This will ensure the proper cleanup of system resources.
     * @see dw.util.SeekableIterator.close
     */
    static queryProductsInCatalogSorted(catalog: Catalog): SeekableIterator<Product<any>>;
}

export = ProductMgr;
