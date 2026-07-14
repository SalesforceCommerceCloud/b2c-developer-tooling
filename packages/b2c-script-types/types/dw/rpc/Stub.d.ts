/**
 * This is the base class for all service stubs accessible
 * through a WebReference object. The Stub provides access to the WSDL operations.
 * 
 * Demandware recommends a low timeout to ensure responsiveness
 * of the site and to avoid thread exhaustion. Use the Services module
 * in Business Manager to set timeout values, not the methods for this class.
 * The Services module provides better analytics and timeout management.
 * 
 * The default timeout, if not set, is 15 minutes when the web service is used in a job,
 * and 2 minutes otherwise. If the timeout of the calling script is lower,
 * the script timeout is used.
 * @example
 * `
 * // get WebReference
 * var webref : WebReference = webreferences.myWSDLname;
 * // get service stub
 * var stub : Stub = webref.defaultService;
 * `
 * @see dw.rpc.WebReference
 * @see dw.rpc.SOAPUtil
 * @deprecated This class is deprecated, please use webreferences2 instead (see also dw.ws.Port).
 */
declare abstract class Stub {
    /**
     * This property allows the user to set the web service connection timeout value in milliseconds. By default,
     * the web service connection timeout is 5000 milliseconds (5 seconds). The minimum allowed value is 100 milliseconds
     * and the maximum allowed value is 15000 milliseconds (15 seconds). Demandware recommends setting timeout values
     * in Business Manager Services module as it provides better analytics and timeout management.
     * @deprecated use webreferences2 instead
     */
    static readonly CONNECTION_TIMEOUT = "demandware.script.webReference.connectionTimeout";
    /**
     * Standard property: target service endpoint address. The
     * URI scheme for the endpoint address specification must
     * correspond to the protocol/transport binding for this
     * stub class.
     * @deprecated use webreferences2 instead
     */
    static readonly ENDPOINT_ADDRESS_PROPERTY = "javax.xml.rpc.service.endpoint.address";
    /**
     * Standard property: password for authentication.
     * @deprecated use webreferences2 instead
     */
    static readonly PASSWORD_PROPERTY = "javax.xml.rpc.security.auth.password";
    /**
     * Standard property: this boolean property is used by a service
     * client to indicate whether or not it wants to participate in
     * a session with a service endpoint. If this property is set to
     * true, the service client indicates that it wants the session
     * to be maintained. If set to false, the session is not maintained.
     * The default value for this property is false.
     * @deprecated use webreferences2 instead
     */
    static readonly SESSION_MAINTAIN_PROPERTY = "javax.xml.rpc.session.maintain";
    /**
     * Standard property: user name for authentication.
     * @deprecated use webreferences2 instead
     */
    static readonly USERNAME_PROPERTY = "javax.xml.rpc.security.auth.username";
    /**
     * Returns the password.
     * @deprecated use webreferences2 instead
     */
    password: string;
    /**
     * Returns the current read timeout value in milliseconds for this Stub.
     * @deprecated use webreferences2 instead
     */
    timeout: number;
    /**
     * Returns the user name.
     * 
     * Note: this method handles sensitive security-related data.
     * Pay special attention to PCI DSS v3. requirements 2, 4, and 12.
     * @deprecated use webreferences2 instead
     */
    username: string;
    private constructor();
    /**
     * Gets the value of a specific configuration property.
     * @deprecated use webreferences2 instead
     */
    _getProperty(name: string): any;
    /**
     * Sets the name and value of a configuration property
     * for this Stub instance. If the Stub instance contains
     * a value for the same property, the old value is replaced.
     * 
     * Note: the `_setProperty` method may not
     * perform a validity check on a configured property value. An
     * example is the standard property for the target service
     * endpoint address, which is not checked for validity in the
     * `_setProperty` method.
     * In this case, stub configuration errors are detected at
     * the remote method invocation.
     * @deprecated use webreferences2 instead
     */
    _setProperty(name: string, value: any): void;
    /**
     * Returns the password.
     * @deprecated use webreferences2 instead
     */
    getPassword(): string;
    /**
     * Returns the current read timeout value in milliseconds for this Stub.
     * @deprecated use webreferences2 instead
     */
    getTimeout(): number;
    /**
     * Returns the user name.
     * 
     * Note: this method handles sensitive security-related data.
     * Pay special attention to PCI DSS v3. requirements 2, 4, and 12.
     * @deprecated use webreferences2 instead
     */
    getUsername(): string;
    /**
     * Sets an additional SOAP header value for the next
     * operation.
     * @deprecated use webreferences2 instead
     */
    setHeader(namespace: string, name: string, value: any): void;
    /**
     * Sets the password.
     * @deprecated use webreferences2 instead
     */
    setPassword(password: string): void;
    /**
     * Sets the timeout in milliseconds for the next call through this Stub.
     * 
     * This timeout value controls "read timeout" (how
     * long, after connecting, it will wait without any data being read).
     * To control "connection timeout" you use the _setProperty
     * method where the name parameter is CONNECTION_TIMEOUT.
     * @see _setProperty
     * @see CONNECTION_TIMEOUT
     * @deprecated use webreferences2 instead
     */
    setTimeout(timeout: number): void;
    /**
     * Sets the user name.
     * @deprecated use webreferences2 instead
     */
    setUsername(username: string): void;
}

export = Stub;
