<!-- prettier-ignore-start -->
# Class BigInteger

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.util.BigInteger](dw.util.BigInteger.md)

The BigInteger class is a helper class to represent an arbitrary long integer number.
The Demandware framework doesn't use this class, but in some special cases
web services that declare an XML element with "xsd:integer", which is by definition
an arbitrary long integer number, require the use of this class.


The class is designed in a way that it can be used very similar to a
desktop calculator. For example:


```
var i = new BigInteger( 10 );
var result = d.add( 2 ).sub( 3 ).get();
```


The above code will return 9 as result.


**Deprecated:**
:::warning
Replaced by [BigInt](TopLevel.BigInt.md).
:::
**API Version:**
:::note
No longer available as of version 22.7.
:::

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [BigInteger](#biginteger)() | Constructs a new BigInteger with the value 0. |
| [BigInteger](#bigintegernumber)([Number](TopLevel.Number.md)) | Constructs a new BigInteger using the specified Number value. |
| [BigInteger](#bigintegerstring)([String](TopLevel.String.md)) | Constructs a new BigInteger using the specified string representation of  a number. |

## Method Summary

| Method | Description |
| --- | --- |
| [abs](dw.util.BigInteger.md#abs)() | Returns a new BigInteger with the absolute value of this BigInteger. |
| [add](dw.util.BigInteger.md#addbiginteger)([BigInteger](dw.util.BigInteger.md)) | Adds an BigInteger value to this BigInteger and returns the new BigInteger. |
| [add](dw.util.BigInteger.md#addnumber)([Number](TopLevel.Number.md)) | Adds a Number value to this BigInteger and returns the new BigInteger. |
| [divide](dw.util.BigInteger.md#dividebiginteger)([BigInteger](dw.util.BigInteger.md)) | Divides this BigInteger by the specified BigInteger and returns the new BigInteger. |
| [divide](dw.util.BigInteger.md#dividenumber)([Number](TopLevel.Number.md)) | Divides this BigInteger by the specified BigInteger and returns the new BigInteger. |
| [equals](dw.util.BigInteger.md#equalsobject)([Object](TopLevel.Object.md)) | Compares two BigInteger values whether they are equivalent. |
| [get](dw.util.BigInteger.md#get)() | Returns the value of the BigInteger as a Number. |
| [hashCode](dw.util.BigInteger.md#hashcode)() | Calculates the hash code for this BigInteger; |
| [multiply](dw.util.BigInteger.md#multiplybiginteger)([BigInteger](dw.util.BigInteger.md)) | Multiples the specified BigInteger value with this BigInteger and returns the new BigInteger. |
| [multiply](dw.util.BigInteger.md#multiplynumber)([Number](TopLevel.Number.md)) | Multiples the specified Number value with this BigInteger and returns the new BigInteger. |
| [negate](dw.util.BigInteger.md#negate)() | Returns a new BigInteger with the negated value of this BigInteger. |
| [subtract](dw.util.BigInteger.md#subtractbiginteger)([BigInteger](dw.util.BigInteger.md)) | Subtracts the specified BigInteger value from this BigInteger and returns the new BigInteger. |
| [subtract](dw.util.BigInteger.md#subtractnumber)([Number](TopLevel.Number.md)) | Subtracts the specified Number value from this BigInteger and returns the new BigInteger. |
| [toString](dw.util.BigInteger.md#tostring)() | Returns a string representation of this object. |
| [valueOf](dw.util.BigInteger.md#valueof)() | The valueOf() method is called by the ECMAScript interpret to return  the "natural" value of an object. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constructor Details

### BigInteger()
- BigInteger()
  - : Constructs a new BigInteger with the value 0.


---

### BigInteger(Number)
- BigInteger(value: [Number](TopLevel.Number.md))
  - : Constructs a new BigInteger using the specified Number value.

    **Parameters:**
    - value - the value to use.


---

### BigInteger(String)
- BigInteger(value: [String](TopLevel.String.md))
  - : Constructs a new BigInteger using the specified string representation of
      a number.


    **Parameters:**
    - value - the value to use.


---

## Method Details

### abs()
- abs(): [BigInteger](dw.util.BigInteger.md)
  - : Returns a new BigInteger with the absolute value of this BigInteger.

    **Returns:**
    - the new BigInteger


---

### add(BigInteger)
- add(value: [BigInteger](dw.util.BigInteger.md)): [BigInteger](dw.util.BigInteger.md)
  - : Adds an BigInteger value to this BigInteger and returns the new BigInteger.

    **Parameters:**
    - value - the value to add to this BigInteger.

    **Returns:**
    - the new BigInteger with the value added.


---

### add(Number)
- add(value: [Number](TopLevel.Number.md)): [BigInteger](dw.util.BigInteger.md)
  - : Adds a Number value to this BigInteger and returns the new BigInteger.

    **Parameters:**
    - value - the value to add to this BigInteger.

    **Returns:**
    - the new BigInteger with the value added.


---

### divide(BigInteger)
- divide(value: [BigInteger](dw.util.BigInteger.md)): [BigInteger](dw.util.BigInteger.md)
  - : Divides this BigInteger by the specified BigInteger and returns the new BigInteger.

    **Parameters:**
    - value - the value to use to divide this BigInteger.

    **Returns:**
    - the new BigInteger.


---

### divide(Number)
- divide(value: [Number](TopLevel.Number.md)): [BigInteger](dw.util.BigInteger.md)
  - : Divides this BigInteger by the specified BigInteger and returns the new BigInteger.

    **Parameters:**
    - value - the value to use to divide this BigInteger.

    **Returns:**
    - the new BigInteger.


---

### equals(Object)
- equals(other: [Object](TopLevel.Object.md)): [Boolean](TopLevel.Boolean.md)
  - : Compares two BigInteger values whether they are equivalent.

    **Parameters:**
    - other - the object to compare against this BigInteger.


---

### get()
- get(): [Number](TopLevel.Number.md)
  - : Returns the value of the BigInteger as a Number.

    **Returns:**
    - the value of the BigInteger.


---

### hashCode()
- hashCode(): [Number](TopLevel.Number.md)
  - : Calculates the hash code for this BigInteger;


---

### multiply(BigInteger)
- multiply(value: [BigInteger](dw.util.BigInteger.md)): [BigInteger](dw.util.BigInteger.md)
  - : Multiples the specified BigInteger value with this BigInteger and returns the new BigInteger.

    **Parameters:**
    - value - the value to multiply with this BigInteger.

    **Returns:**
    - the new BigInteger.


---

### multiply(Number)
- multiply(value: [Number](TopLevel.Number.md)): [BigInteger](dw.util.BigInteger.md)
  - : Multiples the specified Number value with this BigInteger and returns the new BigInteger.

    **Parameters:**
    - value - the value to multiply with this BigInteger.

    **Returns:**
    - the new BigInteger.


---

### negate()
- negate(): [BigInteger](dw.util.BigInteger.md)
  - : Returns a new BigInteger with the negated value of this BigInteger.

    **Returns:**
    - the new BigInteger


---

### subtract(BigInteger)
- subtract(value: [BigInteger](dw.util.BigInteger.md)): [BigInteger](dw.util.BigInteger.md)
  - : Subtracts the specified BigInteger value from this BigInteger and returns the new BigInteger.

    **Parameters:**
    - value - the value to add to this BigInteger.

    **Returns:**
    - the new BigInteger with the value subtracted.


---

### subtract(Number)
- subtract(value: [Number](TopLevel.Number.md)): [BigInteger](dw.util.BigInteger.md)
  - : Subtracts the specified Number value from this BigInteger and returns the new BigInteger.

    **Parameters:**
    - value - the value to add to this BigInteger.

    **Returns:**
    - the new BigInteger with the value subtracted.


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
      the "natural" value of an object. The BigInteger object returns its
      current value as number. With this behavior script snippets can
      be written like:
      
      
      ```
      var i = new BigInteger( 10 );
      var x = 1 + d.add( 2 );
      ```
      
      
      where x will be at the end 13.


    **Returns:**
    - the value of this object.


---

<!-- prettier-ignore-end -->
