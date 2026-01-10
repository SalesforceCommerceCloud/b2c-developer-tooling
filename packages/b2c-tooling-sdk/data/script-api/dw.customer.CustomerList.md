<!-- prettier-ignore-start -->
# Class CustomerList

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.customer.CustomerList](dw.customer.CustomerList.md)

Object representing the collection of customers who are registered
for a given site. In Commerce Cloud Digital, every site has exactly
one assigned customer list but multiple sites may share a customer
list.



## Property Summary

| Property | Description |
| --- | --- |
| [ID](#id): [String](TopLevel.String.md) `(read-only)` | Get the ID of the customer list. |
| [description](#description): [String](TopLevel.String.md) `(read-only)` | Get the optional description of the customer list. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getDescription](dw.customer.CustomerList.md#getdescription)() | Get the optional description of the customer list. |
| [getID](dw.customer.CustomerList.md#getid)() | Get the ID of the customer list. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### ID
- ID: [String](TopLevel.String.md) `(read-only)`
  - : Get the ID of the customer list.  For customer lists that were created automatically
      for a given site, this is equal to the ID of the site itself.



---

### description
- description: [String](TopLevel.String.md) `(read-only)`
  - : Get the optional description of the customer list.


---

## Method Details

### getDescription()
- getDescription(): [String](TopLevel.String.md)
  - : Get the optional description of the customer list.

    **Returns:**
    - The optional description of the list.


---

### getID()
- getID(): [String](TopLevel.String.md)
  - : Get the ID of the customer list.  For customer lists that were created automatically
      for a given site, this is equal to the ID of the site itself.


    **Returns:**
    - The ID of the customer list.


---

<!-- prettier-ignore-end -->
