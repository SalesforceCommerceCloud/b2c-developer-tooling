/**
 * This exception could be thrown by
 * dw.customer.shoppercontext.ShopperContextMgr.setShopperContext,
 * dw.customer.shoppercontext.ShopperContextMgr.getShopperContext and
 * ShopperContextMgr.removeShopperContext when an error occurs.
 * 
 * 'errorCode' property is set to one of the following values:
 * 
 * - dw.customer.shoppercontext.ShopperContextErrorCodes.FEATURE_DISABLED = Indicates that the Shopper Context
 * Feature is not enabled.
 * - dw.customer.shoppercontext.ShopperContextErrorCodes.CUSTOM_QUALIFIERS_LIMIT_EXCEEDED = Indicates that the
 * number of custom qualifiers in dw.customer.shoppercontext.ShopperContext has exceeded the allowed limit.
 * - dw.customer.shoppercontext.ShopperContextErrorCodes.ASSIGNMENT_QUALIFIERS_LIMIT_EXCEEDED = Indicates that
 * the number of assignment qualifiers in dw.customer.shoppercontext.ShopperContext has exceeded the allowed
 * limit.
 * - dw.customer.shoppercontext.ShopperContextErrorCodes.QUOTA_LIMIT_EXCEEDED = Indicates that the quota limit
 * for the Shopper Context has been reached.
 * 
 * For more information on shopper context quota limits please refer to:
 * Shopper Context Quota Limits
 * 
 * - dw.customer.shoppercontext.ShopperContextErrorCodes.INTERNAL_ERROR = Indicates that an error occurred
 * while setting, retrieving or deleting the shopper context.
 * - dw.customer.shoppercontext.ShopperContextErrorCodes.INVALID_ARGUMENT = Indicates that an invalid client
 * IP address was set in the Shopper Context.
 * - dw.customer.shoppercontext.ShopperContextErrorCodes.INVALID_REQUEST_TYPE = Indicates that the request
 * type is invalid. Request must be a SCAPI request, or a hybrid storefront request, or an OCAPI request using a SLAS
 * token.
 */
declare class ShopperContextException {
    /**
     * Indicates reason why the following methods failed:
     * dw.customer.shoppercontext.ShopperContextMgr.setShopperContext or
     * dw.customer.shoppercontext.ShopperContextMgr.getShopperContext or
     * dw.customer.shoppercontext.ShopperContextMgr.removeShopperContext failed.
     */
    readonly errorCode: string;
    private constructor();
    /**
     * Indicates reason why the following methods failed:
     * dw.customer.shoppercontext.ShopperContextMgr.setShopperContext or
     * dw.customer.shoppercontext.ShopperContextMgr.getShopperContext or
     * dw.customer.shoppercontext.ShopperContextMgr.removeShopperContext failed.
     */
    getErrorCode(): string;
}

export = ShopperContextException;
