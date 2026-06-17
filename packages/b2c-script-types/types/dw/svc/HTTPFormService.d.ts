import HTTPService = require('./HTTPService');

/**
 * Represents an HTTP Form POST Service.
 * 
 * All arguments passed to the Service.call method will be URL-encoded and set as name/value
 * pairs in the HTTP request body. The HTTP request will be a POST with a content-type of
 * `application/x-www-form-urlencoded`.
 */
declare class HTTPFormService extends HTTPService {
    private constructor();
}

export = HTTPFormService;
