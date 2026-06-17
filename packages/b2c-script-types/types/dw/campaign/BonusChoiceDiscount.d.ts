import Discount = require('./Discount');
import List = require('../util/List');
import Product = require('../catalog/Product');

/**
 * Represents a choice of bonus products discount in the discount plan,
 * for example "Choose 3 DVDs from a list of 20 options with your purchase of
 * any DVD player."
 */
declare class BonusChoiceDiscount extends Discount {
    /**
     * Get the list of bonus products which the customer is allowed to choose
     * from for this discount. This list is configured by a merchant entering a
     * list of SKUs for the discount. Products which do not exist in the system,
     * or are offline, or are not assigned to a category in the site catalog are
     * filtered out. Unavailable (i.e. out-of-stock) products are NOT filtered
     * out. This allows merchants to display out-of-stock bonus products with
     * appropriate messaging.
     * 
     * If a returned product is a master product, the customer is entitled to
     * choose from any variant. If the product is an option product, the
     * customer is entitled to choose any value for each option. Since the
     * promotions engine does not touch the value of the product option line
     * items, it is the responsibility of custom code to set option prices.
     * 
     * If the promotion is rule based, then this method will return an empty list.
     * A ProductSearchModel should be used to return the bonus products the
     * customer may choose from instead. See
     * dw.catalog.ProductSearchModel.PROMOTION_PRODUCT_TYPE_BONUS and
     * dw.catalog.ProductSearchModel.setPromotionID
     */
    readonly bonusProducts: List<Product<any>>;
    /**
     * Returns the maximum number of bonus items that a customer is entitled to
     * select for this discount.
     */
    readonly maxBonusItems: number;
    /**
     * Returns true if this is a "rule based" bonus choice discount.
     * For such discounts, there is no static list of bonus products
     * associated with the discount but rather a discounted product
     * rule associated with the promotion which defines the bonus
     * products. To retrieve the list of selectable bonus products for
     * display in the storefront, it is necessary to search for the
     * bonus products using the dw.catalog.ProductSearchModel
     * API since the method getBonusProducts in this class
     * will always return an empty list. Furthermore, for rule based
     * bonus-choice discounts, getBonusProductPrice
     * will always return a price of 0.00 for bonus products.
     */
    readonly ruleBased: boolean;
    private constructor();
    /**
     * Get the effective price for the passed bonus product. This is expected to
     * be one of the products returned by getBonusProducts with one
     * exception: If a master product is configured as a bonus product, this
     * implies that a customer may choose from any of its variants. In this
     * case, it is allowed to pass in a variant to this method and a price will
     * be returned. If the passed product is not a valid bonus product, this
     * method throws an exception.
     */
    getBonusProductPrice(product: Product<any>): number;
    /**
     * Get the list of bonus products which the customer is allowed to choose
     * from for this discount. This list is configured by a merchant entering a
     * list of SKUs for the discount. Products which do not exist in the system,
     * or are offline, or are not assigned to a category in the site catalog are
     * filtered out. Unavailable (i.e. out-of-stock) products are NOT filtered
     * out. This allows merchants to display out-of-stock bonus products with
     * appropriate messaging.
     * 
     * If a returned product is a master product, the customer is entitled to
     * choose from any variant. If the product is an option product, the
     * customer is entitled to choose any value for each option. Since the
     * promotions engine does not touch the value of the product option line
     * items, it is the responsibility of custom code to set option prices.
     * 
     * If the promotion is rule based, then this method will return an empty list.
     * A ProductSearchModel should be used to return the bonus products the
     * customer may choose from instead. See
     * dw.catalog.ProductSearchModel.PROMOTION_PRODUCT_TYPE_BONUS and
     * dw.catalog.ProductSearchModel.setPromotionID
     */
    getBonusProducts(): List<Product<any>>;
    /**
     * Returns the maximum number of bonus items that a customer is entitled to
     * select for this discount.
     */
    getMaxBonusItems(): number;
    /**
     * Returns true if this is a "rule based" bonus choice discount.
     * For such discounts, there is no static list of bonus products
     * associated with the discount but rather a discounted product
     * rule associated with the promotion which defines the bonus
     * products. To retrieve the list of selectable bonus products for
     * display in the storefront, it is necessary to search for the
     * bonus products using the dw.catalog.ProductSearchModel
     * API since the method getBonusProducts in this class
     * will always return an empty list. Furthermore, for rule based
     * bonus-choice discounts, getBonusProductPrice
     * will always return a price of 0.00 for bonus products.
     */
    isRuleBased(): boolean;
}

export = BonusChoiceDiscount;
