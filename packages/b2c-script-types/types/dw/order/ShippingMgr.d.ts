import Money = require('../value/Money');
import ShippingMethod = require('./ShippingMethod');
import ProductShippingModel = require('./ProductShippingModel');
import Product = require('../catalog/Product');
import ShipmentShippingModel = require('./ShipmentShippingModel');
import Shipment = require('./Shipment');
import Collection = require('../util/Collection');
import LineItemCtnr = require('./LineItemCtnr');

/**
 * Provides methods to access the shipping information.
 */
declare class ShippingMgr {
    /**
     * Returns the active shipping methods of the current site applicable to the session currency and current customer group.
     */
    static readonly allShippingMethods: Collection<ShippingMethod>;
    /**
     * Returns the default shipping method of the current site applicable to the session currency.
     * 
     * Does an additional check if there is a base method and if their currencies are
     * the same. Returns NULL if the two currencies are different.
     */
    static readonly defaultShippingMethod: ShippingMethod | null;
    private constructor();
    /**
     * Applies product and shipment-level shipping cost to the specified line
     * item container.
     * 
     * For each product line item in the specified line item container, a
     * product shipping line item is created if product-level shipping cost is
     * defined for the product. If no product-level shipping cost is defined for
     * the product, an existing product shipping line item is removed.
     * 
     * For each shipment in the specified line item container, shipment-level
     * shipping cost is calculated. This cost is determined based on the
     * merchandise total of the shipment after all product and order discounts.
     * Only products without or with surcharge product-specific shipping cost
     * count towards this merchandise total. Products with fixed
     * product-specific shipping cost don't count towards the merchandise total
     * used to calculate shipment-level shipping cost. The calculated shipping
     * cost is set at the standard shipping line item of the shipment.
     * 
     * If 'net' taxation is configured for the site, the merchandise total
     * before tax is used. If 'gross' taxation is configured for the site, the
     * merchandise total after tax is used.
     * 
     * If no shipping method is set for a shipment, neither product nor
     * shipment-level shipping cost can be calculated. In this case, the amount
     * of the standard shipment shipping line item will be set to N/A, and
     * shipping line items of product line items in this shipment will be
     * removed from the line item container.
     * 
     * Special cases for product-level shipping cost:
     * 
     * - if a product is member of multiple shipping cost groups, the lowest
     * shipping cost takes precedence
     * - if fixed and surcharge shipping cost is defined for a product, the
     * fixed cost takes precedence
     * - shipping cost defined for a master product is also defined for all
     * variants of this master
     * - shipping cost is not applied to bundled product line items or options
     * line items
     */
    static applyShippingCost(lineItemCtnr: LineItemCtnr<any>): void;
    /**
     * Returns the active shipping methods of the current site applicable to the session currency and current customer group.
     */
    static getAllShippingMethods(): Collection<ShippingMethod>;
    /**
     * Returns the default shipping method of the current site applicable to the session currency.
     * 
     * Does an additional check if there is a base method and if their currencies are
     * the same. Returns NULL if the two currencies are different.
     */
    static getDefaultShippingMethod(): ShippingMethod | null;
    /**
     * Returns the shipping model for the specified product.
     */
    static getProductShippingModel(product: Product<any>): ProductShippingModel;
    /**
     * Returns the shipping model for the specified shipment.
     */
    static getShipmentShippingModel(shipment: Shipment): ShipmentShippingModel;
    /**
     * Returns the shipping cost amount for the specified shipping method and
     * the specified order value.
     * 
     * If shipping cost cannot be calculated for any reason, Money.NA is
     * returned.
     */
    static getShippingCost(shippingMethod: ShippingMethod, orderValue: Money): Money;
}

export = ShippingMgr;
