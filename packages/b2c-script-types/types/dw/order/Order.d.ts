import LineItemCtnr = require('./LineItemCtnr');
import ExtensibleObject = require('../object/ExtensibleObject');
import CustomAttributes = require('../object/CustomAttributes');
import EnumValue = require('../value/EnumValue');
import PaymentTransaction = require('./PaymentTransaction');
import SourceCodeGroup = require('../campaign/SourceCodeGroup');
import Note = require('../object/Note');
import Customer = require('../customer/Customer');
import FilteringCollection = require('../util/FilteringCollection');
import ShippingOrder = require('./ShippingOrder');
import Invoice = require('./Invoice');
import InvoiceItem = require('./InvoiceItem');
import ReturnCase = require('./ReturnCase');
import Return = require('./Return');
import ReturnItem = require('./ReturnItem');
import ShippingOrderItem = require('./ShippingOrderItem');
import ReturnCaseItem = require('./ReturnCaseItem');
import Money = require('../value/Money');
import OrderItem = require('./OrderItem');
import Appeasement = require('./Appeasement');
import AppeasementItem = require('./AppeasementItem');
import Status = require('../system/Status');

declare global {
    module ICustomAttributes {
        interface Order extends ICustomAttributes.LineItemCtnr {
        }
    }
}

/**
 * The Order class represents an order. The correct way to retrieve an order is described in dw.order.OrderMgr.
 */
