/**
 * This exception is thrown by ShopperConsentMgr methods when an error occurs during consent subscription
 * operations.
 * 
 * The 'errorCode' property is set to one of the following values:
 * 
 * - ShopperConsentErrorCodes.FEATURE_DISABLED - Indicates that the Marketing Consent feature is not
 * enabled.
 * - ShopperConsentErrorCodes.RETRIEVAL_ERROR - Indicates that an error occurred while retrieving consent
 * subscriptions.
 * - ShopperConsentErrorCodes.UPDATE_ERROR - Indicates that an error occurred while updating consent
 * subscriptions.
 * - ShopperConsentErrorCodes.CUSTOMER_NOT_AUTHENTICATED - Indicates that the customer is not authenticated
 * (required for consent status retrieval).
 * - ShopperConsentErrorCodes.INTERNAL_ERROR - Indicates that an internal error occurred.
 * - ShopperConsentErrorCodes.INVALID_CHANNEL - Indicates that an unrecognized channel value was
 * provided.
 * - ShopperConsentErrorCodes.INVALID_CONSENT_STATUS - Indicates that an unrecognized consent status value
 * was provided.
 * - ShopperConsentErrorCodes.CONTACT_POINT_VALUE_TOO_LONG - Indicates that the provided contact point value
 * exceeds the maximum allowed length.
 * - ShopperConsentErrorCodes.SUBSCRIPTION_ID_TOO_LONG - Indicates that the provided subscription ID exceeds
 * the maximum allowed length.
 */
declare class ShopperConsentException {
    /**
     * Returns the error code indicating the reason for the failure.
     */
    readonly errorCode: string;
    private constructor();
    /**
     * Returns the error code indicating the reason for the failure.
     */
    getErrorCode(): string;
}

export = ShopperConsentException;
