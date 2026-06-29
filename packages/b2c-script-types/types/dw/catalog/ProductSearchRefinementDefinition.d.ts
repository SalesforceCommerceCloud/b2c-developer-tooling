import SearchRefinementDefinition = require('./SearchRefinementDefinition');
import ExtensibleObject = require('../object/ExtensibleObject');
import CustomAttributes = require('../object/CustomAttributes');

declare global {
    module ICustomAttributes {
        interface ProductSearchRefinementDefinition extends ICustomAttributes.SearchRefinementDefinition {
        }
    }
}

/**
 * This class provides an interface to refinement options for the product search.
 */
declare class ProductSearchRefinementDefinition extends SearchRefinementDefinition<ICustomAttributes.ProductSearchRefinementDefinition> {
    /**
     * Identifies if this is a category refinement.
     */
    readonly categoryRefinement: boolean;
    /**
     * Identifies if this is a price refinement.
     */
    readonly priceRefinement: boolean;
    /**
     * Identifies if this is a promotion refinement.
     */
    readonly promotionRefinement: boolean;
    private constructor();
    /**
     * Identifies if this is a category refinement.
     */
    isCategoryRefinement(): boolean;
    /**
     * Identifies if this is a price refinement.
     */
    isPriceRefinement(): boolean;
    /**
     * Identifies if this is a promotion refinement.
     */
    isPromotionRefinement(): boolean;
}

export = ProductSearchRefinementDefinition;
