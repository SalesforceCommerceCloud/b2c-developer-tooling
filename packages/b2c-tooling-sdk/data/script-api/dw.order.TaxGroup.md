<!-- prettier-ignore-start -->
# Class TaxGroup

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.order.TaxGroup](dw.order.TaxGroup.md)

Contains the formal definition of a tax including a type (it's just the key), a [percentage value](dw.order.TaxGroup.md#getrate)
if provided, a [caption](dw.order.TaxGroup.md#getcaption) and a [description](dw.order.TaxGroup.md#getdescription).



## Property Summary

| Property | Description |
| --- | --- |
| [caption](#caption): [String](TopLevel.String.md) `(read-only)` | Gets the caption. |
| [description](#description): [String](TopLevel.String.md) `(read-only)` | Gets the description. |
| [rate](#rate): [Number](TopLevel.Number.md) `(read-only)` | Gets the percentage amount of the rate. |
| [taxType](#taxtype): [String](TopLevel.String.md) `(read-only)` | Gets the tax type. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| static [create](dw.order.TaxGroup.md#createstring-string-string-decimal)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Decimal](dw.util.Decimal.md)) | Creates a TaxGroup. |
| [getCaption](dw.order.TaxGroup.md#getcaption)() | Gets the caption. |
| [getDescription](dw.order.TaxGroup.md#getdescription)() | Gets the description. |
| [getRate](dw.order.TaxGroup.md#getrate)() | Gets the percentage amount of the rate. |
| [getTaxType](dw.order.TaxGroup.md#gettaxtype)() | Gets the tax type. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### caption
- caption: [String](TopLevel.String.md) `(read-only)`
  - : Gets the caption.


---

### description
- description: [String](TopLevel.String.md) `(read-only)`
  - : Gets the description.


---

### rate
- rate: [Number](TopLevel.Number.md) `(read-only)`
  - : Gets the percentage amount of the rate.


---

### taxType
- taxType: [String](TopLevel.String.md) `(read-only)`
  - : Gets the tax type.


---

## Method Details

### create(String, String, String, Decimal)
- static create(taxType: [String](TopLevel.String.md), caption: [String](TopLevel.String.md), description: [String](TopLevel.String.md), taxRate: [Decimal](dw.util.Decimal.md)): [TaxGroup](dw.order.TaxGroup.md)
  - : Creates a TaxGroup. 
      
      This TaxGroup can be used for example in [ReturnItem.addTaxItem(Decimal, TaxGroup)](dw.order.ReturnItem.md#addtaxitemdecimal-taxgroup).


    **Parameters:**
    - taxType - the tax type
    - caption - the caption
    - description - the description
    - taxRate - the tax rate as floating point.              `1.0` means 100 %.

    **Returns:**
    - the tax group


---

### getCaption()
- getCaption(): [String](TopLevel.String.md)
  - : Gets the caption.

    **Returns:**
    - the caption


---

### getDescription()
- getDescription(): [String](TopLevel.String.md)
  - : Gets the description.

    **Returns:**
    - the description


---

### getRate()
- getRate(): [Number](TopLevel.Number.md)
  - : Gets the percentage amount of the rate.

    **Returns:**
    - the tax rate percentage value


---

### getTaxType()
- getTaxType(): [String](TopLevel.String.md)
  - : Gets the tax type.

    **Returns:**
    - the tax type


---

<!-- prettier-ignore-end -->
