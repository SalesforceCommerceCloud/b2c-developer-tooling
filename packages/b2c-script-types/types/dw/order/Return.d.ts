import AbstractItemCtnr = require('./AbstractItemCtnr');
import EnumValue = require('../value/EnumValue');
import ReturnCase = require('./ReturnCase');
import ReturnItem = require('./ReturnItem');
import FilteringCollection = require('../util/FilteringCollection');
import Invoice = require('./Invoice');

/**
 * The Return represents a physical customer return, and contains 1..n
 * dw.order.ReturnItems. The Return is associated with one dw.order.ReturnCase, and each
 * ReturnItem is associated with one dw.order.ReturnCaseItem and (via the
 * ReturnCaseItem) a single dw.order.OrderItem usually representing an dw.order.Order
 * dw.order.ProductLineItem.
 * 
 * The ReturnItem records the quantity returned.
 * 
 * The Return can have one of these status values:
 * 
 * - NEW - the return is new, i.e. needs to undergo a check before it can be
 * marked as COMPLETED
 * - COMPLETED - the return is complete, this is a precondition for refunding the
 * customer for a return.
 * 
 * Order post-processing APIs (gillian) are now inactive by default and will throw
 * an exception if accessed. Activation needs preliminary approval by Product Management.
 * Please contact support in this case. Existing customers using these APIs are not
 * affected by this change and can use the APIs until further notice.
 */
declare class Return extends AbstractItemCtnr {
    /**
     * Sorting by item id. Use with method getItems as an argument to method dw.util.FilteringCollection.sort.
     */
    static readonly ORDERBY_ITEMID: any;
    /**
     * Sorting by the position of the related oder item. Use with method getItems as an argument to method dw.util.FilteringCollection.sort.
     */
    static readonly ORDERBY_ITEMPOSITION: any;
    /**
     * Unsorted , as it is. Use with method getItems as an argument to method dw.util.FilteringCollection.sort.
     */
    static readonly ORDERBY_UNSORTED: any;
    /**
     * Selects the product items. Use with method getItems as an argument to method dw.util.FilteringCollection.select.
     */
    static readonly QUALIFIER_PRODUCTITEMS: any;
    /**
     * Selects for the service items. Use with method getItems as an argument to method dw.util.FilteringCollection.select.
     */
    static readonly QUALIFIER_SERVICEITEMS: any;
    /**
     * Constant for Return Status COMPLETED
     */
    static readonly STATUS_COMPLETED: string;
    /**
     * Constant for Return Status NEW
     */
    static readonly STATUS_NEW: string;
    /**
     * Returns null or the previously created dw.order.Invoice.
     * @see createInvoice
     */
    readonly invoice: Invoice | null;
    /**
     * Returns null or the invoice-number.
     * @see createInvoice
     */
    readonly invoiceNumber: string | null;
    /**
     * A note for the return.
     */
    note: string | null;
    /**
     * Returns the dw.order.ReturnCase with which this Return is associated. The ReturnCase
     * may represent an RMA (return merchandise authorization).
     */
    readonly returnCase: ReturnCase;
    /**
     * The return number identifying this return.
     */
    readonly returnNumber: string;
    /**
     * Gets the return status.
     * 
     * Possible values are STATUS_NEW, STATUS_COMPLETED.
     */
    status: EnumValue;
    private constructor();
    /**
     * Creates a new dw.order.Invoice based on this Return.
     * The return-number will be used as the invoice-number. The
     * Invoice can then be accessed using getInvoice or its
     * number using getInvoiceNumber. The method must not be called
     * more than once for a Return, nor may 2 Invoices exist
     * with the same invoice-number.
     * 
     * The new Invoice is a credit-invoice with a dw.order.Invoice.STATUS_NOT_PAID status, and
     * will be passed to the refund payment-hook in a separate database
     * transaction for processing.
     */
    createInvoice(): Invoice;
    /**
     * Creates a new dw.order.Invoice based on this Return. The
     * invoice-number must be specified as an argument. The
     * Invoice can then be accessed using getInvoice or its
     * number using getInvoiceNumber. The method must not be called
     * more than once for a Return, nor may 2 Invoices exist
     * with the same invoice-number.
     * 
     * The new Invoice is a credit-invoice with a dw.order.Invoice.STATUS_NOT_PAID status, and
     * will be passed to the refund payment-hook in a separate database
     * transaction for processing.
     */
    createInvoice(invoiceNumber: string): Invoice;
    /**
     * Create a dw.order.ReturnItem based on a dw.order.ReturnCaseItem.
     */
    createItem(returnCaseItemID: string): ReturnItem;
    /**
     * Returns null or the previously created dw.order.Invoice.
     * @see createInvoice
     */
    getInvoice(): Invoice | null;
    /**
     * Returns null or the invoice-number.
     * @see createInvoice
     */
    getInvoiceNumber(): string | null;
    /**
     * A note for the return.
     */
    getNote(): string | null;
    /**
     * Returns the dw.order.ReturnCase with which this Return is associated. The ReturnCase
     * may represent an RMA (return merchandise authorization).
     */
    getReturnCase(): ReturnCase;
    /**
     * The return number identifying this return.
     */
    getReturnNumber(): string;
    /**
     * Gets the return status.
     * 
     * Possible values are STATUS_NEW, STATUS_COMPLETED.
     */
    getStatus(): EnumValue;
    /**
     * Sets a note for the return.
     */
    setNote(note: string): void;
    /**
     * Sets the return status.
     * 
     * Possible values are STATUS_NEW, STATUS_COMPLETED
     * 
     * When set to status COMPLETED, only the the custom attributes of the return itself and its return items can be changed.
     */
    setStatus(statusName: string): void;
}

export = Return;
