import ExtensibleObject = require('../object/ExtensibleObject');
import CustomAttributes = require('../object/CustomAttributes');
import Money = require('../value/Money');
import Collection = require('../util/Collection');
import LineItem = require('./LineItem');
import ProductLineItem = require('./ProductLineItem');
import PriceAdjustment = require('./PriceAdjustment');
import GiftCertificateLineItem = require('./GiftCertificateLineItem');
import ShippingLineItem = require('./ShippingLineItem');
import EnumValue = require('../value/EnumValue');
import OrderAddress = require('./OrderAddress');
import ShippingMethod = require('./ShippingMethod');

declare global {
    module ICustomAttributes {
        interface Shipment extends CustomAttributes {
        }
    }
}

/**
 * Represents an order shipment.
 */
declare class Shipment extends ExtensibleObject<ICustomAttributes.Shipment> {
    /**
     * Shipment shipping status representing 'Not shipped'.
     * @deprecated Use SHIPPING_STATUS_NOTSHIPPED instead.
     */
    static readonly SHIPMENT_NOTSHIPPED: number;
    /**
     * Shipment shipping status representing 'Shipped'.
     * @deprecated Use SHIPPING_STATUS_SHIPPED instead.
     */
    static readonly SHIPMENT_SHIPPED: number;
    /**
     * Shipment shipping status representing 'Not shipped'.
     */
    static readonly SHIPPING_STATUS_NOTSHIPPED: number;
    /**
     * Shipment shipping status representing 'Shipped'.
     */
    static readonly SHIPPING_STATUS_SHIPPED: number;
    /**
     * Returns the ID of this shipment ("me" for the default shipment).
     */
    readonly ID: string;
    /**
     * Returns the adjusted total gross price, including tax, in the purchase currency. The adjusted total gross price
     * represents the sum of product prices and adjustments including tax, excluding services.
     */
    readonly adjustedMerchandizeTotalGrossPrice: Money;
    /**
     * Returns the adjusted net price, excluding tax, in the purchase currency. The adjusted net price represents the
     * the sum of product prices and adjustments, excluding services and tax.
     */
    readonly adjustedMerchandizeTotalNetPrice: Money;
    /**
     * Returns the product total price after all product discounts. If the line item container is based on net pricing
     * the adjusted product total net price is returned. If the line item container is based on gross pricing the
     * adjusted product total gross price is returned.
     */
    readonly adjustedMerchandizeTotalPrice: Money;
    /**
     * Returns the total adjusted product tax in the purchase currency. The total adjusted product tax represents the
     * tax on products and adjustments, excluding services.
     */
    readonly adjustedMerchandizeTotalTax: Money;
    /**
     * Returns the adjusted sum of all shipping line items of the shipment, including shipping adjustuments and tax
     */
    readonly adjustedShippingTotalGrossPrice: Money;
    /**
     * Returns the sum of all shipping line items of the shipment, including shipping adjustments, excluding tax.
     */
    readonly adjustedShippingTotalNetPrice: Money;
    /**
     * Returns the adjusted shipping total price. If the line item container is based on net pricing the adjusted
     * shipping total net price is returned. If the line item container is based on gross pricing the adjusted shipping
     * total gross price is returned.
     */
    readonly adjustedShippingTotalPrice: Money;
    /**
     * Returns the tax of all shipping line items of the shipment , including shipping adjustments.
     */
    readonly adjustedShippingTotalTax: Money;
    /**
     * Returns all line items related to the shipment.
     * 
     * The returned collection may include line items of the following types:
     * 
     * - dw.order.ProductLineItem
     * - dw.order.ShippingLineItem
     * - dw.order.GiftCertificateLineItem
     * - dw.order.PriceAdjustment
     * 
     * Their common type is dw.order.LineItem.
     * 
     * Each dw.order.ProductLineItem in the collection may itself contain bundled or option product line items,
     * as well as a product-level shipping line item.
     */
    readonly allLineItems: Collection<LineItem<any>>;
    /**
     * Returns true if this is the default shipment. The default is the shipment with ID "me". If no shipment with
     * ID "me" exists, the shipment with the lowest ID is used as the default. A "me" shipment can be absent if
     * dw.order.OrderMgr.createOrder removed it for being empty, in which case another
     * shipment becomes the default.
     */
    readonly default: boolean;
    /**
     * Returns true if this line item represents a gift, false otherwise.
     */
    gift: boolean;
    /**
     * Returns all gift certificate line items of the shipment.
     */
    readonly giftCertificateLineItems: Collection<GiftCertificateLineItem>;
    /**
     * Returns the value set for gift message or null if no value set.
     */
    giftMessage: string | null;
    /**
     * Returns the gross product subtotal in the purchase currency. The gross product subtotal represents the sum of
     * product prices including tax, excluding services and adjustments.
     */
    readonly merchandizeTotalGrossPrice: Money;
    /**
     * Returns the net product subtotal, excluding tax, in the purchase currency. The net product subtotal represents
     * the sum of product prices, excluding services, adjustments, and tax.
     */
    readonly merchandizeTotalNetPrice: Money;
    /**
     * Returns the product total price. If the line item container is based on net pricing the product total net
     * price is returned. If the line item container is based on gross pricing the product total gross price is
     * returned.
     */
    readonly merchandizeTotalPrice: Money;
    /**
     * Returns a collection of price adjustments that have been applied to the totals, such as a promotion on the
     * purchase value (i.e. $10 Off or 10% Off).
     * @deprecated Shipments cannot have product price adjustments, therefore this method will always return an
     * empty collection
     */
    readonly merchandizeTotalPriceAdjustments: Collection<PriceAdjustment>;
    /**
     * Returns the total product tax in the purchase currency. The total product tax represents the tax on products,
     * excluding services and adjustments.
     */
    readonly merchandizeTotalTax: Money;
    /**
     * Returns a collection of all product line items related to this shipment.
     */
    readonly productLineItems: Collection<ProductLineItem>;
    /**
     * Returns the total product price of the shipment, including product-level adjustments and prorating all
     * Buy-X-Get-Y and order-level adjustments, according to the scheme described in
     * dw.order.PriceAdjustment.getProratedPrices. For net pricing the net price is returned. For gross
     * pricing, the gross price is returned.
     */
    readonly proratedMerchandizeTotalPrice: Money;
    /**
     * Returns the shipment number for this shipment.
     * 
     * When an order is placed (dw.order.OrderMgr.placeOrder) shipment number will be filled using a
     * sequence. Before order was placed `null` will be returned.
     */
    readonly shipmentNo: string | null;
    /**
     * Returns the shipping address or null if none is set.
     */
    readonly shippingAddress: OrderAddress | null;
    /**
     * Returns a collection of all shipping line items of the shipment, excluding any product-level shipping costs that
     * are associated with dw.order.ProductLineItems of the shipment.
     */
    readonly shippingLineItems: Collection<ShippingLineItem>;
    /**
     * Returns the shipping method or null if none is set.
     */
    shippingMethod: ShippingMethod | null;
    /**
     * Returns the shipping method ID or null if none is set.
     */
    readonly shippingMethodID: string | null;
    /**
     * Returns a collection of price adjustments that have been applied to the shipping costs of the shipment, for
     * example by the promotions engine.
     * 
     * Note that this method returns all shipping price adjustments in this shipment, regardless of which shipping line
     * item they belong to. Use dw.order.ShippingLineItem.getShippingPriceAdjustments to retrieve the shipping
     * price adjustments associated with a specific shipping line item.
     */
    readonly shippingPriceAdjustments: Collection<PriceAdjustment>;
    /**
     * Returns the shipping status. Possible values are SHIPMENT_NOTSHIPPED or SHIPMENT_SHIPPED.
     */
    shippingStatus: EnumValue;
    /**
     * Returns the sum of all shipping line items of the shipment, including tax, excluding shipping adjustments.
     */
    readonly shippingTotalGrossPrice: Money;
    /**
     * Returns the sum of all shipping line items of the shipment, excluding tax and adjustments.
     */
    readonly shippingTotalNetPrice: Money;
    /**
     * Returns the shipping total price. If the line item container is based on net pricing the shipping total net price
     * is returned. If the line item container is based on gross pricing the shipping total gross price is returned.
     */
    readonly shippingTotalPrice: Money;
    /**
     * Returns the tax of all shipping line items of the shipment before shipping adjustments have been applied.
     */
    readonly shippingTotalTax: Money;
    /**
     * Convenience method. Same as `getShippingLineItem(ShippingLineItem.STANDARD_SHIPPING_ID)`
     */
    readonly standardShippingLineItem: ShippingLineItem | null;
    /**
     * Returns the total gross price of the shipment in the purchase currency. The total gross price is the sum of
     * product prices, service prices, adjustments, and tax.
     */
    readonly totalGrossPrice: Money;
    /**
     * Returns the total net price of the shipment in the purchase currency. The total net price is the sum of product
     * prices, service prices, and adjustments, excluding tax.
     */
    readonly totalNetPrice: Money;
    /**
     * Returns the total tax for the shipment in the purchase currency.
     */
    readonly totalTax: Money;
    /**
     * Returns the tracking number of this shipment.
     */
    trackingNumber: string;
    private constructor();
    /**
     * A shipment has initially no shipping address. This method creates a shipping address for the shipment and
     * replaces an existing shipping address.
     */
    createShippingAddress(): OrderAddress;
    /**
     * Creates a new shipping line item for this shipment. If the specified ID is already assigned to any of the
     * existing shipping line items of the shipment, the method throws an exception.
     */
    createShippingLineItem(id: string): ShippingLineItem;
    /**
     * Creates a shipping price adjustment to be applied to the shipment. The price adjustment implicitly belongs to the
     * standard shipping line item if this line item exists, otherwise it belongs to the shipment itself.
     * 
     * The promotion ID is mandatory and must not be the ID of any actual promotion defined in Salesforce B2C
     * Commerce.
     * 
     * If there already exists a shipping price adjustment line item referring to the specified promotion ID, an
     * exception is thrown.
     * @deprecated Deprecated in favor of dw.order.ShippingLineItem.createShippingPriceAdjustment, which
     * explicitly relates the price adjustment to a shipping line item.
     */
    createShippingPriceAdjustment(promotionID: string): PriceAdjustment;
    /**
     * Returns the adjusted total gross price, including tax, in the purchase currency. The adjusted total gross price
     * represents the sum of product prices and adjustments including tax, excluding services.
     */
    getAdjustedMerchandizeTotalGrossPrice(): Money;
    /**
     * Returns the adjusted net price, excluding tax, in the purchase currency. The adjusted net price represents the
     * the sum of product prices and adjustments, excluding services and tax.
     */
    getAdjustedMerchandizeTotalNetPrice(): Money;
    /**
     * Returns the product total price after all product discounts. If the line item container is based on net pricing
     * the adjusted product total net price is returned. If the line item container is based on gross pricing the
     * adjusted product total gross price is returned.
     */
    getAdjustedMerchandizeTotalPrice(): Money;
    /**
     * Returns the total product price including product-level adjustments and, optionally, prorated order-level
     * adjustments. For net pricing the net price is returned. For gross pricing, the gross price is returned.
     * @see getAdjustedMerchandizeTotalPrice
     */
    getAdjustedMerchandizeTotalPrice(applyOrderLevelAdjustments: boolean): Money;
    /**
     * Returns the total adjusted product tax in the purchase currency. The total adjusted product tax represents the
     * tax on products and adjustments, excluding services.
     */
    getAdjustedMerchandizeTotalTax(): Money;
    /**
     * Returns the adjusted sum of all shipping line items of the shipment, including shipping adjustuments and tax
     */
    getAdjustedShippingTotalGrossPrice(): Money;
    /**
     * Returns the sum of all shipping line items of the shipment, including shipping adjustments, excluding tax.
     */
    getAdjustedShippingTotalNetPrice(): Money;
    /**
     * Returns the adjusted shipping total price. If the line item container is based on net pricing the adjusted
     * shipping total net price is returned. If the line item container is based on gross pricing the adjusted shipping
     * total gross price is returned.
     */
    getAdjustedShippingTotalPrice(): Money;
    /**
     * Returns the tax of all shipping line items of the shipment , including shipping adjustments.
     */
    getAdjustedShippingTotalTax(): Money;
    /**
     * Returns all line items related to the shipment.
     * 
     * The returned collection may include line items of the following types:
     * 
     * - dw.order.ProductLineItem
     * - dw.order.ShippingLineItem
     * - dw.order.GiftCertificateLineItem
     * - dw.order.PriceAdjustment
     * 
     * Their common type is dw.order.LineItem.
     * 
     * Each dw.order.ProductLineItem in the collection may itself contain bundled or option product line items,
     * as well as a product-level shipping line item.
     */
    getAllLineItems(): Collection<LineItem<any>>;
    /**
     * Returns all gift certificate line items of the shipment.
     */
    getGiftCertificateLineItems(): Collection<GiftCertificateLineItem>;
    /**
     * Returns the value set for gift message or null if no value set.
     */
    getGiftMessage(): string | null;
    /**
     * Returns the ID of this shipment ("me" for the default shipment).
     */
    getID(): string;
    /**
     * Returns the gross product subtotal in the purchase currency. The gross product subtotal represents the sum of
     * product prices including tax, excluding services and adjustments.
     */
    getMerchandizeTotalGrossPrice(): Money;
    /**
     * Returns the net product subtotal, excluding tax, in the purchase currency. The net product subtotal represents
     * the sum of product prices, excluding services, adjustments, and tax.
     */
    getMerchandizeTotalNetPrice(): Money;
    /**
     * Returns the product total price. If the line item container is based on net pricing the product total net
     * price is returned. If the line item container is based on gross pricing the product total gross price is
     * returned.
     */
    getMerchandizeTotalPrice(): Money;
    /**
     * Returns a collection of price adjustments that have been applied to the totals, such as a promotion on the
     * purchase value (i.e. $10 Off or 10% Off).
     * @deprecated Shipments cannot have product price adjustments, therefore this method will always return an
     * empty collection
     */
    getMerchandizeTotalPriceAdjustments(): Collection<PriceAdjustment>;
    /**
     * Returns the total product tax in the purchase currency. The total product tax represents the tax on products,
     * excluding services and adjustments.
     */
    getMerchandizeTotalTax(): Money;
    /**
     * Returns a collection of all product line items related to this shipment.
     */
    getProductLineItems(): Collection<ProductLineItem>;
    /**
     * Returns the total product price of the shipment, including product-level adjustments and prorating all
     * Buy-X-Get-Y and order-level adjustments, according to the scheme described in
     * dw.order.PriceAdjustment.getProratedPrices. For net pricing the net price is returned. For gross
     * pricing, the gross price is returned.
     */
    getProratedMerchandizeTotalPrice(): Money;
    /**
     * Returns the shipment number for this shipment.
     * 
     * When an order is placed (dw.order.OrderMgr.placeOrder) shipment number will be filled using a
     * sequence. Before order was placed `null` will be returned.
     */
    getShipmentNo(): string | null;
    /**
     * Returns the shipping address or null if none is set.
     */
    getShippingAddress(): OrderAddress | null;
    /**
     * Returns the shipping line item identified by the specified ID, or null if not found.
     * 
     * To get the standard shipping line item for this shipment, use the identifier
     * dw.order.ShippingLineItem.STANDARD_SHIPPING_ID.
     */
    getShippingLineItem(id: string): ShippingLineItem | null;
    /**
     * Returns a collection of all shipping line items of the shipment, excluding any product-level shipping costs that
     * are associated with dw.order.ProductLineItems of the shipment.
     */
    getShippingLineItems(): Collection<ShippingLineItem>;
    /**
     * Returns the shipping method or null if none is set.
     */
    getShippingMethod(): ShippingMethod | null;
    /**
     * Returns the shipping method ID or null if none is set.
     */
    getShippingMethodID(): string | null;
    /**
     * Returns the shipping price adjustment associated with the specified promotion ID.
     * @deprecated
     */
    getShippingPriceAdjustmentByPromotionID(promotionID: string): PriceAdjustment;
    /**
     * Returns a collection of price adjustments that have been applied to the shipping costs of the shipment, for
     * example by the promotions engine.
     * 
     * Note that this method returns all shipping price adjustments in this shipment, regardless of which shipping line
     * item they belong to. Use dw.order.ShippingLineItem.getShippingPriceAdjustments to retrieve the shipping
     * price adjustments associated with a specific shipping line item.
     */
    getShippingPriceAdjustments(): Collection<PriceAdjustment>;
    /**
     * Returns the shipping status. Possible values are SHIPMENT_NOTSHIPPED or SHIPMENT_SHIPPED.
     */
    getShippingStatus(): EnumValue;
    /**
     * Returns the sum of all shipping line items of the shipment, including tax, excluding shipping adjustments.
     */
    getShippingTotalGrossPrice(): Money;
    /**
     * Returns the sum of all shipping line items of the shipment, excluding tax and adjustments.
     */
    getShippingTotalNetPrice(): Money;
    /**
     * Returns the shipping total price. If the line item container is based on net pricing the shipping total net price
     * is returned. If the line item container is based on gross pricing the shipping total gross price is returned.
     */
    getShippingTotalPrice(): Money;
    /**
     * Returns the tax of all shipping line items of the shipment before shipping adjustments have been applied.
     */
    getShippingTotalTax(): Money;
    /**
     * Convenience method. Same as `getShippingLineItem(ShippingLineItem.STANDARD_SHIPPING_ID)`
     */
    getStandardShippingLineItem(): ShippingLineItem | null;
    /**
     * Returns the total gross price of the shipment in the purchase currency. The total gross price is the sum of
     * product prices, service prices, adjustments, and tax.
     */
    getTotalGrossPrice(): Money;
    /**
     * Returns the total net price of the shipment in the purchase currency. The total net price is the sum of product
     * prices, service prices, and adjustments, excluding tax.
     */
    getTotalNetPrice(): Money;
    /**
     * Returns the total tax for the shipment in the purchase currency.
     */
    getTotalTax(): Money;
    /**
     * Returns the tracking number of this shipment.
     */
    getTrackingNumber(): string;
    /**
     * Returns true if this is the default shipment. The default is the shipment with ID "me". If no shipment with
     * ID "me" exists, the shipment with the lowest ID is used as the default. A "me" shipment can be absent if
     * dw.order.OrderMgr.createOrder removed it for being empty, in which case another
     * shipment becomes the default.
     */
    isDefault(): boolean;
    /**
     * Returns true if this line item represents a gift, false otherwise.
     */
    isGift(): boolean;
    /**
     * Removes the specified shipping line item and any of its dependent shipping price adjustments.
     */
    removeShippingLineItem(shippingLineItem: ShippingLineItem): void;
    /**
     * Removes the specified shipping price adjustment from the shipment.
     * @deprecated Deprecated in favor of
     * dw.order.ShippingLineItem.removeShippingPriceAdjustment since shipping price
     * adjustments belong to a specific shipping line item.
     */
    removeShippingPriceAdjustment(priceAdjustment: PriceAdjustment): void;
    /**
     * Controls if this line item is a gift or not.
     */
    setGift(isGift: boolean): void;
    /**
     * Sets the value to set for the gift message.
     */
    setGiftMessage(message: string): void;
    /**
     * Set the specified shipping method for the specified shipment.
     */
    setShippingMethod(method: ShippingMethod): void;
    /**
     * Sets the shipping status of the shipment.
     * 
     * Possible values are SHIPPING_STATUS_NOTSHIPPED or SHIPPING_STATUS_SHIPPED.
     */
    setShippingStatus(status: number): void;
    /**
     * Sets the tracking number of this shipment.
     */
    setTrackingNumber(aValue: string): void;
}

export = Shipment;
