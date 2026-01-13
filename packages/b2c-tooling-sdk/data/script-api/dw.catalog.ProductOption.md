<!-- prettier-ignore-start -->
# Class ProductOption

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)
      - [dw.catalog.ProductOption](dw.catalog.ProductOption.md)

Represents a product option.


## Property Summary

| Property | Description |
| --- | --- |
| [ID](#id): [String](TopLevel.String.md) `(read-only)` | Returns the product option ID. |
| [defaultValue](#defaultvalue): [ProductOptionValue](dw.catalog.ProductOptionValue.md) `(read-only)` | Returns the default value for the product option. |
| [description](#description): [String](TopLevel.String.md) `(read-only)` | Returns the product option's short description in the current locale. |
| [displayName](#displayname): [String](TopLevel.String.md) `(read-only)` | Returns the product option's display name in the current locale. |
| [htmlName](#htmlname): [String](TopLevel.String.md) `(read-only)` | Returns an HTML representation of the option id. |
| [image](#image): [MediaFile](dw.content.MediaFile.md) `(read-only)` | Returns the product option's image. |
| [optionValues](#optionvalues): [Collection](dw.util.Collection.md) `(read-only)` | Returns a collection containing the product option values. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getDefaultValue](dw.catalog.ProductOption.md#getdefaultvalue)() | Returns the default value for the product option. |
| [getDescription](dw.catalog.ProductOption.md#getdescription)() | Returns the product option's short description in the current locale. |
| [getDisplayName](dw.catalog.ProductOption.md#getdisplayname)() | Returns the product option's display name in the current locale. |
| [getHtmlName](dw.catalog.ProductOption.md#gethtmlname)() | Returns an HTML representation of the option id. |
| [getHtmlName](dw.catalog.ProductOption.md#gethtmlnamestring)([String](TopLevel.String.md)) | Returns an HTML representation of the option id with the custom prefix. |
| [getID](dw.catalog.ProductOption.md#getid)() | Returns the product option ID. |
| [getImage](dw.catalog.ProductOption.md#getimage)() | Returns the product option's image. |
| [getOptionValues](dw.catalog.ProductOption.md#getoptionvalues)() | Returns a collection containing the product option values. |

### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### ID
- ID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the product option ID.


---

### defaultValue
- defaultValue: [ProductOptionValue](dw.catalog.ProductOptionValue.md) `(read-only)`
  - : Returns the default value for the product option.


---

### description
- description: [String](TopLevel.String.md) `(read-only)`
  - : Returns the product option's short description in the current locale.


---

### displayName
- displayName: [String](TopLevel.String.md) `(read-only)`
  - : Returns the product option's display name in the current locale.


---

### htmlName
- htmlName: [String](TopLevel.String.md) `(read-only)`
  - : Returns an HTML representation of the option id.


---

### image
- image: [MediaFile](dw.content.MediaFile.md) `(read-only)`
  - : Returns the product option's image.


---

### optionValues
- optionValues: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns a collection containing the product option values.


---

## Method Details

### getDefaultValue()
- getDefaultValue(): [ProductOptionValue](dw.catalog.ProductOptionValue.md)
  - : Returns the default value for the product option.

    **Returns:**
    - the object for the relation 'defaultValue'


---

### getDescription()
- getDescription(): [String](TopLevel.String.md)
  - : Returns the product option's short description in the current locale.

    **Returns:**
    - The value of the short description in the current locale,
                   or null if it wasn't found.



---

### getDisplayName()
- getDisplayName(): [String](TopLevel.String.md)
  - : Returns the product option's display name in the current locale.

    **Returns:**
    - The value of the display name in the current locale,
                   or null if it wasn't found.



---

### getHtmlName()
- getHtmlName(): [String](TopLevel.String.md)
  - : Returns an HTML representation of the option id.

    **Returns:**
    - an HTML representation of the option id.


---

### getHtmlName(String)
- getHtmlName(prefix: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Returns an HTML representation of the option id with the custom prefix.

    **Parameters:**
    - prefix - a custom prefix for the html name.

    **Returns:**
    - an HTML representation of the option id.


---

### getID()
- getID(): [String](TopLevel.String.md)
  - : Returns the product option ID.

    **Returns:**
    - the product option identifier.


---

### getImage()
- getImage(): [MediaFile](dw.content.MediaFile.md)
  - : Returns the product option's image.

    **Returns:**
    - the product option's image.


---

### getOptionValues()
- getOptionValues(): [Collection](dw.util.Collection.md)
  - : Returns a collection containing the product option values.

    **Returns:**
    - a collection containing the product option values.


---

<!-- prettier-ignore-end -->
