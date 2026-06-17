import Discount = require('./Discount');
import Money = require('../value/Money');

/**
 * Transient class representing a discount that a dw.order.LineItemCtnr
 * "almost" qualifies for based on the amount of merchandise in it. Storefronts
 * can display information about approaching discounts to customers in order to
 * entice them to buy more merchandise.
 * 
 * Approaching discounts are calculated on the basis of a
 * dw.campaign.DiscountPlan instead of a LineItemCtnr itself. When one
 * of dw.campaign.PromotionMgr.getDiscounts or
 * dw.campaign.PromotionMgr.getDiscounts is
 * called, the promotions engine calculates the discounts the LineItemCtnr
 * receives based on the promotions in context, and also tries to determine the
 * discounts the LineItemCtnr would receive if additional merchandise were
 * added. DiscountPlan provides different methods to retrieve this approaching
 * discount info. Merchants can use these fine-grained methods to display
 * information about approaching order discounts on the cart page, and
 * approaching shipping discounts on the shipping method page during checkout,
 * for example.
 * 
 * The merchant may include or exclude individual promotions from being included
 * in this list, and define distance thresholds when configuring their
 * promotions.
 */
declare class ApproachingDiscount {
    /**
     * The amount of merchandise required in the cart in order to receive the
     * discount. For an order promotion "Get 15% off orders of $100 or more",
     * the condition threshold is $100.00.
     */
    readonly conditionThreshold: Money;
    /**
     * The discount that the customer will receive if he adds more merchandise
     * to the cart. For an order promotion "Get 15% off orders of $100 or more",
     * the discount is a PercentageDiscount object.
     */
    readonly discount: Discount;
    /**
     * Convenience method that returns
     * `getConditionThreshold().subtract(getMerchandiseValue())`
     */
    readonly distanceFromConditionThreshold: Money;
    /**
     * The amount of merchandise in the cart contributing towards the condition
     * threshold. This will always be less than the condition threshold.
     */
    readonly merchandiseTotal: Money;
    private constructor();
    /**
     * The amount of merchandise required in the cart in order to receive the
     * discount. For an order promotion "Get 15% off orders of $100 or more",
     * the condition threshold is $100.00.
     */
    getConditionThreshold(): Money;
    /**
     * The discount that the customer will receive if he adds more merchandise
     * to the cart. For an order promotion "Get 15% off orders of $100 or more",
     * the discount is a PercentageDiscount object.
     */
    getDiscount(): Discount;
    /**
     * Convenience method that returns
     * `getConditionThreshold().subtract(getMerchandiseValue())`
     */
    getDistanceFromConditionThreshold(): Money;
    /**
     * The amount of merchandise in the cart contributing towards the condition
     * threshold. This will always be less than the condition threshold.
     */
    getMerchandiseTotal(): Money;
}

export = ApproachingDiscount;
