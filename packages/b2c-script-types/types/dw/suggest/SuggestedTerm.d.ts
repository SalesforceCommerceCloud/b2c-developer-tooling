/**
 * A single suggested term.
 * 
 * Each user input term of the search phrase
 * is being processed separately by the suggestion engine. For each
 * original term, a list of terms will be suggested, either completed terms,
 * corrected terms or even the exact term if it is known to the engine.
 * 
 * Each suggested term is represented by a instance of this class. The list of suggested terms
 * belonging to a single original term is represented by a instance of SuggestedTerms class.
 * 
 * The suggested term value can either be the completed version of the original term,
 * the corrected version of the original term or exactly the original term.
 */
declare class SuggestedTerm {
    /**
     * Returns whether this suggested term is a additional term that has no corresponding term in the original search phrase.
     */
    readonly additional: boolean;
    /**
     * Returns whether this suggested term is a auto completed version of the original term.
     * In other words, this method returns true if the original term is a prefix of this suggested term.
     */
    readonly completed: boolean;
    /**
     * Returns whether this suggested term is a corrected version of the original term.
     */
    readonly corrected: boolean;
    /**
     * Returns whether this suggested term is exactly matching the original term.
     */
    readonly exactMatch: boolean;
    /**
     * Returns this suggested term as String value.
     */
    readonly value: string;
    private constructor();
    /**
     * Returns this suggested term as String value.
     */
    getValue(): string;
    /**
     * Returns whether this suggested term is a additional term that has no corresponding term in the original search phrase.
     */
    isAdditional(): boolean;
    /**
     * Returns whether this suggested term is a auto completed version of the original term.
     * In other words, this method returns true if the original term is a prefix of this suggested term.
     */
    isCompleted(): boolean;
    /**
     * Returns whether this suggested term is a corrected version of the original term.
     */
    isCorrected(): boolean;
    /**
     * Returns whether this suggested term is exactly matching the original term.
     */
    isExactMatch(): boolean;
}

export = SuggestedTerm;
