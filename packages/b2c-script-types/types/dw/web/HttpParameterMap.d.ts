import HttpParameter = require('./HttpParameter');
import utilSet = require('../util/Set');
import LinkedHashMap = require('../util/LinkedHashMap');

/**
 * A map of HTTP parameters.
 */
declare class HttpParameterMap {
    /**
     * Returns the number of paramters in this http parameter map.
     */
    readonly parameterCount: number;
    /**
     * Returns a collection of all parameter names.
     */
    readonly parameterNames: utilSet<any>;
    /**
     * Returns the HTTP request body as string (e.g. useful for XML posts). A body
     * is only returned if the request is a POST or PUT request and was not send
     * with "application/x-www-form-urlencoded" encoding. If the request was send
     * with that encoding it is interpreted as form data and the body will be empty.
     */
    readonly requestBodyAsString: string;
    private constructor();
    /**
     * Returns the http parameter for the given key or an empty http parameter,
     * if no parameter is defined for that key. An empty parameter returns
     * false for the method isDefined().
     */
    get(name: any): HttpParameter;
    /**
     * Returns the number of paramters in this http parameter map.
     */
    getParameterCount(): number;
    /**
     * Returns a sub-map containing all parameters that start with the given
     * prefix. The prefix will be removed from the parameter names in the returned
     * sub-map. For example with the parameters "pre_P1" and "pre_p2" a call with
     * "pre_" as parameter will return a HttpParameterMap containing "P1" and "P2".
     */
    getParameterMap(prefix: string): HttpParameterMap;
    /**
     * Returns a collection of all parameter names.
     */
    getParameterNames(): utilSet<any>;
    /**
     * Returns the HTTP request body as string (e.g. useful for XML posts). A body
     * is only returned if the request is a POST or PUT request and was not send
     * with "application/x-www-form-urlencoded" encoding. If the request was send
     * with that encoding it is interpreted as form data and the body will be empty.
     */
    getRequestBodyAsString(): string;
    /**
     * Identifies if the parameter has been submitted.
     */
    isParameterSubmitted(key: string): boolean;
    /**
     * This method can be called to process a form submission for an HTML form
     * with encoding type "multipart/form-data". Such a form can have a mixture
     * of "regular" HTML form fields and also file uploads.
     * 
     * Form fields are available via get without calling this method.
     * Uploaded files still need to be processed via the passed callback function.
     * 
     * This callback function is called for each file upload part in the request.
     * The parameters are the field name, the content type and the original file
     * name. The function can return either a null, which means that the upload
     * of this part should be skipped, or return a dw.io.File instance. If the
     * file is an existing directory the system will automatically generate a
     * unique file name. If the file is not an existing directory the uploaded
     * content will be directly stored into that file. An existing file with the
     * same name will be deleted. If the file can't be deleted for whatever reason,
     * the upload is stored with a generated unique file name in the indicated directory.
     * 
     * An automatically generated file name consists of the the prefix "upload",
     * a time stamp, a unique id and the extension tmp. For example:
     * "upload_20070114221535_bc7H1aOadI9qYaaacovPd3lqna.tmp".
     * @example
     * `
     * var params : HttpParameterMap = pdict.CurrentHttpParameterMap;
     * 
     * // Get the file name from the first field. This is works because the
     * // parameter map is updated before the file part is parsed.
     * var files : LinkedHashMap = params.processMultipart( (function( field, ct, oname ){
     * return new File( File.IMPEX + "/" + params.firstField );
     * }) );
     * `
     */
    processMultipart(callback: Function): LinkedHashMap<any, any> | null;
}

export = HttpParameterMap;
