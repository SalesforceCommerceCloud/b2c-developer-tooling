<!-- prettier-ignore-start -->
# Class ObjectTypeDefinition

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.ObjectTypeDefinition](dw.object.ObjectTypeDefinition.md)

The class provides access to the meta data of a system object or custom
object.  A short example should suffice to demonstrate how this metadata can
be used in a script:


```
var co : CustomObject = CustomObjectMgr.getCustomObject("sample", "MyCustomObject");

// get the object type definition
var typeDef : ObjectTypeDefinition = co.describe();
// get the custom object attribute definition for name "enumIntValue"
var attrDef : ObjectAttributeDefinition = typeDef.getCustomAttributeDefinition( "enumIntValue" );
// get the collection of object attribute value definitions
var valueDefs : Collection = attrDef.getValues();

// return function if there are no object attribute value definitions
if(valueDefs.isEmpty())
{
    return;
}

var displayValue : String;
// loop over object attribute value definitions collection
for each ( var valueDef : ObjectAttributeValueDefinition in valueDefs )
{
    if( valueDef.getValue() == co.custom.intValue )
    {
        displayValue = valueDef.getDisplayValue();
        break;
    }
}
```



## Property Summary

| Property | Description |
| --- | --- |
| [ID](#id): [String](TopLevel.String.md) `(read-only)` | Returns the type id of the business objects. |
| [attributeDefinitions](#attributedefinitions): [Collection](dw.util.Collection.md) `(read-only)` | Returns a collection of all declared attributes for the object. |
| [attributeGroups](#attributegroups): [Collection](dw.util.Collection.md) `(read-only)` | Returns a collection of all declared attribute groups. |
| [displayName](#displayname): [String](TopLevel.String.md) `(read-only)` | Returns the display name of the definition, which can be used in the  user interface. |
| [system](#system): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if this object definition is for a system type or a custom  type. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getAttributeDefinitions](dw.object.ObjectTypeDefinition.md#getattributedefinitions)() | Returns a collection of all declared attributes for the object. |
| [getAttributeGroup](dw.object.ObjectTypeDefinition.md#getattributegroupstring)([String](TopLevel.String.md)) | Returns the attribute group with the given name within this object  type definition. |
| [getAttributeGroups](dw.object.ObjectTypeDefinition.md#getattributegroups)() | Returns a collection of all declared attribute groups. |
| [getCustomAttributeDefinition](dw.object.ObjectTypeDefinition.md#getcustomattributedefinitionstring)([String](TopLevel.String.md)) | Returns the custom attribute definition with the given name. |
| [getDisplayName](dw.object.ObjectTypeDefinition.md#getdisplayname)() | Returns the display name of the definition, which can be used in the  user interface. |
| [getID](dw.object.ObjectTypeDefinition.md#getid)() | Returns the type id of the business objects. |
| [getSystemAttributeDefinition](dw.object.ObjectTypeDefinition.md#getsystemattributedefinitionstring)([String](TopLevel.String.md)) | Returns the system attribute definition with the given name. |
| [isSystem](dw.object.ObjectTypeDefinition.md#issystem)() | Identifies if this object definition is for a system type or a custom  type. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### ID
- ID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the type id of the business objects.


---

### attributeDefinitions
- attributeDefinitions: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns a collection of all declared attributes for the object.
      The collection contains both system and custom attributes. There might
      be system and custom attribute with identical names. So the name of the
      attribute is not a uniqueness criteria. Additional the isCustom() flag
      must be checked.



---

### attributeGroups
- attributeGroups: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns a collection of all declared attribute groups. A attribute group
      is a collection of attribute, which are typically displayed together as
      a visual group.



---

### displayName
- displayName: [String](TopLevel.String.md) `(read-only)`
  - : Returns the display name of the definition, which can be used in the
      user interface.



---

### system
- system: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if this object definition is for a system type or a custom
      type.



---

## Method Details

### getAttributeDefinitions()
- getAttributeDefinitions(): [Collection](dw.util.Collection.md)
  - : Returns a collection of all declared attributes for the object.
      The collection contains both system and custom attributes. There might
      be system and custom attribute with identical names. So the name of the
      attribute is not a uniqueness criteria. Additional the isCustom() flag
      must be checked.


    **Returns:**
    - a collection of all declared attributes for the object.


---

### getAttributeGroup(String)
- getAttributeGroup(name: [String](TopLevel.String.md)): [ObjectAttributeGroup](dw.object.ObjectAttributeGroup.md)
  - : Returns the attribute group with the given name within this object
      type definition.


    **Parameters:**
    - name - The name of the attribute scope to return.

    **Returns:**
    - The matching attribute scope or `null` if no such
      scope exists.



---

### getAttributeGroups()
- getAttributeGroups(): [Collection](dw.util.Collection.md)
  - : Returns a collection of all declared attribute groups. A attribute group
      is a collection of attribute, which are typically displayed together as
      a visual group.


    **Returns:**
    - a collection of all declared attribute groups.


---

### getCustomAttributeDefinition(String)
- getCustomAttributeDefinition(name: [String](TopLevel.String.md)): [ObjectAttributeDefinition](dw.object.ObjectAttributeDefinition.md)
  - : Returns the custom attribute definition with the given name. The method
      returns null if no custom attribute is defined with that name.


    **Parameters:**
    - name - The unique name of the custom attribute definition within the  object type.

    **Returns:**
    - The matching attribute definition or `null` in
      case no such definition exists.



---

### getDisplayName()
- getDisplayName(): [String](TopLevel.String.md)
  - : Returns the display name of the definition, which can be used in the
      user interface.


    **Returns:**
    - the display name of the definition, which can be used in the
      user interface.



---

### getID()
- getID(): [String](TopLevel.String.md)
  - : Returns the type id of the business objects.

    **Returns:**
    - the type id of the business objects.


---

### getSystemAttributeDefinition(String)
- getSystemAttributeDefinition(name: [String](TopLevel.String.md)): [ObjectAttributeDefinition](dw.object.ObjectAttributeDefinition.md)
  - : Returns the system attribute definition with the given name. The method
      returns null if no system attribute is defined with that name. Only
      system objects have system attributes. A CustomObject has no system attributes
      and so the method will always return null for a CustomObject.


    **Parameters:**
    - name - The unique name of the custom attribute definition within the  object type.

    **Returns:**
    - The matching attribute definition or `null` in
      case no such definition exists.



---

### isSystem()
- isSystem(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if this object definition is for a system type or a custom
      type.


    **Returns:**
    - true if this object definition is for a system type, false otherwise.


---

<!-- prettier-ignore-end -->
