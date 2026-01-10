<!-- prettier-ignore-start -->
# Class Money

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.value.Money](dw.value.Money.md)

Represents money in Commerce Cloud Digital.


## Constant Summary

| Constant | Description |
| --- | --- |
| [NOT_AVAILABLE](#not_available): [Money](dw.value.Money.md) | Represents that there is no money available. |

## Property Summary

| Property | Description |
| --- | --- |
| [available](#available): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if the instance contains settings for value and currency. |
| [currencyCode](#currencycode): [String](TopLevel.String.md) `(read-only)` | Returns the ISO 4217 currency mnemonic (such as 'USD', 'EUR') of the currency the  money value relates to. |
| [decimalValue](#decimalvalue): [Decimal](dw.util.Decimal.md) `(read-only)` | Returns the money as [Decimal](dw.util.Decimal.md), `null` is returned when the money is not available. |
| [value](#value): [Number](TopLevel.Number.md) `(read-only)` | Returns the value of the money instance. |
| [valueOrNull](#valueornull): [Number](TopLevel.Number.md) `(read-only)` | Return the value of the money instance or null if the  Money instance is NOT\_AVAILABLE. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [Money](#moneynumber-string)([Number](TopLevel.Number.md), [String](TopLevel.String.md)) | Constructs a new money instance with the specified amount for the specified  currency. |

## Method Summary

| Method | Description |
| --- | --- |
| [add](dw.value.Money.md#addmoney)([Money](dw.value.Money.md)) | Returns a Money instance by adding  the specified Money object to the current object. |
| [addPercent](dw.value.Money.md#addpercentnumber)([Number](TopLevel.Number.md)) | Adds a certain percentage to the money object. |
| [addRate](dw.value.Money.md#addratenumber)([Number](TopLevel.Number.md)) | Adds a rate (e.g. |
| [compareTo](dw.value.Money.md#comparetomoney)([Money](dw.value.Money.md)) | Compares two Money values. |
| [divide](dw.value.Money.md#dividenumber)([Number](TopLevel.Number.md)) | Divide Money object by specified divisor. |
| [equals](dw.value.Money.md#equalsobject)([Object](TopLevel.Object.md)) | Compares two money values whether they are equivalent. |
| [getCurrencyCode](dw.value.Money.md#getcurrencycode)() | Returns the ISO 4217 currency mnemonic (such as 'USD', 'EUR') of the currency the  money value relates to. |
| [getDecimalValue](dw.value.Money.md#getdecimalvalue)() | Returns the money as [Decimal](dw.util.Decimal.md), `null` is returned when the money is not available. |
| [getValue](dw.value.Money.md#getvalue)() | Returns the value of the money instance. |
| [getValueOrNull](dw.value.Money.md#getvalueornull)() | Return the value of the money instance or null if the  Money instance is NOT\_AVAILABLE. |
| [hashCode](dw.value.Money.md#hashcode)() | Calculates the hash code for a money; |
| [isAvailable](dw.value.Money.md#isavailable)() | Identifies if the instance contains settings for value and currency. |
| [isOfSameCurrency](dw.value.Money.md#isofsamecurrencymoney)([Money](dw.value.Money.md)) | Identifies if two Money value have the same currency. |
| [multiply](dw.value.Money.md#multiplynumber)([Number](TopLevel.Number.md)) | Multiply Money object by specified factor. |
| [multiply](dw.value.Money.md#multiplyquantity)([Quantity](dw.value.Quantity.md)) | Multiplies the Money object with the given quantity. |
| [newMoney](dw.value.Money.md#newmoneydecimal)([Decimal](dw.util.Decimal.md)) | Method returns a new instance of Money with the same currency but  different value. |
| [percentLessThan](dw.value.Money.md#percentlessthanmoney)([Money](dw.value.Money.md)) | Convenience method. |
| [percentOf](dw.value.Money.md#percentofmoney)([Money](dw.value.Money.md)) | Convenience method. |
| static [prorate](dw.value.Money.md#proratemoney-money)([Money](dw.value.Money.md), [Money\[\]](dw.value.Money.md)) | Prorates the specified values using the specified discount. |
| [subtract](dw.value.Money.md#subtractmoney)([Money](dw.value.Money.md)) | Returns a new Money instance by substracting the specified Money object  from the current object. |
| [subtractPercent](dw.value.Money.md#subtractpercentnumber)([Number](TopLevel.Number.md)) | Subtracts a certain percentage from the money object. |
| [subtractRate](dw.value.Money.md#subtractratenumber)([Number](TopLevel.Number.md)) | Subtracts a rate (e.g. |
| [toFormattedString](dw.value.Money.md#toformattedstring)() | Returns a string representation of Money according to the regional settings configured for current request  locale, for example '$59.00' or 'USD 59.00'. |
| [toNumberString](dw.value.Money.md#tonumberstring)() | Returns a string representation for the numeric value of this money. |
| [toString](dw.value.Money.md#tostring)() | Returns a string representation of this Money object. |
| [valueOf](dw.value.Money.md#valueof)() | According to the ECMA spec returns the "natural" primitve value. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### NOT_AVAILABLE

- NOT_AVAILABLE: [Money](dw.value.Money.md)
  - : Represents that there is no money available.


---

## Property Details

### available
- available: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if the instance contains settings for value and currency.


---

### currencyCode
- currencyCode: [String](TopLevel.String.md) `(read-only)`
  - : Returns the ISO 4217 currency mnemonic (such as 'USD', 'EUR') of the currency the
      money value relates to.
      
      Note a money instance may also describe a price that is 'not available'.
      In this case the value of this attribute is `N/A`.



---

### decimalValue
- decimalValue: [Decimal](dw.util.Decimal.md) `(read-only)`
  - : Returns the money as [Decimal](dw.util.Decimal.md), `null` is returned when the money is not available.


---

### value
- value: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the value of the money instance.

    **See Also:**
    - [getDecimalValue()](dw.value.Money.md#getdecimalvalue)


---

### valueOrNull
- valueOrNull: [Number](TopLevel.Number.md) `(read-only)`
  - : Return the value of the money instance or null if the
      Money instance is NOT\_AVAILABLE.



---

## Constructor Details

### Money(Number, String)
- Money(value: [Number](TopLevel.Number.md), currencyCode: [String](TopLevel.String.md))
  - : Constructs a new money instance with the specified amount for the specified
      currency. Note that each currency has a precision (number of digits after the
      decimal point) and that values beyond the precision are "rounded up" to their
      "nearest neighbor" following the rules of `java.math.RoundingMode.HALF_UP`.


    **Parameters:**
    - value - The value of the money instance. Must not be `null`.
    - currencyCode - The ISO 4217 mnemonic of currency the amount                      is specified in.  Must not be `null`.


---

## Method Details

### add(Money)
- add(value: [Money](dw.value.Money.md)): [Money](dw.value.Money.md)
  - : Returns a Money instance by adding
      the specified Money object to the current object. Only objects representing the
      same currency can be added. If one of the Money values is N/A, the
      result is N/A.


    **Parameters:**
    - value - the Money object to add to this Money instance.

    **Returns:**
    - the Money object representing the sum of the operands.


---

### addPercent(Number)
- addPercent(percent: [Number](TopLevel.Number.md)): [Money](dw.value.Money.md)
  - : Adds a certain percentage to the money object. The percent value is given
      as true percent value, so for example 10 represent 10%. If this Money is
      N/A the result is also N/A.


    **Parameters:**
    - percent - the percent value

    **Returns:**
    - new Money object with the result of the calculation


---

### addRate(Number)
- addRate(value: [Number](TopLevel.Number.md)): [Money](dw.value.Money.md)
  - : Adds a rate (e.g. 0.05) to the money object. This is typically for example
      to add a tax rate.


    **Parameters:**
    - value - the rate to add.

    **Returns:**
    - a new Money object with rate added.


---

### compareTo(Money)
- compareTo(other: [Money](dw.value.Money.md)): [Number](TopLevel.Number.md)
  - : Compares two Money values. An exception is thrown if the two Money values
      are of different currency. If one of the Money values represents the N/A value
      it is treated as 0.0.


    **Parameters:**
    - other - the money instance to comare against this money instance.

    **Returns:**
    - the comparison of 0 if the money instances are equal or non-0 if they are different.


---

### divide(Number)
- divide(divisor: [Number](TopLevel.Number.md)): [Money](dw.value.Money.md)
  - : Divide Money object by specified divisor. If this Money is
      N/A the result is also N/A.


    **Parameters:**
    - divisor - the divisor.

    **Returns:**
    - Money object representing division result


---

### equals(Object)
- equals(other: [Object](TopLevel.Object.md)): [Boolean](TopLevel.Boolean.md)
  - : Compares two money values whether they are equivalent.

    **Parameters:**
    - other - the object to compare against this money instance.

    **Returns:**
    - true if equal, false otherwise.


---

### getCurrencyCode()
- getCurrencyCode(): [String](TopLevel.String.md)
  - : Returns the ISO 4217 currency mnemonic (such as 'USD', 'EUR') of the currency the
      money value relates to.
      
      Note a money instance may also describe a price that is 'not available'.
      In this case the value of this attribute is `N/A`.


    **Returns:**
    - the value of the currency code.


---

### getDecimalValue()
- getDecimalValue(): [Decimal](dw.util.Decimal.md)
  - : Returns the money as [Decimal](dw.util.Decimal.md), `null` is returned when the money is not available.

    **Returns:**
    - the money as [Decimal](dw.util.Decimal.md)


---

### getValue()
- getValue(): [Number](TopLevel.Number.md)
  - : Returns the value of the money instance.

    **Returns:**
    - the value of the money instance.

    **See Also:**
    - [getDecimalValue()](dw.value.Money.md#getdecimalvalue)


---

### getValueOrNull()
- getValueOrNull(): [Number](TopLevel.Number.md)
  - : Return the value of the money instance or null if the
      Money instance is NOT\_AVAILABLE.


    **Returns:**
    - Value of money instance or null.


---

### hashCode()
- hashCode(): [Number](TopLevel.Number.md)
  - : Calculates the hash code for a money;


---

### isAvailable()
- isAvailable(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if the instance contains settings for value and currency.

    **Returns:**
    - true if the instance is initialized with value and
              currency, false if the state is 'not available'.



---

### isOfSameCurrency(Money)
- isOfSameCurrency(value: [Money](dw.value.Money.md)): [Boolean](TopLevel.Boolean.md)
  - : Identifies if two Money value have the same currency.

    **Parameters:**
    - value - the Money value passed to be tested

    **Returns:**
    - true if both instances have the same currency, false otherwise.


---

### multiply(Number)
- multiply(factor: [Number](TopLevel.Number.md)): [Money](dw.value.Money.md)
  - : Multiply Money object by specified factor. If this Money is
      N/A the result is also N/A.


    **Parameters:**
    - factor - multiplication factor

    **Returns:**
    - Money object representing multiplication result.


---

### multiply(Quantity)
- multiply(quantity: [Quantity](dw.value.Quantity.md)): [Money](dw.value.Money.md)
  - : Multiplies the Money object with the given quantity. If this Money is
      N/A the result is also N/A.


    **Parameters:**
    - quantity - the quantity to multiply the value by

    **Returns:**
    - a new Money representing the multiplication result.


---

### newMoney(Decimal)
- newMoney(value: [Decimal](dw.util.Decimal.md)): [Money](dw.value.Money.md)
  - : Method returns a new instance of Money with the same currency but
      different value. An N/A instance is returned if value is null.


    **Parameters:**
    - value - as a decimal

    **Returns:**
    - new Money instance with same currency


---

### percentLessThan(Money)
- percentLessThan(value: [Money](dw.value.Money.md)): [Number](TopLevel.Number.md)
  - : Convenience method.
      Calculates and returns the percentage off this price represents in
      relation to the passed base price.  The result is generally equal to
      `100.0 - this.percentOf(value)`.  For example, if this value
      is $30 and the passed value is $50, then the return
      value will be 40.0, representing a 40% discount.
      
      
      This method will return null if the compare value is null, this value or
      the compare value is unavailable, or the compare value equals 0.0.


    **Parameters:**
    - value - The price to compare to this price

    **Returns:**
    - The percentage discount this price represents in relation to the
      passed base price.


    **Throws:**
    - IllegalArgumentException - If the currencies are not comparable.

    **See Also:**
    - [percentOf(Money)](dw.value.Money.md#percentofmoney)


---

### percentOf(Money)
- percentOf(value: [Money](dw.value.Money.md)): [Number](TopLevel.Number.md)
  - : Convenience method.
      Calculates and returns the percentage of the passed value this
      price represents.  For example, if this value is $30 and
      the passed value is $50, then the return value will be 60.0 (i.e. 60%).
      
      
      This method will return null if the compare value is null, this value or
      the compare value is unavailable, or the compare value equals 0.0.


    **Parameters:**
    - value - The price to compare to this price

    **Returns:**
    - The percentage of the compare price this price represents, or
      null.


    **Throws:**
    - IllegalArgumentException - If the currencies are not comparable.


---

### prorate(Money, Money[])
- static prorate(dist: [Money](dw.value.Money.md), values: [Money\[\]](dw.value.Money.md)): [Money\[\]](dw.value.Money.md)
  - : Prorates the specified values using the specified discount.

    **Parameters:**
    - dist - the proration discount.
    - values - the values to prorate.

    **Returns:**
    - the prorated values.


---

### subtract(Money)
- subtract(value: [Money](dw.value.Money.md)): [Money](dw.value.Money.md)
  - : Returns a new Money instance by substracting the specified Money object
      from the current object. Only objects representing the
      same currency can be subtracted. If one of the Money values is N/A, the
      result is N/A.


    **Parameters:**
    - value - the Money object to subtract

    **Returns:**
    - the Money object representing the result of subtraction.


---

### subtractPercent(Number)
- subtractPercent(percent: [Number](TopLevel.Number.md)): [Money](dw.value.Money.md)
  - : Subtracts a certain percentage from the money object. The percent value is given
      as true percent value, so for example 10 represent 10%. If this Money is
      N/A the result is also N/A.


    **Parameters:**
    - percent - the percent value

    **Returns:**
    - new Money object with the result of the calculation


---

### subtractRate(Number)
- subtractRate(value: [Number](TopLevel.Number.md)): [Money](dw.value.Money.md)
  - : Subtracts a rate (e.g. 0.05) from the money object. This is typically for example
      to subtract a tax rates.


    **Parameters:**
    - value - the rate to subtract.

    **Returns:**
    - a new Money object with rate subtracted.


---

### toFormattedString()
- toFormattedString(): [String](TopLevel.String.md)
  - : Returns a string representation of Money according to the regional settings configured for current request
      locale, for example '$59.00' or 'USD 59.00'.


    **Returns:**
    - The formatted String representation of the passed money. In case of an error the string 'N/A' is
              returned.



---

### toNumberString()
- toNumberString(): [String](TopLevel.String.md)
  - : Returns a string representation for the numeric value of this money.
      The number is formatted with the decimal symbols of the platforms
      default locale.


    **Returns:**
    - a string representation for the numeric value of this money.


---

### toString()
- toString(): [String](TopLevel.String.md)
  - : Returns a string representation of this Money object.

    **Returns:**
    - a string representation of this Money object.


---

### valueOf()
- valueOf(): [Object](TopLevel.Object.md)
  - : According to the ECMA spec returns the "natural" primitve value. Here
      the value portion of the Money is returned.



---

<!-- prettier-ignore-end -->
