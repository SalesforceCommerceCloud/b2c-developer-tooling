import SearchModel = require('./SearchModel');
import URL = require('../web/URL');
import SearchStatus = require('../system/SearchStatus');
import Category = require('./Category');
import List = require('../util/List');
import utilIterator = require('../util/Iterator');
import ProductSearchHit = require('./ProductSearchHit');
import Product = require('./Product');
import ProductSearchRefinements = require('./ProductSearchRefinements');
import SuggestedPhrase = require('../suggest/SuggestedPhrase');
import SearchPhraseSuggestions = require('../suggest/SearchPhraseSuggestions');
import StoreInventoryFilter = require('./StoreInventoryFilter');
import SortingRule = require('./SortingRule');
import SortingOption = require('./SortingOption');
import PageMetaTag = require('../web/PageMetaTag');

/**
 * The class is the central interface to a product search result and a product
 * search refinement. It also provides utility methods to generate a search URL.
 */
declare class ProductSearchModel extends SearchModel {
    /**
     * URL Parameter for the category ID
     */
    static readonly CATEGORYID_PARAMETER = "cgid";
    /**
     * URL Parameter for the inventory list IDs
     */
    static readonly INVENTORY_LIST_IDS_PARAMETER = "ilids";
    /**
     * The maximum number of inventory list IDs that can be passed to setInventoryListIDs
     */
    static readonly MAXIMUM_INVENTORY_LIST_IDS = 10;
    /**
     * The maximum number of product IDs that can be passed to setProductIDs
     */
    static readonly MAXIMUM_PRODUCT_IDS = 30;
    /**
     * The maximum number of store inventory values for a store inventory filter that can be passed to
     * setStoreInventoryFilter
     */
    static readonly MAXIMUM_STORE_INVENTORY_FILTER_VALUES = 10;
    /**
     * URL Parameter for the maximum price
     */
    static readonly PRICE_MAX_PARAMETER = "pmax";
    /**
     * URL Parameter for the minimum price
     */
    static readonly PRICE_MIN_PARAMETER = "pmin";
    /**
     * URL Parameter for the product ID
     */
    static readonly PRODUCTID_PARAMETER = "pid";
    /**
     * URL Parameter for the promotion ID
     */
    static readonly PROMOTIONID_PARAMETER = "pmid";
    /**
     * constant indicating that all related products should be returned for the next product search by promotion ID
     */
    static readonly PROMOTION_PRODUCT_TYPE_ALL = "all";
    /**
     * constant indicating that only bonus products should be returned for the next product search by promotion ID. This
     * constant should be set using setPromotionProductType when using the search model to find the
     * available list of bonus products for a Choice of Bonus Product (Rule) promotion, along with
     * setPromotionID.
     */
    static readonly PROMOTION_PRODUCT_TYPE_BONUS = "bonus";
    /**
     * constant indicating that only discounted products should be returned for the next product search by promotion ID
     */
    static readonly PROMOTION_PRODUCT_TYPE_DISCOUNTED = "discounted";
    /**
     * URL Parameter for the promotion product type
     */
    static readonly PROMOTION_PRODUCT_TYPE_PARAMETER = "pmpt";
    /**
     * constant indicating that only qualifying products should be returned for the next product search by promotion ID
     */
    static readonly PROMOTION_PRODUCT_TYPE_QUALIFYING = "qualifying";
    /**
     * URL Parameter prefix for a refinement name
     */
    static readonly REFINE_NAME_PARAMETER_PREFIX = "prefn";
    /**
     * URL Parameter prefix for a refinement value
     */
    static readonly REFINE_VALUE_PARAMETER_PREFIX = "prefv";
    /**
     * URL Parameter prefix for a sorting option
     */
    static readonly SORTING_OPTION_PARAMETER = "sopt";
    /**
     * URL Parameter prefix for a sorting rule
     */
    static readonly SORTING_RULE_PARAMETER = "srule";
    /**
     * URL Parameter prefix for a refinement value
     */
    static readonly SORT_BY_PARAMETER_PREFIX = "psortb";
    /**
     * URL Parameter prefix for a refinement value
     */
    static readonly SORT_DIRECTION_PARAMETER_PREFIX = "psortd";
    /**
     * Returns the category object for the category id specified in the query.
     * If a category with that id doesn't exist or if the category is offline
     * this method returns null.
     */
    readonly category: Category;
    /**
     * Returns the category id that was specified in the search query.
     */
    categoryID: string;
    /**
     * The method returns true, if this is a pure search for a category. The
     * method checks, that a category ID is specified and no search phrase is
     * specified.
     */
    readonly categorySearch: boolean;
    /**
     * Returns the deepest common category of all products in the search result.
     * In case of an empty search result the method returns the root category.
     */
    readonly deepestCommonCategory: Category;
    /**
     * Returns the sorting rule used to order the products in the results of this query,
     * or `null` if no search has been executed yet.
     * 
     * In contrast to getSortingRule, this method respects explicit sorting rules and sorting options and rules determined implicitly
     * based on the refinement category, keyword sorting rule assignment, etc.
     */
    readonly effectiveSortingRule: SortingRule | null;
    /**
     * 
     * 
     * Returns a list of inventory IDs that were specified in the search query or an empty list if no inventory ID set.
     */
    readonly inventoryIDs: List<string>;
    /**
     * Get the flag indicating whether unorderable products should be excluded
     * when the next call to getProducts() is made. If this value has not been
     * previously set, then the value returned will be based on the value of the
     * search preference.
     */
    orderableProductsOnly: boolean;
    /**
     * Returns all page meta tags, defined for this instance for which content can be generated.
     * 
     * The meta tag content is generated based on the product listing page meta tag context and rules.
     * The rules are obtained from the current category context or inherited from the parent category,
     * up to the root category.
     */
    readonly pageMetaTags: Array<PageMetaTag>;
    /**
     * The method indicates if the search result is ordered by a personalized sorting rule.
     */
    readonly personalizedSort: boolean;
    /**
     * Returns the maximum price by which the search result is refined.
     */
    priceMax: number;
    /**
     * Returns the minimum price by which the search result is refined.
     */
    priceMin: number;
    /**
     * Returns the product id that was specified in the search query.
     * @deprecated Please use getProductIDs instead
     */
    productID: string;
    /**
     * Returns a list of product IDs that were specified in the search query or an empty list if no product ID set.
     */
    productIDs: List<string>;
    /**
     * Returns the product search hits in the search result.
     * 
     * Note that method does also return search hits representing products that
     * were removed or went offline since the last index update, i.e. you must
     * implement appropriate checks before accessing the product related to the
     * search hit instance (see dw.catalog.ProductSearchHit.getProduct)
     * @see getProducts
     */
    readonly productSearchHits: utilIterator<any>;
    /**
     * Returns all products in the search result.
     * 
     * Note that products that were removed or went offline since the last index
     * update are not included in the returned set.
     * @see getProductSearchHits
     * @deprecated This method should not be used because loading Products for each result of a product search is
     * extremely expensive performance-wise. Please use getProductSearchHits to iterate
     * ProductSearchHits instead.
     */
    readonly products: utilIterator<any>;
    /**
     * Returns the promotion id that was specified in the search query or null if no promotion id set. If multiple
     * promotion id's specified the method returns only the first id. See setPromotionIDs and
     * getPromotionIDs.
     */
    promotionID: string | null;
    /**
     * Returns a list of promotion id's that were specified in the search query or an empty list if no promotion id set.
     */
    promotionIDs: List<string>;
    /**
     * Returns the promotion product type specified in the search query.
     */
    promotionProductType: string;
    /**
     * Get the flag that determines if the category search will
     * be recursive.
     */
    recursiveCategorySearch: boolean;
    /**
     * The method returns true, if the search is refined by a category.
     * The method checks, that a category ID is specified.
     */
    readonly refinedByCategory: boolean;
    /**
     * Identifies if this search has been refined by price.
     */
    readonly refinedByPrice: boolean;
    /**
     * Identifies if this search has been refined by promotion.
     */
    readonly refinedByPromotion: boolean;
    /**
     * Identifies if this is a category search and is refined with further
     * criteria, like a brand refinement or an attribute refinement.
     */
    readonly refinedCategorySearch: boolean;
    /**
     * Returns the category used to determine possible refinements for the search.
     * If an explicit category was set for this purpose using setRefinementCategory, it is returned.
     * Otherwise, the deepest common category of all search results will be returned.
     */
    refinementCategory: Category;
    /**
     * Returns the ProductSearchRefinements associated with this search and filtered by session currency.
     * If an explicit category was set for this purpose using setRefinementCategory, it will be used to determine the refinements.
     * Otherwise, the refinements are determined based on the deepest common category of all products in the search result.
     * Hint: If you want to use the same refinements for all searches, consider defining them in one category (usually root) and using setRefinementCategory to avoid unnecessary calculation of the deepest common category.
     */
    readonly refinements: ProductSearchRefinements;
    /**
     * Returns search phrase suggestions for the current search phrase.
     * Search phrase suggestions may contain alternative search phrases as well
     * as lists of corrected and completed search terms.
     */
    readonly searchPhraseSuggestions: SearchPhraseSuggestions;
    /**
     * This method returns the URL of the endpoint where the merchants should upload their image for visual search.
     * @throws RuntimeException
     */
    readonly searchableImageUploadURL: string;
    /**
     * Returns the sorting rule explicitly set on this model to be used
     * to order the products in the results of this query, or `null`
     * if no rule has been explicitly set.
     * 
     * This method does not return the sorting rule that will be used implicitly
     * based on the context of the search, such as the refinement category.
     */
    sortingRule: SortingRule | null;
    /**
     * 
     * 
     * Returns the StoreInventoryFilter, which was specified for this search.
     */
    storeInventoryFilter: StoreInventoryFilter;
    /**
     * Returns the suggested search phrase with the highest accuracy provided
     * for the current search phrase.
     * @deprecated Please use getSearchPhraseSuggestions instead
     */
    readonly suggestedSearchPhrase: string;
    /**
     * Returns a list with up to 5 suggested search phrases provided for the
     * current search phrase. It is possible that less than 5 suggestions
     * or even no suggestions are returned.
     * @deprecated Please use getSearchPhraseSuggestions instead
     */
    readonly suggestedSearchPhrases: List<SuggestedPhrase>;
    /**
     * The method indicates if no-hits search should be tracked for predictive intelligence use.
     */
    readonly trackingEmptySearchesEnabled: boolean;
    /**
     * The method returns true, if this is a visual search. The
     * method checks that a image UUID is specified.
     */
    readonly visualSearch: boolean;
    /**
     * Constructs a new ProductSearchModel.
     */
    constructor();
    /**
     * Constructs a URL that you can use to execute a query for a specific
     * Category.
     * 
     * The generated URL will be an absolute URL which uses the protocol of
     * the current request.
     */
    static urlForCategory(action: string, cgid: string): URL;
    /**
     * Constructs a URL that you can use to execute a query for a specific
     * Category. The search specific parameters are appended to the provided
     * URL. The URL is typically generated with one of the URLUtils methods.
     */
    static urlForCategory(url: URL, cgid: string): URL;
    /**
     * Constructs a URL that you can use to execute a query for a specific
     * Product. The passed action is used to build an initial url. All search
     * specific attributes are appended.
     * 
     * The generated URL will be an absolute URL which uses the protocol of
     * the current request.
     */
    static urlForProduct(action: string, cgid: string | null, pid: string): URL;
    /**
     * Constructs a URL that you can use to execute a query for a specific
     * Product. The passed url can be either a full url or just the name for a
     * pipeline. In the later case a relative URL is created.
     */
    static urlForProduct(url: URL, cgid: string | null, pid: string): URL;
    /**
     * Constructs a URL that you can use to execute a query for a specific
     * attribute name-value pair.
     * 
     * The generated URL will be an absolute URL which uses the protocol of
     * the current request.
     */
    static urlForRefine(action: string, attributeID: string, value: string): URL;
    /**
     * Constructs a URL that you can use to execute a query for a specific
     * attribute name-value pair. The search specific parameters are appended to
     * the provided URL. The URL is typically generated with one of the URLUtils
     * methods.
     */
    static urlForRefine(url: URL, attributeID: string, value: string): URL;
    /**
     * Set the only search hit types to be included from the search. Values accepted are the 'hit type' constants
     * exposed in the dw.catalog.ProductSearchHit class. Overwrites any hit type refinements set from prior calls to
     * addHitTypeRefinement(String...) or excludeHitType(String...).
     */
    addHitTypeRefinement(...types: string[]): void;
    /**
     * Set the search hit types to be excluded from the search. Values accepted are the 'hit type' constants exposed in
     * the dw.catalog.ProductSearchHit class. Overwrites any hit type refinements set from prior calls to
     * addHitTypeRefinement(String...) or excludeHitType(String...).
     */
    excludeHitType(...types: string[]): void;
    /**
     * Returns the category object for the category id specified in the query.
     * If a category with that id doesn't exist or if the category is offline
     * this method returns null.
     */
    getCategory(): Category;
    /**
     * Returns the category id that was specified in the search query.
     */
    getCategoryID(): string;
    /**
     * Returns the deepest common category of all products in the search result.
     * In case of an empty search result the method returns the root category.
     */
    getDeepestCommonCategory(): Category;
    /**
     * Returns the sorting rule used to order the products in the results of this query,
     * or `null` if no search has been executed yet.
     * 
     * In contrast to getSortingRule, this method respects explicit sorting rules and sorting options and rules determined implicitly
     * based on the refinement category, keyword sorting rule assignment, etc.
     */
    getEffectiveSortingRule(): SortingRule | null;
    /**
     * 
     * 
     * Returns a list of inventory IDs that were specified in the search query or an empty list if no inventory ID set.
     */
    getInventoryIDs(): List<string>;
    /**
     * Get the flag indicating whether unorderable products should be excluded
     * when the next call to getProducts() is made. If this value has not been
     * previously set, then the value returned will be based on the value of the
     * search preference.
     */
    getOrderableProductsOnly(): boolean;
    /**
     * Returns the page meta tag for the specified id.
     * 
     * The meta tag content is generated based on the product listing page meta tag context and rule.
     * The rule is obtained from the current category context or inherited from the parent category,
     * up to the root category.
     * 
     * Null will be returned if the meta tag is undefined on the current instance, or if no rule can be found for the
     * current context, or if the rule resolves to an empty string.
     */
    getPageMetaTag(id: string): PageMetaTag | null;
    /**
     * Returns all page meta tags, defined for this instance for which content can be generated.
     * 
     * The meta tag content is generated based on the product listing page meta tag context and rules.
     * The rules are obtained from the current category context or inherited from the parent category,
     * up to the root category.
     */
    getPageMetaTags(): Array<PageMetaTag>;
    /**
     * Returns the maximum price by which the search result is refined.
     */
    getPriceMax(): number;
    /**
     * Returns the minimum price by which the search result is refined.
     */
    getPriceMin(): number;
    /**
     * Returns the product id that was specified in the search query.
     * @deprecated Please use getProductIDs instead
     */
    getProductID(): string;
    /**
     * Returns a list of product IDs that were specified in the search query or an empty list if no product ID set.
     */
    getProductIDs(): List<string>;
    /**
     * Returns the underlying ProductSearchHit for a product, or null if no
     * ProductSearchHit found for this product.
     */
    getProductSearchHit(product: Product<any>): ProductSearchHit | null;
    /**
     * Returns the product search hits in the search result.
     * 
     * Note that method does also return search hits representing products that
     * were removed or went offline since the last index update, i.e. you must
     * implement appropriate checks before accessing the product related to the
     * search hit instance (see dw.catalog.ProductSearchHit.getProduct)
     * @see getProducts
     */
    getProductSearchHits(): utilIterator<any>;
    /**
     * Returns all products in the search result.
     * 
     * Note that products that were removed or went offline since the last index
     * update are not included in the returned set.
     * @see getProductSearchHits
     * @deprecated This method should not be used because loading Products for each result of a product search is
     * extremely expensive performance-wise. Please use getProductSearchHits to iterate
     * ProductSearchHits instead.
     */
    getProducts(): utilIterator<any>;
    /**
     * Returns the promotion id that was specified in the search query or null if no promotion id set. If multiple
     * promotion id's specified the method returns only the first id. See setPromotionIDs and
     * getPromotionIDs.
     */
    getPromotionID(): string | null;
    /**
     * Returns a list of promotion id's that were specified in the search query or an empty list if no promotion id set.
     */
    getPromotionIDs(): List<string>;
    /**
     * Returns the promotion product type specified in the search query.
     */
    getPromotionProductType(): string;
    /**
     * Returns the category used to determine possible refinements for the search.
     * If an explicit category was set for this purpose using setRefinementCategory, it is returned.
     * Otherwise, the deepest common category of all search results will be returned.
     */
    getRefinementCategory(): Category;
    /**
     * Returns the ProductSearchRefinements associated with this search and filtered by session currency.
     * If an explicit category was set for this purpose using setRefinementCategory, it will be used to determine the refinements.
     * Otherwise, the refinements are determined based on the deepest common category of all products in the search result.
     * Hint: If you want to use the same refinements for all searches, consider defining them in one category (usually root) and using setRefinementCategory to avoid unnecessary calculation of the deepest common category.
     */
    getRefinements(): ProductSearchRefinements;
    /**
     * Returns search phrase suggestions for the current search phrase.
     * Search phrase suggestions may contain alternative search phrases as well
     * as lists of corrected and completed search terms.
     */
    getSearchPhraseSuggestions(): SearchPhraseSuggestions;
    /**
     * This method returns the URL of the endpoint where the merchants should upload their image for visual search.
     * @throws RuntimeException
     */
    getSearchableImageUploadURL(): string;
    /**
     * Returns the sorting rule explicitly set on this model to be used
     * to order the products in the results of this query, or `null`
     * if no rule has been explicitly set.
     * 
     * This method does not return the sorting rule that will be used implicitly
     * based on the context of the search, such as the refinement category.
     */
    getSortingRule(): SortingRule | null;
    /**
     * 
     * 
     * Returns the StoreInventoryFilter, which was specified for this search.
     */
    getStoreInventoryFilter(): StoreInventoryFilter;
    /**
     * Returns the suggested search phrase with the highest accuracy provided
     * for the current search phrase.
     * @deprecated Please use getSearchPhraseSuggestions instead
     */
    getSuggestedSearchPhrase(): string;
    /**
     * Returns a list with up to 5 suggested search phrases provided for the
     * current search phrase. It is possible that less than 5 suggestions
     * or even no suggestions are returned.
     * @deprecated Please use getSearchPhraseSuggestions instead
     */
    getSuggestedSearchPhrases(): List<SuggestedPhrase>;
    /**
     * The method returns true, if this is a pure search for a category. The
     * method checks, that a category ID is specified and no search phrase is
     * specified.
     */
    isCategorySearch(): boolean;
    /**
     * The method indicates if the search result is ordered by a personalized sorting rule.
     */
    isPersonalizedSort(): boolean;
    /**
     * Get the flag that determines if the category search will
     * be recursive.
     */
    isRecursiveCategorySearch(): boolean;
    /**
     * The method returns true, if the search is refined by a category.
     * The method checks, that a category ID is specified.
     */
    isRefinedByCategory(): boolean;
    /**
     * Identifies if this search has been refined by price.
     */
    isRefinedByPrice(): boolean;
    /**
     * Identifies if this search has been refined by the given price range.
     * Either range parameters may be null to represent open ranges.
     */
    isRefinedByPriceRange(priceMin: number, priceMax: number): boolean;
    /**
     * Identifies if this search has been refined by promotion.
     */
    isRefinedByPromotion(): boolean;
    /**
     * Identifies if this search has been refined by a given promotion.
     */
    isRefinedByPromotion(promotionID: string): boolean;
    /**
     * Identifies if this is a category search and is refined with further
     * criteria, like a brand refinement or an attribute refinement.
     */
    isRefinedCategorySearch(): boolean;
    /**
     * The method indicates if no-hits search should be tracked for predictive intelligence use.
     */
    isTrackingEmptySearchesEnabled(): boolean;
    /**
     * The method returns true, if this is a visual search. The
     * method checks that a image UUID is specified.
     */
    isVisualSearch(): boolean;
    /**
     * Execute the search based on the configured search term, category and filter conditions (price, attribute,
     * promotion, product type) and return the execution status. The execution of an empty ProductSearchModel without
     * any search term or filter criteria will not be supported and the search status dw.system.SearchStatus.EMPTY_QUERY
     * will be returned. A usage of the internal category id 'root' as category filter is not recommended, could cause
     * performance issues and will be potentially deprecated in a future release. A successful execution will be
     * indicated by dw.system.SearchStatus.SUCCESSFUL or dw.system.SearchStatus.LIMITED. For other possible search
     * statuses see dw.system.SearchStatus. The sorted and grouped search result of a successful execution can be fetched
     * via getProductSearchHits and the refinement options based on the search result can be obtained via
     * getRefinements and dw.catalog.SearchModel.getRefinementValues.
     */
    search(): SearchStatus;
    /**
     * Specifies the category id used for the search query.
     */
    setCategoryID(categoryID: string): void;
    /**
     * Set a flag indicating whether no-hits search should be tracked for predictive intelligence use.
     */
    setEnableTrackingEmptySearches(trackingEmptySearches: boolean): void;
    /**
     * 
     * 
     * Specifies multiple inventory list IDs used for the search query. The method supports up to
     * MAXIMUM_INVENTORY_LIST_IDS inventory IDs. If more than MAXIMUM_INVENTORY_LIST_IDS inventory IDs
     * used the method throws an IllegalArgumentException.
     * @throws IllegalArgumentException if more than  MAXIMUM_INVENTORY_LIST_IDS  inventory IDs used
     */
    setInventoryListIDs(inventoryListIDs: List<any>): void;
    /**
     * Set a flag indicating whether unorderable products should be excluded
     * when the next call to getProducts() is made. This method overrides the
     * default behavior which is controlled by the search preference.
     */
    setOrderableProductsOnly(orderableOnly: boolean): void;
    /**
     * Sets the maximum price by which the search result is to be refined.
     */
    setPriceMax(priceMax: number): void;
    /**
     * Sets the minimum price by which the search result is to be refined.
     */
    setPriceMin(priceMin: number): void;
    /**
     * Specifies the product id used for the search query.
     * @deprecated Please use setProductIDs instead
     */
    setProductID(productID: string): void;
    /**
     * Specifies multiple product IDs used for the search query. The specified product IDs include, but not limited to,
     * variant product IDs, product master IDs, variation group IDs, product set IDs, or product bundle IDs. For
     * example, this API could be used in high-traffic pages where developers need to be able to filter quickly for only
     * available child products of a specified master product, instead of looping through all variants of a set products
     * and checking their availabilities. The method supports up to MAXIMUM_PRODUCT_IDS product IDs. If more
     * than MAXIMUM_PRODUCT_IDS products IDs are passed, the method throws an IllegalArgumentException.
     * @throws IllegalArgumentException if more than  MAXIMUM_PRODUCT_IDS  product IDs used
     */
    setProductIDs(productIDs: List<any>): void;
    /**
     * Specifies the promotion id used for the search query.
     */
    setPromotionID(promotionID: string): void;
    /**
     * Specifies multiple promotion id's used for the search query. The method supports up to 30 promotion id's. If more
     * than 30 promotion id's used the method throws an IllegalArgumentException.
     * @throws IllegalArgumentException if more than 30 promotion id's used
     */
    setPromotionIDs(promotionIDs: List<any>): void;
    /**
     * Specifies the promotion product type used for the search query. This
     * value is only relevant for searches by promotion ID.
     */
    setPromotionProductType(promotionProductType: string): void;
    /**
     * Set a flag to indicate if the search in category should be recursive.
     */
    setRecursiveCategorySearch(recurse: boolean): void;
    /**
     * Sets an explicit category to be used when determining refinements. If this is not done, they will be determined based on the deepest common category of all search results.
     * The explicit category must be in the site's storefront catalog, otherwise the method fails with an IllegalArgumentException.
     * @throws IllegalArgumentException if the refinement category does not reside in the storefront catalog
     */
    setRefinementCategory(refinementCategory: Category): void;
    /**
     * An image ID can be retrieved by uploading an image with a multipart/form-data POST
     * request to 'https://api.cquotient.com/v3/image/search/upload/{siteID}'. This method sets product IDs retrieved
     * from the image ID to the ProductSearchModel. If using setProductIDs in addition to this method,
     * the ProductSearchModel will take the intersection of these sets of product IDs. If the image ID provided is
     * invalid or expired, product IDs will not be set onto the product search model.
     * @throws RuntimeException if product IDs for the provided image could not be set.
     */
    setSearchableImageID(imageID: string): void;
    /**
     * Sets or removes a sorting condition for the specified attribute. Specify
     * either SORT_DIRECTION_ASCENDING or SORT_DIRECTION_DESCENDING to set a
     * sorting condition. Specify SORT_DIRECTION_NONE to remove a sorting
     * condition from the attribute.
     * @deprecated This method is subject to removal. Use setSortingRule instead.
     */
    setSortingCondition(attributeID: string, direction: number): void;
    /**
     * Sets the sorting option to be used to order the products in the results of this query.
     * If a sorting rule is also set, the sorting option is ignored.
     */
    setSortingOption(option: SortingOption): void;
    /**
     * Sets the sorting rule to be used to order the products in the
     * results of this query.  Setting the rule in this way overrides the
     * default behavior of choosing the sorting rule based on the context of the
     * search, such as the refinement category.
     */
    setSortingRule(rule: SortingRule): void;
    /**
     * 
     * 
     * Filters the search result by one or more inventory list IDs provided by the class StoreInventoryFilter
     * which supports a semantic URL parameter like zip, city, store ... and a list of StoreInventoryFilterValue
     * which maps the semantic inventory list id value like Burlington, Boston, ... to a real inventory list id like
     * 'Burlington -> inventory1', 'Boston -> inventory2'. The search will filter the result by the real inventory list
     * id(s) but will use the semantic URL parameter and semantic inventory list id values for URL generation via all
     * URLRefine and URLRelax methods e.g. for urlRefineCategory, urlRelaxPrice,
     * SearchModel.urlRefineAttribute.
     * 
     * Example custom URL: city=Burlington|Boston
     * @example
     * var storeFilter = new dw.catalog.StoreInventoryFilter("city",
     * new dw.util.ArrayList(
     * new dw.catalog.StoreInventoryFilterValue("Burlington","inventory_store_store9"),
     * new dw.catalog.StoreInventoryFilterValue("Boston","inventory_store_store8")
     * ));
     * searchModel.setStoreInventoryFilter(filter)
     * @throws IllegalArgumentException if more than  MAXIMUM_STORE_INVENTORY_FILTER_VALUES  filter values used
     */
    setStoreInventoryFilter(storeInventoryFilter: StoreInventoryFilter): void;
    /**
     * Constructs a URL that you can use to re-execute the query with a
     * category refinement.
     * 
     * The generated URL will be an absolute URL which uses the protocol of
     * the current request.
     */
    urlRefineCategory(action: string, refineCategoryID: string): URL;
    /**
     * Constructs a URL that you can use to re-execute the query with a
     * category refinement. The search specific parameters are appended to the
     * provided URL. The URL is typically generated with one of the URLUtils
     * methods.
     */
    urlRefineCategory(url: URL, refineCategoryID: string): URL;
    /**
     * Constructs a URL that you can use to re-execute the query with an
     * additional price filter.
     * 
     * The generated URL will be an absolute URL which uses the protocol of
     * the current request.
     */
    urlRefinePrice(action: string, min: number, max: number): URL;
    /**
     * Constructs a URL that you can use to re-execute the query with an
     * additional price filter. The search specific parameters are appended to
     * the provided URL. The URL is typically generated with one of the URLUtils
     * methods.
     */
    urlRefinePrice(url: URL, min: number, max: number): URL;
    /**
     * Constructs a URL that you can use to re-execute the query with a promotion refinement. The search specific
     * parameters are appended to the provided URL. The URL is typically generated with one of the URLUtils methods.
     */
    urlRefinePromotion(url: URL, refinePromotionID: string): URL;
    /**
     * Constructs a URL that you can use to re-execute the query with a promotion refinement. The generated URL will be
     * an absolute URL which uses the protocol of the current request.
     */
    urlRefinePromotion(action: string, refinePromotionID: string): URL;
    /**
     * Constructs a URL that you can use to re-execute the query without any
     * category refinement.
     * 
     * The generated URL will be an absolute URL which uses the protocol of
     * the current request.
     */
    urlRelaxCategory(action: string): URL;
    /**
     * Constructs a URL that you can use to re-execute the query without any
     * category refinement. The search specific parameters are appended to the
     * provided URL. The URL is typically generated with one of the URLUtils
     * methods.
     */
    urlRelaxCategory(url: URL): URL;
    /**
     * Constructs a URL that you can use to re-execute the query with no price
     * filter.
     * 
     * The generated URL will be an absolute URL which uses the protocol of
     * the current request.
     */
    urlRelaxPrice(action: string): URL;
    /**
     * Constructs a URL that you can use to would re-execute the query with no
     * price filter. The search specific parameters are appended to the provided
     * URL. The URL is typically generated with one of the URLUtils methods.
     */
    urlRelaxPrice(url: URL): URL;
    /**
     * Constructs a URL that you can use to re-execute the query without any promotion refinement. The search specific
     * parameters are appended to the provided URL. The URL is typically generated with one of the URLUtils methods.
     */
    urlRelaxPromotion(url: URL): URL;
    /**
     * Constructs a URL that you can use to re-execute the query without any promotion refinement. The generated URL
     * will be an absolute URL which uses the protocol of the current request.
     */
    urlRelaxPromotion(action: string): URL;
    /**
     * Constructs a URL that you can use to re-execute the query but sort the
     * results by the given storefront sorting option.
     * 
     * The generated URL will be an absolute URL which uses the protocol of the
     * current request.
     */
    urlSortingOption(action: string, option: SortingOption): URL;
    /**
     * Constructs a URL that you can use to re-execute the query but sort
     * the results by the given storefront sorting option. The search specific parameters are
     * appended to the provided URL. The URL is typically generated with one of
     * the URLUtils methods.
     */
    urlSortingOption(url: URL, option: SortingOption): URL;
    /**
     * Constructs a URL that you can use to re-execute the query but sort the
     * results by the given rule.
     * 
     * The generated URL will be an absolute URL which uses the protocol of the
     * current request.
     */
    urlSortingRule(action: string, rule: SortingRule): URL;
    /**
     * Constructs a URL that you can use to re-execute the query but sort
     * the results by the given rule. The search specific parameters are
     * appended to the provided URL. The URL is typically generated with one of
     * the URLUtils methods.
     */
    urlSortingRule(url: URL, rule: SortingRule): URL;
}

export = ProductSearchModel;
