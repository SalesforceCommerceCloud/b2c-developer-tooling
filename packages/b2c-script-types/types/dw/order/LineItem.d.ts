import ExtensibleObject = require('../object/ExtensibleObject');
import CustomAttributes = require('../object/CustomAttributes');
import Money = require('../value/Money');
import LineItemCtnr = require('./LineItemCtnr');
import Collection = require('../util/Collection');
import LineItemTax = require('./LineItemTax');

declare global {
    module ICustomAttributes {
        interface LineItem extends CustomAttributes {
        }
    }
}

/**
 * Common line item base class.
 */
declare class LineItem<T extends ICustomAttributes.LineItem = ICustomAttributes.LineItem> extends ExtensibleObject<T> {
    /**
     * Returns the base price for the line item, which is the price of the unit before applying adjustments, in the
     * purchase currency. The base price may be net or gross of tax depending on the configured taxation policy.
     */
    basePrice: Money;
    /**
     * Returns the gross price for the line item, which is the price of the unit before applying adjustments, in the
     * purchase currency, including tax.
     */
    grossPrice: Money;
    /**
     * Returns the line item ctnr of the line item.
     */
    readonly lineItemCtnr: LineItemCtnr<any>;
    /**
     * Returns the display text for the line item.
     */
    lineItemText: string;
    /**
     * Returns the net price for the line item, which is the price of the unit before applying adjustments, in the
     * purchase currency, excluding tax.
     */
    netPrice: Money;
    /**
     * Get the price of the line item. If the line item is based on net pricing then the net price is returned. If the
     * line item is based on gross pricing then the gross price is returned.
     */
    readonly price: Money;
    /**
     * Return the price amount for the line item. Same as getPrice().getValue().
     */
    priceValue: number;
    /**
     * Returns the tax for the line item, which is the tax of the unit before applying adjustments, in the purchase
     * currency.
     */
    tax: Money;
    /**
     * Get the price used to calculate the tax for this line item.
     */
    readonly taxBasis: Money;
    /**
     * Returns the tax class ID for the line item or null if no tax class ID is associated with the line item. In the
     * case where the tax class ID is null, you should use the default tax class ID.
     * @see dw.order.TaxMgr.getDefaultTaxClassID
     */
    taxClassID: string | null;
    /**
     * Returns the tax rate, which is the decimal tax rate to be applied to the product represented by this line item. A
     * value of 0.175 represents a percentage of 17.5%.
     */
    taxRate: number;
    /**
     * Returns the tax items for this line item. When taxes are set via setTaxes, the line item's
     * tax amount and tax rate are updated as the sum and combined rate of all tax items. The tax items are preserved
     * after order creation and can be retrieved on both baskets and orders.
     * 
     * Access is currently restricted to select pilot customers and controlled via feature toggle.
     * @see setTaxes
     * @see LineItemTax
     */
    taxes: Collection<LineItemTax>;
    /**
     * Returns the base price for the line item, which is the price of the unit before applying adjustments, in the
     * purchase currency. The base price may be net or gross of tax depending on the configured taxation policy.
     */
    getBasePrice(): Money;
    /**
     * Returns the gross price for the line item, which is the price of the unit before applying adjustments, in the
     * purchase currency, including tax.
     */
    getGrossPrice(): Money;
    /**
     * Returns the line item ctnr of the line item.
     */
    getLineItemCtnr(): LineItemCtnr<any>;
    /**
     * Returns the display text for the line item.
     */
    getLineItemText(): string;
    /**
     * Returns the net price for the line item, which is the price of the unit before applying adjustments, in the
     * purchase currency, excluding tax.
     */
    getNetPrice(): Money;
    /**
     * Get the price of the line item. If the line item is based on net pricing then the net price is returned. If the
     * line item is based on gross pricing then the gross price is returned.
     */
    getPrice(): Money;
    /**
     * Return the price amount for the line item. Same as getPrice().getValue().
     */
    getPriceValue(): number;
    /**
     * Returns the tax for the line item, which is the tax of the unit before applying adjustments, in the purchase
     * currency.
     */
    getTax(): Money;
    /**
     * Get the price used to calculate the tax for this line item.
     */
    getTaxBasis(): Money;
    /**
     * Returns the tax class ID for the line item or null if no tax class ID is associated with the line item. In the
     * case where the tax class ID is null, you should use the default tax class ID.
     * @see dw.order.TaxMgr.getDefaultTaxClassID
     */
    getTaxClassID(): string | null;
    /**
     * Returns the tax rate, which is the decimal tax rate to be applied to the product represented by this line item. A
     * value of 0.175 represents a percentage of 17.5%.
     */
    getTaxRate(): number;
    /**
     * Returns the tax items for this line item. When taxes are set via setTaxes, the line item's
     * tax amount and tax rate are updated as the sum and combined rate of all tax items. The tax items are preserved
     * after order creation and can be retrieved on both baskets and orders.
     * 
     * Access is currently restricted to select pilot customers and controlled via feature toggle.
     * @see setTaxes
     * @see LineItemTax
     */
    getTaxes(): Collection<LineItemTax>;
    /**
     * Sets the base price for the line item, which is the price of the unit before applying adjustments, in the
     * purchase currency. The base price may be net or gross of tax depending on the configured taxation policy.
     * @deprecated Use updatePrice instead.
     */
    setBasePrice(aValue: Money): void;
    /**
     * Sets the gross price for the line item, which is the Price of the unit before applying adjustments, in the
     * purchase currency, including tax.
     * @deprecated Use updatePrice which sets the base price and also the gross price if the line item
     * is based on gross pricing.
     */
    setGrossPrice(aValue: Money): void;
    /**
     * Sets the display text for the line item.
     */
    setLineItemText(aText: string): void;
    /**
     * Sets the value for the net price, which is the price of the unit before applying adjustments, in the purchase
     * currency, excluding tax.
     * @deprecated Use updatePrice which sets the base price and also the net price if the line item is
     * based on net pricing.
     */
    setNetPrice(aValue: Money): void;
    /**
     * Sets price attributes of the line item based on the current purchase currency and taxation policy.
     * 
     * The methods sets the 'basePrice' attribute of the line item. Additionally, it sets the 'netPrice' attribute of
     * the line item if the current taxation policy is 'net', and the 'grossPrice' attribute, if the current taxation
     * policy is 'gross'.
     * 
     * If null is specified as value, the price attributes are reset to Money.NOT_AVAILABLE.
     */
    setPriceValue(value: number): void;
    /**
     * Sets the value for the tax of the line item, which is the the tax of the unit before applying adjustments, in the
     * purchase currency.
     * 
     * If tax items are already set (e.g. via setTaxes), calling this will clear them.
     */
    setTax(aValue: Money): void;
    /**
     * Sets the tax class ID for the line item.
     */
    setTaxClassID(aValue: string): void;
    /**
     * Sets the tax rate, which is the decimal tax rate to be applied to the product represented by this line item. A
     * value of 0.175 represents a percentage of 17.5%.
     * 
     * If tax items are already set (e.g. via setTaxes), calling this will clear them.
     */
    setTaxRate(taxRate: number): void;
    /**
     * Sets the tax items for this line item. The container must be a basket. Persists the given items, then aggregates
     * them (sum of tax values, combined tax rate) and updates this line item's tax amount and tax rate accordingly.
     * 
     * Each element in the collection must be a LineItemTax, for example created via
     * LineItemTax.LineItemTax.
     * 
     * Use either multilevel tax items via setTaxes or
     * setTax/setTaxRate/updateTax/updateTaxAmount,
     * not both.
     * 
     * Access is currently restricted to select pilot customers and controlled via feature toggle.
     * 
     * The maximum number of tax items allowed per line item is 10.
     * @throws IllegalArgumentException if the container is not a basket, or if more than 10 tax items are provided
     * @see getTaxes
     * @see LineItemTax
     */
    setTaxes(taxItems: Collection<any>): void;
    /**
     * Updates the price attributes of the line item based on the specified price. The base price is set to the
     * specified value. If the line item is based on net pricing then the net price attribute is set. If the line item
     * is based on gross pricing then the gross price attribute is set. Whether or not a line item is based on net or
     * gross pricing is a site-wide configuration parameter.
     * @deprecated Use setPriceValue instead.
     */
    updatePrice(price: Money): void;
    /**
     * Updates the tax-related attributes of the line item based on the specified tax rate, a tax basis determined by
     * the system and the "Tax Rounding Mode" order preference. This method sets the tax basis as an attribute, and is
     * not affected by the previous value of this attribute.
     * 
     * The value used as a basis depends on the type of line item this is and on the promotion preferences for the
     * current site. If you tax products, shipping, and discounts based on price (default), then the tax basis will
     * simply be equal to getPrice. If you tax products and shipping only based on adjusted price, then the
     * tax basis depends upon line item type as follows:
     * 
     * - ProductLineItem: basis equals dw.order.ProductLineItem.getProratedPrice.
     * - ShippingLineItem: basis equals dw.order.ShippingLineItem.getAdjustedPrice.
     * - ProductShippingLineItem: basis equals
     * dw.order.ProductShippingLineItem.getAdjustedPrice.
     * - PriceAdjustment: basis equals 0.00.
     * - All other line item types: basis equals getPrice.
     * 
     * If null is passed as tax rate, tax-related attribute fields are set to N/A.
     */
    updateTax(taxRate: number): void;
    /**
     * Updates the tax-related attributes of the line item based on the specified tax rate, the passed tax basis and the
     * "Tax Rounding Mode" order preference. If null is passed as tax rate or tax basis, tax-related attribute fields
     * are set to N/A.
     * 
     * If tax items are already set (e.g. via setTaxes), calling this will clear them.
     */
    updateTax(taxRate: number, taxBasis: Money | null): void;
    /**
     * Updates tax amount of the line item setting the provided value. Depending on the way how the tax is calculated
     * (based on net or gross price), the corresponding gross or net price is updated accordingly. For tax calculation
     * based on net price, the gross price is calculated by adding the tax to the net price. For tax calculation based
     * on gross price, the net price is calculated by subtracting the tax from the gross price.
     * 
     * If null is passed as tax amount, the item tax and resulting net or gross price are set to N/A.
     * 
     * Note that tax rate is not calculated and it is not updated.
     * 
     * If tax items are already set (e.g. via setTaxes), calling this will clear them.
     */
    updateTaxAmount(tax: Money): void;
}

export = LineItem;
