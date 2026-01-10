<!-- prettier-ignore-start -->
# Class ObjectAttributeDefinition

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.ObjectAttributeDefinition](dw.object.ObjectAttributeDefinition.md)

Represents the definition of an object's attribute.


## Constant Summary

| Constant | Description |
| --- | --- |
| [VALUE_TYPE_BOOLEAN](#value_type_boolean): [Number](TopLevel.Number.md) = 8 | Boolean value type. |
| [VALUE_TYPE_DATE](#value_type_date): [Number](TopLevel.Number.md) = 6 | Date value type. |
| [VALUE_TYPE_DATETIME](#value_type_datetime): [Number](TopLevel.Number.md) = 11 | Date and Time value type. |
| [VALUE_TYPE_EMAIL](#value_type_email): [Number](TopLevel.Number.md) = 12 | Email value type. |
| [VALUE_TYPE_ENUM_OF_INT](#value_type_enum_of_int): [Number](TopLevel.Number.md) = 31 | Enum of int value type. |
| [VALUE_TYPE_ENUM_OF_STRING](#value_type_enum_of_string): [Number](TopLevel.Number.md) = 33 | Enum of String value type. |
| [VALUE_TYPE_HTML](#value_type_html): [Number](TopLevel.Number.md) = 5 | HTML value type. |
| [VALUE_TYPE_IMAGE](#value_type_image): [Number](TopLevel.Number.md) = 7 | Image value type. |
| [VALUE_TYPE_INT](#value_type_int): [Number](TopLevel.Number.md) = 1 | int value type. |
| [VALUE_TYPE_MONEY](#value_type_money): [Number](TopLevel.Number.md) = 9 | Money value type. |
| [VALUE_TYPE_NUMBER](#value_type_number): [Number](TopLevel.Number.md) = 2 | Number value type. |
| [VALUE_TYPE_PASSWORD](#value_type_password): [Number](TopLevel.Number.md) = 13 | Password value type. |
| [VALUE_TYPE_QUANTITY](#value_type_quantity): [Number](TopLevel.Number.md) = 10 | Quantity value type. |
| [VALUE_TYPE_SET_OF_INT](#value_type_set_of_int): [Number](TopLevel.Number.md) = 21 | Set of int value type. |
| [VALUE_TYPE_SET_OF_NUMBER](#value_type_set_of_number): [Number](TopLevel.Number.md) = 22 | Set of Number value type. |
| [VALUE_TYPE_SET_OF_STRING](#value_type_set_of_string): [Number](TopLevel.Number.md) = 23 | Set of String value type. |
| [VALUE_TYPE_STRING](#value_type_string): [Number](TopLevel.Number.md) = 3 | String value type. |
| [VALUE_TYPE_TEXT](#value_type_text): [Number](TopLevel.Number.md) = 4 | Text value type. |

## Property Summary

| Property | Description |
| --- | --- |
| [ID](#id): [String](TopLevel.String.md) `(read-only)` | Returns the ID of the attribute definition. |
| [attributeGroups](#attributegroups): [Collection](dw.util.Collection.md) `(read-only)` | Returns all attribute groups the attribute is assigned to. |
| [defaultValue](#defaultvalue): [ObjectAttributeValueDefinition](dw.object.ObjectAttributeValueDefinition.md) `(read-only)` | Return the default value for the attribute or null if none is defined. |
| [displayName](#displayname): [String](TopLevel.String.md) `(read-only)` | Returns the display name for the attribute, which can be used in the  user interface. |
| [key](#key): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if the attribute represents the primary key of the object. |
| [mandatory](#mandatory): [Boolean](TopLevel.Boolean.md) `(read-only)` | Checks if this attribute is mandatory. |
| [multiValueType](#multivaluetype): [Boolean](TopLevel.Boolean.md) `(read-only)` | <p>Returns `true` if the attribute can have multiple values. |
| [objectTypeDefinition](#objecttypedefinition): [ObjectTypeDefinition](dw.object.ObjectTypeDefinition.md) `(read-only)` | Returns the object type definition in which this attribute is defined. |
| ~~[setValueType](#setvaluetype): [Boolean](TopLevel.Boolean.md)~~ `(read-only)` | Returns `true` if the attribute is of type 'Set of'. |
| [system](#system): [Boolean](TopLevel.Boolean.md) `(read-only)` | Indicates if the attribute is a pre-defined system attribute  or a custom attribute. |
| [unit](#unit): [String](TopLevel.String.md) `(read-only)` | Returns the attribute's unit representation such as  inches for length or pounds for weight. |
| [valueTypeCode](#valuetypecode): [Number](TopLevel.Number.md) `(read-only)` | Returns a code for the data type stored in the attribute. |
| [values](#values): [Collection](dw.util.Collection.md) `(read-only)` | Returns the list of attribute values. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getAttributeGroups](dw.object.ObjectAttributeDefinition.md#getattributegroups)() | Returns all attribute groups the attribute is assigned to. |
| [getDefaultValue](dw.object.ObjectAttributeDefinition.md#getdefaultvalue)() | Return the default value for the attribute or null if none is defined. |
| [getDisplayName](dw.object.ObjectAttributeDefinition.md#getdisplayname)() | Returns the display name for the attribute, which can be used in the  user interface. |
| [getID](dw.object.ObjectAttributeDefinition.md#getid)() | Returns the ID of the attribute definition. |
| [getObjectTypeDefinition](dw.object.ObjectAttributeDefinition.md#getobjecttypedefinition)() | Returns the object type definition in which this attribute is defined. |
| [getUnit](dw.object.ObjectAttributeDefinition.md#getunit)() | Returns the attribute's unit representation such as  inches for length or pounds for weight. |
| [getValueTypeCode](dw.object.ObjectAttributeDefinition.md#getvaluetypecode)() | Returns a code for the data type stored in the attribute. |
| [getValues](dw.object.ObjectAttributeDefinition.md#getvalues)() | Returns the list of attribute values. |
| [isKey](dw.object.ObjectAttributeDefinition.md#iskey)() | Identifies if the attribute represents the primary key of the object. |
| [isMandatory](dw.object.ObjectAttributeDefinition.md#ismandatory)() | Checks if this attribute is mandatory. |
| [isMultiValueType](dw.object.ObjectAttributeDefinition.md#ismultivaluetype)() | <p>Returns `true` if the attribute can have multiple values. |
| ~~[isSetValueType](dw.object.ObjectAttributeDefinition.md#issetvaluetype)()~~ | Returns `true` if the attribute is of type 'Set of'. |
| [isSystem](dw.object.ObjectAttributeDefinition.md#issystem)() | Indicates if the attribute is a pre-defined system attribute  or a custom attribute. |
| [requiresEncoding](dw.object.ObjectAttributeDefinition.md#requiresencoding)() | Returns a boolean flag indicating whether or not values of this attribute  definition should be encoded using the encoding="off" flag in ISML  templates. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### VALUE_TYPE_BOOLEAN

- VALUE_TYPE_BOOLEAN: [Number](TopLevel.Number.md) = 8
  - : Boolean value type.


---

### VALUE_TYPE_DATE

- VALUE_TYPE_DATE: [Number](TopLevel.Number.md) = 6
  - : Date value type.


---

### VALUE_TYPE_DATETIME

- VALUE_TYPE_DATETIME: [Number](TopLevel.Number.md) = 11
  - : Date and Time value type.


---

### VALUE_TYPE_EMAIL

- VALUE_TYPE_EMAIL: [Number](TopLevel.Number.md) = 12
  - : Email value type.


---

### VALUE_TYPE_ENUM_OF_INT

- VALUE_TYPE_ENUM_OF_INT: [Number](TopLevel.Number.md) = 31
  - : Enum of int value type.


---

### VALUE_TYPE_ENUM_OF_STRING

- VALUE_TYPE_ENUM_OF_STRING: [Number](TopLevel.Number.md) = 33
  - : Enum of String value type.


---

### VALUE_TYPE_HTML

- VALUE_TYPE_HTML: [Number](TopLevel.Number.md) = 5
  - : HTML value type.


---

### VALUE_TYPE_IMAGE

- VALUE_TYPE_IMAGE: [Number](TopLevel.Number.md) = 7
  - : Image value type.


---

### VALUE_TYPE_INT

- VALUE_TYPE_INT: [Number](TopLevel.Number.md) = 1
  - : int value type.


---

### VALUE_TYPE_MONEY

- VALUE_TYPE_MONEY: [Number](TopLevel.Number.md) = 9
  - : Money value type.


---

### VALUE_TYPE_NUMBER

- VALUE_TYPE_NUMBER: [Number](TopLevel.Number.md) = 2
  - : Number value type.


---

### VALUE_TYPE_PASSWORD

- VALUE_TYPE_PASSWORD: [Number](TopLevel.Number.md) = 13
  - : Password value type.


---

### VALUE_TYPE_QUANTITY

- VALUE_TYPE_QUANTITY: [Number](TopLevel.Number.md) = 10
  - : Quantity value type.


---

### VALUE_TYPE_SET_OF_INT

- VALUE_TYPE_SET_OF_INT: [Number](TopLevel.Number.md) = 21
  - : Set of int value type.


---

### VALUE_TYPE_SET_OF_NUMBER

- VALUE_TYPE_SET_OF_NUMBER: [Number](TopLevel.Number.md) = 22
  - : Set of Number value type.


---

### VALUE_TYPE_SET_OF_STRING

- VALUE_TYPE_SET_OF_STRING: [Number](TopLevel.Number.md) = 23
  - : Set of String value type.


---

### VALUE_TYPE_STRING

- VALUE_TYPE_STRING: [Number](TopLevel.Number.md) = 3
  - : String value type.


---

### VALUE_TYPE_TEXT

- VALUE_TYPE_TEXT: [Number](TopLevel.Number.md) = 4
  - : Text value type.


---

## Property Details

### ID
- ID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the ID of the attribute definition.


---

### attributeGroups
- attributeGroups: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns all attribute groups the attribute is assigned to.


---

### defaultValue
- defaultValue: [ObjectAttributeValueDefinition](dw.object.ObjectAttributeValueDefinition.md) `(read-only)`
  - : Return the default value for the attribute or null if none is defined.


---

### displayName
- displayName: [String](TopLevel.String.md) `(read-only)`
  - : Returns the display name for the attribute, which can be used in the
      user interface.



---

### key
- key: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if the attribute represents the primary key of the object.


---

### mandatory
- mandatory: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Checks if this attribute is mandatory.


---

### multiValueType
- multiValueType: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : 
      Returns `true` if the attribute can have multiple values.
      
      
      Attributes of the following types are multi-value capable:
      
      
      - [VALUE_TYPE_SET_OF_INT](dw.object.ObjectAttributeDefinition.md#value_type_set_of_int)
      - [VALUE_TYPE_SET_OF_NUMBER](dw.object.ObjectAttributeDefinition.md#value_type_set_of_number)
      - [VALUE_TYPE_SET_OF_STRING](dw.object.ObjectAttributeDefinition.md#value_type_set_of_string)
      
      
      Additionally, attributes of the following types can be multi-value
      enabled:
      
      
      - [VALUE_TYPE_ENUM_OF_INT](dw.object.ObjectAttributeDefinition.md#value_type_enum_of_int)
      - [VALUE_TYPE_ENUM_OF_STRING](dw.object.ObjectAttributeDefinition.md#value_type_enum_of_string)



---

### objectTypeDefinition
- objectTypeDefinition: [ObjectTypeDefinition](dw.object.ObjectTypeDefinition.md) `(read-only)`
  - : Returns the object type definition in which this attribute is defined.


---

### setValueType
- ~~setValueType: [Boolean](TopLevel.Boolean.md)~~ `(read-only)`
  - : Returns `true` if the attribute is of type 'Set of'.

    **Deprecated:**
:::warning
Use [isMultiValueType()](dw.object.ObjectAttributeDefinition.md#ismultivaluetype) instead.
:::

---

### system
- system: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Indicates if the attribute is a pre-defined system attribute
      or a custom attribute.



---

### unit
- unit: [String](TopLevel.String.md) `(read-only)`
  - : Returns the attribute's unit representation such as
      inches for length or pounds for weight. The value returned by
      this method is based on the attribute itself.



---

### valueTypeCode
- valueTypeCode: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns a code for the data type stored in the attribute. See constants
      defined in this class.



---

### values
- values: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns the list of attribute values. In the user interface only the
      values specified in this list should be offered as valid input values.
      
      The collection contains instances of ObjectAttributeValueDefinition.



---

## Method Details

### getAttributeGroups()
- getAttributeGroups(): [Collection](dw.util.Collection.md)
  - : Returns all attribute groups the attribute is assigned to.

    **Returns:**
    - all attribute groups the attribute is assigned to.


---

### getDefaultValue()
- getDefaultValue(): [ObjectAttributeValueDefinition](dw.object.ObjectAttributeValueDefinition.md)
  - : Return the default value for the attribute or null if none is defined.

    **Returns:**
    - the default value for the attribute or null if none is defined.


---

### getDisplayName()
- getDisplayName(): [String](TopLevel.String.md)
  - : Returns the display name for the attribute, which can be used in the
      user interface.


    **Returns:**
    - the display name for the attribute, which can be used in the
      user interface.



---

### getID()
- getID(): [String](TopLevel.String.md)
  - : Returns the ID of the attribute definition.

    **Returns:**
    - the ID of the attribute definition.


---

### getObjectTypeDefinition()
- getObjectTypeDefinition(): [ObjectTypeDefinition](dw.object.ObjectTypeDefinition.md)
  - : Returns the object type definition in which this attribute is defined.

    **Returns:**
    - the object type definition in which this attribute is defined.


---

### getUnit()
- getUnit(): [String](TopLevel.String.md)
  - : Returns the attribute's unit representation such as
      inches for length or pounds for weight. The value returned by
      this method is based on the attribute itself.


    **Returns:**
    - the attribute's unit representation such as
      inches for length or pounds for weight.



---

### getValueTypeCode()
- getValueTypeCode(): [Number](TopLevel.Number.md)
  - : Returns a code for the data type stored in the attribute. See constants
      defined in this class.


    **Returns:**
    - a code for the data type stored in the attribute. See constants
      defined in this class.



---

### getValues()
- getValues(): [Collection](dw.util.Collection.md)
  - : Returns the list of attribute values. In the user interface only the
      values specified in this list should be offered as valid input values.
      
      The collection contains instances of ObjectAttributeValueDefinition.


    **Returns:**
    - a collection of ObjectAttributeValueDefinition instances representing
      the list of attribute values, or null if no values are specified.



---

### isKey()
- isKey(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if the attribute represents the primary key of the object.

    **Returns:**
    - true if the attribute represents the primary key, false otherwise.


---

### isMandatory()
- isMandatory(): [Boolean](TopLevel.Boolean.md)
  - : Checks if this attribute is mandatory.

    **Returns:**
    - true, if this attribute is mandatory


---

### isMultiValueType()
- isMultiValueType(): [Boolean](TopLevel.Boolean.md)
  - : 
      Returns `true` if the attribute can have multiple values.
      
      
      Attributes of the following types are multi-value capable:
      
      
      - [VALUE_TYPE_SET_OF_INT](dw.object.ObjectAttributeDefinition.md#value_type_set_of_int)
      - [VALUE_TYPE_SET_OF_NUMBER](dw.object.ObjectAttributeDefinition.md#value_type_set_of_number)
      - [VALUE_TYPE_SET_OF_STRING](dw.object.ObjectAttributeDefinition.md#value_type_set_of_string)
      
      
      Additionally, attributes of the following types can be multi-value
      enabled:
      
      
      - [VALUE_TYPE_ENUM_OF_INT](dw.object.ObjectAttributeDefinition.md#value_type_enum_of_int)
      - [VALUE_TYPE_ENUM_OF_STRING](dw.object.ObjectAttributeDefinition.md#value_type_enum_of_string)


    **Returns:**
    - `true` if attributes can have multiple values,
      otherwise `false`



---

### isSetValueType()
- ~~isSetValueType(): [Boolean](TopLevel.Boolean.md)~~
  - : Returns `true` if the attribute is of type 'Set of'.

    **Deprecated:**
:::warning
Use [isMultiValueType()](dw.object.ObjectAttributeDefinition.md#ismultivaluetype) instead.
:::

---

### isSystem()
- isSystem(): [Boolean](TopLevel.Boolean.md)
  - : Indicates if the attribute is a pre-defined system attribute
      or a custom attribute.


    **Returns:**
    - true if the the attribute is a pre-defined system attribute,
      false if it is a custom attribute.



---

### requiresEncoding()
- requiresEncoding(): [Boolean](TopLevel.Boolean.md)
  - : Returns a boolean flag indicating whether or not values of this attribute
      definition should be encoded using the encoding="off" flag in ISML
      templates.


    **Returns:**
    - a boolean flag indicating whether or not values of this attribute
      definition should be encoded using the encoding="off" flag in ISML
      templates.



---

<!-- prettier-ignore-end -->
