import Collection = require('./Collection');
import utilMap = require('./Map');

/**
 * dw.util.FilteringCollection is an extension of
 * dw.util.Collection which provides possibilities to
 * 
 * - filter the elements to return a new
 * dw.util.FilteringCollection with a filtered set of elements
 * - sort the elements to return a new
 * dw.util.FilteringCollection with a defined sort order
 * - transform the elements to return a new
 * dw.util.FilteringCollection containing related elements
 * - provide a map of the elements against a predefined key
 * 
 * Usage - In the current version each
 * dw.util.FilteringCollection provides a set of predefined
 * qualifier constants which can be passed into the
 * select method used to filter the elements. Generally
 * qualifiers have the prefix QUALIFIER_. A second method
 * sort is used to create a new instance with a different
 * element ordering, which takes an orderB< constant. Generally
 * orderBys have the prefix ORDERBY_: examples are
 * dw.order.ShippingOrder.ORDERBY_ITEMID,
 * dw.order.ShippingOrder.ORDERBY_ITEMPOSITION, and ORDERBY_REVERSE can
 * be used to provide a dw.util.FilteringCollection with the reverse
 * ordering. An example with method dw.order.ShippingOrder.getItems:
 * 
 * `
 * 
 * var allItems     : FilteringCollection = shippingOrder.items;
 * 
 * var productItems : FilteringCollection = allItems.select(ShippingOrder.QUALIFIER_PRODUCTITEMS);
 * 
 * var serviceItems : FilteringCollection = allItems.select(ShippingOrder.QUALIFIER_SERVICEITEMS);
 * 
 * var byPosition   : FilteringCollection = productItems.sort(ShippingOrder.ORDERBY_ITEMPOSITION);
 * 
 * var revByPosition: FilteringCollection = byPosition.sort(FilteringCollection.ORDERBY_REVERSE);
 * 
 * var mapByItemID  : Map = allItems.asMap();
 * `
 */
declare class FilteringCollection<T> extends Collection<T> {
    /**
     * Pass this orderBy with the sort method to
     * obtain a new dw.util.FilteringCollection with the reversed sort
     * order. Only use on a dw.util.FilteringCollection which has been
     * previously sorted.
     */
    static readonly ORDERBY_REVERSE: any;
    private constructor();
    /**
     * Returns a dw.util.Map containing the elements of this
     * dw.util.FilteringCollection against a predefined key. The key
     * used is documented in the method returning the
     * dw.util.FilteringCollection and is typically the ItemID assigned
     * to an element in the collection.
     */
    asMap(): utilMap<any, any>;
    /**
     * Select a new dw.util.FilteringCollection instance by passing a
     * predefined qualifier as an argument to this method. See
     * dw.util.FilteringCollection.
     */
    select(qualifier: any): FilteringCollection<T>;
    /**
     * Select a new dw.util.FilteringCollection instance by passing a
     * predefined orderBy as an argument to this method. See
     * dw.util.FilteringCollection.
     */
    sort(qualifier: any): FilteringCollection<T>;
}

export = FilteringCollection;
