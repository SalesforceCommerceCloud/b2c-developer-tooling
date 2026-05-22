import LineItem = require('./LineItem');
import ExtensibleObject = require('../object/ExtensibleObject');
import CustomAttributes = require('../object/CustomAttributes');
import Shipment = require('./Shipment');
import ProductLineItem = require('./ProductLineItem');
import Quantity = require('../value/Quantity');
import Collection = require('../util/Collection');
import PriceAdjustment = require('./PriceAdjustment');
import Money = require('../value/Money');

declare global {
    module ICustomAttributes {
        interface ProductShippingLineItem extends ICustomAttributes.LineItem {
        }
    }
}

/**
 * Represents a specific line item in a shipment. A ProductShippingLineItem defines
 * lineitem-specific shipping costs.
 */
declare class ProductShippingLineItem extends LineItem<ICustomAttributes.ProductShippingLineItem> {
    /**
     * Reserved constant.
     * @deprecated this reserved constant is deprecated.
     */
    static readonly PRODUCT_SHIPPING_ID = "PRODUCT_SHIPPING";
    /**
     * Returns the gross price of the product shipping line item after applying
     * all product-shipping-level adjustments.
     * @see getAdjustedNetPrice
     * @see getAdjustedPrice
     */
    readonly adjustedGrossPrice: Money;
    /**
     * Returns the net price of the product shipping line item after applying
     * all product-shipping-level adjustments.
     * @see getAdjustedGrossPrice
     * @see getAdjustedPrice
     */
    readonly adjustedNetPrice: Money;
    /**
     * Returns the price of the product shipping line item after applying all
     * pproduct-shipping-level adjustments. For net pricing the adjusted net
     * price is returned (see getAdjustedNetPrice). For gross
     * pricing, the adjusted gross price is returned (see
     * getAdjustedGrossPrice).
     * @see getAdjustedGrossPrice
     * @see getAdjustedNetPrice
     */
    readonly adjustedPrice: Money;
    /**
     * Returns the tax of the unit after applying adjustments, in the purchase
     * currency.
     */
    readonly adjustedTax: Money;
    /**
     * Returns an iterator of price adjustments that have been applied to this
     * product shipping line item.
     */
    readonly priceAdjustments: Collection<PriceAdjustment>;
    /**
     * Returns the parent product line item this shipping line item belongs to.
     */
    readonly productLineItem: ProductLineItem;
    /**
     * Returns the quantity of the shipping cost.
     */
    quantity: Quantity;
    /**
     * Returns the shipment this shipping line item belongs to.
     */
    readonly shipment: Shipment;
    /**
     * Returns the 'surcharge' flag.
     */
    surcharge: boolean;
    private constructor();
    /**
     * Returns the gross price of the product shipping line item after applying
     * all product-shipping-level adjustments.
     * @see getAdjustedNetPrice
     * @see getAdjustedPrice
     */
    getAdjustedGrossPrice(): Money;
    /**
     * Returns the net price of the product shipping line item after applying
     * all product-shipping-level adjustments.
     * @see getAdjustedGrossPrice
     * @see getAdjustedPrice
     */
    getAdjustedNetPrice(): Money;
    /**
     * Returns the price of the product shipping line item after applying all
     * pproduct-shipping-level adjustments. For net pricing the adjusted net
     * price is returned (see getAdjustedNetPrice). For gross
     * pricing, the adjusted gross price is returned (see
     * getAdjustedGrossPrice).
     * @see getAdjustedGrossPrice
     * @see getAdjustedNetPrice
     */
    getAdjustedPrice(): Money;
    /**
     * Returns the tax of the unit after applying adjustments, in the purchase
     * currency.
     */
    getAdjustedTax(): Money;
    /**
     * Returns an iterator of price adjustments that have been applied to this
     * product shipping line item.
     */
    getPriceAdjustments(): Collection<PriceAdjustment>;
    /**
     * Returns the parent product line item this shipping line item belongs to.
     */
    getProductLineItem(): ProductLineItem;
    /**
     * Returns the quantity of the shipping cost.
     */
    getQuantity(): Quantity;
    /**
     * Returns the shipment this shipping line item belongs to.
     */
    getShipment(): Shipment;
    /**
     * Returns the 'surcharge' flag.
     */
    isSurcharge(): boolean;
    /**
     * Sets price attributes of the line item based on the
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
     * Sets the quantity of the shipping cost.
     */
    setQuantity(quantity: Quantity): void;
    /**
     * Sets the 'surcharge' flag.
     */
    setSurcharge(flag: boolean): void;
}

export = ProductShippingLineItem;
