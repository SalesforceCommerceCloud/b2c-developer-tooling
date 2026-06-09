import Suggestions = require('./Suggestions');

/**
 * The brands suggestion container provides access to
 * brands found using the suggested terms.
 * 
 * The method SearchPhraseSuggestions.getSuggestedPhrases can be used to
 * get the list of found brand names. The brand lookup
 * is being executed in the current catalog and locale.
 * 
 * Furthermore the list of suggested terms, after processing
 * the original user input search query, is accessible
 * through SearchPhraseSuggestions.getSuggestedTerms method.
 */
declare class BrandSuggestions extends Suggestions {
    private constructor();
}

export = BrandSuggestions;
