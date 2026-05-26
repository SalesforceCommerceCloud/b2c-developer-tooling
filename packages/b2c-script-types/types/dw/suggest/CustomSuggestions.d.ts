import Suggestions = require('./Suggestions');

/**
 * The custom suggestion container provides access to
 * merchant provided search phrases
 * found using the suggested terms as search criteria.
 * 
 * The method SearchPhraseSuggestions.getSuggestedPhrases can be used to
 * get the list of found search phrases. The custom phrases
 * lookup is being executed in the current site.
 * 
 * Furthermore the list of suggested terms is accessible
 * through SearchPhraseSuggestions.getSuggestedTerms method.
 */
declare class CustomSuggestions extends Suggestions {
    private constructor();
}

export = CustomSuggestions;
