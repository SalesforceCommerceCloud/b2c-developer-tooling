<!-- prettier-ignore-start -->
# Class Promotion

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)
      - [dw.campaign.Promotion](dw.campaign.Promotion.md)

This class represents a promotion in Commerce Cloud Digital. Examples of
promotions include:


- "Get 20% off your order"
- "$15 off a given product"
- "free shipping for all orders over $50"
- Get a bonus product with purchase of another product


The Promotion class provides access to the basic attributes of the promotion
such as name, callout message, and description, but the details of the
promotion rules are not available in the API due to their complexity.


Commerce Cloud Digital allows merchants to create a single logical "promotion
rule" (e.g. "Get 20% off your order") and then assign it to one or more
"containers" where the supported container types are campaigns or AB-tests. A
Promotion represents a specific instance of a promotion rule assigned to a
container. Promotion rules themselves that are not assigned to any container
are inaccessible through the API. Each instance (i.e. assignment) can have
separate "qualifiers". Qualifiers are the customer groups, source code
groups, or coupons that trigger a given promotion for a customer.



## Constant Summary

| Constant | Description |
| --- | --- |
| [EXCLUSIVITY_CLASS](#exclusivity_class): [String](TopLevel.String.md) = "CLASS" | Constant representing promotion exclusivity of type _class_. |
| [EXCLUSIVITY_GLOBAL](#exclusivity_global): [String](TopLevel.String.md) = "GLOBAL" | Constant representing promotion exclusivity of type _global_. |
| [EXCLUSIVITY_NO](#exclusivity_no): [String](TopLevel.String.md) = "NO" | Constant representing promotion exclusivity of type _no_. |
| [PROMOTION_CLASS_ORDER](#promotion_class_order): [String](TopLevel.String.md) = "ORDER" | Constant representing promotion class of type _order_. |
| [PROMOTION_CLASS_PRODUCT](#promotion_class_product): [String](TopLevel.String.md) = "PRODUCT" | Constant representing promotion class of type _product_. |
| [PROMOTION_CLASS_SHIPPING](#promotion_class_shipping): [String](TopLevel.String.md) = "SHIPPING" | Constant representing promotion class of type _shipping_. |
| [QUALIFIER_MATCH_MODE_ALL](#qualifier_match_mode_all): [String](TopLevel.String.md) = "all" | Constant indicating that that all qualifier conditions must be met in  order for this promotion to apply for a given customer. |
| [QUALIFIER_MATCH_MODE_ANY](#qualifier_match_mode_any): [String](TopLevel.String.md) = "any" | Constant indicating that that at least one qualifier condition must be  met in order for this promotion to apply for a given customer. |

## Property Summary

| Property | Description |
| --- | --- |
| [ID](#id): [String](TopLevel.String.md) `(read-only)` | Returns the unique ID of the promotion. |
| [active](#active): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns 'true' if promotion is active, otherwise 'false'. |
| ~~[basedOnCoupon](#basedoncoupon): [Boolean](TopLevel.Boolean.md)~~ `(read-only)` | Returns 'true' if the promotion is triggered by a coupon,  false otherwise. |
| [basedOnCoupons](#basedoncoupons): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns 'true' if the promotion is triggered by coupons,  false otherwise. |
| [basedOnCustomerGroups](#basedoncustomergroups): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns 'true' if the promotion is triggered by customer groups,  false otherwise. |
| [basedOnSourceCodes](#basedonsourcecodes): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns 'true' if the promotion is triggered by source codes,  false otherwise. |
| [calloutMsg](#calloutmsg): [MarkupText](dw.content.MarkupText.md) `(read-only)` | Returns the callout message of the promotion. |
| [campaign](#campaign): [Campaign](dw.campaign.Campaign.md) `(read-only)` | Returns the campaign this particular instance of the promotion is defined  in. |
| [combinablePromotions](#combinablepromotions): [String\[\]](TopLevel.String.md) `(read-only)` | Returns the promotion's combinable promotions. |
| ~~[conditionalDescription](#conditionaldescription): [MarkupText](dw.content.MarkupText.md)~~ `(read-only)` | Returns a description of the condition that must be met for this  promotion to be applicable. |
| [coupons](#coupons): [Collection](dw.util.Collection.md) `(read-only)` | Returns the coupons directly assigned to the promotion or assigned to the campaign of the promotion. |
| [custom](#custom): [CustomAttributes](dw.object.CustomAttributes.md) `(read-only)` | Returns the custom attributes for this extensible object. |
| [customerGroups](#customergroups): [Collection](dw.util.Collection.md) `(read-only)` | Returns the customer groups directly assigned to the promotion or assigned to the campaign of the promotion. |
| ~~[description](#description): [MarkupText](dw.content.MarkupText.md)~~ `(read-only)` | Returns the description of the promotion. |
| [details](#details): [MarkupText](dw.content.MarkupText.md) `(read-only)` | Returns the detailed description of the promotion. |
| [enabled](#enabled): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns true if promotion is enabled, otherwise false. |
| [endDate](#enddate): [Date](TopLevel.Date.md) `(read-only)` | Returns the effective end date of this instance of the promotion. |
| [exclusivity](#exclusivity): [String](TopLevel.String.md) `(read-only)` | Returns the promotion's exclusivity specifying how the promotion can be  combined with other promotions. |
| [image](#image): [MediaFile](dw.content.MediaFile.md) `(read-only)` | Returns the reference to the promotion image. |
| [lastModified](#lastmodified): [Date](TopLevel.Date.md) `(read-only)` | Returns the date that this object was last modified. |
| [mutuallyExclusivePromotions](#mutuallyexclusivepromotions): [String\[\]](TopLevel.String.md) `(read-only)` | Returns the promotion's mutually exclusive Promotions. |
| [name](#name): [String](TopLevel.String.md) `(read-only)` | Returns the name of the promotion. |
| [promotionClass](#promotionclass): [String](TopLevel.String.md) `(read-only)` | Returns the promotion class indicating the general type of the promotion. |
| [qualifierMatchMode](#qualifiermatchmode): [String](TopLevel.String.md) `(read-only)` | Returns the qualifier matching mode specified by this promotion. |
| [rank](#rank): [Number](TopLevel.Number.md) `(read-only)` | Returns the promotion's rank. |
| [refinable](#refinable): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns true if promotion is refinable, otherwise false. |
| [sourceCodeGroups](#sourcecodegroups): [Collection](dw.util.Collection.md) `(read-only)` | Returns the source code groups directly assigned to the promotion or assigned to the campaign of the promotion. |
| [startDate](#startdate): [Date](TopLevel.Date.md) `(read-only)` | Returns the effective start date of this instance of the promotion. |
| [tags](#tags): [String\[\]](TopLevel.String.md) `(read-only)` | Returns the promotion's tags. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getCalloutMsg](dw.campaign.Promotion.md#getcalloutmsg)() | Returns the callout message of the promotion. |
| [getCampaign](dw.campaign.Promotion.md#getcampaign)() | Returns the campaign this particular instance of the promotion is defined  in. |
| [getCombinablePromotions](dw.campaign.Promotion.md#getcombinablepromotions)() | Returns the promotion's combinable promotions. |
| ~~[getConditionalDescription](dw.campaign.Promotion.md#getconditionaldescription)()~~ | Returns a description of the condition that must be met for this  promotion to be applicable. |
| [getCoupons](dw.campaign.Promotion.md#getcoupons)() | Returns the coupons directly assigned to the promotion or assigned to the campaign of the promotion. |
| [getCustom](dw.campaign.Promotion.md#getcustom)() | Returns the custom attributes for this extensible object. |
| [getCustomerGroups](dw.campaign.Promotion.md#getcustomergroups)() | Returns the customer groups directly assigned to the promotion or assigned to the campaign of the promotion. |
| ~~[getDescription](dw.campaign.Promotion.md#getdescription)()~~ | Returns the description of the promotion. |
| [getDetails](dw.campaign.Promotion.md#getdetails)() | Returns the detailed description of the promotion. |
| [getEndDate](dw.campaign.Promotion.md#getenddate)() | Returns the effective end date of this instance of the promotion. |
| [getExclusivity](dw.campaign.Promotion.md#getexclusivity)() | Returns the promotion's exclusivity specifying how the promotion can be  combined with other promotions. |
| [getID](dw.campaign.Promotion.md#getid)() | Returns the unique ID of the promotion. |
| [getImage](dw.campaign.Promotion.md#getimage)() | Returns the reference to the promotion image. |
| [getLastModified](dw.campaign.Promotion.md#getlastmodified)() | Returns the date that this object was last modified. |
| [getMutuallyExclusivePromotions](dw.campaign.Promotion.md#getmutuallyexclusivepromotions)() | Returns the promotion's mutually exclusive Promotions. |
| [getName](dw.campaign.Promotion.md#getname)() | Returns the name of the promotion. |
| [getPromotionClass](dw.campaign.Promotion.md#getpromotionclass)() | Returns the promotion class indicating the general type of the promotion. |
| [getPromotionalPrice](dw.campaign.Promotion.md#getpromotionalpriceproduct)([Product](dw.catalog.Product.md)) | Returns the promotional price for the specified product. |
| [getPromotionalPrice](dw.campaign.Promotion.md#getpromotionalpriceproduct-productoptionmodel)([Product](dw.catalog.Product.md), [ProductOptionModel](dw.catalog.ProductOptionModel.md)) | This method follows the same logic as  [getPromotionalPrice(Product)](dw.campaign.Promotion.md#getpromotionalpriceproduct) but prices are calculated based  on the option values selected in the specified option model. |
| [getQualifierMatchMode](dw.campaign.Promotion.md#getqualifiermatchmode)() | Returns the qualifier matching mode specified by this promotion. |
| [getRank](dw.campaign.Promotion.md#getrank)() | Returns the promotion's rank. |
| [getSourceCodeGroups](dw.campaign.Promotion.md#getsourcecodegroups)() | Returns the source code groups directly assigned to the promotion or assigned to the campaign of the promotion. |
| [getStartDate](dw.campaign.Promotion.md#getstartdate)() | Returns the effective start date of this instance of the promotion. |
| [getTags](dw.campaign.Promotion.md#gettags)() | Returns the promotion's tags. |
| [isActive](dw.campaign.Promotion.md#isactive)() | Returns 'true' if promotion is active, otherwise 'false'. |
| ~~[isBasedOnCoupon](dw.campaign.Promotion.md#isbasedoncoupon)()~~ | Returns 'true' if the promotion is triggered by a coupon,  false otherwise. |
| [isBasedOnCoupons](dw.campaign.Promotion.md#isbasedoncoupons)() | Returns 'true' if the promotion is triggered by coupons,  false otherwise. |
| [isBasedOnCustomerGroups](dw.campaign.Promotion.md#isbasedoncustomergroups)() | Returns 'true' if the promotion is triggered by customer groups,  false otherwise. |
| [isBasedOnSourceCodes](dw.campaign.Promotion.md#isbasedonsourcecodes)() | Returns 'true' if the promotion is triggered by source codes,  false otherwise. |
| [isEnabled](dw.campaign.Promotion.md#isenabled)() | Returns true if promotion is enabled, otherwise false. |
| [isRefinable](dw.campaign.Promotion.md#isrefinable)() | Returns true if promotion is refinable, otherwise false. |

### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### EXCLUSIVITY_CLASS

- EXCLUSIVITY_CLASS: [String](TopLevel.String.md) = "CLASS"
  - : Constant representing promotion exclusivity of type _class_.


---

### EXCLUSIVITY_GLOBAL

- EXCLUSIVITY_GLOBAL: [String](TopLevel.String.md) = "GLOBAL"
  - : Constant representing promotion exclusivity of type _global_.


---

### EXCLUSIVITY_NO

- EXCLUSIVITY_NO: [String](TopLevel.String.md) = "NO"
  - : Constant representing promotion exclusivity of type _no_.


---

### PROMOTION_CLASS_ORDER

- PROMOTION_CLASS_ORDER: [String](TopLevel.String.md) = "ORDER"
  - : Constant representing promotion class of type _order_.


---

### PROMOTION_CLASS_PRODUCT

- PROMOTION_CLASS_PRODUCT: [String](TopLevel.String.md) = "PRODUCT"
  - : Constant representing promotion class of type _product_.


---

### PROMOTION_CLASS_SHIPPING

- PROMOTION_CLASS_SHIPPING: [String](TopLevel.String.md) = "SHIPPING"
  - : Constant representing promotion class of type _shipping_.


---

### QUALIFIER_MATCH_MODE_ALL

- QUALIFIER_MATCH_MODE_ALL: [String](TopLevel.String.md) = "all"
  - : Constant indicating that that all qualifier conditions must be met in
      order for this promotion to apply for a given customer.



---

### QUALIFIER_MATCH_MODE_ANY

- QUALIFIER_MATCH_MODE_ANY: [String](TopLevel.String.md) = "any"
  - : Constant indicating that that at least one qualifier condition must be
      met in order for this promotion to apply for a given customer.



---

## Property Details

### ID
- ID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the unique ID of the promotion.


---

### active
- active: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns 'true' if promotion is active, otherwise 'false'. 
      
      A promotion is active if its campaign is active, and the promotion
      is enabled, and it is scheduled for _now_.



---

### basedOnCoupon
- ~~basedOnCoupon: [Boolean](TopLevel.Boolean.md)~~ `(read-only)`
  - : Returns 'true' if the promotion is triggered by a coupon,
      false otherwise.


    **Deprecated:**
:::warning
Use [isBasedOnCoupons()](dw.campaign.Promotion.md#isbasedoncoupons)
:::

---

### basedOnCoupons
- basedOnCoupons: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns 'true' if the promotion is triggered by coupons,
      false otherwise.



---

### basedOnCustomerGroups
- basedOnCustomerGroups: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns 'true' if the promotion is triggered by customer groups,
      false otherwise.



---

### basedOnSourceCodes
- basedOnSourceCodes: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns 'true' if the promotion is triggered by source codes,
      false otherwise.



---

### calloutMsg
- calloutMsg: [MarkupText](dw.content.MarkupText.md) `(read-only)`
  - : Returns the callout message of the promotion.


---

### campaign
- campaign: [Campaign](dw.campaign.Campaign.md) `(read-only)`
  - : Returns the campaign this particular instance of the promotion is defined
      in.
      
      
      Note: If this promotion is defined as part of an AB-test, then a Campaign
      object will be returned, but it is a mock implementation, and not a true
      Campaign. This behavior is required for backwards compatibility and
      should not be relied upon as it may change in future releases.



---

### combinablePromotions
- combinablePromotions: [String\[\]](TopLevel.String.md) `(read-only)`
  - : Returns the promotion's combinable promotions. Combinable promotions is a set of promotions or groups this
      promotion can be combined with.



---

### conditionalDescription
- ~~conditionalDescription: [MarkupText](dw.content.MarkupText.md)~~ `(read-only)`
  - : Returns a description of the condition that must be met for this
      promotion to be applicable.
      
      
      The method and the related attribute have been deprecated. Use the
      [getDetails()](dw.campaign.Promotion.md#getdetails) method instead.


    **Deprecated:**
:::warning
Use [getDetails()](dw.campaign.Promotion.md#getdetails)
:::

---

### coupons
- coupons: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns the coupons directly assigned to the promotion or assigned to the campaign of the promotion. 
      
      If the promotion is not based on coupons (see [isBasedOnCoupons()](dw.campaign.Promotion.md#isbasedoncoupons)), or no coupons is assigned to the
      promotion or its campaign, an empty collection is returned.



---

### custom
- custom: [CustomAttributes](dw.object.CustomAttributes.md) `(read-only)`
  - : Returns the custom attributes for this extensible object.


---

### customerGroups
- customerGroups: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns the customer groups directly assigned to the promotion or assigned to the campaign of the promotion. 
      
      If the promotion is not based on customer groups (see [isBasedOnCustomerGroups()](dw.campaign.Promotion.md#isbasedoncustomergroups)), or no customer group is assigned to the
      promotion or its campaign, an empty collection is returned.



---

### description
- ~~description: [MarkupText](dw.content.MarkupText.md)~~ `(read-only)`
  - : Returns the description of the promotion.
      
      
      Method is deprecated and returns the same value as [getCalloutMsg()](dw.campaign.Promotion.md#getcalloutmsg).


    **Deprecated:**
:::warning
Use [getCalloutMsg()](dw.campaign.Promotion.md#getcalloutmsg)
:::

---

### details
- details: [MarkupText](dw.content.MarkupText.md) `(read-only)`
  - : Returns the detailed description of the promotion.


---

### enabled
- enabled: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns true if promotion is enabled, otherwise false.


---

### endDate
- endDate: [Date](TopLevel.Date.md) `(read-only)`
  - : Returns the effective end date of this instance of the promotion. If no
      explicit end date is defined for the promotion, the end date of the
      containing Campaign or AB-test is returned.



---

### exclusivity
- exclusivity: [String](TopLevel.String.md) `(read-only)`
  - : Returns the promotion's exclusivity specifying how the promotion can be
      combined with other promotions.
      Possible values are [EXCLUSIVITY_NO](dw.campaign.Promotion.md#exclusivity_no), [EXCLUSIVITY_CLASS](dw.campaign.Promotion.md#exclusivity_class)
      and [EXCLUSIVITY_GLOBAL](dw.campaign.Promotion.md#exclusivity_global).



---

### image
- image: [MediaFile](dw.content.MediaFile.md) `(read-only)`
  - : Returns the reference to the promotion image.


---

### lastModified
- lastModified: [Date](TopLevel.Date.md) `(read-only)`
  - : Returns the date that this object was last modified.


---

### mutuallyExclusivePromotions
- mutuallyExclusivePromotions: [String\[\]](TopLevel.String.md) `(read-only)`
  - : Returns the promotion's mutually exclusive Promotions. Mutually exclusive Promotions is a set of promotions or
      groups this promotion cannot be combined with.



---

### name
- name: [String](TopLevel.String.md) `(read-only)`
  - : Returns the name of the promotion.


---

### promotionClass
- promotionClass: [String](TopLevel.String.md) `(read-only)`
  - : Returns the promotion class indicating the general type of the promotion.
      Possible values are [PROMOTION_CLASS_PRODUCT](dw.campaign.Promotion.md#promotion_class_product),
      [PROMOTION_CLASS_ORDER](dw.campaign.Promotion.md#promotion_class_order), and [PROMOTION_CLASS_SHIPPING](dw.campaign.Promotion.md#promotion_class_shipping).



---

### qualifierMatchMode
- qualifierMatchMode: [String](TopLevel.String.md) `(read-only)`
  - : Returns the qualifier matching mode specified by this promotion. A
      promotion may have up to 3 qualifier conditions based on whether it is
      customer-group based, coupon based, and/or source-code based. A promotion
      may require for example that a customer belong to a certain customer
      group and also have a certain coupon in the cart in order for the
      promotion to apply. This method returns QUALIFIER\_MATCH\_MODE\_ALL if it is
      necessary that all the qualifier conditions are satisfied in order for
      this promotion to apply for a given customer. Otherwise, this method
      returns QUALIFIER\_MATCH\_MODE\_ANY indicating that at least of the
      qualifier conditions must be satisfied.
      
      
      Note: currently QUALIFIER\_MATCH\_MODE\_ALL is only supported for promotions
      assigned to campaigns, and not those assigned to AB-tests.



---

### rank
- rank: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the promotion's rank. Rank is a numeric attribute that you can specify.
      Promotions with a defined rank are calculated before promotions without a defined rank.
      If two promotions have a rank, the one with the lowest rank is calculated first.
      For example, a promotion with rank 10 is calculated before one with rank 30.



---

### refinable
- refinable: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns true if promotion is refinable, otherwise false.


---

### sourceCodeGroups
- sourceCodeGroups: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns the source code groups directly assigned to the promotion or assigned to the campaign of the promotion. 
      
      If the promotion is not based on source code groups (see [isBasedOnSourceCodes()](dw.campaign.Promotion.md#isbasedonsourcecodes)), or no source code group is assigned to the
      promotion or its campaign, an empty collection is returned.



---

### startDate
- startDate: [Date](TopLevel.Date.md) `(read-only)`
  - : Returns the effective start date of this instance of the promotion. If no
      explicit start date is defined for this instance, the start date of the
      containing Campaign or AB-test is returned.



---

### tags
- tags: [String\[\]](TopLevel.String.md) `(read-only)`
  - : Returns the promotion's tags. Tags are a way of categorizing and organizing promotions. A promotion can have many
      tags. Tags will be returned in alphabetical order.



---

## Method Details

### getCalloutMsg()
- getCalloutMsg(): [MarkupText](dw.content.MarkupText.md)
  - : Returns the callout message of the promotion.

    **Returns:**
    - Callout message of the promotion.


---

### getCampaign()
- getCampaign(): [Campaign](dw.campaign.Campaign.md)
  - : Returns the campaign this particular instance of the promotion is defined
      in.
      
      
      Note: If this promotion is defined as part of an AB-test, then a Campaign
      object will be returned, but it is a mock implementation, and not a true
      Campaign. This behavior is required for backwards compatibility and
      should not be relied upon as it may change in future releases.


    **Returns:**
    - Campaign of the promotion.


---

### getCombinablePromotions()
- getCombinablePromotions(): [String\[\]](TopLevel.String.md)
  - : Returns the promotion's combinable promotions. Combinable promotions is a set of promotions or groups this
      promotion can be combined with.


    **Returns:**
    - The promotion's set of combinable promotions.


---

### getConditionalDescription()
- ~~getConditionalDescription(): [MarkupText](dw.content.MarkupText.md)~~
  - : Returns a description of the condition that must be met for this
      promotion to be applicable.
      
      
      The method and the related attribute have been deprecated. Use the
      [getDetails()](dw.campaign.Promotion.md#getdetails) method instead.


    **Returns:**
    - Condition promotion description.

    **Deprecated:**
:::warning
Use [getDetails()](dw.campaign.Promotion.md#getdetails)
:::

---

### getCoupons()
- getCoupons(): [Collection](dw.util.Collection.md)
  - : Returns the coupons directly assigned to the promotion or assigned to the campaign of the promotion. 
      
      If the promotion is not based on coupons (see [isBasedOnCoupons()](dw.campaign.Promotion.md#isbasedoncoupons)), or no coupons is assigned to the
      promotion or its campaign, an empty collection is returned.


    **Returns:**
    - Coupons assigned to promotion in no particular order.


---

### getCustom()
- getCustom(): [CustomAttributes](dw.object.CustomAttributes.md)
  - : Returns the custom attributes for this extensible object.


---

### getCustomerGroups()
- getCustomerGroups(): [Collection](dw.util.Collection.md)
  - : Returns the customer groups directly assigned to the promotion or assigned to the campaign of the promotion. 
      
      If the promotion is not based on customer groups (see [isBasedOnCustomerGroups()](dw.campaign.Promotion.md#isbasedoncustomergroups)), or no customer group is assigned to the
      promotion or its campaign, an empty collection is returned.


    **Returns:**
    - Customer groups assigned to promotion in no particular order.


---

### getDescription()
- ~~getDescription(): [MarkupText](dw.content.MarkupText.md)~~
  - : Returns the description of the promotion.
      
      
      Method is deprecated and returns the same value as [getCalloutMsg()](dw.campaign.Promotion.md#getcalloutmsg).


    **Returns:**
    - Description of the promotion.

    **Deprecated:**
:::warning
Use [getCalloutMsg()](dw.campaign.Promotion.md#getcalloutmsg)
:::

---

### getDetails()
- getDetails(): [MarkupText](dw.content.MarkupText.md)
  - : Returns the detailed description of the promotion.

    **Returns:**
    - Detailed promotion description.


---

### getEndDate()
- getEndDate(): [Date](TopLevel.Date.md)
  - : Returns the effective end date of this instance of the promotion. If no
      explicit end date is defined for the promotion, the end date of the
      containing Campaign or AB-test is returned.


    **Returns:**
    - End date of the promotion, or null if no end date is defined.


---

### getExclusivity()
- getExclusivity(): [String](TopLevel.String.md)
  - : Returns the promotion's exclusivity specifying how the promotion can be
      combined with other promotions.
      Possible values are [EXCLUSIVITY_NO](dw.campaign.Promotion.md#exclusivity_no), [EXCLUSIVITY_CLASS](dw.campaign.Promotion.md#exclusivity_class)
      and [EXCLUSIVITY_GLOBAL](dw.campaign.Promotion.md#exclusivity_global).


    **Returns:**
    - Promotion exclusivity


---

### getID()
- getID(): [String](TopLevel.String.md)
  - : Returns the unique ID of the promotion.

    **Returns:**
    - ID of the promotion.


---

### getImage()
- getImage(): [MediaFile](dw.content.MediaFile.md)
  - : Returns the reference to the promotion image.

    **Returns:**
    - Image of the promotion.


---

### getLastModified()
- getLastModified(): [Date](TopLevel.Date.md)
  - : Returns the date that this object was last modified.

    **Returns:**
    - the date that this object was last modified.


---

### getMutuallyExclusivePromotions()
- getMutuallyExclusivePromotions(): [String\[\]](TopLevel.String.md)
  - : Returns the promotion's mutually exclusive Promotions. Mutually exclusive Promotions is a set of promotions or
      groups this promotion cannot be combined with.


    **Returns:**
    - The promotion's set of mutually exclusive Promotions.


---

### getName()
- getName(): [String](TopLevel.String.md)
  - : Returns the name of the promotion.

    **Returns:**
    - Name of the promotion.


---

### getPromotionClass()
- getPromotionClass(): [String](TopLevel.String.md)
  - : Returns the promotion class indicating the general type of the promotion.
      Possible values are [PROMOTION_CLASS_PRODUCT](dw.campaign.Promotion.md#promotion_class_product),
      [PROMOTION_CLASS_ORDER](dw.campaign.Promotion.md#promotion_class_order), and [PROMOTION_CLASS_SHIPPING](dw.campaign.Promotion.md#promotion_class_shipping).


    **Returns:**
    - Promotion class or null if the promotion rule has not been
              configured.



---

### getPromotionalPrice(Product)
- getPromotionalPrice(product: [Product](dw.catalog.Product.md)): [Money](dw.value.Money.md)
  - : Returns the promotional price for the specified product. The promotional
      price is only returned if the following conditions are met:
      
      
      - this promotion is a product promotion without purchase conditions,  i.e. is of type 'Without qualifying products'.
      - this promotion's discount is Discount.TYPE\_AMOUNT,  Discount.TYPE\_PERCENTAGE, Discount.TYPE\_FIXED\_PRICE, or  Discount.TYPE\_PRICEBOOK\_PRICE.
      - specified product is one of the discounted products of the  promotion.
      - the product has a valid sales price for quantity 1.0.
      
      
      In all other cases, the method will return Money.NOT\_AVAILABLE. It is
      not required that this promotion be an active customer
      promotion.
      
      NOTE: the method might be extended in the future to support more
      promotion types.
      
      To calculate the promotional price, the method uses the current sales
      price of the product for quantity 1.0, and applies the discount
      associated with the promotion to this price. For example, if the product
      price is $14.99, and the promotion discount is 10%, the method will
      return $13.49. If the discount is $2 off, the method will return $12.99.
      If the discount is $10.00 fixed price, the method will return $10.00.


    **Parameters:**
    - product - the product to calculate the discount for

    **Returns:**
    - the price of the passed product after promotional discount is
              applied, or Money.NOT\_AVAILABLE if any of the restrictions on
              product or promotion are not met.



---

### getPromotionalPrice(Product, ProductOptionModel)
- getPromotionalPrice(product: [Product](dw.catalog.Product.md), optionModel: [ProductOptionModel](dw.catalog.ProductOptionModel.md)): [Money](dw.value.Money.md)
  - : This method follows the same logic as
      [getPromotionalPrice(Product)](dw.campaign.Promotion.md#getpromotionalpriceproduct) but prices are calculated based
      on the option values selected in the specified option model.


    **Parameters:**
    - product - the product to calculate the discount for
    - optionModel - the option model to use when calculating

    **Returns:**
    - the price of the passed product after promotional discount is
              applied, or Money.NOT\_AVAILABLE if any of the restrictions on
              product or promotion are not met.



---

### getQualifierMatchMode()
- getQualifierMatchMode(): [String](TopLevel.String.md)
  - : Returns the qualifier matching mode specified by this promotion. A
      promotion may have up to 3 qualifier conditions based on whether it is
      customer-group based, coupon based, and/or source-code based. A promotion
      may require for example that a customer belong to a certain customer
      group and also have a certain coupon in the cart in order for the
      promotion to apply. This method returns QUALIFIER\_MATCH\_MODE\_ALL if it is
      necessary that all the qualifier conditions are satisfied in order for
      this promotion to apply for a given customer. Otherwise, this method
      returns QUALIFIER\_MATCH\_MODE\_ANY indicating that at least of the
      qualifier conditions must be satisfied.
      
      
      Note: currently QUALIFIER\_MATCH\_MODE\_ALL is only supported for promotions
      assigned to campaigns, and not those assigned to AB-tests.


    **Returns:**
    - the qualifier matching mode specified by this promotion, either
              QUALIFIER\_MATCH\_MODE\_ALL or QUALIFIER\_MATCH\_MODE\_ANY.



---

### getRank()
- getRank(): [Number](TopLevel.Number.md)
  - : Returns the promotion's rank. Rank is a numeric attribute that you can specify.
      Promotions with a defined rank are calculated before promotions without a defined rank.
      If two promotions have a rank, the one with the lowest rank is calculated first.
      For example, a promotion with rank 10 is calculated before one with rank 30.


    **Returns:**
    - The promotion's rank.


---

### getSourceCodeGroups()
- getSourceCodeGroups(): [Collection](dw.util.Collection.md)
  - : Returns the source code groups directly assigned to the promotion or assigned to the campaign of the promotion. 
      
      If the promotion is not based on source code groups (see [isBasedOnSourceCodes()](dw.campaign.Promotion.md#isbasedonsourcecodes)), or no source code group is assigned to the
      promotion or its campaign, an empty collection is returned.


    **Returns:**
    - Source code groups assigned to promotion in no particular order.


---

### getStartDate()
- getStartDate(): [Date](TopLevel.Date.md)
  - : Returns the effective start date of this instance of the promotion. If no
      explicit start date is defined for this instance, the start date of the
      containing Campaign or AB-test is returned.


    **Returns:**
    - Start date of the promotion, or null if no start date is defined.


---

### getTags()
- getTags(): [String\[\]](TopLevel.String.md)
  - : Returns the promotion's tags. Tags are a way of categorizing and organizing promotions. A promotion can have many
      tags. Tags will be returned in alphabetical order.


    **Returns:**
    - The promotion's set of tags.


---

### isActive()
- isActive(): [Boolean](TopLevel.Boolean.md)
  - : Returns 'true' if promotion is active, otherwise 'false'. 
      
      A promotion is active if its campaign is active, and the promotion
      is enabled, and it is scheduled for _now_.


    **Returns:**
    - true if promotion is active, otherwise false.


---

### isBasedOnCoupon()
- ~~isBasedOnCoupon(): [Boolean](TopLevel.Boolean.md)~~
  - : Returns 'true' if the promotion is triggered by a coupon,
      false otherwise.


    **Returns:**
    - true if promotion is triggered by coupon, otherwise false.

    **Deprecated:**
:::warning
Use [isBasedOnCoupons()](dw.campaign.Promotion.md#isbasedoncoupons)
:::

---

### isBasedOnCoupons()
- isBasedOnCoupons(): [Boolean](TopLevel.Boolean.md)
  - : Returns 'true' if the promotion is triggered by coupons,
      false otherwise.


    **Returns:**
    - true if promotion is triggered by coupons, otherwise false.


---

### isBasedOnCustomerGroups()
- isBasedOnCustomerGroups(): [Boolean](TopLevel.Boolean.md)
  - : Returns 'true' if the promotion is triggered by customer groups,
      false otherwise.


    **Returns:**
    - true if promotion is triggered by customer groups, otherwise false.


---

### isBasedOnSourceCodes()
- isBasedOnSourceCodes(): [Boolean](TopLevel.Boolean.md)
  - : Returns 'true' if the promotion is triggered by source codes,
      false otherwise.


    **Returns:**
    - true if promotion is triggered by source codes, otherwise false.


---

### isEnabled()
- isEnabled(): [Boolean](TopLevel.Boolean.md)
  - : Returns true if promotion is enabled, otherwise false.

    **Returns:**
    - true if promotion is enabled, otherwise false.


---

### isRefinable()
- isRefinable(): [Boolean](TopLevel.Boolean.md)
  - : Returns true if promotion is refinable, otherwise false.

    **Returns:**
    - true if promotion is refinable, otherwise false.


---

<!-- prettier-ignore-end -->
