<!-- prettier-ignore-start -->
# Class ProductShippingLineItem

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)
      - [dw.order.LineItem](dw.order.LineItem.md)
        - [dw.order.ProductShippingLineItem](dw.order.ProductShippingLineItem.md)

Represents a specific line item in a shipment. A ProductShippingLineItem defines
lineitem-specific shipping costs.



## Constant Summary

| Constant | Description |
| --- | --- |
| ~~[PRODUCT_SHIPPING_ID](#product_shipping_id): [String](TopLevel.String.md) = "PRODUCT_SHIPPING"~~ | Reserved constant. |

## Property Summary

| Property | Description |
| --- | --- |
| [adjustedGrossPrice](#adjustedgrossprice): [Money](dw.value.Money.md) `(read-only)` | Returns the gross price of the product shipping line item after applying  all product-shipping-level adjustments. |
| [adjustedNetPrice](#adjustednetprice): [Money](dw.value.Money.md) `(read-only)` | Returns the net price of the product shipping line item after applying  all product-shipping-level adjustments. |
| [adjustedPrice](#adjustedprice): [Money](dw.value.Money.md) `(read-only)` | Returns the price of the product shipping line item after applying all  pproduct-shipping-level adjustments. |
| [adjustedTax](#adjustedtax): [Money](dw.value.Money.md) `(read-only)` | Returns the tax of the unit after applying adjustments, in the purchase  currency. |
| [priceAdjustments](#priceadjustments): [Collection](dw.util.Collection.md) `(read-only)` | Returns an iterator of price adjustments that have been applied to this  product shipping line item. |
| [productLineItem](#productlineitem): [ProductLineItem](dw.order.ProductLineItem.md) `(read-only)` | Returns the parent product line item this shipping line item belongs to. |
| [quantity](#quantity): [Quantity](dw.value.Quantity.md) | Returns the quantity of the shipping cost. |
| [shipment](#shipment): [Shipment](dw.order.Shipment.md) `(read-only)` | Returns the shipment this shipping line item belongs to. |
| [surcharge](#surcharge): [Boolean](TopLevel.Boolean.md) | Returns the 'surcharge' flag. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getAdjustedGrossPrice](dw.order.ProductShippingLineItem.md#getadjustedgrossprice)() | Returns the gross price of the product shipping line item after applying  all product-shipping-level adjustments. |
| [getAdjustedNetPrice](dw.order.ProductShippingLineItem.md#getadjustednetprice)() | Returns the net price of the product shipping line item after applying  all product-shipping-level adjustments. |
| [getAdjustedPrice](dw.order.ProductShippingLineItem.md#getadjustedprice)() | Returns the price of the product shipping line item after applying all  pproduct-shipping-level adjustments. |
| [getAdjustedTax](dw.order.ProductShippingLineItem.md#getadjustedtax)() | Returns the tax of the unit after applying adjustments, in the purchase  currency. |
| [getPriceAdjustments](dw.order.ProductShippingLineItem.md#getpriceadjustments)() | Returns an iterator of price adjustments that have been applied to this  product shipping line item. |
| [getProductLineItem](dw.order.ProductShippingLineItem.md#getproductlineitem)() | Returns the parent product line item this shipping line item belongs to. |
| [getQuantity](dw.order.ProductShippingLineItem.md#getquantity)() | Returns the quantity of the shipping cost. |
| [getShipment](dw.order.ProductShippingLineItem.md#getshipment)() | Returns the shipment this shipping line item belongs to. |
| [isSurcharge](dw.order.ProductShippingLineItem.md#issurcharge)() | Returns the 'surcharge' flag. |
| [setPriceValue](dw.order.ProductShippingLineItem.md#setpricevaluenumber)([Number](TopLevel.Number.md)) | Sets price attributes of the line item based on the  purchase currency, taxation policy and line item quantity.<br/>   The method sets the 'basePrice' attribute of the line item. |
| [setQuantity](dw.order.ProductShippingLineItem.md#setquantityquantity)([Quantity](dw.value.Quantity.md)) | Sets the quantity of the shipping cost. |
| [setSurcharge](dw.order.ProductShippingLineItem.md#setsurchargeboolean)([Boolean](TopLevel.Boolean.md)) | Sets the 'surcharge' flag. |

### Methods inherited from class LineItem

[getBasePrice](dw.order.LineItem.md#getbaseprice), [getGrossPrice](dw.order.LineItem.md#getgrossprice), [getLineItemCtnr](dw.order.LineItem.md#getlineitemctnr), [getLineItemText](dw.order.LineItem.md#getlineitemtext), [getNetPrice](dw.order.LineItem.md#getnetprice), [getPrice](dw.order.LineItem.md#getprice), [getPriceValue](dw.order.LineItem.md#getpricevalue), [getTax](dw.order.LineItem.md#gettax), [getTaxBasis](dw.order.LineItem.md#gettaxbasis), [getTaxClassID](dw.order.LineItem.md#gettaxclassid), [getTaxRate](dw.order.LineItem.md#gettaxrate), [setBasePrice](dw.order.LineItem.md#setbasepricemoney), [setGrossPrice](dw.order.LineItem.md#setgrosspricemoney), [setLineItemText](dw.order.LineItem.md#setlineitemtextstring), [setNetPrice](dw.order.LineItem.md#setnetpricemoney), [setPriceValue](dw.order.LineItem.md#setpricevaluenumber), [setTax](dw.order.LineItem.md#settaxmoney), [setTaxClassID](dw.order.LineItem.md#settaxclassidstring), [setTaxRate](dw.order.LineItem.md#settaxratenumber), [updatePrice](dw.order.LineItem.md#updatepricemoney), [updateTax](dw.order.LineItem.md#updatetaxnumber), [updateTax](dw.order.LineItem.md#updatetaxnumber-money), [updateTaxAmount](dw.order.LineItem.md#updatetaxamountmoney)
### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### PRODUCT_SHIPPING_ID

- ~~PRODUCT_SHIPPING_ID: [String](TopLevel.String.md) = "PRODUCT_SHIPPING"~~
  - : Reserved constant.

    **Deprecated:**
:::warning
this reserved constant is deprecated.
:::

---

## Property Details

### adjustedGrossPrice
- adjustedGrossPrice: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the gross price of the product shipping line item after applying
      all product-shipping-level adjustments.


    **See Also:**
    - [getAdjustedNetPrice()](dw.order.ProductShippingLineItem.md#getadjustednetprice)
    - [getAdjustedPrice()](dw.order.ProductShippingLineItem.md#getadjustedprice)


---

### adjustedNetPrice
- adjustedNetPrice: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the net price of the product shipping line item after applying
      all product-shipping-level adjustments.


    **See Also:**
    - [getAdjustedGrossPrice()](dw.order.ProductShippingLineItem.md#getadjustedgrossprice)
    - [getAdjustedPrice()](dw.order.ProductShippingLineItem.md#getadjustedprice)


---

### adjustedPrice
- adjustedPrice: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the price of the product shipping line item after applying all
      pproduct-shipping-level adjustments. For net pricing the adjusted net
      price is returned (see [getAdjustedNetPrice()](dw.order.ProductShippingLineItem.md#getadjustednetprice)). For gross
      pricing, the adjusted gross price is returned (see
      [getAdjustedGrossPrice()](dw.order.ProductShippingLineItem.md#getadjustedgrossprice)).


    **See Also:**
    - [getAdjustedGrossPrice()](dw.order.ProductShippingLineItem.md#getadjustedgrossprice)
    - [getAdjustedNetPrice()](dw.order.ProductShippingLineItem.md#getadjustednetprice)


---

### adjustedTax
- adjustedTax: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the tax of the unit after applying adjustments, in the purchase
      currency.



---

### priceAdjustments
- priceAdjustments: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns an iterator of price adjustments that have been applied to this
      product shipping line item.



---

### productLineItem
- productLineItem: [ProductLineItem](dw.order.ProductLineItem.md) `(read-only)`
  - : Returns the parent product line item this shipping line item belongs to.


---

### quantity
- quantity: [Quantity](dw.value.Quantity.md)
  - : Returns the quantity of the shipping cost.


---

### shipment
- shipment: [Shipment](dw.order.Shipment.md) `(read-only)`
  - : Returns the shipment this shipping line item belongs to.


---

### surcharge
- surcharge: [Boolean](TopLevel.Boolean.md)
  - : Returns the 'surcharge' flag.


---

## Method Details

### getAdjustedGrossPrice()
- getAdjustedGrossPrice(): [Money](dw.value.Money.md)
  - : Returns the gross price of the product shipping line item after applying
      all product-shipping-level adjustments.


    **Returns:**
    - gross price after applying product-shipping-level adjustments

    **See Also:**
    - [getAdjustedNetPrice()](dw.order.ProductShippingLineItem.md#getadjustednetprice)
    - [getAdjustedPrice()](dw.order.ProductShippingLineItem.md#getadjustedprice)


---

### getAdjustedNetPrice()
- getAdjustedNetPrice(): [Money](dw.value.Money.md)
  - : Returns the net price of the product shipping line item after applying
      all product-shipping-level adjustments.


    **Returns:**
    - net price after applying product-shipping-level adjustments

    **See Also:**
    - [getAdjustedGrossPrice()](dw.order.ProductShippingLineItem.md#getadjustedgrossprice)
    - [getAdjustedPrice()](dw.order.ProductShippingLineItem.md#getadjustedprice)


---

### getAdjustedPrice()
- getAdjustedPrice(): [Money](dw.value.Money.md)
  - : Returns the price of the product shipping line item after applying all
      pproduct-shipping-level adjustments. For net pricing the adjusted net
      price is returned (see [getAdjustedNetPrice()](dw.order.ProductShippingLineItem.md#getadjustednetprice)). For gross
      pricing, the adjusted gross price is returned (see
      [getAdjustedGrossPrice()](dw.order.ProductShippingLineItem.md#getadjustedgrossprice)).


    **Returns:**
    - Adjusted net or gross price

    **See Also:**
    - [getAdjustedGrossPrice()](dw.order.ProductShippingLineItem.md#getadjustedgrossprice)
    - [getAdjustedNetPrice()](dw.order.ProductShippingLineItem.md#getadjustednetprice)


---

### getAdjustedTax()
- getAdjustedTax(): [Money](dw.value.Money.md)
  - : Returns the tax of the unit after applying adjustments, in the purchase
      currency.


    **Returns:**
    - the tax of the unit after applying adjustments, in the purchase
              currency.



---

### getPriceAdjustments()
- getPriceAdjustments(): [Collection](dw.util.Collection.md)
  - : Returns an iterator of price adjustments that have been applied to this
      product shipping line item.


    **Returns:**
    - a collection of price adjustments that have been applied to this
      product shipping line item.



---

### getProductLineItem()
- getProductLineItem(): [ProductLineItem](dw.order.ProductLineItem.md)
  - : Returns the parent product line item this shipping line item belongs to.

    **Returns:**
    - the product line item


---

### getQuantity()
- getQuantity(): [Quantity](dw.value.Quantity.md)
  - : Returns the quantity of the shipping cost.

    **Returns:**
    - the shipping quantity


---

### getShipment()
- getShipment(): [Shipment](dw.order.Shipment.md)
  - : Returns the shipment this shipping line item belongs to.

    **Returns:**
    - the shipment


---

### isSurcharge()
- isSurcharge(): [Boolean](TopLevel.Boolean.md)
  - : Returns the 'surcharge' flag.

    **Returns:**
    - true if this is a surcharge shipping cost, false if fixed shipping cost


---

### setPriceValue(Number)
- setPriceValue(value: [Number](TopLevel.Number.md)): void
  - : Sets price attributes of the line item based on the
      purchase currency, taxation policy and line item quantity.
      
      
      The method sets the 'basePrice' attribute of the line item.
      Additionally, it sets the 'netPrice' attribute of the line item
      if the current taxation policy is 'net', and the 'grossPrice'
      attribute, if the current taxation policy is 'gross'. The
      'netPrice'/'grossPrice' attributes are set by multiplying the
      specified price value with the line item quantity. 
      
      
      If null is specified as value, the price attributes are reset to
      Money.NA.


    **Parameters:**
    - value - Price value or null


---

### setQuantity(Quantity)
- setQuantity(quantity: [Quantity](dw.value.Quantity.md)): void
  - : Sets the quantity of the shipping cost.

    **Parameters:**
    - quantity - the shipping quantity


---

### setSurcharge(Boolean)
- setSurcharge(flag: [Boolean](TopLevel.Boolean.md)): void
  - : Sets the 'surcharge' flag.

    **Parameters:**
    - flag - true if this is a surcharge shipping cost,  false if this is a fixed shipping cost.


---

<!-- prettier-ignore-end -->
