<!-- prettier-ignore-start -->
# Class ProductMgr

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.catalog.ProductMgr](dw.catalog.ProductMgr.md)

Provides helper methods for getting products based on Product ID or [Catalog](dw.catalog.Catalog.md).


## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| static [getProduct](dw.catalog.ProductMgr.md#getproductstring)([String](TopLevel.String.md)) | Returns the product with the specified id. |
| static [queryAllSiteProducts](dw.catalog.ProductMgr.md#queryallsiteproducts)() | Returns all products assigned to the current site. |
| static [queryAllSiteProductsSorted](dw.catalog.ProductMgr.md#queryallsiteproductssorted)() | Returns all products assigned to the current site. |
| static [queryProductsInCatalog](dw.catalog.ProductMgr.md#queryproductsincatalogcatalog)([Catalog](dw.catalog.Catalog.md)) | Returns all products assigned to the the specified catalog, where  assignment has the same meaning as it does for queryAllSiteProducts(). |
| static [queryProductsInCatalogSorted](dw.catalog.ProductMgr.md#queryproductsincatalogsortedcatalog)([Catalog](dw.catalog.Catalog.md)) | Returns all products assigned to the the specified catalog. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Method Details

### getProduct(String)
- static getProduct(productID: [String](TopLevel.String.md)): [Product](dw.catalog.Product.md)
  - : Returns the product with the specified id.

    **Parameters:**
    - productID - the product identifier.

    **Returns:**
    - Product for specified id or null


---

### queryAllSiteProducts()
- static queryAllSiteProducts(): [SeekableIterator](dw.util.SeekableIterator.md)
  - : Returns all products assigned to the current site.
      
      
      A product is assigned to a site if 
      
      
      - it is assigned to at least one category of the site catalog or
      - it is a variant and it's master product is assigned to the current site
      
      
      
      It is strongly recommended to call `close()` on the returned SeekableIterator
      if not all of its elements are being retrieved. This will ensure the proper cleanup of system resources.


    **Returns:**
    - Iterator of all site products

    **See Also:**
    - [SeekableIterator.close()](dw.util.SeekableIterator.md#close)


---

### queryAllSiteProductsSorted()
- static queryAllSiteProductsSorted(): [SeekableIterator](dw.util.SeekableIterator.md)
  - : Returns all products assigned to the current site.
      
      
      Works like queryAllSiteProducts(), but additionally sorts the result set
      by product ID.
      
      
      It is strongly recommended to call `close()` on the returned SeekableIterator
      if not all of its elements are being retrieved. This will ensure the proper cleanup of system resources.


    **Returns:**
    - Iterator of all site products sorted by product ID.

    **See Also:**
    - [SeekableIterator.close()](dw.util.SeekableIterator.md#close)


---

### queryProductsInCatalog(Catalog)
- static queryProductsInCatalog(catalog: [Catalog](dw.catalog.Catalog.md)): [SeekableIterator](dw.util.SeekableIterator.md)
  - : Returns all products assigned to the the specified catalog, where
      assignment has the same meaning as it does for queryAllSiteProducts().
      
      
      It is strongly recommended to call `close()` on the returned SeekableIterator
      if not all of its elements are being retrieved. This will ensure the proper cleanup of system resources.


    **Parameters:**
    - catalog - The catalog whose assigned products should be returned.

    **Returns:**
    - Iterator of all products assigned to specified catalog.

    **See Also:**
    - [SeekableIterator.close()](dw.util.SeekableIterator.md#close)


---

### queryProductsInCatalogSorted(Catalog)
- static queryProductsInCatalogSorted(catalog: [Catalog](dw.catalog.Catalog.md)): [SeekableIterator](dw.util.SeekableIterator.md)
  - : Returns all products assigned to the the specified catalog.
      Works like queryProductsInCatalog(), but additionally sorts the result
      set by product ID.
      
      
      It is strongly recommended to call `close()` on the returned SeekableIterator
      if not all of its elements are being retrieved. This will ensure the proper cleanup of system resources.


    **Parameters:**
    - catalog - The catalog whose assigned products should be returned.

    **Returns:**
    - Iterator of all products assigned to specified catalog sorted by
              product ID.


    **See Also:**
    - [SeekableIterator.close()](dw.util.SeekableIterator.md#close)


---

<!-- prettier-ignore-end -->
