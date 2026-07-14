import PersistentObject = require('./PersistentObject');
import CustomAttributes = require('./CustomAttributes');
import ObjectTypeDefinition = require('./ObjectTypeDefinition');

/**
 * Base class for all persistent business objects in Commerce Cloud Digital that
 * are customizable through the metadata system. All objects in Digital
 * that have custom attributes derive from ExtensibleObject including
 * both system-defined and custom objects. The describe() method provides access
 * to the related object-type metadata. The method getCustom() is the central
 * point to retrieve and store the objects attribute values themselves.
 */
declare class ExtensibleObject<T extends CustomAttributes> extends PersistentObject {
    /**
     * Returns the custom attributes for this object. The returned object is
     * used for retrieving and storing attribute values. See
     * dw.object.CustomAttributes for a detailed example of the syntax for
     * working with custom attributes.
     */
    readonly custom: T;
    /**
     * Returns the meta data of this object. If no meta data is available the
     * method returns null. The returned ObjectTypeDefinition can be used to
     * retrieve the metadata for any of the custom attributes.
     */
    describe(): ObjectTypeDefinition;
    /**
     * Returns the custom attributes for this object. The returned object is
     * used for retrieving and storing attribute values. See
     * dw.object.CustomAttributes for a detailed example of the syntax for
     * working with custom attributes.
     */
    getCustom(): T;
}

export = ExtensibleObject;
