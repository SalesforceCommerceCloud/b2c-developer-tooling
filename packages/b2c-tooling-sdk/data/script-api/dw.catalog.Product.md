<!-- prettier-ignore-start -->
# Class Product

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)
      - [dw.catalog.Product](dw.catalog.Product.md)

Represents a product in Commerce Cloud Digital. Products are identified by
a unique product ID, sometimes called the SKU. There are several different
types of product:


- **Simple product**
- **Master products:**This type of product defines a template for a set  of related products which differ only by a set of defined  "variation attributes", such as size or color. Master products are not  orderable themselves. The variation information for a master product is  available through its [ProductVariationModel](dw.catalog.ProductVariationModel.md).
- **Variant:**Variants are the actual orderable products that are  related to a master product. Each variant of a master product has a unique  set of values for the defined variation attributes. Variants are said to be  "mastered" by the corresponding master product.
- **Option products:**Option products define additional options, such  as a warranty, which can be purchased for a defined price at the time the  product is purchased. The option information for an option product is  available through its [ProductOptionModel](dw.catalog.ProductOptionModel.md).
- **Product-sets:**A product-set is a set of products which the  merchant can sell as a collection in the storefront, for example an outfit of  clothes. Product-sets are not orderable and therefore do not define prices.  They exist only to group the products together in the storefront UI. Members  of the set are called "product-set-products".
- **Products bundles:**A collection of products which can be ordered as  a single unit and therefore can define its own price and inventory record.




