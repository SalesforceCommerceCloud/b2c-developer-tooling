import PersistentObject = require('../object/PersistentObject');
import SortingRule = require('./SortingRule');

/**
 * Represents an option for how to sort products in storefront search results.
 */
declare class SortingOption extends PersistentObject {
    /**
     * Returns the ID of the sorting option.
     */
    readonly ID: string;
    /**
     * Returns the description of the sorting option for the current locale.
     */
    readonly description: string | null;
    /**
     * Returns the display name of the of the sorting option for the current locale.
     */
    readonly displayName: string | null;
    /**
     * Returns the sorting rule for this sorting option,
     * or `null` if there is no associated rule.
     */
    readonly sortingRule: SortingRule | null;
    private constructor();
    /**
     * Returns the description of the sorting option for the current locale.
     */
    getDescription(): string | null;
    /**
     * Returns the display name of the of the sorting option for the current locale.
     */
    getDisplayName(): string | null;
    /**
     * Returns the ID of the sorting option.
     */
    getID(): string;
    /**
     * Returns the sorting rule for this sorting option,
     * or `null` if there is no associated rule.
     */
    getSortingRule(): SortingRule | null;
}

export = SortingOption;
