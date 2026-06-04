/**
 * This class represents a key-value-pair for URL parameters.
 */
declare class URLParameter {
    /**
     * Constructs the parameter using the specified name and value and endocded
     * in the form "name=value".
     */
    constructor(aName: string, aValue: string);
    /**
     * Constructs the parameter using the specified name and value. If the "encodeName" is set to true,
     * the parameter is encoded in the form "name=value". Otherwise, it only
     * contains the "value" (needed for URL patterns).
     */
    constructor(aName: string, aValue: string, encodeName: boolean);
}

export = URLParameter;
