<!-- prettier-ignore-start -->
# Class SalesforcePaymentsMerchantAccount

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.extensions.payments.SalesforcePaymentsMerchantAccount](dw.extensions.payments.SalesforcePaymentsMerchantAccount.md)

Contains information about a merchant account configured for use with Salesforce Payments. See Salesforce Payments
documentation for how to gain access and configure it for use on your sites.



## Property Summary

| Property | Description |
| --- | --- |
| [accountId](#accountid): [String](TopLevel.String.md) `(read-only)` | Returns the ID of the Salesforce Payments merchant account. |
| [accountType](#accounttype): [String](TopLevel.String.md) `(read-only)` | Returns the type of the Salesforce Payments merchant account and environment, such as `"STRIPE_TEST"`  or `"ADYEN_LIVE"`. |
| [config](#config): [Object](TopLevel.Object.md) `(read-only)` | Returns an opaque configuration object containing gateway-specific information. |
| [live](#live): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns `true` if the account takes live payments, or `false` if it takes test payments. |
| [vendor](#vendor): [String](TopLevel.String.md) `(read-only)` | Returns the name of the gateway vendor, such as `"Stripe"` or `"Adyen"`. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getAccountId](dw.extensions.payments.SalesforcePaymentsMerchantAccount.md#getaccountid)() | Returns the ID of the Salesforce Payments merchant account. |
| [getAccountType](dw.extensions.payments.SalesforcePaymentsMerchantAccount.md#getaccounttype)() | Returns the type of the Salesforce Payments merchant account and environment, such as `"STRIPE_TEST"`  or `"ADYEN_LIVE"`. |
| [getConfig](dw.extensions.payments.SalesforcePaymentsMerchantAccount.md#getconfig)() | Returns an opaque configuration object containing gateway-specific information. |
| [getVendor](dw.extensions.payments.SalesforcePaymentsMerchantAccount.md#getvendor)() | Returns the name of the gateway vendor, such as `"Stripe"` or `"Adyen"`. |
| [isLive](dw.extensions.payments.SalesforcePaymentsMerchantAccount.md#islive)() | Returns `true` if the account takes live payments, or `false` if it takes test payments. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### accountId
- accountId: [String](TopLevel.String.md) `(read-only)`
  - : Returns the ID of the Salesforce Payments merchant account.

    **See Also:**
    - [PaymentTransaction.setAccountID(String)](dw.order.PaymentTransaction.md#setaccountidstring)
    - [PaymentTransaction.getAccountID()](dw.order.PaymentTransaction.md#getaccountid)


---

### accountType
- accountType: [String](TopLevel.String.md) `(read-only)`
  - : Returns the type of the Salesforce Payments merchant account and environment, such as `"STRIPE_TEST"`
      or `"ADYEN_LIVE"`.


    **See Also:**
    - [PaymentTransaction.setAccountType(String)](dw.order.PaymentTransaction.md#setaccounttypestring)
    - [PaymentTransaction.getAccountType()](dw.order.PaymentTransaction.md#getaccounttype)


---

### config
- config: [Object](TopLevel.Object.md) `(read-only)`
  - : Returns an opaque configuration object containing gateway-specific information. Do not depend on the structure or
      contents of this object as they may change at any time.



---

### live
- live: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns `true` if the account takes live payments, or `false` if it takes test payments.


---

### vendor
- vendor: [String](TopLevel.String.md) `(read-only)`
  - : Returns the name of the gateway vendor, such as `"Stripe"` or `"Adyen"`.


---

## Method Details

### getAccountId()
- getAccountId(): [String](TopLevel.String.md)
  - : Returns the ID of the Salesforce Payments merchant account.

    **Returns:**
    - merchant account ID

    **See Also:**
    - [PaymentTransaction.setAccountID(String)](dw.order.PaymentTransaction.md#setaccountidstring)
    - [PaymentTransaction.getAccountID()](dw.order.PaymentTransaction.md#getaccountid)


---

### getAccountType()
- getAccountType(): [String](TopLevel.String.md)
  - : Returns the type of the Salesforce Payments merchant account and environment, such as `"STRIPE_TEST"`
      or `"ADYEN_LIVE"`.


    **Returns:**
    - merchant account type

    **See Also:**
    - [PaymentTransaction.setAccountType(String)](dw.order.PaymentTransaction.md#setaccounttypestring)
    - [PaymentTransaction.getAccountType()](dw.order.PaymentTransaction.md#getaccounttype)


---

### getConfig()
- getConfig(): [Object](TopLevel.Object.md)
  - : Returns an opaque configuration object containing gateway-specific information. Do not depend on the structure or
      contents of this object as they may change at any time.


    **Returns:**
    - opaque configuration object


---

### getVendor()
- getVendor(): [String](TopLevel.String.md)
  - : Returns the name of the gateway vendor, such as `"Stripe"` or `"Adyen"`.

    **Returns:**
    - gateway vendor name


---

### isLive()
- isLive(): [Boolean](TopLevel.Boolean.md)
  - : Returns `true` if the account takes live payments, or `false` if it takes test payments.

    **Returns:**
    - `true` if the account takes live payments


---

<!-- prettier-ignore-end -->
