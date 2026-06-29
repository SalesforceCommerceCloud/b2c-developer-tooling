import Money = require('../value/Money');
import TaxGroup = require('./TaxGroup');

/**
 * An item containing tax information allowing a tax breakdown between a number of dw.order.TaxGroups.
 */
declare class TaxItem {
    /**
     * Gets the amount.
     */
    readonly amount: Money;
    /**
     * Returns the TaxGroup tax group.
     * @see dw.order.TaxGroup
     */
    readonly taxGroup: TaxGroup;
    private constructor();
    /**
     * Gets the amount.
     */
    getAmount(): Money;
    /**
     * Returns the TaxGroup tax group.
     * @see dw.order.TaxGroup
     */
    getTaxGroup(): TaxGroup;
}

export = TaxItem;
