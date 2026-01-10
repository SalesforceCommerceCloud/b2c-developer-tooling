<!-- prettier-ignore-start -->
# Class LineItemCtnr

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)
      - [dw.order.LineItemCtnr](dw.order.LineItemCtnr.md)

A container for line items, such as ProductLineItems, CouponLineItems, GiftCertificateLineItems. This container also
provides access to shipments, shipping adjustments (promotions), and payment instruments (credit cards).


LineItemCtnr also contains a set of methods for creating line items and adjustments, and for accessing various price
values. There are three types of price-related methods:



- _Net-based_methods represent the amount of a category **before tax has been calculated**. For example,  the getMerchandizeTotalNetPrice() returns the price of all merchandise in the container whereas  getShippingTotalNetPrice() returns the price of all shipments in the container.
- _Tax-based_methods return the amount of tax on a category. For example, the getMerchandizeTotalTax()  returns the total tax for all merchandise and the getShippingTotalTax() returns the tax applied to all  shipments.
- _Gross-based_methods represent the amount of a category **after tax has been calculated**. For example,  the getMerchandizeTotalGrossPrice() returns the price of all merchandise in the container, including tax on the  merchandise, whereas getShippingTotalGrossPrice() returns the price of all shipments in the container, including tax  on the shipments in the container.

There are also a set of methods that provide access to 'adjusted' values. The adjusted-based methods return values
where promotions have been applied. For example, the getAdjustedMerchandizeTotalNetPrice() method returns the net
price of all merchandise after product-level and order-level promotions have been applied. Whereas the
getAdjustedMerchandizeTotalGrossPrice() method returns the price of all merchandise after product-level and
order-level promotions have been applied and includes the amount of merchandise-related tax.


Finally, there are a set of methods that return the aggregate values representing the line items in the container.
These are the total-based methods getTotalNetPrice(), getTotalTax() and getTotalGrossPrice(). These methods return
the totals of all items in the container and include any order-level promotions.


Note that all merchandise-related methods do not include 'gift certificates' values in the values they return. Gift
certificates are not considered merchandise as they do not represent a product.



## All Known Subclasses
[Basket](dw.order.Basket.md), [Order](dw.order.Order.md)
## Constant Summary

