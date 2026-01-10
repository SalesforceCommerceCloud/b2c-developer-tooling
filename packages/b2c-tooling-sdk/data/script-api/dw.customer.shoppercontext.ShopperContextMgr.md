<!-- prettier-ignore-start -->
# Class ShopperContextMgr

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.customer.shoppercontext.ShopperContextMgr](dw.customer.shoppercontext.ShopperContextMgr.md)



Provides static helper methods for managing Shopper Context.




Shopper Context is used to personalize shopper experiences with context values such as custom session attributes,
assignment qualifiers, geolocation, effective datetime, source code and more. When Shopper Context is set for a
shopper, it can activate promotions or price books assigned to customer groups, source codes, or stores (via
assignments) in the subsequent requests, not the current request.




Shopper Context is used to personalize the shopper experience in case of Composable/Headless or Hybrid storefront
implementations that use Shopper Login and API Access Service (SLAS).




NOTE: This script API is not intended to be used for standard server-side storefront implementations. Only for
Composable/Headless or Hybrid storefront implementations.




Unlike [CustomerContextMgr](dw.customer.CustomerContextMgr.md) which is used to set just Effective Time for which the customer is
shopping at, Shopper Context API provides a way to set many types of contexts such as custom session attributes,
assignment qualifiers, geolocation, effective datetime, source code etc.




The following feature toggles and site preferences must be enabled in order to use this script API:

- Enable Shopper Context Feature
- Hybrid Auth Settings' site preference - only in case of Hybrid storefront implementations





For more details on Shopper Context please refer to: [Shopper Context
API Overview](https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-context?meta=Summary)




