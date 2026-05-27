import CustomAttributes = require('./CustomAttributes');

/**
 * Base class alternative to ExtensibleObject for customizable objects which do not rely on the metadata system.
 * Unlike Extensible any custom attributes can be set on the fly and are not checked against an available list.
 * Similar to Extensible method getCustom is the central point to retrieve and store the objects attribute
 * values.
 */
declare abstract class SimpleExtensible {
    /**
     * Returns the custom attributes for this object.
     */
    readonly custom: CustomAttributes;
    private constructor();
    /**
     * Returns the custom attributes for this object.
     */
    getCustom(): CustomAttributes;
}

export = SimpleExtensible;
