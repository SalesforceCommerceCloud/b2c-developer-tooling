<!-- prettier-ignore-start -->
# Class FacebookProduct

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.extensions.facebook.FacebookProduct](dw.extensions.facebook.FacebookProduct.md)

Represents a row in the Facebook catalog feed export.


## Constant Summary

| Constant | Description |
| --- | --- |
| [AGE_GROUP_ADULT](#age_group_adult): [String](TopLevel.String.md) = "adult" | Indicates that the product is for adults. |
| [AGE_GROUP_INFANT](#age_group_infant): [String](TopLevel.String.md) = "infant" | Indicates that the product is for infant children. |
| [AGE_GROUP_KIDS](#age_group_kids): [String](TopLevel.String.md) = "kids" | Indicates that the product is for children. |
| [AGE_GROUP_NEWBORN](#age_group_newborn): [String](TopLevel.String.md) = "newborn" | Indicates that the product is for newborn children. |
| [AGE_GROUP_TODDLER](#age_group_toddler): [String](TopLevel.String.md) = "toddler" | Indicates that the product is for toddler children. |
| [AVAILABILITY_AVAILABLE_FOR_ORDER](#availability_available_for_order): [String](TopLevel.String.md) = "available for order" | Indicates that the product can be ordered for later shipment. |
| [AVAILABILITY_IN_STOCK](#availability_in_stock): [String](TopLevel.String.md) = "in stock" | Indicates that the product is available to ship immediately. |
| [AVAILABILITY_OUT_OF_STOCK](#availability_out_of_stock): [String](TopLevel.String.md) = "out of stock" | Indicates that the product is out of stock. |
| [AVAILABILITY_PREORDER](#availability_preorder): [String](TopLevel.String.md) = "preorder" | Indicates that the product will be available in the future. |
| [CONDITION_NEW](#condition_new): [String](TopLevel.String.md) = "new" | Indicates that the product is new. |
| [CONDITION_REFURBISHED](#condition_refurbished): [String](TopLevel.String.md) = "refurbished" | Indicates that the product is used but has been refurbished. |
| [CONDITION_USED](#condition_used): [String](TopLevel.String.md) = "used" | Indicates that the product has been used. |
| [GENDER_FEMALE](#gender_female): [String](TopLevel.String.md) = "female" | Indicates that the product is for females. |
| [GENDER_MALE](#gender_male): [String](TopLevel.String.md) = "male" | Indicates that the product is for males. |
| [GENDER_UNISEX](#gender_unisex): [String](TopLevel.String.md) = "unisex" | Indicates that the product is for both males and females. |
| [SHIPPING_SIZE_UNIT_CM](#shipping_size_unit_cm): [String](TopLevel.String.md) = "cm" | Indicates that the product is measured in centimeters. |
| [SHIPPING_SIZE_UNIT_FT](#shipping_size_unit_ft): [String](TopLevel.String.md) = "ft" | Indicates that the product is measured in feet. |
| [SHIPPING_SIZE_UNIT_IN](#shipping_size_unit_in): [String](TopLevel.String.md) = "in" | Indicates that the product is measured in inches. |
| [SHIPPING_SIZE_UNIT_M](#shipping_size_unit_m): [String](TopLevel.String.md) = "m" | Indicates that the product is measured in meters. |
| [SHIPPING_WEIGHT_UNIT_G](#shipping_weight_unit_g): [String](TopLevel.String.md) = "g" | Indicates that the product is weighed in grams. |
| [SHIPPING_WEIGHT_UNIT_KG](#shipping_weight_unit_kg): [String](TopLevel.String.md) = "kg" | Indicates that the product is weighed in kilograms. |
| [SHIPPING_WEIGHT_UNIT_LB](#shipping_weight_unit_lb): [String](TopLevel.String.md) = "lb" | Indicates that the product is weighed in pounds. |
| [SHIPPING_WEIGHT_UNIT_OZ](#shipping_weight_unit_oz): [String](TopLevel.String.md) = "oz" | Indicates that the product is weighed in ounces. |

## Property Summary

| Property | Description |
| --- | --- |
| [ID](#id): [String](TopLevel.String.md) `(read-only)` | Returns the ID of the Facebook product. |
| [ageGroup](#agegroup): [String](TopLevel.String.md) | Returns the age group for the Facebook product. |
| [availability](#availability): [String](TopLevel.String.md) | Returns the availability of the Facebook product. |
| [brand](#brand): [String](TopLevel.String.md) | Returns the Facebook brand of the product. |
| [color](#color): [String](TopLevel.String.md) | Returns the Facebook color value label of the product. |
| [condition](#condition): [String](TopLevel.String.md) | Returns the condition of the Facebook product. |
| [customLabel0](#customlabel0): [String](TopLevel.String.md) | Returns the Facebook custom label 0 value of the product. |
| [customLabel1](#customlabel1): [String](TopLevel.String.md) | Returns the Facebook custom label 1 value of the product. |
| [customLabel2](#customlabel2): [String](TopLevel.String.md) | Returns the Facebook custom label 2 value of the product. |
| [customLabel3](#customlabel3): [String](TopLevel.String.md) | Returns the Facebook custom label 3 value of the product. |
| [customLabel4](#customlabel4): [String](TopLevel.String.md) | Returns the Facebook custom label 4 value of the product. |
| [description](#description): [String](TopLevel.String.md) | Returns the description of the Facebook product. |
| [expirationDate](#expirationdate): [Date](TopLevel.Date.md) | Returns the Facebook expiration date of the product. |
| [gender](#gender): [String](TopLevel.String.md) | Returns the gender for the Facebook product. |
| [googleProductCategory](#googleproductcategory): [String](TopLevel.String.md) | Returns the category of this product in the Google category taxonomy. |
| [gtin](#gtin): [String](TopLevel.String.md) | Returns the Facebook GTIN of the product. |
| [imageLinks](#imagelinks): [List](dw.util.List.md) | Returns a list containing the URLs of the images to show in Facebook for the product. |
| [itemGroupID](#itemgroupid): [String](TopLevel.String.md) | Returns the ID of the Facebook item group for the product, that is, its master product. |
| [link](#link): [URL](dw.web.URL.md) | Returns the URL of the Demandware storefront link to the product. |
| [material](#material): [String](TopLevel.String.md) | Returns the Facebook material value label of the product. |
| [mpn](#mpn): [String](TopLevel.String.md) | Returns the Facebook MPN of the product. |
| [pattern](#pattern): [String](TopLevel.String.md) | Returns the Facebook pattern value label of the product. |
| [price](#price): [Money](dw.value.Money.md) | Returns the price to show in Facebook for the product. |
| [productType](#producttype): [String](TopLevel.String.md) | Returns the Facebook product type. |
| [salePrice](#saleprice): [Money](dw.value.Money.md) | Returns the sale price to show in Facebook for the product. |
| [salePriceEffectiveDateEnd](#salepriceeffectivedateend): [Date](TopLevel.Date.md) | Returns the end date of the Facebook sale price of the product. |
| [salePriceEffectiveDateStart](#salepriceeffectivedatestart): [Date](TopLevel.Date.md) | Returns the start date of the Facebook sale price of the product. |
| [shippingHeight](#shippingheight): [Number](TopLevel.Number.md) | Returns the shipping height of the product. |
| [shippingLength](#shippinglength): [Number](TopLevel.Number.md) | Returns the shipping length of the product. |
| [shippingSizeUnit](#shippingsizeunit): [String](TopLevel.String.md) | Returns the shipping size unit of the product. |
| [shippingWeight](#shippingweight): [Quantity](dw.value.Quantity.md) | Returns the shipping weight for the product. |
| [shippingWidth](#shippingwidth): [Number](TopLevel.Number.md) | Returns the shipping width of the product. |
| [size](#size): [String](TopLevel.String.md) | Returns the Facebook size value label of the product. |
| [title](#title): [String](TopLevel.String.md) | Returns the title of the Facebook product. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getAgeGroup](dw.extensions.facebook.FacebookProduct.md#getagegroup)() | Returns the age group for the Facebook product. |
| [getAvailability](dw.extensions.facebook.FacebookProduct.md#getavailability)() | Returns the availability of the Facebook product. |
| [getBrand](dw.extensions.facebook.FacebookProduct.md#getbrand)() | Returns the Facebook brand of the product. |
| [getColor](dw.extensions.facebook.FacebookProduct.md#getcolor)() | Returns the Facebook color value label of the product. |
| [getCondition](dw.extensions.facebook.FacebookProduct.md#getcondition)() | Returns the condition of the Facebook product. |
| [getCustomLabel0](dw.extensions.facebook.FacebookProduct.md#getcustomlabel0)() | Returns the Facebook custom label 0 value of the product. |
| [getCustomLabel1](dw.extensions.facebook.FacebookProduct.md#getcustomlabel1)() | Returns the Facebook custom label 1 value of the product. |
| [getCustomLabel2](dw.extensions.facebook.FacebookProduct.md#getcustomlabel2)() | Returns the Facebook custom label 2 value of the product. |
| [getCustomLabel3](dw.extensions.facebook.FacebookProduct.md#getcustomlabel3)() | Returns the Facebook custom label 3 value of the product. |
| [getCustomLabel4](dw.extensions.facebook.FacebookProduct.md#getcustomlabel4)() | Returns the Facebook custom label 4 value of the product. |
| [getDescription](dw.extensions.facebook.FacebookProduct.md#getdescription)() | Returns the description of the Facebook product. |
| [getExpirationDate](dw.extensions.facebook.FacebookProduct.md#getexpirationdate)() | Returns the Facebook expiration date of the product. |
| [getGender](dw.extensions.facebook.FacebookProduct.md#getgender)() | Returns the gender for the Facebook product. |
| [getGoogleProductCategory](dw.extensions.facebook.FacebookProduct.md#getgoogleproductcategory)() | Returns the category of this product in the Google category taxonomy. |
| [getGtin](dw.extensions.facebook.FacebookProduct.md#getgtin)() | Returns the Facebook GTIN of the product. |
| [getID](dw.extensions.facebook.FacebookProduct.md#getid)() | Returns the ID of the Facebook product. |
| [getImageLinks](dw.extensions.facebook.FacebookProduct.md#getimagelinks)() | Returns a list containing the URLs of the images to show in Facebook for the product. |
| [getItemGroupID](dw.extensions.facebook.FacebookProduct.md#getitemgroupid)() | Returns the ID of the Facebook item group for the product, that is, its master product. |
| [getLink](dw.extensions.facebook.FacebookProduct.md#getlink)() | Returns the URL of the Demandware storefront link to the product. |
| [getMaterial](dw.extensions.facebook.FacebookProduct.md#getmaterial)() | Returns the Facebook material value label of the product. |
| [getMpn](dw.extensions.facebook.FacebookProduct.md#getmpn)() | Returns the Facebook MPN of the product. |
| [getPattern](dw.extensions.facebook.FacebookProduct.md#getpattern)() | Returns the Facebook pattern value label of the product. |
| [getPrice](dw.extensions.facebook.FacebookProduct.md#getprice)() | Returns the price to show in Facebook for the product. |
| [getProductType](dw.extensions.facebook.FacebookProduct.md#getproducttype)() | Returns the Facebook product type. |
| [getSalePrice](dw.extensions.facebook.FacebookProduct.md#getsaleprice)() | Returns the sale price to show in Facebook for the product. |
| [getSalePriceEffectiveDateEnd](dw.extensions.facebook.FacebookProduct.md#getsalepriceeffectivedateend)() | Returns the end date of the Facebook sale price of the product. |
| [getSalePriceEffectiveDateStart](dw.extensions.facebook.FacebookProduct.md#getsalepriceeffectivedatestart)() | Returns the start date of the Facebook sale price of the product. |
| [getShippingHeight](dw.extensions.facebook.FacebookProduct.md#getshippingheight)() | Returns the shipping height of the product. |
| [getShippingLength](dw.extensions.facebook.FacebookProduct.md#getshippinglength)() | Returns the shipping length of the product. |
| [getShippingSizeUnit](dw.extensions.facebook.FacebookProduct.md#getshippingsizeunit)() | Returns the shipping size unit of the product. |
| [getShippingWeight](dw.extensions.facebook.FacebookProduct.md#getshippingweight)() | Returns the shipping weight for the product. |
| [getShippingWidth](dw.extensions.facebook.FacebookProduct.md#getshippingwidth)() | Returns the shipping width of the product. |
| [getSize](dw.extensions.facebook.FacebookProduct.md#getsize)() | Returns the Facebook size value label of the product. |
| [getTitle](dw.extensions.facebook.FacebookProduct.md#gettitle)() | Returns the title of the Facebook product. |
| [setAgeGroup](dw.extensions.facebook.FacebookProduct.md#setagegroupstring)([String](TopLevel.String.md)) | Sets the age group for the Facebook product. |
| [setAvailability](dw.extensions.facebook.FacebookProduct.md#setavailabilitystring)([String](TopLevel.String.md)) | Sets the availability of the Facebook product. |
| [setBrand](dw.extensions.facebook.FacebookProduct.md#setbrandstring)([String](TopLevel.String.md)) | Sets the Facebook brand of the product. |
| [setColor](dw.extensions.facebook.FacebookProduct.md#setcolorstring)([String](TopLevel.String.md)) | Sets the Facebook color value label of the product. |
| [setCondition](dw.extensions.facebook.FacebookProduct.md#setconditionstring)([String](TopLevel.String.md)) | Sets the condition of the Facebook product. |
| [setCustomLabel0](dw.extensions.facebook.FacebookProduct.md#setcustomlabel0string)([String](TopLevel.String.md)) | Sets the Facebook custom label 0 value of the product. |
| [setCustomLabel1](dw.extensions.facebook.FacebookProduct.md#setcustomlabel1string)([String](TopLevel.String.md)) | Sets the Facebook custom label 1 value of the product. |
| [setCustomLabel2](dw.extensions.facebook.FacebookProduct.md#setcustomlabel2string)([String](TopLevel.String.md)) | Sets the Facebook custom label 2 value of the product. |
| [setCustomLabel3](dw.extensions.facebook.FacebookProduct.md#setcustomlabel3string)([String](TopLevel.String.md)) | Sets the Facebook custom label 3 value of the product. |
| [setCustomLabel4](dw.extensions.facebook.FacebookProduct.md#setcustomlabel4string)([String](TopLevel.String.md)) | Sets the Facebook custom label 4 value of the product. |
| [setDescription](dw.extensions.facebook.FacebookProduct.md#setdescriptionstring)([String](TopLevel.String.md)) | Sets the description of the Facebook product. |
| [setExpirationDate](dw.extensions.facebook.FacebookProduct.md#setexpirationdatedate)([Date](TopLevel.Date.md)) | Sets the Facebook expiration date of the product. |
| [setGender](dw.extensions.facebook.FacebookProduct.md#setgenderstring)([String](TopLevel.String.md)) | Sets the gender for the Facebook product. |
| [setGoogleProductCategory](dw.extensions.facebook.FacebookProduct.md#setgoogleproductcategorystring)([String](TopLevel.String.md)) | Sets the category of this product in the Google category taxonomy. |
| [setGtin](dw.extensions.facebook.FacebookProduct.md#setgtinstring)([String](TopLevel.String.md)) | Sets the Facebook GTIN of the product. |
| [setImageLinks](dw.extensions.facebook.FacebookProduct.md#setimagelinkslist)([List](dw.util.List.md)) | Sets the list of URLs of images to show in Facebook for the product. |
| [setItemGroupID](dw.extensions.facebook.FacebookProduct.md#setitemgroupidstring)([String](TopLevel.String.md)) | Sets the ID of the Facebook item group for the product, that is, its master product. |
| [setLink](dw.extensions.facebook.FacebookProduct.md#setlinkurl)([URL](dw.web.URL.md)) | Sets the URL of the Demandware storefront link to the product. |
| [setMaterial](dw.extensions.facebook.FacebookProduct.md#setmaterialstring)([String](TopLevel.String.md)) | Sets the Facebook material value label of the product. |
| [setMpn](dw.extensions.facebook.FacebookProduct.md#setmpnstring)([String](TopLevel.String.md)) | Sets the Facebook MPN of the product. |
| [setPattern](dw.extensions.facebook.FacebookProduct.md#setpatternstring)([String](TopLevel.String.md)) | Sets the Facebook pattern value label of the product. |
| [setPrice](dw.extensions.facebook.FacebookProduct.md#setpricemoney)([Money](dw.value.Money.md)) | Sets the price to show in Facebook for the product. |
| [setProductType](dw.extensions.facebook.FacebookProduct.md#setproducttypestring)([String](TopLevel.String.md)) | Sets the Facebook product type. |
| [setSalePrice](dw.extensions.facebook.FacebookProduct.md#setsalepricemoney)([Money](dw.value.Money.md)) | Sets the sale price to show in Facebook for the product. |
| [setSalePriceEffectiveDateEnd](dw.extensions.facebook.FacebookProduct.md#setsalepriceeffectivedateenddate)([Date](TopLevel.Date.md)) | Sets the end date of the Facebook sale price of the product. |
| [setSalePriceEffectiveDateStart](dw.extensions.facebook.FacebookProduct.md#setsalepriceeffectivedatestartdate)([Date](TopLevel.Date.md)) | Sets the start date of the Facebook sale price of the product. |
| [setShippingHeight](dw.extensions.facebook.FacebookProduct.md#setshippingheightnumber)([Number](TopLevel.Number.md)) | Sets the shipping height of the product. |
| [setShippingLength](dw.extensions.facebook.FacebookProduct.md#setshippinglengthnumber)([Number](TopLevel.Number.md)) | Sets the shipping length of the product. |
| [setShippingSizeUnit](dw.extensions.facebook.FacebookProduct.md#setshippingsizeunitstring)([String](TopLevel.String.md)) | Sets the shipping size unit of the product. |
| [setShippingWeight](dw.extensions.facebook.FacebookProduct.md#setshippingweightquantity)([Quantity](dw.value.Quantity.md)) | Sets the shipping weight for the product. |
| [setShippingWidth](dw.extensions.facebook.FacebookProduct.md#setshippingwidthnumber)([Number](TopLevel.Number.md)) | Sets the shipping width of the product. |
| [setSize](dw.extensions.facebook.FacebookProduct.md#setsizestring)([String](TopLevel.String.md)) | Sets the Facebook size value label of the product. |
| [setTitle](dw.extensions.facebook.FacebookProduct.md#settitlestring)([String](TopLevel.String.md)) | Sets the title of the Facebook product. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### AGE_GROUP_ADULT

- AGE_GROUP_ADULT: [String](TopLevel.String.md) = "adult"
  - : Indicates that the product is for adults.


---

### AGE_GROUP_INFANT

- AGE_GROUP_INFANT: [String](TopLevel.String.md) = "infant"
  - : Indicates that the product is for infant children.


---

### AGE_GROUP_KIDS

- AGE_GROUP_KIDS: [String](TopLevel.String.md) = "kids"
  - : Indicates that the product is for children.


---

### AGE_GROUP_NEWBORN

- AGE_GROUP_NEWBORN: [String](TopLevel.String.md) = "newborn"
  - : Indicates that the product is for newborn children.


---

### AGE_GROUP_TODDLER

- AGE_GROUP_TODDLER: [String](TopLevel.String.md) = "toddler"
  - : Indicates that the product is for toddler children.


---

### AVAILABILITY_AVAILABLE_FOR_ORDER

- AVAILABILITY_AVAILABLE_FOR_ORDER: [String](TopLevel.String.md) = "available for order"
  - : Indicates that the product can be ordered for later shipment.


---

### AVAILABILITY_IN_STOCK

- AVAILABILITY_IN_STOCK: [String](TopLevel.String.md) = "in stock"
  - : Indicates that the product is available to ship immediately.


---

### AVAILABILITY_OUT_OF_STOCK

- AVAILABILITY_OUT_OF_STOCK: [String](TopLevel.String.md) = "out of stock"
  - : Indicates that the product is out of stock.


---

### AVAILABILITY_PREORDER

- AVAILABILITY_PREORDER: [String](TopLevel.String.md) = "preorder"
  - : Indicates that the product will be available in the future.


---

### CONDITION_NEW

- CONDITION_NEW: [String](TopLevel.String.md) = "new"
  - : Indicates that the product is new.


---

### CONDITION_REFURBISHED

- CONDITION_REFURBISHED: [String](TopLevel.String.md) = "refurbished"
  - : Indicates that the product is used but has been refurbished.


---

### CONDITION_USED

- CONDITION_USED: [String](TopLevel.String.md) = "used"
  - : Indicates that the product has been used.


---

### GENDER_FEMALE

- GENDER_FEMALE: [String](TopLevel.String.md) = "female"
  - : Indicates that the product is for females.


---

### GENDER_MALE

- GENDER_MALE: [String](TopLevel.String.md) = "male"
  - : Indicates that the product is for males.


---

### GENDER_UNISEX

- GENDER_UNISEX: [String](TopLevel.String.md) = "unisex"
  - : Indicates that the product is for both males and females.


---

### SHIPPING_SIZE_UNIT_CM

- SHIPPING_SIZE_UNIT_CM: [String](TopLevel.String.md) = "cm"
  - : Indicates that the product is measured in centimeters.


---

### SHIPPING_SIZE_UNIT_FT

- SHIPPING_SIZE_UNIT_FT: [String](TopLevel.String.md) = "ft"
  - : Indicates that the product is measured in feet.


---

### SHIPPING_SIZE_UNIT_IN

- SHIPPING_SIZE_UNIT_IN: [String](TopLevel.String.md) = "in"
  - : Indicates that the product is measured in inches.


---

### SHIPPING_SIZE_UNIT_M

- SHIPPING_SIZE_UNIT_M: [String](TopLevel.String.md) = "m"
  - : Indicates that the product is measured in meters.


---

### SHIPPING_WEIGHT_UNIT_G

- SHIPPING_WEIGHT_UNIT_G: [String](TopLevel.String.md) = "g"
  - : Indicates that the product is weighed in grams.


---

### SHIPPING_WEIGHT_UNIT_KG

- SHIPPING_WEIGHT_UNIT_KG: [String](TopLevel.String.md) = "kg"
  - : Indicates that the product is weighed in kilograms.


---

### SHIPPING_WEIGHT_UNIT_LB

- SHIPPING_WEIGHT_UNIT_LB: [String](TopLevel.String.md) = "lb"
  - : Indicates that the product is weighed in pounds.


---

### SHIPPING_WEIGHT_UNIT_OZ

- SHIPPING_WEIGHT_UNIT_OZ: [String](TopLevel.String.md) = "oz"
  - : Indicates that the product is weighed in ounces.


---

## Property Details

### ID
- ID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the ID of the Facebook product. This is the same as the ID of the Demandware product.


---

### ageGroup
- ageGroup: [String](TopLevel.String.md)
  - : Returns the age group for the Facebook product.


---

### availability
- availability: [String](TopLevel.String.md)
  - : Returns the availability of the Facebook product.


---

### brand
- brand: [String](TopLevel.String.md)
  - : Returns the Facebook brand of the product.


---

### color
- color: [String](TopLevel.String.md)
  - : Returns the Facebook color value label of the product.


---

### condition
- condition: [String](TopLevel.String.md)
  - : Returns the condition of the Facebook product.


---

### customLabel0
- customLabel0: [String](TopLevel.String.md)
  - : Returns the Facebook custom label 0 value of the product.


---

### customLabel1
- customLabel1: [String](TopLevel.String.md)
  - : Returns the Facebook custom label 1 value of the product.


---

### customLabel2
- customLabel2: [String](TopLevel.String.md)
  - : Returns the Facebook custom label 2 value of the product.


---

### customLabel3
- customLabel3: [String](TopLevel.String.md)
  - : Returns the Facebook custom label 3 value of the product.


---

### customLabel4
- customLabel4: [String](TopLevel.String.md)
  - : Returns the Facebook custom label 4 value of the product.


---

### description
- description: [String](TopLevel.String.md)
  - : Returns the description of the Facebook product.


---

### expirationDate
- expirationDate: [Date](TopLevel.Date.md)
  - : Returns the Facebook expiration date of the product. If the product is expired it will not be shown.


---

### gender
- gender: [String](TopLevel.String.md)
  - : Returns the gender for the Facebook product.


---

### googleProductCategory
- googleProductCategory: [String](TopLevel.String.md)
  - : Returns the category of this product in the Google category taxonomy. If the value is longer than 250 characters
      it is truncated.



---

### gtin
- gtin: [String](TopLevel.String.md)
  - : Returns the Facebook GTIN of the product.


---

### imageLinks
- imageLinks: [List](dw.util.List.md)
  - : Returns a list containing the URLs of the images to show in Facebook for the product.


---

### itemGroupID
- itemGroupID: [String](TopLevel.String.md)
  - : Returns the ID of the Facebook item group for the product, that is, its master product.


---

### link
- link: [URL](dw.web.URL.md)
  - : Returns the URL of the Demandware storefront link to the product.


---

### material
- material: [String](TopLevel.String.md)
  - : Returns the Facebook material value label of the product.


---

### mpn
- mpn: [String](TopLevel.String.md)
  - : Returns the Facebook MPN of the product.


---

### pattern
- pattern: [String](TopLevel.String.md)
  - : Returns the Facebook pattern value label of the product.


---

### price
- price: [Money](dw.value.Money.md)
  - : Returns the price to show in Facebook for the product.


---

### productType
- productType: [String](TopLevel.String.md)
  - : Returns the Facebook product type. This is the retailer-defined category of the item.


---

### salePrice
- salePrice: [Money](dw.value.Money.md)
  - : Returns the sale price to show in Facebook for the product.


---

### salePriceEffectiveDateEnd
- salePriceEffectiveDateEnd: [Date](TopLevel.Date.md)
  - : Returns the end date of the Facebook sale price of the product.


---

### salePriceEffectiveDateStart
- salePriceEffectiveDateStart: [Date](TopLevel.Date.md)
  - : Returns the start date of the Facebook sale price of the product.


---

### shippingHeight
- shippingHeight: [Number](TopLevel.Number.md)
  - : Returns the shipping height of the product.

    **See Also:**
    - [getShippingLength()](dw.extensions.facebook.FacebookProduct.md#getshippinglength)
    - [getShippingWidth()](dw.extensions.facebook.FacebookProduct.md#getshippingwidth)
    - [getShippingSizeUnit()](dw.extensions.facebook.FacebookProduct.md#getshippingsizeunit)


---

### shippingLength
- shippingLength: [Number](TopLevel.Number.md)
  - : Returns the shipping length of the product.

    **See Also:**
    - [getShippingWidth()](dw.extensions.facebook.FacebookProduct.md#getshippingwidth)
    - [getShippingHeight()](dw.extensions.facebook.FacebookProduct.md#getshippingheight)
    - [getShippingSizeUnit()](dw.extensions.facebook.FacebookProduct.md#getshippingsizeunit)


---

### shippingSizeUnit
- shippingSizeUnit: [String](TopLevel.String.md)
  - : Returns the shipping size unit of the product.

    **See Also:**
    - [getShippingLength()](dw.extensions.facebook.FacebookProduct.md#getshippinglength)
    - [getShippingWidth()](dw.extensions.facebook.FacebookProduct.md#getshippingwidth)
    - [getShippingHeight()](dw.extensions.facebook.FacebookProduct.md#getshippingheight)


---

### shippingWeight
- shippingWeight: [Quantity](dw.value.Quantity.md)
  - : Returns the shipping weight for the product.


---

### shippingWidth
- shippingWidth: [Number](TopLevel.Number.md)
  - : Returns the shipping width of the product.

    **See Also:**
    - [getShippingLength()](dw.extensions.facebook.FacebookProduct.md#getshippinglength)
    - [getShippingHeight()](dw.extensions.facebook.FacebookProduct.md#getshippingheight)
    - [getShippingSizeUnit()](dw.extensions.facebook.FacebookProduct.md#getshippingsizeunit)


---

### size
- size: [String](TopLevel.String.md)
  - : Returns the Facebook size value label of the product.


---

### title
- title: [String](TopLevel.String.md)
  - : Returns the title of the Facebook product.


---

## Method Details

### getAgeGroup()
- getAgeGroup(): [String](TopLevel.String.md)
  - : Returns the age group for the Facebook product.

    **Returns:**
    - product age group


---

### getAvailability()
- getAvailability(): [String](TopLevel.String.md)
  - : Returns the availability of the Facebook product.

    **Returns:**
    - product availability


---

### getBrand()
- getBrand(): [String](TopLevel.String.md)
  - : Returns the Facebook brand of the product.

    **Returns:**
    - the brand


---

### getColor()
- getColor(): [String](TopLevel.String.md)
  - : Returns the Facebook color value label of the product.

    **Returns:**
    - the color value label


---

### getCondition()
- getCondition(): [String](TopLevel.String.md)
  - : Returns the condition of the Facebook product.

    **Returns:**
    - product condition


---

### getCustomLabel0()
- getCustomLabel0(): [String](TopLevel.String.md)
  - : Returns the Facebook custom label 0 value of the product.

    **Returns:**
    - the custom label 0 value


---

### getCustomLabel1()
- getCustomLabel1(): [String](TopLevel.String.md)
  - : Returns the Facebook custom label 1 value of the product.

    **Returns:**
    - the custom label 1 value


---

### getCustomLabel2()
- getCustomLabel2(): [String](TopLevel.String.md)
  - : Returns the Facebook custom label 2 value of the product.

    **Returns:**
    - the custom label 2 value


---

### getCustomLabel3()
- getCustomLabel3(): [String](TopLevel.String.md)
  - : Returns the Facebook custom label 3 value of the product.

    **Returns:**
    - the custom label 3 value


---

### getCustomLabel4()
- getCustomLabel4(): [String](TopLevel.String.md)
  - : Returns the Facebook custom label 4 value of the product.

    **Returns:**
    - the custom label 4 value


---

### getDescription()
- getDescription(): [String](TopLevel.String.md)
  - : Returns the description of the Facebook product.

    **Returns:**
    - product description


---

### getExpirationDate()
- getExpirationDate(): [Date](TopLevel.Date.md)
  - : Returns the Facebook expiration date of the product. If the product is expired it will not be shown.

    **Returns:**
    - the expiration date


---

### getGender()
- getGender(): [String](TopLevel.String.md)
  - : Returns the gender for the Facebook product.

    **Returns:**
    - product gender


---

### getGoogleProductCategory()
- getGoogleProductCategory(): [String](TopLevel.String.md)
  - : Returns the category of this product in the Google category taxonomy. If the value is longer than 250 characters
      it is truncated.


    **Returns:**
    - the category of this product in the Google category taxonomy


---

### getGtin()
- getGtin(): [String](TopLevel.String.md)
  - : Returns the Facebook GTIN of the product.

    **Returns:**
    - the GTIN


---

### getID()
- getID(): [String](TopLevel.String.md)
  - : Returns the ID of the Facebook product. This is the same as the ID of the Demandware product.

    **Returns:**
    - product ID


---

### getImageLinks()
- getImageLinks(): [List](dw.util.List.md)
  - : Returns a list containing the URLs of the images to show in Facebook for the product.

    **Returns:**
    - the URLs of the images


---

### getItemGroupID()
- getItemGroupID(): [String](TopLevel.String.md)
  - : Returns the ID of the Facebook item group for the product, that is, its master product.

    **Returns:**
    - the ID of the Facebook item group


---

### getLink()
- getLink(): [URL](dw.web.URL.md)
  - : Returns the URL of the Demandware storefront link to the product.

    **Returns:**
    - the URL of the storefront link


---

### getMaterial()
- getMaterial(): [String](TopLevel.String.md)
  - : Returns the Facebook material value label of the product.

    **Returns:**
    - the material value label


---

### getMpn()
- getMpn(): [String](TopLevel.String.md)
  - : Returns the Facebook MPN of the product.

    **Returns:**
    - the MPN


---

### getPattern()
- getPattern(): [String](TopLevel.String.md)
  - : Returns the Facebook pattern value label of the product.

    **Returns:**
    - the pattern value label


---

### getPrice()
- getPrice(): [Money](dw.value.Money.md)
  - : Returns the price to show in Facebook for the product.

    **Returns:**
    - the price to show in Facebook


---

### getProductType()
- getProductType(): [String](TopLevel.String.md)
  - : Returns the Facebook product type. This is the retailer-defined category of the item.

    **Returns:**
    - the Facebook product type


---

### getSalePrice()
- getSalePrice(): [Money](dw.value.Money.md)
  - : Returns the sale price to show in Facebook for the product.

    **Returns:**
    - the sale price to show in Facebook


---

### getSalePriceEffectiveDateEnd()
- getSalePriceEffectiveDateEnd(): [Date](TopLevel.Date.md)
  - : Returns the end date of the Facebook sale price of the product.

    **Returns:**
    - the end date of the Facebook sale price


---

### getSalePriceEffectiveDateStart()
- getSalePriceEffectiveDateStart(): [Date](TopLevel.Date.md)
  - : Returns the start date of the Facebook sale price of the product.

    **Returns:**
    - the start date of the Facebook sale price


---

### getShippingHeight()
- getShippingHeight(): [Number](TopLevel.Number.md)
  - : Returns the shipping height of the product.

    **Returns:**
    - the shipping height

    **See Also:**
    - [getShippingLength()](dw.extensions.facebook.FacebookProduct.md#getshippinglength)
    - [getShippingWidth()](dw.extensions.facebook.FacebookProduct.md#getshippingwidth)
    - [getShippingSizeUnit()](dw.extensions.facebook.FacebookProduct.md#getshippingsizeunit)


---

### getShippingLength()
- getShippingLength(): [Number](TopLevel.Number.md)
  - : Returns the shipping length of the product.

    **Returns:**
    - the shipping length

    **See Also:**
    - [getShippingWidth()](dw.extensions.facebook.FacebookProduct.md#getshippingwidth)
    - [getShippingHeight()](dw.extensions.facebook.FacebookProduct.md#getshippingheight)
    - [getShippingSizeUnit()](dw.extensions.facebook.FacebookProduct.md#getshippingsizeunit)


---

### getShippingSizeUnit()
- getShippingSizeUnit(): [String](TopLevel.String.md)
  - : Returns the shipping size unit of the product.

    **Returns:**
    - the shipping size unit

    **See Also:**
    - [getShippingLength()](dw.extensions.facebook.FacebookProduct.md#getshippinglength)
    - [getShippingWidth()](dw.extensions.facebook.FacebookProduct.md#getshippingwidth)
    - [getShippingHeight()](dw.extensions.facebook.FacebookProduct.md#getshippingheight)


---

### getShippingWeight()
- getShippingWeight(): [Quantity](dw.value.Quantity.md)
  - : Returns the shipping weight for the product.

    **Returns:**
    - the shipping weight


---

### getShippingWidth()
- getShippingWidth(): [Number](TopLevel.Number.md)
  - : Returns the shipping width of the product.

    **Returns:**
    - the shipping width

    **See Also:**
    - [getShippingLength()](dw.extensions.facebook.FacebookProduct.md#getshippinglength)
    - [getShippingHeight()](dw.extensions.facebook.FacebookProduct.md#getshippingheight)
    - [getShippingSizeUnit()](dw.extensions.facebook.FacebookProduct.md#getshippingsizeunit)


---

### getSize()
- getSize(): [String](TopLevel.String.md)
  - : Returns the Facebook size value label of the product.

    **Returns:**
    - the size value label


---

### getTitle()
- getTitle(): [String](TopLevel.String.md)
  - : Returns the title of the Facebook product.

    **Returns:**
    - product title


---

### setAgeGroup(String)
- setAgeGroup(ageGroup: [String](TopLevel.String.md)): void
  - : Sets the age group for the Facebook product. Possible values are
      [AGE_GROUP_ADULT](dw.extensions.facebook.FacebookProduct.md#age_group_adult),
      [AGE_GROUP_INFANT](dw.extensions.facebook.FacebookProduct.md#age_group_infant),
      [AGE_GROUP_KIDS](dw.extensions.facebook.FacebookProduct.md#age_group_kids),
      [AGE_GROUP_NEWBORN](dw.extensions.facebook.FacebookProduct.md#age_group_newborn),
      [AGE_GROUP_TODDLER](dw.extensions.facebook.FacebookProduct.md#age_group_toddler), or `null`.


    **Parameters:**
    - ageGroup - the ageGroup to set for this product


---

### setAvailability(String)
- setAvailability(availability: [String](TopLevel.String.md)): void
  - : Sets the availability of the Facebook product. Possible values are
      [AVAILABILITY_AVAILABLE_FOR_ORDER](dw.extensions.facebook.FacebookProduct.md#availability_available_for_order),
      [AVAILABILITY_IN_STOCK](dw.extensions.facebook.FacebookProduct.md#availability_in_stock),
      [AVAILABILITY_OUT_OF_STOCK](dw.extensions.facebook.FacebookProduct.md#availability_out_of_stock), or
      [AVAILABILITY_PREORDER](dw.extensions.facebook.FacebookProduct.md#availability_preorder)


    **Parameters:**
    - availability - the availability status to set for this product


---

### setBrand(String)
- setBrand(brand: [String](TopLevel.String.md)): void
  - : Sets the Facebook brand of the product. If the value is longer than 70 characters it is truncated.

    **Parameters:**
    - brand - Facebook brand, up to 70 characters


---

### setColor(String)
- setColor(color: [String](TopLevel.String.md)): void
  - : Sets the Facebook color value label of the product. If the value is longer than 100 characters it is truncated.

    **Parameters:**
    - color - Facebook color value label, up to 100 characters


---

### setCondition(String)
- setCondition(condition: [String](TopLevel.String.md)): void
  - : Sets the condition of the Facebook product. Possible values are
      [CONDITION_NEW](dw.extensions.facebook.FacebookProduct.md#condition_new),
      [CONDITION_REFURBISHED](dw.extensions.facebook.FacebookProduct.md#condition_refurbished), or
      [CONDITION_USED](dw.extensions.facebook.FacebookProduct.md#condition_used).


    **Parameters:**
    - condition - the condition status to set for this product


---

### setCustomLabel0(String)
- setCustomLabel0(customLabel0: [String](TopLevel.String.md)): void
  - : Sets the Facebook custom label 0 value of the product.

    **Parameters:**
    - customLabel0 - custom label 0 value


---

### setCustomLabel1(String)
- setCustomLabel1(customLabel1: [String](TopLevel.String.md)): void
  - : Sets the Facebook custom label 1 value of the product.

    **Parameters:**
    - customLabel1 - custom label 1 value


---

### setCustomLabel2(String)
- setCustomLabel2(customLabel2: [String](TopLevel.String.md)): void
  - : Sets the Facebook custom label 2 value of the product.

    **Parameters:**
    - customLabel2 - custom label 2 value


---

### setCustomLabel3(String)
- setCustomLabel3(customLabel3: [String](TopLevel.String.md)): void
  - : Sets the Facebook custom label 3 value of the product.

    **Parameters:**
    - customLabel3 - custom label 3 value


---

### setCustomLabel4(String)
- setCustomLabel4(customLabel4: [String](TopLevel.String.md)): void
  - : Sets the Facebook custom label 4 value of the product.

    **Parameters:**
    - customLabel4 - custom label 4 value


---

### setDescription(String)
- setDescription(description: [String](TopLevel.String.md)): void
  - : Sets the description of the Facebook product. If the value is longer than 5000 characters it is truncated.

    **Parameters:**
    - description - product description, up to 5000 characters


---

### setExpirationDate(Date)
- setExpirationDate(expirationDate: [Date](TopLevel.Date.md)): void
  - : Sets the Facebook expiration date of the product.

    **Parameters:**
    - expirationDate - Facebook expiration date


---

### setGender(String)
- setGender(gender: [String](TopLevel.String.md)): void
  - : Sets the gender for the Facebook product. Possible values are
      [GENDER_MALE](dw.extensions.facebook.FacebookProduct.md#gender_male),
      [GENDER_FEMALE](dw.extensions.facebook.FacebookProduct.md#gender_female),
      [GENDER_UNISEX](dw.extensions.facebook.FacebookProduct.md#gender_unisex), or `null`.


    **Parameters:**
    - gender - the gender to set for this product


---

### setGoogleProductCategory(String)
- setGoogleProductCategory(googleProductCategory: [String](TopLevel.String.md)): void
  - : Sets the category of this product in the Google category taxonomy.

    **Parameters:**
    - googleProductCategory - Google product category


---

### setGtin(String)
- setGtin(gtin: [String](TopLevel.String.md)): void
  - : Sets the Facebook GTIN of the product. If the value is longer than 70 characters it is truncated.

    **Parameters:**
    - gtin - Facebook GTIN, up to 70 characters


---

### setImageLinks(List)
- setImageLinks(imageLinks: [List](dw.util.List.md)): void
  - : Sets the list of URLs of images to show in Facebook for the product.

    **Parameters:**
    - imageLinks - links to the product images


---

### setItemGroupID(String)
- setItemGroupID(itemGroupID: [String](TopLevel.String.md)): void
  - : Sets the ID of the Facebook item group for the product, that is, its master product.

    **Parameters:**
    - itemGroupID - ID of Facebook item group


---

### setLink(URL)
- setLink(link: [URL](dw.web.URL.md)): void
  - : Sets the URL of the Demandware storefront link to the product.

    **Parameters:**
    - link - Demandware storefront link to the product


---

### setMaterial(String)
- setMaterial(material: [String](TopLevel.String.md)): void
  - : Sets the Facebook material value label of the product. If the value is longer than 200 characters it is
      truncated.


    **Parameters:**
    - material - Facebook material value label, up to 200 characters


---

### setMpn(String)
- setMpn(mpn: [String](TopLevel.String.md)): void
  - : Sets the Facebook MPN of the product. If the value is longer than 70 characters it is truncated.

    **Parameters:**
    - mpn - Facebook MPN, up to 70 characters


---

### setPattern(String)
- setPattern(pattern: [String](TopLevel.String.md)): void
  - : Sets the Facebook pattern value label of the product. If the value is longer than 100 characters it is truncated.

    **Parameters:**
    - pattern - Facebook pattern value label, up to 100 characters


---

### setPrice(Money)
- setPrice(price: [Money](dw.value.Money.md)): void
  - : Sets the price to show in Facebook for the product.

    **Parameters:**
    - price - Facebook price


---

### setProductType(String)
- setProductType(productType: [String](TopLevel.String.md)): void
  - : Sets the Facebook product type. If the value is longer than 750 characters it is truncated.

    **Parameters:**
    - productType - Facebook product type, up to 750 characters


---

### setSalePrice(Money)
- setSalePrice(salePrice: [Money](dw.value.Money.md)): void
  - : Sets the sale price to show in Facebook for the product.

    **Parameters:**
    - salePrice - Facebook sale price


---

### setSalePriceEffectiveDateEnd(Date)
- setSalePriceEffectiveDateEnd(salePriceEffectiveDateEnd: [Date](TopLevel.Date.md)): void
  - : Sets the end date of the Facebook sale price of the product.

    **Parameters:**
    - salePriceEffectiveDateEnd - end date of Facebook sale price


---

### setSalePriceEffectiveDateStart(Date)
- setSalePriceEffectiveDateStart(salePriceEffectiveDateStart: [Date](TopLevel.Date.md)): void
  - : Sets the start date of the Facebook sale price of the product.

    **Parameters:**
    - salePriceEffectiveDateStart - start date of Facebook sale price


---

### setShippingHeight(Number)
- setShippingHeight(shippingHeight: [Number](TopLevel.Number.md)): void
  - : Sets the shipping height of the product. If the value is negative it is truncated to 0.

    **Parameters:**
    - shippingHeight - shipping height, may not be negative

    **See Also:**
    - [setShippingLength(Number)](dw.extensions.facebook.FacebookProduct.md#setshippinglengthnumber)
    - [setShippingWidth(Number)](dw.extensions.facebook.FacebookProduct.md#setshippingwidthnumber)
    - [setShippingSizeUnit(String)](dw.extensions.facebook.FacebookProduct.md#setshippingsizeunitstring)


---

### setShippingLength(Number)
- setShippingLength(shippingLength: [Number](TopLevel.Number.md)): void
  - : Sets the shipping length of the product. If the value is negative it is truncated to 0.

    **Parameters:**
    - shippingLength - shipping length, may not be negative

    **See Also:**
    - [setShippingWidth(Number)](dw.extensions.facebook.FacebookProduct.md#setshippingwidthnumber)
    - [setShippingHeight(Number)](dw.extensions.facebook.FacebookProduct.md#setshippingheightnumber)
    - [setShippingSizeUnit(String)](dw.extensions.facebook.FacebookProduct.md#setshippingsizeunitstring)


---

### setShippingSizeUnit(String)
- setShippingSizeUnit(shippingSizeUnit: [String](TopLevel.String.md)): void
  - : Sets the shipping size unit of the product.

    **Parameters:**
    - shippingSizeUnit - shipping size unit

    **See Also:**
    - [setShippingLength(Number)](dw.extensions.facebook.FacebookProduct.md#setshippinglengthnumber)
    - [setShippingWidth(Number)](dw.extensions.facebook.FacebookProduct.md#setshippingwidthnumber)
    - [setShippingHeight(Number)](dw.extensions.facebook.FacebookProduct.md#setshippingheightnumber)


---

### setShippingWeight(Quantity)
- setShippingWeight(shippingWeight: [Quantity](dw.value.Quantity.md)): void
  - : Sets the shipping weight for the product. Possible unit values are
      [SHIPPING_WEIGHT_UNIT_LB](dw.extensions.facebook.FacebookProduct.md#shipping_weight_unit_lb),
      [SHIPPING_WEIGHT_UNIT_OZ](dw.extensions.facebook.FacebookProduct.md#shipping_weight_unit_oz),
      [SHIPPING_WEIGHT_UNIT_G](dw.extensions.facebook.FacebookProduct.md#shipping_weight_unit_g), or
      [SHIPPING_WEIGHT_UNIT_KG](dw.extensions.facebook.FacebookProduct.md#shipping_weight_unit_kg).


    **Parameters:**
    - shippingWeight - product shipping weight


---

### setShippingWidth(Number)
- setShippingWidth(shippingWidth: [Number](TopLevel.Number.md)): void
  - : Sets the shipping width of the product. If the value is negative it is truncated to 0.

    **Parameters:**
    - shippingWidth - shipping width, may not be negative

    **See Also:**
    - [setShippingLength(Number)](dw.extensions.facebook.FacebookProduct.md#setshippinglengthnumber)
    - [setShippingHeight(Number)](dw.extensions.facebook.FacebookProduct.md#setshippingheightnumber)
    - [setShippingSizeUnit(String)](dw.extensions.facebook.FacebookProduct.md#setshippingsizeunitstring)


---

### setSize(String)
- setSize(size: [String](TopLevel.String.md)): void
  - : Sets the Facebook size value label of the product. If the value is longer than 100 characters it is truncated.

    **Parameters:**
    - size - Facebook size value label, up to 100 characters


---

### setTitle(String)
- setTitle(title: [String](TopLevel.String.md)): void
  - : Sets the title of the Facebook product. If the value is longer than 100 characters it is truncated.

    **Parameters:**
    - title - product title, up to 100 characters


---

<!-- prettier-ignore-end -->
