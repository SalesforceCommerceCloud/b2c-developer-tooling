import ExtensibleObject = require('../object/ExtensibleObject');
import CustomAttributes = require('../object/CustomAttributes');
import Quantity = require('../value/Quantity');
import ObjectTypeDefinition = require('../object/ObjectTypeDefinition');

declare global {
    module ICustomAttributes {
        interface ProductInventoryRecord extends CustomAttributes {
        }
    }
}

/**
 * The ProductInventoryRecord holds information about a Product's inventory, and availability.
 * 
 * When using Omnichannel Inventory (OCI):
 * 
 * - All ProductInventoryRecord properties are read-only. Calling any setter method throws an
 * IllegalStateException.
 * - The ProductInventoryRecord class does not support custom properties.
 * - isPerpetual and isPreorderable always return false.
 */
declare class ProductInventoryRecord extends ExtensibleObject<ICustomAttributes.ProductInventoryRecord> {
    /**
     * Returns the quantity of items available to sell (ATS). This is calculated as the allocation
     * (getAllocation) plus the preorderBackorderAllocation (getPreorderBackorderAllocation) minus
     * the turnover (getTurnover) minus the on order quantity (getOnOrder).
     * 
     * When using OCI, corresponds to the ATO (Available To Order) quantity in OCI.
     */
    readonly ATS: Quantity;
    /**
     * Returns the allocation quantity that is currently set. The quantity unit is the same unit as the product itself.
     * 
     * When using OCI, returns the physically available quantity. Corresponds to the On Hand quantity in OCI.
     */
    allocation: Quantity;
    /**
     * Returns the date the allocation quantity was initialized or reset.
     * 
     * When using OCI, corresponds to the Effective Date in OCI. The value can be null.
     */
    readonly allocationResetDate: Date;
    /**
     * Determines if the product is backorderable.
     * 
     * When using OCI, returns true if the product has at least one Future quantity in OCI.
     */
    backorderable: boolean;
    /**
     * Returns the date that the item is expected to be in stock.
     * 
     * When using OCI, returns the date of the earliest Future quantity. If the product has no Future quantities, it
     * returns null.
     */
    inStockDate: Date;
    /**
     * Returns the on-hand quantity, the actual quantity of available (on-hand) items.
     * @deprecated Use getStockLevel instead.
     */
    readonly onHand: Quantity;
    /**
     * Returns the quantity that is currently on order.
     * 
     * This is only relevant when On Order Inventory is turned on for the related inventory list. On Order is a bucket
     * of inventory used for the time between order creation and order export to external (warehouse) systems. On Order
     * value is increased when an order is created. It will be decreased and with that turnover will be increased when
     * the order is exported, see getTurnover. Notice that dw.order.Order.setExportStatus and
     * dw.order.OrderItem.allocateInventory will decrease the On Order value. On order will be included
     * in the ATS calculation, see getATS.
     * 
     * When using OCI, always returns zero. OCI doesn't support On Order inventory.
     */
    readonly onOrder: Quantity;
    /**
     * Determines if the product is perpetually in stock.
     * 
     * When using OCI, always returns false.
     */
    perpetual: boolean;
    /**
     * Returns the quantity of items that are allocated for sale, beyond the initial stock allocation.
     * 
     * When using OCI, returns the sum of all Future quantities. If the product has no Future quantities, it returns
     * zero.
     */
    preorderBackorderAllocation: Quantity;
    /**
     * Determines if the product is preorderable.
     * 
     * When using OCI, always returns false.
     */
    preorderable: boolean;
    /**
     * Returns the quantity of items that are reserved.
     * 
     * Note that for products with high velocity and concurrency, the return value is extremely volatile and the
     * retrieval will be expensive.
     * 
     * When using OCI, always returns zero.
     */
    readonly reserved: Quantity;
    /**
     * Returns the current stock level. This is calculated as the allocation minus the turnover.
     * 
     * When using OCI, corresponds to the ATF (Available To Fulfill) quantity in OCI.
     */
    readonly stockLevel: Quantity;
    /**
     * Returns the sum of all inventory transactions (decrements and increments) recorded after the allocation reset
     * date. If the total decremented quantity is greater than the total incremented quantity, then this value is
     * negative.
     * 
     * When using OCI, returns the total reserved quantity, including order, basket, and temporary reservations.
     */
    readonly turnover: Quantity;
    private constructor();
    /**
     * Returns the meta data of this object. If no meta data is available the method returns null. The returned
     * ObjectTypeDefinition can be used to retrieve the metadata for any of the custom attributes.
     * 
     * When using Omnichannel Inventory (OCI), this class doesn't support custom attributes. If OCI is enabled, then
     * attempting to set or modify a custom attribute value throws an UnsupportedOperationException.
     */
    describe(): ObjectTypeDefinition;
    /**
     * Returns the quantity of items available to sell (ATS). This is calculated as the allocation
     * (getAllocation) plus the preorderBackorderAllocation (getPreorderBackorderAllocation) minus
     * the turnover (getTurnover) minus the on order quantity (getOnOrder).
     * 
     * When using OCI, corresponds to the ATO (Available To Order) quantity in OCI.
     */
    getATS(): Quantity;
    /**
     * Returns the allocation quantity that is currently set. The quantity unit is the same unit as the product itself.
     * 
     * When using OCI, returns the physically available quantity. Corresponds to the On Hand quantity in OCI.
     */
    getAllocation(): Quantity;
    /**
     * Returns the date the allocation quantity was initialized or reset.
     * 
     * When using OCI, corresponds to the Effective Date in OCI. The value can be null.
     */
    getAllocationResetDate(): Date;
    /**
     * Returns the date that the item is expected to be in stock.
     * 
     * When using OCI, returns the date of the earliest Future quantity. If the product has no Future quantities, it
     * returns null.
     */
    getInStockDate(): Date;
    /**
     * Returns the on-hand quantity, the actual quantity of available (on-hand) items.
     * @deprecated Use getStockLevel instead.
     */
    getOnHand(): Quantity;
    /**
     * Returns the quantity that is currently on order.
     * 
     * This is only relevant when On Order Inventory is turned on for the related inventory list. On Order is a bucket
     * of inventory used for the time between order creation and order export to external (warehouse) systems. On Order
     * value is increased when an order is created. It will be decreased and with that turnover will be increased when
     * the order is exported, see getTurnover. Notice that dw.order.Order.setExportStatus and
     * dw.order.OrderItem.allocateInventory will decrease the On Order value. On order will be included
     * in the ATS calculation, see getATS.
     * 
     * When using OCI, always returns zero. OCI doesn't support On Order inventory.
     */
    getOnOrder(): Quantity;
    /**
     * Returns the quantity of items that are allocated for sale, beyond the initial stock allocation.
     * 
     * When using OCI, returns the sum of all Future quantities. If the product has no Future quantities, it returns
     * zero.
     */
    getPreorderBackorderAllocation(): Quantity;
    /**
     * Returns the quantity of items that are reserved.
     * 
     * Note that for products with high velocity and concurrency, the return value is extremely volatile and the
     * retrieval will be expensive.
     * 
     * When using OCI, always returns zero.
     */
    getReserved(): Quantity;
    /**
     * Returns the current stock level. This is calculated as the allocation minus the turnover.
     * 
     * When using OCI, corresponds to the ATF (Available To Fulfill) quantity in OCI.
     */
    getStockLevel(): Quantity;
    /**
     * Returns the sum of all inventory transactions (decrements and increments) recorded after the allocation reset
     * date. If the total decremented quantity is greater than the total incremented quantity, then this value is
     * negative.
     * 
     * When using OCI, returns the total reserved quantity, including order, basket, and temporary reservations.
     */
    getTurnover(): Quantity;
    /**
     * Determines if the product is backorderable.
     * 
     * When using OCI, returns true if the product has at least one Future quantity in OCI.
     */
    isBackorderable(): boolean;
    /**
     * Determines if the product is perpetually in stock.
     * 
     * When using OCI, always returns false.
     */
    isPerpetual(): boolean;
    /**
     * Determines if the product is preorderable.
     * 
     * When using OCI, always returns false.
     */
    isPreorderable(): boolean;
    /**
     * Sets the allocation quantity. This also updates the allocation reset date.
     * 
     * All final reservations will be considered as expired and will therefore no longer be considered for ATS.
     * 
     * When using OCI, throws an IllegalStateException.
     * 
     * This method should not be called within a storefront request.
     */
    setAllocation(quantity: number): void;
    /**
     * Sets the allocation quantity. This also updates the allocation reset date.
     * 
     * Any final reservations made prior to the allocation reset date will be considered as expired and will therefore
     * no longer be considered for ATS.
     * 
     * When using OCI, throws an IllegalStateException.
     * 
     * This method must not be called within a storefront request.
     */
    setAllocation(quantity: number, allocationResetDate: Date): void;
    /**
     * The method is used to set whether the product is backorderable. Setting the backorderable flag to true will clear
     * the preorderable flag. If the record's preorderable flag is set to true, calling this method with
     * backorderableFlag==false will have no effect.
     * 
     * When using OCI, throws an IllegalStateException.
     * 
     * This method should not be called within a storefront request.
     * 
     * This method must not be called within a storefront request when the API version is 21.7 or later.
     */
    setBackorderable(backorderableFlag: boolean): void;
    /**
     * Sets the date that the item is expected to be in stock.
     * 
     * When using OCI, throws an IllegalStateException.
     * 
     * This method should not be called within a storefront request.
     * 
     * This method must not be called within a storefront request when the API version is 21.7 or later.
     */
    setInStockDate(inStockDate: Date): void;
    /**
     * Sets if the product is perpetually in stock.
     * 
     * When using OCI, throws an IllegalStateException.
     * 
     * This method should not be called within a storefront request.
     * 
     * This method must not be called within a storefront request when the API version is 21.7 or later.
     */
    setPerpetual(perpetualFlag: boolean): void;
    /**
     * Sets the quantity of items that are allocated for sale, beyond the initial stock allocation.
     * 
     * When using OCI, throws an IllegalStateException.
     * 
     * This method should not be called within a storefront request.
     * 
     * This method must not be called within a storefront request when the API version is 21.7 or later.
     */
    setPreorderBackorderAllocation(quantity: number): void;
    /**
     * The method is used to set whether the product is preorderable. Setting the preorderable flag to true will clear
     * the backorderable flag. If the record's backorderable flag is set to true, calling this method with
     * preorderableFlag==false will have no effect.
     * 
     * When using OCI, throws an IllegalStateException.
     * 
     * This method should not be called within a storefront request.
     * 
     * This method must not be called within a storefront request when the API version is 21.7 or later.
     */
    setPreorderable(preorderableFlag: boolean): void;
}

export = ProductInventoryRecord;
