import ProductSuggestions = require('./ProductSuggestions');
import CategorySuggestions = require('./CategorySuggestions');
import BrandSuggestions = require('./BrandSuggestions');
import ContentSuggestions = require('./ContentSuggestions');
import CustomSuggestions = require('./CustomSuggestions');
import utilIterator = require('../util/Iterator');

/**
 * The Suggest model provides methods and functions
 * to access search suggestions.
 * 
 * The search suggestion feature basically covers two functional areas.
 * First is just to suggest words, based on the users input,
 * utilizing spell correction or prediction (also known as auto completion).
 * The second functional area is also often referred to as search-as-you-type,
 * where, based on the users input, specific items are
 * already looked up, before the user actually has completed typing a word
 * or even fired up the search.
 * 
 * This model combines both functional areas and provides access to both - the
 * suggested words and the items found while using the predicted words.
 * 
 * This model supports various types of items that are being suggested, like
 * products, categories, brands, content pages as well merchant provided search phrases.
 * For each type, there is a Suggestions implementation
 * available and accessible through this model: ProductSuggestions,
 * CategorySuggestions, BrandSuggestions, ContentSuggestions,
 * and CustomSuggestions.
 * 
 * For each type of suggestions, the actual suggested items (like
 * products) can by obtained, and, on the other hand, a list of terms
 * is provided which were used to lookup the found items.
 * The terms can be used to present a advanced user experience in the
 * storefront, e.g. show auto completed words, spell corrections and so on.
 * The SuggestModel script API will always create suggestions with Autocorrections
 * regardless of the value of "Search Autocorrections" search preference.
 */
