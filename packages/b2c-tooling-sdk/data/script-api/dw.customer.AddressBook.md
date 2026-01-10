<!-- prettier-ignore-start -->
# Class AddressBook

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.customer.AddressBook](dw.customer.AddressBook.md)

Represents a set of addresses associated with a specific customer.
The AddressBook object gets its data from the Profile object for the customer.
When scripting, this class allows AddressBook to be treated as a separate object
from the Profile. However, data is only stored in the platform in the Profile object
and there is no separate AddressBook object. For this reason, the AddressBook ID is
always the customer profile ID.


**Note:** this class allows access to sensitive personal and private information.
Pay attention to appropriate legal and regulatory requirements when developing.



## Property Summary

| Property | Description |
| --- | --- |
| [addresses](#addresses): [List](dw.util.List.md) `(read-only)` | Returns a sorted list of addresses in the address book. |
| [preferredAddress](#preferredaddress): [CustomerAddress](dw.customer.CustomerAddress.md) | Returns the address that has been defined as the customer's preferred  address. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [createAddress](dw.customer.AddressBook.md#createaddressstring)([String](TopLevel.String.md)) | Creates a new, empty address object with the specified name. |
| [getAddress](dw.customer.AddressBook.md#getaddressstring)([String](TopLevel.String.md)) | Returns the address with the given name from the address book. |
| [getAddresses](dw.customer.AddressBook.md#getaddresses)() | Returns a sorted list of addresses in the address book. |
| [getPreferredAddress](dw.customer.AddressBook.md#getpreferredaddress)() | Returns the address that has been defined as the customer's preferred  address. |
| [removeAddress](dw.customer.AddressBook.md#removeaddresscustomeraddress)([CustomerAddress](dw.customer.CustomerAddress.md)) | Removes the specified address from the address book. |
| [setPreferredAddress](dw.customer.AddressBook.md#setpreferredaddresscustomeraddress)([CustomerAddress](dw.customer.CustomerAddress.md)) | Sets the specified address as the customer's preferred address. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### addresses
- addresses: [List](dw.util.List.md) `(read-only)`
  - : Returns a sorted list of addresses in the address book.  The addresses
      are sorted so that the preferred address is always sorted first.  The
      remaining addresses are sorted alphabetically by ID.



---

### preferredAddress
- preferredAddress: [CustomerAddress](dw.customer.CustomerAddress.md)
  - : Returns the address that has been defined as the customer's preferred
      address.



---

## Method Details

### createAddress(String)
- createAddress(name: [String](TopLevel.String.md)): [CustomerAddress](dw.customer.CustomerAddress.md)
  - : Creates a new, empty address object with the specified name.

    **Parameters:**
    - name - the ID of the address to create, must not be null.

    **Returns:**
    - the new address object or null if an address with the given name
              already exists in the address book.


    **Throws:**
    - NullArgumentException - If passed 'name' is null.
    - IllegalArgumentException - If passed 'name' is not null, but an                 empty string.


---

### getAddress(String)
- getAddress(id: [String](TopLevel.String.md)): [CustomerAddress](dw.customer.CustomerAddress.md)
  - : Returns the address with the given name from the address book. The name
      is a unique identifier of the address within the address book.


    **Parameters:**
    - id - An address ID, must not be null.

    **Returns:**
    - The Address object or null if the address does not exist.

    **Throws:**
    - NullArgumentException - If passed 'id' is null.
    - IllegalArgumentException - If passed 'id' is not null, but an                 empty string.


---

### getAddresses()
- getAddresses(): [List](dw.util.List.md)
  - : Returns a sorted list of addresses in the address book.  The addresses
      are sorted so that the preferred address is always sorted first.  The
      remaining addresses are sorted alphabetically by ID.


    **Returns:**
    - Sorted List of customer addresses in the address book.


---

### getPreferredAddress()
- getPreferredAddress(): [CustomerAddress](dw.customer.CustomerAddress.md)
  - : Returns the address that has been defined as the customer's preferred
      address.


    **Returns:**
    - the default CustomerAddress object, or null if there is no
              preferred address.



---

### removeAddress(CustomerAddress)
- removeAddress(address: [CustomerAddress](dw.customer.CustomerAddress.md)): void
  - : Removes the specified address from the address book. Because an address
      can be associated with a product list, you may want to verify if the
      address is being used by a product list. See ProductListMgr.findAddress().


    **Parameters:**
    - address - the address to remove, must not be null.


---

### setPreferredAddress(CustomerAddress)
- setPreferredAddress(anAddress: [CustomerAddress](dw.customer.CustomerAddress.md)): void
  - : Sets the specified address as the customer's preferred address. If null
      is passed, and there is an existing preferred address, then the address
      book will have no preferred address.


    **Parameters:**
    - anAddress - the address to be set as preferred, or null if the goal             is to unset the existing preferred address.


---

<!-- prettier-ignore-end -->