declare class Order extends LineItemCtnr<ICustomAttributes.Order> {
    /**
     * constant for when Confirmation Status is Confirmed
     */
    static readonly CONFIRMATION_STATUS_CONFIRMED: number;
    /**
     * constant for when Confirmation Status is Not Confirmed
     */
    static readonly CONFIRMATION_STATUS_NOTCONFIRMED: number;
    /**
     * The encryption algorithm "RSA/ECB/OAEPWithSHA-256AndMGF1Padding".
     */
    static readonly ENCRYPTION_ALGORITHM_RSA_ECB_OAEPWITHSHA_256ANDMGF1PADDING = "RSA/ECB/OAEPWithSHA-256AndMGF1Padding";
    /**
     * The outdated encryption algorithm "RSA/ECB/PKCS1Padding". Please do not use anymore!
     * @deprecated Support for this algorithm will be removed in a future release. Please use
     * ENCRYPTION_ALGORITHM_RSA_ECB_OAEPWITHSHA_256ANDMGF1PADDING instead.
     */
    static readonly ENCRYPTION_ALGORITHM_RSA_ECB_PKCS1PADDING = "RSA/ECB/PKCS1Padding";
    /**
     * constant for when Export Status is Exported
     */
    static readonly EXPORT_STATUS_EXPORTED: number;
    /**
     * constant for when Export Status is Failed
     */
    static readonly EXPORT_STATUS_FAILED: number;
    /**
     * constant for when Export Status is Not Exported
     */
    static readonly EXPORT_STATUS_NOTEXPORTED: number;
    /**
     * constant for when Export Status is ready to be exported.
     */
    static readonly EXPORT_STATUS_READY: number;
    /**
     * constant for when Order Status is Cancelled
     */
    static readonly ORDER_STATUS_CANCELLED: number;
    /**
     * constant for when Order Status is Completed
     */
    static readonly ORDER_STATUS_COMPLETED: number;
    /**
     * constant for when Order Status is Created
     */
    static readonly ORDER_STATUS_CREATED: number;
    /**
     * constant for when Order Status is Failed
     */
    static readonly ORDER_STATUS_FAILED: number;
    /**
     * constant for when Order Status is New
     */
    static readonly ORDER_STATUS_NEW: number;
    /**
     * constant for when Order Status is Open
     */
    static readonly ORDER_STATUS_OPEN: number;
    /**
     * constant for when Order Status is Replaced
     */
    static readonly ORDER_STATUS_REPLACED: number;
    /**
     * constant for when Payment Status is Not Paid
     */
    static readonly PAYMENT_STATUS_NOTPAID: number;
    /**
     * constant for when Payment Status is Paid
     */
    static readonly PAYMENT_STATUS_PAID: number;
    /**
     * constant for when Payment Status is Part Paid
     */
    static readonly PAYMENT_STATUS_PARTPAID: number;
    /**
     * constant for when Shipping Status is Not shipped
     */
    static readonly SHIPPING_STATUS_NOTSHIPPED: number;
    /**
     * constant for when Shipping Status is Part Shipped
     */
    static readonly SHIPPING_STATUS_PARTSHIPPED: number;
    /**
     * constant for when Shipping Status is Shipped
     */
    static readonly SHIPPING_STATUS_SHIPPED: number;
    /**
     * Returns the affiliate partner ID value, or null.
     */
    affiliatePartnerID: string | null;
    /**
     * Returns the affiliate partner name value, or null.
     */
    affiliatePartnerName: string | null;
    /**
     * Returns the collection of dw.order.AppeasementItems associated with this order.
     */
    readonly appeasementItems: FilteringCollection<AppeasementItem>;
    /**
     * Returns the collection of dw.order.Appeasements associated with this order.
     */
    readonly appeasements: FilteringCollection<Appeasement>;
    /**
     * If this order was cancelled, returns the value of the
     * cancel code or null.
     */
    cancelCode: EnumValue | null;
    /**
     * If this order was cancelled, returns the text describing why
     * the order was cancelled or null.
     */
    cancelDescription: string | null;
    /**
     * Returns the sum of the captured amounts. The captured amounts
     * are calculated on the fly. Associate a payment capture for an dw.order.PaymentInstrument with an dw.order.Invoice
     * using Invoice.addCaptureTransaction.
     */
    readonly capturedAmount: Money;
    /**
     * Returns the confirmation status of the order.
     * 
     * Possible values are CONFIRMATION_STATUS_NOTCONFIRMED and
     * CONFIRMATION_STATUS_CONFIRMED.
     */
    confirmationStatus: EnumValue;
    /**
     * Returns the name of the user who has created the order.
     * If an agent user has created the order, the agent user's name
     * is returned. Otherwise "Customer" is returned.
     */
    readonly createdBy: string;
    /**
     * Returns the current order. The current order
     * represents the most recent order in a chain of orders.
     * For example, if Order1 was replaced by Order2, Order2 is the current
     * representation of the order and Order1 is the original representation
     * of the order. If you replace Order2 with Order3, Order 3 is now the
     * current order and Order1 is still the original representation of the
     * order. If this order has not been replaced, this method returns this
     * order because this order is the current order.
     * @see getOriginalOrderNo
     * @see getOriginalOrder
     * @see getReplacedOrderNo
     * @see getReplacedOrder
     * @see getReplacementOrderNo
     * @see getReplacementOrder
     */
    readonly currentOrder: Order;
    /**
     * Returns the order number of the current order. The current order
     * represents the most recent order in a chain of orders.
     * For example, if Order1 was replaced by Order2, Order2 is the current
     * representation of the order and Order1 is the original representation
     * of the order. If you replace Order2 with Order3, Order 3 is now the
     * current order and Order1 is still the original representation of the
     * order. If this order has not been replaced, calling this method returns the
     * same value as the getOrderNo method because this order is the
     * current order.
     * @see getOriginalOrderNo
     * @see getOriginalOrder
     * @see getReplacedOrderNo
     * @see getReplacedOrder
     * @see getReplacementOrderNo
     * @see getReplacementOrder
     */
    readonly currentOrderNo: string;
    /**
     * Returns the ID of the locale that was in effect when the order
     * was placed. This is the customer's locale.
     */
    readonly customerLocaleID: string | null;
    /**
     * Returns the customer-specific reference information for the order, or null.
     */
    customerOrderReference: string | null;
    /**
     * Returns a date after which an order can be exported.
     */
    exportAfter: Date;
    /**
     * Returns the export status of the order.
     * 
     * Possible values are: EXPORT_STATUS_NOTEXPORTED,
     * EXPORT_STATUS_EXPORTED, EXPORT_STATUS_READY,
     * and EXPORT_STATUS_FAILED.
     */
    exportStatus: EnumValue;
    /**
     * Returns the value of an external order number associated
     * with this order, or null.
     */
    externalOrderNo: string | null;
    /**
     * Returns the status of an external order associated
     * with this order, or null.
     */
    externalOrderStatus: string | null;
    /**
     * Returns the text describing the external order, or null.
     */
    externalOrderText: string | null;
    /**
     * The Global Party ID reconciles customer identity across multiple systems. For example, as part of the Service for
     * Commerce experience, service agents can find information for customers who have never called into the call
     * center, but have created a profile on the website. Service agents can find guest order data from B2C Commerce and
     * easily create accounts for customers. Customer 360 Data Manager matches records from multiple data sources to
     * determine all the records associated with a specific customer.
     */
    readonly globalPartyID: string | null;
    /**
     * Returns <CODE>true</CODE>, if the order is imported and <CODE>false</CODE>
     * otherwise.
     */
    readonly imported: boolean;
    /**
     * Returns the collection of dw.order.InvoiceItems associated with this order.
     * 
     * Order post-processing APIs (gillian) are now inactive by default and will throw
     * an exception if accessed. Activation needs preliminary approval by Product Management.
     * Please contact support in this case. Existing customers using these APIs are not
     * affected by this change and can use the APIs until further notice.
     */
    readonly invoiceItems: FilteringCollection<InvoiceItem>;
    /**
     * Returns the invoice number for this Order.
     * 
     * When an order is placed (e.g. with dw.order.OrderMgr.placeOrder) invoice number will be filled
     * using a sequence. Before order was placed `null` will be returned unless it was set with
     * setInvoiceNo.
     */
    invoiceNo: string | null;
    /**
     * Returns the collection of dw.order.Invoices associated with this order.
     * 
     * Order post-processing APIs (gillian) are now inactive by default and will throw
     * an exception if accessed. Activation needs preliminary approval by Product Management.
     * Please contact support in this case. Existing customers using these APIs are not
     * affected by this change and can use the APIs until further notice.
     */
    readonly invoices: FilteringCollection<Invoice>;
    /**
     * Returns the order export XML as String object.
     * 
     * NOTE: This method will return payment instrument data masked. If payment instrument re-encryption is needed
     * please use getOrderExportXML_2 instead.
     * 
     * Example:
     * @example
     * var orderXMLAsString : String = order.getOrderExportXML();
     * var orderXML : XML = new XML(orderXMLAsString);
     * @throws IllegalStateException If the method is called in a transaction with changes.
     * @throws IllegalStateException If the order is not placed. This method can be called for placed orders only.
     * @throws IllegalStateException If the order export XML could not be generated.
     */
    readonly orderExportXML: string;
    /**
     * Returns the order number for this order.
     */
    readonly orderNo: string;
    /**
     * Returns the token for this order. The order token is a string (length 32 bytes) associated
     * with this one order. The order token is random. It reduces the capability of malicious
     * users to access an order through guessing. Order token can be used to further validate order
     * ownership, but should never be used to solely validate ownership. In addition, the storefront
     * should ensure authentication and authorization. See the Security Best Practices for Developers for details.
     */
    readonly orderToken: string;
    /**
     * Returns the original order associated with
     * this order. The original order represents an order that was the
     * first ancestor in a chain of orders.
     * For example, if Order1 was replaced by Order2, Order2 is the current
     * representation of the order and Order1 is the original representation
     * of the order. If you replace Order2 with Order3, Order1 is still the
     * original representation of the order. If this order is the first
     * ancestor, this method returns this order.
     * @see dw.order.Order.getCurrentOrderNo
     * @see dw.order.Order.getCurrentOrder
     * @see dw.order.Order.getReplacedOrderNo
     * @see dw.order.Order.getReplacedOrder
     * @see dw.order.Order.getReplacementOrderNo
     * @see dw.order.Order.getReplacementOrder
     */
    readonly originalOrder: Order;
    /**
     * Returns the order number of the original order associated with
     * this order. The original order represents an order that was the
     * first ancestor in a chain of orders.
     * For example, if Order1 was replaced by Order2, Order2 is the current
     * representation of the order and Order1 is the original representation
     * of the order. If you replace Order2 with Order3, Order1 is still the
     * original representation of the order. If this order is the first
     * ancestor, this method returns the value of getOrderNo().
     * @see dw.order.Order.getCurrentOrderNo
     * @see dw.order.Order.getCurrentOrder
     * @see dw.order.Order.getReplacedOrderNo
     * @see dw.order.Order.getReplacedOrder
     * @see dw.order.Order.getReplacementOrderNo
     * @see dw.order.Order.getReplacementOrder
     */
    readonly originalOrderNo: string;
    /**
     * Returns the order payment status value.
     * 
     * Possible values are PAYMENT_STATUS_NOTPAID, PAYMENT_STATUS_PARTPAID
     * or PAYMENT_STATUS_PAID.
     */
    paymentStatus: EnumValue;
    /**
     * Returns the payment transaction associated with this order.
     * It is possible that there are multiple payment transactions
     * associated with the order.  In this case, this method returns
     * the transaction associated with the first PaymentInstrument
     * returned by `getPaymentInstruments()`.
     * @deprecated Use dw.order.LineItemCtnr.getPaymentInstruments
     * to get the list of PaymentInstrument instances and then use
     * getPaymentTransaction() method on each PaymentInstrument to access
     * the individual transactions.
     */
    readonly paymentTransaction: PaymentTransaction | null;
    /**
     * Returns the sum of the refunded amounts. The refunded amounts are
     * calculated on the fly. Associate a payment refund for an dw.order.PaymentInstrument with an dw.order.Invoice
     * using Invoice.addRefundTransaction.
     */
    readonly refundedAmount: Money;
    /**
     * Returns the IP address of the remote host from which the order was created.
     * 
     * If the IP address was not captured for the order because order IP logging
     * was disabled at the time the order was created, null will be returned.
     */
    readonly remoteHost: string | null;
    /**
     * If this order was replaced by another order,
     * returns the value of the replace code. Otherwise.
     * returns null.
     */
    replaceCode: EnumValue;
    /**
     * If this order was replaced by another order,
     * returns the value of the replace description. Otherwise
     * returns null.
     */
    replaceDescription: string | null;
    /**
     * Returns the order that this order replaced or null. For example, if you
     * have three orders where Order1 was replaced by Order2 and Order2 was
     * replaced by Order3, calling this method on Order3 will return Order2.
     * Similarly, calling this method on Order1 will return null as Order1 was
     * the original order.
     * @see getCurrentOrderNo
     * @see getCurrentOrder
     * @see getOriginalOrderNo
     * @see getOriginalOrder
     * @see getReplacementOrderNo
     * @see getReplacementOrder
     */
    readonly replacedOrder: Order | null;
    /**
     * Returns the order number that this order replaced or null if this order
     * did not replace an order. For example, if you have three orders
     * where Order1 was replaced by Order2 and Order2 was replaced by Order3,
     * calling this method on Order3 will return the order number for
     * Order2. Similarly, calling this method on Order1 will return null as
     * Order1 was the original order.
     * @see getCurrentOrderNo
     * @see getCurrentOrder
     * @see getOriginalOrderNo
     * @see getOriginalOrder
     * @see getReplacementOrderNo
     * @see getReplacementOrder
     */
    readonly replacedOrderNo: string | null;
    /**
     * Returns the order that replaced this order, or null.
     * @see getCurrentOrderNo
     * @see getCurrentOrder
     * @see getOriginalOrderNo
     * @see getOriginalOrder
     * @see getReplacedOrderNo
     * @see getReplacedOrder
     */
    readonly replacementOrder: Order | null;
    /**
     * If this order was replaced by another order,
     * returns the order number that replaced this order. Otherwise
     * returns null.
     * @see getCurrentOrderNo
     * @see getCurrentOrder
     * @see getOriginalOrderNo
     * @see getOriginalOrder
     * @see getReplacedOrderNo
     * @see getReplacedOrder
     */
    readonly replacementOrderNo: string | null;
    /**
     * Returns the collection of dw.order.ReturnCaseItems associated with this order.
     * 
     * Order post-processing APIs (gillian) are now inactive by default and will throw
     * an exception if accessed. Activation needs preliminary approval by Product Management.
     * Please contact support in this case. Existing customers using these APIs are not
     * affected by this change and can use the APIs until further notice.
     */
    readonly returnCaseItems: FilteringCollection<ReturnCaseItem>;
    /**
     * Returns the collection of dw.order.ReturnCases associated with this order.
     * 
     * Order post-processing APIs (gillian) are now inactive by default and will throw
     * an exception if accessed. Activation needs preliminary approval by Product Management.
     * Please contact support in this case. Existing customers using these APIs are not
     * affected by this change and can use the APIs until further notice.
     */
    readonly returnCases: FilteringCollection<ReturnCase>;
    /**
     * Returns the collection of dw.order.ReturnItems associated with this order.
     * 
     * Order post-processing APIs (gillian) are now inactive by default and will throw
     * an exception if accessed. Activation needs preliminary approval by Product Management.
     * Please contact support in this case. Existing customers using these APIs are not
     * affected by this change and can use the APIs until further notice.
     */
    readonly returnItems: FilteringCollection<ReturnItem>;
    /**
     * Returns the collection of dw.order.Returns associated with this order.
     * 
     * Order post-processing APIs (gillian) are now inactive by default and will throw
     * an exception if accessed. Activation needs preliminary approval by Product Management.
     * Please contact support in this case. Existing customers using these APIs are not
     * affected by this change and can use the APIs until further notice.
     */
    readonly returns: FilteringCollection<Return>;
    /**
     * Returns the collection of dw.order.ShippingOrderItems associated with this order.
     * 
     * Order post-processing APIs (gillian) are now inactive by default and will throw
     * an exception if accessed. Activation needs preliminary approval by Product Management.
     * Please contact support in this case. Existing customers using these APIs are not
     * affected by this change and can use the APIs until further notice.
     */
    readonly shippingOrderItems: FilteringCollection<ShippingOrderItem>;
    /**
     * Returns the collection of dw.order.ShippingOrders associated with this order.
     * 
     * Order post-processing APIs (gillian) are now inactive by default and will throw
     * an exception if accessed. Activation needs preliminary approval by Product Management.
     * Please contact support in this case. Existing customers using these APIs are not
     * affected by this change and can use the APIs until further notice.
     */
    readonly shippingOrders: FilteringCollection<ShippingOrder>;
    /**
     * Returns the order shipping status.
     * 
     * Possible values are SHIPPING_STATUS_NOTSHIPPED,
     * SHIPPING_STATUS_PARTSHIPPED or SHIPPING_STATUS_SHIPPED.
     */
    shippingStatus: EnumValue;
    /**
     * Returns the source code stored with the order or `null` if no source code is attached to the order.
     */
    readonly sourceCode: string | null;
    /**
     * Returns the source code group attached to the order or `null` if no source code group is attached to
     * the order.
     */
    readonly sourceCodeGroup: SourceCodeGroup | null;
    /**
     * Returns the source code group id stored with the order or `null` if no source code group is attached
     * to the order.
     */
    readonly sourceCodeGroupID: string | null;
    /**
     * Returns the status of the order.
     * 
     * Possible values are:
     * 
     * - ORDER_STATUS_CREATED
     * - ORDER_STATUS_NEW
     * - ORDER_STATUS_OPEN
     * - ORDER_STATUS_COMPLETED
     * - ORDER_STATUS_CANCELLED
     * - ORDER_STATUS_FAILED
     * - ORDER_STATUS_REPLACED
     * 
     * The order status usually changes when a process action is initiated. Most status changes have an action which
     * needs to executed in order to end having the order in a specific order status. When an order is created with e.g.
     * dw.order.OrderMgr.createOrder the order status will be ORDER_STATUS_CREATED. The usual
     * flow is that payment authorization will be added to the order. Once the order is considered as valid (payed,
     * fraud checked, ...) the order gets placed. This can be done by calling
     * dw.order.OrderMgr.placeOrder. The result of placing an order will be status
     * ORDER_STATUS_OPEN (from a process standpoint ORDER_STATUS_NEW which has the same meaning).
     * Status ORDER_STATUS_REPLACED is related to functionality
     * dw.order.BasketMgr.createBasketFromOrder. ORDER_STATUS_COMPLETED has no meaning by
     * default but can be used by custom implementations but is a synonym for NEW/OPEN. Below you will find the most important status changes:
     * 
     * Status before  Action  Status after  Business meaning
     * -  dw.order.OrderMgr.createOrder  CREATED  Order was created from a basket.
     * CREATED  dw.order.OrderMgr.placeOrder  OPEN/NEW  Order was considered as valid. Order can now be exported to 3rd party systems.
     * CREATED  dw.order.OrderMgr.failOrder  FAILED  Order was considered not valid. E.g. payment authorization was wrong or fraud check was not successful.
     * OPEN/NEW  dw.order.OrderMgr.cancelOrder  CANCELLED  Order was cancelled.
     * CANCELLED  dw.order.OrderMgr.undoCancelOrder  OPEN/NEW  Order was cancelled by mistake and this needs to be undone.
     * FAILED  dw.order.OrderMgr.undoFailOrder  CREATED  Order was failed by mistake and this needs to be undone.
     * 
     * Every status change will trigger a change in the order journal which is the base for GMV calculations.
     * @see dw.order.LineItemCtnr
     */
    status: EnumValue;
    /**
     * Use this method to check if the Order was created with grouped taxation calculation.
     * 
     * If the tax is rounded on group level, the tax is applied to the summed-up tax basis for each tax rate.
     */
    readonly taxRoundedAtGroup: boolean;
    private constructor();
    /**
     * Creates a new dw.order.Appeasement associated with this order.
     * 
     * An appeasementNumber must be specified.
     * 
     * If an Appeasement already exists for the appeasementNumber, the method fails with an
     * exception.
     * 
     * Order post-processing APIs (gillian) are now inactive by default and will throw
     * an exception if accessed. Activation needs preliminary approval by Product Management.
     * Please contact support in this case. Existing customers using these APIs are not
     * affected by this change and can use the APIs until further notice.
     * @throws IllegalArgumentException if an Appeasement already exists with the number.
     */
    createAppeasement(appeasementNumber: string): Appeasement;
    /**
     * Creates a new dw.order.Appeasement associated with this order.
     * 
     * The new Appeasement
     * will have an appeasementNumber based on the getOrderNo.
     * 
     * Order post-processing APIs (gillian) are now inactive by default and will throw
     * an exception if accessed. Activation needs preliminary approval by Product Management.
     * Please contact support in this case. Existing customers using these APIs are not
     * affected by this change and can use the APIs until further notice.
     */
    createAppeasement(): Appeasement;
    /**
     * Creates a new dw.order.ReturnCase associated with this order
     * specifying whether the ReturnCase is an RMA (return merchandise authorization).
     * 
     * A returnCaseNumber must be specified.
     * 
     * If a ReturnCase already exists for the returnCaseNumber, the method fails with an
     * exception.
     * 
     * Order post-processing APIs (gillian) are now inactive by default and will throw
     * an exception if accessed. Activation needs preliminary approval by Product Management.
     * Please contact support in this case. Existing customers using these APIs are not
     * affected by this change and can use the APIs until further notice.
     * @throws IllegalArgumentException if a ReturnCase already exists with the number.
     */
    createReturnCase(returnCaseNumber: string, isRMA: boolean): ReturnCase | null;
    /**
     * Creates a new dw.order.ReturnCase associated with this order
     * specifying whether the ReturnCase is an RMA (return merchandise authorization).
     * 
     * The new ReturnCase
     * will have a returnCaseNumber based on the getOrderNo, e.g. for an order-no 1234 the
     * return cases will have the numbers 1234#RC1, 1234#RC2, 1234#RC3...
     * 
     * Order post-processing APIs (gillian) are now inactive by default and will throw
     * an exception if accessed. Activation needs preliminary approval by Product Management.
     * Please contact support in this case. Existing customers using these APIs are not
     * affected by this change and can use the APIs until further notice.
     */
    createReturnCase(isRMA: boolean): ReturnCase;
    /**
     * Returns the dw.order.OrderItem order item with the given status which wraps a new
     * dw.order.ShippingLineItem service item which is created and added to the order.
     */
    createServiceItem(ID: string, status: string): OrderItem;
    /**
     * Creates a new dw.order.ShippingOrder for this order.
     * 
     * Generates a default shipping order number. Use
     * createShippingOrder for a defined shipping order number.
     * 
     * Order post-processing APIs (gillian) are now inactive by default and will throw
     * an exception if accessed. Activation needs preliminary approval by Product Management.
     * Please contact support in this case. Existing customers using these APIs are not
     * affected by this change and can use the APIs until further notice.
     * @see dw.order.ShippingOrder
     */
    createShippingOrder(): ShippingOrder;
    /**
     * Creates a new dw.order.ShippingOrder for this order.
     * 
     * Order post-processing APIs (gillian) are now inactive by default and will throw
     * an exception if accessed. Activation needs preliminary approval by Product Management.
     * Please contact support in this case. Existing customers using these APIs are not
     * affected by this change and can use the APIs until further notice.
     * @see dw.order.ShippingOrder
     */
    createShippingOrder(shippingOrderNumber: string): ShippingOrder;
    /**
     * Returns the affiliate partner ID value, or null.
     */
    getAffiliatePartnerID(): string | null;
    /**
     * Returns the affiliate partner name value, or null.
     */
    getAffiliatePartnerName(): string | null;
    /**
     * Returns the dw.order.Appeasement associated with this order with the given appeasementNumber.
     * The method returns `null` if no instance can be found.
     */
    getAppeasement(appeasementNumber: string): Appeasement | null;
    /**
     * Returns the dw.order.AppeasementItem associated with this Order with the given appeasementItemID.
     * The method returns `null` if no instance can be found.
     */
    getAppeasementItem(appeasementItemID: string): AppeasementItem | null;
    /**
     * Returns the collection of dw.order.AppeasementItems associated with this order.
     */
    getAppeasementItems(): FilteringCollection<AppeasementItem>;
    /**
     * Returns the collection of dw.order.Appeasements associated with this order.
     */
    getAppeasements(): FilteringCollection<Appeasement>;
    /**
     * If this order was cancelled, returns the value of the
     * cancel code or null.
     */
    getCancelCode(): EnumValue | null;
    /**
     * If this order was cancelled, returns the text describing why
     * the order was cancelled or null.
     */
    getCancelDescription(): string | null;
    /**
     * Returns the sum of the captured amounts. The captured amounts
     * are calculated on the fly. Associate a payment capture for an dw.order.PaymentInstrument with an dw.order.Invoice
     * using Invoice.addCaptureTransaction.
     */
    getCapturedAmount(): Money;
    /**
     * Returns the confirmation status of the order.
     * 
     * Possible values are CONFIRMATION_STATUS_NOTCONFIRMED and
     * CONFIRMATION_STATUS_CONFIRMED.
     */
    getConfirmationStatus(): EnumValue;
    /**
     * Returns the name of the user who has created the order.
     * If an agent user has created the order, the agent user's name
     * is returned. Otherwise "Customer" is returned.
     */
    getCreatedBy(): string;
    /**
     * Returns the current order. The current order
     * represents the most recent order in a chain of orders.
     * For example, if Order1 was replaced by Order2, Order2 is the current
     * representation of the order and Order1 is the original representation
     * of the order. If you replace Order2 with Order3, Order 3 is now the
     * current order and Order1 is still the original representation of the
     * order. If this order has not been replaced, this method returns this
     * order because this order is the current order.
     * @see getOriginalOrderNo
     * @see getOriginalOrder
     * @see getReplacedOrderNo
     * @see getReplacedOrder
     * @see getReplacementOrderNo
     * @see getReplacementOrder
     */
    getCurrentOrder(): Order;
    /**
     * Returns the order number of the current order. The current order
     * represents the most recent order in a chain of orders.
     * For example, if Order1 was replaced by Order2, Order2 is the current
     * representation of the order and Order1 is the original representation
     * of the order. If you replace Order2 with Order3, Order 3 is now the
     * current order and Order1 is still the original representation of the
     * order. If this order has not been replaced, calling this method returns the
     * same value as the getOrderNo method because this order is the
     * current order.
     * @see getOriginalOrderNo
     * @see getOriginalOrder
     * @see getReplacedOrderNo
     * @see getReplacedOrder
     * @see getReplacementOrderNo
     * @see getReplacementOrder
     */
    getCurrentOrderNo(): string;
    /**
     * Returns the ID of the locale that was in effect when the order
     * was placed. This is the customer's locale.
     */
    getCustomerLocaleID(): string | null;
    /**
     * Returns the customer-specific reference information for the order, or null.
     */
    getCustomerOrderReference(): string | null;
    /**
     * Returns a date after which an order can be exported.
     */
    getExportAfter(): Date;
    /**
     * Returns the export status of the order.
     * 
     * Possible values are: EXPORT_STATUS_NOTEXPORTED,
     * EXPORT_STATUS_EXPORTED, EXPORT_STATUS_READY,
     * and EXPORT_STATUS_FAILED.
     */
    getExportStatus(): EnumValue;
    /**
     * Returns the value of an external order number associated
     * with this order, or null.
     */
    getExternalOrderNo(): string | null;
    /**
     * Returns the status of an external order associated
     * with this order, or null.
     */
    getExternalOrderStatus(): string | null;
    /**
     * Returns the text describing the external order, or null.
     */
    getExternalOrderText(): string | null;
    /**
     * The Global Party ID reconciles customer identity across multiple systems. For example, as part of the Service for
     * Commerce experience, service agents can find information for customers who have never called into the call
     * center, but have created a profile on the website. Service agents can find guest order data from B2C Commerce and
     * easily create accounts for customers. Customer 360 Data Manager matches records from multiple data sources to
     * determine all the records associated with a specific customer.
     */
    getGlobalPartyID(): string | null;
    /**
     * Returns the dw.order.Invoice associated with this order with the given invoiceNumber.
     * The method returns `null` if no instance can be found.
     * 
     * Order post-processing APIs (gillian) are now inactive by default and will throw
     * an exception if accessed. Activation needs preliminary approval by Product Management.
     * Please contact support in this case. Existing customers using these APIs are not
     * affected by this change and can use the APIs until further notice.
     */
    getInvoice(invoiceNumber: string): Invoice | null;
    /**
     * Returns the dw.order.InvoiceItem associated with this order with the given ID.
     * The method returns `null` if no instance can be found.
     * 
     * Order post-processing APIs (gillian) are now inactive by default and will throw
     * an exception if accessed. Activation needs preliminary approval by Product Management.
     * Please contact support in this case. Existing customers using these APIs are not
     * affected by this change and can use the APIs until further notice.
     */
    getInvoiceItem(invoiceItemID: string): InvoiceItem | null;
    /**
     * Returns the collection of dw.order.InvoiceItems associated with this order.
     * 
     * Order post-processing APIs (gillian) are now inactive by default and will throw
     * an exception if accessed. Activation needs preliminary approval by Product Management.
     * Please contact support in this case. Existing customers using these APIs are not
     * affected by this change and can use the APIs until further notice.
     */
    getInvoiceItems(): FilteringCollection<InvoiceItem>;
    /**
     * Returns the invoice number for this Order.
     * 
     * When an order is placed (e.g. with dw.order.OrderMgr.placeOrder) invoice number will be filled
     * using a sequence. Before order was placed `null` will be returned unless it was set with
     * setInvoiceNo.
     */
    getInvoiceNo(): string | null;
    /**
     * Returns the collection of dw.order.Invoices associated with this order.
     * 
     * Order post-processing APIs (gillian) are now inactive by default and will throw
     * an exception if accessed. Activation needs preliminary approval by Product Management.
     * Please contact support in this case. Existing customers using these APIs are not
     * affected by this change and can use the APIs until further notice.
     */
    getInvoices(): FilteringCollection<Invoice>;
    /**
     * Returns the order export XML as String object, with payment instrument data re-encrypted using the given
     * encryption algorithm and key.
     * 
     * NOTE: If no encryption is needed or desired please always use getOrderExportXML instead, which returns
     * the payment instrument data masked. Do not pass in any null arguments!
     * 
     * Example:
     * @example
     * var orderXMLAsString : String = order.getOrderExportXML( "RSA/ECB/PKCS1Padding", "[key]", false );
     * var orderXML : XML = new XML( orderXMLAsString );
     * @throws IllegalStateException If the method is called in a transaction with changes.
     * @throws IllegalStateException If the order is not placed. This method can be called for placed orders only.
     * @throws IllegalStateException If the order export XML could not be generated.
     * @deprecated This method will be removed soon. Please use the following methods instead:
     * 
     * - getOrderExportXML \u2013 if payment instrument data should be masked
     * - getOrderExportXML_1 \u2013 if payment instrument data should be re-encrypted
     */
    getOrderExportXML(encryptionAlgorithm: string, encryptionKey: string, encryptUsingEKID: boolean): string;
    /**
     * Returns the dw.order.OrderItem for the itemID.
     * An OrderItem will only exist for dw.order.ProductLineItems or
     * dw.order.ShippingLineItems which belong to the order.
     * The method fails with an exception if no instance can be found.
     * @throws IllegalArgumentException if no instance is found
     * @see dw.order.ProductLineItem.getOrderItem
     * @see dw.order.ShippingLineItem.getOrderItem
     */
    getOrderItem(itemID: string): OrderItem;
    /**
     * Returns the order number for this order.
     */
    getOrderNo(): string;
    /**
     * Returns the token for this order. The order token is a string (length 32 bytes) associated
     * with this one order. The order token is random. It reduces the capability of malicious
     * users to access an order through guessing. Order token can be used to further validate order
     * ownership, but should never be used to solely validate ownership. In addition, the storefront
     * should ensure authentication and authorization. See the Security Best Practices for Developers for details.
     */
    getOrderToken(): string;
    /**
     * Returns the original order associated with
     * this order. The original order represents an order that was the
     * first ancestor in a chain of orders.
     * For example, if Order1 was replaced by Order2, Order2 is the current
     * representation of the order and Order1 is the original representation
     * of the order. If you replace Order2 with Order3, Order1 is still the
     * original representation of the order. If this order is the first
     * ancestor, this method returns this order.
     * @see dw.order.Order.getCurrentOrderNo
     * @see dw.order.Order.getCurrentOrder
     * @see dw.order.Order.getReplacedOrderNo
     * @see dw.order.Order.getReplacedOrder
     * @see dw.order.Order.getReplacementOrderNo
     * @see dw.order.Order.getReplacementOrder
     */
    getOriginalOrder(): Order;
    /**
     * Returns the order number of the original order associated with
     * this order. The original order represents an order that was the
     * first ancestor in a chain of orders.
     * For example, if Order1 was replaced by Order2, Order2 is the current
     * representation of the order and Order1 is the original representation
     * of the order. If you replace Order2 with Order3, Order1 is still the
     * original representation of the order. If this order is the first
     * ancestor, this method returns the value of getOrderNo().
     * @see dw.order.Order.getCurrentOrderNo
     * @see dw.order.Order.getCurrentOrder
     * @see dw.order.Order.getReplacedOrderNo
     * @see dw.order.Order.getReplacedOrder
     * @see dw.order.Order.getReplacementOrderNo
     * @see dw.order.Order.getReplacementOrder
     */
    getOriginalOrderNo(): string;
    /**
     * Returns the order payment status value.
     * 
     * Possible values are PAYMENT_STATUS_NOTPAID, PAYMENT_STATUS_PARTPAID
     * or PAYMENT_STATUS_PAID.
     */
    getPaymentStatus(): EnumValue;
    /**
     * Returns the payment transaction associated with this order.
     * It is possible that there are multiple payment transactions
     * associated with the order.  In this case, this method returns
     * the transaction associated with the first PaymentInstrument
     * returned by `getPaymentInstruments()`.
     * @deprecated Use dw.order.LineItemCtnr.getPaymentInstruments
     * to get the list of PaymentInstrument instances and then use
     * getPaymentTransaction() method on each PaymentInstrument to access
     * the individual transactions.
     */
    getPaymentTransaction(): PaymentTransaction | null;
    /**
     * Returns the sum of the refunded amounts. The refunded amounts are
     * calculated on the fly. Associate a payment refund for an dw.order.PaymentInstrument with an dw.order.Invoice
     * using Invoice.addRefundTransaction.
     */
    getRefundedAmount(): Money;
    /**
     * Returns the IP address of the remote host from which the order was created.
     * 
     * If the IP address was not captured for the order because order IP logging
     * was disabled at the time the order was created, null will be returned.
     */
    getRemoteHost(): string | null;
    /**
     * If this order was replaced by another order,
     * returns the value of the replace code. Otherwise.
     * returns null.
     */
    getReplaceCode(): EnumValue;
    /**
     * If this order was replaced by another order,
     * returns the value of the replace description. Otherwise
     * returns null.
     */
    getReplaceDescription(): string | null;
    /**
     * Returns the order that this order replaced or null. For example, if you
     * have three orders where Order1 was replaced by Order2 and Order2 was
     * replaced by Order3, calling this method on Order3 will return Order2.
     * Similarly, calling this method on Order1 will return null as Order1 was
     * the original order.
     * @see getCurrentOrderNo
     * @see getCurrentOrder
     * @see getOriginalOrderNo
     * @see getOriginalOrder
     * @see getReplacementOrderNo
     * @see getReplacementOrder
     */
    getReplacedOrder(): Order | null;
    /**
     * Returns the order number that this order replaced or null if this order
     * did not replace an order. For example, if you have three orders
     * where Order1 was replaced by Order2 and Order2 was replaced by Order3,
     * calling this method on Order3 will return the order number for
     * Order2. Similarly, calling this method on Order1 will return null as
     * Order1 was the original order.
     * @see getCurrentOrderNo
     * @see getCurrentOrder
     * @see getOriginalOrderNo
     * @see getOriginalOrder
     * @see getReplacementOrderNo
     * @see getReplacementOrder
     */
    getReplacedOrderNo(): string | null;
    /**
     * Returns the order that replaced this order, or null.
     * @see getCurrentOrderNo
     * @see getCurrentOrder
     * @see getOriginalOrderNo
     * @see getOriginalOrder
     * @see getReplacedOrderNo
     * @see getReplacedOrder
     */
    getReplacementOrder(): Order | null;
    /**
     * If this order was replaced by another order,
     * returns the order number that replaced this order. Otherwise
     * returns null.
     * @see getCurrentOrderNo
     * @see getCurrentOrder
     * @see getOriginalOrderNo
     * @see getOriginalOrder
     * @see getReplacedOrderNo
     * @see getReplacedOrder
     */
    getReplacementOrderNo(): string | null;
    /**
     * Returns the dw.order.Return associated with this order with the given returnNumber.
     * The method returns `null` if no instance can be found.
     * 
     * Order post-processing APIs (gillian) are now inactive by default and will throw
     * an exception if accessed. Activation needs preliminary approval by Product Management.
     * Please contact support in this case. Existing customers using these APIs are not
     * affected by this change and can use the APIs until further notice.
     */
    getReturn(returnNumber: string): Return | null;
    /**
     * Returns the dw.order.ReturnCase associated with this order with the given returnCaseNumber.
     * The method returns `null` if no instance can be found.
     * 
     * Order post-processing APIs (gillian) are now inactive by default and will throw
     * an exception if accessed. Activation needs preliminary approval by Product Management.
     * Please contact support in this case. Existing customers using these APIs are not
     * affected by this change and can use the APIs until further notice.
     */
    getReturnCase(returnCaseNumber: string): ReturnCase | null;
    /**
     * Returns the dw.order.ReturnCaseItem associated with this order with the given returnCaseItemID.
     * The method returns `null` if no instance can be found.
     * 
     * Order post-processing APIs (gillian) are now inactive by default and will throw
     * an exception if accessed. Activation needs preliminary approval by Product Management.
     * Please contact support in this case. Existing customers using these APIs are not
     * affected by this change and can use the APIs until further notice.
     */
    getReturnCaseItem(returnCaseItemID: string): ReturnCaseItem | null;
    /**
     * Returns the collection of dw.order.ReturnCaseItems associated with this order.
     * 
     * Order post-processing APIs (gillian) are now inactive by default and will throw
     * an exception if accessed. Activation needs preliminary approval by Product Management.
     * Please contact support in this case. Existing customers using these APIs are not
     * affected by this change and can use the APIs until further notice.
     */
    getReturnCaseItems(): FilteringCollection<ReturnCaseItem>;
    /**
     * Returns the collection of dw.order.ReturnCases associated with this order.
     * 
     * Order post-processing APIs (gillian) are now inactive by default and will throw
     * an exception if accessed. Activation needs preliminary approval by Product Management.
     * Please contact support in this case. Existing customers using these APIs are not
     * affected by this change and can use the APIs until further notice.
     */
    getReturnCases(): FilteringCollection<ReturnCase>;
    /**
     * Returns the dw.order.ReturnItem associated with this order with the given ID.
     * The method returns `null` if no instance can be found.
     * 
     * Order post-processing APIs (gillian) are now inactive by default and will throw
     * an exception if accessed. Activation needs preliminary approval by Product Management.
     * Please contact support in this case. Existing customers using these APIs are not
     * affected by this change and can use the APIs until further notice.
     */
    getReturnItem(returnItemID: string): ReturnItem | null;
    /**
     * Returns the collection of dw.order.ReturnItems associated with this order.
     * 
     * Order post-processing APIs (gillian) are now inactive by default and will throw
     * an exception if accessed. Activation needs preliminary approval by Product Management.
     * Please contact support in this case. Existing customers using these APIs are not
     * affected by this change and can use the APIs until further notice.
     */
    getReturnItems(): FilteringCollection<ReturnItem>;
    /**
     * Returns the collection of dw.order.Returns associated with this order.
     * 
     * Order post-processing APIs (gillian) are now inactive by default and will throw
     * an exception if accessed. Activation needs preliminary approval by Product Management.
     * Please contact support in this case. Existing customers using these APIs are not
     * affected by this change and can use the APIs until further notice.
     */
    getReturns(): FilteringCollection<Return>;
    /**
     * Returns the dw.order.ShippingOrder associated with this order with the given shippingOrderNumber.
     * The method returns `null` if no instance can be found.
     * 
     * Order post-processing APIs (gillian) are now inactive by default and will throw
     * an exception if accessed. Activation needs preliminary approval by Product Management.
     * Please contact support in this case. Existing customers using these APIs are not
     * affected by this change and can use the APIs until further notice.
     */
    getShippingOrder(shippingOrderNumber: string): ShippingOrder | null;
    /**
     * Returns the dw.order.ShippingOrderItem associated with this order with the given shippingOrderItemID.
     * The method returns `null` if no instance can be found.
     * 
     * Order post-processing APIs (gillian) are now inactive by default and will throw
     * an exception if accessed. Activation needs preliminary approval by Product Management.
     * Please contact support in this case. Existing customers using these APIs are not
     * affected by this change and can use the APIs until further notice.
     */
    getShippingOrderItem(shippingOrderItemID: string): ShippingOrderItem | null;
    /**
     * Returns the collection of dw.order.ShippingOrderItems associated with this order.
     * 
     * Order post-processing APIs (gillian) are now inactive by default and will throw
     * an exception if accessed. Activation needs preliminary approval by Product Management.
     * Please contact support in this case. Existing customers using these APIs are not
     * affected by this change and can use the APIs until further notice.
     */
    getShippingOrderItems(): FilteringCollection<ShippingOrderItem>;
    /**
     * Returns the collection of dw.order.ShippingOrders associated with this order.
     * 
     * Order post-processing APIs (gillian) are now inactive by default and will throw
     * an exception if accessed. Activation needs preliminary approval by Product Management.
     * Please contact support in this case. Existing customers using these APIs are not
     * affected by this change and can use the APIs until further notice.
     */
    getShippingOrders(): FilteringCollection<ShippingOrder>;
    /**
     * Returns the order shipping status.
     * 
     * Possible values are SHIPPING_STATUS_NOTSHIPPED,
     * SHIPPING_STATUS_PARTSHIPPED or SHIPPING_STATUS_SHIPPED.
     */
    getShippingStatus(): EnumValue;
    /**
     * Returns the source code stored with the order or `null` if no source code is attached to the order.
     */
    getSourceCode(): string | null;
    /**
     * Returns the source code group attached to the order or `null` if no source code group is attached to
     * the order.
     */
    getSourceCodeGroup(): SourceCodeGroup | null;
    /**
     * Returns the source code group id stored with the order or `null` if no source code group is attached
     * to the order.
     */
    getSourceCodeGroupID(): string | null;
    /**
     * Returns the status of the order.
     * 
     * Possible values are:
     * 
     * - ORDER_STATUS_CREATED
     * - ORDER_STATUS_NEW
     * - ORDER_STATUS_OPEN
     * - ORDER_STATUS_COMPLETED
     * - ORDER_STATUS_CANCELLED
     * - ORDER_STATUS_FAILED
     * - ORDER_STATUS_REPLACED
     * 
     * The order status usually changes when a process action is initiated. Most status changes have an action which
     * needs to executed in order to end having the order in a specific order status. When an order is created with e.g.
     * dw.order.OrderMgr.createOrder the order status will be ORDER_STATUS_CREATED. The usual
     * flow is that payment authorization will be added to the order. Once the order is considered as valid (payed,
     * fraud checked, ...) the order gets placed. This can be done by calling
     * dw.order.OrderMgr.placeOrder. The result of placing an order will be status
     * ORDER_STATUS_OPEN (from a process standpoint ORDER_STATUS_NEW which has the same meaning).
     * Status ORDER_STATUS_REPLACED is related to functionality
     * dw.order.BasketMgr.createBasketFromOrder. ORDER_STATUS_COMPLETED has no meaning by
     * default but can be used by custom implementations but is a synonym for NEW/OPEN. Below you will find the most important status changes:
     * 
     * Status before  Action  Status after  Business meaning
     * -  dw.order.OrderMgr.createOrder  CREATED  Order was created from a basket.
     * CREATED  dw.order.OrderMgr.placeOrder  OPEN/NEW  Order was considered as valid. Order can now be exported to 3rd party systems.
     * CREATED  dw.order.OrderMgr.failOrder  FAILED  Order was considered not valid. E.g. payment authorization was wrong or fraud check was not successful.
     * OPEN/NEW  dw.order.OrderMgr.cancelOrder  CANCELLED  Order was cancelled.
     * CANCELLED  dw.order.OrderMgr.undoCancelOrder  OPEN/NEW  Order was cancelled by mistake and this needs to be undone.
     * FAILED  dw.order.OrderMgr.undoFailOrder  CREATED  Order was failed by mistake and this needs to be undone.
     * 
     * Every status change will trigger a change in the order journal which is the base for GMV calculations.
     * @see dw.order.LineItemCtnr
     */
    getStatus(): EnumValue;
    /**
     * Returns <CODE>true</CODE>, if the order is imported and <CODE>false</CODE>
     * otherwise.
     */
    isImported(): boolean;
    /**
     * Use this method to check if the Order was created with grouped taxation calculation.
     * 
     * If the tax is rounded on group level, the tax is applied to the summed-up tax basis for each tax rate.
     */
    isTaxRoundedAtGroup(): boolean;
    /**
     * Ensures that the order is authorized.
     * 
     * Checks if the order is authorized by calling the hook
     * dw.order.hooks.PaymentHooks.validateAuthorization. If the authorization
     * is not valid it reauthorizes the order by calling the
     * dw.order.hooks.PaymentHooks.reauthorize.
     */
    reauthorize(): Status;
    /**
     * Removes the IP address of the remote host if stored.
     * 
     * If IP logging was enabled during order creation the IP address of the customer will be stored and can be
     * retrieved using getRemoteHost.
     * @see getRemoteHost
     */
    removeRemoteHost(): void;
    /**
     * Sets the affiliate partner ID value.
     */
    setAffiliatePartnerID(affiliatePartnerID: string): void;
    /**
     * Sets the affiliate partner name value.
     */
    setAffiliatePartnerName(affiliatePartnerName: string): void;
    /**
     * Sets the cancel code value.
     */
    setCancelCode(cancelCode: string): void;
    /**
     * Sets the description as to why the order was cancelled.
     */
    setCancelDescription(cancelDescription: string): void;
    /**
     * Sets the confirmation status value.
     * 
     * Possible values are CONFIRMATION_STATUS_NOTCONFIRMED or
     * CONFIRMATION_STATUS_CONFIRMED.
     */
    setConfirmationStatus(status: number): void;
    /**
     * This method is used to associate the order object with the specified customer object.
     * 
     * If the customer object represents a registered customer, the order will be assigned
     * to this registered customer and the order's customer number
     * (dw.order.LineItemCtnr.getCustomerNo) will be updated.
     * 
     * If the customer object represents an unregistered (anonymous) customer, the
     * order will become an anonymous order and the order's customer number
     * will be set to null.
     * @throws NullArgumentException If specified customer is null.
     */
    setCustomer(customer: Customer): void;
    /**
     * Sets the customer number associated with this order.
     * 
     * Note it is recommended to use (dw.order.Order.setCustomer) instead of this method. This method
     * only sets the customer number and should be used with care as it does not re-link the order with a customer
     * profile</> object which can lead to an inconsistency! Ensure that the customer number used is not already taken
     * by a different customer profile.
     */
    setCustomerNo(customerNo: string): void;
    /**
     * Sets the customer-specific reference information for the order.
     */
    setCustomerOrderReference(reference: string): void;
    /**
     * Sets the date after which an order can be exported.
     */
    setExportAfter(date: Date): void;
    /**
     * Sets the export status of the order.
     * 
     * Possible values are: EXPORT_STATUS_NOTEXPORTED, EXPORT_STATUS_EXPORTED,
     * EXPORT_STATUS_READY, and EXPORT_STATUS_FAILED.
     * 
     * Setting the status to EXPORT_STATUS_EXPORTED will also trigger the finalization of on order inventory
     * transactions for this order meaning that all inventory transactions with type on order will be moved into final
     * inventory transactions. This is only relevant when On Order Inventory is turned on for the inventory list ordered
     * products are in.
     * 
     * In case of an exception the current transaction is marked as rollback only.
     */
    setExportStatus(status: number): void;
    /**
     * Sets the value of an external order number associated
     * with this order
     */
    setExternalOrderNo(externalOrderNo: string): void;
    /**
     * Sets the status of an external order associated
     * with this order
     */
    setExternalOrderStatus(status: string): void;
    /**
     * Sets the text describing the external order.
     */
    setExternalOrderText(text: string): void;
    /**
     * Sets the invoice number for this Order.
     * 
     * Notice that this value might be overwritten during order placement (e.g. with dw.order.OrderMgr.placeOrder).
     * @see getInvoiceNo
     */
    setInvoiceNo(invoiceNumber: string): void;
    /**
     * Sets the order status.
     * 
     * Use this method when using Order Post Processing such as the creation of dw.order.ShippingOrder shipping
     * orders. The only supported values are ORDER_STATUS_OPEN, ORDER_STATUS_CANCELLED. Setting the
     * status will adjust the order item status when applicable (item status not SHIPPED or CANCELLED). Note that the
     * order status and the status of the items are directly related and dependent on one another.
     * 
     * See dw.order.OrderItem.setStatus for more information about possible status transitions.
     * 
     * Warning: This method will not undo coupon redemptions upon cancellation of an order. Re-opening such an
     * order later with dw.order.OrderMgr.undoCancelOrder or dw.order.OrderItem.setStatus
     * with ORDER_STATUS_OPEN will result in an additional application of the same coupon code which in turn
     * might fail.
     * 
     * Order post-processing APIs (gillian) are now inactive by default and will throw
     * an exception if accessed. Activation needs preliminary approval by Product Management.
     * Please contact support in this case. Existing customers using these APIs are not
     * affected by this change and can use the APIs until further notice.
     * @throws IllegalArgumentException on attempt to set an unsupported status value
     * @deprecated use setStatus instead
     */
    setOrderStatus(status: number): void;
    /**
     * Sets the order payment status.
     * 
     * Possible values are PAYMENT_STATUS_NOTPAID, PAYMENT_STATUS_PARTPAID
     * or PAYMENT_STATUS_PAID.
     */
    setPaymentStatus(status: number): void;
    /**
     * Sets the value of the replace code.
     */
    setReplaceCode(replaceCode: string): void;
    /**
     * Sets the value of the replace description.
     */
    setReplaceDescription(replaceDescription: string): void;
    /**
     * Sets the order shipping status value.
     * 
     * Possible values are SHIPPING_STATUS_NOTSHIPPED,
     * SHIPPING_STATUS_PARTSHIPPED or SHIPPING_STATUS_SHIPPED.
     */
    setShippingStatus(status: number): void;
    /**
     * Sets the status of the order.
     * 
     * Possible values are:
     * 
     * - ORDER_STATUS_NEW
     * - ORDER_STATUS_OPEN
     * - ORDER_STATUS_COMPLETED
     * - ORDER_STATUS_CANCELLED
     * - ORDER_STATUS_REPLACED
     * 
     * This method does not support order statuses ORDER_STATUS_CREATED or ORDER_STATUS_FAILED. Please
     * use dw.order.OrderMgr.placeOrder or dw.order.OrderMgr.failOrder.
     * 
     * Setting the order status to ORDER_STATUS_CANCELLED will have the same effect as calling
     * dw.order.OrderMgr.cancelOrder. Setting a canceled order to ORDER_STATUS_NEW,
     * ORDER_STATUS_OPEN or ORDER_STATUS_COMPLETED will have the same effect as calling
     * dw.order.OrderMgr.undoCancelOrder. It is recommended to use the methods in
     * dw.order.OrderMgr directly to be able to do error processing with the return code.
     * @throws IllegalArgumentException on attempt to set status CREATED or FAILED, or status transition while cancel order or undo cancel order returns with an error code.
     */
    setStatus(status: number): void;
    /**
     * Tracks an order change.
     * 
     * This adds a history entry to the order. Focus of history entries are changes through business logic, both custom
     * and internal logic. Tracked order changes are read-only and can be accessed in the Business Manager order
     * history. The following attributes of the created dw.object.Note history entry are initialized:
     * 
     * - dw.object.Note.getCreatedBy gets the current user assigned
     * - dw.object.Note.getCreationDate gets the current date assigned
     * 
     * This feature is intended to track important changes in custom order flow which should become visible in Business
     * Manager's history tab. It is NOT intended as auditing feature for every change to an order. A warning will be
     * produced after 600 notes are added to an order. The warning can be reviewed in Business Manager's Quota Status
     * screen. Attempting to add a note to an order which already has 1000 notes results in an exception. Please bear in
     * mind that internal changes, such as order status changes, also track changes. Avoid using this feature in
     * recurring jobs which may re-process orders multiple times as the limit needs to be considered each time a change
     * is tracked. The same limit on the number of notes added also applies when using method
     * dw.order.LineItemCtnr.addNote to add notes.
     */
    trackOrderChange(text: string): Note;
}

export = Order;
