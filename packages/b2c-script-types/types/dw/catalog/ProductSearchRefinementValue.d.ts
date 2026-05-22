import SearchRefinementValue = require('./SearchRefinementValue');

/**
 * Represents the value of a product search refinement.
 */
declare class ProductSearchRefinementValue extends SearchRefinementValue {
    /**
     * Returns the lower bound for price refinements.  For example, 50.00
     * for a range of $50.00 - $99.99.
     */
    readonly valueFrom: number;
    /**
     * Returns the upper bound for price refinements.  For example, 99.99
     * for a range of $50.00 - $99.99.
     */
    readonly valueTo: number;
    private constructor();
    /**
     * Returns the lower bound for price refinements.  For example, 50.00
     * for a range of $50.00 - $99.99.
     */
    getValueFrom(): number;
    /**
     * Returns the upper bound for price refinements.  For example, 99.99
     * for a range of $50.00 - $99.99.
     */
    getValueTo(): number;
}

export = ProductSearchRefinementValue;
