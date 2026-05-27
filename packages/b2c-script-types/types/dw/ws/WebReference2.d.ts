import Port = require('./Port');

/**
 * Represents a web service defined in a WSDL file. The implementation is backed by a JAX-WS framework.
 * 
 * This implementation does not support `RPC/encoded` WSDLs. Such a WSDL must be migrated to a
 * supported encoding such as `Document/literal` to work with this API.
 * 
 * To create an instance of a WebReference2, you put a web service WSDL file in the `webreferences2`
 * directory and reference the WSDL file in a B2C Commerce Script. You then request the service Port
 * using one of the get service methods. For example, if your WSDL file is `MyWSDL.wsdl`,
 * here is how you create an instance of WebReference2 and access the Port:
 * 
 * ```
 * var webref : WebReference2 = webreferences2.MyWSDL;
 * var port : Port = webref.getDefaultService();
 * ```
 * 
 * Note that all script classes representing your WSDL file are placed in the `webreferences2`
 * package. To use classes in the `webreferences2` package, you do not need to use the `importPackage`
 * statement in your B2C Commerce Script file.
 * 
 * The generated API may be customized via a property file named `<WSDLFile>.properties`.
 * For example, if your WSDL file is `MyWSDL.wsdl`, the property file name is `MyWSDL.wsdl.properties`.
 * Supported properties include:
 * 
 * Supported properties with description
 * 
 * Name
 * Type
 * Description
 * 
 * `namespace`
 * `boolean`
 * If the WSDL contains different types with the same name a compilation error may occur. Set this to `true` to
 * generate a namespace-aware Port, which will have classes separated into packages based on their associated namespace.
 * The default value is `false`
 * 
 * `underscoreBinding`
 * `string`
 * If you have elements in a WSDL schema that contain the underscore character, code generation may fail. Set this property
 * to `asCharInWord` to resolve the problem. The default value is `asWordSeparator`.
 * 
 * `collectionType`
 * `string`
 * The generated API will use array types instead of List types for collections when this value is set to
 * `indexed`. This results in code that is more compatible with older `webreferences`-based
 * implementations. The default behavior is to generate Lists.
 * 
 * `enableWrapperStyle`
 * `boolean`
 * The generated API will use "bare" methods when this is `false`. When this is `true`,
 * "wrapped" methods may be generated instead. The default value is `true`, but a `false`
 * value is more  compatible with older `webreferences`-based implementations.
 * 
 * The messages sent to and from the remote server are logged at DEBUG level on sandboxes, and not logged at all on production.
 * The custom log category used is derived from the WSDL name and message type. For example, the custom log categories for the file
 * `MyWSDL.wsdl` are `webreferences2.MyWSDL.request` and `webreferences2.MyWSDL.response`. This
 * logging is controlled by the following in the WSDL properties:
 * 
 * Supported logging properties with description
 * 
 * Name
 * Type
 * Description
 * 
 * `logging.enabled`
 * `boolean`
 * `true` to explicitly allow logging, `false` to disallow. Default is `true` on Sandboxes
 * and `false` on all other instance types
 * 
 * `logging.level`
 * `string`
 * The logging level to use (`TRACE`, `DEBUG`, `INFO`, `WARN`, `ERROR`).
 * Default is `DEBUG`.
 * 
 * `logging.pretty`
 * `boolean`
 * `true` to pretty-print the SOAP XML. Default is `false` to log the actual message body.
 * 
 * `logging.verbose`
 * `boolean`
 * `true` to log HTTP headers and other message information. Default is `false` to only log the
 * message body
 * 
 * `logging.filter.elements`
 * comma-separated `string`
 * List of element tag names containing sensitive information. These will be filtered out of the message. All properties with
 * this prefix will be used. For example `logging.filter.elements=Password,Token` is equivalent to two different properties
 * `logging.filter.elements.01=Token` and `logging.filter.elements.02=Token`
 * 
 * `logging.filter.headers`
 * comma-separated `string`
 * List of message header names containing sensitive information. These will be filtered out of the message. All properties with
 * this prefix will be used. For example `logging.filter.headers=Authorization,Token` is equivalent to two different properties
 * `logging.filter.headers.01=Authorization` and `logging.filter.headers.02=Token`
 * @see dw.ws.Port
 * @see dw.rpc.WebReference
 */
declare abstract class WebReference2 {
    /**
     * Returns the default service endpoint interface port of the web reference. The default service is
     * determined as the first service based on the alphabetic order of the service name, and within
     * the service the first SOAP port based on the alphabetic order of the port name.
     */
    readonly defaultService: Port;
    private constructor();
    /**
     * Returns the default service endpoint interface port of the web reference. The default service is
     * determined as the first service based on the alphabetic order of the service name, and within
     * the service the first SOAP port based on the alphabetic order of the port name.
     */
    getDefaultService(): Port;
    /**
     * Returns a specific service from this web reference.
     */
    getService(service: string, portName: string): Port;
}

export = WebReference2;
