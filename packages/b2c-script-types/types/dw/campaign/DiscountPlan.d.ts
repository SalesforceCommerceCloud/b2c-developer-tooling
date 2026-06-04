import LineItemCtnr = require('../order/LineItemCtnr');
import Collection = require('../util/Collection');
import ProductLineItem = require('../order/ProductLineItem');
import Discount = require('./Discount');
import Shipment = require('../order/Shipment');
import ApproachingDiscount = require('./ApproachingDiscount');
import ShippingMethod = require('../order/ShippingMethod');
import BonusDiscount = require('./BonusDiscount');

/**
 * DiscountPlan represents a set of dw.campaign.Discounts. Instances of the class are
 * returned by the dw.campaign.PromotionMgr when requesting applicable discounts
 * for a specified set of promotions and a line item container
 * (see dw.campaign.PromotionMgr.getDiscounts).
 * 
 * DiscountPlan provides methods to access the discounts contained in the plan,
 * add additional discounts to the plan (future) or remove discounts from the plan.
 * @see dw.campaign.PromotionMgr
 */
declare class DiscountPlan {
    /**
     * Get the collection of order discounts that the LineItemCtnr "almost"
     * qualifies for based on the merchandise total in the cart. Nearness is
     * controlled by thresholds configured at the promotion level.
     * 
     * The collection of returned approaching discounts is ordered by the
     * condition threshold of the promotion (e.g. "spend $100 and get 10% off"
     * discount is returned before "spend $150 and get 15% off" discount.) A
     * discount is not returned if it would be prevented from applying (because
     * of compatibility rules) by an order discount already in the DiscountPlan
     * or an approaching order discount with a lower condition threshold.
     */
    readonly approachingOrderDiscounts: Collection<ApproachingDiscount>;
    /**
     * Returns all bonus discounts contained in the discount plan.
     */
    readonly bonusDiscounts: Collection<BonusDiscount>;
    /**
     * Returns line item container associated with discount plan.
     * 
     * A discount plan is created from and associated with a line item container.
     * This method returns the line item container associated with this discount plan.
     */
    readonly lineItemCtnr: LineItemCtnr<any>;
    /**
     * Returns the percentage and amount order discounts contained in the
     * discount plan.
     */
    readonly orderDiscounts: Collection<Discount>;
    private constructor();
    /**
     * Get the collection of order discounts that the LineItemCtnr "almost"
     * qualifies for based on the merchandise total in the cart. Nearness is
     * controlled by thresholds configured at the promotion level.
     * 
     * The collection of returned approaching discounts is ordered by the
     * condition threshold of the promotion (e.g. "spend $100 and get 10% off"
     * discount is returned before "spend $150 and get 15% off" discount.) A
     * discount is not returned if it would be prevented from applying (because
     * of compatibility rules) by an order discount already in the DiscountPlan
     * or an approaching order discount with a lower condition threshold.
     */
    getApproachingOrderDiscounts(): Collection<ApproachingDiscount>;
    /**
     * Get the collection of shipping discounts that the passed shipment
     * "almost" qualifies for based on the merchandise total in the shipment.
     * Nearness is controlled by thresholds configured at the promotion level.
     * 
     * The collection of returned approaching discounts is ordered by the
     * condition threshold of the promotion (e.g.
     * "spend $100 and get free standard shipping" discount is returned before
     * "spend $150 and get free standard shipping" discount.) A discount is not
     * returned if it would be prevented from applying (because of compatibility
     * rules) by a shipping discount already in the DiscountPlan or an
     * approaching shipping discount with a lower condition threshold.
     */
    getApproachingShippingDiscounts(shipment: Shipment): Collection<ApproachingDiscount>;
    /**
     * Get the collection of shipping discounts that the passed shipment
     * "almost" qualifies for based on the merchandise total in the shipment.
     * Here "almost" is controlled by thresholds configured at the promotion
     * level.
     * 
     * This method only returns discounts for shipping promotions which apply to
     * the passed shipping method.
     * 
     * The collection of returned approaching discounts is ordered by the
     * condition threshold of the promotion (e.g.
     * "spend $100 and get free standard shipping" discount is returned before
     * "spend $150 and get free standard shipping" discount.) A discount is not
     * returned if it would be prevented from applying (because of compatibility
     * rules) by a shipping discount already in the DiscountPlan or an
     * approaching shipping discount with a lower condition threshold.
     */
    getApproachingShippingDiscounts(shipment: Shipment, shippingMethod: ShippingMethod): Collection<ApproachingDiscount>;
    /**
     * Get the collection of shipping discounts that the passed shipment
     * "almost" qualifies for based on the merchandise total in the shipment.
     * Here "almost" is controlled by thresholds configured at the promotion
     * level.
     * 
     * This method only returns discounts for shipping promotions which apply to
     * one of the passed shipping methods.
     * 
     * The collection of returned approaching discounts is ordered by the
     * condition threshold of the promotion (e.g.
     * "spend $100 and get free standard shipping" discount is returned before
     * "spend $150 and get free standard shipping" discount.) A discount is not
     * returned if it would be prevented from applying (because of compatibility
     * rules) by a shipping discount already in the DiscountPlan or an
     * approaching shipping discount with a lower condition threshold.
     */
    getApproachingShippingDiscounts(shipment: Shipment, shippingMethods: Collection<any>): Collection<ApproachingDiscount>;
    /**
     * Returns all bonus discounts contained in the discount plan.
     */
    getBonusDiscounts(): Collection<BonusDiscount>;
    /**
     * Returns line item container associated with discount plan.
     * 
     * A discount plan is created from and associated with a line item container.
     * This method returns the line item container associated with this discount plan.
     */
    getLineItemCtnr(): LineItemCtnr<any>;
    /**
     * Returns the percentage and amount order discounts contained in the
     * discount plan.
     */
    getOrderDiscounts(): Collection<Discount>;
    /**
     * Returns the percentage, amount and fix price discounts associated
     * with the specified product line item. If the specified product line
     * item is not contained in the discount plan, an empty collection is
     * returned.
     */
    getProductDiscounts(productLineItem: ProductLineItem): Collection<Discount>;
    /**
     * Returns the product-shipping discounts associated with the specified
     * product line item. If the specified product line item is not contained in
     * the discount plan, an empty collection is returned.
     */
    getProductShippingDiscounts(productLineItem: ProductLineItem): Collection<Discount>;
    /**
     * Returns the percentage, amount and fix price discounts associated with
     * the specified shipment. If the specified shipment is not contained in
     * the discount plan, an empty collection is returned.
     */
    getShippingDiscounts(shipment: Shipment): Collection<Discount>;
    /**
     * Removes the specified discount from the discount plan.
     * 
     * This method should only be used for very simple discount scenarios. It
     * is not recommended to use the method in case of stacked discounts
     * (i.e. multiple order or product discounts), or complex discount types
     * like Buy X Get Y or Total Fixed Price, since correct re-calculation of the
     * discount plan based on the promotion rules is not guaranteed.
     */
    removeDiscount(discount: Discount): void;
}

export = DiscountPlan;
