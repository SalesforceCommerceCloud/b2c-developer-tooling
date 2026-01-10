<!-- prettier-ignore-start -->
# Class ProductVariationModel

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.catalog.ProductVariationModel](dw.catalog.ProductVariationModel.md)

Class representing the complete variation information for a master product in
the system. An instance of this class provides methods to access the
following information:


- The variation attributes of the master product (e.g. size and color). Use  [getProductVariationAttributes()](dw.catalog.ProductVariationModel.md#getproductvariationattributes).
- The variation attribute values (e.g. size=Small, Medium, Large and  color=Red, Blue). Use [getAllValues(ProductVariationAttribute)](dw.catalog.ProductVariationModel.md#getallvaluesproductvariationattribute).
- The variation groups which may represent a subset of variants by defining a  subset of the variation attribute values (e.g. color=Red, size=empty). Use  [getVariationGroups()](dw.catalog.ProductVariationModel.md#getvariationgroups).
- The variants themselves (e.g. the products representing Small Red, Large  Red, Small Blue, Large Blue, etc). Use [getVariants()](dw.catalog.ProductVariationModel.md#getvariants).
- The variation attribute values of those variants. Use  [getVariationValue(Product, ProductVariationAttribute)](dw.catalog.ProductVariationModel.md#getvariationvalueproduct-productvariationattribute).


This model only considers variants which are complete (i.e. the variant has a
value for each variation attribute), and currently online. Incomplete or
offline variants will not be returned by any method that returns Variants,
and their attribute values will not be considered in any method that returns
values.


In addition to providing access to this meta information,
ProductVariationModel maintains a collection of selected variation attribute
values, representing the selections that a customer makes in the storefront.
If this model was constructed for a master product, then none of the
attributes will have pre-selected values. If this model was constructed for a
variant product, then all the attribute values of that variant will be
pre-selected.


It is possible to query the current selections by calling
[getSelectedValue(ProductVariationAttribute)](dw.catalog.ProductVariationModel.md#getselectedvalueproductvariationattribute) or
[isSelectedAttributeValue(ProductVariationAttribute, ProductVariationAttributeValue)](dw.catalog.ProductVariationModel.md#isselectedattributevalueproductvariationattribute-productvariationattributevalue).


The method [setSelectedAttributeValue(String, String)](dw.catalog.ProductVariationModel.md#setselectedattributevaluestring-string) can be used to modify
the selected values. Depending on the product type, it's possible to select or modify
variation attribute values:


- If this model was constructed for a master product, it's possible to select and modify all variation attributes.
- If this model was constructed for a variation group, it's possible to select and modify all variation attributes that are not defined by the variation group.
- If this model was constructed for a variation product, it's not possible to select or modify any of the variation attributes.




Furthermore, the model provides helper methods to generate URLs
for selecting and unselecting variation attribute values. See those methods
for details.


If this model was constructed for a product that is neither a
master nor a variant, then none of the methods will return useful values at
all.


The methods in this class which access the currently selected variation
attribute values can be used on product detail pages to render information
about which combinations are available or unavailable. The methods
[getFilteredValues(ProductVariationAttribute)](dw.catalog.ProductVariationModel.md#getfilteredvaluesproductvariationattribute) and
[hasOrderableVariants(ProductVariationAttribute, ProductVariationAttributeValue)](dw.catalog.ProductVariationModel.md#hasorderablevariantsproductvariationattribute-productvariationattributevalue)
can be used to determine this type of situation and render the appropriate
message in the storefront.


NOTE: Several methods in this class have a version taking a
[ProductVariationAttribute](dw.catalog.ProductVariationAttribute.md) parameter, and another
deprecated version accepting a [ObjectAttributeDefinition](dw.object.ObjectAttributeDefinition.md)
parameter instead. The former should be strictly favored. The latter are
historical leftovers from when object attributes were used directly as the
basis for variation, and the value lists were stored directly on the
ObjectAttributeDefinition. Every ProductVariationAttribute corresponds with
exactly one ObjectAttributeDefinition, but values are now stored on the
ProductVariationAttribute and not the ObjectAttributeDefinition.



## Property Summary

| Property | Description |
| --- | --- |
| ~~[attributeDefinitions](#attributedefinitions): [Collection](dw.util.Collection.md)~~ `(read-only)` | Returns the object attribute definitions corresponding with the product  variation attributes of the master product. |
| [defaultVariant](#defaultvariant): [Variant](dw.catalog.Variant.md) `(read-only)` | Return the default variant of this model's master product. |
| [master](#master): [Product](dw.catalog.Product.md) `(read-only)` | Returns the master of the product variation. |
| [productVariationAttributes](#productvariationattributes): [Collection](dw.util.Collection.md) `(read-only)` | Returns a collection of product variation attributes of the variation. |
| [selectedVariant](#selectedvariant): [Variant](dw.catalog.Variant.md) `(read-only)` | Returns the variant currently selected for this variation model. |
| [selectedVariants](#selectedvariants): [Collection](dw.util.Collection.md) `(read-only)` | Returns the variants currently selected for this variation model. |
| [variants](#variants): [Collection](dw.util.Collection.md) `(read-only)` | Returns the collection of product variants of this variation model. |
| [variationGroups](#variationgroups): [Collection](dw.util.Collection.md) `(read-only)` | Returns the collection of variation groups of this variation model. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getAllValues](dw.catalog.ProductVariationModel.md#getallvaluesproductvariationattribute)([ProductVariationAttribute](dw.catalog.ProductVariationAttribute.md)) | Returns the values for the specified attribute. |
| ~~[getAllValues](dw.catalog.ProductVariationModel.md#getallvaluesobjectattributedefinition)([ObjectAttributeDefinition](dw.object.ObjectAttributeDefinition.md))~~ | Returns the value definitions for the specified attribute. |
| ~~[getAttributeDefinitions](dw.catalog.ProductVariationModel.md#getattributedefinitions)()~~ | Returns the object attribute definitions corresponding with the product  variation attributes of the master product. |
| [getDefaultVariant](dw.catalog.ProductVariationModel.md#getdefaultvariant)() | Return the default variant of this model's master product. |
| [getFilteredValues](dw.catalog.ProductVariationModel.md#getfilteredvaluesproductvariationattribute)([ProductVariationAttribute](dw.catalog.ProductVariationAttribute.md)) | Returns a collection of the value definitions defined for the specified  attribute, filtered based on currently selected values. |
| ~~[getFilteredValues](dw.catalog.ProductVariationModel.md#getfilteredvaluesobjectattributedefinition)([ObjectAttributeDefinition](dw.object.ObjectAttributeDefinition.md))~~ | Returns a collection of the value definitions defined for the specified  attribute, filtered based on currently selected values. |
| [getHtmlName](dw.catalog.ProductVariationModel.md#gethtmlnameproductvariationattribute)([ProductVariationAttribute](dw.catalog.ProductVariationAttribute.md)) | Returns an HTML representation of the product variation attribute id. |
| ~~[getHtmlName](dw.catalog.ProductVariationModel.md#gethtmlnameobjectattributedefinition)([ObjectAttributeDefinition](dw.object.ObjectAttributeDefinition.md))~~ | Returns an HTML representation of the variation attribute id. |
| [getHtmlName](dw.catalog.ProductVariationModel.md#gethtmlnamestring-productvariationattribute)([String](TopLevel.String.md), [ProductVariationAttribute](dw.catalog.ProductVariationAttribute.md)) | Returns an HTML representation of the  product variation attribute id with the custom prefix. |
| ~~[getHtmlName](dw.catalog.ProductVariationModel.md#gethtmlnamestring-objectattributedefinition)([String](TopLevel.String.md), [ObjectAttributeDefinition](dw.object.ObjectAttributeDefinition.md))~~ | Returns an HTML representation of the variation attribute id with the  custom prefix. |
| [getImage](dw.catalog.ProductVariationModel.md#getimagestring)([String](TopLevel.String.md)) | The method returns the first image appropriate for the current selected variation values  with the specific index. |
| [getImage](dw.catalog.ProductVariationModel.md#getimagestring-productvariationattribute-productvariationattributevalue)([String](TopLevel.String.md), [ProductVariationAttribute](dw.catalog.ProductVariationAttribute.md), [ProductVariationAttributeValue](dw.catalog.ProductVariationAttributeValue.md)) | The method returns the first image appropriate for the currently selected attribute values. |
| [getImage](dw.catalog.ProductVariationModel.md#getimagestring-number)([String](TopLevel.String.md), [Number](TopLevel.Number.md)) | The method returns an image appropriate for the current selected variation values  with the specific index. |
| [getImages](dw.catalog.ProductVariationModel.md#getimagesstring)([String](TopLevel.String.md)) | The method returns the image appropriate for the currently selected attribute values. |
| [getMaster](dw.catalog.ProductVariationModel.md#getmaster)() | Returns the master of the product variation. |
| [getProductVariationAttribute](dw.catalog.ProductVariationModel.md#getproductvariationattributestring)([String](TopLevel.String.md)) | Returns the product variation attribute for the specific id,  or null if there is no product variation attribute for that id. |
| [getProductVariationAttributes](dw.catalog.ProductVariationModel.md#getproductvariationattributes)() | Returns a collection of product variation attributes of the variation. |
| [getSelectedValue](dw.catalog.ProductVariationModel.md#getselectedvalueproductvariationattribute)([ProductVariationAttribute](dw.catalog.ProductVariationAttribute.md)) | Returns the selected value for the specified product variation attribute. |
| ~~[getSelectedValue](dw.catalog.ProductVariationModel.md#getselectedvalueobjectattributedefinition)([ObjectAttributeDefinition](dw.object.ObjectAttributeDefinition.md))~~ | Returns the selected value for the specified attribute. |
| [getSelectedVariant](dw.catalog.ProductVariationModel.md#getselectedvariant)() | Returns the variant currently selected for this variation model. |
| [getSelectedVariants](dw.catalog.ProductVariationModel.md#getselectedvariants)() | Returns the variants currently selected for this variation model. |
| [getVariants](dw.catalog.ProductVariationModel.md#getvariants)() | Returns the collection of product variants of this variation model. |
| [getVariants](dw.catalog.ProductVariationModel.md#getvariantshashmap)([HashMap](dw.util.HashMap.md)) | Returns the variants that match the specified filter conditions. |
| [getVariationGroups](dw.catalog.ProductVariationModel.md#getvariationgroups)() | Returns the collection of variation groups of this variation model. |
| [getVariationValue](dw.catalog.ProductVariationModel.md#getvariationvalueproduct-productvariationattribute)([Product](dw.catalog.Product.md), [ProductVariationAttribute](dw.catalog.ProductVariationAttribute.md)) | Returns the value for the specified variant or variation group product and  variation attribute. |
| [hasOrderableVariants](dw.catalog.ProductVariationModel.md#hasorderablevariantsproductvariationattribute-productvariationattributevalue)([ProductVariationAttribute](dw.catalog.ProductVariationAttribute.md), [ProductVariationAttributeValue](dw.catalog.ProductVariationAttributeValue.md)) | Returns true if any variant is available with the specified value of the  specified variation attribute. |
| [isSelectedAttributeValue](dw.catalog.ProductVariationModel.md#isselectedattributevalueproductvariationattribute-productvariationattributevalue)([ProductVariationAttribute](dw.catalog.ProductVariationAttribute.md), [ProductVariationAttributeValue](dw.catalog.ProductVariationAttributeValue.md)) | Identifies if the specified product variation attribute value is the one  currently selected. |
| ~~[isSelectedAttributeValue](dw.catalog.ProductVariationModel.md#isselectedattributevalueobjectattributedefinition-objectattributevaluedefinition)([ObjectAttributeDefinition](dw.object.ObjectAttributeDefinition.md), [ObjectAttributeValueDefinition](dw.object.ObjectAttributeValueDefinition.md))~~ | Identifies if the specified variation value is the one currently  selected. |
| [setSelectedAttributeValue](dw.catalog.ProductVariationModel.md#setselectedattributevaluestring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Applies a selected attribute value to this model instance. |
| [url](dw.catalog.ProductVariationModel.md#urlstring-object)([String](TopLevel.String.md), [Object...](TopLevel.Object.md)) | Constructs a URL to select a set of variation attribute values. |
| [urlSelectVariationValue](dw.catalog.ProductVariationModel.md#urlselectvariationvaluestring-productvariationattribute-productvariationattributevalue)([String](TopLevel.String.md), [ProductVariationAttribute](dw.catalog.ProductVariationAttribute.md), [ProductVariationAttributeValue](dw.catalog.ProductVariationAttributeValue.md)) | Generates a URL for selecting a value for a given variation attribute. |
| ~~[urlSelectVariationValue](dw.catalog.ProductVariationModel.md#urlselectvariationvaluestring-objectattributedefinition-objectattributevaluedefinition)([String](TopLevel.String.md), [ObjectAttributeDefinition](dw.object.ObjectAttributeDefinition.md), [ObjectAttributeValueDefinition](dw.object.ObjectAttributeValueDefinition.md))~~ | Constructs an URL to select the specified value of the specified  variation attribute. |
| [urlUnselectVariationValue](dw.catalog.ProductVariationModel.md#urlunselectvariationvaluestring-productvariationattribute)([String](TopLevel.String.md), [ProductVariationAttribute](dw.catalog.ProductVariationAttribute.md)) | Generates a URL for unselecting a value for a given variation attribute. |
| ~~[urlUnselectVariationValue](dw.catalog.ProductVariationModel.md#urlunselectvariationvaluestring-objectattributedefinition)([String](TopLevel.String.md), [ObjectAttributeDefinition](dw.object.ObjectAttributeDefinition.md))~~ | Constructs an URL to unselect the value of the specified variation  attribute. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### attributeDefinitions
- ~~attributeDefinitions: [Collection](dw.util.Collection.md)~~ `(read-only)`
  - : Returns the object attribute definitions corresponding with the product
      variation attributes of the master product.


    **Deprecated:**
:::warning
This method is deprecated since custom code should work with
            ProductVariationAttributes and not directly with their
            corresponding ObjectAttributeDefinitions. Use
            [getProductVariationAttributes()](dw.catalog.ProductVariationModel.md#getproductvariationattributes) to get the
            product variation attributes.

:::

---

### defaultVariant
- defaultVariant: [Variant](dw.catalog.Variant.md) `(read-only)`
  - : Return the default variant of this model's master product. If no default
      variant has been defined, return an arbitrary variant.



---

### master
- master: [Product](dw.catalog.Product.md) `(read-only)`
  - : Returns the master of the product variation.


---

### productVariationAttributes
- productVariationAttributes: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns a collection of product variation attributes of the variation.


---

### selectedVariant
- selectedVariant: [Variant](dw.catalog.Variant.md) `(read-only)`
  - : Returns the variant currently selected for this variation model.
      Returns null if no variant is selected.



---

### selectedVariants
- selectedVariants: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns the variants currently selected for this variation model.
      Returns an empty collection if no variant is selected.



---

### variants
- variants: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns the collection of product variants of this variation model.
      This collection only includes online variants. Offline variants are
      filtered out. If all variation products are required, consider using
      [Product.getVariants()](dw.catalog.Product.md#getvariants).
      
      The product variants are returned in no particular order.



---

### variationGroups
- variationGroups: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns the collection of variation groups of this variation model.
      This collection only includes online variation groups. Offline variation
      groups are filtered out. If all variation group products are required,
      consider using [Product.getVariationGroups()](dw.catalog.Product.md#getvariationgroups).
      
      The variation groups are returned in no particular order.



---

## Method Details

### getAllValues(ProductVariationAttribute)
- getAllValues(attribute: [ProductVariationAttribute](dw.catalog.ProductVariationAttribute.md)): [Collection](dw.util.Collection.md)
  - : Returns the values for the specified attribute. Only values that actually
      exist for at least one of the master product's currently online and
      complete variants are returned.
      
      
      Returns an empty collection if the passed attribute is not even a
      variation attribute of the master product.


    **Parameters:**
    - attribute - the variation attribute whose values will be returned.

    **Returns:**
    - the sorted collection of ProductVariationAttributeValue instances
              representing the values defined for the specified attribute. The
              collection is sorted by the explicit sort order defined for the
              values.



---

### getAllValues(ObjectAttributeDefinition)
- ~~getAllValues(attribute: [ObjectAttributeDefinition](dw.object.ObjectAttributeDefinition.md)): [Collection](dw.util.Collection.md)~~
  - : Returns the value definitions for the specified attribute. Only values
      that actually exist for at least one of the master product's currently
      online and complete variants are returned.
      
      
      Returns an empty collection if the passed attribute is not even a
      variation attribute of the master product.


    **Parameters:**
    - attribute - the attribute whose values will be returned.

    **Returns:**
    - the sorted collection of ObjectAttributeValueDefinition instances
              representing the value definitions defined for the specified
              attribute. The collection is sorted by the explicit sort order
              defined for the values.


    **Deprecated:**
:::warning
This method is deprecated since custom code should work with
            ProductVariationAttributes and not directly with their
            corresponding ObjectAttributeDefinitions. Use
            [getAllValues(ProductVariationAttribute)](dw.catalog.ProductVariationModel.md#getallvaluesproductvariationattribute) to get the
            collection of ProductVariationAttributeValue instances
            instead.

:::

---

### getAttributeDefinitions()
- ~~getAttributeDefinitions(): [Collection](dw.util.Collection.md)~~
  - : Returns the object attribute definitions corresponding with the product
      variation attributes of the master product.


    **Returns:**
    - the collection of ObjectAttributeDefinition instances
              corresponding with the variation attributes of the master
              product, sorted by explicit position.


    **Deprecated:**
:::warning
This method is deprecated since custom code should work with
            ProductVariationAttributes and not directly with their
            corresponding ObjectAttributeDefinitions. Use
            [getProductVariationAttributes()](dw.catalog.ProductVariationModel.md#getproductvariationattributes) to get the
            product variation attributes.

:::

---

### getDefaultVariant()
- getDefaultVariant(): [Variant](dw.catalog.Variant.md)
  - : Return the default variant of this model's master product. If no default
      variant has been defined, return an arbitrary variant.


    **Returns:**
    - the default value of this model's master product, an arbitrary
              variant if no default is defined, or null if this model does not
              represent a master product with variants.



---

### getFilteredValues(ProductVariationAttribute)
- getFilteredValues(attribute: [ProductVariationAttribute](dw.catalog.ProductVariationAttribute.md)): [Collection](dw.util.Collection.md)
  - : Returns a collection of the value definitions defined for the specified
      attribute, filtered based on currently selected values.
      
      
      A value is only returned if it at least one variant has the value and
      also possesses the selected values for all previous attributes. It is
      important to know that the filter is applied in a certain order. The
      method looks at all ProductVariationAttribute instances that appear
      before the passed one in the sorted collection returned by
      [getProductVariationAttributes()](dw.catalog.ProductVariationModel.md#getproductvariationattributes). If the passed attribute is the
      first in this collection, then this method simply returns all its values.
      If an earlier attribute does not have a selected value, this method
      returns an empty list. Otherwise, the filter looks at all variants
      matching the selected value for all previous attributes, and considers
      the range of values possessed by these variants for the passed attribute.
      
      
      The idea behind this method is that customers in the storefront select
      variation attribute values one by one in the order the variation
      attributes are defined and displayed. After each selection, customer only
      wants to see values that he can possibly order for the remaining
      attributes.
      
      
      Returns an empty collection if the passed attribute is not even a
      variation attribute of the master product.


    **Parameters:**
    - attribute - the product variation attribute whose values are to be             returned.

    **Returns:**
    - a sorted and filtered collection of product variation attribute
              values. The collection is sorted by the explicit sort order
              defined for the values.



---

### getFilteredValues(ObjectAttributeDefinition)
- ~~getFilteredValues(attribute: [ObjectAttributeDefinition](dw.object.ObjectAttributeDefinition.md)): [Collection](dw.util.Collection.md)~~
  - : Returns a collection of the value definitions defined for the specified
      attribute, filtered based on currently selected values.
      
      
      A value is only returned if it at least one variant has the value and
      also possesses the selected values for all previous attributes. It is
      important to know that the filter is applied in a certain order. The
      method looks at all ObjectAttributeDefinition instances that appear
      before the passed one in the sorted collection returned by
      [getAttributeDefinitions()](dw.catalog.ProductVariationModel.md#getattributedefinitions). If the passed attribute is the first
      in this collection, then this method simply returns all its values. If an
      earlier attribute does not have a selected value, this method returns an
      empty list. Otherwise, the filter looks at all variants matching the
      selected value for all previous attributes, and considers the range of
      values possessed by these variants for the passed attribute.
      
      
      The idea behind this method is that customers in the storefront select
      variation attribute values one by one in the order the variation
      attributes are defined and displayed. After each selection, customer only
      wants to see values that he can possibly order for the remaining
      attributes.
      
      
      Returns an empty collection if the passed attribute is not even a
      variation attribute of the master product.


    **Parameters:**
    - attribute - the attribute whose values are returned by this method.

    **Returns:**
    - a sorted collection of ObjectAttributeDefinitionValue instances
              calculated based on the currently selected variation values.


    **Deprecated:**
:::warning
Use [getFilteredValues(ProductVariationAttribute)](dw.catalog.ProductVariationModel.md#getfilteredvaluesproductvariationattribute) to
            get the sorted and calculated collection of product variation
            attribute values.

:::

---

### getHtmlName(ProductVariationAttribute)
- getHtmlName(attribute: [ProductVariationAttribute](dw.catalog.ProductVariationAttribute.md)): [String](TopLevel.String.md)
  - : Returns an HTML representation of the product variation attribute id.

    **Parameters:**
    - attribute - the  product variation attribute whose ID is returned.

    **Returns:**
    - an HTML representation of the product variation attribute id.


---

### getHtmlName(ObjectAttributeDefinition)
- ~~getHtmlName(attribute: [ObjectAttributeDefinition](dw.object.ObjectAttributeDefinition.md)): [String](TopLevel.String.md)~~
  - : Returns an HTML representation of the variation attribute id. This method
      is deprecated. You should use getHtmlName(ProductVariationAttribute)
      instead.


    **Parameters:**
    - attribute - the attribute whose ID is returned.

    **Returns:**
    - an HTML representation of the attribute id.

    **Deprecated:**
:::warning
Use [getHtmlName(ProductVariationAttribute)](dw.catalog.ProductVariationModel.md#gethtmlnameproductvariationattribute) to get
            the HTML representation of the product variation attribute
            id.

:::

---

### getHtmlName(String, ProductVariationAttribute)
- getHtmlName(prefix: [String](TopLevel.String.md), attribute: [ProductVariationAttribute](dw.catalog.ProductVariationAttribute.md)): [String](TopLevel.String.md)
  - : Returns an HTML representation of the  product variation attribute id with the custom prefix.

    **Parameters:**
    - prefix - a custom prefix.
    - attribute - the product variation attribute whose ID is returned.

    **Returns:**
    - an HTML representation of the product variation attribute id.


---

### getHtmlName(String, ObjectAttributeDefinition)
- ~~getHtmlName(prefix: [String](TopLevel.String.md), attribute: [ObjectAttributeDefinition](dw.object.ObjectAttributeDefinition.md)): [String](TopLevel.String.md)~~
  - : Returns an HTML representation of the variation attribute id with the
      custom prefix. This method is deprecated. You should use
      [getHtmlName(String, ProductVariationAttribute)](dw.catalog.ProductVariationModel.md#gethtmlnamestring-productvariationattribute) instead.


    **Parameters:**
    - prefix - a custom prefix.
    - attribute - the attribute whose ID is returned.

    **Returns:**
    - an HTML representation of the attribute id.

    **Deprecated:**
:::warning
Use [getHtmlName(String, ProductVariationAttribute)](dw.catalog.ProductVariationModel.md#gethtmlnamestring-productvariationattribute)
            to get the HTML representation of the product variation
            attribute id with the custom prefix.

:::

---

### getImage(String)
- getImage(viewtype: [String](TopLevel.String.md)): [MediaFile](dw.content.MediaFile.md)
  - : The method returns the first image appropriate for the current selected variation values
      with the specific index.
      
      If images are defined for this view type and variants, but not for
      specified index, the method returns null.
      
      If no images are defined for all variants and specified view type, the
      image at the specified index of the master product images is returned. If
      no master product image for specified index is defined, the method
      returns null.
      
      The view type parameter is required, otherwise a exception is thrown.


    **Parameters:**
    - viewtype - the view type annotated to image

    **Returns:**
    - the MediaFile or null


---

### getImage(String, ProductVariationAttribute, ProductVariationAttributeValue)
- getImage(viewtype: [String](TopLevel.String.md), attribute: [ProductVariationAttribute](dw.catalog.ProductVariationAttribute.md), value: [ProductVariationAttributeValue](dw.catalog.ProductVariationAttributeValue.md)): [MediaFile](dw.content.MediaFile.md)
  - : The method returns the first image appropriate for the currently selected attribute values.
      
      The method first considers the most specific combination of attribute values (e.g
      "Red leather") and if that is not found, more general (e.g "Red").  If no image group
      is found for the attributes, returns null
      
      The view type parameter is required, otherwise a exception is thrown.


    **Parameters:**
    - viewtype - the view type annotated to image
    - attribute - the variation attribute
    - value - the the variation attribute value

    **Returns:**
    - the first image, or null if not found


---

### getImage(String, Number)
- getImage(viewtype: [String](TopLevel.String.md), index: [Number](TopLevel.Number.md)): [MediaFile](dw.content.MediaFile.md)
  - : The method returns an image appropriate for the current selected variation values
      with the specific index.
      
      If images are defined for this view type and variants, but not for
      specified index, the method returns null.
      
      If no images are defined for all variants and specified view type, the
      image at the specified index of the master product images is returned. If
      no master product image for specified index is defined, the method
      returns null.
      
      The view type parameter is required, otherwise a exception is thrown.


    **Parameters:**
    - viewtype - the view type annotated to image
    - index - the index number of the image within image list

    **Returns:**
    - the MediaFile or null


---

### getImages(String)
- getImages(viewtype: [String](TopLevel.String.md)): [List](dw.util.List.md)
  - : The method returns the image appropriate for the currently selected attribute values.
      
      The method first considers the most specific combination of attribute values (e.g
      "Red leather") and if that is not found, more general (e.g "Red").  If no image group
      is found for the attributes, returns null
      
      The view type parameter is required, otherwise a exception is thrown.


    **Parameters:**
    - viewtype - the view type annotated to image

    **Returns:**
    - an array of images


---

### getMaster()
- getMaster(): [Product](dw.catalog.Product.md)
  - : Returns the master of the product variation.

    **Returns:**
    - the master of the product variation.


---

### getProductVariationAttribute(String)
- getProductVariationAttribute(id: [String](TopLevel.String.md)): [ProductVariationAttribute](dw.catalog.ProductVariationAttribute.md)
  - : Returns the product variation attribute for the specific id,
      or null if there is no product variation attribute for that id.


    **Parameters:**
    - id - the id of the product variation attribute

    **Returns:**
    - the product variation attribute, or null.


---

### getProductVariationAttributes()
- getProductVariationAttributes(): [Collection](dw.util.Collection.md)
  - : Returns a collection of product variation attributes of the variation.

    **Returns:**
    - a collection of product variation attributes  of the variation.


---

### getSelectedValue(ProductVariationAttribute)
- getSelectedValue(attribute: [ProductVariationAttribute](dw.catalog.ProductVariationAttribute.md)): [ProductVariationAttributeValue](dw.catalog.ProductVariationAttributeValue.md)
  - : Returns the selected value for the specified product variation attribute. If no value is
      selected, null is returned.


    **Parameters:**
    - attribute - the product variation attribute whose value will be returned.

    **Returns:**
    - the selected product variation attribute value for the specified attribute or null.


---

### getSelectedValue(ObjectAttributeDefinition)
- ~~getSelectedValue(attribute: [ObjectAttributeDefinition](dw.object.ObjectAttributeDefinition.md)): [ObjectAttributeValueDefinition](dw.object.ObjectAttributeValueDefinition.md)~~
  - : Returns the selected value for the specified attribute. If no value is
      selected, null is returned.


    **Parameters:**
    - attribute - the attribute whose value will be returned.

    **Returns:**
    - the selected value for the specified attribute or null.

    **Deprecated:**
:::warning
Use [getSelectedValue(ProductVariationAttribute)](dw.catalog.ProductVariationModel.md#getselectedvalueproductvariationattribute) to
            get the selected product variation attribute value for the
            specified attribute.

:::

---

### getSelectedVariant()
- getSelectedVariant(): [Variant](dw.catalog.Variant.md)
  - : Returns the variant currently selected for this variation model.
      Returns null if no variant is selected.


    **Returns:**
    - selected variant or null.


---

### getSelectedVariants()
- getSelectedVariants(): [Collection](dw.util.Collection.md)
  - : Returns the variants currently selected for this variation model.
      Returns an empty collection if no variant is selected.


    **Returns:**
    - selected variants, might be empty if no valid variant was selected by the given attribute values


---

### getVariants()
- getVariants(): [Collection](dw.util.Collection.md)
  - : Returns the collection of product variants of this variation model.
      This collection only includes online variants. Offline variants are
      filtered out. If all variation products are required, consider using
      [Product.getVariants()](dw.catalog.Product.md#getvariants).
      
      The product variants are returned in no particular order.


    **Returns:**
    - a collection of all the product variants of the variation model.


---

### getVariants(HashMap)
- getVariants(filter: [HashMap](dw.util.HashMap.md)): [Collection](dw.util.Collection.md)
  - : Returns the variants that match the specified filter conditions. The
      filter conditions are specified as a hash map of <attribute\_id> -
      <value\_id>.  This method does not consider the currently selected
      attribute values.


    **Parameters:**
    - filter - the filters to apply when collecting the variants.

    **Returns:**
    - the collection of variants that match the specified filter
              conditions.



---

### getVariationGroups()
- getVariationGroups(): [Collection](dw.util.Collection.md)
  - : Returns the collection of variation groups of this variation model.
      This collection only includes online variation groups. Offline variation
      groups are filtered out. If all variation group products are required,
      consider using [Product.getVariationGroups()](dw.catalog.Product.md#getvariationgroups).
      
      The variation groups are returned in no particular order.


    **Returns:**
    - a collection of all the variation groups of the variation model.


---

### getVariationValue(Product, ProductVariationAttribute)
- getVariationValue(variantOrVariationGroup: [Product](dw.catalog.Product.md), attribute: [ProductVariationAttribute](dw.catalog.ProductVariationAttribute.md)): [ProductVariationAttributeValue](dw.catalog.ProductVariationAttributeValue.md)
  - : Returns the value for the specified variant or variation group product and
      variation attribute. The specified product should be a [Variant](dw.catalog.Variant.md)
      returned by [getVariants()](dw.catalog.ProductVariationModel.md#getvariants) or a [VariationGroup](dw.catalog.VariationGroup.md) returned by
      [getVariationGroups()](dw.catalog.ProductVariationModel.md#getvariationgroups). The variation attribute should be one returned by
      [getProductVariationAttributes()](dw.catalog.ProductVariationModel.md#getproductvariationattributes). If an invalid product or attribute is passed,
      null is returned. If null is passed for either argument, an exception is thrown.


    **Parameters:**
    - variantOrVariationGroup - the variant or variation group product to retrieve a value for,         must not be null.
    - attribute - the product variation attribute to get the value for, must not be null.

    **Returns:**
    - the attribute value for the specified variant or variation group and attribute, or
              null if an invalid variant, variation group or attribute is passed or the variation
              group define no value for the variation attribute.



---

### hasOrderableVariants(ProductVariationAttribute, ProductVariationAttributeValue)
- hasOrderableVariants(attribute: [ProductVariationAttribute](dw.catalog.ProductVariationAttribute.md), value: [ProductVariationAttributeValue](dw.catalog.ProductVariationAttributeValue.md)): [Boolean](TopLevel.Boolean.md)
  - : Returns true if any variant is available with the specified value of the
      specified variation attribute. Available means that the variant is
      orderable according to the variant's availability model. This method
      takes currently selected attribute values into consideration. The
      specific rules are as follows:
      
      - If no variation value is currently selected, the method returns true  if any variant with the specified value is available, else false.
      - if one or more variation values are selected, the method returns true  if any variant with a combination of the specified value and the selected  value is available, else false.
      - if all variation values are selected, the method returns true of the  variant that is represented by the current selection is available, else  false.


    **Parameters:**
    - attribute - The product variation attribute whose values are to be             tested for orderable variants.
    - value - The specific attribute value to test for orderable variants.

    **Returns:**
    - true if any variant is available with the specified value of the
              specified variation attribute based on the currently selected
              attribute values, false otherwise.



---

### isSelectedAttributeValue(ProductVariationAttribute, ProductVariationAttributeValue)
- isSelectedAttributeValue(attribute: [ProductVariationAttribute](dw.catalog.ProductVariationAttribute.md), value: [ProductVariationAttributeValue](dw.catalog.ProductVariationAttributeValue.md)): [Boolean](TopLevel.Boolean.md)
  - : Identifies if the specified product variation attribute value is the one
      currently selected.


    **Parameters:**
    - attribute - the attribute to check.
    - value - the value to check for selection.

    **Returns:**
    - true if the specified variation attribute value is currently
              selected, false otherwise.



---

### isSelectedAttributeValue(ObjectAttributeDefinition, ObjectAttributeValueDefinition)
- ~~isSelectedAttributeValue(attribute: [ObjectAttributeDefinition](dw.object.ObjectAttributeDefinition.md), value: [ObjectAttributeValueDefinition](dw.object.ObjectAttributeValueDefinition.md)): [Boolean](TopLevel.Boolean.md)~~
  - : Identifies if the specified variation value is the one currently
      selected.


    **Parameters:**
    - attribute - the attribute to check.
    - value - the value to check for selection.

    **Returns:**
    - true if the specified variation value is currently selected,
              false otherwise.


    **Deprecated:**
:::warning
Use
            [isSelectedAttributeValue(ProductVariationAttribute, ProductVariationAttributeValue)](dw.catalog.ProductVariationModel.md#isselectedattributevalueproductvariationattribute-productvariationattributevalue)
            to identify if the specified product variation attribute
            value is the one currently selected.

:::

---

### setSelectedAttributeValue(String, String)
- setSelectedAttributeValue(variationAttributeID: [String](TopLevel.String.md), variationAttributeValueID: [String](TopLevel.String.md)): void
  - : Applies a selected attribute value to this model instance.
      Usually this method is used to set the model state corresponding to the variation attribute values
      specified by a URL. The URLs can be obtained by using one of the models URL methods, like
      [urlSelectVariationValue(String, ProductVariationAttribute, ProductVariationAttributeValue)](dw.catalog.ProductVariationModel.md#urlselectvariationvaluestring-productvariationattribute-productvariationattributevalue) and
      [urlUnselectVariationValue(String, ProductVariationAttribute)](dw.catalog.ProductVariationModel.md#urlunselectvariationvaluestring-productvariationattribute).
      
      Anyway, there are some limitations to keep in mind when selecting variation attribute values.
      A Variation Model created for a Variation Group or Variant Product is bound to an initial state.
      Example:
      
      - A Variation Model created for Variation Group A can't be switched to Variation Group B.
      - A Variation Model created for Variant A can't be switched to Variant B.
      - The state of a Variation Model for a Variation Group that defines color = red can't be changed to color = black.
      - The state of a Variation Model for a Variant that defines color = red / size = L can't be changed to color = black / size = S.  However, the state of a Variation Model created for a Variation Group that defines color = red  can be changed to a more specific state by adding another selected value, e.g. size = L.
      
      The state of a Variation Model created for a Variation Master can be changed in any possible way
      because the initial state involves all variation values and Variants.


    **Parameters:**
    - variationAttributeID - the ID of an product variation attribute, must not be `null`, otherwise a exception is thrown
    - variationAttributeValueID - the ID of the product variation attribute value to apply, this value must not be part of the initial model state (e.g. the variant or group that the model has been created for), otherwise a exception is thrown


---

### url(String, Object...)
- url(action: [String](TopLevel.String.md), varAttrAndValues: [Object...](TopLevel.Object.md)): [URL](dw.web.URL.md)
  - : Constructs a URL to select a set of variation attribute values. The
      optional `varAttrAndValues` argument can be empty, or can
      contain one or more variation attribute / value pairs. This variable list
      should be even in length, with attributes and values alternating.
      Attributes can be specified as instances of ProductVariationAttribute, or
      String variation attribute ID. (Note: ObjectAttributeDefinition IDs are
      not supported.) Values can be specified as instances of
      ProductVariationAttributeValue or String or Integer depending on the data
      type of the variation attribute. If a parameter type is invalid, or does
      not reference a valid ProductVariationAttribute or
      ProductVariationAttributeValue, then the parameter pair is not included
      in the generated URL. The returned URL will contain variation attributes
      and values already selected in the product variation model, as well as
      attributes and values specified as method parameters. 
      
      
      Sample usage: 
      
      
      
      ```
      master.variationModel.url("Product-Show", "color", "red", "size", "XL"); 
      
      master.variationModel.url("Product-Show", colorVarAttr, colorValue, sizeVarAttr, sizeValue); 
      
      // --> on/demandware.store/Sites-SiteGenesis-Site/default/Product-Show?pid=master_id&dwvar_color=red&dwvar_size=XL
      ```


    **Parameters:**
    - action - The pipeline action.
    - varAttrAndValues - Variable length list of attributes and             corresponding values to select.

    **Returns:**
    - The constructed URL.


---

### urlSelectVariationValue(String, ProductVariationAttribute, ProductVariationAttributeValue)
- urlSelectVariationValue(action: [String](TopLevel.String.md), attribute: [ProductVariationAttribute](dw.catalog.ProductVariationAttribute.md), value: [ProductVariationAttributeValue](dw.catalog.ProductVariationAttributeValue.md)): [String](TopLevel.String.md)
  - : Generates a URL for selecting a value for a given variation attribute.
      This URL is intended to be used on dynamic product detail pages. When a
      customer selects which value he wants for one of the variation
      attributes, the product detail page can issue a request to the passed URL
      which in turn can invoke the
      `UpdateProductVariationSelections` pipelet. That pipelet reads
      the querystring parameters and returns an updated variation model with
      the desired attribute value selected.
      
      
      The generated URL will be an absolute URL which uses the protocol of
      the current request.


    **Parameters:**
    - action - the pipeline action, e.g. "Product-Show".
    - attribute - the product variation attribute to select a value for.
    - value - the product variation attribute value to select.

    **Returns:**
    - the generated URL, an absolute URL which uses the protocol of the
              current request.



---

### urlSelectVariationValue(String, ObjectAttributeDefinition, ObjectAttributeValueDefinition)
- ~~urlSelectVariationValue(action: [String](TopLevel.String.md), attribute: [ObjectAttributeDefinition](dw.object.ObjectAttributeDefinition.md), value: [ObjectAttributeValueDefinition](dw.object.ObjectAttributeValueDefinition.md)): [String](TopLevel.String.md)~~
  - : Constructs an URL to select the specified value of the specified
      variation attribute.
      
      
      The generated URL will be an absolute URL which uses the protocol of the
      current request.


    **Parameters:**
    - action - the pipeline action, e.g. "Product-Show".
    - attribute - the attribute to select a value for.
    - value - the attribute definition value portion of the variation.

    **Returns:**
    - the generated URL, an absolute URL which uses the protocol of the
              current request.


    **Deprecated:**
:::warning
Use
            [urlSelectVariationValue(String, ProductVariationAttribute, ProductVariationAttributeValue)](dw.catalog.ProductVariationModel.md#urlselectvariationvaluestring-productvariationattribute-productvariationattributevalue)
            to construct an URL to select the specified product variation
            attribute value of the specified product variation attribute.

:::

---

### urlUnselectVariationValue(String, ProductVariationAttribute)
- urlUnselectVariationValue(action: [String](TopLevel.String.md), attribute: [ProductVariationAttribute](dw.catalog.ProductVariationAttribute.md)): [String](TopLevel.String.md)
  - : Generates a URL for unselecting a value for a given variation attribute.
      This URL is intended to be used on dynamic product detail pages. When a
      customer deselects a value for one of the variation attributes, the
      product detail page can issue a request to the passed URL which in turn
      can invoke the `UpdateProductVariationSelections` pipelet.
      That pipelet reads the querystring parameters and returns an updated
      variation model with the desired attribute value unselected.
      
      
      The generated URL will be an absolute URL which uses the protocol of
      the current request.


    **Parameters:**
    - action - the pipeline action, e.g. "Product-Show".
    - attribute - the product variation attribute to unselect.

    **Returns:**
    - the generated URL, an absolute URL which uses the protocol of the
              current request.



---

### urlUnselectVariationValue(String, ObjectAttributeDefinition)
- ~~urlUnselectVariationValue(action: [String](TopLevel.String.md), attribute: [ObjectAttributeDefinition](dw.object.ObjectAttributeDefinition.md)): [String](TopLevel.String.md)~~
  - : Constructs an URL to unselect the value of the specified variation
      attribute.
      
      
      The generated URL will be an absolute URL which uses the protocol of the
      current request.


    **Parameters:**
    - action - the pipeline action, e.g. "Product-Show".
    - attribute - the attribute to unselect.

    **Returns:**
    - the generated URL, an absolute URL which uses the protocol of the
              current request.


    **Deprecated:**
:::warning
Use
            [urlUnselectVariationValue(String, ProductVariationAttribute)](dw.catalog.ProductVariationModel.md#urlunselectvariationvaluestring-productvariationattribute)
            to unselect the product variation attribute value of the
            specified product variation attribute.

:::

---

<!-- prettier-ignore-end -->
