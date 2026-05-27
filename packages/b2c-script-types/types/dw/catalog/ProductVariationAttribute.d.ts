/**
 * Represents a product variation attribute
 */
declare class ProductVariationAttribute {
    /**
     * Returns the ID of the product variation attribute.
     */
    readonly ID: string;
    /**
     * Returns the ID of the product attribute defintion related to
     * this variation attribute.  This ID matches the
     * value returned by dw.object.ObjectAttributeDefinition.getID
     * for the appropriate product attribute definition.
     * This ID is generally different than the ID returned by
     * getID.
     */
    readonly attributeID: string;
    /**
     * Returns the display name for the product variation attribute, which can be used in the
     * user interface.
     */
    readonly displayName: string;
    private constructor();
    /**
     * Returns the ID of the product attribute defintion related to
     * this variation attribute.  This ID matches the
     * value returned by dw.object.ObjectAttributeDefinition.getID
     * for the appropriate product attribute definition.
     * This ID is generally different than the ID returned by
     * getID.
     */
    getAttributeID(): string;
    /**
     * Returns the display name for the product variation attribute, which can be used in the
     * user interface.
     */
    getDisplayName(): string;
    /**
     * Returns the ID of the product variation attribute.
     */
    getID(): string;
}

export = ProductVariationAttribute;
