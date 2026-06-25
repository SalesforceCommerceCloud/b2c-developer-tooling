<!-- prettier-ignore-start -->
# Class MarketingConsentSubscription

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.customer.consent.MarketingConsentSubscription](dw.customer.consent.MarketingConsentSubscription.md)

Represents a marketing consent subscription for a shopper.


A marketing consent subscription defines a communication preference category (e.g., "Newsletter", "Product Updates")
with associated channels (EMAIL, SMS, WHATSAPP) through which the shopper can receive marketing communications.




Example usage:


```

var subscriptions = dw.customer.consent.ShopperConsentMgr.getSubscriptions();
for each (var sub in subscriptions) {
    trace('Subscription: ' + sub.subscriptionId + ' - ' + sub.title);
    trace('Channels: ' + sub.channels);
}
```



## Property Summary

| Property | Description |
| --- | --- |
| [channels](#channels): [String\[\]](TopLevel.String.md) `(read-only)` | Returns the available channels for this subscription. |
| [consentRequired](#consentrequired): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns whether consent is required for this subscription. |
| [consentStatus](#consentstatus): [Collection](dw.util.Collection.md) `(read-only)` | Returns the consent status entries for this subscription. |
| [consentType](#consenttype): [String](TopLevel.String.md) `(read-only)` | Returns the consent type for this subscription. |
| [defaultStatus](#defaultstatus): [String](TopLevel.String.md) `(read-only)` | Returns the default consent status for this subscription. |
| [subscriptionId](#subscriptionid): [String](TopLevel.String.md) `(read-only)` | Returns the unique identifier for this subscription. |
| [subtitle](#subtitle): [String](TopLevel.String.md) `(read-only)` | Returns the localized subtitle of this subscription. |
| [tags](#tags): [String\[\]](TopLevel.String.md) `(read-only)` | Returns the tags associated with this subscription. |
| [title](#title): [String](TopLevel.String.md) `(read-only)` | Returns the localized title of this subscription. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getChannels](dw.customer.consent.MarketingConsentSubscription.md#getchannels)() | Returns the available channels for this subscription. |
| [getConsentRequired](dw.customer.consent.MarketingConsentSubscription.md#getconsentrequired)() | Returns whether consent is required for this subscription. |
| [getConsentStatus](dw.customer.consent.MarketingConsentSubscription.md#getconsentstatus)() | Returns the consent status entries for this subscription. |
| [getConsentType](dw.customer.consent.MarketingConsentSubscription.md#getconsenttype)() | Returns the consent type for this subscription. |
| [getDefaultStatus](dw.customer.consent.MarketingConsentSubscription.md#getdefaultstatus)() | Returns the default consent status for this subscription. |
| [getSubscriptionId](dw.customer.consent.MarketingConsentSubscription.md#getsubscriptionid)() | Returns the unique identifier for this subscription. |
| [getSubtitle](dw.customer.consent.MarketingConsentSubscription.md#getsubtitle)() | Returns the localized subtitle of this subscription. |
| [getTags](dw.customer.consent.MarketingConsentSubscription.md#gettags)() | Returns the tags associated with this subscription. |
| [getTitle](dw.customer.consent.MarketingConsentSubscription.md#gettitle)() | Returns the localized title of this subscription. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### channels
- channels: [String\[\]](TopLevel.String.md) `(read-only)`
  - : Returns the available channels for this subscription.
      
      
      Channels represent the communication methods (EMAIL, SMS, WHATSAPP) available for this subscription.



---

### consentRequired
- consentRequired: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns whether consent is required for this subscription.


---

### consentStatus
- consentStatus: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns the consent status entries for this subscription.
      
      
      This is only populated when the 'includeConsentStatus' parameter is true in the getSubscriptions call, and the
      customer is authenticated.



---

### consentType
- consentType: [String](TopLevel.String.md) `(read-only)`
  - : Returns the consent type for this subscription.


---

### defaultStatus
- defaultStatus: [String](TopLevel.String.md) `(read-only)`
  - : Returns the default consent status for this subscription.


---

### subscriptionId
- subscriptionId: [String](TopLevel.String.md) `(read-only)`
  - : Returns the unique identifier for this subscription.


---

### subtitle
- subtitle: [String](TopLevel.String.md) `(read-only)`
  - : Returns the localized subtitle of this subscription.


---

### tags
- tags: [String\[\]](TopLevel.String.md) `(read-only)`
  - : Returns the tags associated with this subscription.
      
      
      Tags can be used to categorize and filter subscriptions.



---

### title
- title: [String](TopLevel.String.md) `(read-only)`
  - : Returns the localized title of this subscription.


---

## Method Details

### getChannels()
- getChannels(): [String\[\]](TopLevel.String.md)
  - : Returns the available channels for this subscription.
      
      
      Channels represent the communication methods (EMAIL, SMS, WHATSAPP) available for this subscription.


    **Returns:**
    - A list of channel strings (lowercase).


---

### getConsentRequired()
- getConsentRequired(): [Boolean](TopLevel.Boolean.md)
  - : Returns whether consent is required for this subscription.

    **Returns:**
    - True if consent is required, false otherwise.


---

### getConsentStatus()
- getConsentStatus(): [Collection](dw.util.Collection.md)
  - : Returns the consent status entries for this subscription.
      
      
      This is only populated when the 'includeConsentStatus' parameter is true in the getSubscriptions call, and the
      customer is authenticated.


    **Returns:**
    - A collection of ConsentStatusEntry objects, or null if not requested.


---

### getConsentType()
- getConsentType(): [String](TopLevel.String.md)
  - : Returns the consent type for this subscription.

    **Returns:**
    - The consent type (e.g., "SINGLE\_OPT\_IN", "DOUBLE\_OPT\_IN").


---

### getDefaultStatus()
- getDefaultStatus(): [String](TopLevel.String.md)
  - : Returns the default consent status for this subscription.

    **Returns:**
    - The default status (e.g., "OPT\_IN", "OPT\_OUT").


---

### getSubscriptionId()
- getSubscriptionId(): [String](TopLevel.String.md)
  - : Returns the unique identifier for this subscription.

    **Returns:**
    - The subscription ID.


---

### getSubtitle()
- getSubtitle(): [String](TopLevel.String.md)
  - : Returns the localized subtitle of this subscription.

    **Returns:**
    - The subscription subtitle.


---

### getTags()
- getTags(): [String\[\]](TopLevel.String.md)
  - : Returns the tags associated with this subscription.
      
      
      Tags can be used to categorize and filter subscriptions.


    **Returns:**
    - A list of tag strings.


---

### getTitle()
- getTitle(): [String](TopLevel.String.md)
  - : Returns the localized title of this subscription.

    **Returns:**
    - The subscription title.


---

<!-- prettier-ignore-end -->
