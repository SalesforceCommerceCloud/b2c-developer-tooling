/**
 * Error codes for ShopperConsentException.
 * 
 * These error codes indicate the reason why a shopper consent operation failed.
 */
declare class ShopperConsentErrorCodes {
    /**
     * Indicates that the customer is not authenticated.
     */
    static readonly CUSTOMER_NOT_AUTHENTICATED = "CUSTOMER_NOT_AUTHENTICATED";
    /**
     * Indicates that the Marketing Consent feature is not enabled.
     */
    static readonly FEATURE_DISABLED = "FEATURE_DISABLED";
    /**
     * Indicates that an internal error occurred.
     */
    static readonly INTERNAL_ERROR = "INTERNAL_ERROR";
    /**
     * Indicates that an error occurred while retrieving consent subscriptions.
     */
    static readonly RETRIEVAL_ERROR = "RETRIEVAL_ERROR";
    /**
     * Indicates that an error occurred while updating consent subscriptions.
     */
    static readonly UPDATE_ERROR = "UPDATE_ERROR";
    private constructor();
}

export = ShopperConsentErrorCodes;
