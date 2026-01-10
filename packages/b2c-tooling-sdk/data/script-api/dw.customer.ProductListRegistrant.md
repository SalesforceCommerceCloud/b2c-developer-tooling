<!-- prettier-ignore-start -->
# Class ProductListRegistrant

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)
      - [dw.customer.ProductListRegistrant](dw.customer.ProductListRegistrant.md)

A ProductListRegistrant is typically associated with an event related product list
such as a gift registry. It holds information about a person associated with the
event such as a bride or groom.



## Property Summary

| Property | Description |
| --- | --- |
| [email](#email): [String](TopLevel.String.md) | Returns the email address of the registrant or null. |
| [firstName](#firstname): [String](TopLevel.String.md) | Returns the first name of the registrant or null. |
| [lastName](#lastname): [String](TopLevel.String.md) | Returns the last name of the registrant or null. |
| [role](#role): [String](TopLevel.String.md) | Returns the role of the registrant or null. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getEmail](dw.customer.ProductListRegistrant.md#getemail)() | Returns the email address of the registrant or null. |
| [getFirstName](dw.customer.ProductListRegistrant.md#getfirstname)() | Returns the first name of the registrant or null. |
| [getLastName](dw.customer.ProductListRegistrant.md#getlastname)() | Returns the last name of the registrant or null. |
| [getRole](dw.customer.ProductListRegistrant.md#getrole)() | Returns the role of the registrant or null. |
| [setEmail](dw.customer.ProductListRegistrant.md#setemailstring)([String](TopLevel.String.md)) | Sets the email address of the registrant. |
| [setFirstName](dw.customer.ProductListRegistrant.md#setfirstnamestring)([String](TopLevel.String.md)) | Sets the first name of the registrant. |
| [setLastName](dw.customer.ProductListRegistrant.md#setlastnamestring)([String](TopLevel.String.md)) | Sets the last name of the registrant. |
| [setRole](dw.customer.ProductListRegistrant.md#setrolestring)([String](TopLevel.String.md)) | Sets the role of the registrant. |

### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### email
- email: [String](TopLevel.String.md)
  - : Returns the email address of the registrant or null.


---

### firstName
- firstName: [String](TopLevel.String.md)
  - : Returns the first name of the registrant or null.


---

### lastName
- lastName: [String](TopLevel.String.md)
  - : Returns the last name of the registrant or null.


---

### role
- role: [String](TopLevel.String.md)
  - : Returns the role of the registrant or null. The role of a registrant
      can be for example the bride of a bridal couple.



---

## Method Details

### getEmail()
- getEmail(): [String](TopLevel.String.md)
  - : Returns the email address of the registrant or null.

    **Returns:**
    - the email address of the registrant or null.


---

### getFirstName()
- getFirstName(): [String](TopLevel.String.md)
  - : Returns the first name of the registrant or null.

    **Returns:**
    - the first name of the registrant or null.


---

### getLastName()
- getLastName(): [String](TopLevel.String.md)
  - : Returns the last name of the registrant or null.

    **Returns:**
    - the last name of the registrant or null.


---

### getRole()
- getRole(): [String](TopLevel.String.md)
  - : Returns the role of the registrant or null. The role of a registrant
      can be for example the bride of a bridal couple.


    **Returns:**
    - the role name of the registrant or null.


---

### setEmail(String)
- setEmail(email: [String](TopLevel.String.md)): void
  - : Sets the email address of the registrant.

    **Parameters:**
    - email - the email address of the registrant.


---

### setFirstName(String)
- setFirstName(firstName: [String](TopLevel.String.md)): void
  - : Sets the first name of the registrant.

    **Parameters:**
    - firstName - the first name of the registrant.


---

### setLastName(String)
- setLastName(lastName: [String](TopLevel.String.md)): void
  - : Sets the last name of the registrant.

    **Parameters:**
    - lastName - the last name of the registrant.


---

### setRole(String)
- setRole(role: [String](TopLevel.String.md)): void
  - : Sets the role of the registrant.

    **Parameters:**
    - role - the role of the registrant.


---

<!-- prettier-ignore-end -->
