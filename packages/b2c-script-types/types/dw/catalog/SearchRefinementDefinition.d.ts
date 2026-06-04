import ExtensibleObject = require('../object/ExtensibleObject');
import CustomAttributes = require('../object/CustomAttributes');

declare global {
    module ICustomAttributes {
        interface SearchRefinementDefinition extends CustomAttributes {
        }
    }
}

/**
 * Common search refinement definition base class.
 */
declare abstract class SearchRefinementDefinition<T extends ICustomAttributes.SearchRefinementDefinition = ICustomAttributes.SearchRefinementDefinition> extends ExtensibleObject<T> {
    /**
     * Returns the attribute ID. If the refinement definition is not an
     * attribute refinement, the method returns an empty string.
     */
    readonly attributeID: string;
    /**
     * Identifies if this is an attribute refinement.
     */
    readonly attributeRefinement: boolean;
    /**
     * Returns the cut-off threshold.
     */
    readonly cutoffThreshold: number;
    /**
     * Returns the display name.
     */
    readonly displayName: string;
    /**
     * Returns a code for the data type used for this search refinement definition. See constants
     * defined in ObjectAttributeDefinition.
     */
    readonly valueTypeCode: number;
    /**
     * Returns the attribute ID. If the refinement definition is not an
     * attribute refinement, the method returns an empty string.
     */
    getAttributeID(): string;
    /**
     * Returns the cut-off threshold.
     */
    getCutoffThreshold(): number;
    /**
     * Returns the display name.
     */
    getDisplayName(): string;
    /**
     * Returns a code for the data type used for this search refinement definition. See constants
     * defined in ObjectAttributeDefinition.
     */
    getValueTypeCode(): number;
    /**
     * Identifies if this is an attribute refinement.
     */
    isAttributeRefinement(): boolean;
}

export = SearchRefinementDefinition;
