import Money = require('../value/Money');
import Collection = require('../util/Collection');
import TaxItem = require('./TaxItem');

/**
 * Container used to represent an subtotal or grandtotal item which contains various prices and a tax breakdown
 * held in a collection of tax-items.
 * 
 * Usage example:
 * @example
 * var invoice : Invoice = ...;
 * var productNet = invoice.productSubTotal.netPrice;
 * var serviceNet = invoice.serviceSubTotal.netPrice;
 * var grandNet   = invoice.grandTotal.netPrice;
 * var grandTax   = invoice.grandTotal.tax;
 * var grandGross = invoice.grandTotal.grossPrice;
 * 
 * # tax breakdown
 * for each(taxItem : TaxItem in invoice.grandTotal.taxItems) {
 * var tax : Money         = taxItem.amount;
 * var taxGroup : TaxGroup = taxItem.taxGroup;
 * var rate : Double       = taxGroup.rate;
 * var caption :String     = taxGroup.caption;
 * var taxType :String     = taxGroup.taxType;
 * }
 */
declare class SumItem {
    /**
     * Gross price of SumItem.
     */
    readonly grossPrice: Money;
    /**
     * Net price of SumItem.
     */
    readonly netPrice: Money;
    /**
     * Total tax for SumItem.
     */
    readonly tax: Money;
    /**
     * Price of entire SumItem on which tax calculation is based. Same as getNetPrice
     * or getGrossPrice depending on whether the order is based on net or gross prices.
     */
    readonly taxBasis: Money;
    /**
     * Tax items representing a tax breakdown for the SumItem.
     * @see dw.order.TaxItem
     */
    readonly taxItems: Collection<TaxItem>;
    private constructor();
    /**
     * Gross price of SumItem.
     */
    getGrossPrice(): Money;
    /**
     * Net price of SumItem.
     */
    getNetPrice(): Money;
    /**
     * Total tax for SumItem.
     */
    getTax(): Money;
    /**
     * Price of entire SumItem on which tax calculation is based. Same as getNetPrice
     * or getGrossPrice depending on whether the order is based on net or gross prices.
     */
    getTaxBasis(): Money;
    /**
     * Tax items representing a tax breakdown for the SumItem.
     * @see dw.order.TaxItem
     */
    getTaxItems(): Collection<TaxItem>;
}

export = SumItem;
