import Result = require('./Result');
import ServiceConfig = require('./ServiceConfig');

/**
 * Base class of Services.
 * 
 * A service represents a call-specific configuration. Any configuration set here is local to the currently executing
 * call.
 * @see LocalServiceRegistry
 * @see ServiceCallback
 */
declare abstract class Service {
    /**
     * Returns the current URL, excluding any custom query parameters.
     */
    URL: string;
    /**
     * Returns the Service Configuration.
     */
    readonly configuration: ServiceConfig;
    /**
     * Returns the ID of the currently associated Credential.
     */
    credentialID: string;
    /**
     * Returns the status of whether this service is executing in mock mode.
     */
    readonly mock: boolean;
    /**
     * Returns the property that stores the object returned by createRequest.
     */
    readonly requestData: any;
    /**
     * Returns the property that stores the object returned by the service.
     * 
     * This property is only useful after the service call completes, and is the same as the object
     * inside the Result.
     */
    readonly response: any;
    /**
     * Returns the status of whether this service will throw an error when encountering a problem.
     */
    readonly throwOnError: boolean;
    /**
     * Invokes the service.
     */
    call(...args: any[]): Result;
    /**
     * Returns the Service Configuration.
     */
    getConfiguration(): ServiceConfig;
    /**
     * Returns the ID of the currently associated Credential.
     */
    getCredentialID(): string;
    /**
     * Returns the property that stores the object returned by createRequest.
     */
    getRequestData(): any;
    /**
     * Returns the property that stores the object returned by the service.
     * 
     * This property is only useful after the service call completes, and is the same as the object
     * inside the Result.
     */
    getResponse(): any;
    /**
     * Returns the current URL, excluding any custom query parameters.
     */
    getURL(): string;
    /**
     * Returns the status of whether this service is executing in mock mode.
     */
    isMock(): boolean;
    /**
     * Returns the status of whether this service will throw an error when encountering a problem.
     */
    isThrowOnError(): boolean;
    /**
     * Override the Credential by the credential object with the given ID.
     * 
     * If the URL is also overridden, that URL will continue to override the URL in this credential.
     */
    setCredentialID(id: string): Service;
    /**
     * Forces the mock mode to be enabled.
     */
    setMock(): Service;
    /**
     * Forces a Service to throw an error when there is a problem instead of returning a Result with non-OK status.
     */
    setThrowOnError(): Service;
    /**
     * Override the URL to the given value. Any query parameters (if applicable) will be appended to this URL.
     */
    setURL(url: string): Service;
}

export = Service;
