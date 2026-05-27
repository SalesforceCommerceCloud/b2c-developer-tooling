import SearchPhraseSuggestions = require('./SearchPhraseSuggestions');
import utilIterator = require('../util/Iterator');

/**
 * This is the base class for suggestions containers.
 * For each type of items, a sub class provides methods to
 * access the actual items.
 * 
 * See the sub classes for more specific information.
 */
declare abstract class Suggestions {
    /**
     * Returns the suggested search phrases that are associated to this suggestions.
     * 
     * In contrast to the suggested items, the suggested phrases contains the corrected and
     * completed versions of the original search phrase.
     */
    readonly searchPhraseSuggestions: SearchPhraseSuggestions;
    /**
     * Returns a list of dw.suggest.SuggestedPhrase objects that relates to the
     * user input search phrase.
     * @see dw.suggest.Suggestions.hasSuggestedPhrases
     * @deprecated Please use method dw.suggest.Suggestions.getSearchPhraseSuggestions to obtain the suggested search phrases.
     */
    readonly suggestedPhrases: utilIterator<any>;
    /**
     * Returns a list of dw.suggest.SuggestedTerms objects. Each of the returned
     * instances represents a set of terms suggested for a particular single term
     * of the user input search phrase.
     * @deprecated Please use method dw.suggest.Suggestions.getSearchPhraseSuggestions to obtain the suggested search phrases.
     */
    readonly suggestedTerms: utilIterator<any>;
    /**
     * Returns the suggested search phrases that are associated to this suggestions.
     * 
     * In contrast to the suggested items, the suggested phrases contains the corrected and
     * completed versions of the original search phrase.
     */
    getSearchPhraseSuggestions(): SearchPhraseSuggestions;
    /**
     * Returns a list of dw.suggest.SuggestedPhrase objects that relates to the
     * user input search phrase.
     * @see dw.suggest.Suggestions.hasSuggestedPhrases
     * @deprecated Please use method dw.suggest.Suggestions.getSearchPhraseSuggestions to obtain the suggested search phrases.
     */
    getSuggestedPhrases(): utilIterator<any>;
    /**
     * Returns a list of dw.suggest.SuggestedTerms objects. Each of the returned
     * instances represents a set of terms suggested for a particular single term
     * of the user input search phrase.
     * @deprecated Please use method dw.suggest.Suggestions.getSearchPhraseSuggestions to obtain the suggested search phrases.
     */
    getSuggestedTerms(): utilIterator<any>;
    /**
     * Returns whether this suggestions container has any suggested phrases.
     * 
     * Note that this method only looks for suggested phrases. It does not account
     * for suggested terms or suggested objects. In other words,
     * even if there are suggested terms or objects, this method
     * will return false if this suggestions container has no phrases.
     * @deprecated Please use method dw.suggest.Suggestions.getSearchPhraseSuggestions to obtain the suggested search phrases.
     */
    hasSuggestedPhrases(): boolean;
    /**
     * Returns whether this suggestions container has any suggested terms.
     * 
     * Note that this method checks suggested terms only,
     * but not suggested phrases or suggested objects.
     * @deprecated Please use method dw.suggest.Suggestions.getSearchPhraseSuggestions to obtain the suggested search phrases.
     */
    hasSuggestedTerms(): boolean;
    /**
     * Returns whether this suggestions container has any suggested items, i.e. products.
     * 
     * Note that this method only looks for concrete suggested items. It does not account
     * for suggested terms. In other words, even if there are suggested terms, this method
     * will return false if no matching items, like products or categories, were found
     * for the suggested terms.
     * 
     * To find out whether there are suggested terms and how they match with respect to
     * the original search phrase, one can use dw.suggest.Suggestions.getSuggestedTerms to obtain
     * a list of dw.suggest.SuggestedTerms.
     * @see dw.suggest.Suggestions.getSuggestedTerms
     * @see dw.suggest.SuggestedTerms.isEmpty
     */
    hasSuggestions(): boolean;
}

export = Suggestions;
