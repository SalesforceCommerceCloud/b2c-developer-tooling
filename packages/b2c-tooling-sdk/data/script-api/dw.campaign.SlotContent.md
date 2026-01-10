<!-- prettier-ignore-start -->
# Class SlotContent

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.campaign.SlotContent](dw.campaign.SlotContent.md)

Represents content for a slot.


## Property Summary

| Property | Description |
| --- | --- |
| [calloutMsg](#calloutmsg): [MarkupText](dw.content.MarkupText.md) `(read-only)` | Returns the callout message for the slot. |
| [content](#content): [Collection](dw.util.Collection.md) `(read-only)` | Returns a collection of content based on the content type  for the slot. |
| [custom](#custom): [Map](dw.util.Map.md) `(read-only)` | Returns the custom attributes for the slot. |
| [recommenderName](#recommendername): [String](TopLevel.String.md) `(read-only)` | Returns the recommender name for slot configurations of type 'Recommendation' |
| [slotID](#slotid): [String](TopLevel.String.md) `(read-only)` | Returns the unique slot ID. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getCalloutMsg](dw.campaign.SlotContent.md#getcalloutmsg)() | Returns the callout message for the slot. |
| [getContent](dw.campaign.SlotContent.md#getcontent)() | Returns a collection of content based on the content type  for the slot. |
| [getCustom](dw.campaign.SlotContent.md#getcustom)() | Returns the custom attributes for the slot. |
| [getRecommenderName](dw.campaign.SlotContent.md#getrecommendername)() | Returns the recommender name for slot configurations of type 'Recommendation' |
| [getSlotID](dw.campaign.SlotContent.md#getslotid)() | Returns the unique slot ID. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### calloutMsg
- calloutMsg: [MarkupText](dw.content.MarkupText.md) `(read-only)`
  - : Returns the callout message for the slot.


---

### content
- content: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns a collection of content based on the content type
      for the slot. The collection will include one of the following
      types: [Product](dw.catalog.Product.md), [Content](dw.content.Content.md), [Category](dw.catalog.Category.md), or [MarkupText](dw.content.MarkupText.md).



---

### custom
- custom: [Map](dw.util.Map.md) `(read-only)`
  - : Returns the custom attributes for the slot.


---

### recommenderName
- recommenderName: [String](TopLevel.String.md) `(read-only)`
  - : Returns the recommender name for slot configurations of type 'Recommendation'


---

### slotID
- slotID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the unique slot ID.


---

## Method Details

### getCalloutMsg()
- getCalloutMsg(): [MarkupText](dw.content.MarkupText.md)
  - : Returns the callout message for the slot.

    **Returns:**
    - Callout message of the slot.


---

### getContent()
- getContent(): [Collection](dw.util.Collection.md)
  - : Returns a collection of content based on the content type
      for the slot. The collection will include one of the following
      types: [Product](dw.catalog.Product.md), [Content](dw.content.Content.md), [Category](dw.catalog.Category.md), or [MarkupText](dw.content.MarkupText.md).


    **Returns:**
    - All content of the slot.


---

### getCustom()
- getCustom(): [Map](dw.util.Map.md)
  - : Returns the custom attributes for the slot.

    **Returns:**
    - Custom attributes of the slot.


---

### getRecommenderName()
- getRecommenderName(): [String](TopLevel.String.md)
  - : Returns the recommender name for slot configurations of type 'Recommendation'

    **Returns:**
    - the recommender name for slot configurations of type 'Recommendation'


---

### getSlotID()
- getSlotID(): [String](TopLevel.String.md)
  - : Returns the unique slot ID.

    **Returns:**
    - ID of the slot.


---

<!-- prettier-ignore-end -->
