<!-- prettier-ignore-start -->
# Class Variant

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)
      - [dw.catalog.Product](dw.catalog.Product.md)
        - [dw.catalog.Variant](dw.catalog.Variant.md)

Represents a variant of a product variation. If the variant does not define an own value,
the value is retrieved by fallback from variation groups (sorted by their position) or the
variation master.



## Property Summary

| Property | Description |
| --- | --- |
| [EAN](#ean): [String](TopLevel.String.md) `(read-only)` | Returns the EAN of the product variant. |
| [UPC](#upc): [String](TopLevel.String.md) `(read-only)` | Returns the UPC of the product variant. |
| [allProductLinks](#allproductlinks): [Collection](dw.util.Collection.md) `(read-only)` | Returns all product links of the product variant. |
| [brand](#brand): [String](TopLevel.String.md) `(read-only)` | Returns the brand of the product variant. |
| [classificationCategory](#classificationcategory): [Category](dw.catalog.Category.md) `(read-only)` | Returns the classification category of the product variant. |
| [custom](#custom): [CustomAttributes](dw.object.CustomAttributes.md) `(read-only)` | Returns the custom attributes of the variant. |
| [image](#image): [MediaFile](dw.content.MediaFile.md) `(read-only)` | Returns the image of the product variant. |
| [longDescription](#longdescription): [MarkupText](dw.content.MarkupText.md) `(read-only)` | Returns the long description of the product variant. |
| [manufacturerName](#manufacturername): [String](TopLevel.String.md) `(read-only)` | Returns the manufacturer name of the product variant. |
| [manufacturerSKU](#manufacturersku): [String](TopLevel.String.md) `(read-only)` | Returns the manufacturer sku of the product variant. |
| [masterProduct](#masterproduct): [Product](dw.catalog.Product.md) `(read-only)` | Returns the ProductMaster for this mastered product. |
| [name](#name): [String](TopLevel.String.md) `(read-only)` | Returns the name of the product variant. |
| [onlineFrom](#onlinefrom): [Date](TopLevel.Date.md) `(read-only)` | Returns the onlineFrom date of the product variant. |
| [onlineTo](#onlineto): [Date](TopLevel.Date.md) `(read-only)` | Returns the onlineTo date of the product variant. |
| [optionProduct](#optionproduct): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns 'true' if the variant has any options, otherwise 'false'. |
| [pageDescription](#pagedescription): [String](TopLevel.String.md) `(read-only)` | Returns the pageDescription of the product variant. |
| [pageKeywords](#pagekeywords): [String](TopLevel.String.md) `(read-only)` | Returns the pageKeywords of the product variant. |
| [pageTitle](#pagetitle): [String](TopLevel.String.md) `(read-only)` | Returns the pageTitle of the product variant. |
| [pageURL](#pageurl): [String](TopLevel.String.md) `(read-only)` | Returns the pageURL of the product variant. |
| [productLinks](#productlinks): [Collection](dw.util.Collection.md) `(read-only)` | Returns all product links of the product variant for which the target  product is assigned to the current site catalog. |
| [shortDescription](#shortdescription): [MarkupText](dw.content.MarkupText.md) `(read-only)` | Returns the short description of the product variant. |
| [taxClassID](#taxclassid): [String](TopLevel.String.md) `(read-only)` | Returns the tax class id of the product variant. |
| [template](#template): [String](TopLevel.String.md) `(read-only)` | Returns the rendering template name of the product variant. |
| [thumbnail](#thumbnail): [MediaFile](dw.content.MediaFile.md) `(read-only)` | Returns the thumbnail image of the product variant. |
| [unit](#unit): [String](TopLevel.String.md) `(read-only)` | Returns the sales unit of the product variant as defined by the  master product. |
| [unitQuantity](#unitquantity): [Quantity](dw.value.Quantity.md) `(read-only)` | Returns the unitQuantity of the product variant as defined by the  master product. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getAllProductLinks](dw.catalog.Variant.md#getallproductlinks)() | Returns all product links of the product variant. |
| [getAllProductLinks](dw.catalog.Variant.md#getallproductlinksnumber)([Number](TopLevel.Number.md)) | Returns all product links of the specified type of the product variant. |
| [getBrand](dw.catalog.Variant.md#getbrand)() | Returns the brand of the product variant. |
| [getClassificationCategory](dw.catalog.Variant.md#getclassificationcategory)() | Returns the classification category of the product variant. |
| [getCustom](dw.catalog.Variant.md#getcustom)() | Returns the custom attributes of the variant. |
| [getEAN](dw.catalog.Variant.md#getean)() | Returns the EAN of the product variant. |
| [getImage](dw.catalog.Variant.md#getimage)() | Returns the image of the product variant. |
| [getLongDescription](dw.catalog.Variant.md#getlongdescription)() | Returns the long description of the product variant. |
| [getManufacturerName](dw.catalog.Variant.md#getmanufacturername)() | Returns the manufacturer name of the product variant. |
| [getManufacturerSKU](dw.catalog.Variant.md#getmanufacturersku)() | Returns the manufacturer sku of the product variant. |
| [getMasterProduct](dw.catalog.Variant.md#getmasterproduct)() | Returns the ProductMaster for this mastered product. |
| [getName](dw.catalog.Variant.md#getname)() | Returns the name of the product variant. |
| [getOnlineFrom](dw.catalog.Variant.md#getonlinefrom)() | Returns the onlineFrom date of the product variant. |
| [getOnlineTo](dw.catalog.Variant.md#getonlineto)() | Returns the onlineTo date of the product variant. |
| [getPageDescription](dw.catalog.Variant.md#getpagedescription)() | Returns the pageDescription of the product variant. |
| [getPageKeywords](dw.catalog.Variant.md#getpagekeywords)() | Returns the pageKeywords of the product variant. |
| [getPageTitle](dw.catalog.Variant.md#getpagetitle)() | Returns the pageTitle of the product variant. |
| [getPageURL](dw.catalog.Variant.md#getpageurl)() | Returns the pageURL of the product variant. |
| [getProductLinks](dw.catalog.Variant.md#getproductlinks)() | Returns all product links of the product variant for which the target  product is assigned to the current site catalog. |
| [getProductLinks](dw.catalog.Variant.md#getproductlinksnumber)([Number](TopLevel.Number.md)) | Returns all product links of the specified type of the product variant  for which the target product is assigned to the current site catalog. |
| [getRecommendations](dw.catalog.Variant.md#getrecommendationsnumber)([Number](TopLevel.Number.md)) | Retrieve the sorted collection of recommendations of the specified type  for this product variant. |
| [getShortDescription](dw.catalog.Variant.md#getshortdescription)() | Returns the short description of the product variant. |
| [getTaxClassID](dw.catalog.Variant.md#gettaxclassid)() | Returns the tax class id of the product variant. |
| [getTemplate](dw.catalog.Variant.md#gettemplate)() | Returns the rendering template name of the product variant. |
| [getThumbnail](dw.catalog.Variant.md#getthumbnail)() | Returns the thumbnail image of the product variant. |
| [getUPC](dw.catalog.Variant.md#getupc)() | Returns the UPC of the product variant. |
| [getUnit](dw.catalog.Variant.md#getunit)() | Returns the sales unit of the product variant as defined by the  master product. |
| [getUnitQuantity](dw.catalog.Variant.md#getunitquantity)() | Returns the unitQuantity of the product variant as defined by the  master product. |
| [isOptionProduct](dw.catalog.Variant.md#isoptionproduct)() | Returns 'true' if the variant has any options, otherwise 'false'. |

### Methods inherited from class Product

[assignedToCategory](dw.catalog.Product.md#assignedtocategorycategory), [getActiveData](dw.catalog.Product.md#getactivedata), [getAllCategories](dw.catalog.Product.md#getallcategories), [getAllCategoryAssignments](dw.catalog.Product.md#getallcategoryassignments), [getAllIncomingProductLinks](dw.catalog.Product.md#getallincomingproductlinks), [getAllIncomingProductLinks](dw.catalog.Product.md#getallincomingproductlinksnumber), [getAllProductLinks](dw.catalog.Product.md#getallproductlinks), [getAllProductLinks](dw.catalog.Product.md#getallproductlinksnumber), [getAllRecommendations](dw.catalog.Product.md#getallrecommendationscatalog), [getAllRecommendations](dw.catalog.Product.md#getallrecommendationscatalog-number), [getAttributeModel](dw.catalog.Product.md#getattributemodel), [getAvailabilityModel](dw.catalog.Product.md#getavailabilitymodel), [getAvailabilityModel](dw.catalog.Product.md#getavailabilitymodelproductinventorylist), [getAvailableFlag](dw.catalog.Product.md#getavailableflag), [getBrand](dw.catalog.Product.md#getbrand), [getBundledProductQuantity](dw.catalog.Product.md#getbundledproductquantityproduct), [getBundledProducts](dw.catalog.Product.md#getbundledproducts), [getBundles](dw.catalog.Product.md#getbundles), [getCategories](dw.catalog.Product.md#getcategories), [getCategoryAssignment](dw.catalog.Product.md#getcategoryassignmentcategory), [getCategoryAssignments](dw.catalog.Product.md#getcategoryassignments), [getClassificationCategory](dw.catalog.Product.md#getclassificationcategory), [getEAN](dw.catalog.Product.md#getean), [getID](dw.catalog.Product.md#getid), [getImage](dw.catalog.Product.md#getimage), [getImage](dw.catalog.Product.md#getimagestring), [getImage](dw.catalog.Product.md#getimagestring-number), [getImages](dw.catalog.Product.md#getimagesstring), [getIncomingProductLinks](dw.catalog.Product.md#getincomingproductlinks), [getIncomingProductLinks](dw.catalog.Product.md#getincomingproductlinksnumber), [getLongDescription](dw.catalog.Product.md#getlongdescription), [getManufacturerName](dw.catalog.Product.md#getmanufacturername), [getManufacturerSKU](dw.catalog.Product.md#getmanufacturersku), [getMinOrderQuantity](dw.catalog.Product.md#getminorderquantity), [getName](dw.catalog.Product.md#getname), [getOnlineCategories](dw.catalog.Product.md#getonlinecategories), [getOnlineFlag](dw.catalog.Product.md#getonlineflag), [getOnlineFrom](dw.catalog.Product.md#getonlinefrom), [getOnlineTo](dw.catalog.Product.md#getonlineto), [getOptionModel](dw.catalog.Product.md#getoptionmodel), [getOrderableRecommendations](dw.catalog.Product.md#getorderablerecommendations), [getOrderableRecommendations](dw.catalog.Product.md#getorderablerecommendationsnumber), [getPageDescription](dw.catalog.Product.md#getpagedescription), [getPageKeywords](dw.catalog.Product.md#getpagekeywords), [getPageMetaTag](dw.catalog.Product.md#getpagemetatagstring), [getPageMetaTags](dw.catalog.Product.md#getpagemetatags), [getPageTitle](dw.catalog.Product.md#getpagetitle), [getPageURL](dw.catalog.Product.md#getpageurl), [getPriceModel](dw.catalog.Product.md#getpricemodel), [getPriceModel](dw.catalog.Product.md#getpricemodelproductoptionmodel), [getPrimaryCategory](dw.catalog.Product.md#getprimarycategory), [getPrimaryCategoryAssignment](dw.catalog.Product.md#getprimarycategoryassignment), [getProductLinks](dw.catalog.Product.md#getproductlinks), [getProductLinks](dw.catalog.Product.md#getproductlinksnumber), [getProductSetProducts](dw.catalog.Product.md#getproductsetproducts), [getProductSets](dw.catalog.Product.md#getproductsets), [getRecommendations](dw.catalog.Product.md#getrecommendations), [getRecommendations](dw.catalog.Product.md#getrecommendationsnumber), [getSearchPlacement](dw.catalog.Product.md#getsearchplacement), [getSearchRank](dw.catalog.Product.md#getsearchrank), [getSearchableFlag](dw.catalog.Product.md#getsearchableflag), [getSearchableIfUnavailableFlag](dw.catalog.Product.md#getsearchableifunavailableflag), [getShortDescription](dw.catalog.Product.md#getshortdescription), [getSiteMapChangeFrequency](dw.catalog.Product.md#getsitemapchangefrequency), [getSiteMapIncluded](dw.catalog.Product.md#getsitemapincluded), [getSiteMapPriority](dw.catalog.Product.md#getsitemappriority), [getStepQuantity](dw.catalog.Product.md#getstepquantity), [getStoreReceiptName](dw.catalog.Product.md#getstorereceiptname), [getStoreTaxClass](dw.catalog.Product.md#getstoretaxclass), [getTaxClassID](dw.catalog.Product.md#gettaxclassid), [getTemplate](dw.catalog.Product.md#gettemplate), [getThumbnail](dw.catalog.Product.md#getthumbnail), [getUPC](dw.catalog.Product.md#getupc), [getUnit](dw.catalog.Product.md#getunit), [getUnitQuantity](dw.catalog.Product.md#getunitquantity), [getVariants](dw.catalog.Product.md#getvariants), [getVariationGroups](dw.catalog.Product.md#getvariationgroups), [getVariationModel](dw.catalog.Product.md#getvariationmodel), [includedInBundle](dw.catalog.Product.md#includedinbundleproduct), [isAssignedToCategory](dw.catalog.Product.md#isassignedtocategorycategory), [isAssignedToSiteCatalog](dw.catalog.Product.md#isassignedtositecatalog), [isAvailable](dw.catalog.Product.md#isavailable), [isBundle](dw.catalog.Product.md#isbundle), [isBundled](dw.catalog.Product.md#isbundled), [isCategorized](dw.catalog.Product.md#iscategorized), [isFacebookEnabled](dw.catalog.Product.md#isfacebookenabled), [isMaster](dw.catalog.Product.md#ismaster), [isOnline](dw.catalog.Product.md#isonline), [isOptionProduct](dw.catalog.Product.md#isoptionproduct), [isPinterestEnabled](dw.catalog.Product.md#ispinterestenabled), [isProduct](dw.catalog.Product.md#isproduct), [isProductSet](dw.catalog.Product.md#isproductset), [isProductSetProduct](dw.catalog.Product.md#isproductsetproduct), [isRetailSet](dw.catalog.Product.md#isretailset), [isSearchable](dw.catalog.Product.md#issearchable), [isSiteProduct](dw.catalog.Product.md#issiteproduct), [isVariant](dw.catalog.Product.md#isvariant), [isVariationGroup](dw.catalog.Product.md#isvariationgroup), [setAvailableFlag](dw.catalog.Product.md#setavailableflagboolean), [setOnlineFlag](dw.catalog.Product.md#setonlineflagboolean---variant-1), [setOnlineFlag](dw.catalog.Product.md#setonlineflagboolean---variant-2), [setSearchPlacement](dw.catalog.Product.md#setsearchplacementnumber---variant-1), [setSearchPlacement](dw.catalog.Product.md#setsearchplacementnumber---variant-2), [setSearchRank](dw.catalog.Product.md#setsearchranknumber---variant-1), [setSearchRank](dw.catalog.Product.md#setsearchranknumber---variant-2), [setSearchableFlag](dw.catalog.Product.md#setsearchableflagboolean---variant-1), [setSearchableFlag](dw.catalog.Product.md#setsearchableflagboolean---variant-2)
### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### EAN
- EAN: [String](TopLevel.String.md) `(read-only)`
  - : Returns the EAN of the product variant. 
      
      
      If the variant does not define an own value for 'EAN', the value is retrieved
      from the assigned variation groups, sorted by their position.
      
      If none of the variation groups define a value for 'EAN', the value of
      the master product is returned.



---

### UPC
- UPC: [String](TopLevel.String.md) `(read-only)`
  - : Returns the UPC of the product variant. 
      
      
      If the variant does not define an own value for 'UPC', the value is retrieved
      from the assigned variation groups, sorted by their position.
      
      If none of the variation groups define a value for 'UPC', the value of
      the master product is returned.



---

### allProductLinks
- allProductLinks: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns all product links of the product variant. 
      
      
      If the variant does not define any product links, the product links are retrieved
      from the assigned variation groups, sorted by their position.
      
      If none of the variation groups define any product links, the product links are
      retrieved from the master product.



---

### brand
- brand: [String](TopLevel.String.md) `(read-only)`
  - : Returns the brand of the product variant. 
      
      
      If the variant does not define an own value for 'brand', the value is retrieved
      from the assigned variation groups, sorted by their position.
      
      If none of the variation groups define a value for 'brand', the value of
      the master product is returned.



---

### classificationCategory
- classificationCategory: [Category](dw.catalog.Category.md) `(read-only)`
  - : Returns the classification category of the product variant. 
      
      
      **Please note** that the classification category is always inherited
      from the master and cannot be overridden by the variant.



---

### custom
- custom: [CustomAttributes](dw.object.CustomAttributes.md) `(read-only)`
  - : Returns the custom attributes of the variant. 
      
      
      Custom attributes are inherited from the master product and can
      be overridden by the variant.



---

### image
- image: [MediaFile](dw.content.MediaFile.md) `(read-only)`
  - : Returns the image of the product variant. 
      
      
      If the variant does not define an own value for 'image', the value is retrieved
      from the assigned variation groups, sorted by their position.
      
      If none of the variation groups define a value for 'image', the value of
      the master product is returned.



---

### longDescription
- longDescription: [MarkupText](dw.content.MarkupText.md) `(read-only)`
  - : Returns the long description of the product variant. 
      
      
      If the variant does not define an own value for 'longDescription', the value is retrieved
      from the assigned variation groups, sorted by their position.
      
      If none of the variation groups define a value for 'longDescription', the value of
      the master product is returned.



---

### manufacturerName
- manufacturerName: [String](TopLevel.String.md) `(read-only)`
  - : Returns the manufacturer name of the product variant. 
      
      
      If the variant does not define an own value for 'manufacturerName', the value is retrieved
      from the assigned variation groups, sorted by their position.
      
      If none of the variation groups define a value for 'manufacturerName', the value of
      the master product is returned.



---

### manufacturerSKU
- manufacturerSKU: [String](TopLevel.String.md) `(read-only)`
  - : Returns the manufacturer sku of the product variant. 
      
      
      If the variant does not define an own value for 'manufacturerSKU', the value is retrieved
      from the assigned variation groups, sorted by their position.
      
      If none of the variation groups define a value for 'manufacturerSKU', the value of
      the master product is returned.



---

### masterProduct
- masterProduct: [Product](dw.catalog.Product.md) `(read-only)`
  - : Returns the ProductMaster for this mastered product.


---

### name
- name: [String](TopLevel.String.md) `(read-only)`
  - : Returns the name of the product variant. 
      
      
      If the variant does not define an own value for 'name', the value is retrieved
      from the assigned variation groups, sorted by their position.
      
      If none of the variation groups define a value for 'name', the value of
      the master product is returned.



---

### onlineFrom
- onlineFrom: [Date](TopLevel.Date.md) `(read-only)`
  - : Returns the onlineFrom date of the product variant. 
      
      
      If the variant does not define an own value for 'onlineFrom', the value is retrieved
      from the assigned variation groups, sorted by their position.
      
      If none of the variation groups define a value for 'onlineFrom', the value of
      the master product is returned.



---

### onlineTo
- onlineTo: [Date](TopLevel.Date.md) `(read-only)`
  - : Returns the onlineTo date of the product variant. 
      
      
      If the variant does not define an own value for 'onlineTo', the value is retrieved
      from the assigned variation groups, sorted by their position.
      
      If none of the variation groups define a value for 'onlineTo', the value of
      the master product is returned.



---

### optionProduct
- optionProduct: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns 'true' if the variant has any options, otherwise 'false'.
      Method also returns 'true' if the variant has not any options,
      but the related variation groups (sorted by position) or
      master product has options.



---

### pageDescription
- pageDescription: [String](TopLevel.String.md) `(read-only)`
  - : Returns the pageDescription of the product variant. 
      
      
      If the variant does not define an own value for 'pageDescription', the value is retrieved
      from the assigned variation groups, sorted by their position.
      
      If none of the variation groups define a value for 'pageDescription', the value of
      the master product is returned.



---

### pageKeywords
- pageKeywords: [String](TopLevel.String.md) `(read-only)`
  - : Returns the pageKeywords of the product variant. 
      
      
      If the variant does not define an own value for 'pageKeywords', the value is retrieved
      from the assigned variation groups, sorted by their position.
      
      If none of the variation groups define a value for 'pageKeywords', the value of
      the master product is returned.



---

### pageTitle
- pageTitle: [String](TopLevel.String.md) `(read-only)`
  - : Returns the pageTitle of the product variant. 
      
      
      If the variant does not define an own value for 'pageTitle', the value is retrieved
      from the assigned variation groups, sorted by their position.
      
      If none of the variation groups define a value for 'pageTitle', the value of
      the master product is returned.



---

### pageURL
- pageURL: [String](TopLevel.String.md) `(read-only)`
  - : Returns the pageURL of the product variant. 
      
      
      If the variant does not define an own value for 'pageURL', the value is retrieved
      from the assigned variation groups, sorted by their position.
      
      If none of the variation groups define a value for 'pageURL', the value of
      the master product is returned.



---

### productLinks
- productLinks: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns all product links of the product variant for which the target
      product is assigned to the current site catalog. 
      
      
      If the variant does not define any product links, the product links are retrieved
      from the assigned variation groups, sorted by their position
      
      If none of the variation groups define any product links, the product links are retrieved
      from the master product.



---

### shortDescription
- shortDescription: [MarkupText](dw.content.MarkupText.md) `(read-only)`
  - : Returns the short description of the product variant. 
      
      
      If the variant does not define an own value for 'shortDescription', the value is retrieved
      from the assigned variation groups, sorted by their position.
      
      If none of the variation groups define a value for 'shortDescription', the value of
      the master product is returned.



---

### taxClassID
- taxClassID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the tax class id of the product variant. 
      
      
      If the variant does not define an own value for 'taxClassID', the value is retrieved
      from the assigned variation groups, sorted by their position.
      
      If none of the variation groups define a value for 'taxClassID', the value of
      the master product is returned.



---

### template
- template: [String](TopLevel.String.md) `(read-only)`
  - : Returns the rendering template name of the product variant. 
      
      
      If the variant does not define an own value for 'template', the value is retrieved
      from the assigned variation groups, sorted by their position.
      
      If none of the variation groups define a value for 'template', the value of
      the master product is returned.



---

### thumbnail
- thumbnail: [MediaFile](dw.content.MediaFile.md) `(read-only)`
  - : Returns the thumbnail image of the product variant. 
      
      
      If the variant does not define an own value for 'thumbnail', the value is retrieved
      from the assigned variation groups, sorted by their position.
      
      If none of the variation groups define a value for 'thumbnail', the value of
      the master product is returned.



---

### unit
- unit: [String](TopLevel.String.md) `(read-only)`
  - : Returns the sales unit of the product variant as defined by the
      master product. 
      
      
      If the variant does not define an own value for 'unit', the value is retrieved
      from the assigned variation groups, sorted by their position.
      
      If none of the variation groups define a value for 'unit', the value of
      the master product is returned.



---

### unitQuantity
- unitQuantity: [Quantity](dw.value.Quantity.md) `(read-only)`
  - : Returns the unitQuantity of the product variant as defined by the
      master product. 
      
      
      If the variant does not define an own value for 'unitQuantity', the value is retrieved
      from the assigned variation groups, sorted by their position.
      
      If none of the variation groups define a value for 'unitQuantity', the value of
      the master product is returned.



---

## Method Details

### getAllProductLinks()
- getAllProductLinks(): [Collection](dw.util.Collection.md)
  - : Returns all product links of the product variant. 
      
      
      If the variant does not define any product links, the product links are retrieved
      from the assigned variation groups, sorted by their position.
      
      If none of the variation groups define any product links, the product links are
      retrieved from the master product.


    **Returns:**
    - All product links of the variant, variation group or master


---

### getAllProductLinks(Number)
- getAllProductLinks(type: [Number](TopLevel.Number.md)): [Collection](dw.util.Collection.md)
  - : Returns all product links of the specified type of the product variant. 
      
      
      If the variant does not define any product links of the specified type,
      the product links are retrieved for the specified type from the assigned
      variation groups, sorted by their position.
      
      If none of the variation groups define any product links of the specified type,
      the product links are retrieved for the specified type from the master product.


    **Parameters:**
    - type - Type of the product link

    **Returns:**
    - Product links of specified type of the variant, variation group or master


---

### getBrand()
- getBrand(): [String](TopLevel.String.md)
  - : Returns the brand of the product variant. 
      
      
      If the variant does not define an own value for 'brand', the value is retrieved
      from the assigned variation groups, sorted by their position.
      
      If none of the variation groups define a value for 'brand', the value of
      the master product is returned.


    **Returns:**
    - The brand of the variant, variation group or master


---

### getClassificationCategory()
- getClassificationCategory(): [Category](dw.catalog.Category.md)
  - : Returns the classification category of the product variant. 
      
      
      **Please note** that the classification category is always inherited
      from the master and cannot be overridden by the variant.


    **Returns:**
    - The classification category as defined for the master product of the variant


---

### getCustom()
- getCustom(): [CustomAttributes](dw.object.CustomAttributes.md)
  - : Returns the custom attributes of the variant. 
      
      
      Custom attributes are inherited from the master product and can
      be overridden by the variant.


    **Returns:**
    - the custom attributes of the variant.


---

### getEAN()
- getEAN(): [String](TopLevel.String.md)
  - : Returns the EAN of the product variant. 
      
      
      If the variant does not define an own value for 'EAN', the value is retrieved
      from the assigned variation groups, sorted by their position.
      
      If none of the variation groups define a value for 'EAN', the value of
      the master product is returned.


    **Returns:**
    - The EAN of the variant, variation group or master


---

### getImage()
- getImage(): [MediaFile](dw.content.MediaFile.md)
  - : Returns the image of the product variant. 
      
      
      If the variant does not define an own value for 'image', the value is retrieved
      from the assigned variation groups, sorted by their position.
      
      If none of the variation groups define a value for 'image', the value of
      the master product is returned.


    **Returns:**
    - The image of the variant, variation group or master


---

### getLongDescription()
- getLongDescription(): [MarkupText](dw.content.MarkupText.md)
  - : Returns the long description of the product variant. 
      
      
      If the variant does not define an own value for 'longDescription', the value is retrieved
      from the assigned variation groups, sorted by their position.
      
      If none of the variation groups define a value for 'longDescription', the value of
      the master product is returned.


    **Returns:**
    - The long description of the variant, variation group or master


---

### getManufacturerName()
- getManufacturerName(): [String](TopLevel.String.md)
  - : Returns the manufacturer name of the product variant. 
      
      
      If the variant does not define an own value for 'manufacturerName', the value is retrieved
      from the assigned variation groups, sorted by their position.
      
      If none of the variation groups define a value for 'manufacturerName', the value of
      the master product is returned.


    **Returns:**
    - The manufacturer name of the variant, variation group or master


---

### getManufacturerSKU()
- getManufacturerSKU(): [String](TopLevel.String.md)
  - : Returns the manufacturer sku of the product variant. 
      
      
      If the variant does not define an own value for 'manufacturerSKU', the value is retrieved
      from the assigned variation groups, sorted by their position.
      
      If none of the variation groups define a value for 'manufacturerSKU', the value of
      the master product is returned.


    **Returns:**
    - The manufacturer sku of the variant, variation group or master


---

### getMasterProduct()
- getMasterProduct(): [Product](dw.catalog.Product.md)
  - : Returns the ProductMaster for this mastered product.

    **Returns:**
    - the ProductMaster of this mastered product


---

### getName()
- getName(): [String](TopLevel.String.md)
  - : Returns the name of the product variant. 
      
      
      If the variant does not define an own value for 'name', the value is retrieved
      from the assigned variation groups, sorted by their position.
      
      If none of the variation groups define a value for 'name', the value of
      the master product is returned.


    **Returns:**
    - The name of the variant, variation group or master


---

### getOnlineFrom()
- getOnlineFrom(): [Date](TopLevel.Date.md)
  - : Returns the onlineFrom date of the product variant. 
      
      
      If the variant does not define an own value for 'onlineFrom', the value is retrieved
      from the assigned variation groups, sorted by their position.
      
      If none of the variation groups define a value for 'onlineFrom', the value of
      the master product is returned.


    **Returns:**
    - The onlineFrom date of the variant, variation group or master


---

### getOnlineTo()
- getOnlineTo(): [Date](TopLevel.Date.md)
  - : Returns the onlineTo date of the product variant. 
      
      
      If the variant does not define an own value for 'onlineTo', the value is retrieved
      from the assigned variation groups, sorted by their position.
      
      If none of the variation groups define a value for 'onlineTo', the value of
      the master product is returned.


    **Returns:**
    - The onlineTo date of the variant, variation group or master


---

### getPageDescription()
- getPageDescription(): [String](TopLevel.String.md)
  - : Returns the pageDescription of the product variant. 
      
      
      If the variant does not define an own value for 'pageDescription', the value is retrieved
      from the assigned variation groups, sorted by their position.
      
      If none of the variation groups define a value for 'pageDescription', the value of
      the master product is returned.


    **Returns:**
    - The pageDescription of the variant, variation group or master


---

### getPageKeywords()
- getPageKeywords(): [String](TopLevel.String.md)
  - : Returns the pageKeywords of the product variant. 
      
      
      If the variant does not define an own value for 'pageKeywords', the value is retrieved
      from the assigned variation groups, sorted by their position.
      
      If none of the variation groups define a value for 'pageKeywords', the value of
      the master product is returned.


    **Returns:**
    - The pageKeywords of the variant, variation group or master


---

### getPageTitle()
- getPageTitle(): [String](TopLevel.String.md)
  - : Returns the pageTitle of the product variant. 
      
      
      If the variant does not define an own value for 'pageTitle', the value is retrieved
      from the assigned variation groups, sorted by their position.
      
      If none of the variation groups define a value for 'pageTitle', the value of
      the master product is returned.


    **Returns:**
    - The pageTitle of the variant, variation group or master


---

### getPageURL()
- getPageURL(): [String](TopLevel.String.md)
  - : Returns the pageURL of the product variant. 
      
      
      If the variant does not define an own value for 'pageURL', the value is retrieved
      from the assigned variation groups, sorted by their position.
      
      If none of the variation groups define a value for 'pageURL', the value of
      the master product is returned.


    **Returns:**
    - The pageURL of the variant, variation group or master


---

### getProductLinks()
- getProductLinks(): [Collection](dw.util.Collection.md)
  - : Returns all product links of the product variant for which the target
      product is assigned to the current site catalog. 
      
      
      If the variant does not define any product links, the product links are retrieved
      from the assigned variation groups, sorted by their position
      
      If none of the variation groups define any product links, the product links are retrieved
      from the master product.


    **Returns:**
    - Product links of the variant, variation group or master


---

### getProductLinks(Number)
- getProductLinks(type: [Number](TopLevel.Number.md)): [Collection](dw.util.Collection.md)
  - : Returns all product links of the specified type of the product variant
      for which the target product is assigned to the current site catalog. 
      
      
      If the variant does not define any product links of the specified type,
      the product links are retrieved for the specified type from the assigned
      variation groups, sorted by their position
      
      If none of the variation groups define any product links of the specified type,
      the product links are retrieved for the specified type from the master product.


    **Parameters:**
    - type - Type of the product link

    **Returns:**
    - Product links of specified type of the variant, variation group or master


---

### getRecommendations(Number)
- getRecommendations(type: [Number](TopLevel.Number.md)): [Collection](dw.util.Collection.md)
  - : Retrieve the sorted collection of recommendations of the specified type
      for this product variant.  The types (cross-sell, up-sell, etc) are
      enumerated in the `dw.catalog.Recommendation` class.  Only
      recommendations which are stored in the current site catalog are returned.
      Furthermore, a recommendation is only returned if the target of the
      recommendation is assigned to the current site catalog.
      
      
      
      If the variant does not define any recommendations, recommendations are
      retrieved from the assigned variation groups, sorted by their position.
      
      If none of the variation groups define any recommendations, the recommendations
      of the master are returned.


    **Parameters:**
    - type - the recommendation type

    **Returns:**
    - the sorted collection, never null but possibly empty.


---

### getShortDescription()
- getShortDescription(): [MarkupText](dw.content.MarkupText.md)
  - : Returns the short description of the product variant. 
      
      
      If the variant does not define an own value for 'shortDescription', the value is retrieved
      from the assigned variation groups, sorted by their position.
      
      If none of the variation groups define a value for 'shortDescription', the value of
      the master product is returned.


    **Returns:**
    - The short description of the variant, variation group or master


---

### getTaxClassID()
- getTaxClassID(): [String](TopLevel.String.md)
  - : Returns the tax class id of the product variant. 
      
      
      If the variant does not define an own value for 'taxClassID', the value is retrieved
      from the assigned variation groups, sorted by their position.
      
      If none of the variation groups define a value for 'taxClassID', the value of
      the master product is returned.


    **Returns:**
    - The tax class id of the variant, variation group or master


---

### getTemplate()
- getTemplate(): [String](TopLevel.String.md)
  - : Returns the rendering template name of the product variant. 
      
      
      If the variant does not define an own value for 'template', the value is retrieved
      from the assigned variation groups, sorted by their position.
      
      If none of the variation groups define a value for 'template', the value of
      the master product is returned.


    **Returns:**
    - The rendering template name of the variant, variation group or master


---

### getThumbnail()
- getThumbnail(): [MediaFile](dw.content.MediaFile.md)
  - : Returns the thumbnail image of the product variant. 
      
      
      If the variant does not define an own value for 'thumbnail', the value is retrieved
      from the assigned variation groups, sorted by their position.
      
      If none of the variation groups define a value for 'thumbnail', the value of
      the master product is returned.


    **Returns:**
    - The thumbnail image of the variant, variation group or master


---

### getUPC()
- getUPC(): [String](TopLevel.String.md)
  - : Returns the UPC of the product variant. 
      
      
      If the variant does not define an own value for 'UPC', the value is retrieved
      from the assigned variation groups, sorted by their position.
      
      If none of the variation groups define a value for 'UPC', the value of
      the master product is returned.


    **Returns:**
    - The UPC of the variant, variation group or master


---

### getUnit()
- getUnit(): [String](TopLevel.String.md)
  - : Returns the sales unit of the product variant as defined by the
      master product. 
      
      
      If the variant does not define an own value for 'unit', the value is retrieved
      from the assigned variation groups, sorted by their position.
      
      If none of the variation groups define a value for 'unit', the value of
      the master product is returned.


    **Returns:**
    - The sales unit of the variant, variation group or master


---

### getUnitQuantity()
- getUnitQuantity(): [Quantity](dw.value.Quantity.md)
  - : Returns the unitQuantity of the product variant as defined by the
      master product. 
      
      
      If the variant does not define an own value for 'unitQuantity', the value is retrieved
      from the assigned variation groups, sorted by their position.
      
      If none of the variation groups define a value for 'unitQuantity', the value of
      the master product is returned.


    **Returns:**
    - The unitQuantity of the variant, variation group or master


---

### isOptionProduct()
- isOptionProduct(): [Boolean](TopLevel.Boolean.md)
  - : Returns 'true' if the variant has any options, otherwise 'false'.
      Method also returns 'true' if the variant has not any options,
      but the related variation groups (sorted by position) or
      master product has options.


    **Returns:**
    - true if the variant has any options, false otherwise.


---

<!-- prettier-ignore-end -->
