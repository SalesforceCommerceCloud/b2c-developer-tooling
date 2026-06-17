import SearchRefinements = require('./SearchRefinements');
import Collection = require('../util/Collection');
import ProductSearchRefinementDefinition = require('./ProductSearchRefinementDefinition');
import SearchRefinementValue = require('./SearchRefinementValue');
import ProductSearchRefinementValue = require('./ProductSearchRefinementValue');
import Category = require('./Category');

/**
 * This class provides an interface to refinement options for the product
 * search. In a typical usage, the client application UI displays the search
 * refinements along with the search results and allows customers to "refine"
 * the results (i.e. limit the results that are shown) by specifying additional
 * product criteria, or "relax" (i.e. broaden) the results after previously
 * refining. The four types of product search refinements are:
 * 
 * - Refine By Category: Limit the products to those assigned to
 * specific child/ancestor categories of the search category.
 * - Refine By Attribute: Limit the products to those with specific
 * values for a given attribute. Values may be grouped into "buckets" so that a
 * given set of values are represented as a single refinement option.
 * - Refine By Price: Limit the products to those whose prices fall in
 * a specific range.
 * - Refine By Promotion: Limit the products to those which are related
 * to a specific promotion.
 * 
 * Rendering a product search refinement UI typically begins with iterating the
 * refinement definitions for the search result. Call
 * dw.catalog.SearchRefinements.getRefinementDefinitions or
 * dw.catalog.SearchRefinements.getAllRefinementDefinitions to
 * retrieve the appropriate collection of refinement definitions. For each
 * definition, display the available refinement values by calling
 * getAllRefinementValues. Depending
 * on the type of the refinement definition, the application must use slightly
 * different logic to display the refinement widgets. For all 4 types, methods
 * in dw.catalog.ProductSearchModel are used to generate URLs to render
 * hyperlinks in the UI. When clicked, these links trigger a call to the Search
 * pipelet which in turn applies the appropriate filters to the native search
 * result.
 */
declare class ProductSearchRefinements extends SearchRefinements {
    /**
     * Returns the appropriate category refinement definition based on the search
     * result. The category refinement definition returned will be the first that
     * can be found traversing the category tree upward starting at the deepest
     * common category of the search result.
     */
    readonly categoryRefinementDefinition: ProductSearchRefinementDefinition | null;
    /**
     * Returns the appropriate price refinement definition based on the search
     * result. The price refinement definition returned will be the first that
     * can be found traversing the category tree upward starting at the deepest
     * common category of the search result.
     */
    readonly priceRefinementDefinition: ProductSearchRefinementDefinition | null;
    /**
     * Returns the appropriate promotion refinement definition based on the search
     * result. The promotion refinement definition returned will be the first that
     * can be found traversing the category tree upward starting at the deepest
     * common category of the search result.
     */
    readonly promotionRefinementDefinition: ProductSearchRefinementDefinition | null;
    private constructor();
    getAllRefinementValues(attributeName: string): Collection<SearchRefinementValue> | null;
    getAllRefinementValues(attributeName: string, sortMode: number, sortDirection: number): Collection<SearchRefinementValue>;
    /**
     * Returns a sorted collection of refinement values for the passed
     * refinement definition. The returned collection includes all refinement
     * values for which the hit count is greater than 0 within the search result
     * when the passed refinement definition is excluded from filtering the
     * search hits but all other refinement filters are still applied. This
     * method is useful for rendering broadening options for definitions that
     * the search is currently refined by. If the search is not currently
     * restricted by the passed refinement definition, then this method will
     * return the same result as
     * getRefinementValues.
     * 
     * For attribute-based refinement definitions, the returned collection
     * depends upon how the "value set" property is configured. (Category and
     * price refinement definitions do not have such a property.) If this
     * property is set to "search result values", the behavior is as described
     * above. If this property is set to "all values of category", then the
     * returned collection will also include all refinement values for products
     * in the category subtree rooted at the search definition's category. This
     * setting is useful for refinements whose visualization is supposed to
     * remain constant for a certain subtree of a catalog (e.g. color pickers or
     * size charts). These additional values are independent of the search
     * result and do not contribute towards the value hit counts. If the search
     * result is further refined by one of these values, it is possible to get
     * an empty search result. Except for this one case this method does NOT
     * return refinement values independent of the search result.
     */
    getAllRefinementValues(definition: ProductSearchRefinementDefinition): Collection<SearchRefinementValue>;
    /**
     * Returns the appropriate category refinement definition based on the search
     * result. The category refinement definition returned will be the first that
     * can be found traversing the category tree upward starting at the deepest
     * common category of the search result.
     */
    getCategoryRefinementDefinition(): ProductSearchRefinementDefinition | null;
    /**
     * Returns category refinement values based on the current search result
     * filtered such that only category refinements representing children of the
     * given category are present. If no category is given, the method uses the
     * catalog's root category. The refinement value product counts represent
     * all hits contained in the catalog tree starting at the corresponding
     * child category.
     */
    getNextLevelCategoryRefinementValues(category: Category): Collection<SearchRefinementValue>;
    /**
     * Returns the appropriate price refinement definition based on the search
     * result. The price refinement definition returned will be the first that
     * can be found traversing the category tree upward starting at the deepest
     * common category of the search result.
     */
    getPriceRefinementDefinition(): ProductSearchRefinementDefinition | null;
    /**
     * Returns the appropriate promotion refinement definition based on the search
     * result. The promotion refinement definition returned will be the first that
     * can be found traversing the category tree upward starting at the deepest
     * common category of the search result.
     */
    getPromotionRefinementDefinition(): ProductSearchRefinementDefinition | null;
    /**
     * Returns the refinement value (incl. product hit count) for the given
     * refinement definition and the given (selected) value.
     */
    getRefinementValue(definition: ProductSearchRefinementDefinition, value: string): ProductSearchRefinementValue;
    /**
     * Returns the refinement value (incl. product hit count) for the given
     * refinement attribute and the given (selected) value.
     */
    getRefinementValue(name: string, value: string): ProductSearchRefinementValue;
    getRefinementValues(attributeName: string, sortMode: number, sortDirection: number): Collection<SearchRefinementValue>;
    /**
     * Returns a collection of refinement values for the given refinement
     * definition. The returned refinement values only include those that are
     * part of the actual search result (i.e. hit count will always be > 0).
     */
    getRefinementValues(definition: ProductSearchRefinementDefinition): Collection<SearchRefinementValue>;
}

export = ProductSearchRefinements;
