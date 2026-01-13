<!-- prettier-ignore-start -->
# Class SalesforcePaymentsZone

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.extensions.payments.SalesforcePaymentsZone](dw.extensions.payments.SalesforcePaymentsZone.md)



Salesforce Payments representation of a payments zone. See Salesforce Payments documentation for how to gain access
and configure payment zones and assign them to sites.




A payments zone contains information about the payment zone for a site and country.



## Property Summary

| Property | Description |
| --- | --- |
| [afterpayClearpayEnabled](#afterpayclearpayenabled): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns `true` if Afterpay Clearpay presentment is enabled, or `false` if not. |
| [applePayEnabled](#applepayenabled): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns `true` if Apple Pay presentment is enabled, or `false` if not. |
| [bancontactEnabled](#bancontactenabled): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns `true` if Bancontact presentment is enabled, or `false` if not. |
| [bancontactMobileEnabled](#bancontactmobileenabled): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns `true` if Bancontact Mobile presentment is enabled, or `false` if not. |
| [cardEnabled](#cardenabled): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns `true` if credit card presentment is enabled, or `false` if not. |
| [epsEnabled](#epsenabled): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns `true` if EPS presentment is enabled, or `false` if not. |
| [idealEnabled](#idealenabled): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns `true` if iDEAL presentment is enabled, or `false` if not. |
| [klarnaEnabled](#klarnaenabled): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns `true` if Klarna presentment is enabled, or `false` if not. |
| [klarnaPayInInstallmentsEnabled](#klarnapayininstallmentsenabled): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns `true` if Klarna Pay in Installments presentment is enabled, or `false` if not. |
| [klarnaPayNowEnabled](#klarnapaynowenabled): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns `true` if Klarna Pay Now presentment is enabled, or `false` if not. |
| [payPalEnabled](#paypalenabled): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns `true` if PayPal multi-step checkout presentment is enabled, or `false` if not. |
| [payPalExpressEnabled](#paypalexpressenabled): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns `true` if PayPal express checkout presentment is enabled, or `false` if not. |
| [paymentRequestEnabled](#paymentrequestenabled): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns `true` if W3C Payment Request API button presentment is enabled, or `false` if not. |
| [sepaDebitEnabled](#sepadebitenabled): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns `true` if SEPA Debit presentment is enabled, or `false` if not. |
| [venmoEnabled](#venmoenabled): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns `true` if Venmo multi-step checkout presentment is enabled, or `false` if not. |
| [venmoExpressEnabled](#venmoexpressenabled): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns `true` if Venmo express checkout presentment is enabled, or `false` if not. |
| [zoneId](#zoneid): [String](TopLevel.String.md) `(read-only)` | Returns the id of the payments zone. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getPaymentMethods](dw.extensions.payments.SalesforcePaymentsZone.md#getpaymentmethodsstring-money)([String](TopLevel.String.md), [Money](dw.value.Money.md)) | Returns a collection containing the merchant account payment methods to be presented for this payments zone. |
| [getZoneId](dw.extensions.payments.SalesforcePaymentsZone.md#getzoneid)() | Returns the id of the payments zone. |
| [isAfterpayClearpayEnabled](dw.extensions.payments.SalesforcePaymentsZone.md#isafterpayclearpayenabled)() | Returns `true` if Afterpay Clearpay presentment is enabled, or `false` if not. |
| [isApplePayEnabled](dw.extensions.payments.SalesforcePaymentsZone.md#isapplepayenabled)() | Returns `true` if Apple Pay presentment is enabled, or `false` if not. |
| [isBancontactEnabled](dw.extensions.payments.SalesforcePaymentsZone.md#isbancontactenabled)() | Returns `true` if Bancontact presentment is enabled, or `false` if not. |
| [isBancontactMobileEnabled](dw.extensions.payments.SalesforcePaymentsZone.md#isbancontactmobileenabled)() | Returns `true` if Bancontact Mobile presentment is enabled, or `false` if not. |
| [isCardEnabled](dw.extensions.payments.SalesforcePaymentsZone.md#iscardenabled)() | Returns `true` if credit card presentment is enabled, or `false` if not. |
| [isEpsEnabled](dw.extensions.payments.SalesforcePaymentsZone.md#isepsenabled)() | Returns `true` if EPS presentment is enabled, or `false` if not. |
| [isIdealEnabled](dw.extensions.payments.SalesforcePaymentsZone.md#isidealenabled)() | Returns `true` if iDEAL presentment is enabled, or `false` if not. |
| [isKlarnaEnabled](dw.extensions.payments.SalesforcePaymentsZone.md#isklarnaenabled)() | Returns `true` if Klarna presentment is enabled, or `false` if not. |
| [isKlarnaPayInInstallmentsEnabled](dw.extensions.payments.SalesforcePaymentsZone.md#isklarnapayininstallmentsenabled)() | Returns `true` if Klarna Pay in Installments presentment is enabled, or `false` if not. |
| [isKlarnaPayNowEnabled](dw.extensions.payments.SalesforcePaymentsZone.md#isklarnapaynowenabled)() | Returns `true` if Klarna Pay Now presentment is enabled, or `false` if not. |
| [isPayPalEnabled](dw.extensions.payments.SalesforcePaymentsZone.md#ispaypalenabled)() | Returns `true` if PayPal multi-step checkout presentment is enabled, or `false` if not. |
| [isPayPalExpressEnabled](dw.extensions.payments.SalesforcePaymentsZone.md#ispaypalexpressenabled)() | Returns `true` if PayPal express checkout presentment is enabled, or `false` if not. |
| [isPaymentRequestEnabled](dw.extensions.payments.SalesforcePaymentsZone.md#ispaymentrequestenabled)() | Returns `true` if W3C Payment Request API button presentment is enabled, or `false` if not. |
| [isSepaDebitEnabled](dw.extensions.payments.SalesforcePaymentsZone.md#issepadebitenabled)() | Returns `true` if SEPA Debit presentment is enabled, or `false` if not. |
| [isVenmoEnabled](dw.extensions.payments.SalesforcePaymentsZone.md#isvenmoenabled)() | Returns `true` if Venmo multi-step checkout presentment is enabled, or `false` if not. |
| [isVenmoExpressEnabled](dw.extensions.payments.SalesforcePaymentsZone.md#isvenmoexpressenabled)() | Returns `true` if Venmo express checkout presentment is enabled, or `false` if not. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### afterpayClearpayEnabled
- afterpayClearpayEnabled: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns `true` if Afterpay Clearpay presentment is enabled, or `false` if not.


---

### applePayEnabled
- applePayEnabled: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns `true` if Apple Pay presentment is enabled, or `false` if not.


---

### bancontactEnabled
- bancontactEnabled: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns `true` if Bancontact presentment is enabled, or `false` if not. Note: For Adyen
      merchant accounts, this setting refers to the "Bancontact Card" payment method.



---

### bancontactMobileEnabled
- bancontactMobileEnabled: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns `true` if Bancontact Mobile presentment is enabled, or `false` if not. Note: This
      setting is only applicable for Adyen Merchant Accounts



---

### cardEnabled
- cardEnabled: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns `true` if credit card presentment is enabled, or `false` if not.


---

### epsEnabled
- epsEnabled: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns `true` if EPS presentment is enabled, or `false` if not.


---

### idealEnabled
- idealEnabled: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns `true` if iDEAL presentment is enabled, or `false` if not.


---

### klarnaEnabled
- klarnaEnabled: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns `true` if Klarna presentment is enabled, or `false` if not. Note: For Adyen
      merchant accounts, this setting applies to the Klarna Pay Later payment method.



---

### klarnaPayInInstallmentsEnabled
- klarnaPayInInstallmentsEnabled: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns `true` if Klarna Pay in Installments presentment is enabled, or `false` if not.
      Note: This setting is only applicable for Adyen Merchant Accounts.



---

### klarnaPayNowEnabled
- klarnaPayNowEnabled: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns `true` if Klarna Pay Now presentment is enabled, or `false` if not. Note: This
      setting is only applicable for Adyen Merchant Accounts.



---

### payPalEnabled
- payPalEnabled: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns `true` if PayPal multi-step checkout presentment is enabled, or `false` if not.


---

### payPalExpressEnabled
- payPalExpressEnabled: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns `true` if PayPal express checkout presentment is enabled, or `false` if not.


---

### paymentRequestEnabled
- paymentRequestEnabled: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns `true` if W3C Payment Request API button presentment is enabled, or `false` if not.


---

### sepaDebitEnabled
- sepaDebitEnabled: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns `true` if SEPA Debit presentment is enabled, or `false` if not.


---

### venmoEnabled
- venmoEnabled: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns `true` if Venmo multi-step checkout presentment is enabled, or `false` if not.


---

### venmoExpressEnabled
- venmoExpressEnabled: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns `true` if Venmo express checkout presentment is enabled, or `false` if not.


---

### zoneId
- zoneId: [String](TopLevel.String.md) `(read-only)`
  - : Returns the id of the payments zone.


---

## Method Details

### getPaymentMethods(String, Money)
- getPaymentMethods(countryCode: [String](TopLevel.String.md), amount: [Money](dw.value.Money.md)): [Collection](dw.util.Collection.md)
  - : Returns a collection containing the merchant account payment methods to be presented for this payments zone.

    **Returns:**
    - collection of merchant account payment methods


---

### getZoneId()
- getZoneId(): [String](TopLevel.String.md)
  - : Returns the id of the payments zone.

    **Returns:**
    - zone id


---

### isAfterpayClearpayEnabled()
- isAfterpayClearpayEnabled(): [Boolean](TopLevel.Boolean.md)
  - : Returns `true` if Afterpay Clearpay presentment is enabled, or `false` if not.

    **Returns:**
    - if Afterpay Clearpay presentment is enabled


---

### isApplePayEnabled()
- isApplePayEnabled(): [Boolean](TopLevel.Boolean.md)
  - : Returns `true` if Apple Pay presentment is enabled, or `false` if not.

    **Returns:**
    - if Apple Pay presentment is enabled


---

### isBancontactEnabled()
- isBancontactEnabled(): [Boolean](TopLevel.Boolean.md)
  - : Returns `true` if Bancontact presentment is enabled, or `false` if not. Note: For Adyen
      merchant accounts, this setting refers to the "Bancontact Card" payment method.


    **Returns:**
    - if Bancontact presentment is enabled


---

### isBancontactMobileEnabled()
- isBancontactMobileEnabled(): [Boolean](TopLevel.Boolean.md)
  - : Returns `true` if Bancontact Mobile presentment is enabled, or `false` if not. Note: This
      setting is only applicable for Adyen Merchant Accounts


    **Returns:**
    - if Bancontact Mobile presentment is enabled


---

### isCardEnabled()
- isCardEnabled(): [Boolean](TopLevel.Boolean.md)
  - : Returns `true` if credit card presentment is enabled, or `false` if not.

    **Returns:**
    - if credit card presentment is enabled


---

### isEpsEnabled()
- isEpsEnabled(): [Boolean](TopLevel.Boolean.md)
  - : Returns `true` if EPS presentment is enabled, or `false` if not.

    **Returns:**
    - if EPS presentment is enabled


---

### isIdealEnabled()
- isIdealEnabled(): [Boolean](TopLevel.Boolean.md)
  - : Returns `true` if iDEAL presentment is enabled, or `false` if not.

    **Returns:**
    - if iDEAL presentment is enabled


---

### isKlarnaEnabled()
- isKlarnaEnabled(): [Boolean](TopLevel.Boolean.md)
  - : Returns `true` if Klarna presentment is enabled, or `false` if not. Note: For Adyen
      merchant accounts, this setting applies to the Klarna Pay Later payment method.


    **Returns:**
    - if Klarna presentment is enabled


---

### isKlarnaPayInInstallmentsEnabled()
- isKlarnaPayInInstallmentsEnabled(): [Boolean](TopLevel.Boolean.md)
  - : Returns `true` if Klarna Pay in Installments presentment is enabled, or `false` if not.
      Note: This setting is only applicable for Adyen Merchant Accounts.


    **Returns:**
    - if Klarna Pay in Installments presentment is enabled


---

### isKlarnaPayNowEnabled()
- isKlarnaPayNowEnabled(): [Boolean](TopLevel.Boolean.md)
  - : Returns `true` if Klarna Pay Now presentment is enabled, or `false` if not. Note: This
      setting is only applicable for Adyen Merchant Accounts.


    **Returns:**
    - if Klarna Pay Now presentment is enabled


---

### isPayPalEnabled()
- isPayPalEnabled(): [Boolean](TopLevel.Boolean.md)
  - : Returns `true` if PayPal multi-step checkout presentment is enabled, or `false` if not.

    **Returns:**
    - if PayPal multi-step checkout presentment is enabled


---

### isPayPalExpressEnabled()
- isPayPalExpressEnabled(): [Boolean](TopLevel.Boolean.md)
  - : Returns `true` if PayPal express checkout presentment is enabled, or `false` if not.

    **Returns:**
    - if PayPal express checkout presentment is enabled


---

### isPaymentRequestEnabled()
- isPaymentRequestEnabled(): [Boolean](TopLevel.Boolean.md)
  - : Returns `true` if W3C Payment Request API button presentment is enabled, or `false` if not.

    **Returns:**
    - if W3C Payment Request API presentment is enabled


---

### isSepaDebitEnabled()
- isSepaDebitEnabled(): [Boolean](TopLevel.Boolean.md)
  - : Returns `true` if SEPA Debit presentment is enabled, or `false` if not.

    **Returns:**
    - if SEPA Debit presentment is enabled


---

### isVenmoEnabled()
- isVenmoEnabled(): [Boolean](TopLevel.Boolean.md)
  - : Returns `true` if Venmo multi-step checkout presentment is enabled, or `false` if not.

    **Returns:**
    - if Venmo multi-step checkout presentment is enabled


---

### isVenmoExpressEnabled()
- isVenmoExpressEnabled(): [Boolean](TopLevel.Boolean.md)
  - : Returns `true` if Venmo express checkout presentment is enabled, or `false` if not.

    **Returns:**
    - if Venmo express checkout presentment is enabled


---

<!-- prettier-ignore-end -->