| Constant | Description |
| --- | --- |
| [BUSINESS_TYPE_B2B](#business_type_b2b): [Number](TopLevel.Number.md) = 2 | constant for Business Type B2B |
| [BUSINESS_TYPE_B2C](#business_type_b2c): [Number](TopLevel.Number.md) = 1 | constant for Business Type B2C |
| [CHANNEL_TYPE_CALLCENTER](#channel_type_callcenter): [Number](TopLevel.Number.md) = 2 | constant for Channel Type CallCenter |
| [CHANNEL_TYPE_CUSTOMERSERVICECENTER](#channel_type_customerservicecenter): [Number](TopLevel.Number.md) = 11 | constant for Channel Type Customer Service Center |
| [CHANNEL_TYPE_DSS](#channel_type_dss): [Number](TopLevel.Number.md) = 4 | constant for Channel Type DSS |
| [CHANNEL_TYPE_FACEBOOKADS](#channel_type_facebookads): [Number](TopLevel.Number.md) = 8 | constant for Channel Type Facebook Ads |
| [CHANNEL_TYPE_GOOGLE](#channel_type_google): [Number](TopLevel.Number.md) = 13 | constant for Channel Type Google |
| [CHANNEL_TYPE_INSTAGRAMCOMMERCE](#channel_type_instagramcommerce): [Number](TopLevel.Number.md) = 12 | constant for Channel Type Instagram Commerce |
| [CHANNEL_TYPE_MARKETPLACE](#channel_type_marketplace): [Number](TopLevel.Number.md) = 3 | constant for Channel Type Marketplace |
| [CHANNEL_TYPE_ONLINERESERVATION](#channel_type_onlinereservation): [Number](TopLevel.Number.md) = 10 | constant for Channel Type Online Reservation |
| [CHANNEL_TYPE_PINTEREST](#channel_type_pinterest): [Number](TopLevel.Number.md) = 6 | constant for Channel Type Pinterest |
| [CHANNEL_TYPE_SNAPCHAT](#channel_type_snapchat): [Number](TopLevel.Number.md) = 15 | constant for Channel Type Snapchat |
| [CHANNEL_TYPE_STORE](#channel_type_store): [Number](TopLevel.Number.md) = 5 | constant for Channel Type Store |
| [CHANNEL_TYPE_STOREFRONT](#channel_type_storefront): [Number](TopLevel.Number.md) = 1 | constant for Channel Type Storefront |
| [CHANNEL_TYPE_SUBSCRIPTIONS](#channel_type_subscriptions): [Number](TopLevel.Number.md) = 9 | constant for Channel Type Subscriptions |
| [CHANNEL_TYPE_TIKTOK](#channel_type_tiktok): [Number](TopLevel.Number.md) = 14 | constant for Channel Type TikTok |
| [CHANNEL_TYPE_TWITTER](#channel_type_twitter): [Number](TopLevel.Number.md) = 7 | constant for Channel Type Twitter |
| [CHANNEL_TYPE_WHATSAPP](#channel_type_whatsapp): [Number](TopLevel.Number.md) = 16 | constant for Channel Type WhatsApp |
| [CHANNEL_TYPE_YOUTUBE](#channel_type_youtube): [Number](TopLevel.Number.md) = 17 | constant for Channel Type YouTube |

## Property Summary

| Property | Description |
| --- | --- |
| [adjustedMerchandizeTotalGrossPrice](#adjustedmerchandizetotalgrossprice): [Money](dw.value.Money.md) `(read-only)` | Returns the adjusted total gross price (including tax) in purchase currency. |
| [adjustedMerchandizeTotalNetPrice](#adjustedmerchandizetotalnetprice): [Money](dw.value.Money.md) `(read-only)` | Returns the total net price (excluding tax) in purchase currency. |
| [adjustedMerchandizeTotalPrice](#adjustedmerchandizetotalprice): [Money](dw.value.Money.md) `(read-only)` | Returns the adjusted merchandize total price including product-level and order-level adjustments. |
| [adjustedMerchandizeTotalTax](#adjustedmerchandizetotaltax): [Money](dw.value.Money.md) `(read-only)` | Returns the subtotal tax in purchase currency. |
| [adjustedShippingTotalGrossPrice](#adjustedshippingtotalgrossprice): [Money](dw.value.Money.md) `(read-only)` | Returns the adjusted sum of all shipping line items of the line item container, including tax after shipping  adjustments have been applied. |
| [adjustedShippingTotalNetPrice](#adjustedshippingtotalnetprice): [Money](dw.value.Money.md) `(read-only)` | Returns the sum of all shipping line items of the line item container, excluding tax after shipping adjustments  have been applied. |
| [adjustedShippingTotalPrice](#adjustedshippingtotalprice): [Money](dw.value.Money.md) `(read-only)` | Returns the adjusted shipping total price. |
| [adjustedShippingTotalTax](#adjustedshippingtotaltax): [Money](dw.value.Money.md) `(read-only)` | Returns the tax of all shipping line items of the line item container after shipping adjustments have been  applied. |
| ~~[allGiftCertificateLineItems](#allgiftcertificatelineitems): [Collection](dw.util.Collection.md)~~ `(read-only)` | Returns all gift certificate line items of the container. |
| [allLineItems](#alllineitems): [Collection](dw.util.Collection.md) `(read-only)` | Returns all product, shipping, price adjustment, and gift certificate line items of the line item container. |
| [allProductLineItems](#allproductlineitems): [Collection](dw.util.Collection.md) `(read-only)` | Returns all product line items of the container, no matter if they are dependent or independent. |
| [allProductQuantities](#allproductquantities): [HashMap](dw.util.HashMap.md) `(read-only)` | Returns a hash mapping all products in the line item container to their total quantities. |
| [allShippingPriceAdjustments](#allshippingpriceadjustments): [Collection](dw.util.Collection.md) `(read-only)` | Returns the collection of all shipping price adjustments applied somewhere in the container. |
| [billingAddress](#billingaddress): [OrderAddress](dw.order.OrderAddress.md) `(read-only)` | Returns the billing address defined for the container. |
| [bonusDiscountLineItems](#bonusdiscountlineitems): [Collection](dw.util.Collection.md) `(read-only)` | Returns an unsorted collection of the the bonus discount line items associated with this container. |
| [bonusLineItems](#bonuslineitems): [Collection](dw.util.Collection.md) `(read-only)` | Returns the collection of product line items that are bonus items (where  [ProductLineItem.isBonusProductLineItem()](dw.order.ProductLineItem.md#isbonusproductlineitem) is true). |
| [businessType](#businesstype): [EnumValue](dw.value.EnumValue.md) `(read-only)` | Returns the type of the business this order has been placed in.<br/>  Possible values are [BUSINESS_TYPE_B2C](dw.order.LineItemCtnr.md#business_type_b2c) or [BUSINESS_TYPE_B2B](dw.order.LineItemCtnr.md#business_type_b2b). |
| [channelType](#channeltype): [EnumValue](dw.value.EnumValue.md) `(read-only)` | The channel type defines in which sales channel this order has been created. |
| [couponLineItems](#couponlineitems): [Collection](dw.util.Collection.md) `(read-only)` | Returns a sorted collection of the coupon line items in the container. |
| [currencyCode](#currencycode): [String](TopLevel.String.md) `(read-only)` | Returns the currency code for this line item container. |
| [customer](#customer): [Customer](dw.customer.Customer.md) `(read-only)` | Returns the customer associated with this container. |
| [customerEmail](#customeremail): [String](TopLevel.String.md) | Returns the email of the customer associated with this container. |
| [customerName](#customername): [String](TopLevel.String.md) | Returns the name of the customer associated with this container. |
| [customerNo](#customerno): [String](TopLevel.String.md) `(read-only)` | Returns the customer number of the customer associated with this container. |
| [defaultShipment](#defaultshipment): [Shipment](dw.order.Shipment.md) `(read-only)` | Returns the default shipment of the line item container. |
| [etag](#etag): [String](TopLevel.String.md) `(read-only)` | Returns the Etag of the line item container. |
| [externallyTaxed](#externallytaxed): [Boolean](TopLevel.Boolean.md) `(read-only)` | Use this method to check whether the LineItemCtnr is calculated based on external tax tables. |
| [giftCertificateLineItems](#giftcertificatelineitems): [Collection](dw.util.Collection.md) `(read-only)` | Returns all gift certificate line items of the container. |
| [giftCertificatePaymentInstruments](#giftcertificatepaymentinstruments): [Collection](dw.util.Collection.md) `(read-only)` | Returns an unsorted collection of the PaymentInstrument instances that represent GiftCertificates in this  container. |
| [giftCertificateTotalGrossPrice](#giftcertificatetotalgrossprice): [Money](dw.value.Money.md) `(read-only)` | Returns the total gross price of all gift certificates in the cart. |
| [giftCertificateTotalNetPrice](#giftcertificatetotalnetprice): [Money](dw.value.Money.md) `(read-only)` | Returns the total net price (excluding tax) of all gift certificates in the cart. |
| [giftCertificateTotalPrice](#giftcertificatetotalprice): [Money](dw.value.Money.md) `(read-only)` | Returns the gift certificate total price. |
| [giftCertificateTotalTax](#giftcertificatetotaltax): [Money](dw.value.Money.md) `(read-only)` | Returns the total tax of all gift certificates in the cart. |
| [merchandizeTotalGrossPrice](#merchandizetotalgrossprice): [Money](dw.value.Money.md) `(read-only)` | Returns the total gross price (including tax) in purchase currency. |
| [merchandizeTotalNetPrice](#merchandizetotalnetprice): [Money](dw.value.Money.md) `(read-only)` | Returns the total net price (excluding tax) in purchase currency. |
| [merchandizeTotalPrice](#merchandizetotalprice): [Money](dw.value.Money.md) `(read-only)` | Returns the merchandize total price. |
| [merchandizeTotalTax](#merchandizetotaltax): [Money](dw.value.Money.md) `(read-only)` | Returns the total tax in purchase currency. |
| [notes](#notes): [List](dw.util.List.md) `(read-only)` | Returns the list of notes for this object, ordered by creation time from oldest to newest. |
| ~~[paymentInstrument](#paymentinstrument): [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md)~~ `(read-only)` | Returns the payment instrument of the line item container or null. |
| [paymentInstruments](#paymentinstruments): [Collection](dw.util.Collection.md) `(read-only)` | Returns an unsorted collection of the payment instruments in this container. |
| [priceAdjustments](#priceadjustments): [Collection](dw.util.Collection.md) `(read-only)` | Returns the collection of price adjustments that have been applied to the totals such as promotion on the  purchase value (i.e. |
| [productLineItems](#productlineitems): [Collection](dw.util.Collection.md) `(read-only)` | Returns the product line items of the container that are not dependent on other product line items. |
| [productQuantities](#productquantities): [HashMap](dw.util.HashMap.md) `(read-only)` | Returns a hash map of all products in the line item container and their total quantities. |
| [productQuantityTotal](#productquantitytotal): [Number](TopLevel.Number.md) `(read-only)` | Returns the total quantity of all product line items. |
| [shipments](#shipments): [Collection](dw.util.Collection.md) `(read-only)` | Returns all shipments of the line item container.<br/>  The first shipment in the returned collection is the default shipment (shipment ID always set to "me"). |
| [shippingPriceAdjustments](#shippingpriceadjustments): [Collection](dw.util.Collection.md) `(read-only)` | Returns the of shipping price adjustments applied to the shipping total of the container. |
| [shippingTotalGrossPrice](#shippingtotalgrossprice): [Money](dw.value.Money.md) `(read-only)` | Returns the sum of all shipping line items of the line item container, including tax before shipping adjustments  have been applied. |
| [shippingTotalNetPrice](#shippingtotalnetprice): [Money](dw.value.Money.md) `(read-only)` | Returns the sum of all shipping line items of the line item container, excluding tax before shipping adjustments  have been applied. |
| [shippingTotalPrice](#shippingtotalprice): [Money](dw.value.Money.md) `(read-only)` | Returns the shipping total price. |
| [shippingTotalTax](#shippingtotaltax): [Money](dw.value.Money.md) `(read-only)` | Returns the tax of all shipping line items of the line item container before shipping adjustments have been  applied. |
| [taxRoundedAtGroup](#taxroundedatgroup): [Boolean](TopLevel.Boolean.md) `(read-only)` | Use this method to check if the LineItemCtnr was calculated with grouped taxation calculation. |
| [taxTotalsPerTaxRate](#taxtotalspertaxrate): [SortedMap](dw.util.SortedMap.md) `(read-only)` | This method returns a [SortedMap](dw.util.SortedMap.md) in which the keys are [Decimal](dw.util.Decimal.md) tax rates and the values  are [Money](dw.value.Money.md) total tax for the tax rate. |
| [totalGrossPrice](#totalgrossprice): [Money](dw.value.Money.md) `(read-only)` | Returns the grand total price gross of tax for LineItemCtnr, in purchase currency. |
| [totalNetPrice](#totalnetprice): [Money](dw.value.Money.md) `(read-only)` | Returns the grand total price for LineItemCtnr net of tax, in purchase currency. |
| [totalTax](#totaltax): [Money](dw.value.Money.md) `(read-only)` | Returns the grand total tax for LineItemCtnr, in purchase currency. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [addNote](dw.order.LineItemCtnr.md#addnotestring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Adds a note to the object. |
| [createBillingAddress](dw.order.LineItemCtnr.md#createbillingaddress)() | Create a billing address for the LineItemCtnr. |
| [createBonusProductLineItem](dw.order.LineItemCtnr.md#createbonusproductlineitembonusdiscountlineitem-product-productoptionmodel-shipment)([BonusDiscountLineItem](dw.order.BonusDiscountLineItem.md), [Product](dw.catalog.Product.md), [ProductOptionModel](dw.catalog.ProductOptionModel.md), [Shipment](dw.order.Shipment.md)) | Creates a product line item in the container based on the passed Product and BonusDiscountLineItem. |
| [createCouponLineItem](dw.order.LineItemCtnr.md#createcouponlineitemstring)([String](TopLevel.String.md)) | Creates a coupon line item that is not based on the B2C Commerce campaign system and associates it with the  specified coupon code. |
| [createCouponLineItem](dw.order.LineItemCtnr.md#createcouponlineitemstring-boolean)([String](TopLevel.String.md), [Boolean](TopLevel.Boolean.md)) | Creates a new CouponLineItem for this container based on the supplied coupon code. |
| [createGiftCertificateLineItem](dw.order.LineItemCtnr.md#creategiftcertificatelineitemnumber-string)([Number](TopLevel.Number.md), [String](TopLevel.String.md)) | Creates a gift certificate line item. |
| [createGiftCertificatePaymentInstrument](dw.order.LineItemCtnr.md#creategiftcertificatepaymentinstrumentstring-money)([String](TopLevel.String.md), [Money](dw.value.Money.md)) | Creates an OrderPaymentInstrument representing a Gift Certificate. |
| [createPaymentInstrument](dw.order.LineItemCtnr.md#createpaymentinstrumentstring-money)([String](TopLevel.String.md), [Money](dw.value.Money.md)) | Creates a payment instrument using the specified payment method id and amount. |
| [createPaymentInstrumentFromWallet](dw.order.LineItemCtnr.md#createpaymentinstrumentfromwalletcustomerpaymentinstrument-money)([CustomerPaymentInstrument](dw.customer.CustomerPaymentInstrument.md), [Money](dw.value.Money.md)) | Creates a payment instrument using the specified wallet payment instrument and amount. |
| [createPriceAdjustment](dw.order.LineItemCtnr.md#createpriceadjustmentstring)([String](TopLevel.String.md)) | Creates an order price adjustment.<br/>  The promotion id is mandatory and must not be the ID of any actual promotion defined in B2C Commerce; otherwise  an exception is thrown. |
| [createPriceAdjustment](dw.order.LineItemCtnr.md#createpriceadjustmentstring-discount)([String](TopLevel.String.md), [Discount](dw.campaign.Discount.md)) | Creates an order level price adjustment for a specific discount.<br/>  The promotion id is mandatory and must not be the ID of any actual promotion defined in B2C Commerce; otherwise  an exception is thrown. |
| [createProductLineItem](dw.order.LineItemCtnr.md#createproductlineitemproduct-productoptionmodel-shipment)([Product](dw.catalog.Product.md), [ProductOptionModel](dw.catalog.ProductOptionModel.md), [Shipment](dw.order.Shipment.md)) | Creates a new product line item in the container and assigns it to the specified shipment. |
| [createProductLineItem](dw.order.LineItemCtnr.md#createproductlineitemproductlistitem-shipment)([ProductListItem](dw.customer.ProductListItem.md), [Shipment](dw.order.Shipment.md)) | Creates a new product line item in the basket and assigns it to the specified shipment. |
| [createProductLineItem](dw.order.LineItemCtnr.md#createproductlineitemstring-shipment)([String](TopLevel.String.md), [Shipment](dw.order.Shipment.md)) | Creates a new product line item in the container and assigns it to the specified shipment. |
| ~~[createProductLineItem](dw.order.LineItemCtnr.md#createproductlineitemstring-quantity-shipment)([String](TopLevel.String.md), [Quantity](dw.value.Quantity.md), [Shipment](dw.order.Shipment.md))~~ | Creates a new product line item in the container and assigns it to the specified shipment. |
| [createShipment](dw.order.LineItemCtnr.md#createshipmentstring)([String](TopLevel.String.md)) | Creates a standard shipment for the line item container. |
| [createShippingPriceAdjustment](dw.order.LineItemCtnr.md#createshippingpriceadjustmentstring)([String](TopLevel.String.md)) | Creates a shipping price adjustment to be applied to the container. |
| [getAdjustedMerchandizeTotalGrossPrice](dw.order.LineItemCtnr.md#getadjustedmerchandizetotalgrossprice)() | Returns the adjusted total gross price (including tax) in purchase currency. |
| [getAdjustedMerchandizeTotalNetPrice](dw.order.LineItemCtnr.md#getadjustedmerchandizetotalnetprice)() | Returns the total net price (excluding tax) in purchase currency. |
| [getAdjustedMerchandizeTotalPrice](dw.order.LineItemCtnr.md#getadjustedmerchandizetotalprice)() | Returns the adjusted merchandize total price including product-level and order-level adjustments. |
| [getAdjustedMerchandizeTotalPrice](dw.order.LineItemCtnr.md#getadjustedmerchandizetotalpriceboolean)([Boolean](TopLevel.Boolean.md)) | Returns the adjusted merchandize total price including order-level adjustments if requested. |
| [getAdjustedMerchandizeTotalTax](dw.order.LineItemCtnr.md#getadjustedmerchandizetotaltax)() | Returns the subtotal tax in purchase currency. |
| [getAdjustedShippingTotalGrossPrice](dw.order.LineItemCtnr.md#getadjustedshippingtotalgrossprice)() | Returns the adjusted sum of all shipping line items of the line item container, including tax after shipping  adjustments have been applied. |
| [getAdjustedShippingTotalNetPrice](dw.order.LineItemCtnr.md#getadjustedshippingtotalnetprice)() | Returns the sum of all shipping line items of the line item container, excluding tax after shipping adjustments  have been applied. |
| [getAdjustedShippingTotalPrice](dw.order.LineItemCtnr.md#getadjustedshippingtotalprice)() | Returns the adjusted shipping total price. |
| [getAdjustedShippingTotalTax](dw.order.LineItemCtnr.md#getadjustedshippingtotaltax)() | Returns the tax of all shipping line items of the line item container after shipping adjustments have been  applied. |
| ~~[getAllGiftCertificateLineItems](dw.order.LineItemCtnr.md#getallgiftcertificatelineitems)()~~ | Returns all gift certificate line items of the container. |
| [getAllLineItems](dw.order.LineItemCtnr.md#getalllineitems)() | Returns all product, shipping, price adjustment, and gift certificate line items of the line item container. |
| [getAllProductLineItems](dw.order.LineItemCtnr.md#getallproductlineitems)() | Returns all product line items of the container, no matter if they are dependent or independent. |
| [getAllProductLineItems](dw.order.LineItemCtnr.md#getallproductlineitemsstring)([String](TopLevel.String.md)) | Returns all product line items of the container that have a product ID equal to the specified product ID, no  matter if they are dependent or independent. |
| [getAllProductQuantities](dw.order.LineItemCtnr.md#getallproductquantities)() | Returns a hash mapping all products in the line item container to their total quantities. |
| [getAllShippingPriceAdjustments](dw.order.LineItemCtnr.md#getallshippingpriceadjustments)() | Returns the collection of all shipping price adjustments applied somewhere in the container. |
| [getBillingAddress](dw.order.LineItemCtnr.md#getbillingaddress)() | Returns the billing address defined for the container. |
| [getBonusDiscountLineItems](dw.order.LineItemCtnr.md#getbonusdiscountlineitems)() | Returns an unsorted collection of the the bonus discount line items associated with this container. |
| [getBonusLineItems](dw.order.LineItemCtnr.md#getbonuslineitems)() | Returns the collection of product line items that are bonus items (where  [ProductLineItem.isBonusProductLineItem()](dw.order.ProductLineItem.md#isbonusproductlineitem) is true). |
| [getBusinessType](dw.order.LineItemCtnr.md#getbusinesstype)() | Returns the type of the business this order has been placed in.<br/>  Possible values are [BUSINESS_TYPE_B2C](dw.order.LineItemCtnr.md#business_type_b2c) or [BUSINESS_TYPE_B2B](dw.order.LineItemCtnr.md#business_type_b2b). |
| [getChannelType](dw.order.LineItemCtnr.md#getchanneltype)() | The channel type defines in which sales channel this order has been created. |
| [getCouponLineItem](dw.order.LineItemCtnr.md#getcouponlineitemstring)([String](TopLevel.String.md)) | Returns the coupon line item representing the specified coupon code. |
| [getCouponLineItems](dw.order.LineItemCtnr.md#getcouponlineitems)() | Returns a sorted collection of the coupon line items in the container. |
| [getCurrencyCode](dw.order.LineItemCtnr.md#getcurrencycode)() | Returns the currency code for this line item container. |
| [getCustomer](dw.order.LineItemCtnr.md#getcustomer)() | Returns the customer associated with this container. |
| [getCustomerEmail](dw.order.LineItemCtnr.md#getcustomeremail)() | Returns the email of the customer associated with this container. |
| [getCustomerName](dw.order.LineItemCtnr.md#getcustomername)() | Returns the name of the customer associated with this container. |
| [getCustomerNo](dw.order.LineItemCtnr.md#getcustomerno)() | Returns the customer number of the customer associated with this container. |
| [getDefaultShipment](dw.order.LineItemCtnr.md#getdefaultshipment)() | Returns the default shipment of the line item container. |
| [getEtag](dw.order.LineItemCtnr.md#getetag)() | Returns the Etag of the line item container. |
| [getGiftCertificateLineItems](dw.order.LineItemCtnr.md#getgiftcertificatelineitems)() | Returns all gift certificate line items of the container. |
| [getGiftCertificateLineItems](dw.order.LineItemCtnr.md#getgiftcertificatelineitemsstring)([String](TopLevel.String.md)) | Returns all gift certificate line items of the container, no matter if they are dependent or independent. |
| [getGiftCertificatePaymentInstruments](dw.order.LineItemCtnr.md#getgiftcertificatepaymentinstruments)() | Returns an unsorted collection of the PaymentInstrument instances that represent GiftCertificates in this  container. |
| [getGiftCertificatePaymentInstruments](dw.order.LineItemCtnr.md#getgiftcertificatepaymentinstrumentsstring)([String](TopLevel.String.md)) | Returns an unsorted collection containing all PaymentInstruments of type  PaymentInstrument.METHOD\_GIFT\_CERTIFICATE where the specified code is the same code on the payment instrument. |
| [getGiftCertificateTotalGrossPrice](dw.order.LineItemCtnr.md#getgiftcertificatetotalgrossprice)() | Returns the total gross price of all gift certificates in the cart. |
| [getGiftCertificateTotalNetPrice](dw.order.LineItemCtnr.md#getgiftcertificatetotalnetprice)() | Returns the total net price (excluding tax) of all gift certificates in the cart. |
| [getGiftCertificateTotalPrice](dw.order.LineItemCtnr.md#getgiftcertificatetotalprice)() | Returns the gift certificate total price. |
| [getGiftCertificateTotalTax](dw.order.LineItemCtnr.md#getgiftcertificatetotaltax)() | Returns the total tax of all gift certificates in the cart. |
| [getMerchandizeTotalGrossPrice](dw.order.LineItemCtnr.md#getmerchandizetotalgrossprice)() | Returns the total gross price (including tax) in purchase currency. |
| [getMerchandizeTotalNetPrice](dw.order.LineItemCtnr.md#getmerchandizetotalnetprice)() | Returns the total net price (excluding tax) in purchase currency. |
| [getMerchandizeTotalPrice](dw.order.LineItemCtnr.md#getmerchandizetotalprice)() | Returns the merchandize total price. |
| [getMerchandizeTotalTax](dw.order.LineItemCtnr.md#getmerchandizetotaltax)() | Returns the total tax in purchase currency. |
| [getNotes](dw.order.LineItemCtnr.md#getnotes)() | Returns the list of notes for this object, ordered by creation time from oldest to newest. |
| ~~[getPaymentInstrument](dw.order.LineItemCtnr.md#getpaymentinstrument)()~~ | Returns the payment instrument of the line item container or null. |
| [getPaymentInstruments](dw.order.LineItemCtnr.md#getpaymentinstruments)() | Returns an unsorted collection of the payment instruments in this container. |
| [getPaymentInstruments](dw.order.LineItemCtnr.md#getpaymentinstrumentsstring)([String](TopLevel.String.md)) | Returns an unsorted collection of PaymentInstrument instances based on the specified payment method ID. |
| [getPriceAdjustmentByPromotionID](dw.order.LineItemCtnr.md#getpriceadjustmentbypromotionidstring)([String](TopLevel.String.md)) | Returns the price adjustment associated to the specified promotion ID. |
| [getPriceAdjustments](dw.order.LineItemCtnr.md#getpriceadjustments)() | Returns the collection of price adjustments that have been applied to the totals such as promotion on the  purchase value (i.e. |
| [getProductLineItems](dw.order.LineItemCtnr.md#getproductlineitems)() | Returns the product line items of the container that are not dependent on other product line items. |
| [getProductLineItems](dw.order.LineItemCtnr.md#getproductlineitemsstring)([String](TopLevel.String.md)) | Returns the product line items of the container that have a product ID equal to the specified product ID and that  are not dependent on other product line items. |
| [getProductQuantities](dw.order.LineItemCtnr.md#getproductquantities)() | Returns a hash map of all products in the line item container and their total quantities. |
| [getProductQuantities](dw.order.LineItemCtnr.md#getproductquantitiesboolean)([Boolean](TopLevel.Boolean.md)) | Returns a hash map of all products in the line item container and their total quantities. |
| [getProductQuantityTotal](dw.order.LineItemCtnr.md#getproductquantitytotal)() | Returns the total quantity of all product line items. |
| [getShipment](dw.order.LineItemCtnr.md#getshipmentstring)([String](TopLevel.String.md)) | Returns the shipment for the specified ID or `null` if no shipment with this ID exists in the line  item container. |
| [getShipments](dw.order.LineItemCtnr.md#getshipments)() | Returns all shipments of the line item container.<br/>  The first shipment in the returned collection is the default shipment (shipment ID always set to "me"). |
| [getShippingPriceAdjustmentByPromotionID](dw.order.LineItemCtnr.md#getshippingpriceadjustmentbypromotionidstring)([String](TopLevel.String.md)) | Returns the shipping price adjustment associated with the specified promotion ID. |
| [getShippingPriceAdjustments](dw.order.LineItemCtnr.md#getshippingpriceadjustments)() | Returns the of shipping price adjustments applied to the shipping total of the container. |
| [getShippingTotalGrossPrice](dw.order.LineItemCtnr.md#getshippingtotalgrossprice)() | Returns the sum of all shipping line items of the line item container, including tax before shipping adjustments  have been applied. |
| [getShippingTotalNetPrice](dw.order.LineItemCtnr.md#getshippingtotalnetprice)() | Returns the sum of all shipping line items of the line item container, excluding tax before shipping adjustments  have been applied. |
| [getShippingTotalPrice](dw.order.LineItemCtnr.md#getshippingtotalprice)() | Returns the shipping total price. |
| [getShippingTotalTax](dw.order.LineItemCtnr.md#getshippingtotaltax)() | Returns the tax of all shipping line items of the line item container before shipping adjustments have been  applied. |
| [getTaxTotalsPerTaxRate](dw.order.LineItemCtnr.md#gettaxtotalspertaxrate)() | This method returns a [SortedMap](dw.util.SortedMap.md) in which the keys are [Decimal](dw.util.Decimal.md) tax rates and the values  are [Money](dw.value.Money.md) total tax for the tax rate. |
| [getTotalGrossPrice](dw.order.LineItemCtnr.md#gettotalgrossprice)() | Returns the grand total price gross of tax for LineItemCtnr, in purchase currency. |
| [getTotalNetPrice](dw.order.LineItemCtnr.md#gettotalnetprice)() | Returns the grand total price for LineItemCtnr net of tax, in purchase currency. |
| [getTotalTax](dw.order.LineItemCtnr.md#gettotaltax)() | Returns the grand total tax for LineItemCtnr, in purchase currency. |
| [isExternallyTaxed](dw.order.LineItemCtnr.md#isexternallytaxed)() | Use this method to check whether the LineItemCtnr is calculated based on external tax tables. |
| [isTaxRoundedAtGroup](dw.order.LineItemCtnr.md#istaxroundedatgroup)() | Use this method to check if the LineItemCtnr was calculated with grouped taxation calculation. |
| [removeAllPaymentInstruments](dw.order.LineItemCtnr.md#removeallpaymentinstruments)() | Removes the all Payment Instruments from this container and deletes the Payment Instruments. |
| [removeBonusDiscountLineItem](dw.order.LineItemCtnr.md#removebonusdiscountlineitembonusdiscountlineitem)([BonusDiscountLineItem](dw.order.BonusDiscountLineItem.md)) | Removes the specified bonus discount line item from the line item container. |
| [removeCouponLineItem](dw.order.LineItemCtnr.md#removecouponlineitemcouponlineitem)([CouponLineItem](dw.order.CouponLineItem.md)) | Removes the specified coupon line item from the line item container. |
| [removeGiftCertificateLineItem](dw.order.LineItemCtnr.md#removegiftcertificatelineitemgiftcertificatelineitem)([GiftCertificateLineItem](dw.order.GiftCertificateLineItem.md)) | Removes the specified gift certificate line item from the line item container. |
| [removeNote](dw.order.LineItemCtnr.md#removenotenote)([Note](dw.object.Note.md)) | Removes a note from this line item container and deletes it. |
| [removePaymentInstrument](dw.order.LineItemCtnr.md#removepaymentinstrumentpaymentinstrument)([PaymentInstrument](dw.order.PaymentInstrument.md)) | Removes the specified Payment Instrument from this container and deletes the Payment Instrument. |
| [removePriceAdjustment](dw.order.LineItemCtnr.md#removepriceadjustmentpriceadjustment)([PriceAdjustment](dw.order.PriceAdjustment.md)) | Removes the specified price adjustment line item from the line item container. |
| [removeProductLineItem](dw.order.LineItemCtnr.md#removeproductlineitemproductlineitem)([ProductLineItem](dw.order.ProductLineItem.md)) | Removes the specified product line item from the line item container. |
| [removeShipment](dw.order.LineItemCtnr.md#removeshipmentshipment)([Shipment](dw.order.Shipment.md)) | Removes the specified shipment and all associated product, gift certificate, shipping and price adjustment line  items from the line item container. |
| [removeShippingPriceAdjustment](dw.order.LineItemCtnr.md#removeshippingpriceadjustmentpriceadjustment)([PriceAdjustment](dw.order.PriceAdjustment.md)) | Removes the specified shipping price adjustment line item from the line item container. |
| [setCustomerEmail](dw.order.LineItemCtnr.md#setcustomeremailstring)([String](TopLevel.String.md)) | Sets the email address of the customer associated with this container. |
| [setCustomerName](dw.order.LineItemCtnr.md#setcustomernamestring)([String](TopLevel.String.md)) | Sets the name of the customer associated with this container. |
| [updateOrderLevelPriceAdjustmentTax](dw.order.LineItemCtnr.md#updateorderlevelpriceadjustmenttax)() | Calculates the tax for all shipping and order-level merchandise price adjustments in this LineItemCtnr. |
| [updateTotals](dw.order.LineItemCtnr.md#updatetotals)() | Recalculates the totals of the line item container. |
| [verifyPriceAdjustmentLimits](dw.order.LineItemCtnr.md#verifypriceadjustmentlimits)() | Verifies whether the manual price adjustments made for the line item container exceed the corresponding limits  for the current user and the current site. |

### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### BUSINESS_TYPE_B2B

- BUSINESS_TYPE_B2B: [Number](TopLevel.Number.md) = 2
  - : constant for Business Type B2B


---

### BUSINESS_TYPE_B2C

- BUSINESS_TYPE_B2C: [Number](TopLevel.Number.md) = 1
  - : constant for Business Type B2C


---

### CHANNEL_TYPE_CALLCENTER

- CHANNEL_TYPE_CALLCENTER: [Number](TopLevel.Number.md) = 2
  - : constant for Channel Type CallCenter


---

### CHANNEL_TYPE_CUSTOMERSERVICECENTER

- CHANNEL_TYPE_CUSTOMERSERVICECENTER: [Number](TopLevel.Number.md) = 11
  - : constant for Channel Type Customer Service Center


---

### CHANNEL_TYPE_DSS

- CHANNEL_TYPE_DSS: [Number](TopLevel.Number.md) = 4
  - : constant for Channel Type DSS


---

### CHANNEL_TYPE_FACEBOOKADS

- CHANNEL_TYPE_FACEBOOKADS: [Number](TopLevel.Number.md) = 8
  - : constant for Channel Type Facebook Ads


---

### CHANNEL_TYPE_GOOGLE

- CHANNEL_TYPE_GOOGLE: [Number](TopLevel.Number.md) = 13
  - : constant for Channel Type Google


---

### CHANNEL_TYPE_INSTAGRAMCOMMERCE

- CHANNEL_TYPE_INSTAGRAMCOMMERCE: [Number](TopLevel.Number.md) = 12
  - : constant for Channel Type Instagram Commerce


---

### CHANNEL_TYPE_MARKETPLACE

- CHANNEL_TYPE_MARKETPLACE: [Number](TopLevel.Number.md) = 3
  - : constant for Channel Type Marketplace


---

### CHANNEL_TYPE_ONLINERESERVATION

- CHANNEL_TYPE_ONLINERESERVATION: [Number](TopLevel.Number.md) = 10
  - : constant for Channel Type Online Reservation


---

### CHANNEL_TYPE_PINTEREST

- CHANNEL_TYPE_PINTEREST: [Number](TopLevel.Number.md) = 6
  - : constant for Channel Type Pinterest


---

### CHANNEL_TYPE_SNAPCHAT

- CHANNEL_TYPE_SNAPCHAT: [Number](TopLevel.Number.md) = 15
  - : constant for Channel Type Snapchat


---

### CHANNEL_TYPE_STORE

- CHANNEL_TYPE_STORE: [Number](TopLevel.Number.md) = 5
  - : constant for Channel Type Store


---

### CHANNEL_TYPE_STOREFRONT

- CHANNEL_TYPE_STOREFRONT: [Number](TopLevel.Number.md) = 1
  - : constant for Channel Type Storefront


---

### CHANNEL_TYPE_SUBSCRIPTIONS

- CHANNEL_TYPE_SUBSCRIPTIONS: [Number](TopLevel.Number.md) = 9
  - : constant for Channel Type Subscriptions


---

### CHANNEL_TYPE_TIKTOK

- CHANNEL_TYPE_TIKTOK: [Number](TopLevel.Number.md) = 14
  - : constant for Channel Type TikTok


---

### CHANNEL_TYPE_TWITTER

- CHANNEL_TYPE_TWITTER: [Number](TopLevel.Number.md) = 7
  - : constant for Channel Type Twitter


---

### CHANNEL_TYPE_WHATSAPP

- CHANNEL_TYPE_WHATSAPP: [Number](TopLevel.Number.md) = 16
  - : constant for Channel Type WhatsApp


---

### CHANNEL_TYPE_YOUTUBE

- CHANNEL_TYPE_YOUTUBE: [Number](TopLevel.Number.md) = 17
  - : constant for Channel Type YouTube


---

## Property Details

### adjustedMerchandizeTotalGrossPrice
- adjustedMerchandizeTotalGrossPrice: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the adjusted total gross price (including tax) in purchase currency. Adjusted merchandize prices
      represent the sum of product prices before services such as shipping, but after product-level and order-level
      adjustments.



---

### adjustedMerchandizeTotalNetPrice
- adjustedMerchandizeTotalNetPrice: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the total net price (excluding tax) in purchase currency. Adjusted merchandize prices represent the sum
      of product prices before services such as shipping, but after product-level and order-level adjustments.



---

### adjustedMerchandizeTotalPrice
- adjustedMerchandizeTotalPrice: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the adjusted merchandize total price including product-level and order-level adjustments. If the line
      item container is based on net pricing the adjusted merchandize total net price is returned. If the line item
      container is based on gross pricing the adjusted merchandize total gross price is returned.



---

### adjustedMerchandizeTotalTax
- adjustedMerchandizeTotalTax: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the subtotal tax in purchase currency. Adjusted merchandize prices represent the sum of product prices
      before services such as shipping have been added, but after adjustment from promotions have been added.



---

### adjustedShippingTotalGrossPrice
- adjustedShippingTotalGrossPrice: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the adjusted sum of all shipping line items of the line item container, including tax after shipping
      adjustments have been applied.



---

### adjustedShippingTotalNetPrice
- adjustedShippingTotalNetPrice: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the sum of all shipping line items of the line item container, excluding tax after shipping adjustments
      have been applied.



---

### adjustedShippingTotalPrice
- adjustedShippingTotalPrice: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the adjusted shipping total price. If the line item container is based on net pricing the adjusted
      shipping total net price is returned. If the line item container is based on gross pricing the adjusted shipping
      total gross price is returned.



---

### adjustedShippingTotalTax
- adjustedShippingTotalTax: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the tax of all shipping line items of the line item container after shipping adjustments have been
      applied.



---

### allGiftCertificateLineItems
- ~~allGiftCertificateLineItems: [Collection](dw.util.Collection.md)~~ `(read-only)`
  - : Returns all gift certificate line items of the container.

    **Deprecated:**
:::warning
Use [getGiftCertificateLineItems()](dw.order.LineItemCtnr.md#getgiftcertificatelineitems) to get the collection instead.
:::

---

### allLineItems
- allLineItems: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns all product, shipping, price adjustment, and gift certificate line items of the line item container.


---

### allProductLineItems
- allProductLineItems: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns all product line items of the container, no matter if they are dependent or independent. This includes
      option, bundled and bonus line items.



---

### allProductQuantities
- allProductQuantities: [HashMap](dw.util.HashMap.md) `(read-only)`
  - : Returns a hash mapping all products in the line item container to their total quantities. The total product
      quantity is used chiefly to validate the availability of the items in the cart. This method is not appropriate to
      look up prices because it returns products such as bundled line items which are included in the price of their
      parent and therefore have no corresponding price.
      
      
      The method counts all direct product line items, plus dependent product line items that are not option line
      items. It also excludes product line items that are not associated to any catalog product.



---

### allShippingPriceAdjustments
- allShippingPriceAdjustments: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns the collection of all shipping price adjustments applied somewhere in the container. This can be
      adjustments applied to individual shipments or to the container itself. Note that the promotions engine only
      applies shipping price adjustments to the the default shipping line item of shipments, and never to the
      container.


    **See Also:**
    - [getShippingPriceAdjustments()](dw.order.LineItemCtnr.md#getshippingpriceadjustments)


---

### billingAddress
- billingAddress: [OrderAddress](dw.order.OrderAddress.md) `(read-only)`
  - : Returns the billing address defined for the container. Returns null if no billing address has been created yet.


---

### bonusDiscountLineItems
- bonusDiscountLineItems: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns an unsorted collection of the the bonus discount line items associated with this container.


---

### bonusLineItems
- bonusLineItems: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns the collection of product line items that are bonus items (where
      [ProductLineItem.isBonusProductLineItem()](dw.order.ProductLineItem.md#isbonusproductlineitem) is true).



---

### businessType
- businessType: [EnumValue](dw.value.EnumValue.md) `(read-only)`
  - : Returns the type of the business this order has been placed in.
      
      Possible values are [BUSINESS_TYPE_B2C](dw.order.LineItemCtnr.md#business_type_b2c) or [BUSINESS_TYPE_B2B](dw.order.LineItemCtnr.md#business_type_b2b).



---

### channelType
- channelType: [EnumValue](dw.value.EnumValue.md) `(read-only)`
  - : The channel type defines in which sales channel this order has been created. This can be used to distinguish
      order placed through Storefront, Call Center or Marketplace.
      
      Possible values are [CHANNEL_TYPE_STOREFRONT](dw.order.LineItemCtnr.md#channel_type_storefront), [CHANNEL_TYPE_CALLCENTER](dw.order.LineItemCtnr.md#channel_type_callcenter),
      [CHANNEL_TYPE_MARKETPLACE](dw.order.LineItemCtnr.md#channel_type_marketplace), [CHANNEL_TYPE_DSS](dw.order.LineItemCtnr.md#channel_type_dss), [CHANNEL_TYPE_STORE](dw.order.LineItemCtnr.md#channel_type_store),
      [CHANNEL_TYPE_PINTEREST](dw.order.LineItemCtnr.md#channel_type_pinterest), [CHANNEL_TYPE_TWITTER](dw.order.LineItemCtnr.md#channel_type_twitter), [CHANNEL_TYPE_FACEBOOKADS](dw.order.LineItemCtnr.md#channel_type_facebookads),
      [CHANNEL_TYPE_SUBSCRIPTIONS](dw.order.LineItemCtnr.md#channel_type_subscriptions), [CHANNEL_TYPE_ONLINERESERVATION](dw.order.LineItemCtnr.md#channel_type_onlinereservation),
      [CHANNEL_TYPE_CUSTOMERSERVICECENTER](dw.order.LineItemCtnr.md#channel_type_customerservicecenter), [CHANNEL_TYPE_INSTAGRAMCOMMERCE](dw.order.LineItemCtnr.md#channel_type_instagramcommerce),
      [CHANNEL_TYPE_GOOGLE](dw.order.LineItemCtnr.md#channel_type_google), [CHANNEL_TYPE_YOUTUBE](dw.order.LineItemCtnr.md#channel_type_youtube), [CHANNEL_TYPE_TIKTOK](dw.order.LineItemCtnr.md#channel_type_tiktok),
      [CHANNEL_TYPE_SNAPCHAT](dw.order.LineItemCtnr.md#channel_type_snapchat), [CHANNEL_TYPE_WHATSAPP](dw.order.LineItemCtnr.md#channel_type_whatsapp)



---

### couponLineItems
- couponLineItems: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns a sorted collection of the coupon line items in the container. The coupon line items are returned in the
      order they were added to container.



---

### currencyCode
- currencyCode: [String](TopLevel.String.md) `(read-only)`
  - : Returns the currency code for this line item container. The currency code is a 3-character currency mnemonic such
      as 'USD' or 'EUR'. The currency code represents the currency in which the calculation is made, and in which the
      buyer sees all prices in the store front.



---

### customer
- customer: [Customer](dw.customer.Customer.md) `(read-only)`
  - : Returns the customer associated with this container.


---

### customerEmail
- customerEmail: [String](TopLevel.String.md)
  - : Returns the email of the customer associated with this container.


---

### customerName
- customerName: [String](TopLevel.String.md)
  - : Returns the name of the customer associated with this container.


---

### customerNo
- customerNo: [String](TopLevel.String.md) `(read-only)`
  - : Returns the customer number of the customer associated with this container.


---

### defaultShipment
- defaultShipment: [Shipment](dw.order.Shipment.md) `(read-only)`
  - : Returns the default shipment of the line item container. Every basket and order has a default shipment with the
      id "me". If you call a process that accesses a shipment, and you don't specify the shipment, then the process
      uses the default shipment. You can't remove a default shipment. Calling [removeShipment(Shipment)](dw.order.LineItemCtnr.md#removeshipmentshipment) on it
      throws an exception.



---

### etag
- etag: [String](TopLevel.String.md) `(read-only)`
  - : Returns the Etag of the line item container. The Etag is a hash that represents the overall container state
      including any associated objects like line items.



---

### externallyTaxed
- externallyTaxed: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Use this method to check whether the LineItemCtnr is calculated based on external tax tables.
      
      Note: a basket can only be created in EXTERNAL tax mode using SCAPI.



---

### giftCertificateLineItems
- giftCertificateLineItems: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns all gift certificate line items of the container.


---

### giftCertificatePaymentInstruments
- giftCertificatePaymentInstruments: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns an unsorted collection of the PaymentInstrument instances that represent GiftCertificates in this
      container.



---

### giftCertificateTotalGrossPrice
- giftCertificateTotalGrossPrice: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the total gross price of all gift certificates in the cart. Should usually be equal to total net price.


---

### giftCertificateTotalNetPrice
- giftCertificateTotalNetPrice: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the total net price (excluding tax) of all gift certificates in the cart. Should usually be equal to
      total gross price.



---

### giftCertificateTotalPrice
- giftCertificateTotalPrice: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the gift certificate total price. If the line item container is based on net pricing the gift certificate
      total net price is returned. If the line item container is based on gross pricing the gift certificate total
      gross price is returned.



---

### giftCertificateTotalTax
- giftCertificateTotalTax: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the total tax of all gift certificates in the cart. Should usually be 0.0.


---

### merchandizeTotalGrossPrice
- merchandizeTotalGrossPrice: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the total gross price (including tax) in purchase currency. Merchandize total prices represent the sum of
      product prices before services such as shipping or adjustment from promotions have been added.



---

### merchandizeTotalNetPrice
- merchandizeTotalNetPrice: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the total net price (excluding tax) in purchase currency. Merchandize total prices represent the sum of
      product prices before services such as shipping or adjustment from promotion have been added.



---

### merchandizeTotalPrice
- merchandizeTotalPrice: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the merchandize total price. If the line item container is based on net pricing the merchandize total net
      price is returned. If the line item container is based on gross pricing the merchandize total gross price is
      returned.



---

### merchandizeTotalTax
- merchandizeTotalTax: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the total tax in purchase currency. Merchandize total prices represent the sum of product prices before
      services such as shipping or adjustment from promotions have been added.



---

### notes
- notes: [List](dw.util.List.md) `(read-only)`
  - : Returns the list of notes for this object, ordered by creation time from oldest to newest.


---

### paymentInstrument
- ~~paymentInstrument: [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md)~~ `(read-only)`
  - : Returns the payment instrument of the line item container or null. This method is deprecated. You should use
      getPaymentInstruments() or getGiftCertificatePaymentInstruments() instead.


    **Deprecated:**
:::warning
Use [getPaymentInstruments()](dw.order.LineItemCtnr.md#getpaymentinstruments) or [getGiftCertificatePaymentInstruments()](dw.order.LineItemCtnr.md#getgiftcertificatepaymentinstruments) to get the
            set of payment instruments.

:::

---

### paymentInstruments
- paymentInstruments: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns an unsorted collection of the payment instruments in this container.


---

### priceAdjustments
- priceAdjustments: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns the collection of price adjustments that have been applied to the totals such as promotion on the
      purchase value (i.e. $10 Off or 10% Off). The price adjustments are sorted by the order in which they were
      applied to the order by the promotions engine.



---

### productLineItems
- productLineItems: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns the product line items of the container that are not dependent on other product line items. This includes
      line items representing bonus products in the container but excludes option, bundled, and bonus line items. The
      returned collection is sorted by the position attribute of the product line items.



---

### productQuantities
- productQuantities: [HashMap](dw.util.HashMap.md) `(read-only)`
  - : Returns a hash map of all products in the line item container and their total quantities. The total product
      quantity is for example used to lookup the product price.
      
      
      The method counts all direct product line items, plus dependent product line items that are not bundled line
      items and no option line items. It also excludes product line items that are not associated to any catalog
      product, and bonus product line items.


    **See Also:**
    - [getProductQuantities(Boolean)](dw.order.LineItemCtnr.md#getproductquantitiesboolean)


---

### productQuantityTotal
- productQuantityTotal: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the total quantity of all product line items. Not included are bundled line items and option line items.


---

### shipments
- shipments: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns all shipments of the line item container.
      
      The first shipment in the returned collection is the default shipment (shipment ID always set to "me"). All other
      shipments are sorted ascending by shipment ID.



---

### shippingPriceAdjustments
- shippingPriceAdjustments: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns the of shipping price adjustments applied to the shipping total of the container. Note that the
      promotions engine only applies shipping price adjustments to the the default shipping line item of shipments, and
      never to the container.


    **See Also:**
    - [getAllShippingPriceAdjustments()](dw.order.LineItemCtnr.md#getallshippingpriceadjustments)


---

### shippingTotalGrossPrice
- shippingTotalGrossPrice: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the sum of all shipping line items of the line item container, including tax before shipping adjustments
      have been applied.



---

### shippingTotalNetPrice
- shippingTotalNetPrice: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the sum of all shipping line items of the line item container, excluding tax before shipping adjustments
      have been applied.



---

### shippingTotalPrice
- shippingTotalPrice: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the shipping total price. If the line item container is based on net pricing the shipping total net price
      is returned. If the line item container is based on gross pricing the shipping total gross price is returned.



---

### shippingTotalTax
- shippingTotalTax: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the tax of all shipping line items of the line item container before shipping adjustments have been
      applied.



---

### taxRoundedAtGroup
- taxRoundedAtGroup: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Use this method to check if the LineItemCtnr was calculated with grouped taxation calculation.
      
      
      If the tax is rounded on group level, the tax is applied to the summed-up tax basis for each tax rate.



---

### taxTotalsPerTaxRate
- taxTotalsPerTaxRate: [SortedMap](dw.util.SortedMap.md) `(read-only)`
  - : This method returns a [SortedMap](dw.util.SortedMap.md) in which the keys are [Decimal](dw.util.Decimal.md) tax rates and the values
      are [Money](dw.value.Money.md) total tax for the tax rate. The map is unmodifiable.



---

### totalGrossPrice
- totalGrossPrice: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the grand total price gross of tax for LineItemCtnr, in purchase currency. Total prices represent the sum
      of product prices, services prices and adjustments.



---

### totalNetPrice
- totalNetPrice: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the grand total price for LineItemCtnr net of tax, in purchase currency. Total prices represent the sum
      of product prices, services prices and adjustments.



---

### totalTax
- totalTax: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the grand total tax for LineItemCtnr, in purchase currency. Total prices represent the sum of product
      prices, services prices and adjustments.



---

## Method Details

### addNote(String, String)
- addNote(subject: [String](TopLevel.String.md), text: [String](TopLevel.String.md)): [Note](dw.object.Note.md)
  - : Adds a note to the object.

    **Parameters:**
    - subject - The subject of the note.
    - text - The text of the note. Must be no more than 4000 characters or an exception is thrown.

    **Returns:**
    - the added note.


---

### createBillingAddress()
- createBillingAddress(): [OrderAddress](dw.order.OrderAddress.md)
  - : Create a billing address for the LineItemCtnr. A LineItemCtnr (e.g. basket) initially has no billing address.
      This method creates a billing address for the LineItemCtnr and replaces an existing billing address.


    **Returns:**
    - The new billing address of the LineItemCtnr.


---

### createBonusProductLineItem(BonusDiscountLineItem, Product, ProductOptionModel, Shipment)
- createBonusProductLineItem(bonusDiscountLineItem: [BonusDiscountLineItem](dw.order.BonusDiscountLineItem.md), product: [Product](dw.catalog.Product.md), optionModel: [ProductOptionModel](dw.catalog.ProductOptionModel.md), shipment: [Shipment](dw.order.Shipment.md)): [ProductLineItem](dw.order.ProductLineItem.md)
  - : Creates a product line item in the container based on the passed Product and BonusDiscountLineItem. The product
      must be assigned to the current site catalog and must also be a bonus product of the specified
      BonusDiscountLineItem or an exception is thrown. The line item is always created in the default shipment. If
      successful, the operation always creates a new ProductLineItem and never simply increments the quantity of an
      existing ProductLineItem. An option model can optionally be specified.


    **Parameters:**
    - bonusDiscountLineItem - Line item representing an applied BonusChoiceDiscount in the LineItemCtnr, must not             be null.
    - product - Product The product to add to the LineItemCtnr. Must not be null and must be a bonus product of             bonusDiscountLineItem.
    - optionModel - ProductOptionModel or null.
    - shipment - The shipment to add the bonus product to. If null, the product is added to the default shipment.


---

### createCouponLineItem(String)
- createCouponLineItem(couponCode: [String](TopLevel.String.md)): [CouponLineItem](dw.order.CouponLineItem.md)
  - : Creates a coupon line item that is not based on the B2C Commerce campaign system and associates it with the
      specified coupon code.
      
      
      There may not be any other coupon line item in the container with the specific coupon code, otherwise an
      exception is thrown.
      
      
      If you want to create a coupon line item based on the B2C Commerce campaign system, you must use
      [createCouponLineItem(String, Boolean)](dw.order.LineItemCtnr.md#createcouponlineitemstring-boolean) with campaignBased = true.


    **Parameters:**
    - couponCode - couponCode represented by the coupon line item.

    **Returns:**
    - New coupon line item.


---

### createCouponLineItem(String, Boolean)
- createCouponLineItem(couponCode: [String](TopLevel.String.md), campaignBased: [Boolean](TopLevel.Boolean.md)): [CouponLineItem](dw.order.CouponLineItem.md)
  - : Creates a new CouponLineItem for this container based on the supplied coupon code.
      
      
      The created coupon line item is based on the B2C Commerce campaign system if campaignBased parameter is true. In
      that case, if the supplied coupon code is not valid, APIException with type 'CreateCouponLineItemException' is
      thrown.
      
      
      If you want to create a custom coupon line item, you must call this method with campaignBased = false or to use
      [createCouponLineItem(String)](dw.order.LineItemCtnr.md#createcouponlineitemstring).
      
      
      
      
      Example:
      
      
      
      
      ```
      try {
          var cli : CouponLineItem = basket.createCouponLineItem(couponCode, true);
      } catch (e if e instanceof APIException && e.type === 'CreateCouponLineItemException')
          if (e.errorCode == CouponStatusCodes.COUPON_CODE_ALREADY_IN_BASKET) {
              ...
          }
      }
      ```
      
      
      An dw.order.CreateCouponLineItemException is thrown in case of campaignBased = true only. Indicates that the
      provided coupon code is not a valid coupon code to create a coupon line item based on the B2C Commerce campaign
      system. The error code property (CreateCouponLineItemException.errorCode) will be set to one of the following
      values:
      
      - [CouponStatusCodes.COUPON_CODE_ALREADY_IN_BASKET](dw.campaign.CouponStatusCodes.md#coupon_code_already_in_basket)= Indicates that coupon code has already  been added to basket.
      - [CouponStatusCodes.COUPON_ALREADY_IN_BASKET](dw.campaign.CouponStatusCodes.md#coupon_already_in_basket)= Indicates that another code of the same  MultiCode/System coupon has already been added to basket.
      - [CouponStatusCodes.COUPON_CODE_ALREADY_REDEEMED](dw.campaign.CouponStatusCodes.md#coupon_code_already_redeemed)= Indicates that code of MultiCode/System  coupon has already been redeemed.
      - [CouponStatusCodes.COUPON_CODE_UNKNOWN](dw.campaign.CouponStatusCodes.md#coupon_code_unknown)= Indicates that coupon not found for given coupon  code or that the code itself was not found.
      - [CouponStatusCodes.COUPON_DISABLED](dw.campaign.CouponStatusCodes.md#coupon_disabled)= Indicates that coupon is not enabled.
      - [CouponStatusCodes.REDEMPTION_LIMIT_EXCEEDED](dw.campaign.CouponStatusCodes.md#redemption_limit_exceeded)= Indicates that number of redemptions per  code exceeded.
      - [CouponStatusCodes.CUSTOMER_REDEMPTION_LIMIT_EXCEEDED](dw.campaign.CouponStatusCodes.md#customer_redemption_limit_exceeded)= Indicates that number of  redemptions per code and customer exceeded.
      - [CouponStatusCodes.TIMEFRAME_REDEMPTION_LIMIT_EXCEEDED](dw.campaign.CouponStatusCodes.md#timeframe_redemption_limit_exceeded)= Indicates that number of  redemptions per code, customer and time exceeded.
      - [CouponStatusCodes.NO_ACTIVE_PROMOTION](dw.campaign.CouponStatusCodes.md#no_active_promotion)= Indicates that coupon is not assigned to an  active promotion.


    **Parameters:**
    - couponCode - the coupon code to be represented by the coupon line item
    - campaignBased - the flag if the created coupon line item should be based on the B2C Commerce campaign system

    **Returns:**
    - the created coupon line item


---

### createGiftCertificateLineItem(Number, String)
- createGiftCertificateLineItem(amount: [Number](TopLevel.Number.md), recipientEmail: [String](TopLevel.String.md)): [GiftCertificateLineItem](dw.order.GiftCertificateLineItem.md)
  - : Creates a gift certificate line item.

    **Parameters:**
    - amount - the amount of the gift certificate - mandatory
    - recipientEmail - the recipient's email address - mandatory

    **Returns:**
    - The new gift certificate line item


---

### createGiftCertificatePaymentInstrument(String, Money)
- createGiftCertificatePaymentInstrument(giftCertificateCode: [String](TopLevel.String.md), amount: [Money](dw.value.Money.md)): [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md)
  - : Creates an OrderPaymentInstrument representing a Gift Certificate. The amount is set on a PaymentTransaction that
      is accessible via the OrderPaymentInstrument. By default, the status of the PaymentTransaction is set to CREATE.
      The PaymentTransaction must be processed at a later time.


    **Parameters:**
    - giftCertificateCode - the redemption code of the Gift Certificate.
    - amount - the amount to set on the PaymentTransaction. If the OrderPaymentInstrument is actually redeemed,             this is the amount that will be deducted from the Gift Certificate.

    **Returns:**
    - the OrderPaymentInstrument.


---

### createPaymentInstrument(String, Money)
- createPaymentInstrument(paymentMethodId: [String](TopLevel.String.md), amount: [Money](dw.value.Money.md)): [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md)
  - : Creates a payment instrument using the specified payment method id and amount. The amount is set on the
      [PaymentTransaction](dw.order.PaymentTransaction.md) that is attached to the payment instrument.


    **Parameters:**
    - paymentMethodId - The payment method id. See the [PaymentInstrument](dw.order.PaymentInstrument.md) class for payment method             types
    - amount - The payment amount or null

    **Returns:**
    - The new payment instrument


---

### createPaymentInstrumentFromWallet(CustomerPaymentInstrument, Money)
- createPaymentInstrumentFromWallet(walletPaymentInstrument: [CustomerPaymentInstrument](dw.customer.CustomerPaymentInstrument.md), amount: [Money](dw.value.Money.md)): [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md)
  - : Creates a payment instrument using the specified wallet payment instrument and amount. The amount is set on the
      [PaymentTransaction](dw.order.PaymentTransaction.md) that is attached to the payment instrument. All data from the wallet payment
      instrument will be copied over to the created payment instrument.


    **Parameters:**
    - walletPaymentInstrument - The payment instrument from the customer's walled.
    - amount - The payment amount or null

    **Returns:**
    - The new payment instrument


---

### createPriceAdjustment(String)
- createPriceAdjustment(promotionID: [String](TopLevel.String.md)): [PriceAdjustment](dw.order.PriceAdjustment.md)
  - : Creates an order price adjustment.
      
      The promotion id is mandatory and must not be the ID of any actual promotion defined in B2C Commerce; otherwise
      an exception is thrown. 


    **Parameters:**
    - promotionID - Promotion ID

    **Returns:**
    - The new price adjustment


---

### createPriceAdjustment(String, Discount)
- createPriceAdjustment(promotionID: [String](TopLevel.String.md), discount: [Discount](dw.campaign.Discount.md)): [PriceAdjustment](dw.order.PriceAdjustment.md)
  - : Creates an order level price adjustment for a specific discount.
      
      The promotion id is mandatory and must not be the ID of any actual promotion defined in B2C Commerce; otherwise
      an exception is thrown. 
      
      The possible discount types are supported: [PercentageDiscount](dw.campaign.PercentageDiscount.md) and
      [AmountDiscount](dw.campaign.AmountDiscount.md). 
      
      Examples:
      
      
      `
       var myOrder : dw.order.Order; // assume known
      
       var paTenPercent : dw.order.PriceAdjustment = myOrder.createPriceAdjustment("myPromotionID1", new dw.campaign.PercentageDiscount(10));
      
       var paReduceBy20 : dw.order.PriceAdjustment = myOrder.createPriceAdjustment("myPromotionID2", new dw.campaign.AmountDiscount(20);
      
       `


    **Parameters:**
    - promotionID - Promotion ID
    - discount - The discount

    **Returns:**
    - The new price adjustment


---

### createProductLineItem(Product, ProductOptionModel, Shipment)
- createProductLineItem(product: [Product](dw.catalog.Product.md), optionModel: [ProductOptionModel](dw.catalog.ProductOptionModel.md), shipment: [Shipment](dw.order.Shipment.md)): [ProductLineItem](dw.order.ProductLineItem.md)
  - : Creates a new product line item in the container and assigns it to the specified shipment. An option model can be
      specified. 
      
      Please note that the product must be assigned to the current site catalog.


    **Parameters:**
    - product - Product
    - optionModel - ProductOptionModel or null
    - shipment - Shipment


---

### createProductLineItem(ProductListItem, Shipment)
- createProductLineItem(productListItem: [ProductListItem](dw.customer.ProductListItem.md), shipment: [Shipment](dw.order.Shipment.md)): [ProductLineItem](dw.order.ProductLineItem.md)
  - : Creates a new product line item in the basket and assigns it to the specified shipment.
      
      
      If the product list item references a product in the site catalog, the method will associate the product line
      item with that catalog product and will copy all order-relevant information, like the quantity unit, from the
      catalog product. The quantity of the product line item is initialized with 1.0 or - if defined - the minimum
      order quantity of the product.
      
      
      If the product list item references an option product, the option values are copied from the product list item.
      
      
      If the product list item is associated with an existing product line item, and the BasketAddProductBehaviour
      setting is MergeQuantities, then the product line item quantity is increased by 1.0 or, if defined, the minimum
      order quantity of the product.
      
      
      An exception is thrown if
      
      - the line item container is no basket.
      - the type of the product list item is not PRODUCT.
      - the product list item references a product which is not assigned to the site catalog.


    **Parameters:**
    - productListItem - the product list item
    - shipment - the shipment the created product line item will be assigned to

    **Returns:**
    - The new product line item


---

### createProductLineItem(String, Shipment)
- createProductLineItem(productID: [String](TopLevel.String.md), shipment: [Shipment](dw.order.Shipment.md)): [ProductLineItem](dw.order.ProductLineItem.md)
  - : Creates a new product line item in the container and assigns it to the specified shipment. 
      
      If the specified productID represents a product in the site catalog, the method will associate the product line
      item with that catalog product and will copy all order-relevant information, like the quantity unit, from the
      catalog product. The quantity of the product line item is initialized with 1.0 or - if defined - the minimum
      order quantity of the product.
      
      If the product represents a product in the site catalog and is an option product, the product is added with it's
      default option values. 
      
      If the specified productID does not represent a product of the site catalog, the method creates a new product
      line item and initializes it with the specified product ID and with a quantity, minimum order quantity, and step
      quantity value of 1.0.
      
      If the provided SKU references a product that is not available as described in method [ProductLineItem.isCatalogProduct()](dw.order.ProductLineItem.md#iscatalogproduct), the new product line item is considered a non-catalog product line item without a connection to a product. Such product line items are not included in reservation requests in either OCI-based inventory or eCom-based inventory when calling [Basket.reserveInventory()](dw.order.Basket.md#reserveinventory) or [OrderMgr.createOrder(Basket)](dw.order.OrderMgr.md#createorderbasket).


    **Parameters:**
    - productID - The product ID.
    - shipment - Shipment

    **Returns:**
    - The new product line item


---

### createProductLineItem(String, Quantity, Shipment)
- ~~createProductLineItem(productID: [String](TopLevel.String.md), quantity: [Quantity](dw.value.Quantity.md), shipment: [Shipment](dw.order.Shipment.md)): [ProductLineItem](dw.order.ProductLineItem.md)~~
  - : Creates a new product line item in the container and assigns it to the specified shipment. 
      
      If the specified productID represents a product in the site catalog, the method will associate the product line
      item with that catalog product and will copy all order-relevant information, like the quantity unit, from the
      catalog product. 
      
      If the specified productID does not represent a product of the site catalog, the method creates a new product
      line item and initializes it with the specified product ID and quantity. If the passed in quantity value is not a
      positive integer, it will be rounded to the nearest positive integer. The minimum order quantity and step
      quantity will be set to 1.0. 
      
      For catalog products, the method follows the configured 'Add2Basket' strategy to either increment the quantity of
      an existing product line item or create a new product line item for the same product. For non-catalog products,
      the method creates a new product line item no matter if the same product is already in the line item container.
      If a negative quantity is specified, it is automatically changed to 1.0. 


    **Parameters:**
    - productID - The product ID.
    - quantity - The quantity of the product.
    - shipment - Shipment

    **Returns:**
    - the product line item

    **Deprecated:**
:::warning
Use [createProductLineItem(String, Shipment)](dw.order.LineItemCtnr.md#createproductlineitemstring-shipment) or
            [ProductLineItem.updateQuantity(Number)](dw.order.ProductLineItem.md#updatequantitynumber) instead.

:::

---

### createShipment(String)
- createShipment(id: [String](TopLevel.String.md)): [Shipment](dw.order.Shipment.md)
  - : Creates a standard shipment for the line item container. The specified ID must not yet be in use for another
      shipment of this line item container.


    **Parameters:**
    - id - ID of the shipment.


---

### createShippingPriceAdjustment(String)
- createShippingPriceAdjustment(promotionID: [String](TopLevel.String.md)): [PriceAdjustment](dw.order.PriceAdjustment.md)
  - : Creates a shipping price adjustment to be applied to the container. 
      
      The promotion ID is mandatory and must not be the ID of any actual promotion defined in B2C Commerce; otherwise
      the method will throw an exception. 
      
      If there already exists a shipping price adjustment referring to the specified promotion ID, an exception is
      thrown.


    **Parameters:**
    - promotionID - Promotion ID

    **Returns:**
    - The new price adjustment


---

### getAdjustedMerchandizeTotalGrossPrice()
- getAdjustedMerchandizeTotalGrossPrice(): [Money](dw.value.Money.md)
  - : Returns the adjusted total gross price (including tax) in purchase currency. Adjusted merchandize prices
      represent the sum of product prices before services such as shipping, but after product-level and order-level
      adjustments.


    **Returns:**
    - the adjusted total gross price (including tax) in purchase currency.


---

### getAdjustedMerchandizeTotalNetPrice()
- getAdjustedMerchandizeTotalNetPrice(): [Money](dw.value.Money.md)
  - : Returns the total net price (excluding tax) in purchase currency. Adjusted merchandize prices represent the sum
      of product prices before services such as shipping, but after product-level and order-level adjustments.


    **Returns:**
    - the total net price (excluding tax) in purchase currency.


---

### getAdjustedMerchandizeTotalPrice()
- getAdjustedMerchandizeTotalPrice(): [Money](dw.value.Money.md)
  - : Returns the adjusted merchandize total price including product-level and order-level adjustments. If the line
      item container is based on net pricing the adjusted merchandize total net price is returned. If the line item
      container is based on gross pricing the adjusted merchandize total gross price is returned.


    **Returns:**
    - either the adjusted merchandize total net or gross price


---

### getAdjustedMerchandizeTotalPrice(Boolean)
- getAdjustedMerchandizeTotalPrice(applyOrderLevelAdjustments: [Boolean](TopLevel.Boolean.md)): [Money](dw.value.Money.md)
  - : Returns the adjusted merchandize total price including order-level adjustments if requested. If the line item
      container is based on net pricing the adjusted merchandize total net price is returned. If the line item
      container is based on gross pricing the adjusted merchandize total gross price is returned.


    **Parameters:**
    - applyOrderLevelAdjustments - controls if order-level price adjustements are applied. If true, the price that             is returned includes order-level price adjustments. If false, only product-level price adjustments are             applied.

    **Returns:**
    - a price representing the adjusted merchandize total controlled by the applyOrderLevelAdjustments
              parameter.



---

### getAdjustedMerchandizeTotalTax()
- getAdjustedMerchandizeTotalTax(): [Money](dw.value.Money.md)
  - : Returns the subtotal tax in purchase currency. Adjusted merchandize prices represent the sum of product prices
      before services such as shipping have been added, but after adjustment from promotions have been added.


    **Returns:**
    - the subtotal tax in purchase currency.


---

### getAdjustedShippingTotalGrossPrice()
- getAdjustedShippingTotalGrossPrice(): [Money](dw.value.Money.md)
  - : Returns the adjusted sum of all shipping line items of the line item container, including tax after shipping
      adjustments have been applied.


    **Returns:**
    - the adjusted sum of all shipping line items of the line item container, including tax after shipping
              adjustments have been applied.



---

### getAdjustedShippingTotalNetPrice()
- getAdjustedShippingTotalNetPrice(): [Money](dw.value.Money.md)
  - : Returns the sum of all shipping line items of the line item container, excluding tax after shipping adjustments
      have been applied.


    **Returns:**
    - the sum of all shipping line items of the line item container, excluding tax after shipping adjustments
              have been applied.



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
  - : Returns the tax of all shipping line items of the line item container after shipping adjustments have been
      applied.


    **Returns:**
    - the tax of all shipping line items of the line item container after shipping adjustments have been
              applied.



---

### getAllGiftCertificateLineItems()
- ~~getAllGiftCertificateLineItems(): [Collection](dw.util.Collection.md)~~
  - : Returns all gift certificate line items of the container.

    **Returns:**
    - A collection of all GiftCertificateLineItems of the container.

    **Deprecated:**
:::warning
Use [getGiftCertificateLineItems()](dw.order.LineItemCtnr.md#getgiftcertificatelineitems) to get the collection instead.
:::

---

### getAllLineItems()
- getAllLineItems(): [Collection](dw.util.Collection.md)
  - : Returns all product, shipping, price adjustment, and gift certificate line items of the line item container.

    **Returns:**
    - A collection of all product, shipping, price adjustment, and gift certificate line items of the
              container, in that order.



---

### getAllProductLineItems()
- getAllProductLineItems(): [Collection](dw.util.Collection.md)
  - : Returns all product line items of the container, no matter if they are dependent or independent. This includes
      option, bundled and bonus line items.


    **Returns:**
    - An unsorted collection of all ProductLineItem instances of the container.


---

### getAllProductLineItems(String)
- getAllProductLineItems(productID: [String](TopLevel.String.md)): [Collection](dw.util.Collection.md)
  - : Returns all product line items of the container that have a product ID equal to the specified product ID, no
      matter if they are dependent or independent. This includes option, bundled and bonus line items.


    **Parameters:**
    - productID - The product ID used to filter the product line items.

    **Returns:**
    - An unsorted collection of all ProductLineItem instances which have the specified product ID.


---

### getAllProductQuantities()
- getAllProductQuantities(): [HashMap](dw.util.HashMap.md)
  - : Returns a hash mapping all products in the line item container to their total quantities. The total product
      quantity is used chiefly to validate the availability of the items in the cart. This method is not appropriate to
      look up prices because it returns products such as bundled line items which are included in the price of their
      parent and therefore have no corresponding price.
      
      
      The method counts all direct product line items, plus dependent product line items that are not option line
      items. It also excludes product line items that are not associated to any catalog product.


    **Returns:**
    - A map of products and their total quantities.


---

### getAllShippingPriceAdjustments()
- getAllShippingPriceAdjustments(): [Collection](dw.util.Collection.md)
  - : Returns the collection of all shipping price adjustments applied somewhere in the container. This can be
      adjustments applied to individual shipments or to the container itself. Note that the promotions engine only
      applies shipping price adjustments to the the default shipping line item of shipments, and never to the
      container.


    **Returns:**
    - an unsorted collection of the shipping PriceAdjustment instances associated with this container.

    **See Also:**
    - [getShippingPriceAdjustments()](dw.order.LineItemCtnr.md#getshippingpriceadjustments)


---

### getBillingAddress()
- getBillingAddress(): [OrderAddress](dw.order.OrderAddress.md)
  - : Returns the billing address defined for the container. Returns null if no billing address has been created yet.

    **Returns:**
    - the billing address or null.


---

### getBonusDiscountLineItems()
- getBonusDiscountLineItems(): [Collection](dw.util.Collection.md)
  - : Returns an unsorted collection of the the bonus discount line items associated with this container.

    **Returns:**
    - An unsorted collection of BonusDiscountLine instances in the container.


---

### getBonusLineItems()
- getBonusLineItems(): [Collection](dw.util.Collection.md)
  - : Returns the collection of product line items that are bonus items (where
      [ProductLineItem.isBonusProductLineItem()](dw.order.ProductLineItem.md#isbonusproductlineitem) is true).


    **Returns:**
    - the collection of product line items that are bonus items.


---

### getBusinessType()
- getBusinessType(): [EnumValue](dw.value.EnumValue.md)
  - : Returns the type of the business this order has been placed in.
      
      Possible values are [BUSINESS_TYPE_B2C](dw.order.LineItemCtnr.md#business_type_b2c) or [BUSINESS_TYPE_B2B](dw.order.LineItemCtnr.md#business_type_b2b).


    **Returns:**
    - the type of the business this order has been placed in. or null, if the business type is not set


---

### getChannelType()
- getChannelType(): [EnumValue](dw.value.EnumValue.md)
  - : The channel type defines in which sales channel this order has been created. This can be used to distinguish
      order placed through Storefront, Call Center or Marketplace.
      
      Possible values are [CHANNEL_TYPE_STOREFRONT](dw.order.LineItemCtnr.md#channel_type_storefront), [CHANNEL_TYPE_CALLCENTER](dw.order.LineItemCtnr.md#channel_type_callcenter),
      [CHANNEL_TYPE_MARKETPLACE](dw.order.LineItemCtnr.md#channel_type_marketplace), [CHANNEL_TYPE_DSS](dw.order.LineItemCtnr.md#channel_type_dss), [CHANNEL_TYPE_STORE](dw.order.LineItemCtnr.md#channel_type_store),
      [CHANNEL_TYPE_PINTEREST](dw.order.LineItemCtnr.md#channel_type_pinterest), [CHANNEL_TYPE_TWITTER](dw.order.LineItemCtnr.md#channel_type_twitter), [CHANNEL_TYPE_FACEBOOKADS](dw.order.LineItemCtnr.md#channel_type_facebookads),
      [CHANNEL_TYPE_SUBSCRIPTIONS](dw.order.LineItemCtnr.md#channel_type_subscriptions), [CHANNEL_TYPE_ONLINERESERVATION](dw.order.LineItemCtnr.md#channel_type_onlinereservation),
      [CHANNEL_TYPE_CUSTOMERSERVICECENTER](dw.order.LineItemCtnr.md#channel_type_customerservicecenter), [CHANNEL_TYPE_INSTAGRAMCOMMERCE](dw.order.LineItemCtnr.md#channel_type_instagramcommerce),
      [CHANNEL_TYPE_GOOGLE](dw.order.LineItemCtnr.md#channel_type_google), [CHANNEL_TYPE_YOUTUBE](dw.order.LineItemCtnr.md#channel_type_youtube), [CHANNEL_TYPE_TIKTOK](dw.order.LineItemCtnr.md#channel_type_tiktok),
      [CHANNEL_TYPE_SNAPCHAT](dw.order.LineItemCtnr.md#channel_type_snapchat), [CHANNEL_TYPE_WHATSAPP](dw.order.LineItemCtnr.md#channel_type_whatsapp)


    **Returns:**
    - the sales channel this order has been placed in or null, if the order channel is not set


---

### getCouponLineItem(String)
- getCouponLineItem(couponCode: [String](TopLevel.String.md)): [CouponLineItem](dw.order.CouponLineItem.md)
  - : Returns the coupon line item representing the specified coupon code.

    **Parameters:**
    - couponCode - the coupon code.

    **Returns:**
    - coupon line item or null.


---

### getCouponLineItems()
- getCouponLineItems(): [Collection](dw.util.Collection.md)
  - : Returns a sorted collection of the coupon line items in the container. The coupon line items are returned in the
      order they were added to container.


    **Returns:**
    - A sorted list of the CouponLineItem instances in the container.


---

### getCurrencyCode()
- getCurrencyCode(): [String](TopLevel.String.md)
  - : Returns the currency code for this line item container. The currency code is a 3-character currency mnemonic such
      as 'USD' or 'EUR'. The currency code represents the currency in which the calculation is made, and in which the
      buyer sees all prices in the store front.


    **Returns:**
    - the currency code for this line item container.


---

### getCustomer()
- getCustomer(): [Customer](dw.customer.Customer.md)
  - : Returns the customer associated with this container.

    **Returns:**
    - the customer associated with this container.


---

### getCustomerEmail()
- getCustomerEmail(): [String](TopLevel.String.md)
  - : Returns the email of the customer associated with this container.

    **Returns:**
    - the email of the customer associated with this container.


---

### getCustomerName()
- getCustomerName(): [String](TopLevel.String.md)
  - : Returns the name of the customer associated with this container.

    **Returns:**
    - the name of the customer associated with this container.


---

### getCustomerNo()
- getCustomerNo(): [String](TopLevel.String.md)
  - : Returns the customer number of the customer associated with this container.

    **Returns:**
    - the customer number of the customer associated with this container.


---

### getDefaultShipment()
- getDefaultShipment(): [Shipment](dw.order.Shipment.md)
  - : Returns the default shipment of the line item container. Every basket and order has a default shipment with the
      id "me". If you call a process that accesses a shipment, and you don't specify the shipment, then the process
      uses the default shipment. You can't remove a default shipment. Calling [removeShipment(Shipment)](dw.order.LineItemCtnr.md#removeshipmentshipment) on it
      throws an exception.


    **Returns:**
    - the default shipment of the container


---

### getEtag()
- getEtag(): [String](TopLevel.String.md)
  - : Returns the Etag of the line item container. The Etag is a hash that represents the overall container state
      including any associated objects like line items.


    **Returns:**
    - the Etag value


---

### getGiftCertificateLineItems()
- getGiftCertificateLineItems(): [Collection](dw.util.Collection.md)
  - : Returns all gift certificate line items of the container.

    **Returns:**
    - A collection of all GiftCertificateLineItems of the container.


---

### getGiftCertificateLineItems(String)
- getGiftCertificateLineItems(giftCertificateId: [String](TopLevel.String.md)): [Collection](dw.util.Collection.md)
  - : Returns all gift certificate line items of the container, no matter if they are dependent or independent.

    **Parameters:**
    - giftCertificateId - the gift certificate identifier.

    **Returns:**
    - A collection of all GiftCertificateLineItems of the container.


---

### getGiftCertificatePaymentInstruments()
- getGiftCertificatePaymentInstruments(): [Collection](dw.util.Collection.md)
  - : Returns an unsorted collection of the PaymentInstrument instances that represent GiftCertificates in this
      container.


    **Returns:**
    - an unsorted collection containing the set of PaymentInstrument instances that represent GiftCertificates.


---

### getGiftCertificatePaymentInstruments(String)
- getGiftCertificatePaymentInstruments(giftCertificateCode: [String](TopLevel.String.md)): [Collection](dw.util.Collection.md)
  - : Returns an unsorted collection containing all PaymentInstruments of type
      PaymentInstrument.METHOD\_GIFT\_CERTIFICATE where the specified code is the same code on the payment instrument.


    **Parameters:**
    - giftCertificateCode - the gift certificate code.

    **Returns:**
    - an unsorted collection containing all PaymentInstruments of type
              PaymentInstrument.METHOD\_GIFT\_CERTIFICATE where the specified code is the same code on the payment
              instrument.



---

### getGiftCertificateTotalGrossPrice()
- getGiftCertificateTotalGrossPrice(): [Money](dw.value.Money.md)
  - : Returns the total gross price of all gift certificates in the cart. Should usually be equal to total net price.

    **Returns:**
    - the total gross price of all gift certificate line items


---

### getGiftCertificateTotalNetPrice()
- getGiftCertificateTotalNetPrice(): [Money](dw.value.Money.md)
  - : Returns the total net price (excluding tax) of all gift certificates in the cart. Should usually be equal to
      total gross price.


    **Returns:**
    - the total net price of all gift certificate line items


---

### getGiftCertificateTotalPrice()
- getGiftCertificateTotalPrice(): [Money](dw.value.Money.md)
  - : Returns the gift certificate total price. If the line item container is based on net pricing the gift certificate
      total net price is returned. If the line item container is based on gross pricing the gift certificate total
      gross price is returned.


    **Returns:**
    - either the gift certificate total net or gross price


---

### getGiftCertificateTotalTax()
- getGiftCertificateTotalTax(): [Money](dw.value.Money.md)
  - : Returns the total tax of all gift certificates in the cart. Should usually be 0.0.

    **Returns:**
    - the total tax of all gift certificate line items


---

### getMerchandizeTotalGrossPrice()
- getMerchandizeTotalGrossPrice(): [Money](dw.value.Money.md)
  - : Returns the total gross price (including tax) in purchase currency. Merchandize total prices represent the sum of
      product prices before services such as shipping or adjustment from promotions have been added.


    **Returns:**
    - the total gross price (including tax) in purchase currency.


---

### getMerchandizeTotalNetPrice()
- getMerchandizeTotalNetPrice(): [Money](dw.value.Money.md)
  - : Returns the total net price (excluding tax) in purchase currency. Merchandize total prices represent the sum of
      product prices before services such as shipping or adjustment from promotion have been added.


    **Returns:**
    - the total net price (excluding tax) in purchase currency.


---

### getMerchandizeTotalPrice()
- getMerchandizeTotalPrice(): [Money](dw.value.Money.md)
  - : Returns the merchandize total price. If the line item container is based on net pricing the merchandize total net
      price is returned. If the line item container is based on gross pricing the merchandize total gross price is
      returned.


    **Returns:**
    - either the merchandize total net or gross price


---

### getMerchandizeTotalTax()
- getMerchandizeTotalTax(): [Money](dw.value.Money.md)
  - : Returns the total tax in purchase currency. Merchandize total prices represent the sum of product prices before
      services such as shipping or adjustment from promotions have been added.


    **Returns:**
    - the total tax in purchase currency.


---

### getNotes()
- getNotes(): [List](dw.util.List.md)
  - : Returns the list of notes for this object, ordered by creation time from oldest to newest.

    **Returns:**
    - the list of notes for this object, ordered by creation time from oldest to newest.


---

### getPaymentInstrument()
- ~~getPaymentInstrument(): [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md)~~
  - : Returns the payment instrument of the line item container or null. This method is deprecated. You should use
      getPaymentInstruments() or getGiftCertificatePaymentInstruments() instead.


    **Returns:**
    - the order payment instrument of the line item container or null.

    **Deprecated:**
:::warning
Use [getPaymentInstruments()](dw.order.LineItemCtnr.md#getpaymentinstruments) or [getGiftCertificatePaymentInstruments()](dw.order.LineItemCtnr.md#getgiftcertificatepaymentinstruments) to get the
            set of payment instruments.

:::

---

### getPaymentInstruments()
- getPaymentInstruments(): [Collection](dw.util.Collection.md)
  - : Returns an unsorted collection of the payment instruments in this container.

    **Returns:**
    - an unsorted collection containing the set of PaymentInstrument instances associated with this container.


---

### getPaymentInstruments(String)
- getPaymentInstruments(paymentMethodID: [String](TopLevel.String.md)): [Collection](dw.util.Collection.md)
  - : Returns an unsorted collection of PaymentInstrument instances based on the specified payment method ID.

    **Parameters:**
    - paymentMethodID - the ID of the payment method used.

    **Returns:**
    - an unsorted collection of OrderPaymentInstrument instances based on the payment method.


---

### getPriceAdjustmentByPromotionID(String)
- getPriceAdjustmentByPromotionID(promotionID: [String](TopLevel.String.md)): [PriceAdjustment](dw.order.PriceAdjustment.md)
  - : Returns the price adjustment associated to the specified promotion ID.

    **Parameters:**
    - promotionID - Promotion id

    **Returns:**
    - The price adjustment associated with the specified promotion ID or null if none was found.


---

### getPriceAdjustments()
- getPriceAdjustments(): [Collection](dw.util.Collection.md)
  - : Returns the collection of price adjustments that have been applied to the totals such as promotion on the
      purchase value (i.e. $10 Off or 10% Off). The price adjustments are sorted by the order in which they were
      applied to the order by the promotions engine.


    **Returns:**
    - the sorted collection of PriceAdjustment instances.


---

### getProductLineItems()
- getProductLineItems(): [Collection](dw.util.Collection.md)
  - : Returns the product line items of the container that are not dependent on other product line items. This includes
      line items representing bonus products in the container but excludes option, bundled, and bonus line items. The
      returned collection is sorted by the position attribute of the product line items.


    **Returns:**
    - A sorted collection of ProductLineItem instances which are not dependent on other product line items.


---

### getProductLineItems(String)
- getProductLineItems(productID: [String](TopLevel.String.md)): [Collection](dw.util.Collection.md)
  - : Returns the product line items of the container that have a product ID equal to the specified product ID and that
      are not dependent on other product line items. This includes line items representing bonus products in the
      container, but excludes option, bundled and bonus line items. The returned collection is sorted by the position
      attribute of the product line items.


    **Parameters:**
    - productID - The Product ID used to filter the product line items.

    **Returns:**
    - A sorted collection of ProductLineItem instances which have the specified product ID and are not
              dependent on other product line items.



---

### getProductQuantities()
- getProductQuantities(): [HashMap](dw.util.HashMap.md)
  - : Returns a hash map of all products in the line item container and their total quantities. The total product
      quantity is for example used to lookup the product price.
      
      
      The method counts all direct product line items, plus dependent product line items that are not bundled line
      items and no option line items. It also excludes product line items that are not associated to any catalog
      product, and bonus product line items.


    **Returns:**
    - a map of products and their total quantities.

    **See Also:**
    - [getProductQuantities(Boolean)](dw.order.LineItemCtnr.md#getproductquantitiesboolean)


---

### getProductQuantities(Boolean)
- getProductQuantities(includeBonusProducts: [Boolean](TopLevel.Boolean.md)): [HashMap](dw.util.HashMap.md)
  - : Returns a hash map of all products in the line item container and their total quantities. The total product
      quantity is for example used to lookup the product price in the cart.
      
      
      The method counts all direct product line items, plus dependent product line items that are not bundled line
      items and no option line items. It also excludes product line items that are not associated to any catalog
      product.
      
      
      If the parameter 'includeBonusProducts' is set to true, the method also counts bonus product line items.


    **Parameters:**
    - includeBonusProducts - if true also bonus product line item are counted

    **Returns:**
    - A map of products and their total quantities.


---

### getProductQuantityTotal()
- getProductQuantityTotal(): [Number](TopLevel.Number.md)
  - : Returns the total quantity of all product line items. Not included are bundled line items and option line items.

    **Returns:**
    - The total quantity of all line items of the container.


---

### getShipment(String)
- getShipment(id: [String](TopLevel.String.md)): [Shipment](dw.order.Shipment.md)
  - : Returns the shipment for the specified ID or `null` if no shipment with this ID exists in the line
      item container. Using "me" always returns the default shipment.


    **Parameters:**
    - id - the shipment identifier

    **Returns:**
    - the shipment or `null`


---

### getShipments()
- getShipments(): [Collection](dw.util.Collection.md)
  - : Returns all shipments of the line item container.
      
      The first shipment in the returned collection is the default shipment (shipment ID always set to "me"). All other
      shipments are sorted ascending by shipment ID.


    **Returns:**
    - all shipments of the line item container


---

### getShippingPriceAdjustmentByPromotionID(String)
- getShippingPriceAdjustmentByPromotionID(promotionID: [String](TopLevel.String.md)): [PriceAdjustment](dw.order.PriceAdjustment.md)
  - : Returns the shipping price adjustment associated with the specified promotion ID.

    **Parameters:**
    - promotionID - Promotion id

    **Returns:**
    - The price adjustment associated with the specified promotion ID or null if none was found.


---

### getShippingPriceAdjustments()
- getShippingPriceAdjustments(): [Collection](dw.util.Collection.md)
  - : Returns the of shipping price adjustments applied to the shipping total of the container. Note that the
      promotions engine only applies shipping price adjustments to the the default shipping line item of shipments, and
      never to the container.


    **Returns:**
    - a collection of shipping price adjustments.

    **See Also:**
    - [getAllShippingPriceAdjustments()](dw.order.LineItemCtnr.md#getallshippingpriceadjustments)


---

### getShippingTotalGrossPrice()
- getShippingTotalGrossPrice(): [Money](dw.value.Money.md)
  - : Returns the sum of all shipping line items of the line item container, including tax before shipping adjustments
      have been applied.


    **Returns:**
    - the sum of all shipping line items of the line item container, including tax before shipping adjustments
              have been applied.



---

### getShippingTotalNetPrice()
- getShippingTotalNetPrice(): [Money](dw.value.Money.md)
  - : Returns the sum of all shipping line items of the line item container, excluding tax before shipping adjustments
      have been applied.


    **Returns:**
    - the sum of all shipping line items of the line item container, excluding tax before shipping adjustments
              have been applied.



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
  - : Returns the tax of all shipping line items of the line item container before shipping adjustments have been
      applied.


    **Returns:**
    - the tax of all shipping line items of the line item container before shipping adjustments have been
              applied.



---

### getTaxTotalsPerTaxRate()
- getTaxTotalsPerTaxRate(): [SortedMap](dw.util.SortedMap.md)
  - : This method returns a [SortedMap](dw.util.SortedMap.md) in which the keys are [Decimal](dw.util.Decimal.md) tax rates and the values
      are [Money](dw.value.Money.md) total tax for the tax rate. The map is unmodifiable.


    **Returns:**
    - sorted map of tax rate against total tax


---

### getTotalGrossPrice()
- getTotalGrossPrice(): [Money](dw.value.Money.md)
  - : Returns the grand total price gross of tax for LineItemCtnr, in purchase currency. Total prices represent the sum
      of product prices, services prices and adjustments.


    **Returns:**
    - the grand total price.


---

### getTotalNetPrice()
- getTotalNetPrice(): [Money](dw.value.Money.md)
  - : Returns the grand total price for LineItemCtnr net of tax, in purchase currency. Total prices represent the sum
      of product prices, services prices and adjustments.


    **Returns:**
    - the grand total price.


---

### getTotalTax()
- getTotalTax(): [Money](dw.value.Money.md)
  - : Returns the grand total tax for LineItemCtnr, in purchase currency. Total prices represent the sum of product
      prices, services prices and adjustments.


    **Returns:**
    - the grand total tax.


---

### isExternallyTaxed()
- isExternallyTaxed(): [Boolean](TopLevel.Boolean.md)
  - : Use this method to check whether the LineItemCtnr is calculated based on external tax tables.
      
      Note: a basket can only be created in EXTERNAL tax mode using SCAPI.


    **Returns:**
    - `true` if the LineItemCtnr was calculated based on external tax tables.


---

### isTaxRoundedAtGroup()
- isTaxRoundedAtGroup(): [Boolean](TopLevel.Boolean.md)
  - : Use this method to check if the LineItemCtnr was calculated with grouped taxation calculation.
      
      
      If the tax is rounded on group level, the tax is applied to the summed-up tax basis for each tax rate.


    **Returns:**
    - `true` if the LineItemCtnr was calculated with grouped taxation


---

### removeAllPaymentInstruments()
- removeAllPaymentInstruments(): void
  - : Removes the all Payment Instruments from this container and deletes the Payment Instruments.


---

### removeBonusDiscountLineItem(BonusDiscountLineItem)
- removeBonusDiscountLineItem(bonusDiscountLineItem: [BonusDiscountLineItem](dw.order.BonusDiscountLineItem.md)): void
  - : Removes the specified bonus discount line item from the line item container.

    **Parameters:**
    - bonusDiscountLineItem - The bonus discount line item to remove, must not be null.


---

### removeCouponLineItem(CouponLineItem)
- removeCouponLineItem(couponLineItem: [CouponLineItem](dw.order.CouponLineItem.md)): void
  - : Removes the specified coupon line item from the line item container.

    **Parameters:**
    - couponLineItem - The coupon line item to remove


---

### removeGiftCertificateLineItem(GiftCertificateLineItem)
- removeGiftCertificateLineItem(giftCertificateLineItem: [GiftCertificateLineItem](dw.order.GiftCertificateLineItem.md)): void
  - : Removes the specified gift certificate line item from the line item container.

    **Parameters:**
    - giftCertificateLineItem - The gift certificate line item to remove


---

### removeNote(Note)
- removeNote(note: [Note](dw.object.Note.md)): void
  - : Removes a note from this line item container and deletes it.

    **Parameters:**
    - note - The note to remove. Must not be null. Must belong to this line item container.


---

### removePaymentInstrument(PaymentInstrument)
- removePaymentInstrument(pi: [PaymentInstrument](dw.order.PaymentInstrument.md)): void
  - : Removes the specified Payment Instrument from this container and deletes the Payment Instrument.

    **Parameters:**
    - pi - the Payment Instrument to remove.


---

### removePriceAdjustment(PriceAdjustment)
- removePriceAdjustment(priceAdjustment: [PriceAdjustment](dw.order.PriceAdjustment.md)): void
  - : Removes the specified price adjustment line item from the line item container.

    **Parameters:**
    - priceAdjustment - The price adjustment line item to remove, must not be null.


---

### removeProductLineItem(ProductLineItem)
- removeProductLineItem(productLineItem: [ProductLineItem](dw.order.ProductLineItem.md)): void
  - : Removes the specified product line item from the line item container.

    **Parameters:**
    - productLineItem - The product line item to remove, must not be null.


---

### removeShipment(Shipment)
- removeShipment(shipment: [Shipment](dw.order.Shipment.md)): void
  - : Removes the specified shipment and all associated product, gift certificate, shipping and price adjustment line
      items from the line item container. It is not permissible to remove the default shipment.


    **Parameters:**
    - shipment - Shipment to be removed, must not be null.


---

### removeShippingPriceAdjustment(PriceAdjustment)
- removeShippingPriceAdjustment(priceAdjustment: [PriceAdjustment](dw.order.PriceAdjustment.md)): void
  - : Removes the specified shipping price adjustment line item from the line item container.

    **Parameters:**
    - priceAdjustment - The price adjustment line item to remove, must not be null.


---

### setCustomerEmail(String)
- setCustomerEmail(aValue: [String](TopLevel.String.md)): void
  - : Sets the email address of the customer associated with this container.

    **Parameters:**
    - aValue - the email address of the customer associated with this container.


---

### setCustomerName(String)
- setCustomerName(aValue: [String](TopLevel.String.md)): void
  - : Sets the name of the customer associated with this container.

    **Parameters:**
    - aValue - the name of the customer associated with this container.


---

### updateOrderLevelPriceAdjustmentTax()
- updateOrderLevelPriceAdjustmentTax(): void
  - : Calculates the tax for all shipping and order-level merchandise price adjustments in this LineItemCtnr.
      
      
      The tax on each adjustment is calculated from the taxes of the line items the adjustment applies across.
      
      
      **This method must be invoked at the end of tax calculation of a basket or an order.**



---

### updateTotals()
- updateTotals(): void
  - : Recalculates the totals of the line item container. It is necessary to call this method after any type of
      modification to the basket.



---

### verifyPriceAdjustmentLimits()
- verifyPriceAdjustmentLimits(): [Status](dw.system.Status.md)
  - : Verifies whether the manual price adjustments made for the line item container exceed the corresponding limits
      for the current user and the current site.
      
      
      The results of this method are based on the current values held in the [LineItemCtnr](dw.order.LineItemCtnr.md), such as the
      base price of manual price adjustments. It is important the method is only called after the calculation process
      has completed.
      
      
      
      
      Status.OK is returned if NONE of the manual price adjustments exceed the correspondent limits.
      
      
      Status.ERROR is returned if ANY of the manual price adjustments exceed the correspondent limits. If this case
      [Status.getItems()](dw.system.Status.md#getitems) returns all price adjustment limit violations. The code of each
      [StatusItem](dw.system.StatusItem.md) represents the violated price adjustment type (see
      [PriceAdjustmentLimitTypes](dw.order.PriceAdjustmentLimitTypes.md)). [StatusItem.getDetails()](dw.system.StatusItem.md#getdetails) returns a
      [Map](dw.util.Map.md) with the max amount and (where relevant) the item to which the violation applies.
      
      
      Usage:
      
      
      ```
      var order : Order; // known
      
      var status : Status = order.verifyPriceAdjustmentLimits();
      if (status.status == Status.ERROR)
      {
        for each (var statusItem : StatusItem in status.items)
        {
            var statusDetail : MapEntry = statusItem.details.entrySet().iterator().next();
            var maxAllowedLimit : Number = (Number) (statusDetail.key);
      
            if (statusItem.code == PriceAdjustmentLimitTypes.TYPE_ORDER)
            {
                // fix order price adjustment considering maxAllowedLimit
            }
            else if (statusItem.code == PriceAdjustmentLimitTypes.TYPE_ITEM)
            {
                var pli : ProductLineItem = (ProductLineItem) (statusDetail.value);
                // fix pli price adjustment considering maxAllowedLimit
            }
            else if (statusItem.code == PriceAdjustmentLimitTypes.TYPE_SHIPPING)
            {
                if (statusDetail.value == null)
                {
                    // fix order level shipping price adjustment considering maxAllowedLimit
                }
                else
                {
                    var sli : ShippingLineItem = (ShippingLineItem) (statusDetail.value);
                    // fix sli price adjustment considering maxAllowedLimit
                }
            }
        }
      }
      ```


    **Returns:**
    - a Status instance with - Status.OK if all manual price adjustments do not exceed the correspondent
              limits, otherwise Status.ERROR



---

<!-- prettier-ignore-end -->
