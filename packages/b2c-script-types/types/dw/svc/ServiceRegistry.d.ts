import ServiceDefinition = require('./ServiceDefinition');
import Service = require('./Service');

/**
 * The ServiceRegistry is responsible for managing Service definitions and their instances.
 * 
 * Typical usage involves several steps:
 * 
 * - The service is defined in the Business Manager and configured with necessary credentials.
 * - The service callback is configured once during cartridge initialization:
 * 
 * ```
 * ServiceRegistry.configure("MyFTPService", {
 *     mockExec : function(svc:FTPService, params) {
 *         return [
 *             { "name": "file1", "timestamp": new Date(2011, 02, 21)},
 *             { "name": "file2", "timestamp": new Date(2012, 02, 21)},
 *             { "name": "file3", "timestamp": new Date(2013, 02, 21)}
 *         ];
 *     },
 *     createRequest: function(svc:FTPService, params) {
 *         svc.setOperation("list", "/");
 *     },
 *     parseResponse : function(svc:FTPService, listOutput) {
 *         var x : Array = [];
 *         var resp : Array = listOutput;
 *         for(var i = 0; i < resp.length; i++) {
 *             var f = resp[i];
 *             x.push( { "name": f['name'], "timestamp": f['timestamp'] } );
 *         }
 *         return x;
 *     }
 * });
 * ```
 * 
 * - A new service instance is created and called in order to perform the operation:
 * 
 * ```
 * var result : Result = ServiceRegistry.get("MyFTPService").call();
 * if(result.status == 'OK') {
 * // The result.object is the object returned by the 'after' callback.
 * } else {
 * // Handle the error. See result.error for more information.
 * }
 * ```
 * 
 * See ServiceCallback for all the callback options, and individual ServiceDefinition
 * classes for customization specific to a service type.
 * @deprecated It is recommended to use the LocalServiceRegistry instead of this class.
 */
declare class ServiceRegistry {
    private constructor();
    /**
     * Configure the given serviceId with a callback.
     * 
     * If the service is already configured, the given callback will replace any existing one.
     */
    static configure(serviceID: string, configObj: Object): ServiceDefinition;
    /**
     * Constructs a new instance of the given service.
     */
    static get(serviceID: string): Service;
    /**
     * Gets a Service Definition.
     * 
     * This Service Definition is shared across all Service instances returned by get.
     */
    static getDefinition(serviceID: string): ServiceDefinition;
    /**
     * Returns the status of whether the given service has been configured with a callback.
     */
    static isConfigured(serviceID: string): boolean;
}

export = ServiceRegistry;
