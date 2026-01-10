<!-- prettier-ignore-start -->
# Class ProductShippingModel

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.order.ProductShippingModel](dw.order.ProductShippingModel.md)

Instances of ProductShippingModel provide access to product-level
shipping information, such as applicable or inapplicable shipping methods
and shipping cost defined for the product for a specified shipping
method. 


Use [ShippingMgr.getProductShippingModel(Product)](dw.order.ShippingMgr.md#getproductshippingmodelproduct) to get
the shipping model for a specific product.



## Property Summary

| Property | Description |
| --- | --- |
| [applicableShippingMethods](#applicableshippingmethods): [Collection](dw.util.Collection.md) `(read-only)` | Returns the active applicable shipping methods for the product related  to this shipping model, i.e. |
| [inapplicableShippingMethods](#inapplicableshippingmethods): [Collection](dw.util.Collection.md) `(read-only)` | Returns the active inapplicable shipping methods for the product related  to this shipping model, i.e. |
| [shippingMethodsWithShippingCost](#shippingmethodswithshippingcost): [Collection](dw.util.Collection.md) `(read-only)` | Returns the active shipping methods for which either any fixed-price or  surcharge product-level shipping cost is defined for the specified product. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getApplicableShippingMethods](dw.order.ProductShippingModel.md#getapplicableshippingmethods)() | Returns the active applicable shipping methods for the product related  to this shipping model, i.e. |
| [getInapplicableShippingMethods](dw.order.ProductShippingModel.md#getinapplicableshippingmethods)() | Returns the active inapplicable shipping methods for the product related  to this shipping model, i.e. |
| [getShippingCost](dw.order.ProductShippingModel.md#getshippingcostshippingmethod)([ShippingMethod](dw.order.ShippingMethod.md)) | Returns the shipping cost object for the related product and  the specified shipping method, or null if no product-level fixed-price or  surcharge shipping cost are defined for the specified product. |
| [getShippingMethodsWithShippingCost](dw.order.ProductShippingModel.md#getshippingmethodswithshippingcost)() | Returns the active shipping methods for which either any fixed-price or  surcharge product-level shipping cost is defined for the specified product. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### applicableShippingMethods
- applicableShippingMethods: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns the active applicable shipping methods for the product related
      to this shipping model, i.e. shipping methods the product can be shipped
      with. A product can be shipping with a shipping methods if the shipping
      method is not explicitely marked as inapplicable for this product.



---

### inapplicableShippingMethods
- inapplicableShippingMethods: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns the active inapplicable shipping methods for the product related
      to this shipping model, i.e. shipping methods the product cannot be
      shipped with. A product cannot be shipping with a shipping methods if the
      shipping method is explicitely marked as inapplicable for this product.



---

### shippingMethodsWithShippingCost
- shippingMethodsWithShippingCost: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns the active shipping methods for which either any fixed-price or
      surcharge product-level shipping cost is defined for the specified product. 
      
      Note that this can include inapplicable shipping methods
      (see [getInapplicableShippingMethods()](dw.order.ProductShippingModel.md#getinapplicableshippingmethods)).



---

## Method Details

### getApplicableShippingMethods()
- getApplicableShippingMethods(): [Collection](dw.util.Collection.md)
  - : Returns the active applicable shipping methods for the product related
      to this shipping model, i.e. shipping methods the product can be shipped
      with. A product can be shipping with a shipping methods if the shipping
      method is not explicitely marked as inapplicable for this product.


    **Returns:**
    - Applicable shipping methods for the product


---

### getInapplicableShippingMethods()
- getInapplicableShippingMethods(): [Collection](dw.util.Collection.md)
  - : Returns the active inapplicable shipping methods for the product related
      to this shipping model, i.e. shipping methods the product cannot be
      shipped with. A product cannot be shipping with a shipping methods if the
      shipping method is explicitely marked as inapplicable for this product.


    **Returns:**
    - Inapplicable shipping methods for the product


---

### getShippingCost(ShippingMethod)
- getShippingCost(shippingMethod: [ShippingMethod](dw.order.ShippingMethod.md)): [ProductShippingCost](dw.order.ProductShippingCost.md)
  - : Returns the shipping cost object for the related product and
      the specified shipping method, or null if no product-level fixed-price or
      surcharge shipping cost are defined for the specified product. 
      
      The following rules apply:
      
      - if fixed and surcharge shipping cost is defined for a product, the fixed cost takes precedence
      - if a product is member of multiple shipping cost groups, the lowest shipping cost takes precedence


    **Parameters:**
    - shippingMethod - the shipping method to use.

    **Returns:**
    - Product shipping cost


---

### getShippingMethodsWithShippingCost()
- getShippingMethodsWithShippingCost(): [Collection](dw.util.Collection.md)
  - : Returns the active shipping methods for which either any fixed-price or
      surcharge product-level shipping cost is defined for the specified product. 
      
      Note that this can include inapplicable shipping methods
      (see [getInapplicableShippingMethods()](dw.order.ProductShippingModel.md#getinapplicableshippingmethods)).


    **Returns:**
    - Shipping methods with shipping cost


---

<!-- prettier-ignore-end -->
