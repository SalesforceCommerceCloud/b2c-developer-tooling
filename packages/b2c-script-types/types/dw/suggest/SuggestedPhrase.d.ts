/**
 * This class represents a suggested phrase.
 * Use getPhrase method to get access to the phrase.
 */
declare class SuggestedPhrase {
    /**
     * This method returns a flag signaling whether this phrase is a exact match.
     */
    readonly exactMatch: boolean;
    /**
     * This method returns the actual phrase as a string value.
     */
    readonly phrase: string;
    private constructor();
    /**
     * This method returns the actual phrase as a string value.
     */
    getPhrase(): string;
    /**
     * This method returns a flag signaling whether this phrase is a exact match.
     */
    isExactMatch(): boolean;
}

export = SuggestedPhrase;
