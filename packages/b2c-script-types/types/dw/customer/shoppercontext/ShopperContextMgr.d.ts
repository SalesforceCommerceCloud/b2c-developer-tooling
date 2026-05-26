import ShopperContext = require('./ShopperContext');
import Geolocation = require('../../util/Geolocation');

/**
 * 
 * 
 * Provides static helper methods for managing Shopper Context.
 * 
 * Shopper Context is used to personalize shopper experiences with context values such as custom session attributes,
 * assignment qualifiers, geolocation, effective datetime, source code and more. When Shopper Context is set for a
 * shopper, it can activate promotions or price books assigned to customer groups, source codes, or stores (via
 * assignments) in the subsequent requests, not the current request.
 * 
 * Shopper Context is used to personalize the shopper experience in case of Composable/Headless or Hybrid storefront
 * implementations that use Shopper Login and API Access Service (SLAS).
 * 
 * NOTE: This script API is not intended to be used for standard server-side storefront implementations. Only for
 * Composable/Headless or Hybrid storefront implementations.
 * 
 * Unlike dw.customer.CustomerContextMgr which is used to set just Effective Time for which the customer is
 * shopping at, Shopper Context API provides a way to set many types of contexts such as custom session attributes,
 * assignment qualifiers, geolocation, effective datetime, source code etc.
 * 
 * The following feature toggles and site preferences must be enabled in order to use this script API:
 * 
 * - Enable Shopper Context Feature
 * - Hybrid Auth Settings' site preference - only in case of Hybrid storefront implementations
 * 
 * For more details on Shopper Context please refer to: Shopper Context
 * API Overview
 * 
 * For more details on Hybrid Authentication for Hybrid storefronts please refer to:
 * Hybrid
 * Authentication
 * 
 * dw.customer.shoppercontext.ShopperContextMgr is used to create, access and delete Shopper Context.
 * 
 * - To add Shopper Context, use methods setShopperContext.
 * - To access Shopper Context, use method getShopperContext.
 * - To delete Shopper Context, use methods removeShopperContext.
 * - To fetch Geolocation based on clientIP already set in Shopper Context, use method getGeolocation
 * 
 * Typical usage:
 * 
 * ```
 * `
 * // get the ShopperContext if it exists
 * ShopperContext context = ShopperContextMgr.getShopperContext();
 * if (context == null) {
 * context = new ShopperContext();
 * }
 * // set the values in the ShopperContext object
 * context.setSourceCode( "sourcecode" );
 * var customQualifiers = new dw.util.HashMap();
 * customQualifiers.put( "deviceType", "iPad" );
 * context.setCustomQualifiers( customQualifiers );
 * // Save the ShopperContext
 * ShopperContextMgr.setShopperContext( context, true );
 * `
 * ```
 * 
 * NOTE: Ensure the ShopperContext object is saved using setShopperContext after
 * setting or updating the context values.
 */
declare class ShopperContextMgr {
    /**
     * Gets the dw.util.Geolocation object for the clientIP set in
     * dw.customer.shoppercontext.ShopperContext or null if no shopperContext is found, or no clientIP was set
     * or Geolocation for the clientIP was not found.
     * 
     * The method throws an exception if the call fails.
     * @throws dw.customer.shoppercontext.ShopperContextException This exception is thrown if error occurs while trying to retrieve Geolocation string from the Shopper Context.
     */
    static readonly geolocation: Geolocation | null;
    /**
     * Returns the dw.customer.shoppercontext.ShopperContext if it exists for the customer. Returns null if it
     * does not exist.
     * @throws dw.customer.shoppercontext.ShopperContextException This exception is thrown if an error occurs while fetching the Shopper Context.
     */
    static readonly shopperContext: ShopperContext | null;
    private constructor();
    /**
     * Gets the dw.util.Geolocation object for the clientIP set in
     * dw.customer.shoppercontext.ShopperContext or null if no shopperContext is found, or no clientIP was set
     * or Geolocation for the clientIP was not found.
     * 
     * The method throws an exception if the call fails.
     * @throws dw.customer.shoppercontext.ShopperContextException This exception is thrown if error occurs while trying to retrieve Geolocation string from the Shopper Context.
     */
    static getGeolocation(): Geolocation | null;
    /**
     * Returns the dw.customer.shoppercontext.ShopperContext if it exists for the customer. Returns null if it
     * does not exist.
     * @throws dw.customer.shoppercontext.ShopperContextException This exception is thrown if an error occurs while fetching the Shopper Context.
     */
    static getShopperContext(): ShopperContext | null;
    /**
     * Removes the dw.customer.shoppercontext.ShopperContext for the customer.
     * 
     * The method throws an exception if the deletion of Shopper Context fails.
     * @throws dw.customer.shoppercontext.ShopperContextException This exception is thrown if error occurs while deleting the Shopper Context.
     */
    static removeShopperContext(): void;
    /**
     * 
     * 
     * Sets new dw.customer.shoppercontext.ShopperContext for the customer or overwrites the existing context.
     * 
     * Note: This method does not save the attributes from the given Shopper Context such as - custom session
     * attributes, source code, effective date time etc., - in the current session object. These attributes are read
     * from Shopper Context and stored in the corresponding session attributes during subsequent requests and not in the
     * current request. Hence, promotions, price books etc., are triggered in subsequent requests.
     * 
     * If `clientIP` is set in dw.customer.shoppercontext.ShopperContext, the geolocation information
     * is retrieved and set in `x-geolocation` header.
     * 
     * And if the parameter `evaluateContextWithClientIP` is set to true, the `clientIP` will be
     * saved to the Shopper Context.
     * 
     * If parameter `evaluateContextWithClientIP` is set to false, the `clientIP` will not be
     * saved to the Shopper Context.
     * 
     * If the `geoLocation` attribute is set, it overrides any geolocation context set by
     * `clientIP`.
     * @throws dw.customer.shoppercontext.ShopperContextException This exception is thrown if the Shopper Context is not saved or if validation fails.
     */
    static setShopperContext(shopperContext: ShopperContext, evaluateContextWithClientIP: boolean): void;
}

export = ShopperContextMgr;
