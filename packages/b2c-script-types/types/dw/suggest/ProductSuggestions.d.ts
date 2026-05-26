import Suggestions = require('./Suggestions');
import utilIterator = require('../util/Iterator');

/**
 * The product suggestion container provides access to
 * products found using the suggested terms.
 * The method getSuggestedProducts can be used to
 * get the list of found products.
 * 
 * Furthermore the list of suggested terms, after processing
 * the original user input search query, is accessible
 * through SearchPhraseSuggestions.getSuggestedTerms method.
 */
declare class ProductSuggestions extends Suggestions {
    /**
     * This method returns a list of products which were found
     * using the suggested terms as search criteria.
     * The product lookup is being executed in the current catalog and locale.
     * @see dw.suggest.Suggestions.hasSuggestions
     */
    readonly suggestedProducts: utilIterator<any>;
    private constructor();
    /**
     * This method returns a list of products which were found
     * using the suggested terms as search criteria.
     * The product lookup is being executed in the current catalog and locale.
     * @see dw.suggest.Suggestions.hasSuggestions
     */
    getSuggestedProducts(): utilIterator<any>;
}

export = ProductSuggestions;
