<!-- prettier-ignore-start -->
# Class SumItem

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.order.SumItem](dw.order.SumItem.md)

Container used to represent an subtotal or grandtotal item which contains various prices and a tax breakdown
held in a collection of tax-items.


**Usage example:**

```
var invoice : Invoice = ...;
var productNet = invoice.productSubTotal.netPrice;
var serviceNet = invoice.serviceSubTotal.netPrice;
var grandNet   = invoice.grandTotal.netPrice;
var grandTax   = invoice.grandTotal.tax;
var grandGross = invoice.grandTotal.grossPrice;

# tax breakdown
for each(taxItem : TaxItem in invoice.grandTotal.taxItems) {
  var tax : Money         = taxItem.amount;
  var taxGroup : TaxGroup = taxItem.taxGroup;
  var rate : Double       = taxGroup.rate;
  var caption :String     = taxGroup.caption;
  var taxType :String     = taxGroup.taxType;
}
```



## Property Summary

| Property | Description |
| --- | --- |
| [grossPrice](#grossprice): [Money](dw.value.Money.md) `(read-only)` | Gross price of SumItem. |
| [netPrice](#netprice): [Money](dw.value.Money.md) `(read-only)` | Net price of SumItem. |
| [tax](#tax): [Money](dw.value.Money.md) `(read-only)` | Total tax for SumItem. |
| [taxBasis](#taxbasis): [Money](dw.value.Money.md) `(read-only)` | Price of entire SumItem on which tax calculation is based. |
| [taxItems](#taxitems): [Collection](dw.util.Collection.md) `(read-only)` | Tax items representing a tax breakdown for the SumItem. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getGrossPrice](dw.order.SumItem.md#getgrossprice)() | Gross price of SumItem. |
| [getNetPrice](dw.order.SumItem.md#getnetprice)() | Net price of SumItem. |
| [getTax](dw.order.SumItem.md#gettax)() | Total tax for SumItem. |
| [getTaxBasis](dw.order.SumItem.md#gettaxbasis)() | Price of entire SumItem on which tax calculation is based. |
| [getTaxItems](dw.order.SumItem.md#gettaxitems)() | Tax items representing a tax breakdown for the SumItem. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### grossPrice
- grossPrice: [Money](dw.value.Money.md) `(read-only)`
  - : Gross price of SumItem.


---

### netPrice
- netPrice: [Money](dw.value.Money.md) `(read-only)`
  - : Net price of SumItem.


---

### tax
- tax: [Money](dw.value.Money.md) `(read-only)`
  - : Total tax for SumItem.


---

### taxBasis
- taxBasis: [Money](dw.value.Money.md) `(read-only)`
  - : Price of entire SumItem on which tax calculation is based. Same as [getNetPrice()](dw.order.SumItem.md#getnetprice)
      or [getGrossPrice()](dw.order.SumItem.md#getgrossprice) depending on whether the order is based on net or gross prices.



---

### taxItems
- taxItems: [Collection](dw.util.Collection.md) `(read-only)`
  - : Tax items representing a tax breakdown for the SumItem.

    **See Also:**
    - [TaxItem](dw.order.TaxItem.md)


---

## Method Details

### getGrossPrice()
- getGrossPrice(): [Money](dw.value.Money.md)
  - : Gross price of SumItem.

    **Returns:**
    - Gross price of SumItem.


---

### getNetPrice()
- getNetPrice(): [Money](dw.value.Money.md)
  - : Net price of SumItem.

    **Returns:**
    - Net price of SumItem.


---

### getTax()
- getTax(): [Money](dw.value.Money.md)
  - : Total tax for SumItem.

    **Returns:**
    - Total tax for SumItem.


---

### getTaxBasis()
- getTaxBasis(): [Money](dw.value.Money.md)
  - : Price of entire SumItem on which tax calculation is based. Same as [getNetPrice()](dw.order.SumItem.md#getnetprice)
      or [getGrossPrice()](dw.order.SumItem.md#getgrossprice) depending on whether the order is based on net or gross prices.


    **Returns:**
    - Price of entire item on which tax calculation is based


---

### getTaxItems()
- getTaxItems(): [Collection](dw.util.Collection.md)
  - : Tax items representing a tax breakdown for the SumItem.

    **Returns:**
    - tax items representing a tax breakdown for the SumItem

    **See Also:**
    - [TaxItem](dw.order.TaxItem.md)


---

<!-- prettier-ignore-end -->
