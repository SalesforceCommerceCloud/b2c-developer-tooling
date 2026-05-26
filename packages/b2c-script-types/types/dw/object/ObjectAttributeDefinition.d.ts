import Collection = require('../util/Collection');
import ObjectAttributeGroup = require('./ObjectAttributeGroup');
import ObjectTypeDefinition = require('./ObjectTypeDefinition');
import ObjectAttributeValueDefinition = require('./ObjectAttributeValueDefinition');

/**
 * Represents the definition of an object's attribute.
 */
declare class ObjectAttributeDefinition {
    /**
     * Boolean value type.
     */
    static readonly VALUE_TYPE_BOOLEAN = 8;
    /**
     * Date value type.
     */
    static readonly VALUE_TYPE_DATE = 6;
    /**
     * Date and Time value type.
     */
    static readonly VALUE_TYPE_DATETIME = 11;
    /**
     * Email value type.
     */
    static readonly VALUE_TYPE_EMAIL = 12;
    /**
     * Enum of int value type.
     */
    static readonly VALUE_TYPE_ENUM_OF_INT = 31;
    /**
     * Enum of String value type.
     */
    static readonly VALUE_TYPE_ENUM_OF_STRING = 33;
    /**
     * HTML value type.
     */
    static readonly VALUE_TYPE_HTML = 5;
    /**
     * Image value type.
     */
    static readonly VALUE_TYPE_IMAGE = 7;
    /**
     * int value type.
     */
    static readonly VALUE_TYPE_INT = 1;
    /**
     * Money value type.
     */
    static readonly VALUE_TYPE_MONEY = 9;
    /**
     * Number value type.
     */
    static readonly VALUE_TYPE_NUMBER = 2;
    /**
     * Password value type.
     */
    static readonly VALUE_TYPE_PASSWORD = 13;
    /**
     * Quantity value type.
     */
    static readonly VALUE_TYPE_QUANTITY = 10;
    /**
     * Set of int value type.
     */
    static readonly VALUE_TYPE_SET_OF_INT = 21;
    /**
     * Set of Number value type.
     */
    static readonly VALUE_TYPE_SET_OF_NUMBER = 22;
    /**
     * Set of String value type.
     */
    static readonly VALUE_TYPE_SET_OF_STRING = 23;
    /**
     * String value type.
     */
    static readonly VALUE_TYPE_STRING = 3;
    /**
     * Text value type.
     */
    static readonly VALUE_TYPE_TEXT = 4;
    /**
     * Returns the ID of the attribute definition.
     */
    readonly ID: string;
    /**
     * Returns all attribute groups the attribute is assigned to.
     */
    readonly attributeGroups: Collection<ObjectAttributeGroup>;
    /**
     * Return the default value for the attribute or null if none is defined.
     */
    readonly defaultValue: ObjectAttributeValueDefinition | null;
    /**
     * Returns the display name for the attribute, which can be used in the
     * user interface.
     */
    readonly displayName: string;
    /**
     * Identifies if the attribute represents the primary key of the object.
     */
    readonly key: boolean;
    /**
     * Checks if this attribute is mandatory.
     */
    readonly mandatory: boolean;
    /**
     * 
     * Returns `true` if the attribute can have multiple values.
     * 
     * Attributes of the following types are multi-value capable:
     * 
     * - VALUE_TYPE_SET_OF_INT
     * - VALUE_TYPE_SET_OF_NUMBER
     * - VALUE_TYPE_SET_OF_STRING
     * 
     * Additionally, attributes of the following types can be multi-value
     * enabled:
     * 
     * - VALUE_TYPE_ENUM_OF_INT
     * - VALUE_TYPE_ENUM_OF_STRING
     */
    readonly multiValueType: boolean;
    /**
     * Returns the object type definition in which this attribute is defined.
     */
    readonly objectTypeDefinition: ObjectTypeDefinition;
    /**
     * Returns `true` if the attribute is of type 'Set of'.
     * @deprecated Use isMultiValueType instead.
     */
    readonly setValueType: boolean;
    /**
     * Indicates if the attribute is a pre-defined system attribute
     * or a custom attribute.
     */
    readonly system: boolean;
    /**
     * Returns the attribute's unit representation such as
     * inches for length or pounds for weight. The value returned by
     * this method is based on the attribute itself.
     */
    readonly unit: string;
    /**
     * Returns a code for the data type stored in the attribute. See constants
     * defined in this class.
     */
    readonly valueTypeCode: number;
    /**
     * Returns the list of attribute values. In the user interface only the
     * values specified in this list should be offered as valid input values.
     * 
     * The collection contains instances of ObjectAttributeValueDefinition.
     */
    readonly values: Collection<ObjectAttributeValueDefinition> | null;
    private constructor();
    /**
     * Returns all attribute groups the attribute is assigned to.
     */
    getAttributeGroups(): Collection<ObjectAttributeGroup>;
    /**
     * Return the default value for the attribute or null if none is defined.
     */
    getDefaultValue(): ObjectAttributeValueDefinition | null;
    /**
     * Returns the display name for the attribute, which can be used in the
     * user interface.
     */
    getDisplayName(): string;
    /**
     * Returns the ID of the attribute definition.
     */
    getID(): string;
    /**
     * Returns the object type definition in which this attribute is defined.
     */
    getObjectTypeDefinition(): ObjectTypeDefinition;
    /**
     * Returns the attribute's unit representation such as
     * inches for length or pounds for weight. The value returned by
     * this method is based on the attribute itself.
     */
    getUnit(): string;
    /**
     * Returns a code for the data type stored in the attribute. See constants
     * defined in this class.
     */
    getValueTypeCode(): number;
    /**
     * Returns the list of attribute values. In the user interface only the
     * values specified in this list should be offered as valid input values.
     * 
     * The collection contains instances of ObjectAttributeValueDefinition.
     */
    getValues(): Collection<ObjectAttributeValueDefinition> | null;
    /**
     * Identifies if the attribute represents the primary key of the object.
     */
    isKey(): boolean;
    /**
     * Checks if this attribute is mandatory.
     */
    isMandatory(): boolean;
    /**
     * 
     * Returns `true` if the attribute can have multiple values.
     * 
     * Attributes of the following types are multi-value capable:
     * 
     * - VALUE_TYPE_SET_OF_INT
     * - VALUE_TYPE_SET_OF_NUMBER
     * - VALUE_TYPE_SET_OF_STRING
     * 
     * Additionally, attributes of the following types can be multi-value
     * enabled:
     * 
     * - VALUE_TYPE_ENUM_OF_INT
     * - VALUE_TYPE_ENUM_OF_STRING
     */
    isMultiValueType(): boolean;
    /**
     * Returns `true` if the attribute is of type 'Set of'.
     * @deprecated Use isMultiValueType instead.
     */
    isSetValueType(): boolean;
    /**
     * Indicates if the attribute is a pre-defined system attribute
     * or a custom attribute.
     */
    isSystem(): boolean;
    /**
     * Returns a boolean flag indicating whether or not values of this attribute
     * definition should be encoded using the encoding="off" flag in ISML
     * templates.
     */
    requiresEncoding(): boolean;
}

export = ObjectAttributeDefinition;
