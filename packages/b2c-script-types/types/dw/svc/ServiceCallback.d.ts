import Service = require('./Service');

/**
 * Defines callbacks for use with the LocalServiceRegistry.
 * 
 * Note this class itself is not used directly, and is present only for documentation of the available callback methods.
 * 
 * These methods are called in sequence when a service is called:
 * 
 * - initServiceClient -- Creates the underlying client that will be used to make the call. This is
 * intended for SOAP Services and optionally for setting configuration options on the HTTP client. Other client types
 * will be created automatically.
 * - createRequest -- Given arguments to the Service.call, configure
 * the actual service request. This may include setting request headers, defining the message body, etc.
 * - execute -- Perform the actual request. At this point the client has been configured
 * with the relevant credentials, so the call should be made. This is required for SOAP services.
 * - parseResponse -- Convert the result of the call into an object to be returned from the
 * Service.call method.
 * 
 * If the service is mocked (see Service.isMock), then mockFull takes the place
 * of this entire sequence. If that is not implemented, then mockCall takes the place of just
 * the execute method.
 * 
 * The URL, request, and response objects may be logged. To avoid logging sensitive data,
 * filterLogMessage and/or getRequestLogMessage and
 * getResponseLogMessage must be implemented. If they are not implemented then this logging will not be
 * done on Production environments.
 * 
 * There are some special considerations for the combination of service type and callback:
 * 
 * Service Type
 * initServiceClient
 * createRequest
 * execute
 * parseResponse
 * 
 * HTTP
 * This is only required to use non-default options. It must return either a dw.net.HTTPClient or a Map
 * containing the dw.net.HTTPClient.HTTPClient options.
 * Required unless execute is provided. The return value is expected to be either a String or array of
 * dw.net.HTTPRequestPart, which will be used as the request body
 * Not called unless a boolean "executeOverride:true" is set on the callback. This is a temporary limitation, a
 * future release will always call this callback if it is present
 * Required unless execute is provided.
 * 
 * HTTPForm
 * Not normally implemented. Must return a dw.net.HTTPClient
 * Not normally implemented. Default behavior constructs an "application/x-www-form-urlencoded" request based on a
 * Map given as an argument.
 * Not normally implemented. The same limitations as HTTP regarding the "executeOverride" flag apply here.
 * Optional. Default behavior is to return the response body as a String.
 * 
 * SOAP
 * Optional. This must return the Webservice stub or port
 * Required. If initServiceClient was not provided, then this function must call
 * SOAPService.setServiceClient with the stub or port
 * Required. A typical implementation will call the webservice via a method on the service client
 * Optional. Default behavior returns the output of execute
 * 
 * FTP
 * Not normally implemented. Must return a dw.net.FTPClient or dw.net.SFTPClient
 * Required unless execute is defined. If present, it should call
 * FTPService.setOperation
 * Optional. An implementation may call any required methods on the given client. The default implementation calls
 * the Operation that was set up and returns the result.
 * Optional. Default behavior returns the output of execute
 * 
 * GENERIC
 * Optional.
 * Optional.
 * Required. The GENERIC type allows any code to be wrapped in the service framework layer, and it's up to this
 * execute method to define what that logic is.
 * Optional.
 */
declare abstract class ServiceCallback {
    /**
     * Allows overriding the URL provided by the service configuration.
     * 
     * It is usually better to call Service.setURL within createRequest
     * because that allows you to modify the existing URL based on call parameters.
     */
    readonly URL: string;
    private constructor();
    /**
     * Creates a request object to be used when calling the service.
     * 
     * The type of the object expected is dependent on the service. For example, the HTTPService expects the
     * HTTP request body to be returned.
     * 
     * This is required unless the execute method is implemented.
     * 
     * It is not recommended to have a service accept a single array or list as a parameter, since doing so requires
     * some extra work when actually calling the service. See Service.call for more details.
     */
    createRequest(service: Service, ...params: any[]): any;
    /**
     * Provides service-specific execution logic.
     * 
     * This can be overridden to execute a chain of FTP commands in the FTPService, or perform the actual remote
     * call on a webservice stub in the SOAPService.
     * @throws Exception
     */
    execute(service: Service, request: any): any;
    /**
     * Allows filtering communication URL, request, and response log messages.
     * 
     * If not implemented, then no filtering will be performed and the message will be logged as-is.
     */
    filterLogMessage(msg: string): string;
    /**
     * Creates a communication log message for the given request.
     * 
     * If not implemented then the default logic will be used to convert the request into a log message.
     */
    getRequestLogMessage(request: any): string | null;
    /**
     * Creates a response log message for the given request.
     * 
     * If not implemented then the default logic will be used to convert the response into a log message.
     */
    getResponseLogMessage(response: any): string | null;
    /**
     * Allows overriding the URL provided by the service configuration.
     * 
     * It is usually better to call Service.setURL within createRequest
     * because that allows you to modify the existing URL based on call parameters.
     */
    getURL(): string;
    /**
     * Creates a protocol-specific client object.
     * 
     * This does not normally need to be implemented, except in the case of SOAP services.
     * 
     * It may also be used for HTTP services to override the default configuration.
     * 
     * Example SOAP service:
     * 
     * ```
     * initServiceClient: function( svc ) {
     * return webreferences2.MyWSDL.getDefaultService();
     * }
     * ```
     * 
     * Example configuration override for an HTTP service:
     * @example
     * initServiceClient: function( svc ) {
     * return { allowHTTP2: true };
     * }
     * @throws Exception
     */
    initServiceClient(service: Service): any;
    /**
     * Override this method to mock the remote portion of the service call.
     * 
     * Other callbacks like createRequest and parseResponse are still called.
     * @throws Exception
     */
    mockCall(service: Service, requestObj: any): any;
    /**
     * Override this method to mock the entire service call, including the createRequest, execute, and parseResponse phases.
     * @throws Exception
     */
    mockFull(service: Service, ...args: any[]): any;
    /**
     * Creates a response object from a successful service call.
     * 
     * This response object will be the output object of the call method's Result.
     */
    parseResponse(service: Service, response: any): any;
}

export = ServiceCallback;
