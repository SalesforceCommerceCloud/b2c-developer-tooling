import ServiceDefinition = require('./ServiceDefinition');

/**
 * Represents an FTP or SFTP Service Definition.
 * 
 * There are two basic styles of configuration for this service.
 * 
 * In the first style, `createRequest` is implemented to call the setOperation method on the Service. This
 * will cause the single operation to be performed and returned as the data object in the `parseResponse`
 * method. Any error status is set automatically based on the returned value of the operation.
 * 
 * In the second style, `execute` is implemented to perform one or more operations using the serviceClient
 * available on the Service object. This serviceClient will be either an dw.net.FTPClient or an
 * dw.net.SFTPClient. The return value of execute will be passed as the data object in the
 * `parseResponse` method.
 * @deprecated This class is only used with the deprecated ServiceRegistry. Use the LocalServiceRegistry
 * instead, which allows configuration on the FTPService directly.
 */
declare class FTPServiceDefinition extends ServiceDefinition {
    /**
     * Returns the status of whether the underlying FTP connection will be disconnected after the service call.
     */
    autoDisconnect: boolean;
    private constructor();
    /**
     * Returns the status of whether the underlying FTP connection will be disconnected after the service call.
     */
    isAutoDisconnect(): boolean;
    /**
     * Sets the auto-disconnect flag.
     * 
     * If true, the underlying FTP connection will be disconnected after the service call. If false then it will remain
     * open. The default value is true.
     */
    setAutoDisconnect(b: boolean): FTPServiceDefinition;
}

export = FTPServiceDefinition;
