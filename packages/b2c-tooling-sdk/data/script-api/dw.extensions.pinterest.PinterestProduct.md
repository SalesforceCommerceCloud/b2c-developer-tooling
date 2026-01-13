<!-- prettier-ignore-start -->
# Class PinterestProduct

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.extensions.pinterest.PinterestProduct](dw.extensions.pinterest.PinterestProduct.md)

Represents a row in the Pinterest catalog feed export.


## Constant Summary

| Constant | Description |
| --- | --- |
| [AVAILABILITY_IN_STOCK](#availability_in_stock): [String](TopLevel.String.md) = "in stock" | Indicates that the product is in stock. |
| [AVAILABILITY_OUT_OF_STOCK](#availability_out_of_stock): [String](TopLevel.String.md) = "out of stock" | Indicates that the product is not in stock. |
| [AVAILABILITY_PREORDER](#availability_preorder): [String](TopLevel.String.md) = "preorder" | Indicates that the product is availabile in preorder. |
| [CONDITION_NEW](#condition_new): [String](TopLevel.String.md) = "new" | Indicates that the product has never been used. |
| [CONDITION_REFURBISHED](#condition_refurbished): [String](TopLevel.String.md) = "refurbished" | Indicates that the product has been used but refurbished. |
| [CONDITION_USED](#condition_used): [String](TopLevel.String.md) = "used" | Indicates that the product has been used. |

## Property Summary

| Property | Description |
| --- | --- |
| [ID](#id): [String](TopLevel.String.md) `(read-only)` | Returns the ID of the Pinterest product. |
| [availability](#availability): [String](TopLevel.String.md) | Returns the availability of the Pinterest product. |
| [brand](#brand): [String](TopLevel.String.md) | Returns the Pinterest brand of the product. |
| [color](#color): [String](TopLevel.String.md) | Returns the Pinterest color value label of the product. |
| [colorHex](#colorhex): [String](TopLevel.String.md) | Returns the Pinterest color hex value of the product. |
| [colorImage](#colorimage): [URL](dw.web.URL.md) | Returns the URL of the image to show in Pinterest for the product color (swatch). |
| [condition](#condition): [String](TopLevel.String.md) | Returns the condition of the Pinterest product. |
| [description](#description): [String](TopLevel.String.md) | Returns the Pinterest description of the product. |
| [googleProductCategory](#googleproductcategory): [String](TopLevel.String.md) | Returns the category of this product in the Google category taxonomy. |
| [gtin](#gtin): [String](TopLevel.String.md) | Returns the Pinterest GTIN of the product. |
| [imageLinks](#imagelinks): [List](dw.util.List.md) | Returns a list containing the URLs of the image to show in Pinterest for the product. |
| [itemGroupID](#itemgroupid): [String](TopLevel.String.md) | Returns the ID of the Pinterest item group for the product, that is, its master product. |
| [itemGroupLink](#itemgrouplink): [URL](dw.web.URL.md) | Returns the URL of the Pinterest item group for the product, that is, the link to its master product in the  Demandware storefront. |
| [link](#link): [URL](dw.web.URL.md) | Returns the URL of the Demandware storefront link to the product. |
| [maxPrice](#maxprice): [Money](dw.value.Money.md) | Returns the maximum price to show in Pinterest for the product. |
| [minPrice](#minprice): [Money](dw.value.Money.md) | Returns the minimum price to show in Pinterest for the product. |
| [price](#price): [Money](dw.value.Money.md) | Returns the price to show in Pinterest for the product. |
| [productCategory](#productcategory): [String](TopLevel.String.md) | Returns the Pinterest category path of the product. |
| [returnPolicy](#returnpolicy): [String](TopLevel.String.md) | Returns the Pinterest return policy of the product. |
| [size](#size): [String](TopLevel.String.md) | Returns the Pinterest size value label of the product. |
| [title](#title): [String](TopLevel.String.md) | Returns the Pinterest title of the product. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getAvailability](dw.extensions.pinterest.PinterestProduct.md#getavailability)() | Returns the availability of the Pinterest product. |
| [getBrand](dw.extensions.pinterest.PinterestProduct.md#getbrand)() | Returns the Pinterest brand of the product. |
| [getColor](dw.extensions.pinterest.PinterestProduct.md#getcolor)() | Returns the Pinterest color value label of the product. |
| [getColorHex](dw.extensions.pinterest.PinterestProduct.md#getcolorhex)() | Returns the Pinterest color hex value of the product. |
| [getColorImage](dw.extensions.pinterest.PinterestProduct.md#getcolorimage)() | Returns the URL of the image to show in Pinterest for the product color (swatch). |
| [getCondition](dw.extensions.pinterest.PinterestProduct.md#getcondition)() | Returns the condition of the Pinterest product. |
| [getDescription](dw.extensions.pinterest.PinterestProduct.md#getdescription)() | Returns the Pinterest description of the product. |
| [getGoogleProductCategory](dw.extensions.pinterest.PinterestProduct.md#getgoogleproductcategory)() | Returns the category of this product in the Google category taxonomy. |
| [getGtin](dw.extensions.pinterest.PinterestProduct.md#getgtin)() | Returns the Pinterest GTIN of the product. |
| [getID](dw.extensions.pinterest.PinterestProduct.md#getid)() | Returns the ID of the Pinterest product. |
| [getImageLinks](dw.extensions.pinterest.PinterestProduct.md#getimagelinks)() | Returns a list containing the URLs of the image to show in Pinterest for the product. |
| [getItemGroupID](dw.extensions.pinterest.PinterestProduct.md#getitemgroupid)() | Returns the ID of the Pinterest item group for the product, that is, its master product. |
| [getItemGroupLink](dw.extensions.pinterest.PinterestProduct.md#getitemgrouplink)() | Returns the URL of the Pinterest item group for the product, that is, the link to its master product in the  Demandware storefront. |
| [getLink](dw.extensions.pinterest.PinterestProduct.md#getlink)() | Returns the URL of the Demandware storefront link to the product. |
| [getMaxPrice](dw.extensions.pinterest.PinterestProduct.md#getmaxprice)() | Returns the maximum price to show in Pinterest for the product. |
| [getMinPrice](dw.extensions.pinterest.PinterestProduct.md#getminprice)() | Returns the minimum price to show in Pinterest for the product. |
| [getPrice](dw.extensions.pinterest.PinterestProduct.md#getprice)() | Returns the price to show in Pinterest for the product. |
| [getProductCategory](dw.extensions.pinterest.PinterestProduct.md#getproductcategory)() | Returns the Pinterest category path of the product. |
| [getReturnPolicy](dw.extensions.pinterest.PinterestProduct.md#getreturnpolicy)() | Returns the Pinterest return policy of the product. |
| [getSize](dw.extensions.pinterest.PinterestProduct.md#getsize)() | Returns the Pinterest size value label of the product. |
| [getTitle](dw.extensions.pinterest.PinterestProduct.md#gettitle)() | Returns the Pinterest title of the product. |
| [setAvailability](dw.extensions.pinterest.PinterestProduct.md#setavailabilitystring)([String](TopLevel.String.md)) | Sets the availability of the Pinterest product. |
| [setBrand](dw.extensions.pinterest.PinterestProduct.md#setbrandstring)([String](TopLevel.String.md)) | Sets the Pinterest brand of the product. |
| [setColor](dw.extensions.pinterest.PinterestProduct.md#setcolorstring)([String](TopLevel.String.md)) | Sets the Pinterest color value label of the product. |
| [setColorHex](dw.extensions.pinterest.PinterestProduct.md#setcolorhexstring)([String](TopLevel.String.md)) | Sets the Pinterest color hex value of the product. |
| [setColorImage](dw.extensions.pinterest.PinterestProduct.md#setcolorimageurl)([URL](dw.web.URL.md)) | Sets the URL of the image to show in Pinterest for the product color (swatch). |
| [setCondition](dw.extensions.pinterest.PinterestProduct.md#setconditionstring)([String](TopLevel.String.md)) | Sets the condition of the Pinterest product. |
| [setDescription](dw.extensions.pinterest.PinterestProduct.md#setdescriptionstring)([String](TopLevel.String.md)) | Sets the Pinterest description of the product. |
| [setGoogleProductCategory](dw.extensions.pinterest.PinterestProduct.md#setgoogleproductcategorystring)([String](TopLevel.String.md)) | Sets the category of this product in the Google category taxonomy. |
| [setGtin](dw.extensions.pinterest.PinterestProduct.md#setgtinstring)([String](TopLevel.String.md)) | Sets the Pinterest GTIN of the product. |
| [setImageLinks](dw.extensions.pinterest.PinterestProduct.md#setimagelinkslist)([List](dw.util.List.md)) | Sets the list of URLs of images to show in Pinterest for the product. |
| [setItemGroupID](dw.extensions.pinterest.PinterestProduct.md#setitemgroupidstring)([String](TopLevel.String.md)) | Sets the ID of the Pinterest item group for the product, that is, its master product. |
| [setItemGroupLink](dw.extensions.pinterest.PinterestProduct.md#setitemgrouplinkurl)([URL](dw.web.URL.md)) | Sets the URL of the Pinterest item group for the product, that is, the link to its master product in the  Demandware storefront. |
| [setLink](dw.extensions.pinterest.PinterestProduct.md#setlinkurl)([URL](dw.web.URL.md)) | Sets the URL of the Demandware storefront link to the product. |
| [setMaxPrice](dw.extensions.pinterest.PinterestProduct.md#setmaxpricemoney)([Money](dw.value.Money.md)) | Sets the maximum price to show in Pinterest for the product. |
| [setMinPrice](dw.extensions.pinterest.PinterestProduct.md#setminpricemoney)([Money](dw.value.Money.md)) | Sets the minimum price to show in Pinterest for the product. |
| [setPrice](dw.extensions.pinterest.PinterestProduct.md#setpricemoney)([Money](dw.value.Money.md)) | Sets the price to show in Pinterest for the product. |
| [setProductCategory](dw.extensions.pinterest.PinterestProduct.md#setproductcategorystring)([String](TopLevel.String.md)) | Sets the Pinterest category path of the product. |
| [setReturnPolicy](dw.extensions.pinterest.PinterestProduct.md#setreturnpolicystring)([String](TopLevel.String.md)) | Sets the Pinterest return policy of the product. |
| [setSize](dw.extensions.pinterest.PinterestProduct.md#setsizestring)([String](TopLevel.String.md)) | Sets the Pinterest size value label of the product. |
| [setTitle](dw.extensions.pinterest.PinterestProduct.md#settitlestring)([String](TopLevel.String.md)) | Sets the Pinterest title of the product. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### AVAILABILITY_IN_STOCK

- AVAILABILITY_IN_STOCK: [String](TopLevel.String.md) = "in stock"
  - : Indicates that the product is in stock.


---

### AVAILABILITY_OUT_OF_STOCK

- AVAILABILITY_OUT_OF_STOCK: [String](TopLevel.String.md) = "out of stock"
  - : Indicates that the product is not in stock.


---

### AVAILABILITY_PREORDER

- AVAILABILITY_PREORDER: [String](TopLevel.String.md) = "preorder"
  - : Indicates that the product is availabile in preorder.


---

### CONDITION_NEW

- CONDITION_NEW: [String](TopLevel.String.md) = "new"
  - : Indicates that the product has never been used.


---

### CONDITION_REFURBISHED

- CONDITION_REFURBISHED: [String](TopLevel.String.md) = "refurbished"
  - : Indicates that the product has been used but refurbished.


---

### CONDITION_USED

- CONDITION_USED: [String](TopLevel.String.md) = "used"
  - : Indicates that the product has been used.


---

## Property Details

### ID
- ID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the ID of the Pinterest product. This is the same as the ID of the Demandware product.


---

### availability
- availability: [String](TopLevel.String.md)
  - : Returns the availability of the Pinterest product. Possible values are
      [AVAILABILITY_IN_STOCK](dw.extensions.pinterest.PinterestProduct.md#availability_in_stock) or
      [AVAILABILITY_OUT_OF_STOCK](dw.extensions.pinterest.PinterestProduct.md#availability_out_of_stock).



---

### brand
- brand: [String](TopLevel.String.md)
  - : Returns the Pinterest brand of the product.


---

### color
- color: [String](TopLevel.String.md)
  - : Returns the Pinterest color value label of the product.


---

### colorHex
- colorHex: [String](TopLevel.String.md)
  - : Returns the Pinterest color hex value of the product.


---

### colorImage
- colorImage: [URL](dw.web.URL.md)
  - : Returns the URL of the image to show in Pinterest for the product color (swatch).


---

### condition
- condition: [String](TopLevel.String.md)
  - : Returns the condition of the Pinterest product. Possible values are
      [CONDITION_NEW](dw.extensions.pinterest.PinterestProduct.md#condition_new),
      [CONDITION_REFURBISHED](dw.extensions.pinterest.PinterestProduct.md#condition_refurbished), or
      [CONDITION_USED](dw.extensions.pinterest.PinterestProduct.md#condition_used).



---

### description
- description: [String](TopLevel.String.md)
  - : Returns the Pinterest description of the product.


---

### googleProductCategory
- googleProductCategory: [String](TopLevel.String.md)
  - : Returns the category of this product in the Google category taxonomy.


---

### gtin
- gtin: [String](TopLevel.String.md)
  - : Returns the Pinterest GTIN of the product.


---

### imageLinks
- imageLinks: [List](dw.util.List.md)
  - : Returns a list containing the URLs of the image to show in Pinterest for the product.


---

### itemGroupID
- itemGroupID: [String](TopLevel.String.md)
  - : Returns the ID of the Pinterest item group for the product, that is, its master product.


---

### itemGroupLink
- itemGroupLink: [URL](dw.web.URL.md)
  - : Returns the URL of the Pinterest item group for the product, that is, the link to its master product in the
      Demandware storefront.



---

### link
- link: [URL](dw.web.URL.md)
  - : Returns the URL of the Demandware storefront link to the product.


---

### maxPrice
- maxPrice: [Money](dw.value.Money.md)
  - : Returns the maximum price to show in Pinterest for the product.


---

### minPrice
- minPrice: [Money](dw.value.Money.md)
  - : Returns the minimum price to show in Pinterest for the product.


---

### price
- price: [Money](dw.value.Money.md)
  - : Returns the price to show in Pinterest for the product.


---

### productCategory
- productCategory: [String](TopLevel.String.md)
  - : Returns the Pinterest category path of the product.


---

### returnPolicy
- returnPolicy: [String](TopLevel.String.md)
  - : Returns the Pinterest return policy of the product.


---

### size
- size: [String](TopLevel.String.md)
  - : Returns the Pinterest size value label of the product.


---

### title
- title: [String](TopLevel.String.md)
  - : Returns the Pinterest title of the product.


---

## Method Details

### getAvailability()
- getAvailability(): [String](TopLevel.String.md)
  - : Returns the availability of the Pinterest product. Possible values are
      [AVAILABILITY_IN_STOCK](dw.extensions.pinterest.PinterestProduct.md#availability_in_stock) or
      [AVAILABILITY_OUT_OF_STOCK](dw.extensions.pinterest.PinterestProduct.md#availability_out_of_stock).



---

### getBrand()
- getBrand(): [String](TopLevel.String.md)
  - : Returns the Pinterest brand of the product.


---

### getColor()
- getColor(): [String](TopLevel.String.md)
  - : Returns the Pinterest color value label of the product.


---

### getColorHex()
- getColorHex(): [String](TopLevel.String.md)
  - : Returns the Pinterest color hex value of the product.


---

### getColorImage()
- getColorImage(): [URL](dw.web.URL.md)
  - : Returns the URL of the image to show in Pinterest for the product color (swatch).


---

### getCondition()
- getCondition(): [String](TopLevel.String.md)
  - : Returns the condition of the Pinterest product. Possible values are
      [CONDITION_NEW](dw.extensions.pinterest.PinterestProduct.md#condition_new),
      [CONDITION_REFURBISHED](dw.extensions.pinterest.PinterestProduct.md#condition_refurbished), or
      [CONDITION_USED](dw.extensions.pinterest.PinterestProduct.md#condition_used).



---

### getDescription()
- getDescription(): [String](TopLevel.String.md)
  - : Returns the Pinterest description of the product.


---

### getGoogleProductCategory()
- getGoogleProductCategory(): [String](TopLevel.String.md)
  - : Returns the category of this product in the Google category taxonomy.


---

### getGtin()
- getGtin(): [String](TopLevel.String.md)
  - : Returns the Pinterest GTIN of the product.


---

### getID()
- getID(): [String](TopLevel.String.md)
  - : Returns the ID of the Pinterest product. This is the same as the ID of the Demandware product.

    **Returns:**
    - product ID


---

### getImageLinks()
- getImageLinks(): [List](dw.util.List.md)
  - : Returns a list containing the URLs of the image to show in Pinterest for the product.


---

### getItemGroupID()
- getItemGroupID(): [String](TopLevel.String.md)
  - : Returns the ID of the Pinterest item group for the product, that is, its master product.


---

### getItemGroupLink()
- getItemGroupLink(): [URL](dw.web.URL.md)
  - : Returns the URL of the Pinterest item group for the product, that is, the link to its master product in the
      Demandware storefront.



---

### getLink()
- getLink(): [URL](dw.web.URL.md)
  - : Returns the URL of the Demandware storefront link to the product.


---

### getMaxPrice()
- getMaxPrice(): [Money](dw.value.Money.md)
  - : Returns the maximum price to show in Pinterest for the product.


---

### getMinPrice()
- getMinPrice(): [Money](dw.value.Money.md)
  - : Returns the minimum price to show in Pinterest for the product.


---

### getPrice()
- getPrice(): [Money](dw.value.Money.md)
  - : Returns the price to show in Pinterest for the product.


---

### getProductCategory()
- getProductCategory(): [String](TopLevel.String.md)
  - : Returns the Pinterest category path of the product.


---

### getReturnPolicy()
- getReturnPolicy(): [String](TopLevel.String.md)
  - : Returns the Pinterest return policy of the product.


---

### getSize()
- getSize(): [String](TopLevel.String.md)
  - : Returns the Pinterest size value label of the product.


---

### getTitle()
- getTitle(): [String](TopLevel.String.md)
  - : Returns the Pinterest title of the product.


---

### setAvailability(String)
- setAvailability(availability: [String](TopLevel.String.md)): void
  - : Sets the availability of the Pinterest product. Possible values are
      [AVAILABILITY_IN_STOCK](dw.extensions.pinterest.PinterestProduct.md#availability_in_stock) or
      [AVAILABILITY_OUT_OF_STOCK](dw.extensions.pinterest.PinterestProduct.md#availability_out_of_stock).


    **Parameters:**
    - availability - the availability status to set for this product


---

### setBrand(String)
- setBrand(brand: [String](TopLevel.String.md)): void
  - : Sets the Pinterest brand of the product.

    **Parameters:**
    - brand - Pinterest brand


---

### setColor(String)
- setColor(color: [String](TopLevel.String.md)): void
  - : Sets the Pinterest color value label of the product.

    **Parameters:**
    - color - Pinterest color value label


---

### setColorHex(String)
- setColorHex(colorHex: [String](TopLevel.String.md)): void
  - : Sets the Pinterest color hex value of the product.

    **Parameters:**
    - colorHex - Pinterest color hex value


---

### setColorImage(URL)
- setColorImage(colorImage: [URL](dw.web.URL.md)): void
  - : Sets the URL of the image to show in Pinterest for the product color (swatch).

    **Parameters:**
    - colorImage - link to Pinterest color image


---

### setCondition(String)
- setCondition(condition: [String](TopLevel.String.md)): void
  - : Sets the condition of the Pinterest product. Possible values are
      [CONDITION_NEW](dw.extensions.pinterest.PinterestProduct.md#condition_new),
      [CONDITION_REFURBISHED](dw.extensions.pinterest.PinterestProduct.md#condition_refurbished), or
      [CONDITION_USED](dw.extensions.pinterest.PinterestProduct.md#condition_used).


    **Parameters:**
    - condition - the condition status to set for this product


---

### setDescription(String)
- setDescription(description: [String](TopLevel.String.md)): void
  - : Sets the Pinterest description of the product.

    **Parameters:**
    - description - Pinterest description


---

### setGoogleProductCategory(String)
- setGoogleProductCategory(googleProductCategory: [String](TopLevel.String.md)): void
  - : Sets the category of this product in the Google category taxonomy.

    **Parameters:**
    - googleProductCategory - Google product category


---

### setGtin(String)
- setGtin(gtin: [String](TopLevel.String.md)): void
  - : Sets the Pinterest GTIN of the product.

    **Parameters:**
    - gtin - Pinterest GTIN


---

### setImageLinks(List)
- setImageLinks(imageLinks: [List](dw.util.List.md)): void
  - : Sets the list of URLs of images to show in Pinterest for the product.

    **Parameters:**
    - imageLinks - links to the product images


---

### setItemGroupID(String)
- setItemGroupID(itemGroupID: [String](TopLevel.String.md)): void
  - : Sets the ID of the Pinterest item group for the product, that is, its master product.

    **Parameters:**
    - itemGroupID - ID of Pinterest item group


---

### setItemGroupLink(URL)
- setItemGroupLink(itemGroupLink: [URL](dw.web.URL.md)): void
  - : Sets the URL of the Pinterest item group for the product, that is, the link to its master product in the
      Demandware storefront.


    **Parameters:**
    - itemGroupLink - link to the Pinterest item group


---

### setLink(URL)
- setLink(link: [URL](dw.web.URL.md)): void
  - : Sets the URL of the Demandware storefront link to the product.

    **Parameters:**
    - link - Demandware storefront link to the product


---

### setMaxPrice(Money)
- setMaxPrice(maxPrice: [Money](dw.value.Money.md)): void
  - : Sets the maximum price to show in Pinterest for the product.

    **Parameters:**
    - maxPrice - Pinterest maximum price


---

### setMinPrice(Money)
- setMinPrice(minPrice: [Money](dw.value.Money.md)): void
  - : Sets the minimum price to show in Pinterest for the product.

    **Parameters:**
    - minPrice - Pinterest minimum price


---

### setPrice(Money)
- setPrice(price: [Money](dw.value.Money.md)): void
  - : Sets the price to show in Pinterest for the product.

    **Parameters:**
    - price - Pinterest price


---

### setProductCategory(String)
- setProductCategory(productCategory: [String](TopLevel.String.md)): void
  - : Sets the Pinterest category path of the product.

    **Parameters:**
    - productCategory - Pinterest category path


---

### setReturnPolicy(String)
- setReturnPolicy(returnPolicy: [String](TopLevel.String.md)): void
  - : Sets the Pinterest return policy of the product.

    **Parameters:**
    - returnPolicy - Pinterest return policy


---

### setSize(String)
- setSize(size: [String](TopLevel.String.md)): void
  - : Sets the Pinterest size value label of the product.

    **Parameters:**
    - size - Pinterest size value label


---

### setTitle(String)
- setTitle(title: [String](TopLevel.String.md)): void
  - : Sets the Pinterest title of the product.

    **Parameters:**
    - title - Pinterest title


---

<!-- prettier-ignore-end -->
