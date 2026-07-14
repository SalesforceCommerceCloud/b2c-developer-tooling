import HTTPServiceDefinition = require('./HTTPServiceDefinition');

/**
 * Represents an HTTP Form POST Service Definition.
 * @deprecated This class is only used with the deprecated ServiceRegistry. Use the LocalServiceRegistry
 * instead, which allows configuration on the HTTPFormService directly.
 */
declare class HTTPFormServiceDefinition extends HTTPServiceDefinition {
    private constructor();
}

export = HTTPFormServiceDefinition;
