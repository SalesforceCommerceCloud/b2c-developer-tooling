import ExtensibleObject = require('../object/ExtensibleObject');
import CustomAttributes = require('../object/CustomAttributes');
import Collection = require('../util/Collection');
import PriceAdjustment = require('./PriceAdjustment');
import BonusDiscountLineItem = require('./BonusDiscountLineItem');
import Promotion = require('../campaign/Promotion');

declare global {
    module ICustomAttributes {
        interface CouponLineItem extends CustomAttributes {
        }
    }
}

/**
 * The CouponLineItem class is used to store redeemed coupons in the Basket.
 */
declare class CouponLineItem extends ExtensibleObject<ICustomAttributes.CouponLineItem> {
    /**
     * Identifies if the coupon is currently applied in the basket. A coupon
     * line is applied if there exists at least one price adjustment related
     * to the coupon line item.
     */
    readonly applied: boolean;
    /**
     * Returns true if the line item represents a coupon of a campaign. If the coupon line item represents a custom
     * coupon code, the method returns false.
     */
    readonly basedOnCampaign: boolean;
    /**
     * Returns the bonus discount line items of the line item container triggered
     * by this coupon.
     */
    readonly bonusDiscountLineItems: Collection<BonusDiscountLineItem>;
    /**
     * Returns the coupon code.
     */
    readonly couponCode: string;
    /**
     * Returns the price adjustments of the line item container triggered
     * by this coupon.
     */
    readonly priceAdjustments: Collection<PriceAdjustment>;
    /**
     * Returns the promotion related to the coupon line item.
     * @deprecated A coupon code and its coupon can be associated with
     * multiple promotions. Therefore, this method is not
     * appropriate anymore. For backward-compatibility, the method
     * returns one of the promotions associated with the coupon
     * code.
     */
    readonly promotion: Promotion;
    /**
     * Returns the id of the related promotion.
     * @deprecated A coupon code and it's coupon can be associated with
     * multiple promotions. Therefore, this method is not
     * appropriate anymore. For backward-compatibility, the method
     * returns the ID of one of the promotions associated with
     * the coupon code.
     */
    readonly promotionID: string;
    /**
     * This method provides a detailed error status in case the coupon code of
     * this coupon line item instance became invalid.
     */
    readonly statusCode: string;
    /**
     * Allows to check whether the coupon code of this coupon line item instance
     * is valid. Coupon line item is valid, if status code is one of the following:
     * 
     * - dw.campaign.CouponStatusCodes.APPLIED
     * - dw.campaign.CouponStatusCodes.NO_APPLICABLE_PROMOTION
     */
    readonly valid: boolean;
    private constructor();
    /**
     * Associates the specified price adjustment with the coupon line item. This method is only applicable if used for
     * price adjustments and coupon line items NOT based on B2C Commerce campaigns.
     */
    associatePriceAdjustment(priceAdjustment: PriceAdjustment): void;
    /**
     * Returns the bonus discount line items of the line item container triggered
     * by this coupon.
     */
    getBonusDiscountLineItems(): Collection<BonusDiscountLineItem>;
    /**
     * Returns the coupon code.
     */
    getCouponCode(): string;
    /**
     * Returns the price adjustments of the line item container triggered
     * by this coupon.
     */
    getPriceAdjustments(): Collection<PriceAdjustment>;
    /**
     * Returns the promotion related to the coupon line item.
     * @deprecated A coupon code and its coupon can be associated with
     * multiple promotions. Therefore, this method is not
     * appropriate anymore. For backward-compatibility, the method
     * returns one of the promotions associated with the coupon
     * code.
     */
    getPromotion(): Promotion;
    /**
     * Returns the id of the related promotion.
     * @deprecated A coupon code and it's coupon can be associated with
     * multiple promotions. Therefore, this method is not
     * appropriate anymore. For backward-compatibility, the method
     * returns the ID of one of the promotions associated with
     * the coupon code.
     */
    getPromotionID(): string;
    /**
     * This method provides a detailed error status in case the coupon code of
     * this coupon line item instance became invalid.
     */
    getStatusCode(): string;
    /**
     * Identifies if the coupon is currently applied in the basket. A coupon
     * line is applied if there exists at least one price adjustment related
     * to the coupon line item.
     */
    isApplied(): boolean;
    /**
     * Returns true if the line item represents a coupon of a campaign. If the coupon line item represents a custom
     * coupon code, the method returns false.
     */
    isBasedOnCampaign(): boolean;
    /**
     * Allows to check whether the coupon code of this coupon line item instance
     * is valid. Coupon line item is valid, if status code is one of the following:
     * 
     * - dw.campaign.CouponStatusCodes.APPLIED
     * - dw.campaign.CouponStatusCodes.NO_APPLICABLE_PROMOTION
     */
    isValid(): boolean;
}

export = CouponLineItem;
