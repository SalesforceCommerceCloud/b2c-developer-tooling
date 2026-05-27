import Category = require('./Category');

/**
 * A CategoryLink represents a directed relationship between two catalog
 * categories.  Merchants create category links in order to market similar or
 * related groups of products.
 */
declare class CategoryLink {
    /**
     * Represents an accessory category link.
     */
    static readonly LINKTYPE_ACCESSORY = 2;
    /**
     * Represents a cross-sell category link.
     */
    static readonly LINKTYPE_CROSS_SELL = 4;
    /**
     * Represents a miscellaneous category link.
     */
    static readonly LINKTYPE_OTHER = 1;
    /**
     * Represents a spare part category link.
     */
    static readonly LINKTYPE_SPARE_PART = 6;
    /**
     * Represents an up-sell category link.
     */
    static readonly LINKTYPE_UP_SELL = 5;
    /**
     * Returns the object for the relation 'sourceCategory'.
     */
    readonly sourceCategory: Category;
    /**
     * Returns the object for the relation 'targetCategory'.
     */
    readonly targetCategory: Category;
    /**
     * Returns the type of this category link (see constants).
     */
    readonly typeCode: number;
    private constructor();
    /**
     * Returns the object for the relation 'sourceCategory'.
     */
    getSourceCategory(): Category;
    /**
     * Returns the object for the relation 'targetCategory'.
     */
    getTargetCategory(): Category;
    /**
     * Returns the type of this category link (see constants).
     */
    getTypeCode(): number;
}

export = CategoryLink;
