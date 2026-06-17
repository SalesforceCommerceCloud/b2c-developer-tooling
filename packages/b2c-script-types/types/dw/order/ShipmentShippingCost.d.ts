import Money = require('../value/Money');

/**
 * Represents shipping cost applied to shipments.
 * 
 * Returned by
 * dw.order.ShipmentShippingModel.getShippingCost.
 */
declare class ShipmentShippingCost {
    /**
     * Returns the shipping amount.
     */
    readonly amount: Money;
    private constructor();
    /**
     * Returns the shipping amount.
     */
    getAmount(): Money;
}

export = ShipmentShippingCost;
