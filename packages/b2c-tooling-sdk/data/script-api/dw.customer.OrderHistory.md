<!-- prettier-ignore-start -->
# Class OrderHistory

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.customer.OrderHistory](dw.customer.OrderHistory.md)

The class provides access to past orders of the customer.


**Note:** This class allows access to sensitive financial and cardholder data. Pay special attention to PCI DSS
v3. requirements 1, 3, 7, and 9. It also allows access to sensitive personal and private information. Pay attention
to appropriate legal and regulatory requirements related to this data.
**Note:** The following methods do not work with Salesforce Order Management orders.



## Property Summary

| Property | Description |
| --- | --- |
| [orderCount](#ordercount): [Number](TopLevel.Number.md) `(read-only)` | Returns the number of orders the customer has placed in the store. |
| [orders](#orders): [SeekableIterator](dw.util.SeekableIterator.md) `(read-only)` | Retrieves the order history for the customer in the current storefront site. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getOrderCount](dw.customer.OrderHistory.md#getordercount)() | Returns the number of orders the customer has placed in the store. |
| [getOrders](dw.customer.OrderHistory.md#getorders)() | Retrieves the order history for the customer in the current storefront site. |
| [getOrders](dw.customer.OrderHistory.md#getordersstring-string-object)([String](TopLevel.String.md), [String](TopLevel.String.md), [Object...](TopLevel.Object.md)) | Retrieves the order history for the customer in the current storefront site. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### orderCount
- orderCount: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the number of orders the customer has placed in the store.
      
      
      If the customer is anonymous, this method always returns zero. If an active data record is available for this
      customer, the orders count is retrieved from that record, otherwise a real-time query is used to get the count.



---

### orders
- orders: [SeekableIterator](dw.util.SeekableIterator.md) `(read-only)`
  - : Retrieves the order history for the customer in the current storefront site.
      
      
      If the result exceeds 1000 orders, only the first 1000 orders are retrieved. Same as
      
      
      ```
      orderHistory.getOrders( null, "creationDate DESC" )
      ```
      
      
      
      
      
      It is strongly recommended to call `[SeekableIterator.close()](dw.util.SeekableIterator.md#close)` on the returned
      SeekableIterator if not all of its elements are being retrieved. This will ensure the proper cleanup of system
      resources.


    **See Also:**
    - [getOrders(String, String, Object...)](dw.customer.OrderHistory.md#getordersstring-string-object)


---

## Method Details

### getOrderCount()
- getOrderCount(): [Number](TopLevel.Number.md)
  - : Returns the number of orders the customer has placed in the store.
      
      
      If the customer is anonymous, this method always returns zero. If an active data record is available for this
      customer, the orders count is retrieved from that record, otherwise a real-time query is used to get the count.


    **Returns:**
    - the number of orders the customer has placed in the store.


---

### getOrders()
- getOrders(): [SeekableIterator](dw.util.SeekableIterator.md)
  - : Retrieves the order history for the customer in the current storefront site.
      
      
      If the result exceeds 1000 orders, only the first 1000 orders are retrieved. Same as
      
      
      ```
      orderHistory.getOrders( null, "creationDate DESC" )
      ```
      
      
      
      
      
      It is strongly recommended to call `[SeekableIterator.close()](dw.util.SeekableIterator.md#close)` on the returned
      SeekableIterator if not all of its elements are being retrieved. This will ensure the proper cleanup of system
      resources.


    **Returns:**
    - the orders

    **See Also:**
    - [getOrders(String, String, Object...)](dw.customer.OrderHistory.md#getordersstring-string-object)


---

### getOrders(String, String, Object...)
- getOrders(query: [String](TopLevel.String.md), sortString: [String](TopLevel.String.md), params: [Object...](TopLevel.Object.md)): [SeekableIterator](dw.util.SeekableIterator.md)
  - : Retrieves the order history for the customer in the current storefront site.
      
      
      If the result exceeds 1000 orders, only the first 1000 orders are retrieved. Optionally, you can retrieve a subset
      of the orders by specifying a query. At maximum 3 expressions are allowed to be specified and no custom attribute
      expressions are allowed.
      
      
      
      
      It is strongly recommended to call `[SeekableIterator.close()](dw.util.SeekableIterator.md#close)` on the returned
      SeekableIterator if not all of its elements are being retrieved. This will ensure the proper cleanup of system
      resources.
      
      
      Example:
      
      
      ```
                 var orderHistory : dw.customer.OrderHistory = customer.getOrderHistory();
                 var orders = orderHistory.getOrders("status = {0}", "creationDate DESC", dw.order.Order.ORDER_STATUS_NEW);
                 for each (var order : dw.order.Order in orders) {
                     // ... process orders
                 }
                 orders.close();
      ```


    **Parameters:**
    - query - optional query
    - sortString - optional sort string
    - params - optional parameters for the query

    **Returns:**
    - the orders


---

<!-- prettier-ignore-end -->
