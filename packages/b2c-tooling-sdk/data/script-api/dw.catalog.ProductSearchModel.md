<!-- prettier-ignore-start -->
# Class ProductSearchModel

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.catalog.SearchModel](dw.catalog.SearchModel.md)
    - [dw.catalog.ProductSearchModel](dw.catalog.ProductSearchModel.md)

The class is the central interface to a product search result and a product
search refinement. It also provides utility methods to generate a search URL.



## Constant Summary

| Constant | Description |
| --- | --- |
| [CATEGORYID_PARAMETER](#categoryid_parameter): [String](TopLevel.String.md) = "cgid" | URL Parameter for the category ID |
| [INVENTORY_LIST_IDS_PARAMETER](#inventory_list_ids_parameter): [String](TopLevel.String.md) = "ilids" | URL Parameter for the inventory list IDs |
| [MAXIMUM_INVENTORY_LIST_IDS](#maximum_inventory_list_ids): [Number](TopLevel.Number.md) = 10 | The maximum number of inventory list IDs that can be passed to [setInventoryListIDs(List)](dw.catalog.ProductSearchModel.md#setinventorylistidslist) |
| [MAXIMUM_PRODUCT_IDS](#maximum_product_ids): [Number](TopLevel.Number.md) = 30 | The maximum number of product IDs that can be passed to [setProductIDs(List)](dw.catalog.ProductSearchModel.md#setproductidslist) |
| [MAXIMUM_STORE_INVENTORY_FILTER_VALUES](#maximum_store_inventory_filter_values): [Number](TopLevel.Number.md) = 10 | The maximum number of store inventory values for a store inventory filter that can be passed to  [setStoreInventoryFilter(StoreInventoryFilter)](dw.catalog.ProductSearchModel.md#setstoreinventoryfilterstoreinventoryfilter) |
| [PRICE_MAX_PARAMETER](#price_max_parameter): [String](TopLevel.String.md) = "pmax" | URL Parameter for the maximum price |
| [PRICE_MIN_PARAMETER](#price_min_parameter): [String](TopLevel.String.md) = "pmin" | URL Parameter for the minimum price |
| [PRODUCTID_PARAMETER](#productid_parameter): [String](TopLevel.String.md) = "pid" | URL Parameter for the product ID |
| [PROMOTIONID_PARAMETER](#promotionid_parameter): [String](TopLevel.String.md) = "pmid" | URL Parameter for the promotion ID |
| [PROMOTION_PRODUCT_TYPE_ALL](#promotion_product_type_all): [String](TopLevel.String.md) = "all" | constant indicating that all related products should be returned for the next product search by promotion ID |
| [PROMOTION_PRODUCT_TYPE_BONUS](#promotion_product_type_bonus): [String](TopLevel.String.md) = "bonus" | constant indicating that only bonus products should be returned for the next product search by promotion ID. |
| [PROMOTION_PRODUCT_TYPE_DISCOUNTED](#promotion_product_type_discounted): [String](TopLevel.String.md) = "discounted" | constant indicating that only discounted products should be returned for the next product search by promotion ID |
| [PROMOTION_PRODUCT_TYPE_PARAMETER](#promotion_product_type_parameter): [String](TopLevel.String.md) = "pmpt" | URL Parameter for the promotion product type |
| [PROMOTION_PRODUCT_TYPE_QUALIFYING](#promotion_product_type_qualifying): [String](TopLevel.String.md) = "qualifying" | constant indicating that only qualifying products should be returned for the next product search by promotion ID |
| [REFINE_NAME_PARAMETER_PREFIX](#refine_name_parameter_prefix): [String](TopLevel.String.md) = "prefn" | URL Parameter prefix for a refinement name |
| [REFINE_VALUE_PARAMETER_PREFIX](#refine_value_parameter_prefix): [String](TopLevel.String.md) = "prefv" | URL Parameter prefix for a refinement value |
| [SORTING_OPTION_PARAMETER](#sorting_option_parameter): [String](TopLevel.String.md) = "sopt" | URL Parameter prefix for a sorting option |
| [SORTING_RULE_PARAMETER](#sorting_rule_parameter): [String](TopLevel.String.md) = "srule" | URL Parameter prefix for a sorting rule |
| [SORT_BY_PARAMETER_PREFIX](#sort_by_parameter_prefix): [String](TopLevel.String.md) = "psortb" | URL Parameter prefix for a refinement value |
| [SORT_DIRECTION_PARAMETER_PREFIX](#sort_direction_parameter_prefix): [String](TopLevel.String.md) = "psortd" | URL Parameter prefix for a refinement value |

## Property Summary

| Property | Description |
| --- | --- |
| [category](#category): [Category](dw.catalog.Category.md) `(read-only)` | Returns the category object for the category id specified in the query. |
| [categoryID](#categoryid): [String](TopLevel.String.md) | Returns the category id that was specified in the search query. |
| [categorySearch](#categorysearch): [Boolean](TopLevel.Boolean.md) `(read-only)` | The method returns true, if this is a pure search for a category. |
| [deepestCommonCategory](#deepestcommoncategory): [Category](dw.catalog.Category.md) `(read-only)` | Returns the deepest common category of all products in the search result. |
| [effectiveSortingRule](#effectivesortingrule): [SortingRule](dw.catalog.SortingRule.md) `(read-only)` | Returns the sorting rule used to order the products in the results of this query,  or `null` if no search has been executed yet. |
| [inventoryIDs](#inventoryids): [List](dw.util.List.md) `(read-only)` | <p>  Returns a list of inventory IDs that were specified in the search query or an empty list if no inventory ID set. |
| [orderableProductsOnly](#orderableproductsonly): [Boolean](TopLevel.Boolean.md) | Get the flag indicating whether unorderable products should be excluded  when the next call to getProducts() is made. |
| [pageMetaTags](#pagemetatags): [Array](TopLevel.Array.md) `(read-only)` | Returns all page meta tags, defined for this instance for which content can be generated. |
| [personalizedSort](#personalizedsort): [Boolean](TopLevel.Boolean.md) `(read-only)` | The method indicates if the search result is ordered by a personalized sorting rule. |
| [priceMax](#pricemax): [Number](TopLevel.Number.md) | Returns the maximum price by which the search result is refined. |
| [priceMin](#pricemin): [Number](TopLevel.Number.md) | Returns the minimum price by which the search result is refined. |
| ~~[productID](#productid): [String](TopLevel.String.md)~~ | Returns the product id that was specified in the search query. |
| [productIDs](#productids): [List](dw.util.List.md) | Returns a list of product IDs that were specified in the search query or an empty list if no product ID set. |
| [productSearchHits](#productsearchhits): [Iterator](dw.util.Iterator.md) `(read-only)` | Returns the product search hits in the search result. |
| ~~[products](#products): [Iterator](dw.util.Iterator.md)~~ `(read-only)` | Returns all products in the search result. |
| [promotionID](#promotionid): [String](TopLevel.String.md) | Returns the promotion id that was specified in the search query or null if no promotion id set. |
| [promotionIDs](#promotionids): [List](dw.util.List.md) | Returns a list of promotion id's that were specified in the search query or an empty list if no promotion id set. |
| [promotionProductType](#promotionproducttype): [String](TopLevel.String.md) | Returns the promotion product type specified in the search query. |
| [recursiveCategorySearch](#recursivecategorysearch): [Boolean](TopLevel.Boolean.md) | Get the flag that determines if the category search will  be recursive. |
| [refinedByCategory](#refinedbycategory): [Boolean](TopLevel.Boolean.md) `(read-only)` | The method returns true, if the search is refined by a category. |
| [refinedByPrice](#refinedbyprice): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if this search has been refined by price. |
| [refinedByPromotion](#refinedbypromotion): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if this search has been refined by promotion. |
| [refinedCategorySearch](#refinedcategorysearch): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if this is a category search and is refined with further  criteria, like a brand refinement or an attribute refinement. |
| [refinementCategory](#refinementcategory): [Category](dw.catalog.Category.md) | Returns the category used to determine possible refinements for the search. |
| [refinements](#refinements): [ProductSearchRefinements](dw.catalog.ProductSearchRefinements.md) `(read-only)` | Returns the ProductSearchRefinements associated with this search and filtered by session currency. |
| [searchPhraseSuggestions](#searchphrasesuggestions): [SearchPhraseSuggestions](dw.suggest.SearchPhraseSuggestions.md) `(read-only)` | Returns search phrase suggestions for the current search phrase. |
| [searchableImageUploadURL](#searchableimageuploadurl): [String](TopLevel.String.md) `(read-only)` | This method returns the URL of the endpoint where the merchants should upload their image for visual search. |
| [sortingRule](#sortingrule): [SortingRule](dw.catalog.SortingRule.md) | Returns the sorting rule explicitly set on this model to be used  to order the products in the results of this query, or `null`  if no rule has been explicitly set. |
| [storeInventoryFilter](#storeinventoryfilter): [StoreInventoryFilter](dw.catalog.StoreInventoryFilter.md) | <p>  Returns the [StoreInventoryFilter](dw.catalog.StoreInventoryFilter.md), which was specified for this search. |
| ~~[suggestedSearchPhrase](#suggestedsearchphrase): [String](TopLevel.String.md)~~ `(read-only)` | Returns the suggested search phrase with the highest accuracy provided  for the current search phrase. |
| ~~[suggestedSearchPhrases](#suggestedsearchphrases): [List](dw.util.List.md)~~ `(read-only)` | Returns a list with up to 5 suggested search phrases provided for the  current search phrase. |
| [trackingEmptySearchesEnabled](#trackingemptysearchesenabled): [Boolean](TopLevel.Boolean.md) `(read-only)` | The method indicates if no-hits search should be tracked for predictive intelligence use. |
| [visualSearch](#visualsearch): [Boolean](TopLevel.Boolean.md) `(read-only)` | The method returns true, if this is a visual search. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [ProductSearchModel](#productsearchmodel)() | Constructs a new ProductSearchModel. |

## Method Summary

| Method | Description |
| --- | --- |
| [addHitTypeRefinement](dw.catalog.ProductSearchModel.md#addhittyperefinementstring)([String...](TopLevel.String.md)) | Set the only search hit types to be included from the search. |
| [excludeHitType](dw.catalog.ProductSearchModel.md#excludehittypestring)([String...](TopLevel.String.md)) | Set the search hit types to be excluded from the search. |
| [getCategory](dw.catalog.ProductSearchModel.md#getcategory)() | Returns the category object for the category id specified in the query. |
| [getCategoryID](dw.catalog.ProductSearchModel.md#getcategoryid)() | Returns the category id that was specified in the search query. |
| [getDeepestCommonCategory](dw.catalog.ProductSearchModel.md#getdeepestcommoncategory)() | Returns the deepest common category of all products in the search result. |
| [getEffectiveSortingRule](dw.catalog.ProductSearchModel.md#geteffectivesortingrule)() | Returns the sorting rule used to order the products in the results of this query,  or `null` if no search has been executed yet. |
| [getInventoryIDs](dw.catalog.ProductSearchModel.md#getinventoryids)() | <p>  Returns a list of inventory IDs that were specified in the search query or an empty list if no inventory ID set. |
| [getOrderableProductsOnly](dw.catalog.ProductSearchModel.md#getorderableproductsonly)() | Get the flag indicating whether unorderable products should be excluded  when the next call to getProducts() is made. |
| [getPageMetaTag](dw.catalog.ProductSearchModel.md#getpagemetatagstring)([String](TopLevel.String.md)) | Returns the page meta tag for the specified id. |
| [getPageMetaTags](dw.catalog.ProductSearchModel.md#getpagemetatags)() | Returns all page meta tags, defined for this instance for which content can be generated. |
| [getPriceMax](dw.catalog.ProductSearchModel.md#getpricemax)() | Returns the maximum price by which the search result is refined. |
| [getPriceMin](dw.catalog.ProductSearchModel.md#getpricemin)() | Returns the minimum price by which the search result is refined. |
| ~~[getProductID](dw.catalog.ProductSearchModel.md#getproductid)()~~ | Returns the product id that was specified in the search query. |
| [getProductIDs](dw.catalog.ProductSearchModel.md#getproductids)() | Returns a list of product IDs that were specified in the search query or an empty list if no product ID set. |
| [getProductSearchHit](dw.catalog.ProductSearchModel.md#getproductsearchhitproduct)([Product](dw.catalog.Product.md)) | Returns the underlying ProductSearchHit for a product, or null if no  ProductSearchHit found for this product. |
| [getProductSearchHits](dw.catalog.ProductSearchModel.md#getproductsearchhits)() | Returns the product search hits in the search result. |
| ~~[getProducts](dw.catalog.ProductSearchModel.md#getproducts)()~~ | Returns all products in the search result. |
| [getPromotionID](dw.catalog.ProductSearchModel.md#getpromotionid)() | Returns the promotion id that was specified in the search query or null if no promotion id set. |
| [getPromotionIDs](dw.catalog.ProductSearchModel.md#getpromotionids)() | Returns a list of promotion id's that were specified in the search query or an empty list if no promotion id set. |
| [getPromotionProductType](dw.catalog.ProductSearchModel.md#getpromotionproducttype)() | Returns the promotion product type specified in the search query. |
| [getRefinementCategory](dw.catalog.ProductSearchModel.md#getrefinementcategory)() | Returns the category used to determine possible refinements for the search. |
| [getRefinements](dw.catalog.ProductSearchModel.md#getrefinements)() | Returns the ProductSearchRefinements associated with this search and filtered by session currency. |
| [getSearchPhraseSuggestions](dw.catalog.ProductSearchModel.md#getsearchphrasesuggestions)() | Returns search phrase suggestions for the current search phrase. |
| [getSearchableImageUploadURL](dw.catalog.ProductSearchModel.md#getsearchableimageuploadurl)() | This method returns the URL of the endpoint where the merchants should upload their image for visual search. |
| [getSortingRule](dw.catalog.ProductSearchModel.md#getsortingrule)() | Returns the sorting rule explicitly set on this model to be used  to order the products in the results of this query, or `null`  if no rule has been explicitly set. |
| [getStoreInventoryFilter](dw.catalog.ProductSearchModel.md#getstoreinventoryfilter)() | <p>  Returns the [StoreInventoryFilter](dw.catalog.StoreInventoryFilter.md), which was specified for this search. |
| ~~[getSuggestedSearchPhrase](dw.catalog.ProductSearchModel.md#getsuggestedsearchphrase)()~~ | Returns the suggested search phrase with the highest accuracy provided  for the current search phrase. |
| ~~[getSuggestedSearchPhrases](dw.catalog.ProductSearchModel.md#getsuggestedsearchphrases)()~~ | Returns a list with up to 5 suggested search phrases provided for the  current search phrase. |
| [isCategorySearch](dw.catalog.ProductSearchModel.md#iscategorysearch)() | The method returns true, if this is a pure search for a category. |
| [isPersonalizedSort](dw.catalog.ProductSearchModel.md#ispersonalizedsort)() | The method indicates if the search result is ordered by a personalized sorting rule. |
| [isRecursiveCategorySearch](dw.catalog.ProductSearchModel.md#isrecursivecategorysearch)() | Get the flag that determines if the category search will  be recursive. |
| [isRefinedByCategory](dw.catalog.ProductSearchModel.md#isrefinedbycategory)() | The method returns true, if the search is refined by a category. |
| [isRefinedByPrice](dw.catalog.ProductSearchModel.md#isrefinedbyprice)() | Identifies if this search has been refined by price. |
| [isRefinedByPriceRange](dw.catalog.ProductSearchModel.md#isrefinedbypricerangenumber-number)([Number](TopLevel.Number.md), [Number](TopLevel.Number.md)) | Identifies if this search has been refined by the given price range. |
| [isRefinedByPromotion](dw.catalog.ProductSearchModel.md#isrefinedbypromotion)() | Identifies if this search has been refined by promotion. |
| [isRefinedByPromotion](dw.catalog.ProductSearchModel.md#isrefinedbypromotionstring)([String](TopLevel.String.md)) | Identifies if this search has been refined by a given promotion. |
| [isRefinedCategorySearch](dw.catalog.ProductSearchModel.md#isrefinedcategorysearch)() | Identifies if this is a category search and is refined with further  criteria, like a brand refinement or an attribute refinement. |
| [isTrackingEmptySearchesEnabled](dw.catalog.ProductSearchModel.md#istrackingemptysearchesenabled)() | The method indicates if no-hits search should be tracked for predictive intelligence use. |
| [isVisualSearch](dw.catalog.ProductSearchModel.md#isvisualsearch)() | The method returns true, if this is a visual search. |
| [search](dw.catalog.ProductSearchModel.md#search)() | Execute the search based on the configured search term, category and filter conditions (price, attribute,  promotion, product type) and return the execution status. |
| [setCategoryID](dw.catalog.ProductSearchModel.md#setcategoryidstring)([String](TopLevel.String.md)) | Specifies the category id used for the search query. |
| [setEnableTrackingEmptySearches](dw.catalog.ProductSearchModel.md#setenabletrackingemptysearchesboolean)([Boolean](TopLevel.Boolean.md)) | Set a flag indicating whether no-hits search should be tracked for predictive intelligence use. |
| [setInventoryListIDs](dw.catalog.ProductSearchModel.md#setinventorylistidslist)([List](dw.util.List.md)) | <p>  Specifies multiple inventory list IDs used for the search query. |
| [setOrderableProductsOnly](dw.catalog.ProductSearchModel.md#setorderableproductsonlyboolean)([Boolean](TopLevel.Boolean.md)) | Set a flag indicating whether unorderable products should be excluded  when the next call to getProducts() is made. |
| [setPriceMax](dw.catalog.ProductSearchModel.md#setpricemaxnumber)([Number](TopLevel.Number.md)) | Sets the maximum price by which the search result is to be refined. |
| [setPriceMin](dw.catalog.ProductSearchModel.md#setpriceminnumber)([Number](TopLevel.Number.md)) | Sets the minimum price by which the search result is to be refined. |
| ~~[setProductID](dw.catalog.ProductSearchModel.md#setproductidstring)([String](TopLevel.String.md))~~ | Specifies the product id used for the search query. |
| [setProductIDs](dw.catalog.ProductSearchModel.md#setproductidslist)([List](dw.util.List.md)) | Specifies multiple product IDs used for the search query. |
| [setPromotionID](dw.catalog.ProductSearchModel.md#setpromotionidstring)([String](TopLevel.String.md)) | Specifies the promotion id used for the search query. |
| [setPromotionIDs](dw.catalog.ProductSearchModel.md#setpromotionidslist)([List](dw.util.List.md)) | Specifies multiple promotion id's used for the search query. |
| [setPromotionProductType](dw.catalog.ProductSearchModel.md#setpromotionproducttypestring)([String](TopLevel.String.md)) | Specifies the promotion product type used for the search query. |
| [setRecursiveCategorySearch](dw.catalog.ProductSearchModel.md#setrecursivecategorysearchboolean)([Boolean](TopLevel.Boolean.md)) | Set a flag to indicate if the search in category should be recursive. |
| [setRefinementCategory](dw.catalog.ProductSearchModel.md#setrefinementcategorycategory)([Category](dw.catalog.Category.md)) | Sets an explicit category to be used when determining refinements. |
| [setSearchableImageID](dw.catalog.ProductSearchModel.md#setsearchableimageidstring)([String](TopLevel.String.md)) | An image ID can be retrieved by uploading an image with a multipart/form-data POST  request to 'https://api.cquotient.com/v3/image/search/upload/{siteID}'. |
| ~~[setSortingCondition](dw.catalog.ProductSearchModel.md#setsortingconditionstring-number)([String](TopLevel.String.md), [Number](TopLevel.Number.md))~~ | Sets or removes a sorting condition for the specified attribute. |
| [setSortingOption](dw.catalog.ProductSearchModel.md#setsortingoptionsortingoption)([SortingOption](dw.catalog.SortingOption.md)) | Sets the sorting option to be used to order the products in the results of this query. |
| [setSortingRule](dw.catalog.ProductSearchModel.md#setsortingrulesortingrule)([SortingRule](dw.catalog.SortingRule.md)) | Sets the sorting rule to be used to order the products in the  results of this query. |
| [setStoreInventoryFilter](dw.catalog.ProductSearchModel.md#setstoreinventoryfilterstoreinventoryfilter)([StoreInventoryFilter](dw.catalog.StoreInventoryFilter.md)) | <p>  Filters the search result by one or more inventory list IDs provided by the class [StoreInventoryFilter](dw.catalog.StoreInventoryFilter.md)  which supports a semantic URL parameter like zip, city, store ... |
| static [urlForCategory](dw.catalog.ProductSearchModel.md#urlforcategoryurl-string)([URL](dw.web.URL.md), [String](TopLevel.String.md)) | Constructs a URL that you can use to execute a query for a specific  Category. |
| static [urlForCategory](dw.catalog.ProductSearchModel.md#urlforcategorystring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Constructs a URL that you can use to execute a query for a specific  Category. |
| static [urlForProduct](dw.catalog.ProductSearchModel.md#urlforproducturl-string-string)([URL](dw.web.URL.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Constructs a URL that you can use to execute a query for a specific  Product. |
| static [urlForProduct](dw.catalog.ProductSearchModel.md#urlforproductstring-string-string)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Constructs a URL that you can use to execute a query for a specific  Product. |
| static [urlForRefine](dw.catalog.ProductSearchModel.md#urlforrefineurl-string-string)([URL](dw.web.URL.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Constructs a URL that you can use to execute a query for a specific  attribute name-value pair. |
| static [urlForRefine](dw.catalog.ProductSearchModel.md#urlforrefinestring-string-string)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Constructs a URL that you can use to execute a query for a specific  attribute name-value pair. |
| [urlRefineCategory](dw.catalog.ProductSearchModel.md#urlrefinecategoryurl-string)([URL](dw.web.URL.md), [String](TopLevel.String.md)) | Constructs a URL that you can use to re-execute the query with a  category refinement. |
| [urlRefineCategory](dw.catalog.ProductSearchModel.md#urlrefinecategorystring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Constructs a URL that you can use to re-execute the query with a  category refinement. |
| [urlRefinePrice](dw.catalog.ProductSearchModel.md#urlrefinepriceurl-number-number)([URL](dw.web.URL.md), [Number](TopLevel.Number.md), [Number](TopLevel.Number.md)) | Constructs a URL that you can use to re-execute the query with an  additional price filter. |
| [urlRefinePrice](dw.catalog.ProductSearchModel.md#urlrefinepricestring-number-number)([String](TopLevel.String.md), [Number](TopLevel.Number.md), [Number](TopLevel.Number.md)) | Constructs a URL that you can use to re-execute the query with an  additional price filter. |
| [urlRefinePromotion](dw.catalog.ProductSearchModel.md#urlrefinepromotionurl-string)([URL](dw.web.URL.md), [String](TopLevel.String.md)) | Constructs a URL that you can use to re-execute the query with a promotion refinement. |
| [urlRefinePromotion](dw.catalog.ProductSearchModel.md#urlrefinepromotionstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Constructs a URL that you can use to re-execute the query with a promotion refinement. |
| [urlRelaxCategory](dw.catalog.ProductSearchModel.md#urlrelaxcategoryurl)([URL](dw.web.URL.md)) | Constructs a URL that you can use to re-execute the query without any  category refinement. |
| [urlRelaxCategory](dw.catalog.ProductSearchModel.md#urlrelaxcategorystring)([String](TopLevel.String.md)) | Constructs a URL that you can use to re-execute the query without any  category refinement. |
| [urlRelaxPrice](dw.catalog.ProductSearchModel.md#urlrelaxpriceurl)([URL](dw.web.URL.md)) | Constructs a URL that you can use to would re-execute the query with no  price filter. |
| [urlRelaxPrice](dw.catalog.ProductSearchModel.md#urlrelaxpricestring)([String](TopLevel.String.md)) | Constructs a URL that you can use to re-execute the query with no price  filter. |
| [urlRelaxPromotion](dw.catalog.ProductSearchModel.md#urlrelaxpromotionurl)([URL](dw.web.URL.md)) | Constructs a URL that you can use to re-execute the query without any promotion refinement. |
| [urlRelaxPromotion](dw.catalog.ProductSearchModel.md#urlrelaxpromotionstring)([String](TopLevel.String.md)) | Constructs a URL that you can use to re-execute the query without any promotion refinement. |
| [urlSortingOption](dw.catalog.ProductSearchModel.md#urlsortingoptionurl-sortingoption)([URL](dw.web.URL.md), [SortingOption](dw.catalog.SortingOption.md)) | Constructs a URL that you can use to re-execute the query but sort  the results by the given storefront sorting option. |
| [urlSortingOption](dw.catalog.ProductSearchModel.md#urlsortingoptionstring-sortingoption)([String](TopLevel.String.md), [SortingOption](dw.catalog.SortingOption.md)) | Constructs a URL that you can use to re-execute the query but sort the  results by the given storefront sorting option. |
| [urlSortingRule](dw.catalog.ProductSearchModel.md#urlsortingruleurl-sortingrule)([URL](dw.web.URL.md), [SortingRule](dw.catalog.SortingRule.md)) | Constructs a URL that you can use to re-execute the query but sort  the results by the given rule. |
| [urlSortingRule](dw.catalog.ProductSearchModel.md#urlsortingrulestring-sortingrule)([String](TopLevel.String.md), [SortingRule](dw.catalog.SortingRule.md)) | Constructs a URL that you can use to re-execute the query but sort the  results by the given rule. |

### Methods inherited from class SearchModel

[addRefinementValues](dw.catalog.SearchModel.md#addrefinementvaluesstring-string), [canRelax](dw.catalog.SearchModel.md#canrelax), [getCount](dw.catalog.SearchModel.md#getcount), [getRefinementMaxValue](dw.catalog.SearchModel.md#getrefinementmaxvaluestring), [getRefinementMinValue](dw.catalog.SearchModel.md#getrefinementminvaluestring), [getRefinementValue](dw.catalog.SearchModel.md#getrefinementvaluestring), [getRefinementValues](dw.catalog.SearchModel.md#getrefinementvaluesstring), [getSearchPhrase](dw.catalog.SearchModel.md#getsearchphrase), [getSearchRedirect](dw.catalog.SearchModel.md#getsearchredirectstring), [getSortingCondition](dw.catalog.SearchModel.md#getsortingconditionstring), [isEmptyQuery](dw.catalog.SearchModel.md#isemptyquery), [isRefinedByAttribute](dw.catalog.SearchModel.md#isrefinedbyattribute), [isRefinedByAttribute](dw.catalog.SearchModel.md#isrefinedbyattributestring), [isRefinedByAttributeValue](dw.catalog.SearchModel.md#isrefinedbyattributevaluestring-string), [isRefinedSearch](dw.catalog.SearchModel.md#isrefinedsearch), [isRefinementByValueRange](dw.catalog.SearchModel.md#isrefinementbyvaluerangestring), [isRefinementByValueRange](dw.catalog.SearchModel.md#isrefinementbyvaluerangestring-string-string), [removeRefinementValues](dw.catalog.SearchModel.md#removerefinementvaluesstring-string), [search](dw.catalog.SearchModel.md#search), [setRefinementValueRange](dw.catalog.SearchModel.md#setrefinementvaluerangestring-string-string), [setRefinementValues](dw.catalog.SearchModel.md#setrefinementvaluesstring-string), [setSearchPhrase](dw.catalog.SearchModel.md#setsearchphrasestring), [setSortingCondition](dw.catalog.SearchModel.md#setsortingconditionstring-number), [url](dw.catalog.SearchModel.md#urlurl), [url](dw.catalog.SearchModel.md#urlstring), [urlDefaultSort](dw.catalog.SearchModel.md#urldefaultsorturl), [urlDefaultSort](dw.catalog.SearchModel.md#urldefaultsortstring), [urlRefineAttribute](dw.catalog.SearchModel.md#urlrefineattributeurl-string-string), [urlRefineAttribute](dw.catalog.SearchModel.md#urlrefineattributestring-string-string), [urlRefineAttributeValue](dw.catalog.SearchModel.md#urlrefineattributevalueurl-string-string), [urlRefineAttributeValue](dw.catalog.SearchModel.md#urlrefineattributevaluestring-string-string), [urlRefineAttributeValueRange](dw.catalog.SearchModel.md#urlrefineattributevaluerangestring-string-string-string), [urlRelaxAttribute](dw.catalog.SearchModel.md#urlrelaxattributeurl-string), [urlRelaxAttribute](dw.catalog.SearchModel.md#urlrelaxattributestring-string), [urlRelaxAttributeValue](dw.catalog.SearchModel.md#urlrelaxattributevalueurl-string-string), [urlRelaxAttributeValue](dw.catalog.SearchModel.md#urlrelaxattributevaluestring-string-string), [urlSort](dw.catalog.SearchModel.md#urlsorturl-string-number), [urlSort](dw.catalog.SearchModel.md#urlsortstring-string-number)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### CATEGORYID_PARAMETER

- CATEGORYID_PARAMETER: [String](TopLevel.String.md) = "cgid"
  - : URL Parameter for the category ID


---

### INVENTORY_LIST_IDS_PARAMETER

- INVENTORY_LIST_IDS_PARAMETER: [String](TopLevel.String.md) = "ilids"
  - : URL Parameter for the inventory list IDs


---

### MAXIMUM_INVENTORY_LIST_IDS

- MAXIMUM_INVENTORY_LIST_IDS: [Number](TopLevel.Number.md) = 10
  - : The maximum number of inventory list IDs that can be passed to [setInventoryListIDs(List)](dw.catalog.ProductSearchModel.md#setinventorylistidslist)


---

### MAXIMUM_PRODUCT_IDS

- MAXIMUM_PRODUCT_IDS: [Number](TopLevel.Number.md) = 30
  - : The maximum number of product IDs that can be passed to [setProductIDs(List)](dw.catalog.ProductSearchModel.md#setproductidslist)


---

### MAXIMUM_STORE_INVENTORY_FILTER_VALUES

- MAXIMUM_STORE_INVENTORY_FILTER_VALUES: [Number](TopLevel.Number.md) = 10
  - : The maximum number of store inventory values for a store inventory filter that can be passed to
      [setStoreInventoryFilter(StoreInventoryFilter)](dw.catalog.ProductSearchModel.md#setstoreinventoryfilterstoreinventoryfilter)



---

### PRICE_MAX_PARAMETER

- PRICE_MAX_PARAMETER: [String](TopLevel.String.md) = "pmax"
  - : URL Parameter for the maximum price


---

### PRICE_MIN_PARAMETER

- PRICE_MIN_PARAMETER: [String](TopLevel.String.md) = "pmin"
  - : URL Parameter for the minimum price


---

### PRODUCTID_PARAMETER

- PRODUCTID_PARAMETER: [String](TopLevel.String.md) = "pid"
  - : URL Parameter for the product ID


---

### PROMOTIONID_PARAMETER

- PROMOTIONID_PARAMETER: [String](TopLevel.String.md) = "pmid"
  - : URL Parameter for the promotion ID


---

### PROMOTION_PRODUCT_TYPE_ALL

- PROMOTION_PRODUCT_TYPE_ALL: [String](TopLevel.String.md) = "all"
  - : constant indicating that all related products should be returned for the next product search by promotion ID


---

### PROMOTION_PRODUCT_TYPE_BONUS

- PROMOTION_PRODUCT_TYPE_BONUS: [String](TopLevel.String.md) = "bonus"
  - : constant indicating that only bonus products should be returned for the next product search by promotion ID. This
      constant should be set using [setPromotionProductType(String)](dw.catalog.ProductSearchModel.md#setpromotionproducttypestring) when using the search model to find the
      available list of bonus products for a Choice of Bonus Product (Rule) promotion, along with
      [setPromotionID(String)](dw.catalog.ProductSearchModel.md#setpromotionidstring).



---

### PROMOTION_PRODUCT_TYPE_DISCOUNTED

- PROMOTION_PRODUCT_TYPE_DISCOUNTED: [String](TopLevel.String.md) = "discounted"
  - : constant indicating that only discounted products should be returned for the next product search by promotion ID


---

### PROMOTION_PRODUCT_TYPE_PARAMETER

- PROMOTION_PRODUCT_TYPE_PARAMETER: [String](TopLevel.String.md) = "pmpt"
  - : URL Parameter for the promotion product type


---

### PROMOTION_PRODUCT_TYPE_QUALIFYING

- PROMOTION_PRODUCT_TYPE_QUALIFYING: [String](TopLevel.String.md) = "qualifying"
  - : constant indicating that only qualifying products should be returned for the next product search by promotion ID


---

### REFINE_NAME_PARAMETER_PREFIX

- REFINE_NAME_PARAMETER_PREFIX: [String](TopLevel.String.md) = "prefn"
  - : URL Parameter prefix for a refinement name


---

### REFINE_VALUE_PARAMETER_PREFIX

- REFINE_VALUE_PARAMETER_PREFIX: [String](TopLevel.String.md) = "prefv"
  - : URL Parameter prefix for a refinement value


---

### SORTING_OPTION_PARAMETER

- SORTING_OPTION_PARAMETER: [String](TopLevel.String.md) = "sopt"
  - : URL Parameter prefix for a sorting option


---

### SORTING_RULE_PARAMETER

- SORTING_RULE_PARAMETER: [String](TopLevel.String.md) = "srule"
  - : URL Parameter prefix for a sorting rule


---

### SORT_BY_PARAMETER_PREFIX

- SORT_BY_PARAMETER_PREFIX: [String](TopLevel.String.md) = "psortb"
  - : URL Parameter prefix for a refinement value


---

### SORT_DIRECTION_PARAMETER_PREFIX

- SORT_DIRECTION_PARAMETER_PREFIX: [String](TopLevel.String.md) = "psortd"
  - : URL Parameter prefix for a refinement value


---

## Property Details

### category
- category: [Category](dw.catalog.Category.md) `(read-only)`
  - : Returns the category object for the category id specified in the query.
      If a category with that id doesn't exist or if the category is offline
      this method returns null.



---

### categoryID
- categoryID: [String](TopLevel.String.md)
  - : Returns the category id that was specified in the search query.


---

### categorySearch
- categorySearch: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : The method returns true, if this is a pure search for a category. The
      method checks, that a category ID is specified and no search phrase is
      specified.



---

### deepestCommonCategory
- deepestCommonCategory: [Category](dw.catalog.Category.md) `(read-only)`
  - : Returns the deepest common category of all products in the search result.
      In case of an empty search result the method returns the root category.



---

### effectiveSortingRule
- effectiveSortingRule: [SortingRule](dw.catalog.SortingRule.md) `(read-only)`
  - : Returns the sorting rule used to order the products in the results of this query,
      or `null` if no search has been executed yet.
      
      In contrast to [getSortingRule()](dw.catalog.ProductSearchModel.md#getsortingrule), this method respects explicit sorting rules and sorting options and rules determined implicitly
      based on the refinement category, keyword sorting rule assignment, etc.



---

### inventoryIDs
- inventoryIDs: [List](dw.util.List.md) `(read-only)`
  - : 
      
      Returns a list of inventory IDs that were specified in the search query or an empty list if no inventory ID set.



---

### orderableProductsOnly
- orderableProductsOnly: [Boolean](TopLevel.Boolean.md)
  - : Get the flag indicating whether unorderable products should be excluded
      when the next call to getProducts() is made. If this value has not been
      previously set, then the value returned will be based on the value of the
      search preference.



---

### pageMetaTags
- pageMetaTags: [Array](TopLevel.Array.md) `(read-only)`
  - : Returns all page meta tags, defined for this instance for which content can be generated.
      
      
      The meta tag content is generated based on the product listing page meta tag context and rules.
      The rules are obtained from the current category context or inherited from the parent category,
      up to the root category.



---

### personalizedSort
- personalizedSort: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : The method indicates if the search result is ordered by a personalized sorting rule.


---

### priceMax
- priceMax: [Number](TopLevel.Number.md)
  - : Returns the maximum price by which the search result is refined.


---

### priceMin
- priceMin: [Number](TopLevel.Number.md)
  - : Returns the minimum price by which the search result is refined.


---

### productID
- ~~productID: [String](TopLevel.String.md)~~
  - : Returns the product id that was specified in the search query.

    **Deprecated:**
:::warning
Please use [getProductIDs()](dw.catalog.ProductSearchModel.md#getproductids) instead
:::

---

### productIDs
- productIDs: [List](dw.util.List.md)
  - : Returns a list of product IDs that were specified in the search query or an empty list if no product ID set.


---

### productSearchHits
- productSearchHits: [Iterator](dw.util.Iterator.md) `(read-only)`
  - : Returns the product search hits in the search result. 
      
      Note that method does also return search hits representing products that
      were removed or went offline since the last index update, i.e. you must
      implement appropriate checks before accessing the product related to the
      search hit instance (see [ProductSearchHit.getProduct()](dw.catalog.ProductSearchHit.md#getproduct))


    **See Also:**
    - [getProducts()](dw.catalog.ProductSearchModel.md#getproducts)


---

### products
- ~~products: [Iterator](dw.util.Iterator.md)~~ `(read-only)`
  - : Returns all products in the search result. 
      
      Note that products that were removed or went offline since the last index
      update are not included in the returned set.


    **See Also:**
    - [getProductSearchHits()](dw.catalog.ProductSearchModel.md#getproductsearchhits)

    **Deprecated:**
:::warning
This method should not be used because loading Products for each result of a product search is
            extremely expensive performance-wise. Please use [getProductSearchHits()](dw.catalog.ProductSearchModel.md#getproductsearchhits) to iterate
            ProductSearchHits instead.

:::

---

### promotionID
- promotionID: [String](TopLevel.String.md)
  - : Returns the promotion id that was specified in the search query or null if no promotion id set. If multiple
      promotion id's specified the method returns only the first id. See [setPromotionIDs(List)](dw.catalog.ProductSearchModel.md#setpromotionidslist) and
      [getPromotionIDs()](dw.catalog.ProductSearchModel.md#getpromotionids).



---

### promotionIDs
- promotionIDs: [List](dw.util.List.md)
  - : Returns a list of promotion id's that were specified in the search query or an empty list if no promotion id set.


---

### promotionProductType
- promotionProductType: [String](TopLevel.String.md)
  - : Returns the promotion product type specified in the search query.


---

### recursiveCategorySearch
- recursiveCategorySearch: [Boolean](TopLevel.Boolean.md)
  - : Get the flag that determines if the category search will
      be recursive.



---

### refinedByCategory
- refinedByCategory: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : The method returns true, if the search is refined by a category.
      The method checks, that a category ID is specified.



---

### refinedByPrice
- refinedByPrice: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if this search has been refined by price.


---

### refinedByPromotion
- refinedByPromotion: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if this search has been refined by promotion.


---

### refinedCategorySearch
- refinedCategorySearch: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if this is a category search and is refined with further
      criteria, like a brand refinement or an attribute refinement.



---

### refinementCategory
- refinementCategory: [Category](dw.catalog.Category.md)
  - : Returns the category used to determine possible refinements for the search.
      If an explicit category was set for this purpose using [setRefinementCategory(Category)](dw.catalog.ProductSearchModel.md#setrefinementcategorycategory), it is returned.
      Otherwise, the deepest common category of all search results will be returned.



---

### refinements
- refinements: [ProductSearchRefinements](dw.catalog.ProductSearchRefinements.md) `(read-only)`
  - : Returns the ProductSearchRefinements associated with this search and filtered by session currency.
      If an explicit category was set for this purpose using [setRefinementCategory(Category)](dw.catalog.ProductSearchModel.md#setrefinementcategorycategory), it will be used to determine the refinements.
      Otherwise, the refinements are determined based on the deepest common category of all products in the search result.
      Hint: If you want to use the same refinements for all searches, consider defining them in one category (usually root) and using [setRefinementCategory(Category)](dw.catalog.ProductSearchModel.md#setrefinementcategorycategory) to avoid unnecessary calculation of the deepest common category.



---

### searchPhraseSuggestions
- searchPhraseSuggestions: [SearchPhraseSuggestions](dw.suggest.SearchPhraseSuggestions.md) `(read-only)`
  - : Returns search phrase suggestions for the current search phrase.
      Search phrase suggestions may contain alternative search phrases as well
      as lists of corrected and completed search terms.



---

### searchableImageUploadURL
- searchableImageUploadURL: [String](TopLevel.String.md) `(read-only)`
  - : This method returns the URL of the endpoint where the merchants should upload their image for visual search.


---

### sortingRule
- sortingRule: [SortingRule](dw.catalog.SortingRule.md)
  - : Returns the sorting rule explicitly set on this model to be used
      to order the products in the results of this query, or `null`
      if no rule has been explicitly set.
      
      This method does not return the sorting rule that will be used implicitly
      based on the context of the search, such as the refinement category.



---

### storeInventoryFilter
- storeInventoryFilter: [StoreInventoryFilter](dw.catalog.StoreInventoryFilter.md)
  - : 
      
      Returns the [StoreInventoryFilter](dw.catalog.StoreInventoryFilter.md), which was specified for this search.



---

### suggestedSearchPhrase
- ~~suggestedSearchPhrase: [String](TopLevel.String.md)~~ `(read-only)`
  - : Returns the suggested search phrase with the highest accuracy provided
      for the current search phrase.


    **Deprecated:**
:::warning
Please use [getSearchPhraseSuggestions()](dw.catalog.ProductSearchModel.md#getsearchphrasesuggestions) instead
:::

---

### suggestedSearchPhrases
- ~~suggestedSearchPhrases: [List](dw.util.List.md)~~ `(read-only)`
  - : Returns a list with up to 5 suggested search phrases provided for the
      current search phrase. It is possible that less than 5 suggestions
      or even no suggestions are returned.


    **Deprecated:**
:::warning
Please use [getSearchPhraseSuggestions()](dw.catalog.ProductSearchModel.md#getsearchphrasesuggestions) instead
:::

---

### trackingEmptySearchesEnabled
- trackingEmptySearchesEnabled: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : The method indicates if no-hits search should be tracked for predictive intelligence use.


---

### visualSearch
- visualSearch: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : The method returns true, if this is a visual search. The
      method checks that a image UUID is specified.



---

## Constructor Details

### ProductSearchModel()
- ProductSearchModel()
  - : Constructs a new ProductSearchModel.


---

## Method Details

### addHitTypeRefinement(String...)
- addHitTypeRefinement(types: [String...](TopLevel.String.md)): void
  - : Set the only search hit types to be included from the search. Values accepted are the 'hit type' constants
      exposed in the [ProductSearchHit](dw.catalog.ProductSearchHit.md) class. Overwrites any hit type refinements set from prior calls to
      addHitTypeRefinement(String...) or excludeHitType(String...).


    **Parameters:**
    - types - to be included.


---

### excludeHitType(String...)
- excludeHitType(types: [String...](TopLevel.String.md)): void
  - : Set the search hit types to be excluded from the search. Values accepted are the 'hit type' constants exposed in
      the [ProductSearchHit](dw.catalog.ProductSearchHit.md) class. Overwrites any hit type refinements set from prior calls to
      addHitTypeRefinement(String...) or excludeHitType(String...).


    **Parameters:**
    - types - to be excluded.


---

### getCategory()
- getCategory(): [Category](dw.catalog.Category.md)
  - : Returns the category object for the category id specified in the query.
      If a category with that id doesn't exist or if the category is offline
      this method returns null.


    **Returns:**
    - the category object for the category id specified in the query.


---

### getCategoryID()
- getCategoryID(): [String](TopLevel.String.md)
  - : Returns the category id that was specified in the search query.

    **Returns:**
    - the category id that was specified in the search query.


---

### getDeepestCommonCategory()
- getDeepestCommonCategory(): [Category](dw.catalog.Category.md)
  - : Returns the deepest common category of all products in the search result.
      In case of an empty search result the method returns the root category.


    **Returns:**
    - the deepest common category of all products in the search result of this search model or root for an empty search result.


---

### getEffectiveSortingRule()
- getEffectiveSortingRule(): [SortingRule](dw.catalog.SortingRule.md)
  - : Returns the sorting rule used to order the products in the results of this query,
      or `null` if no search has been executed yet.
      
      In contrast to [getSortingRule()](dw.catalog.ProductSearchModel.md#getsortingrule), this method respects explicit sorting rules and sorting options and rules determined implicitly
      based on the refinement category, keyword sorting rule assignment, etc.


    **Returns:**
    - a SortingRule or null.


---

### getInventoryIDs()
- getInventoryIDs(): [List](dw.util.List.md)
  - : 
      
      Returns a list of inventory IDs that were specified in the search query or an empty list if no inventory ID set.


    **Returns:**
    - the list of inventory IDs that were specified in the search query or an empty list if no
                      inventory ID set.



---

### getOrderableProductsOnly()
- getOrderableProductsOnly(): [Boolean](TopLevel.Boolean.md)
  - : Get the flag indicating whether unorderable products should be excluded
      when the next call to getProducts() is made. If this value has not been
      previously set, then the value returned will be based on the value of the
      search preference.


    **Returns:**
    - true if unorderable products should be excluded from product
              search results, false otherwise.



---

### getPageMetaTag(String)
- getPageMetaTag(id: [String](TopLevel.String.md)): [PageMetaTag](dw.web.PageMetaTag.md)
  - : Returns the page meta tag for the specified id.
      
      
      The meta tag content is generated based on the product listing page meta tag context and rule.
      The rule is obtained from the current category context or inherited from the parent category,
      up to the root category.
      
      
      Null will be returned if the meta tag is undefined on the current instance, or if no rule can be found for the
      current context, or if the rule resolves to an empty string.


    **Parameters:**
    - id - the ID to get the page meta tag for

    **Returns:**
    - page meta tag containing content generated based on rules


---

### getPageMetaTags()
- getPageMetaTags(): [Array](TopLevel.Array.md)
  - : Returns all page meta tags, defined for this instance for which content can be generated.
      
      
      The meta tag content is generated based on the product listing page meta tag context and rules.
      The rules are obtained from the current category context or inherited from the parent category,
      up to the root category.


    **Returns:**
    - page meta tags defined for this instance, containing content generated based on rules


---

### getPriceMax()
- getPriceMax(): [Number](TopLevel.Number.md)
  - : Returns the maximum price by which the search result is refined.

    **Returns:**
    - the maximum price by which the search result is refined.


---

### getPriceMin()
- getPriceMin(): [Number](TopLevel.Number.md)
  - : Returns the minimum price by which the search result is refined.

    **Returns:**
    - the minimum price by which the search result is refined.


---

### getProductID()
- ~~getProductID(): [String](TopLevel.String.md)~~
  - : Returns the product id that was specified in the search query.

    **Returns:**
    - the product id that was specified in the search.

    **Deprecated:**
:::warning
Please use [getProductIDs()](dw.catalog.ProductSearchModel.md#getproductids) instead
:::

---

### getProductIDs()
- getProductIDs(): [List](dw.util.List.md)
  - : Returns a list of product IDs that were specified in the search query or an empty list if no product ID set.

    **Returns:**
    - the list of product IDs that were specified in the search query or an empty list if no product ID set.


---

### getProductSearchHit(Product)
- getProductSearchHit(product: [Product](dw.catalog.Product.md)): [ProductSearchHit](dw.catalog.ProductSearchHit.md)
  - : Returns the underlying ProductSearchHit for a product, or null if no
      ProductSearchHit found for this product.


    **Parameters:**
    - product - the product to find the underlying ProductSearchHit

    **Returns:**
    - the underlying ProductSearchHit for a product, or null if no
              ProductSearchHit found for this product.



---

### getProductSearchHits()
- getProductSearchHits(): [Iterator](dw.util.Iterator.md)
  - : Returns the product search hits in the search result. 
      
      Note that method does also return search hits representing products that
      were removed or went offline since the last index update, i.e. you must
      implement appropriate checks before accessing the product related to the
      search hit instance (see [ProductSearchHit.getProduct()](dw.catalog.ProductSearchHit.md#getproduct))


    **Returns:**
    - Products hits in search result

    **See Also:**
    - [getProducts()](dw.catalog.ProductSearchModel.md#getproducts)


---

### getProducts()
- ~~getProducts(): [Iterator](dw.util.Iterator.md)~~
  - : Returns all products in the search result. 
      
      Note that products that were removed or went offline since the last index
      update are not included in the returned set.


    **Returns:**
    - Products in search result

    **See Also:**
    - [getProductSearchHits()](dw.catalog.ProductSearchModel.md#getproductsearchhits)

    **Deprecated:**
:::warning
This method should not be used because loading Products for each result of a product search is
            extremely expensive performance-wise. Please use [getProductSearchHits()](dw.catalog.ProductSearchModel.md#getproductsearchhits) to iterate
            ProductSearchHits instead.

:::

---

### getPromotionID()
- getPromotionID(): [String](TopLevel.String.md)
  - : Returns the promotion id that was specified in the search query or null if no promotion id set. If multiple
      promotion id's specified the method returns only the first id. See [setPromotionIDs(List)](dw.catalog.ProductSearchModel.md#setpromotionidslist) and
      [getPromotionIDs()](dw.catalog.ProductSearchModel.md#getpromotionids).


    **Returns:**
    - the promotion id that was specified in the search query or null if no promotion id set.


---

### getPromotionIDs()
- getPromotionIDs(): [List](dw.util.List.md)
  - : Returns a list of promotion id's that were specified in the search query or an empty list if no promotion id set.

    **Returns:**
    - the list of promotion id's that was specified in the search query or an empty list if no promotion id set.


---

### getPromotionProductType()
- getPromotionProductType(): [String](TopLevel.String.md)
  - : Returns the promotion product type specified in the search query.

    **Returns:**
    - the promotion product type that was specified in the search
              query.



---

### getRefinementCategory()
- getRefinementCategory(): [Category](dw.catalog.Category.md)
  - : Returns the category used to determine possible refinements for the search.
      If an explicit category was set for this purpose using [setRefinementCategory(Category)](dw.catalog.ProductSearchModel.md#setrefinementcategorycategory), it is returned.
      Otherwise, the deepest common category of all search results will be returned.


    **Returns:**
    - the category used to determine refinements.


---

### getRefinements()
- getRefinements(): [ProductSearchRefinements](dw.catalog.ProductSearchRefinements.md)
  - : Returns the ProductSearchRefinements associated with this search and filtered by session currency.
      If an explicit category was set for this purpose using [setRefinementCategory(Category)](dw.catalog.ProductSearchModel.md#setrefinementcategorycategory), it will be used to determine the refinements.
      Otherwise, the refinements are determined based on the deepest common category of all products in the search result.
      Hint: If you want to use the same refinements for all searches, consider defining them in one category (usually root) and using [setRefinementCategory(Category)](dw.catalog.ProductSearchModel.md#setrefinementcategorycategory) to avoid unnecessary calculation of the deepest common category.


    **Returns:**
    - the ProductSearchRefinements associated with this search.


---

### getSearchPhraseSuggestions()
- getSearchPhraseSuggestions(): [SearchPhraseSuggestions](dw.suggest.SearchPhraseSuggestions.md)
  - : Returns search phrase suggestions for the current search phrase.
      Search phrase suggestions may contain alternative search phrases as well
      as lists of corrected and completed search terms.


    **Returns:**
    - search phrase suggestions for the current search phrase


---

### getSearchableImageUploadURL()
- getSearchableImageUploadURL(): [String](TopLevel.String.md)
  - : This method returns the URL of the endpoint where the merchants should upload their image for visual search.

    **Returns:**
    - returns the URL where the merchants should upload their image.

    **Throws:**
    - RuntimeException - 


---

### getSortingRule()
- getSortingRule(): [SortingRule](dw.catalog.SortingRule.md)
  - : Returns the sorting rule explicitly set on this model to be used
      to order the products in the results of this query, or `null`
      if no rule has been explicitly set.
      
      This method does not return the sorting rule that will be used implicitly
      based on the context of the search, such as the refinement category.


    **Returns:**
    - a SortingRule or null.


---

### getStoreInventoryFilter()
- getStoreInventoryFilter(): [StoreInventoryFilter](dw.catalog.StoreInventoryFilter.md)
  - : 
      
      Returns the [StoreInventoryFilter](dw.catalog.StoreInventoryFilter.md), which was specified for this search.


    **Returns:**
    - the [StoreInventoryFilter](dw.catalog.StoreInventoryFilter.md), which was specified for this search.


---

### getSuggestedSearchPhrase()
- ~~getSuggestedSearchPhrase(): [String](TopLevel.String.md)~~
  - : Returns the suggested search phrase with the highest accuracy provided
      for the current search phrase.


    **Returns:**
    - the suggested search phrase.

    **Deprecated:**
:::warning
Please use [getSearchPhraseSuggestions()](dw.catalog.ProductSearchModel.md#getsearchphrasesuggestions) instead
:::

---

### getSuggestedSearchPhrases()
- ~~getSuggestedSearchPhrases(): [List](dw.util.List.md)~~
  - : Returns a list with up to 5 suggested search phrases provided for the
      current search phrase. It is possible that less than 5 suggestions
      or even no suggestions are returned.


    **Returns:**
    - a list containing the suggested search phrases.

    **Deprecated:**
:::warning
Please use [getSearchPhraseSuggestions()](dw.catalog.ProductSearchModel.md#getsearchphrasesuggestions) instead
:::

---

### isCategorySearch()
- isCategorySearch(): [Boolean](TopLevel.Boolean.md)
  - : The method returns true, if this is a pure search for a category. The
      method checks, that a category ID is specified and no search phrase is
      specified.


    **Returns:**
    - True if this is a category search


---

### isPersonalizedSort()
- isPersonalizedSort(): [Boolean](TopLevel.Boolean.md)
  - : The method indicates if the search result is ordered by a personalized sorting rule.

    **Returns:**
    - true if search result is ordered by a personalized sorting rule, otherwise false.


---

### isRecursiveCategorySearch()
- isRecursiveCategorySearch(): [Boolean](TopLevel.Boolean.md)
  - : Get the flag that determines if the category search will
      be recursive.


    **Returns:**
    - true if the category search will be recursive, false otherwise


---

### isRefinedByCategory()
- isRefinedByCategory(): [Boolean](TopLevel.Boolean.md)
  - : The method returns true, if the search is refined by a category.
      The method checks, that a category ID is specified.


    **Returns:**
    - true, if the search is refined by a category, false otherwise.


---

### isRefinedByPrice()
- isRefinedByPrice(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if this search has been refined by price.

    **Returns:**
    - True if the search is refined by price, false otherwise.


---

### isRefinedByPriceRange(Number, Number)
- isRefinedByPriceRange(priceMin: [Number](TopLevel.Number.md), priceMax: [Number](TopLevel.Number.md)): [Boolean](TopLevel.Boolean.md)
  - : Identifies if this search has been refined by the given price range.
      Either range parameters may be null to represent open ranges.


    **Parameters:**
    - priceMin - The lower bound of the price range.
    - priceMax - The upper bound of the price range.

    **Returns:**
    - True if the search is refinemd on the given price range, false
              otherwise.



---

### isRefinedByPromotion()
- isRefinedByPromotion(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if this search has been refined by promotion.

    **Returns:**
    - True if the search is refined by promotion, false otherwise.


---

### isRefinedByPromotion(String)
- isRefinedByPromotion(promotionID: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Identifies if this search has been refined by a given promotion.

    **Parameters:**
    - promotionID - the ID of the promotion to check

    **Returns:**
    - True if the search is refined by the given promotionID, false otherwise.


---

### isRefinedCategorySearch()
- isRefinedCategorySearch(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if this is a category search and is refined with further
      criteria, like a brand refinement or an attribute refinement.


    **Returns:**
    - true if this is a category search and is refined with further
              criteria, false otherwise.



---

### isTrackingEmptySearchesEnabled()
- isTrackingEmptySearchesEnabled(): [Boolean](TopLevel.Boolean.md)
  - : The method indicates if no-hits search should be tracked for predictive intelligence use.

    **Returns:**
    - true, if no-hits search should be tracked, otherwise false.


---

### isVisualSearch()
- isVisualSearch(): [Boolean](TopLevel.Boolean.md)
  - : The method returns true, if this is a visual search. The
      method checks that a image UUID is specified.


    **Returns:**
    - True if this is a visual search


---

### search()
- search(): [SearchStatus](dw.system.SearchStatus.md)
  - : Execute the search based on the configured search term, category and filter conditions (price, attribute,
      promotion, product type) and return the execution status. The execution of an empty ProductSearchModel without
      any search term or filter criteria will not be supported and the search status [SearchStatus.EMPTY_QUERY](dw.system.SearchStatus.md#empty_query)
      will be returned. A usage of the internal category id 'root' as category filter is not recommended, could cause
      performance issues and will be potentially deprecated in a future release. A successful execution will be
      indicated by [SearchStatus.SUCCESSFUL](dw.system.SearchStatus.md#successful) or [SearchStatus.LIMITED](dw.system.SearchStatus.md#limited). For other possible search
      statuses see [SearchStatus](dw.system.SearchStatus.md). The sorted and grouped search result of a successful execution can be fetched
      via [getProductSearchHits()](dw.catalog.ProductSearchModel.md#getproductsearchhits) and the refinement options based on the search result can be obtained via
      [getRefinements()](dw.catalog.ProductSearchModel.md#getrefinements) and [SearchModel.getRefinementValues(String)](dw.catalog.SearchModel.md#getrefinementvaluesstring).


    **Returns:**
    - the searchStatus object with search status code and description of search result.


---

### setCategoryID(String)
- setCategoryID(categoryID: [String](TopLevel.String.md)): void
  - : Specifies the category id used for the search query.

    **Parameters:**
    - categoryID - the category id for the search query.


---

### setEnableTrackingEmptySearches(Boolean)
- setEnableTrackingEmptySearches(trackingEmptySearches: [Boolean](TopLevel.Boolean.md)): void
  - : Set a flag indicating whether no-hits search should be tracked for predictive intelligence use.

    **Parameters:**
    - trackingEmptySearches - true, no-hits search should be tracked, false, otherwise.


---

### setInventoryListIDs(List)
- setInventoryListIDs(inventoryListIDs: [List](dw.util.List.md)): void
  - : 
      
      Specifies multiple inventory list IDs used for the search query. The method supports up to
      [MAXIMUM_INVENTORY_LIST_IDS](dw.catalog.ProductSearchModel.md#maximum_inventory_list_ids) inventory IDs. If more than [MAXIMUM_INVENTORY_LIST_IDS](dw.catalog.ProductSearchModel.md#maximum_inventory_list_ids) inventory IDs
      used the method throws an IllegalArgumentException.


    **Parameters:**
    - inventoryListIDs - the inventory IDs for the search query.

    **Throws:**
    - IllegalArgumentException - if more than [MAXIMUM_INVENTORY_LIST_IDS](dw.catalog.ProductSearchModel.md#maximum_inventory_list_ids) inventory IDs used


---

### setOrderableProductsOnly(Boolean)
- setOrderableProductsOnly(orderableOnly: [Boolean](TopLevel.Boolean.md)): void
  - : Set a flag indicating whether unorderable products should be excluded
      when the next call to getProducts() is made. This method overrides the
      default behavior which is controlled by the search preference.


    **Parameters:**
    - orderableOnly - true if unorderable products should be excluded from             product search results, false otherwise.


---

### setPriceMax(Number)
- setPriceMax(priceMax: [Number](TopLevel.Number.md)): void
  - : Sets the maximum price by which the search result is to be refined.

    **Parameters:**
    - priceMax - sets the maximum price by which the search result is to be refined.


---

### setPriceMin(Number)
- setPriceMin(priceMin: [Number](TopLevel.Number.md)): void
  - : Sets the minimum price by which the search result is to be refined.

    **Parameters:**
    - priceMin - the minimum price by which the search result is to be refined.


---

### setProductID(String)
- ~~setProductID(productID: [String](TopLevel.String.md)): void~~
  - : Specifies the product id used for the search query.

    **Parameters:**
    - productID - the product id for the search query.

    **Deprecated:**
:::warning
Please use [setProductIDs(List)](dw.catalog.ProductSearchModel.md#setproductidslist) instead
:::

---

### setProductIDs(List)
- setProductIDs(productIDs: [List](dw.util.List.md)): void
  - : Specifies multiple product IDs used for the search query. The specified product IDs include, but not limited to,
      variant product IDs, product master IDs, variation group IDs, product set IDs, or product bundle IDs. For
      example, this API could be used in high-traffic pages where developers need to be able to filter quickly for only
      available child products of a specified master product, instead of looping through all variants of a set products
      and checking their availabilities. The method supports up to [MAXIMUM_PRODUCT_IDS](dw.catalog.ProductSearchModel.md#maximum_product_ids) product IDs. If more
      than [MAXIMUM_PRODUCT_IDS](dw.catalog.ProductSearchModel.md#maximum_product_ids) products IDs are passed, the method throws an IllegalArgumentException.


    **Parameters:**
    - productIDs - the product IDs for the search query.

    **Throws:**
    - IllegalArgumentException - if more than [MAXIMUM_PRODUCT_IDS](dw.catalog.ProductSearchModel.md#maximum_product_ids) product IDs used


---

### setPromotionID(String)
- setPromotionID(promotionID: [String](TopLevel.String.md)): void
  - : Specifies the promotion id used for the search query.

    **Parameters:**
    - promotionID - the promotion id for the search query.


---

### setPromotionIDs(List)
- setPromotionIDs(promotionIDs: [List](dw.util.List.md)): void
  - : Specifies multiple promotion id's used for the search query. The method supports up to 30 promotion id's. If more
      than 30 promotion id's used the method throws an IllegalArgumentException.


    **Parameters:**
    - promotionIDs - the promotion ids for the search query.

    **Throws:**
    - IllegalArgumentException - if more than 30 promotion id's used


---

### setPromotionProductType(String)
- setPromotionProductType(promotionProductType: [String](TopLevel.String.md)): void
  - : Specifies the promotion product type used for the search query. This
      value is only relevant for searches by promotion ID.


    **Parameters:**
    - promotionProductType - The type of product to filter by when             searching by promotion ID. Allowed values are             PROMOTION\_PRODUCT\_TYPE\_ALL, PROMOTION\_PRODUCT\_TYPE\_BONUS,             PROMOTION\_PRODUCT\_TYPE\_QUALIFYING, and             PROMOTION\_PRODUCT\_TYPE\_DISCOUNTED. If null is passed, or             an invalid value is passed, the search will use             PROMOTION\_PRODUCT\_TYPE\_ALL.


---

### setRecursiveCategorySearch(Boolean)
- setRecursiveCategorySearch(recurse: [Boolean](TopLevel.Boolean.md)): void
  - : Set a flag to indicate if the search in category should be recursive.

    **Parameters:**
    - recurse - recurse the category in the search


---

### setRefinementCategory(Category)
- setRefinementCategory(refinementCategory: [Category](dw.catalog.Category.md)): void
  - : Sets an explicit category to be used when determining refinements. If this is not done, they will be determined based on the deepest common category of all search results.
      The explicit category must be in the site's storefront catalog, otherwise the method fails with an IllegalArgumentException.


    **Parameters:**
    - refinementCategory - the category used to determine the applicable refinements.

    **Throws:**
    - IllegalArgumentException - if the refinement category does not reside in the storefront catalog


---

### setSearchableImageID(String)
- setSearchableImageID(imageID: [String](TopLevel.String.md)): void
  - : An image ID can be retrieved by uploading an image with a multipart/form-data POST
      request to 'https://api.cquotient.com/v3/image/search/upload/{siteID}'. This method sets product IDs retrieved
      from the image ID to the ProductSearchModel. If using [setProductIDs(List)](dw.catalog.ProductSearchModel.md#setproductidslist) in addition to this method,
      the ProductSearchModel will take the intersection of these sets of product IDs. If the image ID provided is
      invalid or expired, product IDs will not be set onto the product search model.


    **Parameters:**
    - imageID - the image ID for the visual search query.

    **Throws:**
    - RuntimeException - if product IDs for the provided image could not be set.


---

### setSortingCondition(String, Number)
- ~~setSortingCondition(attributeID: [String](TopLevel.String.md), direction: [Number](TopLevel.Number.md)): void~~
  - : Sets or removes a sorting condition for the specified attribute. Specify
      either SORT\_DIRECTION\_ASCENDING or SORT\_DIRECTION\_DESCENDING to set a
      sorting condition. Specify SORT\_DIRECTION\_NONE to remove a sorting
      condition from the attribute.


    **Parameters:**
    - attributeID - the attribute ID
    - direction - SORT\_DIRECTION\_ASCENDING, SORT\_DIRECTION\_DESCENDING or             SORT\_DIRECTION\_NONE

    **Deprecated:**
:::warning
This method is subject to removal. Use [setSortingRule(SortingRule)](dw.catalog.ProductSearchModel.md#setsortingrulesortingrule) instead.
:::

---

### setSortingOption(SortingOption)
- setSortingOption(option: [SortingOption](dw.catalog.SortingOption.md)): void
  - : Sets the sorting option to be used to order the products in the results of this query.
      If a sorting rule is also set, the sorting option is ignored.


    **Parameters:**
    - option - the SortingOption to use to sort the products


---

### setSortingRule(SortingRule)
- setSortingRule(rule: [SortingRule](dw.catalog.SortingRule.md)): void
  - : Sets the sorting rule to be used to order the products in the
      results of this query.  Setting the rule in this way overrides the
      default behavior of choosing the sorting rule based on the context of the
      search, such as the refinement category.


    **Parameters:**
    - rule - the SortingRule to use to sort the products


---

### setStoreInventoryFilter(StoreInventoryFilter)
- setStoreInventoryFilter(storeInventoryFilter: [StoreInventoryFilter](dw.catalog.StoreInventoryFilter.md)): void
  - : 
      
      Filters the search result by one or more inventory list IDs provided by the class [StoreInventoryFilter](dw.catalog.StoreInventoryFilter.md)
      which supports a semantic URL parameter like zip, city, store ... and a list of [StoreInventoryFilterValue](dw.catalog.StoreInventoryFilterValue.md)
      which maps the semantic inventory list id value like Burlington, Boston, ... to a real inventory list id like
      'Burlington -> inventory1', 'Boston -> inventory2'. The search will filter the result by the real inventory list
      id(s) but will use the semantic URL parameter and semantic inventory list id values for URL generation via all
      URLRefine and URLRelax methods e.g. for [urlRefineCategory(URL, String)](dw.catalog.ProductSearchModel.md#urlrefinecategoryurl-string), [urlRelaxPrice(URL)](dw.catalog.ProductSearchModel.md#urlrelaxpriceurl),
      [SearchModel.urlRefineAttribute(String, String, String)](dw.catalog.SearchModel.md#urlrefineattributestring-string-string).
      
      
      Example custom URL: city=Burlington|Boston
      
      
      
      ```
      var storeFilter = new dw.catalog.StoreInventoryFilter("city",
          new dw.util.ArrayList(
              new dw.catalog.StoreInventoryFilterValue("Burlington","inventory_store_store9"),
              new dw.catalog.StoreInventoryFilterValue("Boston","inventory_store_store8")
      ));
      searchModel.setStoreInventoryFilter(filter)
      ```


    **Parameters:**
    - storeInventoryFilter - The [StoreInventoryFilter](dw.catalog.StoreInventoryFilter.md) instance to filter the search result by one or more                              inventory IDs with semantic key and semantic value support.

    **Throws:**
    - IllegalArgumentException - if more than [MAXIMUM_STORE_INVENTORY_FILTER_VALUES](dw.catalog.ProductSearchModel.md#maximum_store_inventory_filter_values) filter values                                        used


---

### urlForCategory(URL, String)
- static urlForCategory(url: [URL](dw.web.URL.md), cgid: [String](TopLevel.String.md)): [URL](dw.web.URL.md)
  - : Constructs a URL that you can use to execute a query for a specific
      Category. The search specific parameters are appended to the provided
      URL. The URL is typically generated with one of the URLUtils methods.


    **Parameters:**
    - url - the URL to use to generate the new URL.
    - cgid - the category ID.

    **Returns:**
    - the new URL.


---

### urlForCategory(String, String)
- static urlForCategory(action: [String](TopLevel.String.md), cgid: [String](TopLevel.String.md)): [URL](dw.web.URL.md)
  - : Constructs a URL that you can use to execute a query for a specific
      Category.
      
      The generated URL will be an absolute URL which uses the protocol of
      the current request.


    **Parameters:**
    - action - pipeline action, e.g. 'Search-Show'.
    - cgid - the category ID.

    **Returns:**
    - the new URL.


---

### urlForProduct(URL, String, String)
- static urlForProduct(url: [URL](dw.web.URL.md), cgid: [String](TopLevel.String.md), pid: [String](TopLevel.String.md)): [URL](dw.web.URL.md)
  - : Constructs a URL that you can use to execute a query for a specific
      Product. The passed url can be either a full url or just the name for a
      pipeline. In the later case a relative URL is created.


    **Parameters:**
    - url - the URL to use to generate the new URL.
    - cgid - the category id or null if product is not in category             context.
    - pid - the product id.

    **Returns:**
    - the new URL.


---

### urlForProduct(String, String, String)
- static urlForProduct(action: [String](TopLevel.String.md), cgid: [String](TopLevel.String.md), pid: [String](TopLevel.String.md)): [URL](dw.web.URL.md)
  - : Constructs a URL that you can use to execute a query for a specific
      Product. The passed action is used to build an initial url. All search
      specific attributes are appended.
      
      The generated URL will be an absolute URL which uses the protocol of
      the current request.


    **Parameters:**
    - action - pipeline action, e.g. 'Search-Show'.
    - cgid - the category id or null if product is not in category             context.
    - pid - the product id.

    **Returns:**
    - the new URL.


---

### urlForRefine(URL, String, String)
- static urlForRefine(url: [URL](dw.web.URL.md), attributeID: [String](TopLevel.String.md), value: [String](TopLevel.String.md)): [URL](dw.web.URL.md)
  - : Constructs a URL that you can use to execute a query for a specific
      attribute name-value pair. The search specific parameters are appended to
      the provided URL. The URL is typically generated with one of the URLUtils
      methods.


    **Parameters:**
    - url - the URL to use to generate the new URL.
    - attributeID - the attribute ID for the refinement.
    - value - the attribute value for the refinement.

    **Returns:**
    - the new URL.


---

### urlForRefine(String, String, String)
- static urlForRefine(action: [String](TopLevel.String.md), attributeID: [String](TopLevel.String.md), value: [String](TopLevel.String.md)): [URL](dw.web.URL.md)
  - : Constructs a URL that you can use to execute a query for a specific
      attribute name-value pair.
      
      The generated URL will be an absolute URL which uses the protocol of
      the current request.


    **Parameters:**
    - action - pipeline action, e.g. 'Search-Show'.
    - attributeID - the attribute ID for the refinement.
    - value - the attribute value for the refinement.

    **Returns:**
    - the new URL.


---

### urlRefineCategory(URL, String)
- urlRefineCategory(url: [URL](dw.web.URL.md), refineCategoryID: [String](TopLevel.String.md)): [URL](dw.web.URL.md)
  - : Constructs a URL that you can use to re-execute the query with a
      category refinement. The search specific parameters are appended to the
      provided URL. The URL is typically generated with one of the URLUtils
      methods.


    **Parameters:**
    - url - the existing URL to use to create the new URL.
    - refineCategoryID - the ID of the category.

    **Returns:**
    - the new URL.


---

### urlRefineCategory(String, String)
- urlRefineCategory(action: [String](TopLevel.String.md), refineCategoryID: [String](TopLevel.String.md)): [URL](dw.web.URL.md)
  - : Constructs a URL that you can use to re-execute the query with a
      category refinement.
      
      The generated URL will be an absolute URL which uses the protocol of
      the current request.


    **Parameters:**
    - action - the pipeline action, e.g. 'Search-Show'
    - refineCategoryID - the ID of the category.

    **Returns:**
    - the new URL.


---

### urlRefinePrice(URL, Number, Number)
- urlRefinePrice(url: [URL](dw.web.URL.md), min: [Number](TopLevel.Number.md), max: [Number](TopLevel.Number.md)): [URL](dw.web.URL.md)
  - : Constructs a URL that you can use to re-execute the query with an
      additional price filter. The search specific parameters are appended to
      the provided URL. The URL is typically generated with one of the URLUtils
      methods.


    **Parameters:**
    - url - the URL to use to generate the new URL.
    - min - the minimum price.
    - max - the maximum price.

    **Returns:**
    - the new URL.


---

### urlRefinePrice(String, Number, Number)
- urlRefinePrice(action: [String](TopLevel.String.md), min: [Number](TopLevel.Number.md), max: [Number](TopLevel.Number.md)): [URL](dw.web.URL.md)
  - : Constructs a URL that you can use to re-execute the query with an
      additional price filter.
      
      The generated URL will be an absolute URL which uses the protocol of
      the current request.


    **Parameters:**
    - action - the pipeline action, e.g. 'Search-Show'.
    - min - the minimum price.
    - max - the maximum price.

    **Returns:**
    - the new URL.


---

### urlRefinePromotion(URL, String)
- urlRefinePromotion(url: [URL](dw.web.URL.md), refinePromotionID: [String](TopLevel.String.md)): [URL](dw.web.URL.md)
  - : Constructs a URL that you can use to re-execute the query with a promotion refinement. The search specific
      parameters are appended to the provided URL. The URL is typically generated with one of the URLUtils methods.


    **Parameters:**
    - url - the existing URL to use to create the new URL.
    - refinePromotionID - the ID of the promotion.

    **Returns:**
    - the new URL.


---

### urlRefinePromotion(String, String)
- urlRefinePromotion(action: [String](TopLevel.String.md), refinePromotionID: [String](TopLevel.String.md)): [URL](dw.web.URL.md)
  - : Constructs a URL that you can use to re-execute the query with a promotion refinement. The generated URL will be
      an absolute URL which uses the protocol of the current request.


    **Parameters:**
    - action - the pipeline action, e.g. 'Search-Show'
    - refinePromotionID - the ID of the promotion.

    **Returns:**
    - the new URL.


---

### urlRelaxCategory(URL)
- urlRelaxCategory(url: [URL](dw.web.URL.md)): [URL](dw.web.URL.md)
  - : Constructs a URL that you can use to re-execute the query without any
      category refinement. The search specific parameters are appended to the
      provided URL. The URL is typically generated with one of the URLUtils
      methods.


    **Parameters:**
    - url - the existing URL to use to create the new URL.

    **Returns:**
    - the new URL.


---

### urlRelaxCategory(String)
- urlRelaxCategory(action: [String](TopLevel.String.md)): [URL](dw.web.URL.md)
  - : Constructs a URL that you can use to re-execute the query without any
      category refinement.
      
      The generated URL will be an absolute URL which uses the protocol of
      the current request.


    **Parameters:**
    - action - the pipeline action, e.g. 'Search-Show'.

    **Returns:**
    - the new URL.


---

### urlRelaxPrice(URL)
- urlRelaxPrice(url: [URL](dw.web.URL.md)): [URL](dw.web.URL.md)
  - : Constructs a URL that you can use to would re-execute the query with no
      price filter. The search specific parameters are appended to the provided
      URL. The URL is typically generated with one of the URLUtils methods.


    **Parameters:**
    - url - the existing URL to use to create the new URL.

    **Returns:**
    - the new URL.


---

### urlRelaxPrice(String)
- urlRelaxPrice(action: [String](TopLevel.String.md)): [URL](dw.web.URL.md)
  - : Constructs a URL that you can use to re-execute the query with no price
      filter.
      
      The generated URL will be an absolute URL which uses the protocol of
      the current request.


    **Parameters:**
    - action - the pipeline action, e.g. 'Search-Show'

    **Returns:**
    - the new URL.


---

### urlRelaxPromotion(URL)
- urlRelaxPromotion(url: [URL](dw.web.URL.md)): [URL](dw.web.URL.md)
  - : Constructs a URL that you can use to re-execute the query without any promotion refinement. The search specific
      parameters are appended to the provided URL. The URL is typically generated with one of the URLUtils methods.


    **Parameters:**
    - url - the existing URL to use to create the new URL.

    **Returns:**
    - the new URL.


---

### urlRelaxPromotion(String)
- urlRelaxPromotion(action: [String](TopLevel.String.md)): [URL](dw.web.URL.md)
  - : Constructs a URL that you can use to re-execute the query without any promotion refinement. The generated URL
      will be an absolute URL which uses the protocol of the current request.


    **Parameters:**
    - action - the pipeline action, e.g. 'Search-Show'.

    **Returns:**
    - the new URL.


---

### urlSortingOption(URL, SortingOption)
- urlSortingOption(url: [URL](dw.web.URL.md), option: [SortingOption](dw.catalog.SortingOption.md)): [URL](dw.web.URL.md)
  - : Constructs a URL that you can use to re-execute the query but sort
      the results by the given storefront sorting option. The search specific parameters are
      appended to the provided URL. The URL is typically generated with one of
      the URLUtils methods.


    **Parameters:**
    - url - the existing URL to use to create the new URL.
    - option - sorting option

    **Returns:**
    - the new URL.


---

### urlSortingOption(String, SortingOption)
- urlSortingOption(action: [String](TopLevel.String.md), option: [SortingOption](dw.catalog.SortingOption.md)): [URL](dw.web.URL.md)
  - : Constructs a URL that you can use to re-execute the query but sort the
      results by the given storefront sorting option.
      
      The generated URL will be an absolute URL which uses the protocol of the
      current request.


    **Parameters:**
    - action - the pipeline action, e.g. 'Search-Show'.
    - option - sorting option

    **Returns:**
    - the new URL.


---

### urlSortingRule(URL, SortingRule)
- urlSortingRule(url: [URL](dw.web.URL.md), rule: [SortingRule](dw.catalog.SortingRule.md)): [URL](dw.web.URL.md)
  - : Constructs a URL that you can use to re-execute the query but sort
      the results by the given rule. The search specific parameters are
      appended to the provided URL. The URL is typically generated with one of
      the URLUtils methods.


    **Parameters:**
    - url - the existing URL to use to create the new URL.
    - rule - sorting rule

    **Returns:**
    - the new URL.


---

### urlSortingRule(String, SortingRule)
- urlSortingRule(action: [String](TopLevel.String.md), rule: [SortingRule](dw.catalog.SortingRule.md)): [URL](dw.web.URL.md)
  - : Constructs a URL that you can use to re-execute the query but sort the
      results by the given rule.
      
      The generated URL will be an absolute URL which uses the protocol of the
      current request.


    **Parameters:**
    - action - the pipeline action, e.g. 'Search-Show'.
    - rule - sorting rule

    **Returns:**
    - the new URL.


---

<!-- prettier-ignore-end -->
