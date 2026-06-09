import ExtensibleObject = require('../object/ExtensibleObject');
import CustomAttributes = require('../object/CustomAttributes');
import Promotion = require('../campaign/Promotion');
import CouponLineItem = require('./CouponLineItem');
import List = require('../util/List');
import Product = require('../catalog/Product');
import Money = require('../value/Money');
import ProductLineItem = require('./ProductLineItem');

declare global {
    module ICustomAttributes {
        interface BonusDiscountLineItem extends CustomAttributes {
        }
    }
}

/**
 * Line item representing an applied dw.campaign.BonusChoiceDiscount in a LineItemCtnr. This type of line item
 * can only be created by the B2C Commerce promotions engine when applying a BonusChoiceDiscount.
 * A BonusDiscountLineItem is basically a placeholder in the cart which entitles a customer to add one or more bonus
 * products to his basket from a configured list of products. Merchants typically display this type of line item in the
 * cart by showing the corresponding promotion callout message. They typically provide links to the bonus products that
 * the customer can choose from. This line item can be removed from the cart but will be re-added each time the
 * promotions engine re-applies discounts. Merchants may however add custom logic to show/hide this line item since it
 * just a placeholder and not an actual product line item.
 * 
 * The number of products that a customer is allowed to choose from is determined by getMaxBonusItems. The
 * collection of products the customer can choose from is determined by getBonusProducts. When a customer
 * chooses a bonus product in the storefront, it is necessary to use the `AddBonusProductToBasket` pipelet
 * instead of the usual `AddProductToBasket` pipelet, in order to associate this BonusDiscountLineItem with
 * the newly created bonus ProductLineItem. Alternatively, the API method
 * dw.order.LineItemCtnr.createBonusProductLineItem
 * can be used instead. The system does proper validations in order to prevent incorrect or too many bonus products from
 * being associated with this BonusDiscountLineItem. Once a customer has selected bonus products, the product line items
 * representing the chosen bonus products can be retrieved with getBonusProductLineItems.
 * @see dw.campaign.BonusChoiceDiscount
 */
declare class BonusDiscountLineItem extends ExtensibleObject<ICustomAttributes.BonusDiscountLineItem> {
    /**
     * Returns whether the promotion that triggered the creation of this line item uses a rule to determine the list of
     * bonus products.
     * 
     * If the promotion is rule based, then a ProductSearchModel should be used to return the bonus products the
     * customer may choose from, as the methods that return lists will return nothing. See getBonusProducts
     */
    readonly bonusChoiceRuleBased: boolean;
    /**
     * Get the product line items in the current LineItemCtnr representing the
     * bonus products that the customer has selected for this discount.
     * @see dw.order.LineItemCtnr.createBonusProductLineItem
     */
    readonly bonusProductLineItems: List<ProductLineItem>;
    /**
     * Get the list of bonus products which the customer is allowed to choose
     * from for this discount. This list is configured by a merchant entering a
     * list of SKUs for the discount. Products which do not exist in the system,
     * or are offline, or are not assigned to a category in the site catalog are
     * filtered out. Unavailable (i.e. out-of-stock) products are NOT filtered
     * out. This allows merchants to display out-of-stock bonus products with
     * appropriate messaging.
     * 
     * If the promotion which triggered this discount does not exist, or this
     * promotion is rule based, then this method returns an empty list.
     * 
     * If the promotion is rule based, then this method will return an empty list.
     * A ProductSearchModel should be used to return the bonus products the
     * customer may choose from instead. See
     * dw.catalog.ProductSearchModel.PROMOTION_PRODUCT_TYPE_BONUS and
     * dw.catalog.ProductSearchModel.setPromotionID
     * 
     * If a returned product is a master product, the customer is entitled to
     * choose from any variant. If the product is an option product, the
     * customer is entitled to choose any value for each option. Since the
     * promotions engine does not touch the value of the product option line
     * items, it is the responsibility of custom code to set option prices.
     */
    readonly bonusProducts: List<Product<any>>;
    /**
     * Get the coupon line item associated with this discount.
     */
    readonly couponLineItem: CouponLineItem | null;
    /**
     * Get the maximum number of bonus items that the customer is permitted to
     * select for this bonus discount.
     * 
     * If the promotion which triggered this discount does not exist, then this
     * method returns 0.
     */
    readonly maxBonusItems: number;
    /**
     * Get the promotion associated with this discount.
     */
    readonly promotion: Promotion | null;
    /**
     * Get the promotion ID associated with this discount.
     */
    readonly promotionID: string;
    private constructor();
    /**
     * Get the product line items in the current LineItemCtnr representing the
     * bonus products that the customer has selected for this discount.
     * @see dw.order.LineItemCtnr.createBonusProductLineItem
     */
    getBonusProductLineItems(): List<ProductLineItem>;
    /**
     * Get the effective price for the passed bonus product. This is expected to
     * be one of the products returned by getBonusProducts with one
     * exception: If a master product is configured as a bonus product, this
     * implies that a customer may choose from any of its variants. In this
     * case, it is allowed to pass in a variant to this method and a price will
     * be returned. If the passed product is not a valid bonus product, this
     * method throws an exception.
     */
    getBonusProductPrice(product: Product<any>): Money;
    /**
     * Get the list of bonus products which the customer is allowed to choose
     * from for this discount. This list is configured by a merchant entering a
     * list of SKUs for the discount. Products which do not exist in the system,
     * or are offline, or are not assigned to a category in the site catalog are
     * filtered out. Unavailable (i.e. out-of-stock) products are NOT filtered
     * out. This allows merchants to display out-of-stock bonus products with
     * appropriate messaging.
     * 
     * If the promotion which triggered this discount does not exist, or this
     * promotion is rule based, then this method returns an empty list.
     * 
     * If the promotion is rule based, then this method will return an empty list.
     * A ProductSearchModel should be used to return the bonus products the
     * customer may choose from instead. See
     * dw.catalog.ProductSearchModel.PROMOTION_PRODUCT_TYPE_BONUS and
     * dw.catalog.ProductSearchModel.setPromotionID
     * 
     * If a returned product is a master product, the customer is entitled to
     * choose from any variant. If the product is an option product, the
     * customer is entitled to choose any value for each option. Since the
     * promotions engine does not touch the value of the product option line
     * items, it is the responsibility of custom code to set option prices.
     */
    getBonusProducts(): List<Product<any>>;
    /**
     * Get the coupon line item associated with this discount.
     */
    getCouponLineItem(): CouponLineItem | null;
    /**
     * Get the maximum number of bonus items that the customer is permitted to
     * select for this bonus discount.
     * 
     * If the promotion which triggered this discount does not exist, then this
     * method returns 0.
     */
    getMaxBonusItems(): number;
    /**
     * Get the promotion associated with this discount.
     */
    getPromotion(): Promotion | null;
    /**
     * Get the promotion ID associated with this discount.
     */
    getPromotionID(): string;
    /**
     * Returns whether the promotion that triggered the creation of this line item uses a rule to determine the list of
     * bonus products.
     * 
     * If the promotion is rule based, then a ProductSearchModel should be used to return the bonus products the
     * customer may choose from, as the methods that return lists will return nothing. See getBonusProducts
     */
    isBonusChoiceRuleBased(): boolean;
}

export = BonusDiscountLineItem;
