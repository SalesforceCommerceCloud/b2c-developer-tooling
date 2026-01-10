<!-- prettier-ignore-start -->
# Class Category

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)
      - [dw.catalog.Category](dw.catalog.Category.md)

Represents a category in a product catalog.


## Constant Summary

| Constant | Description |
| --- | --- |
| [DISPLAY_MODE_INDIVIDUAL](#display_mode_individual): [Number](TopLevel.Number.md) = 0 | Constant representing the Variation Group Display Mode individual setting. |
| [DISPLAY_MODE_MERGED](#display_mode_merged): [Number](TopLevel.Number.md) = 1 | Constant representing the Variation Group Display Mode merged setting. |

## Property Summary

| Property | Description |
| --- | --- |
| [ID](#id): [String](TopLevel.String.md) `(read-only)` | Returns the id of the category. |
| [allRecommendations](#allrecommendations): [Collection](dw.util.Collection.md) `(read-only)` | Returns all outgoing recommendations for this category. |
| [categoryAssignments](#categoryassignments): [Collection](dw.util.Collection.md) `(read-only)` | Returns a collection of category assignments of the category. |
| [defaultSortingRule](#defaultsortingrule): [SortingRule](dw.catalog.SortingRule.md) `(read-only)` | Returns the default sorting rule configured for this category,  or `null` if there is no default rule to be applied for it. |
| [description](#description): [String](TopLevel.String.md) `(read-only)` | Returns the description of the catalog category for the current locale. |
| [displayMode](#displaymode): [Number](TopLevel.Number.md) | Returns the Variation Groups Display Mode of the category or null if no display mode is defined. |
| [displayName](#displayname): [String](TopLevel.String.md) `(read-only)` | Returns the display name of the of the catalog category for the current locale. |
| [image](#image): [MediaFile](dw.content.MediaFile.md) `(read-only)` | Returns the image reference of this catalog category. |
| [incomingCategoryLinks](#incomingcategorylinks): [Collection](dw.util.Collection.md) `(read-only)` | Returns the collection of [CategoryLink](dw.catalog.CategoryLink.md) objects for which this category  is the target. |
| [online](#online): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns the value indicating whether the catalog category is "currently  online". |
| [onlineCategoryAssignments](#onlinecategoryassignments): [Collection](dw.util.Collection.md) `(read-only)` | Returns a collection of category assignments of the category where the  referenced product is currently online. |
| [onlineFlag](#onlineflag): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns the online status flag of the category. |
| [onlineFrom](#onlinefrom): [Date](TopLevel.Date.md) `(read-only)` | Returns the date from which the category is online or valid. |
| [onlineIncomingCategoryLinks](#onlineincomingcategorylinks): [Collection](dw.util.Collection.md) `(read-only)` | Returns the collection of [CategoryLink](dw.catalog.CategoryLink.md) objects for  which this category is the target. |
| [onlineOutgoingCategoryLinks](#onlineoutgoingcategorylinks): [Collection](dw.util.Collection.md) `(read-only)` | Returns the collection of [CategoryLink](dw.catalog.CategoryLink.md) objects for  which this category is the source. |
| [onlineProducts](#onlineproducts): [Collection](dw.util.Collection.md) `(read-only)` | Returns online products assigned to this category. |
| [onlineSubCategories](#onlinesubcategories): [Collection](dw.util.Collection.md) `(read-only)` | Returns a sorted collection of currently online subcategories of this  catalog category. |
| [onlineTo](#onlineto): [Date](TopLevel.Date.md) `(read-only)` | Returns the date until which the category is online or valid. |
| [orderableRecommendations](#orderablerecommendations): [Collection](dw.util.Collection.md) `(read-only)` | Returns a list of outgoing recommendations for this category. |
| [outgoingCategoryLinks](#outgoingcategorylinks): [Collection](dw.util.Collection.md) `(read-only)` | Returns the collection of [CategoryLink](dw.catalog.CategoryLink.md) objects for which this category  is the source. |
| [pageDescription](#pagedescription): [String](TopLevel.String.md) `(read-only)` | Returns the page description of this category for the default locale or null if not defined. |
| [pageKeywords](#pagekeywords): [String](TopLevel.String.md) `(read-only)` | Returns the page keywords of this category for the default locale or null if not defined. |
| [pageTitle](#pagetitle): [String](TopLevel.String.md) `(read-only)` | Returns the page title of this category for the default locale or null if not defined. |
| [pageURL](#pageurl): [String](TopLevel.String.md) `(read-only)` | Returns the page URL property of this category or null if not defined. |
| [parent](#parent): [Category](dw.catalog.Category.md) `(read-only)` | Returns the parent of this category. |
| [productAttributeModel](#productattributemodel): [ProductAttributeModel](dw.catalog.ProductAttributeModel.md) `(read-only)` | Returns this category's ProductAttributeModel, which makes access to the  category's attribute information convenient. |
| [products](#products): [Collection](dw.util.Collection.md) `(read-only)` | Returns all products assigned to this category. |
| [recommendations](#recommendations): [Collection](dw.util.Collection.md) `(read-only)` | Returns the outgoing recommendations for this category. |
| [root](#root): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if the category is the root category of its catalog. |
| [searchPlacement](#searchplacement): [Number](TopLevel.Number.md) | Returns the search placement of the category or null of no search placement is defined. |
| [searchRank](#searchrank): [Number](TopLevel.Number.md) | Returns the search rank of the category or null of no search rank is defined. |
| [siteMapChangeFrequency](#sitemapchangefrequency): [String](TopLevel.String.md) `(read-only)` | Returns the category's sitemap change frequency. |
| [siteMapIncluded](#sitemapincluded): [Number](TopLevel.Number.md) `(read-only)` | Returns the category's sitemap inclusion. |
| [siteMapPriority](#sitemappriority): [Number](TopLevel.Number.md) `(read-only)` | Returns the category's sitemap priority. |
| [subCategories](#subcategories): [Collection](dw.util.Collection.md) `(read-only)` | Returns a sorted collection of the subcategories of this catalog category,  including both online and offline subcategories. |
| [template](#template): [String](TopLevel.String.md) `(read-only)` | Returns the template property value , which is the file name of the template  used to display the catalog category. |
| [thumbnail](#thumbnail): [MediaFile](dw.content.MediaFile.md) `(read-only)` | Returns the thumbnail image reference of this catalog category. |
| [topLevel](#toplevel): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns true if the category is a top level category, but not the root  category. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getAllRecommendations](dw.catalog.Category.md#getallrecommendations)() | Returns all outgoing recommendations for this category. |
| [getAllRecommendations](dw.catalog.Category.md#getallrecommendationsnumber)([Number](TopLevel.Number.md)) | Returns all outgoing recommendations for this category which are of the  specified type. |
| [getCategoryAssignments](dw.catalog.Category.md#getcategoryassignments)() | Returns a collection of category assignments of the category. |
| [getDefaultSortingRule](dw.catalog.Category.md#getdefaultsortingrule)() | Returns the default sorting rule configured for this category,  or `null` if there is no default rule to be applied for it. |
| [getDescription](dw.catalog.Category.md#getdescription)() | Returns the description of the catalog category for the current locale. |
| [getDisplayMode](dw.catalog.Category.md#getdisplaymode)() | Returns the Variation Groups Display Mode of the category or null if no display mode is defined. |
| [getDisplayName](dw.catalog.Category.md#getdisplayname)() | Returns the display name of the of the catalog category for the current locale. |
| [getID](dw.catalog.Category.md#getid)() | Returns the id of the category. |
| [getImage](dw.catalog.Category.md#getimage)() | Returns the image reference of this catalog category. |
| [getIncomingCategoryLinks](dw.catalog.Category.md#getincomingcategorylinks)() | Returns the collection of [CategoryLink](dw.catalog.CategoryLink.md) objects for which this category  is the target. |
| [getIncomingCategoryLinks](dw.catalog.Category.md#getincomingcategorylinksnumber)([Number](TopLevel.Number.md)) | Returns the collection of [CategoryLink](dw.catalog.CategoryLink.md) objects for which this category  is the target and which are of the specified type. |
| [getOnlineCategoryAssignments](dw.catalog.Category.md#getonlinecategoryassignments)() | Returns a collection of category assignments of the category where the  referenced product is currently online. |
| [getOnlineFlag](dw.catalog.Category.md#getonlineflag)() | Returns the online status flag of the category. |
| [getOnlineFrom](dw.catalog.Category.md#getonlinefrom)() | Returns the date from which the category is online or valid. |
| [getOnlineIncomingCategoryLinks](dw.catalog.Category.md#getonlineincomingcategorylinks)() | Returns the collection of [CategoryLink](dw.catalog.CategoryLink.md) objects for  which this category is the target. |
| [getOnlineOutgoingCategoryLinks](dw.catalog.Category.md#getonlineoutgoingcategorylinks)() | Returns the collection of [CategoryLink](dw.catalog.CategoryLink.md) objects for  which this category is the source. |
| [getOnlineProducts](dw.catalog.Category.md#getonlineproducts)() | Returns online products assigned to this category. |
| [getOnlineSubCategories](dw.catalog.Category.md#getonlinesubcategories)() | Returns a sorted collection of currently online subcategories of this  catalog category. |
| [getOnlineTo](dw.catalog.Category.md#getonlineto)() | Returns the date until which the category is online or valid. |
| [getOrderableRecommendations](dw.catalog.Category.md#getorderablerecommendations)() | Returns a list of outgoing recommendations for this category. |
| [getOrderableRecommendations](dw.catalog.Category.md#getorderablerecommendationsnumber)([Number](TopLevel.Number.md)) | Returns a list of outgoing recommendations for this category. |
| [getOutgoingCategoryLinks](dw.catalog.Category.md#getoutgoingcategorylinks)() | Returns the collection of [CategoryLink](dw.catalog.CategoryLink.md) objects for which this category  is the source. |
| [getOutgoingCategoryLinks](dw.catalog.Category.md#getoutgoingcategorylinksnumber)([Number](TopLevel.Number.md)) | Returns the collection of [CategoryLink](dw.catalog.CategoryLink.md) objects for which this category  is the source and which are of the specified type. |
| [getPageDescription](dw.catalog.Category.md#getpagedescription)() | Returns the page description of this category for the default locale or null if not defined. |
| [getPageKeywords](dw.catalog.Category.md#getpagekeywords)() | Returns the page keywords of this category for the default locale or null if not defined. |
| [getPageTitle](dw.catalog.Category.md#getpagetitle)() | Returns the page title of this category for the default locale or null if not defined. |
| [getPageURL](dw.catalog.Category.md#getpageurl)() | Returns the page URL property of this category or null if not defined. |
| [getParent](dw.catalog.Category.md#getparent)() | Returns the parent of this category. |
| [getProductAttributeModel](dw.catalog.Category.md#getproductattributemodel)() | Returns this category's ProductAttributeModel, which makes access to the  category's attribute information convenient. |
| [getProducts](dw.catalog.Category.md#getproducts)() | Returns all products assigned to this category. |
| [getRecommendations](dw.catalog.Category.md#getrecommendations)() | Returns the outgoing recommendations for this category. |
| [getRecommendations](dw.catalog.Category.md#getrecommendationsnumber)([Number](TopLevel.Number.md)) | Returns the outgoing recommendations for this category which are of the  specified type. |
| [getSearchPlacement](dw.catalog.Category.md#getsearchplacement)() | Returns the search placement of the category or null of no search placement is defined. |
| [getSearchRank](dw.catalog.Category.md#getsearchrank)() | Returns the search rank of the category or null of no search rank is defined. |
| [getSiteMapChangeFrequency](dw.catalog.Category.md#getsitemapchangefrequency)() | Returns the category's sitemap change frequency. |
| [getSiteMapIncluded](dw.catalog.Category.md#getsitemapincluded)() | Returns the category's sitemap inclusion. |
| [getSiteMapPriority](dw.catalog.Category.md#getsitemappriority)() | Returns the category's sitemap priority. |
| [getSubCategories](dw.catalog.Category.md#getsubcategories)() | Returns a sorted collection of the subcategories of this catalog category,  including both online and offline subcategories. |
| [getTemplate](dw.catalog.Category.md#gettemplate)() | Returns the template property value , which is the file name of the template  used to display the catalog category. |
| [getThumbnail](dw.catalog.Category.md#getthumbnail)() | Returns the thumbnail image reference of this catalog category. |
| [hasOnlineProducts](dw.catalog.Category.md#hasonlineproducts)() | Returns true if this catalog category has any online products assigned. |
| [hasOnlineSubCategories](dw.catalog.Category.md#hasonlinesubcategories)() | Returns true if this catalog category has any online subcategories. |
| [isDirectSubCategoryOf](dw.catalog.Category.md#isdirectsubcategoryofcategory)([Category](dw.catalog.Category.md)) | Returns true if this category is a direct sub-category of the provided  category. |
| [isOnline](dw.catalog.Category.md#isonline)() | Returns the value indicating whether the catalog category is "currently  online". |
| [isRoot](dw.catalog.Category.md#isroot)() | Identifies if the category is the root category of its catalog. |
| [isSubCategoryOf](dw.catalog.Category.md#issubcategoryofcategory)([Category](dw.catalog.Category.md)) | Returns true if this category is a sub-category of the provided category. |
| [isTopLevel](dw.catalog.Category.md#istoplevel)() | Returns true if the category is a top level category, but not the root  category. |
| [setDisplayMode](dw.catalog.Category.md#setdisplaymodenumber)([Number](TopLevel.Number.md)) | Set the category's Variation Groups Display Mode. |
| [setSearchPlacement](dw.catalog.Category.md#setsearchplacementnumber)([Number](TopLevel.Number.md)) | Set the category's search placement. |
| [setSearchRank](dw.catalog.Category.md#setsearchranknumber)([Number](TopLevel.Number.md)) | Set the category's search rank. |

### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### DISPLAY_MODE_INDIVIDUAL

- DISPLAY_MODE_INDIVIDUAL: [Number](TopLevel.Number.md) = 0
  - : Constant representing the Variation Group Display Mode individual setting.


---

### DISPLAY_MODE_MERGED

- DISPLAY_MODE_MERGED: [Number](TopLevel.Number.md) = 1
  - : Constant representing the Variation Group Display Mode merged setting.


---

## Property Details

### ID
- ID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the id of the category.


---

### allRecommendations
- allRecommendations: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns all outgoing recommendations for this category.  The
      recommendations are sorted by their explicitly set order.



---

### categoryAssignments
- categoryAssignments: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns a collection of category assignments of the category.


---

### defaultSortingRule
- defaultSortingRule: [SortingRule](dw.catalog.SortingRule.md) `(read-only)`
  - : Returns the default sorting rule configured for this category,
      or `null` if there is no default rule to be applied for it.
      
      This method returns the default rule for the parent category if this
      category inherits one.  The parent category may inherit its default
      rule from its parent, and so on, up to the root category.
      
      This method returns `null` if no ancestor category for this
      category has a default rule.



---

### description
- description: [String](TopLevel.String.md) `(read-only)`
  - : Returns the description of the catalog category for the current locale.


---

### displayMode
- displayMode: [Number](TopLevel.Number.md)
  - : Returns the Variation Groups Display Mode of the category or null if no display mode is defined.


---

### displayName
- displayName: [String](TopLevel.String.md) `(read-only)`
  - : Returns the display name of the of the catalog category for the current locale.
      
      This value is intended to be used as the
      external visible name of the catalog category.



---

### image
- image: [MediaFile](dw.content.MediaFile.md) `(read-only)`
  - : Returns the image reference of this catalog category.


---

### incomingCategoryLinks
- incomingCategoryLinks: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns the collection of [CategoryLink](dw.catalog.CategoryLink.md) objects for which this category
      is the target.  If the source category of a link belongs to a different
      catalog than the catalog owning this category, it is not returned.



---

### online
- online: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns the value indicating whether the catalog category is "currently
      online".  A category is currently online if its online flag equals true
      and the current site date is within the date range defined by the
      onlineFrom and onlineTo attributes.



---

### onlineCategoryAssignments
- onlineCategoryAssignments: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns a collection of category assignments of the category where the
      referenced product is currently online. When checking the online status
      of the product, the online flag and the online from & to dates are taken
      into account. Online flag, online from & to dates set for the current site
      takes precedence over the default values.



---

### onlineFlag
- onlineFlag: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns the online status flag of the category.


---

### onlineFrom
- onlineFrom: [Date](TopLevel.Date.md) `(read-only)`
  - : Returns the date from which the category is online or valid.


---

### onlineIncomingCategoryLinks
- onlineIncomingCategoryLinks: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns the collection of [CategoryLink](dw.catalog.CategoryLink.md) objects for
      which this category is the target. If the source category of a link
      belongs to a different catalog than the catalog owning this category, it
      is not returned. Additionally, this method will only return a link if the
      source category is currently online. A category is currently online if
      its online flag equals true and the current site date is within the date
      range defined by the onlineFrom and onlineTo attributes.



---

### onlineOutgoingCategoryLinks
- onlineOutgoingCategoryLinks: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns the collection of [CategoryLink](dw.catalog.CategoryLink.md) objects for
      which this category is the source. If the target category of a link
      belongs to a different catalog than the catalog owning this category, it
      is not returned. Additionally, this method will only return a link if the
      target category is currently online. A category is currently online if
      its online flag equals true and the current site date is within the date
      range defined by the onlineFrom and onlineTo attributes.



---

### onlineProducts
- onlineProducts: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns online products assigned to this category.
      Offline products are not included in the returned collection.
      When checking the online status of the product,
      the online flag and the online from & to dates are taken into account.
      Online flag, online from & to dates set for the current site takes precedence
      over the default values. 
      
      
      The order of products in the returned collection corresponds to the
      defined explicit sorting of products in this category.


    **See Also:**
    - [hasOnlineProducts()](dw.catalog.Category.md#hasonlineproducts)


---

### onlineSubCategories
- onlineSubCategories: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns a sorted collection of currently online subcategories of this
      catalog category.
      
      - A category is currently online if its online flag    equals true and the current site date is within the date range defined by    the onlineFrom and onlineTo attributes.   
      - The returned collection is sorted by position. Subcategories marked as    "unsorted" always appear after those marked as "sorted" but are otherwise    not in any guaranteed order.   
      - The returned collection contains direct subcategories only.    


    **See Also:**
    - [hasOnlineSubCategories()](dw.catalog.Category.md#hasonlinesubcategories)


---

### onlineTo
- onlineTo: [Date](TopLevel.Date.md) `(read-only)`
  - : Returns the date until which the category is online or valid.


---

### orderableRecommendations
- orderableRecommendations: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns a list of outgoing recommendations for this category. This method
      behaves similarly to [getRecommendations()](dw.catalog.Category.md#getrecommendations) but additionally filters out
      recommendations for which the target product is unorderable according to
      its product availability model.


    **See Also:**
    - [ProductAvailabilityModel.isOrderable()](dw.catalog.ProductAvailabilityModel.md#isorderable)


---

### outgoingCategoryLinks
- outgoingCategoryLinks: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns the collection of [CategoryLink](dw.catalog.CategoryLink.md) objects for which this category
      is the source.  If the target category of a link belongs to a different
      catalog than the catalog owning this category, it is not returned.
      The collection of links is sorted by the explicitly defined order
      for this category with unsorted links appearing at the end.



---

### pageDescription
- pageDescription: [String](TopLevel.String.md) `(read-only)`
  - : Returns the page description of this category for the default locale or null if not defined.


---

### pageKeywords
- pageKeywords: [String](TopLevel.String.md) `(read-only)`
  - : Returns the page keywords of this category for the default locale or null if not defined.


---

### pageTitle
- pageTitle: [String](TopLevel.String.md) `(read-only)`
  - : Returns the page title of this category for the default locale or null if not defined.


---

### pageURL
- pageURL: [String](TopLevel.String.md) `(read-only)`
  - : Returns the page URL property of this category or null if not defined.


---

### parent
- parent: [Category](dw.catalog.Category.md) `(read-only)`
  - : Returns the parent of this category.


---

### productAttributeModel
- productAttributeModel: [ProductAttributeModel](dw.catalog.ProductAttributeModel.md) `(read-only)`
  - : Returns this category's ProductAttributeModel, which makes access to the
      category's attribute information convenient. The model is calculated
      based on the attribute definitions assigned to this category and the
      global attribute definitions for the object type 'Product'.



---

### products
- products: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns all products assigned to this category.
      The order of products in the returned collection corresponds to the
      defined explicit sorting of products in this category.


    **See Also:**
    - [getOnlineProducts()](dw.catalog.Category.md#getonlineproducts)


---

### recommendations
- recommendations: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns the outgoing recommendations for this category.  If this category
      is not in the site catalog, or there is no site catalog, an empty
      collection is returned.  Only recommendations for which the target
      product exists and is assigned to the site catalog are returned.  The
      recommendations are sorted by their explicitly set order.



---

### root
- root: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if the category is the root category of its catalog.


---

### searchPlacement
- searchPlacement: [Number](TopLevel.Number.md)
  - : Returns the search placement of the category or null of no search placement is defined.


---

### searchRank
- searchRank: [Number](TopLevel.Number.md)
  - : Returns the search rank of the category or null of no search rank is defined.


---

### siteMapChangeFrequency
- siteMapChangeFrequency: [String](TopLevel.String.md) `(read-only)`
  - : Returns the category's sitemap change frequency.


---

### siteMapIncluded
- siteMapIncluded: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the category's sitemap inclusion.


---

### siteMapPriority
- siteMapPriority: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the category's sitemap priority.


---

### subCategories
- subCategories: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns a sorted collection of the subcategories of this catalog category,
      including both online and offline subcategories.
      
      - The returned collection is sorted by position. Subcategories marked as    "unsorted" always appear after those marked as "sorted" but are otherwise    not in any guaranteed order.   
      - The returned collection contains direct subcategories only.   


    **See Also:**
    - [getOnlineSubCategories()](dw.catalog.Category.md#getonlinesubcategories)


---

### template
- template: [String](TopLevel.String.md) `(read-only)`
  - : Returns the template property value , which is the file name of the template
      used to display the catalog category.



---

### thumbnail
- thumbnail: [MediaFile](dw.content.MediaFile.md) `(read-only)`
  - : Returns the thumbnail image reference of this catalog category.


---

### topLevel
- topLevel: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns true if the category is a top level category, but not the root
      category.



---

## Method Details

### getAllRecommendations()
- getAllRecommendations(): [Collection](dw.util.Collection.md)
  - : Returns all outgoing recommendations for this category.  The
      recommendations are sorted by their explicitly set order.


    **Returns:**
    - the sorted collection of recommendations, never null but possibly empty.


---

### getAllRecommendations(Number)
- getAllRecommendations(type: [Number](TopLevel.Number.md)): [Collection](dw.util.Collection.md)
  - : Returns all outgoing recommendations for this category which are of the
      specified type. The recommendations are sorted by their explicitly set
      order.


    **Parameters:**
    - type - the recommendation type.

    **Returns:**
    - the sorted collection of recommendations, never null but possibly empty.


---

### getCategoryAssignments()
- getCategoryAssignments(): [Collection](dw.util.Collection.md)
  - : Returns a collection of category assignments of the category.

    **Returns:**
    - Collection of category assignments of the category.


---

### getDefaultSortingRule()
- getDefaultSortingRule(): [SortingRule](dw.catalog.SortingRule.md)
  - : Returns the default sorting rule configured for this category,
      or `null` if there is no default rule to be applied for it.
      
      This method returns the default rule for the parent category if this
      category inherits one.  The parent category may inherit its default
      rule from its parent, and so on, up to the root category.
      
      This method returns `null` if no ancestor category for this
      category has a default rule.


    **Returns:**
    - the default SortingRule or null.


---

### getDescription()
- getDescription(): [String](TopLevel.String.md)
  - : Returns the description of the catalog category for the current locale.

    **Returns:**
    - The value of the property for the current locale, or null if it
              wasn't found.



---

### getDisplayMode()
- getDisplayMode(): [Number](TopLevel.Number.md)
  - : Returns the Variation Groups Display Mode of the category or null if no display mode is defined.

    **Returns:**
    - the value of the attribute 'displayMode' which is either [DISPLAY_MODE_MERGED](dw.catalog.Category.md#display_mode_merged) or
              [DISPLAY_MODE_INDIVIDUAL](dw.catalog.Category.md#display_mode_individual) or null if category is set to inherit the display mode.



---

### getDisplayName()
- getDisplayName(): [String](TopLevel.String.md)
  - : Returns the display name of the of the catalog category for the current locale.
      
      This value is intended to be used as the
      external visible name of the catalog category.


    **Returns:**
    - The value of the property for the current locale, or null if it
              wasn't found.



---

### getID()
- getID(): [String](TopLevel.String.md)
  - : Returns the id of the category.

    **Returns:**
    - the id of the category.


---

### getImage()
- getImage(): [MediaFile](dw.content.MediaFile.md)
  - : Returns the image reference of this catalog category.

    **Returns:**
    - the image reference for this category.


---

### getIncomingCategoryLinks()
- getIncomingCategoryLinks(): [Collection](dw.util.Collection.md)
  - : Returns the collection of [CategoryLink](dw.catalog.CategoryLink.md) objects for which this category
      is the target.  If the source category of a link belongs to a different
      catalog than the catalog owning this category, it is not returned.


    **Returns:**
    - a collection of [CategoryLink](dw.catalog.CategoryLink.md) objects, possibly empty but not null.


---

### getIncomingCategoryLinks(Number)
- getIncomingCategoryLinks(type: [Number](TopLevel.Number.md)): [Collection](dw.util.Collection.md)
  - : Returns the collection of [CategoryLink](dw.catalog.CategoryLink.md) objects for which this category
      is the target and which are of the specified type.  If the source
      category of a link belongs to a different catalog than the catalog owning
      this category, it is not returned.


    **Parameters:**
    - type - the link type type.

    **Returns:**
    - a collection of [CategoryLink](dw.catalog.CategoryLink.md) objects, possibly empty but not null.


---

### getOnlineCategoryAssignments()
- getOnlineCategoryAssignments(): [Collection](dw.util.Collection.md)
  - : Returns a collection of category assignments of the category where the
      referenced product is currently online. When checking the online status
      of the product, the online flag and the online from & to dates are taken
      into account. Online flag, online from & to dates set for the current site
      takes precedence over the default values.


    **Returns:**
    - Collection of online category assignments of the category.


---

### getOnlineFlag()
- getOnlineFlag(): [Boolean](TopLevel.Boolean.md)
  - : Returns the online status flag of the category.

    **Returns:**
    - the online status flag of the category.


---

### getOnlineFrom()
- getOnlineFrom(): [Date](TopLevel.Date.md)
  - : Returns the date from which the category is online or valid.

    **Returns:**
    - the date from which the category is online or valid.


---

### getOnlineIncomingCategoryLinks()
- getOnlineIncomingCategoryLinks(): [Collection](dw.util.Collection.md)
  - : Returns the collection of [CategoryLink](dw.catalog.CategoryLink.md) objects for
      which this category is the target. If the source category of a link
      belongs to a different catalog than the catalog owning this category, it
      is not returned. Additionally, this method will only return a link if the
      source category is currently online. A category is currently online if
      its online flag equals true and the current site date is within the date
      range defined by the onlineFrom and onlineTo attributes.


    **Returns:**
    - a collection of [CategoryLink](dw.catalog.CategoryLink.md) objects, possibly
              empty but not null.



---

### getOnlineOutgoingCategoryLinks()
- getOnlineOutgoingCategoryLinks(): [Collection](dw.util.Collection.md)
  - : Returns the collection of [CategoryLink](dw.catalog.CategoryLink.md) objects for
      which this category is the source. If the target category of a link
      belongs to a different catalog than the catalog owning this category, it
      is not returned. Additionally, this method will only return a link if the
      target category is currently online. A category is currently online if
      its online flag equals true and the current site date is within the date
      range defined by the onlineFrom and onlineTo attributes.


    **Returns:**
    - a collection of [CategoryLink](dw.catalog.CategoryLink.md) objects, possibly
              empty but not null.



---

### getOnlineProducts()
- getOnlineProducts(): [Collection](dw.util.Collection.md)
  - : Returns online products assigned to this category.
      Offline products are not included in the returned collection.
      When checking the online status of the product,
      the online flag and the online from & to dates are taken into account.
      Online flag, online from & to dates set for the current site takes precedence
      over the default values. 
      
      
      The order of products in the returned collection corresponds to the
      defined explicit sorting of products in this category.


    **Returns:**
    - a sorted collection of online products of this category.

    **See Also:**
    - [hasOnlineProducts()](dw.catalog.Category.md#hasonlineproducts)


---

### getOnlineSubCategories()
- getOnlineSubCategories(): [Collection](dw.util.Collection.md)
  - : Returns a sorted collection of currently online subcategories of this
      catalog category.
      
      - A category is currently online if its online flag    equals true and the current site date is within the date range defined by    the onlineFrom and onlineTo attributes.   
      - The returned collection is sorted by position. Subcategories marked as    "unsorted" always appear after those marked as "sorted" but are otherwise    not in any guaranteed order.   
      - The returned collection contains direct subcategories only.    


    **Returns:**
    - a sorted collection of currently online subcategories.

    **See Also:**
    - [hasOnlineSubCategories()](dw.catalog.Category.md#hasonlinesubcategories)


---

### getOnlineTo()
- getOnlineTo(): [Date](TopLevel.Date.md)
  - : Returns the date until which the category is online or valid.

    **Returns:**
    - the date until which the category is online or valid.


---

### getOrderableRecommendations()
- getOrderableRecommendations(): [Collection](dw.util.Collection.md)
  - : Returns a list of outgoing recommendations for this category. This method
      behaves similarly to [getRecommendations()](dw.catalog.Category.md#getrecommendations) but additionally filters out
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
  - : Returns a list of outgoing recommendations for this category. This method
      behaves similarly to [getRecommendations(Number)](dw.catalog.Category.md#getrecommendationsnumber) but additionally
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

### getOutgoingCategoryLinks()
- getOutgoingCategoryLinks(): [Collection](dw.util.Collection.md)
  - : Returns the collection of [CategoryLink](dw.catalog.CategoryLink.md) objects for which this category
      is the source.  If the target category of a link belongs to a different
      catalog than the catalog owning this category, it is not returned.
      The collection of links is sorted by the explicitly defined order
      for this category with unsorted links appearing at the end.


    **Returns:**
    - a collection of [CategoryLink](dw.catalog.CategoryLink.md) objects, possibly empty but not null.


---

### getOutgoingCategoryLinks(Number)
- getOutgoingCategoryLinks(type: [Number](TopLevel.Number.md)): [Collection](dw.util.Collection.md)
  - : Returns the collection of [CategoryLink](dw.catalog.CategoryLink.md) objects for which this category
      is the source and which are of the specified type.  If the target
      category of a link belongs to a different catalog than the catalog owning
      this category, it is not returned.  The collection of links is sorted by
      the explicitly defined order for this category with unsorted links
      appearing at the end.


    **Parameters:**
    - type - the link type type.

    **Returns:**
    - a collection of [CategoryLink](dw.catalog.CategoryLink.md) objects, possibly empty but not null.


---

### getPageDescription()
- getPageDescription(): [String](TopLevel.String.md)
  - : Returns the page description of this category for the default locale or null if not defined.

    **Returns:**
    - the value of the attribute 'pageDescription'.


---

### getPageKeywords()
- getPageKeywords(): [String](TopLevel.String.md)
  - : Returns the page keywords of this category for the default locale or null if not defined.

    **Returns:**
    - the value of the attribute 'pageKeywords'.


---

### getPageTitle()
- getPageTitle(): [String](TopLevel.String.md)
  - : Returns the page title of this category for the default locale or null if not defined.

    **Returns:**
    - the value of the attribute 'pageTitle'.


---

### getPageURL()
- getPageURL(): [String](TopLevel.String.md)
  - : Returns the page URL property of this category or null if not defined.

    **Returns:**
    - the value of the attribute 'pageURL'.


---

### getParent()
- getParent(): [Category](dw.catalog.Category.md)
  - : Returns the parent of this category.

    **Returns:**
    - a CatalogCategory instance representing
      the parent of this CatalogCategory or null.



---

### getProductAttributeModel()
- getProductAttributeModel(): [ProductAttributeModel](dw.catalog.ProductAttributeModel.md)
  - : Returns this category's ProductAttributeModel, which makes access to the
      category's attribute information convenient. The model is calculated
      based on the attribute definitions assigned to this category and the
      global attribute definitions for the object type 'Product'.


    **Returns:**
    - the ProductAttributeModel for this category.


---

### getProducts()
- getProducts(): [Collection](dw.util.Collection.md)
  - : Returns all products assigned to this category.
      The order of products in the returned collection corresponds to the
      defined explicit sorting of products in this category.


    **Returns:**
    - a sorted collection of all products of this category.

    **See Also:**
    - [getOnlineProducts()](dw.catalog.Category.md#getonlineproducts)


---

### getRecommendations()
- getRecommendations(): [Collection](dw.util.Collection.md)
  - : Returns the outgoing recommendations for this category.  If this category
      is not in the site catalog, or there is no site catalog, an empty
      collection is returned.  Only recommendations for which the target
      product exists and is assigned to the site catalog are returned.  The
      recommendations are sorted by their explicitly set order.


    **Returns:**
    - the sorted collection of recommendations, never null but possibly empty.


---

### getRecommendations(Number)
- getRecommendations(type: [Number](TopLevel.Number.md)): [Collection](dw.util.Collection.md)
  - : Returns the outgoing recommendations for this category which are of the
      specified type.  Behaves the same as [getRecommendations()](dw.catalog.Category.md#getrecommendations) but
      additionally filters by recommendation type.


    **Parameters:**
    - type - the recommendation type.

    **Returns:**
    - the sorted collection of recommendations, never null but possibly empty.


---

### getSearchPlacement()
- getSearchPlacement(): [Number](TopLevel.Number.md)
  - : Returns the search placement of the category or null of no search placement is defined.

    **Returns:**
    - the value of the attribute 'searchPlacement'.


---

### getSearchRank()
- getSearchRank(): [Number](TopLevel.Number.md)
  - : Returns the search rank of the category or null of no search rank is defined.

    **Returns:**
    - the value of the attribute 'searchRank'.


---

### getSiteMapChangeFrequency()
- getSiteMapChangeFrequency(): [String](TopLevel.String.md)
  - : Returns the category's sitemap change frequency.

    **Returns:**
    - the value of the attribute 'siteMapChangeFrequency'.


---

### getSiteMapIncluded()
- getSiteMapIncluded(): [Number](TopLevel.Number.md)
  - : Returns the category's sitemap inclusion.

    **Returns:**
    - the value of the attribute 'siteMapIncluded'.


---

### getSiteMapPriority()
- getSiteMapPriority(): [Number](TopLevel.Number.md)
  - : Returns the category's sitemap priority.

    **Returns:**
    - the value of the attribute 'siteMapPriority'.


---

### getSubCategories()
- getSubCategories(): [Collection](dw.util.Collection.md)
  - : Returns a sorted collection of the subcategories of this catalog category,
      including both online and offline subcategories.
      
      - The returned collection is sorted by position. Subcategories marked as    "unsorted" always appear after those marked as "sorted" but are otherwise    not in any guaranteed order.   
      - The returned collection contains direct subcategories only.   


    **Returns:**
    - a sorted collection of the subcategories.

    **See Also:**
    - [getOnlineSubCategories()](dw.catalog.Category.md#getonlinesubcategories)


---

### getTemplate()
- getTemplate(): [String](TopLevel.String.md)
  - : Returns the template property value , which is the file name of the template
      used to display the catalog category.


    **Returns:**
    - the value of the property 'template'.


---

### getThumbnail()
- getThumbnail(): [MediaFile](dw.content.MediaFile.md)
  - : Returns the thumbnail image reference of this catalog category.

    **Returns:**
    - the thumbnail image reference for this category.


---

### hasOnlineProducts()
- hasOnlineProducts(): [Boolean](TopLevel.Boolean.md)
  - : Returns true if this catalog category has any online products assigned.
      When checking the online status of the product,
      the online flag and the online from & to dates are taken into account.
      Online flag, online from & to dates set for the current site takes precedence
      over the default values.


    **Returns:**
    - true, if this category has at least one online product assigned,
              false otherwise.


    **See Also:**
    - [getOnlineProducts()](dw.catalog.Category.md#getonlineproducts)


---

### hasOnlineSubCategories()
- hasOnlineSubCategories(): [Boolean](TopLevel.Boolean.md)
  - : Returns true if this catalog category has any online subcategories.
      
      - A category is currently online if its online flag    equals true and the current site date is within the date range defined by    the onlineFrom and onlineTo attributes.   
      - Only direct subcategories are considered.   


    **Returns:**
    - true, if this category has at least one online subcategory,
              false otherwise.


    **See Also:**
    - [getOnlineSubCategories()](dw.catalog.Category.md#getonlinesubcategories)


---

### isDirectSubCategoryOf(Category)
- isDirectSubCategoryOf(parent: [Category](dw.catalog.Category.md)): [Boolean](TopLevel.Boolean.md)
  - : Returns true if this category is a direct sub-category of the provided
      category.


    **Parameters:**
    - parent - The parent category, must not be null.

    **Returns:**
    - True if this category is a direct sub-category of parent, false
              otherwise.



---

### isOnline()
- isOnline(): [Boolean](TopLevel.Boolean.md)
  - : Returns the value indicating whether the catalog category is "currently
      online".  A category is currently online if its online flag equals true
      and the current site date is within the date range defined by the
      onlineFrom and onlineTo attributes.


    **Returns:**
    - true if the category is currently online, false otherwise.


---

### isRoot()
- isRoot(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if the category is the root category of its catalog.

    **Returns:**
    - 'true' if the category is the root category of its catalog,
      'false' otherwise.



---

### isSubCategoryOf(Category)
- isSubCategoryOf(ancestor: [Category](dw.catalog.Category.md)): [Boolean](TopLevel.Boolean.md)
  - : Returns true if this category is a sub-category of the provided category.
      This can be either a direct or an indirect sub-category.


    **Parameters:**
    - ancestor - The ancestor category, must not be null.

    **Returns:**
    - true if this category is a sub-category of ancestor, false
              otherwise.



---

### isTopLevel()
- isTopLevel(): [Boolean](TopLevel.Boolean.md)
  - : Returns true if the category is a top level category, but not the root
      category.


    **Returns:**
    - True if the category is a direct sub-category of the root
              category, false otherwise.



---

### setDisplayMode(Number)
- setDisplayMode(displayMode: [Number](TopLevel.Number.md)): void
  - : Set the category's Variation Groups Display Mode.

    **Parameters:**
    - displayMode - The category's variation groups display mode which is either [DISPLAY_MODE_MERGED](dw.catalog.Category.md#display_mode_merged) or             [DISPLAY_MODE_INDIVIDUAL](dw.catalog.Category.md#display_mode_individual) or null if category is set to inherit the display mode.


---

### setSearchPlacement(Number)
- setSearchPlacement(placement: [Number](TopLevel.Number.md)): void
  - : Set the category's search placement.

    **Parameters:**
    - placement - The category's search placement.


---

### setSearchRank(Number)
- setSearchRank(rank: [Number](TopLevel.Number.md)): void
  - : Set the category's search rank.

    **Parameters:**
    - rank - The category's search rank.


---

<!-- prettier-ignore-end -->
