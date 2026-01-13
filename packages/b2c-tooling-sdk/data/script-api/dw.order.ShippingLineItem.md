<!-- prettier-ignore-start -->
# Class ShippingLineItem

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)
      - [dw.order.LineItem](dw.order.LineItem.md)
        - [dw.order.ShippingLineItem](dw.order.ShippingLineItem.md)

Represents a specific line item in a shipment. The ShippingLineItem defines
the general shipping costs of a shipment.



## Constant Summary

| Constant | Description |
| --- | --- |
| [STANDARD_SHIPPING_ID](#standard_shipping_id): [String](TopLevel.String.md) = "STANDARD_SHIPPING" | Constant used to get the standard shipping line item. |

## Property Summary

| Property | Description |
| --- | --- |
| [ID](#id): [String](TopLevel.String.md) `(read-only)` | Returns the ID of this ShippingLineItem. |
| [adjustedGrossPrice](#adjustedgrossprice): [Money](dw.value.Money.md) `(read-only)` | Returns the price of this shipping line item including tax after  shipping adjustments have been applied. |
| [adjustedNetPrice](#adjustednetprice): [Money](dw.value.Money.md) `(read-only)` | Returns the price of this shipping line item, excluding tax after  shipping adjustments have been applied. |
| [adjustedPrice](#adjustedprice): [Money](dw.value.Money.md) `(read-only)` | Returns the adjusted price of this shipping line item. |
| [adjustedTax](#adjustedtax): [Money](dw.value.Money.md) `(read-only)` | Returns the tax of this shipping line item after shipping adjustments  have been applied. |
| [orderItem](#orderitem): [OrderItem](dw.order.OrderItem.md) `(read-only)` | Returns the [order-item extension](dw.order.OrderItem.md) for this item, or `null`. |
| [shippingPriceAdjustments](#shippingpriceadjustments): [Collection](dw.util.Collection.md) `(read-only)` | Returns the collection of shipping price adjustments that have been  applied to this shipping line item. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [createShippingPriceAdjustment](dw.order.ShippingLineItem.md#createshippingpriceadjustmentstring)([String](TopLevel.String.md)) | Creates a shipping price adjustment to be applied to the shipping line item.<br/>  The promotion ID is mandatory and must not be the ID of any actual promotion defined in B2C Commerce.<br/>  If there already exists a shipping price adjustment on this shipping line item referring to the specified  promotion ID, an exception is thrown. |
| [createShippingPriceAdjustment](dw.order.ShippingLineItem.md#createshippingpriceadjustmentstring-discount)([String](TopLevel.String.md), [Discount](dw.campaign.Discount.md)) | Creates a shipping price adjustment to be applied to the shipping line item.<br/>  The promotion ID is mandatory and must not be the ID of any actual promotion defined in B2C Commerce. |
| [getAdjustedGrossPrice](dw.order.ShippingLineItem.md#getadjustedgrossprice)() | Returns the price of this shipping line item including tax after  shipping adjustments have been applied. |
| [getAdjustedNetPrice](dw.order.ShippingLineItem.md#getadjustednetprice)() | Returns the price of this shipping line item, excluding tax after  shipping adjustments have been applied. |
| [getAdjustedPrice](dw.order.ShippingLineItem.md#getadjustedprice)() | Returns the adjusted price of this shipping line item. |
| [getAdjustedTax](dw.order.ShippingLineItem.md#getadjustedtax)() | Returns the tax of this shipping line item after shipping adjustments  have been applied. |
| [getID](dw.order.ShippingLineItem.md#getid)() | Returns the ID of this ShippingLineItem. |
| [getOrderItem](dw.order.ShippingLineItem.md#getorderitem)() | Returns the [order-item extension](dw.order.OrderItem.md) for this item, or `null`. |
| [getShippingPriceAdjustments](dw.order.ShippingLineItem.md#getshippingpriceadjustments)() | Returns the collection of shipping price adjustments that have been  applied to this shipping line item. |
| [removeShippingPriceAdjustment](dw.order.ShippingLineItem.md#removeshippingpriceadjustmentpriceadjustment)([PriceAdjustment](dw.order.PriceAdjustment.md)) | Removes the specified shipping price adjustment from this shipping line  item. |

### Methods inherited from class LineItem

[getBasePrice](dw.order.LineItem.md#getbaseprice), [getGrossPrice](dw.order.LineItem.md#getgrossprice), [getLineItemCtnr](dw.order.LineItem.md#getlineitemctnr), [getLineItemText](dw.order.LineItem.md#getlineitemtext), [getNetPrice](dw.order.LineItem.md#getnetprice), [getPrice](dw.order.LineItem.md#getprice), [getPriceValue](dw.order.LineItem.md#getpricevalue), [getTax](dw.order.LineItem.md#gettax), [getTaxBasis](dw.order.LineItem.md#gettaxbasis), [getTaxClassID](dw.order.LineItem.md#gettaxclassid), [getTaxRate](dw.order.LineItem.md#gettaxrate), [setBasePrice](dw.order.LineItem.md#setbasepricemoney), [setGrossPrice](dw.order.LineItem.md#setgrosspricemoney), [setLineItemText](dw.order.LineItem.md#setlineitemtextstring), [setNetPrice](dw.order.LineItem.md#setnetpricemoney), [setPriceValue](dw.order.LineItem.md#setpricevaluenumber), [setTax](dw.order.LineItem.md#settaxmoney), [setTaxClassID](dw.order.LineItem.md#settaxclassidstring), [setTaxRate](dw.order.LineItem.md#settaxratenumber), [updatePrice](dw.order.LineItem.md#updatepricemoney), [updateTax](dw.order.LineItem.md#updatetaxnumber), [updateTax](dw.order.LineItem.md#updatetaxnumber-money), [updateTaxAmount](dw.order.LineItem.md#updatetaxamountmoney)
### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### STANDARD_SHIPPING_ID

- STANDARD_SHIPPING_ID: [String](TopLevel.String.md) = "STANDARD_SHIPPING"
  - : Constant used to get the standard shipping line item.


---

## Property Details

### ID
- ID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the ID of this ShippingLineItem.


---

### adjustedGrossPrice
- adjustedGrossPrice: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the price of this shipping line item including tax after
      shipping adjustments have been applied.



---

### adjustedNetPrice
- adjustedNetPrice: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the price of this shipping line item, excluding tax after
      shipping adjustments have been applied.



---

### adjustedPrice
- adjustedPrice: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the adjusted price of this shipping line item. If the line item
      container is based on net pricing, the adjusted net price is returned. If
      the line item container is based on gross pricing, the adjusted gross
      price is returned.



---

### adjustedTax
- adjustedTax: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the tax of this shipping line item after shipping adjustments
      have been applied.



---

### orderItem
- orderItem: [OrderItem](dw.order.OrderItem.md) `(read-only)`
  - : Returns the [order-item extension](dw.order.OrderItem.md) for this item, or `null`.
      An order-item extension will only exist for a ShippingLineItem which
      belongs to an [Order](dw.order.Order.md).
      
      
      Order post-processing APIs (gillian) are now inactive by default and will throw
      an exception if accessed. Activation needs preliminary approval by Product Management.
      Please contact support in this case. Existing customers using these APIs are not
      affected by this change and can use the APIs until further notice.



---

### shippingPriceAdjustments
- shippingPriceAdjustments: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns the collection of shipping price adjustments that have been
      applied to this shipping line item.



---

## Method Details

### createShippingPriceAdjustment(String)
- createShippingPriceAdjustment(promotionID: [String](TopLevel.String.md)): [PriceAdjustment](dw.order.PriceAdjustment.md)
  - : Creates a shipping price adjustment to be applied to the shipping line item.
      
      The promotion ID is mandatory and must not be the ID of any actual promotion defined in B2C Commerce.
      
      If there already exists a shipping price adjustment on this shipping line item referring to the specified
      promotion ID, an exception is thrown.


    **Parameters:**
    - promotionID - Promotion ID

    **Returns:**
    - The new price adjustment line item.


---

### createShippingPriceAdjustment(String, Discount)
- createShippingPriceAdjustment(promotionID: [String](TopLevel.String.md), discount: [Discount](dw.campaign.Discount.md)): [PriceAdjustment](dw.order.PriceAdjustment.md)
  - : Creates a shipping price adjustment to be applied to the shipping line item.
      
      The promotion ID is mandatory and must not be the ID of any actual promotion defined in B2C Commerce. If a
      shipping price adjustment on this shipping line item referring to the specified promotion ID already exists, an
      exception is thrown. 
      
      The possible values for discount are [PercentageDiscount](dw.campaign.PercentageDiscount.md), [AmountDiscount](dw.campaign.AmountDiscount.md),
      [FixedPriceShippingDiscount](dw.campaign.FixedPriceShippingDiscount.md). 
      
      Examples:
      
      
      `
       var myShippingItem : dw.order.ShippingLineItem; // assume known
      
       var paFixedShippingPrice12 : dw.order.PriceAdjustment = myShippingItem.createPriceAdjustment("myPromotionID1", new FixedPriceShippingDiscount(12));
      
       var paTenPercent : dw.order.PriceAdjustment = myShippingItem.createPriceAdjustment("myPromotionID2", new PercentageDiscount(10));
      
       var paReduceBy2 : dw.order.PriceAdjustment = myShippingItem.createPriceAdjustment("myPromotionID3", new AmountDiscount(2));
      
       `


    **Parameters:**
    - promotionID - Promotion ID
    - discount - The desired discount, not null

    **Returns:**
    - The new price adjustment line item.


---

### getAdjustedGrossPrice()
- getAdjustedGrossPrice(): [Money](dw.value.Money.md)
  - : Returns the price of this shipping line item including tax after
      shipping adjustments have been applied.


    **Returns:**
    - the price of this shipping line item, including tax
              after shipping adjustments have been applied.



---

### getAdjustedNetPrice()
- getAdjustedNetPrice(): [Money](dw.value.Money.md)
  - : Returns the price of this shipping line item, excluding tax after
      shipping adjustments have been applied.


    **Returns:**
    - the price of this shipping line item, excluding tax after
              shipping adjustments have been applied.



---

### getAdjustedPrice()
- getAdjustedPrice(): [Money](dw.value.Money.md)
  - : Returns the adjusted price of this shipping line item. If the line item
      container is based on net pricing, the adjusted net price is returned. If
      the line item container is based on gross pricing, the adjusted gross
      price is returned.


    **Returns:**
    - either the adjusted net or gross price of this shipping line
              item.



---

### getAdjustedTax()
- getAdjustedTax(): [Money](dw.value.Money.md)
  - : Returns the tax of this shipping line item after shipping adjustments
      have been applied.


    **Returns:**
    - the tax of this shipping line item after shipping adjustments
              have been applied.



---

### getID()
- getID(): [String](TopLevel.String.md)
  - : Returns the ID of this ShippingLineItem.

    **Returns:**
    - ID of this ShippingLineItem


---

### getOrderItem()
- getOrderItem(): [OrderItem](dw.order.OrderItem.md)
  - : Returns the [order-item extension](dw.order.OrderItem.md) for this item, or `null`.
      An order-item extension will only exist for a ShippingLineItem which
      belongs to an [Order](dw.order.Order.md).
      
      
      Order post-processing APIs (gillian) are now inactive by default and will throw
      an exception if accessed. Activation needs preliminary approval by Product Management.
      Please contact support in this case. Existing customers using these APIs are not
      affected by this change and can use the APIs until further notice.


    **Returns:**
    - null or the order-item


---

### getShippingPriceAdjustments()
- getShippingPriceAdjustments(): [Collection](dw.util.Collection.md)
  - : Returns the collection of shipping price adjustments that have been
      applied to this shipping line item.


    **Returns:**
    - the collection of shipping price adjustments that have been
              applied to this shipping line item.



---

### removeShippingPriceAdjustment(PriceAdjustment)
- removeShippingPriceAdjustment(priceAdjustment: [PriceAdjustment](dw.order.PriceAdjustment.md)): void
  - : Removes the specified shipping price adjustment from this shipping line
      item.


    **Parameters:**
    - priceAdjustment - The price adjustment line item to remove


---

<!-- prettier-ignore-end -->
