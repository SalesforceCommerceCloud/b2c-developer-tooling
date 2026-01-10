<!-- prettier-ignore-start -->
# Class Shipment

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)
      - [dw.order.Shipment](dw.order.Shipment.md)

Represents an order shipment.


## Constant Summary

| Constant | Description |
| --- | --- |
| ~~[SHIPMENT_NOTSHIPPED](#shipment_notshipped): [Number](TopLevel.Number.md) = 0~~ | Shipment shipping status representing 'Not shipped'. |
| ~~[SHIPMENT_SHIPPED](#shipment_shipped): [Number](TopLevel.Number.md) = 2~~ | Shipment shipping status representing 'Shipped'. |
| [SHIPPING_STATUS_NOTSHIPPED](#shipping_status_notshipped): [Number](TopLevel.Number.md) = 0 | Shipment shipping status representing 'Not shipped'. |
| [SHIPPING_STATUS_SHIPPED](#shipping_status_shipped): [Number](TopLevel.Number.md) = 2 | Shipment shipping status representing 'Shipped'. |

## Property Summary

| Property | Description |
| --- | --- |
| [ID](#id): [String](TopLevel.String.md) `(read-only)` | Returns the ID of this shipment ("me" for the default shipment). |
| [adjustedMerchandizeTotalGrossPrice](#adjustedmerchandizetotalgrossprice): [Money](dw.value.Money.md) `(read-only)` | Returns the adjusted total gross price, including tax, in the purchase currency. |
| [adjustedMerchandizeTotalNetPrice](#adjustedmerchandizetotalnetprice): [Money](dw.value.Money.md) `(read-only)` | Returns the adjusted net price, excluding tax, in the purchase currency. |
| [adjustedMerchandizeTotalPrice](#adjustedmerchandizetotalprice): [Money](dw.value.Money.md) `(read-only)` | Returns the product total price after all product discounts. |
| [adjustedMerchandizeTotalTax](#adjustedmerchandizetotaltax): [Money](dw.value.Money.md) `(read-only)` | Returns the total adjusted product tax in the purchase currency. |
| [adjustedShippingTotalGrossPrice](#adjustedshippingtotalgrossprice): [Money](dw.value.Money.md) `(read-only)` | Returns the adjusted sum of all shipping line items of the shipment, including shipping adjustuments and tax |
| [adjustedShippingTotalNetPrice](#adjustedshippingtotalnetprice): [Money](dw.value.Money.md) `(read-only)` | Returns the sum of all shipping line items of the shipment, including shipping adjustments, excluding tax. |
| [adjustedShippingTotalPrice](#adjustedshippingtotalprice): [Money](dw.value.Money.md) `(read-only)` | Returns the adjusted shipping total price. |
| [adjustedShippingTotalTax](#adjustedshippingtotaltax): [Money](dw.value.Money.md) `(read-only)` | Returns the tax of all shipping line items of the shipment , including shipping adjustments. |
| [allLineItems](#alllineitems): [Collection](dw.util.Collection.md) `(read-only)` | Returns all line items related to the shipment. |
| [default](#default): [Boolean](TopLevel.Boolean.md) `(read-only)` | Return `true` if this shipment is the default shipment (shipment ID "me"). |
| [gift](#gift): [Boolean](TopLevel.Boolean.md) | Returns true if this line item represents a gift, false otherwise. |
| [giftCertificateLineItems](#giftcertificatelineitems): [Collection](dw.util.Collection.md) `(read-only)` | Returns all gift certificate line items of the shipment. |
| [giftMessage](#giftmessage): [String](TopLevel.String.md) | Returns the value set for gift message or null if no value set. |
| [merchandizeTotalGrossPrice](#merchandizetotalgrossprice): [Money](dw.value.Money.md) `(read-only)` | Returns the gross product subtotal in the purchase currency. |
| [merchandizeTotalNetPrice](#merchandizetotalnetprice): [Money](dw.value.Money.md) `(read-only)` | Returns the net product subtotal, excluding tax, in the purchase currency. |
| [merchandizeTotalPrice](#merchandizetotalprice): [Money](dw.value.Money.md) `(read-only)` | Returns the product total price. |
| ~~[merchandizeTotalPriceAdjustments](#merchandizetotalpriceadjustments): [Collection](dw.util.Collection.md)~~ `(read-only)` | Returns a collection of price adjustments that have been applied to the totals, such as a promotion on the  purchase value (i.e. |
| [merchandizeTotalTax](#merchandizetotaltax): [Money](dw.value.Money.md) `(read-only)` | Returns the total product tax in the purchase currency. |
| [productLineItems](#productlineitems): [Collection](dw.util.Collection.md) `(read-only)` | Returns a collection of all product line items related to this shipment. |
| [proratedMerchandizeTotalPrice](#proratedmerchandizetotalprice): [Money](dw.value.Money.md) `(read-only)` | Returns the total product price of the shipment, including product-level adjustments and prorating all  Buy-X-Get-Y and order-level adjustments, according to the scheme described in  [PriceAdjustment.getProratedPrices()](dw.order.PriceAdjustment.md#getproratedprices). |
| [shipmentNo](#shipmentno): [String](TopLevel.String.md) `(read-only)` | Returns the shipment number for this shipment. |
| [shippingAddress](#shippingaddress): [OrderAddress](dw.order.OrderAddress.md) `(read-only)` | Returns the shipping address or null if none is set. |
| [shippingLineItems](#shippinglineitems): [Collection](dw.util.Collection.md) `(read-only)` | Returns a collection of all shipping line items of the shipment, excluding any product-level shipping costs that  are associated with [ProductLineItem](dw.order.ProductLineItem.md)s of the shipment. |
| [shippingMethod](#shippingmethod): [ShippingMethod](dw.order.ShippingMethod.md) | Returns the shipping method or null if none is set. |
| [shippingMethodID](#shippingmethodid): [String](TopLevel.String.md) `(read-only)` | Returns the shipping method ID or null if none is set. |
| [shippingPriceAdjustments](#shippingpriceadjustments): [Collection](dw.util.Collection.md) `(read-only)` | Returns a collection of price adjustments that have been applied to the shipping costs of the shipment, for  example by the promotions engine.<br/>  Note that this method returns all shipping price adjustments in this shipment, regardless of which shipping line  item they belong to. |
| [shippingStatus](#shippingstatus): [EnumValue](dw.value.EnumValue.md) | Returns the shipping status. |
| [shippingTotalGrossPrice](#shippingtotalgrossprice): [Money](dw.value.Money.md) `(read-only)` | Returns the sum of all shipping line items of the shipment, including tax, excluding shipping adjustments. |
| [shippingTotalNetPrice](#shippingtotalnetprice): [Money](dw.value.Money.md) `(read-only)` | Returns the sum of all shipping line items of the shipment, excluding tax and adjustments. |
| [shippingTotalPrice](#shippingtotalprice): [Money](dw.value.Money.md) `(read-only)` | Returns the shipping total price. |
| [shippingTotalTax](#shippingtotaltax): [Money](dw.value.Money.md) `(read-only)` | Returns the tax of all shipping line items of the shipment before shipping adjustments have been applied. |
| [standardShippingLineItem](#standardshippinglineitem): [ShippingLineItem](dw.order.ShippingLineItem.md) `(read-only)` | Convenience method. |
| [totalGrossPrice](#totalgrossprice): [Money](dw.value.Money.md) `(read-only)` | Returns the total gross price of the shipment in the purchase currency. |
| [totalNetPrice](#totalnetprice): [Money](dw.value.Money.md) `(read-only)` | Returns the total net price of the shipment in the purchase currency. |
| [totalTax](#totaltax): [Money](dw.value.Money.md) `(read-only)` | Returns the total tax for the shipment in the purchase currency. |
| [trackingNumber](#trackingnumber): [String](TopLevel.String.md) | Returns the tracking number of this shipment. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [createShippingAddress](dw.order.Shipment.md#createshippingaddress)() | A shipment has initially no shipping address. |
| [createShippingLineItem](dw.order.Shipment.md#createshippinglineitemstring)([String](TopLevel.String.md)) | Creates a new shipping line item for this shipment. |
| ~~[createShippingPriceAdjustment](dw.order.Shipment.md#createshippingpriceadjustmentstring)([String](TopLevel.String.md))~~ | Creates a shipping price adjustment to be applied to the shipment. |
| [getAdjustedMerchandizeTotalGrossPrice](dw.order.Shipment.md#getadjustedmerchandizetotalgrossprice)() | Returns the adjusted total gross price, including tax, in the purchase currency. |
| [getAdjustedMerchandizeTotalNetPrice](dw.order.Shipment.md#getadjustedmerchandizetotalnetprice)() | Returns the adjusted net price, excluding tax, in the purchase currency. |
| [getAdjustedMerchandizeTotalPrice](dw.order.Shipment.md#getadjustedmerchandizetotalprice)() | Returns the product total price after all product discounts. |
| [getAdjustedMerchandizeTotalPrice](dw.order.Shipment.md#getadjustedmerchandizetotalpriceboolean)([Boolean](TopLevel.Boolean.md)) | Returns the total product price including product-level adjustments and, optionally, prorated order-level  adjustments. |
| [getAdjustedMerchandizeTotalTax](dw.order.Shipment.md#getadjustedmerchandizetotaltax)() | Returns the total adjusted product tax in the purchase currency. |
| [getAdjustedShippingTotalGrossPrice](dw.order.Shipment.md#getadjustedshippingtotalgrossprice)() | Returns the adjusted sum of all shipping line items of the shipment, including shipping adjustuments and tax |
| [getAdjustedShippingTotalNetPrice](dw.order.Shipment.md#getadjustedshippingtotalnetprice)() | Returns the sum of all shipping line items of the shipment, including shipping adjustments, excluding tax. |
| [getAdjustedShippingTotalPrice](dw.order.Shipment.md#getadjustedshippingtotalprice)() | Returns the adjusted shipping total price. |
| [getAdjustedShippingTotalTax](dw.order.Shipment.md#getadjustedshippingtotaltax)() | Returns the tax of all shipping line items of the shipment , including shipping adjustments. |
| [getAllLineItems](dw.order.Shipment.md#getalllineitems)() | Returns all line items related to the shipment. |
| [getGiftCertificateLineItems](dw.order.Shipment.md#getgiftcertificatelineitems)() | Returns all gift certificate line items of the shipment. |
| [getGiftMessage](dw.order.Shipment.md#getgiftmessage)() | Returns the value set for gift message or null if no value set. |
| [getID](dw.order.Shipment.md#getid)() | Returns the ID of this shipment ("me" for the default shipment). |
| [getMerchandizeTotalGrossPrice](dw.order.Shipment.md#getmerchandizetotalgrossprice)() | Returns the gross product subtotal in the purchase currency. |
| [getMerchandizeTotalNetPrice](dw.order.Shipment.md#getmerchandizetotalnetprice)() | Returns the net product subtotal, excluding tax, in the purchase currency. |
| [getMerchandizeTotalPrice](dw.order.Shipment.md#getmerchandizetotalprice)() | Returns the product total price. |
| ~~[getMerchandizeTotalPriceAdjustments](dw.order.Shipment.md#getmerchandizetotalpriceadjustments)()~~ | Returns a collection of price adjustments that have been applied to the totals, such as a promotion on the  purchase value (i.e. |
| [getMerchandizeTotalTax](dw.order.Shipment.md#getmerchandizetotaltax)() | Returns the total product tax in the purchase currency. |
| [getProductLineItems](dw.order.Shipment.md#getproductlineitems)() | Returns a collection of all product line items related to this shipment. |
| [getProratedMerchandizeTotalPrice](dw.order.Shipment.md#getproratedmerchandizetotalprice)() | Returns the total product price of the shipment, including product-level adjustments and prorating all  Buy-X-Get-Y and order-level adjustments, according to the scheme described in  [PriceAdjustment.getProratedPrices()](dw.order.PriceAdjustment.md#getproratedprices). |
| [getShipmentNo](dw.order.Shipment.md#getshipmentno)() | Returns the shipment number for this shipment. |
| [getShippingAddress](dw.order.Shipment.md#getshippingaddress)() | Returns the shipping address or null if none is set. |
| [getShippingLineItem](dw.order.Shipment.md#getshippinglineitemstring)([String](TopLevel.String.md)) | Returns the shipping line item identified by the specified ID, or null if not found. |
| [getShippingLineItems](dw.order.Shipment.md#getshippinglineitems)() | Returns a collection of all shipping line items of the shipment, excluding any product-level shipping costs that  are associated with [ProductLineItem](dw.order.ProductLineItem.md)s of the shipment. |
| [getShippingMethod](dw.order.Shipment.md#getshippingmethod)() | Returns the shipping method or null if none is set. |
| [getShippingMethodID](dw.order.Shipment.md#getshippingmethodid)() | Returns the shipping method ID or null if none is set. |
| ~~[getShippingPriceAdjustmentByPromotionID](dw.order.Shipment.md#getshippingpriceadjustmentbypromotionidstring)([String](TopLevel.String.md))~~ | Returns the shipping price adjustment associated with the specified promotion ID. |
| [getShippingPriceAdjustments](dw.order.Shipment.md#getshippingpriceadjustments)() | Returns a collection of price adjustments that have been applied to the shipping costs of the shipment, for  example by the promotions engine.<br/>  Note that this method returns all shipping price adjustments in this shipment, regardless of which shipping line  item they belong to. |
| [getShippingStatus](dw.order.Shipment.md#getshippingstatus)() | Returns the shipping status. |
| [getShippingTotalGrossPrice](dw.order.Shipment.md#getshippingtotalgrossprice)() | Returns the sum of all shipping line items of the shipment, including tax, excluding shipping adjustments. |
| [getShippingTotalNetPrice](dw.order.Shipment.md#getshippingtotalnetprice)() | Returns the sum of all shipping line items of the shipment, excluding tax and adjustments. |
| [getShippingTotalPrice](dw.order.Shipment.md#getshippingtotalprice)() | Returns the shipping total price. |
| [getShippingTotalTax](dw.order.Shipment.md#getshippingtotaltax)() | Returns the tax of all shipping line items of the shipment before shipping adjustments have been applied. |
| [getStandardShippingLineItem](dw.order.Shipment.md#getstandardshippinglineitem)() | Convenience method. |
| [getTotalGrossPrice](dw.order.Shipment.md#gettotalgrossprice)() | Returns the total gross price of the shipment in the purchase currency. |
| [getTotalNetPrice](dw.order.Shipment.md#gettotalnetprice)() | Returns the total net price of the shipment in the purchase currency. |
| [getTotalTax](dw.order.Shipment.md#gettotaltax)() | Returns the total tax for the shipment in the purchase currency. |
| [getTrackingNumber](dw.order.Shipment.md#gettrackingnumber)() | Returns the tracking number of this shipment. |
| [isDefault](dw.order.Shipment.md#isdefault)() | Return `true` if this shipment is the default shipment (shipment ID "me"). |
| [isGift](dw.order.Shipment.md#isgift)() | Returns true if this line item represents a gift, false otherwise. |
| [removeShippingLineItem](dw.order.Shipment.md#removeshippinglineitemshippinglineitem)([ShippingLineItem](dw.order.ShippingLineItem.md)) | Removes the specified shipping line item and any of its dependent shipping price adjustments. |
| ~~[removeShippingPriceAdjustment](dw.order.Shipment.md#removeshippingpriceadjustmentpriceadjustment)([PriceAdjustment](dw.order.PriceAdjustment.md))~~ | Removes the specified shipping price adjustment from the shipment. |
| [setGift](dw.order.Shipment.md#setgiftboolean)([Boolean](TopLevel.Boolean.md)) | Controls if this line item is a gift or not. |
| [setGiftMessage](dw.order.Shipment.md#setgiftmessagestring)([String](TopLevel.String.md)) | Sets the value to set for the gift message. |
| [setShippingMethod](dw.order.Shipment.md#setshippingmethodshippingmethod)([ShippingMethod](dw.order.ShippingMethod.md)) | Set the specified shipping method for the specified shipment. |
| [setShippingStatus](dw.order.Shipment.md#setshippingstatusnumber)([Number](TopLevel.Number.md)) | Sets the shipping status of the shipment. |
| [setTrackingNumber](dw.order.Shipment.md#settrackingnumberstring)([String](TopLevel.String.md)) | Sets the tracking number of this shipment. |

### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### SHIPMENT_NOTSHIPPED

- ~~SHIPMENT_NOTSHIPPED: [Number](TopLevel.Number.md) = 0~~
  - : Shipment shipping status representing 'Not shipped'.

    **Deprecated:**
:::warning
Use [SHIPPING_STATUS_NOTSHIPPED](dw.order.Shipment.md#shipping_status_notshipped) instead.
:::

---

### SHIPMENT_SHIPPED

- ~~SHIPMENT_SHIPPED: [Number](TopLevel.Number.md) = 2~~
  - : Shipment shipping status representing 'Shipped'.

    **Deprecated:**
:::warning
Use [SHIPPING_STATUS_SHIPPED](dw.order.Shipment.md#shipping_status_shipped) instead.
:::

---

### SHIPPING_STATUS_NOTSHIPPED

- SHIPPING_STATUS_NOTSHIPPED: [Number](TopLevel.Number.md) = 0
  - : Shipment shipping status representing 'Not shipped'.


---

### SHIPPING_STATUS_SHIPPED

- SHIPPING_STATUS_SHIPPED: [Number](TopLevel.Number.md) = 2
  - : Shipment shipping status representing 'Shipped'.


---

## Property Details

### ID
- ID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the ID of this shipment ("me" for the default shipment).


---

### adjustedMerchandizeTotalGrossPrice
- adjustedMerchandizeTotalGrossPrice: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the adjusted total gross price, including tax, in the purchase currency. The adjusted total gross price
      represents the sum of product prices and adjustments including tax, excluding services.



---

### adjustedMerchandizeTotalNetPrice
- adjustedMerchandizeTotalNetPrice: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the adjusted net price, excluding tax, in the purchase currency. The adjusted net price represents the
      the sum of product prices and adjustments, excluding services and tax.



---

### adjustedMerchandizeTotalPrice
- adjustedMerchandizeTotalPrice: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the product total price after all product discounts. If the line item container is based on net pricing
      the adjusted product total net price is returned. If the line item container is based on gross pricing the
      adjusted product total gross price is returned.



---

### adjustedMerchandizeTotalTax
- adjustedMerchandizeTotalTax: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the total adjusted product tax in the purchase currency. The total adjusted product tax represents the
      tax on products and adjustments, excluding services.



---

### adjustedShippingTotalGrossPrice
- adjustedShippingTotalGrossPrice: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the adjusted sum of all shipping line items of the shipment, including shipping adjustuments and tax


---

### adjustedShippingTotalNetPrice
- adjustedShippingTotalNetPrice: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the sum of all shipping line items of the shipment, including shipping adjustments, excluding tax.


---

### adjustedShippingTotalPrice
- adjustedShippingTotalPrice: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the adjusted shipping total price. If the line item container is based on net pricing the adjusted
      shipping total net price is returned. If the line item container is based on gross pricing the adjusted shipping
      total gross price is returned.



---

### adjustedShippingTotalTax
- adjustedShippingTotalTax: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the tax of all shipping line items of the shipment , including shipping adjustments.


---

### allLineItems
- allLineItems: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns all line items related to the shipment.
      
      
      The returned collection may include line items of the following types:
      
      - [ProductLineItem](dw.order.ProductLineItem.md)
      - [ShippingLineItem](dw.order.ShippingLineItem.md)
      - [GiftCertificateLineItem](dw.order.GiftCertificateLineItem.md)
      - [PriceAdjustment](dw.order.PriceAdjustment.md)
      
      Their common type is [LineItem](dw.order.LineItem.md).
      
      
      Each [ProductLineItem](dw.order.ProductLineItem.md) in the collection may itself contain bundled or option product line items,
      as well as a product-level shipping line item.



---

### default
- default: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Return `true` if this shipment is the default shipment (shipment ID "me").


---

### gift
- gift: [Boolean](TopLevel.Boolean.md)
  - : Returns true if this line item represents a gift, false otherwise.


---

### giftCertificateLineItems
- giftCertificateLineItems: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns all gift certificate line items of the shipment.


---

### giftMessage
- giftMessage: [String](TopLevel.String.md)
  - : Returns the value set for gift message or null if no value set.


---

### merchandizeTotalGrossPrice
- merchandizeTotalGrossPrice: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the gross product subtotal in the purchase currency. The gross product subtotal represents the sum of
      product prices including tax, excluding services and adjustments.



---

### merchandizeTotalNetPrice
- merchandizeTotalNetPrice: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the net product subtotal, excluding tax, in the purchase currency. The net product subtotal represents
      the sum of product prices, excluding services, adjustments, and tax.



---

### merchandizeTotalPrice
- merchandizeTotalPrice: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the product total price. If the line item container is based on net pricing the product total net
      price is returned. If the line item container is based on gross pricing the product total gross price is
      returned.



---

### merchandizeTotalPriceAdjustments
- ~~merchandizeTotalPriceAdjustments: [Collection](dw.util.Collection.md)~~ `(read-only)`
  - : Returns a collection of price adjustments that have been applied to the totals, such as a promotion on the
      purchase value (i.e. $10 Off or 10% Off).


    **Deprecated:**
:::warning
Shipments cannot have product price adjustments, therefore this method will always return an
            empty collection

:::

---

### merchandizeTotalTax
- merchandizeTotalTax: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the total product tax in the purchase currency. The total product tax represents the tax on products,
      excluding services and adjustments.



---

### productLineItems
- productLineItems: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns a collection of all product line items related to this shipment.


---

### proratedMerchandizeTotalPrice
- proratedMerchandizeTotalPrice: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the total product price of the shipment, including product-level adjustments and prorating all
      Buy-X-Get-Y and order-level adjustments, according to the scheme described in
      [PriceAdjustment.getProratedPrices()](dw.order.PriceAdjustment.md#getproratedprices). For net pricing the net price is returned. For gross
      pricing, the gross price is returned.



---

### shipmentNo
- shipmentNo: [String](TopLevel.String.md) `(read-only)`
  - : Returns the shipment number for this shipment.
      
      
      When an order is placed ([OrderMgr.placeOrder(Order)](dw.order.OrderMgr.md#placeorderorder)) shipment number will be filled using a
      sequence. Before order was placed `null` will be returned.



---

### shippingAddress
- shippingAddress: [OrderAddress](dw.order.OrderAddress.md) `(read-only)`
  - : Returns the shipping address or null if none is set.


---

### shippingLineItems
- shippingLineItems: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns a collection of all shipping line items of the shipment, excluding any product-level shipping costs that
      are associated with [ProductLineItem](dw.order.ProductLineItem.md)s of the shipment.



---

### shippingMethod
- shippingMethod: [ShippingMethod](dw.order.ShippingMethod.md)
  - : Returns the shipping method or null if none is set.


---

### shippingMethodID
- shippingMethodID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the shipping method ID or null if none is set.


---

### shippingPriceAdjustments
- shippingPriceAdjustments: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns a collection of price adjustments that have been applied to the shipping costs of the shipment, for
      example by the promotions engine.
      
      Note that this method returns all shipping price adjustments in this shipment, regardless of which shipping line
      item they belong to. Use [ShippingLineItem.getShippingPriceAdjustments()](dw.order.ShippingLineItem.md#getshippingpriceadjustments) to retrieve the shipping
      price adjustments associated with a specific shipping line item.



---

### shippingStatus
- shippingStatus: [EnumValue](dw.value.EnumValue.md)
  - : Returns the shipping status. Possible values are SHIPMENT\_NOTSHIPPED or SHIPMENT\_SHIPPED.


---

### shippingTotalGrossPrice
- shippingTotalGrossPrice: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the sum of all shipping line items of the shipment, including tax, excluding shipping adjustments.


---

### shippingTotalNetPrice
- shippingTotalNetPrice: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the sum of all shipping line items of the shipment, excluding tax and adjustments.


---

### shippingTotalPrice
- shippingTotalPrice: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the shipping total price. If the line item container is based on net pricing the shipping total net price
      is returned. If the line item container is based on gross pricing the shipping total gross price is returned.



---

### shippingTotalTax
- shippingTotalTax: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the tax of all shipping line items of the shipment before shipping adjustments have been applied.


---

### standardShippingLineItem
- standardShippingLineItem: [ShippingLineItem](dw.order.ShippingLineItem.md) `(read-only)`
  - : Convenience method. Same as `getShippingLineItem(ShippingLineItem.STANDARD_SHIPPING_ID)`


---

### totalGrossPrice
- totalGrossPrice: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the total gross price of the shipment in the purchase currency. The total gross price is the sum of
      product prices, service prices, adjustments, and tax.



---

### totalNetPrice
- totalNetPrice: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the total net price of the shipment in the purchase currency. The total net price is the sum of product
      prices, service prices, and adjustments, excluding tax.



---

### totalTax
- totalTax: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the total tax for the shipment in the purchase currency.


---

### trackingNumber
- trackingNumber: [String](TopLevel.String.md)
  - : Returns the tracking number of this shipment.


---

## Method Details

### createShippingAddress()
- createShippingAddress(): [OrderAddress](dw.order.OrderAddress.md)
  - : A shipment has initially no shipping address. This method creates a shipping address for the shipment and
      replaces an existing shipping address.


    **Returns:**
    - The new shipping address of the shipment


---

### createShippingLineItem(String)
- createShippingLineItem(id: [String](TopLevel.String.md)): [ShippingLineItem](dw.order.ShippingLineItem.md)
  - : Creates a new shipping line item for this shipment. If the specified ID is already assigned to any of the
      existing shipping line items of the shipment, the method throws an exception.


    **Parameters:**
    - id - The id to use to locate the new shipping line item.

    **Returns:**
    - The new shipping line item.


---

### createShippingPriceAdjustment(String)
- ~~createShippingPriceAdjustment(promotionID: [String](TopLevel.String.md)): [PriceAdjustment](dw.order.PriceAdjustment.md)~~
  - : Creates a shipping price adjustment to be applied to the shipment. The price adjustment implicitly belongs to the
      standard shipping line item if this line item exists, otherwise it belongs to the shipment itself.
      
      The promotion ID is mandatory and must not be the ID of any actual promotion defined in Salesforce B2C
      Commerce.
      
      If there already exists a shipping price adjustment line item referring to the specified promotion ID, an
      exception is thrown.


    **Parameters:**
    - promotionID - Promotion ID

    **Returns:**
    - The new price adjustment line item.

    **Deprecated:**
:::warning
Deprecated in favor of [ShippingLineItem.createShippingPriceAdjustment(String)](dw.order.ShippingLineItem.md#createshippingpriceadjustmentstring), which
            explicitly relates the price adjustment to a shipping line item.

:::

---

### getAdjustedMerchandizeTotalGrossPrice()
- getAdjustedMerchandizeTotalGrossPrice(): [Money](dw.value.Money.md)
  - : Returns the adjusted total gross price, including tax, in the purchase currency. The adjusted total gross price
      represents the sum of product prices and adjustments including tax, excluding services.


    **Returns:**
    - the adjusted total gross price, including tax, in the purchase currency.


---

### getAdjustedMerchandizeTotalNetPrice()
- getAdjustedMerchandizeTotalNetPrice(): [Money](dw.value.Money.md)
  - : Returns the adjusted net price, excluding tax, in the purchase currency. The adjusted net price represents the
      the sum of product prices and adjustments, excluding services and tax.


    **Returns:**
    - the adjusted net price, excluding tax, in the purchase currency.


---

### getAdjustedMerchandizeTotalPrice()
- getAdjustedMerchandizeTotalPrice(): [Money](dw.value.Money.md)
  - : Returns the product total price after all product discounts. If the line item container is based on net pricing
      the adjusted product total net price is returned. If the line item container is based on gross pricing the
      adjusted product total gross price is returned.


    **Returns:**
    - either the adjusted product total net or gross price.


---

### getAdjustedMerchandizeTotalPrice(Boolean)
- getAdjustedMerchandizeTotalPrice(applyOrderLevelAdjustments: [Boolean](TopLevel.Boolean.md)): [Money](dw.value.Money.md)
  - : Returns the total product price including product-level adjustments and, optionally, prorated order-level
      adjustments. For net pricing the net price is returned. For gross pricing, the gross price is returned.


    **Parameters:**
    - applyOrderLevelAdjustments - If true, prorated order-level adjustments will be applied to total price

    **Returns:**
    - Adjusted net or gross product total price

    **See Also:**
    - [getAdjustedMerchandizeTotalPrice()](dw.order.Shipment.md#getadjustedmerchandizetotalprice)


---

### getAdjustedMerchandizeTotalTax()
- getAdjustedMerchandizeTotalTax(): [Money](dw.value.Money.md)
  - : Returns the total adjusted product tax in the purchase currency. The total adjusted product tax represents the
      tax on products and adjustments, excluding services.


    **Returns:**
    - the total tax in purchase currency.


---

### getAdjustedShippingTotalGrossPrice()
- getAdjustedShippingTotalGrossPrice(): [Money](dw.value.Money.md)
  - : Returns the adjusted sum of all shipping line items of the shipment, including shipping adjustuments and tax

    **Returns:**
    - the adjusted sum of all shipping line items of the shipment, including shipping adjustuments and tax


---

### getAdjustedShippingTotalNetPrice()
- getAdjustedShippingTotalNetPrice(): [Money](dw.value.Money.md)
  - : Returns the sum of all shipping line items of the shipment, including shipping adjustments, excluding tax.

    **Returns:**
    - the sum of all shipping line items of the shipment, including shipping adjustments, excluding tax.


---

### getAdjustedShippingTotalPrice()
- getAdjustedShippingTotalPrice(): [Money](dw.value.Money.md)
  - : Returns the adjusted shipping total price. If the line item container is based on net pricing the adjusted
      shipping total net price is returned. If the line item container is based on gross pricing the adjusted shipping
      total gross price is returned.


    **Returns:**
    - either the adjusted shipping total net or gross price


---

### getAdjustedShippingTotalTax()
- getAdjustedShippingTotalTax(): [Money](dw.value.Money.md)
  - : Returns the tax of all shipping line items of the shipment , including shipping adjustments.

    **Returns:**
    - the tax of all shipping line items of the shipment , including shipping adjustments.


---

### getAllLineItems()
- getAllLineItems(): [Collection](dw.util.Collection.md)
  - : Returns all line items related to the shipment.
      
      
      The returned collection may include line items of the following types:
      
      - [ProductLineItem](dw.order.ProductLineItem.md)
      - [ShippingLineItem](dw.order.ShippingLineItem.md)
      - [GiftCertificateLineItem](dw.order.GiftCertificateLineItem.md)
      - [PriceAdjustment](dw.order.PriceAdjustment.md)
      
      Their common type is [LineItem](dw.order.LineItem.md).
      
      
      Each [ProductLineItem](dw.order.ProductLineItem.md) in the collection may itself contain bundled or option product line items,
      as well as a product-level shipping line item.


    **Returns:**
    - all line items related to ths shipment.


---

### getGiftCertificateLineItems()
- getGiftCertificateLineItems(): [Collection](dw.util.Collection.md)
  - : Returns all gift certificate line items of the shipment.

    **Returns:**
    - A collection of all GiftCertificateLineItems of the shipment.


---

### getGiftMessage()
- getGiftMessage(): [String](TopLevel.String.md)
  - : Returns the value set for gift message or null if no value set.

    **Returns:**
    - the value set for gift message or null if no value set.


---

### getID()
- getID(): [String](TopLevel.String.md)
  - : Returns the ID of this shipment ("me" for the default shipment).

    **Returns:**
    - the ID of this shipment


---

### getMerchandizeTotalGrossPrice()
- getMerchandizeTotalGrossPrice(): [Money](dw.value.Money.md)
  - : Returns the gross product subtotal in the purchase currency. The gross product subtotal represents the sum of
      product prices including tax, excluding services and adjustments.


    **Returns:**
    - the total gross price, including tax, in the purchase currency.


---

### getMerchandizeTotalNetPrice()
- getMerchandizeTotalNetPrice(): [Money](dw.value.Money.md)
  - : Returns the net product subtotal, excluding tax, in the purchase currency. The net product subtotal represents
      the sum of product prices, excluding services, adjustments, and tax.


    **Returns:**
    - the net price, excluding tax, in the purchase currency.


---

### getMerchandizeTotalPrice()
- getMerchandizeTotalPrice(): [Money](dw.value.Money.md)
  - : Returns the product total price. If the line item container is based on net pricing the product total net
      price is returned. If the line item container is based on gross pricing the product total gross price is
      returned.


    **Returns:**
    - either the product total net or gross price


---

### getMerchandizeTotalPriceAdjustments()
- ~~getMerchandizeTotalPriceAdjustments(): [Collection](dw.util.Collection.md)~~
  - : Returns a collection of price adjustments that have been applied to the totals, such as a promotion on the
      purchase value (i.e. $10 Off or 10% Off).


    **Returns:**
    - a collection of price adjustments that have been applied to the totals, such as a promotion on the
              purchase value (i.e. $10 Off or 10% Off).


    **Deprecated:**
:::warning
Shipments cannot have product price adjustments, therefore this method will always return an
            empty collection

:::

---

### getMerchandizeTotalTax()
- getMerchandizeTotalTax(): [Money](dw.value.Money.md)
  - : Returns the total product tax in the purchase currency. The total product tax represents the tax on products,
      excluding services and adjustments.


    **Returns:**
    - the total tax in purchase currency.


---

### getProductLineItems()
- getProductLineItems(): [Collection](dw.util.Collection.md)
  - : Returns a collection of all product line items related to this shipment.

    **Returns:**
    - a collection of all product line items related to this shipment.


---

### getProratedMerchandizeTotalPrice()
- getProratedMerchandizeTotalPrice(): [Money](dw.value.Money.md)
  - : Returns the total product price of the shipment, including product-level adjustments and prorating all
      Buy-X-Get-Y and order-level adjustments, according to the scheme described in
      [PriceAdjustment.getProratedPrices()](dw.order.PriceAdjustment.md#getproratedprices). For net pricing the net price is returned. For gross
      pricing, the gross price is returned.


    **Returns:**
    - Adjusted and prorated net or gross product total price


---

### getShipmentNo()
- getShipmentNo(): [String](TopLevel.String.md)
  - : Returns the shipment number for this shipment.
      
      
      When an order is placed ([OrderMgr.placeOrder(Order)](dw.order.OrderMgr.md#placeorderorder)) shipment number will be filled using a
      sequence. Before order was placed `null` will be returned.


    **Returns:**
    - the shipment number for this shipment.


---

### getShippingAddress()
- getShippingAddress(): [OrderAddress](dw.order.OrderAddress.md)
  - : Returns the shipping address or null if none is set.

    **Returns:**
    - the shipping address or null if none is set.


---

### getShippingLineItem(String)
- getShippingLineItem(id: [String](TopLevel.String.md)): [ShippingLineItem](dw.order.ShippingLineItem.md)
  - : Returns the shipping line item identified by the specified ID, or null if not found.
      
      
      To get the standard shipping line item for this shipment, use the identifier
      [ShippingLineItem.STANDARD_SHIPPING_ID](dw.order.ShippingLineItem.md#standard_shipping_id).


    **Parameters:**
    - id - the identifier to use to locate the shipping line item.

    **Returns:**
    - the shipping line item identified by the specified ID, or null if not found.


---

### getShippingLineItems()
- getShippingLineItems(): [Collection](dw.util.Collection.md)
  - : Returns a collection of all shipping line items of the shipment, excluding any product-level shipping costs that
      are associated with [ProductLineItem](dw.order.ProductLineItem.md)s of the shipment.


    **Returns:**
    - a collection of all shipping line items of the shipment, excluding any product-level shipping costs.


---

### getShippingMethod()
- getShippingMethod(): [ShippingMethod](dw.order.ShippingMethod.md)
  - : Returns the shipping method or null if none is set.

    **Returns:**
    - the shipping method or null if none is set.


---

### getShippingMethodID()
- getShippingMethodID(): [String](TopLevel.String.md)
  - : Returns the shipping method ID or null if none is set.

    **Returns:**
    - the shipping method ID or null if none is set.


---

### getShippingPriceAdjustmentByPromotionID(String)
- ~~getShippingPriceAdjustmentByPromotionID(promotionID: [String](TopLevel.String.md)): [PriceAdjustment](dw.order.PriceAdjustment.md)~~
  - : Returns the shipping price adjustment associated with the specified promotion ID.

    **Parameters:**
    - promotionID - the promotion ID

    **Returns:**
    - The price adjustment associated with the given promotion ID


---

### getShippingPriceAdjustments()
- getShippingPriceAdjustments(): [Collection](dw.util.Collection.md)
  - : Returns a collection of price adjustments that have been applied to the shipping costs of the shipment, for
      example by the promotions engine.
      
      Note that this method returns all shipping price adjustments in this shipment, regardless of which shipping line
      item they belong to. Use [ShippingLineItem.getShippingPriceAdjustments()](dw.order.ShippingLineItem.md#getshippingpriceadjustments) to retrieve the shipping
      price adjustments associated with a specific shipping line item.


    **Returns:**
    - a collection of price adjustments that have been applied to the shipping costs of the shipment.


---

### getShippingStatus()
- getShippingStatus(): [EnumValue](dw.value.EnumValue.md)
  - : Returns the shipping status. Possible values are SHIPMENT\_NOTSHIPPED or SHIPMENT\_SHIPPED.

    **Returns:**
    - the shipping status. Possible values are SHIPMENT\_NOTSHIPPED or SHIPMENT\_SHIPPED.


---

### getShippingTotalGrossPrice()
- getShippingTotalGrossPrice(): [Money](dw.value.Money.md)
  - : Returns the sum of all shipping line items of the shipment, including tax, excluding shipping adjustments.

    **Returns:**
    - the sum of all shipping line items of the shipment, including tax, excluding shipping adjustments.


---

### getShippingTotalNetPrice()
- getShippingTotalNetPrice(): [Money](dw.value.Money.md)
  - : Returns the sum of all shipping line items of the shipment, excluding tax and adjustments.

    **Returns:**
    - the sum of all shipping line items of the shipment, excluding tax and adjustments.


---

### getShippingTotalPrice()
- getShippingTotalPrice(): [Money](dw.value.Money.md)
  - : Returns the shipping total price. If the line item container is based on net pricing the shipping total net price
      is returned. If the line item container is based on gross pricing the shipping total gross price is returned.


    **Returns:**
    - either the shipping total net or gross price


---

### getShippingTotalTax()
- getShippingTotalTax(): [Money](dw.value.Money.md)
  - : Returns the tax of all shipping line items of the shipment before shipping adjustments have been applied.

    **Returns:**
    - the tax of all shipping line items of the shipment before shipping adjustments have been applied.


---

### getStandardShippingLineItem()
- getStandardShippingLineItem(): [ShippingLineItem](dw.order.ShippingLineItem.md)
  - : Convenience method. Same as `getShippingLineItem(ShippingLineItem.STANDARD_SHIPPING_ID)`

    **Returns:**
    - The standard shipping line item, or null if it does not exist.


---

### getTotalGrossPrice()
- getTotalGrossPrice(): [Money](dw.value.Money.md)
  - : Returns the total gross price of the shipment in the purchase currency. The total gross price is the sum of
      product prices, service prices, adjustments, and tax.


    **Returns:**
    - the grand total price gross of tax for the shipment, in purchase currency.


---

### getTotalNetPrice()
- getTotalNetPrice(): [Money](dw.value.Money.md)
  - : Returns the total net price of the shipment in the purchase currency. The total net price is the sum of product
      prices, service prices, and adjustments, excluding tax.


    **Returns:**
    - the grand total price for the shipment net of tax, in purchase currency.


---

### getTotalTax()
- getTotalTax(): [Money](dw.value.Money.md)
  - : Returns the total tax for the shipment in the purchase currency.

    **Returns:**
    - the total tax for the shipment, in purchase currency.


---

### getTrackingNumber()
- getTrackingNumber(): [String](TopLevel.String.md)
  - : Returns the tracking number of this shipment.

    **Returns:**
    - the tracking number of this shipment.


---

### isDefault()
- isDefault(): [Boolean](TopLevel.Boolean.md)
  - : Return `true` if this shipment is the default shipment (shipment ID "me").

    **Returns:**
    - `true` if this shipment is the default shipment


---

### isGift()
- isGift(): [Boolean](TopLevel.Boolean.md)
  - : Returns true if this line item represents a gift, false otherwise.

    **Returns:**
    - true if this line item represents a gift, false otherwise.


---

### removeShippingLineItem(ShippingLineItem)
- removeShippingLineItem(shippingLineItem: [ShippingLineItem](dw.order.ShippingLineItem.md)): void
  - : Removes the specified shipping line item and any of its dependent shipping price adjustments.

    **Parameters:**
    - shippingLineItem - The shipping line item to be removed.


---

### removeShippingPriceAdjustment(PriceAdjustment)
- ~~removeShippingPriceAdjustment(priceAdjustment: [PriceAdjustment](dw.order.PriceAdjustment.md)): void~~
  - : Removes the specified shipping price adjustment from the shipment.

    **Parameters:**
    - priceAdjustment - The price adjustment line item to remove

    **Deprecated:**
:::warning
Deprecated in favor of
            [ShippingLineItem.removeShippingPriceAdjustment(PriceAdjustment)](dw.order.ShippingLineItem.md#removeshippingpriceadjustmentpriceadjustment) since shipping price
            adjustments belong to a specific shipping line item.

:::

---

### setGift(Boolean)
- setGift(isGift: [Boolean](TopLevel.Boolean.md)): void
  - : Controls if this line item is a gift or not.

    **Parameters:**
    - isGift - set to true if you want this line item to represent a gift.


---

### setGiftMessage(String)
- setGiftMessage(message: [String](TopLevel.String.md)): void
  - : Sets the value to set for the gift message.

    **Parameters:**
    - message - the value to set for the gift message.


---

### setShippingMethod(ShippingMethod)
- setShippingMethod(method: [ShippingMethod](dw.order.ShippingMethod.md)): void
  - : Set the specified shipping method for the specified shipment.

    **Parameters:**
    - method - the shipping method to use.


---

### setShippingStatus(Number)
- setShippingStatus(status: [Number](TopLevel.Number.md)): void
  - : Sets the shipping status of the shipment. 
      
      Possible values are [SHIPPING_STATUS_NOTSHIPPED](dw.order.Shipment.md#shipping_status_notshipped) or [SHIPPING_STATUS_SHIPPED](dw.order.Shipment.md#shipping_status_shipped).


    **Parameters:**
    - status - Shipment shipping status


---

### setTrackingNumber(String)
- setTrackingNumber(aValue: [String](TopLevel.String.md)): void
  - : Sets the tracking number of this shipment.

    **Parameters:**
    - aValue - the tracking number of this shipment.


---

<!-- prettier-ignore-end -->
