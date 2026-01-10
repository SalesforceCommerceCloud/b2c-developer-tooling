<!-- prettier-ignore-start -->
# Class PageMetaTag

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.web.PageMetaTag](dw.web.PageMetaTag.md)

Page meta tags are used in HTML documents to provide structured data about a web
page. They are usually part of the head section. Common tags are for example robots,
description or social tags like open graph (e.g. 'og:title'). 


Page meta tags can be obtained within:


- home page context

- [Site](dw.system.Site.md)
- detail page context

- [Product](dw.catalog.Product.md)
- [Content](dw.content.Content.md)
- listing page context

- [ProductSearchModel](dw.catalog.ProductSearchModel.md)
- [ContentSearchModel](dw.content.ContentSearchModel.md)


and can be set at [PageMetaData](dw.web.PageMetaData.md) container object, which is always available
in the pipeline dictionary and is used as transfer object to fill the head area with meaningful
page meta tag elements.



## Property Summary

| Property | Description |
| --- | --- |
| [ID](#id): [String](TopLevel.String.md) `(read-only)` | Returns the page meta tag ID. |
| [content](#content): [String](TopLevel.String.md) `(read-only)` | Returns the page meta tag content. |
| [name](#name): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns true if the page meta tag type is name, false otherwise. |
| [property](#property): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns true if the page meta tag type is property, false otherwise. |
| [title](#title): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns true if the page meta tag type is title, false otherwise. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getContent](dw.web.PageMetaTag.md#getcontent)() | Returns the page meta tag content. |
| [getID](dw.web.PageMetaTag.md#getid)() | Returns the page meta tag ID. |
| [isName](dw.web.PageMetaTag.md#isname)() | Returns true if the page meta tag type is name, false otherwise. |
| [isProperty](dw.web.PageMetaTag.md#isproperty)() | Returns true if the page meta tag type is property, false otherwise. |
| [isTitle](dw.web.PageMetaTag.md#istitle)() | Returns true if the page meta tag type is title, false otherwise. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### ID
- ID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the page meta tag ID.


---

### content
- content: [String](TopLevel.String.md) `(read-only)`
  - : Returns the page meta tag content.


---

### name
- name: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns true if the page meta tag type is name, false otherwise.


---

### property
- property: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns true if the page meta tag type is property, false otherwise.


---

### title
- title: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns true if the page meta tag type is title, false otherwise.


---

## Method Details

### getContent()
- getContent(): [String](TopLevel.String.md)
  - : Returns the page meta tag content.

    **Returns:**
    - page meta tag content


---

### getID()
- getID(): [String](TopLevel.String.md)
  - : Returns the page meta tag ID.

    **Returns:**
    - page meta tag ID


---

### isName()
- isName(): [Boolean](TopLevel.Boolean.md)
  - : Returns true if the page meta tag type is name, false otherwise.

    **Returns:**
    - true if the page meta tag type is name, false otherwise


---

### isProperty()
- isProperty(): [Boolean](TopLevel.Boolean.md)
  - : Returns true if the page meta tag type is property, false otherwise.

    **Returns:**
    - true if the page meta tag type is property, false otherwise


---

### isTitle()
- isTitle(): [Boolean](TopLevel.Boolean.md)
  - : Returns true if the page meta tag type is title, false otherwise.

    **Returns:**
    - true if the page meta tag type is title, false otherwise


---

<!-- prettier-ignore-end -->
