<!-- prettier-ignore-start -->
# Class ShippingMethod

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)
      - [dw.order.ShippingMethod](dw.order.ShippingMethod.md)

ShippingMethod represents how the shipment will be shipped.


## Property Summary

| Property | Description |
| --- | --- |
| [ID](#id): [String](TopLevel.String.md) `(read-only)` | Returns the ID of the shipping method. |
| [baseMethod](#basemethod): [ShippingMethod](dw.order.ShippingMethod.md) `(read-only)` | Returns the base shipping method or null if undefined. |
| [currencyCode](#currencycode): [String](TopLevel.String.md) `(read-only)` | Returns the currency code associated with the shipping method |
| [customerGroups](#customergroups): [Collection](dw.util.Collection.md) `(read-only)` | Returns the customer groups assigned to the shipping method. |
| [defaultMethod](#defaultmethod): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns 'true' if the shipping method is marked as 'default' for the current session's currency. |
| [dependentMethods](#dependentmethods): [Collection](dw.util.Collection.md) `(read-only)` | Returns the dependent shipping methods of this shipping method,  regardless of the online status of the methods. |
| [description](#description): [String](TopLevel.String.md) `(read-only)` | Returns the description of the shipping method as specified in the current locale or  null if it could not be found. |
| [displayName](#displayname): [String](TopLevel.String.md) `(read-only)` | Returns the display name of the shipping method in the current locale or  null if it could not be found. |
| [online](#online): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns true if shipping method is online, false otherwise |
| [taxClassID](#taxclassid): [String](TopLevel.String.md) `(read-only)` | Returns the tax class id of the shipping method. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getBaseMethod](dw.order.ShippingMethod.md#getbasemethod)() | Returns the base shipping method or null if undefined. |
| [getCurrencyCode](dw.order.ShippingMethod.md#getcurrencycode)() | Returns the currency code associated with the shipping method |
| [getCustomerGroups](dw.order.ShippingMethod.md#getcustomergroups)() | Returns the customer groups assigned to the shipping method. |
| [getDependentMethods](dw.order.ShippingMethod.md#getdependentmethods)() | Returns the dependent shipping methods of this shipping method,  regardless of the online status of the methods. |
| [getDescription](dw.order.ShippingMethod.md#getdescription)() | Returns the description of the shipping method as specified in the current locale or  null if it could not be found. |
| [getDisplayName](dw.order.ShippingMethod.md#getdisplayname)() | Returns the display name of the shipping method in the current locale or  null if it could not be found. |
| [getID](dw.order.ShippingMethod.md#getid)() | Returns the ID of the shipping method. |
| [getTaxClassID](dw.order.ShippingMethod.md#gettaxclassid)() | Returns the tax class id of the shipping method. |
| [isDefaultMethod](dw.order.ShippingMethod.md#isdefaultmethod)() | Returns 'true' if the shipping method is marked as 'default' for the current session's currency. |
| [isOnline](dw.order.ShippingMethod.md#isonline)() | Returns true if shipping method is online, false otherwise |

### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### ID
- ID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the ID of the shipping method.


---

### baseMethod
- baseMethod: [ShippingMethod](dw.order.ShippingMethod.md) `(read-only)`
  - : Returns the base shipping method or null if undefined.


---

### currencyCode
- currencyCode: [String](TopLevel.String.md) `(read-only)`
  - : Returns the currency code associated with the shipping method


---

### customerGroups
- customerGroups: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns the customer groups assigned to the shipping method.
      Assigned ids that do not belong to an existing customer group are ignored.



---

### defaultMethod
- defaultMethod: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns 'true' if the shipping method is marked as 'default' for the current session's currency.
      Otherwise 'false' is returned.



---

### dependentMethods
- dependentMethods: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns the dependent shipping methods of this shipping method,
      regardless of the online status of the methods. 
      
      Dependent shipping methods have this method as their base method.



---

### description
- description: [String](TopLevel.String.md) `(read-only)`
  - : Returns the description of the shipping method as specified in the current locale or
      null if it could not be found.



---

### displayName
- displayName: [String](TopLevel.String.md) `(read-only)`
  - : Returns the display name of the shipping method in the current locale or
      null if it could not be found.



---

### online
- online: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns true if shipping method is online, false otherwise


---

### taxClassID
- taxClassID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the tax class id of the shipping method.


---

## Method Details

### getBaseMethod()
- getBaseMethod(): [ShippingMethod](dw.order.ShippingMethod.md)
  - : Returns the base shipping method or null if undefined.

    **Returns:**
    - Base shipping method


---

### getCurrencyCode()
- getCurrencyCode(): [String](TopLevel.String.md)
  - : Returns the currency code associated with the shipping method

    **Returns:**
    - currency code


---

### getCustomerGroups()
- getCustomerGroups(): [Collection](dw.util.Collection.md)
  - : Returns the customer groups assigned to the shipping method.
      Assigned ids that do not belong to an existing customer group are ignored.


    **Returns:**
    - customer groups


---

### getDependentMethods()
- getDependentMethods(): [Collection](dw.util.Collection.md)
  - : Returns the dependent shipping methods of this shipping method,
      regardless of the online status of the methods. 
      
      Dependent shipping methods have this method as their base method.


    **Returns:**
    - Dependent shipping methods


---

### getDescription()
- getDescription(): [String](TopLevel.String.md)
  - : Returns the description of the shipping method as specified in the current locale or
      null if it could not be found.


    **Returns:**
    - he description of the shipping method as specified in the current locale or
      null if it could not be found.



---

### getDisplayName()
- getDisplayName(): [String](TopLevel.String.md)
  - : Returns the display name of the shipping method in the current locale or
      null if it could not be found.


    **Returns:**
    - the display name of the shipping method or null if it could not be found.


---

### getID()
- getID(): [String](TopLevel.String.md)
  - : Returns the ID of the shipping method.

    **Returns:**
    - the ID of the shipping method.


---

### getTaxClassID()
- getTaxClassID(): [String](TopLevel.String.md)
  - : Returns the tax class id of the shipping method.

    **Returns:**
    - the tax class id of the shipping method.


---

### isDefaultMethod()
- isDefaultMethod(): [Boolean](TopLevel.Boolean.md)
  - : Returns 'true' if the shipping method is marked as 'default' for the current session's currency.
      Otherwise 'false' is returned.


    **Returns:**
    - 'true' if it is the default shipping method of the site


---

### isOnline()
- isOnline(): [Boolean](TopLevel.Boolean.md)
  - : Returns true if shipping method is online, false otherwise


---

<!-- prettier-ignore-end -->
