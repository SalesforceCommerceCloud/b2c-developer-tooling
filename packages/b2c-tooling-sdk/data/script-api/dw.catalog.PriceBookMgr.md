<!-- prettier-ignore-start -->
# Class PriceBookMgr

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.catalog.PriceBookMgr](dw.catalog.PriceBookMgr.md)

Price book manager provides methods to access price books.


## Property Summary

| Property | Description |
| --- | --- |
| [allPriceBooks](#allpricebooks): [Collection](dw.util.Collection.md) `(read-only)` | Returns all price books defined for the organization. |
| [applicablePriceBooks](#applicablepricebooks): [Collection](dw.util.Collection.md) | Returns a collection of price books that are set in the user session. |
| [sitePriceBooks](#sitepricebooks): [Collection](dw.util.Collection.md) `(read-only)` | Returns all price books assigned to the current site. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| static [assignPriceBookToSite](dw.catalog.PriceBookMgr.md#assignpricebooktositepricebook-string)([PriceBook](dw.catalog.PriceBook.md), [String](TopLevel.String.md)) | Assign a price book to a site. |
| static [getAllPriceBooks](dw.catalog.PriceBookMgr.md#getallpricebooks)() | Returns all price books defined for the organization. |
| static [getApplicablePriceBooks](dw.catalog.PriceBookMgr.md#getapplicablepricebooks)() | Returns a collection of price books that are set in the user session. |
| static [getPriceBook](dw.catalog.PriceBookMgr.md#getpricebookstring)([String](TopLevel.String.md)) | Returns the price book of the current organization matching the specified ID. |
| static [getSitePriceBooks](dw.catalog.PriceBookMgr.md#getsitepricebooks)() | Returns all price books assigned to the current site. |
| static [setApplicablePriceBooks](dw.catalog.PriceBookMgr.md#setapplicablepricebookspricebook)([PriceBook...](dw.catalog.PriceBook.md)) | Sets one or more price books to be considered by the product price lookup. |
| static [unassignPriceBookFromAllSites](dw.catalog.PriceBookMgr.md#unassignpricebookfromallsitespricebook)([PriceBook](dw.catalog.PriceBook.md)) | Unassign a price book from all sites. |
| static [unassignPriceBookFromSite](dw.catalog.PriceBookMgr.md#unassignpricebookfromsitepricebook-string)([PriceBook](dw.catalog.PriceBook.md), [String](TopLevel.String.md)) | Unassign a price book from a site. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### allPriceBooks
- allPriceBooks: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns all price books defined for the organization.


---

### applicablePriceBooks
- applicablePriceBooks: [Collection](dw.util.Collection.md)
  - : Returns a collection of price books that are set in the user session.


---

### sitePriceBooks
- sitePriceBooks: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns all price books assigned to the current site. 
      
      Please note that this doesn't include parent price books not assigned to the site, but considered by the price
      lookup.



---

## Method Details

### assignPriceBookToSite(PriceBook, String)
- static assignPriceBookToSite(priceBook: [PriceBook](dw.catalog.PriceBook.md), siteId: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Assign a price book to a site. This requires a transaction, see [Transaction.wrap(Function)](dw.system.Transaction.md#wrapfunction)

    **Parameters:**
    - priceBook - price book to be assigned
    - siteId - id of the site to be assigned to, such as 'SiteGenesis'. The site has to be a storefront site.

    **Returns:**
    - true if price book is assigned to site. Throws an exception if price book doesn't exist or site doesn't
              exist or site is not a storefront site.



---

### getAllPriceBooks()
- static getAllPriceBooks(): [Collection](dw.util.Collection.md)
  - : Returns all price books defined for the organization.

    **Returns:**
    - All price books of the organization.


---

### getApplicablePriceBooks()
- static getApplicablePriceBooks(): [Collection](dw.util.Collection.md)
  - : Returns a collection of price books that are set in the user session.

    **Returns:**
    - Collection of applicable price books set in the session.


---

### getPriceBook(String)
- static getPriceBook(priceBookID: [String](TopLevel.String.md)): [PriceBook](dw.catalog.PriceBook.md)
  - : Returns the price book of the current organization matching the specified ID.

    **Parameters:**
    - priceBookID - The price book id.

    **Returns:**
    - Price book or null of not found


---

### getSitePriceBooks()
- static getSitePriceBooks(): [Collection](dw.util.Collection.md)
  - : Returns all price books assigned to the current site. 
      
      Please note that this doesn't include parent price books not assigned to the site, but considered by the price
      lookup.


    **Returns:**
    - All price books assigned to the current site.


---

### setApplicablePriceBooks(PriceBook...)
- static setApplicablePriceBooks(priceBooks: [PriceBook...](dw.catalog.PriceBook.md)): void
  - : Sets one or more price books to be considered by the product price lookup. The information is stored in the user
      session. If no price book is set in the user session, all active and valid price books assigned to the site are
      used for the price lookup. If price books are set, only those price books are considered by the price lookup.
      Note that the system does not assure that a price book set by this API is assigned to the current site.


    **Parameters:**
    - priceBooks - The price books that are set in the session as applicable price books.


---

### unassignPriceBookFromAllSites(PriceBook)
- static unassignPriceBookFromAllSites(priceBook: [PriceBook](dw.catalog.PriceBook.md)): [Boolean](TopLevel.Boolean.md)
  - : Unassign a price book from all sites. This requires a transaction, see
      [Transaction.wrap(Function)](dw.system.Transaction.md#wrapfunction)


    **Parameters:**
    - priceBook - price book to be unassigned

    **Returns:**
    - true if price book is unassigned from all sites. Throws an exception if price book doesn't exist


---

### unassignPriceBookFromSite(PriceBook, String)
- static unassignPriceBookFromSite(priceBook: [PriceBook](dw.catalog.PriceBook.md), siteId: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Unassign a price book from a site. This requires a transaction, see
      [Transaction.wrap(Function)](dw.system.Transaction.md#wrapfunction)


    **Parameters:**
    - priceBook - price book to be unassigned
    - siteId - id of the site to be unassigned from, such as 'SiteGenesis'. The site has to be a storefront site.

    **Returns:**
    - true if price book is unassigned from site. Throws an exception if price book doesn't exist or site
              doesn't exist or site is not a storefront site.



---

<!-- prettier-ignore-end -->
