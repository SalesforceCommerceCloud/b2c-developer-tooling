import ExtensibleObject = require('../object/ExtensibleObject');
import CustomAttributes = require('../object/CustomAttributes');
import MarkupText = require('../content/MarkupText');
import MediaFile = require('../content/MediaFile');
import Catalog = require('./Catalog');

declare global {
    module ICustomAttributes {
        interface Recommendation extends CustomAttributes {
        }
    }
}

/**
 * Represents a recommendation in Commerce Cloud Digital.
 */
declare class Recommendation extends ExtensibleObject<ICustomAttributes.Recommendation> {
    /**
     * Represents a cross-sell recommendation.
     * @deprecated Use the integer value instead.  The recommendation types
     * and their meanings are now configurable in the Business Manager.
     */
    static readonly RECOMMENDATION_TYPE_CROSS_SELL = 1;
    /**
     * Represents a recommendation that is neither a cross-sell or an up-sell.
     * @deprecated Use the integer value instead.  The recommendation types
     * and their meanings are now configurable in the Business Manager.
     */
    static readonly RECOMMENDATION_TYPE_OTHER = 3;
    /**
     * Represents an up-sell recommendation.
     * @deprecated Use the integer value instead.  The recommendation types
     * and their meanings are now configurable in the Business Manager.
     */
    static readonly RECOMMENDATION_TYPE_UP_SELL = 2;
    /**
     * Returns the recommendation's callout message in the current locale.
     */
    readonly calloutMsg: MarkupText | null;
    /**
     * Return the catalog containing the recommendation.
     */
    readonly catalog: Catalog;
    /**
     * Returns the recommendation's image.
     */
    readonly image: MediaFile;
    /**
     * Returns the recommendation's long description in the current locale.
     */
    readonly longDescription: MarkupText | null;
    /**
     * Returns the name of the recommended item in the current locale.
     */
    readonly name: string | null;
    /**
     * Returns the type of the recommendation.
     */
    readonly recommendationType: number;
    /**
     * Return a reference to the recommended item.  This will always be an
     * object of type `dw.catalog.Product` since this is the only
     * currently supported recommendation target type.
     */
    readonly recommendedItem: any | null;
    /**
     * Return the ID of the recommended item.  This will always be a product
     * ID since this is the only currently supported recommendation target
     * type.
     */
    readonly recommendedItemID: string;
    /**
     * Returns the recommendation's short description in the current locale.
     */
    readonly shortDescription: MarkupText | null;
    /**
     * Return a reference to the source item.  This will be an object of type
     * `dw.catalog.Product` or `dw.catalog.Category.`
     */
    readonly sourceItem: any;
    /**
     * Return the ID of the recommendation source item.  This will either be a
     * product ID or category name.
     */
    readonly sourceItemID: string;
    private constructor();
    /**
     * Returns the recommendation's callout message in the current locale.
     */
    getCalloutMsg(): MarkupText | null;
    /**
     * Return the catalog containing the recommendation.
     */
    getCatalog(): Catalog;
    /**
     * Returns the recommendation's image.
     */
    getImage(): MediaFile;
    /**
     * Returns the recommendation's long description in the current locale.
     */
    getLongDescription(): MarkupText | null;
    /**
     * Returns the name of the recommended item in the current locale.
     */
    getName(): string | null;
    /**
     * Returns the type of the recommendation.
     */
    getRecommendationType(): number;
    /**
     * Return a reference to the recommended item.  This will always be an
     * object of type `dw.catalog.Product` since this is the only
     * currently supported recommendation target type.
     */
    getRecommendedItem(): any | null;
    /**
     * Return the ID of the recommended item.  This will always be a product
     * ID since this is the only currently supported recommendation target
     * type.
     */
    getRecommendedItemID(): string;
    /**
     * Returns the recommendation's short description in the current locale.
     */
    getShortDescription(): MarkupText | null;
    /**
     * Return a reference to the source item.  This will be an object of type
     * `dw.catalog.Product` or `dw.catalog.Category.`
     */
    getSourceItem(): any;
    /**
     * Return the ID of the recommendation source item.  This will either be a
     * product ID or category name.
     */
    getSourceItemID(): string;
}

export = Recommendation;
