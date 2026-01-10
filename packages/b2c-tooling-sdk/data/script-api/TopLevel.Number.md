<!-- prettier-ignore-start -->
# Class Number

- [TopLevel.Object](TopLevel.Object.md)
  - [TopLevel.Number](TopLevel.Number.md)

A Number object represents any numerical value, whether it is an integer
or floating-point number. Generally, you do not need to worry about a Number
object because a numerical value automatically becomes a Number object instance
when you use a numerical value or assign it to a variable.



## Constant Summary

| Constant | Description |
| --- | --- |
| [EPSILON](#epsilon): [Number](TopLevel.Number.md) | EPSILON is the Number value for the magnitude of the difference between 1 and the smallest  value greater than 1 that is representable as a Number value, which is approximately  2.2204460492503130808472633361816 × 10-16. |
| [MAX_SAFE_INTEGER](#max_safe_integer): [Number](TopLevel.Number.md) | The maximum safe integer in JavaScript. |
| [MAX_VALUE](#max_value): [Number](TopLevel.Number.md) | The largest representable Number. |
| [MIN_SAFE_INTEGER](#min_safe_integer): [Number](TopLevel.Number.md) | The minimum safe integer in JavaScript. |
| [MIN_VALUE](#min_value): [Number](TopLevel.Number.md) | The smallest representable Number. |
| [NEGATIVE_INFINITY](#negative_infinity): [Number](TopLevel.Number.md) | Negative infinite value; returned on overflow; |
| [NaN](#nan): [Number](TopLevel.Number.md) | Not a Number. |
| [POSITIVE_INFINITY](#positive_infinity): [Number](TopLevel.Number.md) | Negative infinite value; returned on overflow; |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [Number](#number)() | Constructs a Number with value 0 |
| [Number](#numbernumber)([Number](TopLevel.Number.md)) | Constructs a new Number using the specified Number. |
| [Number](#numberstring)([String](TopLevel.String.md)) | Constructs a Number using the specified value. |

## Method Summary

| Method | Description |
| --- | --- |
| static [isFinite](TopLevel.Number.md#isfiniteobject)([Object](TopLevel.Object.md)) | Determines whether the passed value is a finite number. |
| static [isInteger](TopLevel.Number.md#isintegerobject)([Object](TopLevel.Object.md)) | Determines whether the passed value is an integer number. |
| static [isNaN](TopLevel.Number.md#isnanobject)([Object](TopLevel.Object.md)) | Determines whether the passed value is `NaN`. |
| static [isSafeInteger](TopLevel.Number.md#issafeintegerobject)([Object](TopLevel.Object.md)) | Determines whether the passed value is a safe integer number. |
| static [parseFloat](TopLevel.Number.md#parsefloatstring)([String](TopLevel.String.md)) | Parses a String into an float Number. |
| static [parseInt](TopLevel.Number.md#parseintstring)([String](TopLevel.String.md)) | Parses a String into an integer Number. |
| static [parseInt](TopLevel.Number.md#parseintstring-number)([String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Parses a String into an integer Number using the  specified radix. |
| [toExponential](TopLevel.Number.md#toexponential)() | Converts this Number to a String using exponential notation. |
| [toExponential](TopLevel.Number.md#toexponentialnumber)([Number](TopLevel.Number.md)) | Converts this Number to a String using exponential notation with  the specified number of digits after the decimal place. |
| [toFixed](TopLevel.Number.md#tofixed)() | Converts a Number to a String that contains a no fractional part. |
| [toFixed](TopLevel.Number.md#tofixednumber)([Number](TopLevel.Number.md)) | Converts a Number to a String that contains a specified number  of digits after the decimal place. |
| [toLocaleString](TopLevel.Number.md#tolocalestring)() | Converts this Number to a String using local number formatting conventions. |
| [toPrecision](TopLevel.Number.md#toprecisionnumber)([Number](TopLevel.Number.md)) | Converts a Number to a String using the specified number  of significant digits. |
| [toString](TopLevel.Number.md#tostring)() | A String representation of this Number. |
| [toString](TopLevel.Number.md#tostringnumber)([Number](TopLevel.Number.md)) | Converts the number into a string using the specified radix (base). |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### EPSILON

- EPSILON: [Number](TopLevel.Number.md)
  - : EPSILON is the Number value for the magnitude of the difference between 1 and the smallest
      value greater than 1 that is representable as a Number value, which is approximately
      2.2204460492503130808472633361816 × 10-16.


    **API Version:**
:::note
Available from version 22.7.
:::

---

### MAX_SAFE_INTEGER

- MAX_SAFE_INTEGER: [Number](TopLevel.Number.md)
  - : The maximum safe integer in JavaScript.

    **API Version:**
:::note
Available from version 21.2.
:::

---

### MAX_VALUE

- MAX_VALUE: [Number](TopLevel.Number.md)
  - : The largest representable Number.


---

### MIN_SAFE_INTEGER

- MIN_SAFE_INTEGER: [Number](TopLevel.Number.md)
  - : The minimum safe integer in JavaScript.

    **API Version:**
:::note
Available from version 21.2.
:::

---

### MIN_VALUE

- MIN_VALUE: [Number](TopLevel.Number.md)
  - : The smallest representable Number.


---

### NEGATIVE_INFINITY

- NEGATIVE_INFINITY: [Number](TopLevel.Number.md)
  - : Negative infinite value; returned on overflow;


---

### NaN

- NaN: [Number](TopLevel.Number.md)
  - : Not a Number.


---

### POSITIVE_INFINITY

- POSITIVE_INFINITY: [Number](TopLevel.Number.md)
  - : Negative infinite value; returned on overflow;


---

## Constructor Details

### Number()
- Number()
  - : Constructs a Number with value 0


---

### Number(Number)
- Number(num: [Number](TopLevel.Number.md))
  - : Constructs a new Number using the specified Number.

    **Parameters:**
    - num - the Number to use.


---

### Number(String)
- Number(value: [String](TopLevel.String.md))
  - : Constructs a Number using the specified value.

    **Parameters:**
    - value - the value to use when creating the Number.


---

## Method Details

### isFinite(Object)
- static isFinite(value: [Object](TopLevel.Object.md)): [Boolean](TopLevel.Boolean.md)
  - : Determines whether the passed value is a finite number.

    **Parameters:**
    - value - The value to check.

    **Returns:**
    - `true` if the passed value is a finite number, else `false`.

    **API Version:**
:::note
Available from version 21.2.
:::

---

### isInteger(Object)
- static isInteger(value: [Object](TopLevel.Object.md)): [Boolean](TopLevel.Boolean.md)
  - : Determines whether the passed value is an integer number.

    **Parameters:**
    - value - The value to check.

    **Returns:**
    - `true` if the passed value is a finite integer number, else `false`.

    **API Version:**
:::note
Available from version 21.2.
:::

---

### isNaN(Object)
- static isNaN(value: [Object](TopLevel.Object.md)): [Boolean](TopLevel.Boolean.md)
  - : Determines whether the passed value is `NaN`. Unlike the global function, the passed parameter is not converted to number before doing the check.

    **Parameters:**
    - value - The value to check.

    **Returns:**
    - `true` if the passed value is the `NaN` number value, else `false`.

    **API Version:**
:::note
Available from version 21.2.
:::

---

### isSafeInteger(Object)
- static isSafeInteger(value: [Object](TopLevel.Object.md)): [Boolean](TopLevel.Boolean.md)
  - : Determines whether the passed value is a safe integer number.

    **Parameters:**
    - value - The value to check.

    **Returns:**
    - `true` if the passed value is a safe integer number, else `false`.

    **API Version:**
:::note
Available from version 21.2.
:::

---

### parseFloat(String)
- static parseFloat(s: [String](TopLevel.String.md)): [Number](TopLevel.Number.md)
  - : Parses a String into an float Number.

    **Parameters:**
    - s - the String to parse.

    **Returns:**
    - Returns the float as a Number.

    **API Version:**
:::note
Available from version 21.2.
:::

---

### parseInt(String)
- static parseInt(s: [String](TopLevel.String.md)): [Number](TopLevel.Number.md)
  - : Parses a String into an integer Number.
      This function is a short form for the call to [parseInt(String, Number)](TopLevel.Number.md#parseintstring-number) with automatic determination of the radix.
      If the string starts with "0x" or "0X" then the radix is 16. In all other cases the radix is 10.


    **Parameters:**
    - s - the String to parse.

    **Returns:**
    - Returns the integer as a Number.

    **API Version:**
:::note
Available from version 21.2.
:::

---

### parseInt(String, Number)
- static parseInt(s: [String](TopLevel.String.md), radix: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Parses a String into an integer Number using the
      specified radix.


    **Parameters:**
    - s - the String to parse.
    - radix - the radix to use.

    **Returns:**
    - Returns the integer as a Number.

    **API Version:**
:::note
Available from version 21.2.
:::

---

### toExponential()
- toExponential(): [String](TopLevel.String.md)
  - : Converts this Number to a String using exponential notation.

    **Returns:**
    - a String using exponential notation.


---

### toExponential(Number)
- toExponential(digits: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Converts this Number to a String using exponential notation with
      the specified number of digits after the decimal place.


    **Parameters:**
    - digits - the number of digits after the decimal place.

    **Returns:**
    - a String using exponential notation with
      the specified number of digits after the decimal place.



---

### toFixed()
- toFixed(): [String](TopLevel.String.md)
  - : Converts a Number to a String that contains a no fractional part.

    **Returns:**
    - a String representation of the number


---

### toFixed(Number)
- toFixed(digits: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Converts a Number to a String that contains a specified number
      of digits after the decimal place.


    **Parameters:**
    - digits - the number of digits after the decimal place.

    **Returns:**
    - a String that contains a specified number
      of digits after the decimal place.



---

### toLocaleString()
- toLocaleString(): [String](TopLevel.String.md)
  - : Converts this Number to a String using local number formatting conventions. 
      
      The current implementation actually only returns the same as [toString()](TopLevel.Number.md#tostring).


    **Returns:**
    - a String using local number formatting conventions.


---

### toPrecision(Number)
- toPrecision(precision: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Converts a Number to a String using the specified number
      of significant digits. Uses exponential or fixed point
      notation depending on the size of the number and the number of
      significant digits specified.


    **Parameters:**
    - precision - the precision to use when converting the Number  to a String.

    **Returns:**
    - a String using the specified number
      of significant digits.



---

### toString()
- toString(): [String](TopLevel.String.md)
  - : A String representation of this Number.

    **Returns:**
    - a String representation of this Number.


---

### toString(Number)
- toString(radix: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Converts the number into a string using the specified radix (base).

    **Parameters:**
    - radix - the radix to use.

    **Returns:**
    - a String representation of this Number.


---

<!-- prettier-ignore-end -->
