import Collection = require('../util/Collection');
import ShippingMethod = require('./ShippingMethod');
import ProductShippingCost = require('./ProductShippingCost');

/**
 * Instances of ProductShippingModel provide access to product-level
 * shipping information, such as applicable or inapplicable shipping methods
 * and shipping cost defined for the product for a specified shipping
 * method.
 * 
 * Use dw.order.ShippingMgr.getProductShippingModel to get
 * the shipping model for a specific product.
 */
declare class ProductShippingModel {
    /**
     * Returns the active applicable shipping methods for the product related
     * to this shipping model, i.e. shipping methods the product can be shipped
     * with. A product can be shipping with a shipping methods if the shipping
     * method is not explicitely marked as inapplicable for this product.
     */
    readonly applicableShippingMethods: Collection<ShippingMethod>;
    /**
     * Returns the active inapplicable shipping methods for the product related
     * to this shipping model, i.e. shipping methods the product cannot be
     * shipped with. A product cannot be shipping with a shipping methods if the
     * shipping method is explicitely marked as inapplicable for this product.
     */
    readonly inapplicableShippingMethods: Collection<ShippingMethod>;
    /**
     * Returns the active shipping methods for which either any fixed-price or
     * surcharge product-level shipping cost is defined for the specified product.
     * 
     * Note that this can include inapplicable shipping methods
     * (see getInapplicableShippingMethods).
     */
    readonly shippingMethodsWithShippingCost: Collection<ShippingMethod>;
    private constructor();
    /**
     * Returns the active applicable shipping methods for the product related
     * to this shipping model, i.e. shipping methods the product can be shipped
     * with. A product can be shipping with a shipping methods if the shipping
     * method is not explicitely marked as inapplicable for this product.
     */
    getApplicableShippingMethods(): Collection<ShippingMethod>;
    /**
     * Returns the active inapplicable shipping methods for the product related
     * to this shipping model, i.e. shipping methods the product cannot be
     * shipped with. A product cannot be shipping with a shipping methods if the
     * shipping method is explicitely marked as inapplicable for this product.
     */
    getInapplicableShippingMethods(): Collection<ShippingMethod>;
    /**
     * Returns the shipping cost object for the related product and
     * the specified shipping method, or null if no product-level fixed-price or
     * surcharge shipping cost are defined for the specified product.
     * 
     * The following rules apply:
     * 
     * - if fixed and surcharge shipping cost is defined for a product, the fixed cost takes precedence
     * - if a product is member of multiple shipping cost groups, the lowest shipping cost takes precedence
     */
    getShippingCost(shippingMethod: ShippingMethod): ProductShippingCost | null;
    /**
     * Returns the active shipping methods for which either any fixed-price or
     * surcharge product-level shipping cost is defined for the specified product.
     * 
     * Note that this can include inapplicable shipping methods
     * (see getInapplicableShippingMethods).
     */
    getShippingMethodsWithShippingCost(): Collection<ShippingMethod>;
}

export = ProductShippingModel;
