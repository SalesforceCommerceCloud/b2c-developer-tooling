<!-- prettier-ignore-start -->
# Class ShopperConsentMgr

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.customer.consent.ShopperConsentMgr](dw.customer.consent.ShopperConsentMgr.md)

Provides static helper methods for managing shopper marketing consent subscriptions.


This API enables retrieving and updating marketing consent preferences.
Consent subscriptions define communication categories (e.g., "Newsletter", "Product Updates")
and the channels (EMAIL, SMS, WHATSAPP) through which marketing communications can be sent.




**Prerequisites:**

- The Marketing Consent feature must be enabled and configured
- For consent status retrieval, the current request must have a customer context





**Example usage:**

```
var ShopperConsentMgr = require('dw/customer/consent/ShopperConsentMgr');

// Get all subscriptions for the current site
var subscriptions = ShopperConsentMgr.getSubscriptions();

for each (var sub in subscriptions) {
    trace('Subscription: ' + sub.subscriptionId + ' - ' + sub.title);
    trace('Available channels: ' + sub.channels.join(', '));
}

// Get subscriptions with consent status (for authenticated customers)
var subsWithStatus = ShopperConsentMgr.getSubscriptions(null, true);

// Update consent for a specific subscription
ShopperConsentMgr.updateSubscription(
    'customer@example.com',
    'newsletter-subscription',
    'EMAIL',
    'OPT_IN'
);
```


**See Also:**
- [MarketingConsentSubscription](dw.customer.consent.MarketingConsentSubscription.md)
- [ConsentStatusEntry](dw.customer.consent.ConsentStatusEntry.md)


## Property Summary

| Property | Description |
| --- | --- |
| [subscriptions](#subscriptions): [Collection](dw.util.Collection.md) `(read-only)` | Retrieves marketing consent subscriptions for the current site. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| static [getSubscriptions](dw.customer.consent.ShopperConsentMgr.md#getsubscriptions)() | Retrieves marketing consent subscriptions for the current site. |
| static [getSubscriptions](dw.customer.consent.ShopperConsentMgr.md#getsubscriptionslist-boolean)([List](dw.util.List.md), [Boolean](TopLevel.Boolean.md)) | Retrieves marketing consent subscriptions for the current site with optional filtering and status. |
| static [updateSubscription](dw.customer.consent.ShopperConsentMgr.md#updatesubscriptionstring-string-string-string)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Updates consent status for a subscription. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### subscriptions
- subscriptions: [Collection](dw.util.Collection.md) `(read-only)`
  - : Retrieves marketing consent subscriptions for the current site.
      
      
      This method returns all available consent subscriptions without consent status information.



---

## Method Details

### getSubscriptions()
- static getSubscriptions(): [Collection](dw.util.Collection.md)
  - : Retrieves marketing consent subscriptions for the current site.
      
      
      This method returns all available consent subscriptions without consent status information.


    **Returns:**
    - A collection of [MarketingConsentSubscription](dw.customer.consent.MarketingConsentSubscription.md) objects.

    **Throws:**
    - ShopperConsentException - if the consent feature is not enabled or retrieval fails.


---

### getSubscriptions(List, Boolean)
- static getSubscriptions(tags: [List](dw.util.List.md), includeConsentStatus: [Boolean](TopLevel.Boolean.md)): [Collection](dw.util.Collection.md)
  - : Retrieves marketing consent subscriptions for the current site with optional filtering and status.
      
      
      Use this method to retrieve subscriptions filtered by tags and optionally include
      the current consent status for authenticated customers.


    **Parameters:**
    - tags - Optional list of tags to filter subscriptions. Pass null for all subscriptions.
    - includeConsentStatus - If true, includes the current consent status for each subscription.                              Requires a customer context.

    **Returns:**
    - A collection of [MarketingConsentSubscription](dw.customer.consent.MarketingConsentSubscription.md) objects.

    **Throws:**
    - ShopperConsentException - if the consent feature is not enabled, retrieval fails,                                  or consent status retrieval fails.


---

### updateSubscription(String, String, String, String)
- static updateSubscription(contactPointValue: [String](TopLevel.String.md), subscriptionId: [String](TopLevel.String.md), channel: [String](TopLevel.String.md), status: [String](TopLevel.String.md)): void
  - : Updates consent status for a subscription.
      
      
      This method updates the consent status in Salesforce Core for the specified
      contact point and subscription channel combination.


    **Parameters:**
    - contactPointValue - The contact point value (email address or phone number).
    - subscriptionId - The subscription ID.
    - channel - The channel type ("EMAIL", "SMS", or "WHATSAPP").
    - status - The consent status ("OPT\_IN" or "OPT\_OUT").

    **Throws:**
    - ShopperConsentException - if the consent feature is not enabled or update fails.


---

<!-- prettier-ignore-end -->
