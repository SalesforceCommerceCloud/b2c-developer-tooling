<!-- prettier-ignore-start -->
# Class ProductPriceModel

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.catalog.ProductPriceModel](dw.catalog.ProductPriceModel.md)

ProductPriceModel provides methods to access all the
[PriceBook](dw.catalog.PriceBook.md) information of a product. A ProductPriceModel
instance is retrieved by calling [Product.getPriceModel()](dw.catalog.Product.md#getpricemodel)
or [Product.getPriceModel(ProductOptionModel)](dw.catalog.Product.md#getpricemodelproductoptionmodel) for a
specific product. The latter method will return a model which also includes
the additional option prices of an option product.


When the current price of a product is accessed in the storefront via its
price model, a price lookup is performed. The high-level steps of this price
lookup are:


- Get all price books applicable in the context of the current site, time,  session, customer, source code.
- Identify all prices in the applicable price books and for a requested  quantity.
- Calculate the best-price of all identified prices. The best-price is the  lowest price.


In more detail:



**Identify applicable price books**


- If any price books are explicitly registered in the session (see pipelet  SetApplicablePriceBooks), use these price books and their direct parents for  price lookup. Ignore all inactive price books, price books not valid at the  current time, and price books with a currency other than the session currency.


**Otherwise:**


- If a valid source code is registered with the current session, get all  price books assigned to the source code and their parent price books. Ignore  all inactive price books, price books not valid at the current time, and  price books with a currency other than the session currency.
- Get all price books assigned to site and their parent price books. Ignore  all inactive price books, price books not valid at the current time, and  price books with a currency other than the session currency.


**Identify all prices:**


- Get all price definitions for the product from all applicable price  books. Ignore price definitions not valid at the current time.
- Convert any percentage price definition into a monetary amount. As the  base price for this calculation, the minimum product price for the minimum  order quantity of the product, including product options, is used.
- Compare all prices and identify the lowest (= best) price.
- Calculate best price for each defined price cut in the price table and  return price table.


**Variation Price Fallback:**


- If no applicable pricebooks for a variant is found, the price lookup gets  the price books from the variant's master product
- A price books is also not applicable of the price definition for the  variant in the price book is not valid at the current time.





Typically, in order to do a standard price lookup, it is only necessary to
call `Product.getPriceModel().getPrice()`. However, Commerce Cloud
Digital also supports tiered prices, meaning that higher quantities receive
a lower price. In this case, the merchant typically wants to display a table
of price points on product detail pages. Therefore, the ProductPriceModel
provides the method [getPriceTable()](dw.catalog.ProductPriceModel.md#getpricetable) to retrieve a table of these prices.




If a merchant wants to know not only what the price of a given product is,
but what price book the price was derived from, this class provides the
method [getPriceInfo()](dw.catalog.ProductPriceModel.md#getpriceinfo). This class also provides methods to lookup
product prices in specific price books by name and quantity. See
[getPriceBookPrice(String)](dw.catalog.ProductPriceModel.md#getpricebookpricestring).



## Property Summary

| Property | Description |
| --- | --- |
| [basePriceQuantity](#basepricequantity): [Quantity](dw.value.Quantity.md) `(read-only)` | Returns the quantity for which the base price is defined. |
| [maxPrice](#maxprice): [Money](dw.value.Money.md) `(read-only)` | Calculates and returns the maximum price-book price of all variants (for  master products) or set-products (for product sets) for base quantity  1.00. |
| [maxPricePerUnit](#maxpriceperunit): [Money](dw.value.Money.md) `(read-only)` | Calculates and returns the maximum price-book price per unit of all variants (for  master products) or set-products (for product sets) for base quantity  1.00. |
| [minPrice](#minprice): [Money](dw.value.Money.md) `(read-only)` | Calculates and returns the minimum price-book price of all variants (for  master products) or set-products (for product sets) for base quantity  1.00. |
| [minPricePerUnit](#minpriceperunit): [Money](dw.value.Money.md) `(read-only)` | Calculates and returns the minimum price-book price per unit of all variants (for  master products) or set-products (for product sets) for base quantity  1.00. |
| [price](#price): [Money](dw.value.Money.md) `(read-only)` | Returns the active price of a product, calculated based on base price quantity  1.00. |
| [priceInfo](#priceinfo): [ProductPriceInfo](dw.catalog.ProductPriceInfo.md) `(read-only)` | Returns the active price info of a product, calculated based on base price  quantity 1.00. |
| [priceInfos](#priceinfos): [Collection](dw.util.Collection.md) `(read-only)` | Returns all the eligible `</>ProductPriceInfo`</>(s), calculated based  on base price quantity 1.00. |
| [pricePerUnit](#priceperunit): [Money](dw.value.Money.md) `(read-only)` | Returns the sales price per unit of a product, calculated based on base price  quantity 1.00. |
| [priceRange](#pricerange): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns true if this product is a master product (or product set) and the  collection of online variants (or set products respectively) contains  products of different prices. |
| [priceTable](#pricetable): [ProductPriceTable](dw.catalog.ProductPriceTable.md) `(read-only)` | Returns the product price table object. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getBasePriceQuantity](dw.catalog.ProductPriceModel.md#getbasepricequantity)() | Returns the quantity for which the base price is defined. |
| [getMaxPrice](dw.catalog.ProductPriceModel.md#getmaxprice)() | Calculates and returns the maximum price-book price of all variants (for  master products) or set-products (for product sets) for base quantity  1.00. |
| [getMaxPriceBookPrice](dw.catalog.ProductPriceModel.md#getmaxpricebookpricestring)([String](TopLevel.String.md)) | Calculates and returns the maximum price in a given price book of all  variants (for master products) or set-products (for product sets) for  base quantity 1.00. |
| [getMaxPriceBookPricePerUnit](dw.catalog.ProductPriceModel.md#getmaxpricebookpriceperunitstring)([String](TopLevel.String.md)) | Calculates and returns the maximum price per unit in a given price book of all  variants (for master products) or set-products (for product sets) for  base quantity 1.00. |
| [getMaxPricePerUnit](dw.catalog.ProductPriceModel.md#getmaxpriceperunit)() | Calculates and returns the maximum price-book price per unit of all variants (for  master products) or set-products (for product sets) for base quantity  1.00. |
| [getMinPrice](dw.catalog.ProductPriceModel.md#getminprice)() | Calculates and returns the minimum price-book price of all variants (for  master products) or set-products (for product sets) for base quantity  1.00. |
| [getMinPriceBookPrice](dw.catalog.ProductPriceModel.md#getminpricebookpricestring)([String](TopLevel.String.md)) | Calculates and returns the minimum price in a given price book of all  variants (for master products) or set-products (for product sets) for  base quantity 1.00. |
| [getMinPriceBookPricePerUnit](dw.catalog.ProductPriceModel.md#getminpricebookpriceperunitstring)([String](TopLevel.String.md)) | Calculates and returns the minimum price per unit in a given price book of all  variants (for master products) or set-products (for product sets) for  base quantity 1.00. |
| [getMinPricePerUnit](dw.catalog.ProductPriceModel.md#getminpriceperunit)() | Calculates and returns the minimum price-book price per unit of all variants (for  master products) or set-products (for product sets) for base quantity  1.00. |
| [getPrice](dw.catalog.ProductPriceModel.md#getprice)() | Returns the active price of a product, calculated based on base price quantity  1.00. |
| [getPrice](dw.catalog.ProductPriceModel.md#getpricequantity)([Quantity](dw.value.Quantity.md)) | Returns the active price of a product, calculated based on the passed order  quantity. |
| [getPriceBookPrice](dw.catalog.ProductPriceModel.md#getpricebookpricestring)([String](TopLevel.String.md)) | Returns the active price of the product in the specified price book for  quantity 1.00. |
| [getPriceBookPrice](dw.catalog.ProductPriceModel.md#getpricebookpricestring-quantity)([String](TopLevel.String.md), [Quantity](dw.value.Quantity.md)) | Returns the active price of the product in the specified price book for  the specified quantity. |
| [getPriceBookPriceInfo](dw.catalog.ProductPriceModel.md#getpricebookpriceinfostring)([String](TopLevel.String.md)) | This method acts similarly to [getPriceBookPrice(String)](dw.catalog.ProductPriceModel.md#getpricebookpricestring) but  returns a ProductPriceInfo object wrapping the actual price with  additional information. |
| [getPriceBookPriceInfo](dw.catalog.ProductPriceModel.md#getpricebookpriceinfostring-quantity)([String](TopLevel.String.md), [Quantity](dw.value.Quantity.md)) | This method acts similarly to  [getPriceBookPrice(String, Quantity)](dw.catalog.ProductPriceModel.md#getpricebookpricestring-quantity) but returns a  ProductPriceInfo object wrapping the actual price with additional  information. |
| [getPriceBookPricePerUnit](dw.catalog.ProductPriceModel.md#getpricebookpriceperunitstring)([String](TopLevel.String.md)) | Returns the active price per unit of the product in the specified price book for  quantity 1.00. |
| [getPriceBookPricePerUnit](dw.catalog.ProductPriceModel.md#getpricebookpriceperunitstring-quantity)([String](TopLevel.String.md), [Quantity](dw.value.Quantity.md)) | Returns the active price per unit of the product in the specified price book for  the specified quantity. |
| [getPriceInfo](dw.catalog.ProductPriceModel.md#getpriceinfo)() | Returns the active price info of a product, calculated based on base price  quantity 1.00. |
| [getPriceInfo](dw.catalog.ProductPriceModel.md#getpriceinfoquantity)([Quantity](dw.value.Quantity.md)) | Returns the active price info of a product, calculated based on the passed order  quantity. |
| [getPriceInfos](dw.catalog.ProductPriceModel.md#getpriceinfos)() | Returns all the eligible `</>ProductPriceInfo`</>(s), calculated based  on base price quantity 1.00. |
| [getPricePerUnit](dw.catalog.ProductPriceModel.md#getpriceperunit)() | Returns the sales price per unit of a product, calculated based on base price  quantity 1.00. |
| [getPricePerUnit](dw.catalog.ProductPriceModel.md#getpriceperunitquantity)([Quantity](dw.value.Quantity.md)) | Returns the sales price per unit of a product, calculated based on the passed  order quantity. |
| ~~[getPricePercentage](dw.catalog.ProductPriceModel.md#getpricepercentagemoney-money)([Money](dw.value.Money.md), [Money](dw.value.Money.md))~~ | Calculates and returns the percentage off amount of the passed  comparePrice to the passed basePrice. |
| [getPriceTable](dw.catalog.ProductPriceModel.md#getpricetable)() | Returns the product price table object. |
| [isPriceRange](dw.catalog.ProductPriceModel.md#ispricerange)() | Returns true if this product is a master product (or product set) and the  collection of online variants (or set products respectively) contains  products of different prices. |
| [isPriceRange](dw.catalog.ProductPriceModel.md#ispricerangestring)([String](TopLevel.String.md)) | Returns true if this product is a master product (or product set) and the  collection of online variants (or set products respectively) contains  products of different prices in the specified price book. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### basePriceQuantity
- basePriceQuantity: [Quantity](dw.value.Quantity.md) `(read-only)`
  - : Returns the quantity for which the base price is defined. This
      is typically 1.0.



---

### maxPrice
- maxPrice: [Money](dw.value.Money.md) `(read-only)`
  - : Calculates and returns the maximum price-book price of all variants (for
      master products) or set-products (for product sets) for base quantity
      1.00. This value can be used to display a range of prices in storefront.
      If the product represented by this model is not a master product or
      product set, then this method behaves the same as [getPrice()](dw.catalog.ProductPriceModel.md#getprice).
      Only online products are considered. If the "orderable products only"
      search preference is enabled for the current site, then only orderable
      products are considered. For master products, only variants with all
      variation attributes configured are considered.
      
      
      **Warning:**  If the product represented by this model is a master
      product with numerous variants, this method can be very expensive and
      should be avoided.



---

### maxPricePerUnit
- maxPricePerUnit: [Money](dw.value.Money.md) `(read-only)`
  - : Calculates and returns the maximum price-book price per unit of all variants (for
      master products) or set-products (for product sets) for base quantity
      1.00. This value can be used to display a range of prices in storefront.
      If the product represented by this model is not a master product or
      product set, then this method behaves the same as [getPricePerUnit()](dw.catalog.ProductPriceModel.md#getpriceperunit).
      Only online products are considered. If the "orderable products only"
      search preference is enabled for the current site, then only orderable
      products are considered. For master products, only variants with all
      variation attributes configured are considered.
      
      e.g.
      suppose one master product mp (price = $6, unitQuantity = 2), it has 2 variants:
      v1(price = $5, unitQuantity = 5), v2(price = $10, unitQuantity = 20).
      The max price per unit of mp will be max($6/2, $5/5, $10/20) = $3



---

### minPrice
- minPrice: [Money](dw.value.Money.md) `(read-only)`
  - : Calculates and returns the minimum price-book price of all variants (for
      master products) or set-products (for product sets) for base quantity
      1.00. This value can be used to display a range of prices in storefront.
      If the product represented by this model is not a master product or
      product set, then this method behaves the same as [getPrice()](dw.catalog.ProductPriceModel.md#getprice).
      Only online products are considered. If the "orderable products only"
      search preference is enabled for the current site, then only orderable
      products are considered. For master products, only variants with all
      variation attributes configured are considered.
      
      
      **Warning:**  If the product represented by this model is a master
      product with numerous variants, this method can be very expensive and
      should be avoided.



---

### minPricePerUnit
- minPricePerUnit: [Money](dw.value.Money.md) `(read-only)`
  - : Calculates and returns the minimum price-book price per unit of all variants (for
      master products) or set-products (for product sets) for base quantity
      1.00. This value can be used to display a range of prices in storefront.
      If the product represented by this model is not a master product or
      product set, then this method behaves the same as [getPricePerUnit()](dw.catalog.ProductPriceModel.md#getpriceperunit).
      Only online products are considered. If the "orderable products only"
      search preference is enabled for the current site, then only orderable
      products are considered. For master products, only variants with all
      variation attributes configured are considered.
      
      e.g.
      suppose one master product mp (price = $6, unitQuantity = 2), it has 2 variants:
      v1(price = $5, unitQuantity = 5), v2(price = $10, unitQuantity = 20).
      The min price per unit of mp will be min($6/2, $5/5, $10/20) = $0.5



---

### price
- price: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the active price of a product, calculated based on base price quantity
      1.00. The price is returned for the currency of the current session.
      
      
      The price lookup is based on the configuration of price books. It depends
      on various settings, such as which price books are active, or explicitly
      set as applicable in the current session.
      
      
      If the product represented by this model is an option product, option
      prices will be added to the price book price if the price model was
      initialized with an option model.
      
      
      If no price could be found, MONEY.NOT\_AVAILABLE is returned.



---

### priceInfo
- priceInfo: [ProductPriceInfo](dw.catalog.ProductPriceInfo.md) `(read-only)`
  - : Returns the active price info of a product, calculated based on base price
      quantity 1.00. The price is returned for the currency of the current
      session.
      
      
      This method is similar to `getPrice()` but instead of just
      returning the price value, it returns a `ProductPriceInfo`
      which contains additional information such as the PriceBook which defined
      the price and the percentage discount this price point represents.
      
      
      If the product represented by this model is an option product, option
      prices will be added to the price book price if the price model was
      initialized with an option model.
      
      
      If no price info could be found, null is returned.


    **See Also:**
    - [getPrice()](dw.catalog.ProductPriceModel.md#getprice)
    - [getPriceInfo(Quantity)](dw.catalog.ProductPriceModel.md#getpriceinfoquantity)


---

### priceInfos
- priceInfos: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns all the eligible `</>ProductPriceInfo`</>(s), calculated based
      on base price quantity 1.00. This will return an empty list if getPriceInfo() would return null, and if there is
      only one price info in the collection it will be the same price info as getPriceInfo(). Two or more price infos
      indicate that there are that many price books that meet the criteria for returning the price shown in the
      storefront.


    **See Also:**
    - [getPriceInfo()](dw.catalog.ProductPriceModel.md#getpriceinfo)


---

### pricePerUnit
- pricePerUnit: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the sales price per unit of a product, calculated based on base price
      quantity 1.00.
      
      
      The product sales price per unit is returned for the current session currency.
      Hence, the using this method is only useful in storefront processes.
      
      
      The price lookup is based on the configuration of price books. It depends
      on various settings, such as which price books are active, or explicitly
      set as applicable in the current session.
      
      
      If no price could be found, MONEY.N\_A is returned.



---

### priceRange
- priceRange: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns true if this product is a master product (or product set) and the
      collection of online variants (or set products respectively) contains
      products of different prices.
      
      
      **Warning:**  If the product represented by this model is a master
      product with numerous variants, this method can be very expensive and
      should be avoided.



---

### priceTable
- priceTable: [ProductPriceTable](dw.catalog.ProductPriceTable.md) `(read-only)`
  - : Returns the product price table object. The price table represents a map
      between order quantities and prices, and also provides % off information
      to be shown to storefront customers. The price is returned for the
      currency of the current session.
      
      
      Usually, the product price table is printed on product detail pages in
      the storefront.
      
      
      If the product represented by this model is an option product, option
      prices will be added to the price book price if the price model was
      initialized with an option model.
      
      
      All other methods of this class are based on the information in the
      product price table.



---

## Method Details

### getBasePriceQuantity()
- getBasePriceQuantity(): [Quantity](dw.value.Quantity.md)
  - : Returns the quantity for which the base price is defined. This
      is typically 1.0.


    **Returns:**
    - the quantity for which the base price is defined.


---

### getMaxPrice()
- getMaxPrice(): [Money](dw.value.Money.md)
  - : Calculates and returns the maximum price-book price of all variants (for
      master products) or set-products (for product sets) for base quantity
      1.00. This value can be used to display a range of prices in storefront.
      If the product represented by this model is not a master product or
      product set, then this method behaves the same as [getPrice()](dw.catalog.ProductPriceModel.md#getprice).
      Only online products are considered. If the "orderable products only"
      search preference is enabled for the current site, then only orderable
      products are considered. For master products, only variants with all
      variation attributes configured are considered.
      
      
      **Warning:**  If the product represented by this model is a master
      product with numerous variants, this method can be very expensive and
      should be avoided.


    **Returns:**
    - Maximum price of all online variants or set-products.


---

### getMaxPriceBookPrice(String)
- getMaxPriceBookPrice(priceBookID: [String](TopLevel.String.md)): [Money](dw.value.Money.md)
  - : Calculates and returns the maximum price in a given price book of all
      variants (for master products) or set-products (for product sets) for
      base quantity 1.00. This value can be used to display a range of prices
      in storefront.
      
      This method follows the same rules as
      [getPriceBookPrice(String)](dw.catalog.ProductPriceModel.md#getpricebookpricestring) in determining the price book
      price for each variant or set-product. If the product represented by this
      model is not a master product or product set, then this method behaves
      the same as [getPriceBookPrice(String)](dw.catalog.ProductPriceModel.md#getpricebookpricestring).


    **Parameters:**
    - priceBookID - ID of price book the price is requested for, must not             be null.

    **Returns:**
    - The maximum price across all subproducts in the specified price
              book.



---

### getMaxPriceBookPricePerUnit(String)
- getMaxPriceBookPricePerUnit(priceBookID: [String](TopLevel.String.md)): [Money](dw.value.Money.md)
  - : Calculates and returns the maximum price per unit in a given price book of all
      variants (for master products) or set-products (for product sets) for
      base quantity 1.00. This value can be used to display a range of price per units
      in storefront.
      
      This method follows the same rules as
      [getPriceBookPricePerUnit(String)](dw.catalog.ProductPriceModel.md#getpricebookpriceperunitstring) in determining the price book
      price for each variant or set-product. If the product represented by this
      model is not a master product or product set, then this method behaves
      the same as [getPriceBookPricePerUnit(String)](dw.catalog.ProductPriceModel.md#getpricebookpriceperunitstring).


    **Parameters:**
    - priceBookID - ID of price book the price is requested for, must not             be null.

    **Returns:**
    - The maximum price per unit across all sub-products in the specified price
              book.



---

### getMaxPricePerUnit()
- getMaxPricePerUnit(): [Money](dw.value.Money.md)
  - : Calculates and returns the maximum price-book price per unit of all variants (for
      master products) or set-products (for product sets) for base quantity
      1.00. This value can be used to display a range of prices in storefront.
      If the product represented by this model is not a master product or
      product set, then this method behaves the same as [getPricePerUnit()](dw.catalog.ProductPriceModel.md#getpriceperunit).
      Only online products are considered. If the "orderable products only"
      search preference is enabled for the current site, then only orderable
      products are considered. For master products, only variants with all
      variation attributes configured are considered.
      
      e.g.
      suppose one master product mp (price = $6, unitQuantity = 2), it has 2 variants:
      v1(price = $5, unitQuantity = 5), v2(price = $10, unitQuantity = 20).
      The max price per unit of mp will be max($6/2, $5/5, $10/20) = $3


    **Returns:**
    - Maximum price per unit of all online variants or set-products.


---

### getMinPrice()
- getMinPrice(): [Money](dw.value.Money.md)
  - : Calculates and returns the minimum price-book price of all variants (for
      master products) or set-products (for product sets) for base quantity
      1.00. This value can be used to display a range of prices in storefront.
      If the product represented by this model is not a master product or
      product set, then this method behaves the same as [getPrice()](dw.catalog.ProductPriceModel.md#getprice).
      Only online products are considered. If the "orderable products only"
      search preference is enabled for the current site, then only orderable
      products are considered. For master products, only variants with all
      variation attributes configured are considered.
      
      
      **Warning:**  If the product represented by this model is a master
      product with numerous variants, this method can be very expensive and
      should be avoided.


    **Returns:**
    - Minimum price of all online variants or set-products.


---

### getMinPriceBookPrice(String)
- getMinPriceBookPrice(priceBookID: [String](TopLevel.String.md)): [Money](dw.value.Money.md)
  - : Calculates and returns the minimum price in a given price book of all
      variants (for master products) or set-products (for product sets) for
      base quantity 1.00. This value can be used to display a range of prices
      in storefront.
      
      This method follows the same rules as
      [getPriceBookPrice(String)](dw.catalog.ProductPriceModel.md#getpricebookpricestring) in determining the price book
      price for each variant or set-product. If the product represented by this
      model is not a master product or product set, then this method behaves
      the same as [getPriceBookPrice(String)](dw.catalog.ProductPriceModel.md#getpricebookpricestring).


    **Parameters:**
    - priceBookID - ID of price book the price is requested for, must not             be null.

    **Returns:**
    - The minimum price across all subproducts in the specified price
              book.



---

### getMinPriceBookPricePerUnit(String)
- getMinPriceBookPricePerUnit(priceBookID: [String](TopLevel.String.md)): [Money](dw.value.Money.md)
  - : Calculates and returns the minimum price per unit in a given price book of all
      variants (for master products) or set-products (for product sets) for
      base quantity 1.00. This value can be used to display a range of price per units
      in storefront.
      
      This method follows the same rules as
      [getPriceBookPricePerUnit(String)](dw.catalog.ProductPriceModel.md#getpricebookpriceperunitstring) in determining the price book
      price for each variant or set-product. If the product represented by this
      model is not a master product or product set, then this method behaves
      the same as [getPriceBookPricePerUnit(String)](dw.catalog.ProductPriceModel.md#getpricebookpriceperunitstring).


    **Parameters:**
    - priceBookID - ID of price book the price is requested for, must not             be null.

    **Returns:**
    - The minimum price per unit across all sub-products in the specified price
              book.



---

### getMinPricePerUnit()
- getMinPricePerUnit(): [Money](dw.value.Money.md)
  - : Calculates and returns the minimum price-book price per unit of all variants (for
      master products) or set-products (for product sets) for base quantity
      1.00. This value can be used to display a range of prices in storefront.
      If the product represented by this model is not a master product or
      product set, then this method behaves the same as [getPricePerUnit()](dw.catalog.ProductPriceModel.md#getpriceperunit).
      Only online products are considered. If the "orderable products only"
      search preference is enabled for the current site, then only orderable
      products are considered. For master products, only variants with all
      variation attributes configured are considered.
      
      e.g.
      suppose one master product mp (price = $6, unitQuantity = 2), it has 2 variants:
      v1(price = $5, unitQuantity = 5), v2(price = $10, unitQuantity = 20).
      The min price per unit of mp will be min($6/2, $5/5, $10/20) = $0.5


    **Returns:**
    - Minimum price of all online variants or set-products.


---

### getPrice()
- getPrice(): [Money](dw.value.Money.md)
  - : Returns the active price of a product, calculated based on base price quantity
      1.00. The price is returned for the currency of the current session.
      
      
      The price lookup is based on the configuration of price books. It depends
      on various settings, such as which price books are active, or explicitly
      set as applicable in the current session.
      
      
      If the product represented by this model is an option product, option
      prices will be added to the price book price if the price model was
      initialized with an option model.
      
      
      If no price could be found, MONEY.NOT\_AVAILABLE is returned.


    **Returns:**
    - the product price.


---

### getPrice(Quantity)
- getPrice(quantity: [Quantity](dw.value.Quantity.md)): [Money](dw.value.Money.md)
  - : Returns the active price of a product, calculated based on the passed order
      quantity. The price is returned for the currency of the current session.
      
      
      The price lookup is based on the configuration of price books. It depends
      on various settings, such as which price books are active, or explicitly
      set as applicable in the current session.
      
      
      If the product represented by this model is an option product, option
      prices will be added to the price book price if the price model was
      initialized with an option model.
      
      
      If passed order quantity < 1 (and greater than zero), price for quantity
      1 is returned.
      
      
      If no price could be found, MONEY.NOT\_AVAILABLE is returned.


    **Parameters:**
    - quantity - Quantity price is requested for

    **Returns:**
    - the product price.


---

### getPriceBookPrice(String)
- getPriceBookPrice(priceBookID: [String](TopLevel.String.md)): [Money](dw.value.Money.md)
  - : Returns the active price of the product in the specified price book for
      quantity 1.00.
      
      
      If the product represented by this model is an option product, option
      prices will be added to the price book price if the price model was
      initialized with an option model.
      
      
      Money.NOT\_AVAILABLE will be returned in any of the following cases:
      
      
      - priceBookID is null or does not identify a valid price book.
      - The price book has no price for the product.
      - None of the prices for the product in the price book is currently  active.
      - The currently active price entry is a percentage.


    **Parameters:**
    - priceBookID - ID of price book the price is requested for.

    **Returns:**
    - the price of the product in the specified price book.


---

### getPriceBookPrice(String, Quantity)
- getPriceBookPrice(priceBookID: [String](TopLevel.String.md), quantity: [Quantity](dw.value.Quantity.md)): [Money](dw.value.Money.md)
  - : Returns the active price of the product in the specified price book for
      the specified quantity.
      
      
      If the product represented by this model is an option product, option
      prices will be added to the price book price if the price model was
      initialized with an option model.
      
      
      Money.NOT\_AVAILABLE will be returned in any of the following cases:
      
      
      - priceBookID is null or does not identify a valid price book.
      - quantity is null.
      - The price book has no price for the product.
      - None of the prices for the product in the price book is currently  active.
      - The currently active price entry is a percentage.


    **Parameters:**
    - priceBookID - ID of price book the price is requested for.
    - quantity - the specified quantity to find the price for.

    **Returns:**
    - the price of the product in the specified price book.


---

### getPriceBookPriceInfo(String)
- getPriceBookPriceInfo(priceBookID: [String](TopLevel.String.md)): [ProductPriceInfo](dw.catalog.ProductPriceInfo.md)
  - : This method acts similarly to [getPriceBookPrice(String)](dw.catalog.ProductPriceModel.md#getpricebookpricestring) but
      returns a ProductPriceInfo object wrapping the actual price with
      additional information.


    **Parameters:**
    - priceBookID - ID of price book the price is requested for, must not             be null.

    **Returns:**
    - the product price info, or null if not found.


---

### getPriceBookPriceInfo(String, Quantity)
- getPriceBookPriceInfo(priceBookID: [String](TopLevel.String.md), quantity: [Quantity](dw.value.Quantity.md)): [ProductPriceInfo](dw.catalog.ProductPriceInfo.md)
  - : This method acts similarly to
      [getPriceBookPrice(String, Quantity)](dw.catalog.ProductPriceModel.md#getpricebookpricestring-quantity) but returns a
      ProductPriceInfo object wrapping the actual price with additional
      information.


    **Parameters:**
    - priceBookID - ID of price book the price is requested for, must not             be null.
    - quantity - Quantity price is requested for.

    **Returns:**
    - the product price info, or null if not found.


---

### getPriceBookPricePerUnit(String)
- getPriceBookPricePerUnit(priceBookID: [String](TopLevel.String.md)): [Money](dw.value.Money.md)
  - : Returns the active price per unit of the product in the specified price book for
      quantity 1.00.
      
      
      If the product represented by this model is an option product, option
      prices will be added to the price book price if the price model was
      initialized with an option model.
      
      
      Money.NOT\_AVAILABLE will be returned in any of the following cases:
      
      
      - The priceBookID does not identify a valid price book.
      - The price book has no price for the product.
      - None of the prices for the product in the price book is currently  active.
      - The currently active price entry is a percentage.


    **Parameters:**
    - priceBookID - ID of price book the price is requested for, must not be null.

    **Returns:**
    - the price per unit of the product in the specified price book.


---

### getPriceBookPricePerUnit(String, Quantity)
- getPriceBookPricePerUnit(priceBookID: [String](TopLevel.String.md), quantity: [Quantity](dw.value.Quantity.md)): [Money](dw.value.Money.md)
  - : Returns the active price per unit of the product in the specified price book for
      the specified quantity.
      
      
      If the product represented by this model is an option product, option
      prices will be added to the price book price if the price model was
      initialized with an option model.
      
      
      Money.NOT\_AVAILABLE will be returned in any of the following cases:
      
      
      - The priceBookID does not identify a valid price book.
      - The price book has no price for the product.
      - None of the prices for the product in the price book is currently  active.
      - The currently active price entry is a percentage.


    **Parameters:**
    - priceBookID - ID of price book the price is requested for, must not be null.
    - quantity - the specified quantity to find the price for, must not be null.

    **Returns:**
    - the price per unit of the product in the specified price book for the specific quantity.


---

### getPriceInfo()
- getPriceInfo(): [ProductPriceInfo](dw.catalog.ProductPriceInfo.md)
  - : Returns the active price info of a product, calculated based on base price
      quantity 1.00. The price is returned for the currency of the current
      session.
      
      
      This method is similar to `getPrice()` but instead of just
      returning the price value, it returns a `ProductPriceInfo`
      which contains additional information such as the PriceBook which defined
      the price and the percentage discount this price point represents.
      
      
      If the product represented by this model is an option product, option
      prices will be added to the price book price if the price model was
      initialized with an option model.
      
      
      If no price info could be found, null is returned.


    **Returns:**
    - the product price info, or null if not found.

    **See Also:**
    - [getPrice()](dw.catalog.ProductPriceModel.md#getprice)
    - [getPriceInfo(Quantity)](dw.catalog.ProductPriceModel.md#getpriceinfoquantity)


---

### getPriceInfo(Quantity)
- getPriceInfo(quantity: [Quantity](dw.value.Quantity.md)): [ProductPriceInfo](dw.catalog.ProductPriceInfo.md)
  - : Returns the active price info of a product, calculated based on the passed order
      quantity. The price is returned for the currency of the current session.
      
      
      This method is similar to `getPrice(Quantity)` but instead of
      just returning the price value, it returns a
      `ProductPriceInfo` which contains additional information such
      as the PriceBook which defined the price and the percentage discount this
      price point represents.
      
      
      If the product represented by this model is an option product, option
      prices will be added to the price book price if the price model was
      initialized with an option model.
      
      
      If no price info could be found, null is returned.


    **Parameters:**
    - quantity - the quantity to use.

    **Returns:**
    - the product price info, or null if not found.

    **See Also:**
    - [getPrice(Quantity)](dw.catalog.ProductPriceModel.md#getpricequantity)


---

### getPriceInfos()
- getPriceInfos(): [Collection](dw.util.Collection.md)
  - : Returns all the eligible `</>ProductPriceInfo`</>(s), calculated based
      on base price quantity 1.00. This will return an empty list if getPriceInfo() would return null, and if there is
      only one price info in the collection it will be the same price info as getPriceInfo(). Two or more price infos
      indicate that there are that many price books that meet the criteria for returning the price shown in the
      storefront.


    **Returns:**
    - any product price info that could be responsible for the storefront price, or empty collection if there
              were no product price infos this price model.


    **See Also:**
    - [getPriceInfo()](dw.catalog.ProductPriceModel.md#getpriceinfo)


---

### getPricePerUnit()
- getPricePerUnit(): [Money](dw.value.Money.md)
  - : Returns the sales price per unit of a product, calculated based on base price
      quantity 1.00.
      
      
      The product sales price per unit is returned for the current session currency.
      Hence, the using this method is only useful in storefront processes.
      
      
      The price lookup is based on the configuration of price books. It depends
      on various settings, such as which price books are active, or explicitly
      set as applicable in the current session.
      
      
      If no price could be found, MONEY.N\_A is returned.


    **Returns:**
    - product sales price per unit


---

### getPricePerUnit(Quantity)
- getPricePerUnit(quantity: [Quantity](dw.value.Quantity.md)): [Money](dw.value.Money.md)
  - : Returns the sales price per unit of a product, calculated based on the passed
      order quantity.
      
      
      The product sales price per unit is returned for the current session currency.
      Hence, the using this method is only useful in storefront processes.
      
      
      The price lookup is based on the configuration of price books. It depends
      on various settings, such as which price books are active, or explicitely
      set as applicable in the current session.
      
      
      If no price could be found, MONEY.N\_A is returned.


    **Parameters:**
    - quantity - Quantity price is requested for

    **Returns:**
    - product sales price per unit


---

### getPricePercentage(Money, Money)
- ~~getPricePercentage(basePrice: [Money](dw.value.Money.md), comparePrice: [Money](dw.value.Money.md)): [Number](TopLevel.Number.md)~~
  - : Calculates and returns the percentage off amount of the passed
      comparePrice to the passed basePrice.


    **Parameters:**
    - basePrice - The assumed 100% price amount
    - comparePrice - The price to compare to the basePrice

    **Returns:**
    - The percentage between comparePrice and basePrice (e.g. 90%).

    **Deprecated:**
:::warning
Use [Money.percentLessThan(Money)](dw.value.Money.md#percentlessthanmoney)
:::

---

### getPriceTable()
- getPriceTable(): [ProductPriceTable](dw.catalog.ProductPriceTable.md)
  - : Returns the product price table object. The price table represents a map
      between order quantities and prices, and also provides % off information
      to be shown to storefront customers. The price is returned for the
      currency of the current session.
      
      
      Usually, the product price table is printed on product detail pages in
      the storefront.
      
      
      If the product represented by this model is an option product, option
      prices will be added to the price book price if the price model was
      initialized with an option model.
      
      
      All other methods of this class are based on the information in the
      product price table.


    **Returns:**
    - the Product price table.


---

### isPriceRange()
- isPriceRange(): [Boolean](TopLevel.Boolean.md)
  - : Returns true if this product is a master product (or product set) and the
      collection of online variants (or set products respectively) contains
      products of different prices.
      
      
      **Warning:**  If the product represented by this model is a master
      product with numerous variants, this method can be very expensive and
      should be avoided.


    **Returns:**
    - True if this product has a range of prices, false otherwise.


---

### isPriceRange(String)
- isPriceRange(priceBookID: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Returns true if this product is a master product (or product set) and the
      collection of online variants (or set products respectively) contains
      products of different prices in the specified price book.


    **Parameters:**
    - priceBookID - The ID of the price book.

    **Returns:**
    - True if this product has a range of prices, false otherwise.


---

<!-- prettier-ignore-end -->
