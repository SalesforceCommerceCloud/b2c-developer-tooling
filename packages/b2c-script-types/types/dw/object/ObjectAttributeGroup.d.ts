import Collection = require('../util/Collection');
import ObjectAttributeDefinition = require('./ObjectAttributeDefinition');
import ObjectTypeDefinition = require('./ObjectTypeDefinition');

/**
 * Represents a group of object attributes.
 */
declare class ObjectAttributeGroup {
    /**
     * Returns the ID of this group.
     */
    readonly ID: string;
    /**
     * Returns all attribute definitions for this group. The collection
     * may contain both system attribute definition as well as custom
     * attribute definitions.
     */
    readonly attributeDefinitions: Collection<ObjectAttributeDefinition>;
    /**
     * Returns the description of this group in the current locale.
     */
    readonly description: string;
    /**
     * Returns the display name of this group.
     */
    readonly displayName: string;
    /**
     * Returns the object type definition to which this attribute group
     * belongs.
     */
    readonly objectTypeDefinition: ObjectTypeDefinition;
    /**
     * Identifies if this is an sytem or a custom attribute group. A system
     * attribute group is pre-defined and can not be deleted.
     */
    readonly system: boolean;
    private constructor();
    /**
     * Returns all attribute definitions for this group. The collection
     * may contain both system attribute definition as well as custom
     * attribute definitions.
     */
    getAttributeDefinitions(): Collection<ObjectAttributeDefinition>;
    /**
     * Returns the description of this group in the current locale.
     */
    getDescription(): string;
    /**
     * Returns the display name of this group.
     */
    getDisplayName(): string;
    /**
     * Returns the ID of this group.
     */
    getID(): string;
    /**
     * Returns the object type definition to which this attribute group
     * belongs.
     */
    getObjectTypeDefinition(): ObjectTypeDefinition;
    /**
     * Identifies if this is an sytem or a custom attribute group. A system
     * attribute group is pre-defined and can not be deleted.
     */
    isSystem(): boolean;
}

export = ObjectAttributeGroup;
