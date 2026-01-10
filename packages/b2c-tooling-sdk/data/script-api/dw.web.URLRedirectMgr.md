<!-- prettier-ignore-start -->
# Class URLRedirectMgr

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.web.URLRedirectMgr](dw.web.URLRedirectMgr.md)

URLRedirect manager class. Methods in this class generate URLRedirects based on the
current configuration for Static, Dynamic and URLRedirect mappings in Commerce
Cloud Digital.

Information used to calculate URLRedirects are determined from the current HTTP
request. The URL which is used to find a redirect can be accessed with [getRedirectOrigin()](dw.web.URLRedirectMgr.md#getredirectorigin).



## Property Summary

| Property | Description |
| --- | --- |
| [redirect](#redirect): [URLRedirect](dw.web.URLRedirect.md) `(read-only)` | Returns an URLRedirect object, containing a location and status. |
| [redirectOrigin](#redirectorigin): [String](TopLevel.String.md) `(read-only)` | Returns the relative origin url (without protocol, port, hostname and site path information)  which will be used in [getRedirect()](dw.web.URLRedirectMgr.md#getredirect) to calculate a redirect location for. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| static [getRedirect](dw.web.URLRedirectMgr.md#getredirect)() | Returns an URLRedirect object, containing a location and status. |
| static [getRedirectOrigin](dw.web.URLRedirectMgr.md#getredirectorigin)() | Returns the relative origin url (without protocol, port, hostname and site path information)  which will be used in [getRedirect()](dw.web.URLRedirectMgr.md#getredirect) to calculate a redirect location for. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### redirect
- redirect: [URLRedirect](dw.web.URLRedirect.md) `(read-only)`
  - : Returns an URLRedirect object, containing a location and status. The redirect is calculated
      based on origin url of current request and the configured Static, Dynamic and URLRedirect mappings for
      the requested site.



---

### redirectOrigin
- redirectOrigin: [String](TopLevel.String.md) `(read-only)`
  - : Returns the relative origin url (without protocol, port, hostname and site path information)
      which will be used in [getRedirect()](dw.web.URLRedirectMgr.md#getredirect) to calculate a redirect location for.



---

## Method Details

### getRedirect()
- static getRedirect(): [URLRedirect](dw.web.URLRedirect.md)
  - : Returns an URLRedirect object, containing a location and status. The redirect is calculated
      based on origin url of current request and the configured Static, Dynamic and URLRedirect mappings for
      the requested site.


    **Returns:**
    - URLRedirect containing the location and status code,
        null in case of no redirect was found



---

### getRedirectOrigin()
- static getRedirectOrigin(): [String](TopLevel.String.md)
  - : Returns the relative origin url (without protocol, port, hostname and site path information)
      which will be used in [getRedirect()](dw.web.URLRedirectMgr.md#getredirect) to calculate a redirect location for.


    **Returns:**
    - relative origin url


---

<!-- prettier-ignore-end -->
