<!-- prettier-ignore-start -->
# Class HTTPServiceDefinition

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.svc.ServiceDefinition](dw.svc.ServiceDefinition.md)
    - [dw.svc.HTTPServiceDefinition](dw.svc.HTTPServiceDefinition.md)

Represents an HTTP Service Definition.


The HTTP Service will use the return value of the createRequest callback as the request body (if supported by the
HTTP method). If this is an array of non-null [HTTPRequestPart](dw.net.HTTPRequestPart.md) objects, then a multi-part request will
be formed. Otherwise the object is converted to a String and used.


See also [XML.toXMLString()](TopLevel.XML.md#toxmlstring) and [JSON.stringify(Object)](TopLevel.JSON.md#stringifyobject), which must be
explicitly called if needed.


**Deprecated:**
:::warning
This class is only used with the deprecated [ServiceRegistry](dw.svc.ServiceRegistry.md). Use the [LocalServiceRegistry](dw.svc.LocalServiceRegistry.md)
            instead, which allows configuration on the [HTTPService](dw.svc.HTTPService.md) directly.

:::
**API Version:**
:::note
No longer available as of version 19.10.
:::

## All Known Subclasses
[HTTPFormServiceDefinition](dw.svc.HTTPFormServiceDefinition.md)
## Property Summary

| Property | Description |
| --- | --- |
| [authentication](#authentication): [String](TopLevel.String.md) | Returns the authentication type. |
| [cachingTTL](#cachingttl): [Number](TopLevel.Number.md) | Returns the caching time to live value. |
| [encoding](#encoding): [String](TopLevel.String.md) | Returns the request body encoding to declare. |
| [outFile](#outfile): [File](dw.io.File.md) | Returns the output file, or null if there is none. |
| [requestMethod](#requestmethod): [String](TopLevel.String.md) | Returns the request method. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [addHeader](dw.svc.HTTPServiceDefinition.md#addheaderstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Adds an HTTP Header. |
| [addParam](dw.svc.HTTPServiceDefinition.md#addparamstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Adds a query parameter that will be appended to the URL. |
| [getAuthentication](dw.svc.HTTPServiceDefinition.md#getauthentication)() | Returns the authentication type. |
| [getCachingTTL](dw.svc.HTTPServiceDefinition.md#getcachingttl)() | Returns the caching time to live value. |
| [getEncoding](dw.svc.HTTPServiceDefinition.md#getencoding)() | Returns the request body encoding to declare. |
| [getOutFile](dw.svc.HTTPServiceDefinition.md#getoutfile)() | Returns the output file, or null if there is none. |
| [getRequestMethod](dw.svc.HTTPServiceDefinition.md#getrequestmethod)() | Returns the request method. |
| [setAuthentication](dw.svc.HTTPServiceDefinition.md#setauthenticationstring)([String](TopLevel.String.md)) | Sets the type of authentication. |
| [setCachingTTL](dw.svc.HTTPServiceDefinition.md#setcachingttlnumber)([Number](TopLevel.Number.md)) | Enables caching for GET requests. |
| [setEncoding](dw.svc.HTTPServiceDefinition.md#setencodingstring)([String](TopLevel.String.md)) | Sets the encoding of the request body (if any). |
| [setOutFile](dw.svc.HTTPServiceDefinition.md#setoutfilefile)([File](dw.io.File.md)) | Sets the output file in which to write the HTTP response body. |
| [setRequestMethod](dw.svc.HTTPServiceDefinition.md#setrequestmethodstring)([String](TopLevel.String.md)) | Sets the HTTP request method. |

### Methods inherited from class ServiceDefinition

[configure](dw.svc.ServiceDefinition.md#configureobject), [getConfiguration](dw.svc.ServiceDefinition.md#getconfiguration), [getServiceName](dw.svc.ServiceDefinition.md#getservicename), [isMock](dw.svc.ServiceDefinition.md#ismock), [isThrowOnError](dw.svc.ServiceDefinition.md#isthrowonerror), [setMock](dw.svc.ServiceDefinition.md#setmock), [setThrowOnError](dw.svc.ServiceDefinition.md#setthrowonerror)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### authentication
- authentication: [String](TopLevel.String.md)
  - : Returns the authentication type.


---

### cachingTTL
- cachingTTL: [Number](TopLevel.Number.md)
  - : Returns the caching time to live value.

    **See Also:**
    - [setCachingTTL(Number)](dw.svc.HTTPServiceDefinition.md#setcachingttlnumber)


---

### encoding
- encoding: [String](TopLevel.String.md)
  - : Returns the request body encoding to declare.


---

### outFile
- outFile: [File](dw.io.File.md)
  - : Returns the output file, or null if there is none.


---

### requestMethod
- requestMethod: [String](TopLevel.String.md)
  - : Returns the request method.


---

## Method Details

### addHeader(String, String)
- addHeader(name: [String](TopLevel.String.md), val: [String](TopLevel.String.md)): [HTTPServiceDefinition](dw.svc.HTTPServiceDefinition.md)
  - : Adds an HTTP Header.

    **Parameters:**
    - name - Header name.
    - val - Header value.

    **Returns:**
    - this HTTP Service Definition.


---

### addParam(String, String)
- addParam(name: [String](TopLevel.String.md), val: [String](TopLevel.String.md)): [HTTPServiceDefinition](dw.svc.HTTPServiceDefinition.md)
  - : Adds a query parameter that will be appended to the URL.

    **Parameters:**
    - name - Parameter name.
    - val - Parameter value.

    **Returns:**
    - this HTTP Service Definition.


---

### getAuthentication()
- getAuthentication(): [String](TopLevel.String.md)
  - : Returns the authentication type.

    **Returns:**
    - Authentication type.


---

### getCachingTTL()
- getCachingTTL(): [Number](TopLevel.Number.md)
  - : Returns the caching time to live value.

    **Returns:**
    - The caching time to live value in seconds.

    **See Also:**
    - [setCachingTTL(Number)](dw.svc.HTTPServiceDefinition.md#setcachingttlnumber)


---

### getEncoding()
- getEncoding(): [String](TopLevel.String.md)
  - : Returns the request body encoding to declare.

    **Returns:**
    - Request encoding.


---

### getOutFile()
- getOutFile(): [File](dw.io.File.md)
  - : Returns the output file, or null if there is none.

    **Returns:**
    - Output file or null.


---

### getRequestMethod()
- getRequestMethod(): [String](TopLevel.String.md)
  - : Returns the request method.

    **Returns:**
    - HTTP Request method.


---

### setAuthentication(String)
- setAuthentication(authentication: [String](TopLevel.String.md)): [HTTPServiceDefinition](dw.svc.HTTPServiceDefinition.md)
  - : Sets the type of authentication. Valid values include "BASIC" and "NONE".
      
      
      The default value is BASIC.


    **Parameters:**
    - authentication - Type of authentication.

    **Returns:**
    - this HTTP Service Definition.


---

### setCachingTTL(Number)
- setCachingTTL(ttl: [Number](TopLevel.Number.md)): [HTTPServiceDefinition](dw.svc.HTTPServiceDefinition.md)
  - : Enables caching for GET requests.
      
      
      This only caches status codes 2xx with a content length and size of less than 50k that are not immediately
      written to file. The URL and the user name are used as cache keys. The total size of cacheable content and the
      number of cached items is limited and automatically managed by the system.
      
      
      Cache control information sent by the remote server is ignored.
      
      
      Caching HTTP responses should be done very carefully. It is important to ensure that the response really depends
      only on the URL and doesn't contain any remote state information or time information which is independent of the
      URL. It is also important to verify that the application sends exactly the same URL multiple times.


    **Parameters:**
    - ttl - The time to live for the cached content in seconds. A value of 0 or less disables caching.

    **See Also:**
    - [HTTPClient.enableCaching(Number)](dw.net.HTTPClient.md#enablecachingnumber)


---

### setEncoding(String)
- setEncoding(encoding: [String](TopLevel.String.md)): [HTTPServiceDefinition](dw.svc.HTTPServiceDefinition.md)
  - : Sets the encoding of the request body (if any).
      
      
      The default value is UTF-8.


    **Parameters:**
    - encoding - Encoding of the request body.

    **Returns:**
    - this HTTP Service Definition.


---

### setOutFile(File)
- setOutFile(outFile: [File](dw.io.File.md)): [HTTPServiceDefinition](dw.svc.HTTPServiceDefinition.md)
  - : Sets the output file in which to write the HTTP response body.
      
      
      The default behavior is to not write a file.


    **Parameters:**
    - outFile - Output file, or null to disable.

    **Returns:**
    - this HTTP Service Definition.


---

### setRequestMethod(String)
- setRequestMethod(requestMethod: [String](TopLevel.String.md)): [HTTPServiceDefinition](dw.svc.HTTPServiceDefinition.md)
  - : Sets the HTTP request method.
      
      
      Valid values include GET, PUT, POST, and DELETE.
      
      
      The default value is POST.


    **Parameters:**
    - requestMethod - HTTP request method.

    **Returns:**
    - this HTTP Service Definition.


---

<!-- prettier-ignore-end -->
