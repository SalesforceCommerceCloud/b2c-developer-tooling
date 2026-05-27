import ShippingLocation = require('./ShippingLocation');
import Basket = require('./Basket');

/**
 * Provides methods to access the tax table.
 */
declare class TaxMgr {
    /**
     * Constant representing the gross taxation policy.
     */
    static readonly TAX_POLICY_GROSS = 0;
    /**
     * Constant representing the net taxation policy.
     */
    static readonly TAX_POLICY_NET = 1;
    /**
     * Returns the ID of the tax class that represents items with a custom tax rate. The standard order calculation
     * process assumes that such line items are initialized with a tax rate and a being ignored during the tax rate
     * lookup sequence of the calculation process.
     * 
     * Note that this tax class does not appear in the Business Manager tax module.
     */
    static readonly customRateTaxClassID: string;
    /**
     * Returns the ID of the default tax class defined for the site. This class might be used in case a product or
     * service does not define a tax class.
     * 
     * If no default tax class is defined, the method returns null.
     */
    static readonly defaultTaxClassID: string | null;
    /**
     * Returns the ID of the default tax jurisdiction defined for the site. This jurisdiction might be used in case no
     * jurisdiction is defined for a specific address.
     * 
     * If no default tax jurisdiction is defined, this method returns null.
     */
    static readonly defaultTaxJurisdictionID: string | null;
    /**
     * Returns the ID of the tax class that represents tax exempt items. The tax manager will return a tax rate of 0.0
     * for this tax class.
     * 
     * Note that this tax class does not appear in the Business Manager tax module.
     */
    static readonly taxExemptTaxClassID: string;
    /**
     * Returns the taxation policy (net/gross) configured for the current site.
     * @see TAX_POLICY_GROSS
     * @see TAX_POLICY_NET
     */
    static readonly taxationPolicy: number;
    private constructor();
    /**
     * Applies externally set tax rates to the given dw.order.Basket. Only use when
     * dw.order.LineItemCtnr.isExternallyTaxed returns true. Note: a basket can only be created in EXTERNAL
     * tax mode using SCAPI.
     * 
     * Typical usage in tax calculation:
     * @example
     * var TaxMgr = require('dw/order/TaxMgr');
     * 
     * calculateTaxes: function () {
     * Basket basket = BasketMgr.getCurrentBasket();
     * if ( basket.isExternallyTaxed() )
     * {
     * TaxMgr.applyExternalTaxation( basket );
     * }
     * else
     * {
     * // calculation with tax tables or customization
     * }
     * }
     */
    static applyExternalTax(basket: Basket): void;
    /**
     * Applies tax to the given dw.order.Basket using the platform's tax hook dispatch logic.
     * 
     * This method is intended for use in custom dw.order.calculate hook implementations (e.g., in SFRA or
     * SiteGenesis) that override the default basket calculation. Calling this method instead of directly invoking
     * dw.order.calculateTax ensures that Commerce App tax providers registered via
     * sfcc.app.tax.calculate are invoked when available, with automatic fallback to the legacy
     * dw.order.calculateTax hook or the platform default tax calculation.
     * 
     * WARNING: Do NOT call this method from within a dw.order.calculateTax hook
     * implementation, as this will cause infinite recursion. This method is designed to be called from
     * dw.order.calculate hooks only.
     * 
     * The dispatch precedence is:
     * 
     * - sfcc.app.tax.calculate — if a Commerce App tax provider is installed and the feature is
     * enabled.
     * - dw.order.calculateTax — if registered by the storefront.
     * - Platform default tax calculation — using the site's tax tables.
     * 
     * Typical usage in a custom dw.order.calculate hook:
     * @example
     * var TaxMgr = require('dw/order/TaxMgr');
     * 
     * exports.calculate = function (basket) {
     * // ... product prices, promotions, shipping ...
     * TaxMgr.applyTax(basket);
     * basket.updateTotals();
     * };
     */
    static applyTax(basket: Basket): void;
    /**
     * Returns the ID of the tax class that represents items with a custom tax rate. The standard order calculation
     * process assumes that such line items are initialized with a tax rate and a being ignored during the tax rate
     * lookup sequence of the calculation process.
     * 
     * Note that this tax class does not appear in the Business Manager tax module.
     */
    static getCustomRateTaxClassID(): string;
    /**
     * Returns the ID of the default tax class defined for the site. This class might be used in case a product or
     * service does not define a tax class.
     * 
     * If no default tax class is defined, the method returns null.
     */
    static getDefaultTaxClassID(): string | null;
    /**
     * Returns the ID of the default tax jurisdiction defined for the site. This jurisdiction might be used in case no
     * jurisdiction is defined for a specific address.
     * 
     * If no default tax jurisdiction is defined, this method returns null.
     */
    static getDefaultTaxJurisdictionID(): string | null;
    /**
     * Returns the ID of the tax class that represents tax exempt items. The tax manager will return a tax rate of 0.0
     * for this tax class.
     * 
     * Note that this tax class does not appear in the Business Manager tax module.
     */
    static getTaxExemptTaxClassID(): string;
    /**
     * Returns the ID of the tax jurisdiction for the specified address. If no tax jurisdiction defined for the site
     * matches the specified address, this method returns null.
     */
    static getTaxJurisdictionID(location: ShippingLocation): string | null;
    /**
     * Returns the tax rate defined for the specified combination of tax class and tax jurisdiction.
     * 
     * Method returns null if no tax rate is defined.
     * 
     * Method returns 0.0 of 'nontaxable' tax rate is specified (see method 'getNontaxableTaxClassID'.
     */
    static getTaxRate(taxClassID: string, taxJurisdictionID: string): number;
    /**
     * Returns the taxation policy (net/gross) configured for the current site.
     * @see TAX_POLICY_GROSS
     * @see TAX_POLICY_NET
     */
    static getTaxationPolicy(): number;
}

export = TaxMgr;
