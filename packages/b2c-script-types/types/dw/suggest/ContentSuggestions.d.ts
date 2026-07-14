import Suggestions = require('./Suggestions');
import utilIterator = require('../util/Iterator');

/**
 * The content suggestion container provides access to
 * content pages found using the suggested terms as search criteria.
 * The method getSuggestedContent can be used to
 * get the list of found content pages.
 * 
 * Furthermore the list of suggested terms, after processing
 * the original user input search query, is accessible
 * through SearchPhraseSuggestions.getSuggestedTerms method.
 */
declare class ContentSuggestions extends Suggestions {
    /**
     * This method returns a list of content pages which were found
     * using the suggested terms as search criteria.
     * The content lookup is being executed in the current library and locale.
     * @see dw.suggest.Suggestions.hasSuggestions
     */
    readonly suggestedContent: utilIterator<any>;
    private constructor();
    /**
     * This method returns a list of content pages which were found
     * using the suggested terms as search criteria.
     * The content lookup is being executed in the current library and locale.
     * @see dw.suggest.Suggestions.hasSuggestions
     */
    getSuggestedContent(): utilIterator<any>;
}

export = ContentSuggestions;
