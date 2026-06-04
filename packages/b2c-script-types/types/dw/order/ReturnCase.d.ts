import AbstractItemCtnr = require('./AbstractItemCtnr');
import EnumValue = require('../value/EnumValue');
import Collection = require('../util/Collection');
import Return = require('./Return');
import FilteringCollection = require('../util/FilteringCollection');
import ReturnCaseItem = require('./ReturnCaseItem');
import Invoice = require('./Invoice');

/**
 * All returns exist in the context of a ReturnCase, each dw.order.Order
 * can have any number of ReturnCases.
 * 
 * The ReturnCase has dw.order.ReturnCaseItems, each of which is associated with an
 * dw.order.OrderItem (an extension to either a dw.order.ProductLineItem or a dw.order.ShippingLineItem).
 * 
 * Each ReturnCaseItem defines dw.order.ReturnCaseItem.getAuthorizedQuantity representing the maximum
 * quantity expected to be returned. The ReturnCaseItem may be associated with
 * 0..n dw.order.ReturnItems - ReturnItems are added to the ReturnCaseItem when
 * dw.order.Returns are created.
 * 
 * Either - a ReturnCase may be used as an RMA, in which case they are
 * created when a customer first shows a wish to return item(s). The customer
 * then includes the RMA number with the returned item(s). The Return created as
 * a result is then associated with the existing ReturnCase.
 * 
 * Or - a ReturnCase is automatically created as part of the return
 * creation, i.e. the customer returns some item(s) leading to a creation of
 * both a Return and an associated ReturnCase.
 * 
 * The scripting api allows access to the ReturnCases, whether the ReturnCase is an RMA or not,
 * and the ReturnCase status. Both the ReturnCaseItems and any Returns
 * associated with the ReturnCase can be accessed.
 * 
 * A ReturnCase has one of these status values:
 * 
 * - NEW - the ReturnCase has been created and can be edited previous to
 * its authorization
 * - CONFIRMED - the ReturnCase is CONFIRMED, can no longer be edited, no
 * Returns have been associated with it. Only a NEW- ReturnCase can be
 * CONFIRMED
 * - PARTIAL_RETURNED - the ReturnCase has been associated with at least one Return,
 * but is not yet complete. Only a CONFIRMED- ReturnCase can be set to
 * PARTIAL_RETURNED
 * - RETURNED - the ReturnCase has been associated with Returns which match
 * the expected authorized quantity. Only an CONFIRMED- or PARTIAL_RETURNED- return-case
 * can be set to RETURNED
 * - CANCELLED - the ReturnCase has been cancelled (only a NEW- or
 * CONFIRMED- ReturnCase can be cancelled)
 * 
 * Order post-processing APIs (gillian) are now inactive by default and will throw
 * an exception if accessed. Activation needs preliminary approval by Product Management.
 * Please contact support in this case. Existing customers using these APIs are not
 * affected by this change and can use the APIs until further notice.
 */
declare class ReturnCase extends AbstractItemCtnr {
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
     * constant for ReturnCase Status CANCELLED
     */
    static readonly STATUS_CANCELLED: string;
    /**
     * constant for ReturnCase Status CONFIRMED
     */
    static readonly STATUS_CONFIRMED: string;
    /**
     * constant for ReturnCase Status NEW
     */
    static readonly STATUS_NEW: string;
    /**
     * constant for ReturnCase Status PARTIAL RETURNED
     */
    static readonly STATUS_PARTIAL_RETURNED: string;
    /**
     * constant for ReturnCase Status RETURNED
     */
    static readonly STATUS_RETURNED: string;
    /**
     * Return whether this is an RMA. This is specified when calling dw.order.Order.createReturnCase.
     */
    readonly RMA: boolean;
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
     * Returns the mandatory return case number identifying this document.
     */
    readonly returnCaseNumber: string;
    /**
     * Return the collection of dw.order.Returns associated with this ReturnCase.
     */
    readonly returns: Collection<Return>;
    /**
     * Gets the return case item status. The status of a ReturnCase is read-only and calculated from the status of
     * the associated dw.order.ReturnCaseItems.
     * 
     * The possible values are STATUS_NEW,STATUS_CONFIRMED,
     * STATUS_PARTIAL_RETURNED, STATUS_RETURNED,
     * STATUS_CANCELLED.
     */
    readonly status: EnumValue;
    private constructor();
    /**
     * 
     * Attempt to confirm the ReturnCase.
     * 
     * Without items the return case will be canceled
     * 
     * When confirmed, only the the custom attributes of its return case items can be changed.
     * @throws IllegalStateException thrown if Status is not  STATUS_NEW
     */
    confirm(): void;
    /**
     * Creates a new dw.order.Invoice based on this
     * ReturnCase. The return-case-number will
     * be used as the invoice-number. The Invoice can then be
     * accessed using getInvoice or its number using
     * getInvoiceNumber. The method must not be called more than once
     * for a ReturnCase, nor may 2 Invoices
     * exist with the same invoice-number.
     * 
     * The new Invoice is a credit-invoice with a
     * dw.order.Invoice.STATUS_NOT_PAID status, and will be passed to
     * the refund payment-hook in a separate database transaction for
     * processing.
     */
    createInvoice(): Invoice;
    /**
     * Creates a new dw.order.Invoice based on this
     * ReturnCase. The invoice-number must be specified as an
     * argument. The Invoice can then be
     * accessed using getInvoice or its number using
     * getInvoiceNumber. The method must not be called more than once
     * for a ReturnCase, nor may 2 Invoices
     * exist with the same invoice-number.
     * 
     * The new Invoice is a credit-invoice with a
     * dw.order.Invoice.STATUS_NOT_PAID status, and will be passed to
     * the refund payment-hook in a separate database transaction for
     * processing.
     */
    createInvoice(invoiceNumber: string): Invoice;
    /**
     * Creates a new item for a given order item. Note: a ReturnCase may have
     * only one item per order item.
     * @throws IllegalArgumentException thrown if getItem(orderItem) returns non null
     */
    createItem(orderItemID: string): ReturnCaseItem | null;
    /**
     * Creates a new dw.order.Return with the given number and associates it with this ReturnCase.
     */
    createReturn(returnNumber: string): Return;
    /**
     * Creates a new dw.order.Return with a generated number and associates it with this ReturnCase.
     */
    createReturn(): Return;
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
     * Returns the mandatory return case number identifying this document.
     */
    getReturnCaseNumber(): string;
    /**
     * Return the collection of dw.order.Returns associated with this ReturnCase.
     */
    getReturns(): Collection<Return>;
    /**
     * Gets the return case item status. The status of a ReturnCase is read-only and calculated from the status of
     * the associated dw.order.ReturnCaseItems.
     * 
     * The possible values are STATUS_NEW,STATUS_CONFIRMED,
     * STATUS_PARTIAL_RETURNED, STATUS_RETURNED,
     * STATUS_CANCELLED.
     */
    getStatus(): EnumValue;
    /**
     * Return whether this is an RMA. This is specified when calling dw.order.Order.createReturnCase.
     */
    isRMA(): boolean;
}

export = ReturnCase;
