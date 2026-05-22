/**
 * Helper class containing status codes for the various errors that can occur
 * when redeeming a gift certificate. One of these codes is returned as part of
 * a Status object when a unsuccessful call to the
 * `RedeemGiftCertificate` pipelet is made.
 */
declare class GiftCertificateStatusCodes {
    /**
     * Indicates that an error occurred because the Gift Certificate
     * was in a different currency than the Basket.
     */
    static readonly GIFTCERTIFICATE_CURRENCY_MISMATCH = "GIFTCERTIFICATE_CURRENCY_MISMATCH";
    /**
     * Indicates that an error occurred because the Gift Certificate
     * is currently disabled.
     */
    static readonly GIFTCERTIFICATE_DISABLED = "GIFTCERTIFICATE_DISABLED";
    /**
     * Indicates that an error occurred because the Gift Certificate
     * does not have a sufficient balance to perform the requested
     * operation.
     */
    static readonly GIFTCERTIFICATE_INSUFFICIENT_BALANCE = "GIFTCERTIFICATE_INSUFFICIENT_BALANCE";
    /**
     * Indicates that an error occurred because the Gift Certificate
     * was not found.
     */
    static readonly GIFTCERTIFICATE_NOT_FOUND = "GIFTCERTIFICATE_NOT_FOUND";
    /**
     * Indicates that an error occurred because the Gift Certificate
     * is pending and is not available for use.
     */
    static readonly GIFTCERTIFICATE_PENDING = "GIFTCERTIFICATE_PENDING";
    /**
     * Indicates that an error occurred because the Gift Certificate
     * has been fully redeemed.
     */
    static readonly GIFTCERTIFICATE_REDEEMED = "GIFTCERTIFICATE_REDEEMED";
    private constructor();
}

export = GiftCertificateStatusCodes;
