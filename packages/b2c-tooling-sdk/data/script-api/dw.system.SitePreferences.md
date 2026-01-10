<!-- prettier-ignore-start -->
# Class SitePreferences

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)
      - [dw.system.SitePreferences](dw.system.SitePreferences.md)

SitePreferences is a container for custom site-level attributes. The object
corresponds with system object type "SitePreferences". It has no system
attributes and exists only as a place for merchants to define custom
attributes which need to be available for each site.


Logically there is only one SitePreferences instance per site. The instance
is obtained by calling [Site.getPreferences()](dw.system.Site.md#getpreferences). Once an
instance of the container is obtained, it is possible to read/write site
preference values by using the usual syntax for
[ExtensibleObject](dw.object.ExtensibleObject.md) instances. For example:


```
var sitePrefs : SitePreferences = dw.system.Site.getCurrent().getPreferences();
var mySitePrefValue : String = sitePrefs.getCustom()["mySitePref"];
```



**Note:** this class allows access to sensitive security-related data.
Pay special attention to PCI DSS v3. requirements 2, 4, and 12.


Commerce Cloud Digital defines many site-level preferences, relating to
baskets, timezone, locales, customers, etc, which can be managed within the
"Site Preferences" module of the Business Manager, but these preferences are
not accessible through this object. (SourceCodeURLParameterName is the one
exception to this rule.)



## Property Summary

| Property | Description |
| --- | --- |
| [sourceCodeURLParameterName](#sourcecodeurlparametername): [String](TopLevel.String.md) `(read-only)` | Returns the name of the source code url paremeter configured for the  site. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getSourceCodeURLParameterName](dw.system.SitePreferences.md#getsourcecodeurlparametername)() | Returns the name of the source code url paremeter configured for the  site. |

### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### sourceCodeURLParameterName
- sourceCodeURLParameterName: [String](TopLevel.String.md) `(read-only)`
  - : Returns the name of the source code url paremeter configured for the
      site.



---

## Method Details

### getSourceCodeURLParameterName()
- getSourceCodeURLParameterName(): [String](TopLevel.String.md)
  - : Returns the name of the source code url paremeter configured for the
      site.


    **Returns:**
    - source code url parameter name


---

<!-- prettier-ignore-end -->
