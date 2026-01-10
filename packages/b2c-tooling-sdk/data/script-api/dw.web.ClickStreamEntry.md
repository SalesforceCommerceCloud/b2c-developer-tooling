<!-- prettier-ignore-start -->
# Class ClickStreamEntry

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.web.ClickStreamEntry](dw.web.ClickStreamEntry.md)

Represent an entry in the click stream.


## Property Summary

| Property | Description |
| --- | --- |
| [host](#host): [String](TopLevel.String.md) `(read-only)` | Returns the host. |
| [locale](#locale): [String](TopLevel.String.md) `(read-only)` | Returns the locale sent from the user agent. |
| [path](#path): [String](TopLevel.String.md) `(read-only)` | Returns the path. |
| [pipelineName](#pipelinename): [String](TopLevel.String.md) `(read-only)` | Returns the name of the called pipeline. |
| [queryString](#querystring): [String](TopLevel.String.md) `(read-only)` | Returns the query string. |
| [referer](#referer): [String](TopLevel.String.md) `(read-only)` | Returns the referer. |
| [remoteAddress](#remoteaddress): [String](TopLevel.String.md) `(read-only)` | Returns the remote address. |
| [timestamp](#timestamp): [Number](TopLevel.Number.md) `(read-only)` | Returns the entry's timestamp. |
| [url](#url): [String](TopLevel.String.md) `(read-only)` | Returns the full URL for this click. |
| [userAgent](#useragent): [String](TopLevel.String.md) `(read-only)` | Returns the user agent. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getHost](dw.web.ClickStreamEntry.md#gethost)() | Returns the host. |
| [getLocale](dw.web.ClickStreamEntry.md#getlocale)() | Returns the locale sent from the user agent. |
| [getParameter](dw.web.ClickStreamEntry.md#getparameterstring)([String](TopLevel.String.md)) | Returns a specific parameter value from the stored query  string. |
| [getPath](dw.web.ClickStreamEntry.md#getpath)() | Returns the path. |
| [getPipelineName](dw.web.ClickStreamEntry.md#getpipelinename)() | Returns the name of the called pipeline. |
| [getQueryString](dw.web.ClickStreamEntry.md#getquerystring)() | Returns the query string. |
| [getReferer](dw.web.ClickStreamEntry.md#getreferer)() | Returns the referer. |
| [getRemoteAddress](dw.web.ClickStreamEntry.md#getremoteaddress)() | Returns the remote address. |
| [getTimestamp](dw.web.ClickStreamEntry.md#gettimestamp)() | Returns the entry's timestamp. |
| [getUrl](dw.web.ClickStreamEntry.md#geturl)() | Returns the full URL for this click. |
| [getUserAgent](dw.web.ClickStreamEntry.md#getuseragent)() | Returns the user agent. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### host
- host: [String](TopLevel.String.md) `(read-only)`
  - : Returns the host.


---

### locale
- locale: [String](TopLevel.String.md) `(read-only)`
  - : Returns the locale sent from the user agent.


---

### path
- path: [String](TopLevel.String.md) `(read-only)`
  - : Returns the path.


---

### pipelineName
- pipelineName: [String](TopLevel.String.md) `(read-only)`
  - : Returns the name of the called pipeline. In most cases the
      name can be derived from the path, but not in all cases. If with
      URL rewritting a special landing page is defined for a DNS name, than
      the system internally might use a specific pipeline associated with
      this landing page.



---

### queryString
- queryString: [String](TopLevel.String.md) `(read-only)`
  - : Returns the query string.


---

### referer
- referer: [String](TopLevel.String.md) `(read-only)`
  - : Returns the referer.


---

### remoteAddress
- remoteAddress: [String](TopLevel.String.md) `(read-only)`
  - : Returns the remote address.


---

### timestamp
- timestamp: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the entry's timestamp.


---

### url
- url: [String](TopLevel.String.md) `(read-only)`
  - : Returns the full URL for this click. The URL is returned as relative
      URL.



---

### userAgent
- userAgent: [String](TopLevel.String.md) `(read-only)`
  - : Returns the user agent.


---

## Method Details

### getHost()
- getHost(): [String](TopLevel.String.md)
  - : Returns the host.

    **Returns:**
    - the host.


---

### getLocale()
- getLocale(): [String](TopLevel.String.md)
  - : Returns the locale sent from the user agent.

    **Returns:**
    - the locale sent from the user agent.


---

### getParameter(String)
- getParameter(name: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Returns a specific parameter value from the stored query
      string. The method can be used to extract a source code or
      affiliate id out of the URLs in the click stream.
      
      The method returns null if there is no parameter with the given name.


    **Parameters:**
    - name - the name of the parameter.

    **Returns:**
    - the value associated with the specified parameter,
      or null.



---

### getPath()
- getPath(): [String](TopLevel.String.md)
  - : Returns the path.

    **Returns:**
    - the path.


---

### getPipelineName()
- getPipelineName(): [String](TopLevel.String.md)
  - : Returns the name of the called pipeline. In most cases the
      name can be derived from the path, but not in all cases. If with
      URL rewritting a special landing page is defined for a DNS name, than
      the system internally might use a specific pipeline associated with
      this landing page.


    **Returns:**
    - the name of the called pipeline.


---

### getQueryString()
- getQueryString(): [String](TopLevel.String.md)
  - : Returns the query string.

    **Returns:**
    - the query string.


---

### getReferer()
- getReferer(): [String](TopLevel.String.md)
  - : Returns the referer.

    **Returns:**
    - the referer.


---

### getRemoteAddress()
- getRemoteAddress(): [String](TopLevel.String.md)
  - : Returns the remote address.

    **Returns:**
    - the remote address.


---

### getTimestamp()
- getTimestamp(): [Number](TopLevel.Number.md)
  - : Returns the entry's timestamp.

    **Returns:**
    - the entry's timestamp.


---

### getUrl()
- getUrl(): [String](TopLevel.String.md)
  - : Returns the full URL for this click. The URL is returned as relative
      URL.


    **Returns:**
    - the full URL for this click.


---

### getUserAgent()
- getUserAgent(): [String](TopLevel.String.md)
  - : Returns the user agent.

    **Returns:**
    - the user agent.


---

<!-- prettier-ignore-end -->
