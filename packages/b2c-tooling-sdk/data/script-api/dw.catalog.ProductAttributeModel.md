<!-- prettier-ignore-start -->
# Class ProductAttributeModel

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.catalog.ProductAttributeModel](dw.catalog.ProductAttributeModel.md)

Class representing the complete attribute model for products in the system.
An instance of this class provides methods to access the attribute
definitions and groups for the system object type 'Product' and perhaps
additional information depending on how the instance is obtained.
A ProductAttributeModel can be obtained in one of three ways:


- **[ProductAttributeModel()](dw.catalog.ProductAttributeModel.md#productattributemodel):**When the no-arg constructor is  used the model represents:     
  - the attribute groups of the system object type 'Product' (i.e. the       global product attribute groups) and their bound attributes

- **[Category.getProductAttributeModel()](dw.catalog.Category.md#getproductattributemodel):**When the  attribute model for a Category is retrieved, the model represents:     
  - the global product attribute groups
  - product attribute groups of the calling category
  - product attribute groups of any parent categories of the calling category

- **[Product.getAttributeModel()](dw.catalog.Product.md#getattributemodel):**When the attribute  model for a Product is retrieved, the model represents:     
  - the global product attribute groups
  - product attribute groups of the product's classification category
  - product attribute groups of any parent categories of the product's classification category
In this case, the model additionally provides access to the attribute values
of the product.  If the product lacks a classification category, then only
the global product attribute group is considered by the model.


The ProductAttributeModel provides a generic way to display the attribute
values of a product on a product detail page organized into appropriate
visual groups.  This is typically done as follows:


- On the product detail page, call  [Product.getAttributeModel()](dw.catalog.Product.md#getattributemodel)to get the attribute model for  the product.
- Call [getVisibleAttributeGroups()](dw.catalog.ProductAttributeModel.md#getvisibleattributegroups)to get the groups that are  appropriate for this product and all other products assigned to the same  classification category.
- Iterate the groups, and display each as a "group" in the UI.
- Call [getVisibleAttributeDefinitions(ObjectAttributeGroup)](dw.catalog.ProductAttributeModel.md#getvisibleattributedefinitionsobjectattributegroup)for  each group. Iterate and display the attribute names using  [ObjectAttributeDefinition.getDisplayName()](dw.object.ObjectAttributeDefinition.md#getdisplayname).
- For each attribute, get the product's display value(s) for that  attribute, using `getDisplayValue()`. This might require custom  display logic based on the type of attribute (strings, dates, multi-value  attributes, etc).



## Property Summary

| Property | Description |
| --- | --- |
| [attributeGroups](#attributegroups): [Collection](dw.util.Collection.md) `(read-only)` | Returns a sorted collection of attribute groups of this model. |
| [orderRequiredAttributeDefinitions](#orderrequiredattributedefinitions): [Collection](dw.util.Collection.md) `(read-only)` | Returns an unsorted collection of attribute definitions marked as  order-required. |
| [visibleAttributeGroups](#visibleattributegroups): [Collection](dw.util.Collection.md) `(read-only)` | Returns a sorted collection of visible attribute groups of this model. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [ProductAttributeModel](#productattributemodel)() | Constructs a product attribute model that is not based on a product nor  a category. |

## Method Summary

| Method | Description |
| --- | --- |
| [getAttributeDefinition](dw.catalog.ProductAttributeModel.md#getattributedefinitionstring)([String](TopLevel.String.md)) | Returns the attribute definition with the given id from the product attribute  model. |
| [getAttributeDefinitions](dw.catalog.ProductAttributeModel.md#getattributedefinitionsobjectattributegroup)([ObjectAttributeGroup](dw.object.ObjectAttributeGroup.md)) | Returns a sorted collection of attribute definitions for the given attribute  group. |
| [getAttributeGroup](dw.catalog.ProductAttributeModel.md#getattributegroupstring)([String](TopLevel.String.md)) | Returns the attribute group with the given id from the product attribute  model. |
| [getAttributeGroups](dw.catalog.ProductAttributeModel.md#getattributegroups)() | Returns a sorted collection of attribute groups of this model. |
| [getDisplayValue](dw.catalog.ProductAttributeModel.md#getdisplayvalueobjectattributedefinition---variant-1)([ObjectAttributeDefinition](dw.object.ObjectAttributeDefinition.md)) | Returns the value that the underlying product defines for the given  attribute definition in the current locale. |
| [getDisplayValue](dw.catalog.ProductAttributeModel.md#getdisplayvalueobjectattributedefinition---variant-2)([ObjectAttributeDefinition](dw.object.ObjectAttributeDefinition.md)) | Returns the value that the underlying product defines for the given  attribute definition in the current locale. |
| [getOrderRequiredAttributeDefinitions](dw.catalog.ProductAttributeModel.md#getorderrequiredattributedefinitions)() | Returns an unsorted collection of attribute definitions marked as  order-required. |
| [getValue](dw.catalog.ProductAttributeModel.md#getvalueobjectattributedefinition---variant-1)([ObjectAttributeDefinition](dw.object.ObjectAttributeDefinition.md)) | Returns the attribute value for the specified attribute  definition. |
| [getValue](dw.catalog.ProductAttributeModel.md#getvalueobjectattributedefinition---variant-2)([ObjectAttributeDefinition](dw.object.ObjectAttributeDefinition.md)) | Returns the attribute value for the specified attribute definition. |
| [getVisibleAttributeDefinitions](dw.catalog.ProductAttributeModel.md#getvisibleattributedefinitionsobjectattributegroup)([ObjectAttributeGroup](dw.object.ObjectAttributeGroup.md)) | Returns a sorted collection of all visible attribute definitions for the  given attribute group. |
| [getVisibleAttributeGroups](dw.catalog.ProductAttributeModel.md#getvisibleattributegroups)() | Returns a sorted collection of visible attribute groups of this model. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### attributeGroups
- attributeGroups: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns a sorted collection of attribute groups of this model. The groups
      returned depends on how this model is constructed and what it represents.
      (See class-level documentation for details).
      
      
      The collection of returned groups is sorted first by scope and secondly
      by explicit sort order. Global groups always appear before
      category-specific groups in the list. Groups of parent categories always
      appear before groups belonging to subcategories. At each scope, groups
      have an explicit sort order which can be managed within the Business
      Manager.
      
      
      When there are multiple attribute groups with the same ID, the following
      rules apply:
      
      
      - If this model represents the global product attribute group only  (e.g. the no-arg constructor was used), duplicates cannot occur since  only one group can be defined with a given ID at that scope.
      - If this model is associated with specific categories (e.g. it is  constructed from a product with a classification category), then a  category product attribute group might have the same ID as a global  product attribute group. In this case, the category group overrides the  global one.
      - If a category and one of its ancestor categories both define a  product attribute group with the same ID, the sub-category group  overrides the parent group.
      
      
      As a result of these rules, this method will never return two attribute
      groups with the same ID.



---

### orderRequiredAttributeDefinitions
- orderRequiredAttributeDefinitions: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns an unsorted collection of attribute definitions marked as
      order-required. Order-required attributes are usually copied into order
      line items.
      
      
      The returned attribute definitions are sorted according to the explicit
      sort order defined for the attributes in the group. This is managed by
      merchant in the Business Manager.



---

### visibleAttributeGroups
- visibleAttributeGroups: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns a sorted collection of visible attribute groups of this model.
      This method is similar to [getAttributeGroups()](dw.catalog.ProductAttributeModel.md#getattributegroups) but only includes
      attribute groups containing at least one attribute definition that is
      visible. See
      [getVisibleAttributeDefinitions(ObjectAttributeGroup)](dw.catalog.ProductAttributeModel.md#getvisibleattributedefinitionsobjectattributegroup).



---

## Constructor Details

### ProductAttributeModel()
- ProductAttributeModel()
  - : Constructs a product attribute model that is not based on a product nor
      a category. Therefore, the model only describes the product attributes
      globally defined for the system object type 'Product'.



---

## Method Details

### getAttributeDefinition(String)
- getAttributeDefinition(id: [String](TopLevel.String.md)): [ObjectAttributeDefinition](dw.object.ObjectAttributeDefinition.md)
  - : Returns the attribute definition with the given id from the product attribute
      model. If attribute definition does not exist, null is returned.


    **Parameters:**
    - id - the identifier of the attribute definition.

    **Returns:**
    - attribute definition or null if not exist


---

### getAttributeDefinitions(ObjectAttributeGroup)
- getAttributeDefinitions(group: [ObjectAttributeGroup](dw.object.ObjectAttributeGroup.md)): [Collection](dw.util.Collection.md)
  - : Returns a sorted collection of attribute definitions for the given attribute
      group. If no attribute definition exist for the group, an empty collection
      is returned.
      
      
      The returned attribute definitions are sorted according to the explicit
      sort order defined for the attributes in the group.  This is managed
      by merchant in the Business Manager.


    **Parameters:**
    - group - the group whose attribute definitions are returned.

    **Returns:**
    - a sorted collection of ObjectAttributeDefinition instances.


---

### getAttributeGroup(String)
- getAttributeGroup(id: [String](TopLevel.String.md)): [ObjectAttributeGroup](dw.object.ObjectAttributeGroup.md)
  - : Returns the attribute group with the given id from the product attribute
      model. If attribute group does not exist, null is returned.


    **Parameters:**
    - id - the attribute group identifier.

    **Returns:**
    - the attribute group or null if not exist


---

### getAttributeGroups()
- getAttributeGroups(): [Collection](dw.util.Collection.md)
  - : Returns a sorted collection of attribute groups of this model. The groups
      returned depends on how this model is constructed and what it represents.
      (See class-level documentation for details).
      
      
      The collection of returned groups is sorted first by scope and secondly
      by explicit sort order. Global groups always appear before
      category-specific groups in the list. Groups of parent categories always
      appear before groups belonging to subcategories. At each scope, groups
      have an explicit sort order which can be managed within the Business
      Manager.
      
      
      When there are multiple attribute groups with the same ID, the following
      rules apply:
      
      
      - If this model represents the global product attribute group only  (e.g. the no-arg constructor was used), duplicates cannot occur since  only one group can be defined with a given ID at that scope.
      - If this model is associated with specific categories (e.g. it is  constructed from a product with a classification category), then a  category product attribute group might have the same ID as a global  product attribute group. In this case, the category group overrides the  global one.
      - If a category and one of its ancestor categories both define a  product attribute group with the same ID, the sub-category group  overrides the parent group.
      
      
      As a result of these rules, this method will never return two attribute
      groups with the same ID.


    **Returns:**
    - collection of all attribute groups.


---

### getDisplayValue(ObjectAttributeDefinition) - Variant 1
- getDisplayValue(definition: [ObjectAttributeDefinition](dw.object.ObjectAttributeDefinition.md)): [Object](TopLevel.Object.md)
  - : Returns the value that the underlying product defines for the given
      attribute definition in the current locale. In case the attribute
      definition defines localized attribute values, the product's value is
      used as an id to find the localized display value.


    **Parameters:**
    - definition - the definition to use.

    **Returns:**
    - The localized product attribute display value.

    **API Version:**
:::note
No longer available as of version 10.6.
:::

---

### getDisplayValue(ObjectAttributeDefinition) - Variant 2
- getDisplayValue(definition: [ObjectAttributeDefinition](dw.object.ObjectAttributeDefinition.md)): [Object](TopLevel.Object.md)
  - : Returns the value that the underlying product defines for the given
      attribute definition in the current locale. In case the attribute definition
      defines localized attribute values, the product's value is used as an id
      to find the localized display value.
      
      In case of an Image attribute this method returns a MediaFile instance.
      In previous versions this method returned a String with the image path.
      In case of an HTML attribute this method returns a MarkupText instance.
      In previous versions this method returned a String with the HTML source.


    **Parameters:**
    - definition - the definition to use.

    **Returns:**
    - The localized product attribute display value.

    **API Version:**
:::note
Available from version 10.6.
In prior versions this method returned a String with the image path or a String with the HTML source
:::

---

### getOrderRequiredAttributeDefinitions()
- getOrderRequiredAttributeDefinitions(): [Collection](dw.util.Collection.md)
  - : Returns an unsorted collection of attribute definitions marked as
      order-required. Order-required attributes are usually copied into order
      line items.
      
      
      The returned attribute definitions are sorted according to the explicit
      sort order defined for the attributes in the group. This is managed by
      merchant in the Business Manager.


    **Returns:**
    - a collection of order-required ObjectAttributeDefinition
              instances.



---

### getValue(ObjectAttributeDefinition) - Variant 1
- getValue(definition: [ObjectAttributeDefinition](dw.object.ObjectAttributeDefinition.md)): [Object](TopLevel.Object.md)
  - : Returns the attribute value for the specified attribute
      definition. If the product does not define a value, null is returned.
      
      
      Note: this method may only be used where the attribute model was created for
      a specific product; otherwise it will always return null.
      
      
      If the attribute is localized, the value for the current session locale
      is returned.


    **Parameters:**
    - definition - the attribute definition to use when locating  and returning the value.

    **Returns:**
    - value the value associated with the object attribute definition.

    **API Version:**
:::note
No longer available as of version 10.6.
:::

---

### getValue(ObjectAttributeDefinition) - Variant 2
- getValue(definition: [ObjectAttributeDefinition](dw.object.ObjectAttributeDefinition.md)): [Object](TopLevel.Object.md)
  - : Returns the attribute value for the specified attribute definition. If
      the product does not define a value, null is returned.
      
      
      Note: this method may only be used where the attribute model was created
      for a specific product; otherwise it will always return null.
      
      
      If the attribute is localized, the value for the current session locale
      is returned.
      
      
      In case of an Image attribute this method returns a MediaFile instance.
      In previous versions this method returned a String with the image path.
      In case of an HTML attribute this method returns a MarkupText instance.
      In previous versions this method returned a String with the HTML source.


    **Parameters:**
    - definition - the attribute definition to use when locating and             returning the value.

    **Returns:**
    - value the value associated with the object attribute definition.

    **API Version:**
:::note
Available from version 10.6.
In prior versions this method returned a String with the image path or a String with the HTML source.
:::

---

### getVisibleAttributeDefinitions(ObjectAttributeGroup)
- getVisibleAttributeDefinitions(group: [ObjectAttributeGroup](dw.object.ObjectAttributeGroup.md)): [Collection](dw.util.Collection.md)
  - : Returns a sorted collection of all visible attribute definitions for the
      given attribute group. If no visible attribute definition exist for the
      group, an empty collection is returned.
      
      
      An attribute definition is considered visible if is marked as visible. If
      the product attribute model is created for a specific product, the
      product must also define a value for the attribute definition; else the
      attribute definition is considered as invisible.
      
      
      The returned attribute definitions are sorted according to the explicit
      sort order defined for the attributes in the group. This is managed by
      merchant in the Business Manager.


    **Parameters:**
    - group - the group whose visible attribute definitions are returned.

    **Returns:**
    - a sorted collection of visible ObjectAttributeDefinition
              instances.



---

### getVisibleAttributeGroups()
- getVisibleAttributeGroups(): [Collection](dw.util.Collection.md)
  - : Returns a sorted collection of visible attribute groups of this model.
      This method is similar to [getAttributeGroups()](dw.catalog.ProductAttributeModel.md#getattributegroups) but only includes
      attribute groups containing at least one attribute definition that is
      visible. See
      [getVisibleAttributeDefinitions(ObjectAttributeGroup)](dw.catalog.ProductAttributeModel.md#getvisibleattributedefinitionsobjectattributegroup).


    **Returns:**
    - sorted collection of visible ObjectAttributeGroup instances.


---

<!-- prettier-ignore-end -->
