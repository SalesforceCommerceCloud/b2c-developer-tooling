import Money = require('../value/Money');

/**
 * Instances of ProductShippingCost represent product specific shipping costs.
 * 
 * Use dw.order.ProductShippingModel.getShippingCost to get
 * the shipping cost for a specific product.
 */
declare class ProductShippingCost {
    /**
     * Returns the shipping amount.
     */
    readonly amount: Money;
    /**
     * Returns true if shipping cost is a fixed-price shipping cost,
     * and false if surcharge shipping cost.
     */
    readonly fixedPrice: boolean;
    /**
     * Returns true if shipping cost is a surcharge to the shipment
     * shipping cost, and false if fixed-price shipping cost.
     */
    readonly surcharge: boolean;
    private constructor();
    /**
     * Returns the shipping amount.
     */
    getAmount(): Money;
    /**
     * Returns true if shipping cost is a fixed-price shipping cost,
     * and false if surcharge shipping cost.
     */
    isFixedPrice(): boolean;
    /**
     * Returns true if shipping cost is a surcharge to the shipment
     * shipping cost, and false if fixed-price shipping cost.
     */
    isSurcharge(): boolean;
}

export = ProductShippingCost;
