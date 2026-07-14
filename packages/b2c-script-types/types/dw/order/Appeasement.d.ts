import AbstractItemCtnr = require('./AbstractItemCtnr');
import EnumValue = require('../value/EnumValue');
import Invoice = require('./Invoice');
import Money = require('../value/Money');
import List = require('../util/List');
import FilteringCollection = require('../util/FilteringCollection');
import AppeasementItem = require('./AppeasementItem');

/**
 * The Appeasement represents a shopper request for an order credit.
 * 
 * Example: The buyer finds any problem with the products but he agrees to preserve them, if he would be compensated,
 * rather than return them.
 * 
 * The Appeasement contains 1..n appeasement items.
 * Each appeasement item is associated with one dw.order.OrderItem usually representing an dw.order.Order
 * dw.order.ProductLineItem.
 * 
 * An Appeasement can have one of these status values:
 * 
 * - OPEN - the appeasement is open and appeasement items could be added to it
 * - COMPLETED - the appeasement is complete and it is not allowed to add new items to it, this is a precondition
 * for refunding the customer for an appeasement.
 * 
 * Order post-processing APIs (gillian) are now inactive by default and will throw
 * an exception if accessed. Activation needs preliminary approval by Product Management.
 * Please contact support in this case. Existing customers using these APIs are not
 * affected by this change and can use the APIs until further notice.
 */
declare class Appeasement extends AbstractItemCtnr {
    /**
     * Sorting by item id. Use with method getItems as an argument to method dw.util.FilteringCollection.sort.
     */
    static readonly ORDERBY_ITEMID: any;
    /**
     * Sorting by the position of the related order item. Use with method getItems as an argument to method dw.util.FilteringCollection.sort.
     */
    static readonly ORDERBY_ITEMPOSITION: any;
    /**
     * Unsorted, as it is. Use with method getItems as an argument to method dw.util.FilteringCollection.sort.
     */
    static readonly ORDERBY_UNSORTED: any;
    /**
     * Selects the product items. Use with method getItems as an argument to method dw.util.FilteringCollection.select.
     */
    static readonly QUALIFIER_PRODUCTITEMS: any;
    /**
     * Selects the service items. Use with method getItems as an argument to method dw.util.FilteringCollection.select.
     */
    static readonly QUALIFIER_SERVICEITEMS: any;
    /**
     * Constant for Appeasement Status COMPLETED
     */
    static readonly STATUS_COMPLETED: string;
    /**
     * Constant for Appeasement Status OPEN
     */
    static readonly STATUS_OPEN: string;
    /**
     * Returns the appeasement number.
     */
    readonly appeasementNumber: string;
    /**
     * Returns null or the previously created dw.order.Invoice.
     * @see createInvoice
     */
    readonly invoice: Invoice | null;
    /**
     * Returns `null` or the invoice-number.
     * @see createInvoice
     */
    readonly invoiceNumber: string | null;
    /**
     * Returns the reason code for the appeasement. The list of reason codes can be updated
     * by updating meta-data for Appeasement.
     */
    reasonCode: EnumValue;
    /**
     * Returns the reason note for the appeasement.
     */
    reasonNote: string | null;
    /**
     * Gets the status of this appeasement.
     * 
     * The possible values are STATUS_OPEN, STATUS_COMPLETED.
     */
    status: EnumValue;
    private constructor();
    /**
     * Creates appeasement items corresponding to certain order items and adds them to the appeasement.
     */
    addItems(totalAmount: Money, orderItems: List<any>): void;
    /**
     * Creates a new dw.order.Invoice based on this Appeasement. The appeasement-number
     * will be used as the invoice-number.
     * 
     * The method must not be called more than once for an Appeasement,
     * nor may 2 invoices exist with the same invoice-number.
     * 
     * The new Invoice is a credit-invoice with a dw.order.Invoice.STATUS_NOT_PAID status, and
     * should be passed to the refund payment-hook in a separate database transaction for processing.
     */
    createInvoice(): Invoice;
    /**
     * Creates a new dw.order.Invoice based on this Appeasement. The
     * invoice-number must be specified as an argument.
     * 
     * The method must not be called more than once for an Appeasement,
     * nor may 2 invoices exist with the same invoice-number.
     * 
     * The new Invoice is a credit-invoice with a dw.order.Invoice.STATUS_NOT_PAID status, and
     * should be passed to the refund payment-hook in a separate database transaction for processing.
     */
    createInvoice(invoiceNumber: string): Invoice;
    /**
     * Returns the appeasement number.
     */
    getAppeasementNumber(): string;
    /**
     * Returns null or the previously created dw.order.Invoice.
     * @see createInvoice
     */
    getInvoice(): Invoice | null;
    /**
     * Returns `null` or the invoice-number.
     * @see createInvoice
     */
    getInvoiceNumber(): string | null;
    /**
     * Returns the reason code for the appeasement. The list of reason codes can be updated
     * by updating meta-data for Appeasement.
     */
    getReasonCode(): EnumValue;
    /**
     * Returns the reason note for the appeasement.
     */
    getReasonNote(): string | null;
    /**
     * Gets the status of this appeasement.
     * 
     * The possible values are STATUS_OPEN, STATUS_COMPLETED.
     */
    getStatus(): EnumValue;
    /**
     * Set the reason code for the appeasement. The list of reason codes can be updated
     * by updating meta-data for Appeasement.
     */
    setReasonCode(reasonCode: string): void;
    /**
     * Sets the reason note for the appeasement.
     */
    setReasonNote(reasonNote: string): void;
    /**
     * Sets the appeasement status.
     * 
     * The possible values are STATUS_OPEN, STATUS_COMPLETED.
     * 
     * When set to status COMPLETED, only the the custom attributes of its appeasement items can be changed.
     */
    setStatus(appeasementStatus: string): void;
}

export = Appeasement;
