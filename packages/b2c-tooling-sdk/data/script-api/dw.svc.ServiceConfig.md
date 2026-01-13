<!-- prettier-ignore-start -->
# Class ServiceConfig

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)
      - [dw.svc.ServiceConfig](dw.svc.ServiceConfig.md)

Configuration object for Services.


## Property Summary

| Property | Description |
| --- | --- |
| [ID](#id): [String](TopLevel.String.md) `(read-only)` | Returns the unique Service ID. |
| [credential](#credential): [ServiceCredential](dw.svc.ServiceCredential.md) `(read-only)` | Returns the related service credentials. |
| [profile](#profile): [ServiceProfile](dw.svc.ServiceProfile.md) `(read-only)` | Returns the related service profile. |
| [serviceType](#servicetype): [String](TopLevel.String.md) `(read-only)` | Returns the type of the service, such as HTTP or SOAP. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getCredential](dw.svc.ServiceConfig.md#getcredential)() | Returns the related service credentials. |
| [getID](dw.svc.ServiceConfig.md#getid)() | Returns the unique Service ID. |
| [getProfile](dw.svc.ServiceConfig.md#getprofile)() | Returns the related service profile. |
| [getServiceType](dw.svc.ServiceConfig.md#getservicetype)() | Returns the type of the service, such as HTTP or SOAP. |

### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### ID
- ID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the unique Service ID.


---

### credential
- credential: [ServiceCredential](dw.svc.ServiceCredential.md) `(read-only)`
  - : Returns the related service credentials.


---

### profile
- profile: [ServiceProfile](dw.svc.ServiceProfile.md) `(read-only)`
  - : Returns the related service profile.


---

### serviceType
- serviceType: [String](TopLevel.String.md) `(read-only)`
  - : Returns the type of the service, such as HTTP or SOAP.


---

## Method Details

### getCredential()
- getCredential(): [ServiceCredential](dw.svc.ServiceCredential.md)
  - : Returns the related service credentials.

    **Returns:**
    - Related service credentials.


---

### getID()
- getID(): [String](TopLevel.String.md)
  - : Returns the unique Service ID.

    **Returns:**
    - unique Service ID.


---

### getProfile()
- getProfile(): [ServiceProfile](dw.svc.ServiceProfile.md)
  - : Returns the related service profile.

    **Returns:**
    - Related service profile.


---

### getServiceType()
- getServiceType(): [String](TopLevel.String.md)
  - : Returns the type of the service, such as HTTP or SOAP.

    **Returns:**
    - Type of the service, such as HTTP or SOAP.


---

<!-- prettier-ignore-end -->
