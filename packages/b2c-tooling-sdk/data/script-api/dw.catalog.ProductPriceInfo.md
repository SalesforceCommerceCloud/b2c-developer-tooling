<!-- prettier-ignore-start -->
# Class ProductPriceInfo

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.catalog.ProductPriceInfo](dw.catalog.ProductPriceInfo.md)

Simple class representing a product price point.  This class is useful
because it provides additional information beyond just the price.  Since the
system calculates sales prices based on applicable price books, it is
sometimes useful to know additional information such as which price book
defined a price point, what percentage discount off the base price
this value represents, and the date range for which this price point is active.



## Property Summary

| Property | Description |
| --- | --- |
| [onlineFrom](#onlinefrom): [Date](TopLevel.Date.md) `(read-only)` | Returns the date from which the associated price point is valid. |
| [onlineTo](#onlineto): [Date](TopLevel.Date.md) `(read-only)` | Returns the date until which the associated price point is valid. |
| [percentage](#percentage): [Number](TopLevel.Number.md) `(read-only)` | Returns the percentage off value of this price point related to the base  price for the product's minimum order quantity. |
| [price](#price): [Money](dw.value.Money.md) `(read-only)` | Returns the monetary price for this price point. |
| [priceBook](#pricebook): [PriceBook](dw.catalog.PriceBook.md) `(read-only)` | Returns the price book which defined this price point. |
| [priceInfo](#priceinfo): [String](TopLevel.String.md) `(read-only)` | Returns the price info associated with this price point. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getOnlineFrom](dw.catalog.ProductPriceInfo.md#getonlinefrom)() | Returns the date from which the associated price point is valid. |
| [getOnlineTo](dw.catalog.ProductPriceInfo.md#getonlineto)() | Returns the date until which the associated price point is valid. |
| [getPercentage](dw.catalog.ProductPriceInfo.md#getpercentage)() | Returns the percentage off value of this price point related to the base  price for the product's minimum order quantity. |
| [getPrice](dw.catalog.ProductPriceInfo.md#getprice)() | Returns the monetary price for this price point. |
| [getPriceBook](dw.catalog.ProductPriceInfo.md#getpricebook)() | Returns the price book which defined this price point. |
| [getPriceInfo](dw.catalog.ProductPriceInfo.md#getpriceinfo)() | Returns the price info associated with this price point. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### onlineFrom
- onlineFrom: [Date](TopLevel.Date.md) `(read-only)`
  - : Returns the date from which the associated price point is valid. If such a date doesn't exist, e.g. as in the
      case of a continuous price point, null will be returned.



---

### onlineTo
- onlineTo: [Date](TopLevel.Date.md) `(read-only)`
  - : Returns the date until which the associated price point is valid. If such a date doesn't exist, e.g. as in the case
      of a continuous price point, null will be returned.



---

### percentage
- percentage: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the percentage off value of this price point related to the base
      price for the product's minimum order quantity.



---

### price
- price: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the monetary price for this price point.


---

### priceBook
- priceBook: [PriceBook](dw.catalog.PriceBook.md) `(read-only)`
  - : Returns the price book which defined this price point.


---

### priceInfo
- priceInfo: [String](TopLevel.String.md) `(read-only)`
  - : Returns the price info associated with this price point. This is an
      arbitrary string which a merchant can associate with a price entry. This
      can be used for example, to track which back-end system the price is
      derived from.



---

## Method Details

### getOnlineFrom()
- getOnlineFrom(): [Date](TopLevel.Date.md)
  - : Returns the date from which the associated price point is valid. If such a date doesn't exist, e.g. as in the
      case of a continuous price point, null will be returned.


    **Returns:**
    - the date from which the associated price point is valid


---

### getOnlineTo()
- getOnlineTo(): [Date](TopLevel.Date.md)
  - : Returns the date until which the associated price point is valid. If such a date doesn't exist, e.g. as in the case
      of a continuous price point, null will be returned.


    **Returns:**
    - the date to which the associated price point is valid


---

### getPercentage()
- getPercentage(): [Number](TopLevel.Number.md)
  - : Returns the percentage off value of this price point related to the base
      price for the product's minimum order quantity.


    **Returns:**
    - the percentage off value of this price point


---

### getPrice()
- getPrice(): [Money](dw.value.Money.md)
  - : Returns the monetary price for this price point.

    **Returns:**
    - the price amount


---

### getPriceBook()
- getPriceBook(): [PriceBook](dw.catalog.PriceBook.md)
  - : Returns the price book which defined this price point.

    **Returns:**
    - the price book defining this price


---

### getPriceInfo()
- getPriceInfo(): [String](TopLevel.String.md)
  - : Returns the price info associated with this price point. This is an
      arbitrary string which a merchant can associate with a price entry. This
      can be used for example, to track which back-end system the price is
      derived from.


    **Returns:**
    - the price info associated with this price point.


---

<!-- prettier-ignore-end -->
