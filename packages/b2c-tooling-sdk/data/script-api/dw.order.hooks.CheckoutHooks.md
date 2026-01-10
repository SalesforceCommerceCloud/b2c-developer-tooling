<!-- prettier-ignore-start -->
# Class CheckoutHooks

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.order.hooks.CheckoutHooks](dw.order.hooks.CheckoutHooks.md)

This interface represents script hooks that can be registered to populate customer details into a basket. It contains
the extension points (hook names), and the functions that are called by each extension point. A function must be
defined inside a JavaScript source and must be exported. The script with the exported hook function must be located
inside a site cartridge. Inside the site cartridge a 'package.json' file with a 'hooks' entry must exist.


```
"hooks": "./hooks.json"
```


The hooks entry links to a json file, relative to the 'package.json' file. This file lists all registered hooks
inside the hooks property:


```
"hooks": [
     {"name": "dw.order.populateCustomerDetails", "script": "./populateCustomerDetails.js"}
]
```


A hook entry has a 'name' and a 'script' property.

- The 'name' contains the extension point, the hook name.
- The 'script' contains the script relative to the hooks file, with the exported hook function.



## Constant Summary

| Constant | Description |
| --- | --- |
| [extensionPointPopulateCustomerDetails](#extensionpointpopulatecustomerdetails): [String](TopLevel.String.md) = "dw.order.populateCustomerDetails" | The extension point name dw.order.populateCustomerDetails. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [populateCustomerDetails](dw.order.hooks.CheckoutHooks.md#populatecustomerdetailsbasket-customer)([Basket](dw.order.Basket.md), [Customer](dw.customer.Customer.md)) | Populates registered customer details into a basket. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### extensionPointPopulateCustomerDetails

- extensionPointPopulateCustomerDetails: [String](TopLevel.String.md) = "dw.order.populateCustomerDetails"
  - : The extension point name dw.order.populateCustomerDetails.


---

## Method Details

### populateCustomerDetails(Basket, Customer)
- populateCustomerDetails(basket: [Basket](dw.order.Basket.md), customer: [Customer](dw.customer.Customer.md)): [Status](dw.system.Status.md)
  - : Populates registered customer details into a basket. This includes the default shipping address and default
      payment instrument from the registered customer's profile.
      
      
      If no override script is registered, the system defaults to the platform's standard population logic which copies
      the customer's default or first address to the basket's default shipment and billing address, then creates a
      payment instrument from the customer's default or first payment instrument.
      
      
      This method is automatically invoked when the populateCustomerDetails query parameter is set to
      true on createBasket and transferBasket endpoints.


    **Parameters:**
    - basket - the basket to populate with customer details
    - customer - the registered customer whose details should be populated into the basket


---

<!-- prettier-ignore-end -->
