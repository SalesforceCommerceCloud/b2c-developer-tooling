<!-- prettier-ignore-start -->
# Class ObjectAttributeGroup

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.ObjectAttributeGroup](dw.object.ObjectAttributeGroup.md)

Represents a group of object attributes.


## Property Summary

| Property | Description |
| --- | --- |
| [ID](#id): [String](TopLevel.String.md) `(read-only)` | Returns the ID of this group. |
| [attributeDefinitions](#attributedefinitions): [Collection](dw.util.Collection.md) `(read-only)` | Returns all attribute definitions for this group. |
| [description](#description): [String](TopLevel.String.md) `(read-only)` | Returns the description of this group in the current locale. |
| [displayName](#displayname): [String](TopLevel.String.md) `(read-only)` | Returns the display name of this group. |
| [objectTypeDefinition](#objecttypedefinition): [ObjectTypeDefinition](dw.object.ObjectTypeDefinition.md) `(read-only)` | Returns the object type definition to which this attribute group  belongs. |
| [system](#system): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if this is an sytem or a custom attribute group. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getAttributeDefinitions](dw.object.ObjectAttributeGroup.md#getattributedefinitions)() | Returns all attribute definitions for this group. |
| [getDescription](dw.object.ObjectAttributeGroup.md#getdescription)() | Returns the description of this group in the current locale. |
| [getDisplayName](dw.object.ObjectAttributeGroup.md#getdisplayname)() | Returns the display name of this group. |
| [getID](dw.object.ObjectAttributeGroup.md#getid)() | Returns the ID of this group. |
| [getObjectTypeDefinition](dw.object.ObjectAttributeGroup.md#getobjecttypedefinition)() | Returns the object type definition to which this attribute group  belongs. |
| [isSystem](dw.object.ObjectAttributeGroup.md#issystem)() | Identifies if this is an sytem or a custom attribute group. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### ID
- ID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the ID of this group.


---

### attributeDefinitions
- attributeDefinitions: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns all attribute definitions for this group. The collection
      may contain both system attribute definition as well as custom
      attribute definitions.



---

### description
- description: [String](TopLevel.String.md) `(read-only)`
  - : Returns the description of this group in the current locale.


---

### displayName
- displayName: [String](TopLevel.String.md) `(read-only)`
  - : Returns the display name of this group.


---

### objectTypeDefinition
- objectTypeDefinition: [ObjectTypeDefinition](dw.object.ObjectTypeDefinition.md) `(read-only)`
  - : Returns the object type definition to which this attribute group
      belongs.



---

### system
- system: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if this is an sytem or a custom attribute group. A system
      attribute group is pre-defined and can not be deleted.



---

## Method Details

### getAttributeDefinitions()
- getAttributeDefinitions(): [Collection](dw.util.Collection.md)
  - : Returns all attribute definitions for this group. The collection
      may contain both system attribute definition as well as custom
      attribute definitions.


    **Returns:**
    - all attribute definitions for this group.


---

### getDescription()
- getDescription(): [String](TopLevel.String.md)
  - : Returns the description of this group in the current locale.

    **Returns:**
    - the display name of this group.


---

### getDisplayName()
- getDisplayName(): [String](TopLevel.String.md)
  - : Returns the display name of this group.

    **Returns:**
    - the display name of this group.


---

### getID()
- getID(): [String](TopLevel.String.md)
  - : Returns the ID of this group.

    **Returns:**
    - the ID of this group.


---

### getObjectTypeDefinition()
- getObjectTypeDefinition(): [ObjectTypeDefinition](dw.object.ObjectTypeDefinition.md)
  - : Returns the object type definition to which this attribute group
      belongs.


    **Returns:**
    - the object type definition to which this attribute group
      belongs.



---

### isSystem()
- isSystem(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if this is an sytem or a custom attribute group. A system
      attribute group is pre-defined and can not be deleted.


    **Returns:**
    - true if this is a system attribute group, false otherwise.


---

<!-- prettier-ignore-end -->
