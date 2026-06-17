import Product = require('./Product');
import List = require('../util/List');
import Money = require('../value/Money');
import ObjectAttributeValueDefinition = require('../object/ObjectAttributeValueDefinition');

/**
 * ProductSearchHit is the result of a executed search query and wraps the actual product found by the search.
 * 
 * The method getRepresentedProducts returns the actual products that is conforming the query and is represented by the search hit.
 * Depending on the hit typ, getRepresentedProducts returns:
 * 
 * - HIT_TYPE_SIMPLE -> a simple product
 * - HIT_TYPE_PRODUCT_MASTER -> a variation product
 * - HIT_TYPE_PRODUCT_SET -> a product part of set
 * - HIT_TYPE_PRODUCT_BUNDLE -> a product part of a bundle
 * - HIT_TYPE_VARIATION_GROUP -> a variation product
 * 
 * The ProductSearchHit type can be retrieved by method getHitType and contains the following types:
 * 
 * - HIT_TYPE_SIMPLE
 * - HIT_TYPE_PRODUCT_MASTER
 * - HIT_TYPE_PRODUCT_SET
 * - HIT_TYPE_PRODUCT_BUNDLE
 * - HIT_TYPE_VARIATION_GROUP
 * 
 * The method getProduct returns the presentation product corresponding to the ProductSearchHit type.
 * 
 * - HIT_TYPE_SIMPLE -> a simple product
 * - HIT_TYPE_PRODUCT_MASTER -> a variation master product
 * - HIT_TYPE_PRODUCT_SET -> a product set
 * - HIT_TYPE_PRODUCT_BUNDLE -> a product bundle
 * - HIT_TYPE_VARIATION_GROUP ->a variation group
 * 
 * Example:
 * 
 * Given a product master P1 called "Sweater" with attributes color and size that has the following variants:
 * 
 * - V1 - color: red, size: small
 * - V2 - color: red, size: large
 * - V3 - color: blue, size: small
 * - V4 - color: blue, size: large
 * - V5 - color: yellow, size: small
 * - V6 - color: yellow, size: large
 * 
 * A search for "red sweater" should hit the first two variants, V1 and V2
 * that are both red. The ProductSearchHit for this result encompass the master and the red variants but not the other
 * non-relevant variants.
 * 
 * The variants hit by the query can be retrieved by getRepresentedProducts, returning a list that contains the two red sweater variants.
 * 
 * The master product "Sweater" is returned by getProduct.
 * 
 * Furthermore, to get the first or last of that list of variants hit by the query we can call
 * getFirstRepresentedProduct or getLastRepresentedProduct. The product with the highest
 * sort rank is returned first, and the product with the lowest sort rank is
 * returned last. The product sort rank depends on the sorting conditions
 * used for the search query.
 */
