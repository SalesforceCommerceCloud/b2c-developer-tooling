import Service = require('./Service');

/**
 * Represents an FTP or SFTP Service.
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
 * 
 * Note that the use of the FTP client is deprecated, and SFTP should be used instead.
 */
declare class FTPService extends Service {
    /**
     * Returns the status of whether the underlying FTP connection will be disconnected after the service call.
     */
    autoDisconnect: boolean;
    /**
     * Returns the underlying client object.
     * 
     * This is either an dw.net.FTPClient or dw.net.SFTPClient, depending on the protocol.
     */
    readonly client: any;
    private constructor();
    /**
     * Returns the underlying client object.
     * 
     * This is either an dw.net.FTPClient or dw.net.SFTPClient, depending on the protocol.
     */
    getClient(): any;
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
    setAutoDisconnect(b: boolean): FTPService;
    /**
     * Sets a single operation to perform during the execute phase of the service.
     * 
     * The given arguments make up a method name and arguments on the underlying getClient object. This
     * method will be invoked during execution, with the result passed into the callback's parseResponse method.
     * 
     * This is required unless the callback defines an execute method.
     */
    setOperation(name: string, ...args: any[]): FTPService;
}

export = FTPService;
