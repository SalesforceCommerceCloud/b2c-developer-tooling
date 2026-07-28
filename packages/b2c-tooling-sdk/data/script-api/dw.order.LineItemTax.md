<!-- prettier-ignore-start -->
# Class LineItemTax

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.order.LineItemTax](dw.order.LineItemTax.md)

A tax on a line item: tax identifier, rate, and optional amount. Use with [LineItem.setTaxes(Collection)](dw.order.LineItem.md#settaxescollection)
and [LineItem.getTaxes()](dw.order.LineItem.md#gettaxes).


Create instances via [new LineItemTax(taxId, taxRate)](dw.order.LineItemTax.md#lineitemtaxstring-number) to have the
server compute the tax value, or via
[new LineItemTax(taxId, taxRate, taxValue)](dw.order.LineItemTax.md#lineitemtaxstring-number-money) to provide a
pre-computed tax value.




Access is currently restricted to select pilot customers and controlled via feature toggle.


**See Also:**
- [LineItem.getTaxes()](dw.order.LineItem.md#gettaxes)
- [LineItem.setTaxes(Collection)](dw.order.LineItem.md#settaxescollection)


## Property Summary

| Property | Description |
| --- | --- |
| [taxId](#taxid): [String](TopLevel.String.md) `(read-only)` | Gets the tax identifier (e.g. |
| [taxRate](#taxrate): [Number](TopLevel.Number.md) `(read-only)` | Gets the tax rate as a decimal (e.g. |
| [taxValue](#taxvalue): [Money](dw.value.Money.md) `(read-only)` | Gets the tax value (amount) in purchase currency, or null if computed from rate and tax basis. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [LineItemTax](#lineitemtaxstring-number)([String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Creates a tax item for use with [LineItem.setTaxes(Collection)](dw.order.LineItem.md#settaxescollection). |
| [LineItemTax](#lineitemtaxstring-number-money)([String](TopLevel.String.md), [Number](TopLevel.Number.md), [Money](dw.value.Money.md)) | Creates a tax item for use with [LineItem.setTaxes(Collection)](dw.order.LineItem.md#settaxescollection). |

## Method Summary

| Method | Description |
| --- | --- |
| [getTaxId](dw.order.LineItemTax.md#gettaxid)() | Gets the tax identifier (e.g. |
| [getTaxRate](dw.order.LineItemTax.md#gettaxrate)() | Gets the tax rate as a decimal (e.g. |
| [getTaxValue](dw.order.LineItemTax.md#gettaxvalue)() | Gets the tax value (amount) in purchase currency, or null if computed from rate and tax basis. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### taxId
- taxId: [String](TopLevel.String.md) `(read-only)`
  - : Gets the tax identifier (e.g. "DE\_7").


---

### taxRate
- taxRate: [Number](TopLevel.Number.md) `(read-only)`
  - : Gets the tax rate as a decimal (e.g. 0.07 for 7%).


---

### taxValue
- taxValue: [Money](dw.value.Money.md) `(read-only)`
  - : Gets the tax value (amount) in purchase currency, or null if computed from rate and tax basis.


---

## Constructor Details

### LineItemTax(String, Number)
- LineItemTax(taxId: [String](TopLevel.String.md), taxRate: [Number](TopLevel.Number.md))
  - : Creates a tax item for use with [LineItem.setTaxes(Collection)](dw.order.LineItem.md#settaxescollection).
      The tax value will be computed server-side from the tax rate and the line item's tax basis.
      
      
      Access is currently restricted to select pilot customers and controlled via feature toggle.


    **Parameters:**
    - taxId - tax identifier (e.g. "DE\_7"), must not be null or blank
    - taxRate - tax rate as decimal (e.g. 0.07 for 7%), must not be null


---

### LineItemTax(String, Number, Money)
- LineItemTax(taxId: [String](TopLevel.String.md), taxRate: [Number](TopLevel.Number.md), taxValue: [Money](dw.value.Money.md))
  - : Creates a tax item for use with [LineItem.setTaxes(Collection)](dw.order.LineItem.md#settaxescollection).
      
      
      Access is currently restricted to select pilot customers and controlled via feature toggle.


    **Parameters:**
    - taxId - tax identifier (e.g. "DE\_7"), must not be null or blank
    - taxRate - tax rate as decimal (e.g. 0.07 for 7%), must not be null
    - taxValue - tax amount in purchase currency, or null to compute from rate and tax basis


---

## Method Details

### getTaxId()
- getTaxId(): [String](TopLevel.String.md)
  - : Gets the tax identifier (e.g. "DE\_7").

    **Returns:**
    - the tax id


---

### getTaxRate()
- getTaxRate(): [Number](TopLevel.Number.md)
  - : Gets the tax rate as a decimal (e.g. 0.07 for 7%).

    **Returns:**
    - the tax rate


---

### getTaxValue()
- getTaxValue(): [Money](dw.value.Money.md)
  - : Gets the tax value (amount) in purchase currency, or null if computed from rate and tax basis.

    **Returns:**
    - the tax value as Money, or null


---

<!-- prettier-ignore-end -->
