<!-- prettier-ignore-start -->
# Class HTTPService

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.svc.Service](dw.svc.Service.md)
    - [dw.svc.HTTPService](dw.svc.HTTPService.md)

Represents an HTTP Service.


The HTTP Service will use the return value of the createRequest callback as the request body (if supported by the
HTTP method). If this is an array of non-null [HTTPRequestPart](dw.net.HTTPRequestPart.md) objects, then a multi-part request will
be formed. Otherwise the object is converted to a String and used.


See also [XML.toXMLString()](TopLevel.XML.md#toxmlstring) and [JSON.stringify(Object)](TopLevel.JSON.md#stringifyobject), which must be
explicitly called if needed.



## All Known Subclasses
[HTTPFormService](dw.svc.HTTPFormService.md)
## Property Summary

| Property | Description |
| --- | --- |
| [authentication](#authentication): [String](TopLevel.String.md) | Returns the authentication type. |
| [cachingTTL](#cachingttl): [Number](TopLevel.Number.md) | Returns the caching time to live value. |
| [client](#client): [HTTPClient](dw.net.HTTPClient.md) `(read-only)` | Returns the underlying HTTP client object. |
| [encoding](#encoding): [String](TopLevel.String.md) | Returns the request body encoding to declare. |
| [hostNameVerification](#hostnameverification): [Boolean](TopLevel.Boolean.md) | Determines whether host name verification is enabled. |
| [identity](#identity): [KeyRef](dw.crypto.KeyRef.md) | Gets the identity used for mutual TLS (mTLS). |
| [outFile](#outfile): [File](dw.io.File.md) | Returns the output file, or null if there is none. |
| [requestMethod](#requestmethod): [String](TopLevel.String.md) | Returns the request method. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [addHeader](dw.svc.HTTPService.md#addheaderstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Adds an HTTP Header. |
| [addParam](dw.svc.HTTPService.md#addparamstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Adds a query parameter that will be appended to the URL. |
| [getAuthentication](dw.svc.HTTPService.md#getauthentication)() | Returns the authentication type. |
| [getCachingTTL](dw.svc.HTTPService.md#getcachingttl)() | Returns the caching time to live value. |
| [getClient](dw.svc.HTTPService.md#getclient)() | Returns the underlying HTTP client object. |
| [getEncoding](dw.svc.HTTPService.md#getencoding)() | Returns the request body encoding to declare. |
| [getHostNameVerification](dw.svc.HTTPService.md#gethostnameverification)() | Determines whether host name verification is enabled. |
| [getIdentity](dw.svc.HTTPService.md#getidentity)() | Gets the identity used for mutual TLS (mTLS). |
| [getOutFile](dw.svc.HTTPService.md#getoutfile)() | Returns the output file, or null if there is none. |
| [getRequestMethod](dw.svc.HTTPService.md#getrequestmethod)() | Returns the request method. |
| [setAuthentication](dw.svc.HTTPService.md#setauthenticationstring)([String](TopLevel.String.md)) | Sets the type of authentication. |
| [setCachingTTL](dw.svc.HTTPService.md#setcachingttlnumber)([Number](TopLevel.Number.md)) | Enables caching for GET requests. |
| [setEncoding](dw.svc.HTTPService.md#setencodingstring)([String](TopLevel.String.md)) | Sets the encoding of the request body (if any). |
| [setHostNameVerification](dw.svc.HTTPService.md#sethostnameverificationboolean)([Boolean](TopLevel.Boolean.md)) | Sets whether certificate host name verification is enabled. |
| [setIdentity](dw.svc.HTTPService.md#setidentitykeyref)([KeyRef](dw.crypto.KeyRef.md)) | Sets the identity (private key) to use when mutual TLS (mTLS) is configured. |
| [setOutFile](dw.svc.HTTPService.md#setoutfilefile)([File](dw.io.File.md)) | Sets the output file in which to write the HTTP response body. |
| [setRequestMethod](dw.svc.HTTPService.md#setrequestmethodstring)([String](TopLevel.String.md)) | Sets the HTTP request method. |

### Methods inherited from class Service

[call](dw.svc.Service.md#callobject), [getConfiguration](dw.svc.Service.md#getconfiguration), [getCredentialID](dw.svc.Service.md#getcredentialid), [getRequestData](dw.svc.Service.md#getrequestdata), [getResponse](dw.svc.Service.md#getresponse), [getURL](dw.svc.Service.md#geturl), [isMock](dw.svc.Service.md#ismock), [isThrowOnError](dw.svc.Service.md#isthrowonerror), [setCredentialID](dw.svc.Service.md#setcredentialidstring), [setMock](dw.svc.Service.md#setmock), [setThrowOnError](dw.svc.Service.md#setthrowonerror), [setURL](dw.svc.Service.md#seturlstring)
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
    - [setCachingTTL(Number)](dw.svc.HTTPService.md#setcachingttlnumber)


---

### client
- client: [HTTPClient](dw.net.HTTPClient.md) `(read-only)`
  - : Returns the underlying HTTP client object.


---

### encoding
- encoding: [String](TopLevel.String.md)
  - : Returns the request body encoding to declare.


---

### hostNameVerification
- hostNameVerification: [Boolean](TopLevel.Boolean.md)
  - : Determines whether host name verification is enabled.


---

### identity
- identity: [KeyRef](dw.crypto.KeyRef.md)
  - : Gets the identity used for mutual TLS (mTLS).


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
- addHeader(name: [String](TopLevel.String.md), val: [String](TopLevel.String.md)): [HTTPService](dw.svc.HTTPService.md)
  - : Adds an HTTP Header.

    **Parameters:**
    - name - Header name.
    - val - Header value.

    **Returns:**
    - this HTTP Service.


---

### addParam(String, String)
- addParam(name: [String](TopLevel.String.md), val: [String](TopLevel.String.md)): [HTTPService](dw.svc.HTTPService.md)
  - : Adds a query parameter that will be appended to the URL.

    **Parameters:**
    - name - Parameter name.
    - val - Parameter value.

    **Returns:**
    - this HTTP Service.


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
    - [setCachingTTL(Number)](dw.svc.HTTPService.md#setcachingttlnumber)


---

### getClient()
- getClient(): [HTTPClient](dw.net.HTTPClient.md)
  - : Returns the underlying HTTP client object.

    **Returns:**
    - HTTP client object.


---

### getEncoding()
- getEncoding(): [String](TopLevel.String.md)
  - : Returns the request body encoding to declare.

    **Returns:**
    - Request encoding.


---

### getHostNameVerification()
- getHostNameVerification(): [Boolean](TopLevel.Boolean.md)
  - : Determines whether host name verification is enabled.

    **Returns:**
    - true if verification is enabled, false otherwise


---

### getIdentity()
- getIdentity(): [KeyRef](dw.crypto.KeyRef.md)
  - : Gets the identity used for mutual TLS (mTLS).

    **Returns:**
    - Reference to the private key, or null if not configured


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
- setAuthentication(authentication: [String](TopLevel.String.md)): [HTTPService](dw.svc.HTTPService.md)
  - : Sets the type of authentication. Valid values include "BASIC" and "NONE".
      
      
      The default value is BASIC.


    **Parameters:**
    - authentication - Type of authentication.

    **Returns:**
    - this HTTP Service.


---

### setCachingTTL(Number)
- setCachingTTL(ttl: [Number](TopLevel.Number.md)): [HTTPService](dw.svc.HTTPService.md)
  - : Enables caching for GET requests.
      
      
      This only caches status codes 2xx with a content length and size of less than 50k that are not immediately
      written to file. The URL and the user name are used as cache keys. The total size of cacheable content and the
      number of cached items is limited and automatically managed by the system.
      
      
      Cache control information sent by the remote server is ignored.
      
      
      Caching HTTP responses should be done very carefully. It is important to ensure that the response really depends
      only on the URL and doesn't contain any remote state information or time information which is independent of the
      URL. It is also important to verify that the application sends exactly the same URL multiple times.


    **Parameters:**
    - ttl - The time to live for the cached content in seconds. A value of 0 disables caching.

    **See Also:**
    - [HTTPClient.enableCaching(Number)](dw.net.HTTPClient.md#enablecachingnumber)


---

### setEncoding(String)
- setEncoding(encoding: [String](TopLevel.String.md)): [HTTPService](dw.svc.HTTPService.md)
  - : Sets the encoding of the request body (if any).
      
      
      The default value is UTF-8.


    **Parameters:**
    - encoding - Encoding of the request body.

    **Returns:**
    - this HTTP Service.


---

### setHostNameVerification(Boolean)
- setHostNameVerification(enable: [Boolean](TopLevel.Boolean.md)): [HTTPService](dw.svc.HTTPService.md)
  - : Sets whether certificate host name verification is enabled.
      The default value is true. Set it to false to disable host name verification.


    **Parameters:**
    - enable - true to enable host name verification or false to disable it.

    **Returns:**
    - this HTTP Service.


---

### setIdentity(KeyRef)
- setIdentity(keyRef: [KeyRef](dw.crypto.KeyRef.md)): [HTTPService](dw.svc.HTTPService.md)
  - : Sets the identity (private key) to use when mutual TLS (mTLS) is configured.
      
      
      If this is not set and mTLS is used then the private key will be chosen from the key store based on the host
      name.
      If this is set to a reference named "\_\_NONE\_\_" then no private key will be used even if one is requested by the remote server.


    **Parameters:**
    - keyRef - Reference to the private key


---

### setOutFile(File)
- setOutFile(outFile: [File](dw.io.File.md)): [HTTPService](dw.svc.HTTPService.md)
  - : Sets the output file in which to write the HTTP response body.
      
      
      The default behavior is to not write a file.


    **Parameters:**
    - outFile - Output file, or null to disable.

    **Returns:**
    - this HTTP Service.


---

### setRequestMethod(String)
- setRequestMethod(requestMethod: [String](TopLevel.String.md)): [HTTPService](dw.svc.HTTPService.md)
  - : Sets the HTTP request method.
      
      
      Valid values include GET, PUT, POST, and DELETE.
      
      
      The default value is POST.


    **Parameters:**
    - requestMethod - HTTP request method.

    **Returns:**
    - this HTTP Service.


---

<!-- prettier-ignore-end -->
