<!-- prettier-ignore-start -->
# Class Decimal

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.util.Decimal](dw.util.Decimal.md)

The Decimal class is a helper class to perform decimal arithmetic in
scripts and to represent a decimal number with arbitrary length. The decimal
class avoids arithmetic errors, which are typical for calculating with
floating numbers, that are based on a binary mantissa.


The class is designed in a way that it can be used very similar to a
desktop calculator.


```
var d = new Decimal( 10.0 );
var result = d.add( 2.0 ).sub( 3.0 ).get();
```



The above code will return 9 as result.



## Constructor Summary

| Constructor | Description |
| --- | --- |
| [Decimal](#decimal)() | Constructs a new Decimal with the value 0. |
| [Decimal](#decimalnumber)([Number](TopLevel.Number.md)) | Constructs a new decimal using the specified Number value. |
| [Decimal](#decimalbigint)([BigInt](TopLevel.BigInt.md)) | Constructs a new decimal using the specified BigInt value. |
| [Decimal](#decimalstring)([String](TopLevel.String.md)) | Constructs a new Decimal using the specified string representation of  a number. |

## Method Summary

| Method | Description |
| --- | --- |
| [abs](dw.util.Decimal.md#abs)() | Returns a new Decimal with the absolute value of this Decimal. |
| [add](dw.util.Decimal.md#addnumber)([Number](TopLevel.Number.md)) | Adds a Number value to this Decimal and returns the new Decimal. |
| [add](dw.util.Decimal.md#adddecimal)([Decimal](dw.util.Decimal.md)) | Adds a Decimal value to this Decimal and returns the new Decimal. |
| [addPercent](dw.util.Decimal.md#addpercentnumber)([Number](TopLevel.Number.md)) | Adds a percentage value to the current value of the  decimal. |
| [addPercent](dw.util.Decimal.md#addpercentdecimal)([Decimal](dw.util.Decimal.md)) | Adds a percentage value to the current value of the  decimal. |
| [divide](dw.util.Decimal.md#dividenumber)([Number](TopLevel.Number.md)) | Divides the specified Number value with this decimal and returns the new  decimal. |
| [divide](dw.util.Decimal.md#dividedecimal)([Decimal](dw.util.Decimal.md)) | Divides the specified Decimal value with this decimal and returns the new  decimal. |
| [equals](dw.util.Decimal.md#equalsobject)([Object](TopLevel.Object.md)) | Compares two decimal values whether they are equivalent. |
| [get](dw.util.Decimal.md#get)() | Returns the value of the Decimal as a Number. |
| [hashCode](dw.util.Decimal.md#hashcode)() | Calculates the hash code for this decimal; |
| [multiply](dw.util.Decimal.md#multiplynumber)([Number](TopLevel.Number.md)) | Multiples the specified Number value with this Decimal and returns the new Decimal. |
| [multiply](dw.util.Decimal.md#multiplydecimal)([Decimal](dw.util.Decimal.md)) | Multiples the specified Decimal value with this Decimal and returns the new Decimal. |
| [negate](dw.util.Decimal.md#negate)() | Returns a new Decimal with the negated value of this Decimal. |
| [round](dw.util.Decimal.md#roundnumber)([Number](TopLevel.Number.md)) | Rounds the current value of the decimal using the specified  number of decimals. |
| [subtract](dw.util.Decimal.md#subtractnumber)([Number](TopLevel.Number.md)) | Subtracts the specified Number value from this Decimal and returns the new Decimal. |
| [subtract](dw.util.Decimal.md#subtractdecimal)([Decimal](dw.util.Decimal.md)) | Subtracts the specified Decimal value from this Decimal and returns the new Decimal. |
| [subtractPercent](dw.util.Decimal.md#subtractpercentnumber)([Number](TopLevel.Number.md)) | Subtracts a percentage value from the current value of the  decimal. |
| [subtractPercent](dw.util.Decimal.md#subtractpercentdecimal)([Decimal](dw.util.Decimal.md)) | Subtracts a percentage value from the current value of the  decimal. |
| [toString](dw.util.Decimal.md#tostring)() | Returns a string representation of this object. |
| [valueOf](dw.util.Decimal.md#valueof)() | The valueOf() method is called by the ECMAScript interpret to return  the "natural" value of an object. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constructor Details

### Decimal()
- Decimal()
  - : Constructs a new Decimal with the value 0.


---

### Decimal(Number)
- Decimal(value: [Number](TopLevel.Number.md))
  - : Constructs a new decimal using the specified Number value.

    **Parameters:**
    - value - the value to use.


---

### Decimal(BigInt)
- Decimal(value: [BigInt](TopLevel.BigInt.md))
  - : Constructs a new decimal using the specified BigInt value.

    **Parameters:**
    - value - the value to use.

    **API Version:**
:::note
Available from version 22.7.
:::

---

### Decimal(String)
- Decimal(value: [String](TopLevel.String.md))
  - : Constructs a new Decimal using the specified string representation of
      a number.


    **Parameters:**
    - value - the value to use.


---

## Method Details

### abs()
- abs(): [Decimal](dw.util.Decimal.md)
  - : Returns a new Decimal with the absolute value of this Decimal.

    **Returns:**
    - the new Decimal


---

### add(Number)
- add(value: [Number](TopLevel.Number.md)): [Decimal](dw.util.Decimal.md)
  - : Adds a Number value to this Decimal and returns the new Decimal.

    **Parameters:**
    - value - the value to add to this decimal.

    **Returns:**
    - the new decimal with the value added.


---

### add(Decimal)
- add(value: [Decimal](dw.util.Decimal.md)): [Decimal](dw.util.Decimal.md)
  - : Adds a Decimal value to this Decimal and returns the new Decimal.

    **Parameters:**
    - value - the value to add to this decimal.

    **Returns:**
    - the new decimal with the value added.


---

### addPercent(Number)
- addPercent(value: [Number](TopLevel.Number.md)): [Decimal](dw.util.Decimal.md)
  - : Adds a percentage value to the current value of the
      decimal. For example a value of 10 represent 10% or a value of
      85 represents 85%.


    **Parameters:**
    - value - the value to add.

    **Returns:**
    - a new decimal with the added percentage value.


---

### addPercent(Decimal)
- addPercent(value: [Decimal](dw.util.Decimal.md)): [Decimal](dw.util.Decimal.md)
  - : Adds a percentage value to the current value of the
      decimal. For example a value of 10 represent 10% or a value of
      85 represents 85%.


    **Parameters:**
    - value - the value to add.

    **Returns:**
    - a new decimal with the added percentage value.


---

### divide(Number)
- divide(value: [Number](TopLevel.Number.md)): [Decimal](dw.util.Decimal.md)
  - : Divides the specified Number value with this decimal and returns the new
      decimal.
      
      When performing the division, 34 digits precision and a rounding mode of
      HALF\_EVEN is used to prevent quotients with nonterminating decimal
      expansions.


    **Parameters:**
    - value - the value to use to divide this decimal.

    **Returns:**
    - the new decimal.


---

### divide(Decimal)
- divide(value: [Decimal](dw.util.Decimal.md)): [Decimal](dw.util.Decimal.md)
  - : Divides the specified Decimal value with this decimal and returns the new
      decimal.
      
      When performing the division, 34 digits precision and a rounding mode of
      HALF\_EVEN is used to prevent quotients with nonterminating decimal
      expansions.


    **Parameters:**
    - value - the value to use to divide this decimal.

    **Returns:**
    - the new decimal.


---

### equals(Object)
- equals(other: [Object](TopLevel.Object.md)): [Boolean](TopLevel.Boolean.md)
  - : Compares two decimal values whether they are equivalent.

    **Parameters:**
    - other - the object to comapre against this decimal.


---

### get()
- get(): [Number](TopLevel.Number.md)
  - : Returns the value of the Decimal as a Number.

    **Returns:**
    - the value of the Decimal.


---

### hashCode()
- hashCode(): [Number](TopLevel.Number.md)
  - : Calculates the hash code for this decimal;


---

### multiply(Number)
- multiply(value: [Number](TopLevel.Number.md)): [Decimal](dw.util.Decimal.md)
  - : Multiples the specified Number value with this Decimal and returns the new Decimal.

    **Parameters:**
    - value - the value to multiply with this decimal.

    **Returns:**
    - the new decimal.


---

### multiply(Decimal)
- multiply(value: [Decimal](dw.util.Decimal.md)): [Decimal](dw.util.Decimal.md)
  - : Multiples the specified Decimal value with this Decimal and returns the new Decimal.

    **Parameters:**
    - value - the value to multiply with this decimal.

    **Returns:**
    - the new decimal.


---

### negate()
- negate(): [Decimal](dw.util.Decimal.md)
  - : Returns a new Decimal with the negated value of this Decimal.

    **Returns:**
    - the new Decimal


---

### round(Number)
- round(decimals: [Number](TopLevel.Number.md)): [Decimal](dw.util.Decimal.md)
  - : Rounds the current value of the decimal using the specified
      number of decimals. The parameter
      specifies the number of digest after the decimal point.


    **Parameters:**
    - decimals - the number of decimals to use.

    **Returns:**
    - the decimal that has been rounded.


---

### subtract(Number)
- subtract(value: [Number](TopLevel.Number.md)): [Decimal](dw.util.Decimal.md)
  - : Subtracts the specified Number value from this Decimal and returns the new Decimal.

    **Parameters:**
    - value - the value to add to this decimal.

    **Returns:**
    - the new decimal with the value subtraced.


---

### subtract(Decimal)
- subtract(value: [Decimal](dw.util.Decimal.md)): [Decimal](dw.util.Decimal.md)
  - : Subtracts the specified Decimal value from this Decimal and returns the new Decimal.

    **Parameters:**
    - value - the value to add to this decimal.

    **Returns:**
    - the new decimal with the value subtraced.


---

### subtractPercent(Number)
- subtractPercent(value: [Number](TopLevel.Number.md)): [Decimal](dw.util.Decimal.md)
  - : Subtracts a percentage value from the current value of the
      decimal. For example a value of 10 represent 10% or a value of
      85 represents 85%.


    **Parameters:**
    - value - the value to subtract.

    **Returns:**
    - a new decimal with the subtracted percentage value.


---

### subtractPercent(Decimal)
- subtractPercent(value: [Decimal](dw.util.Decimal.md)): [Decimal](dw.util.Decimal.md)
  - : Subtracts a percentage value from the current value of the
      decimal. For example a value of 10 represent 10% or a value of
      85 represents 85%.


    **Parameters:**
    - value - the value to subtract.

    **Returns:**
    - a new decimal with the subtracted percentage value.


---

### toString()
- toString(): [String](TopLevel.String.md)
  - : Returns a string representation of this object.

    **Returns:**
    - a string representation of this object.


---

### valueOf()
- valueOf(): [Object](TopLevel.Object.md)
  - : The valueOf() method is called by the ECMAScript interpret to return
      the "natural" value of an object. The Decimal object returns its
      current value as number. With this behavior script snippets can
      be written like:
      
      `
       var d = new Decimal( 10.0 );
       var x = 1.0 + d.add( 2.0 );
       `
      
      where x will be at the end 13.0.


    **Returns:**
    - the value of this object.


---

<!-- prettier-ignore-end -->
