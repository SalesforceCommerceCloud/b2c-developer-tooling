<!-- prettier-ignore-start -->
# Class ArrayBuffer

- [TopLevel.Object](TopLevel.Object.md)
  - [TopLevel.ArrayBuffer](TopLevel.ArrayBuffer.md)

The ArrayBuffer represents a generic array of bytes with fixed length. 

To access and manipulate content, use [DataView](TopLevel.DataView.md) or a typed array.


**API Version:**
:::note
Available from version 21.2.
:::

## Property Summary

| Property | Description |
| --- | --- |
| [byteLength](#bytelength): [Number](TopLevel.Number.md) | The number of bytes in the array buffer. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [ArrayBuffer](#arraybuffer)() | Creates an empty array buffer. |
| [ArrayBuffer](#arraybuffernumber)([Number](TopLevel.Number.md)) | Creates an array buffer with the given number of bytes. |

## Method Summary

| Method | Description |
| --- | --- |
| static [isView](TopLevel.ArrayBuffer.md#isviewobject)([Object](TopLevel.Object.md)) | Returns if the given object is one of the views for an ArrayBuffer, such as a typed array or a [DataView](TopLevel.DataView.md). |
| [slice](TopLevel.ArrayBuffer.md#slicenumber-number)([Number](TopLevel.Number.md), [Number](TopLevel.Number.md)) | Returns a new array buffer with a copy of the data of this buffer. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### byteLength
- byteLength: [Number](TopLevel.Number.md)
  - : The number of bytes in the array buffer.


---

## Constructor Details

### ArrayBuffer()
- ArrayBuffer()
  - : Creates an empty array buffer.


---

### ArrayBuffer(Number)
- ArrayBuffer(byteLength: [Number](TopLevel.Number.md))
  - : Creates an array buffer with the given number of bytes.

    **Parameters:**
    - byteLength - The number of bytes.


---

## Method Details

### isView(Object)
- static isView(object: [Object](TopLevel.Object.md)): [Boolean](TopLevel.Boolean.md)
  - : Returns if the given object is one of the views for an ArrayBuffer, such as a typed array or a [DataView](TopLevel.DataView.md).

    **Parameters:**
    - object - The object to check.

    **Returns:**
    - `true` if the passed object is a view to an array buffer else return false.


---

### slice(Number, Number)
- slice(begin: [Number](TopLevel.Number.md), end: [Number](TopLevel.Number.md)): [ArrayBuffer](TopLevel.ArrayBuffer.md)
  - : Returns a new array buffer with a copy of the data of this buffer.

    **Parameters:**
    - begin - Optional. The first included element.
    - end - Optional. The index of the end. This element is not included.

    **Returns:**
    - The new array object.


---

<!-- prettier-ignore-end -->
