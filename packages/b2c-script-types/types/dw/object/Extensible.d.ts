import CustomAttributes = require('./CustomAttributes');
import ObjectTypeDefinition = require('./ObjectTypeDefinition');

/**
 * Base class alternative to ExtensibleObject for objects customizable through the metadata system.
 * Similar to ExtensibleObject: the describe method provides access to the related object-type metadata.
 * The getCustom method is the central point to retrieve and store the objects attribute
 * values themselves.
 */
declare abstract class Extensible {
    /**
     * Returns the custom attributes for this object.
     */
    readonly custom: CustomAttributes;
    /**
     * Returns the meta data of this object. If no meta data is available the
     * method returns null. The returned ObjectTypeDefinition can be used to
     * retrieve the metadata for any of the custom attributes.
     */
    describe(): ObjectTypeDefinition;
    /**
     * Returns the custom attributes for this object.
     */
    getCustom(): CustomAttributes;
}

export = Extensible;
