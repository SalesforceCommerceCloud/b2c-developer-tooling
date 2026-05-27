import Suggestions = require('./Suggestions');
import utilIterator = require('../util/Iterator');

/**
 * The category suggestion container provides access to
 * categories found using the suggested terms as search criteria.
 * The method getSuggestedCategories can be used to
 * get the list of found categories.
 * 
 * Furthermore the list of suggested terms, after processing
 * the original user input search query, is accessible
 * through SearchPhraseSuggestions.getSuggestedTerms method.
 */
declare class CategorySuggestions extends Suggestions {
    /**
     * This method returns a list of categories which were found
     * using the suggested terms as search criteria.
     * The category lookup is being executed in the current catalog and locale.
     * @see dw.suggest.Suggestions.hasSuggestions
     */
    readonly suggestedCategories: utilIterator<any>;
    private constructor();
    /**
     * This method returns a list of categories which were found
     * using the suggested terms as search criteria.
     * The category lookup is being executed in the current catalog and locale.
     * @see dw.suggest.Suggestions.hasSuggestions
     */
    getSuggestedCategories(): utilIterator<any>;
}

export = CategorySuggestions;
