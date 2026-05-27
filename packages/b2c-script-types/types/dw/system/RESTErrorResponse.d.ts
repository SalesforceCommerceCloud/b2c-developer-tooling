import CustomAttributes = require('../object/CustomAttributes');

/**
 * This class represents a REST error response that is compliant with
 * RFC 9457. It can only be instantiated using the
 * `createError` methods in RESTResponseMgr.
 * 
 * Here is an example:
 * 
 * ```
 * `
 * var error = RESTResponseMgr.createError(400);
 * error.custom.foo = "bar";
 * error.render();
 * `
 * ```
 * 
 * The above script would result in an HTTP response with status code 400 and the following body:
 * 
 * ```
 * `
 * {
 * "type": "https://api.commercecloud.salesforce.com/documentation/error/v1/custom-errors/bad-request",
 * "c_foo": "bar"
 * }
 * `
 * ```
 * 
 * NOTE:
 * 
 * - Custom attributes are rendered with "c_" prefix as shown in the example above.
 * - Rendering works as described in TopLevel.JSON.stringify.
 */
declare class RESTErrorResponse {
    /**
     * Returns all the custom attributes associated with the error response object. The attributes are stored for the
     * lifetime of the error response object.
     */
    readonly custom: CustomAttributes;
    private constructor();
    /**
     * Returns all the custom attributes associated with the error response object. The attributes are stored for the
     * lifetime of the error response object.
     */
    getCustom(): CustomAttributes;
    /**
     * Sends the RESTErrorResponse object as an HTTP error response to the client, adhering to
     * RFC 9457. This method sets the "Content-Type" header to
     * "application/problem+json", HTTP Status Code to statusCode attribute and constructs the body from type, title,
     * detail and custom attributes of the object. Custom attributes are rendered with "c_" prefix to the attribute
     * name.
     * @throws IllegalStateException If the RESTErrorResponse object is already rendered.
     * @throws Exception If there is an error while serializing the RESTErrorResponse object.
     */
    render(): void;
}

export = RESTErrorResponse;
