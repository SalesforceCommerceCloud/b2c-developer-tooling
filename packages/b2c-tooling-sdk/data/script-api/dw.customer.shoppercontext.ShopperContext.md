<!-- prettier-ignore-start -->
# Class ShopperContext

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.customer.shoppercontext.ShopperContext](dw.customer.shoppercontext.ShopperContext.md)

The class represents Shopper Context. It is used to manage personalized shopping experiences on your storefront.


Shopper Context is used to personalize shopper experiences with context values such as custom session attributes,
assignment qualifiers, geolocation, clientIP address, effective date time, source code, coupon code and customer
groups.




When Shopper Context is set for a shopper, the context is applied in the next request and can activate promotions or
price books assigned to customer groups, source codes, or stores (via assignments).
Also see: [ShopperContextMgr](dw.customer.shoppercontext.ShopperContextMgr.md)



## Property Summary

| Property | Description |
| --- | --- |
| [assignmentQualifiers](#assignmentqualifiers): [Map](dw.util.Map.md) | Returns the assignment qualifiers from the Shopper Context. |
| [clientIP](#clientip): [String](TopLevel.String.md) | Returns the IP address of the client from the Shopper Context. |
| [couponCodes](#couponcodes): [Set](dw.util.Set.md) | Returns the Coupon codes from the Shopper Context. |
| [customQualifiers](#customqualifiers): [Map](dw.util.Map.md) | Returns the custom qualifiers from the Shopper Context. |
| [customerGroupIDs](#customergroupids): [Set](dw.util.Set.md) | Returns customer group IDs from the Shopper Context to apply. |
| [effectiveDateTime](#effectivedatetime): [Date](TopLevel.Date.md) | Returns the effective date time from the Shopper Context. |
| [geolocation](#geolocation): [Geolocation](dw.util.Geolocation.md) | Returns the geographic location from the Shopper Context. |
| [sourceCode](#sourcecode): [String](TopLevel.String.md) | Returns the source code from the Shopper Context. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [ShopperContext](#shoppercontext)() | Constructor for ShopperContext. |

## Method Summary

| Method | Description |
| --- | --- |
| [getAssignmentQualifiers](dw.customer.shoppercontext.ShopperContext.md#getassignmentqualifiers)() | Returns the assignment qualifiers from the Shopper Context. |
| [getClientIP](dw.customer.shoppercontext.ShopperContext.md#getclientip)() | Returns the IP address of the client from the Shopper Context. |
| [getCouponCodes](dw.customer.shoppercontext.ShopperContext.md#getcouponcodes)() | Returns the Coupon codes from the Shopper Context. |
| [getCustomQualifiers](dw.customer.shoppercontext.ShopperContext.md#getcustomqualifiers)() | Returns the custom qualifiers from the Shopper Context. |
| [getCustomerGroupIDs](dw.customer.shoppercontext.ShopperContext.md#getcustomergroupids)() | Returns customer group IDs from the Shopper Context to apply. |
| [getEffectiveDateTime](dw.customer.shoppercontext.ShopperContext.md#geteffectivedatetime)() | Returns the effective date time from the Shopper Context. |
| [getGeolocation](dw.customer.shoppercontext.ShopperContext.md#getgeolocation)() | Returns the geographic location from the Shopper Context. |
| [getSourceCode](dw.customer.shoppercontext.ShopperContext.md#getsourcecode)() | Returns the source code from the Shopper Context. |
| [setAssignmentQualifiers](dw.customer.shoppercontext.ShopperContext.md#setassignmentqualifiersmap)([Map](dw.util.Map.md)) | Sets the assignment qualifiers in the Shopper Context. |
| [setClientIP](dw.customer.shoppercontext.ShopperContext.md#setclientipstring)([String](TopLevel.String.md)) | Sets the IP address of the client in the Shopper Context. |
| [setCouponCodes](dw.customer.shoppercontext.ShopperContext.md#setcouponcodesset)([Set](dw.util.Set.md)) | Sets the Coupon codes in the Shopper Context. |
| [setCustomQualifiers](dw.customer.shoppercontext.ShopperContext.md#setcustomqualifiersmap)([Map](dw.util.Map.md)) | Sets the session custom attributes as custom qualifiers in the Shopper Context. |
| [setCustomerGroupIDs](dw.customer.shoppercontext.ShopperContext.md#setcustomergroupidsset)([Set](dw.util.Set.md)) | Sets the customer group IDs for the Shopper Context to apply. |
| [setEffectiveDateTime](dw.customer.shoppercontext.ShopperContext.md#seteffectivedatetimedate)([Date](TopLevel.Date.md)) | Sets the effective date time for the context to apply. |
| [setGeolocation](dw.customer.shoppercontext.ShopperContext.md#setgeolocationgeolocation)([Geolocation](dw.util.Geolocation.md)) | Sets the geographic location of the client in the Shopper Context. |
| [setSourceCode](dw.customer.shoppercontext.ShopperContext.md#setsourcecodestring)([String](TopLevel.String.md)) | Sets the source code for the Shopper Context to apply. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### assignmentQualifiers
- assignmentQualifiers: [Map](dw.util.Map.md)
  - : Returns the assignment qualifiers from the Shopper Context. Assignment qualifiers are set when using the
      assignment framework to trigger pricing and promotion experiences for Products, Product Search, Basket, Shipping
      methods etc.



---

### clientIP
- clientIP: [String](TopLevel.String.md)
  - : Returns the IP address of the client from the Shopper Context.


---

### couponCodes
- couponCodes: [Set](dw.util.Set.md)
  - : Returns the Coupon codes from the Shopper Context.


---

### customQualifiers
- customQualifiers: [Map](dw.util.Map.md)
  - : Returns the custom qualifiers from the Shopper Context. Custom qualifiers contain the custom session attributes
      set in the Shopper Context.



---

### customerGroupIDs
- customerGroupIDs: [Set](dw.util.Set.md)
  - : Returns customer group IDs from the Shopper Context to apply. The customer group IDs set in Shopper Context
      evaluate to customer groups that trigger the promotions (campaign assignment) assigned to the customer groups.



---

### effectiveDateTime
- effectiveDateTime: [Date](TopLevel.Date.md)
  - : Returns the effective date time from the Shopper Context. With the effective date time you can retrieve
      promotions that are active at a particular time. For example, "Shop the Future" use cases.



---

### geolocation
- geolocation: [Geolocation](dw.util.Geolocation.md)
  - : Returns the geographic location from the Shopper Context.


---

### sourceCode
- sourceCode: [String](TopLevel.String.md)
  - : Returns the source code from the Shopper Context. The source code set in Shopper Context evaluates to source code
      group that triggers the promotion (campaign assignment) and Price books (assigned to Source code group).



---

## Constructor Details

### ShopperContext()
- ShopperContext()
  - : Constructor for ShopperContext.
      
      
      This constructor is used to create an empty object. The object will be empty and must be populated with the
      appropriate setter methods. For example:
      
      ```
      ShopperContext context = new ShopperContext();
      context.setSourceCode( "sourcecode" );
      ShopperContextMgr.setShopperContext( context, true );
      ```



---

## Method Details

### getAssignmentQualifiers()
- getAssignmentQualifiers(): [Map](dw.util.Map.md)
  - : Returns the assignment qualifiers from the Shopper Context. Assignment qualifiers are set when using the
      assignment framework to trigger pricing and promotion experiences for Products, Product Search, Basket, Shipping
      methods etc.


    **Returns:**
    - A map of assignment qualifiers set in the Shopper Context.


---

### getClientIP()
- getClientIP(): [String](TopLevel.String.md)
  - : Returns the IP address of the client from the Shopper Context.

    **Returns:**
    - The IP address of the client set in the Shopper Context.


---

### getCouponCodes()
- getCouponCodes(): [Set](dw.util.Set.md)
  - : Returns the Coupon codes from the Shopper Context.

    **Returns:**
    - The Coupon codes set in the Shopper Context.


---

### getCustomQualifiers()
- getCustomQualifiers(): [Map](dw.util.Map.md)
  - : Returns the custom qualifiers from the Shopper Context. Custom qualifiers contain the custom session attributes
      set in the Shopper Context.


    **Returns:**
    - A map containing the custom qualifiers set in the Shopper Context.


---

### getCustomerGroupIDs()
- getCustomerGroupIDs(): [Set](dw.util.Set.md)
  - : Returns customer group IDs from the Shopper Context to apply. The customer group IDs set in Shopper Context
      evaluate to customer groups that trigger the promotions (campaign assignment) assigned to the customer groups.


    **Returns:**
    - The customer group IDs for the Shopper Context to apply.


---

### getEffectiveDateTime()
- getEffectiveDateTime(): [Date](TopLevel.Date.md)
  - : Returns the effective date time from the Shopper Context. With the effective date time you can retrieve
      promotions that are active at a particular time. For example, "Shop the Future" use cases.


    **Returns:**
    - The effective date time in UTC for the Shopper Context to apply.


---

### getGeolocation()
- getGeolocation(): [Geolocation](dw.util.Geolocation.md)
  - : Returns the geographic location from the Shopper Context.

    **Returns:**
    - The geographic location set in the Shopper Context.


---

### getSourceCode()
- getSourceCode(): [String](TopLevel.String.md)
  - : Returns the source code from the Shopper Context. The source code set in Shopper Context evaluates to source code
      group that triggers the promotion (campaign assignment) and Price books (assigned to Source code group).


    **Returns:**
    - The source code for the Shopper Context to apply.


---

### setAssignmentQualifiers(Map)
- setAssignmentQualifiers(assignmentQualifiers: [Map](dw.util.Map.md)): void
  - : Sets the assignment qualifiers in the Shopper Context. Assignment qualifiers are set when using the assignment
      framework to trigger pricing and promotion experiences for Products, Product Search, Basket, Shipping methods
      etc.
      
      
      **Example: Assignment qualifier for store can be set as follows: **
      
      ```
       var assignmentQualifiers = new dw.util.HashMap();
       assignmentQualifiers.put( "storeId", "Boston" );
       ShopperContext context = new ShopperContext();
       context.setAssignmentQualifiers( customQualifiers );
       ShopperContextMgr.setShopperContext( context, true );
      ```


    **Parameters:**
    - assignmentQualifiers - A map which contains the assignment qualifiers to save in the Shopper Context.


---

### setClientIP(String)
- setClientIP(clientIP: [String](TopLevel.String.md)): void
  - : Sets the IP address of the client in the Shopper Context. The client IP evaluates to a geolocation. If the client
      IP address is not a valid IPv4/IPv6 address an error is thrown.


    **Parameters:**
    - clientIP - The IP Address of the client to set in the Shopper Context.


---

### setCouponCodes(Set)
- setCouponCodes(couponCodes: [Set](dw.util.Set.md)): void
  - : Sets the Coupon codes in the Shopper Context. When you set coupon codes, it is saved as context for subsequent
      requests and can then trigger promotions via the campaign which are tied to the coupon. A maximum of 5 coupon
      codes can be set in the ShopperContext.


    **Parameters:**
    - couponCodes - The set of coupon codes to set in the Shopper Context. A maximum of 5 coupon codes per             ShopperContext are allowed.


---

### setCustomQualifiers(Map)
- setCustomQualifiers(customQualifiers: [Map](dw.util.Map.md)): void
  - : Sets the session custom attributes as custom qualifiers in the Shopper Context. Custom qualifiers are set when
      you want to trigger pricing and promotion experiences using a dynamic session-based customer groups.
      
      
      **Example: A session custom attribute 'device\_type' can be saved as follows: **
      
      ```
       var customQualifiers = new dw.util.HashMap();
       customQualifiers.put( "deviceType", "iPad" );
       ShopperContext context = new ShopperContext();
       context.setCustomQualifiers( customQualifiers );
       ShopperContextMgr.setShopperContext( context, true );
      ```


    **Parameters:**
    - customQualifiers - A map which contains the custom session attributes to save in the Shopper Context.


---

### setCustomerGroupIDs(Set)
- setCustomerGroupIDs(customerGroupIDs: [Set](dw.util.Set.md)): void
  - : Sets the customer group IDs for the Shopper Context to apply. Set the customer group IDs to evaluate customer
      groups that trigger the promotions (campaign assignment) assigned to the customer groups.


    **Parameters:**
    - customerGroupIDs - The customer group IDs for the Shopper Context to apply.


---

### setEffectiveDateTime(Date)
- setEffectiveDateTime(effectiveDateTime: [Date](TopLevel.Date.md)): void
  - : Sets the effective date time for the context to apply. With the effective date time you can retrieve promotions
      that are active at a particular time. For example, "Shop the Future" use cases.


    **Parameters:**
    - effectiveDateTime - The effective date time to set in the Shopper Context.


---

### setGeolocation(Geolocation)
- setGeolocation(geolocation: [Geolocation](dw.util.Geolocation.md)): void
  - : Sets the geographic location of the client in the Shopper Context. When you set a geolocation, it is saved as
      context for subsequent requests. This overrides any context previously saved using clientIP in the Shopper
      Context.


    **Parameters:**
    - geolocation - The geographic location of the client to set in the Shopper Context.


---

### setSourceCode(String)
- setSourceCode(sourceCode: [String](TopLevel.String.md)): void
  - : Sets the source code for the Shopper Context to apply. Set the source code to evaluate source code group that
      triggers the promotion (campaign assignment) and Price books (assigned to Source code group).


    **Parameters:**
    - sourceCode - The source code to set in the Shopper Context.


---

<!-- prettier-ignore-end -->
