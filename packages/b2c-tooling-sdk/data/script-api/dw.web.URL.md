<!-- prettier-ignore-start -->
# Class URL

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.web.URL](dw.web.URL.md)

Represents a URL in Commerce Cloud Digital.


## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [abs](dw.web.URL.md#abs)() | Makes the URL absolute and ensures that the protocol of the request is used  or http in a mail context. |
| [append](dw.web.URL.md#appendstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Append a request parameter to this URL. |
| [appendCSRFTokenBM](dw.web.URL.md#appendcsrftokenbm)() | <p>Appends, if applicable, a CSRF protection token to this URL. |
| [host](dw.web.URL.md#hoststring)([String](TopLevel.String.md)) | Updates the URL with the specified host name  Note: This method is not applicable for static content or image transformation  URLs. |
| [http](dw.web.URL.md#http)() | Makes the URL absolute and ensures that the protocol http is used. |
| [https](dw.web.URL.md#https)() | Makes the URL absolute and ensures that the protocol https is used. |
| [relative](dw.web.URL.md#relative)() | Makes the URL relative. |
| [remove](dw.web.URL.md#removestring)([String](TopLevel.String.md)) | Remove a request parameter from this URL. |
| [siteHost](dw.web.URL.md#sitehost)() | Updates the URL with the site host name  Note: This method is not applicable for static content or image transformation  URLs. |
| [toString](dw.web.URL.md#tostring)() | Return String representation of the URL. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Method Details

### abs()
- abs(): [URL](dw.web.URL.md)
  - : Makes the URL absolute and ensures that the protocol of the request is used
      or http in a mail context.
      Note: This method is not applicable for static content or image transformation
      URLs. In this case a runtime exception is thrown.


    **Returns:**
    - A new URL instance.


---

### append(String, String)
- append(name: [String](TopLevel.String.md), value: [String](TopLevel.String.md)): [URL](dw.web.URL.md)
  - : Append a request parameter to this URL.

    **Parameters:**
    - name - The parameter name.  Must not be null.
    - value - The parameter value.  If null, then treated as empty value.

    **Returns:**
    - A reference to this URL.


---

### appendCSRFTokenBM()
- appendCSRFTokenBM(): [URL](dw.web.URL.md)
  - : 
      Appends, if applicable, a CSRF protection token to this URL. The CSRF token will only be appended under the following conditions:
      
      
      - the URL is a pipeline URL
      - the URL is for Business Manager
      
      
      
      If a CSRF token already exists in the URL, it will be replaced with a newly generated one.


    **Returns:**
    - a reference to this URL, with a CSRF token appended if applicable.


---

### host(String)
- host(host: [String](TopLevel.String.md)): [URL](dw.web.URL.md)
  - : Updates the URL with the specified host name
      Note: This method is not applicable for static content or image transformation
      URLs. In this case a runtime exception is thrown.


    **Parameters:**
    - host - The host name that is used to update the URL.

    **Returns:**
    - A new URL instance.


---

### http()
- http(): [URL](dw.web.URL.md)
  - : Makes the URL absolute and ensures that the protocol http is used.
      Note: This method is not applicable for static content or image transformation
      URLs. In this case a runtime exception is thrown.


    **Returns:**
    - A new URL instance.


---

### https()
- https(): [URL](dw.web.URL.md)
  - : Makes the URL absolute and ensures that the protocol https is used.
      Note: This method is not applicable for static content or image transformation
      URLs. In this case a runtime exception is thrown.


    **Returns:**
    - A new URL instance.


---

### relative()
- relative(): [URL](dw.web.URL.md)
  - : Makes the URL relative.
      Note: This method is not applicable for static content or image transformation
      URLs. In this case a runtime exception is thrown.


    **Returns:**
    - A new URL instance.


---

### remove(String)
- remove(name: [String](TopLevel.String.md)): [URL](dw.web.URL.md)
  - : Remove a request parameter from this URL. If the parameter is not part
      of the URL, nothing is done.


    **Parameters:**
    - name - The parameter name.  Must not be null.

    **Returns:**
    - A reference to this URL.


---

### siteHost()
- siteHost(): [URL](dw.web.URL.md)
  - : Updates the URL with the site host name
      Note: This method is not applicable for static content or image transformation
      URLs. In this case a runtime exception is thrown.


    **Returns:**
    - A new URL instance.


---

### toString()
- toString(): [String](TopLevel.String.md)
  - : Return String representation of the URL.

    **Returns:**
    - the URL as a string.


---

<!-- prettier-ignore-end -->
