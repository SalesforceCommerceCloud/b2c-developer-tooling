/**
 * 
 * 
 * This class represents a store inventory filter value, which can be used for a StoreInventoryFilter to filter
 * the search result by one or more store inventory list IDs via
 * ProductSearchModel.setStoreInventoryFilter. Compared to
 * ProductSearchModel.setInventoryListIDs the store inventory filter allows a customization of the
 * inventory parameter name and the inventory list ID values for URL generations. A StoreInventoryFilterValue provides
 * the mapping between a semantic value e.g. store1,store2 or Burlington,Boston to the related real inventory list ID.
 * 
 * Example custom URL: city=Burlington|Boston
 * @example
 * new dw.catalog.StoreInventoryFilter("city",
 * new dw.util.ArrayList(
 * new dw.catalog.StoreInventoryFilterValue("Burlington","inventory_store_store9"),
 * new dw.catalog.StoreInventoryFilterValue("Boston","inventory_store_store8")
 * ));
 */
declare class StoreInventoryFilterValue {
    /**
     * Returns the real inventory list ID of this store inventory filter value.
     */
    readonly inventoryListID: string;
    /**
     * Returns the semantic inventory ID of this store inventory filter value.
     */
    readonly semanticInventoryID: string;
    /**
     * 
     * 
     * Creates a new StoreInventoryFilterValue instance for the semantic inventory ID and real inventory list ID.
     * @throws NullArgumentException in case of missing required parameter.
     */
    constructor(semanticInventoryListID: string, inventoryListID: string);
    /**
     * Returns the real inventory list ID of this store inventory filter value.
     */
    getInventoryListID(): string;
    /**
     * Returns the semantic inventory ID of this store inventory filter value.
     */
    getSemanticInventoryID(): string;
}

export = StoreInventoryFilterValue;