declare class ProductSearchHit {
    /**
     * Constant representing a product search hit type based on the presentation product of a hit. This hit type is used with product bundles.
     */
    static readonly HIT_TYPE_PRODUCT_BUNDLE: string;
    /**
     * Constant representing a product search hit type based on the presentation product of a hit. This hit type is used with master products.
     */
    static readonly HIT_TYPE_PRODUCT_MASTER: string;
    /**
     * Constant representing a product search hit type based on the presentation product of a hit. This hit type is used with product sets.
     */
    static readonly HIT_TYPE_PRODUCT_SET: string;
    /**
     * Constant representing a product search hit type based on the presentation product of a hit. This hit type is used with single, non-complex products, including product variants that
     * are assigned to a category and are returned as the presentation product.
     */
    static readonly HIT_TYPE_SIMPLE: string;
    /**
     * Constant representing a product search hit type based on the presentation product of a hit. This hit type is used with slicing groups.
     * @deprecated Please use HIT_TYPE_VARIATION_GROUP instead.
     */
    static readonly HIT_TYPE_SLICING_GROUP: string;
    /**
     * Constant representing a product search hit type based on the presentation product of a hit. This hit type is used with variation groups.
     */
    static readonly HIT_TYPE_VARIATION_GROUP: string;
    /**
     * Returns the product that is actually hit by the search and has the highest
     * sort rank according to the sorting conditions used for the search query.
     * @see getRepresentedProducts
     * @see getLastRepresentedProduct
     */
    readonly firstRepresentedProduct: Product<any>;
    /**
     * Returns the ID of the product that is actually hit by the search and has the highest
     * sort rank according to the sorting conditions used for the search query.
     * @see getRepresentedProducts
     * @see getLastRepresentedProduct
     */
    readonly firstRepresentedProductID: string;
    /**
     * Returns the type of the product wrapped by this search hit. The product type returned will be one of the hit types:
     * 
     * -  dw.catalog.ProductSearchHit.HIT_TYPE_SIMPLE
     * -  dw.catalog.ProductSearchHit.HIT_TYPE_PRODUCT_MASTER
     * -  dw.catalog.ProductSearchHit.HIT_TYPE_PRODUCT_BUNDLE
     * -  dw.catalog.ProductSearchHit.HIT_TYPE_PRODUCT_SET
     * -  dw.catalog.ProductSearchHit.HIT_TYPE_SLICING_GROUP
     * -  dw.catalog.ProductSearchHit.HIT_TYPE_VARIATION_GROUP
     */
    readonly hitType: string;
    /**
     * Returns the product that is actually hit by the search and has the lowest
     * sort rank according to the sorting conditions used for the search query.
     * @see getRepresentedProducts
     * @see getLastRepresentedProduct
     */
    readonly lastRepresentedProduct: Product<any>;
    /**
     * Returns the ID of the product that is actually hit by the search and has the lowest
     * sort rank according to the sorting conditions used for the search query.
     * @see getRepresentedProducts
     * @see getLastRepresentedProduct
     */
    readonly lastRepresentedProductID: string;
    /**
     * Returns the maximum price of all products represented by the
     * product hit. See getRepresentedProducts for details on
     * the set of products used for finding the maximum. The method returns
     * `N/A` in case no price information can be found.
     * 
     * Note: The method uses price information of the search index and therefore
     * might return different prices than the ProductPriceModel.
     */
    readonly maxPrice: Money;
    /**
     * Returns the maximum price per unit of all products represented by the
     * product hit. See getRepresentedProducts for details on
     * the set of products used for finding the maximum. The method returns
     * `N/A` in case no price information can be found.
     * 
     * Note: The method uses price information of the search index and therefore
     * might return different prices than the ProductPriceModel.
     */
    readonly maxPricePerUnit: Money;
    /**
     * Returns the minimum price of all products represented by the
     * product hit. See getRepresentedProducts for details on
     * the set of products used for finding the minimum. The method returns
     * `N/A` in case no price information can be found.
     * 
     * Note: the method uses price information of the search index and therefore
     * might return different prices than the ProductPriceModel.
     */
    readonly minPrice: Money;
    /**
     * Returns the minimum price per unit of all products represented by the
     * product hit. See getRepresentedProducts for details on
     * the set of products used for finding the minimum. The method returns
     * `N/A` in case no price information can be found.
     * 
     * Note: the method uses price information of the search index and therefore
     * might return different prices than the ProductPriceModel.
     */
    readonly minPricePerUnit: Money;
    /**
     * Convenience method to check whether this ProductSearchHit represents
     * multiple products (see getRepresentedProducts) that have
     * different prices.
     */
    readonly priceRange: boolean;
    /**
     * Returns the presentation product of this ProductSearchHit corresponding to the ProductSearchHit type.
     * 
     * - HIT_TYPE_SIMPLE -> a simple product
     * - HIT_TYPE_PRODUCT_MASTER -> a variation master product
     * - HIT_TYPE_PRODUCT_SET -> a product set
     * - HIT_TYPE_PRODUCT_BUNDLE -> a product bundle
     * - HIT_TYPE_VARIATION_GROUP ->a variation group
     * 
     * To retrieve the product(s) actually hit by the search use getRepresentedProducts.
     * @see getRepresentedProducts
     */
    readonly product: Product<any>;
    /**
     * Returns the ID of the presentation product of this ProductSearchHit corresponding to the ProductSearchHit type.
     * 
     * - HIT_TYPE_SIMPLE -> a simple product
     * - HIT_TYPE_PRODUCT_MASTER -> a variation master product
     * - HIT_TYPE_PRODUCT_SET -> a product set
     * - HIT_TYPE_PRODUCT_BUNDLE -> a product bundle
     * - HIT_TYPE_VARIATION_GROUP ->a variation group
     * 
     * To retrieve the ID of the product actually hit by the search use getFirstRepresentedProductID or getLastRepresentedProductID.
     * @see getRepresentedProducts
     */
    readonly productID: string;
    /**
     * The method returns the actual ID of the product that is conforming the query and is represented by the search hit.
     * Depending on the hit typ, it returns the ID of:
     * 
     * - HIT_TYPE_SIMPLE -> a simple product
     * - HIT_TYPE_PRODUCT_MASTER -> a variation product
     * - HIT_TYPE_PRODUCT_SET -> a product part of set
     * - HIT_TYPE_PRODUCT_BUNDLE -> a product part of a bundle
     * - HIT_TYPE_VARIATION_GROUP ->a variation product
     * 
     * If the method returns multiple products, the product with the highest
     * sort rank is returned first, and the product with the lowest sort rank is
     * returned last. The product sort rank depends on the sorting conditions
     * used for the search query.
     * @see getFirstRepresentedProduct
     * @see getLastRepresentedProduct
     */
    readonly representedProductIDs: List<string>;
    /**
     * The method returns the actual product that is conforming the query and is represented by the search hit.
     * Depending on the hit typ, getRepresentedProducts returns:
     * 
     * - HIT_TYPE_SIMPLE -> a simple product
     * - HIT_TYPE_PRODUCT_MASTER -> a variation product
     * - HIT_TYPE_PRODUCT_SET -> a product part of set
     * - HIT_TYPE_PRODUCT_BUNDLE -> a product part of a bundle
     * - HIT_TYPE_VARIATION_GROUP ->a variation product
     * 
     * If the method returns multiple products, the product with the highest
     * sort rank is returned first, and the product with the lowest sort rank is
     * returned last. The product sort rank depends on the sorting conditions
     * used for the search query.
     * @see getFirstRepresentedProduct
     * @see getLastRepresentedProduct
     */
    readonly representedProducts: List<Product<any>>;
    private constructor();
    /**
     * Returns the product that is actually hit by the search and has the highest
     * sort rank according to the sorting conditions used for the search query.
     * @see getRepresentedProducts
     * @see getLastRepresentedProduct
     */
    getFirstRepresentedProduct(): Product<any>;
    /**
     * Returns the ID of the product that is actually hit by the search and has the highest
     * sort rank according to the sorting conditions used for the search query.
     * @see getRepresentedProducts
     * @see getLastRepresentedProduct
     */
    getFirstRepresentedProductID(): string;
    /**
     * Returns the type of the product wrapped by this search hit. The product type returned will be one of the hit types:
     * 
     * -  dw.catalog.ProductSearchHit.HIT_TYPE_SIMPLE
     * -  dw.catalog.ProductSearchHit.HIT_TYPE_PRODUCT_MASTER
     * -  dw.catalog.ProductSearchHit.HIT_TYPE_PRODUCT_BUNDLE
     * -  dw.catalog.ProductSearchHit.HIT_TYPE_PRODUCT_SET
     * -  dw.catalog.ProductSearchHit.HIT_TYPE_SLICING_GROUP
     * -  dw.catalog.ProductSearchHit.HIT_TYPE_VARIATION_GROUP
     */
    getHitType(): string;
    /**
     * Returns the product that is actually hit by the search and has the lowest
     * sort rank according to the sorting conditions used for the search query.
     * @see getRepresentedProducts
     * @see getLastRepresentedProduct
     */
    getLastRepresentedProduct(): Product<any>;
    /**
     * Returns the ID of the product that is actually hit by the search and has the lowest
     * sort rank according to the sorting conditions used for the search query.
     * @see getRepresentedProducts
     * @see getLastRepresentedProduct
     */
    getLastRepresentedProductID(): string;
    /**
     * Returns the maximum price of all products represented by the
     * product hit. See getRepresentedProducts for details on
     * the set of products used for finding the maximum. The method returns
     * `N/A` in case no price information can be found.
     * 
     * Note: The method uses price information of the search index and therefore
     * might return different prices than the ProductPriceModel.
     */
    getMaxPrice(): Money;
    /**
     * Returns the maximum price per unit of all products represented by the
     * product hit. See getRepresentedProducts for details on
     * the set of products used for finding the maximum. The method returns
     * `N/A` in case no price information can be found.
     * 
     * Note: The method uses price information of the search index and therefore
     * might return different prices than the ProductPriceModel.
     */
    getMaxPricePerUnit(): Money;
    /**
     * Returns the minimum price of all products represented by the
     * product hit. See getRepresentedProducts for details on
     * the set of products used for finding the minimum. The method returns
     * `N/A` in case no price information can be found.
     * 
     * Note: the method uses price information of the search index and therefore
     * might return different prices than the ProductPriceModel.
     */
    getMinPrice(): Money;
    /**
     * Returns the minimum price per unit of all products represented by the
     * product hit. See getRepresentedProducts for details on
     * the set of products used for finding the minimum. The method returns
     * `N/A` in case no price information can be found.
     * 
     * Note: the method uses price information of the search index and therefore
     * might return different prices than the ProductPriceModel.
     */
    getMinPricePerUnit(): Money;
    /**
     * Returns the presentation product of this ProductSearchHit corresponding to the ProductSearchHit type.
     * 
     * - HIT_TYPE_SIMPLE -> a simple product
     * - HIT_TYPE_PRODUCT_MASTER -> a variation master product
     * - HIT_TYPE_PRODUCT_SET -> a product set
     * - HIT_TYPE_PRODUCT_BUNDLE -> a product bundle
     * - HIT_TYPE_VARIATION_GROUP ->a variation group
     * 
     * To retrieve the product(s) actually hit by the search use getRepresentedProducts.
     * @see getRepresentedProducts
     */
    getProduct(): Product<any>;
    /**
     * Returns the ID of the presentation product of this ProductSearchHit corresponding to the ProductSearchHit type.
     * 
     * - HIT_TYPE_SIMPLE -> a simple product
     * - HIT_TYPE_PRODUCT_MASTER -> a variation master product
     * - HIT_TYPE_PRODUCT_SET -> a product set
     * - HIT_TYPE_PRODUCT_BUNDLE -> a product bundle
     * - HIT_TYPE_VARIATION_GROUP ->a variation group
     * 
     * To retrieve the ID of the product actually hit by the search use getFirstRepresentedProductID or getLastRepresentedProductID.
     * @see getRepresentedProducts
     */
    getProductID(): string;
    /**
     * The method returns the actual ID of the product that is conforming the query and is represented by the search hit.
     * Depending on the hit typ, it returns the ID of:
     * 
     * - HIT_TYPE_SIMPLE -> a simple product
     * - HIT_TYPE_PRODUCT_MASTER -> a variation product
     * - HIT_TYPE_PRODUCT_SET -> a product part of set
     * - HIT_TYPE_PRODUCT_BUNDLE -> a product part of a bundle
     * - HIT_TYPE_VARIATION_GROUP ->a variation product
     * 
     * If the method returns multiple products, the product with the highest
     * sort rank is returned first, and the product with the lowest sort rank is
     * returned last. The product sort rank depends on the sorting conditions
     * used for the search query.
     * @see getFirstRepresentedProduct
     * @see getLastRepresentedProduct
     */
    getRepresentedProductIDs(): List<string>;
    /**
     * The method returns the actual product that is conforming the query and is represented by the search hit.
     * Depending on the hit typ, getRepresentedProducts returns:
     * 
     * - HIT_TYPE_SIMPLE -> a simple product
     * - HIT_TYPE_PRODUCT_MASTER -> a variation product
     * - HIT_TYPE_PRODUCT_SET -> a product part of set
     * - HIT_TYPE_PRODUCT_BUNDLE -> a product part of a bundle
     * - HIT_TYPE_VARIATION_GROUP ->a variation product
     * 
     * If the method returns multiple products, the product with the highest
     * sort rank is returned first, and the product with the lowest sort rank is
     * returned last. The product sort rank depends on the sorting conditions
     * used for the search query.
     * @see getFirstRepresentedProduct
     * @see getLastRepresentedProduct
     */
    getRepresentedProducts(): List<Product<any>>;
    /**
     * This method is only applicable if this ProductSearchHit represents a
     * product variation (see getRepresentedProducts). It returns the
     * distinct value set for the specified variation attribute for all variants
     * represented by this ProductSearchHit. The values are returned in the same
     * order as they are defined for the variation.
     * 
     * This method will accept a ProductVariationAttribute parameter or a String
     * which is the ID of a variation attribute. If any other object type is
     * passed, or null is passed, an exception will be thrown. If this
     * ProductSearchHit does not represent a product variation, or the passed
     * variation attribute is not associated with this product, the method
     * returns an empty list.
     */
    getRepresentedVariationValues(va: any): List<ObjectAttributeValueDefinition> | null;
    /**
     * Convenience method to check whether this ProductSearchHit represents
     * multiple products (see getRepresentedProducts) that have
     * different prices.
     */
    isPriceRange(): boolean;
}

export = ProductSearchHit;