For more details on Hybrid Authentication for Hybrid storefronts please refer to:
[Hybrid
Authentication](https://developer.salesforce.com/docs/commerce/commerce-api/guide/hybrid-auth.html)




[ShopperContextMgr](dw.customer.shoppercontext.ShopperContextMgr.md) is used to create, access and delete Shopper Context.

- To add Shopper Context, use methods [setShopperContext(ShopperContext, Boolean)](dw.customer.shoppercontext.ShopperContextMgr.md#setshoppercontextshoppercontext-boolean).    - To access Shopper Context, use method [getShopperContext()](dw.customer.shoppercontext.ShopperContextMgr.md#getshoppercontext).        - To delete Shopper Context, use methods [removeShopperContext()](dw.customer.shoppercontext.ShopperContextMgr.md#removeshoppercontext).            - To fetch Geolocation based on clientIP already set in Shopper Context, use method [getGeolocation()](dw.customer.shoppercontext.ShopperContextMgr.md#getgeolocation)

Typical usage:                
        ```
        // get the ShopperContext if it exists ShopperContext context = ShopperContextMgr.getShopperContext(); if (context == null) {     context = new ShopperContext(); } // set the values in the ShopperContext object context.setSourceCode( "sourcecode" ); var customQualifiers = new dw.util.HashMap(); customQualifiers.put( "deviceType", "iPad" ); context.setCustomQualifiers( customQualifiers ); // Save the ShopperContext ShopperContextMgr.setShopperContext( context, true );
        ```
NOTE: Ensure the ShopperContext object is saved using [setShopperContext(ShopperContext, Boolean)](dw.customer.shoppercontext.ShopperContextMgr.md#setshoppercontextshoppercontext-boolean)after        setting or updating the context values.        



## Property Summary

| Property | Description |
| --- | --- |
| [geolocation](#geolocation): [Geolocation](dw.util.Geolocation.md) `(read-only)` | Gets the [Geolocation](dw.util.Geolocation.md) object for the clientIP set in  [ShopperContext](dw.customer.shoppercontext.ShopperContext.md) or null if no shopperContext is found, or no clientIP was set  or Geolocation for the clientIP was not found. |
| [shopperContext](#shoppercontext): [ShopperContext](dw.customer.shoppercontext.ShopperContext.md) | Returns the [ShopperContext](dw.customer.shoppercontext.ShopperContext.md) if it exists for the customer. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| static [getGeolocation](dw.customer.shoppercontext.ShopperContextMgr.md#getgeolocation)() | Gets the [Geolocation](dw.util.Geolocation.md) object for the clientIP set in  [ShopperContext](dw.customer.shoppercontext.ShopperContext.md) or null if no shopperContext is found, or no clientIP was set  or Geolocation for the clientIP was not found. |
| static [getShopperContext](dw.customer.shoppercontext.ShopperContextMgr.md#getshoppercontext)() | Returns the [ShopperContext](dw.customer.shoppercontext.ShopperContext.md) if it exists for the customer. |
| static [removeShopperContext](dw.customer.shoppercontext.ShopperContextMgr.md#removeshoppercontext)() | Removes the [ShopperContext](dw.customer.shoppercontext.ShopperContext.md) for the customer. |
| static [setShopperContext](dw.customer.shoppercontext.ShopperContextMgr.md#setshoppercontextshoppercontext-boolean)([ShopperContext](dw.customer.shoppercontext.ShopperContext.md), [Boolean](TopLevel.Boolean.md)) | <p>  Sets new [ShopperContext](dw.customer.shoppercontext.ShopperContext.md) for the customer or overwrites the existing context. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### geolocation
- geolocation: [Geolocation](dw.util.Geolocation.md) `(read-only)`
  - : Gets the [Geolocation](dw.util.Geolocation.md) object for the clientIP set in
      [ShopperContext](dw.customer.shoppercontext.ShopperContext.md) or null if no shopperContext is found, or no clientIP was set
      or Geolocation for the clientIP was not found.
      
      
      The method throws an exception if the call fails.



---

### shopperContext
- shopperContext: [ShopperContext](dw.customer.shoppercontext.ShopperContext.md)
  - : Returns the [ShopperContext](dw.customer.shoppercontext.ShopperContext.md) if it exists for the customer. Returns null if it
      does not exist.



---

## Method Details

### getGeolocation()
- static getGeolocation(): [Geolocation](dw.util.Geolocation.md)
  - : Gets the [Geolocation](dw.util.Geolocation.md) object for the clientIP set in
      [ShopperContext](dw.customer.shoppercontext.ShopperContext.md) or null if no shopperContext is found, or no clientIP was set
      or Geolocation for the clientIP was not found.
      
      
      The method throws an exception if the call fails.


    **Throws:**
    - dw.customer.shoppercontext.ShopperContextException - This exception is thrown if error occurs while trying              to retrieve Geolocation string from the Shopper Context.


---

### getShopperContext()
- static getShopperContext(): [ShopperContext](dw.customer.shoppercontext.ShopperContext.md)
  - : Returns the [ShopperContext](dw.customer.shoppercontext.ShopperContext.md) if it exists for the customer. Returns null if it
      does not exist.


    **Returns:**
    - The Shopper Context or null.

    **Throws:**
    - dw.customer.shoppercontext.ShopperContextException - This exception is thrown if an error occurs while              fetching the Shopper Context.


---

### removeShopperContext()
- static removeShopperContext(): void
  - : Removes the [ShopperContext](dw.customer.shoppercontext.ShopperContext.md) for the customer.
      
      
      The method throws an exception if the deletion of Shopper Context fails.


    **Throws:**
    - dw.customer.shoppercontext.ShopperContextException - This exception is thrown if error occurs while              deleting the Shopper Context.


---

### setShopperContext(ShopperContext, Boolean)
- static setShopperContext(shopperContext: [ShopperContext](dw.customer.shoppercontext.ShopperContext.md), evaluateContextWithClientIP: [Boolean](TopLevel.Boolean.md)): void
  - : 
      
      Sets new [ShopperContext](dw.customer.shoppercontext.ShopperContext.md) for the customer or overwrites the existing context.
      
      
      
      
      Note: This method does not save the attributes from the given Shopper Context such as - custom session
      attributes, source code, effective date time etc., - in the current session object. These attributes are read
      from Shopper Context and stored in the corresponding session attributes during subsequent requests and not in the
      current request. Hence, promotions, price books etc., are triggered in subsequent requests.
      
      
      If `clientIP` is set in [ShopperContext](dw.customer.shoppercontext.ShopperContext.md), the geolocation information
      is retrieved and set in `x-geolocation` header.
      
      
      And if the parameter `evaluateContextWithClientIP` is set to true, the `clientIP` will be
      saved to the Shopper Context.
      
      
      If parameter `evaluateContextWithClientIP` is set to false, the `clientIP` will not be
      saved to the Shopper Context.
      
      
      If the `geoLocation` attribute is set, it overrides any geolocation context set by
      `clientIP`.


    **Parameters:**
    - shopperContext - The new Shopper Context to set. See documentation for             [ShopperContext](dw.customer.shoppercontext.ShopperContext.md)
    - evaluateContextWithClientIP - The boolean to determine if Shopper Context should be evaluated with clientIP             address.

    **Throws:**
    - dw.customer.shoppercontext.ShopperContextException - This exception is thrown if the Shopper Context is not              saved or if validation fails.


---

<!-- prettier-ignore-end -->
