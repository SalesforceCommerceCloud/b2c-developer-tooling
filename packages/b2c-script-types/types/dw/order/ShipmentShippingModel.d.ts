import Collection = require('../util/Collection');
import ShippingMethod = require('./ShippingMethod');
import ShipmentShippingCost = require('./ShipmentShippingCost');

/**
 * Instances of ShipmentShippingModel provide access to shipment-level
 * shipping information, such as applicable and inapplicable shipping methods
 * and shipping cost.
 * 
 * Use dw.order.ShippingMgr.getShipmentShippingModel to get
 * the shipping model for a specific shipment.
 */
declare class ShipmentShippingModel {
    /**
     * Returns the active applicable shipping methods for the shipment related
     * to this shipping model. A shipping method is applicable for a shipment
     * if it does not exclude any of the products in the shipment, and does
     * not exclude the shipment's shipping address, if this is set. Also checks
     * that the the shipment customer belongs to an assigned customer group of the shipment
     * (if any are assigned).
     */
    readonly applicableShippingMethods: Collection<ShippingMethod>;
    /**
     * Returns the active inapplicable shipping methods for the shipment related
     * to this shipping model. A shipping method is inapplicable for a shipment
     * if it is inapplicable for at least one product contained in the
     * shipment, or the shipping address is excluded by the shipping method, or the
     * shipping method is restricted to customer groups that the shipment customer
     * is not a part of.
     */
    readonly inapplicableShippingMethods: Collection<ShippingMethod>;
    private constructor();
    /**
     * Returns the active applicable shipping methods for the shipment related
     * to this shipping model. A shipping method is applicable for a shipment
     * if it does not exclude any of the products in the shipment, and does
     * not exclude the shipment's shipping address, if this is set. Also checks
     * that the the shipment customer belongs to an assigned customer group of the shipment
     * (if any are assigned).
     */
    getApplicableShippingMethods(): Collection<ShippingMethod>;
    /**
     * Returns the active applicable shipping methods for the shipment related
     * to this shipping model and the specified shipping address. A shipping
     * method is applicable if it does not exclude any of the products in the
     * shipment, it does not exclude the specified shipping address, and the
     * shipment customer belongs to an assigned customer group for the shipment (if
     * any are assigned).
     * 
     * The parameter shippingAddressObj must be a JavaScript literal with the
     * same properties as an OrderAddress object, or alternatively a Map.
     * For example:
     * 
     * ```
     * model.getApplicableShippingMethods (
     * { countryCode: "US",
     * stateCode: "MA,
     * custom { POBox : true }
     * }
     * )
     * ```
     * 
     * This method is useful when it is needed to retrieve the list of
     * applicable shipping methods for an address before the address is saved to
     * the shipment.
     */
    getApplicableShippingMethods(shippingAddressObj: any): Collection<ShippingMethod>;
    /**
     * Returns the active inapplicable shipping methods for the shipment related
     * to this shipping model. A shipping method is inapplicable for a shipment
     * if it is inapplicable for at least one product contained in the
     * shipment, or the shipping address is excluded by the shipping method, or the
     * shipping method is restricted to customer groups that the shipment customer
     * is not a part of.
     */
    getInapplicableShippingMethods(): Collection<ShippingMethod>;
    /**
     * Returns the active inapplicable shipping methods for the shipment related
     * to this shipping model and the specified shipping address. A shipping
     * method is inapplicable if it is inapplicable for at least one product
     * contained in the shipment, or the specified shipping address is excluded
     * by the shipping method, or the shipping method is restricted to customer
     * groups that the shipment customer is not a part of.
     * 
     * The parameter shippingAddressObj must be a JavaScript literal with the
     * same properties as an OrderAddress object, or alternatively a Map.
     * For example:
     * 
     * ```
     * model.getApplicableShippingMethods (
     * { countryCode: "US",
     * stateCode: "MA,
     * custom { POBox : true }
     * }
     * )
     * ```
     * 
     * This method is useful when it is needed to retrieve the list of
     * applicable shipping methods for an address before the address is saved to
     * the shipment.
     */
    getInapplicableShippingMethods(shippingAddressObj: any): Collection<ShippingMethod>;
    /**
     * Returns the shipping cost object for the related shipment and
     * the specified shipping method. Shipping cost for shipments
     * depended on the merchandise total of the shipment. The method
     * uses the adjusted merchandise total after product and order discounts,
     * and excluding products with product-level fixed-price shipping
     * cost.
     */
    getShippingCost(shippingMethod: ShippingMethod): ShipmentShippingCost;
}

export = ShipmentShippingModel;
