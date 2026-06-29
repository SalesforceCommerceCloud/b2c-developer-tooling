import utilIterator = require('../util/Iterator');

/**
 * The search phrase suggestions contain a list of suggested search phrases
 * (see dw.suggest.SuggestedPhrase)
 * as well as, for each of the search phrase terms, a list with corrected and
 * completed alternative terms.
 */
declare class SearchPhraseSuggestions {
    /**
     * Returns a list of dw.suggest.SuggestedPhrase objects that relates to the
     * user input search phrase.
     * @see hasSuggestedPhrases
     */
    readonly suggestedPhrases: utilIterator<any>;
    /**
     * Returns a list of dw.suggest.SuggestedTerms objects. Each of the returned
     * instances represents a set of terms suggested for a particular single term
     * of the user input search phrase.
     * @see hasSuggestedTerms
     */
    readonly suggestedTerms: utilIterator<any>;
    private constructor();
    /**
     * Returns a list of dw.suggest.SuggestedPhrase objects that relates to the
     * user input search phrase.
     * @see hasSuggestedPhrases
     */
    getSuggestedPhrases(): utilIterator<any>;
    /**
     * Returns a list of dw.suggest.SuggestedTerms objects. Each of the returned
     * instances represents a set of terms suggested for a particular single term
     * of the user input search phrase.
     * @see hasSuggestedTerms
     */
    getSuggestedTerms(): utilIterator<any>;
    /**
     * Returns whether this suggestions container has any suggested phrases.
     * 
     * Note that this method only looks for suggested phrases. It does not account
     * for suggested terms.
     */
    hasSuggestedPhrases(): boolean;
    /**
     * Returns whether this suggestions container has any suggested terms.
     * 
     * Note that this method checks suggested terms only,
     * but not suggested phrases.
     */
    hasSuggestedTerms(): boolean;
}

export = SearchPhraseSuggestions;
