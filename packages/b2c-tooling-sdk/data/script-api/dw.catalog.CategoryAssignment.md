<!-- prettier-ignore-start -->
# Class CategoryAssignment

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)
      - [dw.catalog.CategoryAssignment](dw.catalog.CategoryAssignment.md)

Represents a category assignment in Commerce Cloud Digital.


## Property Summary

| Property | Description |
| --- | --- |
| [calloutMsg](#calloutmsg): [MarkupText](dw.content.MarkupText.md) `(read-only)` | Returns the category assignment's callout message in the current locale. |
| [category](#category): [Category](dw.catalog.Category.md) `(read-only)` | Returns the category to which this category assignment is bound. |
| [image](#image): [MediaFile](dw.content.MediaFile.md) `(read-only)` | Returns the category assignment's image. |
| [longDescription](#longdescription): [MarkupText](dw.content.MarkupText.md) `(read-only)` | Returns the category assignment's long description in the current locale. |
| [name](#name): [String](TopLevel.String.md) `(read-only)` | Returns the name of the category assignment in the current locale. |
| [product](#product): [Product](dw.catalog.Product.md) `(read-only)` | Returns the product to which this category assignment is bound. |
| [shortDescription](#shortdescription): [MarkupText](dw.content.MarkupText.md) `(read-only)` | Returns the category assignment's short description in the current locale. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getCalloutMsg](dw.catalog.CategoryAssignment.md#getcalloutmsg)() | Returns the category assignment's callout message in the current locale. |
| [getCategory](dw.catalog.CategoryAssignment.md#getcategory)() | Returns the category to which this category assignment is bound. |
| [getImage](dw.catalog.CategoryAssignment.md#getimage)() | Returns the category assignment's image. |
| [getLongDescription](dw.catalog.CategoryAssignment.md#getlongdescription)() | Returns the category assignment's long description in the current locale. |
| [getName](dw.catalog.CategoryAssignment.md#getname)() | Returns the name of the category assignment in the current locale. |
| [getProduct](dw.catalog.CategoryAssignment.md#getproduct)() | Returns the product to which this category assignment is bound. |
| [getShortDescription](dw.catalog.CategoryAssignment.md#getshortdescription)() | Returns the category assignment's short description in the current locale. |

### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### calloutMsg
- calloutMsg: [MarkupText](dw.content.MarkupText.md) `(read-only)`
  - : Returns the category assignment's callout message in the current locale.


---

### category
- category: [Category](dw.catalog.Category.md) `(read-only)`
  - : Returns the category to which this category assignment is bound.


---

### image
- image: [MediaFile](dw.content.MediaFile.md) `(read-only)`
  - : Returns the category assignment's image.


---

### longDescription
- longDescription: [MarkupText](dw.content.MarkupText.md) `(read-only)`
  - : Returns the category assignment's long description in the current locale.


---

### name
- name: [String](TopLevel.String.md) `(read-only)`
  - : Returns the name of the category assignment in the current locale.


---

### product
- product: [Product](dw.catalog.Product.md) `(read-only)`
  - : Returns the product to which this category assignment is bound.


---

### shortDescription
- shortDescription: [MarkupText](dw.content.MarkupText.md) `(read-only)`
  - : Returns the category assignment's short description in the current locale.


---

## Method Details

### getCalloutMsg()
- getCalloutMsg(): [MarkupText](dw.content.MarkupText.md)
  - : Returns the category assignment's callout message in the current locale.

    **Returns:**
    - the category assignment's callout message in the current locale, or null if it
              wasn't found.



---

### getCategory()
- getCategory(): [Category](dw.catalog.Category.md)
  - : Returns the category to which this category assignment is bound.

    **Returns:**
    - The category to which this category assignment is bound.


---

### getImage()
- getImage(): [MediaFile](dw.content.MediaFile.md)
  - : Returns the category assignment's image.

    **Returns:**
    - the category assignment's image.


---

### getLongDescription()
- getLongDescription(): [MarkupText](dw.content.MarkupText.md)
  - : Returns the category assignment's long description in the current locale.

    **Returns:**
    - The category assignment's long description in the current locale, or null if it
              wasn't found.



---

### getName()
- getName(): [String](TopLevel.String.md)
  - : Returns the name of the category assignment in the current locale.

    **Returns:**
    - The name of the category assignment for the current locale, or null if it
              wasn't found.



---

### getProduct()
- getProduct(): [Product](dw.catalog.Product.md)
  - : Returns the product to which this category assignment is bound.

    **Returns:**
    - The product to which this category assignment is bound.


---

### getShortDescription()
- getShortDescription(): [MarkupText](dw.content.MarkupText.md)
  - : Returns the category assignment's short description in the current locale.

    **Returns:**
    - the category assignment's short description in the current locale, or null if it
              wasn't found.



---

<!-- prettier-ignore-end -->
