# Package dw.order

## Classes
| Class | Description |
| --- | --- |
| [AbstractItem](dw.order.AbstractItem.md) | An item which references, or in other words is based upon, an [OrderItem](dw.order.OrderItem.md). |
| [AbstractItemCtnr](dw.order.AbstractItemCtnr.md) | Basis for item-based objects stemming from a single [Order](dw.order.Order.md), with these common  properties (Invoice is used as an example):   <ul>  <li>  The object has been created from an Order accessible using [getOrder()](dw.order.AbstractItemCtnr.md#getorder)</li>  <li>Contains a collection of [items](dw.order.AbstractItemCtnr.md#getitems), each item related to exactly one [OrderItem](dw.order.OrderItem.md) which in turn represents  an extension to one of the order [ProductLineItem](dw.order.ProductLineItem.md) or one [ShippingLineItem](dw.order.ShippingLineItem.md). |
| [Appeasement](dw.order.Appeasement.md) | The Appeasement represents a shopper request for an order credit.<br/>  Example: The buyer finds any problem with the products but he agrees to preserve them, if he would be compensated,  rather than return them.<br/>  <br/>  The Appeasement contains 1..n appeasement items. |
| [AppeasementItem](dw.order.AppeasementItem.md) | Represents an item of an [Appeasement](dw.order.Appeasement.md) which is associated with one [OrderItem](dw.order.OrderItem.md) usually representing an [Order](dw.order.Order.md)  [ProductLineItem](dw.order.ProductLineItem.md). |
| [Basket](dw.order.Basket.md) | The Basket class represents a shopping cart. |
| [BasketMgr](dw.order.BasketMgr.md) | Provides static helper methods for managing baskets. |
| [BonusDiscountLineItem](dw.order.BonusDiscountLineItem.md) | Line item representing an applied [BonusChoiceDiscount](dw.campaign.BonusChoiceDiscount.md) in a LineItemCtnr. |
| [CouponLineItem](dw.order.CouponLineItem.md) | The CouponLineItem class is used to store redeemed coupons in the Basket. |
| [CreateAgentBasketLimitExceededException](dw.order.CreateAgentBasketLimitExceededException.md) | This exception is thrown by [BasketMgr.createAgentBasket()](dw.order.BasketMgr.md#createagentbasket) to indicate that the open agent basket limit for  the current session customer is already reached, and therefore no new agent basket could be created. |
| [CreateBasketFromOrderException](dw.order.CreateBasketFromOrderException.md) | This APIException is thrown by method [BasketMgr.createBasketFromOrder(Order)](dw.order.BasketMgr.md#createbasketfromorderorder)  to indicate no Basket could be created from the Order. |
| [CreateCouponLineItemException](dw.order.CreateCouponLineItemException.md) | This exception could be thrown by [LineItemCtnr.createCouponLineItem(String, Boolean)](dw.order.LineItemCtnr.md#createcouponlineitemstring-boolean)  when the provided coupon code is invalid. |
| [CreateOrderException](dw.order.CreateOrderException.md) | This APIException is thrown by method [OrderMgr.createOrder(Basket, String)](dw.order.OrderMgr.md#createorderbasket-string)  to indicate no Order could be created from the Basket. |
| [CreateTemporaryBasketLimitExceededException](dw.order.CreateTemporaryBasketLimitExceededException.md) | This exception is thrown by [BasketMgr.createTemporaryBasket()](dw.order.BasketMgr.md#createtemporarybasket) to indicate that the open temporary basket  limit for the current session customer is already reached, and therefore no new temporary basket could be created. |
| [GiftCertificate](dw.order.GiftCertificate.md) | Represents a Gift Certificate that can be used to purchase  products. |
| [GiftCertificateLineItem](dw.order.GiftCertificateLineItem.md) | Represents a Gift Certificate line item in the cart. |
| [GiftCertificateMgr](dw.order.GiftCertificateMgr.md) | The GiftCertificateMgr class contains a set of static methods for  interacting with GiftCertificates. |
| [GiftCertificateStatusCodes](dw.order.GiftCertificateStatusCodes.md) | Helper class containing status codes for the various errors that can occur  when redeeming a gift certificate. |
| [Invoice](dw.order.Invoice.md) | The Invoice can be a debit or credit invoice, and is created  from custom scripts using one of the methods  [ShippingOrder.createInvoice(String)](dw.order.ShippingOrder.md#createinvoicestring),  [Appeasement.createInvoice(String)](dw.order.Appeasement.md#createinvoicestring),  [ReturnCase.createInvoice(String)](dw.order.ReturnCase.md#createinvoicestring) or  [Return.createInvoice(String)](dw.order.Return.md#createinvoicestring). |
| [InvoiceItem](dw.order.InvoiceItem.md) | Represents a specific item in an [Invoice](dw.order.Invoice.md). |
| [LineItem](dw.order.LineItem.md) | Common line item base class. |
| [LineItemCtnr](dw.order.LineItemCtnr.md) | A container for line items, such as ProductLineItems, CouponLineItems, GiftCertificateLineItems. |
| [Order](dw.order.Order.md) | The Order class represents an order. |
| [OrderAddress](dw.order.OrderAddress.md) | The Address class represents a customer's address. |
| [OrderItem](dw.order.OrderItem.md) | Defines _extensions_ to [ProductLineItem](dw.order.ProductLineItem.md)s and  [ShippingLineItem](dw.order.ShippingLineItem.md)s belonging to an [order](dw.order.Order.md). |
| [OrderMgr](dw.order.OrderMgr.md) | <p>  Provides static helper methods for managing orders. |
| [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md) | Represents any payment instrument used to pay orders, such as credit card  or bank transfer. |
| [OrderProcessStatusCodes](dw.order.OrderProcessStatusCodes.md) | Contains constants representing different status codes  for interacting with an order, such as cancelling  or editing an order. |
| [PaymentCard](dw.order.PaymentCard.md) | Represents payment cards and provides methods to access the payment card  attributes and status. |
| [PaymentInstrument](dw.order.PaymentInstrument.md) | Base class for payment instrument either stored in the customers profile  or related to an order. |
| [PaymentMethod](dw.order.PaymentMethod.md) | The PaymentMethod class represents a logical type of payment a customer can  make in the storefront. |
| [PaymentMgr](dw.order.PaymentMgr.md) | [PaymentMgr](dw.order.PaymentMgr.md) is used to access payment methods and payment  cards of the current site. |
| [PaymentProcessor](dw.order.PaymentProcessor.md) | A PaymentProcessor represents an entity that processes payments of one or more types. |
| [PaymentStatusCodes](dw.order.PaymentStatusCodes.md) | Helper class containing status codes for the various errors that can occur  when validating a payment card. |
| [PaymentTransaction](dw.order.PaymentTransaction.md) | The PaymentTransaction class represents a payment transaction. |
| [PriceAdjustment](dw.order.PriceAdjustment.md) | The PriceAdjustment class represents an adjustment to the price of an order. |
| [PriceAdjustmentLimitTypes](dw.order.PriceAdjustmentLimitTypes.md) | Helper class containing price adjustment limit types. |
| [ProductLineItem](dw.order.ProductLineItem.md) | Represents a specific product line item. |
| [ProductShippingCost](dw.order.ProductShippingCost.md) | Instances of ProductShippingCost represent product specific shipping costs. |
| [ProductShippingLineItem](dw.order.ProductShippingLineItem.md) | Represents a specific line item in a shipment. |
| [ProductShippingModel](dw.order.ProductShippingModel.md) | Instances of ProductShippingModel provide access to product-level  shipping information, such as applicable or inapplicable shipping methods  and shipping cost defined for the product for a specified shipping  method. |
| [Return](dw.order.Return.md) | The Return represents a physical customer return, and contains 1..n  [ReturnItem](dw.order.ReturnItem.md)s. |
| [ReturnCase](dw.order.ReturnCase.md) | All returns exist in the context of a ReturnCase, each [Order](dw.order.Order.md)  can have any number of ReturnCases. |
| [ReturnCaseItem](dw.order.ReturnCaseItem.md) | An item of a [ReturnCase](dw.order.ReturnCase.md), created using method  [ReturnCase.createItem(String)](dw.order.ReturnCase.md#createitemstring). |
| [ReturnItem](dw.order.ReturnItem.md) | An item of a [Return](dw.order.Return.md), created using [Return.createItem(String)](dw.order.Return.md#createitemstring). |
| [Shipment](dw.order.Shipment.md) | Represents an order shipment. |
| [ShipmentShippingCost](dw.order.ShipmentShippingCost.md) | Represents shipping cost applied to shipments. |
| [ShipmentShippingModel](dw.order.ShipmentShippingModel.md) | Instances of ShipmentShippingModel provide access to shipment-level  shipping information, such as applicable and inapplicable shipping methods  and shipping cost. |
| [ShippingLineItem](dw.order.ShippingLineItem.md) | Represents a specific line item in a shipment. |
| [ShippingLocation](dw.order.ShippingLocation.md) | Represents a specific location for a shipment. |
| [ShippingMethod](dw.order.ShippingMethod.md) | ShippingMethod represents how the shipment will be shipped. |
| [ShippingMgr](dw.order.ShippingMgr.md) | Provides methods to access the shipping information. |
| [ShippingOrder](dw.order.ShippingOrder.md) | A shipping order is used to specify items that should be shipped, and is  typically exported to, and updated by a back-office warehouse management  system. |
| [ShippingOrderItem](dw.order.ShippingOrderItem.md) | One or more ShippingOrderItems are contained in a  [ShippingOrder](dw.order.ShippingOrder.md), created using  [ShippingOrder.createShippingOrderItem(OrderItem, Quantity)](dw.order.ShippingOrder.md#createshippingorderitemorderitem-quantity)  and can be retrieved by  [ShippingOrder.getItems()](dw.order.ShippingOrder.md#getitems). |
| [SumItem](dw.order.SumItem.md) | Container used to represent an subtotal or grandtotal item which contains various prices and a tax breakdown  held in a collection of tax-items. |
| [TaxGroup](dw.order.TaxGroup.md) | Contains the formal definition of a tax including a type (it's just the key), a [percentage value](dw.order.TaxGroup.md#getrate)  if provided, a [caption](dw.order.TaxGroup.md#getcaption) and a [description](dw.order.TaxGroup.md#getdescription). |
| [TaxItem](dw.order.TaxItem.md) | An item containing tax information allowing a tax breakdown between a number of [TaxGroup](dw.order.TaxGroup.md)s. |
| [TaxMgr](dw.order.TaxMgr.md) | Provides methods to access the tax table. |
| [TrackingInfo](dw.order.TrackingInfo.md) | Provides basic information about a tracking info. |
| [TrackingRef](dw.order.TrackingRef.md) | Provides basic information about the [TrackingInfo](dw.order.TrackingInfo.md) a  [ShippingOrderItem](dw.order.ShippingOrderItem.md) is contained. |
