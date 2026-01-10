<!-- prettier-ignore-start -->
# Class Quantity

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.value.Quantity](dw.value.Quantity.md)

Represents the quantity of an item.


## Property Summary

| Property | Description |
| --- | --- |
| [available](#available): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if the instance contains settings for value and unit. |
| [decimalValue](#decimalvalue): [Decimal](dw.util.Decimal.md) `(read-only)` | Returns the quantity as [Decimal](dw.util.Decimal.md), `null` is returned when the quantity is not available. |
| [unit](#unit): [String](TopLevel.String.md) `(read-only)` | Returns the value for unit which identifies the  unit of measure for the quantity. |
| [value](#value): [Number](TopLevel.Number.md) `(read-only)` | Returns the quantity value. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [Quantity](#quantitynumber-string)([Number](TopLevel.Number.md), [String](TopLevel.String.md)) | Creates a new quantity instance with the specified value and unit. |

## Method Summary

| Method | Description |
| --- | --- |
| [add](dw.value.Quantity.md#addquantity)([Quantity](dw.value.Quantity.md)) | Add Quantity object to the current object. |
| [compareTo](dw.value.Quantity.md#comparetoquantity)([Quantity](dw.value.Quantity.md)) | Compares two Quantity values. |
| [divide](dw.value.Quantity.md#dividenumber)([Number](TopLevel.Number.md)) | Divide Quantity object by specified divisor. |
| [equals](dw.value.Quantity.md#equalsobject)([Object](TopLevel.Object.md)) | Compares two decimal values whether they are equivalent. |
| [getDecimalValue](dw.value.Quantity.md#getdecimalvalue)() | Returns the quantity as [Decimal](dw.util.Decimal.md), `null` is returned when the quantity is not available. |
| [getUnit](dw.value.Quantity.md#getunit)() | Returns the value for unit which identifies the  unit of measure for the quantity. |
| [getValue](dw.value.Quantity.md#getvalue)() | Returns the quantity value. |
| [hashCode](dw.value.Quantity.md#hashcode)() | Calculates the hash code for a decimal. |
| [isAvailable](dw.value.Quantity.md#isavailable)() | Identifies if the instance contains settings for value and unit. |
| [isOfSameUnit](dw.value.Quantity.md#isofsameunitquantity)([Quantity](dw.value.Quantity.md)) | Identifies if two Quantities have the same unit. |
| [multiply](dw.value.Quantity.md#multiplynumber)([Number](TopLevel.Number.md)) | Multiply Quantity object by specified factor. |
| [newQuantity](dw.value.Quantity.md#newquantitydecimal)([Decimal](dw.util.Decimal.md)) | Method returns a new instance of Quantity with the same unit but  different value. |
| [round](dw.value.Quantity.md#roundnumber)([Number](TopLevel.Number.md)) | Rounds the Quantity value to the number of specified decimal digits. |
| [subtract](dw.value.Quantity.md#subtractquantity)([Quantity](dw.value.Quantity.md)) | Subtract Quantity object from the current object. |
| [toString](dw.value.Quantity.md#tostring)() | Returns a string representation of this quantity object. |
| [valueOf](dw.value.Quantity.md#valueof)() | According to the ECMA spec returns the "natural" primitive value. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### available
- available: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if the instance contains settings for value and unit.


---

### decimalValue
- decimalValue: [Decimal](dw.util.Decimal.md) `(read-only)`
  - : Returns the quantity as [Decimal](dw.util.Decimal.md), `null` is returned when the quantity is not available.


---

### unit
- unit: [String](TopLevel.String.md) `(read-only)`
  - : Returns the value for unit which identifies the
      unit of measure for the quantity. Examples of unit
      are 'inches' or 'pounds'.



---

### value
- value: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the quantity value.

    **See Also:**
    - [getDecimalValue()](dw.value.Quantity.md#getdecimalvalue)


---

## Constructor Details

### Quantity(Number, String)
- Quantity(value: [Number](TopLevel.Number.md), unit: [String](TopLevel.String.md))
  - : Creates a new quantity instance with the specified value and unit.

    **Parameters:**
    - value - the actual quantity, must not be `null`
    - unit - the unit identifier for the quantity, must not be `null`


---

## Method Details

### add(Quantity)
- add(value: [Quantity](dw.value.Quantity.md)): [Quantity](dw.value.Quantity.md)
  - : Add Quantity object to the current object. Only objects representing the same unit can be added.

    **Parameters:**
    - value - Quantity object

    **Returns:**
    - Quantity object representing the sum of the operands


---

### compareTo(Quantity)
- compareTo(other: [Quantity](dw.value.Quantity.md)): [Number](TopLevel.Number.md)
  - : Compares two Quantity values. An exception is thrown if the two Quantities values
      are of different unit. If one of the Quantity values represents the N/A value
      it is treated as 0.0.


    **Parameters:**
    - other - the other quantity to compare.

    **Returns:**
    - the comparison.


---

### divide(Number)
- divide(divisor: [Number](TopLevel.Number.md)): [Quantity](dw.value.Quantity.md)
  - : Divide Quantity object by specified divisor.

    **Parameters:**
    - divisor - divisor

    **Returns:**
    - Quantity object representing division result


---

### equals(Object)
- equals(other: [Object](TopLevel.Object.md)): [Boolean](TopLevel.Boolean.md)
  - : Compares two decimal values whether they are equivalent.

    **Parameters:**
    - other - the object to compare against this quantity instance.

    **Returns:**
    - true if equal, false otherwise.


---

### getDecimalValue()
- getDecimalValue(): [Decimal](dw.util.Decimal.md)
  - : Returns the quantity as [Decimal](dw.util.Decimal.md), `null` is returned when the quantity is not available.

    **Returns:**
    - the quantity as [Decimal](dw.util.Decimal.md)


---

### getUnit()
- getUnit(): [String](TopLevel.String.md)
  - : Returns the value for unit which identifies the
      unit of measure for the quantity. Examples of unit
      are 'inches' or 'pounds'.


    **Returns:**
    - the unit value.


---

### getValue()
- getValue(): [Number](TopLevel.Number.md)
  - : Returns the quantity value.

    **Returns:**
    - the quantity value.

    **See Also:**
    - [getDecimalValue()](dw.value.Quantity.md#getdecimalvalue)


---

### hashCode()
- hashCode(): [Number](TopLevel.Number.md)
  - : Calculates the hash code for a decimal.

    **Returns:**
    - the hash code.


---

### isAvailable()
- isAvailable(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if the instance contains settings for value and unit.

    **Returns:**
    - true if the instance is initialized with value and
              unit, false if the state is 'not available'.



---

### isOfSameUnit(Quantity)
- isOfSameUnit(value: [Quantity](dw.value.Quantity.md)): [Boolean](TopLevel.Boolean.md)
  - : Identifies if two Quantities have the same unit.

    **Parameters:**
    - value - the second quantity for the comparison.

    **Returns:**
    - true if both quantities have the same unit, false otherwise.


---

### multiply(Number)
- multiply(factor: [Number](TopLevel.Number.md)): [Quantity](dw.value.Quantity.md)
  - : Multiply Quantity object by specified factor.

    **Parameters:**
    - factor - multiplication factor

    **Returns:**
    - Quantity object representing multiplication result


---

### newQuantity(Decimal)
- newQuantity(value: [Decimal](dw.util.Decimal.md)): [Quantity](dw.value.Quantity.md)
  - : Method returns a new instance of Quantity with the same unit but
      different value. An N/A instance is returned if value is null.


    **Parameters:**
    - value - as a decimal

    **Returns:**
    - new Quantity instance with same unit


---

### round(Number)
- round(precision: [Number](TopLevel.Number.md)): [Quantity](dw.value.Quantity.md)
  - : Rounds the Quantity value to the number of specified decimal digits.

    **Parameters:**
    - precision - number of decimal digits after the decimal point

    **Returns:**
    - the new rounded Quantity value


---

### subtract(Quantity)
- subtract(value: [Quantity](dw.value.Quantity.md)): [Quantity](dw.value.Quantity.md)
  - : Subtract Quantity object from the current object. Only objects representing the same unit can be subtracted.

    **Parameters:**
    - value - Quantity object to subtract

    **Returns:**
    - Quantity object representing the result of subtraction


---

### toString()
- toString(): [String](TopLevel.String.md)
  - : Returns a string representation of this quantity object.

    **Returns:**
    - a string representation of this quantity object.


---

### valueOf()
- valueOf(): [Object](TopLevel.Object.md)
  - : According to the ECMA spec returns the "natural" primitive value. Here
      the value portion of the Quantity is returned.



---

<!-- prettier-ignore-end -->
