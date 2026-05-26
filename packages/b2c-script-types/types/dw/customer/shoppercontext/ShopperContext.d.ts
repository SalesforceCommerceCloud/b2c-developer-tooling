import utilMap = require('../../util/Map');
import utilSet = require('../../util/Set');
import Geolocation = require('../../util/Geolocation');

/**
 * The class represents Shopper Context. It is used to manage personalized shopping experiences on your storefront.
 * 
 * Shopper Context is used to personalize shopper experiences with context values such as custom session attributes,
 * assignment qualifiers, geolocation, clientIP address, effective date time, source code, coupon code and customer
 * groups.
 * 
 * When Shopper Context is set for a shopper, the context is applied in the next request and can activate promotions or
 * price books assigned to customer groups, source codes, or stores (via assignments).
 * Also see: dw.customer.shoppercontext.ShopperContextMgr
 */
declare class ShopperContext {
    /**
     * Returns the assignment qualifiers from the Shopper Context. Assignment qualifiers are set when using the
     * assignment framework to trigger pricing and promotion experiences for Products, Product Search, Basket, Shipping
     * methods etc.
     */
    assignmentQualifiers: utilMap<any, any>;
    /**
     * Returns the IP address of the client from the Shopper Context.
     */
    clientIP: string;
    /**
     * Returns the Coupon codes from the Shopper Context.
     */
    couponCodes: utilSet<any>;
    /**
     * Returns the custom qualifiers from the Shopper Context. Custom qualifiers contain the custom session attributes
     * set in the Shopper Context.
     */
    customQualifiers: utilMap<any, any>;
    /**
     * Returns customer group IDs from the Shopper Context to apply. The customer group IDs set in Shopper Context
     * evaluate to customer groups that trigger the promotions (campaign assignment) assigned to the customer groups.
     */
    customerGroupIDs: utilSet<any>;
    /**
     * Returns the effective date time from the Shopper Context. With the effective date time you can retrieve
     * promotions that are active at a particular time. For example, "Shop the Future" use cases.
     */
    effectiveDateTime: Date;
    /**
     * Returns the geographic location from the Shopper Context.
     */
    geolocation: Geolocation;
    /**
     * Returns the source code from the Shopper Context. The source code set in Shopper Context evaluates to source code
     * group that triggers the promotion (campaign assignment) and Price books (assigned to Source code group).
     */
    sourceCode: string;
    /**
     * Constructor for ShopperContext.
     * 
     * This constructor is used to create an empty object. The object will be empty and must be populated with the
     * appropriate setter methods. For example:
     * @example
     * `
     * ShopperContext context = new ShopperContext();
     * context.setSourceCode( "sourcecode" );
     * ShopperContextMgr.setShopperContext( context, true );
     * `
     */
    constructor();
    /**
     * Returns the assignment qualifiers from the Shopper Context. Assignment qualifiers are set when using the
     * assignment framework to trigger pricing and promotion experiences for Products, Product Search, Basket, Shipping
     * methods etc.
     */
    getAssignmentQualifiers(): utilMap<any, any>;
    /**
     * Returns the IP address of the client from the Shopper Context.
     */
    getClientIP(): string;
    /**
     * Returns the Coupon codes from the Shopper Context.
     */
    getCouponCodes(): utilSet<any>;
    /**
     * Returns the custom qualifiers from the Shopper Context. Custom qualifiers contain the custom session attributes
     * set in the Shopper Context.
     */
    getCustomQualifiers(): utilMap<any, any>;
    /**
     * Returns customer group IDs from the Shopper Context to apply. The customer group IDs set in Shopper Context
     * evaluate to customer groups that trigger the promotions (campaign assignment) assigned to the customer groups.
     */
    getCustomerGroupIDs(): utilSet<any>;
    /**
     * Returns the effective date time from the Shopper Context. With the effective date time you can retrieve
     * promotions that are active at a particular time. For example, "Shop the Future" use cases.
     */
    getEffectiveDateTime(): Date;
    /**
     * Returns the geographic location from the Shopper Context.
     */
    getGeolocation(): Geolocation;
    /**
     * Returns the source code from the Shopper Context. The source code set in Shopper Context evaluates to source code
     * group that triggers the promotion (campaign assignment) and Price books (assigned to Source code group).
     */
    getSourceCode(): string;
    /**
     * Sets the assignment qualifiers in the Shopper Context. Assignment qualifiers are set when using the assignment
     * framework to trigger pricing and promotion experiences for Products, Product Search, Basket, Shipping methods
     * etc.
     * 
     * Example: Assignment qualifier for store can be set as follows:
     * @example
     * `
     * var assignmentQualifiers = new dw.util.HashMap();
     * assignmentQualifiers.put( "storeId", "Boston" );
     * ShopperContext context = new ShopperContext();
     * context.setAssignmentQualifiers( customQualifiers );
     * ShopperContextMgr.setShopperContext( context, true );
     * `
     */
    setAssignmentQualifiers(assignmentQualifiers: utilMap<any, any>): void;
    /**
     * Sets the IP address of the client in the Shopper Context. The client IP evaluates to a geolocation. If the client
     * IP address is not a valid IPv4/IPv6 address an error is thrown.
     */
    setClientIP(clientIP: string): void;
    /**
     * Sets the Coupon codes in the Shopper Context. When you set coupon codes, it is saved as context for subsequent
     * requests and can then trigger promotions via the campaign which are tied to the coupon. A maximum of 5 coupon
     * codes can be set in the ShopperContext.
     */
    setCouponCodes(couponCodes: utilSet<any>): void;
    /**
     * Sets the session custom attributes as custom qualifiers in the Shopper Context. Custom qualifiers are set when
     * you want to trigger pricing and promotion experiences using a dynamic session-based customer groups.
     * 
     * Example: A session custom attribute 'device_type' can be saved as follows:
     * @example
     * `
     * var customQualifiers = new dw.util.HashMap();
     * customQualifiers.put( "deviceType", "iPad" );
     * ShopperContext context = new ShopperContext();
     * context.setCustomQualifiers( customQualifiers );
     * ShopperContextMgr.setShopperContext( context, true );
     * `
     */
    setCustomQualifiers(customQualifiers: utilMap<any, any>): void;
    /**
     * Sets the customer group IDs for the Shopper Context to apply. Set the customer group IDs to evaluate customer
     * groups that trigger the promotions (campaign assignment) assigned to the customer groups.
     */
    setCustomerGroupIDs(customerGroupIDs: utilSet<any>): void;
    /**
     * Sets the effective date time for the context to apply. With the effective date time you can retrieve promotions
     * that are active at a particular time. For example, "Shop the Future" use cases.
     */
    setEffectiveDateTime(effectiveDateTime: Date): void;
    /**
     * Sets the geographic location of the client in the Shopper Context. When you set a geolocation, it is saved as
     * context for subsequent requests. This overrides any context previously saved using clientIP in the Shopper
     * Context.
     */
    setGeolocation(geolocation: Geolocation): void;
    /**
     * Sets the source code for the Shopper Context to apply. Set the source code to evaluate source code group that
     * triggers the promotion (campaign assignment) and Price books (assigned to Source code group).
     */
    setSourceCode(sourceCode: string): void;
}

export = ShopperContext;
