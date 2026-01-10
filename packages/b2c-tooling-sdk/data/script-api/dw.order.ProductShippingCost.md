<!-- prettier-ignore-start -->
# Class ProductShippingCost

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.order.ProductShippingCost](dw.order.ProductShippingCost.md)

Instances of ProductShippingCost represent product specific shipping costs.



Use [ProductShippingModel.getShippingCost(ShippingMethod)](dw.order.ProductShippingModel.md#getshippingcostshippingmethod) to get
the shipping cost for a specific product.



## Property Summary

| Property | Description |
| --- | --- |
| [amount](#amount): [Money](dw.value.Money.md) `(read-only)` | Returns the shipping amount. |
| [fixedPrice](#fixedprice): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns true if shipping cost is a fixed-price shipping cost,  and false if surcharge shipping cost. |
| [surcharge](#surcharge): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns true if shipping cost is a surcharge to the shipment  shipping cost, and false if fixed-price shipping cost. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getAmount](dw.order.ProductShippingCost.md#getamount)() | Returns the shipping amount. |
| [isFixedPrice](dw.order.ProductShippingCost.md#isfixedprice)() | Returns true if shipping cost is a fixed-price shipping cost,  and false if surcharge shipping cost. |
| [isSurcharge](dw.order.ProductShippingCost.md#issurcharge)() | Returns true if shipping cost is a surcharge to the shipment  shipping cost, and false if fixed-price shipping cost. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### amount
- amount: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the shipping amount.


---

### fixedPrice
- fixedPrice: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns true if shipping cost is a fixed-price shipping cost,
      and false if surcharge shipping cost.



---

### surcharge
- surcharge: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns true if shipping cost is a surcharge to the shipment
      shipping cost, and false if fixed-price shipping cost.



---

## Method Details

### getAmount()
- getAmount(): [Money](dw.value.Money.md)
  - : Returns the shipping amount.

    **Returns:**
    - Shipping amount


---

### isFixedPrice()
- isFixedPrice(): [Boolean](TopLevel.Boolean.md)
  - : Returns true if shipping cost is a fixed-price shipping cost,
      and false if surcharge shipping cost.


    **Returns:**
    - true of fixed-price shipping cost, else false


---

### isSurcharge()
- isSurcharge(): [Boolean](TopLevel.Boolean.md)
  - : Returns true if shipping cost is a surcharge to the shipment
      shipping cost, and false if fixed-price shipping cost.


    **Returns:**
    - true of surcharge shipping cost, else false


---

<!-- prettier-ignore-end -->
