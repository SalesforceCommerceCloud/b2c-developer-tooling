/**
 * This exception is thrown by ShopperConsentMgr methods when an error occurs
 * during consent subscription operations.
 * 
 * The 'errorCode' property is set to one of the following values:
 * 
 * - ShopperConsentErrorCodes.FEATURE_DISABLED - Indicates that the Marketing Consent
 * feature is not enabled.
 * - ShopperConsentErrorCodes.RETRIEVAL_ERROR - Indicates that an error occurred while
 * retrieving consent subscriptions.
 * - ShopperConsentErrorCodes.UPDATE_ERROR - Indicates that an error occurred while
 * updating consent subscriptions.
 * - ShopperConsentErrorCodes.CUSTOMER_NOT_AUTHENTICATED - Indicates that the customer
 * is not authenticated (required for consent status retrieval).
 * - ShopperConsentErrorCodes.INTERNAL_ERROR - Indicates that an internal error occurred.
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
