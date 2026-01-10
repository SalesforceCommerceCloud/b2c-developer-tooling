<!-- prettier-ignore-start -->
# Class BigInt

- [TopLevel.Object](TopLevel.Object.md)
  - [TopLevel.BigInt](TopLevel.BigInt.md)

A BigInt object is a wrapper for a primitive `bigint` value.
`bigint` values can be numbers too large to be stored as `number` values.


A `bigint` literal in code is an integer number with an appended `n`.


Example:

```
var hugeNumber = 1245678901234567890n;
var hugeNumberObject = BigInt( hugeNumber );
```


**API Version:**
:::note
Available from version 22.7.
:::

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [BigInt](#bigint)() | Constructs a BigInt with value 0. |
| [BigInt](#bigintbigint)([BigInt](TopLevel.BigInt.md)) | Constructs a new BigInt using the specified BigInt. |
| [BigInt](#bigintstring)([String](TopLevel.String.md)) | Constructs a BigInt using the specified value. |

## Method Summary

| Method | Description |
| --- | --- |
| static [asIntN](TopLevel.BigInt.md#asintnnumber-bigint)([Number](TopLevel.Number.md), [BigInt](TopLevel.BigInt.md)) | Clamps the given BigInt value to a signed integer with a given precision. |
| static [asUintN](TopLevel.BigInt.md#asuintnnumber-bigint)([Number](TopLevel.Number.md), [BigInt](TopLevel.BigInt.md)) | Clamps the given BigInt value to an unsigned integer with a given precision. |
| [toLocaleString](TopLevel.BigInt.md#tolocalestring)() | Converts this BigInt to a String using local number formatting conventions. |
| [toString](TopLevel.BigInt.md#tostring)() | A String representation of this BigInt. |
| [toString](TopLevel.BigInt.md#tostringnumber)([Number](TopLevel.Number.md)) | Converts the BigInt into a string using the specified radix (base). |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constructor Details

### BigInt()
- BigInt()
  - : Constructs a BigInt with value 0.


---

### BigInt(BigInt)
- BigInt(value: [BigInt](TopLevel.BigInt.md))
  - : Constructs a new BigInt using the specified BigInt.

    **Parameters:**
    - value - the BigInt to use.


---

### BigInt(String)
- BigInt(value: [String](TopLevel.String.md))
  - : Constructs a BigInt using the specified value.
      
      
      Beside decimal numbers also binary, octal and hexadecimal numbers are supported:
      
      ```
      var decimal = BigInt( "12" );
      var binary  = BigInt( "0b1100" );
      var octal   = BigInt( "0o14" );
      var hex     = BigInt( "0xC" );
      ```


    **Parameters:**
    - value - the value to use when creating the BigInt.


---

## Method Details

### asIntN(Number, BigInt)
- static asIntN(bits: [Number](TopLevel.Number.md), value: [BigInt](TopLevel.BigInt.md)): [BigInt](TopLevel.BigInt.md)
  - : Clamps the given BigInt value to a signed integer with a given precision.

    **Parameters:**
    - bits - Number of bits required for resulting integer.
    - value - The value to be clamped to the given number of bits.

    **Returns:**
    - The `value` modulo 2`bits`, as a signed integer.


---

### asUintN(Number, BigInt)
- static asUintN(bits: [Number](TopLevel.Number.md), value: [BigInt](TopLevel.BigInt.md)): [BigInt](TopLevel.BigInt.md)
  - : Clamps the given BigInt value to an unsigned integer with a given precision.

    **Parameters:**
    - bits - Number of bits required for resulting integer.
    - value - The value to be clamped to the given number of bits.

    **Returns:**
    - The `value` modulo 2`bits`, as an unsigned integer.


---

### toLocaleString()
- toLocaleString(): [String](TopLevel.String.md)
  - : Converts this BigInt to a String using local number formatting conventions. 
      
      The current implementation actually only returns the same as [toString()](TopLevel.BigInt.md#tostring).


    **Returns:**
    - a String using local number formatting conventions.


---

### toString()
- toString(): [String](TopLevel.String.md)
  - : A String representation of this BigInt.

    **Returns:**
    - a String representation of this BigInt.


---

### toString(Number)
- toString(radix: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Converts the BigInt into a string using the specified radix (base).

    **Parameters:**
    - radix - the radix to use.

    **Returns:**
    - a String representation of this BigInt.


---

<!-- prettier-ignore-end -->