declare class SuggestModel {
    /**
     * The maximum number of suggestions that can be obtain from this model: `10`
     */
    static readonly MAX_SUGGESTIONS = 10;
    /**
     * Returns a BrandSuggestions container for the current search phrase.
     * The BrandSuggestions container provides access to the found brands (if any) and
     * the terms suggested by the system with respect to the known product brands in the catalog.
     * @see setMaxSuggestions
     * @see setSearchPhrase
     */
    readonly brandSuggestions: BrandSuggestions;
    /**
     * Returns a CategorySuggestions container for the current search phrase.
     * The CategorySuggestions container provides access to the found categories (if any) and
     * the terms suggested by the system with respect to the known categories in the catalog.
     * @see setMaxSuggestions
     * @see setSearchPhrase
     */
    readonly categorySuggestions: CategorySuggestions;
    /**
     * Returns a ContentSuggestions container for the current search phrase.
     * The ContentSuggestions container provides access to the found content pages (if any) and
     * the terms suggested by the system with respect to the known content in the library.
     * @see setMaxSuggestions
     * @see setSearchPhrase
     */
    readonly contentSuggestions: ContentSuggestions;
    /**
     * Returns a CustomSuggestions container for the current search phrase.
     * The CustomSuggestions container provides access to matching
     * custom phrases (if any) and the terms suggested
     * by the system with respect to the merchant provided custom phrases.
     * @see setMaxSuggestions
     * @see setSearchPhrase
     */
    readonly customSuggestions: CustomSuggestions;
    /**
     * The method returns true, if the search suggestions are filtered by the folder. If this returns true it is not
     * possible for search suggestions to contain Page Designer content as it belongs to no folder.
     */
    filteredByFolder: boolean;
    /**
     * Use this method to obtain a list of search phrases
     * that currently are very popular among all users across the Site.
     * 
     * The search phrases are specific to the region (based on user's IP address),
     * language (locale) and the user's browser type (agent).
     */
    readonly popularSearchPhrases: utilIterator<any>;
    /**
     * Returns a ProductSuggestions container for the current search phrase.
     * The ProductSuggestions container provides access to the found products (if any) and
     * the terms suggested by the system with respect to the known products in the catalog.
     * @see setMaxSuggestions
     * @see setSearchPhrase
     */
    readonly productSuggestions: ProductSuggestions;
    /**
     * Use this method to obtain a list of personalized search phrases
     * that the current user entered recently.
     * 
     * The user is being identified by the CQuotient tracking cookie.
     */
    readonly recentSearchPhrases: utilIterator<any>;
    /**
     * Constructs a new SuggestModel.
     */
    constructor();
    /**
     * Adds a refinement for product suggestions.
     * The method can be called to add an additional query
     * parameter specified as name-value pair. The values string may encode
     * multiple values delimited by the pipe symbol ('|').
     */
    addRefinementValues(attributeID: string, values: string): void;
    /**
     * Returns a BrandSuggestions container for the current search phrase.
     * The BrandSuggestions container provides access to the found brands (if any) and
     * the terms suggested by the system with respect to the known product brands in the catalog.
     * @see setMaxSuggestions
     * @see setSearchPhrase
     */
    getBrandSuggestions(): BrandSuggestions;
    /**
     * Returns a CategorySuggestions container for the current search phrase.
     * The CategorySuggestions container provides access to the found categories (if any) and
     * the terms suggested by the system with respect to the known categories in the catalog.
     * @see setMaxSuggestions
     * @see setSearchPhrase
     */
    getCategorySuggestions(): CategorySuggestions;
    /**
     * Returns a ContentSuggestions container for the current search phrase.
     * The ContentSuggestions container provides access to the found content pages (if any) and
     * the terms suggested by the system with respect to the known content in the library.
     * @see setMaxSuggestions
     * @see setSearchPhrase
     */
    getContentSuggestions(): ContentSuggestions;
    /**
     * Returns a CustomSuggestions container for the current search phrase.
     * The CustomSuggestions container provides access to matching
     * custom phrases (if any) and the terms suggested
     * by the system with respect to the merchant provided custom phrases.
     * @see setMaxSuggestions
     * @see setSearchPhrase
     */
    getCustomSuggestions(): CustomSuggestions;
    /**
     * Use this method to obtain a list of search phrases
     * that currently are very popular among all users across the Site.
     * 
     * The search phrases are specific to the region (based on user's IP address),
     * language (locale) and the user's browser type (agent).
     */
    getPopularSearchPhrases(): utilIterator<any>;
    /**
     * Returns a ProductSuggestions container for the current search phrase.
     * The ProductSuggestions container provides access to the found products (if any) and
     * the terms suggested by the system with respect to the known products in the catalog.
     * @see setMaxSuggestions
     * @see setSearchPhrase
     */
    getProductSuggestions(): ProductSuggestions;
    /**
     * Use this method to obtain a list of personalized search phrases
     * that the current user entered recently.
     * 
     * The user is being identified by the CQuotient tracking cookie.
     */
    getRecentSearchPhrases(): utilIterator<any>;
    /**
     * The method returns true, if the search suggestions are filtered by the folder. If this returns true it is not
     * possible for search suggestions to contain Page Designer content as it belongs to no folder.
     */
    isFilteredByFolder(): boolean;
    /**
     * Removes a refinement. The method can be called to remove previously added
     * refinement values. The values string may encode multiple values delimited
     * by the pipe symbol ('|').
     */
    removeRefinementValues(attributeID: string, values: string | null): void;
    /**
     * Apply a category ID to filter product, brand and category suggestions.
     * 
     * Suggested products, brands and categories, as well as corrected and completed
     * terms are specific to the given category or one of it's sub categories.
     * 
     * For example, in the specified category "television", the search term "pla"
     * will be auto completed to "plasma" (instead of e.g. "player") and
     * only televisions will be included in the list of suggested products.
     */
    setCategoryID(categoryID: string): void;
    /**
     * Set a flag to indicate if the search suggestions filter for elements that do not belong to a folder.
     * Must be set to false to return content assets that do not belong to any folder.
     */
    setFilteredByFolder(filteredByFolder: boolean): void;
    /**
     * Use this method to setup the maximum number of returned suggested
     * items. For example, set this to 3 in order to only retrieve the
     * 3 most relevant suggested products.
     * 
     * The maximum number of suggestions that can be queried are defined as MAX_SUGGESTIONS.
     */
    setMaxSuggestions(maxSuggestions: number): void;
    /**
     * Sets product suggestion refinement values for an attribute.
     * The method can be called to set
     * an additional query parameter specified as name-value pair. The value
     * string may encode multiple values delimited by the pipe symbol ('|').
     * Existing refinement values for the attribute will be removed.
     */
    setRefinementValues(attributeID: string, values: string | null): void;
    /**
     * Sets the user input search phrase. This search phrase is being processed
     * by applying auto completion, spell correction and enhancement with alternative
     * similar search terms.
     * 
     * The resulting search phrase is used to lookup the actual items,
     * like products or categories (search-as-you-type).
     * 
     * In order to access the processed terms, one can use the
     * SearchPhraseSuggestions.getSuggestedTerms method of each of the respective
     * results returned by the methods in this model.
     * @see dw.suggest.SearchPhraseSuggestions.getSuggestedTerms
     */
    setSearchPhrase(searchPhrase: string): void;
}

export = SuggestModel;
