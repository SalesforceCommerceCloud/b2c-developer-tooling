<!-- prettier-ignore-start -->
# Class Recommendation

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)
      - [dw.catalog.Recommendation](dw.catalog.Recommendation.md)

Represents a recommendation in Commerce Cloud Digital.


## Constant Summary

| Constant | Description |
| --- | --- |
| ~~[RECOMMENDATION_TYPE_CROSS_SELL](#recommendation_type_cross_sell): [Number](TopLevel.Number.md) = 1~~ | Represents a cross-sell recommendation. |
| ~~[RECOMMENDATION_TYPE_OTHER](#recommendation_type_other): [Number](TopLevel.Number.md) = 3~~ | Represents a recommendation that is neither a cross-sell or an up-sell. |
| ~~[RECOMMENDATION_TYPE_UP_SELL](#recommendation_type_up_sell): [Number](TopLevel.Number.md) = 2~~ | Represents an up-sell recommendation. |

## Property Summary

| Property | Description |
| --- | --- |
| [calloutMsg](#calloutmsg): [MarkupText](dw.content.MarkupText.md) `(read-only)` | Returns the recommendation's callout message in the current locale. |
| [catalog](#catalog): [Catalog](dw.catalog.Catalog.md) `(read-only)` | Return the catalog containing the recommendation. |
| [image](#image): [MediaFile](dw.content.MediaFile.md) `(read-only)` | Returns the recommendation's image. |
| [longDescription](#longdescription): [MarkupText](dw.content.MarkupText.md) `(read-only)` | Returns the recommendation's long description in the current locale. |
| [name](#name): [String](TopLevel.String.md) `(read-only)` | Returns the name of the recommended item in the current locale. |
| [recommendationType](#recommendationtype): [Number](TopLevel.Number.md) `(read-only)` | Returns the type of the recommendation. |
| [recommendedItem](#recommendeditem): [Object](TopLevel.Object.md) `(read-only)` | Return a reference to the recommended item. |
| [recommendedItemID](#recommendeditemid): [String](TopLevel.String.md) `(read-only)` | Return the ID of the recommended item. |
| [shortDescription](#shortdescription): [MarkupText](dw.content.MarkupText.md) `(read-only)` | Returns the recommendation's short description in the current locale. |
| [sourceItem](#sourceitem): [Object](TopLevel.Object.md) `(read-only)` | Return a reference to the source item. |
| [sourceItemID](#sourceitemid): [String](TopLevel.String.md) `(read-only)` | Return the ID of the recommendation source item. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getCalloutMsg](dw.catalog.Recommendation.md#getcalloutmsg)() | Returns the recommendation's callout message in the current locale. |
| [getCatalog](dw.catalog.Recommendation.md#getcatalog)() | Return the catalog containing the recommendation. |
| [getImage](dw.catalog.Recommendation.md#getimage)() | Returns the recommendation's image. |
| [getLongDescription](dw.catalog.Recommendation.md#getlongdescription)() | Returns the recommendation's long description in the current locale. |
| [getName](dw.catalog.Recommendation.md#getname)() | Returns the name of the recommended item in the current locale. |
| [getRecommendationType](dw.catalog.Recommendation.md#getrecommendationtype)() | Returns the type of the recommendation. |
| [getRecommendedItem](dw.catalog.Recommendation.md#getrecommendeditem)() | Return a reference to the recommended item. |
| [getRecommendedItemID](dw.catalog.Recommendation.md#getrecommendeditemid)() | Return the ID of the recommended item. |
| [getShortDescription](dw.catalog.Recommendation.md#getshortdescription)() | Returns the recommendation's short description in the current locale. |
| [getSourceItem](dw.catalog.Recommendation.md#getsourceitem)() | Return a reference to the source item. |
| [getSourceItemID](dw.catalog.Recommendation.md#getsourceitemid)() | Return the ID of the recommendation source item. |

### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### RECOMMENDATION_TYPE_CROSS_SELL

- ~~RECOMMENDATION_TYPE_CROSS_SELL: [Number](TopLevel.Number.md) = 1~~
  - : Represents a cross-sell recommendation.

    **Deprecated:**
:::warning
Use the integer value instead.  The recommendation types
and their meanings are now configurable in the Business Manager.

:::

---

### RECOMMENDATION_TYPE_OTHER

- ~~RECOMMENDATION_TYPE_OTHER: [Number](TopLevel.Number.md) = 3~~
  - : Represents a recommendation that is neither a cross-sell or an up-sell.

    **Deprecated:**
:::warning
Use the integer value instead.  The recommendation types
and their meanings are now configurable in the Business Manager.

:::

---

### RECOMMENDATION_TYPE_UP_SELL

- ~~RECOMMENDATION_TYPE_UP_SELL: [Number](TopLevel.Number.md) = 2~~
  - : Represents an up-sell recommendation.

    **Deprecated:**
:::warning
Use the integer value instead.  The recommendation types
and their meanings are now configurable in the Business Manager.

:::

---

## Property Details

### calloutMsg
- calloutMsg: [MarkupText](dw.content.MarkupText.md) `(read-only)`
  - : Returns the recommendation's callout message in the current locale.


---

### catalog
- catalog: [Catalog](dw.catalog.Catalog.md) `(read-only)`
  - : Return the catalog containing the recommendation.


---

### image
- image: [MediaFile](dw.content.MediaFile.md) `(read-only)`
  - : Returns the recommendation's image.


---

### longDescription
- longDescription: [MarkupText](dw.content.MarkupText.md) `(read-only)`
  - : Returns the recommendation's long description in the current locale.


---

### name
- name: [String](TopLevel.String.md) `(read-only)`
  - : Returns the name of the recommended item in the current locale.


---

### recommendationType
- recommendationType: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the type of the recommendation.


---

### recommendedItem
- recommendedItem: [Object](TopLevel.Object.md) `(read-only)`
  - : Return a reference to the recommended item.  This will always be an
      object of type `dw.catalog.Product` since this is the only
      currently supported recommendation target type.



---

### recommendedItemID
- recommendedItemID: [String](TopLevel.String.md) `(read-only)`
  - : Return the ID of the recommended item.  This will always be a product
      ID since this is the only currently supported recommendation target
      type.



---

### shortDescription
- shortDescription: [MarkupText](dw.content.MarkupText.md) `(read-only)`
  - : Returns the recommendation's short description in the current locale.


---

### sourceItem
- sourceItem: [Object](TopLevel.Object.md) `(read-only)`
  - : Return a reference to the source item.  This will be an object of type
      `dw.catalog.Product` or `dw.catalog.Category.`



---

### sourceItemID
- sourceItemID: [String](TopLevel.String.md) `(read-only)`
  - : Return the ID of the recommendation source item.  This will either be a
      product ID or category name.



---

## Method Details

### getCalloutMsg()
- getCalloutMsg(): [MarkupText](dw.content.MarkupText.md)
  - : Returns the recommendation's callout message in the current locale.

    **Returns:**
    - the recommendation's callout message in the current locale, or
              null if it wasn't found.



---

### getCatalog()
- getCatalog(): [Catalog](dw.catalog.Catalog.md)
  - : Return the catalog containing the recommendation.

    **Returns:**
    - the catalog containing the recommendation.


---

### getImage()
- getImage(): [MediaFile](dw.content.MediaFile.md)
  - : Returns the recommendation's image.

    **Returns:**
    - the recommendation's image.


---

### getLongDescription()
- getLongDescription(): [MarkupText](dw.content.MarkupText.md)
  - : Returns the recommendation's long description in the current locale.

    **Returns:**
    - The recommendation's long description in the current locale, or
              null if it wasn't found.



---

### getName()
- getName(): [String](TopLevel.String.md)
  - : Returns the name of the recommended item in the current locale.

    **Returns:**
    - The name of the recommended item for the current locale, or null
              if it wasn't found.



---

### getRecommendationType()
- getRecommendationType(): [Number](TopLevel.Number.md)
  - : Returns the type of the recommendation.

    **Returns:**
    - the type of the recommendation expressed as an integer.


---

### getRecommendedItem()
- getRecommendedItem(): [Object](TopLevel.Object.md)
  - : Return a reference to the recommended item.  This will always be an
      object of type `dw.catalog.Product` since this is the only
      currently supported recommendation target type.


    **Returns:**
    - the recommended item, possibly null if the item does not exist.


---

### getRecommendedItemID()
- getRecommendedItemID(): [String](TopLevel.String.md)
  - : Return the ID of the recommended item.  This will always be a product
      ID since this is the only currently supported recommendation target
      type.


    **Returns:**
    - the recommended item ID.


---

### getShortDescription()
- getShortDescription(): [MarkupText](dw.content.MarkupText.md)
  - : Returns the recommendation's short description in the current locale.

    **Returns:**
    - the recommendations's short description in the current locale, or
              null if it wasn't found.



---

### getSourceItem()
- getSourceItem(): [Object](TopLevel.Object.md)
  - : Return a reference to the source item.  This will be an object of type
      `dw.catalog.Product` or `dw.catalog.Category.`


    **Returns:**
    - the source item.


---

### getSourceItemID()
- getSourceItemID(): [String](TopLevel.String.md)
  - : Return the ID of the recommendation source item.  This will either be a
      product ID or category name.


    **Returns:**
    - the source item ID.


---

<!-- prettier-ignore-end -->
