import AbstractItemCtnr = require('./AbstractItemCtnr');
import EnumValue = require('../value/EnumValue');
import FilteringCollection = require('../util/FilteringCollection');
import InvoiceItem = require('./InvoiceItem');
import PaymentTransaction = require('./PaymentTransaction');
import OrderPaymentInstrument = require('./OrderPaymentInstrument');
import Money = require('../value/Money');

/**
 * The Invoice can be a debit or credit invoice, and is created
 * from custom scripts using one of the methods
 * dw.order.ShippingOrder.createInvoice,
 * dw.order.Appeasement.createInvoice,
 * dw.order.ReturnCase.createInvoice or
 * dw.order.Return.createInvoice.
 * 
 * Order post-processing APIs (gillian) are now inactive by default and will throw
 * an exception if accessed. Activation needs preliminary approval by Product Management.
 * Please contact support in this case. Existing customers using these APIs are not
 * affected by this change and can use the APIs until further notice.
 */
declare class Invoice extends AbstractItemCtnr {
    /**
     * Sorting by creation date. Use with method getPaymentTransactions as an argument to
     * method dw.util.FilteringCollection.sort.
     */
    static readonly ORDERBY_CREATION_DATE: any;
    /**
     * Sorting by item id. Use with method getItems as an argument to
     * method dw.util.FilteringCollection.sort.
     */
    static readonly ORDERBY_ITEMID: any;
    /**
     * Sorting by the position of the related oder item. Use with method
     * getItems as an argument to method
     * dw.util.FilteringCollection.sort.
     */
    static readonly ORDERBY_ITEMPOSITION: any;
    /**
     * Reverse orders. Use as an argument
     * to method dw.util.FilteringCollection.sort.
     */
    static readonly ORDERBY_REVERSE: any;
    /**
     * Unsorted , as it is. Use with method getItems as an argument
     * to method dw.util.FilteringCollection.sort.
     */
    static readonly ORDERBY_UNSORTED: any;
    /**
     * Selects the capture transactions. Use with method getPaymentTransactions as an
     * argument to method dw.util.FilteringCollection.select.
     */
    static readonly QUALIFIER_CAPTURE: any;
    /**
     * Selects the product items. Use with method getItems as an
     * argument to method dw.util.FilteringCollection.select.
     */
    static readonly QUALIFIER_PRODUCTITEMS: any;
    /**
     * Selects the refund transactions. Use with method getPaymentTransactions as an
     * argument to method dw.util.FilteringCollection.select.
     */
    static readonly QUALIFIER_REFUND: any;
    /**
     * Selects for the service items. Use with method getItems as an
     * argument to method dw.util.FilteringCollection.select.
     */
    static readonly QUALIFIER_SERVICEITEMS: any;
    /**
     * Constant for Invoice Status Failed.
     * 
     * The invoice handling failed.
     */
    static readonly STATUS_FAILED: string;
    /**
     * Constant for Invoice Status Manual.
     * 
     * The invoice is not paid but will not be handled automatically.
     * 
     * A manual invoice handling (capture or refund) is necessary.
     */
    static readonly STATUS_MANUAL: string;
    /**
     * Constant for Invoice Status Not Paid.
     * 
     * The invoice is not paid and will be handled automatically.
     */
    static readonly STATUS_NOT_PAID: string;
    /**
     * Constant for Invoice Status Paid.
     * 
     * The invoice was successfully paid.
     */
    static readonly STATUS_PAID: string;
    /**
     * Constant for Invoice Type Appeasement.
     * 
     * The invoice was created for an appeasement.
     * 
     * The invoice amount needs to be refunded.
     */
    static readonly TYPE_APPEASEMENT: string;
    /**
     * Constant for Invoice Type Return.
     * 
     * The invoice was created for a return.
     * 
     * The invoice amount needs to be refunded.
     */
    static readonly TYPE_RETURN: string;
    /**
     * Constant for Invoice Type Return Case.
     * 
     * The invoice was created for a return case.
     * 
     * The invoice amount needs to be refunded.
     */
    static readonly TYPE_RETURN_CASE: string;
    /**
     * Constant for Invoice Type Shipping.
     * 
     * The invoice was created for a shipping order.
     * 
     * The invoice amount needs to be captured.
     */
    static readonly TYPE_SHIPPING: string;
    /**
     * Returns the sum of the captured amounts. The captured amounts are
     * calculated on the fly.
     * 
     * Associate a payment capture for a dw.order.OrderPaymentInstrument
     * with an Invoice using
     * addCaptureTransaction.
     */
    readonly capturedAmount: Money;
    /**
     * Returns the invoice number.
     */
    readonly invoiceNumber: string;
    /**
     * Returns the payment transactions belonging to this Invoice.
     * 
     * This dw.util.FilteringCollection can be sorted / filtered using:
     * 
     * - dw.util.FilteringCollection.sort with
     * ORDERBY_CREATION_DATE
     * - dw.util.FilteringCollection.sort with
     * ORDERBY_UNSORTED
     * - dw.util.FilteringCollection.select with
     * QUALIFIER_CAPTURE
     * - dw.util.FilteringCollection.select with
     * QUALIFIER_REFUND
     * @see dw.order.PaymentTransaction
     */
    readonly paymentTransactions: FilteringCollection<PaymentTransaction>;
    /**
     * Returns the sum of the refunded amounts. The refunded amounts are
     * calculated on the fly.
     * 
     * Associate a payment capture for a dw.order.OrderPaymentInstrument
     * with an Invoice using
     * addRefundTransaction.
     */
    readonly refundedAmount: Money;
    /**
     * Returns the invoice status.
     * 
     * The possible values are STATUS_NOT_PAID, STATUS_MANUAL,
     * STATUS_PAID, STATUS_FAILED.
     */
    status: EnumValue;
    /**
     * Returns the invoice type.
     * 
     * The possible values are TYPE_SHIPPING, TYPE_RETURN,
     * TYPE_RETURN_CASE, TYPE_APPEASEMENT.
     */
    readonly type: EnumValue;
    private constructor();
    /**
     * 
     * 
     * The invoice will be accounted.
     * 
     * It will be captured in case of a shipping invoice and it will be refunded in
     * case of an appeasement, return case or return invoice.
     * 
     * The accounting will be handled in the payment hooks
     * dw.order.hooks.PaymentHooks.capture or
     * dw.order.hooks.PaymentHooks.refund. The implementing script could add
     * payment transactions to the invoice. The accompanying business logic will
     * set the status to `PAID` or `FAILED`.
     * 
     * The accounting will fail when the invoice state is different to
     * STATUS_NOT_PAID or STATUS_FAILED.
     * 
     * The method implements its own transaction handling. The method must not
     * be called inside a transaction.
     */
    account(): boolean;
    /**
     * Calling this method registers an amount captured for a given
     * order payment instrument. The authorization for the
     * capture is associated with the payment transaction belonging to the
     * instrument. Calling this method allows the Invoice, the
     * dw.order.OrderPaymentInstrument and the dw.order.Order to
     * return their captured amount as a sum calculated on the fly. The method
     * may be called multiple times for the same instrument (multiple capture
     * for one authorization) or for different instruments (invoice settlement
     * using multiple payments).
     */
    addCaptureTransaction(instrument: OrderPaymentInstrument, capturedAmount: Money): PaymentTransaction;
    /**
     * Calling this method registers an amount refunded for a given
     * order payment instrument. Calling this method allows the
     * Invoice, the dw.order.OrderPaymentInstrument and
     * the dw.order.Order to return their refunded amount as a sum
     * calculated on the fly. The method may be called multiple times for the
     * same instrument (multiple refunds of one payment) or for different
     * instruments (invoice settlement using multiple payments).
     */
    addRefundTransaction(instrument: OrderPaymentInstrument, refundedAmount: Money): PaymentTransaction;
    /**
     * Returns the sum of the captured amounts. The captured amounts are
     * calculated on the fly.
     * 
     * Associate a payment capture for a dw.order.OrderPaymentInstrument
     * with an Invoice using
     * addCaptureTransaction.
     */
    getCapturedAmount(): Money;
    /**
     * Returns the invoice number.
     */
    getInvoiceNumber(): string;
    /**
     * Returns the payment transactions belonging to this Invoice.
     * 
     * This dw.util.FilteringCollection can be sorted / filtered using:
     * 
     * - dw.util.FilteringCollection.sort with
     * ORDERBY_CREATION_DATE
     * - dw.util.FilteringCollection.sort with
     * ORDERBY_UNSORTED
     * - dw.util.FilteringCollection.select with
     * QUALIFIER_CAPTURE
     * - dw.util.FilteringCollection.select with
     * QUALIFIER_REFUND
     * @see dw.order.PaymentTransaction
     */
    getPaymentTransactions(): FilteringCollection<PaymentTransaction>;
    /**
     * Returns the sum of the refunded amounts. The refunded amounts are
     * calculated on the fly.
     * 
     * Associate a payment capture for a dw.order.OrderPaymentInstrument
     * with an Invoice using
     * addRefundTransaction.
     */
    getRefundedAmount(): Money;
    /**
     * Returns the invoice status.
     * 
     * The possible values are STATUS_NOT_PAID, STATUS_MANUAL,
     * STATUS_PAID, STATUS_FAILED.
     */
    getStatus(): EnumValue;
    /**
     * Returns the invoice type.
     * 
     * The possible values are TYPE_SHIPPING, TYPE_RETURN,
     * TYPE_RETURN_CASE, TYPE_APPEASEMENT.
     */
    getType(): EnumValue;
    /**
     * Sets the invoice status.
     * 
     * The possible values are STATUS_NOT_PAID, STATUS_MANUAL,
     * STATUS_PAID, STATUS_FAILED.
     */
    setStatus(status: string): void;
}

export = Invoice;
