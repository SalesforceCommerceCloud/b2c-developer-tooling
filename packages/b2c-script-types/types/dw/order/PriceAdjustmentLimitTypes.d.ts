/**
 * Helper class containing price adjustment limit types.
 */
declare class PriceAdjustmentLimitTypes {
    /**
     * Constant for Price Adjustment Limit Type Item.
     * 
     * The price adjustment limit was created at the item level.
     */
    static readonly TYPE_ITEM: string;
    /**
     * Constant for Price Adjustment Limit Type Order.
     * 
     * The price adjustment limit was created at the order level.
     */
    static readonly TYPE_ORDER: string;
    /**
     * Constant for Price Adjustment Limit Type Shipping.
     * 
     * The price adjustment limit was created at the shipping item level.
     */
    static readonly TYPE_SHIPPING: string;
    private constructor();
}

export = PriceAdjustmentLimitTypes;
