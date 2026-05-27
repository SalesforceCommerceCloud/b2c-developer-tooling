import PersistentObject = require('../object/PersistentObject');

/**
 * Represents a product sorting rule for use with the dw.catalog.ProductSearchModel.
 */
declare class SortingRule extends PersistentObject {
    /**
     * Returns the ID of the sorting rule.
     */
    readonly ID: string;
    private constructor();
    /**
     * Returns the ID of the sorting rule.
     */
    getID(): string;
}

export = SortingRule;
