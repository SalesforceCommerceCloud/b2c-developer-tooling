<!-- prettier-ignore-start -->
# Class SalesforcePayPalOrderAddress

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.extensions.payments.SalesforcePayPalOrderAddress](dw.extensions.payments.SalesforcePayPalOrderAddress.md)



Salesforce Payments representation of a PayPal order address object. See Salesforce Payments documentation
for how to gain access and configure it for use on your sites.



## Property Summary

| Property | Description |
| --- | --- |
| [addressLine1](#addressline1): [String](TopLevel.String.md) `(read-only)` | Returns the address line 1. |
| [addressLine2](#addressline2): [String](TopLevel.String.md) `(read-only)` | Returns the address line 2. |
| [adminArea1](#adminarea1): [String](TopLevel.String.md) `(read-only)` | Returns the address highest level sub-division in a country, which is usually a province, state, or ISO-3166-2  subdivision. |
| [adminArea2](#adminarea2): [String](TopLevel.String.md) `(read-only)` | Returns the address city, town, or village. |
| [countryCode](#countrycode): [String](TopLevel.String.md) `(read-only)` | Returns the address two-character ISO 3166-1 code that identifies the country or region. |
| [fullName](#fullname): [String](TopLevel.String.md) `(read-only)` | Returns the address full name. |
| [postalCode](#postalcode): [String](TopLevel.String.md) `(read-only)` | Returns the address postal code. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getAddressLine1](dw.extensions.payments.SalesforcePayPalOrderAddress.md#getaddressline1)() | Returns the address line 1. |
| [getAddressLine2](dw.extensions.payments.SalesforcePayPalOrderAddress.md#getaddressline2)() | Returns the address line 2. |
| [getAdminArea1](dw.extensions.payments.SalesforcePayPalOrderAddress.md#getadminarea1)() | Returns the address highest level sub-division in a country, which is usually a province, state, or ISO-3166-2  subdivision. |
| [getAdminArea2](dw.extensions.payments.SalesforcePayPalOrderAddress.md#getadminarea2)() | Returns the address city, town, or village. |
| [getCountryCode](dw.extensions.payments.SalesforcePayPalOrderAddress.md#getcountrycode)() | Returns the address two-character ISO 3166-1 code that identifies the country or region. |
| [getFullName](dw.extensions.payments.SalesforcePayPalOrderAddress.md#getfullname)() | Returns the address full name. |
| [getPostalCode](dw.extensions.payments.SalesforcePayPalOrderAddress.md#getpostalcode)() | Returns the address postal code. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### addressLine1
- addressLine1: [String](TopLevel.String.md) `(read-only)`
  - : Returns the address line 1.


---

### addressLine2
- addressLine2: [String](TopLevel.String.md) `(read-only)`
  - : Returns the address line 2.


---

### adminArea1
- adminArea1: [String](TopLevel.String.md) `(read-only)`
  - : Returns the address highest level sub-division in a country, which is usually a province, state, or ISO-3166-2
      subdivision.



---

### adminArea2
- adminArea2: [String](TopLevel.String.md) `(read-only)`
  - : Returns the address city, town, or village.


---

### countryCode
- countryCode: [String](TopLevel.String.md) `(read-only)`
  - : Returns the address two-character ISO 3166-1 code that identifies the country or region.


---

### fullName
- fullName: [String](TopLevel.String.md) `(read-only)`
  - : Returns the address full name.


---

### postalCode
- postalCode: [String](TopLevel.String.md) `(read-only)`
  - : Returns the address postal code.


---

## Method Details

### getAddressLine1()
- getAddressLine1(): [String](TopLevel.String.md)
  - : Returns the address line 1.

    **Returns:**
    - address line 1


---

### getAddressLine2()
- getAddressLine2(): [String](TopLevel.String.md)
  - : Returns the address line 2.

    **Returns:**
    - address line 2


---

### getAdminArea1()
- getAdminArea1(): [String](TopLevel.String.md)
  - : Returns the address highest level sub-division in a country, which is usually a province, state, or ISO-3166-2
      subdivision.


    **Returns:**
    - address highest level sub-division in a country, such as a state


---

### getAdminArea2()
- getAdminArea2(): [String](TopLevel.String.md)
  - : Returns the address city, town, or village.

    **Returns:**
    - address city, town, or village


---

### getCountryCode()
- getCountryCode(): [String](TopLevel.String.md)
  - : Returns the address two-character ISO 3166-1 code that identifies the country or region.

    **Returns:**
    - address country code


---

### getFullName()
- getFullName(): [String](TopLevel.String.md)
  - : Returns the address full name.

    **Returns:**
    - address full name


---

### getPostalCode()
- getPostalCode(): [String](TopLevel.String.md)
  - : Returns the address postal code.

    **Returns:**
    - address postal code


---

<!-- prettier-ignore-end -->
