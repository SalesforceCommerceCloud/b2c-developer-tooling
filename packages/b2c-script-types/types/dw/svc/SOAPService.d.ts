import Service = require('./Service');

/**
 * Represents a SOAP WebService.
 */
declare class SOAPService extends Service {
    /**
     * Returns the authentication type.
     */
    authentication: string;
    /**
     * Returns the serviceClient object.
     */
    serviceClient: any;
    private constructor();
    /**
     * Returns the authentication type.
     */
    getAuthentication(): string;
    /**
     * Returns the serviceClient object.
     */
    getServiceClient(): any;
    /**
     * Sets the type of authentication. Valid values include "BASIC" and "NONE".
     * 
     * The default value is BASIC.
     */
    setAuthentication(authentication: string): SOAPService;
    /**
     * Sets the serviceClient object. This must be set in the prepareCall method, prior to execute being called.
     */
    setServiceClient(o: any): SOAPService;
}

export = SOAPService;
