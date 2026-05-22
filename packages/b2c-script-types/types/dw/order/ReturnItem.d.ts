import AbstractItem = require('./AbstractItem');
import Quantity = require('../value/Quantity');
import EnumValue = require('../value/EnumValue');
import Decimal = require('../util/Decimal');
import ReturnCaseItem = require('./ReturnCaseItem');
import Money = require('../value/Money');
import Collection = require('../util/Collection');
import TaxItem = require('./TaxItem');
import TaxGroup = require('./TaxGroup');

/**
 * An item of a dw.order.Return, created using dw.order.Return.createItem.
 * Represents a physically returned order line item. Please refer to the documentation of dw.order.hooks.ReturnHooks
 * for further information.
 * 
 * When the related Return were set to status COMPLETED, only the the custom attributes of the return item can be changed.
 * 
 * Order post-processing APIs (gillian) are now inactive by default and will throw
 * an exception if accessed. Activation needs preliminary approval by Product Management.
 * Please contact support in this case. Existing customers using these APIs are not
 * affected by this change and can use the APIs until further notice.
 */
declare class ReturnItem extends AbstractItem {
    /**
     * Price of a single unit before discount application.
     */
    readonly basePrice: Money;
    /**
     * Return the note for this return item.
     */
    note: string | null;
    /**
     * Returns null or the parent item.
     */
    parentItem: ReturnItem | null;
    /**
     * Returns the reason code for return item. The list of reason codes can be updated
     * by updating meta-data for ReturnItem.
     */
    reasonCode: EnumValue;
    /**
     * Returns the return case item related to this item. Should never return null.
     */
    readonly returnCaseItem: ReturnCaseItem;
    /**
     * The mandatory returnNumber of the dw.order.Return to which this item belongs.
     */
    readonly returnNumber: string;
    /**
     * The dw.value.Quantity returned. This may return an N/A quantity.
     */
    returnedQuantity: Quantity;
    private constructor();
    /**
     * Create a new dw.order.TaxItem tax-item and add to this item.
     */
    addTaxItem(amount: Decimal, taxGroup: TaxGroup): TaxItem;
    /**
     * Apply a rate of (factor / divisor) to the prices in this item, with the option to half round up or half round down to the
     * nearest cent if necessary.
     * 
     * Examples:
     * 
     * TaxBasis before  factor  divisor  roundup  Calculation  TaxBasis after
     * $10.00  1  2  true  10*1/2=  $5.00
     * $10.00  9  10  true  10*9/10=  $9.00
     * $10.00  1  3  true  10*1/3=3.3333=  $3.33
     * $2.47  1  2  true  2.47*1/2=1.235=  $1.24
     * $2.47  1  2  false  2.47*1/2=1.235=  $1.23
     * 
     * Which prices are updated?:
     * 
     * The rate described above is applied to tax-basis and tax then the net-price and gross-price are recalculated by adding / subtracting
     * depending on whether the order is based on net price.
     * 
     * Example (order based on net price)
     * 
     * New TaxBasis:$10.00, Tax:$1.00, NetPrice=TaxBasis=$10.00, GrossPrice=TaxBasis+Tax=$11.00
     * 
     * Example (order based on gross price)
     * 
     * New TaxBasis:$10.00, Tax:$1.00, NetPrice=TaxBasis-tax=$9.00, GrossPrice=TaxBasis=$10.00
     * @see dw.order.AbstractItem.getTaxBasis
     * @see dw.order.AbstractItem.getTax
     * @see dw.order.AbstractItem.getNetPrice
     * @see dw.order.AbstractItem.getGrossPrice
     * @see dw.order.TaxMgr.getTaxationPolicy
     */
    applyPriceRate(factor: Decimal, divisor: Decimal, roundUp: boolean): void;
    /**
     * Price of a single unit before discount application.
     */
    getBasePrice(): Money;
    /**
     * Return the note for this return item.
     */
    getNote(): string | null;
    /**
     * Returns null or the parent item.
     */
    getParentItem(): ReturnItem | null;
    /**
     * Returns the reason code for return item. The list of reason codes can be updated
     * by updating meta-data for ReturnItem.
     */
    getReasonCode(): EnumValue;
    /**
     * Returns the return case item related to this item. Should never return null.
     */
    getReturnCaseItem(): ReturnCaseItem;
    /**
     * The mandatory returnNumber of the dw.order.Return to which this item belongs.
     */
    getReturnNumber(): string;
    /**
     * The dw.value.Quantity returned. This may return an N/A quantity.
     */
    getReturnedQuantity(): Quantity;
    /**
     * Sets a note for this return item.
     */
    setNote(note: string): void;
    /**
     * Set a parent item. The parent item must belong to the same
     * dw.order.Return. An infinite parent-child loop is disallowed
     * as is a parent-child depth greater than 10. Setting a parent item
     * indicates a dependency of the child item on the parent item, and can be
     * used to form a parallel structure to that accessed using
     * dw.order.ProductLineItem.getParent.
     */
    setParentItem(parentItem: ReturnItem): void;
    /**
     * Set the reason code. The list of reason codes can be updated by updating meta-data for ReturnItem.
     */
    setReasonCode(reasonCode: string): void;
    /**
     * Set the dw.value.Quantity returned. Passing null results in an exception being thrown.
     * The quantity must be higher than zero and not be higher than the remaining quantity to return.
     * 
     * The item prices are recalculated in this method as described in applyPriceRate
     * with the `quantity` argument as the factor, and ordered quantity as divisor
     * and `true` as the roundup parameter.
     * @see dw.order.OrderItem.getReturnedQuantity
     * @see dw.order.ProductLineItem.getQuantity
     */
    setReturnedQuantity(quantity: Quantity): void;
    /**
     * Set the tax-basis price for this item.
     */
    setTaxBasis(taxBasis: Money): void;
    /**
     * Set the tax-items for this item.
     * @see addTaxItem
     * @see dw.order.TaxGroup.create
     */
    setTaxItems(taxItems: Collection<any>): void;
}

export = ReturnItem;
