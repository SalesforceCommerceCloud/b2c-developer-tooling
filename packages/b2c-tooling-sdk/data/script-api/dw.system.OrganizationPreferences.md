<!-- prettier-ignore-start -->
# Class OrganizationPreferences

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)
      - [dw.system.OrganizationPreferences](dw.system.OrganizationPreferences.md)

OrganizationPreferences is a container for custom global (i.e.
organization-level) attributes. The object corresponds with system object
definition "OrganizationPreferences". It has no system attributes and exists
only as a place for merchants to define custom attributes which need to be
available to all of their sites.


An instance is obtained by calling [System.getPreferences()](dw.system.System.md#getpreferences).
Once an instance of the container is obtained, it is possible to read/write
organization preference values by using the usual syntax for
[ExtensibleObject](dw.object.ExtensibleObject.md) instances. For example:

```
var orgPrefs : OrganizationPreferences = dw.system.System.getPreferences();
var myOrgPrefValue : String = orgPrefs.getCustom()["myOrgPref"];
```



**Note:** this class allows access to sensitive security-related data.
Pay special attention to PCI DSS v3. requirements 2, 4, and 12.


Commerce Cloud Digital defines many organization-level preferences, relating to
locale, timezone, geolocations, etc, which can be managed within the
"Global Preferences" module of the Business Manager, but these preferences
are not accessible through this object.



## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
<!-- prettier-ignore-end -->
