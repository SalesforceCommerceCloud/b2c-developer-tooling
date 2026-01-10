<!-- prettier-ignore-start -->
# Class PageMetaData

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.web.PageMetaData](dw.web.PageMetaData.md)

Contains meta data about the page.

For each request an instance of this class will be placed in the pipeline
dictionary under the key "CurrentPageMetaData".
The information stored in CurrentPageMetaData can be referenced in templates
and rendered in an HTML head section:
for example:

```

<head>
<title>${pdict.CurrentPageMetaData.title}</title>
<meta name="description" content="${pdict.CurrentPageMetaData.description}"/>
.
.
.
</head>
```


To update the CurrentPageMetaData there is the pipelet UpdatePageMetaData
provided.



## Property Summary

| Property | Description |
| --- | --- |
| [description](#description): [String](TopLevel.String.md) | Returns the page's description. |
| [keywords](#keywords): [String](TopLevel.String.md) | Returns the page's key words. |
| [pageMetaTags](#pagemetatags): [Array](TopLevel.Array.md) `(read-only)` | Returns all page meta tags added to this container. |
| [title](#title): [String](TopLevel.String.md) | Returns the page's title. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [addPageMetaTag](dw.web.PageMetaData.md#addpagemetatagpagemetatag)([PageMetaTag](dw.web.PageMetaTag.md)) | Adds a page meta tag to this container. |
| [addPageMetaTags](dw.web.PageMetaData.md#addpagemetatagsarray)([Array](TopLevel.Array.md)) | Adds a page meta tags list to this container. |
| [getDescription](dw.web.PageMetaData.md#getdescription)() | Returns the page's description. |
| [getKeywords](dw.web.PageMetaData.md#getkeywords)() | Returns the page's key words. |
| [getPageMetaTags](dw.web.PageMetaData.md#getpagemetatags)() | Returns all page meta tags added to this container. |
| [getTitle](dw.web.PageMetaData.md#gettitle)() | Returns the page's title. |
| [isPageMetaTagSet](dw.web.PageMetaData.md#ispagemetatagsetstring)([String](TopLevel.String.md)) | Returns true if a page meta tag with the given ID is set, false otherwise. |
| [setDescription](dw.web.PageMetaData.md#setdescriptionstring)([String](TopLevel.String.md)) | Sets the page's description. |
| [setKeywords](dw.web.PageMetaData.md#setkeywordsstring)([String](TopLevel.String.md)) | Sets the page's key words. |
| [setTitle](dw.web.PageMetaData.md#settitlestring)([String](TopLevel.String.md)) | Sets the page's title. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### description
- description: [String](TopLevel.String.md)
  - : Returns the page's description.


---

### keywords
- keywords: [String](TopLevel.String.md)
  - : Returns the page's key words.


---

### pageMetaTags
- pageMetaTags: [Array](TopLevel.Array.md) `(read-only)`
  - : Returns all page meta tags added to this container.


---

### title
- title: [String](TopLevel.String.md)
  - : Returns the page's title.


---

## Method Details

### addPageMetaTag(PageMetaTag)
- addPageMetaTag(pageMetaTag: [PageMetaTag](dw.web.PageMetaTag.md)): void
  - : Adds a page meta tag to this container.

    **Parameters:**
    - pageMetaTag - the page meta tag to be added


---

### addPageMetaTags(Array)
- addPageMetaTags(pageMetaTags: [Array](TopLevel.Array.md)): void
  - : Adds a page meta tags list to this container.

    **Parameters:**
    - pageMetaTags - the page meta tags list to be added


---

### getDescription()
- getDescription(): [String](TopLevel.String.md)
  - : Returns the page's description.

    **Returns:**
    - the page's description.


---

### getKeywords()
- getKeywords(): [String](TopLevel.String.md)
  - : Returns the page's key words.

    **Returns:**
    - the page's key words.


---

### getPageMetaTags()
- getPageMetaTags(): [Array](TopLevel.Array.md)
  - : Returns all page meta tags added to this container.

    **Returns:**
    - page meta tags


---

### getTitle()
- getTitle(): [String](TopLevel.String.md)
  - : Returns the page's title.

    **Returns:**
    - the page's title.


---

### isPageMetaTagSet(String)
- isPageMetaTagSet(id: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Returns true if a page meta tag with the given ID is set, false otherwise.

    **Parameters:**
    - id - the ID to be check if a page meta tag is set

    **Returns:**
    - true if a page meta tag with the given ID is set, false otherwise


---

### setDescription(String)
- setDescription(description: [String](TopLevel.String.md)): void
  - : Sets the page's description.

    **Parameters:**
    - description - the page's description.


---

### setKeywords(String)
- setKeywords(keywords: [String](TopLevel.String.md)): void
  - : Sets the page's key words.

    **Parameters:**
    - keywords - the page's key words.


---

### setTitle(String)
- setTitle(title: [String](TopLevel.String.md)): void
  - : Sets the page's title.

    **Parameters:**
    - title - the page's title.


---

<!-- prettier-ignore-end -->
