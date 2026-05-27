/**
 * The class represents a remote include value that can be assigned to JSON Object properties.
 * 
 * Important notes:
 * 
 * - Authentication and authorization checks are performed only for the top
 * level request, but NOT for remote include requests.
 * - The `RestResponseMgr` method `createScapiRemoteInclude()` allows only SCAPI URLs.
 * - The `RestResponseMgr` method `createStorefrontControllerRemoteInclude()` allows only Controller URLs.
 * - Correct rendering of RemoteInclude-containing objects is only performed
 * when processed by `dw.system.RESTSuccessResponse.render()` method. Please check the provided examples.
 * 
 * Example 1. Specify remote include properties.
 * 
 * ```
 * function specifyRemoteIncludeProperties() {
 * var includeValue0 = dw.system.RESTResponseMgr.createScapiRemoteInclude("custom", "sample", "v1", "resource/path/0", dw.web.URLParameter("siteId", "TestWapi"));
 * var includeValue1 = dw.system.RESTResponseMgr.createScapiRemoteInclude("custom", "sample", "v1", "resource/path/1", dw.web.URLParameter("siteId", "TestWapi"));
 * var greeting = { "hello": "world", "includeProperty0": includeValue0, "includeProperty1": includeValue1 };
 * 
 * dw.system.RESTResponseMgr.createSuccess(greeting).render();
 * }
 * ```
 * 
 * Example 2. Specify array of remote include properties.
 * 
 * ```
 * function specifyArrayOfRemoteIncludes() {
 * var includeValue0 = dw.system.RESTResponseMgr.createScapiRemoteInclude("custom", "sample", "v1", "resource/path/0", dw.web.URLParameter("siteId", "TestWapi"));
 * var includeValue1 = dw.system.RESTResponseMgr.createScapiRemoteInclude("custom", "sample", "v1", "resource/path/1", dw.web.URLParameter("siteId", "TestWapi"));
 * var greeting = { "hello": "world", "includeArray": [includeValue0, includeValue1] };
 * 
 * dw.system.RESTResponseMgr.createSuccess(greeting).render();
 * }
 * ```
 * 
 * Example 3. Storefront controller remote include.
 * 
 * ```
 * function storefrontRemoteInclude()
 * {
 * let remoteInclude = dw.system.RESTResponseMgr.createStorefrontControllerRemoteInclude(new URLAction("Category-Show", "Sites-MyShop-Site", dw.web.URLParameter("cid", "root")));
 * let json = {
 * status: "JSONOK",
 * include: remoteInclude
 * };
 * dw.system.RESTResponseMgr.createSuccess(json).render();
 * }
 * ```
 * 
 * Error handling:
 * 
 * SCAPI:
 * 
 * - In case of 404 response received on included resource, an empty JSON object '{}' will be supplied in final JSON.
 * - In case of 201..299, 3xx, 4xx (excluding 404), 5xx response from included resource, final response status will be 500 'Internal Server Error'
 * 
 * Controllers:
 * 
 * - In case of any non 200 response from the included resource an empty string will be included.
 * - Note: In case your response format is JSON be aware that this can result in invalid JSON.
 */
declare class RemoteInclude {
    /**
     * Returns the URL string value specified for the current instance.
     */
    readonly url: string;
    private constructor();
    /**
     * Returns the URL string value specified for the current instance.
     */
    getUrl(): string;
    /**
     * Returns the URL string value specified for the current instance, same as
     * getUrl.
     */
    toString(): string;
    /**
     * Returns the URL string value specified for the current instance, same as
     * getUrl.
     */
    valueOf(): any;
}

export = RemoteInclude;
