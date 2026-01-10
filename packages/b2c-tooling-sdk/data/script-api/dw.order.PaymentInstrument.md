<!-- prettier-ignore-start -->
# Class PaymentInstrument

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)
      - [dw.customer.EncryptedObject](dw.customer.EncryptedObject.md)
        - [dw.order.PaymentInstrument](dw.order.PaymentInstrument.md)

Base class for payment instrument either stored in the customers profile
or related to an order. A payment instrument can be credit card
or bank transfer. The object defines standard methods for credit card
payment, and can be extended by attributes appropriate for other
payment methods.


**Note:** this class handles sensitive financial and card holder data.
Pay special attention to PCI DSS v3. requirements 1, 3, 7, and 9.



## All Known Subclasses
[CustomerPaymentInstrument](dw.customer.CustomerPaymentInstrument.md), [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md)
## Constant Summary

| Constant | Description |
| --- | --- |
| ~~[ENCRYPTION_ALGORITHM_RSA](#encryption_algorithm_rsa): [String](TopLevel.String.md) = "RSA"~~ | The outdated encryption algorithm "RSA/ECB/PKCS1Padding". |
| [ENCRYPTION_ALGORITHM_RSA_ECB_OAEPWITHSHA_256ANDMGF1PADDING](#encryption_algorithm_rsa_ecb_oaepwithsha_256andmgf1padding): [String](TopLevel.String.md) = "RSA/ECB/OAEPWithSHA-256AndMGF1Padding" | The encryption algorithm "RSA/ECB/OAEPWithSHA-256AndMGF1Padding". |
| [METHOD_BANK_TRANSFER](#method_bank_transfer): [String](TopLevel.String.md) = "BANK_TRANSFER" | Represents a bank transfer type of payment. |
| [METHOD_BML](#method_bml): [String](TopLevel.String.md) = "BML" | Represents a 'bill me later' type of payment. |
| [METHOD_CREDIT_CARD](#method_credit_card): [String](TopLevel.String.md) = "CREDIT_CARD" | Represents a credit card type of payment. |
| [METHOD_DW_ANDROID_PAY](#method_dw_android_pay): [String](TopLevel.String.md) = "DW_ANDROID_PAY" | Represents an Android Pay payment. |
| [METHOD_DW_APPLE_PAY](#method_dw_apple_pay): [String](TopLevel.String.md) = "DW_APPLE_PAY" | Represents an Apple Pay payment. |
| [METHOD_GIFT_CERTIFICATE](#method_gift_certificate): [String](TopLevel.String.md) = "GIFT_CERTIFICATE" | Represents a gift certificate. |

## Property Summary

| Property | Description |
| --- | --- |
| [bankAccountDriversLicense](#bankaccountdriverslicense): [String](TopLevel.String.md) | Returns the driver's license number associated with the bank account if the  calling context meets the following criteria: <br/>  <ul>  <li>  If the instance is a CustomerPaymentInstrument, and  we are in the context of a storefront request, and the current customer  is registered and authenticated, and the payment instrument is associated  to the profile of the current customer, and the current protocol is HTTPS  </li>  <li>  If the instance is a OrderPaymentInstrumentInfo, and we are in  the context of a storefront request, and the current customer is identical  to the customer related to the basket, and the current protocol is HTTPS  </li>  <li>  If the instance is a OrderPaymentInstrumentInfo, and we are in  the context of a business manager request, and the current user has the  permission MANAGE\_ORDERS  </li>  <li>  If the instance is a OrderPaymentInstrumentInfo, and the account information  has not been masked as a result of the data retention security policy  for the site  </li>  </ul> |
| [bankAccountDriversLicenseLastDigits](#bankaccountdriverslicenselastdigits): [String](TopLevel.String.md) `(read-only)` | Returns the last 4 characters of the decrypted driver's license number of  the bank account associated with this PaymentInstrument. |
| [bankAccountDriversLicenseStateCode](#bankaccountdriverslicensestatecode): [String](TopLevel.String.md) | Returns the driver's license state code associated with a bank account payment instrument. |
| [bankAccountHolder](#bankaccountholder): [String](TopLevel.String.md) | Returns the full name of the holder of a bank account payment instrument. |
| [bankAccountNumber](#bankaccountnumber): [String](TopLevel.String.md) | Returns the bank account number if the calling context meets  the following criteria: <br/>  <ul>  <li>  If the instance is a CustomerPaymentInstrument, and  we are in the context of a storefront request, and the current customer  is registered and authenticated, and the payment instrument is associated  to the profile of the current customer, and the current protocol is HTTPS  </li>  <li>  If the instance is a OrderPaymentInstrumentInfo, and we are in  the context of a storefront request, and the current customer is identical  to the customer related to the basket, and the current protocol is HTTPS  </li>  <li>  If the instance is a OrderPaymentInstrumentInfo, and we are in  the context of a business manager request, and the current user has the  permission MANAGE\_ORDERS  </li>  <li>  If the instance is a OrderPaymentInstrumentInfo, and the account information  has not been masked as a result of the data retention security policy  for the site  </li>  </ul> |
| [bankAccountNumberLastDigits](#bankaccountnumberlastdigits): [String](TopLevel.String.md) `(read-only)` | Returns the last 4 characters of the decrypted bank account number. |
| [bankRoutingNumber](#bankroutingnumber): [String](TopLevel.String.md) | Returns the bank routing number of a bank account payment instrument. |
| [creditCardExpirationMonth](#creditcardexpirationmonth): [Number](TopLevel.Number.md) | Returns the month of the year in which the credit card  expires (1-12). |
| [creditCardExpirationYear](#creditcardexpirationyear): [Number](TopLevel.Number.md) | Returns the year in which the credit card  expires, such as '2004'. |
| [creditCardExpired](#creditcardexpired): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns true if this payment instrument represents an expired credit  card. |
| [creditCardHolder](#creditcardholder): [String](TopLevel.String.md) | Returns the name of the credit card owner. |
| [creditCardIssueNumber](#creditcardissuenumber): [String](TopLevel.String.md) | Returns the credit card issue number. |
| [creditCardNumber](#creditcardnumber): [String](TopLevel.String.md) | Returns the decrypted credit card number if the calling context meets  the following criteria: <br/>  <ul>  <li>  If the instance is a CustomerPaymentInstrument, and  we are in the context of a storefront request, and the current customer  is registered and authenticated, and the payment instrument is associated  to the profile of the current customer, and the current protocol is HTTPS  </li>  <li>  If the instance is a OrderPaymentInstrument in the context of a storefront request, and  the current authenticated customer is referenced by the basket or order, and  the current protocol is HTTPS. |
| [creditCardNumberLastDigits](#creditcardnumberlastdigits): [String](TopLevel.String.md) `(read-only)` | Returns the last 4 characters of the decrypted credit card number. |
| [creditCardToken](#creditcardtoken): [String](TopLevel.String.md) | Secure credit card data can be replaced by a token by utilizing a  tokenization provider, which securely stores the credit card data using  the token as a key. |
| [creditCardType](#creditcardtype): [String](TopLevel.String.md) | Returns the type of the credit card. |
| [creditCardValidFromMonth](#creditcardvalidfrommonth): [Number](TopLevel.Number.md) | Returns the month of the year in which the credit card became  valid (1-12). |
| [creditCardValidFromYear](#creditcardvalidfromyear): [Number](TopLevel.Number.md) | Returns the year in which the credit card became valid, such as '2001'. |
| [giftCertificateCode](#giftcertificatecode): [String](TopLevel.String.md) | Returns the Gift Certificate code for this Payment Instrument. |
| ~~[giftCertificateID](#giftcertificateid): [String](TopLevel.String.md)~~ | Returns the Gift Certificate ID for this Payment Instrument. |
| [maskedBankAccountDriversLicense](#maskedbankaccountdriverslicense): [String](TopLevel.String.md) `(read-only)` | Returns the decrypted driver's license number of the bank account with  all but the last 4 characters replaced with a '\*' character. |
| [maskedBankAccountNumber](#maskedbankaccountnumber): [String](TopLevel.String.md) `(read-only)` | Returns the decrypted bank account number with  all but the last 4 characters replaced with a '\*' character. |
| [maskedCreditCardNumber](#maskedcreditcardnumber): [String](TopLevel.String.md) `(read-only)` | Returns the decrypted credit card number with  all but the last 4 characters replaced with a '\*' character. |
| [maskedGiftCertificateCode](#maskedgiftcertificatecode): [String](TopLevel.String.md) `(read-only)` | Returns the masked gift certificate code with  all but the last 4 characters replaced with a '\*' character. |
| [paymentMethod](#paymentmethod): [String](TopLevel.String.md) `(read-only)` | Returns the identifier of the payment method represented by this  payment instrument. |
| [permanentlyMasked](#permanentlymasked): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns `true` if the account information for this Payment Instrument  has been permanently masked as a result of the data retention security policy  for the site or a creditcard tokenization, and `false` otherwise. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getBankAccountDriversLicense](dw.order.PaymentInstrument.md#getbankaccountdriverslicense)() | Returns the driver's license number associated with the bank account if the  calling context meets the following criteria: <br/>  <ul>  <li>  If the instance is a CustomerPaymentInstrument, and  we are in the context of a storefront request, and the current customer  is registered and authenticated, and the payment instrument is associated  to the profile of the current customer, and the current protocol is HTTPS  </li>  <li>  If the instance is a OrderPaymentInstrumentInfo, and we are in  the context of a storefront request, and the current customer is identical  to the customer related to the basket, and the current protocol is HTTPS  </li>  <li>  If the instance is a OrderPaymentInstrumentInfo, and we are in  the context of a business manager request, and the current user has the  permission MANAGE\_ORDERS  </li>  <li>  If the instance is a OrderPaymentInstrumentInfo, and the account information  has not been masked as a result of the data retention security policy  for the site  </li>  </ul> |
| [getBankAccountDriversLicenseLastDigits](dw.order.PaymentInstrument.md#getbankaccountdriverslicenselastdigits)() | Returns the last 4 characters of the decrypted driver's license number of  the bank account associated with this PaymentInstrument. |
| [getBankAccountDriversLicenseLastDigits](dw.order.PaymentInstrument.md#getbankaccountdriverslicenselastdigitsnumber)([Number](TopLevel.Number.md)) | Returns the last specified number of characters of the decrypted driver's license number of  the bank account associated with this PaymentInstrument. |
| [getBankAccountDriversLicenseStateCode](dw.order.PaymentInstrument.md#getbankaccountdriverslicensestatecode)() | Returns the driver's license state code associated with a bank account payment instrument. |
| [getBankAccountHolder](dw.order.PaymentInstrument.md#getbankaccountholder)() | Returns the full name of the holder of a bank account payment instrument. |
| [getBankAccountNumber](dw.order.PaymentInstrument.md#getbankaccountnumber)() | Returns the bank account number if the calling context meets  the following criteria: <br/>  <ul>  <li>  If the instance is a CustomerPaymentInstrument, and  we are in the context of a storefront request, and the current customer  is registered and authenticated, and the payment instrument is associated  to the profile of the current customer, and the current protocol is HTTPS  </li>  <li>  If the instance is a OrderPaymentInstrumentInfo, and we are in  the context of a storefront request, and the current customer is identical  to the customer related to the basket, and the current protocol is HTTPS  </li>  <li>  If the instance is a OrderPaymentInstrumentInfo, and we are in  the context of a business manager request, and the current user has the  permission MANAGE\_ORDERS  </li>  <li>  If the instance is a OrderPaymentInstrumentInfo, and the account information  has not been masked as a result of the data retention security policy  for the site  </li>  </ul> |
| [getBankAccountNumberLastDigits](dw.order.PaymentInstrument.md#getbankaccountnumberlastdigits)() | Returns the last 4 characters of the decrypted bank account number. |
| [getBankAccountNumberLastDigits](dw.order.PaymentInstrument.md#getbankaccountnumberlastdigitsnumber)([Number](TopLevel.Number.md)) | Returns the last specified number of characters of the decrypted bank account card number. |
| [getBankRoutingNumber](dw.order.PaymentInstrument.md#getbankroutingnumber)() | Returns the bank routing number of a bank account payment instrument. |
| [getCreditCardExpirationMonth](dw.order.PaymentInstrument.md#getcreditcardexpirationmonth)() | Returns the month of the year in which the credit card  expires (1-12). |
| [getCreditCardExpirationYear](dw.order.PaymentInstrument.md#getcreditcardexpirationyear)() | Returns the year in which the credit card  expires, such as '2004'. |
| [getCreditCardHolder](dw.order.PaymentInstrument.md#getcreditcardholder)() | Returns the name of the credit card owner. |
| [getCreditCardIssueNumber](dw.order.PaymentInstrument.md#getcreditcardissuenumber)() | Returns the credit card issue number. |
| [getCreditCardNumber](dw.order.PaymentInstrument.md#getcreditcardnumber)() | Returns the decrypted credit card number if the calling context meets  the following criteria: <br/>  <ul>  <li>  If the instance is a CustomerPaymentInstrument, and  we are in the context of a storefront request, and the current customer  is registered and authenticated, and the payment instrument is associated  to the profile of the current customer, and the current protocol is HTTPS  </li>  <li>  If the instance is a OrderPaymentInstrument in the context of a storefront request, and  the current authenticated customer is referenced by the basket or order, and  the current protocol is HTTPS. |
| [getCreditCardNumberLastDigits](dw.order.PaymentInstrument.md#getcreditcardnumberlastdigits)() | Returns the last 4 characters of the decrypted credit card number. |
| [getCreditCardNumberLastDigits](dw.order.PaymentInstrument.md#getcreditcardnumberlastdigitsnumber)([Number](TopLevel.Number.md)) | Returns the last specified number of characters of the decrypted credit card number. |
| [getCreditCardToken](dw.order.PaymentInstrument.md#getcreditcardtoken)() | Secure credit card data can be replaced by a token by utilizing a  tokenization provider, which securely stores the credit card data using  the token as a key. |
| [getCreditCardType](dw.order.PaymentInstrument.md#getcreditcardtype)() | Returns the type of the credit card. |
| [getCreditCardValidFromMonth](dw.order.PaymentInstrument.md#getcreditcardvalidfrommonth)() | Returns the month of the year in which the credit card became  valid (1-12). |
| [getCreditCardValidFromYear](dw.order.PaymentInstrument.md#getcreditcardvalidfromyear)() | Returns the year in which the credit card became valid, such as '2001'. |
| [getEncryptedBankAccountDriversLicense](dw.order.PaymentInstrument.md#getencryptedbankaccountdriverslicensestring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Encrypts the driver's license number of the bank account of this object with the given algorithm and the given  public key. |
| [getEncryptedBankAccountNumber](dw.order.PaymentInstrument.md#getencryptedbankaccountnumberstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Encrypts the bank account number of this object with the given algorithm and the given public key. |
| [getEncryptedCreditCardNumber](dw.order.PaymentInstrument.md#getencryptedcreditcardnumberstring-certificateref)([String](TopLevel.String.md), [CertificateRef](dw.crypto.CertificateRef.md)) | Encrypts the credit card number of this object with the given algorithm and the public key taken from a  certificate in the keystore. |
| ~~[getEncryptedCreditCardNumber](dw.order.PaymentInstrument.md#getencryptedcreditcardnumberstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md))~~ | Encrypts the credit card number of this object with the given algorithm and the given public key. |
| [getGiftCertificateCode](dw.order.PaymentInstrument.md#getgiftcertificatecode)() | Returns the Gift Certificate code for this Payment Instrument. |
| ~~[getGiftCertificateID](dw.order.PaymentInstrument.md#getgiftcertificateid)()~~ | Returns the Gift Certificate ID for this Payment Instrument. |
| [getMaskedBankAccountDriversLicense](dw.order.PaymentInstrument.md#getmaskedbankaccountdriverslicense)() | Returns the decrypted driver's license number of the bank account with  all but the last 4 characters replaced with a '\*' character. |
| [getMaskedBankAccountDriversLicense](dw.order.PaymentInstrument.md#getmaskedbankaccountdriverslicensenumber)([Number](TopLevel.Number.md)) | Returns the decrypted driver's license number of the bank account with  all but the specified number characters replaced with a '\*' character. |
| [getMaskedBankAccountNumber](dw.order.PaymentInstrument.md#getmaskedbankaccountnumber)() | Returns the decrypted bank account number with  all but the last 4 characters replaced with a '\*' character. |
| [getMaskedBankAccountNumber](dw.order.PaymentInstrument.md#getmaskedbankaccountnumbernumber)([Number](TopLevel.Number.md)) | Returns the decrypted bank account number with  all but the specified number characters replaced with a '\*' character. |
| [getMaskedCreditCardNumber](dw.order.PaymentInstrument.md#getmaskedcreditcardnumber)() | Returns the decrypted credit card number with  all but the last 4 characters replaced with a '\*' character. |
| [getMaskedCreditCardNumber](dw.order.PaymentInstrument.md#getmaskedcreditcardnumbernumber)([Number](TopLevel.Number.md)) | Returns the decrypted credit card number with  all but the specified number characters replaced with a '\*' character. |
| [getMaskedGiftCertificateCode](dw.order.PaymentInstrument.md#getmaskedgiftcertificatecode)() | Returns the masked gift certificate code with  all but the last 4 characters replaced with a '\*' character. |
| [getMaskedGiftCertificateCode](dw.order.PaymentInstrument.md#getmaskedgiftcertificatecodenumber)([Number](TopLevel.Number.md)) | Returns the masked gift certificate code with  all but the specified number of characters replaced with a '\*' character. |
| [getPaymentMethod](dw.order.PaymentInstrument.md#getpaymentmethod)() | Returns the identifier of the payment method represented by this  payment instrument. |
| [isCreditCardExpired](dw.order.PaymentInstrument.md#iscreditcardexpired)() | Returns true if this payment instrument represents an expired credit  card. |
| [isPermanentlyMasked](dw.order.PaymentInstrument.md#ispermanentlymasked)() | Returns `true` if the account information for this Payment Instrument  has been permanently masked as a result of the data retention security policy  for the site or a creditcard tokenization, and `false` otherwise. |
| [setBankAccountDriversLicense](dw.order.PaymentInstrument.md#setbankaccountdriverslicensestring)([String](TopLevel.String.md)) | Set the driver's license number associated with a bank account payment instrument. |
| [setBankAccountDriversLicenseStateCode](dw.order.PaymentInstrument.md#setbankaccountdriverslicensestatecodestring)([String](TopLevel.String.md)) | Set the driver's license state code associated with a bank account payment instrument. |
| [setBankAccountHolder](dw.order.PaymentInstrument.md#setbankaccountholderstring)([String](TopLevel.String.md)) | Set the full name of the holder of a bank account payment instrument. |
| [setBankAccountNumber](dw.order.PaymentInstrument.md#setbankaccountnumberstring)([String](TopLevel.String.md)) | Set the bank account number of a bank account payment instrument. |
| [setBankRoutingNumber](dw.order.PaymentInstrument.md#setbankroutingnumberstring)([String](TopLevel.String.md)) | Set the bank routing number of a bank account payment instrument. |
| [setCreditCardExpirationMonth](dw.order.PaymentInstrument.md#setcreditcardexpirationmonthnumber)([Number](TopLevel.Number.md)) | Sets the month of the year in which the credit card  expires. |
| [setCreditCardExpirationYear](dw.order.PaymentInstrument.md#setcreditcardexpirationyearnumber)([Number](TopLevel.Number.md)) | Sets the year in which the credit card  expires, such as '2004'. |
| [setCreditCardHolder](dw.order.PaymentInstrument.md#setcreditcardholderstring)([String](TopLevel.String.md)) | Sets the name of the credit card owner. |
| [setCreditCardIssueNumber](dw.order.PaymentInstrument.md#setcreditcardissuenumberstring)([String](TopLevel.String.md)) | Set the credit card issue number. |
| [setCreditCardNumber](dw.order.PaymentInstrument.md#setcreditcardnumberstring)([String](TopLevel.String.md)) | Sets the credit card number for this payment. |
| [setCreditCardToken](dw.order.PaymentInstrument.md#setcreditcardtokenstring)([String](TopLevel.String.md)) | Secure credit card data can be replaced by a token by utilizing a  tokenization provider, which securely stores the credit card data using  the token as a key. |
| [setCreditCardType](dw.order.PaymentInstrument.md#setcreditcardtypestring)([String](TopLevel.String.md)) | Sets the type of the credit card. |
| [setCreditCardValidFromMonth](dw.order.PaymentInstrument.md#setcreditcardvalidfrommonthnumber)([Number](TopLevel.Number.md)) | Sets the month of the year in which the credit card became valid (1-12). |
| [setCreditCardValidFromYear](dw.order.PaymentInstrument.md#setcreditcardvalidfromyearnumber)([Number](TopLevel.Number.md)) | Sets the year in which the credit card became valid, such as '2001'. |
| [setGiftCertificateCode](dw.order.PaymentInstrument.md#setgiftcertificatecodestring)([String](TopLevel.String.md)) | Sets the Gift Certificate code for this Payment Instrument. |
| ~~[setGiftCertificateID](dw.order.PaymentInstrument.md#setgiftcertificateidstring)([String](TopLevel.String.md))~~ | Sets the Gift Certificate ID for this Payment Instrument. |

### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### ENCRYPTION_ALGORITHM_RSA

- ~~ENCRYPTION_ALGORITHM_RSA: [String](TopLevel.String.md) = "RSA"~~
  - : The outdated encryption algorithm "RSA/ECB/PKCS1Padding". Please do not use anymore!

    **Deprecated:**
:::warning
Support for this algorithm will be removed in a future release. Please use
            [ENCRYPTION_ALGORITHM_RSA_ECB_OAEPWITHSHA_256ANDMGF1PADDING](dw.order.PaymentInstrument.md#encryption_algorithm_rsa_ecb_oaepwithsha_256andmgf1padding) instead.

:::

---

### ENCRYPTION_ALGORITHM_RSA_ECB_OAEPWITHSHA_256ANDMGF1PADDING

- ENCRYPTION_ALGORITHM_RSA_ECB_OAEPWITHSHA_256ANDMGF1PADDING: [String](TopLevel.String.md) = "RSA/ECB/OAEPWithSHA-256AndMGF1Padding"
  - : The encryption algorithm "RSA/ECB/OAEPWithSHA-256AndMGF1Padding".


---

### METHOD_BANK_TRANSFER

- METHOD_BANK_TRANSFER: [String](TopLevel.String.md) = "BANK_TRANSFER"
  - : Represents a bank transfer type of payment.


---

### METHOD_BML

- METHOD_BML: [String](TopLevel.String.md) = "BML"
  - : Represents a 'bill me later' type of payment.


---

### METHOD_CREDIT_CARD

- METHOD_CREDIT_CARD: [String](TopLevel.String.md) = "CREDIT_CARD"
  - : Represents a credit card type of payment.


---

### METHOD_DW_ANDROID_PAY

- METHOD_DW_ANDROID_PAY: [String](TopLevel.String.md) = "DW_ANDROID_PAY"
  - : Represents an Android Pay payment.


---

### METHOD_DW_APPLE_PAY

- METHOD_DW_APPLE_PAY: [String](TopLevel.String.md) = "DW_APPLE_PAY"
  - : Represents an Apple Pay payment.


---

### METHOD_GIFT_CERTIFICATE

- METHOD_GIFT_CERTIFICATE: [String](TopLevel.String.md) = "GIFT_CERTIFICATE"
  - : Represents a gift certificate.


---

## Property Details

### bankAccountDriversLicense
- bankAccountDriversLicense: [String](TopLevel.String.md)
  - : Returns the driver's license number associated with the bank account if the
      calling context meets the following criteria: 
      
      
      - If the instance is a CustomerPaymentInstrument, and  we are in the context of a storefront request, and the current customer  is registered and authenticated, and the payment instrument is associated  to the profile of the current customer, and the current protocol is HTTPS  
      - If the instance is a OrderPaymentInstrumentInfo, and we are in  the context of a storefront request, and the current customer is identical  to the customer related to the basket, and the current protocol is HTTPS  
      - If the instance is a OrderPaymentInstrumentInfo, and we are in  the context of a business manager request, and the current user has the  permission MANAGE\_ORDERS  
      - If the instance is a OrderPaymentInstrumentInfo, and the account information  has not been masked as a result of the data retention security policy  for the site  
      
      
      
      Otherwise, the method returns the masked driver's license number. If a basket is reopened with
      [OrderMgr.failOrder(Order, Boolean)](dw.order.OrderMgr.md#failorderorder-boolean), it always masks sensitive information
      because during order creation, basket payment information is permanently masked.


    **See Also:**
    - [isPermanentlyMasked()](dw.order.PaymentInstrument.md#ispermanentlymasked)


---

### bankAccountDriversLicenseLastDigits
- bankAccountDriversLicenseLastDigits: [String](TopLevel.String.md) `(read-only)`
  - : Returns the last 4 characters of the decrypted driver's license number of
      the bank account associated with this PaymentInstrument.
      
      If the number is empty or null
      it will be returned without an exception.



---

### bankAccountDriversLicenseStateCode
- bankAccountDriversLicenseStateCode: [String](TopLevel.String.md)
  - : Returns the driver's license state code associated with a bank account payment instrument.
      Returns null for other payment methods.



---

### bankAccountHolder
- bankAccountHolder: [String](TopLevel.String.md)
  - : Returns the full name of the holder of a bank account payment instrument.
      Returns null for other payment methods.



---

### bankAccountNumber
- bankAccountNumber: [String](TopLevel.String.md)
  - : Returns the bank account number if the calling context meets
      the following criteria: 
      
      
      - If the instance is a CustomerPaymentInstrument, and  we are in the context of a storefront request, and the current customer  is registered and authenticated, and the payment instrument is associated  to the profile of the current customer, and the current protocol is HTTPS  
      - If the instance is a OrderPaymentInstrumentInfo, and we are in  the context of a storefront request, and the current customer is identical  to the customer related to the basket, and the current protocol is HTTPS  
      - If the instance is a OrderPaymentInstrumentInfo, and we are in  the context of a business manager request, and the current user has the  permission MANAGE\_ORDERS  
      - If the instance is a OrderPaymentInstrumentInfo, and the account information  has not been masked as a result of the data retention security policy  for the site  
      
      
      
      Otherwise, the method returns the masked bank account number. If a basket is reopened with
      [OrderMgr.failOrder(Order, Boolean)](dw.order.OrderMgr.md#failorderorder-boolean), it always masks sensitive information
      because during order creation, basket payment information is permanently masked.


    **See Also:**
    - [isPermanentlyMasked()](dw.order.PaymentInstrument.md#ispermanentlymasked)


---

### bankAccountNumberLastDigits
- bankAccountNumberLastDigits: [String](TopLevel.String.md) `(read-only)`
  - : Returns the last 4 characters of the decrypted bank account number.
      
      If the number is empty or null,
      it will be returned without an exception.



---

### bankRoutingNumber
- bankRoutingNumber: [String](TopLevel.String.md)
  - : Returns the bank routing number of a bank account payment instrument.
      Returns null for other payment methods.
      
      If account information has been masked due to the data retention security
      policy for the site, the return value is fully masked.


    **See Also:**
    - [isPermanentlyMasked()](dw.order.PaymentInstrument.md#ispermanentlymasked)


---

### creditCardExpirationMonth
- creditCardExpirationMonth: [Number](TopLevel.Number.md)
  - : Returns the month of the year in which the credit card
      expires (1-12).



---

### creditCardExpirationYear
- creditCardExpirationYear: [Number](TopLevel.Number.md)
  - : Returns the year in which the credit card
      expires, such as '2004'.



---

### creditCardExpired
- creditCardExpired: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns true if this payment instrument represents an expired credit
      card. This check is only logical if the credit card expiration month and
      year are set. If either of these attributes are not set, then this method
      always returns false.



---

### creditCardHolder
- creditCardHolder: [String](TopLevel.String.md)
  - : Returns the name of the credit card owner.


---

### creditCardIssueNumber
- creditCardIssueNumber: [String](TopLevel.String.md)
  - : Returns the credit card issue number.  This attribute is only used by
      specific credit/debit card processors such as Solo and Switch in the UK.



---

### creditCardNumber
- creditCardNumber: [String](TopLevel.String.md)
  - : Returns the decrypted credit card number if the calling context meets
      the following criteria: 
      
      
      - If the instance is a CustomerPaymentInstrument, and  we are in the context of a storefront request, and the current customer  is registered and authenticated, and the payment instrument is associated  to the profile of the current customer, and the current protocol is HTTPS  
      - If the instance is a OrderPaymentInstrument in the context of a storefront request, and  the current authenticated customer is referenced by the basket or order, and  the current protocol is HTTPS.  
      - If the customer is anonymous, and the customer is referenced by the order, and the protocol is secure and  the order status is CREATED.  
      - If the instance is a OrderPaymentInstrument, and we are in  the context of a business manager request, and the current user has the  permission MANAGE\_ORDERS  
      - If the instance is a OrderPaymentInstrument, and the account information  has not been masked as a result of the data retention security policy  for the site  
      
      
      
      Otherwise, the method returns the masked credit card number. If a basket is reopened with
      [OrderMgr.failOrder(Order, Boolean)](dw.order.OrderMgr.md#failorderorder-boolean), it always masks sensitive information
      because during order creation, basket payment information is permanently masked.


    **See Also:**
    - [isPermanentlyMasked()](dw.order.PaymentInstrument.md#ispermanentlymasked)


---

### creditCardNumberLastDigits
- creditCardNumberLastDigits: [String](TopLevel.String.md) `(read-only)`
  - : Returns the last 4 characters of the decrypted credit card number.
      
      If the number is empty or null
      it will be returned without an exception.



---

### creditCardToken
- creditCardToken: [String](TopLevel.String.md)
  - : Secure credit card data can be replaced by a token by utilizing a
      tokenization provider, which securely stores the credit card data using
      the token as a key. The stored data can later reused by including the
      token in a request. In this way credit card processes such as
      authorization and capture can be implemented without being responsible
      for persisting the credit card data.



---

### creditCardType
- creditCardType: [String](TopLevel.String.md)
  - : Returns the type of the credit card.


---

### creditCardValidFromMonth
- creditCardValidFromMonth: [Number](TopLevel.Number.md)
  - : Returns the month of the year in which the credit card became
      valid (1-12).  This attribute is not used by all credit card types.



---

### creditCardValidFromYear
- creditCardValidFromYear: [Number](TopLevel.Number.md)
  - : Returns the year in which the credit card became valid, such as '2001'.
      This attribute is not used by all credit card types.



---

### giftCertificateCode
- giftCertificateCode: [String](TopLevel.String.md)
  - : Returns the Gift Certificate code for this Payment Instrument.


---

### giftCertificateID
- ~~giftCertificateID: [String](TopLevel.String.md)~~
  - : Returns the Gift Certificate ID for this Payment Instrument.

    **Deprecated:**
:::warning
Use [getGiftCertificateCode()](dw.order.PaymentInstrument.md#getgiftcertificatecode)
:::

---

### maskedBankAccountDriversLicense
- maskedBankAccountDriversLicense: [String](TopLevel.String.md) `(read-only)`
  - : Returns the decrypted driver's license number of the bank account with
      all but the last 4 characters replaced with a '\*' character.
      
      If the driver's license number is empty,
      it will be returned without an exception.



---

### maskedBankAccountNumber
- maskedBankAccountNumber: [String](TopLevel.String.md) `(read-only)`
  - : Returns the decrypted bank account number with
      all but the last 4 characters replaced with a '\*' character.
      
      If the number is empty (i.e. "" or null),
      it will be returned without an exception.



---

### maskedCreditCardNumber
- maskedCreditCardNumber: [String](TopLevel.String.md) `(read-only)`
  - : Returns the decrypted credit card number with
      all but the last 4 characters replaced with a '\*' character.
      
      If the number is empty,
      it will be returned without an exception.



---

### maskedGiftCertificateCode
- maskedGiftCertificateCode: [String](TopLevel.String.md) `(read-only)`
  - : Returns the masked gift certificate code with
      all but the last 4 characters replaced with a '\*' character.



---

### paymentMethod
- paymentMethod: [String](TopLevel.String.md) `(read-only)`
  - : Returns the identifier of the payment method represented by this
      payment instrument.



---

### permanentlyMasked
- permanentlyMasked: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns `true` if the account information for this Payment Instrument
      has been permanently masked as a result of the data retention security policy
      for the site or a creditcard tokenization, and `false` otherwise.
      
      When account information is masked only the last 4 digits of the credit card
      or bank account number are recoverable.  The bank account driver's license number
      and bank routing number are completely masked.



---

## Method Details

### getBankAccountDriversLicense()
- getBankAccountDriversLicense(): [String](TopLevel.String.md)
  - : Returns the driver's license number associated with the bank account if the
      calling context meets the following criteria: 
      
      
      - If the instance is a CustomerPaymentInstrument, and  we are in the context of a storefront request, and the current customer  is registered and authenticated, and the payment instrument is associated  to the profile of the current customer, and the current protocol is HTTPS  
      - If the instance is a OrderPaymentInstrumentInfo, and we are in  the context of a storefront request, and the current customer is identical  to the customer related to the basket, and the current protocol is HTTPS  
      - If the instance is a OrderPaymentInstrumentInfo, and we are in  the context of a business manager request, and the current user has the  permission MANAGE\_ORDERS  
      - If the instance is a OrderPaymentInstrumentInfo, and the account information  has not been masked as a result of the data retention security policy  for the site  
      
      
      
      Otherwise, the method returns the masked driver's license number. If a basket is reopened with
      [OrderMgr.failOrder(Order, Boolean)](dw.order.OrderMgr.md#failorderorder-boolean), it always masks sensitive information
      because during order creation, basket payment information is permanently masked.


    **Returns:**
    - the driver's license number if the calling context meets
      the necessary criteria.


    **See Also:**
    - [isPermanentlyMasked()](dw.order.PaymentInstrument.md#ispermanentlymasked)


---

### getBankAccountDriversLicenseLastDigits()
- getBankAccountDriversLicenseLastDigits(): [String](TopLevel.String.md)
  - : Returns the last 4 characters of the decrypted driver's license number of
      the bank account associated with this PaymentInstrument.
      
      If the number is empty or null
      it will be returned without an exception.


    **Returns:**
    - the last 4 characters of the de-crypted driver's license number.


---

### getBankAccountDriversLicenseLastDigits(Number)
- getBankAccountDriversLicenseLastDigits(count: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Returns the last specified number of characters of the decrypted driver's license number of
      the bank account associated with this PaymentInstrument.
      
      If the number is empty (i.e. "" or null),
      it will be returned without an exception.
      
      Note that `count` is limited to 4 in an unsecure environment,
      and if account information for this payment instrument has been masked
      due to the data retention security policy for the site.


    **Parameters:**
    - count - number of characters to be returned.

    **Returns:**
    - the last specified number of characters of the decrypted driver's license number.

    **See Also:**
    - [isPermanentlyMasked()](dw.order.PaymentInstrument.md#ispermanentlymasked)


---

### getBankAccountDriversLicenseStateCode()
- getBankAccountDriversLicenseStateCode(): [String](TopLevel.String.md)
  - : Returns the driver's license state code associated with a bank account payment instrument.
      Returns null for other payment methods.


    **Returns:**
    - the state in which the bank account driver's license was issued.


---

### getBankAccountHolder()
- getBankAccountHolder(): [String](TopLevel.String.md)
  - : Returns the full name of the holder of a bank account payment instrument.
      Returns null for other payment methods.


    **Returns:**
    - the bank account holder's full name.


---

### getBankAccountNumber()
- getBankAccountNumber(): [String](TopLevel.String.md)
  - : Returns the bank account number if the calling context meets
      the following criteria: 
      
      
      - If the instance is a CustomerPaymentInstrument, and  we are in the context of a storefront request, and the current customer  is registered and authenticated, and the payment instrument is associated  to the profile of the current customer, and the current protocol is HTTPS  
      - If the instance is a OrderPaymentInstrumentInfo, and we are in  the context of a storefront request, and the current customer is identical  to the customer related to the basket, and the current protocol is HTTPS  
      - If the instance is a OrderPaymentInstrumentInfo, and we are in  the context of a business manager request, and the current user has the  permission MANAGE\_ORDERS  
      - If the instance is a OrderPaymentInstrumentInfo, and the account information  has not been masked as a result of the data retention security policy  for the site  
      
      
      
      Otherwise, the method returns the masked bank account number. If a basket is reopened with
      [OrderMgr.failOrder(Order, Boolean)](dw.order.OrderMgr.md#failorderorder-boolean), it always masks sensitive information
      because during order creation, basket payment information is permanently masked.


    **Returns:**
    - the bank account number if the calling context meets
      the necessary criteria.


    **See Also:**
    - [isPermanentlyMasked()](dw.order.PaymentInstrument.md#ispermanentlymasked)


---

### getBankAccountNumberLastDigits()
- getBankAccountNumberLastDigits(): [String](TopLevel.String.md)
  - : Returns the last 4 characters of the decrypted bank account number.
      
      If the number is empty or null,
      it will be returned without an exception.


    **Returns:**
    - the last 4 characters of the decrypted bank account number.


---

### getBankAccountNumberLastDigits(Number)
- getBankAccountNumberLastDigits(count: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Returns the last specified number of characters of the decrypted bank account card number.
      
      If the number is empty (i.e. "" or null),
      it will be returned without an exception.
      
      Note that `count` is limited to 4 in an unsecure environment,
      and if account information for this payment instrument has been masked
      due to the data retention security policy for the site.


    **Parameters:**
    - count - number of characters to be returned.

    **Returns:**
    - the last specified characters of the decrypted bank account number.

    **See Also:**
    - [isPermanentlyMasked()](dw.order.PaymentInstrument.md#ispermanentlymasked)


---

### getBankRoutingNumber()
- getBankRoutingNumber(): [String](TopLevel.String.md)
  - : Returns the bank routing number of a bank account payment instrument.
      Returns null for other payment methods.
      
      If account information has been masked due to the data retention security
      policy for the site, the return value is fully masked.


    **Returns:**
    - the bank account rounting number.

    **See Also:**
    - [isPermanentlyMasked()](dw.order.PaymentInstrument.md#ispermanentlymasked)


---

### getCreditCardExpirationMonth()
- getCreditCardExpirationMonth(): [Number](TopLevel.Number.md)
  - : Returns the month of the year in which the credit card
      expires (1-12).


    **Returns:**
    - the month of the year in which the credit card
      expires (1-12).



---

### getCreditCardExpirationYear()
- getCreditCardExpirationYear(): [Number](TopLevel.Number.md)
  - : Returns the year in which the credit card
      expires, such as '2004'.


    **Returns:**
    - the year in which the credit card
      expires.



---

### getCreditCardHolder()
- getCreditCardHolder(): [String](TopLevel.String.md)
  - : Returns the name of the credit card owner.

    **Returns:**
    - the name of the credit card owner.


---

### getCreditCardIssueNumber()
- getCreditCardIssueNumber(): [String](TopLevel.String.md)
  - : Returns the credit card issue number.  This attribute is only used by
      specific credit/debit card processors such as Solo and Switch in the UK.


    **Returns:**
    - the credit card issue number


---

### getCreditCardNumber()
- getCreditCardNumber(): [String](TopLevel.String.md)
  - : Returns the decrypted credit card number if the calling context meets
      the following criteria: 
      
      
      - If the instance is a CustomerPaymentInstrument, and  we are in the context of a storefront request, and the current customer  is registered and authenticated, and the payment instrument is associated  to the profile of the current customer, and the current protocol is HTTPS  
      - If the instance is a OrderPaymentInstrument in the context of a storefront request, and  the current authenticated customer is referenced by the basket or order, and  the current protocol is HTTPS.  
      - If the customer is anonymous, and the customer is referenced by the order, and the protocol is secure and  the order status is CREATED.  
      - If the instance is a OrderPaymentInstrument, and we are in  the context of a business manager request, and the current user has the  permission MANAGE\_ORDERS  
      - If the instance is a OrderPaymentInstrument, and the account information  has not been masked as a result of the data retention security policy  for the site  
      
      
      
      Otherwise, the method returns the masked credit card number. If a basket is reopened with
      [OrderMgr.failOrder(Order, Boolean)](dw.order.OrderMgr.md#failorderorder-boolean), it always masks sensitive information
      because during order creation, basket payment information is permanently masked.


    **Returns:**
    - the decrypted credit card number if the calling context meets
      the necessary criteria.


    **See Also:**
    - [isPermanentlyMasked()](dw.order.PaymentInstrument.md#ispermanentlymasked)


---

### getCreditCardNumberLastDigits()
- getCreditCardNumberLastDigits(): [String](TopLevel.String.md)
  - : Returns the last 4 characters of the decrypted credit card number.
      
      If the number is empty or null
      it will be returned without an exception.


    **Returns:**
    - the last 4 characters of the de-crypted credit card number.


---

### getCreditCardNumberLastDigits(Number)
- getCreditCardNumberLastDigits(count: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Returns the last specified number of characters of the decrypted credit card number.
      
      If the number is empty (i.e. "" or null),
      it will be returned without an exception.
      
      Note that `count` is limited to 4 in an unsecure environment,
      and if account information for this payment instrument has been masked
      due to the data retention security policy for the site.


    **Parameters:**
    - count - number of characters to be returned.

    **Returns:**
    - the last specified number of characters of the decrypted credit card number.

    **See Also:**
    - [isPermanentlyMasked()](dw.order.PaymentInstrument.md#ispermanentlymasked)


---

### getCreditCardToken()
- getCreditCardToken(): [String](TopLevel.String.md)
  - : Secure credit card data can be replaced by a token by utilizing a
      tokenization provider, which securely stores the credit card data using
      the token as a key. The stored data can later reused by including the
      token in a request. In this way credit card processes such as
      authorization and capture can be implemented without being responsible
      for persisting the credit card data.


    **Returns:**
    - the token


---

### getCreditCardType()
- getCreditCardType(): [String](TopLevel.String.md)
  - : Returns the type of the credit card.

    **Returns:**
    - the type of the credit card.


---

### getCreditCardValidFromMonth()
- getCreditCardValidFromMonth(): [Number](TopLevel.Number.md)
  - : Returns the month of the year in which the credit card became
      valid (1-12).  This attribute is not used by all credit card types.


    **Returns:**
    - the month of the year in which the credit card became
      valid (1-12).



---

### getCreditCardValidFromYear()
- getCreditCardValidFromYear(): [Number](TopLevel.Number.md)
  - : Returns the year in which the credit card became valid, such as '2001'.
      This attribute is not used by all credit card types.


    **Returns:**
    - the year in which the credit card became valid


---

### getEncryptedBankAccountDriversLicense(String, String)
- getEncryptedBankAccountDriversLicense(algorithm: [String](TopLevel.String.md), publicKey: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Encrypts the driver's license number of the bank account of this object with the given algorithm and the given
      public key. Returned is the Base64 encoded representation of the result.
      
      
      See also [Cipher.encrypt(String, String, String, String, Number)](dw.crypto.Cipher.md#encryptstring-string-string-string-number---variant-2) on how to generate RSA key
      pairs.
      
      
      If account information has been masked due to the data retention security policy for the site, the returned value
      is the Base64 encoded representation of the encrypted form of the masked number.


    **Parameters:**
    - algorithm - The algorithm to be used for the encryption of this credit card number. Must be a valid,             non-null algorithm. Currently, only the following algorithms are supported:                          <li>[ENCRYPTION_ALGORITHM_RSA](dw.order.PaymentInstrument.md#encryption_algorithm_rsa) – outdated, please do not use anymore             <li>[ENCRYPTION_ALGORITHM_RSA_ECB_OAEPWITHSHA_256ANDMGF1PADDING](dw.order.PaymentInstrument.md#encryption_algorithm_rsa_ecb_oaepwithsha_256andmgf1padding) – the current algorithm             </ul>
    - publicKey - A Base64 encoded form of the public key to be used to encrypt this bank account driver's license             number. Must be a valid, non-blank key.

    **Returns:**
    - the Base64 encoded representation of the bank account driver's license.

    **Throws:**
    - IllegalArgumentException - If `algorithm` is not a valid known algorithm.
    - IllegalArgumentException - If `publicKey` is a null, empty or blank string.


---

### getEncryptedBankAccountNumber(String, String)
- getEncryptedBankAccountNumber(algorithm: [String](TopLevel.String.md), publicKey: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Encrypts the bank account number of this object with the given algorithm and the given public key. Returned is
      the Base64 encoded representation of the result.
      
      
      If account information has been masked due to the data retention security policy for the site, the returned value
      is the Base64 encoded representation of the encrypted form of the masked number.


    **Parameters:**
    - algorithm - The algorithm to be used for the encryption of this credit card number. Must be a valid,             non-null algorithm. Currently, only the following algorithms are supported:                          <li>[ENCRYPTION_ALGORITHM_RSA](dw.order.PaymentInstrument.md#encryption_algorithm_rsa) – outdated, please do not use anymore             <li>[ENCRYPTION_ALGORITHM_RSA_ECB_OAEPWITHSHA_256ANDMGF1PADDING](dw.order.PaymentInstrument.md#encryption_algorithm_rsa_ecb_oaepwithsha_256andmgf1padding) – the current algorithm             </ul>
    - publicKey - A Base64 encoded form of the public key to be used to encrypt this credit card number. Must be a             valid, non-blank key.

    **Returns:**
    - the Base64 encoded representation of the bank account number.

    **Throws:**
    - IllegalArgumentException - If `algorithm` is not a valid known algorithm.
    - IllegalArgumentException - If `publicKey` is a null, empty or blank string.

    **See Also:**
    - [isPermanentlyMasked()](dw.order.PaymentInstrument.md#ispermanentlymasked)


---

### getEncryptedCreditCardNumber(String, CertificateRef)
- getEncryptedCreditCardNumber(algorithm: [String](TopLevel.String.md), certificateRef: [CertificateRef](dw.crypto.CertificateRef.md)): [String](TopLevel.String.md)
  - : Encrypts the credit card number of this object with the given algorithm and the public key taken from a
      certificate in the keystore. Returned is the Base64 encoded representation of the result.
      
      
      See also [Cipher.encrypt(String, CertificateRef, String, String, Number)](dw.crypto.Cipher.md#encryptstring-certificateref-string-string-number---variant-2) on how to generate RSA
      key pairs.
      
      
      If account information has been masked due to the data retention security policy for the site, the returned value
      is the Base64 encoded representation of the encrypted form of the masked number.


    **Parameters:**
    - algorithm - The algorithm to be used for the encryption of this credit card number. Must be a valid,             non-null algorithm. Currently, only the following algorithms are supported:                          <li>[ENCRYPTION_ALGORITHM_RSA](dw.order.PaymentInstrument.md#encryption_algorithm_rsa) – outdated, please do not use anymore             <li>[ENCRYPTION_ALGORITHM_RSA_ECB_OAEPWITHSHA_256ANDMGF1PADDING](dw.order.PaymentInstrument.md#encryption_algorithm_rsa_ecb_oaepwithsha_256andmgf1padding) – the current algorithm             </ul>
    - certificateRef - A reference to a trusted certificate entry containing the public key in the             keystore. Must be non-null.

    **Returns:**
    - the Base64 encoded representation of the credit card number.

    **Throws:**
    - IllegalArgumentException - If `algorithm` is not a valid known algorithm.
    - IllegalArgumentException - If `certificateRef` is `null` or could not be found.

    **See Also:**
    - [isPermanentlyMasked()](dw.order.PaymentInstrument.md#ispermanentlymasked)


---

### getEncryptedCreditCardNumber(String, String)
- ~~getEncryptedCreditCardNumber(algorithm: [String](TopLevel.String.md), publicKey: [String](TopLevel.String.md)): [String](TopLevel.String.md)~~
  - : Encrypts the credit card number of this object with the given algorithm and the given public key. Returned is the
      Base64 encoded representation of the result.
      
      
      See also [Cipher.encrypt(String, String, String, String, Number)](dw.crypto.Cipher.md#encryptstring-string-string-string-number---variant-2) on how to generate RSA key
      pairs.
      
      
      If account information has been masked due to the data retention security policy for the site, the returned value
      is the Base64 encoded representation of the encrypted form of the masked number.


    **Parameters:**
    - algorithm - The algorithm to be used for the encryption of this credit card number. Must be a valid,             non-null algorithm. Currently, only the following algorithms are supported:                          <li>[ENCRYPTION_ALGORITHM_RSA](dw.order.PaymentInstrument.md#encryption_algorithm_rsa) – outdated, please do not use anymore             <li>[ENCRYPTION_ALGORITHM_RSA_ECB_OAEPWITHSHA_256ANDMGF1PADDING](dw.order.PaymentInstrument.md#encryption_algorithm_rsa_ecb_oaepwithsha_256andmgf1padding) – the current algorithm             </ul>
    - publicKey - A Base64 encoded form of the public key to be used to encrypt this credit card number. Must be a             valid, non-blank key.

    **Returns:**
    - the Base64 encoded representation of the credit card number.

    **Throws:**
    - IllegalArgumentException - If `algorithm` is not a valid known algorithm.
    - IllegalArgumentException - If `publicKey` is a null, empty or blank string.

    **See Also:**
    - [isPermanentlyMasked()](dw.order.PaymentInstrument.md#ispermanentlymasked)

    **Deprecated:**
:::warning
Please use [getEncryptedCreditCardNumber(String, CertificateRef)](dw.order.PaymentInstrument.md#getencryptedcreditcardnumberstring-certificateref) instead.
:::

---

### getGiftCertificateCode()
- getGiftCertificateCode(): [String](TopLevel.String.md)
  - : Returns the Gift Certificate code for this Payment Instrument.

    **Returns:**
    - the Gift Certificate code or null if not set.


---

### getGiftCertificateID()
- ~~getGiftCertificateID(): [String](TopLevel.String.md)~~
  - : Returns the Gift Certificate ID for this Payment Instrument.

    **Returns:**
    - the Gift Certificate ID or null if not set.

    **Deprecated:**
:::warning
Use [getGiftCertificateCode()](dw.order.PaymentInstrument.md#getgiftcertificatecode)
:::

---

### getMaskedBankAccountDriversLicense()
- getMaskedBankAccountDriversLicense(): [String](TopLevel.String.md)
  - : Returns the decrypted driver's license number of the bank account with
      all but the last 4 characters replaced with a '\*' character.
      
      If the driver's license number is empty,
      it will be returned without an exception.


    **Returns:**
    - the decrypted driver's license number with
      all but the last 4 characters replaced with a '\*' character.



---

### getMaskedBankAccountDriversLicense(Number)
- getMaskedBankAccountDriversLicense(ignore: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Returns the decrypted driver's license number of the bank account with
      all but the specified number characters replaced with a '\*' character.
      
      If the driver's license number is empty (i.e. "" or null),
      it will be returned without an exception.
      
      Note that `ignore` is limited to 4 in an unsecure environment,
      and if account information for this payment instrument has been masked
      due to the data retention security policy for the site.


    **Parameters:**
    - ignore - the number of characters to leave unmasked.

    **Returns:**
    - the decrypted driver's license number with
      all but the specified number characters replaced with a '\*' character.


    **See Also:**
    - [isPermanentlyMasked()](dw.order.PaymentInstrument.md#ispermanentlymasked)


---

### getMaskedBankAccountNumber()
- getMaskedBankAccountNumber(): [String](TopLevel.String.md)
  - : Returns the decrypted bank account number with
      all but the last 4 characters replaced with a '\*' character.
      
      If the number is empty (i.e. "" or null),
      it will be returned without an exception.


    **Returns:**
    - the decrypted bank account number with
      all but the last 4 characters replaced with a '\*' character.



---

### getMaskedBankAccountNumber(Number)
- getMaskedBankAccountNumber(ignore: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Returns the decrypted bank account number with
      all but the specified number characters replaced with a '\*' character.
      
      If the card number is empty (i.e. "" or null),
      it will be returned without an exception.
      
      Note that `ignore` is limited to 4 in an unsecure environment,
      and if account information for this payment instrument has been masked
      due to the data retention security policy for the site.


    **Parameters:**
    - ignore - the number of characters to leave unmasked

    **Returns:**
    - the decrypted bank account number with
      all but the specified number of characters replaced with a '\*' character.


    **See Also:**
    - [isPermanentlyMasked()](dw.order.PaymentInstrument.md#ispermanentlymasked)


---

### getMaskedCreditCardNumber()
- getMaskedCreditCardNumber(): [String](TopLevel.String.md)
  - : Returns the decrypted credit card number with
      all but the last 4 characters replaced with a '\*' character.
      
      If the number is empty,
      it will be returned without an exception.


    **Returns:**
    - the decrypted credit card number with
      all but the last 4 characters replaced with a '\*' character.



---

### getMaskedCreditCardNumber(Number)
- getMaskedCreditCardNumber(ignore: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Returns the decrypted credit card number with
      all but the specified number characters replaced with a '\*' character.
      
      If the card number is empty (i.e. "" or null),
      it will be returned without an exception.
      
      Note that `ignore` is limited to 4 in an unsecure environment,
      and if account information for this payment instrument has been masked
      due to the data retention security policy for the site.


    **Parameters:**
    - ignore - the number of characters to leave unmasked.

    **Returns:**
    - the decrypted credit card number with
      all but the specified number characters replaced with a '\*' character.


    **See Also:**
    - [isPermanentlyMasked()](dw.order.PaymentInstrument.md#ispermanentlymasked)


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

### getPaymentMethod()
- getPaymentMethod(): [String](TopLevel.String.md)
  - : Returns the identifier of the payment method represented by this
      payment instrument.


    **Returns:**
    - the identifier of the payment method represented by this
      payment instrument.



---

### isCreditCardExpired()
- isCreditCardExpired(): [Boolean](TopLevel.Boolean.md)
  - : Returns true if this payment instrument represents an expired credit
      card. This check is only logical if the credit card expiration month and
      year are set. If either of these attributes are not set, then this method
      always returns false.


    **Returns:**
    - true if this payment instrument represents an expired credit
              card, false otherwise



---

### isPermanentlyMasked()
- isPermanentlyMasked(): [Boolean](TopLevel.Boolean.md)
  - : Returns `true` if the account information for this Payment Instrument
      has been permanently masked as a result of the data retention security policy
      for the site or a creditcard tokenization, and `false` otherwise.
      
      When account information is masked only the last 4 digits of the credit card
      or bank account number are recoverable.  The bank account driver's license number
      and bank routing number are completely masked.


    **Returns:**
    - whether or not the account information has been masked


---

### setBankAccountDriversLicense(String)
- setBankAccountDriversLicense(license: [String](TopLevel.String.md)): void
  - : Set the driver's license number associated with a bank account payment instrument.

    **Parameters:**
    - license - the bank account holder driver's license.


---

### setBankAccountDriversLicenseStateCode(String)
- setBankAccountDriversLicenseStateCode(stateCode: [String](TopLevel.String.md)): void
  - : Set the driver's license state code associated with a bank account payment instrument.

    **Parameters:**
    - stateCode - the state in which the bank account driver's license was issued.


---

### setBankAccountHolder(String)
- setBankAccountHolder(holder: [String](TopLevel.String.md)): void
  - : Set the full name of the holder of a bank account payment instrument.

    **Parameters:**
    - holder - the bank account holder's full name.


---

### setBankAccountNumber(String)
- setBankAccountNumber(accountNumber: [String](TopLevel.String.md)): void
  - : Set the bank account number of a bank account payment instrument.

    **Parameters:**
    - accountNumber - the bank account number.


---

### setBankRoutingNumber(String)
- setBankRoutingNumber(routingNumber: [String](TopLevel.String.md)): void
  - : Set the bank routing number of a bank account payment instrument.

    **Parameters:**
    - routingNumber - the bank account rounting number.


---

### setCreditCardExpirationMonth(Number)
- setCreditCardExpirationMonth(aValue: [Number](TopLevel.Number.md)): void
  - : Sets the month of the year in which the credit card
      expires. Permissible values are from 1 to 12.


    **Parameters:**
    - aValue - the month of the year in which the credit card  expires. Permissible values are from 1 to 12.


---

### setCreditCardExpirationYear(Number)
- setCreditCardExpirationYear(aValue: [Number](TopLevel.Number.md)): void
  - : Sets the year in which the credit card
      expires, such as '2004'.


    **Parameters:**
    - aValue - the year in which the credit card  expires.


---

### setCreditCardHolder(String)
- setCreditCardHolder(aValue: [String](TopLevel.String.md)): void
  - : Sets the name of the credit card owner.

    **Parameters:**
    - aValue - the name of the credit card owner.


---

### setCreditCardIssueNumber(String)
- setCreditCardIssueNumber(aValue: [String](TopLevel.String.md)): void
  - : Set the credit card issue number.  This attribute is only used by
      specific credit/debit card processors such as Solo and Switch in the UK.


    **Parameters:**
    - aValue - the credit card issue number


---

### setCreditCardNumber(String)
- setCreditCardNumber(aValue: [String](TopLevel.String.md)): void
  - : Sets the credit card number for this payment.

    **Parameters:**
    - aValue - the new value of the credit card number.


---

### setCreditCardToken(String)
- setCreditCardToken(token: [String](TopLevel.String.md)): void
  - : Secure credit card data can be replaced by a token by utilizing a
      tokenization provider, which securely stores the credit card data using
      the token as a key. The stored data can later reused by including the
      token in a request. In this way credit card processes such as
      authorization and capture can be implemented without being responsible
      for persisting the credit card data.
      
      
      An Exception will be thrown when the token is null or blank.
      
      
      When setting a credit card token, the account information (including the
      creditcard number) is masked and all creditcard attributes are frozen and
      an attempt to change will be result in an exception.


    **Parameters:**
    - token - the token

    **See Also:**
    - [isPermanentlyMasked()](dw.order.PaymentInstrument.md#ispermanentlymasked)


---

### setCreditCardType(String)
- setCreditCardType(aValue: [String](TopLevel.String.md)): void
  - : Sets the type of the credit card.

    **Parameters:**
    - aValue - the type of the credit card.


---

### setCreditCardValidFromMonth(Number)
- setCreditCardValidFromMonth(aValue: [Number](TopLevel.Number.md)): void
  - : Sets the month of the year in which the credit card became valid (1-12).
      This attribute is not used by all credit card types


    **Parameters:**
    - aValue - the month of the year in which the credit card  became valid (1-12).


---

### setCreditCardValidFromYear(Number)
- setCreditCardValidFromYear(aValue: [Number](TopLevel.Number.md)): void
  - : Sets the year in which the credit card became valid, such as '2001'.
      This attribute is not used by all credit card types.


    **Parameters:**
    - aValue - the year in which the credit card became valid


---

### setGiftCertificateCode(String)
- setGiftCertificateCode(giftCertificateCode: [String](TopLevel.String.md)): void
  - : Sets the Gift Certificate code for this Payment Instrument.

    **Parameters:**
    - giftCertificateCode - the Gift Certificate code.


---

### setGiftCertificateID(String)
- ~~setGiftCertificateID(giftCertificateID: [String](TopLevel.String.md)): void~~
  - : Sets the Gift Certificate ID for this Payment Instrument.

    **Parameters:**
    - giftCertificateID - the Gift Certificate ID.

    **Deprecated:**
:::warning
Use [setGiftCertificateCode(String)](dw.order.PaymentInstrument.md#setgiftcertificatecodestring)
:::

---

<!-- prettier-ignore-end -->
