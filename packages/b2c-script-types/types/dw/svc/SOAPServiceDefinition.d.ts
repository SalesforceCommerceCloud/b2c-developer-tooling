import ServiceDefinition = require('./ServiceDefinition');

/**
 * Represents a SOAP WebService definition.
 * @deprecated This class is only used with the deprecated ServiceRegistry. Use the LocalServiceRegistry
 * instead, which allows configuration on the SOAPService directly.
 */
declare class SOAPServiceDefinition extends ServiceDefinition {
    private constructor();
}

export = SOAPServiceDefinition;
