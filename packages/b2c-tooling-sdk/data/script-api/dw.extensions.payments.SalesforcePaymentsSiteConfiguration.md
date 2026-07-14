<!-- prettier-ignore-start -->
# Class SalesforcePaymentsSiteConfiguration

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.extensions.payments.SalesforcePaymentsSiteConfiguration](dw.extensions.payments.SalesforcePaymentsSiteConfiguration.md)



Salesforce Payments representation of a payment site configuration object. See Salesforce Payments
documentation for how to gain access and configure it for use on your sites.




A payment site configuration contains information about the configuration of the site such as
whether the site is activated with Express Checkout, Multi-Step Checkout or both.



## Property Summary

| Property | Description |
| --- | --- |
| [cardCaptureAutomatic](#cardcaptureautomatic): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns true if the capture method is set to automatic for credit card Payment Intents created for this site, or  false if the capture method is set to manual. |
| [expressCheckoutEnabled](#expresscheckoutenabled): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns true if Express Checkout is enabled for the site. |
| [expressOnCartEnabled](#expressoncartenabled): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns true if Express Checkout is enabled on the Cart page. |
| [expressOnCheckoutEnabled](#expressoncheckoutenabled): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns true if Express Checkout is enabled on the Checkout page. |
| [expressOnMiniCartEnabled](#expressonminicartenabled): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns true if Express Checkout is enabled on the Mini-Cart. |
| [expressOnPdpEnabled](#expressonpdpenabled): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns true if Express Checkout is enabled on the Product Detail Page. |
| [futureUsageOffSession](#futureusageoffsession): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns true if the payment card credential storage is configured to set up all applicable payments for off  session reuse, or false if the credential storage is configured to set up for on session reuse only the payments  for which the shopper actively confirms use of saved credentials. |
| [multiStepCheckoutEnabled](#multistepcheckoutenabled): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns true if Multi-Step Checkout is enabled for the site. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [isCardCaptureAutomatic](dw.extensions.payments.SalesforcePaymentsSiteConfiguration.md#iscardcaptureautomatic)() | Returns true if the capture method is set to automatic for credit card Payment Intents created for this site, or  false if the capture method is set to manual. |
| [isExpressCheckoutEnabled](dw.extensions.payments.SalesforcePaymentsSiteConfiguration.md#isexpresscheckoutenabled)() | Returns true if Express Checkout is enabled for the site. |
| [isExpressOnCartEnabled](dw.extensions.payments.SalesforcePaymentsSiteConfiguration.md#isexpressoncartenabled)() | Returns true if Express Checkout is enabled on the Cart page. |
| [isExpressOnCheckoutEnabled](dw.extensions.payments.SalesforcePaymentsSiteConfiguration.md#isexpressoncheckoutenabled)() | Returns true if Express Checkout is enabled on the Checkout page. |
| [isExpressOnMiniCartEnabled](dw.extensions.payments.SalesforcePaymentsSiteConfiguration.md#isexpressonminicartenabled)() | Returns true if Express Checkout is enabled on the Mini-Cart. |
| [isExpressOnPdpEnabled](dw.extensions.payments.SalesforcePaymentsSiteConfiguration.md#isexpressonpdpenabled)() | Returns true if Express Checkout is enabled on the Product Detail Page. |
| [isFutureUsageOffSession](dw.extensions.payments.SalesforcePaymentsSiteConfiguration.md#isfutureusageoffsession)() | Returns true if the payment card credential storage is configured to set up all applicable payments for off  session reuse, or false if the credential storage is configured to set up for on session reuse only the payments  for which the shopper actively confirms use of saved credentials. |
| [isMultiStepCheckoutEnabled](dw.extensions.payments.SalesforcePaymentsSiteConfiguration.md#ismultistepcheckoutenabled)() | Returns true if Multi-Step Checkout is enabled for the site. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### cardCaptureAutomatic
- cardCaptureAutomatic: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns true if the capture method is set to automatic for credit card Payment Intents created for this site, or
      false if the capture method is set to manual.



---

### expressCheckoutEnabled
- expressCheckoutEnabled: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns true if Express Checkout is enabled for the site.


---

### expressOnCartEnabled
- expressOnCartEnabled: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns true if Express Checkout is enabled on the Cart page.


---

### expressOnCheckoutEnabled
- expressOnCheckoutEnabled: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns true if Express Checkout is enabled on the Checkout page.


---

### expressOnMiniCartEnabled
- expressOnMiniCartEnabled: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns true if Express Checkout is enabled on the Mini-Cart.


---

### expressOnPdpEnabled
- expressOnPdpEnabled: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns true if Express Checkout is enabled on the Product Detail Page.


---

### futureUsageOffSession
- futureUsageOffSession: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns true if the payment card credential storage is configured to set up all applicable payments for off
      session reuse, or false if the credential storage is configured to set up for on session reuse only the payments
      for which the shopper actively confirms use of saved credentials.



---

### multiStepCheckoutEnabled
- multiStepCheckoutEnabled: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns true if Multi-Step Checkout is enabled for the site.


---

## Method Details

### isCardCaptureAutomatic()
- isCardCaptureAutomatic(): [Boolean](TopLevel.Boolean.md)
  - : Returns true if the capture method is set to automatic for credit card Payment Intents created for this site, or
      false if the capture method is set to manual.


    **Returns:**
    - true if the credit card capture method is automatic, or false if it is manual


---

### isExpressCheckoutEnabled()
- isExpressCheckoutEnabled(): [Boolean](TopLevel.Boolean.md)
  - : Returns true if Express Checkout is enabled for the site.

    **Returns:**
    - true if Express Checkout is enabled for the site, or false if not


---

### isExpressOnCartEnabled()
- isExpressOnCartEnabled(): [Boolean](TopLevel.Boolean.md)
  - : Returns true if Express Checkout is enabled on the Cart page.

    **Returns:**
    - true if Express Checkout is enabled on Cart, or false if not


---

### isExpressOnCheckoutEnabled()
- isExpressOnCheckoutEnabled(): [Boolean](TopLevel.Boolean.md)
  - : Returns true if Express Checkout is enabled on the Checkout page.

    **Returns:**
    - true if Express Checkout is enabled on Checkout, or false if not


---

### isExpressOnMiniCartEnabled()
- isExpressOnMiniCartEnabled(): [Boolean](TopLevel.Boolean.md)
  - : Returns true if Express Checkout is enabled on the Mini-Cart.

    **Returns:**
    - true if Express Checkout is enabled on Mini-Cart, or false if not


---

### isExpressOnPdpEnabled()
- isExpressOnPdpEnabled(): [Boolean](TopLevel.Boolean.md)
  - : Returns true if Express Checkout is enabled on the Product Detail Page.

    **Returns:**
    - true if Express Checkout is enabled on PDP, or false if not


---

### isFutureUsageOffSession()
- isFutureUsageOffSession(): [Boolean](TopLevel.Boolean.md)
  - : Returns true if the payment card credential storage is configured to set up all applicable payments for off
      session reuse, or false if the credential storage is configured to set up for on session reuse only the payments
      for which the shopper actively confirms use of saved credentials.


    **Returns:**
    - true if the future usage is off session, or false if on session


---

### isMultiStepCheckoutEnabled()
- isMultiStepCheckoutEnabled(): [Boolean](TopLevel.Boolean.md)
  - : Returns true if Multi-Step Checkout is enabled for the site.

    **Returns:**
    - true if Multi-Step Checkout is enabled for the site, or false if not


---

<!-- prettier-ignore-end -->
