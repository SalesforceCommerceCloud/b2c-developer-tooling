import Category = require('../catalog/Category');

/**
 * This class represents a suggested catalog category.
 * Use getCategory method to get access to the actual dw.catalog.Category object.
 */
declare class SuggestedCategory {
    /**
     * This method returns the actual dw.catalog.Category object corresponding to this suggested category.
     */
    readonly category: Category;
    private constructor();
    /**
     * This method returns the actual dw.catalog.Category object corresponding to this suggested category.
     */
    getCategory(): Category;
}

export = SuggestedCategory;
