/**
 * This class represents a REST success response that is compliant with the RFC standards. It can only be instantiated
 * using the `createSuccess` methods in RESTResponseMgr.
 * 
 * Here is an example:
 * 
 * `
 * var body = {"hello": "world"}
 * 
 * var success = RESTResponseMgr.createSuccess(body);
 * 
 * success.render();
 * 
 * `
 * 
 * The above script would result in an HTTP response with status code 200 and the following body:
 * 
 * `
 * {
 * 
 * &emsp;"hello": "world"
 * 
 * }
 * 
 * `
 */
declare class RESTSuccessResponse {
    private constructor();
    /**
     * Sends the RESTSuccessResponse object as an HTTP response to the client. This sets the "Content-Type"
     * header to "application/json" and expects the body to be a valid JavaScript JSON object.
     * @throws IllegalStateException If the RESTSuccessResponse object is already rendered.
     * @throws Exception If there is an error while serializing the body.
     */
    render(): void;
}

export = RESTSuccessResponse;
