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
| [getPaymentTransaction](dw.order.OrderPaymentInstrument.md#getpaymenttransaction)() | Returns the Payment Transaction for this Payment Instrument or null. |
| [getRefundedAmount](dw.order.OrderPaymentInstrument.md#getrefundedamount)() | Returns the sum of the refunded amounts. |

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

<!-- prettier-ignore-end -->
