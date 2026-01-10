<!-- prettier-ignore-start -->
# Class ShippingMgr

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.order.ShippingMgr](dw.order.ShippingMgr.md)

Provides methods to access the shipping information.


## Property Summary

| Property | Description |
| --- | --- |
| [allShippingMethods](#allshippingmethods): [Collection](dw.util.Collection.md) `(read-only)` | Returns the active shipping methods of the current site applicable to the session currency and current customer group. |
| [defaultShippingMethod](#defaultshippingmethod): [ShippingMethod](dw.order.ShippingMethod.md) `(read-only)` | Returns the default shipping method of the current site applicable to the session currency. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| static [applyShippingCost](dw.order.ShippingMgr.md#applyshippingcostlineitemctnr)([LineItemCtnr](dw.order.LineItemCtnr.md)) | Applies product and shipment-level shipping cost to the specified line  item container. |
| static [getAllShippingMethods](dw.order.ShippingMgr.md#getallshippingmethods)() | Returns the active shipping methods of the current site applicable to the session currency and current customer group. |
| static [getDefaultShippingMethod](dw.order.ShippingMgr.md#getdefaultshippingmethod)() | Returns the default shipping method of the current site applicable to the session currency. |
| static [getProductShippingModel](dw.order.ShippingMgr.md#getproductshippingmodelproduct)([Product](dw.catalog.Product.md)) | Returns the shipping model for the specified product. |
| static [getShipmentShippingModel](dw.order.ShippingMgr.md#getshipmentshippingmodelshipment)([Shipment](dw.order.Shipment.md)) | Returns the shipping model for the specified shipment. |
| static [getShippingCost](dw.order.ShippingMgr.md#getshippingcostshippingmethod-money)([ShippingMethod](dw.order.ShippingMethod.md), [Money](dw.value.Money.md)) | Returns the shipping cost amount for the specified shipping method and  the specified order value. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### allShippingMethods
- allShippingMethods: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns the active shipping methods of the current site applicable to the session currency and current customer group.


---

### defaultShippingMethod
- defaultShippingMethod: [ShippingMethod](dw.order.ShippingMethod.md) `(read-only)`
  - : Returns the default shipping method of the current site applicable to the session currency.
      
      Does an additional check if there is a base method and if their currencies are
      the same. Returns NULL if the two currencies are different.



---

## Method Details

### applyShippingCost(LineItemCtnr)
- static applyShippingCost(lineItemCtnr: [LineItemCtnr](dw.order.LineItemCtnr.md)): void
  - : Applies product and shipment-level shipping cost to the specified line
      item container.
      
      
      
      For each product line item in the specified line item container, a
      product shipping line item is created if product-level shipping cost is
      defined for the product. If no product-level shipping cost is defined for
      the product, an existing product shipping line item is removed. 
      
      
      For each shipment in the specified line item container, shipment-level
      shipping cost is calculated. This cost is determined based on the
      merchandise total of the shipment after all product and order discounts.
      Only products without or with surcharge product-specific shipping cost
      count towards this merchandise total. Products with fixed
      product-specific shipping cost don't count towards the merchandise total
      used to calculate shipment-level shipping cost. The calculated shipping
      cost is set at the standard shipping line item of the shipment. 
      
      
      If 'net' taxation is configured for the site, the merchandise total
      before tax is used. If 'gross' taxation is configured for the site, the
      merchandise total after tax is used.
      
      If no shipping method is set for a shipment, neither product nor
      shipment-level shipping cost can be calculated. In this case, the amount
      of the standard shipment shipping line item will be set to N/A, and
      shipping line items of product line items in this shipment will be
      removed from the line item container.
      
      Special cases for product-level shipping cost: 
      
      
      - if a product is member of multiple shipping cost groups, the lowest  shipping cost takes precedence
      - if fixed and surcharge shipping cost is defined for a product, the  fixed cost takes precedence
      - shipping cost defined for a master product is also defined for all  variants of this master
      - shipping cost is not applied to bundled product line items or options  line items


    **Parameters:**
    - lineItemCtnr - the line item container to use.


---

### getAllShippingMethods()
- static getAllShippingMethods(): [Collection](dw.util.Collection.md)
  - : Returns the active shipping methods of the current site applicable to the session currency and current customer group.

    **Returns:**
    - the active shipping methods of the current site applicable to the session currency and current customer group.


---

### getDefaultShippingMethod()
- static getDefaultShippingMethod(): [ShippingMethod](dw.order.ShippingMethod.md)
  - : Returns the default shipping method of the current site applicable to the session currency.
      
      Does an additional check if there is a base method and if their currencies are
      the same. Returns NULL if the two currencies are different.


    **Returns:**
    - the default shipping method of the current site applicable to the session currency or null.


---

### getProductShippingModel(Product)
- static getProductShippingModel(product: [Product](dw.catalog.Product.md)): [ProductShippingModel](dw.order.ProductShippingModel.md)
  - : Returns the shipping model for the specified product.

    **Parameters:**
    - product - Product

    **Returns:**
    - Shipping model for specified product


---

### getShipmentShippingModel(Shipment)
- static getShipmentShippingModel(shipment: [Shipment](dw.order.Shipment.md)): [ShipmentShippingModel](dw.order.ShipmentShippingModel.md)
  - : Returns the shipping model for the specified shipment.

    **Parameters:**
    - shipment - the shipment to use.

    **Returns:**
    - Shipping model for specified product


---

### getShippingCost(ShippingMethod, Money)
- static getShippingCost(shippingMethod: [ShippingMethod](dw.order.ShippingMethod.md), orderValue: [Money](dw.value.Money.md)): [Money](dw.value.Money.md)
  - : Returns the shipping cost amount for the specified shipping method and
      the specified order value. 
      
      If shipping cost cannot be calculated for any reason, Money.NA is
      returned.


    **Parameters:**
    - shippingMethod - Selected shipping method
    - orderValue - Order value

    **Returns:**
    - Shipping cost


---

<!-- prettier-ignore-end -->
