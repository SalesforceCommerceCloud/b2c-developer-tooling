import ServiceConfig = require('./ServiceConfig');

/**
 * Base class of Service Definitions.
 * 
 * A service definition represents configuration that is shared across all Service instances.
 * @deprecated This class is only used with the deprecated ServiceRegistry. Use the LocalServiceRegistry
 * instead, which allows configuration on the Service directly.
 */
declare abstract class ServiceDefinition {
    /**
     * Returns the Service Configuration stored in the database.
     */
    readonly configuration: ServiceConfig;
    /**
     * Returns the status of whether mock mode is enabled for all instances of this definition.
     */
    readonly mock: boolean;
    /**
     * Returns the name of this service.
     */
    readonly serviceName: string;
    /**
     * Returns the status of whether the shared throwOnError flag is set.
     */
    readonly throwOnError: boolean;
    /**
     * Register a callback to handle custom portions of the service.
     * 
     * This callback may declare multiple methods:
     * @example
     * {
     * initServiceClient: function() {
     * // Create and return the internal service client object.
     * // This is usually optional, except in the case of SOAP services.
     * },
     * 
     * // svc is the call-specific Service instance. For example, it may be an HTTPService or FTPService.
     * // params are the arguments passed to the call method (if any).
     * createRequest: function(svc:Service, params) {
     * // Perform any required call-time configuration.
     * // Optionally return a Service-specific object
     * },
     * 
     * // svc is the call-specific Service instance.
     * // arg is the output of createRequest.
     * execute: function(svc:Service, arg:Object) {
     * // Execute the service call and return a result
     * // This method is not used by default for HTTP-related services unless executeOverride is set.
     * },
     * 
     * // Use the execute function if it is present. This is only required to use the functionality with HTTP services.
     * executeOverride: true,
     * 
     * // svc is the call-specific Service instance.
     * // response is the output of execute.
     * parseResponse: function(svc:Service, response: Object) {
     * // Process the response object as needed.
     * // The return value of this method will be the return value of the outer call method.
     * },
     * 
     * // svc is the call-specific Service instance.
     * // arg is the output of createRequest.
     * mockCall: function(svc:Service, arg:Object) {
     * // This method takes the place of the 'execute' phase when mocking is enabled.
     * // Note initServiceClient, createRequest, and parseResponse still invoked.
     * },
     * 
     * // svc is the call-specific Service instance.
     * // params are the arguments passed to the call method (if any).
     * mockFull: function(svc:Service, params) {
     * // This method takes the place of the entire service call when mocking is enabled.
     * // No other callbacks are invoked. The output of this method becomes the output of call.
     * }
     * 
     * }
     */
    configure(config: Object): ServiceDefinition;
    /**
     * Returns the Service Configuration stored in the database.
     */
    getConfiguration(): ServiceConfig;
    /**
     * Returns the name of this service.
     */
    getServiceName(): string;
    /**
     * Returns the status of whether mock mode is enabled for all instances of this definition.
     */
    isMock(): boolean;
    /**
     * Returns the status of whether the shared throwOnError flag is set.
     */
    isThrowOnError(): boolean;
    /**
     * Sets the mock mode for all Service instances that use this definition.
     */
    setMock(): ServiceDefinition;
    /**
     * Sets the throwOnError flag to true for all Service instances that use this definition.
     */
    setThrowOnError(): ServiceDefinition;
}

export = ServiceDefinition;
