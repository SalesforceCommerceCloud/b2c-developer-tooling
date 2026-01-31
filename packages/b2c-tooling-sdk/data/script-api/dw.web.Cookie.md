<!-- prettier-ignore-start -->
# Class Cookie

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.web.Cookie](dw.web.Cookie.md)

Represents an HTTP cookie used for storing information on a client browser. Cookies are passed along in the HTTP
request and can be retrieved by calling dw.system.Request.getHttpCookies().


Cookies must comply with RFC6265. We recommend you use only printable ASCII characters without separators, such as a
comma or equal sign. If JSON is used as a cookie value, it must be encoded.


**Note:** this class allows access to sensitive security-related data. Pay special attention to PCI DSS v3.
requirements 2, 4, and 12.


See [Request.getHttpCookies()](dw.system.Request.md#gethttpcookies).



## Constant Summary

| Constant | Description |
| --- | --- |
| [EMPTYNAME](#emptyname): [String](TopLevel.String.md) = "dw_emptyname__" | Default name for cookies with empty strings. |

## Property Summary

| Property | Description |
| --- | --- |
| ~~[comment](#comment): [String](TopLevel.String.md)~~ | Returns the comment that was previously set for this cookie, or null if no comment was set. |
| [domain](#domain): [String](TopLevel.String.md) | Returns the domain associated with the cookie. |
| [httpOnly](#httponly): [Boolean](TopLevel.Boolean.md) | Identifies if the cookie is http-only. |
| [maxAge](#maxage): [Number](TopLevel.Number.md) | Returns the maximum age of the cookie, specified in seconds. |
| [name](#name): [String](TopLevel.String.md) `(read-only)` | Returns the cookie's name. |
| [path](#path): [String](TopLevel.String.md) | Returns the path for the cookie. |
| [secure](#secure): [Boolean](TopLevel.Boolean.md) | Identifies if the cookie is secure. |
| [value](#value): [String](TopLevel.String.md) | Returns the cookie's value. |
| ~~[version](#version): [Number](TopLevel.Number.md)~~ | Returns the version that was previously set for this cookie. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [Cookie](#cookiestring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Constructs a new cookie using the specified name and value. |

## Method Summary

| Method | Description |
| --- | --- |
| ~~[getComment](dw.web.Cookie.md#getcomment)()~~ | Returns the comment that was previously set for this cookie, or null if no comment was set. |
| [getDomain](dw.web.Cookie.md#getdomain)() | Returns the domain associated with the cookie. |
| [getMaxAge](dw.web.Cookie.md#getmaxage)() | Returns the maximum age of the cookie, specified in seconds. |
| [getName](dw.web.Cookie.md#getname)() | Returns the cookie's name. |
| [getPath](dw.web.Cookie.md#getpath)() | Returns the path for the cookie. |
| [getSecure](dw.web.Cookie.md#getsecure)() | Identifies if the cookie is secure. |
| [getValue](dw.web.Cookie.md#getvalue)() | Returns the cookie's value. |
| ~~[getVersion](dw.web.Cookie.md#getversion)()~~ | Returns the version that was previously set for this cookie. |
| [isHttpOnly](dw.web.Cookie.md#ishttponly)() | Identifies if the cookie is http-only. |
| ~~[setComment](dw.web.Cookie.md#setcommentstring)([String](TopLevel.String.md))~~ | Sets a comment associated with this cookie. |
| [setDomain](dw.web.Cookie.md#setdomainstring)([String](TopLevel.String.md)) | Sets the domain associated with the cookie. |
| [setHttpOnly](dw.web.Cookie.md#sethttponlyboolean)([Boolean](TopLevel.Boolean.md)) | Sets the http-only state for the cookie. |
| [setMaxAge](dw.web.Cookie.md#setmaxagenumber)([Number](TopLevel.Number.md)) | Sets the maximum age of the cookie in seconds. |
| [setPath](dw.web.Cookie.md#setpathstring)([String](TopLevel.String.md)) | Sets the path for the cookie. |
| [setSecure](dw.web.Cookie.md#setsecureboolean)([Boolean](TopLevel.Boolean.md)) | Sets the secure state for the cookie. |
| [setValue](dw.web.Cookie.md#setvaluestring)([String](TopLevel.String.md)) | Sets the cookie's value. |
| ~~[setVersion](dw.web.Cookie.md#setversionnumber)([Number](TopLevel.Number.md))~~ | Returns the version that was previously set for this cookie. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### EMPTYNAME

- EMPTYNAME: [String](TopLevel.String.md) = "dw_emptyname__"
  - : Default name for cookies with empty strings.


---

## Property Details

### comment
- ~~comment: [String](TopLevel.String.md)~~
  - : Returns the comment that was previously set for this cookie, or null if no comment was set. Note that comments
      are no longer supported in RFC 6265 and will not be sent to clients. This method is maintained for backward
      compatibility only.


    **Deprecated:**
:::warning
This method is maintained for backward compatibility only. Cookie comments were removed in RFC 6265
            and are no longer sent to clients. The returned value only reflects what was previously set using
            [setComment(String)](dw.web.Cookie.md#setcommentstring).

:::
    **API Version:**
:::note
No longer available as of version 99.2.
This method is deprecated and will be removed in the next API version.
:::

---

### domain
- domain: [String](TopLevel.String.md)
  - : Returns the domain associated with the cookie.


---

### httpOnly
- httpOnly: [Boolean](TopLevel.Boolean.md)
  - : Identifies if the cookie is http-only.


---

### maxAge
- maxAge: [Number](TopLevel.Number.md)
  - : Returns the maximum age of the cookie, specified in seconds.
      By default, -1 indicating the cookie will persist until client shutdown.



---

### name
- name: [String](TopLevel.String.md) `(read-only)`
  - : Returns the cookie's name.


---

### path
- path: [String](TopLevel.String.md)
  - : Returns the path for the cookie.


---

### secure
- secure: [Boolean](TopLevel.Boolean.md)
  - : Identifies if the cookie is secure.


---

### value
- value: [String](TopLevel.String.md)
  - : Returns the cookie's value.


---

### version
- ~~version: [Number](TopLevel.Number.md)~~
  - : Returns the version that was previously set for this cookie. Note that the version is no longer used for
      determining cookie compliance as the system now uses RFC 6265 by default. The returned value only reflects what
      was previously set using [setVersion(Number)](dw.web.Cookie.md#setversionnumber).


    **Deprecated:**
:::warning
This method is maintained for backward compatibility only. The version property is no longer used as
            the system now uses RFC 6265 compliance by default. The returned value has no effect on cookie
            behavior.

:::
    **API Version:**
:::note
No longer available as of version 99.2.
This method is deprecated and will be removed in the next API version.
:::

---

## Constructor Details

### Cookie(String, String)
- Cookie(name: [String](TopLevel.String.md), value: [String](TopLevel.String.md))
  - : Constructs a new cookie using the specified name and value.

    **Parameters:**
    - name - the name for the cookie.
    - value - the cookie's value.


---

## Method Details

### getComment()
- ~~getComment(): [String](TopLevel.String.md)~~
  - : Returns the comment that was previously set for this cookie, or null if no comment was set. Note that comments
      are no longer supported in RFC 6265 and will not be sent to clients. This method is maintained for backward
      compatibility only.


    **Returns:**
    - the comment that was previously set, or null if no comment was set

    **Deprecated:**
:::warning
This method is maintained for backward compatibility only. Cookie comments were removed in RFC 6265
            and are no longer sent to clients. The returned value only reflects what was previously set using
            [setComment(String)](dw.web.Cookie.md#setcommentstring).

:::
    **API Version:**
:::note
No longer available as of version 99.2.
This method is deprecated and will be removed in the next API version.
:::

---

### getDomain()
- getDomain(): [String](TopLevel.String.md)
  - : Returns the domain associated with the cookie.

    **Returns:**
    - the domain associated with the cookie.


---

### getMaxAge()
- getMaxAge(): [Number](TopLevel.Number.md)
  - : Returns the maximum age of the cookie, specified in seconds.
      By default, -1 indicating the cookie will persist until client shutdown.


    **Returns:**
    - an integer specifying the maximum age of the cookie in seconds;
              if negative, means the cookie persists until client shutdown



---

### getName()
- getName(): [String](TopLevel.String.md)
  - : Returns the cookie's name.

    **Returns:**
    - the cookie's name.


---

### getPath()
- getPath(): [String](TopLevel.String.md)
  - : Returns the path for the cookie.

    **Returns:**
    - the path for the cookie.


---

### getSecure()
- getSecure(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if the cookie is secure.

    **Returns:**
    - true if the cookie is secure, false otherwise.


---

### getValue()
- getValue(): [String](TopLevel.String.md)
  - : Returns the cookie's value.

    **Returns:**
    - the cookie's value.


---

### getVersion()
- ~~getVersion(): [Number](TopLevel.Number.md)~~
  - : Returns the version that was previously set for this cookie. Note that the version is no longer used for
      determining cookie compliance as the system now uses RFC 6265 by default. The returned value only reflects what
      was previously set using [setVersion(Number)](dw.web.Cookie.md#setversionnumber).


    **Returns:**
    - the version number that was set, or 0 if no version was explicitly set

    **Deprecated:**
:::warning
This method is maintained for backward compatibility only. The version property is no longer used as
            the system now uses RFC 6265 compliance by default. The returned value has no effect on cookie
            behavior.

:::
    **API Version:**
:::note
No longer available as of version 99.2.
This method is deprecated and will be removed in the next API version.
:::

---

### isHttpOnly()
- isHttpOnly(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if the cookie is http-only.

    **Returns:**
    - true if the cookie is http-only, false otherwise.


---

### setComment(String)
- ~~setComment(comment: [String](TopLevel.String.md)): void~~
  - : Sets a comment associated with this cookie. Note that comments are no longer sent to clients as they were removed
      in RFC 6265. This method is maintained for backward compatibility but has no effect on the cookie's behavior.


    **Parameters:**
    - comment - the comment to associate with the cookie (ignored)

    **Deprecated:**
:::warning
This method is maintained for backward compatibility only. Cookie comments were removed in RFC 6265
            and will not be sent to clients. The value will be stored but has no effect on cookie behavior.

:::
    **API Version:**
:::note
No longer available as of version 99.2.
This method is deprecated and will be removed in the next API version.
:::

---

### setDomain(String)
- setDomain(domain: [String](TopLevel.String.md)): void
  - : Sets the domain associated with the cookie.

    **Parameters:**
    - domain - the comment associated with the cookie.


---

### setHttpOnly(Boolean)
- setHttpOnly(httpOnly: [Boolean](TopLevel.Boolean.md)): void
  - : Sets the http-only state for the cookie.

    **Parameters:**
    - httpOnly - sets http-only state for the cookie.


---

### setMaxAge(Number)
- setMaxAge(age: [Number](TopLevel.Number.md)): void
  - : Sets the maximum age of the cookie in seconds.
      
      A positive value indicates that the cookie will expire after that many
      seconds have passed. Note that the value is the maximum age when the
      cookie will expire, not the cookie's current age.
      
      A negative value means that the cookie is not stored persistently and
      will be deleted when the client exits. A zero value causes the
      cookie to be deleted.


    **Parameters:**
    - age - an integer specifying the maximum age of the cookie in seconds;             if negative, means the cookie is not stored; if zero, deletes             the cookie


---

### setPath(String)
- setPath(path: [String](TopLevel.String.md)): void
  - : Sets the path for the cookie.

    **Parameters:**
    - path - the path for the cookie.


---

### setSecure(Boolean)
- setSecure(secure: [Boolean](TopLevel.Boolean.md)): void
  - : Sets the secure state for the cookie.

    **Parameters:**
    - secure - sets secure state for the cookie.


---

### setValue(String)
- setValue(value: [String](TopLevel.String.md)): void
  - : Sets the cookie's value.

    **Parameters:**
    - value - the value to set in the cookie.


---

### setVersion(Number)
- ~~setVersion(version: [Number](TopLevel.Number.md)): void~~
  - : Returns the version that was previously set for this cookie. Note that the version is no longer used for
      determining cookie compliance as the system now uses RFC 6265 by default. The returned value only reflects what
      was previously set using [setVersion(Number)](dw.web.Cookie.md#setversionnumber).


    **Returns:**
    - the version number that was set, or 0 if no version was explicitly set

    **Deprecated:**
:::warning
This method is maintained for backward compatibility only. The version property is no longer used as
            the system now uses RFC 6265 compliance by default. The returned value has no effect on cookie
            behavior.

:::
    **API Version:**
:::note
No longer available as of version 99.2.
This method is deprecated and will be removed in the next API version.
:::

---

<!-- prettier-ignore-end -->
