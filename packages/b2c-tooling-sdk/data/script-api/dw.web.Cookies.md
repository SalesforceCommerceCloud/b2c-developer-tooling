<!-- prettier-ignore-start -->
# Class Cookies

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.web.Cookies](dw.web.Cookies.md)

The class provides an index and associative array like access to the Cookies
of the current request. Cookies can be retrieved by calling
dw.system.Request.getHttpCookies().


**Note:** this class allows access to sensitive security-related data.
Pay special attention to PCI DSS v3. requirements 2, 4, and 12.


See [Request.getHttpCookies()](dw.system.Request.md#gethttpcookies).



## Property Summary

| Property | Description |
| --- | --- |
| [cookieCount](#cookiecount): [Number](TopLevel.Number.md) `(read-only)` | Returns the number of known cookies. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getCookieCount](dw.web.Cookies.md#getcookiecount)() | Returns the number of known cookies. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### cookieCount
- cookieCount: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the number of known cookies.


---

## Method Details

### getCookieCount()
- getCookieCount(): [Number](TopLevel.Number.md)
  - : Returns the number of known cookies.

    **Returns:**
    - the number of cookies


---

<!-- prettier-ignore-end -->
