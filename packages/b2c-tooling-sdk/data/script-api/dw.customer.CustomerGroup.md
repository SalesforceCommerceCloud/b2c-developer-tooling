<!-- prettier-ignore-start -->
# Class CustomerGroup

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)
      - [dw.customer.CustomerGroup](dw.customer.CustomerGroup.md)

CustomerGroups provide a means to segment customers by various criteria. A
merchant can then provide different site experiences (e.g. promotions,
prices, sorting rules) to each customer segment. Customer groups can consist
of either an explicit list of customers or a business rule that dynamically
determines whether a customer is a member. The former type is called
"explicit" and the latter type is called "dynamic".


- **Explicit customer group:**Consists of an explicit list of  customers. Only registered customers can be member of such a group.  isRuleBased==false.
- **Dynamic customer group:**Memberships are evaluated by a business  rule that is attached to the customer group. Registered as well as anonymous  customers can be member of such a group. isRuleBased==true.



**Note:** this class might allow access to sensitive personal and private
information, depending on how you segment your customers and the names given to
your custoemer groups. Pay attention to appropriate legal and regulatory requirements
when developing with this data.



## Property Summary

| Property | Description |
| --- | --- |
| [ID](#id): [String](TopLevel.String.md) `(read-only)` | Returns the unique ID of the customer group. |
| [description](#description): [String](TopLevel.String.md) `(read-only)` | Gets the value of the description of the customer group. |
| [ruleBased](#rulebased): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns true if the group determines the membership of customers  based on rules. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [assignCustomer](dw.customer.CustomerGroup.md#assigncustomercustomer)([Customer](dw.customer.Customer.md)) | Assigns the specified customer to this group. |
| [getDescription](dw.customer.CustomerGroup.md#getdescription)() | Gets the value of the description of the customer group. |
| [getID](dw.customer.CustomerGroup.md#getid)() | Returns the unique ID of the customer group. |
| [isRuleBased](dw.customer.CustomerGroup.md#isrulebased)() | Returns true if the group determines the membership of customers  based on rules. |
| [unassignCustomer](dw.customer.CustomerGroup.md#unassigncustomercustomer)([Customer](dw.customer.Customer.md)) | Unassigns the specified customer from this group. |

### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### ID
- ID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the unique ID of the customer group.


---

### description
- description: [String](TopLevel.String.md) `(read-only)`
  - : Gets the value of the description of the customer group.


---

### ruleBased
- ruleBased: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns true if the group determines the membership of customers
      based on rules. Returns false if the group provides explicit assignement
      of customers.



---

## Method Details

### assignCustomer(Customer)
- assignCustomer(customer: [Customer](dw.customer.Customer.md)): void
  - : Assigns the specified customer to this group. 
      
      The customer must be registered and the group must not be rule-based.


    **Parameters:**
    - customer - Registered customer, must not be null.


---

### getDescription()
- getDescription(): [String](TopLevel.String.md)
  - : Gets the value of the description of the customer group.

    **Returns:**
    - the description of the customer group


---

### getID()
- getID(): [String](TopLevel.String.md)
  - : Returns the unique ID of the customer group.

    **Returns:**
    - The unique semantic ID of the customer group.


---

### isRuleBased()
- isRuleBased(): [Boolean](TopLevel.Boolean.md)
  - : Returns true if the group determines the membership of customers
      based on rules. Returns false if the group provides explicit assignement
      of customers.


    **Returns:**
    - `True`, if the customer group is rule based.


---

### unassignCustomer(Customer)
- unassignCustomer(customer: [Customer](dw.customer.Customer.md)): void
  - : Unassigns the specified customer from this group. 
      
      The customer must be registered and the group must not be rule-based.


    **Parameters:**
    - customer - Registered customer, must not be null.


---

<!-- prettier-ignore-end -->
