<!-- prettier-ignore-start -->
# Class URLAction

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.web.URLAction](dw.web.URLAction.md)

The class is needed for the URL creation within template processing. It
represents a reference to a pipeline name and start node, usually used in a
HREF or a FORM action. URLAction instances are usually passed to one of the
methods in [URLUtils](dw.web.URLUtils.md) in order to generate an appropriately
constructed Commerce Cloud Digital URL.  For example:


`
  var urlAction : URLAction = new URLAction("SimplePipeline-Start", "SampleSite");

  var url : URL = URLUtils.abs(false, urlAction1);

  // url.toString() equals "http://" + request.httpHost + "/on/demandware.store/Sites-SampleSite-Site/default/SimplePipeline-Start"

 `



## Constructor Summary

| Constructor | Description |
| --- | --- |
| [URLAction](#urlactionstring)([String](TopLevel.String.md)) | Constructs an action for the current site and locale. |
| [URLAction](#urlactionstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Constructs an action for the specified site and the current locale. |
| [URLAction](#urlactionstring-string-string)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Constructs an action for the specified site and locale. |
| [URLAction](#urlactionstring-string-string-string)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Constructs an URL action for the specified site, locale and hostname. |

## Method Summary

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constructor Details

### URLAction(String)
- URLAction(action: [String](TopLevel.String.md))
  - : Constructs an action for the current site and locale.

    **Parameters:**
    - action - the target pipeline/controller, e.g. 'Default-Start'


---

### URLAction(String, String)
- URLAction(action: [String](TopLevel.String.md), siteName: [String](TopLevel.String.md))
  - : Constructs an action for the specified site and the current locale.

    **Parameters:**
    - action - the target pipeline/controller, e.g. 'Default-Start'
    - siteName - the target site, e.g. 'SampleSite'


---

### URLAction(String, String, String)
- URLAction(action: [String](TopLevel.String.md), siteName: [String](TopLevel.String.md), locale: [String](TopLevel.String.md))
  - : Constructs an action for the specified site and locale.

    **Parameters:**
    - action - the target pipeline/controller, e.g.: 'Default-Start'
    - siteName - the target site, e.g. 'SampleSite'
    - locale - the target locale, e.g. 'default'


---

### URLAction(String, String, String, String)
- URLAction(action: [String](TopLevel.String.md), siteName: [String](TopLevel.String.md), locale: [String](TopLevel.String.md), hostName: [String](TopLevel.String.md))
  - : Constructs an URL action for the specified site, locale and hostname. 
      
      The hostname must be defined in the site alias settings. If no hostname is provided, the HTTP/HTTPS
      host defined in the site alias settings will be used. If no HTTP/HTTPS host is defined in the site alias
      settings, the hostname of the current request is used.


    **Parameters:**
    - action - the target pipeline/controller, e.g.: 'Default-Start'
    - siteName - the target site, e.g. 'SampleSite'
    - locale - the target locale, e.g. 'default'
    - hostName - the host name, e.g. ‘www.shop.com'

    **Throws:**
    - Exception - if hostName is not defined in site alias settings


---

<!-- prettier-ignore-end -->
