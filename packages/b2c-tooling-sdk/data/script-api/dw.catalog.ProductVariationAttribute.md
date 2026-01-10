<!-- prettier-ignore-start -->
# Class ProductVariationAttribute

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.catalog.ProductVariationAttribute](dw.catalog.ProductVariationAttribute.md)

Represents a product variation attribute


## Property Summary

| Property | Description |
| --- | --- |
| [ID](#id): [String](TopLevel.String.md) `(read-only)` | Returns the ID of the product variation attribute. |
| [attributeID](#attributeid): [String](TopLevel.String.md) `(read-only)` | Returns the ID of the product attribute defintion related to   this variation attribute. |
| [displayName](#displayname): [String](TopLevel.String.md) `(read-only)` | Returns the display name for the product variation attribute, which can be used in the  user interface. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getAttributeID](dw.catalog.ProductVariationAttribute.md#getattributeid)() | Returns the ID of the product attribute defintion related to   this variation attribute. |
| [getDisplayName](dw.catalog.ProductVariationAttribute.md#getdisplayname)() | Returns the display name for the product variation attribute, which can be used in the  user interface. |
| [getID](dw.catalog.ProductVariationAttribute.md#getid)() | Returns the ID of the product variation attribute. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### ID
- ID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the ID of the product variation attribute.


---

### attributeID
- attributeID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the ID of the product attribute defintion related to 
      this variation attribute.  This ID matches the
      value returned by [ObjectAttributeDefinition.getID()](dw.object.ObjectAttributeDefinition.md#getid)  
      for the appropriate product attribute definition.
      This ID is generally different than the ID returned by 
      [getID()](dw.catalog.ProductVariationAttribute.md#getid).



---

### displayName
- displayName: [String](TopLevel.String.md) `(read-only)`
  - : Returns the display name for the product variation attribute, which can be used in the
      user interface.



---

## Method Details

### getAttributeID()
- getAttributeID(): [String](TopLevel.String.md)
  - : Returns the ID of the product attribute defintion related to 
      this variation attribute.  This ID matches the
      value returned by [ObjectAttributeDefinition.getID()](dw.object.ObjectAttributeDefinition.md#getid)  
      for the appropriate product attribute definition.
      This ID is generally different than the ID returned by 
      [getID()](dw.catalog.ProductVariationAttribute.md#getid).


    **Returns:**
    - the ID of the product attribute definition of this variation
      attribute.



---

### getDisplayName()
- getDisplayName(): [String](TopLevel.String.md)
  - : Returns the display name for the product variation attribute, which can be used in the
      user interface.


    **Returns:**
    - the display name for the product variation attribute, which can be used in the
      user interface.



---

### getID()
- getID(): [String](TopLevel.String.md)
  - : Returns the ID of the product variation attribute.

    **Returns:**
    - the ID of the product variation attribute.


---

<!-- prettier-ignore-end -->
