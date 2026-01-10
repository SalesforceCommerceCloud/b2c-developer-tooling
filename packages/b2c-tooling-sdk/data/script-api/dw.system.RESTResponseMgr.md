<!-- prettier-ignore-start -->
# Class RESTResponseMgr

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.system.RESTResponseMgr](dw.system.RESTResponseMgr.md)

This class provides helper methods for creating REST error and success responses. It is mainly intended to be used to
build Custom REST APIs. But, any controller implementation planning to provide REST-like responses can use these
methods. If these methods are being used in the controllers, note that a few defaults like URL prefix for
`type` in `createError` methods will correspond to Custom REST APIs.



## Constructor Summary

| Constructor | Description |
| --- | --- |
| [RESTResponseMgr](#restresponsemgr)() |  |

## Method Summary

| Method | Description |
| --- | --- |
| static [createEmptySuccess](dw.system.RESTResponseMgr.md#createemptysuccessnumber)([Number](TopLevel.Number.md)) | Constructs a new [RESTSuccessResponse](dw.system.RESTSuccessResponse.md) object. |
| static [createError](dw.system.RESTResponseMgr.md#createerrornumber)([Number](TopLevel.Number.md)) | Constructs a new [RESTErrorResponse](dw.system.RESTErrorResponse.md) object. |
| static [createError](dw.system.RESTResponseMgr.md#createerrornumber-string)([Number](TopLevel.Number.md), [String](TopLevel.String.md)) | Constructs a new [RESTErrorResponse](dw.system.RESTErrorResponse.md) object. |
| static [createError](dw.system.RESTResponseMgr.md#createerrornumber-string-string)([Number](TopLevel.Number.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Constructs a new [RESTErrorResponse](dw.system.RESTErrorResponse.md) object. |
| static [createError](dw.system.RESTResponseMgr.md#createerrornumber-string-string-string)([Number](TopLevel.Number.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Constructs a new [RESTErrorResponse](dw.system.RESTErrorResponse.md) object. |
| static [createScapiRemoteInclude](dw.system.RESTResponseMgr.md#createscapiremoteincludestring-string-string-string-urlparameter)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [URLParameter...](dw.web.URLParameter.md)) | Constructs a new [RemoteInclude](dw.system.RemoteInclude.md) object specific for the SCAPI include path. |
| static [createStorefrontControllerRemoteInclude](dw.system.RESTResponseMgr.md#createstorefrontcontrollerremoteincludeurlaction-urlparameter)([URLAction](dw.web.URLAction.md), [URLParameter...](dw.web.URLParameter.md)) | Constructs a new [RemoteInclude](dw.system.RemoteInclude.md) object specific for the Storefront Controller include path. |
| static [createSuccess](dw.system.RESTResponseMgr.md#createsuccessobject)([Object](TopLevel.Object.md)) | Constructs a new [RESTSuccessResponse](dw.system.RESTSuccessResponse.md) object. |
| static [createSuccess](dw.system.RESTResponseMgr.md#createsuccessobject-number)([Object](TopLevel.Object.md), [Number](TopLevel.Number.md)) | Constructs a new [RESTSuccessResponse](dw.system.RESTSuccessResponse.md) object. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constructor Details

### RESTResponseMgr()
- RESTResponseMgr()
  - : 


---

## Method Details

### createEmptySuccess(Number)
- static createEmptySuccess(statusCode: [Number](TopLevel.Number.md)): [RESTSuccessResponse](dw.system.RESTSuccessResponse.md)
  - : Constructs a new [RESTSuccessResponse](dw.system.RESTSuccessResponse.md) object. This method is to be used in scenarios where response body
      is not expected (e.g. statusCode is 204).


    **Parameters:**
    - statusCode - The http status code of the response. The statusCode parameter should conform to RFC standards             for a success.

    **Returns:**
    - A new [RESTSuccessResponse](dw.system.RESTSuccessResponse.md) object.

    **Throws:**
    - IllegalArgumentException - If the statusCode is not in the (100..299) range.


---

### createError(Number)
- static createError(statusCode: [Number](TopLevel.Number.md)): [RESTErrorResponse](dw.system.RESTErrorResponse.md)
  - : Constructs a new [RESTErrorResponse](dw.system.RESTErrorResponse.md) object. This method should be used when you have just the statusCode
      of the error and want the type of error to be inferred.
      
      
      'type' of the error is inferred from the status code as follows: 
      
      
      - `400`- `bad-request`
      - `401`- `unauthorized`
      - `403`- `forbidden`
      - `404`- `resource-not-found`
      - `409`- `conflict`
      - `412`- `precondition-failed`
      - `429`- `too-many-requests`
      - `500`- `internal-server-error`
      - `default`- `about:blank`


    **Parameters:**
    - statusCode - The error code of the response. The statusCode parameter should conform to RFC standards for an             error.

    **Returns:**
    - A new [RESTErrorResponse](dw.system.RESTErrorResponse.md) object.

    **Throws:**
    - IllegalArgumentException - If the statusCode is not in the (400..599) range.


---

### createError(Number, String)
- static createError(statusCode: [Number](TopLevel.Number.md), type: [String](TopLevel.String.md)): [RESTErrorResponse](dw.system.RESTErrorResponse.md)
  - : Constructs a new [RESTErrorResponse](dw.system.RESTErrorResponse.md) object. This method should be used when you want to omit 'title' and
      'detail' of the error. With this method, custom error codes and types apart from the standard ones can be
      constructed.


    **Parameters:**
    - statusCode - The error code of the response. The statusCode parameter should conform to RFC standards for an             error.
    - type - Type of the error according to RFC 9457. We enforce the following restrictions on top of the RFC:                          <li>If the provided type is not an absolute URL, it will be prepended with             `https://api.commercecloud.salesforce.com/documentation/error/v1/custom-errors/`.</li>             <li>Custom error types are not allowed to have SYSTEM error type prefix:             `https://api.commercecloud.salesforce.com/documentation/error/v1/errors/`.</li>             </ul>

    **Returns:**
    - A new [RESTErrorResponse](dw.system.RESTErrorResponse.md) object.

    **Throws:**
    - IllegalArgumentException - If the statusCode is not in the (400..599) range or if the error type is not a              valid URI or conflicts with the SYSTEM error type namespace.


---

### createError(Number, String, String)
- static createError(statusCode: [Number](TopLevel.Number.md), type: [String](TopLevel.String.md), title: [String](TopLevel.String.md)): [RESTErrorResponse](dw.system.RESTErrorResponse.md)
  - : Constructs a new [RESTErrorResponse](dw.system.RESTErrorResponse.md) object. This method should be used when you want to omit 'detail' of
      the error but want to have valid 'statusCode', 'type' and 'title'.


    **Parameters:**
    - statusCode - The error code of the response. The statusCode parameter should conform to RFC standards for an             error.
    - type - Type of the error according to RFC 9457. We enforce the following restrictions on top of the RFC:                          <li>If the provided type is not an absolute URL, it will be prepended with             `https://api.commercecloud.salesforce.com/documentation/error/v1/custom-errors/`.</li>             <li>Custom error types are not allowed to have SYSTEM error type prefix:             `https://api.commercecloud.salesforce.com/documentation/error/v1/errors/`.</li>             </ul>
    - title - Human-readable summary of the error type.

    **Returns:**
    - A new [RESTErrorResponse](dw.system.RESTErrorResponse.md) object.

    **Throws:**
    - IllegalArgumentException - If the statusCode is not in the (400..599) range or if the error type is not a              valid URI or conflicts with SYSTEM error type namespace.


---

### createError(Number, String, String, String)
- static createError(statusCode: [Number](TopLevel.Number.md), type: [String](TopLevel.String.md), title: [String](TopLevel.String.md), detail: [String](TopLevel.String.md)): [RESTErrorResponse](dw.system.RESTErrorResponse.md)
  - : Constructs a new [RESTErrorResponse](dw.system.RESTErrorResponse.md) object. This method can be used to construct error responses with
      valid 'statusCode', 'type', 'title' and 'detail'. If you want to omit title or detail, you can pass in
      `null`.


    **Parameters:**
    - statusCode - The error code of the response. The statusCode parameter should conform to RFC standards for an             error.
    - type - Type of the error according to RFC 9457. We enforce the following restrictions on top of the RFC:                          <li>If the provided type is not an absolute URL, it will be prepended with             `https://api.commercecloud.salesforce.com/documentation/error/v1/custom-errors/`.</li>             <li>Custom error types are not allowed to have SYSTEM error type prefix:             `https://api.commercecloud.salesforce.com/documentation/error/v1/errors/`.</li>             </ul>
    - title - Human-readable summary of the error type.
    - detail - Human-readable explanation of the specific occurrence of the error.

    **Returns:**
    - A new [RESTErrorResponse](dw.system.RESTErrorResponse.md) object.

    **Throws:**
    - IllegalArgumentException - If the statusCode is not in the (400..599) range or if the error type is not a              valid URI or conflicts with SYSTEM error type namespace.


---

### createScapiRemoteInclude(String, String, String, String, URLParameter...)
- static createScapiRemoteInclude(apiFamily: [String](TopLevel.String.md), apiName: [String](TopLevel.String.md), apiVersion: [String](TopLevel.String.md), resourcePath: [String](TopLevel.String.md), params: [URLParameter...](dw.web.URLParameter.md)): [RemoteInclude](dw.system.RemoteInclude.md)
  - : Constructs a new [RemoteInclude](dw.system.RemoteInclude.md) object specific for the SCAPI include path.
      Usage:
      SCAPI remote include URL have following form:
      
      ```
      BASE_PATH/{apiFamily}/{apiName}/{apiVersion}/organizations/ORG_ID/{resourcePath}[?params]
      ```
      
      For the given SCAPI resource path:
      
      ```
      BASE_PATH/product/shopper-products/v1/organizations/ORG_ID/categories/root?siteId=YourShopHere
      ```
      
      RemoteInclude object can be constructed in a script like following:
      
      ```
      let include = dw.system.RESTResponseMgr.createScapiRemoteInclude("product", "shopper-products", "v1", "categories/root",
          dw.web.URLParameter("siteId", "YourShopHere"));
      ```
      
      Please notice that **'BASE\_PATH'** and **'ORG\_ID'** are automatically resolved.


    **Parameters:**
    - apiFamily - an API Family name. **Example:** 'product'.
    - apiName - an API Name. **Example:** 'shopper-products'.
    - apiVersion - an API Version. **Example:** 'v1'.
    - resourcePath - a Resource path. **Example:** 'categories/root'
    - params - a query parameters _(optional)_

    **Returns:**
    - a new instance of [RemoteInclude](dw.system.RemoteInclude.md).


---

### createStorefrontControllerRemoteInclude(URLAction, URLParameter...)
- static createStorefrontControllerRemoteInclude(action: [URLAction](dw.web.URLAction.md), params: [URLParameter...](dw.web.URLParameter.md)): [RemoteInclude](dw.system.RemoteInclude.md)
  - : Constructs a new [RemoteInclude](dw.system.RemoteInclude.md) object specific for the Storefront Controller include path.

    **Parameters:**
    - action - a container to specify target controller. Hostnames in URL actions are ignored.
    - params - a query parameters _(optional)_.

    **Returns:**
    - a new instance of [RemoteInclude](dw.system.RemoteInclude.md).


---

### createSuccess(Object)
- static createSuccess(body: [Object](TopLevel.Object.md)): [RESTSuccessResponse](dw.system.RESTSuccessResponse.md)
  - : Constructs a new [RESTSuccessResponse](dw.system.RESTSuccessResponse.md) object. HTTP status code of the response will be defaulted to 200.

    **Parameters:**
    - body - The body of the successful response. This should always be a valid JavaScript JSON object.

    **Returns:**
    - A new [RESTSuccessResponse](dw.system.RESTSuccessResponse.md) object.


---

### createSuccess(Object, Number)
- static createSuccess(body: [Object](TopLevel.Object.md), statusCode: [Number](TopLevel.Number.md)): [RESTSuccessResponse](dw.system.RESTSuccessResponse.md)
  - : Constructs a new [RESTSuccessResponse](dw.system.RESTSuccessResponse.md) object.

    **Parameters:**
    - body - The body of the successful response. This should always be a valid JavaScript JSON object.
    - statusCode - The http status code of the response. The statusCode parameter should conform to RFC standards             for a success.

    **Returns:**
    - A new [RESTSuccessResponse](dw.system.RESTSuccessResponse.md) object.

    **Throws:**
    - IllegalArgumentException - If the statusCode is not in the (100..299) range.


---

<!-- prettier-ignore-end -->
