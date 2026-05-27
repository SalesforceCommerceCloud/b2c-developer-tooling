import ExtensibleObject = require('../object/ExtensibleObject');
import CustomAttributes = require('../object/CustomAttributes');
import ServiceCredential = require('./ServiceCredential');
import ServiceProfile = require('./ServiceProfile');

declare global {
    module ICustomAttributes {
        interface ServiceConfig extends CustomAttributes {
        }
    }
}

/**
 * Configuration object for Services.
 */
declare class ServiceConfig extends ExtensibleObject<ICustomAttributes.ServiceConfig> {
    /**
     * Returns the unique Service ID.
     */
    readonly ID: string;
    /**
     * Returns the related service credentials.
     */
    readonly credential: ServiceCredential;
    /**
     * Returns the related service profile.
     */
    readonly profile: ServiceProfile;
    /**
     * Returns the type of the service, such as HTTP or SOAP.
     */
    readonly serviceType: string;
    private constructor();
    /**
     * Returns the related service credentials.
     */
    getCredential(): ServiceCredential;
    /**
     * Returns the unique Service ID.
     */
    getID(): string;
    /**
     * Returns the related service profile.
     */
    getProfile(): ServiceProfile;
    /**
     * Returns the type of the service, such as HTTP or SOAP.
     */
    getServiceType(): string;
}

export = ServiceConfig;
