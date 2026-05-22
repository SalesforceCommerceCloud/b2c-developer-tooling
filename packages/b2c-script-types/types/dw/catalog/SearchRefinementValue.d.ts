/**
 * Represents the value of a product or content search refinement.
 */
declare abstract class SearchRefinementValue {
    /**
     * Returns the refinement value's ID. For attribute refinements, this will
     * be the ID of the corresponding
     * dw.object.ObjectAttributeDefinition. This ID is included in the
     * querystring parameter names returned by the URL-generating methods of
     * dw.catalog.SearchModel. For price and category refinements, this
     * value will be empty.
     */
    readonly ID: string;
    /**
     * Returns the optional refinement value description in the current locale.
     */
    readonly description: string | null;
    /**
     * Returns the refinement display value. For attribute refinements, this is
     * the appropriate display value based on optional value display names
     * within the object attribute definition. If no display name is defined,
     * the value itself is returned. For category refinements, this is the
     * display name of the category in the current locale. For price
     * refinements, this is a string representation of the range appropriate for
     * display.
     */
    readonly displayValue: string;
    /**
     * Returns the hit count value.
     */
    readonly hitCount: number;
    /**
     * Returns the optional presentation ID associated with this refinement
     * value. The presentation ID can be used, for example, to associate an ID
     * with an HTML widget.
     */
    readonly presentationID: string | null;
    /**
     * Returns the refinement value. For attribute refinements, this is the
     * attribute value if the refinement values are unbucketed, or the bucket
     * display name if the values are bucketed. This value is included in the
     * querystring parameter values returned by the URL-generating methods of
     * dw.catalog.SearchModel. For price refinements, the value will be
     * a string representation of the price range lower bound. For category
     * refinements, the value will be a category ID.
     */
    readonly value: string;
    /**
     * Returns the optional refinement value description in the current locale.
     */
    getDescription(): string | null;
    /**
     * Returns the refinement display value. For attribute refinements, this is
     * the appropriate display value based on optional value display names
     * within the object attribute definition. If no display name is defined,
     * the value itself is returned. For category refinements, this is the
     * display name of the category in the current locale. For price
     * refinements, this is a string representation of the range appropriate for
     * display.
     */
    getDisplayValue(): string;
    /**
     * Returns the hit count value.
     */
    getHitCount(): number;
    /**
     * Returns the refinement value's ID. For attribute refinements, this will
     * be the ID of the corresponding
     * dw.object.ObjectAttributeDefinition. This ID is included in the
     * querystring parameter names returned by the URL-generating methods of
     * dw.catalog.SearchModel. For price and category refinements, this
     * value will be empty.
     */
    getID(): string;
    /**
     * Returns the optional presentation ID associated with this refinement
     * value. The presentation ID can be used, for example, to associate an ID
     * with an HTML widget.
     */
    getPresentationID(): string | null;
    /**
     * Returns the refinement value. For attribute refinements, this is the
     * attribute value if the refinement values are unbucketed, or the bucket
     * display name if the values are bucketed. This value is included in the
     * querystring parameter values returned by the URL-generating methods of
     * dw.catalog.SearchModel. For price refinements, the value will be
     * a string representation of the price range lower bound. For category
     * refinements, the value will be a category ID.
     */
    getValue(): string;
}

export = SearchRefinementValue;
