import RESTErrorResponse = require('./RESTErrorResponse');
import RESTSuccessResponse = require('./RESTSuccessResponse');
import RemoteInclude = require('./RemoteInclude');
import URLParameter = require('../web/URLParameter');
import URLAction = require('../web/URLAction');

/**
 * This class provides helper methods for creating REST error and success responses. It is mainly intended to be used to
 * build Custom REST APIs. But, any controller implementation planning to provide REST-like responses can use these
 * methods. If these methods are being used in the controllers, note that a few defaults like URL prefix for
 * `type` in `createError` methods will correspond to Custom REST APIs.
 */
declare class RESTResponseMgr {
    private constructor();
    /**
     * Constructs a new RESTSuccessResponse object. This method is to be used in scenarios where response body
     * is not expected (e.g. statusCode is 204).
     * @throws IllegalArgumentException If the statusCode is not in the (100..299) range.
     */
    static createEmptySuccess(statusCode: number): RESTSuccessResponse;
    /**
     * Constructs a new RESTErrorResponse object. This method should be used when you have just the statusCode
     * of the error and want the type of error to be inferred.
     * 
     * 'type' of the error is inferred from the status code as follows:
     * 
     * - `400` - `bad-request`
     * - `401` - `unauthorized`
     * - `403` - `forbidden`
     * - `404` - `resource-not-found`
     * - `409` - `conflict`
     * - `412` - `precondition-failed`
     * - `429` - `too-many-requests`
     * - `500` - `internal-server-error`
     * - `default` - `about:blank`
     * @throws IllegalArgumentException If the statusCode is not in the (400..599) range.
     */
    static createError(statusCode: number): RESTErrorResponse;
    /**
     * Constructs a new RESTErrorResponse object. This method should be used when you want to omit 'title' and
     * 'detail' of the error. With this method, custom error codes and types apart from the standard ones can be
     * constructed.
     * @throws IllegalArgumentException If the statusCode is not in the (400..599) range or if the error type is not a valid URI or conflicts with the SYSTEM error type namespace.
     */
    static createError(statusCode: number, type: string): RESTErrorResponse;
    /**
     * Constructs a new RESTErrorResponse object. This method should be used when you want to omit 'detail' of
     * the error but want to have valid 'statusCode', 'type' and 'title'.
     * @throws IllegalArgumentException If the statusCode is not in the (400..599) range or if the error type is not a valid URI or conflicts with SYSTEM error type namespace.
     */
    static createError(statusCode: number, type: string, title: string): RESTErrorResponse;
    /**
     * Constructs a new RESTErrorResponse object. This method can be used to construct error responses with
     * valid 'statusCode', 'type', 'title' and 'detail'. If you want to omit title or detail, you can pass in
     * `null`.
     * @throws IllegalArgumentException If the statusCode is not in the (400..599) range or if the error type is not a valid URI or conflicts with SYSTEM error type namespace.
     */
    static createError(statusCode: number, type: string, title: string, detail: string): RESTErrorResponse;
    /**
     * Constructs a new RemoteInclude object specific for the SCAPI include path.
     * Usage:
     * SCAPI remote include URL have following form:
     * 
     * ```
     * BASE_PATH/{apiFamily}/{apiName}/{apiVersion}/organizations/ORG_ID/{resourcePath}[?params]
     * ```
     * 
     * For the given SCAPI resource path:
     * 
     * ```
     * BASE_PATH/product/shopper-products/v1/organizations/ORG_ID/categories/root?siteId=YourShopHere
     * ```
     * 
     * RemoteInclude object can be constructed in a script like following:
     * 
     * ```
     * let include = dw.system.RESTResponseMgr.createScapiRemoteInclude("product", "shopper-products", "v1", "categories/root",
     * dw.web.URLParameter("siteId", "YourShopHere"));
     * ```
     * 
     * Please notice that 'BASE_PATH' and 'ORG_ID' are automatically resolved.
     */
    static createScapiRemoteInclude(apiFamily: string, apiName: string, apiVersion: string, resourcePath: string, ...params: URLParameter[]): RemoteInclude;
    /**
     * Constructs a new RemoteInclude object specific for the Storefront Controller include path.
     */
    static createStorefrontControllerRemoteInclude(action: URLAction, ...params: URLParameter[]): RemoteInclude;
    /**
     * Constructs a new RESTSuccessResponse object.
     * @throws IllegalArgumentException If the statusCode is not in the (100..299) range.
     */
    static createSuccess(body: Object, statusCode: number): RESTSuccessResponse;
    /**
     * Constructs a new RESTSuccessResponse object. HTTP status code of the response will be defaulted to 200.
     */
    static createSuccess(body: Object): RESTSuccessResponse;
}

export = RESTResponseMgr;
