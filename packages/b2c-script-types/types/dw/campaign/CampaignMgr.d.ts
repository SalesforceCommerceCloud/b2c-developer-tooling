import Campaign = require('./Campaign');
import Promotion = require('./Promotion');
import Collection = require('../util/Collection');
import Product = require('../catalog/Product');
import LineItemCtnr = require('../order/LineItemCtnr');

/**
 * CampaignMgr provides static methods for managing campaign-specific operations
 * such as accessing promotions or updating promotion line items.
 * @deprecated Use dw.campaign.PromotionMgr instead.
 */
declare class CampaignMgr {
    /**
     * Returns the enabled promotions of active campaigns applicable for the
     * current customer and source code.
     * 
     * Note that this method does not return any coupon-based promotions.
     * @deprecated Use dw.campaign.PromotionMgr.getActiveCustomerPromotions and
     * dw.campaign.PromotionPlan.getPromotions
     */
    static readonly applicablePromotions: Collection<Promotion>;
    private constructor();
    /**
     * This method has been deprecated and should not be used anymore.
     * Instead, use dw.campaign.PromotionMgr to apply promotions to
     * line item containers.
     * 
     * The method does nothing, since bonus promotions  are applied as product
     * or order promotions using methods
     * applyProductPromotions and
     * applyOrderPromotions.
     * 
     * The method returns 'true' if any the line item container contains
     * any bonus product line items, and otherwise false.
     * @deprecated Use dw.campaign.PromotionMgr instead.
     */
    static applyBonusPromotions(lineItemCtnr: LineItemCtnr<any>, promotions: Collection<any>): boolean;
    /**
     * Applies the applicable order promotions in the specified collection to the
     * specified line item container.
     * 
     * This method has been deprecated and should not be used anymore.
     * Instead, use dw.campaign.PromotionMgr to apply promotions to
     * line item containers.
     * 
     * Note that the method does also apply any bonus discounts defined
     * as order promotions (see also applyBonusPromotions).
     * @deprecated Use dw.campaign.PromotionMgr
     */
    static applyOrderPromotions(lineItemCtnr: LineItemCtnr<any>, promotions: Collection<any>): boolean;
    /**
     * Applies all applicable product promotions in the specified collection to the
     * specified line item container.
     * 
     * This method has been deprecated and should not be used anymore.
     * Instead, use dw.campaign.PromotionMgr to apply promotions to
     * line item containers.
     * 
     * Note that the method does also apply any bonus discounts defined
     * as product promotions (see also applyBonusPromotions).
     * @deprecated Use dw.campaign.PromotionMgr
     */
    static applyProductPromotions(lineItemCtnr: LineItemCtnr<any>, promotions: Collection<any>): boolean;
    /**
     * Applies all applicable shipping promotions in the specified collection to
     * the specified line item container.
     * 
     * This method has been deprecated and should not be used anymore.
     * Instead, use dw.campaign.PromotionMgr to apply promotions to
     * line item containers.
     * @deprecated Use dw.campaign.PromotionMgr
     */
    static applyShippingPromotions(lineItemCtnr: LineItemCtnr<any>, promotions: Collection<any>): boolean;
    /**
     * Returns the enabled promotions of active campaigns applicable for the
     * current customer and source code for which the specified product
     * is a qualifiying product.
     * 
     * As a replacement of this deprecated method, use
     * dw.campaign.PromotionMgr.getActiveCustomerPromotions and
     * dw.campaign.PromotionPlan.getProductPromotions.
     * Unlike getApplicableConditionalPromotions,
     * dw.campaign.PromotionPlan.getProductPromotions
     * returns all promotions related to the specified product, regardless
     * of whether the product is qualifying, discounted, or both, and
     * also returns promotions where the product is a bonus product.
     * @deprecated Use dw.campaign.PromotionMgr.getActiveCustomerPromotions and
     * dw.campaign.PromotionPlan.getProductPromotions
     */
    static getApplicableConditionalPromotions(product: Product<any>): Collection<Promotion>;
    /**
     * Returns the enabled promotions of active campaigns applicable for the
     * current customer and source code for which the specified product is
     * a discounted product.
     * 
     * Note that this method does not return any coupon-based promotions.
     * 
     * As a replacement of this deprecated method, use
     * dw.campaign.PromotionMgr.getActiveCustomerPromotions and
     * dw.campaign.PromotionPlan.getProductPromotions.
     * Unlike getApplicablePromotions,
     * dw.campaign.PromotionPlan.getProductPromotions
     * returns all promotions related to the specified product, regardless
     * of whether the product is qualifying, discounted, or both, and
     * also returns promotions where the product is a bonus product.
     * @deprecated Use dw.campaign.PromotionMgr.getActiveCustomerPromotions and
     * dw.campaign.PromotionPlan.getProductPromotions
     */
    static getApplicablePromotions(product: Product<any>): Collection<Promotion>;
    /**
     * Returns the enabled promotions of active campaigns applicable for the
     * current customer, source code and any coupon contained in the specified
     * line item container.
     * 
     * Note that although the method has been deprecated, no replacement
     * method is provided.
     * @deprecated There is no replacement for this method.
     */
    static getApplicablePromotions(lineItemCtnr: LineItemCtnr<any>): Collection<Promotion>;
    /**
     * Returns the enabled promotions of active campaigns applicable for the
     * current customer and source code.
     * 
     * Note that this method does not return any coupon-based promotions.
     * @deprecated Use dw.campaign.PromotionMgr.getActiveCustomerPromotions and
     * dw.campaign.PromotionPlan.getPromotions
     */
    static getApplicablePromotions(): Collection<Promotion>;
    /**
     * Returns the campaign identified by the specified ID.
     * @deprecated Use dw.campaign.PromotionMgr.getCampaign
     */
    static getCampaignByID(id: string): Campaign | null;
    /**
     * Returns the enabled promotions of active campaigns for which the
     * specified product is a qualifiying product.
     * 
     * Note that the method also returns coupon-based promotions.
     * 
     * As a replacement of this deprecated method, use
     * dw.campaign.PromotionMgr.getActiveCustomerPromotions and
     * dw.campaign.PromotionPlan.getProductPromotions.
     * Unlike getConditionalPromotions,
     * dw.campaign.PromotionPlan.getProductPromotions
     * returns all promotions related to the specified product, regardless
     * of whether the product is qualifying, discounted, or both, and
     * also returns promotions where the product is a bonus product.
     * @deprecated Use dw.campaign.PromotionMgr.getActivePromotions and
     * dw.campaign.PromotionPlan.getProductPromotions
     */
    static getConditionalPromotions(product: Product<any>): Collection<Promotion>;
    /**
     * Returns the promotion associated with the specified coupon code.
     * @deprecated Coupons are now related to multiple promotions. Method
     * returns the first promotion associated with the coupon
     * code in case of multiple assigned promotions.
     */
    static getPromotion(couponCode: string): Promotion | null;
    /**
     * Returns the promotion associated with the specified coupon code.
     * @deprecated Coupons are now related to multiple promotions. Method
     * returns the first promotion associated with the coupon
     * in case of multiple assigned promotions
     */
    static getPromotionByCouponCode(couponCode: string): Promotion | null;
    /**
     * Returns the promotion identified by the specified ID.
     * @deprecated Use dw.campaign.PromotionMgr.getPromotion
     */
    static getPromotionByID(id: string): Promotion | null;
    /**
     * Returns the enabled promotions of active campaigns for which the
     * specified product is a discounted product.
     * 
     * Note that method does only return promotions based on customer groups
     * or source codes.
     * 
     * As a replacement of this deprecated method, use
     * dw.campaign.PromotionMgr.getActiveCustomerPromotions and
     * dw.campaign.PromotionPlan.getProductPromotions.
     * Unlike getPromotions,
     * dw.campaign.PromotionPlan.getProductPromotions
     * returns all promotions related to the specified product, regardless
     * of whether the product is qualifying, discounted, or both, and
     * also returns promotions where the product is a bonus product.
     * @deprecated Use dw.campaign.PromotionMgr.getActivePromotions and
     * dw.campaign.PromotionPlan.getProductPromotions
     */
    static getPromotions(product: Product<any>): Collection<Promotion>;
}

export = CampaignMgr;
