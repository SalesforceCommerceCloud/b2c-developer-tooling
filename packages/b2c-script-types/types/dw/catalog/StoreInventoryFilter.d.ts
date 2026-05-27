import List = require('../util/List');
import StoreInventoryFilterValue = require('./StoreInventoryFilterValue');

/**
 * 
 * 
 * This class represents a store inventory filter, which can be used at
 * ProductSearchModel.setStoreInventoryFilter to filter the search result by one or more
 * store inventories. Compared to the default parameter 'ilids' (Inventory List IDs) see
 * (ProductSearchModel.INVENTORY_LIST_IDS_PARAMETER the store inventory filter allows a customization of the
 * parameter name and the inventory list ID parameter values for the URL generations via all URLRefine and URLRelax
 * methods e.g. for ProductSearchModel.urlRefineCategory,
 * ProductSearchModel.urlRelaxPrice,
 * SearchModel.urlRefineAttribute.
 * 
 * Example custom URL: city=Burlington|Boston
 * @example
 * new dw.catalog.StoreInventoryFilter( "city",
 * new dw.util.ArrayList( new dw.catalog.StoreInventoryFilterValue( "Burlington", "inventory_store_store9" ),
 * new dw.catalog.StoreInventoryFilterValue( "Boston", "inventory_store_store8" ) ) );
 */
declare class StoreInventoryFilter {
    /**
     * Returns the semantic URL parameter of this StoreInventoryFilter.
     */
    readonly semanticURLParameter: string;
    /**
     * Returns a list of StoreInventoryFilterValue instances used by this StoreInventoryFilter.
     */
    readonly storeInventoryFilterValues: List<StoreInventoryFilterValue>;
    /**
     * Creates a new StoreInventoryFilter instance for the given semantic URL parameter and a list of
     * StoreInventoryFilterValue instances. The semantic URL parameter e.g. city, zip, store and the semantic
     * store inventory values from the storeFilterValues will be used for URL generation. The mapped inventory list IDs
     * from the storeFilterValues will be used for filtering. on the mapped
     * @throws NullArgumentException in case of missing required parameter.
     */
    constructor(semanticURLParameter: string, storeFilterValues: List<any>);
    /**
     * Returns the semantic URL parameter of this StoreInventoryFilter.
     */
    getSemanticURLParameter(): string;
    /**
     * Returns a list of StoreInventoryFilterValue instances used by this StoreInventoryFilter.
     */
    getStoreInventoryFilterValues(): List<StoreInventoryFilterValue>;
}

export = StoreInventoryFilter;
