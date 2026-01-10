<!-- prettier-ignore-start -->
# Class GiftCertificateLineItem

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)
      - [dw.order.LineItem](dw.order.LineItem.md)
        - [dw.order.GiftCertificateLineItem](dw.order.GiftCertificateLineItem.md)

Represents a Gift Certificate line item in the cart. When an order is
processed, a Gift Certificate is created based on the information in
the Gift Certificate line item.



## Property Summary

| Property | Description |
| --- | --- |
| [giftCertificateID](#giftcertificateid): [String](TopLevel.String.md) | Returns the ID of the gift certificate that this line item  was used to create. |
| [message](#message): [String](TopLevel.String.md) | Returns the message to include in the email of the person receiving  the gift certificate line item. |
| [productListItem](#productlistitem): [ProductListItem](dw.customer.ProductListItem.md) | Returns the associated ProductListItem. |
| [recipientEmail](#recipientemail): [String](TopLevel.String.md) | Returns the email address of the person receiving  the gift certificate line item. |
| [recipientName](#recipientname): [String](TopLevel.String.md) | Returns the name of the person receiving the gift certificate line item. |
| [senderName](#sendername): [String](TopLevel.String.md) | Returns the name of the person or organization that  sent the gift certificate line item or null if undefined. |
| [shipment](#shipment): [Shipment](dw.order.Shipment.md) | Returns the associated Shipment. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getGiftCertificateID](dw.order.GiftCertificateLineItem.md#getgiftcertificateid)() | Returns the ID of the gift certificate that this line item  was used to create. |
| [getMessage](dw.order.GiftCertificateLineItem.md#getmessage)() | Returns the message to include in the email of the person receiving  the gift certificate line item. |
| [getProductListItem](dw.order.GiftCertificateLineItem.md#getproductlistitem)() | Returns the associated ProductListItem. |
| [getRecipientEmail](dw.order.GiftCertificateLineItem.md#getrecipientemail)() | Returns the email address of the person receiving  the gift certificate line item. |
| [getRecipientName](dw.order.GiftCertificateLineItem.md#getrecipientname)() | Returns the name of the person receiving the gift certificate line item. |
| [getSenderName](dw.order.GiftCertificateLineItem.md#getsendername)() | Returns the name of the person or organization that  sent the gift certificate line item or null if undefined. |
| [getShipment](dw.order.GiftCertificateLineItem.md#getshipment)() | Returns the associated Shipment. |
| [setGiftCertificateID](dw.order.GiftCertificateLineItem.md#setgiftcertificateidstring)([String](TopLevel.String.md)) | Sets the ID of the gift certificate associated with this line item. |
| [setMessage](dw.order.GiftCertificateLineItem.md#setmessagestring)([String](TopLevel.String.md)) | Sets the message to include in the email of the person receiving  the gift certificate line item. |
| [setProductListItem](dw.order.GiftCertificateLineItem.md#setproductlistitemproductlistitem)([ProductListItem](dw.customer.ProductListItem.md)) | Sets the associated ProductListItem. |
| [setRecipientEmail](dw.order.GiftCertificateLineItem.md#setrecipientemailstring)([String](TopLevel.String.md)) | Sets the email address of the person receiving  the gift certificate line item. |
| [setRecipientName](dw.order.GiftCertificateLineItem.md#setrecipientnamestring)([String](TopLevel.String.md)) | Sets the name of the person receiving the gift certificate line item. |
| [setSenderName](dw.order.GiftCertificateLineItem.md#setsendernamestring)([String](TopLevel.String.md)) | Sets the name of the person or organization that  sent the gift certificate line item. |
| [setShipment](dw.order.GiftCertificateLineItem.md#setshipmentshipment)([Shipment](dw.order.Shipment.md)) | Associates the gift certificate line item with the specified shipment. |

### Methods inherited from class LineItem

[getBasePrice](dw.order.LineItem.md#getbaseprice), [getGrossPrice](dw.order.LineItem.md#getgrossprice), [getLineItemCtnr](dw.order.LineItem.md#getlineitemctnr), [getLineItemText](dw.order.LineItem.md#getlineitemtext), [getNetPrice](dw.order.LineItem.md#getnetprice), [getPrice](dw.order.LineItem.md#getprice), [getPriceValue](dw.order.LineItem.md#getpricevalue), [getTax](dw.order.LineItem.md#gettax), [getTaxBasis](dw.order.LineItem.md#gettaxbasis), [getTaxClassID](dw.order.LineItem.md#gettaxclassid), [getTaxRate](dw.order.LineItem.md#gettaxrate), [setBasePrice](dw.order.LineItem.md#setbasepricemoney), [setGrossPrice](dw.order.LineItem.md#setgrosspricemoney), [setLineItemText](dw.order.LineItem.md#setlineitemtextstring), [setNetPrice](dw.order.LineItem.md#setnetpricemoney), [setPriceValue](dw.order.LineItem.md#setpricevaluenumber), [setTax](dw.order.LineItem.md#settaxmoney), [setTaxClassID](dw.order.LineItem.md#settaxclassidstring), [setTaxRate](dw.order.LineItem.md#settaxratenumber), [updatePrice](dw.order.LineItem.md#updatepricemoney), [updateTax](dw.order.LineItem.md#updatetaxnumber), [updateTax](dw.order.LineItem.md#updatetaxnumber-money), [updateTaxAmount](dw.order.LineItem.md#updatetaxamountmoney)
### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### giftCertificateID
- giftCertificateID: [String](TopLevel.String.md)
  - : Returns the ID of the gift certificate that this line item
      was used to create. If this line item has not been used to create
      a Gift Certificate, this method returns null.



---

### message
- message: [String](TopLevel.String.md)
  - : Returns the message to include in the email of the person receiving
      the gift certificate line item.



---

### productListItem
- productListItem: [ProductListItem](dw.customer.ProductListItem.md)
  - : Returns the associated ProductListItem.


---

### recipientEmail
- recipientEmail: [String](TopLevel.String.md)
  - : Returns the email address of the person receiving
      the gift certificate line item.



---

### recipientName
- recipientName: [String](TopLevel.String.md)
  - : Returns the name of the person receiving the gift certificate line item.


---

### senderName
- senderName: [String](TopLevel.String.md)
  - : Returns the name of the person or organization that
      sent the gift certificate line item or null if undefined.



---

### shipment
- shipment: [Shipment](dw.order.Shipment.md)
  - : Returns the associated Shipment.


---

## Method Details

### getGiftCertificateID()
- getGiftCertificateID(): [String](TopLevel.String.md)
  - : Returns the ID of the gift certificate that this line item
      was used to create. If this line item has not been used to create
      a Gift Certificate, this method returns null.


    **Returns:**
    - the ID of the gift certificate or null if undefined.


---

### getMessage()
- getMessage(): [String](TopLevel.String.md)
  - : Returns the message to include in the email of the person receiving
      the gift certificate line item.


    **Returns:**
    - the message to include in the email of the person receiving
      the gift certificate line item.



---

### getProductListItem()
- getProductListItem(): [ProductListItem](dw.customer.ProductListItem.md)
  - : Returns the associated ProductListItem.

    **Returns:**
    - item or null.


---

### getRecipientEmail()
- getRecipientEmail(): [String](TopLevel.String.md)
  - : Returns the email address of the person receiving
      the gift certificate line item.


    **Returns:**
    - the email address of the person receiving
      the gift certificate line item.



---

### getRecipientName()
- getRecipientName(): [String](TopLevel.String.md)
  - : Returns the name of the person receiving the gift certificate line item.

    **Returns:**
    - the name of the person receiving the gift certificate line item.


---

### getSenderName()
- getSenderName(): [String](TopLevel.String.md)
  - : Returns the name of the person or organization that
      sent the gift certificate line item or null if undefined.


    **Returns:**
    - the name of the person or organization that
      sent the gift certificate line item or null if undefined.



---

### getShipment()
- getShipment(): [Shipment](dw.order.Shipment.md)
  - : Returns the associated Shipment.

    **Returns:**
    - The shipment of the gift certificate line item


---

### setGiftCertificateID(String)
- setGiftCertificateID(id: [String](TopLevel.String.md)): void
  - : Sets the ID of the gift certificate associated with this line item.

    **Parameters:**
    - id - the ID of the gift certificate associated with this line item.


---

### setMessage(String)
- setMessage(message: [String](TopLevel.String.md)): void
  - : Sets the message to include in the email of the person receiving
      the gift certificate line item.


    **Parameters:**
    - message - the message to include in the email of the person receiving  the gift certificate line item.


---

### setProductListItem(ProductListItem)
- setProductListItem(productListItem: [ProductListItem](dw.customer.ProductListItem.md)): void
  - : Sets the associated ProductListItem.
      
      
      The product list item to be set must be of type gift certificate otherwise an exception is thrown.


    **Parameters:**
    - productListItem - the product list item to be associated


---

### setRecipientEmail(String)
- setRecipientEmail(recipientEmail: [String](TopLevel.String.md)): void
  - : Sets the email address of the person receiving
      the gift certificate line item.


    **Parameters:**
    - recipientEmail - the email address of the person receiving  the gift certificate line item.


---

### setRecipientName(String)
- setRecipientName(recipient: [String](TopLevel.String.md)): void
  - : Sets the name of the person receiving the gift certificate line item.

    **Parameters:**
    - recipient - the name of the person receiving the gift certificate line item.


---

### setSenderName(String)
- setSenderName(sender: [String](TopLevel.String.md)): void
  - : Sets the name of the person or organization that
      sent the gift certificate line item.


    **Parameters:**
    - sender - the name of the person or organization that  sent the gift certificate line item.


---

### setShipment(Shipment)
- setShipment(shipment: [Shipment](dw.order.Shipment.md)): void
  - : Associates the gift certificate line item with the specified shipment. 
      
       Gift certificate line item and shipment must belong to the same line item ctnr.


    **Parameters:**
    - shipment - The new shipment of the gift certificate line item


---

<!-- prettier-ignore-end -->
