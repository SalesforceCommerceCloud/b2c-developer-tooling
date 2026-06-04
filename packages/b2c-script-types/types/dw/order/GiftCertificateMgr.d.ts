import GiftCertificate = require('./GiftCertificate');
import Status = require('../system/Status');
import OrderPaymentInstrument = require('./OrderPaymentInstrument');

/**
 * The GiftCertificateMgr class contains a set of static methods for
 * interacting with GiftCertificates.
 */
declare class GiftCertificateMgr {
    /**
     * Indicates that an error occurred because the Gift Certificate
     * is currently disabled.
     * @deprecated Use dw.order.GiftCertificateStatusCodes instead.
     */
    static readonly GC_ERROR_DISABLED = "GIFTCERTIFICATE-100";
    /**
     * Indicates that an error occurred because the Gift Certificate
     * does not have a sufficient balance to perform the requested
     * operation.
     * @deprecated Use dw.order.GiftCertificateStatusCodes instead.
     */
    static readonly GC_ERROR_INSUFFICIENT_BALANCE = "GIFTCERTIFICATE-110";
    /**
     * Indicates that an error occurred because the Gift Certificate
     * Amount was not valid.
     * @deprecated Use dw.order.GiftCertificateStatusCodes instead.
     */
    static readonly GC_ERROR_INVALID_AMOUNT = "GIFTCERTIFICATE-140";
    /**
     * Indicates that an error occurred because the Gift Certificate
     * ID was not valid.
     * @deprecated Use dw.order.GiftCertificateStatusCodes instead.
     */
    static readonly GC_ERROR_INVALID_CODE = "GIFTCERTIFICATE-150";
    /**
     * Indicates that an error occurred because the Gift Certificate
     * has been fully redeemed.
     * @deprecated Use dw.order.GiftCertificateStatusCodes instead.
     */
    static readonly GC_ERROR_PENDING = "GIFTCERTIFICATE-130";
    /**
     * Indicates that an error occurred because the Gift Certificate
     * has been fully redeemed.
     * @deprecated Use   dw.order.GiftCertificateStatusCodes instead.
     */
    static readonly GC_ERROR_REDEEMED = "GIFTCERTIFICATE-120";
    private constructor();
    /**
     * Creates a Gift Certificate. If a non-empty Gift Certificate code is specified, the code will be used to create
     * the Gift Certificate. Be aware that this code must be unique for the current site. If it is not unique, the Gift
     * Certificate will not be created.
     */
    static createGiftCertificate(amount: number, code: string | null): GiftCertificate;
    /**
     * Creates a Gift Certificate. The system will assign a code to the new Gift Certificate.
     */
    static createGiftCertificate(amount: number): GiftCertificate;
    /**
     * Returns the Gift Certificate identified by the specified
     * gift certificate code.
     * @deprecated Use getGiftCertificateByCode
     */
    static getGiftCertificate(giftCertificateCode: string): GiftCertificate | null;
    /**
     * Returns the Gift Certificate identified by the specified
     * gift certificate code.
     */
    static getGiftCertificateByCode(giftCertificateCode: string): GiftCertificate | null;
    /**
     * Returns the Gift Certificate identified by the specified merchant ID.
     */
    static getGiftCertificateByMerchantID(merchantID: string): GiftCertificate | null;
    /**
     * Redeems an amount from a Gift Certificate. The Gift Certificate ID
     * is specified in the OrderPaymentInstrument and the amount
     * specified in the PaymentTransaction associated with the
     * OrderPaymentInstrument. If the PaymentTransaction.getTransactionID()
     * is not null, the value returned by this method is used as the
     * 'Order Number' for the redemption transaction. The 'Order Number' is
     * visible via the Business Manager.
     */
    static redeemGiftCertificate(paymentInstrument: OrderPaymentInstrument): Status;
}

export = GiftCertificateMgr;
