import LineItem = require('./LineItem');
import ExtensibleObject = require('../object/ExtensibleObject');
import CustomAttributes = require('../object/CustomAttributes');
import Collection = require('../util/Collection');
import PriceAdjustment = require('./PriceAdjustment');
import Discount = require('../campaign/Discount');
import Money = require('../value/Money');
import OrderItem = require('./OrderItem');

declare global {
    module ICustomAttributes {
        interface ShippingLineItem extends ICustomAttributes.LineItem {
        }
    }
}

/**
 * Represents a specific line item in a shipment. The ShippingLineItem defines
 * the general shipping costs of a shipment.
 */
declare class ShippingLineItem extends LineItem<ICustomAttributes.ShippingLineItem> {
    /**
     * Constant used to get the standard shipping line item.
     */
    static readonly STANDARD_SHIPPING_ID = "STANDARD_SHIPPING";
    /**
     * Returns the ID of this ShippingLineItem.
     */
    readonly ID: string;
    /**
     * Returns the price of this shipping line item including tax after
     * shipping adjustments have been applied.
     */
    readonly adjustedGrossPrice: Money;
    /**
     * Returns the price of this shipping line item, excluding tax after
     * shipping adjustments have been applied.
     */
    readonly adjustedNetPrice: Money;
    /**
     * Returns the adjusted price of this shipping line item. If the line item
     * container is based on net pricing, the adjusted net price is returned. If
     * the line item container is based on gross pricing, the adjusted gross
     * price is returned.
     */
    readonly adjustedPrice: Money;
    /**
     * Returns the tax of this shipping line item after shipping adjustments
     * have been applied.
     */
    readonly adjustedTax: Money;
    /**
     * Returns the dw.order.OrderItem order-item extension for this item, or `null`.
     * An order-item extension will only exist for a ShippingLineItem which
     * belongs to an dw.order.Order.
     * 
     * Order post-processing APIs (gillian) are now inactive by default and will throw
     * an exception if accessed. Activation needs preliminary approval by Product Management.
     * Please contact support in this case. Existing customers using these APIs are not
     * affected by this change and can use the APIs until further notice.
     */
    readonly orderItem: OrderItem | null;
    /**
     * Returns the collection of shipping price adjustments that have been
     * applied to this shipping line item.
     */
    readonly shippingPriceAdjustments: Collection<PriceAdjustment>;
    private constructor();
    /**
     * Creates a shipping price adjustment to be applied to the shipping line item.
     * 
     * The promotion ID is mandatory and must not be the ID of any actual promotion defined in B2C Commerce.
     * 
     * If there already exists a shipping price adjustment on this shipping line item referring to the specified
     * promotion ID, an exception is thrown.
     */
    createShippingPriceAdjustment(promotionID: string): PriceAdjustment;
    /**
     * Creates a shipping price adjustment to be applied to the shipping line item.
     * 
     * The promotion ID is mandatory and must not be the ID of any actual promotion defined in B2C Commerce. If a
     * shipping price adjustment on this shipping line item referring to the specified promotion ID already exists, an
     * exception is thrown.
     * 
     * The possible values for discount are dw.campaign.PercentageDiscount, dw.campaign.AmountDiscount,
     * dw.campaign.FixedPriceShippingDiscount.
     * 
     * Examples:
     * 
     * `
     * var myShippingItem : dw.order.ShippingLineItem; // assume known
     * 
     * var paFixedShippingPrice12 : dw.order.PriceAdjustment = myShippingItem.createPriceAdjustment("myPromotionID1", new FixedPriceShippingDiscount(12));
     * 
     * var paTenPercent : dw.order.PriceAdjustment = myShippingItem.createPriceAdjustment("myPromotionID2", new PercentageDiscount(10));
     * 
     * var paReduceBy2 : dw.order.PriceAdjustment = myShippingItem.createPriceAdjustment("myPromotionID3", new AmountDiscount(2));
     * 
     * `
     */
    createShippingPriceAdjustment(promotionID: string, discount: Discount): PriceAdjustment;
    /**
     * Returns the price of this shipping line item including tax after
     * shipping adjustments have been applied.
     */
    getAdjustedGrossPrice(): Money;
    /**
     * Returns the price of this shipping line item, excluding tax after
     * shipping adjustments have been applied.
     */
    getAdjustedNetPrice(): Money;
    /**
     * Returns the adjusted price of this shipping line item. If the line item
     * container is based on net pricing, the adjusted net price is returned. If
     * the line item container is based on gross pricing, the adjusted gross
     * price is returned.
     */
    getAdjustedPrice(): Money;
    /**
     * Returns the tax of this shipping line item after shipping adjustments
     * have been applied.
     */
    getAdjustedTax(): Money;
    /**
     * Returns the ID of this ShippingLineItem.
     */
    getID(): string;
    /**
     * Returns the dw.order.OrderItem order-item extension for this item, or `null`.
     * An order-item extension will only exist for a ShippingLineItem which
     * belongs to an dw.order.Order.
     * 
     * Order post-processing APIs (gillian) are now inactive by default and will throw
     * an exception if accessed. Activation needs preliminary approval by Product Management.
     * Please contact support in this case. Existing customers using these APIs are not
     * affected by this change and can use the APIs until further notice.
     */
    getOrderItem(): OrderItem | null;
    /**
     * Returns the collection of shipping price adjustments that have been
     * applied to this shipping line item.
     */
    getShippingPriceAdjustments(): Collection<PriceAdjustment>;
    /**
     * Removes the specified shipping price adjustment from this shipping line
     * item.
     */
    removeShippingPriceAdjustment(priceAdjustment: PriceAdjustment): void;
}

export = ShippingLineItem;
