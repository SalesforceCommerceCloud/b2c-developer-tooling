<!-- prettier-ignore-start -->
# Class ProductVariationAttributeValue

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.catalog.ProductVariationAttributeValue](dw.catalog.ProductVariationAttributeValue.md)

Represents a product variation attribute


## Property Summary

| Property | Description |
| --- | --- |
| [ID](#id): [String](TopLevel.String.md) `(read-only)` | Returns the ID of the product variation attribute value. |
| [description](#description): [String](TopLevel.String.md) `(read-only)` | Returns the description of the product variation attribute value in the current locale. |
| [displayValue](#displayvalue): [String](TopLevel.String.md) `(read-only)` | Returns the display value for the product variation attribute value, which can be used in the  user interface. |
| [value](#value): [Object](TopLevel.Object.md) `(read-only)` | Returns the value for the product variation attribute value. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [equals](dw.catalog.ProductVariationAttributeValue.md#equalsobject)([Object](TopLevel.Object.md)) | Returns true if the specified object is equal to this object. |
| [getDescription](dw.catalog.ProductVariationAttributeValue.md#getdescription)() | Returns the description of the product variation attribute value in the current locale. |
| [getDisplayValue](dw.catalog.ProductVariationAttributeValue.md#getdisplayvalue)() | Returns the display value for the product variation attribute value, which can be used in the  user interface. |
| [getID](dw.catalog.ProductVariationAttributeValue.md#getid)() | Returns the ID of the product variation attribute value. |
| [getImage](dw.catalog.ProductVariationAttributeValue.md#getimagestring)([String](TopLevel.String.md)) | The method calls [getImages(String)](dw.catalog.ProductVariationAttributeValue.md#getimagesstring) and returns the first image  of the list. |
| [getImage](dw.catalog.ProductVariationAttributeValue.md#getimagestring-number)([String](TopLevel.String.md), [Number](TopLevel.Number.md)) | The method calls [getImages(String)](dw.catalog.ProductVariationAttributeValue.md#getimagesstring) and returns the image at  the specific index. |
| [getImages](dw.catalog.ProductVariationAttributeValue.md#getimagesstring)([String](TopLevel.String.md)) | Returns all images that match the given view type and have the variant  value of this value, which is typically the 'color' attribute. |
| [getValue](dw.catalog.ProductVariationAttributeValue.md#getvalue)() | Returns the value for the product variation attribute value. |
| [hashCode](dw.catalog.ProductVariationAttributeValue.md#hashcode)() | Calculates the hash code for a product variation attribute value. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### ID
- ID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the ID of the product variation attribute value.


---

### description
- description: [String](TopLevel.String.md) `(read-only)`
  - : Returns the description of the product variation attribute value in the current locale.


---

### displayValue
- displayValue: [String](TopLevel.String.md) `(read-only)`
  - : Returns the display value for the product variation attribute value, which can be used in the
      user interface.



---

### value
- value: [Object](TopLevel.Object.md) `(read-only)`
  - : Returns the value for the product variation attribute value.


---

## Method Details

### equals(Object)
- equals(obj: [Object](TopLevel.Object.md)): [Boolean](TopLevel.Boolean.md)
  - : Returns true if the specified object is equal to this object.

    **Parameters:**
    - obj - the object to test.

    **Returns:**
    - true if the specified object is equal to this object.


---

### getDescription()
- getDescription(): [String](TopLevel.String.md)
  - : Returns the description of the product variation attribute value in the current locale.

    **Returns:**
    - the description of the product variation attribute value in the current locale,
              or null if it wasn't found.



---

### getDisplayValue()
- getDisplayValue(): [String](TopLevel.String.md)
  - : Returns the display value for the product variation attribute value, which can be used in the
      user interface.


    **Returns:**
    - the display value for the product variation attribute value, which can be used in the
      user interface.



---

### getID()
- getID(): [String](TopLevel.String.md)
  - : Returns the ID of the product variation attribute value.

    **Returns:**
    - the ID of the product variation attribute value.


---

### getImage(String)
- getImage(viewtype: [String](TopLevel.String.md)): [MediaFile](dw.content.MediaFile.md)
  - : The method calls [getImages(String)](dw.catalog.ProductVariationAttributeValue.md#getimagesstring) and returns the first image
      of the list. The method is specifically built for handling color
      swatches in an apparel site.
      
      If no images are defined for this variant and specified view type, then
      the first image of the master product images for that view type is
      returned. If no master product images are defined, the method returns
      null.


    **Parameters:**
    - viewtype - the view type annotated to image

    **Returns:**
    - the MediaFile or null

    **Throws:**
    - NullArgumentException - if viewtype is null


---

### getImage(String, Number)
- getImage(viewtype: [String](TopLevel.String.md), index: [Number](TopLevel.Number.md)): [MediaFile](dw.content.MediaFile.md)
  - : The method calls [getImages(String)](dw.catalog.ProductVariationAttributeValue.md#getimagesstring) and returns the image at
      the specific index.
      
      If images are defined for this view type and variant, but not for
      specified index, the method returns null.
      
      If no images are defined for this variant and specified view type, the
      image at the specified index of the master product images is returned. If
      no master product image for specified index is defined, the method
      returns null.


    **Parameters:**
    - viewtype - the view type annotated to image
    - index - the index number of the image within image list

    **Returns:**
    - the MediaFile or null

    **Throws:**
    - NullArgumentException - if viewtype is null


---

### getImages(String)
- getImages(viewtype: [String](TopLevel.String.md)): [List](dw.util.List.md)
  - : Returns all images that match the given view type and have the variant
      value of this value, which is typically the 'color' attribute. The images
      are returned in the order of their index number ascending.
      
      If no images are defined for this variant, then the images of the master
      for that view type are returned.


    **Parameters:**
    - viewtype - the view type annotated to images

    **Returns:**
    - a list of MediaFile objects, possibly empty

    **Throws:**
    - NullArgumentException - if viewtype is null


---

### getValue()
- getValue(): [Object](TopLevel.Object.md)
  - : Returns the value for the product variation attribute value.

    **Returns:**
    - the value for the product variation attribute value.


---

### hashCode()
- hashCode(): [Number](TopLevel.Number.md)
  - : Calculates the hash code for a product variation attribute value.

    **Returns:**
    - the hash code for a product variation attribute value.


---

<!-- prettier-ignore-end -->
