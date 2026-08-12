/**
 * Error codes for ShopperConsentException.
 * 
 * These error codes indicate the reason why a shopper consent operation failed.
 */
declare class ShopperConsentErrorCodes {
    /**
     * Indicates that the provided contact point value exceeds the maximum allowed length.
     */
    static readonly CONTACT_POINT_VALUE_TOO_LONG = "CONTACT_POINT_VALUE_TOO_LONG";
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
     * Indicates that an unrecognized channel value was provided.
     */
    static readonly INVALID_CHANNEL = "INVALID_CHANNEL";
    /**
     * Indicates that an unrecognized consent status value was provided.
     */
    static readonly INVALID_CONSENT_STATUS = "INVALID_CONSENT_STATUS";
    /**
     * Indicates that the provided contact point value is null, empty, or blank.
     */
    static readonly INVALID_CONTACT_POINT_VALUE = "INVALID_CONTACT_POINT_VALUE";
    /**
     * Indicates that an error occurred while retrieving consent subscriptions.
     */
    static readonly RETRIEVAL_ERROR = "RETRIEVAL_ERROR";
    /**
     * Indicates that the provided subscription ID exceeds the maximum allowed length.
     */
    static readonly SUBSCRIPTION_ID_TOO_LONG = "SUBSCRIPTION_ID_TOO_LONG";
    /**
     * Indicates that an error occurred while updating consent subscriptions.
     */
    static readonly UPDATE_ERROR = "UPDATE_ERROR";
    private constructor();
}

export = ShopperConsentErrorCodes;
