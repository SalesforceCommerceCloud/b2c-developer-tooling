<!-- prettier-ignore-start -->
# Class CustomerActiveData

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)
      - [dw.object.ActiveData](dw.object.ActiveData.md)
        - [dw.customer.CustomerActiveData](dw.customer.CustomerActiveData.md)

Represents the active data for a [Customer](dw.customer.Customer.md) in Commerce Cloud Digital.


**Note:** this class allows access to sensitive personal and private information.
Pay attention to appropriate legal and regulatory requirements when developing.



## Property Summary

| Property | Description |
| --- | --- |
| [avgOrderValue](#avgordervalue): [Number](TopLevel.Number.md) `(read-only)` | Returns the average order value of the customer, or `null`  if none has been set or the value is no longer valid. |
| [discountValueWithCoupon](#discountvaluewithcoupon): [Number](TopLevel.Number.md) `(read-only)` | Returns the discount value resulting from coupons, that has been applied  to orders of the customer, or `null` if none has been set or  the value is no longer valid. |
| [discountValueWithoutCoupon](#discountvaluewithoutcoupon): [Number](TopLevel.Number.md) `(read-only)` | Returns the discount value resulting from promotions other than coupons,  that has been applied to orders of the customer, or `null`  if none has been set or the value is no longer valid. |
| [giftOrders](#giftorders): [Number](TopLevel.Number.md) `(read-only)` | Returns the number of orders for the Customer that contained at least  one product unit marked as a gift, or `null` if none has been  set or the value is no longer valid. |
| [giftUnits](#giftunits): [Number](TopLevel.Number.md) `(read-only)` | Returns the number of product units in orders for the customer  that were marked as a gift, or `null` if none has been set  or the value is no longer valid. |
| [lastOrderDate](#lastorderdate): [Date](TopLevel.Date.md) `(read-only)` | Returns the date of the last order for the customer, or `null`  if there are no orders for the customer. |
| [orderValue](#ordervalue): [Number](TopLevel.Number.md) `(read-only)` | Returns the lifetime order value of the customer, or `null`  if none has been set or the value is no longer valid. |
| [orderValueMonth](#ordervaluemonth): [Number](TopLevel.Number.md) `(read-only)` | Returns the order value of the customer, over the most recent 30 days,  or `null` if none has been set or the value is no longer valid. |
| [orders](#orders): [Number](TopLevel.Number.md) `(read-only)` | Returns the orders of the customer, or `null` if none  has been set or the value is no longer valid. |
| [productMastersOrdered](#productmastersordered): [String\[\]](TopLevel.String.md) `(read-only)` | Returns an array containing the master product SKUs of variation products  in orders for the customer, or an empty collection if no SKUs have been  set or the collection of SKUs is no longer valid. |
| [productsAbandonedMonth](#productsabandonedmonth): [String\[\]](TopLevel.String.md) `(read-only)` | Returns an array containing the SKUs of products in baskets abandoned  by the customer in the last 30 days, or an empty collection if no SKUs  have been set or the collection is no longer valid. |
| [productsOrdered](#productsordered): [String\[\]](TopLevel.String.md) `(read-only)` | Returns an array containing the SKUs of products in orders  for the customer, or an empty collection if no SKUs have been set or the  collection of SKUs is no longer valid. |
| [productsViewedMonth](#productsviewedmonth): [String\[\]](TopLevel.String.md) `(read-only)` | Returns an array containing the SKUs of products viewed by the  customer in the last 30 days, or an empty collection if no SKUs have been  set or the collection is no longer valid. |
| [returnValue](#returnvalue): [Number](TopLevel.Number.md) `(read-only)` | Returns the returned revenue of the customer, or `null`  if none has been set or the value is no longer valid. |
| [returns](#returns): [Number](TopLevel.Number.md) `(read-only)` | Returns the number of returns of the customer, or `null`  if none has been set or the value is no longer valid. |
| [sourceCodeOrders](#sourcecodeorders): [Number](TopLevel.Number.md) `(read-only)` | Returns the number of orders for the customer where a source code was  in effect, or `null` if none has been set or the value  is no longer valid. |
| [topCategoriesOrdered](#topcategoriesordered): [String\[\]](TopLevel.String.md) `(read-only)` | Returns an array containing the IDs of up to the top 20 categories for  customer orders, or an empty list if no categories have been set or the  list of categories is no longer valid. |
| [visitsMonth](#visitsmonth): [Number](TopLevel.Number.md) `(read-only)` | Returns the visits of the customer, over the most recent 30 days,  or `null` if none has been set or the value  is no longer valid. |
| [visitsWeek](#visitsweek): [Number](TopLevel.Number.md) `(read-only)` | Returns the visits of the customer, over the most recent 7 days,  or `null` if none has been set or the value  is no longer valid. |
| [visitsYear](#visitsyear): [Number](TopLevel.Number.md) `(read-only)` | Returns the visits of the customer, over the most recent 365 days,  or `null` if none has been set or the value  is no longer valid. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getAvgOrderValue](dw.customer.CustomerActiveData.md#getavgordervalue)() | Returns the average order value of the customer, or `null`  if none has been set or the value is no longer valid. |
| [getDiscountValueWithCoupon](dw.customer.CustomerActiveData.md#getdiscountvaluewithcoupon)() | Returns the discount value resulting from coupons, that has been applied  to orders of the customer, or `null` if none has been set or  the value is no longer valid. |
| [getDiscountValueWithoutCoupon](dw.customer.CustomerActiveData.md#getdiscountvaluewithoutcoupon)() | Returns the discount value resulting from promotions other than coupons,  that has been applied to orders of the customer, or `null`  if none has been set or the value is no longer valid. |
| [getGiftOrders](dw.customer.CustomerActiveData.md#getgiftorders)() | Returns the number of orders for the Customer that contained at least  one product unit marked as a gift, or `null` if none has been  set or the value is no longer valid. |
| [getGiftUnits](dw.customer.CustomerActiveData.md#getgiftunits)() | Returns the number of product units in orders for the customer  that were marked as a gift, or `null` if none has been set  or the value is no longer valid. |
| [getLastOrderDate](dw.customer.CustomerActiveData.md#getlastorderdate)() | Returns the date of the last order for the customer, or `null`  if there are no orders for the customer. |
| [getOrderValue](dw.customer.CustomerActiveData.md#getordervalue)() | Returns the lifetime order value of the customer, or `null`  if none has been set or the value is no longer valid. |
| [getOrderValueMonth](dw.customer.CustomerActiveData.md#getordervaluemonth)() | Returns the order value of the customer, over the most recent 30 days,  or `null` if none has been set or the value is no longer valid. |
| [getOrders](dw.customer.CustomerActiveData.md#getorders)() | Returns the orders of the customer, or `null` if none  has been set or the value is no longer valid. |
| [getProductMastersOrdered](dw.customer.CustomerActiveData.md#getproductmastersordered)() | Returns an array containing the master product SKUs of variation products  in orders for the customer, or an empty collection if no SKUs have been  set or the collection of SKUs is no longer valid. |
| [getProductsAbandonedMonth](dw.customer.CustomerActiveData.md#getproductsabandonedmonth)() | Returns an array containing the SKUs of products in baskets abandoned  by the customer in the last 30 days, or an empty collection if no SKUs  have been set or the collection is no longer valid. |
| [getProductsOrdered](dw.customer.CustomerActiveData.md#getproductsordered)() | Returns an array containing the SKUs of products in orders  for the customer, or an empty collection if no SKUs have been set or the  collection of SKUs is no longer valid. |
| [getProductsViewedMonth](dw.customer.CustomerActiveData.md#getproductsviewedmonth)() | Returns an array containing the SKUs of products viewed by the  customer in the last 30 days, or an empty collection if no SKUs have been  set or the collection is no longer valid. |
| [getReturnValue](dw.customer.CustomerActiveData.md#getreturnvalue)() | Returns the returned revenue of the customer, or `null`  if none has been set or the value is no longer valid. |
| [getReturns](dw.customer.CustomerActiveData.md#getreturns)() | Returns the number of returns of the customer, or `null`  if none has been set or the value is no longer valid. |
| [getSourceCodeOrders](dw.customer.CustomerActiveData.md#getsourcecodeorders)() | Returns the number of orders for the customer where a source code was  in effect, or `null` if none has been set or the value  is no longer valid. |
| [getTopCategoriesOrdered](dw.customer.CustomerActiveData.md#gettopcategoriesordered)() | Returns an array containing the IDs of up to the top 20 categories for  customer orders, or an empty list if no categories have been set or the  list of categories is no longer valid. |
| [getVisitsMonth](dw.customer.CustomerActiveData.md#getvisitsmonth)() | Returns the visits of the customer, over the most recent 30 days,  or `null` if none has been set or the value  is no longer valid. |
| [getVisitsWeek](dw.customer.CustomerActiveData.md#getvisitsweek)() | Returns the visits of the customer, over the most recent 7 days,  or `null` if none has been set or the value  is no longer valid. |
| [getVisitsYear](dw.customer.CustomerActiveData.md#getvisitsyear)() | Returns the visits of the customer, over the most recent 365 days,  or `null` if none has been set or the value  is no longer valid. |

### Methods inherited from class ActiveData

[getCustom](dw.object.ActiveData.md#getcustom), [isEmpty](dw.object.ActiveData.md#isempty)
### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### avgOrderValue
- avgOrderValue: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the average order value of the customer, or `null`
      if none has been set or the value is no longer valid.



---

### discountValueWithCoupon
- discountValueWithCoupon: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the discount value resulting from coupons, that has been applied
      to orders of the customer, or `null` if none has been set or
      the value is no longer valid.



---

### discountValueWithoutCoupon
- discountValueWithoutCoupon: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the discount value resulting from promotions other than coupons,
      that has been applied to orders of the customer, or `null`
      if none has been set or the value is no longer valid.



---

### giftOrders
- giftOrders: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the number of orders for the Customer that contained at least
      one product unit marked as a gift, or `null` if none has been
      set or the value is no longer valid.



---

### giftUnits
- giftUnits: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the number of product units in orders for the customer
      that were marked as a gift, or `null` if none has been set
      or the value is no longer valid.



---

### lastOrderDate
- lastOrderDate: [Date](TopLevel.Date.md) `(read-only)`
  - : Returns the date of the last order for the customer, or `null`
      if there are no orders for the customer.



---

### orderValue
- orderValue: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the lifetime order value of the customer, or `null`
      if none has been set or the value is no longer valid.



---

### orderValueMonth
- orderValueMonth: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the order value of the customer, over the most recent 30 days,
      or `null` if none has been set or the value is no longer valid.



---

### orders
- orders: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the orders of the customer, or `null` if none
      has been set or the value is no longer valid.



---

### productMastersOrdered
- productMastersOrdered: [String\[\]](TopLevel.String.md) `(read-only)`
  - : Returns an array containing the master product SKUs of variation products
      in orders for the customer, or an empty collection if no SKUs have been
      set or the collection of SKUs is no longer valid. There is no specific
      limit on the number of SKUs that will be returned in the collection, but
      there is also no guarantee that it will contain the SKUs for all products
      ordered by the customer.



---

### productsAbandonedMonth
- productsAbandonedMonth: [String\[\]](TopLevel.String.md) `(read-only)`
  - : Returns an array containing the SKUs of products in baskets abandoned
      by the customer in the last 30 days, or an empty collection if no SKUs
      have been set or the collection is no longer valid.  There is no specific
      limit on the number of SKUs that will be returned in the collection, but
      there is also no guarantee that it will contain the SKUs for all products
      in baskets abandoned by the customer.



---

### productsOrdered
- productsOrdered: [String\[\]](TopLevel.String.md) `(read-only)`
  - : Returns an array containing the SKUs of products in orders
      for the customer, or an empty collection if no SKUs have been set or the
      collection of SKUs is no longer valid.  There is no specific limit on the
      number of SKUs that will be returned in the collection, but there is also
      no guarantee that it will contain the SKUs for all products ordered by
      the customer.



---

### productsViewedMonth
- productsViewedMonth: [String\[\]](TopLevel.String.md) `(read-only)`
  - : Returns an array containing the SKUs of products viewed by the
      customer in the last 30 days, or an empty collection if no SKUs have been
      set or the collection is no longer valid.  There is no specific limit on
      the number of SKUs that will be returned in the collection, but there is
      also no guarantee that it will contain the SKUs for all products viewed
      by the customer.



---

### returnValue
- returnValue: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the returned revenue of the customer, or `null`
      if none has been set or the value is no longer valid.



---

### returns
- returns: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the number of returns of the customer, or `null`
      if none has been set or the value is no longer valid.



---

### sourceCodeOrders
- sourceCodeOrders: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the number of orders for the customer where a source code was
      in effect, or `null` if none has been set or the value
      is no longer valid.



---

### topCategoriesOrdered
- topCategoriesOrdered: [String\[\]](TopLevel.String.md) `(read-only)`
  - : Returns an array containing the IDs of up to the top 20 categories for
      customer orders, or an empty list if no categories have been set or the
      list of categories is no longer valid. The top category is the one for
      which the most orders for the customer contained at least one product
      found in that category.



---

### visitsMonth
- visitsMonth: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the visits of the customer, over the most recent 30 days,
      or `null` if none has been set or the value
      is no longer valid.



---

### visitsWeek
- visitsWeek: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the visits of the customer, over the most recent 7 days,
      or `null` if none has been set or the value
      is no longer valid.



---

### visitsYear
- visitsYear: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the visits of the customer, over the most recent 365 days,
      or `null` if none has been set or the value
      is no longer valid.



---

## Method Details

### getAvgOrderValue()
- getAvgOrderValue(): [Number](TopLevel.Number.md)
  - : Returns the average order value of the customer, or `null`
      if none has been set or the value is no longer valid.


    **Returns:**
    - the average order size.


---

### getDiscountValueWithCoupon()
- getDiscountValueWithCoupon(): [Number](TopLevel.Number.md)
  - : Returns the discount value resulting from coupons, that has been applied
      to orders of the customer, or `null` if none has been set or
      the value is no longer valid.


    **Returns:**
    - the discount value resulting from coupons.


---

### getDiscountValueWithoutCoupon()
- getDiscountValueWithoutCoupon(): [Number](TopLevel.Number.md)
  - : Returns the discount value resulting from promotions other than coupons,
      that has been applied to orders of the customer, or `null`
      if none has been set or the value is no longer valid.


    **Returns:**
    - the discount value resulting from promotions other than coupons.


---

### getGiftOrders()
- getGiftOrders(): [Number](TopLevel.Number.md)
  - : Returns the number of orders for the Customer that contained at least
      one product unit marked as a gift, or `null` if none has been
      set or the value is no longer valid.


    **Returns:**
    - the number of gift orders.


---

### getGiftUnits()
- getGiftUnits(): [Number](TopLevel.Number.md)
  - : Returns the number of product units in orders for the customer
      that were marked as a gift, or `null` if none has been set
      or the value is no longer valid.


    **Returns:**
    - the number of gift product units.


---

### getLastOrderDate()
- getLastOrderDate(): [Date](TopLevel.Date.md)
  - : Returns the date of the last order for the customer, or `null`
      if there are no orders for the customer.


    **Returns:**
    - the date of the last order for the customer.


---

### getOrderValue()
- getOrderValue(): [Number](TopLevel.Number.md)
  - : Returns the lifetime order value of the customer, or `null`
      if none has been set or the value is no longer valid.


    **Returns:**
    - the lifetime value.


---

### getOrderValueMonth()
- getOrderValueMonth(): [Number](TopLevel.Number.md)
  - : Returns the order value of the customer, over the most recent 30 days,
      or `null` if none has been set or the value is no longer valid.


    **Returns:**
    - the value over the last 30 days.


---

### getOrders()
- getOrders(): [Number](TopLevel.Number.md)
  - : Returns the orders of the customer, or `null` if none
      has been set or the value is no longer valid.


    **Returns:**
    - the orders.


---

### getProductMastersOrdered()
- getProductMastersOrdered(): [String\[\]](TopLevel.String.md)
  - : Returns an array containing the master product SKUs of variation products
      in orders for the customer, or an empty collection if no SKUs have been
      set or the collection of SKUs is no longer valid. There is no specific
      limit on the number of SKUs that will be returned in the collection, but
      there is also no guarantee that it will contain the SKUs for all products
      ordered by the customer.


    **Returns:**
    - a collection containing the master product SKUs of variation
              products that were ordered.



---

### getProductsAbandonedMonth()
- getProductsAbandonedMonth(): [String\[\]](TopLevel.String.md)
  - : Returns an array containing the SKUs of products in baskets abandoned
      by the customer in the last 30 days, or an empty collection if no SKUs
      have been set or the collection is no longer valid.  There is no specific
      limit on the number of SKUs that will be returned in the collection, but
      there is also no guarantee that it will contain the SKUs for all products
      in baskets abandoned by the customer.


    **Returns:**
    - a collection containing the SKUs of products that were abandoned.


---

### getProductsOrdered()
- getProductsOrdered(): [String\[\]](TopLevel.String.md)
  - : Returns an array containing the SKUs of products in orders
      for the customer, or an empty collection if no SKUs have been set or the
      collection of SKUs is no longer valid.  There is no specific limit on the
      number of SKUs that will be returned in the collection, but there is also
      no guarantee that it will contain the SKUs for all products ordered by
      the customer.


    **Returns:**
    - a collection containing the SKUs of products that were ordered.


---

### getProductsViewedMonth()
- getProductsViewedMonth(): [String\[\]](TopLevel.String.md)
  - : Returns an array containing the SKUs of products viewed by the
      customer in the last 30 days, or an empty collection if no SKUs have been
      set or the collection is no longer valid.  There is no specific limit on
      the number of SKUs that will be returned in the collection, but there is
      also no guarantee that it will contain the SKUs for all products viewed
      by the customer.


    **Returns:**
    - a collection containing the SKUs of products that were ordered.


---

### getReturnValue()
- getReturnValue(): [Number](TopLevel.Number.md)
  - : Returns the returned revenue of the customer, or `null`
      if none has been set or the value is no longer valid.


    **Returns:**
    - the returned revenue.


---

### getReturns()
- getReturns(): [Number](TopLevel.Number.md)
  - : Returns the number of returns of the customer, or `null`
      if none has been set or the value is no longer valid.


    **Returns:**
    - the returns.


---

### getSourceCodeOrders()
- getSourceCodeOrders(): [Number](TopLevel.Number.md)
  - : Returns the number of orders for the customer where a source code was
      in effect, or `null` if none has been set or the value
      is no longer valid.


    **Returns:**
    - the number of orders with source codes in effect.


---

### getTopCategoriesOrdered()
- getTopCategoriesOrdered(): [String\[\]](TopLevel.String.md)
  - : Returns an array containing the IDs of up to the top 20 categories for
      customer orders, or an empty list if no categories have been set or the
      list of categories is no longer valid. The top category is the one for
      which the most orders for the customer contained at least one product
      found in that category.


    **Returns:**
    - a list containing the top 20 categories.


---

### getVisitsMonth()
- getVisitsMonth(): [Number](TopLevel.Number.md)
  - : Returns the visits of the customer, over the most recent 30 days,
      or `null` if none has been set or the value
      is no longer valid.


    **Returns:**
    - the visits over the last 30 days.


---

### getVisitsWeek()
- getVisitsWeek(): [Number](TopLevel.Number.md)
  - : Returns the visits of the customer, over the most recent 7 days,
      or `null` if none has been set or the value
      is no longer valid.


    **Returns:**
    - the visits over the last 7 days.


---

### getVisitsYear()
- getVisitsYear(): [Number](TopLevel.Number.md)
  - : Returns the visits of the customer, over the most recent 365 days,
      or `null` if none has been set or the value
      is no longer valid.


    **Returns:**
    - the visits over the last 365 days.


---

<!-- prettier-ignore-end -->
