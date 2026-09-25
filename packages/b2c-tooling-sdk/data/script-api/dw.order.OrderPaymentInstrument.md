<!-- prettier-ignore-start -->
# Class OrderPaymentInstrument

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)
      - [dw.customer.EncryptedObject](dw.customer.EncryptedObject.md)
        - [dw.order.PaymentInstrument](dw.order.PaymentInstrument.md)
          - [dw.order.OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md)

Represents any payment instrument used to pay orders, such as credit card
or bank transfer. The object defines standard methods for credit card
payment, and can be extended by attributes appropriate for other
payment methods.



## Property Summary

| Property | Description |
| --- | --- |
| [bankAccountDriversLicense](#bankaccountdriverslicense): [String](TopLevel.String.md) `(read-only)` | Returns the driver's license associated with a bank account if the calling  context meets the following criteria: <br/>  <ul>  <li>  If the method call happens in the context of a storefront request and  the current customer is identical to the customer related to the basket  or order, and the current protocol is HTTPS. |
| [bankAccountNumber](#bankaccountnumber): [String](TopLevel.String.md) `(read-only)` | Returns the account number if the calling context meets  the following criteria: <br/>  <ul>  <li>  If the method call happens in the context of a storefront request and  the current customer is identical to the customer related to the basket  or order, and the current protocol is HTTPS. |
| [capturedAmount](#capturedamount): [Money](dw.value.Money.md) `(read-only)` | Returns the sum of the captured amounts. |
| [creditCardNumber](#creditcardnumber): [String](TopLevel.String.md) `(read-only)` | Returns the de-crypted creditcard number if the calling context meets  the following criteria: <br/>  <ul>  <li>  If the method call happens in the context of a storefront request and  the current authenticated customer is referenced by the basket or order, and the current protocol is HTTPS. |
| [paymentDetails](#paymentdetails): [SalesforcePaymentDetails](dw.extensions.payments.SalesforcePaymentDetails.md) | <p>  Returns the payment details for this payment instrument, or `null` if none are available. |
| [paymentTransaction](#paymenttransaction): [PaymentTransaction](dw.order.PaymentTransaction.md) `(read-only)` | Returns the Payment Transaction for this Payment Instrument or null. |
| [refundedAmount](#refundedamount): [Money](dw.value.Money.md) `(read-only)` | Returns the sum of the refunded amounts. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getBankAccountDriversLicense](dw.order.OrderPaymentInstrument.md#getbankaccountdriverslicense)() | Returns the driver's license associated with a bank account if the calling  context meets the following criteria: <br/>  <ul>  <li>  If the method call happens in the context of a storefront request and  the current customer is identical to the customer related to the basket  or order, and the current protocol is HTTPS. |
| [getBankAccountNumber](dw.order.OrderPaymentInstrument.md#getbankaccountnumber)() | Returns the account number if the calling context meets  the following criteria: <br/>  <ul>  <li>  If the method call happens in the context of a storefront request and  the current customer is identical to the customer related to the basket  or order, and the current protocol is HTTPS. |
| [getCapturedAmount](dw.order.OrderPaymentInstrument.md#getcapturedamount)() | Returns the sum of the captured amounts. |
| [getCreditCardNumber](dw.order.OrderPaymentInstrument.md#getcreditcardnumber)() | Returns the de-crypted creditcard number if the calling context meets  the following criteria: <br/>  <ul>  <li>  If the method call happens in the context of a storefront request and  the current authenticated customer is referenced by the basket or order, and the current protocol is HTTPS. |
| [getPaymentDetails](dw.order.OrderPaymentInstrument.md#getpaymentdetails)() | <p>  Returns the payment details for this payment instrument, or `null` if none are available. |
| [getPaymentTransaction](dw.order.OrderPaymentInstrument.md#getpaymenttransaction)() | Returns the Payment Transaction for this Payment Instrument or null. |
| [getRefundedAmount](dw.order.OrderPaymentInstrument.md#getrefundedamount)() | Returns the sum of the refunded amounts. |
| [setPaymentDetails](dw.order.OrderPaymentInstrument.md#setpaymentdetailssalesforcepaymentdetails)([SalesforcePaymentDetails](dw.extensions.payments.SalesforcePaymentDetails.md)) | <p>  Sets the payment details for this payment instrument. |

### Methods inherited from class PaymentInstrument

[getBankAccountDriversLicense](dw.order.PaymentInstrument.md#getbankaccountdriverslicense), [getBankAccountDriversLicenseLastDigits](dw.order.PaymentInstrument.md#getbankaccountdriverslicenselastdigits), [getBankAccountDriversLicenseLastDigits](dw.order.PaymentInstrument.md#getbankaccountdriverslicenselastdigitsnumber), [getBankAccountDriversLicenseStateCode](dw.order.PaymentInstrument.md#getbankaccountdriverslicensestatecode), [getBankAccountHolder](dw.order.PaymentInstrument.md#getbankaccountholder), [getBankAccountNumber](dw.order.PaymentInstrument.md#getbankaccountnumber), [getBankAccountNumberLastDigits](dw.order.PaymentInstrument.md#getbankaccountnumberlastdigits), [getBankAccountNumberLastDigits](dw.order.PaymentInstrument.md#getbankaccountnumberlastdigitsnumber), [getBankRoutingNumber](dw.order.PaymentInstrument.md#getbankroutingnumber), [getCreditCardExpirationMonth](dw.order.PaymentInstrument.md#getcreditcardexpirationmonth), [getCreditCardExpirationYear](dw.order.PaymentInstrument.md#getcreditcardexpirationyear), [getCreditCardHolder](dw.order.PaymentInstrument.md#getcreditcardholder), [getCreditCardIssueNumber](dw.order.PaymentInstrument.md#getcreditcardissuenumber), [getCreditCardNumber](dw.order.PaymentInstrument.md#getcreditcardnumber), [getCreditCardNumberLastDigits](dw.order.PaymentInstrument.md#getcreditcardnumberlastdigits), [getCreditCardNumberLastDigits](dw.order.PaymentInstrument.md#getcreditcardnumberlastdigitsnumber), [getCreditCardToken](dw.order.PaymentInstrument.md#getcreditcardtoken), [getCreditCardType](dw.order.PaymentInstrument.md#getcreditcardtype), [getCreditCardValidFromMonth](dw.order.PaymentInstrument.md#getcreditcardvalidfrommonth), [getCreditCardValidFromYear](dw.order.PaymentInstrument.md#getcreditcardvalidfromyear), [getEncryptedBankAccountDriversLicense](dw.order.PaymentInstrument.md#getencryptedbankaccountdriverslicensestring-string), [getEncryptedBankAccountNumber](dw.order.PaymentInstrument.md#getencryptedbankaccountnumberstring-string), [getEncryptedCreditCardNumber](dw.order.PaymentInstrument.md#getencryptedcreditcardnumberstring-certificateref), [getEncryptedCreditCardNumber](dw.order.PaymentInstrument.md#getencryptedcreditcardnumberstring-string), [getGiftCertificateCode](dw.order.PaymentInstrument.md#getgiftcertificatecode), [getGiftCertificateID](dw.order.PaymentInstrument.md#getgiftcertificateid), [getMaskedBankAccountDriversLicense](dw.order.PaymentInstrument.md#getmaskedbankaccountdriverslicense), [getMaskedBankAccountDriversLicense](dw.order.PaymentInstrument.md#getmaskedbankaccountdriverslicensenumber), [getMaskedBankAccountNumber](dw.order.PaymentInstrument.md#getmaskedbankaccountnumber), [getMaskedBankAccountNumber](dw.order.PaymentInstrument.md#getmaskedbankaccountnumbernumber), [getMaskedCreditCardNumber](dw.order.PaymentInstrument.md#getmaskedcreditcardnumber), [getMaskedCreditCardNumber](dw.order.PaymentInstrument.md#getmaskedcreditcardnumbernumber), [getMaskedGiftCertificateCode](dw.order.PaymentInstrument.md#getmaskedgiftcertificatecode), [getMaskedGiftCertificateCode](dw.order.PaymentInstrument.md#getmaskedgiftcertificatecodenumber), [getPaymentMethod](dw.order.PaymentInstrument.md#getpaymentmethod), [isCreditCardExpired](dw.order.PaymentInstrument.md#iscreditcardexpired), [isPermanentlyMasked](dw.order.PaymentInstrument.md#ispermanentlymasked), [setBankAccountDriversLicense](dw.order.PaymentInstrument.md#setbankaccountdriverslicensestring), [setBankAccountDriversLicenseStateCode](dw.order.PaymentInstrument.md#setbankaccountdriverslicensestatecodestring), [setBankAccountHolder](dw.order.PaymentInstrument.md#setbankaccountholderstring), [setBankAccountNumber](dw.order.PaymentInstrument.md#setbankaccountnumberstring), [setBankRoutingNumber](dw.order.PaymentInstrument.md#setbankroutingnumberstring), [setCreditCardExpirationMonth](dw.order.PaymentInstrument.md#setcreditcardexpirationmonthnumber), [setCreditCardExpirationYear](dw.order.PaymentInstrument.md#setcreditcardexpirationyearnumber), [setCreditCardHolder](dw.order.PaymentInstrument.md#setcreditcardholderstring), [setCreditCardIssueNumber](dw.order.PaymentInstrument.md#setcreditcardissuenumberstring), [setCreditCardNumber](dw.order.PaymentInstrument.md#setcreditcardnumberstring), [setCreditCardToken](dw.order.PaymentInstrument.md#setcreditcardtokenstring), [setCreditCardType](dw.order.PaymentInstrument.md#setcreditcardtypestring), [setCreditCardValidFromMonth](dw.order.PaymentInstrument.md#setcreditcardvalidfrommonthnumber), [setCreditCardValidFromYear](dw.order.PaymentInstrument.md#setcreditcardvalidfromyearnumber), [setGiftCertificateCode](dw.order.PaymentInstrument.md#setgiftcertificatecodestring), [setGiftCertificateID](dw.order.PaymentInstrument.md#setgiftcertificateidstring)
### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### bankAccountDriversLicense
- bankAccountDriversLicense: [String](TopLevel.String.md) `(read-only)`
  - : Returns the driver's license associated with a bank account if the calling
      context meets the following criteria: 
      
      
      - If the method call happens in the context of a storefront request and  the current customer is identical to the customer related to the basket  or order, and the current protocol is HTTPS.  
      - If the method call happens in the context of the business manager and the  current user has permission to the Orders module.  
      
      Otherwise, the method throws an exception.



---

### bankAccountNumber
- bankAccountNumber: [String](TopLevel.String.md) `(read-only)`
  - : Returns the account number if the calling context meets
      the following criteria: 
      
      
      - If the method call happens in the context of a storefront request and  the current customer is identical to the customer related to the basket  or order, and the current protocol is HTTPS.  
      - If the method call happens in the context of the business manager and the  current user has permissions to the Orders module.  
      
      Otherwise, the method throws an exception.



---

### capturedAmount
- capturedAmount: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the sum of the captured amounts. The captured amounts
      are calculated on the fly. Associate a payment capture for an Payment Instrument with an Invoice
      using Invoice method addCaptureTransaction.



---

### creditCardNumber
- creditCardNumber: [String](TopLevel.String.md) `(read-only)`
  - : Returns the de-crypted creditcard number if the calling context meets
      the following criteria: 
      
      
      - If the method call happens in the context of a storefront request and  the current authenticated customer is referenced by the basket or order, and the current protocol is HTTPS.  
      - If the customer is anonymous, and the order references this customer, and the protocol is secure and  the order status is CREATED.  
      - If the method call happens in the context of the business manager and the  current user has the permission to manage orders.  
      - If the payment information has not been masked as a result of the data retention security policy  for the site.  
      
      Otherwise, the method returns the masked credit card number.



---

### paymentDetails
- paymentDetails: [SalesforcePaymentDetails](dw.extensions.payments.SalesforcePaymentDetails.md)
  - : 
      
      Returns the payment details for this payment instrument, or `null` if none are available.
      
      
      
      
      Payment details are differentiated by their type. Some payment types like
      [SalesforcePaymentDetails.TYPE_CARD](dw.extensions.payments.SalesforcePaymentDetails.md#type_card) contain additional details like the card brand,
      or the last 4 digits of the card number. Details to those payments will be of a specific subclass like
      [SalesforceCardPaymentDetails](dw.extensions.payments.SalesforceCardPaymentDetails.md). Other payment types have no additional information
      so their details are represented by an object of the base type.
      
      
      
      
      Payment details contain information about the method and credentials for a payment before any attempt to
      authorize or capture a payment amount. Some of that information may be relevant to the payer and is appropriate
      to present on an order confirmation or order history page, as well as in an order confirmation email. Other
      information may only be important for auditing or fraud check purposes and need not be presented to the payer.



---

### paymentTransaction
- paymentTransaction: [PaymentTransaction](dw.order.PaymentTransaction.md) `(read-only)`
  - : Returns the Payment Transaction for this Payment Instrument or null.


---

### refundedAmount
- refundedAmount: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the sum of the refunded amounts. The refunded amounts
      are calculated on the fly. Associate a payment refund for an Payment Instrument with an Invoice
      using Invoice method addRefundTransaction.



---

## Method Details

### getBankAccountDriversLicense()
- getBankAccountDriversLicense(): [String](TopLevel.String.md)
  - : Returns the driver's license associated with a bank account if the calling
      context meets the following criteria: 
      
      
      - If the method call happens in the context of a storefront request and  the current customer is identical to the customer related to the basket  or order, and the current protocol is HTTPS.  
      - If the method call happens in the context of the business manager and the  current user has permission to the Orders module.  
      
      Otherwise, the method throws an exception.


    **Returns:**
    - the driver's license number if the calling context meets the
      necessary criteria.



---

### getBankAccountNumber()
- getBankAccountNumber(): [String](TopLevel.String.md)
  - : Returns the account number if the calling context meets
      the following criteria: 
      
      
      - If the method call happens in the context of a storefront request and  the current customer is identical to the customer related to the basket  or order, and the current protocol is HTTPS.  
      - If the method call happens in the context of the business manager and the  current user has permissions to the Orders module.  
      
      Otherwise, the method throws an exception.


    **Returns:**
    - the account number if the calling context meets the
      necessary criteria.



---

### getCapturedAmount()
- getCapturedAmount(): [Money](dw.value.Money.md)
  - : Returns the sum of the captured amounts. The captured amounts
      are calculated on the fly. Associate a payment capture for an Payment Instrument with an Invoice
      using Invoice method addCaptureTransaction.


    **Returns:**
    - sum of captured amounts


---

### getCreditCardNumber()
- getCreditCardNumber(): [String](TopLevel.String.md)
  - : Returns the de-crypted creditcard number if the calling context meets
      the following criteria: 
      
      
      - If the method call happens in the context of a storefront request and  the current authenticated customer is referenced by the basket or order, and the current protocol is HTTPS.  
      - If the customer is anonymous, and the order references this customer, and the protocol is secure and  the order status is CREATED.  
      - If the method call happens in the context of the business manager and the  current user has the permission to manage orders.  
      - If the payment information has not been masked as a result of the data retention security policy  for the site.  
      
      Otherwise, the method returns the masked credit card number.


    **Returns:**
    - the de-crypted creditcard number if the calling context meets the
      necessary criteria.



---

### getPaymentDetails()
- getPaymentDetails(): [SalesforcePaymentDetails](dw.extensions.payments.SalesforcePaymentDetails.md)
  - : 
      
      Returns the payment details for this payment instrument, or `null` if none are available.
      
      
      
      
      Payment details are differentiated by their type. Some payment types like
      [SalesforcePaymentDetails.TYPE_CARD](dw.extensions.payments.SalesforcePaymentDetails.md#type_card) contain additional details like the card brand,
      or the last 4 digits of the card number. Details to those payments will be of a specific subclass like
      [SalesforceCardPaymentDetails](dw.extensions.payments.SalesforceCardPaymentDetails.md). Other payment types have no additional information
      so their details are represented by an object of the base type.
      
      
      
      
      Payment details contain information about the method and credentials for a payment before any attempt to
      authorize or capture a payment amount. Some of that information may be relevant to the payer and is appropriate
      to present on an order confirmation or order history page, as well as in an order confirmation email. Other
      information may only be important for auditing or fraud check purposes and need not be presented to the payer.


    **Returns:**
    - the payment details, or `null` if none are available


---

### getPaymentTransaction()
- getPaymentTransaction(): [PaymentTransaction](dw.order.PaymentTransaction.md)
  - : Returns the Payment Transaction for this Payment Instrument or null.

    **Returns:**
    - the Payment Transaction for this Payment Instrument or null.


---

### getRefundedAmount()
- getRefundedAmount(): [Money](dw.value.Money.md)
  - : Returns the sum of the refunded amounts. The refunded amounts
      are calculated on the fly. Associate a payment refund for an Payment Instrument with an Invoice
      using Invoice method addRefundTransaction.


    **Returns:**
    - sum of refunded amounts


---

### setPaymentDetails(SalesforcePaymentDetails)
- setPaymentDetails(details: [SalesforcePaymentDetails](dw.extensions.payments.SalesforcePaymentDetails.md)): void
  - : 
      
      Sets the payment details for this payment instrument. Set `null` to clear them.
      
      
      
      
      Payment details are differentiated by their type. The caller is responsible to set payment details of a type
      appropriate to the payment method and its credentials. Some payment types like
      [SalesforcePaymentDetails.TYPE_CARD](dw.extensions.payments.SalesforcePaymentDetails.md#type_card) contain additional details like the card brand,
      or the last 4 digits of the card number. To set the details to those payments, use a specific subclass like
      [SalesforceCardPaymentDetails](dw.extensions.payments.SalesforceCardPaymentDetails.md). To set details for other payment types that have no
      additional information, use the base class [SalesforcePaymentDetails](dw.extensions.payments.SalesforcePaymentDetails.md).


    **Parameters:**
    - details - payment details to set, or `null` to clear them


---

<!-- prettier-ignore-end -->
