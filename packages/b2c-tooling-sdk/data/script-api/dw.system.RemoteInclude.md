<!-- prettier-ignore-start -->
# Class RemoteInclude

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.system.RemoteInclude](dw.system.RemoteInclude.md)

The class represents a remote include value that can be assigned to JSON Object properties.


**Important notes:**

- Authentication and authorization checks are performed only for the top  level request, but NOT for remote include requests.
- The `RestResponseMgr`method `createScapiRemoteInclude()`allows only SCAPI URLs.
- The `RestResponseMgr`method `createStorefrontControllerRemoteInclude()`allows only Controller URLs.
- Correct rendering of RemoteInclude-containing objects is only performed  when processed by `dw.system.RESTSuccessResponse.render()`method. Please check the provided examples.





**Example 1. Specify remote include properties.**


```
function specifyRemoteIncludeProperties() {
   var includeValue0 = dw.system.RESTResponseMgr.createScapiRemoteInclude("custom", "sample", "v1", "resource/path/0", dw.web.URLParameter("siteId", "TestWapi"));
   var includeValue1 = dw.system.RESTResponseMgr.createScapiRemoteInclude("custom", "sample", "v1", "resource/path/1", dw.web.URLParameter("siteId", "TestWapi"));
   var greeting = { "hello": "world", "includeProperty0": includeValue0, "includeProperty1": includeValue1 };

   dw.system.RESTResponseMgr.createSuccess(greeting).render();
}
```





**Example 2. Specify array of remote include properties.**


```
function specifyArrayOfRemoteIncludes() {
  var includeValue0 = dw.system.RESTResponseMgr.createScapiRemoteInclude("custom", "sample", "v1", "resource/path/0", dw.web.URLParameter("siteId", "TestWapi"));
  var includeValue1 = dw.system.RESTResponseMgr.createScapiRemoteInclude("custom", "sample", "v1", "resource/path/1", dw.web.URLParameter("siteId", "TestWapi"));
  var greeting = { "hello": "world", "includeArray": [includeValue0, includeValue1] };

  dw.system.RESTResponseMgr.createSuccess(greeting).render();
}
```





**Example 3. Storefront controller remote include.**


```
function storefrontRemoteInclude()
{
    let remoteInclude = dw.system.RESTResponseMgr.createStorefrontControllerRemoteInclude(new URLAction("Category-Show", "Sites-MyShop-Site", dw.web.URLParameter("cid", "root")));
    let json = {
        status: "JSONOK",
        include: remoteInclude
    };
    dw.system.RESTResponseMgr.createSuccess(json).render();
}
```





**Error handling:**

**SCAPI:**


- In case of 404 response received on included resource, an empty JSON object '{}' will be supplied in final JSON.
- In case of 201..299, 3xx, 4xx (excluding 404), 5xx response from included resource, final response status will be 500 'Internal Server Error'

**Controllers:**


- In case of any non 200 response from the included resource an empty string will be included.
- Note: In case your response format is JSON be aware that this can result in invalid JSON.



## Property Summary

| Property | Description |
| --- | --- |
| [url](#url): [String](TopLevel.String.md) `(read-only)` | Returns the URL string value specified for the current instance. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getUrl](dw.system.RemoteInclude.md#geturl)() | Returns the URL string value specified for the current instance. |
| [toString](dw.system.RemoteInclude.md#tostring)() | Returns the URL string value specified for the current instance, same as  [getUrl()](dw.system.RemoteInclude.md#geturl). |
| [valueOf](dw.system.RemoteInclude.md#valueof)() | Returns the URL string value specified for the current instance, same as  [getUrl()](dw.system.RemoteInclude.md#geturl). |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### url
- url: [String](TopLevel.String.md) `(read-only)`
  - : Returns the URL string value specified for the current instance.


---

## Method Details

### getUrl()
- getUrl(): [String](TopLevel.String.md)
  - : Returns the URL string value specified for the current instance.


---

### toString()
- toString(): [String](TopLevel.String.md)
  - : Returns the URL string value specified for the current instance, same as
      [getUrl()](dw.system.RemoteInclude.md#geturl).



---

### valueOf()
- valueOf(): [Object](TopLevel.Object.md)
  - : Returns the URL string value specified for the current instance, same as
      [getUrl()](dw.system.RemoteInclude.md#geturl).



---

<!-- prettier-ignore-end -->
