<!-- prettier-ignore-start -->
# Class ProductSearchHit

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.catalog.ProductSearchHit](dw.catalog.ProductSearchHit.md)

ProductSearchHit is the result of a executed search query and wraps the actual product found by the search.

The method [getRepresentedProducts()](dw.catalog.ProductSearchHit.md#getrepresentedproducts) returns the actual products that is conforming the query and is represented by the search hit.
Depending on the hit typ, [getRepresentedProducts()](dw.catalog.ProductSearchHit.md#getrepresentedproducts) returns:
 
- [HIT_TYPE_SIMPLE](dw.catalog.ProductSearchHit.md#hit_type_simple)-> a simple product 
- [HIT_TYPE_PRODUCT_MASTER](dw.catalog.ProductSearchHit.md#hit_type_product_master)-> a variation product
- [HIT_TYPE_PRODUCT_SET](dw.catalog.ProductSearchHit.md#hit_type_product_set)-> a product part of set
- [HIT_TYPE_PRODUCT_BUNDLE](dw.catalog.ProductSearchHit.md#hit_type_product_bundle)-> a product part of a bundle
- [HIT_TYPE_VARIATION_GROUP](dw.catalog.ProductSearchHit.md#hit_type_variation_group)-> a variation product


The ProductSearchHit type can be retrieved by method [getHitType()](dw.catalog.ProductSearchHit.md#gethittype) and contains the following types:

- [HIT_TYPE_SIMPLE](dw.catalog.ProductSearchHit.md#hit_type_simple)
- [HIT_TYPE_PRODUCT_MASTER](dw.catalog.ProductSearchHit.md#hit_type_product_master)
- [HIT_TYPE_PRODUCT_SET](dw.catalog.ProductSearchHit.md#hit_type_product_set)
- [HIT_TYPE_PRODUCT_BUNDLE](dw.catalog.ProductSearchHit.md#hit_type_product_bundle)
- [HIT_TYPE_VARIATION_GROUP](dw.catalog.ProductSearchHit.md#hit_type_variation_group)


The method [getProduct()](dw.catalog.ProductSearchHit.md#getproduct) returns the presentation product corresponding to the [ProductSearchHit](dw.catalog.ProductSearchHit.md) type.

- [HIT_TYPE_SIMPLE](dw.catalog.ProductSearchHit.md#hit_type_simple)-> a simple product 
- [HIT_TYPE_PRODUCT_MASTER](dw.catalog.ProductSearchHit.md#hit_type_product_master)-> a variation master product
- [HIT_TYPE_PRODUCT_SET](dw.catalog.ProductSearchHit.md#hit_type_product_set)-> a product set
- [HIT_TYPE_PRODUCT_BUNDLE](dw.catalog.ProductSearchHit.md#hit_type_product_bundle)-> a product bundle
- [HIT_TYPE_VARIATION_GROUP](dw.catalog.ProductSearchHit.md#hit_type_variation_group)->a variation group


Example:

Given a product master P1 called "Sweater" with attributes color and size that has the following variants:

- V1 - color: red, size: small
- V2 - color: red, size: large
- V3 - color: blue, size: small
- V4 - color: blue, size: large
- V5 - color: yellow, size: small
- V6 - color: yellow, size: large


A search for "red sweater" should hit the first two variants, V1 and V2
that are both red. The ProductSearchHit for this result encompass the master and the red variants but not the other
non-relevant variants.

The variants hit by the query can be retrieved by [getRepresentedProducts()](dw.catalog.ProductSearchHit.md#getrepresentedproducts), returning a list that contains the two red sweater variants.

The master product "Sweater" is returned by [getProduct()](dw.catalog.ProductSearchHit.md#getproduct).

Furthermore, to get the first or last of that list of variants hit by the query we can call
[getFirstRepresentedProduct()](dw.catalog.ProductSearchHit.md#getfirstrepresentedproduct) or [getLastRepresentedProduct()](dw.catalog.ProductSearchHit.md#getlastrepresentedproduct). The product with the highest
sort rank is returned first, and the product with the lowest sort rank is
returned last. The product sort rank depends on the sorting conditions
used for the search query.



## Constant Summary

| Constant | Description |
| --- | --- |
| [HIT_TYPE_PRODUCT_BUNDLE](#hit_type_product_bundle): [String](TopLevel.String.md) = "bundle" | Constant representing a product search hit type based on the presentation product of a hit. |
| [HIT_TYPE_PRODUCT_MASTER](#hit_type_product_master): [String](TopLevel.String.md) = "master" | Constant representing a product search hit type based on the presentation product of a hit. |
| [HIT_TYPE_PRODUCT_SET](#hit_type_product_set): [String](TopLevel.String.md) = "set" | Constant representing a product search hit type based on the presentation product of a hit. |
| [HIT_TYPE_SIMPLE](#hit_type_simple): [String](TopLevel.String.md) = "product" | Constant representing a product search hit type based on the presentation product of a hit. |
| ~~[HIT_TYPE_SLICING_GROUP](#hit_type_slicing_group): [String](TopLevel.String.md) = "slicing_group"~~ | Constant representing a product search hit type based on the presentation product of a hit. |
| [HIT_TYPE_VARIATION_GROUP](#hit_type_variation_group): [String](TopLevel.String.md) = "variation_group" | Constant representing a product search hit type based on the presentation product of a hit. |

## Property Summary

| Property | Description |
| --- | --- |
| [firstRepresentedProduct](#firstrepresentedproduct): [Product](dw.catalog.Product.md) `(read-only)` | Returns the product that is actually hit by the search and has the highest  sort rank according to the sorting conditions used for the search query. |
| [firstRepresentedProductID](#firstrepresentedproductid): [String](TopLevel.String.md) `(read-only)` | Returns the ID of the product that is actually hit by the search and has the highest  sort rank according to the sorting conditions used for the search query. |
| [hitType](#hittype): [String](TopLevel.String.md) `(read-only)` | Returns the type of the product wrapped by this search hit. |
| [lastRepresentedProduct](#lastrepresentedproduct): [Product](dw.catalog.Product.md) `(read-only)` | Returns the product that is actually hit by the search and has the lowest  sort rank according to the sorting conditions used for the search query. |
| [lastRepresentedProductID](#lastrepresentedproductid): [String](TopLevel.String.md) `(read-only)` | Returns the ID of the product that is actually hit by the search and has the lowest  sort rank according to the sorting conditions used for the search query. |
| [maxPrice](#maxprice): [Money](dw.value.Money.md) `(read-only)` | Returns the maximum price of all products represented by the  product hit. |
| [maxPricePerUnit](#maxpriceperunit): [Money](dw.value.Money.md) `(read-only)` | Returns the maximum price per unit of all products represented by the  product hit. |
| [minPrice](#minprice): [Money](dw.value.Money.md) `(read-only)` | Returns the minimum price of all products represented by the  product hit. |
| [minPricePerUnit](#minpriceperunit): [Money](dw.value.Money.md) `(read-only)` | Returns the minimum price per unit of all products represented by the  product hit. |
| [priceRange](#pricerange): [Boolean](TopLevel.Boolean.md) `(read-only)` | Convenience method to check whether this ProductSearchHit represents  multiple products (see [getRepresentedProducts()](dw.catalog.ProductSearchHit.md#getrepresentedproducts)) that have  different prices. |
| [product](#product): [Product](dw.catalog.Product.md) `(read-only)` | Returns the presentation product of this ProductSearchHit corresponding to the [ProductSearchHit](dw.catalog.ProductSearchHit.md) type. |
| [productID](#productid): [String](TopLevel.String.md) `(read-only)` | Returns the ID of the presentation product of this ProductSearchHit corresponding to the [ProductSearchHit](dw.catalog.ProductSearchHit.md) type. |
| [representedProductIDs](#representedproductids): [List](dw.util.List.md) `(read-only)` | The method returns the actual ID of the product that is conforming the query and is represented by the search hit. |
| [representedProducts](#representedproducts): [List](dw.util.List.md) `(read-only)` | The method returns the actual product that is conforming the query and is represented by the search hit. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getFirstRepresentedProduct](dw.catalog.ProductSearchHit.md#getfirstrepresentedproduct)() | Returns the product that is actually hit by the search and has the highest  sort rank according to the sorting conditions used for the search query. |
| [getFirstRepresentedProductID](dw.catalog.ProductSearchHit.md#getfirstrepresentedproductid)() | Returns the ID of the product that is actually hit by the search and has the highest  sort rank according to the sorting conditions used for the search query. |
| [getHitType](dw.catalog.ProductSearchHit.md#gethittype)() | Returns the type of the product wrapped by this search hit. |
| [getLastRepresentedProduct](dw.catalog.ProductSearchHit.md#getlastrepresentedproduct)() | Returns the product that is actually hit by the search and has the lowest  sort rank according to the sorting conditions used for the search query. |
| [getLastRepresentedProductID](dw.catalog.ProductSearchHit.md#getlastrepresentedproductid)() | Returns the ID of the product that is actually hit by the search and has the lowest  sort rank according to the sorting conditions used for the search query. |
| [getMaxPrice](dw.catalog.ProductSearchHit.md#getmaxprice)() | Returns the maximum price of all products represented by the  product hit. |
| [getMaxPricePerUnit](dw.catalog.ProductSearchHit.md#getmaxpriceperunit)() | Returns the maximum price per unit of all products represented by the  product hit. |
| [getMinPrice](dw.catalog.ProductSearchHit.md#getminprice)() | Returns the minimum price of all products represented by the  product hit. |
| [getMinPricePerUnit](dw.catalog.ProductSearchHit.md#getminpriceperunit)() | Returns the minimum price per unit of all products represented by the  product hit. |
| [getProduct](dw.catalog.ProductSearchHit.md#getproduct)() | Returns the presentation product of this ProductSearchHit corresponding to the [ProductSearchHit](dw.catalog.ProductSearchHit.md) type. |
| [getProductID](dw.catalog.ProductSearchHit.md#getproductid)() | Returns the ID of the presentation product of this ProductSearchHit corresponding to the [ProductSearchHit](dw.catalog.ProductSearchHit.md) type. |
| [getRepresentedProductIDs](dw.catalog.ProductSearchHit.md#getrepresentedproductids)() | The method returns the actual ID of the product that is conforming the query and is represented by the search hit. |
| [getRepresentedProducts](dw.catalog.ProductSearchHit.md#getrepresentedproducts)() | The method returns the actual product that is conforming the query and is represented by the search hit. |
| [getRepresentedVariationValues](dw.catalog.ProductSearchHit.md#getrepresentedvariationvaluesobject)([Object](TopLevel.Object.md)) | This method is only applicable if this ProductSearchHit represents a  product variation (see [getRepresentedProducts()](dw.catalog.ProductSearchHit.md#getrepresentedproducts)). |
| [isPriceRange](dw.catalog.ProductSearchHit.md#ispricerange)() | Convenience method to check whether this ProductSearchHit represents  multiple products (see [getRepresentedProducts()](dw.catalog.ProductSearchHit.md#getrepresentedproducts)) that have  different prices. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### HIT_TYPE_PRODUCT_BUNDLE

- HIT_TYPE_PRODUCT_BUNDLE: [String](TopLevel.String.md) = "bundle"
  - : Constant representing a product search hit type based on the presentation product of a hit. This hit type is used with product bundles.


---

### HIT_TYPE_PRODUCT_MASTER

- HIT_TYPE_PRODUCT_MASTER: [String](TopLevel.String.md) = "master"
  - : Constant representing a product search hit type based on the presentation product of a hit. This hit type is used with master products.


---

### HIT_TYPE_PRODUCT_SET

- HIT_TYPE_PRODUCT_SET: [String](TopLevel.String.md) = "set"
  - : Constant representing a product search hit type based on the presentation product of a hit. This hit type is used with product sets.


---

### HIT_TYPE_SIMPLE

- HIT_TYPE_SIMPLE: [String](TopLevel.String.md) = "product"
  - : Constant representing a product search hit type based on the presentation product of a hit. This hit type is used with single, non-complex products, including product variants that
      are assigned to a category and are returned as the presentation product.



---

### HIT_TYPE_SLICING_GROUP

- ~~HIT_TYPE_SLICING_GROUP: [String](TopLevel.String.md) = "slicing_group"~~
  - : Constant representing a product search hit type based on the presentation product of a hit. This hit type is used with slicing groups.

    **Deprecated:**
:::warning
Please use [HIT_TYPE_VARIATION_GROUP](dw.catalog.ProductSearchHit.md#hit_type_variation_group) instead.
:::

---

### HIT_TYPE_VARIATION_GROUP

- HIT_TYPE_VARIATION_GROUP: [String](TopLevel.String.md) = "variation_group"
  - : Constant representing a product search hit type based on the presentation product of a hit. This hit type is used with variation groups.


---

## Property Details

### firstRepresentedProduct
- firstRepresentedProduct: [Product](dw.catalog.Product.md) `(read-only)`
  - : Returns the product that is actually hit by the search and has the highest
      sort rank according to the sorting conditions used for the search query.


    **See Also:**
    - [getRepresentedProducts()](dw.catalog.ProductSearchHit.md#getrepresentedproducts)
    - [getLastRepresentedProduct()](dw.catalog.ProductSearchHit.md#getlastrepresentedproduct)


---

### firstRepresentedProductID
- firstRepresentedProductID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the ID of the product that is actually hit by the search and has the highest
      sort rank according to the sorting conditions used for the search query.


    **See Also:**
    - [getRepresentedProducts()](dw.catalog.ProductSearchHit.md#getrepresentedproducts)
    - [getLastRepresentedProduct()](dw.catalog.ProductSearchHit.md#getlastrepresentedproduct)


---

### hitType
- hitType: [String](TopLevel.String.md) `(read-only)`
  - : Returns the type of the product wrapped by this search hit. The product type returned will be one of the hit types: 
      
      
      - [HIT_TYPE_SIMPLE](dw.catalog.ProductSearchHit.md#hit_type_simple)  - [HIT_TYPE_PRODUCT_MASTER](dw.catalog.ProductSearchHit.md#hit_type_product_master)    - [HIT_TYPE_PRODUCT_BUNDLE](dw.catalog.ProductSearchHit.md#hit_type_product_bundle)      - [HIT_TYPE_PRODUCT_SET](dw.catalog.ProductSearchHit.md#hit_type_product_set)        - [HIT_TYPE_SLICING_GROUP](dw.catalog.ProductSearchHit.md#hit_type_slicing_group)          - [HIT_TYPE_VARIATION_GROUP](dw.catalog.ProductSearchHit.md#hit_type_variation_group)



---

### lastRepresentedProduct
- lastRepresentedProduct: [Product](dw.catalog.Product.md) `(read-only)`
  - : Returns the product that is actually hit by the search and has the lowest
      sort rank according to the sorting conditions used for the search query.


    **See Also:**
    - [getRepresentedProducts()](dw.catalog.ProductSearchHit.md#getrepresentedproducts)
    - [getLastRepresentedProduct()](dw.catalog.ProductSearchHit.md#getlastrepresentedproduct)


---

### lastRepresentedProductID
- lastRepresentedProductID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the ID of the product that is actually hit by the search and has the lowest
      sort rank according to the sorting conditions used for the search query.


    **See Also:**
    - [getRepresentedProducts()](dw.catalog.ProductSearchHit.md#getrepresentedproducts)
    - [getLastRepresentedProduct()](dw.catalog.ProductSearchHit.md#getlastrepresentedproduct)


---

### maxPrice
- maxPrice: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the maximum price of all products represented by the
      product hit. See [getRepresentedProducts()](dw.catalog.ProductSearchHit.md#getrepresentedproducts) for details on
      the set of products used for finding the maximum. The method returns
      `N/A` in case no price information can be found.
      
      
      Note: The method uses price information of the search index and therefore
      might return different prices than the ProductPriceModel.



---

### maxPricePerUnit
- maxPricePerUnit: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the maximum price per unit of all products represented by the
      product hit. See [getRepresentedProducts()](dw.catalog.ProductSearchHit.md#getrepresentedproducts) for details on
      the set of products used for finding the maximum. The method returns
      `N/A` in case no price information can be found.
      
      
      Note: The method uses price information of the search index and therefore
      might return different prices than the ProductPriceModel.



---

### minPrice
- minPrice: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the minimum price of all products represented by the
      product hit. See [getRepresentedProducts()](dw.catalog.ProductSearchHit.md#getrepresentedproducts) for details on
      the set of products used for finding the minimum. The method returns
      `N/A` in case no price information can be found.
      
      
      Note: the method uses price information of the search index and therefore
      might return different prices than the ProductPriceModel.



---

### minPricePerUnit
- minPricePerUnit: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the minimum price per unit of all products represented by the
      product hit. See [getRepresentedProducts()](dw.catalog.ProductSearchHit.md#getrepresentedproducts) for details on
      the set of products used for finding the minimum. The method returns
      `N/A` in case no price information can be found.
      
      
      Note: the method uses price information of the search index and therefore
      might return different prices than the ProductPriceModel.



---

### priceRange
- priceRange: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Convenience method to check whether this ProductSearchHit represents
      multiple products (see [getRepresentedProducts()](dw.catalog.ProductSearchHit.md#getrepresentedproducts)) that have
      different prices.



---

### product
- product: [Product](dw.catalog.Product.md) `(read-only)`
  - : Returns the presentation product of this ProductSearchHit corresponding to the [ProductSearchHit](dw.catalog.ProductSearchHit.md) type.
      
      - [HIT_TYPE_SIMPLE](dw.catalog.ProductSearchHit.md#hit_type_simple)-> a simple product 
      - [HIT_TYPE_PRODUCT_MASTER](dw.catalog.ProductSearchHit.md#hit_type_product_master)-> a variation master product
      - [HIT_TYPE_PRODUCT_SET](dw.catalog.ProductSearchHit.md#hit_type_product_set)-> a product set
      - [HIT_TYPE_PRODUCT_BUNDLE](dw.catalog.ProductSearchHit.md#hit_type_product_bundle)-> a product bundle
      - [HIT_TYPE_VARIATION_GROUP](dw.catalog.ProductSearchHit.md#hit_type_variation_group)->a variation group
      
      
      To retrieve the product(s) actually hit by the search use [getRepresentedProducts()](dw.catalog.ProductSearchHit.md#getrepresentedproducts).


    **See Also:**
    - [getRepresentedProducts()](dw.catalog.ProductSearchHit.md#getrepresentedproducts)


---

### productID
- productID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the ID of the presentation product of this ProductSearchHit corresponding to the [ProductSearchHit](dw.catalog.ProductSearchHit.md) type.
      
      - [HIT_TYPE_SIMPLE](dw.catalog.ProductSearchHit.md#hit_type_simple)-> a simple product 
      - [HIT_TYPE_PRODUCT_MASTER](dw.catalog.ProductSearchHit.md#hit_type_product_master)-> a variation master product
      - [HIT_TYPE_PRODUCT_SET](dw.catalog.ProductSearchHit.md#hit_type_product_set)-> a product set
      - [HIT_TYPE_PRODUCT_BUNDLE](dw.catalog.ProductSearchHit.md#hit_type_product_bundle)-> a product bundle
      - [HIT_TYPE_VARIATION_GROUP](dw.catalog.ProductSearchHit.md#hit_type_variation_group)->a variation group
      
      
      To retrieve the ID of the product actually hit by the search use [getFirstRepresentedProductID()](dw.catalog.ProductSearchHit.md#getfirstrepresentedproductid) or [getLastRepresentedProductID()](dw.catalog.ProductSearchHit.md#getlastrepresentedproductid).


    **See Also:**
    - [getRepresentedProducts()](dw.catalog.ProductSearchHit.md#getrepresentedproducts)


---

### representedProductIDs
- representedProductIDs: [List](dw.util.List.md) `(read-only)`
  - : The method returns the actual ID of the product that is conforming the query and is represented by the search hit.
      Depending on the hit typ, it returns the ID of:
       
      - [HIT_TYPE_SIMPLE](dw.catalog.ProductSearchHit.md#hit_type_simple)-> a simple product 
      - [HIT_TYPE_PRODUCT_MASTER](dw.catalog.ProductSearchHit.md#hit_type_product_master)-> a variation product
      - [HIT_TYPE_PRODUCT_SET](dw.catalog.ProductSearchHit.md#hit_type_product_set)-> a product part of set
      - [HIT_TYPE_PRODUCT_BUNDLE](dw.catalog.ProductSearchHit.md#hit_type_product_bundle)-> a product part of a bundle
      - [HIT_TYPE_VARIATION_GROUP](dw.catalog.ProductSearchHit.md#hit_type_variation_group)->a variation product
      
      
      If the method returns multiple products, the product with the highest
      sort rank is returned first, and the product with the lowest sort rank is
      returned last. The product sort rank depends on the sorting conditions
      used for the search query.


    **See Also:**
    - [getFirstRepresentedProduct()](dw.catalog.ProductSearchHit.md#getfirstrepresentedproduct)
    - [getLastRepresentedProduct()](dw.catalog.ProductSearchHit.md#getlastrepresentedproduct)


---

### representedProducts
- representedProducts: [List](dw.util.List.md) `(read-only)`
  - : The method returns the actual product that is conforming the query and is represented by the search hit.
      Depending on the hit typ, [getRepresentedProducts()](dw.catalog.ProductSearchHit.md#getrepresentedproducts) returns:
       
      - [HIT_TYPE_SIMPLE](dw.catalog.ProductSearchHit.md#hit_type_simple)-> a simple product 
      - [HIT_TYPE_PRODUCT_MASTER](dw.catalog.ProductSearchHit.md#hit_type_product_master)-> a variation product
      - [HIT_TYPE_PRODUCT_SET](dw.catalog.ProductSearchHit.md#hit_type_product_set)-> a product part of set
      - [HIT_TYPE_PRODUCT_BUNDLE](dw.catalog.ProductSearchHit.md#hit_type_product_bundle)-> a product part of a bundle
      - [HIT_TYPE_VARIATION_GROUP](dw.catalog.ProductSearchHit.md#hit_type_variation_group)->a variation product
      
      
      If the method returns multiple products, the product with the highest
      sort rank is returned first, and the product with the lowest sort rank is
      returned last. The product sort rank depends on the sorting conditions
      used for the search query.


    **See Also:**
    - [getFirstRepresentedProduct()](dw.catalog.ProductSearchHit.md#getfirstrepresentedproduct)
    - [getLastRepresentedProduct()](dw.catalog.ProductSearchHit.md#getlastrepresentedproduct)


---

## Method Details

### getFirstRepresentedProduct()
- getFirstRepresentedProduct(): [Product](dw.catalog.Product.md)
  - : Returns the product that is actually hit by the search and has the highest
      sort rank according to the sorting conditions used for the search query.


    **Returns:**
    - the first product that is actually hit by the search

    **See Also:**
    - [getRepresentedProducts()](dw.catalog.ProductSearchHit.md#getrepresentedproducts)
    - [getLastRepresentedProduct()](dw.catalog.ProductSearchHit.md#getlastrepresentedproduct)


---

### getFirstRepresentedProductID()
- getFirstRepresentedProductID(): [String](TopLevel.String.md)
  - : Returns the ID of the product that is actually hit by the search and has the highest
      sort rank according to the sorting conditions used for the search query.


    **Returns:**
    - the ID of the first product that is actually hit by the search

    **See Also:**
    - [getRepresentedProducts()](dw.catalog.ProductSearchHit.md#getrepresentedproducts)
    - [getLastRepresentedProduct()](dw.catalog.ProductSearchHit.md#getlastrepresentedproduct)


---

### getHitType()
- getHitType(): [String](TopLevel.String.md)
  - : Returns the type of the product wrapped by this search hit. The product type returned will be one of the hit types: 
      
      
      - [HIT_TYPE_SIMPLE](dw.catalog.ProductSearchHit.md#hit_type_simple)  - [HIT_TYPE_PRODUCT_MASTER](dw.catalog.ProductSearchHit.md#hit_type_product_master)    - [HIT_TYPE_PRODUCT_BUNDLE](dw.catalog.ProductSearchHit.md#hit_type_product_bundle)      - [HIT_TYPE_PRODUCT_SET](dw.catalog.ProductSearchHit.md#hit_type_product_set)        - [HIT_TYPE_SLICING_GROUP](dw.catalog.ProductSearchHit.md#hit_type_slicing_group)          - [HIT_TYPE_VARIATION_GROUP](dw.catalog.ProductSearchHit.md#hit_type_variation_group)


    **Returns:**
    - search hit type


---

### getLastRepresentedProduct()
- getLastRepresentedProduct(): [Product](dw.catalog.Product.md)
  - : Returns the product that is actually hit by the search and has the lowest
      sort rank according to the sorting conditions used for the search query.


    **Returns:**
    - the last product that is actually hit by the search

    **See Also:**
    - [getRepresentedProducts()](dw.catalog.ProductSearchHit.md#getrepresentedproducts)
    - [getLastRepresentedProduct()](dw.catalog.ProductSearchHit.md#getlastrepresentedproduct)


---

### getLastRepresentedProductID()
- getLastRepresentedProductID(): [String](TopLevel.String.md)
  - : Returns the ID of the product that is actually hit by the search and has the lowest
      sort rank according to the sorting conditions used for the search query.


    **Returns:**
    - the ID of the last product that is actually hit by the search

    **See Also:**
    - [getRepresentedProducts()](dw.catalog.ProductSearchHit.md#getrepresentedproducts)
    - [getLastRepresentedProduct()](dw.catalog.ProductSearchHit.md#getlastrepresentedproduct)


---

### getMaxPrice()
- getMaxPrice(): [Money](dw.value.Money.md)
  - : Returns the maximum price of all products represented by the
      product hit. See [getRepresentedProducts()](dw.catalog.ProductSearchHit.md#getrepresentedproducts) for details on
      the set of products used for finding the maximum. The method returns
      `N/A` in case no price information can be found.
      
      
      Note: The method uses price information of the search index and therefore
      might return different prices than the ProductPriceModel.


    **Returns:**
    - the maximum price of all products represented by the product hit.


---

### getMaxPricePerUnit()
- getMaxPricePerUnit(): [Money](dw.value.Money.md)
  - : Returns the maximum price per unit of all products represented by the
      product hit. See [getRepresentedProducts()](dw.catalog.ProductSearchHit.md#getrepresentedproducts) for details on
      the set of products used for finding the maximum. The method returns
      `N/A` in case no price information can be found.
      
      
      Note: The method uses price information of the search index and therefore
      might return different prices than the ProductPriceModel.


    **Returns:**
    - the maximum price per unit of all products represented by the product hit.


---

### getMinPrice()
- getMinPrice(): [Money](dw.value.Money.md)
  - : Returns the minimum price of all products represented by the
      product hit. See [getRepresentedProducts()](dw.catalog.ProductSearchHit.md#getrepresentedproducts) for details on
      the set of products used for finding the minimum. The method returns
      `N/A` in case no price information can be found.
      
      
      Note: the method uses price information of the search index and therefore
      might return different prices than the ProductPriceModel.


    **Returns:**
    - the minimum price of all products represented by the product hit.


---

### getMinPricePerUnit()
- getMinPricePerUnit(): [Money](dw.value.Money.md)
  - : Returns the minimum price per unit of all products represented by the
      product hit. See [getRepresentedProducts()](dw.catalog.ProductSearchHit.md#getrepresentedproducts) for details on
      the set of products used for finding the minimum. The method returns
      `N/A` in case no price information can be found.
      
      
      Note: the method uses price information of the search index and therefore
      might return different prices than the ProductPriceModel.


    **Returns:**
    - the minimum price per unit of all products represented by the product hit.


---

### getProduct()
- getProduct(): [Product](dw.catalog.Product.md)
  - : Returns the presentation product of this ProductSearchHit corresponding to the [ProductSearchHit](dw.catalog.ProductSearchHit.md) type.
      
      - [HIT_TYPE_SIMPLE](dw.catalog.ProductSearchHit.md#hit_type_simple)-> a simple product 
      - [HIT_TYPE_PRODUCT_MASTER](dw.catalog.ProductSearchHit.md#hit_type_product_master)-> a variation master product
      - [HIT_TYPE_PRODUCT_SET](dw.catalog.ProductSearchHit.md#hit_type_product_set)-> a product set
      - [HIT_TYPE_PRODUCT_BUNDLE](dw.catalog.ProductSearchHit.md#hit_type_product_bundle)-> a product bundle
      - [HIT_TYPE_VARIATION_GROUP](dw.catalog.ProductSearchHit.md#hit_type_variation_group)->a variation group
      
      
      To retrieve the product(s) actually hit by the search use [getRepresentedProducts()](dw.catalog.ProductSearchHit.md#getrepresentedproducts).


    **Returns:**
    - the presentation product of this ProductSearchHit, which is possibly a
              representative of other related products actually hit by the
              search.


    **See Also:**
    - [getRepresentedProducts()](dw.catalog.ProductSearchHit.md#getrepresentedproducts)


---

### getProductID()
- getProductID(): [String](TopLevel.String.md)
  - : Returns the ID of the presentation product of this ProductSearchHit corresponding to the [ProductSearchHit](dw.catalog.ProductSearchHit.md) type.
      
      - [HIT_TYPE_SIMPLE](dw.catalog.ProductSearchHit.md#hit_type_simple)-> a simple product 
      - [HIT_TYPE_PRODUCT_MASTER](dw.catalog.ProductSearchHit.md#hit_type_product_master)-> a variation master product
      - [HIT_TYPE_PRODUCT_SET](dw.catalog.ProductSearchHit.md#hit_type_product_set)-> a product set
      - [HIT_TYPE_PRODUCT_BUNDLE](dw.catalog.ProductSearchHit.md#hit_type_product_bundle)-> a product bundle
      - [HIT_TYPE_VARIATION_GROUP](dw.catalog.ProductSearchHit.md#hit_type_variation_group)->a variation group
      
      
      To retrieve the ID of the product actually hit by the search use [getFirstRepresentedProductID()](dw.catalog.ProductSearchHit.md#getfirstrepresentedproductid) or [getLastRepresentedProductID()](dw.catalog.ProductSearchHit.md#getlastrepresentedproductid).


    **Returns:**
    - the ID of the presentation product of this ProductSearchHit, that possibly represents
              a set of related products actually hit by the search.


    **See Also:**
    - [getRepresentedProducts()](dw.catalog.ProductSearchHit.md#getrepresentedproducts)


---

### getRepresentedProductIDs()
- getRepresentedProductIDs(): [List](dw.util.List.md)
  - : The method returns the actual ID of the product that is conforming the query and is represented by the search hit.
      Depending on the hit typ, it returns the ID of:
       
      - [HIT_TYPE_SIMPLE](dw.catalog.ProductSearchHit.md#hit_type_simple)-> a simple product 
      - [HIT_TYPE_PRODUCT_MASTER](dw.catalog.ProductSearchHit.md#hit_type_product_master)-> a variation product
      - [HIT_TYPE_PRODUCT_SET](dw.catalog.ProductSearchHit.md#hit_type_product_set)-> a product part of set
      - [HIT_TYPE_PRODUCT_BUNDLE](dw.catalog.ProductSearchHit.md#hit_type_product_bundle)-> a product part of a bundle
      - [HIT_TYPE_VARIATION_GROUP](dw.catalog.ProductSearchHit.md#hit_type_variation_group)->a variation product
      
      
      If the method returns multiple products, the product with the highest
      sort rank is returned first, and the product with the lowest sort rank is
      returned last. The product sort rank depends on the sorting conditions
      used for the search query.


    **Returns:**
    - a sorted list of products represented by the wrapped product.

    **See Also:**
    - [getFirstRepresentedProduct()](dw.catalog.ProductSearchHit.md#getfirstrepresentedproduct)
    - [getLastRepresentedProduct()](dw.catalog.ProductSearchHit.md#getlastrepresentedproduct)


---

### getRepresentedProducts()
- getRepresentedProducts(): [List](dw.util.List.md)
  - : The method returns the actual product that is conforming the query and is represented by the search hit.
      Depending on the hit typ, [getRepresentedProducts()](dw.catalog.ProductSearchHit.md#getrepresentedproducts) returns:
       
      - [HIT_TYPE_SIMPLE](dw.catalog.ProductSearchHit.md#hit_type_simple)-> a simple product 
      - [HIT_TYPE_PRODUCT_MASTER](dw.catalog.ProductSearchHit.md#hit_type_product_master)-> a variation product
      - [HIT_TYPE_PRODUCT_SET](dw.catalog.ProductSearchHit.md#hit_type_product_set)-> a product part of set
      - [HIT_TYPE_PRODUCT_BUNDLE](dw.catalog.ProductSearchHit.md#hit_type_product_bundle)-> a product part of a bundle
      - [HIT_TYPE_VARIATION_GROUP](dw.catalog.ProductSearchHit.md#hit_type_variation_group)->a variation product
      
      
      If the method returns multiple products, the product with the highest
      sort rank is returned first, and the product with the lowest sort rank is
      returned last. The product sort rank depends on the sorting conditions
      used for the search query.


    **Returns:**
    - a sorted list of products represented by the wrapped product.

    **See Also:**
    - [getFirstRepresentedProduct()](dw.catalog.ProductSearchHit.md#getfirstrepresentedproduct)
    - [getLastRepresentedProduct()](dw.catalog.ProductSearchHit.md#getlastrepresentedproduct)


---

### getRepresentedVariationValues(Object)
- getRepresentedVariationValues(va: [Object](TopLevel.Object.md)): [List](dw.util.List.md)
  - : This method is only applicable if this ProductSearchHit represents a
      product variation (see [getRepresentedProducts()](dw.catalog.ProductSearchHit.md#getrepresentedproducts)). It returns the
      distinct value set for the specified variation attribute for all variants
      represented by this ProductSearchHit. The values are returned in the same
      order as they are defined for the variation.
      
      
      This method will accept a ProductVariationAttribute parameter or a String
      which is the ID of a variation attribute. If any other object type is
      passed, or null is passed, an exception will be thrown. If this
      ProductSearchHit does not represent a product variation, or the passed
      variation attribute is not associated with this product, the method
      returns an empty list.


    **Parameters:**
    - va - the product variation attribute, specified as either a             ProductVariationAttribute or a String which is the ID of a             variation attribute associated with this product.

    **Returns:**
    - a list containing all distinct ProductVariationAttributeValues.


---

### isPriceRange()
- isPriceRange(): [Boolean](TopLevel.Boolean.md)
  - : Convenience method to check whether this ProductSearchHit represents
      multiple products (see [getRepresentedProducts()](dw.catalog.ProductSearchHit.md#getrepresentedproducts)) that have
      different prices.


    **Returns:**
    - `true` if the represented products form a price range
              `false` otherwise.



---

<!-- prettier-ignore-end -->
