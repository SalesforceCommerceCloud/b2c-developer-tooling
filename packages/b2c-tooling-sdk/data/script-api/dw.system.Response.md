<!-- prettier-ignore-start -->
# Class Response

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.system.Response](dw.system.Response.md)

Represents an HTTP response in Commerce Cloud Digital. An instance of this class is implicitly available within
Digital script under the variable "response". The Response object can be used to set cookies and specific HTTP
headers, for directly accessing the output stream or for sending redirects.



## Constant Summary

| Constant | Description |
| --- | --- |
| [ACCESS_CONTROL_ALLOW_CREDENTIALS](#access_control_allow_credentials): [String](TopLevel.String.md) = "Access-Control-Allow-Credentials" | An allowed header name constant for Access-Control-Allow-Credentials |
| [ACCESS_CONTROL_ALLOW_HEADERS](#access_control_allow_headers): [String](TopLevel.String.md) = "Access-Control-Allow-Headers" | An allowed header name constant for Access-Control-Allow-Headers |
| [ACCESS_CONTROL_ALLOW_METHODS](#access_control_allow_methods): [String](TopLevel.String.md) = "Access-Control-Allow-Methods" | An allowed header name constant for Access-Control-Allow-Methods |
| [ACCESS_CONTROL_ALLOW_ORIGIN](#access_control_allow_origin): [String](TopLevel.String.md) = "Access-Control-Allow-Origin" | An allowed header name constant for Access-Control-Allow-Origin |
| [ACCESS_CONTROL_EXPOSE_HEADERS](#access_control_expose_headers): [String](TopLevel.String.md) = "Access-Control-Expose-Headers" | An allowed header name constant for Access-Control-Expose-Headers |
| [ALLOW](#allow): [String](TopLevel.String.md) = "Allow" | An allowed header name constant for Allow |
| [CONTENT_DISPOSITION](#content_disposition): [String](TopLevel.String.md) = "Content-Disposition" | An allowed header name constant for Content-Disposition |
| [CONTENT_LANGUAGE](#content_language): [String](TopLevel.String.md) = "Content-Language" | An allowed header name constant for Content-Language |
| [CONTENT_LOCATION](#content_location): [String](TopLevel.String.md) = "Content-Location" | An allowed header name constant for Content-Location |
| [CONTENT_MD5](#content_md5): [String](TopLevel.String.md) = "Content-MD5" | An allowed header name constant for Content-MD5 |
| [CONTENT_SECURITY_POLICY](#content_security_policy): [String](TopLevel.String.md) = "Content-Security-Policy" | An allowed header name constant for Content-Security-Policy. |
| [CONTENT_SECURITY_POLICY_REPORT_ONLY](#content_security_policy_report_only): [String](TopLevel.String.md) = "Content-Security-Policy-Report-Only" | An allowed header name constant for Content-Security-Policy-Report-Only. |
| [CONTENT_TYPE](#content_type): [String](TopLevel.String.md) = "Content-Type" | An allowed header name constant for Content-Type |
| [CROSS_ORIGIN_EMBEDDER_POLICY](#cross_origin_embedder_policy): [String](TopLevel.String.md) = "Cross-Origin-Embedder-Policy" | An allowed header name constant for Cross-Origin-Embedder-Policy |
| [CROSS_ORIGIN_EMBEDDER_POLICY_REPORT_ONLY](#cross_origin_embedder_policy_report_only): [String](TopLevel.String.md) = "Cross-Origin-Embedder-Policy-Report-Only" | An allowed header name constant for Cross-Origin-Embedder-Policy-Report-Only. |
| [CROSS_ORIGIN_OPENER_POLICY](#cross_origin_opener_policy): [String](TopLevel.String.md) = "Cross-Origin-Opener-Policy" | An allowed header name constant for Cross-Origin-Opener-Policy |
| [CROSS_ORIGIN_OPENER_POLICY_REPORT_ONLY](#cross_origin_opener_policy_report_only): [String](TopLevel.String.md) = "Cross-Origin-Opener-Policy-Report-Only" | An allowed header name constant for Cross-Origin-Opener-Policy-Report-Only. |
| [CROSS_ORIGIN_RESOURCE_POLICY](#cross_origin_resource_policy): [String](TopLevel.String.md) = "Cross-Origin-Resource-Policy" | An allowed header name constant for Cross-Origin-Resource-Policy |
| [LINK](#link): [String](TopLevel.String.md) = "Link" | An allowed header name constant for Link |
| [LOCATION](#location): [String](TopLevel.String.md) = "Location" | An allowed header name constant for Location |
| [PERMISSIONS_POLICY](#permissions_policy): [String](TopLevel.String.md) = "Permissions-Policy" | An allowed header name constant for Permissions-Policy |
| [PLATFORM_FOR_PRIVACY_PREFERENCES_PROJECT](#platform_for_privacy_preferences_project): [String](TopLevel.String.md) = "P3P" | An allowed header name constant for Platform for Privacy Preferences Project |
| [REFERRER_POLICY](#referrer_policy): [String](TopLevel.String.md) = "Referrer-Policy" | An allowed header name constant for Referrer-Policy |
| [REFRESH](#refresh): [String](TopLevel.String.md) = "Refresh" | An allowed header name constant for Refresh |
| [RETRY_AFTER](#retry_after): [String](TopLevel.String.md) = "Retry-After" | An allowed header name constant for Retry-After |
| [SERVICE_WORKER_ALLOWED](#service_worker_allowed): [String](TopLevel.String.md) = "service-worker-allowed" | An allowed header name constant for service-worker-allowed |
| [VARY](#vary): [String](TopLevel.String.md) = "Vary" | An allowed header name constant for Vary |
| [X_CONTENT_TYPE_OPTIONS](#x_content_type_options): [String](TopLevel.String.md) = "X-Content-Type-Options" | An allowed header name constant for X-Content-Type-Options |
| [X_FRAME_OPTIONS](#x_frame_options): [String](TopLevel.String.md) = "X-FRAME-OPTIONS" | An allowed header name constant for X-FRAME-OPTIONS. |
| [X_FRAME_OPTIONS_ALLOW_FROM](#x_frame_options_allow_from): [String](TopLevel.String.md) = "ALLOW-FROM" | An allowed value ALLOW-FROM for X-FRAME-OPTIONS |
| [X_FRAME_OPTIONS_DENY_VALUE](#x_frame_options_deny_value): [String](TopLevel.String.md) = "DENY" | An allowed value DENY for X-FRAME-OPTIONS |
| [X_FRAME_OPTIONS_SAMEORIGIN_VALUE](#x_frame_options_sameorigin_value): [String](TopLevel.String.md) = "SAMEORIGIN" | An allowed value SAME-ORIGIN value for X-FRAME-OPTIONS |
| [X_ROBOTS_TAG](#x_robots_tag): [String](TopLevel.String.md) = "X-Robots-Tag" | An allowed header name constant for X-Robots-Tag |
| [X_XSS_PROTECTION](#x_xss_protection): [String](TopLevel.String.md) = "X-XSS-Protection" | An allowed header name constant for X-XSS-Protection |

## Property Summary

| Property | Description |
| --- | --- |
| [writer](#writer): [PrintWriter](dw.io.PrintWriter.md) `(read-only)` | Returns a print writer which can be used to print content directly to the response. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [addHttpCookie](dw.system.Response.md#addhttpcookiecookie)([Cookie](dw.web.Cookie.md)) | Adds the specified cookie to the outgoing response. |
| [addHttpHeader](dw.system.Response.md#addhttpheaderstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Adds a response header with the given name and value. |
| [containsHttpHeader](dw.system.Response.md#containshttpheaderstring)([String](TopLevel.String.md)) | Checks whether the response message header has a field with the specified name. |
| [getWriter](dw.system.Response.md#getwriter)() | Returns a print writer which can be used to print content directly to the response. |
| [redirect](dw.system.Response.md#redirecturl)([URL](dw.web.URL.md)) | Sends a temporary redirect response (HTTP status 302) to the client for the specified redirect location URL. |
| [redirect](dw.system.Response.md#redirecturl-number)([URL](dw.web.URL.md), [Number](TopLevel.Number.md)) | Sends a redirect response with the given status to the client for the specified redirect location URL. |
| [redirect](dw.system.Response.md#redirecturlredirect)([URLRedirect](dw.web.URLRedirect.md)) | Sends a redirect response with the given status to the client for the specified redirect location URL. |
| [redirect](dw.system.Response.md#redirectstring)([String](TopLevel.String.md)) | Sends a temporary redirect response (HTTP status 302) to the client for the specified redirect location URL. |
| [redirect](dw.system.Response.md#redirectstring-number)([String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Sends a redirect response with the given status to the client for the specified redirect location URL. |
| [setBuffered](dw.system.Response.md#setbufferedboolean)([Boolean](TopLevel.Boolean.md)) | Sets whether the output should be buffered or streamed directly to the client. |
| [setContentType](dw.system.Response.md#setcontenttypestring)([String](TopLevel.String.md)) | Sets the content type for this response. |
| [setExpires](dw.system.Response.md#setexpiresdate)([Date](TopLevel.Date.md)) | Convenience method for [setExpires(Number)](dw.system.Response.md#setexpiresnumber) which takes a Date object. |
| [setExpires](dw.system.Response.md#setexpiresnumber)([Number](TopLevel.Number.md)) | Sets the cache expiration time for the response. |
| [setHttpHeader](dw.system.Response.md#sethttpheaderstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Adds a response header with the given name and value. |
| [setStatus](dw.system.Response.md#setstatusnumber)([Number](TopLevel.Number.md)) | Sets the HTTP response code. |
| [setVaryBy](dw.system.Response.md#setvarybystring)([String](TopLevel.String.md)) | Marks the response as personalized with the given variant identifier. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### ACCESS_CONTROL_ALLOW_CREDENTIALS

- ACCESS_CONTROL_ALLOW_CREDENTIALS: [String](TopLevel.String.md) = "Access-Control-Allow-Credentials"
  - : An allowed header name constant for Access-Control-Allow-Credentials


---

### ACCESS_CONTROL_ALLOW_HEADERS

- ACCESS_CONTROL_ALLOW_HEADERS: [String](TopLevel.String.md) = "Access-Control-Allow-Headers"
  - : An allowed header name constant for Access-Control-Allow-Headers


---

### ACCESS_CONTROL_ALLOW_METHODS

- ACCESS_CONTROL_ALLOW_METHODS: [String](TopLevel.String.md) = "Access-Control-Allow-Methods"
  - : An allowed header name constant for Access-Control-Allow-Methods


---

### ACCESS_CONTROL_ALLOW_ORIGIN

- ACCESS_CONTROL_ALLOW_ORIGIN: [String](TopLevel.String.md) = "Access-Control-Allow-Origin"
  - : An allowed header name constant for Access-Control-Allow-Origin


---

### ACCESS_CONTROL_EXPOSE_HEADERS

- ACCESS_CONTROL_EXPOSE_HEADERS: [String](TopLevel.String.md) = "Access-Control-Expose-Headers"
  - : An allowed header name constant for Access-Control-Expose-Headers


---

### ALLOW

- ALLOW: [String](TopLevel.String.md) = "Allow"
  - : An allowed header name constant for Allow


---

### CONTENT_DISPOSITION

- CONTENT_DISPOSITION: [String](TopLevel.String.md) = "Content-Disposition"
  - : An allowed header name constant for Content-Disposition


---

### CONTENT_LANGUAGE

- CONTENT_LANGUAGE: [String](TopLevel.String.md) = "Content-Language"
  - : An allowed header name constant for Content-Language


---

### CONTENT_LOCATION

- CONTENT_LOCATION: [String](TopLevel.String.md) = "Content-Location"
  - : An allowed header name constant for Content-Location


---

### CONTENT_MD5

- CONTENT_MD5: [String](TopLevel.String.md) = "Content-MD5"
  - : An allowed header name constant for Content-MD5


---

### CONTENT_SECURITY_POLICY

- CONTENT_SECURITY_POLICY: [String](TopLevel.String.md) = "Content-Security-Policy"
  - : An allowed header name constant for Content-Security-Policy.
      
      
      Note: The Commerce Cloud platform can override this header for tools like the Storefront Toolkit.



---

### CONTENT_SECURITY_POLICY_REPORT_ONLY

- CONTENT_SECURITY_POLICY_REPORT_ONLY: [String](TopLevel.String.md) = "Content-Security-Policy-Report-Only"
  - : An allowed header name constant for Content-Security-Policy-Report-Only.
      
      
      You can set this response header only for storefront requests. Report recipient can't be a B2C Commerce system.



---

### CONTENT_TYPE

- CONTENT_TYPE: [String](TopLevel.String.md) = "Content-Type"
  - : An allowed header name constant for Content-Type


---

### CROSS_ORIGIN_EMBEDDER_POLICY

- CROSS_ORIGIN_EMBEDDER_POLICY: [String](TopLevel.String.md) = "Cross-Origin-Embedder-Policy"
  - : An allowed header name constant for Cross-Origin-Embedder-Policy


---

### CROSS_ORIGIN_EMBEDDER_POLICY_REPORT_ONLY

- CROSS_ORIGIN_EMBEDDER_POLICY_REPORT_ONLY: [String](TopLevel.String.md) = "Cross-Origin-Embedder-Policy-Report-Only"
  - : An allowed header name constant for Cross-Origin-Embedder-Policy-Report-Only.
      
      
      You can set this response header only for storefront requests. Report recipient can't be a B2C Commerce system.



---

### CROSS_ORIGIN_OPENER_POLICY

- CROSS_ORIGIN_OPENER_POLICY: [String](TopLevel.String.md) = "Cross-Origin-Opener-Policy"
  - : An allowed header name constant for Cross-Origin-Opener-Policy


---

### CROSS_ORIGIN_OPENER_POLICY_REPORT_ONLY

- CROSS_ORIGIN_OPENER_POLICY_REPORT_ONLY: [String](TopLevel.String.md) = "Cross-Origin-Opener-Policy-Report-Only"
  - : An allowed header name constant for Cross-Origin-Opener-Policy-Report-Only.
      
      
      You can set this response header only for storefront requests. Report recipient can't be a B2C Commerce system.



---

### CROSS_ORIGIN_RESOURCE_POLICY

- CROSS_ORIGIN_RESOURCE_POLICY: [String](TopLevel.String.md) = "Cross-Origin-Resource-Policy"
  - : An allowed header name constant for Cross-Origin-Resource-Policy


---

### LINK

- LINK: [String](TopLevel.String.md) = "Link"
  - : An allowed header name constant for Link


---

### LOCATION

- LOCATION: [String](TopLevel.String.md) = "Location"
  - : An allowed header name constant for Location


---

### PERMISSIONS_POLICY

- PERMISSIONS_POLICY: [String](TopLevel.String.md) = "Permissions-Policy"
  - : An allowed header name constant for Permissions-Policy


---

### PLATFORM_FOR_PRIVACY_PREFERENCES_PROJECT

- PLATFORM_FOR_PRIVACY_PREFERENCES_PROJECT: [String](TopLevel.String.md) = "P3P"
  - : An allowed header name constant for Platform for Privacy Preferences Project


---

### REFERRER_POLICY

- REFERRER_POLICY: [String](TopLevel.String.md) = "Referrer-Policy"
  - : An allowed header name constant for Referrer-Policy


---

### REFRESH

- REFRESH: [String](TopLevel.String.md) = "Refresh"
  - : An allowed header name constant for Refresh


---

### RETRY_AFTER

- RETRY_AFTER: [String](TopLevel.String.md) = "Retry-After"
  - : An allowed header name constant for Retry-After


---

### SERVICE_WORKER_ALLOWED

- SERVICE_WORKER_ALLOWED: [String](TopLevel.String.md) = "service-worker-allowed"
  - : An allowed header name constant for service-worker-allowed


---

### VARY

- VARY: [String](TopLevel.String.md) = "Vary"
  - : An allowed header name constant for Vary


---

### X_CONTENT_TYPE_OPTIONS

- X_CONTENT_TYPE_OPTIONS: [String](TopLevel.String.md) = "X-Content-Type-Options"
  - : An allowed header name constant for X-Content-Type-Options


---

### X_FRAME_OPTIONS

- X_FRAME_OPTIONS: [String](TopLevel.String.md) = "X-FRAME-OPTIONS"
  - : An allowed header name constant for X-FRAME-OPTIONS.
      
      
      Note: The Commerce Cloud platform can override this header for tools like the Storefront Toolkit.



---

### X_FRAME_OPTIONS_ALLOW_FROM

- X_FRAME_OPTIONS_ALLOW_FROM: [String](TopLevel.String.md) = "ALLOW-FROM"
  - : An allowed value ALLOW-FROM for X-FRAME-OPTIONS


---

### X_FRAME_OPTIONS_DENY_VALUE

- X_FRAME_OPTIONS_DENY_VALUE: [String](TopLevel.String.md) = "DENY"
  - : An allowed value DENY for X-FRAME-OPTIONS


---

### X_FRAME_OPTIONS_SAMEORIGIN_VALUE

- X_FRAME_OPTIONS_SAMEORIGIN_VALUE: [String](TopLevel.String.md) = "SAMEORIGIN"
  - : An allowed value SAME-ORIGIN value for X-FRAME-OPTIONS


---

### X_ROBOTS_TAG

- X_ROBOTS_TAG: [String](TopLevel.String.md) = "X-Robots-Tag"
  - : An allowed header name constant for X-Robots-Tag


---

### X_XSS_PROTECTION

- X_XSS_PROTECTION: [String](TopLevel.String.md) = "X-XSS-Protection"
  - : An allowed header name constant for X-XSS-Protection


---

## Property Details

### writer
- writer: [PrintWriter](dw.io.PrintWriter.md) `(read-only)`
  - : Returns a print writer which can be used to print content directly to the response.


---

## Method Details

### addHttpCookie(Cookie)
- addHttpCookie(cookie: [Cookie](dw.web.Cookie.md)): void
  - : Adds the specified cookie to the outgoing response. This method can be called multiple times to set more than one
      cookie. If a cookie with the same cookie name, domain and path is set multiple times for the same response, only
      the last set cookie with this name is sent to the client. This method can be used to set, update or delete
      cookies at the client. If the cookie doesn't exist at the client, it is set initially. If a cookie with the same
      name, domain and path already exists at the client, it is updated. A cookie can be deleted at the client by
      submitting a cookie with the maxAge attribute set to 0 (see `Cookie.setMaxAge()
       ` for more information).
      
      
      ```
      _Example, how a cookie can be deleted at the client:_
      
      var cookie : Cookie = new Cookie("SomeName", "Simple Value");
      
      cookie.setMaxAge(0);
      
      response.addHttpCookie(cookie);
      ```
      
      
      You can't set a cookie's SameSite attribute using the API. The server sets SameSite to None if either the
      developer sets the cookie's Secure flag or the global security preference Enforce HTTPS is enabled, in which case
      the Secure flag is also set. Otherwise, the server doesn't set the SameSite attribute and the browser uses its
      own default SameSite setting. The SameSite attribute is not sent with a cookie if the server detects that the
      client doesn't correctly interpret the attribute.


    **Parameters:**
    - cookie - a Cookie object


---

### addHttpHeader(String, String)
- addHttpHeader(name: [String](TopLevel.String.md), value: [String](TopLevel.String.md)): void
  - : Adds a response header with the given name and value. This method allows response headers to have multiple
      values.
      
      
      For public headers, only the names listed in the "Constants" section are allowed. Custom header names must begin
      with the prefix "X-SF-CC-" and can contain only alphanumeric characters, dash, and underscore.


    **Parameters:**
    - name - the name to use for the response header.
    - value - the value to use.


---

### containsHttpHeader(String)
- containsHttpHeader(name: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Checks whether the response message header has a field with the specified name.

    **Parameters:**
    - name - the name to use.


---

### getWriter()
- getWriter(): [PrintWriter](dw.io.PrintWriter.md)
  - : Returns a print writer which can be used to print content directly to the response.


---

### redirect(URL)
- redirect(url: [URL](dw.web.URL.md)): void
  - : Sends a temporary redirect response (HTTP status 302) to the client for the specified redirect location URL.

    **Parameters:**
    - url - the URL object for the target location, must be not null


---

### redirect(URL, Number)
- redirect(url: [URL](dw.web.URL.md), status: [Number](TopLevel.Number.md)): void
  - : Sends a redirect response with the given status to the client for the specified redirect location URL.

    **Parameters:**
    - url - the URL object with the redirect location, must be not null
    - status - the status code for this redirect, must be 301, 302 or 307


---

### redirect(URLRedirect)
- redirect(redirect: [URLRedirect](dw.web.URLRedirect.md)): void
  - : Sends a redirect response with the given status to the client for the specified redirect location URL.

    **Parameters:**
    - redirect - the URLRedirect object with the location and status, must be not null


---

### redirect(String)
- redirect(location: [String](TopLevel.String.md)): void
  - : Sends a temporary redirect response (HTTP status 302) to the client for the specified redirect location URL. The
      target location must be a relative or an absolute URL.


    **Parameters:**
    - location - the target location as a string, must be not empty


---

### redirect(String, Number)
- redirect(location: [String](TopLevel.String.md), status: [Number](TopLevel.Number.md)): void
  - : Sends a redirect response with the given status to the client for the specified redirect location URL.

    **Parameters:**
    - location - the redirect location, must be not empty
    - status - the status code for this redirect, must be 301, 302 or 307


---

### setBuffered(Boolean)
- setBuffered(buffered: [Boolean](TopLevel.Boolean.md)): void
  - : Sets whether the output should be buffered or streamed directly to the client. By default, buffering is enabled.
      The mode can only be changed before anything has been written to the response. Switching buffering off and using
      streaming mode is recommended for sending large responses.


    **Parameters:**
    - buffered - if true, buffering is used, if false the response will be streamed


---

### setContentType(String)
- setContentType(contentType: [String](TopLevel.String.md)): void
  - : Sets the content type for this response. This method may only be called before any output is written to the
      response.


    **Parameters:**
    - contentType - the MIME type of the content, like "text/html", "application/json" etc.


---

### setExpires(Date)
- setExpires(expires: [Date](TopLevel.Date.md)): void
  - : Convenience method for [setExpires(Number)](dw.system.Response.md#setexpiresnumber) which takes a Date object.

    **Parameters:**
    - expires - a Date object.


---

### setExpires(Number)
- setExpires(expires: [Number](TopLevel.Number.md)): void
  - : Sets the cache expiration time for the response. The response will only be cached if caching was not disabled
      previously. By default, responses are not cached. This method can be called multiple times during request
      processing. If caching is enabled, the lowest expiration time, resulting from the invocations of the method
      becomes the cache expiration time. This is only used for HTTP requests. Streamed responses cannot be cached. This
      method is an alternative for setting the cache time using the <iscache> tag in ISML templates.


    **Parameters:**
    - expires - the expiration time in milliseconds since January 1, 1970, 00:00:00 GMT


---

### setHttpHeader(String, String)
- setHttpHeader(name: [String](TopLevel.String.md), value: [String](TopLevel.String.md)): void
  - : Adds a response header with the given name and value. If one or more value(s) have already been set, the new
      value overwrites the previous one. The [containsHttpHeader(String)](dw.system.Response.md#containshttpheaderstring) method can be used to test for the
      presence of a header before setting its value.
      
      
      For public headers, only the names listed in the "Constants" section are allowed. Custom header names must begin
      with the prefix "X-SF-CC-" and can contain only alphanumeric characters, dash, and underscore.


    **Parameters:**
    - name - the name to use for the response header.
    - value - the value to use.


---

### setStatus(Number)
- setStatus(status: [Number](TopLevel.Number.md)): void
  - : Sets the HTTP response code.

    **Parameters:**
    - status - a standard-conform HTTP status code, for example 200 for "OK"


---

### setVaryBy(String)
- setVaryBy(varyBy: [String](TopLevel.String.md)): void
  - : Marks the response as personalized with the given variant identifier. Commerce Cloud Digital identifies unique
      pages based on a combination of pricebook, promotion, sorting rule and A/B test segments, caches the different
      variants of the page, and then delivers the correct version to the user. If a page is personalized by means other
      than pricebook, promotion, sorting rule and A/B test, the page must not be cached, because the wrong variants of
      the page would be delivered to the user. For performance reasons, a page should only be marked as personalized if
      it really is. Otherwise, the performance can unnecessarily degrade.
      
      
      This method has the same effect as using <iscache varyby="price\_promotion" /> tag in an ISML template. Once
      the vary-by value was set, either using this method or by the <iscache> tag in a template, the entire
      response is treated as personalized.


    **Parameters:**
    - varyBy - the variation criteria, currently only "price\_promotion" is supported, any other value has no             effect


---

<!-- prettier-ignore-end -->