Product price and availability information are retrievable through
[getPriceModel()](dw.catalog.Product.md#getpricemodel) and [getAvailabilityModel()](dw.catalog.Product.md#getavailabilitymodel) respectively.
Attribute information is retrievable through [getAttributeModel()](dw.catalog.Product.md#getattributemodel).
Products may reference other products, either as recommendations or product
links. This class provides the methods for retrieving these referenced
products.


Products belong to a catalog (the "owning" catalog) and are assigned to
categories in other catalogs. Products assigned to categories in the site
catalog are typically orderable on the site.


Any API method which returns products will return an instance of a
[Variant](dw.catalog.Variant.md) for variant products. This subclass contains
methods which are specific to this type of product.



## All Known Subclasses
[Variant](dw.catalog.Variant.md), [VariationGroup](dw.catalog.VariationGroup.md)
## Property Summary

| Property | Description |
| --- | --- |
| [EAN](#ean): [String](TopLevel.String.md) `(read-only)` | Returns the European Article Number of the product. |
| [ID](#id): [String](TopLevel.String.md) `(read-only)` | Returns the ID of the product. |
| [UPC](#upc): [String](TopLevel.String.md) `(read-only)` | Returns the Universal Product Code of the product. |
| [activeData](#activedata): [ProductActiveData](dw.catalog.ProductActiveData.md) `(read-only)` | Returns the active data for this product, for the current site. |
| [allCategories](#allcategories): [Collection](dw.util.Collection.md) `(read-only)` | Returns a collection of all categories to which this product is assigned. |
| [allCategoryAssignments](#allcategoryassignments): [Collection](dw.util.Collection.md) `(read-only)` | Returns all category assignments for this product in any catalog. |
| [allIncomingProductLinks](#allincomingproductlinks): [Collection](dw.util.Collection.md) `(read-only)` | Returns all incoming ProductLinks. |
| [allProductLinks](#allproductlinks): [Collection](dw.util.Collection.md) `(read-only)` | Returns all outgoing ProductLinks. |
| [assignedToSiteCatalog](#assignedtositecatalog): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns `true` if the product is assigned to the current site (via the site catalog), otherwise  `false` is returned. |
| [attributeModel](#attributemodel): [ProductAttributeModel](dw.catalog.ProductAttributeModel.md) `(read-only)` | Returns this product's ProductAttributeModel, which makes access to the  product attribute information convenient. |
| [availabilityModel](#availabilitymodel): [ProductAvailabilityModel](dw.catalog.ProductAvailabilityModel.md) `(read-only)` | Returns the availability model, which can be used to determine availability  information for a product. |
| ~~[available](#available): [Boolean](TopLevel.Boolean.md)~~ `(read-only)` | Identifies if the product is available. |
| ~~[availableFlag](#availableflag): [Boolean](TopLevel.Boolean.md)~~ | Identifies if the product is available. |
| [brand](#brand): [String](TopLevel.String.md) `(read-only)` | Returns the Brand of the product. |
| [bundle](#bundle): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if this product instance is a product bundle. |
| [bundled](#bundled): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if this product instance is bundled within at least one  product bundle. |
| [bundledProducts](#bundledproducts): [Collection](dw.util.Collection.md) `(read-only)` | Returns a collection containing all products that participate in the  product bundle. |
| [bundles](#bundles): [Collection](dw.util.Collection.md) `(read-only)` | Returns a collection of all bundles in which this product is included. |
| [categories](#categories): [Collection](dw.util.Collection.md) `(read-only)` | Returns a collection of all categories to which this product is assigned  and which are also available through the current site. |
| [categorized](#categorized): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if this product is bound to at least one catalog category. |
| [categoryAssignments](#categoryassignments): [Collection](dw.util.Collection.md) `(read-only)` | Returns a collection of category assignments for this product in  the current site catalog. |
| [classificationCategory](#classificationcategory): [Category](dw.catalog.Category.md) `(read-only)` | Returns the classification category associated with this Product. |
| [facebookEnabled](#facebookenabled): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if the product is Facebook enabled. |
| ~~[image](#image): [MediaFile](dw.content.MediaFile.md)~~ `(read-only)` | Returns the product's image. |
| [incomingProductLinks](#incomingproductlinks): [Collection](dw.util.Collection.md) `(read-only)` | Returns incoming ProductLinks, where the source product is a site product. |
| [longDescription](#longdescription): [MarkupText](dw.content.MarkupText.md) `(read-only)` | Returns the product's long description in the current locale. |
| [manufacturerName](#manufacturername): [String](TopLevel.String.md) `(read-only)` | Returns the name of the product manufacturer. |
| [manufacturerSKU](#manufacturersku): [String](TopLevel.String.md) `(read-only)` | Returns the value of the manufacturer's stock keeping unit. |
| [master](#master): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if this product instance is a product master. |
| [minOrderQuantity](#minorderquantity): [Quantity](dw.value.Quantity.md) `(read-only)` | Returns the minimum order quantity for this product. |
| [name](#name): [String](TopLevel.String.md) `(read-only)` | Returns the name of the product in the current locale. |
| [online](#online): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns the online status of the product. |
| [onlineCategories](#onlinecategories): [Collection](dw.util.Collection.md) `(read-only)` | Returns a collection of all currently online categories to which this  product is assigned and which are also available through the current  site. |
| [onlineFlag](#onlineflag): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns the online status flag of the product. |
| [onlineFrom](#onlinefrom): [Date](TopLevel.Date.md) `(read-only)` | Returns the date from which the product is online or valid. |
| [onlineTo](#onlineto): [Date](TopLevel.Date.md) `(read-only)` | Returns the date until which the product is online or valid. |
| [optionModel](#optionmodel): [ProductOptionModel](dw.catalog.ProductOptionModel.md) `(read-only)` | Returns the product's option model. |
| [optionProduct](#optionproduct): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if the product has options. |
| [orderableRecommendations](#orderablerecommendations): [Collection](dw.util.Collection.md) `(read-only)` | Returns a list of outgoing recommendations for this product. |
| [pageDescription](#pagedescription): [String](TopLevel.String.md) `(read-only)` | Returns product's page description in the default locale. |
| [pageKeywords](#pagekeywords): [String](TopLevel.String.md) `(read-only)` | Returns the product's page keywords in the default locale. |
| [pageMetaTags](#pagemetatags): [Array](TopLevel.Array.md) `(read-only)` | Returns all page meta tags, defined for this instance for which content can be generated. |
| [pageTitle](#pagetitle): [String](TopLevel.String.md) `(read-only)` | Returns the product's page title in the default locale. |
| [pageURL](#pageurl): [String](TopLevel.String.md) `(read-only)` | Returns the product's page URL in the default locale. |
| [pinterestEnabled](#pinterestenabled): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if the product is Pinterest enabled. |
| [priceModel](#pricemodel): [ProductPriceModel](dw.catalog.ProductPriceModel.md) `(read-only)` | Returns the price model, which can be used to retrieve a price  for this product. |
| [primaryCategory](#primarycategory): [Category](dw.catalog.Category.md) `(read-only)` | Returns the primary category of the product within the current site catalog. |
| [primaryCategoryAssignment](#primarycategoryassignment): [CategoryAssignment](dw.catalog.CategoryAssignment.md) `(read-only)` | Returns the category assignment to the primary category in the current site  catalog or null if no primary category is defined within the current site  catalog. |
| [product](#product): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns 'true' if the instance represents a product. |
| [productLinks](#productlinks): [Collection](dw.util.Collection.md) `(read-only)` | Returns all outgoing ProductLinks, where the target product is also  available in the current site. |
| [productSet](#productset): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns 'true' if the instance represents a product set, otherwise 'false'. |
| [productSetProduct](#productsetproduct): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns true if this product is part of any product set, otherwise false. |
| [productSetProducts](#productsetproducts): [Collection](dw.util.Collection.md) `(read-only)` | Returns a collection of all products which are assigned to this product  and which are also available through the current site. |
| [productSets](#productsets): [Collection](dw.util.Collection.md) `(read-only)` | Returns a collection of all product sets in which this product is included. |
| [recommendations](#recommendations): [Collection](dw.util.Collection.md) `(read-only)` | Returns the outgoing recommendations for this product which  belong to the site catalog. |
| ~~[retailSet](#retailset): [Boolean](TopLevel.Boolean.md)~~ `(read-only)` | Identifies if this product instance is part of a retail set. |
| [searchPlacement](#searchplacement): [Number](TopLevel.Number.md) `(read-only)` | Returns the product's search placement classification. |
| [searchRank](#searchrank): [Number](TopLevel.Number.md) `(read-only)` | Returns the product's search rank. |
| [searchable](#searchable): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if the product is searchable. |
| [searchableFlag](#searchableflag): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns, whether the product is currently searchable. |
| [searchableIfUnavailableFlag](#searchableifunavailableflag): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns the searchable status of the [Product](dw.catalog.Product.md) if unavailable. |
| [shortDescription](#shortdescription): [MarkupText](dw.content.MarkupText.md) `(read-only)` | Returns the product's short description in the current locale. |
| [siteMapChangeFrequency](#sitemapchangefrequency): [String](TopLevel.String.md) `(read-only)` | Returns the product's change frequency needed for the sitemap creation. |
| [siteMapIncluded](#sitemapincluded): [Number](TopLevel.Number.md) `(read-only)` | Returns the status if the product is included into the sitemap. |
| [siteMapPriority](#sitemappriority): [Number](TopLevel.Number.md) `(read-only)` | Returns the product's priority needed for the sitemap creation. |
| ~~[siteProduct](#siteproduct): [Boolean](TopLevel.Boolean.md)~~ `(read-only)` | Returns 'true' if the product is assigned to the current site (via the  site catalog), otherwise 'false' is returned. |
| [stepQuantity](#stepquantity): [Quantity](dw.value.Quantity.md) `(read-only)` | Returns the steps in which the order amount of the product can be  increased. |
| [storeReceiptName](#storereceiptname): [String](TopLevel.String.md) `(read-only)` | Returns the store receipt name of the product in the current locale. |
| [storeTaxClass](#storetaxclass): [String](TopLevel.String.md) `(read-only)` | Returns the store tax class ID. |
| [taxClassID](#taxclassid): [String](TopLevel.String.md) `(read-only)` | Returns the ID of the product's tax class, by resolving  the Global Preference setting selected. |
| [template](#template): [String](TopLevel.String.md) `(read-only)` | Returns the name of the product's rendering template. |
| ~~[thumbnail](#thumbnail): [MediaFile](dw.content.MediaFile.md)~~ `(read-only)` | Returns the product's thumbnail image. |
| [unit](#unit): [String](TopLevel.String.md) `(read-only)` | Returns the product's sales unit. |
| [unitQuantity](#unitquantity): [Quantity](dw.value.Quantity.md) `(read-only)` | Returns the product's unit quantity. |
| [variant](#variant): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if this product instance is mastered by a product master. |
| [variants](#variants): [Collection](dw.util.Collection.md) `(read-only)` | Returns a collection of all variants assigned to this variation master  or variation group product. |
| [variationGroup](#variationgroup): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if this product instance is a variation group product. |
| [variationGroups](#variationgroups): [Collection](dw.util.Collection.md) `(read-only)` | Returns a collection of all variation groups assigned to this variation  master product. |
| [variationModel](#variationmodel): [ProductVariationModel](dw.catalog.ProductVariationModel.md) `(read-only)` | Returns the variation model of this product. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| ~~[assignedToCategory](dw.catalog.Product.md#assignedtocategorycategory)([Category](dw.catalog.Category.md))~~ | Identifies if this product is bound to the specified catalog category. |
| [getActiveData](dw.catalog.Product.md#getactivedata)() | Returns the active data for this product, for the current site. |
| [getAllCategories](dw.catalog.Product.md#getallcategories)() | Returns a collection of all categories to which this product is assigned. |
| [getAllCategoryAssignments](dw.catalog.Product.md#getallcategoryassignments)() | Returns all category assignments for this product in any catalog. |
| [getAllIncomingProductLinks](dw.catalog.Product.md#getallincomingproductlinks)() | Returns all incoming ProductLinks. |
| [getAllIncomingProductLinks](dw.catalog.Product.md#getallincomingproductlinksnumber)([Number](TopLevel.Number.md)) | Returns all incoming ProductLinks of a specific type. |
| [getAllProductLinks](dw.catalog.Product.md#getallproductlinks)() | Returns all outgoing ProductLinks. |
| [getAllProductLinks](dw.catalog.Product.md#getallproductlinksnumber)([Number](TopLevel.Number.md)) | Returns all outgoing ProductLinks of a specific type. |
| [getAllRecommendations](dw.catalog.Product.md#getallrecommendationscatalog)([Catalog](dw.catalog.Catalog.md)) | Returns the outgoing recommendations for this product which belong to the  specified catalog. |
| [getAllRecommendations](dw.catalog.Product.md#getallrecommendationscatalog-number)([Catalog](dw.catalog.Catalog.md), [Number](TopLevel.Number.md)) | Returns the outgoing recommendations for this product which are of the  specified type and which belong to the specified catalog. |
| [getAttributeModel](dw.catalog.Product.md#getattributemodel)() | Returns this product's ProductAttributeModel, which makes access to the  product attribute information convenient. |
| [getAvailabilityModel](dw.catalog.Product.md#getavailabilitymodel)() | Returns the availability model, which can be used to determine availability  information for a product. |
| [getAvailabilityModel](dw.catalog.Product.md#getavailabilitymodelproductinventorylist)([ProductInventoryList](dw.catalog.ProductInventoryList.md)) | Returns the availability model of the given inventory list, which can be  used to determine availability information for a product. |
| ~~[getAvailableFlag](dw.catalog.Product.md#getavailableflag)()~~ | Identifies if the product is available. |
| [getBrand](dw.catalog.Product.md#getbrand)() | Returns the Brand of the product. |
| [getBundledProductQuantity](dw.catalog.Product.md#getbundledproductquantityproduct)([Product](dw.catalog.Product.md)) | Returns the quantity of the specified product within the bundle. |
| [getBundledProducts](dw.catalog.Product.md#getbundledproducts)() | Returns a collection containing all products that participate in the  product bundle. |
| [getBundles](dw.catalog.Product.md#getbundles)() | Returns a collection of all bundles in which this product is included. |
| [getCategories](dw.catalog.Product.md#getcategories)() | Returns a collection of all categories to which this product is assigned  and which are also available through the current site. |
| [getCategoryAssignment](dw.catalog.Product.md#getcategoryassignmentcategory)([Category](dw.catalog.Category.md)) | Returns the category assignment for a specific category. |
| [getCategoryAssignments](dw.catalog.Product.md#getcategoryassignments)() | Returns a collection of category assignments for this product in  the current site catalog. |
| [getClassificationCategory](dw.catalog.Product.md#getclassificationcategory)() | Returns the classification category associated with this Product. |
| [getEAN](dw.catalog.Product.md#getean)() | Returns the European Article Number of the product. |
| [getID](dw.catalog.Product.md#getid)() | Returns the ID of the product. |
| ~~[getImage](dw.catalog.Product.md#getimage)()~~ | Returns the product's image. |
| [getImage](dw.catalog.Product.md#getimagestring)([String](TopLevel.String.md)) | The method calls [getImages(String)](dw.catalog.Product.md#getimagesstring) and returns the first image. |
| [getImage](dw.catalog.Product.md#getimagestring-number)([String](TopLevel.String.md), [Number](TopLevel.Number.md)) | The method calls [getImages(String)](dw.catalog.Product.md#getimagesstring) and returns the image at  the specific index. |
| [getImages](dw.catalog.Product.md#getimagesstring)([String](TopLevel.String.md)) | Returns all images assigned to this product for a specific view type,  e.g. |
| [getIncomingProductLinks](dw.catalog.Product.md#getincomingproductlinks)() | Returns incoming ProductLinks, where the source product is a site product. |
| [getIncomingProductLinks](dw.catalog.Product.md#getincomingproductlinksnumber)([Number](TopLevel.Number.md)) | Returns incoming ProductLinks, where the source product is a site product  of a specific type. |
| [getLongDescription](dw.catalog.Product.md#getlongdescription)() | Returns the product's long description in the current locale. |
| [getManufacturerName](dw.catalog.Product.md#getmanufacturername)() | Returns the name of the product manufacturer. |
| [getManufacturerSKU](dw.catalog.Product.md#getmanufacturersku)() | Returns the value of the manufacturer's stock keeping unit. |
| [getMinOrderQuantity](dw.catalog.Product.md#getminorderquantity)() | Returns the minimum order quantity for this product. |
| [getName](dw.catalog.Product.md#getname)() | Returns the name of the product in the current locale. |
| [getOnlineCategories](dw.catalog.Product.md#getonlinecategories)() | Returns a collection of all currently online categories to which this  product is assigned and which are also available through the current  site. |
| [getOnlineFlag](dw.catalog.Product.md#getonlineflag)() | Returns the online status flag of the product. |
| [getOnlineFrom](dw.catalog.Product.md#getonlinefrom)() | Returns the date from which the product is online or valid. |
| [getOnlineTo](dw.catalog.Product.md#getonlineto)() | Returns the date until which the product is online or valid. |
| [getOptionModel](dw.catalog.Product.md#getoptionmodel)() | Returns the product's option model. |
| [getOrderableRecommendations](dw.catalog.Product.md#getorderablerecommendations)() | Returns a list of outgoing recommendations for this product. |
| [getOrderableRecommendations](dw.catalog.Product.md#getorderablerecommendationsnumber)([Number](TopLevel.Number.md)) | Returns a list of outgoing recommendations for this product. |
| [getPageDescription](dw.catalog.Product.md#getpagedescription)() | Returns product's page description in the default locale. |
| [getPageKeywords](dw.catalog.Product.md#getpagekeywords)() | Returns the product's page keywords in the default locale. |
| [getPageMetaTag](dw.catalog.Product.md#getpagemetatagstring)([String](TopLevel.String.md)) | Returns the page meta tag for the specified id. |
| [getPageMetaTags](dw.catalog.Product.md#getpagemetatags)() | Returns all page meta tags, defined for this instance for which content can be generated. |
| [getPageTitle](dw.catalog.Product.md#getpagetitle)() | Returns the product's page title in the default locale. |
| [getPageURL](dw.catalog.Product.md#getpageurl)() | Returns the product's page URL in the default locale. |
| [getPriceModel](dw.catalog.Product.md#getpricemodel)() | Returns the price model, which can be used to retrieve a price  for this product. |
| [getPriceModel](dw.catalog.Product.md#getpricemodelproductoptionmodel)([ProductOptionModel](dw.catalog.ProductOptionModel.md)) | Returns the price model based on the specified optionModel. |
| [getPrimaryCategory](dw.catalog.Product.md#getprimarycategory)() | Returns the primary category of the product within the current site catalog. |
| [getPrimaryCategoryAssignment](dw.catalog.Product.md#getprimarycategoryassignment)() | Returns the category assignment to the primary category in the current site  catalog or null if no primary category is defined within the current site  catalog. |
| [getProductLinks](dw.catalog.Product.md#getproductlinks)() | Returns all outgoing ProductLinks, where the target product is also  available in the current site. |
| [getProductLinks](dw.catalog.Product.md#getproductlinksnumber)([Number](TopLevel.Number.md)) | Returns all outgoing ProductLinks of a specific type, where the target  product is also available in the current site. |
| [getProductSetProducts](dw.catalog.Product.md#getproductsetproducts)() | Returns a collection of all products which are assigned to this product  and which are also available through the current site. |
| [getProductSets](dw.catalog.Product.md#getproductsets)() | Returns a collection of all product sets in which this product is included. |
| [getRecommendations](dw.catalog.Product.md#getrecommendations)() | Returns the outgoing recommendations for this product which  belong to the site catalog. |
| [getRecommendations](dw.catalog.Product.md#getrecommendationsnumber)([Number](TopLevel.Number.md)) | Returns the outgoing recommendations for this product which are of the  specified type and which belong to the site catalog. |
| [getSearchPlacement](dw.catalog.Product.md#getsearchplacement)() | Returns the product's search placement classification. |
| [getSearchRank](dw.catalog.Product.md#getsearchrank)() | Returns the product's search rank. |
| [getSearchableFlag](dw.catalog.Product.md#getsearchableflag)() | Returns, whether the product is currently searchable. |
| [getSearchableIfUnavailableFlag](dw.catalog.Product.md#getsearchableifunavailableflag)() | Returns the searchable status of the [Product](dw.catalog.Product.md) if unavailable. |
| [getShortDescription](dw.catalog.Product.md#getshortdescription)() | Returns the product's short description in the current locale. |
| [getSiteMapChangeFrequency](dw.catalog.Product.md#getsitemapchangefrequency)() | Returns the product's change frequency needed for the sitemap creation. |
| [getSiteMapIncluded](dw.catalog.Product.md#getsitemapincluded)() | Returns the status if the product is included into the sitemap. |
| [getSiteMapPriority](dw.catalog.Product.md#getsitemappriority)() | Returns the product's priority needed for the sitemap creation. |
| [getStepQuantity](dw.catalog.Product.md#getstepquantity)() | Returns the steps in which the order amount of the product can be  increased. |
| [getStoreReceiptName](dw.catalog.Product.md#getstorereceiptname)() | Returns the store receipt name of the product in the current locale. |
| [getStoreTaxClass](dw.catalog.Product.md#getstoretaxclass)() | Returns the store tax class ID. |
| [getTaxClassID](dw.catalog.Product.md#gettaxclassid)() | Returns the ID of the product's tax class, by resolving  the Global Preference setting selected. |
| [getTemplate](dw.catalog.Product.md#gettemplate)() | Returns the name of the product's rendering template. |
| ~~[getThumbnail](dw.catalog.Product.md#getthumbnail)()~~ | Returns the product's thumbnail image. |
| [getUPC](dw.catalog.Product.md#getupc)() | Returns the Universal Product Code of the product. |
| [getUnit](dw.catalog.Product.md#getunit)() | Returns the product's sales unit. |
| [getUnitQuantity](dw.catalog.Product.md#getunitquantity)() | Returns the product's unit quantity. |
| [getVariants](dw.catalog.Product.md#getvariants)() | Returns a collection of all variants assigned to this variation master  or variation group product. |
| [getVariationGroups](dw.catalog.Product.md#getvariationgroups)() | Returns a collection of all variation groups assigned to this variation  master product. |
| [getVariationModel](dw.catalog.Product.md#getvariationmodel)() | Returns the variation model of this product. |
| [includedInBundle](dw.catalog.Product.md#includedinbundleproduct)([Product](dw.catalog.Product.md)) | Identifies if the specified product participates in this product bundle. |
| [isAssignedToCategory](dw.catalog.Product.md#isassignedtocategorycategory)([Category](dw.catalog.Category.md)) | Returns 'true' if item is assigned to the specified  category. |
| [isAssignedToSiteCatalog](dw.catalog.Product.md#isassignedtositecatalog)() | Returns `true` if the product is assigned to the current site (via the site catalog), otherwise  `false` is returned. |
| ~~[isAvailable](dw.catalog.Product.md#isavailable)()~~ | Identifies if the product is available. |
| [isBundle](dw.catalog.Product.md#isbundle)() | Identifies if this product instance is a product bundle. |
| [isBundled](dw.catalog.Product.md#isbundled)() | Identifies if this product instance is bundled within at least one  product bundle. |
| [isCategorized](dw.catalog.Product.md#iscategorized)() | Identifies if this product is bound to at least one catalog category. |
| [isFacebookEnabled](dw.catalog.Product.md#isfacebookenabled)() | Identifies if the product is Facebook enabled. |
| [isMaster](dw.catalog.Product.md#ismaster)() | Identifies if this product instance is a product master. |
| [isOnline](dw.catalog.Product.md#isonline)() | Returns the online status of the product. |
| [isOptionProduct](dw.catalog.Product.md#isoptionproduct)() | Identifies if the product has options. |
| [isPinterestEnabled](dw.catalog.Product.md#ispinterestenabled)() | Identifies if the product is Pinterest enabled. |
| [isProduct](dw.catalog.Product.md#isproduct)() | Returns 'true' if the instance represents a product. |
| [isProductSet](dw.catalog.Product.md#isproductset)() | Returns 'true' if the instance represents a product set, otherwise 'false'. |
| [isProductSetProduct](dw.catalog.Product.md#isproductsetproduct)() | Returns true if this product is part of any product set, otherwise false. |
| ~~[isRetailSet](dw.catalog.Product.md#isretailset)()~~ | Identifies if this product instance is part of a retail set. |
| [isSearchable](dw.catalog.Product.md#issearchable)() | Identifies if the product is searchable. |
| ~~[isSiteProduct](dw.catalog.Product.md#issiteproduct)()~~ | Returns 'true' if the product is assigned to the current site (via the  site catalog), otherwise 'false' is returned. |
| [isVariant](dw.catalog.Product.md#isvariant)() | Identifies if this product instance is mastered by a product master. |
| [isVariationGroup](dw.catalog.Product.md#isvariationgroup)() | Identifies if this product instance is a variation group product. |
| ~~[setAvailableFlag](dw.catalog.Product.md#setavailableflagboolean)([Boolean](TopLevel.Boolean.md))~~ | Set the availability status flag of the product. |
| [setOnlineFlag](dw.catalog.Product.md#setonlineflagboolean---variant-1)([Boolean](TopLevel.Boolean.md)) | Set the online status flag of the product. |
| [setOnlineFlag](dw.catalog.Product.md#setonlineflagboolean---variant-2)([Boolean](TopLevel.Boolean.md)) | Set the online status flag of the product for the current site. |
| [setSearchPlacement](dw.catalog.Product.md#setsearchplacementnumber---variant-1)([Number](TopLevel.Number.md)) | Set the product's search placement. |
| [setSearchPlacement](dw.catalog.Product.md#setsearchplacementnumber---variant-2)([Number](TopLevel.Number.md)) | Set the product's search placement classification in context of the current site. |
| [setSearchRank](dw.catalog.Product.md#setsearchranknumber---variant-1)([Number](TopLevel.Number.md)) | Set the product's search rank. |
| [setSearchRank](dw.catalog.Product.md#setsearchranknumber---variant-2)([Number](TopLevel.Number.md)) | Set the product's search rank in context of the current site. |
| [setSearchableFlag](dw.catalog.Product.md#setsearchableflagboolean---variant-1)([Boolean](TopLevel.Boolean.md)) | Set the flag indicating whether the product is searchable or not. |
| [setSearchableFlag](dw.catalog.Product.md#setsearchableflagboolean---variant-2)([Boolean](TopLevel.Boolean.md)) | Set the flag indicating whether the product is searchable or not in context of the current site. |

### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### EAN
- EAN: [String](TopLevel.String.md) `(read-only)`
  - : Returns the European Article Number of the product.


---

### ID
- ID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the ID of the product.


---

### UPC
- UPC: [String](TopLevel.String.md) `(read-only)`
  - : Returns the Universal Product Code of the product.


---

### activeData
- activeData: [ProductActiveData](dw.catalog.ProductActiveData.md) `(read-only)`
  - : Returns the active data for this product, for the current site.


---

### allCategories
- allCategories: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns a collection of all categories to which this product is assigned.


---

### allCategoryAssignments
- allCategoryAssignments: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns all category assignments for this product in any catalog.


---

### allIncomingProductLinks
- allIncomingProductLinks: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns all incoming ProductLinks.


---

### allProductLinks
- allProductLinks: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns all outgoing ProductLinks.


---

### assignedToSiteCatalog
- assignedToSiteCatalog: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns `true` if the product is assigned to the current site (via the site catalog), otherwise
      `false` is returned.
      
      
      In case of the product being a variant, the variant will be considered as assigned if its master, one of the
      variation groups it is in or itself is assigned to the site catalog. In case this is triggered for a variation
      group the variation group is considered as assigned if its master or itself is assigned.



---

### attributeModel
- attributeModel: [ProductAttributeModel](dw.catalog.ProductAttributeModel.md) `(read-only)`
  - : Returns this product's ProductAttributeModel, which makes access to the
      product attribute information convenient. The model is calculated based
      on the product attributes assigned to this product's classification
      category (or any of it's ancestors) and the global attribute definitions
      for the system object type 'Product'. If this product has no
      classification category, the attribute model is calculated on the global
      attribute definitions only. If this product is a variant, then the
      attribute model is calculated based on the classification category of its
      corresponding master product.



---

### availabilityModel
- availabilityModel: [ProductAvailabilityModel](dw.catalog.ProductAvailabilityModel.md) `(read-only)`
  - : Returns the availability model, which can be used to determine availability
      information for a product.



---

### available
- ~~available: [Boolean](TopLevel.Boolean.md)~~ `(read-only)`
  - : Identifies if the product is available.

    **Deprecated:**
:::warning
Use [getAvailabilityModel()](dw.catalog.Product.md#getavailabilitymodel).isInStock() instead
:::

---

### availableFlag
- ~~availableFlag: [Boolean](TopLevel.Boolean.md)~~
  - : Identifies if the product is available.

    **Deprecated:**
:::warning
Use [getAvailabilityModel()](dw.catalog.Product.md#getavailabilitymodel) instead.
:::

---

### brand
- brand: [String](TopLevel.String.md) `(read-only)`
  - : Returns the Brand of the product.


---

### bundle
- bundle: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if this product instance is a product bundle.


---

### bundled
- bundled: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if this product instance is bundled within at least one
      product bundle.



---

### bundledProducts
- bundledProducts: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns a collection containing all products that participate in the
      product bundle.



---

### bundles
- bundles: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns a collection of all bundles in which this product is included.
      The method only returns bundles assigned to the current site.



---

### categories
- categories: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns a collection of all categories to which this product is assigned
      and which are also available through the current site.



---

### categorized
- categorized: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if this product is bound to at least one catalog category.


---

### categoryAssignments
- categoryAssignments: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns a collection of category assignments for this product in
      the current site catalog.



---

### classificationCategory
- classificationCategory: [Category](dw.catalog.Category.md) `(read-only)`
  - : Returns the classification category associated with this Product. A
      product has a single classification category which may or may not be in
      the site catalog. The classification category defines the attribute set
      of the product. See [getAttributeModel()](dw.catalog.Product.md#getattributemodel) for
      how the classification category is used.



---

### facebookEnabled
- facebookEnabled: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if the product is Facebook enabled.


---

### image
- ~~image: [MediaFile](dw.content.MediaFile.md)~~ `(read-only)`
  - : Returns the product's image.

    **Deprecated:**
:::warning

Commerce Cloud Digital introduces a new more powerful product
image management. It allows to group product images by self-defined view types
(e.g. 'large', 'thumbnail', 'swatch') and variation values (e.g. for attribute
color 'red', 'blue'). Images can be annotated with pattern based title and
alt. Product images can be accessed from Digital locations or external storage
locations.


Please use the new product image management. Therefore you have to set
up the common product image settings like view types, image location,
default image alt and title for your catalogs first. After that you can
group your product images by the previously defined view types in context
of a product. Finally use [getImages(String)](dw.catalog.Product.md#getimagesstring) and
[getImage(String, Number)](dw.catalog.Product.md#getimagestring-number) to access your images.

:::

---

### incomingProductLinks
- incomingProductLinks: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns incoming ProductLinks, where the source product is a site product.


---

### longDescription
- longDescription: [MarkupText](dw.content.MarkupText.md) `(read-only)`
  - : Returns the product's long description in the current locale.


---

### manufacturerName
- manufacturerName: [String](TopLevel.String.md) `(read-only)`
  - : Returns the name of the product manufacturer.


---

### manufacturerSKU
- manufacturerSKU: [String](TopLevel.String.md) `(read-only)`
  - : Returns the value of the manufacturer's stock keeping unit.


---

### master
- master: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if this product instance is a product master.


---

### minOrderQuantity
- minOrderQuantity: [Quantity](dw.value.Quantity.md) `(read-only)`
  - : Returns the minimum order quantity for this product.


---

### name
- name: [String](TopLevel.String.md) `(read-only)`
  - : Returns the name of the product in the current locale.


---

### online
- online: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns the online status of the product. The online status
      is calculated from the online status flag and the onlineFrom
      onlineTo dates defined for the product.



---

### onlineCategories
- onlineCategories: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns a collection of all currently online categories to which this
      product is assigned and which are also available through the current
      site. A category is currently online if its online flag equals true and
      the current site date is within the date range defined by the onlineFrom
      and onlineTo attributes.



---

### onlineFlag
- onlineFlag: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns the online status flag of the product.


---

### onlineFrom
- onlineFrom: [Date](TopLevel.Date.md) `(read-only)`
  - : Returns the date from which the product is online or valid.


---

### onlineTo
- onlineTo: [Date](TopLevel.Date.md) `(read-only)`
  - : Returns the date until which the product is online or valid.


---

### optionModel
- optionModel: [ProductOptionModel](dw.catalog.ProductOptionModel.md) `(read-only)`
  - : Returns the product's option model. The option values selections are
      initialized with the values defined for the product, or the default values
      defined for the option.



---

### optionProduct
- optionProduct: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if the product has options.


---

### orderableRecommendations
- orderableRecommendations: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns a list of outgoing recommendations for this product. This method
      behaves similarly to [getRecommendations()](dw.catalog.Product.md#getrecommendations) but additionally filters out
      recommendations for which the target product is unorderable according to
      its product availability model.


    **See Also:**
    - [ProductAvailabilityModel.isOrderable()](dw.catalog.ProductAvailabilityModel.md#isorderable)


---

### pageDescription
- pageDescription: [String](TopLevel.String.md) `(read-only)`
  - : Returns product's page description in the default locale.


---

### pageKeywords
- pageKeywords: [String](TopLevel.String.md) `(read-only)`
  - : Returns the product's page keywords in the default locale.


---

### pageMetaTags
- pageMetaTags: [Array](TopLevel.Array.md) `(read-only)`
  - : Returns all page meta tags, defined for this instance for which content can be generated.
      
      
      The meta tag content is generated based on the product detail page meta tag context and rules. The rules are
      obtained from the current product context or inherited from variation groups, master product, the primary
      category, up to the root category.



---

### pageTitle
- pageTitle: [String](TopLevel.String.md) `(read-only)`
  - : Returns the product's page title in the default locale.


---

### pageURL
- pageURL: [String](TopLevel.String.md) `(read-only)`
  - : Returns the product's page URL in the default locale.


---

### pinterestEnabled
- pinterestEnabled: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if the product is Pinterest enabled.


---

### priceModel
- priceModel: [ProductPriceModel](dw.catalog.ProductPriceModel.md) `(read-only)`
  - : Returns the price model, which can be used to retrieve a price
      for this product.



---

### primaryCategory
- primaryCategory: [Category](dw.catalog.Category.md) `(read-only)`
  - : Returns the primary category of the product within the current site catalog.


---

### primaryCategoryAssignment
- primaryCategoryAssignment: [CategoryAssignment](dw.catalog.CategoryAssignment.md) `(read-only)`
  - : Returns the category assignment to the primary category in the current site
      catalog or null if no primary category is defined within the current site
      catalog.



---

### product
- product: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns 'true' if the instance represents a product. Returns 'false' if
      the instance represents a product set.


    **See Also:**
    - [isProductSet()](dw.catalog.Product.md#isproductset)


---

### productLinks
- productLinks: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns all outgoing ProductLinks, where the target product is also
      available in the current site. The ProductLinks are unsorted.



---

### productSet
- productSet: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns 'true' if the instance represents a product set, otherwise 'false'.

    **See Also:**
    - [isProduct()](dw.catalog.Product.md#isproduct)


---

### productSetProduct
- productSetProduct: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns true if this product is part of any product set, otherwise false.


---

### productSetProducts
- productSetProducts: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns a collection of all products which are assigned to this product
      and which are also available through the current site.  If this product
      does not represent a product set then an empty collection will be
      returned.



---

### productSets
- productSets: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns a collection of all product sets in which this product is included.
      The method only returns product sets assigned to the current site.



---

### recommendations
- recommendations: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns the outgoing recommendations for this product which
      belong to the site catalog.  If this product is not assigned to the site
      catalog, or there is no site catalog, an empty collection is returned.
      Only recommendations for which the target product exists and is assigned
      to the site catalog are returned.  The recommendations are sorted by
      their explicitly set order.



---

### retailSet
- ~~retailSet: [Boolean](TopLevel.Boolean.md)~~ `(read-only)`
  - : Identifies if this product instance is part of a retail set.

    **Deprecated:**
:::warning
Use [isProductSet()](dw.catalog.Product.md#isproductset) instead
:::

---

### searchPlacement
- searchPlacement: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the product's search placement classification. The higher the
      numeric product placement value, the more relevant is the product when
      sorting search results. The range of numeric placement values is
      defined in the meta data of object type 'Product' and can therefore be
      customized.



---

### searchRank
- searchRank: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the product's search rank. The higher the numeric product rank,
      the more relevant is the product when sorting search results. The range of
      numeric rank values is defined in the meta data of object type 'Product'
      and can therefore be customized.



---

### searchable
- searchable: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if the product is searchable.


---

### searchableFlag
- searchableFlag: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns, whether the product is currently searchable.


---

### searchableIfUnavailableFlag
- searchableIfUnavailableFlag: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns the searchable status of the [Product](dw.catalog.Product.md) if unavailable.
      
      Besides `true` or `false`, the return value `null` indicates that the value is not set.



---

### shortDescription
- shortDescription: [MarkupText](dw.content.MarkupText.md) `(read-only)`
  - : Returns the product's short description in the current locale.


---

### siteMapChangeFrequency
- siteMapChangeFrequency: [String](TopLevel.String.md) `(read-only)`
  - : Returns the product's change frequency needed for the sitemap creation.


---

### siteMapIncluded
- siteMapIncluded: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the status if the product is included into the sitemap.


---

### siteMapPriority
- siteMapPriority: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the product's priority needed for the sitemap creation.


---

### siteProduct
- ~~siteProduct: [Boolean](TopLevel.Boolean.md)~~ `(read-only)`
  - : Returns 'true' if the product is assigned to the current site (via the
      site catalog), otherwise 'false' is returned.


    **Deprecated:**
:::warning
Use [isAssignedToSiteCatalog()](dw.catalog.Product.md#isassignedtositecatalog) instead
:::

---

### stepQuantity
- stepQuantity: [Quantity](dw.value.Quantity.md) `(read-only)`
  - : Returns the steps in which the order amount of the product can be
      increased.



---

### storeReceiptName
- storeReceiptName: [String](TopLevel.String.md) `(read-only)`
  - : Returns the store receipt name of the product in the current locale.


---

### storeTaxClass
- storeTaxClass: [String](TopLevel.String.md) `(read-only)`
  - : Returns the store tax class ID.
      
      This is an optional override for in-store tax calculation.



---

### taxClassID
- taxClassID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the ID of the product's tax class, by resolving
      the Global Preference setting selected. If the Localized
      Tax Class setting under Global Preferences -> Products is
      selected, the localizedTaxClassID attribute value will be
      returned, else the legacy taxClassID attribute value will
      be returned.



---

### template
- template: [String](TopLevel.String.md) `(read-only)`
  - : Returns the name of the product's rendering template.


---

### thumbnail
- ~~thumbnail: [MediaFile](dw.content.MediaFile.md)~~ `(read-only)`
  - : Returns the product's thumbnail image.

    **Deprecated:**
:::warning

Commerce Cloud Digital introduces a new more powerful product
image management. It allows to group product images by self-defined view types
(e.g. 'large', 'thumbnail', 'swatch') and variation values (e.g. for attribute
color 'red', 'blue'). Images can be annotated with pattern based title and
alt. Product images can be accessed from Digital locations or external storage
locations.


Please use the new product image management. Therefore you have to set
up the common product image settings like view types, image location,
default image alt and title for your catalogs first. After that you can
group your product images by the previously defined view types in context
of a product. Finally use [getImages(String)](dw.catalog.Product.md#getimagesstring) and
[getImage(String, Number)](dw.catalog.Product.md#getimagestring-number) to access your images.

:::

---

### unit
- unit: [String](TopLevel.String.md) `(read-only)`
  - : Returns the product's sales unit.


---

### unitQuantity
- unitQuantity: [Quantity](dw.value.Quantity.md) `(read-only)`
  - : Returns the product's unit quantity.


---

### variant
- variant: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if this product instance is mastered by a product master.


---

### variants
- variants: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns a collection of all variants assigned to this variation master
      or variation group product. All variants are returned regardless of whether
      they are online or offline.
      
      If this product does not represent a variation master or variation group
      product then an empty collection is returned.



---

### variationGroup
- variationGroup: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if this product instance is a variation group product.


---

### variationGroups
- variationGroups: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns a collection of all variation groups assigned to this variation
      master product. All variation groups are returned regardless of whether
      they are online or offline.
      
      If this product does not represent a variation master product then an
      empty collection is returned.



---

### variationModel
- variationModel: [ProductVariationModel](dw.catalog.ProductVariationModel.md) `(read-only)`
  - : Returns the variation model of this product. If this product is a master
      product, then the returned model will encapsulate all the information
      about its variation attributes and variants. If this product is a variant
      product, then the returned model will encapsulate all the same
      information, but additionally pre-select all the variation attribute
      values of this variant. (See [ProductVariationModel](dw.catalog.ProductVariationModel.md) for
      details on what "selected" means.) If this product is neither a master
      product or a variation product, then a model will be returned but will be
      essentially empty and not useful for any particular purpose.



---

## Method Details

### assignedToCategory(Category)
- ~~assignedToCategory(category: [Category](dw.catalog.Category.md)): [Boolean](TopLevel.Boolean.md)~~
  - : Identifies if this product is bound to the specified catalog category.

    **Parameters:**
    - category - the CatalogCategory to check.

    **Returns:**
    - true if the product is bound to the CatalogCategory, false
              otherwise.


    **Deprecated:**
:::warning
Use [isAssignedToCategory(Category)](dw.catalog.Product.md#isassignedtocategorycategory)
:::

---

### getActiveData()
- getActiveData(): [ProductActiveData](dw.catalog.ProductActiveData.md)
  - : Returns the active data for this product, for the current site.

    **Returns:**
    - the active data for this product for the current site.


---

### getAllCategories()
- getAllCategories(): [Collection](dw.util.Collection.md)
  - : Returns a collection of all categories to which this product is assigned.

    **Returns:**
    - Collection of categories.


---

### getAllCategoryAssignments()
- getAllCategoryAssignments(): [Collection](dw.util.Collection.md)
  - : Returns all category assignments for this product in any catalog.

    **Returns:**
    - Collection of category assignments of the product in any catalog.


---

### getAllIncomingProductLinks()
- getAllIncomingProductLinks(): [Collection](dw.util.Collection.md)
  - : Returns all incoming ProductLinks.

    **Returns:**
    - a collection of all incoming ProductLinks.


---

### getAllIncomingProductLinks(Number)
- getAllIncomingProductLinks(type: [Number](TopLevel.Number.md)): [Collection](dw.util.Collection.md)
  - : Returns all incoming ProductLinks of a specific type.

    **Parameters:**
    - type - the type of ProductLinks to use.

    **Returns:**
    - a collection of all incoming ProductLinks of a specific type.


---

### getAllProductLinks()
- getAllProductLinks(): [Collection](dw.util.Collection.md)
  - : Returns all outgoing ProductLinks.

    **Returns:**
    - a collection of all outgoing ProductLinks.


---

### getAllProductLinks(Number)
- getAllProductLinks(type: [Number](TopLevel.Number.md)): [Collection](dw.util.Collection.md)
  - : Returns all outgoing ProductLinks of a specific type.

    **Parameters:**
    - type - the type of ProductLinks to fetch.

    **Returns:**
    - a collection of all outgoing ProductLinks of a specific type.


---

### getAllRecommendations(Catalog)
- getAllRecommendations(catalog: [Catalog](dw.catalog.Catalog.md)): [Collection](dw.util.Collection.md)
  - : Returns the outgoing recommendations for this product which belong to the
      specified catalog. The recommendations are sorted by their explicitly set
      order.


    **Parameters:**
    - catalog - the catalog containing the recommendations.

    **Returns:**
    - the sorted collection of recommendations, never null but possibly empty.


---

### getAllRecommendations(Catalog, Number)
- getAllRecommendations(catalog: [Catalog](dw.catalog.Catalog.md), type: [Number](TopLevel.Number.md)): [Collection](dw.util.Collection.md)
  - : Returns the outgoing recommendations for this product which are of the
      specified type and which belong to the specified catalog.
      The recommendations are sorted by their explicitly set order.


    **Parameters:**
    - catalog - the catalog containing the recommendations.
    - type - the recommendation type.

    **Returns:**
    - the sorted collection of recommendations, never null but possibly empty.


---

### getAttributeModel()
- getAttributeModel(): [ProductAttributeModel](dw.catalog.ProductAttributeModel.md)
  - : Returns this product's ProductAttributeModel, which makes access to the
      product attribute information convenient. The model is calculated based
      on the product attributes assigned to this product's classification
      category (or any of it's ancestors) and the global attribute definitions
      for the system object type 'Product'. If this product has no
      classification category, the attribute model is calculated on the global
      attribute definitions only. If this product is a variant, then the
      attribute model is calculated based on the classification category of its
      corresponding master product.


    **Returns:**
    - the ProductAttributeModel for this product.


---

### getAvailabilityModel()
- getAvailabilityModel(): [ProductAvailabilityModel](dw.catalog.ProductAvailabilityModel.md)
  - : Returns the availability model, which can be used to determine availability
      information for a product.


    **Returns:**
    - the availability model for a product.


---

### getAvailabilityModel(ProductInventoryList)
- getAvailabilityModel(list: [ProductInventoryList](dw.catalog.ProductInventoryList.md)): [ProductAvailabilityModel](dw.catalog.ProductAvailabilityModel.md)
  - : Returns the availability model of the given inventory list, which can be
      used to determine availability information for a product.


    **Parameters:**
    - list - The inventory list to get the availability model for. Must             not be null or an exception will be raised.

    **Returns:**
    - the availability model of the given inventory list for a product.


---

### getAvailableFlag()
- ~~getAvailableFlag(): [Boolean](TopLevel.Boolean.md)~~
  - : Identifies if the product is available.

    **Returns:**
    - the availability status flag of the product.

    **Deprecated:**
:::warning
Use [getAvailabilityModel()](dw.catalog.Product.md#getavailabilitymodel) instead.
:::

---

### getBrand()
- getBrand(): [String](TopLevel.String.md)
  - : Returns the Brand of the product.

    **Returns:**
    - the Brand of the product.


---

### getBundledProductQuantity(Product)
- getBundledProductQuantity(aProduct: [Product](dw.catalog.Product.md)): [Quantity](dw.value.Quantity.md)
  - : Returns the quantity of the specified product within the bundle. If the
      specified product is not part of the bundle, a 0 quantity is returned.


    **Parameters:**
    - aProduct - The product to determine the quantity for.

    **Returns:**
    - The quantity of the product within the bundle or 0 if the product
              is not part of the bundle.



---

### getBundledProducts()
- getBundledProducts(): [Collection](dw.util.Collection.md)
  - : Returns a collection containing all products that participate in the
      product bundle.


    **Returns:**
    - A collection containing all products of the product bundle.


---

### getBundles()
- getBundles(): [Collection](dw.util.Collection.md)
  - : Returns a collection of all bundles in which this product is included.
      The method only returns bundles assigned to the current site.


    **Returns:**
    - Collection of bundles in which this product is included, possibly empty.


---

### getCategories()
- getCategories(): [Collection](dw.util.Collection.md)
  - : Returns a collection of all categories to which this product is assigned
      and which are also available through the current site.


    **Returns:**
    - Collection of categories to which this product is assigned
      and which are also available through the current site.



---

### getCategoryAssignment(Category)
- getCategoryAssignment(category: [Category](dw.catalog.Category.md)): [CategoryAssignment](dw.catalog.CategoryAssignment.md)
  - : Returns the category assignment for a specific category.

    **Parameters:**
    - category - the category to use when fetching assignments.

    **Returns:**
    - The category assignment for a specific category.


---

### getCategoryAssignments()
- getCategoryAssignments(): [Collection](dw.util.Collection.md)
  - : Returns a collection of category assignments for this product in
      the current site catalog.


    **Returns:**
    - Collection of category assignments.


---

### getClassificationCategory()
- getClassificationCategory(): [Category](dw.catalog.Category.md)
  - : Returns the classification category associated with this Product. A
      product has a single classification category which may or may not be in
      the site catalog. The classification category defines the attribute set
      of the product. See [getAttributeModel()](dw.catalog.Product.md#getattributemodel) for
      how the classification category is used.


    **Returns:**
    - the associated classification Category, or null if none is
              associated.



---

### getEAN()
- getEAN(): [String](TopLevel.String.md)
  - : Returns the European Article Number of the product.

    **Returns:**
    - the European Article Number of the product.


---

### getID()
- getID(): [String](TopLevel.String.md)
  - : Returns the ID of the product.

    **Returns:**
    - ID of the product.


---

### getImage()
- ~~getImage(): [MediaFile](dw.content.MediaFile.md)~~
  - : Returns the product's image.

    **Returns:**
    - the product's image.

    **Deprecated:**
:::warning

Commerce Cloud Digital introduces a new more powerful product
image management. It allows to group product images by self-defined view types
(e.g. 'large', 'thumbnail', 'swatch') and variation values (e.g. for attribute
color 'red', 'blue'). Images can be annotated with pattern based title and
alt. Product images can be accessed from Digital locations or external storage
locations.


Please use the new product image management. Therefore you have to set
up the common product image settings like view types, image location,
default image alt and title for your catalogs first. After that you can
group your product images by the previously defined view types in context
of a product. Finally use [getImages(String)](dw.catalog.Product.md#getimagesstring) and
[getImage(String, Number)](dw.catalog.Product.md#getimagestring-number) to access your images.

:::

---

### getImage(String)
- getImage(viewtype: [String](TopLevel.String.md)): [MediaFile](dw.content.MediaFile.md)
  - : The method calls [getImages(String)](dw.catalog.Product.md#getimagesstring) and returns the first image.
      If no image is available the method returns null.
      
      When called for a variant with defined images for specified view type the
      method returns the first image.
      
      When called for a variant without defined images for specified view type
      the method returns the first master product image. If no master product
      images are defined, the method returns null.


    **Parameters:**
    - viewtype - the view type annotated to image

    **Returns:**
    - the MediaFile or null

    **Throws:**
    - NullArgumentException - if viewtype is null


---

### getImage(String, Number)
- getImage(viewtype: [String](TopLevel.String.md), index: [Number](TopLevel.Number.md)): [MediaFile](dw.content.MediaFile.md)
  - : The method calls [getImages(String)](dw.catalog.Product.md#getimagesstring) and returns the image at
      the specific index. If no image for specified index is available the
      method returns null.


    **Parameters:**
    - viewtype - the view type annotated to image
    - index - the index number of the image within image list

    **Returns:**
    - the MediaFile or null

    **Throws:**
    - NullArgumentException - if viewtype is null


---

### getImages(String)
- getImages(viewtype: [String](TopLevel.String.md)): [List](dw.util.List.md)
  - : Returns all images assigned to this product for a specific view type,
      e.g. all 'thumbnail' images. The images are returned in the order of
      their index number ascending.
      
      When called for a master the method returns the images specific to the
      master, which are typically the fall back images.


    **Parameters:**
    - viewtype - the view type annotated to images

    **Returns:**
    - a list of MediaFile objects, possibly empty

    **Throws:**
    - NullArgumentException - if viewtype is null


---

### getIncomingProductLinks()
- getIncomingProductLinks(): [Collection](dw.util.Collection.md)
  - : Returns incoming ProductLinks, where the source product is a site product.

    **Returns:**
    - a collection of incoming ProductLinks, where the source product is
              a site product.



---

### getIncomingProductLinks(Number)
- getIncomingProductLinks(type: [Number](TopLevel.Number.md)): [Collection](dw.util.Collection.md)
  - : Returns incoming ProductLinks, where the source product is a site product
      of a specific type.


    **Parameters:**
    - type - the type of ProductLinks to fetch.

    **Returns:**
    - a collection of incoming ProductLinks, where the source product is
              a site product of a specific type.



---

### getLongDescription()
- getLongDescription(): [MarkupText](dw.content.MarkupText.md)
  - : Returns the product's long description in the current locale.

    **Returns:**
    - The product's long description in the current locale, or null if it
              wasn't found.



---

### getManufacturerName()
- getManufacturerName(): [String](TopLevel.String.md)
  - : Returns the name of the product manufacturer.

    **Returns:**
    - the name of the product manufacturer.


---

### getManufacturerSKU()
- getManufacturerSKU(): [String](TopLevel.String.md)
  - : Returns the value of the manufacturer's stock keeping unit.

    **Returns:**
    - the value of the manufacturer's stock keeping unit.


---

### getMinOrderQuantity()
- getMinOrderQuantity(): [Quantity](dw.value.Quantity.md)
  - : Returns the minimum order quantity for this product.

    **Returns:**
    - the minimum order quantity of the product.


---

### getName()
- getName(): [String](TopLevel.String.md)
  - : Returns the name of the product in the current locale.

    **Returns:**
    - The name of the product for the current locale, or null if it
              wasn't found.



---

### getOnlineCategories()
- getOnlineCategories(): [Collection](dw.util.Collection.md)
  - : Returns a collection of all currently online categories to which this
      product is assigned and which are also available through the current
      site. A category is currently online if its online flag equals true and
      the current site date is within the date range defined by the onlineFrom
      and onlineTo attributes.


    **Returns:**
    - Collection of currently online categories to which this product
              is assigned and which are also available through the current
              site.



---

### getOnlineFlag()
- getOnlineFlag(): [Boolean](TopLevel.Boolean.md)
  - : Returns the online status flag of the product.

    **Returns:**
    - the online status flag of the product.


---

### getOnlineFrom()
- getOnlineFrom(): [Date](TopLevel.Date.md)
  - : Returns the date from which the product is online or valid.

    **Returns:**
    - the date from which the product is online or valid.


---

### getOnlineTo()
- getOnlineTo(): [Date](TopLevel.Date.md)
  - : Returns the date until which the product is online or valid.

    **Returns:**
    - the date until which the product is online or valid.


---

### getOptionModel()
- getOptionModel(): [ProductOptionModel](dw.catalog.ProductOptionModel.md)
  - : Returns the product's option model. The option values selections are
      initialized with the values defined for the product, or the default values
      defined for the option.


    **Returns:**
    - the products option model.


---

### getOrderableRecommendations()
- getOrderableRecommendations(): [Collection](dw.util.Collection.md)
  - : Returns a list of outgoing recommendations for this product. This method
      behaves similarly to [getRecommendations()](dw.catalog.Product.md#getrecommendations) but additionally filters out
      recommendations for which the target product is unorderable according to
      its product availability model.


    **Returns:**
    - the sorted collection of recommendations, never null but possibly
              empty.


    **See Also:**
    - [ProductAvailabilityModel.isOrderable()](dw.catalog.ProductAvailabilityModel.md#isorderable)


---

### getOrderableRecommendations(Number)
- getOrderableRecommendations(type: [Number](TopLevel.Number.md)): [Collection](dw.util.Collection.md)
  - : Returns a list of outgoing recommendations for this product. This method
      behaves similarly to [getRecommendations(Number)](dw.catalog.Product.md#getrecommendationsnumber) but additionally
      filters out recommendations for which the target product is unorderable
      according to its product availability model.


    **Parameters:**
    - type - the recommendation type.

    **Returns:**
    - the sorted collection of recommendations, never null but possibly
              empty.


    **See Also:**
    - [ProductAvailabilityModel.isOrderable()](dw.catalog.ProductAvailabilityModel.md#isorderable)


---

### getPageDescription()
- getPageDescription(): [String](TopLevel.String.md)
  - : Returns product's page description in the default locale.

    **Returns:**
    - The product's page description in the default locale,
                   or null if it wasn't found.



---

### getPageKeywords()
- getPageKeywords(): [String](TopLevel.String.md)
  - : Returns the product's page keywords in the default locale.

    **Returns:**
    - The product's page keywords in the default locale,
                   or null if it wasn't found.



---

### getPageMetaTag(String)
- getPageMetaTag(id: [String](TopLevel.String.md)): [PageMetaTag](dw.web.PageMetaTag.md)
  - : Returns the page meta tag for the specified id.
      
      
      The meta tag content is generated based on the product detail page meta tag context and rule. The rule is
      obtained from the current product context or inherited from variation groups, master product, the primary
      category, up to the root category.
      
      
      Null will be returned if the meta tag is undefined on the current instance, or if no rule can be found for the
      current context, or if the rule resolves to an empty string.


    **Parameters:**
    - id - the ID to get the page meta tag for

    **Returns:**
    - page meta tag containing content generated based on rules


---

### getPageMetaTags()
- getPageMetaTags(): [Array](TopLevel.Array.md)
  - : Returns all page meta tags, defined for this instance for which content can be generated.
      
      
      The meta tag content is generated based on the product detail page meta tag context and rules. The rules are
      obtained from the current product context or inherited from variation groups, master product, the primary
      category, up to the root category.


    **Returns:**
    - page meta tags defined for this instance, containing content generated based on rules


---

### getPageTitle()
- getPageTitle(): [String](TopLevel.String.md)
  - : Returns the product's page title in the default locale.

    **Returns:**
    - The product's page title in the default locale,
                   or null if it wasn't found.



---

### getPageURL()
- getPageURL(): [String](TopLevel.String.md)
  - : Returns the product's page URL in the default locale.

    **Returns:**
    - The product's page URL in the default locale,
                   or null if it wasn't found.



---

### getPriceModel()
- getPriceModel(): [ProductPriceModel](dw.catalog.ProductPriceModel.md)
  - : Returns the price model, which can be used to retrieve a price
      for this product.


    **Returns:**
    - the price model, which can be used to retrieve a price
      for this product.



---

### getPriceModel(ProductOptionModel)
- getPriceModel(optionModel: [ProductOptionModel](dw.catalog.ProductOptionModel.md)): [ProductPriceModel](dw.catalog.ProductPriceModel.md)
  - : Returns the price model based on the specified optionModel. The
      price model can be used to retrieve a price
      for this product. Prices are calculated based on the option values
      selected in the specified option model.


    **Parameters:**
    - optionModel - the option model to use when fetching the  price model.

    **Returns:**
    - the price model based on the specified optionModel.


---

### getPrimaryCategory()
- getPrimaryCategory(): [Category](dw.catalog.Category.md)
  - : Returns the primary category of the product within the current site catalog.

    **Returns:**
    - The product's primary category or null.


---

### getPrimaryCategoryAssignment()
- getPrimaryCategoryAssignment(): [CategoryAssignment](dw.catalog.CategoryAssignment.md)
  - : Returns the category assignment to the primary category in the current site
      catalog or null if no primary category is defined within the current site
      catalog.


    **Returns:**
    - The category assignment to the primary category or null.


---

### getProductLinks()
- getProductLinks(): [Collection](dw.util.Collection.md)
  - : Returns all outgoing ProductLinks, where the target product is also
      available in the current site. The ProductLinks are unsorted.


    **Returns:**
    - a collection of outgoing ProductLinks where the target product is also
      available in the current site.



---

### getProductLinks(Number)
- getProductLinks(type: [Number](TopLevel.Number.md)): [Collection](dw.util.Collection.md)
  - : Returns all outgoing ProductLinks of a specific type, where the target
      product is also available in the current site. The ProductLinks are
      sorted.


    **Parameters:**
    - type - the type of ProductLinks to fetch.

    **Returns:**
    - a collection of outgoing ProductLinks where the target product is also
      available in the current site.



---

### getProductSetProducts()
- getProductSetProducts(): [Collection](dw.util.Collection.md)
  - : Returns a collection of all products which are assigned to this product
      and which are also available through the current site.  If this product
      does not represent a product set then an empty collection will be
      returned.


    **Returns:**
    - Collection of products which are assigned to this product
      and which are also available through the current site.



---

### getProductSets()
- getProductSets(): [Collection](dw.util.Collection.md)
  - : Returns a collection of all product sets in which this product is included.
      The method only returns product sets assigned to the current site.


    **Returns:**
    - Collection of product sets in which this product is included, possibly empty.


---

### getRecommendations()
- getRecommendations(): [Collection](dw.util.Collection.md)
  - : Returns the outgoing recommendations for this product which
      belong to the site catalog.  If this product is not assigned to the site
      catalog, or there is no site catalog, an empty collection is returned.
      Only recommendations for which the target product exists and is assigned
      to the site catalog are returned.  The recommendations are sorted by
      their explicitly set order.


    **Returns:**
    - the sorted collection of recommendations, never null but possibly empty.


---

### getRecommendations(Number)
- getRecommendations(type: [Number](TopLevel.Number.md)): [Collection](dw.util.Collection.md)
  - : Returns the outgoing recommendations for this product which are of the
      specified type and which belong to the site catalog.  Behaves the same as
      [getRecommendations()](dw.catalog.Product.md#getrecommendations) but additionally filters by recommendation
      type.


    **Parameters:**
    - type - the recommendation type.

    **Returns:**
    - the sorted collection of recommendations, never null but possibly empty.


---

### getSearchPlacement()
- getSearchPlacement(): [Number](TopLevel.Number.md)
  - : Returns the product's search placement classification. The higher the
      numeric product placement value, the more relevant is the product when
      sorting search results. The range of numeric placement values is
      defined in the meta data of object type 'Product' and can therefore be
      customized.


    **Returns:**
    - The product's search placement classification.


---

### getSearchRank()
- getSearchRank(): [Number](TopLevel.Number.md)
  - : Returns the product's search rank. The higher the numeric product rank,
      the more relevant is the product when sorting search results. The range of
      numeric rank values is defined in the meta data of object type 'Product'
      and can therefore be customized.


    **Returns:**
    - The product's search rank.


---

### getSearchableFlag()
- getSearchableFlag(): [Boolean](TopLevel.Boolean.md)
  - : Returns, whether the product is currently searchable.

    **Returns:**
    - the searchable status flag of the product.


---

### getSearchableIfUnavailableFlag()
- getSearchableIfUnavailableFlag(): [Boolean](TopLevel.Boolean.md)
  - : Returns the searchable status of the [Product](dw.catalog.Product.md) if unavailable.
      
      Besides `true` or `false`, the return value `null` indicates that the value is not set.


    **Returns:**
    - The searchable status of the product if unavailable or `null` if not set.


---

### getShortDescription()
- getShortDescription(): [MarkupText](dw.content.MarkupText.md)
  - : Returns the product's short description in the current locale.

    **Returns:**
    - the product's short description in the current locale, or null if it
              wasn't found.



---

### getSiteMapChangeFrequency()
- getSiteMapChangeFrequency(): [String](TopLevel.String.md)
  - : Returns the product's change frequency needed for the sitemap creation.

    **Returns:**
    - The product's sitemap change frequency.


---

### getSiteMapIncluded()
- getSiteMapIncluded(): [Number](TopLevel.Number.md)
  - : Returns the status if the product is included into the sitemap.

    **Returns:**
    - the value of the attribute 'siteMapIncluded'.


---

### getSiteMapPriority()
- getSiteMapPriority(): [Number](TopLevel.Number.md)
  - : Returns the product's priority needed for the sitemap creation.

    **Returns:**
    - The product's sitemap priority.


---

### getStepQuantity()
- getStepQuantity(): [Quantity](dw.value.Quantity.md)
  - : Returns the steps in which the order amount of the product can be
      increased.


    **Returns:**
    - the order amount by which the product can be increased.


---

### getStoreReceiptName()
- getStoreReceiptName(): [String](TopLevel.String.md)
  - : Returns the store receipt name of the product in the current locale.

    **Returns:**
    - The store receipt name of the product for the current locale, or null if it
              wasn't found.



---

### getStoreTaxClass()
- getStoreTaxClass(): [String](TopLevel.String.md)
  - : Returns the store tax class ID.
      
      This is an optional override for in-store tax calculation.


    **Returns:**
    - the store tax class id.


---

### getTaxClassID()
- getTaxClassID(): [String](TopLevel.String.md)
  - : Returns the ID of the product's tax class, by resolving
      the Global Preference setting selected. If the Localized
      Tax Class setting under Global Preferences -> Products is
      selected, the localizedTaxClassID attribute value will be
      returned, else the legacy taxClassID attribute value will
      be returned.


    **Returns:**
    - the ID of the product's tax class depending on the Global Preference setting selected for Products.


---

### getTemplate()
- getTemplate(): [String](TopLevel.String.md)
  - : Returns the name of the product's rendering template.

    **Returns:**
    - the name of the product's rendering template.


---

### getThumbnail()
- ~~getThumbnail(): [MediaFile](dw.content.MediaFile.md)~~
  - : Returns the product's thumbnail image.

    **Returns:**
    - the product's thumbnail image.

    **Deprecated:**
:::warning

Commerce Cloud Digital introduces a new more powerful product
image management. It allows to group product images by self-defined view types
(e.g. 'large', 'thumbnail', 'swatch') and variation values (e.g. for attribute
color 'red', 'blue'). Images can be annotated with pattern based title and
alt. Product images can be accessed from Digital locations or external storage
locations.


Please use the new product image management. Therefore you have to set
up the common product image settings like view types, image location,
default image alt and title for your catalogs first. After that you can
group your product images by the previously defined view types in context
of a product. Finally use [getImages(String)](dw.catalog.Product.md#getimagesstring) and
[getImage(String, Number)](dw.catalog.Product.md#getimagestring-number) to access your images.

:::

---

### getUPC()
- getUPC(): [String](TopLevel.String.md)
  - : Returns the Universal Product Code of the product.

    **Returns:**
    - the Universal Product Code of the product.


---

### getUnit()
- getUnit(): [String](TopLevel.String.md)
  - : Returns the product's sales unit.

    **Returns:**
    - the products sales unit.


---

### getUnitQuantity()
- getUnitQuantity(): [Quantity](dw.value.Quantity.md)
  - : Returns the product's unit quantity.

    **Returns:**
    - the products unit quantity.


---

### getVariants()
- getVariants(): [Collection](dw.util.Collection.md)
  - : Returns a collection of all variants assigned to this variation master
      or variation group product. All variants are returned regardless of whether
      they are online or offline.
      
      If this product does not represent a variation master or variation group
      product then an empty collection is returned.


    **Returns:**
    - Collection of variants associated with this variation master or
              variation group product.



---

### getVariationGroups()
- getVariationGroups(): [Collection](dw.util.Collection.md)
  - : Returns a collection of all variation groups assigned to this variation
      master product. All variation groups are returned regardless of whether
      they are online or offline.
      
      If this product does not represent a variation master product then an
      empty collection is returned.


    **Returns:**
    - Collection of variation groups associated with this variation
      master product.



---

### getVariationModel()
- getVariationModel(): [ProductVariationModel](dw.catalog.ProductVariationModel.md)
  - : Returns the variation model of this product. If this product is a master
      product, then the returned model will encapsulate all the information
      about its variation attributes and variants. If this product is a variant
      product, then the returned model will encapsulate all the same
      information, but additionally pre-select all the variation attribute
      values of this variant. (See [ProductVariationModel](dw.catalog.ProductVariationModel.md) for
      details on what "selected" means.) If this product is neither a master
      product or a variation product, then a model will be returned but will be
      essentially empty and not useful for any particular purpose.


    **Returns:**
    - the variation model of the product.


---

### includedInBundle(Product)
- includedInBundle(product: [Product](dw.catalog.Product.md)): [Boolean](TopLevel.Boolean.md)
  - : Identifies if the specified product participates in this product bundle.
      If this product does not represent a bundle at all, then false will
      always be returned.


    **Parameters:**
    - product - the product to check for participation.

    **Returns:**
    - true if the product participates in the bundle, false otherwise.


---

### isAssignedToCategory(Category)
- isAssignedToCategory(category: [Category](dw.catalog.Category.md)): [Boolean](TopLevel.Boolean.md)
  - : Returns 'true' if item is assigned to the specified
      category.


    **Parameters:**
    - category - the category to check.

    **Returns:**
    - true if item is assigned to category.


---

### isAssignedToSiteCatalog()
- isAssignedToSiteCatalog(): [Boolean](TopLevel.Boolean.md)
  - : Returns `true` if the product is assigned to the current site (via the site catalog), otherwise
      `false` is returned.
      
      
      In case of the product being a variant, the variant will be considered as assigned if its master, one of the
      variation groups it is in or itself is assigned to the site catalog. In case this is triggered for a variation
      group the variation group is considered as assigned if its master or itself is assigned.


    **Returns:**
    - 'true' if product assigned to the site catalog


---

### isAvailable()
- ~~isAvailable(): [Boolean](TopLevel.Boolean.md)~~
  - : Identifies if the product is available.

    **Returns:**
    - the value of the attribute 'available'.

    **Deprecated:**
:::warning
Use [getAvailabilityModel()](dw.catalog.Product.md#getavailabilitymodel).isInStock() instead
:::

---

### isBundle()
- isBundle(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if this product instance is a product bundle.

    **Returns:**
    - true if the product is a bundle, false otherwise.


---

### isBundled()
- isBundled(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if this product instance is bundled within at least one
      product bundle.


    **Returns:**
    - true if the product is bundled, false otherwise.


---

### isCategorized()
- isCategorized(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if this product is bound to at least one catalog category.

    **Returns:**
    - true if the product is bound to at least one catalog category,
              false otherwise.



---

### isFacebookEnabled()
- isFacebookEnabled(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if the product is Facebook enabled.

    **Returns:**
    - the value of the attribute 'facebookEnabled'.


---

### isMaster()
- isMaster(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if this product instance is a product master.

    **Returns:**
    - true if the product is a master, false otherwise.


---

### isOnline()
- isOnline(): [Boolean](TopLevel.Boolean.md)
  - : Returns the online status of the product. The online status
      is calculated from the online status flag and the onlineFrom
      onlineTo dates defined for the product.


    **Returns:**
    - the online status of the product.


---

### isOptionProduct()
- isOptionProduct(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if the product has options.

    **Returns:**
    - true if product has options, false otherwise.


---

### isPinterestEnabled()
- isPinterestEnabled(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if the product is Pinterest enabled.

    **Returns:**
    - the value of the attribute 'pinterestEnabled'.


---

### isProduct()
- isProduct(): [Boolean](TopLevel.Boolean.md)
  - : Returns 'true' if the instance represents a product. Returns 'false' if
      the instance represents a product set.


    **Returns:**
    - true if the instance is a product, false otherwise.

    **See Also:**
    - [isProductSet()](dw.catalog.Product.md#isproductset)


---

### isProductSet()
- isProductSet(): [Boolean](TopLevel.Boolean.md)
  - : Returns 'true' if the instance represents a product set, otherwise 'false'.

    **Returns:**
    - true if the instance is a product set, false otherwise.

    **See Also:**
    - [isProduct()](dw.catalog.Product.md#isproduct)


---

### isProductSetProduct()
- isProductSetProduct(): [Boolean](TopLevel.Boolean.md)
  - : Returns true if this product is part of any product set, otherwise false.

    **Returns:**
    - true if the product is part of any product set, false otherwise.


---

### isRetailSet()
- ~~isRetailSet(): [Boolean](TopLevel.Boolean.md)~~
  - : Identifies if this product instance is part of a retail set.

    **Returns:**
    - true if the product is part of a retail set, false otherwise.

    **Deprecated:**
:::warning
Use [isProductSet()](dw.catalog.Product.md#isproductset) instead
:::

---

### isSearchable()
- isSearchable(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if the product is searchable.

    **Returns:**
    - the value of the attribute 'searchable'.


---

### isSiteProduct()
- ~~isSiteProduct(): [Boolean](TopLevel.Boolean.md)~~
  - : Returns 'true' if the product is assigned to the current site (via the
      site catalog), otherwise 'false' is returned.


    **Returns:**
    - 'true' if product assigned to site.

    **Deprecated:**
:::warning
Use [isAssignedToSiteCatalog()](dw.catalog.Product.md#isassignedtositecatalog) instead
:::

---

### isVariant()
- isVariant(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if this product instance is mastered by a product master.

    **Returns:**
    - true if the product is mastered, false otherwise.


---

### isVariationGroup()
- isVariationGroup(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if this product instance is a variation group product.

    **Returns:**
    - true if the product is a variation group, false otherwise.


---

### setAvailableFlag(Boolean)
- ~~setAvailableFlag(available: [Boolean](TopLevel.Boolean.md)): void~~
  - : Set the availability status flag of the product.

    **Parameters:**
    - available - Availability status flag.

    **Deprecated:**
:::warning
Don't use this method anymore.
:::

---

### setOnlineFlag(Boolean) - Variant 1
- setOnlineFlag(online: [Boolean](TopLevel.Boolean.md)): void
  - : Set the online status flag of the product.

    **Parameters:**
    - online - Online status flag.

    **API Version:**
:::note
No longer available as of version 10.6.
:::

---

### setOnlineFlag(Boolean) - Variant 2
- setOnlineFlag(online: [Boolean](TopLevel.Boolean.md)): void
  - : Set the online status flag of the product for the current site. If current site is not available (i.e.
      in case this method is called by a job that runs on organization level) the online status flag is set global,
      which can affect all sites.
      
      In previous versions this method set the online status flag global, instead of site specific.


    **Parameters:**
    - online - Online status flag.

    **API Version:**
:::note
Available from version 10.6.
In prior versions this method set the online status flag global, instead of site specific.
:::

---

### setSearchPlacement(Number) - Variant 1
- setSearchPlacement(placement: [Number](TopLevel.Number.md)): void
  - : Set the product's search placement.

    **Parameters:**
    - placement - The product's search placement classification.

    **API Version:**
:::note
No longer available as of version 10.6.
:::

---

### setSearchPlacement(Number) - Variant 2
- setSearchPlacement(placement: [Number](TopLevel.Number.md)): void
  - : Set the product's search placement classification in context of the current site. If current site is not
      available (i.e. in case this method is called by a job that runs on organization level) the search placement is
      set global, which can affect all sites.
      
      In previous versions this method set the search placement classification global, instead of site specific.


    **Parameters:**
    - placement - The product's search placement classification.

    **API Version:**
:::note
Available from version 10.6.
In prior versions this method set the search placement classification global, instead of site specific.
:::

---

### setSearchRank(Number) - Variant 1
- setSearchRank(rank: [Number](TopLevel.Number.md)): void
  - : Set the product's search rank.

    **Parameters:**
    - rank - The product's search rank.

    **API Version:**
:::note
No longer available as of version 10.6.
:::

---

### setSearchRank(Number) - Variant 2
- setSearchRank(rank: [Number](TopLevel.Number.md)): void
  - : Set the product's search rank in context of the current site. If current site is not available (i.e. in case this
      method is called by a job that runs on organization level) the search rank is set global, which can affect all
      sites.
      
      In previous versions this method set the search rank global, instead of site specific.


    **Parameters:**
    - rank - The product's search rank.

    **API Version:**
:::note
Available from version 10.6.
In prior versions this method set the search rank global, instead of site specific.
:::

---

### setSearchableFlag(Boolean) - Variant 1
- setSearchableFlag(searchable: [Boolean](TopLevel.Boolean.md)): void
  - : Set the flag indicating whether the product is searchable or not.

    **Parameters:**
    - searchable - The value of the attribute 'searchable'.

    **API Version:**
:::note
No longer available as of version 10.6.
:::

---

### setSearchableFlag(Boolean) - Variant 2
- setSearchableFlag(searchable: [Boolean](TopLevel.Boolean.md)): void
  - : Set the flag indicating whether the product is searchable or not in context of the current site. If current site
      is not available (i.e. in case this method is called by a job that runs on organization level) the searchable
      flag is set global, which can affect all sites.
      
      In previous versions this method set the searchable flag global, instead of site specific.


    **Parameters:**
    - searchable - The value of the attribute 'searchable'.

    **API Version:**
:::note
Available from version 10.6.
In prior versions this method set the searchable flag global, instead of site specific.
:::

---

<!-- prettier-ignore-end -->
