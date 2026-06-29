import ProductInventoryRecord = require('./ProductInventoryRecord');
import ProductAvailabilityLevels = require('./ProductAvailabilityLevels');

/**
 * The ProductAvailabilityModel provides methods for retrieving all information
 * on availability of a single product.
 * 
 * When using Omnichannel Inventory (OCI):
 * 
 * - OCI supports backorders, but does not support preorders or perpetual availability. OCI refers to expected
 * restocks as Future inventory.
 * - OCI uses an eventual consistency model with asynchronous inventory data updates. Your code must not assume that
 * inventory-affecting actions, such as placing orders, will immediately change inventory levels.
 */
declare class ProductAvailabilityModel {
    /**
     * Indicates that the product stock has run out, but will be replenished, and is therefore available for ordering.
     */
    static readonly AVAILABILITY_STATUS_BACKORDER: string;
    /**
     * Indicates that the product is in stock and available for ordering.
     */
    static readonly AVAILABILITY_STATUS_IN_STOCK: string;
    /**
     * Indicates that the product is not currently available for ordering.
     */
    static readonly AVAILABILITY_STATUS_NOT_AVAILABLE: string;
    /**
     * Indicates that the product is not yet in stock but is available for ordering.
     */
    static readonly AVAILABILITY_STATUS_PREORDER: string;
    /**
     * Returns the SKU coverage of the product.  The basic formula for a
     * master product is the ratio of online variations that are in stock
     * to the total number of online variations.  The following specific rules
     * apply for standard products:
     * 
     * - If the product is in stock this method returns the availability of the product.
     * - If the product is out of stock this method returns 0.
     * 
     * The following rules apply for special product types:
     * 
     * - For a master product this method returns the average SKU coverage
     * of its online variations.
     * - For a master product with no online variations this method returns 0.
     * - For a product set this method returns the ratio of orderable SKUs in the product set
     * over the total number of online SKUs in the product set.
     * - For a product set with no online products this method returns 0.
     * - For a product bundle this method returns 1 if all of the bundled
     * products are online, and 0 otherwise.
     * - For a product bundle with no online bundled products this method
     * returns 0.
     */
    readonly SKUCoverage: number;
    /**
     * Returns the availability of the product, which roughly defined is the
     * ratio of the original stock that is still available to sell.  The basic
     * formula, if the current site uses an
     * inventory list, is the ATS quantity divided by allocation
     * amount. If the product is not orderable at all this method returns 0.
     * The following specific rules apply for standard products:
     * 
     * - If inventory lists are in use:
     * 
     * - If no inventory record exists and the inventory list default-in-stock flag is true this method returns 1.
     * - If no inventory record exists the inventory list default-in-stock flag is false this method returns 0.
     * - If the product is not available this method returns 0.
     * - If the product is perpetually available this method returns 1.
     * - Otherwise, this method returns ATS / (allocation + preorderBackorderAllocation). (Values from dw.catalog.ProductInventoryRecord.)
     * 
     * If inventory lists are not in use the method returns 0.
     * 
     * The following rules apply for special product types:
     * 
     * - For a master product this method returns the average availability
     * of its online variations.
     * - For a master product with no online variations this method returns 0.
     * - For a master product with own inventory record the rules of the standard
     * products apply. Note: In this case the availability of the variations is not considered.
     * - For a product set this method returns the greatest availability of
     * the online products in the set.
     * - For a product set with no online products this method returns 0.
     * - For a product set with an inventory record the rules of the standard
     * products apply. Note: In this case the availability of the set products is not considered.
     * - For a bundle, this method returns the least availability of the bundled
     * products according to their bundled quantity and if it exist also from
     * the bundle inventory record.
     */
    readonly availability: number;
    /**
     * Returns the availability-status for the minimum-orderable-quantity (MOQ) of
     * the product.  The MOQ essentially represents a single orderable unit, and
     * therefore can be represented by a single availability-status.  This
     * method is essentially a convenience method.  The same information
     * can be retrieved by calling getAvailabilityLevels
     * with the MOQ of the product as the parameter and then retrieving the
     * single status from the returned map.
     * 
     * This method is typically used to display a product's availability in
     * the catalog when the order quantity is not known.
     */
    readonly availabilityStatus: string;
    /**
     * Convenience method for isInStock. Returns true, if the
     * Product is available in the minimum-order-quantity. If the product does
     * not have a minimum-order-quantity defined, in-stock is checked for a
     * quantity value 1.
     */
    readonly inStock: boolean;
    /**
     * Returns the ProductInventoryRecord for the Product associated
     * with this model.
     */
    readonly inventoryRecord: ProductInventoryRecord | null;
    /**
     * Convenience method for isOrderable. Returns true if the
     * Product is currently online (based on its online flag and online dates)
     * and is orderable in its minimum-order-quantity. If the product does not
     * have a minimum-order-quantity specified, then 1 is used. The method
     * returns false otherwise.
     * 
     * Note: Orderable status is more general than in-stock status. A product
     * may be out-of-stock but orderable because it is back-orderable or
     * pre-orderable.
     */
    readonly orderable: boolean;
    /**
     * Returns the number of hours before the product is expected to go out
     * of stock.  The basic formula is the ATS quantity divided by the
     * sales velocity for the most recent day.  The following specific rules
     * apply for standard products:
     * 
     * - If the product is out of stock this method returns 0.
     * - If the product is perpetually available this method returns 1.
     * - If the sales velocity or ATS is not available this method returns 0.
     * - Otherwise this method returns ATS / sales velocity.
     * 
     * The following rules apply for special product types:
     * 
     * - For a master product this method returns the greatest time to out
     * of stock of its online variations.
     * - For a master product with no online variations this method returns 0.
     * - For a product set this method returns the greatest time to out
     * of stock of the online products in the set.
     * - For a product set with no online products this method returns 0.
     * - For a bundle with no product inventory record, this method returns
     * the least time to out of stock of the online bundled products.
     * - For a bundle with no product inventory record, and no online
     * bundled products, this method returns 0.
     */
    readonly timeToOutOfStock: number;
    private constructor();
    /**
     * Returns the availability of the product, which roughly defined is the
     * ratio of the original stock that is still available to sell.  The basic
     * formula, if the current site uses an
     * inventory list, is the ATS quantity divided by allocation
     * amount. If the product is not orderable at all this method returns 0.
     * The following specific rules apply for standard products:
     * 
     * - If inventory lists are in use:
     * 
     * - If no inventory record exists and the inventory list default-in-stock flag is true this method returns 1.
     * - If no inventory record exists the inventory list default-in-stock flag is false this method returns 0.
     * - If the product is not available this method returns 0.
     * - If the product is perpetually available this method returns 1.
     * - Otherwise, this method returns ATS / (allocation + preorderBackorderAllocation). (Values from dw.catalog.ProductInventoryRecord.)
     * 
     * If inventory lists are not in use the method returns 0.
     * 
     * The following rules apply for special product types:
     * 
     * - For a master product this method returns the average availability
     * of its online variations.
     * - For a master product with no online variations this method returns 0.
     * - For a master product with own inventory record the rules of the standard
     * products apply. Note: In this case the availability of the variations is not considered.
     * - For a product set this method returns the greatest availability of
     * the online products in the set.
     * - For a product set with no online products this method returns 0.
     * - For a product set with an inventory record the rules of the standard
     * products apply. Note: In this case the availability of the set products is not considered.
     * - For a bundle, this method returns the least availability of the bundled
     * products according to their bundled quantity and if it exist also from
     * the bundle inventory record.
     */
    getAvailability(): number;
    /**
     * 
     * Returns an instance of dw.catalog.ProductAvailabilityLevels,
     * where each available quantity represents a part of the input quantity.
     * This method is typically used to display availability information in
     * the context of a known order quantity, e.g. a shopping cart.
     * 
     * For example, if for a given product
     * there are 3 pieces in stock with no pre/backorder handling specified,
     * and the order quantity is 10, then the return instance would have the
     * following state:
     * 
     * - dw.catalog.ProductAvailabilityLevels.getInStock - 3
     * - dw.catalog.ProductAvailabilityLevels.getPreorder - 0
     * - dw.catalog.ProductAvailabilityLevels.getBackorder - 0
     * - dw.catalog.ProductAvailabilityLevels.getNotAvailable - 7
     * 
     * The following assertions can be made about the state of the returned instance.
     * 
     * - Between 1 and 3 levels are non-zero.
     * - The sum of the levels equals the input quantity.
     * - dw.catalog.ProductAvailabilityLevels.getPreorder or dw.catalog.ProductAvailabilityLevels.getBackorder may be available, but not both.
     * 
     * Product bundles are handled specially:  The availability of product
     * bundles is calculated based on the availability of the bundled products.
     * Therefore, if a bundle contains products that are not in stock, then
     * the bundle itself is not in stock.  If all the products in the bundle
     * are on backorder, then the bundle itself is backordered.  If a product
     * bundle has its own inventory record, then this record may
     * further limit the availability.  If a bundle has no record, then
     * only the records of the bundled products are considered.
     * 
     * Product masters and product sets without an own inventory record are
     * handled specially too:   The availability is calculated based on the
     * availability of the variants or set products. A product master or product
     * set is in stock as soon as one of its variants or set products is in stock.
     * Each product master or product set availability level reflects the sum of
     * the variant or set product availability levels up to the specified quantity.
     * 
     * Product masters or product sets with own inventory record are handled like
     * standard products. The availability of the variants or set products is not
     * considered. (Such an inventory scenario should be avoided.)
     * 
     * Offline products are always unavailable and will result in returned
     * levels that are all unavailable.
     * 
     * When using Omnichannel Inventory (OCI), future restocks provided by OCI are mapped to
     * ProductAvailabilityModel.AVAILABILITY_STATUS_BACKORDER. For more information, see the comments for
     * dw.catalog.ProductInventoryRecord.
     * @throws IllegalArgumentException if the specified quantity is less or equal than zero
     * @see dw.catalog.ProductAvailabilityLevels
     */
    getAvailabilityLevels(quantity: number): ProductAvailabilityLevels;
    /**
     * Returns the availability-status for the minimum-orderable-quantity (MOQ) of
     * the product.  The MOQ essentially represents a single orderable unit, and
     * therefore can be represented by a single availability-status.  This
     * method is essentially a convenience method.  The same information
     * can be retrieved by calling getAvailabilityLevels
     * with the MOQ of the product as the parameter and then retrieving the
     * single status from the returned map.
     * 
     * This method is typically used to display a product's availability in
     * the catalog when the order quantity is not known.
     */
    getAvailabilityStatus(): string;
    /**
     * Returns the ProductInventoryRecord for the Product associated
     * with this model.
     */
    getInventoryRecord(): ProductInventoryRecord | null;
    /**
     * Returns the SKU coverage of the product.  The basic formula for a
     * master product is the ratio of online variations that are in stock
     * to the total number of online variations.  The following specific rules
     * apply for standard products:
     * 
     * - If the product is in stock this method returns the availability of the product.
     * - If the product is out of stock this method returns 0.
     * 
     * The following rules apply for special product types:
     * 
     * - For a master product this method returns the average SKU coverage
     * of its online variations.
     * - For a master product with no online variations this method returns 0.
     * - For a product set this method returns the ratio of orderable SKUs in the product set
     * over the total number of online SKUs in the product set.
     * - For a product set with no online products this method returns 0.
     * - For a product bundle this method returns 1 if all of the bundled
     * products are online, and 0 otherwise.
     * - For a product bundle with no online bundled products this method
     * returns 0.
     */
    getSKUCoverage(): number;
    /**
     * Returns the number of hours before the product is expected to go out
     * of stock.  The basic formula is the ATS quantity divided by the
     * sales velocity for the most recent day.  The following specific rules
     * apply for standard products:
     * 
     * - If the product is out of stock this method returns 0.
     * - If the product is perpetually available this method returns 1.
     * - If the sales velocity or ATS is not available this method returns 0.
     * - Otherwise this method returns ATS / sales velocity.
     * 
     * The following rules apply for special product types:
     * 
     * - For a master product this method returns the greatest time to out
     * of stock of its online variations.
     * - For a master product with no online variations this method returns 0.
     * - For a product set this method returns the greatest time to out
     * of stock of the online products in the set.
     * - For a product set with no online products this method returns 0.
     * - For a bundle with no product inventory record, this method returns
     * the least time to out of stock of the online bundled products.
     * - For a bundle with no product inventory record, and no online
     * bundled products, this method returns 0.
     */
    getTimeToOutOfStock(): number;
    /**
     * Returns true if the Product is in-stock in the given quantity. This is
     * determined as follows:
     * 
     * - If the product is not currently online (based on its online flag and
     * online dates), then return false.
     * - If there is no inventory-list for the current site, then return
     * false.
     * - If there is no inventory-record for the product, then return the
     * default setting on the inventory-list.
     * - If there is no allocation-amount on the inventory-record, then return
     * the value of the perpetual-flag.
     * - If there is an allocation-amount, but the perpetual-flag is true,
     * then return true.
     * - If the quantity is less than or equal to the stock-level, then return
     * true.
     * - Otherwise return false.
     * @throws Exception if the specified quantity is less or equal than zero
     */
    isInStock(quantity: number): boolean;
    /**
     * Convenience method for isInStock. Returns true, if the
     * Product is available in the minimum-order-quantity. If the product does
     * not have a minimum-order-quantity defined, in-stock is checked for a
     * quantity value 1.
     */
    isInStock(): boolean;
    /**
     * Returns true if the Product is currently online (based on its online flag
     * and online dates) and the specified quantity does not exceed the quantity
     * available for sale, and returns false otherwise.
     * 
     * Note: Orderable status is more general than in-stock status. A product
     * may be out-of-stock but orderable because it is back-orderable or
     * pre-orderable.
     * @throws Exception if the specified quantity is less or equal than zero
     */
    isOrderable(quantity: number): boolean;
    /**
     * Convenience method for isOrderable. Returns true if the
     * Product is currently online (based on its online flag and online dates)
     * and is orderable in its minimum-order-quantity. If the product does not
     * have a minimum-order-quantity specified, then 1 is used. The method
     * returns false otherwise.
     * 
     * Note: Orderable status is more general than in-stock status. A product
     * may be out-of-stock but orderable because it is back-orderable or
     * pre-orderable.
     */
    isOrderable(): boolean;
}

export = ProductAvailabilityModel;
