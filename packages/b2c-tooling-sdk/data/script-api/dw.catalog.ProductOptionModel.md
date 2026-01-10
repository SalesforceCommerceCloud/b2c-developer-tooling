<!-- prettier-ignore-start -->
# Class ProductOptionModel

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.catalog.ProductOptionModel](dw.catalog.ProductOptionModel.md)

This class represents the option model of a specific product and
for a specific currency. It provides accessor methods to the configured
options and the values of those options. It has also methods to set a
specific selection of option values.



## Property Summary

| Property | Description |
| --- | --- |
| [options](#options): [Collection](dw.util.Collection.md) `(read-only)` | Returns the collection of product options. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getOption](dw.catalog.ProductOptionModel.md#getoptionstring)([String](TopLevel.String.md)) | Returns the product option for the specified ID. |
| [getOptionValue](dw.catalog.ProductOptionModel.md#getoptionvalueproductoption-string)([ProductOption](dw.catalog.ProductOption.md), [String](TopLevel.String.md)) | Returns the product option value object for the passed value id and in  the context of the passed option. |
| [getOptionValues](dw.catalog.ProductOptionModel.md#getoptionvaluesproductoption)([ProductOption](dw.catalog.ProductOption.md)) | Returns a collection of product option values for the  specified product option. |
| [getOptions](dw.catalog.ProductOptionModel.md#getoptions)() | Returns the collection of product options. |
| [getPrice](dw.catalog.ProductOptionModel.md#getpriceproductoptionvalue)([ProductOptionValue](dw.catalog.ProductOptionValue.md)) | Returns the effective price of the specified option value. |
| [getSelectedOptionValue](dw.catalog.ProductOptionModel.md#getselectedoptionvalueproductoption)([ProductOption](dw.catalog.ProductOption.md)) | Returns the selected value for the specified product option. |
| [isSelectedOptionValue](dw.catalog.ProductOptionModel.md#isselectedoptionvalueproductoption-productoptionvalue)([ProductOption](dw.catalog.ProductOption.md), [ProductOptionValue](dw.catalog.ProductOptionValue.md)) | Returns true if the specified option value is the one currently selected,  false otherwise. |
| [setSelectedOptionValue](dw.catalog.ProductOptionModel.md#setselectedoptionvalueproductoption-productoptionvalue)([ProductOption](dw.catalog.ProductOption.md), [ProductOptionValue](dw.catalog.ProductOptionValue.md)) | Updates the selection of the specified option based on the specified value. |
| [url](dw.catalog.ProductOptionModel.md#urlstring-object)([String](TopLevel.String.md), [Object...](TopLevel.Object.md)) | Returns a URL that can be used to select one or more option values. |
| [urlSelectOptionValue](dw.catalog.ProductOptionModel.md#urlselectoptionvaluestring-productoption-productoptionvalue)([String](TopLevel.String.md), [ProductOption](dw.catalog.ProductOption.md), [ProductOptionValue](dw.catalog.ProductOptionValue.md)) | Returns an URL that can be used to select a specific value of a specific  option. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### options
- options: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns the collection of product options.


---

## Method Details

### getOption(String)
- getOption(optionID: [String](TopLevel.String.md)): [ProductOption](dw.catalog.ProductOption.md)
  - : Returns the product option for the specified ID.

    **Parameters:**
    - optionID - the product option identifier.

    **Returns:**
    - the product option for the specified ID.


---

### getOptionValue(ProductOption, String)
- getOptionValue(option: [ProductOption](dw.catalog.ProductOption.md), valueID: [String](TopLevel.String.md)): [ProductOptionValue](dw.catalog.ProductOptionValue.md)
  - : Returns the product option value object for the passed value id and in
      the context of the passed option.


    **Parameters:**
    - option - The option to get the specified value for.
    - valueID - The id of the value to retrieve

    **Returns:**
    - a value for the specified product option and value id


---

### getOptionValues(ProductOption)
- getOptionValues(option: [ProductOption](dw.catalog.ProductOption.md)): [Collection](dw.util.Collection.md)
  - : Returns a collection of product option values for the
      specified product option.


    **Parameters:**
    - option - the option for which we want to extract  the collection of product option values.

    **Returns:**
    - a collection of product option values for the
      specified product option.



---

### getOptions()
- getOptions(): [Collection](dw.util.Collection.md)
  - : Returns the collection of product options.

    **Returns:**
    - Collection of Product Options.


---

### getPrice(ProductOptionValue)
- getPrice(optionValue: [ProductOptionValue](dw.catalog.ProductOptionValue.md)): [Money](dw.value.Money.md)
  - : Returns the effective price of the specified option value.

    **Parameters:**
    - optionValue - the product option value to use.

    **Returns:**
    - the effective price of the specified option value.


---

### getSelectedOptionValue(ProductOption)
- getSelectedOptionValue(option: [ProductOption](dw.catalog.ProductOption.md)): [ProductOptionValue](dw.catalog.ProductOptionValue.md)
  - : Returns the selected value for the specified product option. If no
      option values was set as selected option explicitly, the method
      returns the default option value for this option.


    **Parameters:**
    - option - The option to get the selected value for.

    **Returns:**
    - a selected value for the specified product option.


---

### isSelectedOptionValue(ProductOption, ProductOptionValue)
- isSelectedOptionValue(option: [ProductOption](dw.catalog.ProductOption.md), value: [ProductOptionValue](dw.catalog.ProductOptionValue.md)): [Boolean](TopLevel.Boolean.md)
  - : Returns true if the specified option value is the one currently selected,
      false otherwise.


    **Parameters:**
    - option - the product option.
    - value - the product option value.

    **Returns:**
    - true if the specified option value is the one currently selected,
      false otherwise.



---

### setSelectedOptionValue(ProductOption, ProductOptionValue)
- setSelectedOptionValue(option: [ProductOption](dw.catalog.ProductOption.md), value: [ProductOptionValue](dw.catalog.ProductOptionValue.md)): void
  - : Updates the selection of the specified option based on the specified value.

    **Parameters:**
    - option - the option to update.
    - value - the value to use when updating the product option.


---

### url(String, Object...)
- url(action: [String](TopLevel.String.md), varOptionAndValues: [Object...](TopLevel.Object.md)): [URL](dw.web.URL.md)
  - : Returns a URL that can be used to select one or more option values. The
      optional `varOptionAndValues` argument can be empty, or can
      contain one or more option / value pairs. This variable list must be even
      in length, with options and values alternating. If the list is odd in
      length, the last argument will be ignored. Options can be specified as
      instances of ProductOption, or String option ID. Values can be specified
      as instances of ProductOptionValue or as strings representing the value
      ID. If a parameter is invalid, then the parameter pair is not included in
      the generated URL. The returned URL will contain options and values
      already selected in the product option model, as well as options and
      values specified as method parameters. This includes option values
      explicitly selected and implicitly selected by default.


    **Parameters:**
    - action - The pipeline action, must not be null.
    - varOptionAndValues - Variable length list of options and values.

    **Returns:**
    - The constructed URL.


---

### urlSelectOptionValue(String, ProductOption, ProductOptionValue)
- urlSelectOptionValue(action: [String](TopLevel.String.md), option: [ProductOption](dw.catalog.ProductOption.md), value: [ProductOptionValue](dw.catalog.ProductOptionValue.md)): [String](TopLevel.String.md)
  - : Returns an URL that can be used to select a specific value of a specific
      option.


    **Parameters:**
    - action - the action to use.
    - option - the option to use when constructing the URL.
    - value - the value to use when constructing the URL.

    **Returns:**
    - The constructed URL as string.


---

<!-- prettier-ignore-end -->
