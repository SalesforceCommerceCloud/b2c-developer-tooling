import LineItem = require('./LineItem');
import ExtensibleObject = require('../object/ExtensibleObject');
import CustomAttributes = require('../object/CustomAttributes');
import Product = require('../catalog/Product');
import ProductOptionModel = require('../catalog/ProductOptionModel');
import Quantity = require('../value/Quantity');
import Money = require('../value/Money');
import Collection = require('../util/Collection');
import ProductOptionValue = require('../catalog/ProductOptionValue');
import PriceAdjustment = require('./PriceAdjustment');
import Discount = require('../campaign/Discount');
import BonusDiscountLineItem = require('./BonusDiscountLineItem');
import Shipment = require('./Shipment');
import Category = require('../catalog/Category');
import ProductInventoryList = require('../catalog/ProductInventoryList');
import ProductListItem = require('../customer/ProductListItem');
import utilMap = require('../util/Map');
import ProductShippingLineItem = require('./ProductShippingLineItem');
import OrderItem = require('./OrderItem');

declare global {
    module ICustomAttributes {
        interface ProductLineItem extends ICustomAttributes.LineItem {
        }
    }
}

/**
 * Represents a specific product line item.
 */
declare class ProductLineItem extends LineItem<ICustomAttributes.ProductLineItem> {
    /**
     * Returns the gross price of the product line item after applying all product-level
     * adjustments.
     * @see getAdjustedNetPrice
     * @see getAdjustedPrice
     */
    readonly adjustedGrossPrice: Money;
    /**
     * Returns the net price of the product line item after applying all product-level
     * adjustments.
     * @see getAdjustedGrossPrice
     * @see getAdjustedPrice
     */
    readonly adjustedNetPrice: Money;
    /**
     * Returns the price of the product line item after applying all product-level
     * adjustments. For net pricing the adjusted net price is returned
     * (see getAdjustedNetPrice). For gross pricing, the adjusted
     * gross price is returned (see getAdjustedGrossPrice).
     * @see getAdjustedGrossPrice
     * @see getAdjustedNetPrice
     */
    readonly adjustedPrice: Money;
    /**
     * Returns the tax of the unit after applying adjustments, in the purchase currency.
     */
    readonly adjustedTax: Money;
    /**
     * Returns the parent bonus discount line item of this line item.  Only
     * bonus product line items that have been selected by the customer as
     * part of a BONUS_CHOICE discount have one of these.
     */
    readonly bonusDiscountLineItem: BonusDiscountLineItem | null;
    /**
     * Identifies if the product line item represents a bonus line item.
     */
    readonly bonusProductLineItem: boolean;
    /**
     * Identifies if the product line item represents a bundled line item.
     */
    readonly bundledProductLineItem: boolean;
    /**
     * Returns a collection containing the bundled product line items.
     */
    readonly bundledProductLineItems: Collection<ProductLineItem>;
    /**
     * Returns true if the product line item represents a catalog product.
     * 
     * That flag is determined during product line item creation with
     * dw.order.LineItemCtnr.createProductLineItem, stored at the line item container and can
     * be accessed as productLineItem.catalogProduct. It represents what can be evaluated with
     * 
     * ```
     * dw.catalog.ProductMgr.getProduct( productID ) != null
     * && dw.catalog.ProductMgr.getProduct( productID ).isAssignedToSiteCatalog()
     * ```
     * 
     * If the product is not available during product line item creation it is considered a non catalog product line item without
     * connection to a product.
     * @see getProduct
     */
    readonly catalogProduct: boolean;
    /**
     * Returns the category the product line item is associated with. If the
     * line item is not associated with a category, or the category does not
     * exist in the site catalog, the method returns null.
     */
    category: Category | null;
    /**
     * Returns the ID of the category the product line item is associated with.
     */
    categoryID: string | null;
    /**
     * Returns the value set for the external line item status
     * or null if no value set.
     */
    externalLineItemStatus: string | null;
    /**
     * Returns the value set for the external line item text
     * or null if no value set.
     */
    externalLineItemText: string | null;
    /**
     * Returns true if this line item represents a gift, false otherwise.
     */
    gift: boolean;
    /**
     * Returns the value set for gift message or null if no value set.
     */
    giftMessage: string | null;
    /**
     * Returns the name of the manfacturer of the product.
     */
    manufacturerName: string;
    /**
     * Returns the name of the manfacturer's SKU of this product line item.
     */
    manufacturerSKU: string;
    /**
     * Returns the minimal order quantity allowed for the product represented by the
     * ProductLineItem (copied from product on initialization).
     * Note: the quantity of a ProductLineItem must obey the limits set by the
     * ProductLineItem's attributes 'MinOrderQuantity' and 'StepQuantity', i.e.
     * for a 'MinOrderQuantity' of 2.0 and a 'StepQuantity' of 2.5 then values
     * 2.0, 4.5, 7.0... are allowed values.
     */
    readonly minOrderQuantity: Quantity;
    /**
     * Return the value portion of getMinOrderQuantity().
     */
    minOrderQuantityValue: number;
    /**
     * Returns the ID of the product option this product line item
     * represents. If the product line item does not represent an option,
     * null is returned.
     */
    readonly optionID: string | null;
    /**
     * Returns the product option model for a product line item representing an option product.
     * 
     * The returned option model has preselected values based on the dependent option line items of this product line
     * item. Null is returned if this line item does not represent an option product.
     */
    readonly optionModel: ProductOptionModel | null;
    /**
     * Identifies if the product line item represents an option line item.
     * Option line items do not represent true products but rather options of
     * products.  An option line item always has a parent product line item
     * representing a true product.
     */
    readonly optionProductLineItem: boolean;
    /**
     * Returns a collection containing option product line items.
     */
    readonly optionProductLineItems: Collection<ProductLineItem>;
    /**
     * Returns the ID of the product option value this product line item
     * represents. If the product line item does not represent an option,
     * null is returned.
     */
    readonly optionValueID: string | null;
    /**
     * Returns the dw.order.OrderItem order-item extension for this item, or null. An order-item
     * extension will only exist for a ProductLineItem which belongs to an dw.order.Order.
     * 
     * Order post-processing APIs (gillian) are now inactive by default and will throw
     * an exception if accessed. Activation needs preliminary approval by Product Management.
     * Please contact support in this case. Existing customers using these APIs are not
     * affected by this change and can use the APIs until further notice.
     */
    readonly orderItem: OrderItem | null;
    /**
     * Returns the parent line item of this line item or null if the line item
     * is independent.
     */
    readonly parent: ProductLineItem | null;
    /**
     * Returns the position within the line item container assigned to the ProductLineItem upon its creation, may be
     * used as a sort-order.
     * 
     * The position is updated in the following way:
     * 
     * - When a ProductLineItem is added to the LineItemCtnr, it is assigned the next available position, based on the
     * current count
     * - When a ProductLineItem is removed from the LineItemCtnr then LineItemCtnr method reassignPositions is called,
     * so that the 'gap' left by the removed line-item is refilled. This method is dependent on no 2 ProductLineItem
     * having the same position.
     * - When a LineItemCtnr is copied (e.g. when a PlacedOrder is created from a Basket), no special position
     * handling is necessary as the ProductLineItems are added according to their current position ordering in the
     * source LineItemCtnr.
     */
    position: number;
    /**
     * Returns an iterator of price adjustments that have been applied to this
     * product line item such as promotions on the purchase price
     * (i.e. $10 Off or 10% Off).
     */
    readonly priceAdjustments: Collection<PriceAdjustment>;
    /**
     * Returns the product associated with the product line item.
     * 
     * The product line item might not be related to an actual catalog product, for example if it represents an option,
     * or was not created from a catalog product, or if the product does not exist in the catalog anymore. In these
     * cases, the method returns null.
     * @see isCatalogProduct
     */
    readonly product: Product<any> | null;
    /**
     * Returns the ID of the related product.
     * 
     * Returns empty if no product is related.
     * @see isCatalogProduct
     * @see getProduct
     */
    readonly productID: string;
    /**
     * Returns the inventory list the product line item is associated with. If the
     * line item is not associated with a inventory list, or the inventory list does not
     * exist, the method returns null.
     */
    productInventoryList: ProductInventoryList | null;
    /**
     * Returns the ID of the inventory list the product line item is associated with.
     */
    productInventoryListID: string | null;
    /**
     * Returns the associated ProductListItem.
     */
    readonly productListItem: ProductListItem | null;
    /**
     * Returns the name of the product that was copied when
     * product was added to line item container.
     */
    productName: string;
    /**
     * Returns the price of this product line item after considering all
     * dependent price adjustments and prorating all Buy-X-Get-Y
     * and order-level discounts, according to the scheme described in
     * dw.order.PriceAdjustment.getProratedPrices. For net pricing the
     * net price is returned. For gross pricing, the gross price is returned.
     */
    readonly proratedPrice: Money;
    /**
     * Returns a Map of PriceAdjustment to Money instances. They keys to this
     * map are the price adjustments that apply to this ProductLineItem either
     * directly or indirectly when discounts are prorated according to the
     * scheme described in dw.order.PriceAdjustment.getProratedPrices.
     * The values in the map are the portion of the adjustment which applies to
     * this particular product line item.
     */
    readonly proratedPriceAdjustmentPrices: utilMap<any, any>;
    /**
     * Returns the ProductLineItem that qualified the basket for this bonus product.
     * 
     * This method is only applicable if the product line item is a bonus product line item, and if the promotion is a
     * product promotion with number of qualifying products granting a bonus-product discount. If these conditions
     * aren't met, the method returns null. If there are multiple product line items that triggered this bonus product,
     * this method returns the last one by position within the order.
     */
    readonly qualifyingProductLineItemForBonusProduct: ProductLineItem | null;
    /**
     * Returns the quantity of the product represented by this ProductLineItem.
     */
    readonly quantity: Quantity;
    /**
     * Returns the value of the quantity of this ProductLineItem.
     */
    quantityValue: number;
    /**
     * Returns all bonus product line items for which this line item is a
     * qualifying product line item. This method is usually called when
     * rendering the cart so that bonus products can be shown next to the
     * products that triggered their creation.
     */
    readonly relatedBonusProductLineItems: Collection<ProductLineItem>;
    /**
     * Returns if the product line item is reserved.
     * 
     * Reservations for the basket can be created with e.g. dw.order.Basket.reserveInventory.
     * 
     * Method must only be called for basket product line items. Exception is thrown if called for order product line
     * item.
     */
    readonly reserved: boolean;
    /**
     * Returns the associated Shipment.
     */
    shipment: Shipment;
    /**
     * Returns the dependent shipping line item of this line item.
     * The shipping line item can define product-specific shipping
     * costs for this product line item.
     */
    readonly shippingLineItem: ProductShippingLineItem | null;
    /**
     * Returns step quantity allowed for the product represented by the ProductLineItem
     * (copied from product on initialization).
     * Note: the quantity of a ProductLineItem must obey the limits set by the
     * ProductLineItem's attributes 'MinOrderQuantity' and 'StepQuantity', i.e.
     * for a 'MinOrderQuantity' of 2.0 and a 'StepQuantity' of 2.5 then values
     * 2.0, 4.5, 7.0... are allowed values.
     */
    readonly stepQuantity: Quantity;
    /**
     * Return the value portion of getStepQuantity().
     */
    stepQuantityValue: number;
    private constructor();
    /**
     * Creates a product price adjustment.
     * 
     * The price adjustment line item is being initialized with the tax class code and tax rate of the product line
     * item. The promotion ID is mandatory and must not be the ID of any actual promotion defined in B2C Commerce. If
     * there already exists a price adjustment for the same promotionID, an exception is thrown.
     */
    createPriceAdjustment(promotionID: string): PriceAdjustment;
    /**
     * Creates a product price adjustment representing a specific discount. The price adjustment line item is
     * initialized with the tax class code and tax rate of the product line item.
     * 
     * The promotion ID is mandatory and must not be the ID of any actual promotion defined in B2C Commerce. If a price
     * adjustment already exists for the same promotionID, an exception is thrown.
     * 
     * The possible discounts are dw.campaign.FixedPriceDiscount, dw.campaign.AmountDiscount,
     * dw.campaign.PercentageDiscount. Example:
     * @example
     * var myProductItem : dw.order.ProductLineItem; // assume known
     * var paFixedUnitPrice100 : dw.order.PriceAdjustment = myProductItem.createPriceAdjustment("myPromotionID1", new FixedPriceDiscount(100.00));
     * var paTenPercent : dw.order.PriceAdjustment = myProductItem.createPriceAdjustment("myPromotionID2", new PercentageDiscount(10));
     * var paReduceBy20 : dw.order.PriceAdjustment = myProductItem.createPriceAdjustment("myPromotionID3", new AmountDiscount(20.00);
     */
    createPriceAdjustment(promotionID: string, discount: Discount): PriceAdjustment;
    /**
     * Creates the dependent shipping line item for this line item.
     * The shipping line item can define product-specific shipping
     * costs for this product line item.
     * This method has replace semantics: If there is an existing
     * shipping line item it will be replaced
     * with a new shipping line item.
     */
    createShippingLineItem(): ProductShippingLineItem;
    /**
     * Returns the gross price of the product line item after applying all product-level
     * adjustments.
     * @see getAdjustedNetPrice
     * @see getAdjustedPrice
     */
    getAdjustedGrossPrice(): Money;
    /**
     * Returns the net price of the product line item after applying all product-level
     * adjustments.
     * @see getAdjustedGrossPrice
     * @see getAdjustedPrice
     */
    getAdjustedNetPrice(): Money;
    /**
     * Returns the price of the product line item after applying all product-level
     * adjustments. For net pricing the adjusted net price is returned
     * (see getAdjustedNetPrice). For gross pricing, the adjusted
     * gross price is returned (see getAdjustedGrossPrice).
     * @see getAdjustedGrossPrice
     * @see getAdjustedNetPrice
     */
    getAdjustedPrice(): Money;
    /**
     * Returns the price of this product line item after considering all
     * dependent price adjustments and optionally prorating all order-level
     * price adjustments. For net pricing the net price is returned. For gross
     * pricing, the gross price is returned.
     * @see getAdjustedPrice
     */
    getAdjustedPrice(applyOrderLevelAdjustments: boolean): Money;
    /**
     * Returns the tax of the unit after applying adjustments, in the purchase currency.
     */
    getAdjustedTax(): Money;
    /**
     * Returns the parent bonus discount line item of this line item.  Only
     * bonus product line items that have been selected by the customer as
     * part of a BONUS_CHOICE discount have one of these.
     */
    getBonusDiscountLineItem(): BonusDiscountLineItem | null;
    /**
     * Returns a collection containing the bundled product line items.
     */
    getBundledProductLineItems(): Collection<ProductLineItem>;
    /**
     * Returns the category the product line item is associated with. If the
     * line item is not associated with a category, or the category does not
     * exist in the site catalog, the method returns null.
     */
    getCategory(): Category | null;
    /**
     * Returns the ID of the category the product line item is associated with.
     */
    getCategoryID(): string | null;
    /**
     * Returns the value set for the external line item status
     * or null if no value set.
     */
    getExternalLineItemStatus(): string | null;
    /**
     * Returns the value set for the external line item text
     * or null if no value set.
     */
    getExternalLineItemText(): string | null;
    /**
     * Returns the value set for gift message or null if no value set.
     */
    getGiftMessage(): string | null;
    /**
     * Returns the name of the manfacturer of the product.
     */
    getManufacturerName(): string;
    /**
     * Returns the name of the manfacturer's SKU of this product line item.
     */
    getManufacturerSKU(): string;
    /**
     * Returns the minimal order quantity allowed for the product represented by the
     * ProductLineItem (copied from product on initialization).
     * Note: the quantity of a ProductLineItem must obey the limits set by the
     * ProductLineItem's attributes 'MinOrderQuantity' and 'StepQuantity', i.e.
     * for a 'MinOrderQuantity' of 2.0 and a 'StepQuantity' of 2.5 then values
     * 2.0, 4.5, 7.0... are allowed values.
     */
    getMinOrderQuantity(): Quantity;
    /**
     * Return the value portion of getMinOrderQuantity().
     */
    getMinOrderQuantityValue(): number;
    /**
     * Returns the ID of the product option this product line item
     * represents. If the product line item does not represent an option,
     * null is returned.
     */
    getOptionID(): string | null;
    /**
     * Returns the product option model for a product line item representing an option product.
     * 
     * The returned option model has preselected values based on the dependent option line items of this product line
     * item. Null is returned if this line item does not represent an option product.
     */
    getOptionModel(): ProductOptionModel | null;
    /**
     * Returns a collection containing option product line items.
     */
    getOptionProductLineItems(): Collection<ProductLineItem>;
    /**
     * Returns the ID of the product option value this product line item
     * represents. If the product line item does not represent an option,
     * null is returned.
     */
    getOptionValueID(): string | null;
    /**
     * Returns the dw.order.OrderItem order-item extension for this item, or null. An order-item
     * extension will only exist for a ProductLineItem which belongs to an dw.order.Order.
     * 
     * Order post-processing APIs (gillian) are now inactive by default and will throw
     * an exception if accessed. Activation needs preliminary approval by Product Management.
     * Please contact support in this case. Existing customers using these APIs are not
     * affected by this change and can use the APIs until further notice.
     */
    getOrderItem(): OrderItem | null;
    /**
     * Returns the parent line item of this line item or null if the line item
     * is independent.
     */
    getParent(): ProductLineItem | null;
    /**
     * Returns the position within the line item container assigned to the ProductLineItem upon its creation, may be
     * used as a sort-order.
     * 
     * The position is updated in the following way:
     * 
     * - When a ProductLineItem is added to the LineItemCtnr, it is assigned the next available position, based on the
     * current count
     * - When a ProductLineItem is removed from the LineItemCtnr then LineItemCtnr method reassignPositions is called,
     * so that the 'gap' left by the removed line-item is refilled. This method is dependent on no 2 ProductLineItem
     * having the same position.
     * - When a LineItemCtnr is copied (e.g. when a PlacedOrder is created from a Basket), no special position
     * handling is necessary as the ProductLineItems are added according to their current position ordering in the
     * source LineItemCtnr.
     */
    getPosition(): number;
    /**
     * Returns the first price adjustment associated to the specified promotion ID. It is highly recommended to use
     * getPriceAdjustmentsByPromotionID instead. If there are multiple price adjustments for the same
     * promotion, this method will return the first found. Alternatively, to uniquely identify a price adjustment using
     * its promotion id and coupon code, use getPriceAdjustmentByPromotionIDAndCouponCode
     */
    getPriceAdjustmentByPromotionID(promotionID: string): PriceAdjustment | null;
    /**
     * Returns the price adjustment associated to the specified promotion ID and coupon code combination.
     */
    getPriceAdjustmentByPromotionIDAndCouponCode(promotionID: string, couponCode: string | null): PriceAdjustment | null;
    /**
     * Returns an iterator of price adjustments that have been applied to this
     * product line item such as promotions on the purchase price
     * (i.e. $10 Off or 10% Off).
     */
    getPriceAdjustments(): Collection<PriceAdjustment>;
    /**
     * Returns the collection of price adjustments associated to the specified promotion ID. If only one coupon code is
     * allowed per order, then the collection should only ever have a single entry in it. The multiple coupon code
     * feature can cause multiple price adjustments to be returned.
     */
    getPriceAdjustmentsByPromotionID(promotionID: string): Collection<PriceAdjustment> | null;
    /**
     * Returns the product associated with the product line item.
     * 
     * The product line item might not be related to an actual catalog product, for example if it represents an option,
     * or was not created from a catalog product, or if the product does not exist in the catalog anymore. In these
     * cases, the method returns null.
     * @see isCatalogProduct
     */
    getProduct(): Product<any> | null;
    /**
     * Returns the ID of the related product.
     * 
     * Returns empty if no product is related.
     * @see isCatalogProduct
     * @see getProduct
     */
    getProductID(): string;
    /**
     * Returns the inventory list the product line item is associated with. If the
     * line item is not associated with a inventory list, or the inventory list does not
     * exist, the method returns null.
     */
    getProductInventoryList(): ProductInventoryList | null;
    /**
     * Returns the ID of the inventory list the product line item is associated with.
     */
    getProductInventoryListID(): string | null;
    /**
     * Returns the associated ProductListItem.
     */
    getProductListItem(): ProductListItem | null;
    /**
     * Returns the name of the product that was copied when
     * product was added to line item container.
     */
    getProductName(): string;
    /**
     * Returns the price of this product line item after considering all
     * dependent price adjustments and prorating all Buy-X-Get-Y
     * and order-level discounts, according to the scheme described in
     * dw.order.PriceAdjustment.getProratedPrices. For net pricing the
     * net price is returned. For gross pricing, the gross price is returned.
     */
    getProratedPrice(): Money;
    /**
     * Returns a Map of PriceAdjustment to Money instances. They keys to this
     * map are the price adjustments that apply to this ProductLineItem either
     * directly or indirectly when discounts are prorated according to the
     * scheme described in dw.order.PriceAdjustment.getProratedPrices.
     * The values in the map are the portion of the adjustment which applies to
     * this particular product line item.
     */
    getProratedPriceAdjustmentPrices(): utilMap<any, any>;
    /**
     * Returns the ProductLineItem that qualified the basket for this bonus product.
     * 
     * This method is only applicable if the product line item is a bonus product line item, and if the promotion is a
     * product promotion with number of qualifying products granting a bonus-product discount. If these conditions
     * aren't met, the method returns null. If there are multiple product line items that triggered this bonus product,
     * this method returns the last one by position within the order.
     */
    getQualifyingProductLineItemForBonusProduct(): ProductLineItem | null;
    /**
     * Returns the quantity of the product represented by this ProductLineItem.
     */
    getQuantity(): Quantity;
    /**
     * Returns the value of the quantity of this ProductLineItem.
     */
    getQuantityValue(): number;
    /**
     * Returns all bonus product line items for which this line item is a
     * qualifying product line item. This method is usually called when
     * rendering the cart so that bonus products can be shown next to the
     * products that triggered their creation.
     */
    getRelatedBonusProductLineItems(): Collection<ProductLineItem>;
    /**
     * Returns the associated Shipment.
     */
    getShipment(): Shipment;
    /**
     * Returns the dependent shipping line item of this line item.
     * The shipping line item can define product-specific shipping
     * costs for this product line item.
     */
    getShippingLineItem(): ProductShippingLineItem | null;
    /**
     * Returns step quantity allowed for the product represented by the ProductLineItem
     * (copied from product on initialization).
     * Note: the quantity of a ProductLineItem must obey the limits set by the
     * ProductLineItem's attributes 'MinOrderQuantity' and 'StepQuantity', i.e.
     * for a 'MinOrderQuantity' of 2.0 and a 'StepQuantity' of 2.5 then values
     * 2.0, 4.5, 7.0... are allowed values.
     */
    getStepQuantity(): Quantity;
    /**
     * Return the value portion of getStepQuantity().
     */
    getStepQuantityValue(): number;
    /**
     * Identifies if the product line item represents a bonus line item.
     */
    isBonusProductLineItem(): boolean;
    /**
     * Identifies if the product line item represents a bundled line item.
     */
    isBundledProductLineItem(): boolean;
    /**
     * Returns true if the product line item represents a catalog product.
     * 
     * That flag is determined during product line item creation with
     * dw.order.LineItemCtnr.createProductLineItem, stored at the line item container and can
     * be accessed as productLineItem.catalogProduct. It represents what can be evaluated with
     * 
     * ```
     * dw.catalog.ProductMgr.getProduct( productID ) != null
     * && dw.catalog.ProductMgr.getProduct( productID ).isAssignedToSiteCatalog()
     * ```
     * 
     * If the product is not available during product line item creation it is considered a non catalog product line item without
     * connection to a product.
     * @see getProduct
     */
    isCatalogProduct(): boolean;
    /**
     * Returns true if this line item represents a gift, false otherwise.
     */
    isGift(): boolean;
    /**
     * Identifies if the product line item represents an option line item.
     * Option line items do not represent true products but rather options of
     * products.  An option line item always has a parent product line item
     * representing a true product.
     */
    isOptionProductLineItem(): boolean;
    /**
     * Returns if the product line item is reserved.
     * 
     * Reservations for the basket can be created with e.g. dw.order.Basket.reserveInventory.
     * 
     * Method must only be called for basket product line items. Exception is thrown if called for order product line
     * item.
     */
    isReserved(): boolean;
    /**
     * Removes the specified price adjustment from the product line item.
     */
    removePriceAdjustment(priceAdjustmentLineItem: PriceAdjustment): void;
    /**
     * Removes the dependent shipping line item for this line item.
     */
    removeShippingLineItem(): void;
    /**
     * Replaces the current product of the product line item with the product specified in parameter newProduct.
     * 
     * The following rules apply:
     * 
     * - Preserve line item attributes UUID, Quantity, CategoryID, ExternalLineItemStatus, ExternalLineItemText,
     * isGift, GiftMessage, Position, Parent, Shipment
     * - Replace product-specific attributes ProductID, ProductName, MinOrderQuantity, StepQuantity, ManufacturerName,
     * ManufacturerSKU
     * - Remove all price adjustments related to the product line item
     * - Remove the shipping line item related to the product line item
     * - Remove all bundled line items of current product, and add bundled line items if new product is a bundle
     * - Remove all option line items of current product, and add option line items if new product is an option
     * product; use default option selections
     * - Set all price attributes to N/A
     * - Preserve all custom attributes of line item, but override order-required attributes with values from new
     * product
     * 
     * The primary use is to replace one variation product with another, without having to both create a new line item
     * for the replacement and remove the line item for the replaced product.
     */
    replaceProduct(newProduct: Product<any>): void;
    /**
     * Sets the specified category as the product line item category context.
     */
    setCategory(category: Category | null): void;
    /**
     * Sets the ID of the category the product line item is associated with.
     */
    setCategoryID(categoryID: string | null): void;
    /**
     * Sets the value to set for the external line item status.
     */
    setExternalLineItemStatus(status: string): void;
    /**
     * Sets the value to set for the external line item text.
     */
    setExternalLineItemText(text: string): void;
    /**
     * Controls if this line item is a gift or not.
     */
    setGift(isGift: boolean): void;
    /**
     * Sets the value to set for the gift message.
     */
    setGiftMessage(message: string): void;
    /**
     * Sets the name of the manufacturer of this product.
     */
    setManufacturerName(name: string): void;
    /**
     * Sets the SKU of the manufacturer of this product.
     */
    setManufacturerSKU(sku: string): void;
    /**
     * Set the minimum order quantity value for this object.
     * 
     * This will be used to validate and adjust quantities when setQuantityValue() is called. For typical catalog
     * product line items, it is usually desirable to have this value inherited from the product attributes, but for
     * non-catalog products, it is sometimes desirable to set this value programmatically.
     * 
     * Null is accepted and represents Quantity.NA. Otherwise, the quantity value must be > 0.
     */
    setMinOrderQuantityValue(quantityValue: number): void;
    /**
     * Sets the position within the line item container. This value may be used as a sort-order.
     * 
     * The position is updated in the following way:
     * 
     * - When a ProductLineItem is added to the LineItemCtnr, it is assigned the next available position, based on the
     * current count
     * - When a ProductLineItem is removed from the LineItemCtnr then LineItemCtnr method reassignPositions is called,
     * so that the 'gap' left by the removed line-item is refilled. This method is dependent on no 2 ProductLineItem
     * having the same position.
     * - When a LineItemCtnr is copied (e.g. when an Order is created from a Basket), no special position handling is
     * necessary as the ProductLineItems are added according to their current position ordering in the source
     * LineItemCtnr.
     */
    setPosition(aValue: number): void;
    /**
     * Sets price attributes of the line item based on the current
     * purchase currency, taxation policy and line item quantity.
     * 
     * The method sets the 'basePrice' attribute of the line item.
     * Additionally, it sets the 'netPrice' attribute of the line item
     * if the current taxation policy is 'net', and the 'grossPrice'
     * attribute, if the current taxation policy is 'gross'. The
     * 'netPrice'/'grossPrice' attributes are set by multiplying the
     * specified price value with the line item quantity.
     * 
     * If null is specified as value, the price attributes are reset to
     * Money.NA.
     */
    setPriceValue(value: number): void;
    /**
     * Sets the specified inventory list as the product line item inventory context.
     */
    setProductInventoryList(productInventoryList: ProductInventoryList | null): void;
    /**
     * Sets the ID of the inventory list the product line item is associated with.
     */
    setProductInventoryListID(productInventoryListID: string | null): void;
    /**
     * Sets the name of the product.
     */
    setProductName(aValue: string): void;
    /**
     * Updates the quantity value of the product line item.
     * 
     * Validates the specified quantity value against the line item's min order and step quantity and adjusts it if
     * necessary. In particular, if 0 is passed, then the value will be adjusted to the min order quantity, not removed
     * from the line item container.
     * 
     * Null values or values < 0.0 are not accepted.
     */
    setQuantityValue(quantityValue: number): void;
    /**
     * Associates the specified product line item with the specified shipment.
     * 
     * The method is only applicable for independent product line items. If called for any dependent line item (option
     * or bundled line item), the method will throw an exception. The shipment for all dependent line items will be
     * updated automatically by the method. Product line item and shipment must belong to the same line item ctnr.
     */
    setShipment(shipment: Shipment): void;
    /**
     * Set the step quantity value for this object.
     * 
     * This will be used to validate and adjust quantities when updateQuantity() is called. For typical catalog product
     * line items, it is usually desirable to have this value inherited from the product attributes, but for non-catalog
     * products, it is sometimes desirable to set this value programmatically.
     * 
     * Null is accepted and represents Quantity.NA. Otherwise, the quantity value must be > 0.
     */
    setStepQuantityValue(quantityValue: number): void;
    /**
     * Determines and sets the price of a option line item based on the selected option value this line item represents.
     */
    updateOptionPrice(): void;
    /**
     * Updates an option line item with a new option value.
     * 
     * This method will not do anything if the current line item is no
     * option line item, if the specified value does not exist for the
     * current option or if this value is already selected.
     * 
     * Note, that this method will update the attributes optionValueID,
     * productID, productName and lineItemText. It will not update the price
     * attributes of the line item. To update the price of the line item you
     * need to call updateOptionPrice in addition. This is
     * usually done during calculation in the calculate hook.
     */
    updateOptionValue(optionValue: ProductOptionValue): void;
    /**
     * Updates the price attributes of the line item based
     * on the specified price.  The base price is set to the specified
     * value.  If the line item is based on net pricing then the net price
     * attribute is set.  If the line item is based on  gross pricing then the
     * gross price attribute is set.  Whether or not a line item is based
     * on net or gross pricing is a site-wide configuration parameter.
     * In either case, this price is equal to the product of the base price
     * and the quantity of this line item in its container.
     * @deprecated Use setPriceValue
     */
    updatePrice(price: Money): void;
    /**
     * Updates the quantity value of the product line item and all its dependent product line items.
     * 
     * Validates the specified quantity value against the line item's min order and step quantity and adjusts it if
     * necessary. The adjusted quantity value is returned.
     * 
     * In general, quantity values < 0.0 are not accepted.
     * @deprecated Use setQuantityValue followed by getQuantity instead.
     */
    updateQuantity(quantityValue: number): number;
}

export = ProductLineItem;
