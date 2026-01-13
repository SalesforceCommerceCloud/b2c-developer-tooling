<!-- prettier-ignore-start -->
# Class ProductOptionValue

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)
      - [dw.catalog.ProductOptionValue](dw.catalog.ProductOptionValue.md)

Represents the value of a product option.


## Property Summary

| Property | Description |
| --- | --- |
| [ID](#id): [String](TopLevel.String.md) `(read-only)` | Returns the product option value's ID. |
| [description](#description): [String](TopLevel.String.md) `(read-only)` | Returns the the product option value's description  in the current locale. |
| [displayValue](#displayvalue): [String](TopLevel.String.md) `(read-only)` | Returns the the product option value's display name  in the current locale. |
| [productIDModifier](#productidmodifier): [String](TopLevel.String.md) `(read-only)` | Returns the product option value's product ID modifier which  can be used to build the SKU for the actual product. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getDescription](dw.catalog.ProductOptionValue.md#getdescription)() | Returns the the product option value's description  in the current locale. |
| [getDisplayValue](dw.catalog.ProductOptionValue.md#getdisplayvalue)() | Returns the the product option value's display name  in the current locale. |
| [getID](dw.catalog.ProductOptionValue.md#getid)() | Returns the product option value's ID. |
| [getProductIDModifier](dw.catalog.ProductOptionValue.md#getproductidmodifier)() | Returns the product option value's product ID modifier which  can be used to build the SKU for the actual product. |

### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### ID
- ID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the product option value's ID.


---

### description
- description: [String](TopLevel.String.md) `(read-only)`
  - : Returns the the product option value's description
      in the current locale.



---

### displayValue
- displayValue: [String](TopLevel.String.md) `(read-only)`
  - : Returns the the product option value's display name
      in the current locale.



---

### productIDModifier
- productIDModifier: [String](TopLevel.String.md) `(read-only)`
  - : Returns the product option value's product ID modifier which
      can be used to build the SKU for the actual product.



---

## Method Details

### getDescription()
- getDescription(): [String](TopLevel.String.md)
  - : Returns the the product option value's description
      in the current locale.


    **Returns:**
    - The value of the product option value's description
      in the current locale, or null if it wasn't found.



---

### getDisplayValue()
- getDisplayValue(): [String](TopLevel.String.md)
  - : Returns the the product option value's display name
      in the current locale.


    **Returns:**
    - The value of the product option value's display name
      in the current locale, or null if it wasn't found.



---

### getID()
- getID(): [String](TopLevel.String.md)
  - : Returns the product option value's ID.

    **Returns:**
    - the product option value's ID.


---

### getProductIDModifier()
- getProductIDModifier(): [String](TopLevel.String.md)
  - : Returns the product option value's product ID modifier which
      can be used to build the SKU for the actual product.


    **Returns:**
    - the product option value's product ID modifier which
      can be used to build the SKU for the actual product.



---

<!-- prettier-ignore-end -->
