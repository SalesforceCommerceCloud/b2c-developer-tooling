/**
 * Helper class containing error codes to indicate why a Shopper Context cannot be accessed, set or modified.
 */
declare class ShopperContextErrorCodes {
    /**
     * Indicates that the assignment qualifiers limit exceeded
     */
    static readonly ASSIGNMENT_QUALIFIERS_LIMIT_EXCEEDED = "ASSIGNMENT_QUALIFIERS_LIMIT_EXCEEDED";
    /**
     * Indicates that the coupon codes limit exceeded
     */
    static readonly COUPON_CODES_LIMIT_EXCEEDED = "COUPON_CODES_LIMIT_EXCEEDED";
    /**
     * Indicates that the custom qualifiers limit exceeded
     */
    static readonly CUSTOM_QUALIFIERS_LIMIT_EXCEEDED = "CUSTOM_QUALIFIERS_LIMIT_EXCEEDED";
    /**
     * Indicates that the feature toggle 'ShopperContextEnabled' is not enabled.
     */
    static readonly FEATURE_DISABLED = "FEATURE_DISABLED";
    /**
     * Indicates that an internal error occurred while setting, retrieving or deleting the shopper context
     */
    static readonly INTERNAL_ERROR = "INTERNAL_ERROR";
    /**
     * Indicates an invalid argument was provided
     */
    static readonly INVALID_ARGUMENT = "INVALID_ARGUMENT";
    /**
     * Indicates that the request type is invalid. Request must be a SCAPI request, or a hybrid storefront request, or
     * an ocapi request using a SLAS token.
     */
    static readonly INVALID_REQUEST_TYPE = "INVALID_REQUEST_TYPE";
    /**
     * Indicates that the quota limit for the shopper context has been reached.
     */
    static readonly QUOTA_LIMIT_EXCEEDED = "QUOTA_LIMIT_EXCEEDED";
    private constructor();
}

export = ShopperContextErrorCodes;
