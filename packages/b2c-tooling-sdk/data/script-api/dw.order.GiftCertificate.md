<!-- prettier-ignore-start -->
# Class GiftCertificate

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)
      - [dw.order.GiftCertificate](dw.order.GiftCertificate.md)

Represents a Gift Certificate that can be used to purchase
products.



## Constant Summary

| Constant | Description |
| --- | --- |
| [STATUS_ISSUED](#status_issued): [Number](TopLevel.Number.md) = 1 | Represents a status of 'issued', which indicates that the Gift Certificate  has been created and that it can be used to purchase products. |
| [STATUS_PARTIALLY_REDEEMED](#status_partially_redeemed): [Number](TopLevel.Number.md) = 2 | Represents a status of 'partially redeemed', which indicates that the Gift Certificate  has been used to purchase products, but that there is still a balance on  the gift certificate. |
| [STATUS_PENDING](#status_pending): [Number](TopLevel.Number.md) = 0 | Represents a status of 'pending', which indicates that the Gift Certificate  has been created but that it cannot be used yet. |
| [STATUS_REDEEMED](#status_redeemed): [Number](TopLevel.Number.md) = 3 | Represents a status of 'redeemed', which indicates that the Gift Certificate  has been used and no longer contains a balance. |

## Property Summary

| Property | Description |
| --- | --- |
| ~~[ID](#id): [String](TopLevel.String.md)~~ `(read-only)` | Returns the code of the gift certificate. |
| [amount](#amount): [Money](dw.value.Money.md) `(read-only)` | Returns the original amount on the gift certificate. |
| [balance](#balance): [Money](dw.value.Money.md) `(read-only)` | Returns the balance on the gift certificate. |
| [description](#description): [String](TopLevel.String.md) | Returns the description string. |
| [enabled](#enabled): [Boolean](TopLevel.Boolean.md) | Returns true if the Gift Certificate is enabled, false otherwise. |
| [giftCertificateCode](#giftcertificatecode): [String](TopLevel.String.md) `(read-only)` | Returns the code of the gift certificate. |
| [maskedGiftCertificateCode](#maskedgiftcertificatecode): [String](TopLevel.String.md) `(read-only)` | Returns the masked gift certificate code with  all but the last 4 characters replaced with a '\*' character. |
| [merchantID](#merchantid): [String](TopLevel.String.md) `(read-only)` | Returns the merchant ID of the gift certificate. |
| [message](#message): [String](TopLevel.String.md) | Returns the message to include in the email of the person receiving  the gift certificate. |
| [orderNo](#orderno): [String](TopLevel.String.md) | Returns the order number |
| [recipientEmail](#recipientemail): [String](TopLevel.String.md) | Returns the email address of the person receiving  the gift certificate. |
| [recipientName](#recipientname): [String](TopLevel.String.md) | Returns the name of the person receiving  the gift certificate. |
| [senderName](#sendername): [String](TopLevel.String.md) | Returns the name of the person or organization that  sent the gift certificate or null if undefined. |
| [status](#status): [Number](TopLevel.Number.md) | Returns the status where the possible values are  STATUS\_PENDING, STATUS\_ISSUED, STATUS\_PARTIALLY\_REDEEMED  or STATUS\_REDEEMED. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getAmount](dw.order.GiftCertificate.md#getamount)() | Returns the original amount on the gift certificate. |
| [getBalance](dw.order.GiftCertificate.md#getbalance)() | Returns the balance on the gift certificate. |
| [getDescription](dw.order.GiftCertificate.md#getdescription)() | Returns the description string. |
| [getGiftCertificateCode](dw.order.GiftCertificate.md#getgiftcertificatecode)() | Returns the code of the gift certificate. |
| ~~[getID](dw.order.GiftCertificate.md#getid)()~~ | Returns the code of the gift certificate. |
| [getMaskedGiftCertificateCode](dw.order.GiftCertificate.md#getmaskedgiftcertificatecode)() | Returns the masked gift certificate code with  all but the last 4 characters replaced with a '\*' character. |
| [getMaskedGiftCertificateCode](dw.order.GiftCertificate.md#getmaskedgiftcertificatecodenumber)([Number](TopLevel.Number.md)) | Returns the masked gift certificate code with  all but the specified number of characters replaced with a '\*' character. |
| [getMerchantID](dw.order.GiftCertificate.md#getmerchantid)() | Returns the merchant ID of the gift certificate. |
| [getMessage](dw.order.GiftCertificate.md#getmessage)() | Returns the message to include in the email of the person receiving  the gift certificate. |
| [getOrderNo](dw.order.GiftCertificate.md#getorderno)() | Returns the order number |
| [getRecipientEmail](dw.order.GiftCertificate.md#getrecipientemail)() | Returns the email address of the person receiving  the gift certificate. |
| [getRecipientName](dw.order.GiftCertificate.md#getrecipientname)() | Returns the name of the person receiving  the gift certificate. |
| [getSenderName](dw.order.GiftCertificate.md#getsendername)() | Returns the name of the person or organization that  sent the gift certificate or null if undefined. |
| [getStatus](dw.order.GiftCertificate.md#getstatus)() | Returns the status where the possible values are  STATUS\_PENDING, STATUS\_ISSUED, STATUS\_PARTIALLY\_REDEEMED  or STATUS\_REDEEMED. |
| [isEnabled](dw.order.GiftCertificate.md#isenabled)() | Returns true if the Gift Certificate is enabled, false otherwise. |
| [setDescription](dw.order.GiftCertificate.md#setdescriptionstring)([String](TopLevel.String.md)) | An optional description that you can use to categorize the  gift certificate. |
| [setEnabled](dw.order.GiftCertificate.md#setenabledboolean)([Boolean](TopLevel.Boolean.md)) | Controls if the Gift Certificate is enabled. |
| [setMessage](dw.order.GiftCertificate.md#setmessagestring)([String](TopLevel.String.md)) | Sets the message to include in the email of the person receiving  the gift certificate. |
| [setOrderNo](dw.order.GiftCertificate.md#setordernostring)([String](TopLevel.String.md)) | Sets the order number |
| [setRecipientEmail](dw.order.GiftCertificate.md#setrecipientemailstring)([String](TopLevel.String.md)) | Sets the email address of the person receiving  the gift certificate. |
| [setRecipientName](dw.order.GiftCertificate.md#setrecipientnamestring)([String](TopLevel.String.md)) | Sets the name of the person receiving  the gift certificate. |
| [setSenderName](dw.order.GiftCertificate.md#setsendernamestring)([String](TopLevel.String.md)) | Sets the name of the person or organization that  sent the gift certificate. |
| [setStatus](dw.order.GiftCertificate.md#setstatusnumber)([Number](TopLevel.Number.md)) | Sets the status of the gift certificate. |

### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### STATUS_ISSUED

- STATUS_ISSUED: [Number](TopLevel.Number.md) = 1
  - : Represents a status of 'issued', which indicates that the Gift Certificate
      has been created and that it can be used to purchase products.



---

### STATUS_PARTIALLY_REDEEMED

- STATUS_PARTIALLY_REDEEMED: [Number](TopLevel.Number.md) = 2
  - : Represents a status of 'partially redeemed', which indicates that the Gift Certificate
      has been used to purchase products, but that there is still a balance on
      the gift certificate.



---

### STATUS_PENDING

- STATUS_PENDING: [Number](TopLevel.Number.md) = 0
  - : Represents a status of 'pending', which indicates that the Gift Certificate
      has been created but that it cannot be used yet.



---

### STATUS_REDEEMED

- STATUS_REDEEMED: [Number](TopLevel.Number.md) = 3
  - : Represents a status of 'redeemed', which indicates that the Gift Certificate
      has been used and no longer contains a balance.



---

## Property Details

### ID
- ~~ID: [String](TopLevel.String.md)~~ `(read-only)`
  - : Returns the code of the gift certificate. This redemption code is send to
      gift certificate recipient.


    **Deprecated:**
:::warning
Use [getGiftCertificateCode()](dw.order.GiftCertificate.md#getgiftcertificatecode)
:::

---

### amount
- amount: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the original amount on the gift certificate.


---

### balance
- balance: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the balance on the gift certificate.


---

### description
- description: [String](TopLevel.String.md)
  - : Returns the description string.


---

### enabled
- enabled: [Boolean](TopLevel.Boolean.md)
  - : Returns true if the Gift Certificate is enabled, false otherwise.


---

### giftCertificateCode
- giftCertificateCode: [String](TopLevel.String.md) `(read-only)`
  - : Returns the code of the gift certificate. This redemption code is send to
      gift certificate recipient.



---

### maskedGiftCertificateCode
- maskedGiftCertificateCode: [String](TopLevel.String.md) `(read-only)`
  - : Returns the masked gift certificate code with
      all but the last 4 characters replaced with a '\*' character.



---

### merchantID
- merchantID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the merchant ID of the gift certificate.


---

### message
- message: [String](TopLevel.String.md)
  - : Returns the message to include in the email of the person receiving
      the gift certificate.



---

### orderNo
- orderNo: [String](TopLevel.String.md)
  - : Returns the order number


---

### recipientEmail
- recipientEmail: [String](TopLevel.String.md)
  - : Returns the email address of the person receiving
      the gift certificate.



---

### recipientName
- recipientName: [String](TopLevel.String.md)
  - : Returns the name of the person receiving
      the gift certificate.



---

### senderName
- senderName: [String](TopLevel.String.md)
  - : Returns the name of the person or organization that
      sent the gift certificate or null if undefined.



---

### status
- status: [Number](TopLevel.Number.md)
  - : Returns the status where the possible values are
      STATUS\_PENDING, STATUS\_ISSUED, STATUS\_PARTIALLY\_REDEEMED
      or STATUS\_REDEEMED.



---

## Method Details

### getAmount()
- getAmount(): [Money](dw.value.Money.md)
  - : Returns the original amount on the gift certificate.

    **Returns:**
    - the original amount on the gift certificate.


---

### getBalance()
- getBalance(): [Money](dw.value.Money.md)
  - : Returns the balance on the gift certificate.

    **Returns:**
    - the balance on the gift certificate.


---

### getDescription()
- getDescription(): [String](TopLevel.String.md)
  - : Returns the description string.

    **Returns:**
    - the description.


---

### getGiftCertificateCode()
- getGiftCertificateCode(): [String](TopLevel.String.md)
  - : Returns the code of the gift certificate. This redemption code is send to
      gift certificate recipient.


    **Returns:**
    - the code of the gift certificate.


---

### getID()
- ~~getID(): [String](TopLevel.String.md)~~
  - : Returns the code of the gift certificate. This redemption code is send to
      gift certificate recipient.


    **Returns:**
    - the code of the gift certificate.

    **Deprecated:**
:::warning
Use [getGiftCertificateCode()](dw.order.GiftCertificate.md#getgiftcertificatecode)
:::

---

### getMaskedGiftCertificateCode()
- getMaskedGiftCertificateCode(): [String](TopLevel.String.md)
  - : Returns the masked gift certificate code with
      all but the last 4 characters replaced with a '\*' character.


    **Returns:**
    - the masked gift certificate code.


---

### getMaskedGiftCertificateCode(Number)
- getMaskedGiftCertificateCode(ignore: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Returns the masked gift certificate code with
      all but the specified number of characters replaced with a '\*' character.


    **Parameters:**
    - ignore - the number of characters to leave unmasked.

    **Returns:**
    - the masked gift certificate code.

    **Throws:**
    - IllegalArgumentException - if ignore is negative.


---

### getMerchantID()
- getMerchantID(): [String](TopLevel.String.md)
  - : Returns the merchant ID of the gift certificate.

    **Returns:**
    - the merchant ID of the gift certificate.


---

### getMessage()
- getMessage(): [String](TopLevel.String.md)
  - : Returns the message to include in the email of the person receiving
      the gift certificate.


    **Returns:**
    - the message to include in the email of the person receiving
      the gift certificate.



---

### getOrderNo()
- getOrderNo(): [String](TopLevel.String.md)
  - : Returns the order number

    **Returns:**
    - the order number


---

### getRecipientEmail()
- getRecipientEmail(): [String](TopLevel.String.md)
  - : Returns the email address of the person receiving
      the gift certificate.


    **Returns:**
    - the email address of the person receiving
      the gift certificate.



---

### getRecipientName()
- getRecipientName(): [String](TopLevel.String.md)
  - : Returns the name of the person receiving
      the gift certificate.


    **Returns:**
    - the name of the person receiving
      the gift certificate.



---

### getSenderName()
- getSenderName(): [String](TopLevel.String.md)
  - : Returns the name of the person or organization that
      sent the gift certificate or null if undefined.


    **Returns:**
    - the name of the person or organization that
      sent the gift certificate or null if undefined.



---

### getStatus()
- getStatus(): [Number](TopLevel.Number.md)
  - : Returns the status where the possible values are
      STATUS\_PENDING, STATUS\_ISSUED, STATUS\_PARTIALLY\_REDEEMED
      or STATUS\_REDEEMED.


    **Returns:**
    - the status.


---

### isEnabled()
- isEnabled(): [Boolean](TopLevel.Boolean.md)
  - : Returns true if the Gift Certificate is enabled, false otherwise.

    **Returns:**
    - true if the Gift Certificate is enabled, false otherwise.


---

### setDescription(String)
- setDescription(description: [String](TopLevel.String.md)): void
  - : An optional description that you can use to categorize the
      gift certificate.


    **Parameters:**
    - description - additional description.


---

### setEnabled(Boolean)
- setEnabled(enabled: [Boolean](TopLevel.Boolean.md)): void
  - : Controls if the Gift Certificate is enabled.

    **Parameters:**
    - enabled - if true, enables the Gift Certificate.


---

### setMessage(String)
- setMessage(message: [String](TopLevel.String.md)): void
  - : Sets the message to include in the email of the person receiving
      the gift certificate.


    **Parameters:**
    - message - the message to include in the email of the person receiving  the gift certificate.


---

### setOrderNo(String)
- setOrderNo(orderNo: [String](TopLevel.String.md)): void
  - : Sets the order number

    **Parameters:**
    - orderNo - the order number to be set


---

### setRecipientEmail(String)
- setRecipientEmail(recipientEmail: [String](TopLevel.String.md)): void
  - : Sets the email address of the person receiving
      the gift certificate.


    **Parameters:**
    - recipientEmail - the email address of the person receiving  the gift certificate.


---

### setRecipientName(String)
- setRecipientName(recipient: [String](TopLevel.String.md)): void
  - : Sets the name of the person receiving
      the gift certificate.


    **Parameters:**
    - recipient - the name of the person receiving  the gift certificate.


---

### setSenderName(String)
- setSenderName(sender: [String](TopLevel.String.md)): void
  - : Sets the name of the person or organization that
      sent the gift certificate.


    **Parameters:**
    - sender - the name of the person or organization that  sent the gift certificate.


---

### setStatus(Number)
- setStatus(status: [Number](TopLevel.Number.md)): void
  - : Sets the status of the gift certificate. 
      
      Possible values are: [STATUS_ISSUED](dw.order.GiftCertificate.md#status_issued),
      [STATUS_PENDING](dw.order.GiftCertificate.md#status_pending), [STATUS_PARTIALLY_REDEEMED](dw.order.GiftCertificate.md#status_partially_redeemed)
      and [STATUS_REDEEMED](dw.order.GiftCertificate.md#status_redeemed).


    **Parameters:**
    - status - Gift certificate status


---

<!-- prettier-ignore-end -->
