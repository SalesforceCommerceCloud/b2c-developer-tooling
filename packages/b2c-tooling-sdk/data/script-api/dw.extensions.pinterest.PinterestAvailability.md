<!-- prettier-ignore-start -->
# Class PinterestAvailability

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.extensions.pinterest.PinterestAvailability](dw.extensions.pinterest.PinterestAvailability.md)

Represents a row in the Pinterest availability feed export file.


## Property Summary

| Property | Description |
| --- | --- |
| [ID](#id): [String](TopLevel.String.md) `(read-only)` | Returns the ID of the Pinterest product. |
| [availability](#availability): [String](TopLevel.String.md) | Returns the availability of the Pinterest product. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getAvailability](dw.extensions.pinterest.PinterestAvailability.md#getavailability)() | Returns the availability of the Pinterest product. |
| [getID](dw.extensions.pinterest.PinterestAvailability.md#getid)() | Returns the ID of the Pinterest product. |
| [setAvailability](dw.extensions.pinterest.PinterestAvailability.md#setavailabilitystring)([String](TopLevel.String.md)) | Sets the availability of the Pinterest product. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### ID
- ID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the ID of the Pinterest product. This is the same as the ID of the Demandware product.


---

### availability
- availability: [String](TopLevel.String.md)
  - : Returns the availability of the Pinterest product. Possible values are
      [PinterestProduct.AVAILABILITY_IN_STOCK](dw.extensions.pinterest.PinterestProduct.md#availability_in_stock) or
      [PinterestProduct.AVAILABILITY_OUT_OF_STOCK](dw.extensions.pinterest.PinterestProduct.md#availability_out_of_stock).



---

## Method Details

### getAvailability()
- getAvailability(): [String](TopLevel.String.md)
  - : Returns the availability of the Pinterest product. Possible values are
      [PinterestProduct.AVAILABILITY_IN_STOCK](dw.extensions.pinterest.PinterestProduct.md#availability_in_stock) or
      [PinterestProduct.AVAILABILITY_OUT_OF_STOCK](dw.extensions.pinterest.PinterestProduct.md#availability_out_of_stock).



---

### getID()
- getID(): [String](TopLevel.String.md)
  - : Returns the ID of the Pinterest product. This is the same as the ID of the Demandware product.

    **Returns:**
    - product ID


---

### setAvailability(String)
- setAvailability(availability: [String](TopLevel.String.md)): void
  - : Sets the availability of the Pinterest product. Possible values are
      [PinterestProduct.AVAILABILITY_IN_STOCK](dw.extensions.pinterest.PinterestProduct.md#availability_in_stock) or
      [PinterestProduct.AVAILABILITY_OUT_OF_STOCK](dw.extensions.pinterest.PinterestProduct.md#availability_out_of_stock).


    **Parameters:**
    - availability - the availability status to set for this product


---

<!-- prettier-ignore-end -->
