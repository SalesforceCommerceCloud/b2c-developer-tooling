import ObjectAttributeDefinition = require('./ObjectAttributeDefinition');
import ObjectAttributeGroup = require('./ObjectAttributeGroup');
import Collection = require('../util/Collection');

/**
 * The class provides access to the meta data of a system object or custom
 * object.  A short example should suffice to demonstrate how this metadata can
 * be used in a script:
 * @example
 * var co : CustomObject = CustomObjectMgr.getCustomObject("sample", "MyCustomObject");
 * 
 * // get the object type definition
 * var typeDef : ObjectTypeDefinition = co.describe();
 * // get the custom object attribute definition for name "enumIntValue"
 * var attrDef : ObjectAttributeDefinition = typeDef.getCustomAttributeDefinition( "enumIntValue" );
 * // get the collection of object attribute value definitions
 * var valueDefs : Collection = attrDef.getValues();
 * 
 * // return function if there are no object attribute value definitions
 * if(valueDefs.isEmpty())
 * {
 * return;
 * }
 * 
 * var displayValue : String;
 * // loop over object attribute value definitions collection
 * for each ( var valueDef : ObjectAttributeValueDefinition in valueDefs )
 * {
 * if( valueDef.getValue() == co.custom.intValue )
 * {
 * displayValue = valueDef.getDisplayValue();
 * break;
 * }
 * }
 */
declare class ObjectTypeDefinition {
    /**
     * Returns the type id of the business objects.
     */
    readonly ID: string;
    /**
     * Returns a collection of all declared attributes for the object.
     * The collection contains both system and custom attributes. There might
     * be system and custom attribute with identical names. So the name of the
     * attribute is not a uniqueness criteria. Additional the isCustom() flag
     * must be checked.
     */
    readonly attributeDefinitions: Collection<ObjectAttributeDefinition>;
    /**
     * Returns a collection of all declared attribute groups. A attribute group
     * is a collection of attribute, which are typically displayed together as
     * a visual group.
     */
    readonly attributeGroups: Collection<ObjectAttributeGroup>;
    /**
     * Returns the display name of the definition, which can be used in the
     * user interface.
     */
    readonly displayName: string;
    /**
     * Identifies if this object definition is for a system type or a custom
     * type.
     */
    readonly system: boolean;
    private constructor();
    /**
     * Returns a collection of all declared attributes for the object.
     * The collection contains both system and custom attributes. There might
     * be system and custom attribute with identical names. So the name of the
     * attribute is not a uniqueness criteria. Additional the isCustom() flag
     * must be checked.
     */
    getAttributeDefinitions(): Collection<ObjectAttributeDefinition>;
    /**
     * Returns the attribute group with the given name within this object
     * type definition.
     */
    getAttributeGroup(name: string): ObjectAttributeGroup | null;
    /**
     * Returns a collection of all declared attribute groups. A attribute group
     * is a collection of attribute, which are typically displayed together as
     * a visual group.
     */
    getAttributeGroups(): Collection<ObjectAttributeGroup>;
    /**
     * Returns the custom attribute definition with the given name. The method
     * returns null if no custom attribute is defined with that name.
     */
    getCustomAttributeDefinition(name: string): ObjectAttributeDefinition | null;
    /**
     * Returns the display name of the definition, which can be used in the
     * user interface.
     */
    getDisplayName(): string;
    /**
     * Returns the type id of the business objects.
     */
    getID(): string;
    /**
     * Returns the system attribute definition with the given name. The method
     * returns null if no system attribute is defined with that name. Only
     * system objects have system attributes. A CustomObject has no system attributes
     * and so the method will always return null for a CustomObject.
     */
    getSystemAttributeDefinition(name: string): ObjectAttributeDefinition | null;
    /**
     * Identifies if this object definition is for a system type or a custom
     * type.
     */
    isSystem(): boolean;
}

export = ObjectTypeDefinition;
