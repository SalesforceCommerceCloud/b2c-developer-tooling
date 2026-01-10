<!-- prettier-ignore-start -->
# Class LineItem

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)
      - [dw.order.LineItem](dw.order.LineItem.md)

Common line item base class.


## All Known Subclasses
[GiftCertificateLineItem](dw.order.GiftCertificateLineItem.md), [PriceAdjustment](dw.order.PriceAdjustment.md), [ProductLineItem](dw.order.ProductLineItem.md), [ProductShippingLineItem](dw.order.ProductShippingLineItem.md), [ShippingLineItem](dw.order.ShippingLineItem.md)
## Property Summary

| Property | Description |
| --- | --- |
| [basePrice](#baseprice): [Money](dw.value.Money.md) | Returns the base price for the line item, which is the price of the unit before applying adjustments, in the  purchase currency. |
| [grossPrice](#grossprice): [Money](dw.value.Money.md) | Returns the gross price for the line item, which is the price of the unit before applying adjustments, in the  purchase currency, including tax. |
| [lineItemCtnr](#lineitemctnr): [LineItemCtnr](dw.order.LineItemCtnr.md) `(read-only)` | Returns the line item ctnr of the line item. |
| [lineItemText](#lineitemtext): [String](TopLevel.String.md) | Returns the display text for the line item. |
| [netPrice](#netprice): [Money](dw.value.Money.md) | Returns the net price for the line item, which is the price of the unit before applying adjustments, in the  purchase currency, excluding tax. |
| [price](#price): [Money](dw.value.Money.md) `(read-only)` | Get the price of the line item. |
| [priceValue](#pricevalue): [Number](TopLevel.Number.md) | Return the price amount for the line item. |
| [tax](#tax): [Money](dw.value.Money.md) | Returns the tax for the line item, which is the tax of the unit before applying adjustments, in the purchase  currency. |
| [taxBasis](#taxbasis): [Money](dw.value.Money.md) `(read-only)` | Get the price used to calculate the tax for this line item. |
| [taxClassID](#taxclassid): [String](TopLevel.String.md) | Returns the tax class ID for the line item or null if no tax class ID is associated with the line item. |
| [taxRate](#taxrate): [Number](TopLevel.Number.md) | Returns the tax rate, which is the decimal tax rate to be applied to the product represented by this line item. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getBasePrice](dw.order.LineItem.md#getbaseprice)() | Returns the base price for the line item, which is the price of the unit before applying adjustments, in the  purchase currency. |
| [getGrossPrice](dw.order.LineItem.md#getgrossprice)() | Returns the gross price for the line item, which is the price of the unit before applying adjustments, in the  purchase currency, including tax. |
| [getLineItemCtnr](dw.order.LineItem.md#getlineitemctnr)() | Returns the line item ctnr of the line item. |
| [getLineItemText](dw.order.LineItem.md#getlineitemtext)() | Returns the display text for the line item. |
| [getNetPrice](dw.order.LineItem.md#getnetprice)() | Returns the net price for the line item, which is the price of the unit before applying adjustments, in the  purchase currency, excluding tax. |
| [getPrice](dw.order.LineItem.md#getprice)() | Get the price of the line item. |
| [getPriceValue](dw.order.LineItem.md#getpricevalue)() | Return the price amount for the line item. |
| [getTax](dw.order.LineItem.md#gettax)() | Returns the tax for the line item, which is the tax of the unit before applying adjustments, in the purchase  currency. |
| [getTaxBasis](dw.order.LineItem.md#gettaxbasis)() | Get the price used to calculate the tax for this line item. |
| [getTaxClassID](dw.order.LineItem.md#gettaxclassid)() | Returns the tax class ID for the line item or null if no tax class ID is associated with the line item. |
| [getTaxRate](dw.order.LineItem.md#gettaxrate)() | Returns the tax rate, which is the decimal tax rate to be applied to the product represented by this line item. |
| ~~[setBasePrice](dw.order.LineItem.md#setbasepricemoney)([Money](dw.value.Money.md))~~ | Sets the base price for the line item, which is the price of the unit before applying adjustments, in the  purchase currency. |
| ~~[setGrossPrice](dw.order.LineItem.md#setgrosspricemoney)([Money](dw.value.Money.md))~~ | Sets the gross price for the line item, which is the Price of the unit before applying adjustments, in the  purchase currency, including tax. |
| [setLineItemText](dw.order.LineItem.md#setlineitemtextstring)([String](TopLevel.String.md)) | Sets the display text for the line item. |
| ~~[setNetPrice](dw.order.LineItem.md#setnetpricemoney)([Money](dw.value.Money.md))~~ | Sets the value for the net price, which is the price of the unit before applying adjustments, in the purchase  currency, excluding tax. |
| [setPriceValue](dw.order.LineItem.md#setpricevaluenumber)([Number](TopLevel.Number.md)) | Sets price attributes of the line item based on the current purchase currency and taxation policy. |
| [setTax](dw.order.LineItem.md#settaxmoney)([Money](dw.value.Money.md)) | Sets the value for the tax of the line item, which is the the tax of the unit before applying adjustments, in the  purchase currency. |
| [setTaxClassID](dw.order.LineItem.md#settaxclassidstring)([String](TopLevel.String.md)) | Sets the tax class ID for the line item. |
| [setTaxRate](dw.order.LineItem.md#settaxratenumber)([Number](TopLevel.Number.md)) | Sets the tax rate, which is the decimal tax rate to be applied to the product represented by this line item. |
| ~~[updatePrice](dw.order.LineItem.md#updatepricemoney)([Money](dw.value.Money.md))~~ | Updates the price attributes of the line item based on the specified price. |
| [updateTax](dw.order.LineItem.md#updatetaxnumber)([Number](TopLevel.Number.md)) | Updates the tax-related attributes of the line item based on the specified tax rate, a tax basis determined by  the system and the "Tax Rounding Mode" order preference. |
| [updateTax](dw.order.LineItem.md#updatetaxnumber-money)([Number](TopLevel.Number.md), [Money](dw.value.Money.md)) | Updates the tax-related attributes of the line item based on the specified tax rate, the passed tax basis and the  "Tax Rounding Mode" order preference. |
| [updateTaxAmount](dw.order.LineItem.md#updatetaxamountmoney)([Money](dw.value.Money.md)) | Updates tax amount of the line item setting the provided value. |

### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### basePrice
- basePrice: [Money](dw.value.Money.md)
  - : Returns the base price for the line item, which is the price of the unit before applying adjustments, in the
      purchase currency. The base price may be net or gross of tax depending on the configured taxation policy.



---

### grossPrice
- grossPrice: [Money](dw.value.Money.md)
  - : Returns the gross price for the line item, which is the price of the unit before applying adjustments, in the
      purchase currency, including tax.



---

### lineItemCtnr
- lineItemCtnr: [LineItemCtnr](dw.order.LineItemCtnr.md) `(read-only)`
  - : Returns the line item ctnr of the line item.


---

### lineItemText
- lineItemText: [String](TopLevel.String.md)
  - : Returns the display text for the line item.


---

### netPrice
- netPrice: [Money](dw.value.Money.md)
  - : Returns the net price for the line item, which is the price of the unit before applying adjustments, in the
      purchase currency, excluding tax.



---

### price
- price: [Money](dw.value.Money.md) `(read-only)`
  - : Get the price of the line item. If the line item is based on net pricing then the net price is returned. If the
      line item is based on gross pricing then the gross price is returned.



---

### priceValue
- priceValue: [Number](TopLevel.Number.md)
  - : Return the price amount for the line item. Same as getPrice().getValue().


---

### tax
- tax: [Money](dw.value.Money.md)
  - : Returns the tax for the line item, which is the tax of the unit before applying adjustments, in the purchase
      currency.



---

### taxBasis
- taxBasis: [Money](dw.value.Money.md) `(read-only)`
  - : Get the price used to calculate the tax for this line item.


---

### taxClassID
- taxClassID: [String](TopLevel.String.md)
  - : Returns the tax class ID for the line item or null if no tax class ID is associated with the line item. In the
      case where the tax class ID is null, you should use the default tax class ID.


    **See Also:**
    - [TaxMgr.getDefaultTaxClassID()](dw.order.TaxMgr.md#getdefaulttaxclassid)


---

### taxRate
- taxRate: [Number](TopLevel.Number.md)
  - : Returns the tax rate, which is the decimal tax rate to be applied to the product represented by this line item. A
      value of 0.175 represents a percentage of 17.5%.



---

## Method Details

### getBasePrice()
- getBasePrice(): [Money](dw.value.Money.md)
  - : Returns the base price for the line item, which is the price of the unit before applying adjustments, in the
      purchase currency. The base price may be net or gross of tax depending on the configured taxation policy.


    **Returns:**
    - the base price for the line item.


---

### getGrossPrice()
- getGrossPrice(): [Money](dw.value.Money.md)
  - : Returns the gross price for the line item, which is the price of the unit before applying adjustments, in the
      purchase currency, including tax.


    **Returns:**
    - the value of the gross price.


---

### getLineItemCtnr()
- getLineItemCtnr(): [LineItemCtnr](dw.order.LineItemCtnr.md)
  - : Returns the line item ctnr of the line item.

    **Returns:**
    - Line item ctnr of the line item


---

### getLineItemText()
- getLineItemText(): [String](TopLevel.String.md)
  - : Returns the display text for the line item.

    **Returns:**
    - the display text.


---

### getNetPrice()
- getNetPrice(): [Money](dw.value.Money.md)
  - : Returns the net price for the line item, which is the price of the unit before applying adjustments, in the
      purchase currency, excluding tax.


    **Returns:**
    - the value for the net price.


---

### getPrice()
- getPrice(): [Money](dw.value.Money.md)
  - : Get the price of the line item. If the line item is based on net pricing then the net price is returned. If the
      line item is based on gross pricing then the gross price is returned.


    **Returns:**
    - either the net or the gross price


---

### getPriceValue()
- getPriceValue(): [Number](TopLevel.Number.md)
  - : Return the price amount for the line item. Same as getPrice().getValue().

    **Returns:**
    - the price for the line item


---

### getTax()
- getTax(): [Money](dw.value.Money.md)
  - : Returns the tax for the line item, which is the tax of the unit before applying adjustments, in the purchase
      currency.


    **Returns:**
    - the tax for the line item.


---

### getTaxBasis()
- getTaxBasis(): [Money](dw.value.Money.md)
  - : Get the price used to calculate the tax for this line item.

    **Returns:**
    - The tax basis used to calculate tax for this line item, or Money.NOT\_AVAILABLE if tax has not been set
              for this line item yet.



---

### getTaxClassID()
- getTaxClassID(): [String](TopLevel.String.md)
  - : Returns the tax class ID for the line item or null if no tax class ID is associated with the line item. In the
      case where the tax class ID is null, you should use the default tax class ID.


    **Returns:**
    - the tax class ID for the line item or null if no tax class ID is associated with the line item.

    **See Also:**
    - [TaxMgr.getDefaultTaxClassID()](dw.order.TaxMgr.md#getdefaulttaxclassid)


---

### getTaxRate()
- getTaxRate(): [Number](TopLevel.Number.md)
  - : Returns the tax rate, which is the decimal tax rate to be applied to the product represented by this line item. A
      value of 0.175 represents a percentage of 17.5%.


    **Returns:**
    - the value of the tax rate.


---

### setBasePrice(Money)
- ~~setBasePrice(aValue: [Money](dw.value.Money.md)): void~~
  - : Sets the base price for the line item, which is the price of the unit before applying adjustments, in the
      purchase currency. The base price may be net or gross of tax depending on the configured taxation policy.


    **Parameters:**
    - aValue - the new value of the base price.

    **Deprecated:**
:::warning
Use [updatePrice(Money)](dw.order.LineItem.md#updatepricemoney) instead.
:::

---

### setGrossPrice(Money)
- ~~setGrossPrice(aValue: [Money](dw.value.Money.md)): void~~
  - : Sets the gross price for the line item, which is the Price of the unit before applying adjustments, in the
      purchase currency, including tax.


    **Parameters:**
    - aValue - the new value of the attribute

    **Deprecated:**
:::warning
Use [updatePrice(Money)](dw.order.LineItem.md#updatepricemoney) which sets the base price and also the gross price if the line item
            is based on gross pricing.

:::

---

### setLineItemText(String)
- setLineItemText(aText: [String](TopLevel.String.md)): void
  - : Sets the display text for the line item.

    **Parameters:**
    - aText - line item text.


---

### setNetPrice(Money)
- ~~setNetPrice(aValue: [Money](dw.value.Money.md)): void~~
  - : Sets the value for the net price, which is the price of the unit before applying adjustments, in the purchase
      currency, excluding tax.


    **Parameters:**
    - aValue - the new value for the net price

    **Deprecated:**
:::warning
Use [updatePrice(Money)](dw.order.LineItem.md#updatepricemoney) which sets the base price and also the net price if the line item is
            based on net pricing.

:::

---

### setPriceValue(Number)
- setPriceValue(value: [Number](TopLevel.Number.md)): void
  - : Sets price attributes of the line item based on the current purchase currency and taxation policy. 
      
      The methods sets the 'basePrice' attribute of the line item. Additionally, it sets the 'netPrice' attribute of
      the line item if the current taxation policy is 'net', and the 'grossPrice' attribute, if the current taxation
      policy is 'gross'. 
      
      If null is specified as value, the price attributes are reset to Money.NOT\_AVAILABLE.


    **Parameters:**
    - value - Price value or null


---

### setTax(Money)
- setTax(aValue: [Money](dw.value.Money.md)): void
  - : Sets the value for the tax of the line item, which is the the tax of the unit before applying adjustments, in the
      purchase currency.


    **Parameters:**
    - aValue - the new value for the tax.


---

### setTaxClassID(String)
- setTaxClassID(aValue: [String](TopLevel.String.md)): void
  - : Sets the tax class ID for the line item.

    **Parameters:**
    - aValue - the tax class ID for the line item.


---

### setTaxRate(Number)
- setTaxRate(taxRate: [Number](TopLevel.Number.md)): void
  - : Sets the tax rate, which is the decimal tax rate to be applied to the product represented by this line item. A
      value of 0.175 represents a percentage of 17.5%.


    **Parameters:**
    - taxRate - the new value for the tax rate.


---

### updatePrice(Money)
- ~~updatePrice(price: [Money](dw.value.Money.md)): void~~
  - : Updates the price attributes of the line item based on the specified price. The base price is set to the
      specified value. If the line item is based on net pricing then the net price attribute is set. If the line item
      is based on gross pricing then the gross price attribute is set. Whether or not a line item is based on net or
      gross pricing is a site-wide configuration parameter.


    **Parameters:**
    - price - The price to use when performing the update. This price must not be null and must either be equal to             NOT\_AVAIALBLE or must have a currency code equal to that of the parent container.

    **Deprecated:**
:::warning
Use [setPriceValue(Number)](dw.order.LineItem.md#setpricevaluenumber) instead.
:::

---

### updateTax(Number)
- updateTax(taxRate: [Number](TopLevel.Number.md)): void
  - : Updates the tax-related attributes of the line item based on the specified tax rate, a tax basis determined by
      the system and the "Tax Rounding Mode" order preference. This method sets the tax basis as an attribute, and is
      not affected by the previous value of this attribute.
      
      
      The value used as a basis depends on the type of line item this is and on the promotion preferences for the
      current site. If you tax products, shipping, and discounts based on price (default), then the tax basis will
      simply be equal to [getPrice()](dw.order.LineItem.md#getprice). If you tax products and shipping only based on adjusted price, then the
      tax basis depends upon line item type as follows:
      
      - **ProductLineItem:**basis equals [ProductLineItem.getProratedPrice()](dw.order.ProductLineItem.md#getproratedprice).
      - **ShippingLineItem:**basis equals [ShippingLineItem.getAdjustedPrice()](dw.order.ShippingLineItem.md#getadjustedprice).
      - **ProductShippingLineItem:**basis equals  [ProductShippingLineItem.getAdjustedPrice()](dw.order.ProductShippingLineItem.md#getadjustedprice).
      - **PriceAdjustment:**basis equals 0.00.
      - All other line item types: basis equals [getPrice()](dw.order.LineItem.md#getprice).
      
      If null is passed as tax rate, tax-related attribute fields are set to N/A.


    **Parameters:**
    - taxRate - taxRate the tax rate to use or null.


---

### updateTax(Number, Money)
- updateTax(taxRate: [Number](TopLevel.Number.md), taxBasis: [Money](dw.value.Money.md)): void
  - : Updates the tax-related attributes of the line item based on the specified tax rate, the passed tax basis and the
      "Tax Rounding Mode" order preference. If null is passed as tax rate or tax basis, tax-related attribute fields
      are set to N/A.


    **Parameters:**
    - taxRate - the tax rate to use or null.
    - taxBasis - the tax basis to use or null.


---

### updateTaxAmount(Money)
- updateTaxAmount(tax: [Money](dw.value.Money.md)): void
  - : Updates tax amount of the line item setting the provided value. Depending on the way how the tax is calculated
      (based on net or gross price), the corresponding gross or net price is updated accordingly. For tax calculation
      based on net price, the gross price is calculated by adding the tax to the net price. For tax calculation based
      on gross price, the net price is calculated by subtracting the tax from the gross price.
      
      
      If null is passed as tax amount, the item tax and resulting net or gross price are set to N/A.
      
      
      Note that tax rate is not calculated and it is not updated.


    **Parameters:**
    - tax - the tax amount of the line item to set


---

<!-- prettier-ignore-end -->
