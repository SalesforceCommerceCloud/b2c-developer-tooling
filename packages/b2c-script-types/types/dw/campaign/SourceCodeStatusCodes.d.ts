/**
 * Helper class which contains error result codes returned by the SetSourceCode
 * pipelet.
 */
declare class SourceCodeStatusCodes {
    /**
     * Indicates that the specified source code was found in one or more
     * source-code groups, none of which are active.
     */
    static readonly CODE_INACTIVE = "CODE_INACTIVE";
    /**
     * Indicates that the specified source code is not contained
     * in any source-code group.
     */
    static readonly CODE_INVALID = "CODE_INVALID";
    private constructor();
}

export = SourceCodeStatusCodes;
