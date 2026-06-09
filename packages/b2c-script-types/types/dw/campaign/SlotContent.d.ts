import MarkupText = require('../content/MarkupText');
import Collection = require('../util/Collection');
import utilMap = require('../util/Map');

/**
 * Represents content for a slot.
 */
declare class SlotContent {
    /**
     * Returns the callout message for the slot.
     */
    readonly calloutMsg: MarkupText;
    /**
     * Returns a collection of content based on the content type
     * for the slot. The collection will include one of the following
     * types: dw.catalog.Product, dw.content.Content, dw.catalog.Category, or dw.content.MarkupText.
     */
    readonly content: Collection<any>;
    /**
     * Returns the custom attributes for the slot.
     */
    readonly custom: utilMap<any, any>;
    /**
     * Returns the recommender name for slot configurations of type 'Recommendation'
     */
    readonly recommenderName: string;
    /**
     * Returns the unique slot ID.
     */
    readonly slotID: string;
    private constructor();
    /**
     * Returns the callout message for the slot.
     */
    getCalloutMsg(): MarkupText;
    /**
     * Returns a collection of content based on the content type
     * for the slot. The collection will include one of the following
     * types: dw.catalog.Product, dw.content.Content, dw.catalog.Category, or dw.content.MarkupText.
     */
    getContent(): Collection<any>;
    /**
     * Returns the custom attributes for the slot.
     */
    getCustom(): utilMap<any, any>;
    /**
     * Returns the recommender name for slot configurations of type 'Recommendation'
     */
    getRecommenderName(): string;
    /**
     * Returns the unique slot ID.
     */
    getSlotID(): string;
}

export = SlotContent;
