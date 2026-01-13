<!-- prettier-ignore-start -->
# Class Basket

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)
      - [dw.order.LineItemCtnr](dw.order.LineItemCtnr.md)
        - [dw.order.Basket](dw.order.Basket.md)

The Basket class represents a shopping cart.


## Property Summary

| Property | Description |
| --- | --- |
| [agentBasket](#agentbasket): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns if the basket was created by an agent. |
| [inventoryReservationExpiry](#inventoryreservationexpiry): [Date](TopLevel.Date.md) `(read-only)` | Returns the timestamp when the inventory for this basket expires. |
| [orderBeingEdited](#orderbeingedited): [Order](dw.order.Order.md) `(read-only)` | Returns the order that this basket represents if the basket is being used to edit an order, otherwise this method  returns null. |
| [orderNoBeingEdited](#ordernobeingedited): [String](TopLevel.String.md) `(read-only)` | Returns the number of the order that this basket represents if the basket is being used to edit an order,  otherwise this method returns null. |
| [taxRoundedAtGroup](#taxroundedatgroup): [Boolean](TopLevel.Boolean.md) `(read-only)` | Use this method to check if the Basket was calculated with grouped taxation calculation. |
| [temporary](#temporary): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns if the basket is temporary. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getInventoryReservationExpiry](dw.order.Basket.md#getinventoryreservationexpiry)() | Returns the timestamp when the inventory for this basket expires. |
| [getOrderBeingEdited](dw.order.Basket.md#getorderbeingedited)() | Returns the order that this basket represents if the basket is being used to edit an order, otherwise this method  returns null. |
| [getOrderNoBeingEdited](dw.order.Basket.md#getordernobeingedited)() | Returns the number of the order that this basket represents if the basket is being used to edit an order,  otherwise this method returns null. |
| [isAgentBasket](dw.order.Basket.md#isagentbasket)() | Returns if the basket was created by an agent. |
| [isTaxRoundedAtGroup](dw.order.Basket.md#istaxroundedatgroup)() | Use this method to check if the Basket was calculated with grouped taxation calculation. |
| [isTemporary](dw.order.Basket.md#istemporary)() | Returns if the basket is temporary. |
| [releaseInventory](dw.order.Basket.md#releaseinventory)() | <p>  Release all inventory previously reserved for this basket. |
| [reserveInventory](dw.order.Basket.md#reserveinventory)() | <p>  Reserves inventory for all items in this basket for 10 minutes. |
| [reserveInventory](dw.order.Basket.md#reserveinventorynumber)([Number](TopLevel.Number.md)) | <p>  Reserve inventory for all items in this basket for 10 minutes. |
| [reserveInventory](dw.order.Basket.md#reserveinventorynumber-boolean)([Number](TopLevel.Number.md), [Boolean](TopLevel.Boolean.md)) | <p>  Reserve inventory for all items in this basket for 10 minutes. |
| [setBusinessType](dw.order.Basket.md#setbusinesstypenumber)([Number](TopLevel.Number.md)) | Set the type of the business this order has been placed in.<br/>  Possible values are [LineItemCtnr.BUSINESS_TYPE_B2C](dw.order.LineItemCtnr.md#business_type_b2c) or [LineItemCtnr.BUSINESS_TYPE_B2B](dw.order.LineItemCtnr.md#business_type_b2b). |
| [setChannelType](dw.order.Basket.md#setchanneltypenumber)([Number](TopLevel.Number.md)) | Set the channel type in which sales channel this order has been created. |
| ~~[setCustomerNo](dw.order.Basket.md#setcustomernostring)([String](TopLevel.String.md))~~ | Sets the customer number of the customer associated with this container. |
| [startCheckout](dw.order.Basket.md#startcheckout)() | Register a "start checkout" event for the current basket. |
| [updateCurrency](dw.order.Basket.md#updatecurrency)() | Updates the basket currency if different to session currency, otherwise does nothing. |

### Methods inherited from class LineItemCtnr

[addNote](dw.order.LineItemCtnr.md#addnotestring-string), [createBillingAddress](dw.order.LineItemCtnr.md#createbillingaddress), [createBonusProductLineItem](dw.order.LineItemCtnr.md#createbonusproductlineitembonusdiscountlineitem-product-productoptionmodel-shipment), [createCouponLineItem](dw.order.LineItemCtnr.md#createcouponlineitemstring), [createCouponLineItem](dw.order.LineItemCtnr.md#createcouponlineitemstring-boolean), [createGiftCertificateLineItem](dw.order.LineItemCtnr.md#creategiftcertificatelineitemnumber-string), [createGiftCertificatePaymentInstrument](dw.order.LineItemCtnr.md#creategiftcertificatepaymentinstrumentstring-money), [createPaymentInstrument](dw.order.LineItemCtnr.md#createpaymentinstrumentstring-money), [createPaymentInstrumentFromWallet](dw.order.LineItemCtnr.md#createpaymentinstrumentfromwalletcustomerpaymentinstrument-money), [createPriceAdjustment](dw.order.LineItemCtnr.md#createpriceadjustmentstring), [createPriceAdjustment](dw.order.LineItemCtnr.md#createpriceadjustmentstring-discount), [createProductLineItem](dw.order.LineItemCtnr.md#createproductlineitemproduct-productoptionmodel-shipment), [createProductLineItem](dw.order.LineItemCtnr.md#createproductlineitemproductlistitem-shipment), [createProductLineItem](dw.order.LineItemCtnr.md#createproductlineitemstring-shipment), [createProductLineItem](dw.order.LineItemCtnr.md#createproductlineitemstring-quantity-shipment), [createShipment](dw.order.LineItemCtnr.md#createshipmentstring), [createShippingPriceAdjustment](dw.order.LineItemCtnr.md#createshippingpriceadjustmentstring), [getAdjustedMerchandizeTotalGrossPrice](dw.order.LineItemCtnr.md#getadjustedmerchandizetotalgrossprice), [getAdjustedMerchandizeTotalNetPrice](dw.order.LineItemCtnr.md#getadjustedmerchandizetotalnetprice), [getAdjustedMerchandizeTotalPrice](dw.order.LineItemCtnr.md#getadjustedmerchandizetotalprice), [getAdjustedMerchandizeTotalPrice](dw.order.LineItemCtnr.md#getadjustedmerchandizetotalpriceboolean), [getAdjustedMerchandizeTotalTax](dw.order.LineItemCtnr.md#getadjustedmerchandizetotaltax), [getAdjustedShippingTotalGrossPrice](dw.order.LineItemCtnr.md#getadjustedshippingtotalgrossprice), [getAdjustedShippingTotalNetPrice](dw.order.LineItemCtnr.md#getadjustedshippingtotalnetprice), [getAdjustedShippingTotalPrice](dw.order.LineItemCtnr.md#getadjustedshippingtotalprice), [getAdjustedShippingTotalTax](dw.order.LineItemCtnr.md#getadjustedshippingtotaltax), [getAllGiftCertificateLineItems](dw.order.LineItemCtnr.md#getallgiftcertificatelineitems), [getAllLineItems](dw.order.LineItemCtnr.md#getalllineitems), [getAllProductLineItems](dw.order.LineItemCtnr.md#getallproductlineitems), [getAllProductLineItems](dw.order.LineItemCtnr.md#getallproductlineitemsstring), [getAllProductQuantities](dw.order.LineItemCtnr.md#getallproductquantities), [getAllShippingPriceAdjustments](dw.order.LineItemCtnr.md#getallshippingpriceadjustments), [getBillingAddress](dw.order.LineItemCtnr.md#getbillingaddress), [getBonusDiscountLineItems](dw.order.LineItemCtnr.md#getbonusdiscountlineitems), [getBonusLineItems](dw.order.LineItemCtnr.md#getbonuslineitems), [getBusinessType](dw.order.LineItemCtnr.md#getbusinesstype), [getChannelType](dw.order.LineItemCtnr.md#getchanneltype), [getCouponLineItem](dw.order.LineItemCtnr.md#getcouponlineitemstring), [getCouponLineItems](dw.order.LineItemCtnr.md#getcouponlineitems), [getCurrencyCode](dw.order.LineItemCtnr.md#getcurrencycode), [getCustomer](dw.order.LineItemCtnr.md#getcustomer), [getCustomerEmail](dw.order.LineItemCtnr.md#getcustomeremail), [getCustomerName](dw.order.LineItemCtnr.md#getcustomername), [getCustomerNo](dw.order.LineItemCtnr.md#getcustomerno), [getDefaultShipment](dw.order.LineItemCtnr.md#getdefaultshipment), [getEtag](dw.order.LineItemCtnr.md#getetag), [getGiftCertificateLineItems](dw.order.LineItemCtnr.md#getgiftcertificatelineitems), [getGiftCertificateLineItems](dw.order.LineItemCtnr.md#getgiftcertificatelineitemsstring), [getGiftCertificatePaymentInstruments](dw.order.LineItemCtnr.md#getgiftcertificatepaymentinstruments), [getGiftCertificatePaymentInstruments](dw.order.LineItemCtnr.md#getgiftcertificatepaymentinstrumentsstring), [getGiftCertificateTotalGrossPrice](dw.order.LineItemCtnr.md#getgiftcertificatetotalgrossprice), [getGiftCertificateTotalNetPrice](dw.order.LineItemCtnr.md#getgiftcertificatetotalnetprice), [getGiftCertificateTotalPrice](dw.order.LineItemCtnr.md#getgiftcertificatetotalprice), [getGiftCertificateTotalTax](dw.order.LineItemCtnr.md#getgiftcertificatetotaltax), [getMerchandizeTotalGrossPrice](dw.order.LineItemCtnr.md#getmerchandizetotalgrossprice), [getMerchandizeTotalNetPrice](dw.order.LineItemCtnr.md#getmerchandizetotalnetprice), [getMerchandizeTotalPrice](dw.order.LineItemCtnr.md#getmerchandizetotalprice), [getMerchandizeTotalTax](dw.order.LineItemCtnr.md#getmerchandizetotaltax), [getNotes](dw.order.LineItemCtnr.md#getnotes), [getPaymentInstrument](dw.order.LineItemCtnr.md#getpaymentinstrument), [getPaymentInstruments](dw.order.LineItemCtnr.md#getpaymentinstruments), [getPaymentInstruments](dw.order.LineItemCtnr.md#getpaymentinstrumentsstring), [getPriceAdjustmentByPromotionID](dw.order.LineItemCtnr.md#getpriceadjustmentbypromotionidstring), [getPriceAdjustments](dw.order.LineItemCtnr.md#getpriceadjustments), [getProductLineItems](dw.order.LineItemCtnr.md#getproductlineitems), [getProductLineItems](dw.order.LineItemCtnr.md#getproductlineitemsstring), [getProductQuantities](dw.order.LineItemCtnr.md#getproductquantities), [getProductQuantities](dw.order.LineItemCtnr.md#getproductquantitiesboolean), [getProductQuantityTotal](dw.order.LineItemCtnr.md#getproductquantitytotal), [getShipment](dw.order.LineItemCtnr.md#getshipmentstring), [getShipments](dw.order.LineItemCtnr.md#getshipments), [getShippingPriceAdjustmentByPromotionID](dw.order.LineItemCtnr.md#getshippingpriceadjustmentbypromotionidstring), [getShippingPriceAdjustments](dw.order.LineItemCtnr.md#getshippingpriceadjustments), [getShippingTotalGrossPrice](dw.order.LineItemCtnr.md#getshippingtotalgrossprice), [getShippingTotalNetPrice](dw.order.LineItemCtnr.md#getshippingtotalnetprice), [getShippingTotalPrice](dw.order.LineItemCtnr.md#getshippingtotalprice), [getShippingTotalTax](dw.order.LineItemCtnr.md#getshippingtotaltax), [getTaxTotalsPerTaxRate](dw.order.LineItemCtnr.md#gettaxtotalspertaxrate), [getTotalGrossPrice](dw.order.LineItemCtnr.md#gettotalgrossprice), [getTotalNetPrice](dw.order.LineItemCtnr.md#gettotalnetprice), [getTotalTax](dw.order.LineItemCtnr.md#gettotaltax), [isExternallyTaxed](dw.order.LineItemCtnr.md#isexternallytaxed), [isTaxRoundedAtGroup](dw.order.LineItemCtnr.md#istaxroundedatgroup), [removeAllPaymentInstruments](dw.order.LineItemCtnr.md#removeallpaymentinstruments), [removeBonusDiscountLineItem](dw.order.LineItemCtnr.md#removebonusdiscountlineitembonusdiscountlineitem), [removeCouponLineItem](dw.order.LineItemCtnr.md#removecouponlineitemcouponlineitem), [removeGiftCertificateLineItem](dw.order.LineItemCtnr.md#removegiftcertificatelineitemgiftcertificatelineitem), [removeNote](dw.order.LineItemCtnr.md#removenotenote), [removePaymentInstrument](dw.order.LineItemCtnr.md#removepaymentinstrumentpaymentinstrument), [removePriceAdjustment](dw.order.LineItemCtnr.md#removepriceadjustmentpriceadjustment), [removeProductLineItem](dw.order.LineItemCtnr.md#removeproductlineitemproductlineitem), [removeShipment](dw.order.LineItemCtnr.md#removeshipmentshipment), [removeShippingPriceAdjustment](dw.order.LineItemCtnr.md#removeshippingpriceadjustmentpriceadjustment), [setCustomerEmail](dw.order.LineItemCtnr.md#setcustomeremailstring), [setCustomerName](dw.order.LineItemCtnr.md#setcustomernamestring), [updateOrderLevelPriceAdjustmentTax](dw.order.LineItemCtnr.md#updateorderlevelpriceadjustmenttax), [updateTotals](dw.order.LineItemCtnr.md#updatetotals), [verifyPriceAdjustmentLimits](dw.order.LineItemCtnr.md#verifypriceadjustmentlimits)
### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### agentBasket
- agentBasket: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns if the basket was created by an agent.
      
      
      An agent basket is created by an agent on behalf of the customer in comparison to a storefront basket which is
      created by the customer e.g. in the storefront. An agent basket can be created with
      [BasketMgr.createAgentBasket()](dw.order.BasketMgr.md#createagentbasket).



---

### inventoryReservationExpiry
- inventoryReservationExpiry: [Date](TopLevel.Date.md) `(read-only)`
  - : Returns the timestamp when the inventory for this basket expires.
      
      
      It will return `null` for the following reasons:
      
      - No reservation for the basket was done
      - Reservation is outdated meaning the timestamp is in the past
      
      
      
      
      
      Please note that the expiry timestamp will not always be valid for the whole basket. It will not be valid for
      new items added or items whose quantity has changed after the reservation was done.



---

### orderBeingEdited
- orderBeingEdited: [Order](dw.order.Order.md) `(read-only)`
  - : Returns the order that this basket represents if the basket is being used to edit an order, otherwise this method
      returns null. Baskets created via [BasketMgr.createBasketFromOrder(Order)](dw.order.BasketMgr.md#createbasketfromorderorder) will create a reference
      to the order that was used to create this basket (please check limitations around basket accessibility in
      [BasketMgr.createBasketFromOrder(Order)](dw.order.BasketMgr.md#createbasketfromorderorder)).



---

### orderNoBeingEdited
- orderNoBeingEdited: [String](TopLevel.String.md) `(read-only)`
  - : Returns the number of the order that this basket represents if the basket is being used to edit an order,
      otherwise this method returns null. Baskets created via [BasketMgr.createBasketFromOrder(Order)](dw.order.BasketMgr.md#createbasketfromorderorder)
      will create a reference to the order that was used to create this basket (please check limitations around basket
      accessibility in [BasketMgr.createBasketFromOrder(Order)](dw.order.BasketMgr.md#createbasketfromorderorder)).



---

### taxRoundedAtGroup
- taxRoundedAtGroup: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Use this method to check if the Basket was calculated with grouped taxation calculation.
      
      
      If the tax is rounded on group level, the tax is applied to the summed-up tax basis for each tax rate.



---

### temporary
- temporary: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns if the basket is temporary.
      
      
      Temporary baskets are separate from shopper storefront and agent baskets, and are intended for use to perform
      calculations or create an order without disturbing a shopper's open storefront basket. A temporary basket can be
      created with [BasketMgr.createTemporaryBasket()](dw.order.BasketMgr.md#createtemporarybasket).



---

## Method Details

### getInventoryReservationExpiry()
- getInventoryReservationExpiry(): [Date](TopLevel.Date.md)
  - : Returns the timestamp when the inventory for this basket expires.
      
      
      It will return `null` for the following reasons:
      
      - No reservation for the basket was done
      - Reservation is outdated meaning the timestamp is in the past
      
      
      
      
      
      Please note that the expiry timestamp will not always be valid for the whole basket. It will not be valid for
      new items added or items whose quantity has changed after the reservation was done.


    **Returns:**
    - the inventory reservation expiry timestamp or `null`


---

### getOrderBeingEdited()
- getOrderBeingEdited(): [Order](dw.order.Order.md)
  - : Returns the order that this basket represents if the basket is being used to edit an order, otherwise this method
      returns null. Baskets created via [BasketMgr.createBasketFromOrder(Order)](dw.order.BasketMgr.md#createbasketfromorderorder) will create a reference
      to the order that was used to create this basket (please check limitations around basket accessibility in
      [BasketMgr.createBasketFromOrder(Order)](dw.order.BasketMgr.md#createbasketfromorderorder)).


    **Returns:**
    - the order that this basket represents if the basket is being used to edit an order, otherwise this method
              returns null.



---

### getOrderNoBeingEdited()
- getOrderNoBeingEdited(): [String](TopLevel.String.md)
  - : Returns the number of the order that this basket represents if the basket is being used to edit an order,
      otherwise this method returns null. Baskets created via [BasketMgr.createBasketFromOrder(Order)](dw.order.BasketMgr.md#createbasketfromorderorder)
      will create a reference to the order that was used to create this basket (please check limitations around basket
      accessibility in [BasketMgr.createBasketFromOrder(Order)](dw.order.BasketMgr.md#createbasketfromorderorder)).


    **Returns:**
    - the number of the order that this basket represents if the basket is being used to edit an order,
              otherwise this method returns null.



---

### isAgentBasket()
- isAgentBasket(): [Boolean](TopLevel.Boolean.md)
  - : Returns if the basket was created by an agent.
      
      
      An agent basket is created by an agent on behalf of the customer in comparison to a storefront basket which is
      created by the customer e.g. in the storefront. An agent basket can be created with
      [BasketMgr.createAgentBasket()](dw.order.BasketMgr.md#createagentbasket).


    **Returns:**
    - `true` if the basket was created by an agent otherwise `false`


---

### isTaxRoundedAtGroup()
- isTaxRoundedAtGroup(): [Boolean](TopLevel.Boolean.md)
  - : Use this method to check if the Basket was calculated with grouped taxation calculation.
      
      
      If the tax is rounded on group level, the tax is applied to the summed-up tax basis for each tax rate.


    **Returns:**
    - `true` if the Basket was calculated with grouped taxation


---

### isTemporary()
- isTemporary(): [Boolean](TopLevel.Boolean.md)
  - : Returns if the basket is temporary.
      
      
      Temporary baskets are separate from shopper storefront and agent baskets, and are intended for use to perform
      calculations or create an order without disturbing a shopper's open storefront basket. A temporary basket can be
      created with [BasketMgr.createTemporaryBasket()](dw.order.BasketMgr.md#createtemporarybasket).


    **Returns:**
    - `true` if the basket is temporary otherwise `false`


---

### releaseInventory()
- releaseInventory(): [Status](dw.system.Status.md)
  - : 
      
      Release all inventory previously reserved for this basket. This is not needed for a normal workflow.
      You can call `dw.order.Basket.reserveInventory()` one time after every basket change.
      For performance and scaling reasons, avoid calling `dw.order.Basket.releaseInventory()`
      before `dw.order.Basket.reserveInventory()`. The `reserveInventory` function works in
      an optimized way to release inventory reservations that are no longer relevant.
      
      
      
      
      The method implements its own transaction handling. Calling the method from inside a transaction is disallowed
      and results in an exception being thrown. This behavior differs when calling the method from an **OCAPI
       hook**. OCAPI hooks handle transactions themselves, so in this case there is also no need to do any transaction
      handling, but to ensure the shortest possible locking of the inventory this method should only be called _as
       the last step_ in the OCAPI hook.


    **Returns:**
    - a Status instance with - Status.OK if release inventory was successful, otherwise Status.ERROR.


---

### reserveInventory()
- reserveInventory(): [Status](dw.system.Status.md)
  - : 
      
      Reserves inventory for all items in this basket for 10 minutes. Any reservations created by previous calls of
      this method are replaced.
      
      
      
      
      Sample workflow for subsequent basket reservations:
      
      
      
      
      1. Request: Add item to basket and reserve the basket.
      
      
      
      
      
      ```
         transaction.begin()
         basket.createProductLineItem("sku1",2,basket.defaultShipment)
         basket.commit()
         basket.reserveInventory()
         // The reservation {sku1:2} is complete.
      ```
      
      
      
      
      
      2. Request: Add item to basket.
      
      
      
      
      
      ```
         transaction.begin()
         basket.createProductLineItem("sku2",2,basket.defaultShipment)
         basket.commit()
         basket.reserveInventory()
         // The reservation {sku1:2, sku2:2} is complete. The previous reservation was overwritten.
      ```
      
      
      
      
      
      3. Request: Remove item from basket.
      
      
      
      
      
      ```
         transaction.begin()
         basket.removeProductLineItem(item1)
         basket.commit()
         basket.reserveInventory()
         // The reservation {sku2:2} is complete. The previous reservation was
         // overwritten and a quantity of 2 is released for sku1.
      ```
      
      
      
      
      
      The method can be used to reserve basket items before checkout to ensure that inventory is still available at the
      time an order is created from the basket using [OrderMgr.createOrder(Basket)](dw.order.OrderMgr.md#createorderbasket). If all or some
      basket items are not reserved before creating an order, [OrderMgr.createOrder(Basket)](dw.order.OrderMgr.md#createorderbasket) will
      validate item availability and will fail if any item is unavailable. Calling this method in the same request as
      [OrderMgr.createOrder(Basket)](dw.order.OrderMgr.md#createorderbasket) is unnecessary and discouraged for performance reasons.
      
      
      
      
      The maximum quantity that can be reserved at one time is equal to the ATS (Available To Sell) quantity. (See
      [ProductInventoryRecord.getATS()](dw.catalog.ProductInventoryRecord.md#getats).)
      
      
      
      
      When using B2C Commerce inventory, reserving basket inventory does not reduce ATS. In this case, converting the
      basket to an order reduces ATS by the reserved amount. For example, consider a product with an ATS quantity of 5
      and no reservations. If a basket reserves a quantity of 3, then other baskets still see an ATS of 5 but can only
      reserve a quantity of 2.
      
      
      
      
      When using Omnichannel Inventory, reserving basket inventory reduces ATS. In this case, converting the basket to
      an order doesn't reduce ATS. In the previous example, after the first basket reserved a quantity of 3, other
      baskets would see an ATS of 2.
      
      
      
      
      Reservations can only be made for products with an inventory record. The reservation of product bundles is
      controlled by the _Use Bundle Inventory Only_ setting on the inventory list. The setting allows inventory to
      be reserved for just the bundle or for the bundle and its bundled products.
      
      
      
      
      The following conditions must be met for the method to succeed:
      
      - an inventory list must be assigned to the current site
      - all products in the basket must exist, and must not be of type Master or ProductSet
      - each product line item must have a valid quantity
      - each product must have an inventory record, or the inventory list must define that products without inventory  record are available by default
      - the reservation must succeed for each item as described above.
      
      
      
      
      
      The method implements its own transaction handling. Calling the method from inside a transaction is disallowed
      and results in an exception being thrown. This behavior differs when calling the method from an **OCAPI
       hook**. OCAPI hooks handle transactions themselves, so in this case there is also no need to do any transaction
      handling, but to ensure the shortest possible locking of the inventory this method should only be called _as
       the last step_ in the OCAPI hook.
      
      
      
      
      If the reservation fails with an ERROR status, existing valid reservations for the basket will remain unchanged
      but no new reservations will be made. This might lead to a partially reserved basket.
      
      
      
      
      Behaves same as `reserveInventory( null, false );`.
      
      
      
      
      This method must not be used with
      
      - the **CreateOrder2**pipelet, or
      - [OrderMgr.createOrder(Basket)](dw.order.OrderMgr.md#createorderbasket), or
      - [OrderMgr.createOrder(Basket, String)](dw.order.OrderMgr.md#createorderbasket-string)
      
      in the same request.


    **Returns:**
    - a Status instance with - Status.OK if all items could be reserved, otherwise Status.ERROR meaning no
              items were reserved.



---

### reserveInventory(Number)
- reserveInventory(reservationDurationInMinutes: [Number](TopLevel.Number.md)): [Status](dw.system.Status.md)
  - : 
      
      Reserve inventory for all items in this basket for 10 minutes. Any reservations created by previous calls of
      this method are replaced.
      
      
      
      
      Sample workflow for subsequent basket reservations:
      
      
      
      
      1. Request: Add item to basket and reserve the basket.
      
      
      
      
      
      ```
         transaction.begin()
         basket.createProductLineItem("sku1",2,basket.defaultShipment)
         basket.commit()
         basket.reserveInventory()
         // The reservation {sku1:2} is complete.
      ```
      
      
      
      
      
      2. Request: Add item to basket.
      
      
      
      
      
      ```
         transaction.begin()
         basket.createProductLineItem("sku2",2,basket.defaultShipment)
         basket.commit()
         basket.reserveInventory()
         // The reservation {sku1:2, sku2:2} is complete. The previous reservation was overwritten.
      ```
      
      
      
      
      
      3. Request: Remove item from basket.
      
      
      
      
      
      ```
         transaction.begin()
         basket.removeProductLineItem(item1)
         basket.commit()
         basket.reserveInventory()
         // The reservation {sku2:2} is complete. The previous reservation was
         // overwritten and a quantity of 2 is released for sku1.
      ```
      
      
      
      
      
      The method can be used to reserve basket items before checkout to ensure that inventory is still available at the
      time an order is created from the basket using [OrderMgr.createOrder(Basket)](dw.order.OrderMgr.md#createorderbasket). If all or some
      basket items are not reserved before creating an order, [OrderMgr.createOrder(Basket)](dw.order.OrderMgr.md#createorderbasket) will
      validate item availability and will fail if any item is unavailable. Calling this method in the same request as
      [OrderMgr.createOrder(Basket)](dw.order.OrderMgr.md#createorderbasket) is unnecessary and discouraged for performance reasons.
      
      
      
      
      The maximum quantity that can be reserved at one time is equal to the ATS (Available To Sell) quantity. (See
      [ProductInventoryRecord.getATS()](dw.catalog.ProductInventoryRecord.md#getats).)
      
      
      
      
      When using B2C Commerce inventory, reserving basket inventory does not reduce ATS. In this case, converting the
      basket to an order reduces ATS by the reserved amount. For example, consider a product with an ATS quantity of 5
      and no reservations. If a basket reserves a quantity of 3, then other baskets still see an ATS of 5 but can only
      reserve a quantity of 2.
      
      
      
      
      When using Omnichannel Inventory, reserving basket inventory reduces ATS. In this case, converting the basket to
      an order doesn't reduce ATS. In the previous example, after the first basket reserved a quantity of 3, other
      baskets would see an ATS of 2.
      
      
      
      
      Reservations can only be made for products with an inventory record. The reservation of product bundles is
      controlled by the _Use Bundle Inventory Only_ setting on the inventory list. The setting allows inventory to
      be reserved for just the bundle or for the bundle and its bundled products.
      
      
      
      
      The following conditions must be met for the method to succeed:
      
      - an inventory list must be assigned to the current site
      - all products in the basket must exist, and must not be of type Master or ProductSet
      - each product line item must have a valid quantity
      - each product must have an inventory record, or the inventory list must define that products without inventory  record are available by default
      - the reservation must succeed for each item as described above.
      
      
      
      
      
      The method implements its own transaction handling. Calling the method from inside a transaction is disallowed
      and results in an exception being thrown. This behavior differs when calling the method from an **OCAPI
       hook**. OCAPI hooks handle transactions themselves, so in this case there is also no need to do any transaction
      handling, but to ensure the shortest possible locking of the inventory this method should only be called _as
       the last step_ in the OCAPI hook.
      
      
      
      
      [getInventoryReservationExpiry()](dw.order.Basket.md#getinventoryreservationexpiry) can be used to determine when the expiration will expire.
      
      
      
      
      If the reservation fails with an ERROR status, existing valid reservations for the basket will remain unchanged
      but no new reservations will be made. This might lead to a partially reserved basket.
      
      
      
      
      Behaves same as `reserveInventory( reservationDurationInMinutes, false );`.
      
      
      
      
      This method must not be used with
      
      - the **CreateOrder2**pipelet, or
      - [OrderMgr.createOrder(Basket)](dw.order.OrderMgr.md#createorderbasket), or
      - [OrderMgr.createOrder(Basket, String)](dw.order.OrderMgr.md#createorderbasket-string)
      
      in the same request.


    **Parameters:**
    - reservationDurationInMinutes - reservation duration in minutes, specifying how long the reservation will             last. The maximum value for the reservation duration is 240 minutes.

    **Returns:**
    - a Status instance with - Status.OK if all items could be reserved, otherwise Status.ERROR meaning no
              items were reserved.



---

### reserveInventory(Number, Boolean)
- reserveInventory(reservationDurationInMinutes: [Number](TopLevel.Number.md), removeIfNotAvailable: [Boolean](TopLevel.Boolean.md)): [Status](dw.system.Status.md)
  - : 
      
      Reserve inventory for all items in this basket for 10 minutes. Any reservations created by previous calls of
      this method are replaced.
      
      
      
      
      Sample workflow for subsequent basket reservations:
      
      
      
      
      1. Request: Add item to basket and reserve the basket.
      
      
      
      
      
      ```
         transaction.begin()
         basket.createProductLineItem("sku1",2,basket.defaultShipment)
         basket.commit()
         basket.reserveInventory()
         // The reservation {sku1:2} is complete
      ```
      
      
      
      
      
      2. Request: Add item to basket.
      
      
      
      
      
      ```
         transaction.begin()
         basket.createProductLineItem("sku2",2,basket.defaultShipment)
         basket.commit()
         basket.reserveInventory()
         // The reservation {sku1:2, sku2:2} is complete. The previous reservation was overwritten.
      ```
      
      
      
      
      
      3. Request: Remove item from basket.
      
      
      
      
      
      ```
         transaction.begin()
         basket.removeProductLineItem(item1)
         basket.commit()
         basket.reserveInventory()
         // The reservation {sku2:2} is complete. The previous reservation was
         // overwritten and a quantity of 2 is released for sku1.
      ```
      
      
      
      
      
      The method can be used to reserve basket items before checkout to ensure that inventory is still available at the
      time an order is created from the basket using [OrderMgr.createOrder(Basket)](dw.order.OrderMgr.md#createorderbasket). If all or some
      basket items are not reserved before creating an order, [OrderMgr.createOrder(Basket)](dw.order.OrderMgr.md#createorderbasket) will
      validate item availability and will fail if any item is unavailable. Calling this method in the same request as
      [OrderMgr.createOrder(Basket)](dw.order.OrderMgr.md#createorderbasket) is unnecessary and discouraged for performance reasons.
      
      
      
      
      The maximum quantity that can be reserved at one time is equal to the ATS (Available To Sell) quantity. (See
      [ProductInventoryRecord.getATS()](dw.catalog.ProductInventoryRecord.md#getats).)
      
      
      
      
      When using B2C Commerce inventory, reserving basket inventory does not reduce ATS. In this case, converting the
      basket to an order reduces ATS by the reserved amount. For example, consider a product with an ATS quantity of 5
      and no reservations. If a basket reserves a quantity of 3, then other baskets still see an ATS of 5 but can only
      reserve a quantity of 2.
      
      
      
      
      When using Omnichannel Inventory, reserving basket inventory reduces ATS. In this case, converting the basket to
      an order doesn't reduce ATS. In the previous example, after the first basket reserved a quantity of 3, other
      baskets would see an ATS of 2.
      
      
      
      
      Reservations can only be made for products with an inventory record. The reservation of product bundles is
      controlled by the _Use Bundle Inventory Only_ setting on the inventory list. The setting allows inventory to
      be reserved for just the bundle or for the bundle and its bundled products.
      
      
      
      
      The following conditions must be met for the method to succeed:
      
      - an inventory list must be assigned to the current site
      - all products in the basket must exist, and must not be of type Master or ProductSet
      - each product line item must have a valid quantity
      - each product must have an inventory record, or the inventory list must define that products without inventory  record are available by default
      - the reservation must succeed for each item as described above or `removeIfNotAvailable`is set to  `true`
      
      
      
      
      
      The method implements its own transaction handling. Calling the method from inside a transaction is disallowed
      and results in an exception being thrown. This behavior differs when calling the method from an **OCAPI
       hook**. OCAPI hooks handle transactions themselves, so in this case there is also no need to do any transaction
      handling, but to ensure the shortest possible locking of the inventory this method should only be called _as
       the last step_ in the OCAPI hook.
      
      
      
      
      [getInventoryReservationExpiry()](dw.order.Basket.md#getinventoryreservationexpiry) can be used to determine when the expiration will expire.
      
      
      
      
      If the reservation fails with an ERROR status, existing valid reservations for the basket will remain unchanged
      but no new reservations will be made. This might lead to a partially reserved basket.
      
      
      
      
      If the reservation succeeds with an OK status and `removeIfNotAvailable` is `true`, basket
      line items quantities might have been changed or line items might have been removed. The returned
      [Status](dw.system.Status.md) object will contain information about the changes. Possible values for
      [StatusItem.getCode()](dw.system.StatusItem.md#getcode) are:
      
      - BUNDLE\_REMOVED - a bundle item was removed completely
      - ITEM\_REMOVED - a product line item was removed completely
      - ITEM\_QUANTITY\_REDUCED - the quantity of a line item was reduced
      
      [StatusItem.getDetails()](dw.system.StatusItem.md#getdetails) will contain for each item the **sku** and **uuid** of the item
      which was changed/removed.
      
      
      
      
      This method must not be used with
      
      - the **CreateOrder2**pipelet, or
      - [OrderMgr.createOrder(Basket)](dw.order.OrderMgr.md#createorderbasket), or
      - [OrderMgr.createOrder(Basket, String)](dw.order.OrderMgr.md#createorderbasket-string)
      
      in the same request.


    **Parameters:**
    - reservationDurationInMinutes - reservation duration in minutes, specifying how long the reservation will             last. The maximum value for the reservation duration is 240 minutes.
    - removeIfNotAvailable - if `true` is specified it will not fail if not the full quantity of the             items can be reserved. Item quantity will be reduced to the quantity that could be reserved. Item will             be removed if not at least quantity 1 for the item could be reserved. Different to that if a bundle             line item cannot be reserved completely it will be removed including dependent line item (bundled             items).

    **Returns:**
    - a Status instance with - Status.OK meaning reservation process was successful. In case of
              `removeIfNotAvailable` is true, status might contain status items
              ([Status.getItems()](dw.system.Status.md#getitems)) for each item that needed to be changed or removed. In the worst
              case this could result in an empty basket and no items reserved. A Status instance with - Status.ERROR
              will be returned if `removeIfNotAvailable` is false and not all items could be reserved fully
              or any unexpected error occurred.



---

### setBusinessType(Number)
- setBusinessType(aType: [Number](TopLevel.Number.md)): void
  - : Set the type of the business this order has been placed in.
      
      Possible values are [LineItemCtnr.BUSINESS_TYPE_B2C](dw.order.LineItemCtnr.md#business_type_b2c) or [LineItemCtnr.BUSINESS_TYPE_B2B](dw.order.LineItemCtnr.md#business_type_b2b).


    **Parameters:**
    - aType - the business type to set for this basket


---

### setChannelType(Number)
- setChannelType(aType: [Number](TopLevel.Number.md)): void
  - : Set the channel type in which sales channel this order has been created. This can be used to distinguish order
      placed through e.g. Storefront, Call Center or Marketplace.
      
      Possible values are [LineItemCtnr.CHANNEL_TYPE_STOREFRONT](dw.order.LineItemCtnr.md#channel_type_storefront),
      [LineItemCtnr.CHANNEL_TYPE_CALLCENTER](dw.order.LineItemCtnr.md#channel_type_callcenter), [LineItemCtnr.CHANNEL_TYPE_MARKETPLACE](dw.order.LineItemCtnr.md#channel_type_marketplace),
      [LineItemCtnr.CHANNEL_TYPE_DSS](dw.order.LineItemCtnr.md#channel_type_dss), [LineItemCtnr.CHANNEL_TYPE_STORE](dw.order.LineItemCtnr.md#channel_type_store),
      [LineItemCtnr.CHANNEL_TYPE_PINTEREST](dw.order.LineItemCtnr.md#channel_type_pinterest), [LineItemCtnr.CHANNEL_TYPE_TWITTER](dw.order.LineItemCtnr.md#channel_type_twitter),
      [LineItemCtnr.CHANNEL_TYPE_FACEBOOKADS](dw.order.LineItemCtnr.md#channel_type_facebookads), [LineItemCtnr.CHANNEL_TYPE_SUBSCRIPTIONS](dw.order.LineItemCtnr.md#channel_type_subscriptions),
      [LineItemCtnr.CHANNEL_TYPE_ONLINERESERVATION](dw.order.LineItemCtnr.md#channel_type_onlinereservation),
      [LineItemCtnr.CHANNEL_TYPE_INSTAGRAMCOMMERCE](dw.order.LineItemCtnr.md#channel_type_instagramcommerce), [LineItemCtnr.CHANNEL_TYPE_GOOGLE](dw.order.LineItemCtnr.md#channel_type_google),
      [LineItemCtnr.CHANNEL_TYPE_YOUTUBE](dw.order.LineItemCtnr.md#channel_type_youtube), [LineItemCtnr.CHANNEL_TYPE_TIKTOK](dw.order.LineItemCtnr.md#channel_type_tiktok),
      [LineItemCtnr.CHANNEL_TYPE_SNAPCHAT](dw.order.LineItemCtnr.md#channel_type_snapchat), [LineItemCtnr.CHANNEL_TYPE_WHATSAPP](dw.order.LineItemCtnr.md#channel_type_whatsapp) The
      value for [LineItemCtnr.CHANNEL_TYPE_CUSTOMERSERVICECENTER](dw.order.LineItemCtnr.md#channel_type_customerservicecenter) is also available, but it can not be
      set by the scripting API, it is set only internally.


    **Parameters:**
    - aType - the channel type to set for this basket


---

### setCustomerNo(String)
- ~~setCustomerNo(customerNo: [String](TopLevel.String.md)): void~~
  - : Sets the customer number of the customer associated with this container.
      
      
      Note this method has little effect as it only sets the customer number and it does _not re-link the basket with
       a customer profile</> object, nor is the number copied into the [Order](dw.order.Order.md) should one be created from
       the basket. Use [Order.setCustomer(Customer)](dw.order.Order.md#setcustomercustomer) instead for a registered customer. For a
       guest customer the customerNo is usually generated during order creation and the attribute is set at order level.


    **Parameters:**
    - customerNo - the customer number of the customer associated with this container.

    **Deprecated:**
:::warning
The method has been deprecated. Please use [Order.setCustomer(Customer)](dw.order.Order.md#setcustomercustomer)
            instead for registered customer. For guest customer the customerNo is usually generated during order
            creation and the attribute is set at order level.

:::

---

### startCheckout()
- startCheckout(): void
  - : Register a "start checkout" event for the current basket. This event is tracked for AB test statistics
      but otherwise has no effect on the basket. The system will register at most one checkout per basket per session.



---

### updateCurrency()
- updateCurrency(): void
  - : Updates the basket currency if different to session currency, otherwise does nothing.
      
      
      Use [Session.setCurrency(Currency)](dw.system.Session.md#setcurrencycurrency) to set the currency for the session. To reflect the session
      currency change to the basket you need to update the basket with this method. This ensures that any upcoming
      basket recalculation, which is based on the session currency, matches the basket currency.
      
      
      
      
      ```
      ...
          if (basket.getBillingAddress().getCountryCode() == 'DE'){
            var newCurrency : Currency = Currency.getCurrency('EUR');
            session.setCurrency( newCurrency );
            basket.updateCurrency();
          }
          customBasketRecalculate();
      ...
      ```



---

<!-- prettier-ignore-end -->
