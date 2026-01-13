<!-- prettier-ignore-start -->
# Class Currency

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.util.Currency](dw.util.Currency.md)

Represents a currency supported by the system.


## Property Summary

| Property | Description |
| --- | --- |
| [currencyCode](#currencycode): [String](TopLevel.String.md) `(read-only)` | Gets the ISO 4217 mnemonic currency code of this currency. |
| [defaultFractionDigits](#defaultfractiondigits): [Number](TopLevel.Number.md) `(read-only)` | Gets the default number of fraction digits used with this currency. |
| [name](#name): [String](TopLevel.String.md) `(read-only)` | Gets a long name for this currency. |
| [symbol](#symbol): [String](TopLevel.String.md) `(read-only)` | Gets the symbol of this currency. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| static [getCurrency](dw.util.Currency.md#getcurrencystring)([String](TopLevel.String.md)) | Returns a `Currency` instance for the given currency code,  or `null` if there is no such currency. |
| [getCurrencyCode](dw.util.Currency.md#getcurrencycode)() | Gets the ISO 4217 mnemonic currency code of this currency. |
| [getDefaultFractionDigits](dw.util.Currency.md#getdefaultfractiondigits)() | Gets the default number of fraction digits used with this currency. |
| [getName](dw.util.Currency.md#getname)() | Gets a long name for this currency. |
| [getSymbol](dw.util.Currency.md#getsymbol)() | Gets the symbol of this currency. |
| [toString](dw.util.Currency.md#tostring)() | Returns the ISO 4217 mnemonic currency code of this currency. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### currencyCode
- currencyCode: [String](TopLevel.String.md) `(read-only)`
  - : Gets the ISO 4217 mnemonic currency code of this currency.


---

### defaultFractionDigits
- defaultFractionDigits: [Number](TopLevel.Number.md) `(read-only)`
  - : Gets the default number of fraction digits used with this currency.
      For example, the default number of fraction digits for the Euro is 2,
      while for the Japanese Yen it's 0.



---

### name
- name: [String](TopLevel.String.md) `(read-only)`
  - : Gets a long name for this currency. e.g. "United States Dollar".
      The returned name is the one stored in the system for this currency.
      Currently only English names are available, but in the future
      this method may return a locale-specific name.



---

### symbol
- symbol: [String](TopLevel.String.md) `(read-only)`
  - : Gets the symbol of this currency. e.g. "$" for the US Dollar.


---

## Method Details

### getCurrency(String)
- static getCurrency(currencyCode: [String](TopLevel.String.md)): [Currency](dw.util.Currency.md)
  - : Returns a `Currency` instance for the given currency code,
      or `null` if there is no such currency.


    **Parameters:**
    - currencyCode - the ISO 4217 mnemonic code of the currency.

    **Returns:**
    - the `Currency` instance for the given currency code.


---

### getCurrencyCode()
- getCurrencyCode(): [String](TopLevel.String.md)
  - : Gets the ISO 4217 mnemonic currency code of this currency.

    **Returns:**
    - the ISO 4217 mnemonic currency code of this currency.


---

### getDefaultFractionDigits()
- getDefaultFractionDigits(): [Number](TopLevel.Number.md)
  - : Gets the default number of fraction digits used with this currency.
      For example, the default number of fraction digits for the Euro is 2,
      while for the Japanese Yen it's 0.


    **Returns:**
    - the default number of fraction digits used with this currency.


---

### getName()
- getName(): [String](TopLevel.String.md)
  - : Gets a long name for this currency. e.g. "United States Dollar".
      The returned name is the one stored in the system for this currency.
      Currently only English names are available, but in the future
      this method may return a locale-specific name.


    **Returns:**
    - a long name for this currency. e.g. "United States Dollar".


---

### getSymbol()
- getSymbol(): [String](TopLevel.String.md)
  - : Gets the symbol of this currency. e.g. "$" for the US Dollar.

    **Returns:**
    - the symbol of this currency.


---

### toString()
- toString(): [String](TopLevel.String.md)
  - : Returns the ISO 4217 mnemonic currency code of this currency.

    **Returns:**
    - the ISO 4217 mnemonic currency code of this currency.


---

<!-- prettier-ignore-end -->
