<!-- prettier-ignore-start -->
# Class Request

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.system.Request](dw.system.Request.md)

Represents a request in Commerce Cloud Digital. Each pipeline dictionary contains a CurrentRequest object, which is of
type dw.system.Request. Most requests are HTTP requests, so you can use this object to get information about the HTTP
request, such as the HTTP headers. You can also get a list of cookies, if any, associated with the request. If the
request is issued from a job, the request is not an HTTP request, so HTTP-related methods return null.



## Property Summary

| Property | Description |
| --- | --- |
| [SCAPI](#scapi): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns whether the request originated in SCAPI. |
| [SCAPIPathParameters](#scapipathparameters): [Map](dw.util.Map.md) `(read-only)` | Returns a map containing all path parameters of current SCAPI request in the following way:  <ul>  <li>keys: path parameter names from path pattern</li>  <li>values: corresponding path parameter values from current request</li>  </ul>   Returns null if [isSCAPI()](dw.system.Request.md#isscapi) returns false i.e. |
| [SCAPIPathPattern](#scapipathpattern): [String](TopLevel.String.md) `(read-only)` | Returns the SCAPI path pattern in the following way:   <ul>  <li>The first three segments `/api-family/api-name/version` with concrete values.</li>  <li>The /organizations part with the path parameter name `organizationId` in curly brackets.</li>  <li>The actual resource path additional path parameter names in curly brackets.</li>  </ul>   Returns null if [isSCAPI()](dw.system.Request.md#isscapi) returns false i.e. |
| [clientId](#clientid): [String](TopLevel.String.md) `(read-only)` | Returns the client id of the current SCAPI or OCAPI request. |
| [custom](#custom): [CustomAttributes](dw.object.CustomAttributes.md) `(read-only)` | Returns all of the custom attributes associated with the request. |
| [geolocation](#geolocation): [Geolocation](dw.util.Geolocation.md) | Returns the physical location for the current request, if available. |
| [httpCookies](#httpcookies): [Cookies](dw.web.Cookies.md) `(read-only)` | Returns the Cookies object, which can be used to read cookies sent by the client. |
| [httpHeaders](#httpheaders): [Map](dw.util.Map.md) `(read-only)` | Returns a Map containing all HTTP header values. |
| [httpHost](#httphost): [String](TopLevel.String.md) `(read-only)` | Returns the host name or null if there is no host name. |
| [httpLocale](#httplocale): [String](TopLevel.String.md) `(read-only)` | Returns the locale or null if there is no associated locale. |
| [httpMethod](#httpmethod): [String](TopLevel.String.md) `(read-only)` | Returns the name of the HTTP method with which this request was made, for example, GET, POST, or PUT. |
| [httpParameterMap](#httpparametermap): [HttpParameterMap](dw.web.HttpParameterMap.md) `(read-only)` | Returns the parameter map that contains the HTTP parameters for the current request. |
| [httpParameters](#httpparameters): [Map](dw.util.Map.md) `(read-only)` | Returns a Map containing the raw HTTP parameters sent to the server. |
| [httpPath](#httppath): [String](TopLevel.String.md) `(read-only)` | Returns the path. |
| [httpProtocol](#httpprotocol): [String](TopLevel.String.md) `(read-only)` | Returns the HTTP protocol used for this request. |
| [httpQueryString](#httpquerystring): [String](TopLevel.String.md) `(read-only)` | Returns the query string or null if there is no query string. |
| [httpReferer](#httpreferer): [String](TopLevel.String.md) `(read-only)` | Returns the referer or null if there is no referer. |
| [httpRemoteAddress](#httpremoteaddress): [String](TopLevel.String.md) `(read-only)` | Returns the remote address or null if no remote address is found. |
| ~~[httpRequest](#httprequest): [Boolean](TopLevel.Boolean.md)~~ `(read-only)` | Identifies if this request is an HTTP request. |
| [httpSecure](#httpsecure): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns whether the HTTP communication is secure, which basically means that the communication happens via https. |
| [httpURL](#httpurl): [URL](dw.web.URL.md) `(read-only)` | Returns the complete URL of the request which was received at the server. |
| [httpUserAgent](#httpuseragent): [String](TopLevel.String.md) `(read-only)` | Returns the HTTP user agent or null if there is no user agent. |
| [includeRequest](#includerequest): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns true if the request represents a request for a remote include, false if it is a top-level request. |
| [locale](#locale): [String](TopLevel.String.md) | Returns the locale of the current request. |
| [ocapiVersion](#ocapiversion): [String](TopLevel.String.md) `(read-only)` | Returns the OCAPI version of the current request. |
| [pageMetaData](#pagemetadata): [PageMetaData](dw.web.PageMetaData.md) `(read-only)` | Returns the page meta data that are associated with the current request. |
| [requestID](#requestid): [String](TopLevel.String.md) `(read-only)` | Returns the unique identifier of the current request. |
| [session](#session): [Session](dw.system.Session.md) `(read-only)` | Returns the session associated with this request. |
| [triggeredForm](#triggeredform): [Form](dw.web.Form.md) `(read-only)` | Returns the form that was submitted by the client if the request represents a form submission. |
| [triggeredFormAction](#triggeredformaction): [FormAction](dw.web.FormAction.md) `(read-only)` | Returns the form action that was triggered by the client if the request represents a form submission. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| ~~[addHttpCookie](dw.system.Request.md#addhttpcookiecookie)([Cookie](dw.web.Cookie.md))~~ | Adds the specified cookie to the outgoing response. |
| [getClientId](dw.system.Request.md#getclientid)() | Returns the client id of the current SCAPI or OCAPI request. |
| [getCustom](dw.system.Request.md#getcustom)() | Returns all of the custom attributes associated with the request. |
| [getGeolocation](dw.system.Request.md#getgeolocation)() | Returns the physical location for the current request, if available. |
| [getHttpCookies](dw.system.Request.md#gethttpcookies)() | Returns the Cookies object, which can be used to read cookies sent by the client. |
| [getHttpHeaders](dw.system.Request.md#gethttpheaders)() | Returns a Map containing all HTTP header values. |
| [getHttpHost](dw.system.Request.md#gethttphost)() | Returns the host name or null if there is no host name. |
| [getHttpLocale](dw.system.Request.md#gethttplocale)() | Returns the locale or null if there is no associated locale. |
| [getHttpMethod](dw.system.Request.md#gethttpmethod)() | Returns the name of the HTTP method with which this request was made, for example, GET, POST, or PUT. |
| [getHttpParameterMap](dw.system.Request.md#gethttpparametermap)() | Returns the parameter map that contains the HTTP parameters for the current request. |
| [getHttpParameters](dw.system.Request.md#gethttpparameters)() | Returns a Map containing the raw HTTP parameters sent to the server. |
| [getHttpPath](dw.system.Request.md#gethttppath)() | Returns the path. |
| [getHttpProtocol](dw.system.Request.md#gethttpprotocol)() | Returns the HTTP protocol used for this request. |
| [getHttpQueryString](dw.system.Request.md#gethttpquerystring)() | Returns the query string or null if there is no query string. |
| [getHttpReferer](dw.system.Request.md#gethttpreferer)() | Returns the referer or null if there is no referer. |
| [getHttpRemoteAddress](dw.system.Request.md#gethttpremoteaddress)() | Returns the remote address or null if no remote address is found. |
| [getHttpURL](dw.system.Request.md#gethttpurl)() | Returns the complete URL of the request which was received at the server. |
| [getHttpUserAgent](dw.system.Request.md#gethttpuseragent)() | Returns the HTTP user agent or null if there is no user agent. |
| [getLocale](dw.system.Request.md#getlocale)() | Returns the locale of the current request. |
| [getOcapiVersion](dw.system.Request.md#getocapiversion)() | Returns the OCAPI version of the current request. |
| [getPageMetaData](dw.system.Request.md#getpagemetadata)() | Returns the page meta data that are associated with the current request. |
| [getRequestID](dw.system.Request.md#getrequestid)() | Returns the unique identifier of the current request. |
| [getSCAPIPathParameters](dw.system.Request.md#getscapipathparameters)() | Returns a map containing all path parameters of current SCAPI request in the following way:  <ul>  <li>keys: path parameter names from path pattern</li>  <li>values: corresponding path parameter values from current request</li>  </ul>   Returns null if [isSCAPI()](dw.system.Request.md#isscapi) returns false i.e. |
| [getSCAPIPathPattern](dw.system.Request.md#getscapipathpattern)() | Returns the SCAPI path pattern in the following way:   <ul>  <li>The first three segments `/api-family/api-name/version` with concrete values.</li>  <li>The /organizations part with the path parameter name `organizationId` in curly brackets.</li>  <li>The actual resource path additional path parameter names in curly brackets.</li>  </ul>   Returns null if [isSCAPI()](dw.system.Request.md#isscapi) returns false i.e. |
| [getSession](dw.system.Request.md#getsession)() | Returns the session associated with this request. |
| [getTriggeredForm](dw.system.Request.md#gettriggeredform)() | Returns the form that was submitted by the client if the request represents a form submission. |
| [getTriggeredFormAction](dw.system.Request.md#gettriggeredformaction)() | Returns the form action that was triggered by the client if the request represents a form submission. |
| ~~[isHttpRequest](dw.system.Request.md#ishttprequest)()~~ | Identifies if this request is an HTTP request. |
| [isHttpSecure](dw.system.Request.md#ishttpsecure)() | Returns whether the HTTP communication is secure, which basically means that the communication happens via https. |
| [isIncludeRequest](dw.system.Request.md#isincluderequest)() | Returns true if the request represents a request for a remote include, false if it is a top-level request. |
| [isSCAPI](dw.system.Request.md#isscapi)() | Returns whether the request originated in SCAPI. |
| [setGeolocation](dw.system.Request.md#setgeolocationgeolocation)([Geolocation](dw.util.Geolocation.md)) | Sets the physical location for the current request and remembers the new  value for the duration of the user session. |
| [setLocale](dw.system.Request.md#setlocalestring)([String](TopLevel.String.md)) | Sets the given locale for the request. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### SCAPI
- SCAPI: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns whether the request originated in SCAPI.


---

### SCAPIPathParameters
- SCAPIPathParameters: [Map](dw.util.Map.md) `(read-only)`
  - : Returns a map containing all path parameters of current SCAPI request in the following way:
      
      - keys: path parameter names from path pattern
      - values: corresponding path parameter values from current request
      
      
      Returns null if [isSCAPI()](dw.system.Request.md#isscapi) returns false i.e. if the request is not a SCAPI request.
      
      
      
      For example:
      
      - Current request: `/product/shopper-products/v1/organizations/sfcc_org/products/apple-ipod-shuffle`
      - Path pattern: `/product/shopper-products/v1/organizations/{organizationId}/products/{id}`
      - Result: [Map](dw.util.Map.md)with 2 key:value pairs: `organizationId:sfcc_org`and `id:apple-ipod-shuffle`.



---

### SCAPIPathPattern
- SCAPIPathPattern: [String](TopLevel.String.md) `(read-only)`
  - : Returns the SCAPI path pattern in the following way:
      
      
      - The first three segments `/api-family/api-name/version`with concrete values.
      - The /organizations part with the path parameter name `organizationId`in curly brackets.
      - The actual resource path additional path parameter names in curly brackets.
      
      
      Returns null if [isSCAPI()](dw.system.Request.md#isscapi) returns false i.e. if the request is not a SCAPI request.
      
      
      
      For example, in the context of a request to get a single product from shopper-products API, this method would
      return `/product/shopper-products/v1/organizations/{organizationId}/products/{id}`



---

### clientId
- clientId: [String](TopLevel.String.md) `(read-only)`
  - : Returns the client id of the current SCAPI or OCAPI request. If the request is not a SCAPI request or not an
      OCAPI request 'null' is returned. For client ids owned by Commerce Cloud Digital an alias is returned.



---

### custom
- custom: [CustomAttributes](dw.object.CustomAttributes.md) `(read-only)`
  - : Returns all of the custom attributes associated with the request. The attributes are stored for the life time of
      the request.



---

### geolocation
- geolocation: [Geolocation](dw.util.Geolocation.md)
  - : Returns the physical location for the current request, if available. The
      location is calculated based on the IP address of the request. Note, if
      the geolocation tracking feature is not enabled, this method always
      returns null.



---

### httpCookies
- httpCookies: [Cookies](dw.web.Cookies.md) `(read-only)`
  - : Returns the Cookies object, which can be used to read cookies sent by the client. Use the method
      `Response.addHttpCookie()` to add a cookie to the outgoing response.



---

### httpHeaders
- httpHeaders: [Map](dw.util.Map.md) `(read-only)`
  - : Returns a Map containing all HTTP header values.


---

### httpHost
- httpHost: [String](TopLevel.String.md) `(read-only)`
  - : Returns the host name or null if there is no host name.


---

### httpLocale
- httpLocale: [String](TopLevel.String.md) `(read-only)`
  - : Returns the locale or null if there is no associated locale.


---

### httpMethod
- httpMethod: [String](TopLevel.String.md) `(read-only)`
  - : Returns the name of the HTTP method with which this request was made, for example, GET, POST, or PUT.


---

### httpParameterMap
- httpParameterMap: [HttpParameterMap](dw.web.HttpParameterMap.md) `(read-only)`
  - : Returns the parameter map that contains the HTTP parameters for the current request.


---

### httpParameters
- httpParameters: [Map](dw.util.Map.md) `(read-only)`
  - : Returns a Map containing the raw HTTP parameters sent to the server. The Map contains name/value pairs. Each name
      is a String and each value is a String array.



---

### httpPath
- httpPath: [String](TopLevel.String.md) `(read-only)`
  - : Returns the path.


---

### httpProtocol
- httpProtocol: [String](TopLevel.String.md) `(read-only)`
  - : Returns the HTTP protocol used for this request. Possible values are "http" or "https". If the current activity
      is not related to an HTTP request, for example, when the request is part of a job, this method returns null.



---

### httpQueryString
- httpQueryString: [String](TopLevel.String.md) `(read-only)`
  - : Returns the query string or null if there is no query string.


---

### httpReferer
- httpReferer: [String](TopLevel.String.md) `(read-only)`
  - : Returns the referer or null if there is no referer.


---

### httpRemoteAddress
- httpRemoteAddress: [String](TopLevel.String.md) `(read-only)`
  - : Returns the remote address or null if no remote address is found.


---

### httpRequest
- ~~httpRequest: [Boolean](TopLevel.Boolean.md)~~ `(read-only)`
  - : Identifies if this request is an HTTP request. The method returns true, if the current processing is related to a
      HTTP request.


    **Deprecated:**
:::warning
Effectively always returns true.
:::

---

### httpSecure
- httpSecure: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns whether the HTTP communication is secure, which basically means that the communication happens via https.
      If the current activity is not related to an HTTP request the method returns false.



---

### httpURL
- httpURL: [URL](dw.web.URL.md) `(read-only)`
  - : Returns the complete URL of the request which was received at the server.
      This URL does not include SEO optimizations.



---

### httpUserAgent
- httpUserAgent: [String](TopLevel.String.md) `(read-only)`
  - : Returns the HTTP user agent or null if there is no user agent.


---

### includeRequest
- includeRequest: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns true if the request represents a request for a remote include, false if it is a top-level request.


---

### locale
- locale: [String](TopLevel.String.md)
  - : Returns the locale of the current request. This locale is set by the system based on the information in the URL.
      It may be different from the locale returned by [getHttpLocale()](dw.system.Request.md#gethttplocale), which is the preferred locale sent by the user agent.



---

### ocapiVersion
- ocapiVersion: [String](TopLevel.String.md) `(read-only)`
  - : Returns the OCAPI version of the current request. If this is not
      an OCAPI request, 'null' is returned.



---

### pageMetaData
- pageMetaData: [PageMetaData](dw.web.PageMetaData.md) `(read-only)`
  - : Returns the page meta data that are associated with the current request.


---

### requestID
- requestID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the unique identifier of the current request. The unique id is helpful for debugging purpose, e.g. relate
      debug messages to a particular request.



---

### session
- session: [Session](dw.system.Session.md) `(read-only)`
  - : Returns the session associated with this request.


---

### triggeredForm
- triggeredForm: [Form](dw.web.Form.md) `(read-only)`
  - : Returns the form that was submitted by the client if the request represents a form submission.


---

### triggeredFormAction
- triggeredFormAction: [FormAction](dw.web.FormAction.md) `(read-only)`
  - : Returns the form action that was triggered by the client if the request represents a form submission.


---

## Method Details

### addHttpCookie(Cookie)
- ~~addHttpCookie(cookie: [Cookie](dw.web.Cookie.md)): void~~
  - : Adds the specified cookie to the outgoing response. This method can be called multiple times to set more than one
      cookie. If a cookie with the same cookie name, domain and path is set multiple times for the same response, only
      the last set cookie with this name is send to the client. This method can be used to set, update or delete
      cookies at the client. If the cookie doesn't exist at the client, it is set initially. If a cookie with the same
      name, domain and path already exists at the client, it is updated. A cookie can be deleted at the client by
      submitting a cookie with the maxAge attribute set to 0 (see `Cookie.setMaxAge()
       ` for more information).
      
      
      ```
      _Example, how a cookie can be deleted at the client:_
      
      var cookie : Cookie = new Cookie("SomeName", "Simple Value");
      
      cookie.setMaxAge(0);
      
      request.addHttpCookie(cookie);
      ```


    **Parameters:**
    - cookie - a Cookie object

    **Deprecated:**
:::warning
Use [Response.addHttpCookie(Cookie)](dw.system.Response.md#addhttpcookiecookie) instead.
:::
    **API Version:**
:::note
No longer available as of version 99.2.
This method is deprecated and will be removed in the next API version.
:::

---

### getClientId()
- getClientId(): [String](TopLevel.String.md)
  - : Returns the client id of the current SCAPI or OCAPI request. If the request is not a SCAPI request or not an
      OCAPI request 'null' is returned. For client ids owned by Commerce Cloud Digital an alias is returned.


    **Returns:**
    - a client id or alias in case of an OCAPI request, otherwise null.


---

### getCustom()
- getCustom(): [CustomAttributes](dw.object.CustomAttributes.md)
  - : Returns all of the custom attributes associated with the request. The attributes are stored for the life time of
      the request.


    **Returns:**
    - all of the custom attributes associated with the request.


---

### getGeolocation()
- getGeolocation(): [Geolocation](dw.util.Geolocation.md)
  - : Returns the physical location for the current request, if available. The
      location is calculated based on the IP address of the request. Note, if
      the geolocation tracking feature is not enabled, this method always
      returns null.


    **Returns:**
    - The geolocation of the current request, or null if this is not
              available.



---

### getHttpCookies()
- getHttpCookies(): [Cookies](dw.web.Cookies.md)
  - : Returns the Cookies object, which can be used to read cookies sent by the client. Use the method
      `Response.addHttpCookie()` to add a cookie to the outgoing response.


    **Returns:**
    - Cookies object or null if this is not an HTTP request


---

### getHttpHeaders()
- getHttpHeaders(): [Map](dw.util.Map.md)
  - : Returns a Map containing all HTTP header values.

    **Returns:**
    - a Map containing all HTTP header values.


---

### getHttpHost()
- getHttpHost(): [String](TopLevel.String.md)
  - : Returns the host name or null if there is no host name.

    **Returns:**
    - the host name or null if there is no host name.


---

### getHttpLocale()
- getHttpLocale(): [String](TopLevel.String.md)
  - : Returns the locale or null if there is no associated locale.

    **Returns:**
    - the locale or null.


---

### getHttpMethod()
- getHttpMethod(): [String](TopLevel.String.md)
  - : Returns the name of the HTTP method with which this request was made, for example, GET, POST, or PUT.

    **Returns:**
    - the HTTP method


---

### getHttpParameterMap()
- getHttpParameterMap(): [HttpParameterMap](dw.web.HttpParameterMap.md)
  - : Returns the parameter map that contains the HTTP parameters for the current request.

    **Returns:**
    - the HTTP parameter map


---

### getHttpParameters()
- getHttpParameters(): [Map](dw.util.Map.md)
  - : Returns a Map containing the raw HTTP parameters sent to the server. The Map contains name/value pairs. Each name
      is a String and each value is a String array.


    **Returns:**
    - a Map containing all the raw HTTP parameters send to the server.


---

### getHttpPath()
- getHttpPath(): [String](TopLevel.String.md)
  - : Returns the path.

    **Returns:**
    - the path or null.


---

### getHttpProtocol()
- getHttpProtocol(): [String](TopLevel.String.md)
  - : Returns the HTTP protocol used for this request. Possible values are "http" or "https". If the current activity
      is not related to an HTTP request, for example, when the request is part of a job, this method returns null.


    **Returns:**
    - "http", "https" or null


---

### getHttpQueryString()
- getHttpQueryString(): [String](TopLevel.String.md)
  - : Returns the query string or null if there is no query string.

    **Returns:**
    - the query string or null.


---

### getHttpReferer()
- getHttpReferer(): [String](TopLevel.String.md)
  - : Returns the referer or null if there is no referer.

    **Returns:**
    - the referer or null if there is no referer.


---

### getHttpRemoteAddress()
- getHttpRemoteAddress(): [String](TopLevel.String.md)
  - : Returns the remote address or null if no remote address is found.

    **Returns:**
    - the remote address or null if no remote address is found.


---

### getHttpURL()
- getHttpURL(): [URL](dw.web.URL.md)
  - : Returns the complete URL of the request which was received at the server.
      This URL does not include SEO optimizations.


    **Returns:**
    - the URL as URL object


---

### getHttpUserAgent()
- getHttpUserAgent(): [String](TopLevel.String.md)
  - : Returns the HTTP user agent or null if there is no user agent.

    **Returns:**
    - the HTTP user agent or null if there is no user agent.


---

### getLocale()
- getLocale(): [String](TopLevel.String.md)
  - : Returns the locale of the current request. This locale is set by the system based on the information in the URL.
      It may be different from the locale returned by [getHttpLocale()](dw.system.Request.md#gethttplocale), which is the preferred locale sent by the user agent.


    **Returns:**
    - the locale of the current request, like 'en\_US'


---

### getOcapiVersion()
- getOcapiVersion(): [String](TopLevel.String.md)
  - : Returns the OCAPI version of the current request. If this is not
      an OCAPI request, 'null' is returned.


    **Returns:**
    - OCAPI version of the current request


---

### getPageMetaData()
- getPageMetaData(): [PageMetaData](dw.web.PageMetaData.md)
  - : Returns the page meta data that are associated with the current request.

    **Returns:**
    - the page meta data object


---

### getRequestID()
- getRequestID(): [String](TopLevel.String.md)
  - : Returns the unique identifier of the current request. The unique id is helpful for debugging purpose, e.g. relate
      debug messages to a particular request.


    **Returns:**
    - the unique identifier of the current request.


---

### getSCAPIPathParameters()
- getSCAPIPathParameters(): [Map](dw.util.Map.md)
  - : Returns a map containing all path parameters of current SCAPI request in the following way:
      
      - keys: path parameter names from path pattern
      - values: corresponding path parameter values from current request
      
      
      Returns null if [isSCAPI()](dw.system.Request.md#isscapi) returns false i.e. if the request is not a SCAPI request.
      
      
      
      For example:
      
      - Current request: `/product/shopper-products/v1/organizations/sfcc_org/products/apple-ipod-shuffle`
      - Path pattern: `/product/shopper-products/v1/organizations/{organizationId}/products/{id}`
      - Result: [Map](dw.util.Map.md)with 2 key:value pairs: `organizationId:sfcc_org`and `id:apple-ipod-shuffle`.


    **Returns:**
    - the path parameter map or null


---

### getSCAPIPathPattern()
- getSCAPIPathPattern(): [String](TopLevel.String.md)
  - : Returns the SCAPI path pattern in the following way:
      
      
      - The first three segments `/api-family/api-name/version`with concrete values.
      - The /organizations part with the path parameter name `organizationId`in curly brackets.
      - The actual resource path additional path parameter names in curly brackets.
      
      
      Returns null if [isSCAPI()](dw.system.Request.md#isscapi) returns false i.e. if the request is not a SCAPI request.
      
      
      
      For example, in the context of a request to get a single product from shopper-products API, this method would
      return `/product/shopper-products/v1/organizations/{organizationId}/products/{id}`


    **Returns:**
    - the path pattern or null.


---

### getSession()
- getSession(): [Session](dw.system.Session.md)
  - : Returns the session associated with this request.

    **Returns:**
    - the session associated with this request.


---

### getTriggeredForm()
- getTriggeredForm(): [Form](dw.web.Form.md)
  - : Returns the form that was submitted by the client if the request represents a form submission.

    **Returns:**
    - the form which was triggered


---

### getTriggeredFormAction()
- getTriggeredFormAction(): [FormAction](dw.web.FormAction.md)
  - : Returns the form action that was triggered by the client if the request represents a form submission.

    **Returns:**
    - the action of the form that was triggered


---

### isHttpRequest()
- ~~isHttpRequest(): [Boolean](TopLevel.Boolean.md)~~
  - : Identifies if this request is an HTTP request. The method returns true, if the current processing is related to a
      HTTP request.


    **Returns:**
    - true if the current processing is related to a HTTP request, false otherwise.

    **Deprecated:**
:::warning
Effectively always returns true.
:::

---

### isHttpSecure()
- isHttpSecure(): [Boolean](TopLevel.Boolean.md)
  - : Returns whether the HTTP communication is secure, which basically means that the communication happens via https.
      If the current activity is not related to an HTTP request the method returns false.



---

### isIncludeRequest()
- isIncludeRequest(): [Boolean](TopLevel.Boolean.md)
  - : Returns true if the request represents a request for a remote include, false if it is a top-level request.


---

### isSCAPI()
- isSCAPI(): [Boolean](TopLevel.Boolean.md)
  - : Returns whether the request originated in SCAPI.

    **Returns:**
    - true or false.


---

### setGeolocation(Geolocation)
- setGeolocation(geoLocation: [Geolocation](dw.util.Geolocation.md)): void
  - : Sets the physical location for the current request and remembers the new
      value for the duration of the user session. So any subsequent calls to
      [getGeolocation()](dw.system.Request.md#getgeolocation) will return this value


    **Parameters:**
    - geoLocation - the geolocation object to use


---

### setLocale(String)
- setLocale(localeID: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Sets the given locale for the request. The locale is only set if it is valid, if it is active and if it is
      allowed for the current site.


    **Parameters:**
    - localeID - the locale ID to be set, like 'en\_US'

    **Returns:**
    - true, if the locale was successfully set, false otherwise


---

<!-- prettier-ignore-end -->
