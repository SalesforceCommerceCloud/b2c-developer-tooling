import Collection = require('../util/Collection');
import Promotion = require('./Promotion');
import Product = require('../catalog/Product');
import ShippingMethod = require('../order/ShippingMethod');
import PaymentMethod = require('../order/PaymentMethod');
import PaymentCard = require('../order/PaymentCard');

/**
 * PromotionPlan represents a set of dw.campaign.Promotion instances and
 * is used to display active or upcoming promotions on storefront pages, or to
 * pass it to the dw.campaign.PromotionMgr to calculate a
 * dw.campaign.DiscountPlan and subsequently apply discounts to a line
 * item container. Instances of the class are returned by the
 * dw.campaign.PromotionMgr.getActivePromotions,
 * dw.campaign.PromotionMgr.getActiveCustomerPromotions and
 * dw.campaign.PromotionMgr.getUpcomingPromotions.
 * 
 * PromotionPlan provides methods to access the promotions in the plan and to
 * remove promotions from the plan. All methods which return a collection of
 * promotions sort them by the following ordered criteria:
 * 
 * - Exclusivity: GLOBAL exclusive promotions first, followed by CLASS
 * exclusive promotions, and NO exclusive promotions last.
 * - Rank: sorted ascending
 * - Promotion Class: PRODUCT promotions first, followed by ORDER promotions,
 * and SHIPPING promotions last.
 * - Discount type: Fixed price promotions first, followed by free,
 * amount-off, percentage-off, and bonus product promotions last.
 * - Best discount: Sorted descending. For example, 30% off comes before 20%
 * off.
 * - ID: alphanumeric ascending.
 * @see dw.campaign.PromotionMgr
 */
declare class PromotionPlan {
    /**
     * Constant indicating that a collection of promotions should be sorted
     * first by exclusivity, then rank, promotion class, etc.  See class-level
     * javadoc for details.  This is the default sort order for methods that
     * return a collection of promotions.
     */
    static readonly SORT_BY_EXCLUSIVITY = 1;
    /**
     * Constant indicating that a collection of promotions should be sorted by
     * start date ascending. If there is no explicit start date for a promotion
     * the start date of its containing Campaign or AB-test is used instead.
     * Promotions without a start date are sorted before promotions with a start
     * date in the future and after promotions with a start date in the past. In
     * case two promotion assignments have the same start date, they are sorted
     * by their ID.
     */
    static readonly SORT_BY_START_DATE = 2;
    /**
     * Returns all order promotions contained in this plan.
     */
    readonly orderPromotions: Collection<Promotion>;
    /**
     * Returns all product promotions contained in this plan.
     */
    readonly productPromotions: Collection<Promotion>;
    /**
     * Returns all promotions contained in this plan sorted by exclusivity.
     */
    readonly promotions: Collection<Promotion>;
    /**
     * Returns all shipping promotions contained in this plan.
     */
    readonly shippingPromotions: Collection<Promotion>;
    private constructor();
    /**
     * Returns all order promotions contained in this plan.
     */
    getOrderPromotions(): Collection<Promotion>;
    /**
     * Returns the order promotions explicitly associated to the specified
     * discounted payment card.
     * 
     * This method is usually used to display order promotions along with
     * payment card choices.
     */
    getPaymentCardPromotions(paymentCard: PaymentCard): Collection<Promotion>;
    /**
     * Returns the order promotions explicitly associated to the specified
     * discounted payment method.
     * 
     * This method is usually used to display order promotions along with
     * payment method choices.
     */
    getPaymentMethodPromotions(paymentMethod: PaymentMethod): Collection<Promotion>;
    /**
     * Returns all product promotions contained in this plan.
     */
    getProductPromotions(): Collection<Promotion>;
    /**
     * Returns the promotions related to the specified product.
     * 
     * The method returns all promotions where the product is either a
     * qualifying product, or a discounted product, or both. It also returns
     * promotions where the specified product is a bonus product.
     * 
     * This method is usually used to display product promotions on a product
     * details page.
     * 
     * If a master product is passed, then this method will return promotions
     * which are relevant for the master itself or at least one of its variants.
     */
    getProductPromotions(product: Product<any>): Collection<Promotion>;
    /**
     * Returns the product promotions for which the specified product is a
     * discounted (and possibly also a qualifying) product. It also returns
     * promotions where the specified product is a bonus product.
     * 
     * This method is usually used to display product promotions on a product
     * details page when separate callout messages are defined depending on if
     * the product is a qualifying or discounted product for the promotion.
     * 
     * If a master product is passed, then this method will return promotions
     * for which the master product itself or at least one of its product's
     * variants is a discounted product.
     */
    getProductPromotionsForDiscountedProduct(product: Product<any>): Collection<Promotion>;
    /**
     * Returns the product promotions for which the specified product is a
     * qualifying but NOT a discounted product.
     * 
     * This method is usually used to display product promotions on a product
     * details page when separate callout messages are defined depending on if
     * the product is a qualifying or discounted product for the promotion.
     * 
     * If a master product is passed, then this method will return promotions
     * for which the master product itself or at least one of its product's
     * variants is a qualifying product.
     */
    getProductPromotionsForQualifyingProduct(product: Product<any>): Collection<Promotion>;
    /**
     * Returns all promotions contained in this plan sorted by exclusivity.
     */
    getPromotions(): Collection<Promotion>;
    /**
     * Returns all promotions contained in this plan sorted according to the
     * specified sort order. If the passed sort order is invalid, then the
     * returned promotions will be sorted by exclusivity.
     */
    getPromotions(sortOrder: number): Collection<Promotion>;
    /**
     * Returns the promotions related to the specified product.
     * 
     * The method returns all promotions where the product is either
     * a qualifying product, or a discounted product, or both. It also
     * returns promotions where the specified product is a bonus product.
     * 
     * This method is usually used to display product promotions on a
     * product details page.
     * @deprecated Use getProductPromotions
     */
    getPromotions(product: Product<any>): Collection<Promotion>;
    /**
     * Returns all shipping promotions contained in this plan.
     */
    getShippingPromotions(): Collection<Promotion>;
    /**
     * Returns the shipping promotions related to the specified discounted
     * shipping method, i.e. the returned promotions apply a discount on
     * the specified shipping method.
     * 
     * This method is usually used to display shipping promotions along with
     * shipping methods.
     */
    getShippingPromotions(shippingMethod: ShippingMethod): Collection<Promotion>;
    /**
     * Remove promotion from promotion plan.
     * 
     * Please note that this is the only way to remove promotions from the
     * plan, i.e. removing promotions from the collections returned
     * by methods such as getProductPromotions has no effect
     * on the promotion plan.
     */
    removePromotion(promotion: Promotion): void;
}

export = PromotionPlan;
