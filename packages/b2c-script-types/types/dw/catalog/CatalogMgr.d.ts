import Catalog = require('./Catalog');
import Category = require('./Category');
import Collection = require('../util/Collection');
import SortingRule = require('./SortingRule');
import List = require('../util/List');
import SortingOption = require('./SortingOption');

/**
 * Provides helper methods for getting categories.
 */
declare class CatalogMgr {
    /**
     * Returns the catalog of the current site or null if no catalog is assigned to the site.
     */
    static readonly siteCatalog: Catalog | null;
    /**
     * Returns a list containing the sorting options configured for this site.
     */
    static readonly sortingOptions: List<SortingOption>;
    /**
     * Returns a collection containing all of the sorting rules for this site, including global sorting rules.
     */
    static readonly sortingRules: Collection<SortingRule>;
    private constructor();
    /**
     * Returns the catalog identified by the specified catalog id.
     * Returns null if no catalog with the specified id exists in the
     * current organization context.
     */
    static getCatalog(id: string): Catalog | null;
    /**
     * Returns the category of the site catalog identified by the specified
     * category id. Returns null if no site catalog is defined, or no category
     * with the specified id is found in the site catalog.
     */
    static getCategory(id: string): Category | null;
    /**
     * Returns the catalog of the current site or null if no catalog is assigned to the site.
     */
    static getSiteCatalog(): Catalog | null;
    /**
     * Returns the sorting option with the given ID for this site, or
     * `null` if there is no such option.
     */
    static getSortingOption(id: string): SortingOption | null;
    /**
     * Returns a list containing the sorting options configured for this site.
     */
    static getSortingOptions(): List<SortingOption>;
    /**
     * Returns the sorting rule with the given ID for this site,
     * or `null` if there is no such rule.
     */
    static getSortingRule(id: string): SortingRule | null;
    /**
     * Returns a collection containing all of the sorting rules for this site, including global sorting rules.
     */
    static getSortingRules(): Collection<SortingRule>;
}

export = CatalogMgr;
