import AbstractItem = require('./AbstractItem');
import Quantity = require('../value/Quantity');
import Money = require('../value/Money');

/**
 * Represents a specific item in an dw.order.Invoice. Invoice items are added to the invoice
 * on its creation, each item references exactly one order-item.
 * 
 * Order post-processing APIs (gillian) are now inactive by default and will throw
 * an exception if accessed. Activation needs preliminary approval by Product Management.
 * Please contact support in this case. Existing customers using these APIs are not
 * affected by this change and can use the APIs until further notice.
 */
declare class InvoiceItem extends AbstractItem {
    /**
     * Price of a single unit before discount application.
     */
    readonly basePrice: Money;
    /**
     * Returns the captured amount for this item.
     */
    capturedAmount: Money;
    /**
     * Returns the number of the invoice to which this item belongs.
     */
    readonly invoiceNumber: string;
    /**
     * Returns null or the parent item.
     */
    parentItem: InvoiceItem | null;
    /**
     * Returns the quantity of this item.
     */
    readonly quantity: Quantity;
    /**
     * Returns the refunded amount for this item.
     */
    refundedAmount: Money;
    private constructor();
    /**
     * Price of a single unit before discount application.
     */
    getBasePrice(): Money;
    /**
     * Returns the captured amount for this item.
     */
    getCapturedAmount(): Money;
    /**
     * Returns the number of the invoice to which this item belongs.
     */
    getInvoiceNumber(): string;
    /**
     * Returns null or the parent item.
     */
    getParentItem(): InvoiceItem | null;
    /**
     * Returns the quantity of this item.
     */
    getQuantity(): Quantity;
    /**
     * Returns the refunded amount for this item.
     */
    getRefundedAmount(): Money;
    /**
     * Updates the captured amount for this item.
     */
    setCapturedAmount(capturedAmount: Money): void;
    /**
     * Set a parent item. The parent item must belong to the same
     * dw.order.Invoice. An infinite parent-child loop is disallowed
     * as is a parent-child depth greater than 10. Setting a parent item
     * indicates a dependency of the child item on the parent item, and can be
     * used to form a parallel structure to that accessed using
     * dw.order.ProductLineItem.getParent.
     */
    setParentItem(parentItem: InvoiceItem): void;
    /**
     * Updates the refunded amount for this item.
     */
    setRefundedAmount(refundedAmount: Money): void;
}

export = InvoiceItem;
