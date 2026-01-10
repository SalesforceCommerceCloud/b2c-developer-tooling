<!-- prettier-ignore-start -->
# Class Math

- [TopLevel.Object](TopLevel.Object.md)
  - [TopLevel.Math](TopLevel.Math.md)

Mathematical functions and constants.


## Constant Summary

| Constant | Description |
| --- | --- |
| [E](#e): [Number](TopLevel.Number.md) | The constant _e_, which is the base of natural logarithms. |
| [LN10](#ln10): [Number](TopLevel.Number.md) | The natural logarithm of 10. |
| [LN2](#ln2): [Number](TopLevel.Number.md) | The natural logarithm of 2. |
| [LOG10E](#log10e): [Number](TopLevel.Number.md) | The base-10 logarithm of _e_. |
| [LOG2E](#log2e): [Number](TopLevel.Number.md) | The base-2 logarithm of _e_. |
| [PI](#pi): [Number](TopLevel.Number.md) | The constant for PI. |
| [SQRT1_2](#sqrt1_2): [Number](TopLevel.Number.md) | 1 divided by the square root of 2. |
| [SQRT2](#sqrt2): [Number](TopLevel.Number.md) | The square root of 2. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [Math](#math)() |  |

## Method Summary

| Method | Description |
| --- | --- |
| static [abs](TopLevel.Math.md#absnumber)([Number](TopLevel.Number.md)) | Returns the absolute value of _x_. |
| static [acos](TopLevel.Math.md#acosnumber)([Number](TopLevel.Number.md)) | Returns an approximation to the arc cosine of _x_. |
| static [acosh](TopLevel.Math.md#acoshnumber)([Number](TopLevel.Number.md)) | Returns an approximation to the inverse hyperbolic cosine of _x_. |
| static [asin](TopLevel.Math.md#asinnumber)([Number](TopLevel.Number.md)) | Returns an approximation to the arc sine of _x_. |
| static [asinh](TopLevel.Math.md#asinhnumber)([Number](TopLevel.Number.md)) | Returns an approximation to the inverse hyperbolic sine of _x_. |
| static [atan](TopLevel.Math.md#atannumber)([Number](TopLevel.Number.md)) | Returns an approximation to the arc tangent of _x_. |
| static [atan2](TopLevel.Math.md#atan2number-number)([Number](TopLevel.Number.md), [Number](TopLevel.Number.md)) | Returns an approximation to the arc tangent of the quotient y/x of the arguments _y_ and _x_, where the  signs of _y_ and _x_ are used to determine the quadrant of the result. |
| static [atanh](TopLevel.Math.md#atanhnumber)([Number](TopLevel.Number.md)) | Returns an approximation to the inverse hyperbolic tangent of _x_. |
| static [cbrt](TopLevel.Math.md#cbrtnumber)([Number](TopLevel.Number.md)) | Returns an approximation to the cube root of _x_. |
| static [ceil](TopLevel.Math.md#ceilnumber)([Number](TopLevel.Number.md)) | Returns the smallest (closest to -&#8734;) number value that is not less than _x_ and is equal to a  mathematical integer. |
| static [clz32](TopLevel.Math.md#clz32number)([Number](TopLevel.Number.md)) | Returns the number of leading zero bits in the 32-bit binary representation of _x_. |
| static [cos](TopLevel.Math.md#cosnumber)([Number](TopLevel.Number.md)) | Returns an approximation to the cosine of _x_. |
| static [cosh](TopLevel.Math.md#coshnumber)([Number](TopLevel.Number.md)) | Returns an approximation to the hyperbolic cosine of _x_. |
| static [exp](TopLevel.Math.md#expnumber)([Number](TopLevel.Number.md)) | Returns an approximation to the exponential function of _x_ (e raised to the power  of x, where e is the base of the natural logarithms). |
| static [expm1](TopLevel.Math.md#expm1number)([Number](TopLevel.Number.md)) | Returns an approximation to subtracting 1 from the exponential function of _x_ (e raised to the power of _x_, where e  is the base of the natural logarithms). |
| static [floor](TopLevel.Math.md#floornumber)([Number](TopLevel.Number.md)) | Returns the greatest (closest to +&#8734;) number value that is not greater than _x_ and is equal to a  mathematical integer. |
| static [fround](TopLevel.Math.md#froundnumber)([Number](TopLevel.Number.md)) | Returns the nearest 32-bit single precision float representation of _x_. |
| static [hypot](TopLevel.Math.md#hypotnumber)([Number...](TopLevel.Number.md)) | Returns an approximation of the square root of the sum of squares of the arguments. |
| static [imul](TopLevel.Math.md#imulnumber-number)([Number](TopLevel.Number.md), [Number](TopLevel.Number.md)) | Performs a 32 bit integer multiplication, where the result is always a 32 bit integer value, ignoring any overflows. |
| static [log](TopLevel.Math.md#lognumber)([Number](TopLevel.Number.md)) | Returns an approximation to the natural logarithm of _x_. |
| static [log10](TopLevel.Math.md#log10number)([Number](TopLevel.Number.md)) | Returns an approximation to the base 10 logarithm of _x_. |
| static [log1p](TopLevel.Math.md#log1pnumber)([Number](TopLevel.Number.md)) | Returns an approximation to the natural logarithm of of 1 + _x_. |
| static [log2](TopLevel.Math.md#log2number)([Number](TopLevel.Number.md)) | Returns an approximation to the base 2 logarithm of _x_. |
| static [max](TopLevel.Math.md#maxnumber)([Number...](TopLevel.Number.md)) | Returns the largest specified values. |
| static [min](TopLevel.Math.md#minnumber)([Number...](TopLevel.Number.md)) | Returns the smallest of the specified values. |
| static [pow](TopLevel.Math.md#pownumber-number)([Number](TopLevel.Number.md), [Number](TopLevel.Number.md)) | Returns an approximation to the result of raising _x_ to the power _y_. |
| static [random](TopLevel.Math.md#random)() | Returns a number value with positive sign, greater than or equal to 0 but less than 1, chosen randomly or pseudo  randomly with approximately uniform distribution over that range, using an implementation-dependent algorithm or  strategy. |
| static [round](TopLevel.Math.md#roundnumber)([Number](TopLevel.Number.md)) | Returns the number value that is closest to _x_ and is equal to a mathematical integer. |
| static [sign](TopLevel.Math.md#signnumber)([Number](TopLevel.Number.md)) | Returns the sign of _x_, indicating whether _x_ is positive, negative, or zero. |
| static [sin](TopLevel.Math.md#sinnumber)([Number](TopLevel.Number.md)) | Returns an approximation to the sine of _x_. |
| static [sinh](TopLevel.Math.md#sinhnumber)([Number](TopLevel.Number.md)) | Returns an approximation to the hyperbolic sine of _x_. |
| static [sqrt](TopLevel.Math.md#sqrtnumber)([Number](TopLevel.Number.md)) | Returns an approximation to the square root of _x_. |
| static [tan](TopLevel.Math.md#tannumber)([Number](TopLevel.Number.md)) | Returns an approximation to the tangent of _x_. |
| static [tanh](TopLevel.Math.md#tanhnumber)([Number](TopLevel.Number.md)) | Returns an approximation to the hyperbolic tangent of _x_. |
| static [trunc](TopLevel.Math.md#truncnumber)([Number](TopLevel.Number.md)) | Returns the integral part of the number _x_, removing any fractional digits. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### E

- E: [Number](TopLevel.Number.md)
  - : The constant _e_, which is the base of natural logarithms.


---

### LN10

- LN10: [Number](TopLevel.Number.md)
  - : The natural logarithm of 10.


---

### LN2

- LN2: [Number](TopLevel.Number.md)
  - : The natural logarithm of 2.


---

### LOG10E

- LOG10E: [Number](TopLevel.Number.md)
  - : The base-10 logarithm of _e_.


---

### LOG2E

- LOG2E: [Number](TopLevel.Number.md)
  - : The base-2 logarithm of _e_.


---

### PI

- PI: [Number](TopLevel.Number.md)
  - : The constant for PI.


---

### SQRT1_2

- SQRT1_2: [Number](TopLevel.Number.md)
  - : 1 divided by the square root of 2.


---

### SQRT2

- SQRT2: [Number](TopLevel.Number.md)
  - : The square root of 2.


---

## Constructor Details

### Math()
- Math()
  - : 


---

## Method Details

### abs(Number)
- static abs(x: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Returns the absolute value of _x_. The result has the same magnitude as _x_ but has positive sign.
      
      - If _x_is NaN, the result is NaN.
      - If _x_is -0, the result is +0.
      - If _x_is -&#8734;, the result is +&#8734;.


    **Parameters:**
    - x - the Number to operate on.

    **Returns:**
    - the absolute value of _x_.


---

### acos(Number)
- static acos(x: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Returns an approximation to the arc cosine of _x_. The result is expressed in radians and ranges from +0 to
      +p.
      
      - If _x_is NaN, the result is NaN.
      - If _x_is greater than 1, the result is NaN.
      - If _x_is less than -1, the result is NaN.
      - If _x_is exactly 1, the result is +0.


    **Parameters:**
    - x - the Number to operate on.

    **Returns:**
    - an approximation to the arc cosine of _x_.


---

### acosh(Number)
- static acosh(x: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Returns an approximation to the inverse hyperbolic cosine of _x_.
      
      - If _x_is NaN, the result is NaN.
      - If _x_is less than 1, the result is NaN.
      - If _x_is exactly 1, the result is +0.
      - If _x_is +&#8734;, the result is +&#8734;.


    **Parameters:**
    - x - the Number to operate on.

    **Returns:**
    - an approximation to the inverse hyperbolic cosine of _x_.

    **API Version:**
:::note
Available from version 21.2.
:::

---

### asin(Number)
- static asin(x: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Returns an approximation to the arc sine of _x_. The result is expressed in radians and ranges from -p/2 to
      +p/2.
      
      - If _x_is NaN, the result is NaN
      - If _x_is greater than 1, the result is NaN.
      - If _x_is less than -1, the result is NaN.
      - If _x_is +0, the result is +0.
      - If _x_is -0, the result is -0.


    **Parameters:**
    - x - the Number to operate on.

    **Returns:**
    - an approximation to the arc sine of _x_.


---

### asinh(Number)
- static asinh(x: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Returns an approximation to the inverse hyperbolic sine of _x_.
      
      - If _x_is NaN, the result is NaN
      - If _x_is +0, the result is +0.
      - If _x_is -0, the result is -0.
      - If _x_is +&#8734;, the result is +&#8734;.
      - If _x_is -&#8734;, the result is -&#8734;.


    **Parameters:**
    - x - the Number to operate on.

    **Returns:**
    - an approximation to the inverse hyperbolic sine of _x_.

    **API Version:**
:::note
Available from version 21.2.
:::

---

### atan(Number)
- static atan(x: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Returns an approximation to the arc tangent of _x_. The result is expressed in radians and ranges from -p/2
      to +p/2.
      
      - If _x_is NaN, the result is NaN.
      - If _x_is +0, the result is +0.
      - If _x_is -0, the result is -0.
      - If _x_is +&#8734;, the result is an approximation to +p/2.
      - If _x_is -&#8734;, the result is an approximation to -p/2.


    **Parameters:**
    - x - the Number to operate on.

    **Returns:**
    - an approximation to the arc tangent of _x_.


---

### atan2(Number, Number)
- static atan2(y: [Number](TopLevel.Number.md), x: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Returns an approximation to the arc tangent of the quotient y/x of the arguments _y_ and _x_, where the
      signs of _y_ and _x_ are used to determine the quadrant of the result. Note that it is intentional and
      traditional for the two-argument arc tangent function that the argument named _y_ be first and the argument
      named _x_ be second. The result is expressed in radians and ranges from -p to +p.
      
      - If either _x_or _y_is NaN, the result is NaN.
      - If _y_>0 and _x_is +0, the result is an implementation-dependent approximation to +p/2.
      - If _y_>0 and _x_is -0, the result is an implementation-dependent approximation to +p/2.
      - If _y_is +0 and _x_>0, the result is +0.
      - If _y_is +0 and _x_is +0, the result is +0.
      - If _y_is +0 and _x_is -0, the result is an implementation-dependent approximation to +p.
      - If _y_is +0 and _X_<0, the result is an implementation-dependent approximation to +p.
      - If _y_is -0 and _x_>0, the result is -0.
      - If _y_is -0 and _x_is +0, the result is -0.
      - If _y_is -0 and _x_is -0, the result is an implementation-dependent approximation to -p.
      - If _y_is -0 and _X_<0, the result is an implementation-dependent approximation to -p.
      - If _y_<0 and _x_is +0, the result is an implementation-dependent approximation to -p/2.
      - If _y_<0 and _x_is -0, the result is an implementation-dependent approximation to -p/2.
      - If _y_>0 and _y_is finite and _x_is +&#8734;, the result is +0.
      - If _y_>0 and _y_is finite and _x_is -&#8734;, the result if an implementation-dependent  approximation to +p.
      - If _y_<0 and _y_is finite and _x_is +&#8734;, the result is -0.
      - If _y_<0 and _y_is finite and _x_is -&#8734;, the result is an implementation-dependent  approximation to -p.
      - If _y_is +&#8734;and _x_is finite, the result is an implementation-dependent approximation to  +p/2.
      - If _y_is -&#8734;and _x_is finite, the result is an implementation-dependent approximation to  -p/2.
      - If _y_is +&#8734;and _x_is +&#8734;, the result is an implementation-dependent approximation to  +p/4.
      - If _y_is +&#8734;and _x_is -&#8734;, the result is an implementation-dependent approximation to  +3p/4.
      - If _y_is -&#8734;and _x_is +&#8734;, the result is an implementation-dependent approximation to  -p/4.
      - If _y_is -&#8734;and _x_is -&#8734;, the result is an implementation-dependent approximation to  -3p/4.


    **Parameters:**
    - y - the first argument.
    - x - the second argument.

    **Returns:**
    - approximation to the arc tangent of the quotient _y/x_ of the arguments _y_ and x, where the
              signs of _y_ and _x_ are used to determine the quadrant of the result.



---

### atanh(Number)
- static atanh(x: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Returns an approximation to the inverse hyperbolic tangent of _x_.
      
      - If _x_is NaN, the result is NaN.
      - If _x_is less than -1, the result is NaN.
      - If _x_is greater than 1, the result is NaN.
      - If _x_is exactly -1, the result is -&#8734;.
      - If _x_is exactly +1, the result is +&#8734;.
      - If _x_is +0, the result is +0.
      - If _x_is -0, the result is -0.


    **Parameters:**
    - x - the Number to operate on.

    **Returns:**
    - an approximation to the inverse hyperbolic tangent of _x_.

    **API Version:**
:::note
Available from version 21.2.
:::

---

### cbrt(Number)
- static cbrt(x: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Returns an approximation to the cube root of _x_.
      
      - If _x_is NaN, the result is NaN
      - If _x_is +0, the result is +0.
      - If _x_is -0, the result is -0.
      - If _x_is +&#8734;, the result is +&#8734;.
      - If _x_is -&#8734;, the result is -&#8734;.


    **Parameters:**
    - x - the Number to operate on.

    **Returns:**
    - an approximation to the cube root of _x_.

    **API Version:**
:::note
Available from version 21.2.
:::

---

### ceil(Number)
- static ceil(x: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Returns the smallest (closest to -&#8734;) number value that is not less than _x_ and is equal to a
      mathematical integer. If _x_ is already an integer, the result is _x_.
      
      - If _x_is NaN, the result is NaN.
      - If _x_is +0, the result is +0.
      - If _x_is -0, the result is -0.
      - If _x_is +&#8734;, the result is +&#8734;.
      - If _x_is -&#8734;, the result is -&#8734;.
      - If _x_is less than 0 but greater than -1, the result is -0.
      
      The value of Math.ceil(x) is the same as the value of -Math.floor(-x).


    **Parameters:**
    - x - the Number to operate on.

    **Returns:**
    - the smallest (closest to -&#8734;) number value that is not less than _x_ and is equal to a
              mathematical integer.



---

### clz32(Number)
- static clz32(x: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Returns the number of leading zero bits in the 32-bit binary representation of _x_.

    **Parameters:**
    - x - the Number to operate on.

    **Returns:**
    - the number of leading zero bits in the 32-bit binary representation of _x_.

    **API Version:**
:::note
Available from version 21.2.
:::

---

### cos(Number)
- static cos(x: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Returns an approximation to the cosine of _x_. The argument is expressed in radians.
      
      - If _x_is NaN, the result is NaN.
      - If _x_is +0, the result is 1.
      - If _x_is -0, the result is 1.
      - If _x_is +&#8734;, the result is NaN.
      - If _x_is -&#8734;, the result is NaN.


    **Parameters:**
    - x - the Number to operate on.

    **Returns:**
    - an approximation to the cosine of _x_.


---

### cosh(Number)
- static cosh(x: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Returns an approximation to the hyperbolic cosine of _x_.
      
      - If _x_is NaN, the result is NaN.
      - If _x_is +0, the result is 1.
      - If _x_is -0, the result is 1.
      - If _x_is +&#8734;, the result is +&#8734;.
      - If _x_is -&#8734;, the result is +&#8734;.


    **Parameters:**
    - x - the Number to operate on.

    **Returns:**
    - an approximation to the hyperbolic cosine of _x_.

    **API Version:**
:::note
Available from version 21.2.
:::

---

### exp(Number)
- static exp(x: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Returns an approximation to the exponential function of _x_ (e raised to the power
      of x, where e is the base of the natural logarithms).
      
      - If _x_is NaN, the result is NaN.
      - If _x_is +0, the result is 1.
      - If _x_is -0, the result is 1.
      - If _x_is +&#8734;, the result is +&#8734;.
      - If _x_is -&#8734;, the result is +0.


    **Parameters:**
    - x - the Number to operate on.

    **Returns:**
    - an approximation to the exponential function of _x_.


---

### expm1(Number)
- static expm1(x: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Returns an approximation to subtracting 1 from the exponential function of _x_ (e raised to the power of _x_, where e
      is the base of the natural logarithms). The result is computed in a way that is accurate even when the value of _x_
      is close 0.
      
      - If _x_is NaN, the result is NaN.
      - If _x_is +0, the result is +0.
      - If _x_is -0, the result is -0.
      - If _x_is +&#8734;, the result is +&#8734;.
      - If _x_is -&#8734;, the result is -1.


    **Parameters:**
    - x - the Number to operate on.

    **Returns:**
    - an  approximation to subtracting 1 from the exponential function of _x_.

    **API Version:**
:::note
Available from version 21.2.
:::

---

### floor(Number)
- static floor(x: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Returns the greatest (closest to +&#8734;) number value that is not greater than _x_ and is equal to a
      mathematical integer. If _x_ is already an integer, the result is _x_.
      
      - If _x_is NaN, the result is NaN.
      - If _x_is +0, the result is +0.
      - If _x_is -0, the result is -0.
      - If _x_is +&#8734;, the result is +&#8734;.
      - If _x_is -&#8734;, the result is -&#8734;.
      - If _x_is greater than 0 but less than 1, the result is +0.
      
      The value of Math.floor(_x_) is the same as the value of -Math.ceil(_-x_).


    **Parameters:**
    - x - the Number to operate on.

    **Returns:**
    - the greatest (closest to +&#8734;) number value that is not greater than _x_ and is equal to a
              mathematical integer.



---

### fround(Number)
- static fround(x: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Returns the nearest 32-bit single precision float representation of _x_.

    **Parameters:**
    - x - the Number to operate on.

    **Returns:**
    - the nearest 32-bit single precision float representation of _x_.

    **API Version:**
:::note
Available from version 21.2.
:::

---

### hypot(Number...)
- static hypot(values: [Number...](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Returns an approximation of the square root of the sum of squares of the arguments.
      
      - If no arguments are passed, the result is +0.
      - If any argument is +&#8734;, the result is +&#8734;.
      - If any argument is -&#8734;, the result is +&#8734;.
      - If no argument is +&#8734;or -&#8734;and any argument is NaN, the result is NaN.
      - If all arguments are either +0 or -0, the result is +0.


    **Parameters:**
    - values - the Number values to operate on.

    **Returns:**
    - an approximation of the square root of the sum of squares of the arguments.

    **API Version:**
:::note
Available from version 21.2.
:::

---

### imul(Number, Number)
- static imul(x: [Number](TopLevel.Number.md), y: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Performs a 32 bit integer multiplication, where the result is always a 32 bit integer value, ignoring any overflows.

    **Parameters:**
    - x - The first operand.
    - y - The second operand.

    **Returns:**
    - Returns the result of the 32 bit multiplication. The result is a 32 bit signed integer value.

    **API Version:**
:::note
Available from version 21.2.
:::

---

### log(Number)
- static log(x: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Returns an approximation to the natural logarithm of _x_.
      
      - If _x_is NaN, the result is NaN.
      - If _x_is less than 0, the result is NaN.
      - If _x_is +0 or -0, the result is -&#8734;.
      - If _x_is 1, the result is +0.
      - If _x_is +&#8734;, the result is +&#8734;.


    **Parameters:**
    - x - the Number to operate on.

    **Returns:**
    - an approximation to the natural logarithm of _x_.


---

### log10(Number)
- static log10(x: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Returns an approximation to the base 10 logarithm of _x_.
      
      - If _x_is NaN, the result is NaN.
      - If _x_is less than 0, the result is NaN.
      - If _x_is +0 or -0, the result is -&#8734;.
      - If _x_is 1, the result is +0.
      - If _x_is +&#8734;, the result is +&#8734;.


    **Parameters:**
    - x - the Number to operate on.

    **Returns:**
    - an approximation to the base 10 logarithm of _x_.

    **API Version:**
:::note
Available from version 21.2.
:::

---

### log1p(Number)
- static log1p(x: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Returns an approximation to the natural logarithm of of 1 + _x_.
      
      - If _x_is NaN, the result is NaN.
      - If _x_is less than -1, the result is NaN.
      - If _x_is -1, the result is -&#8734;.
      - If _x_is +0, the result is +0.
      - If _x_is -0, the result is -0.
      - If _x_is +&#8734;, the result is +&#8734;.


    **Parameters:**
    - x - the Number to operate on.

    **Returns:**
    - an approximation to the natural logarithm of of 1 + _x_.

    **API Version:**
:::note
Available from version 21.2.
:::

---

### log2(Number)
- static log2(x: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Returns an approximation to the base 2 logarithm of _x_.
      
      - If _x_is NaN, the result is NaN.
      - If _x_is less than 0, the result is NaN.
      - If _x_is +0 or -0, the result is -&#8734;.
      - If _x_is 1, the result is +0.
      - If _x_is +&#8734;, the result is +&#8734;.


    **Parameters:**
    - x - the Number to operate on.

    **Returns:**
    - an approximation to the base 2 logarithm of _x_.

    **API Version:**
:::note
Available from version 21.2.
:::

---

### max(Number...)
- static max(values: [Number...](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Returns the largest specified values. If no arguments are given, the result is -&#8734;. If any value is NaN, the
      result is NaN.


    **Parameters:**
    - values - zero or more values.

    **Returns:**
    - the largest of the specified values.


---

### min(Number...)
- static min(values: [Number...](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Returns the smallest of the specified values. If no arguments are given, the result is +&#8734;. If any value is
      NaN, the result is NaN.


    **Parameters:**
    - values - zero or more values.

    **Returns:**
    - the smallest of the specified values.


---

### pow(Number, Number)
- static pow(x: [Number](TopLevel.Number.md), y: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Returns an approximation to the result of raising _x_ to the power _y_.
      
      - If _y_is NaN, the result is NaN.
      - If _y_is +0, the result is 1, even if _x_is NaN.
      - If _y_is -0, the result is 1, even if _x_is NaN.
      - If _x_is NaN and _y_is nonzero, the result is NaN.
      - If abs(_x_)>1 and _y_is +&#8734;, the result is +&#8734;.
      - If abs(_x_)>1 and _y_is -&#8734;, the result is +0.
      - If abs(_x_)==1 and _y_is +&#8734;, the result is NaN.
      - If abs(_x_)==1 and _y_is -&#8734;, the result is NaN.
      - If abs(_x_)<1 and _y_is +&#8734;, the result is +0.
      - If abs(_x_)<1 and _y_is -&#8734;, the result is +&#8734;.
      - If _x_is +&#8734;and _y_>0, the result is +&#8734;.
      - If _x_is +&#8734;and _y_<0, the result is +0.
      - If _x_is -&#8734;and _y_>0 and _y_is an odd integer, the result is -&#8734;.
      - If _x_is -&#8734;and _y_>0 and _y_is not an odd integer, the result is +&#8734;.
      - If _x_is -&#8734;and _y_<0 and _y_is an odd integer, the result is -0.
      - If _x_is -&#8734;and _y_<0 and _y_is not an odd integer, the result is +0.
      - If _x_is +0 and _y_>0, the result is +0.
      - If _x_is +0 and _y_<0, the result is +&#8734;.
      - If _x_is -0 and _y_>0 and _y_is an odd integer, the result is -0.
      - If _x_is -0 and _y_>0 and _y_is not an odd integer, the result is +0.
      - If _x_is -0 and _y_<0 and _y_is an odd integer, the result is -&#8734;.
      - If _x_is -0 and _y_<0 and _y_is not an odd integer, the result is +&#8734;.
      - If _X_<0 and _x_is finite and _y_is finite and _y_is not an integer, the result is  NaN.


    **Parameters:**
    - x - a Number that will be raised to the power of _y_.
    - y - the power by which _x_ will be raised.

    **Returns:**
    - an approximation to the result of raising _x_ to the power _y_.


---

### random()
- static random(): [Number](TopLevel.Number.md)
  - : Returns a number value with positive sign, greater than or equal to 0 but less than 1, chosen randomly or pseudo
      randomly with approximately uniform distribution over that range, using an implementation-dependent algorithm or
      strategy.


    **Returns:**
    - a Number greater than or equal to 0 but less than 1.


---

### round(Number)
- static round(x: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Returns the number value that is closest to _x_ and is equal to a mathematical integer. If two integer
      number values are equally close to x, then the result is the number value that is closer to +&#8734;. If _x_
      is already an integer, the result is _x_.
      
      - If _x_is NaN, the result is NaN.
      - If _x_is +0, the result is +0.
      - If _x_is -0, the result is -0.
      - If _x_is +&#8734;, the result is +&#8734;.
      - If _x_is -&#8734;, the result is -&#8734;.
      - If _x_is greater than 0 but less than 0.5, the result is +0.
      - If _x_is less than 0 but greater than or equal to -0.5, the result is -0.
      
      Math.round(3.5) returns 4, but Math.round(-3.5) returns -3. The value of Math.round(_x_) is the same as the
      value of Math.floor(_x_+0.5), except when _x_ is -0 or is less than 0 but greater than or equal to
      -0.5; for these cases Math.round(_x_) returns -0, but Math.floor(_x_+0.5) returns +0.


    **Parameters:**
    - x - the Number to operate on.

    **Returns:**
    - the number value that is closest to _x_ and is equal to a mathematical integer.


---

### sign(Number)
- static sign(x: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Returns the sign of _x_, indicating whether _x_ is positive, negative, or zero.
      
      - If _x_is NaN, the result is NaN.
      - If _x_is -0, the result is -0.
      - If _x_is +0, the result is +0.
      - If _x_is negative and not -0, the result is -1.
      - If _x_is positive and not +0, the result is +1.


    **Parameters:**
    - x - the Number to operate on.

    **Returns:**
    - the sign of _x_.

    **API Version:**
:::note
Available from version 21.2.
:::

---

### sin(Number)
- static sin(x: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Returns an approximation to the sine of _x_. The argument is expressed in radians.
      
      - If _x_is NaN, the result is NaN.
      - If _x_is +0, the result is +0.
      - If _x_is -0, the result is -0.
      - If _x_is +&#8734;or -&#8734;, the result is NaN.


    **Parameters:**
    - x - the Number to operate on.

    **Returns:**
    - an approximation to the sine of _x_.


---

### sinh(Number)
- static sinh(x: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Returns an approximation to the hyperbolic sine of _x_.
      
      - If _x_is NaN, the result is NaN.
      - If _x_is +0, the result is +0.
      - If _x_is -0, the result is -0.
      - If _x_is +&#8734;, the result is +&#8734;.
      - If _x_is -&#8734;, the result is +&#8734;.


    **Parameters:**
    - x - the Number to operate on.

    **Returns:**
    - an approximation to the hyperbolic sine of _x_.

    **API Version:**
:::note
Available from version 21.2.
:::

---

### sqrt(Number)
- static sqrt(x: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Returns an approximation to the square root of _x_.
      
      - If _x_is NaN, the result is NaN.
      - If _x_isless than 0, the result is NaN.
      - If _x_is +0, the result is +0.
      - If _x_is -0, the result is -0.
      - If _x_is +&#8734;, the result is +&#8734;.


    **Parameters:**
    - x - the Number to operate on.

    **Returns:**
    - an approximation to the square root of _x_.


---

### tan(Number)
- static tan(x: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Returns an approximation to the tangent of _x_. The argument is expressed in radians.
      
      - If _x_is NaN, the result is NaN.
      - If _x_is +0, the result is +0.
      - If _x_is -0, the result is -0.
      - If _x_is +&#8734;or -&#8734;, the result is NaN.


    **Parameters:**
    - x - the Number to operate on.

    **Returns:**
    - an approximation to the tangent of _x_.


---

### tanh(Number)
- static tanh(x: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Returns an approximation to the hyperbolic tangent of _x_.
      
      - If _x_is NaN, the result is NaN.
      - If _x_is +0, the result is +0.
      - If _x_is -0, the result is -0.
      - If _x_is +&#8734;, the result is +1.
      - If _x_is -&#8734;, the result is -1.


    **Parameters:**
    - x - the Number to operate on.

    **Returns:**
    - an approximation to the hyperbolic tangent of _x_.

    **API Version:**
:::note
Available from version 21.2.
:::

---

### trunc(Number)
- static trunc(x: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Returns the integral part of the number _x_, removing any fractional digits. If _x_ is already an integer, the result is _x_.
      
      - If _x_is NaN, the result is NaN.
      - If _x_is -0, the result is -0.
      - If _x_is +0, the result is +0.
      - If _x_is -&#8734;, the result is -&#8734;.
      - If _x_is +&#8734;, the result is +&#8734;.
      - If _x_is greater than 0 but less than 1, the result is +0.
      - If _x_is less than 0 but greater than -1, the result is -0.


    **Parameters:**
    - x - the Number to operate on.

    **Returns:**
    - the integral part of the number of _x_.

    **API Version:**
:::note
Available from version 21.2.
:::

---

<!-- prettier-ignore-end -->
