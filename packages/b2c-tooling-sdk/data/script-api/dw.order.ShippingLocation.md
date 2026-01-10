<!-- prettier-ignore-start -->
# Class ShippingLocation

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.order.ShippingLocation](dw.order.ShippingLocation.md)

Represents a specific location for a shipment.


**Note:** this class allows access to sensitive personal and private information.
Pay attention to appropriate legal and regulatory requirements related to this data.



## Property Summary

| Property | Description |
| --- | --- |
| [address1](#address1): [String](TopLevel.String.md) | Returns the shipping location's first address. |
| [address2](#address2): [String](TopLevel.String.md) | Returns the shipping location's second address. |
| [city](#city): [String](TopLevel.String.md) | Returns the shipping location's city. |
| [countryCode](#countrycode): [String](TopLevel.String.md) | Returns the shipping location's country code. |
| [postBox](#postbox): [String](TopLevel.String.md) | Returns the shipping location's post box. |
| [postalCode](#postalcode): [String](TopLevel.String.md) | Returns the shipping location's postal code. |
| [stateCode](#statecode): [String](TopLevel.String.md) | Returns the shipping location's state code. |
| [suite](#suite): [String](TopLevel.String.md) | Returns the shipping location's suite. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [ShippingLocation](#shippinglocation)() | Constructs a new shipping location. |
| [ShippingLocation](#shippinglocationcustomeraddress)([CustomerAddress](dw.customer.CustomerAddress.md)) | Constructs a new shipping location and initializes it with the values of the  specified address object. |
| [ShippingLocation](#shippinglocationorderaddress)([OrderAddress](dw.order.OrderAddress.md)) | Constructs a new shipping location and initializes it with the values of the  specified address object. |

## Method Summary

| Method | Description |
| --- | --- |
| [getAddress1](dw.order.ShippingLocation.md#getaddress1)() | Returns the shipping location's first address. |
| [getAddress2](dw.order.ShippingLocation.md#getaddress2)() | Returns the shipping location's second address. |
| [getCity](dw.order.ShippingLocation.md#getcity)() | Returns the shipping location's city. |
| [getCountryCode](dw.order.ShippingLocation.md#getcountrycode)() | Returns the shipping location's country code. |
| [getPostBox](dw.order.ShippingLocation.md#getpostbox)() | Returns the shipping location's post box. |
| [getPostalCode](dw.order.ShippingLocation.md#getpostalcode)() | Returns the shipping location's postal code. |
| [getStateCode](dw.order.ShippingLocation.md#getstatecode)() | Returns the shipping location's state code. |
| [getSuite](dw.order.ShippingLocation.md#getsuite)() | Returns the shipping location's suite. |
| [setAddress1](dw.order.ShippingLocation.md#setaddress1string)([String](TopLevel.String.md)) | Sets the shipping location's first address. |
| [setAddress2](dw.order.ShippingLocation.md#setaddress2string)([String](TopLevel.String.md)) | Sets the shipping location's second address. |
| [setCity](dw.order.ShippingLocation.md#setcitystring)([String](TopLevel.String.md)) | Sets the shipping location's city. |
| [setCountryCode](dw.order.ShippingLocation.md#setcountrycodestring)([String](TopLevel.String.md)) | Sets the shipping location's country code. |
| [setPostBox](dw.order.ShippingLocation.md#setpostboxstring)([String](TopLevel.String.md)) | Sets the shipping location's post box. |
| [setPostalCode](dw.order.ShippingLocation.md#setpostalcodestring)([String](TopLevel.String.md)) | Sets the shipping location's postal code. |
| [setStateCode](dw.order.ShippingLocation.md#setstatecodestring)([String](TopLevel.String.md)) | Sets the shipping location's state code. |
| [setSuite](dw.order.ShippingLocation.md#setsuitestring)([String](TopLevel.String.md)) | Sets the shipping location's suite. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### address1
- address1: [String](TopLevel.String.md)
  - : Returns the shipping location's first address.


---

### address2
- address2: [String](TopLevel.String.md)
  - : Returns the shipping location's second address.


---

### city
- city: [String](TopLevel.String.md)
  - : Returns the shipping location's city.


---

### countryCode
- countryCode: [String](TopLevel.String.md)
  - : Returns the shipping location's country code.


---

### postBox
- postBox: [String](TopLevel.String.md)
  - : Returns the shipping location's post box.


---

### postalCode
- postalCode: [String](TopLevel.String.md)
  - : Returns the shipping location's postal code.


---

### stateCode
- stateCode: [String](TopLevel.String.md)
  - : Returns the shipping location's state code.


---

### suite
- suite: [String](TopLevel.String.md)
  - : Returns the shipping location's suite.


---

## Constructor Details

### ShippingLocation()
- ShippingLocation()
  - : Constructs a new shipping location.


---

### ShippingLocation(CustomerAddress)
- ShippingLocation(address: [CustomerAddress](dw.customer.CustomerAddress.md))
  - : Constructs a new shipping location and initializes it with the values of the
      specified address object.


    **Parameters:**
    - address - the address that the shipping location represents.


---

### ShippingLocation(OrderAddress)
- ShippingLocation(address: [OrderAddress](dw.order.OrderAddress.md))
  - : Constructs a new shipping location and initializes it with the values of the
      specified address object.


    **Parameters:**
    - address - the address that the shipping location represents.


---

## Method Details

### getAddress1()
- getAddress1(): [String](TopLevel.String.md)
  - : Returns the shipping location's first address.

    **Returns:**
    - the shipping location's first address.


---

### getAddress2()
- getAddress2(): [String](TopLevel.String.md)
  - : Returns the shipping location's second address.

    **Returns:**
    - the shipping location's second address.


---

### getCity()
- getCity(): [String](TopLevel.String.md)
  - : Returns the shipping location's city.

    **Returns:**
    - the shipping location's city.


---

### getCountryCode()
- getCountryCode(): [String](TopLevel.String.md)
  - : Returns the shipping location's country code.

    **Returns:**
    - the shipping location's country code.


---

### getPostBox()
- getPostBox(): [String](TopLevel.String.md)
  - : Returns the shipping location's post box.

    **Returns:**
    - the shipping location's post box.


---

### getPostalCode()
- getPostalCode(): [String](TopLevel.String.md)
  - : Returns the shipping location's postal code.

    **Returns:**
    - the shipping location's postal code.


---

### getStateCode()
- getStateCode(): [String](TopLevel.String.md)
  - : Returns the shipping location's state code.

    **Returns:**
    - the shipping location's state code.


---

### getSuite()
- getSuite(): [String](TopLevel.String.md)
  - : Returns the shipping location's suite.

    **Returns:**
    - the shipping location's suite.


---

### setAddress1(String)
- setAddress1(aValue: [String](TopLevel.String.md)): void
  - : Sets the shipping location's first address.

    **Parameters:**
    - aValue - the shipping location's first address.


---

### setAddress2(String)
- setAddress2(aValue: [String](TopLevel.String.md)): void
  - : Sets the shipping location's second address.

    **Parameters:**
    - aValue - the shipping location's second address.


---

### setCity(String)
- setCity(aValue: [String](TopLevel.String.md)): void
  - : Sets the shipping location's city.

    **Parameters:**
    - aValue - the shipping location's city.


---

### setCountryCode(String)
- setCountryCode(aValue: [String](TopLevel.String.md)): void
  - : Sets the shipping location's country code.

    **Parameters:**
    - aValue - the shipping location's country code.


---

### setPostBox(String)
- setPostBox(aValue: [String](TopLevel.String.md)): void
  - : Sets the shipping location's post box.

    **Parameters:**
    - aValue - the shipping location's post box.


---

### setPostalCode(String)
- setPostalCode(aValue: [String](TopLevel.String.md)): void
  - : Sets the shipping location's postal code.

    **Parameters:**
    - aValue - the shipping location's postal code.


---

### setStateCode(String)
- setStateCode(aValue: [String](TopLevel.String.md)): void
  - : Sets the shipping location's state code.

    **Parameters:**
    - aValue - the shipping location's state code.


---

### setSuite(String)
- setSuite(aValue: [String](TopLevel.String.md)): void
  - : Sets the shipping location's suite.

    **Parameters:**
    - aValue - the shipping location's suite.


---

<!-- prettier-ignore-end -->
