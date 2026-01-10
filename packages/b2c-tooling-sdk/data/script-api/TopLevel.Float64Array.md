<!-- prettier-ignore-start -->
# Class Float64Array

- [TopLevel.Object](TopLevel.Object.md)
  - [TopLevel.Float64Array](TopLevel.Float64Array.md)

An optimized array to store 64-bit floating point numbers. Elements of this array are stored in an
[ArrayBuffer](TopLevel.ArrayBuffer.md) object.


**API Version:**
:::note
Available from version 21.2.
:::

## Constant Summary

| Constant | Description |
| --- | --- |
| [BYTES_PER_ELEMENT](#bytes_per_element): [Number](TopLevel.Number.md) = 8 | Number value of the element size. |

## Property Summary

| Property | Description |
| --- | --- |
| [buffer](#buffer): [ArrayBuffer](TopLevel.ArrayBuffer.md) | The array buffer referenced by this typed array. |
| [byteLength](#bytelength): [Number](TopLevel.Number.md) | The number of bytes in the array buffer used by this typed array. |
| [byteOffset](#byteoffset): [Number](TopLevel.Number.md) | The start offset for this typed array within the array buffer. |
| [length](#length): [Number](TopLevel.Number.md) | The number of elements. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [Float64Array](#float64array)() | Creates an empty array. |
| [Float64Array](#float64arraynumber)([Number](TopLevel.Number.md)) | Creates an array with the given element count. |
| [Float64Array](#float64arrayobject)([Object](TopLevel.Object.md)) | Creates an array as a copy of the passed typed array. |
| [Float64Array](#float64arrayarray)([Array](TopLevel.Array.md)) | Creates an array as a copy of the passed array. |
| [Float64Array](#float64arrayarraybuffer-number-number)([ArrayBuffer](TopLevel.ArrayBuffer.md), [Number](TopLevel.Number.md), [Number](TopLevel.Number.md)) | Creates a typed array as a view on the given [ArrayBuffer](TopLevel.ArrayBuffer.md). |

## Method Summary

| Method | Description |
| --- | --- |
| [get](TopLevel.Float64Array.md#getnumber)([Number](TopLevel.Number.md)) | Returns the value at the specified index. |
| [set](TopLevel.Float64Array.md#setobject-number)([Object](TopLevel.Object.md), [Number](TopLevel.Number.md)) | Copies all values from the source array into this typed array. |
| [subarray](TopLevel.Float64Array.md#subarraynumber-number)([Number](TopLevel.Number.md), [Number](TopLevel.Number.md)) | Returns a new array object based on the same [ArrayBuffer](TopLevel.ArrayBuffer.md) store. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### BYTES_PER_ELEMENT

- BYTES_PER_ELEMENT: [Number](TopLevel.Number.md) = 8
  - : Number value of the element size.


---

## Property Details

### buffer
- buffer: [ArrayBuffer](TopLevel.ArrayBuffer.md)
  - : The array buffer referenced by this typed array.


---

### byteLength
- byteLength: [Number](TopLevel.Number.md)
  - : The number of bytes in the array buffer used by this typed array.


---

### byteOffset
- byteOffset: [Number](TopLevel.Number.md)
  - : The start offset for this typed array within the array buffer.


---

### length
- length: [Number](TopLevel.Number.md)
  - : The number of elements.


---

## Constructor Details

### Float64Array()
- Float64Array()
  - : Creates an empty array.


---

### Float64Array(Number)
- Float64Array(length: [Number](TopLevel.Number.md))
  - : Creates an array with the given element count.

    **Parameters:**
    - length - The number of elements.


---

### Float64Array(Object)
- Float64Array(typedArray: [Object](TopLevel.Object.md))
  - : Creates an array as a copy of the passed typed array.

    **Parameters:**
    - typedArray - The source typed array.


---

### Float64Array(Array)
- Float64Array(array: [Array](TopLevel.Array.md))
  - : Creates an array as a copy of the passed array.

    **Parameters:**
    - array - The source array.


---

### Float64Array(ArrayBuffer, Number, Number)
- Float64Array(buffer: [ArrayBuffer](TopLevel.ArrayBuffer.md), byteOffset: [Number](TopLevel.Number.md), length: [Number](TopLevel.Number.md))
  - : Creates a typed array as a view on the given [ArrayBuffer](TopLevel.ArrayBuffer.md).

    **Parameters:**
    - buffer - The array buffer storage object.
    - byteOffset - Optional. The offset within the array buffer in bytes.
    - length - Optional. The number of elements for the target typed array. The passed array buffer must be large enough to store the number of elements specified.


---

## Method Details

### get(Number)
- get(index: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Returns the value at the specified index. 
      
      Note: This is not ECMAScript standard. Use array element access syntax for single value access.


    **Parameters:**
    - index - The index to use.

    **Returns:**
    - The value at the specified index.


---

### set(Object, Number)
- set(values: [Object](TopLevel.Object.md), offset: [Number](TopLevel.Number.md)): void
  - : Copies all values from the source array into this typed array.

    **Parameters:**
    - values - The source values. Can be an array or a typed array.
    - offset - Optional. Target offset.


---

### subarray(Number, Number)
- subarray(begin: [Number](TopLevel.Number.md), end: [Number](TopLevel.Number.md)): [Float64Array](TopLevel.Float64Array.md)
  - : Returns a new array object based on the same [ArrayBuffer](TopLevel.ArrayBuffer.md) store.

    **Parameters:**
    - begin - Optional. The first included element.
    - end - Optional. The index of the end. This element is not included.

    **Returns:**
    - The new array object.


---

<!-- prettier-ignore-end -->
