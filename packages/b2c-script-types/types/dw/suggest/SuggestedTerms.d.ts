import SuggestedTerm = require('./SuggestedTerm');
import utilIterator = require('../util/Iterator');

/**
 * This container represents a list of suggested terms, all belonging to a
 * particular single original term of the users input search phrase.
 * 
 * Each user input term of the search phrase
 * is being processed separately by the suggestion engine. For each
 * original term, a list of terms will be suggested, either completed terms,
 * corrected terms or even the exact term if they are known to the engine as they are.
 * 
 * A instance of this class refers to the original unmodified term, as well as
 * to a list of SuggestedTerms objects representing a single suggested term.
 */
declare class SuggestedTerms {
    /**
     * Returns true if this set of suggested terms is empty.
     */
    readonly empty: boolean;
    /**
     * This method returns the suggested term which is considered best matching
     * with the original term. See getTerms for a note on ordering of
     * suggested terms.
     * @see getOriginalTerm
     * @see getTerms
     */
    readonly firstTerm: SuggestedTerm;
    /**
     * Returns the original term of the user input, for which this instance
     * provides a list of suggested terms. Suggested terms can either be corrected,
     * or completed or exact matching.
     */
    readonly originalTerm: string;
    /**
     * Returns the list of SuggestedTerms suggested for the original term.
     * @see getOriginalTerm
     * @see isEmpty
     */
    readonly terms: utilIterator<any>;
    private constructor();
    /**
     * This method returns the suggested term which is considered best matching
     * with the original term. See getTerms for a note on ordering of
     * suggested terms.
     * @see getOriginalTerm
     * @see getTerms
     */
    getFirstTerm(): SuggestedTerm;
    /**
     * Returns the original term of the user input, for which this instance
     * provides a list of suggested terms. Suggested terms can either be corrected,
     * or completed or exact matching.
     */
    getOriginalTerm(): string;
    /**
     * Returns the list of SuggestedTerms suggested for the original term.
     * @see getOriginalTerm
     * @see isEmpty
     */
    getTerms(): utilIterator<any>;
    /**
     * Returns true if this set of suggested terms is empty.
     */
    isEmpty(): boolean;
}

export = SuggestedTerms;
