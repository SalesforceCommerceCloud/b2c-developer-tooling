<!-- prettier-ignore-start -->
# Class DataView

- [TopLevel.Object](TopLevel.Object.md)
  - [TopLevel.DataView](TopLevel.DataView.md)

The DataView provides low level access to [ArrayBuffer](TopLevel.ArrayBuffer.md).

**API Version:**
:::note
Available from version 21.2.
:::

## Property Summary

| Property | Description |
| --- | --- |
| [buffer](#buffer): [ArrayBuffer](TopLevel.ArrayBuffer.md) | The array buffer referenced by this view. |
| [byteLength](#bytelength): [Number](TopLevel.Number.md) | The number of bytes in the array buffer used by this view. |
| [byteOffset](#byteoffset): [Number](TopLevel.Number.md) | The start offset for this view within the array buffer. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [DataView](#dataviewarraybuffer-number-number)([ArrayBuffer](TopLevel.ArrayBuffer.md), [Number](TopLevel.Number.md), [Number](TopLevel.Number.md)) | Creates a data view on the given [ArrayBuffer](TopLevel.ArrayBuffer.md). |

## Method Summary

| Method | Description |
| --- | --- |
| [getFloat32](TopLevel.DataView.md#getfloat32number-boolean)([Number](TopLevel.Number.md), [Boolean](TopLevel.Boolean.md)) | Returns the 32-bit floating point number at the given offset. |
| [getFloat64](TopLevel.DataView.md#getfloat64number-boolean)([Number](TopLevel.Number.md), [Boolean](TopLevel.Boolean.md)) | Returns the 64-bit floating point number at the given offset. |
| [getInt16](TopLevel.DataView.md#getint16number-boolean)([Number](TopLevel.Number.md), [Boolean](TopLevel.Boolean.md)) | Returns the 16-bit signed integer number at the given offset. |
| [getInt32](TopLevel.DataView.md#getint32number-boolean)([Number](TopLevel.Number.md), [Boolean](TopLevel.Boolean.md)) | Returns the 32-bit signed integer number at the given offset. |
| [getInt8](TopLevel.DataView.md#getint8number)([Number](TopLevel.Number.md)) | Returns the 8-bit signed integer number at the given offset. |
| [getUint16](TopLevel.DataView.md#getuint16number-boolean)([Number](TopLevel.Number.md), [Boolean](TopLevel.Boolean.md)) | Returns the 16-bit unsigned integer number at the given offset. |
| [getUint32](TopLevel.DataView.md#getuint32number-boolean)([Number](TopLevel.Number.md), [Boolean](TopLevel.Boolean.md)) | Returns the 32-bit unsigned integer number at the given offset. |
| [getUint8](TopLevel.DataView.md#getuint8number)([Number](TopLevel.Number.md)) | Returns the 8-bit unsigned integer number at the given offset. |
| [setFloat32](TopLevel.DataView.md#setfloat32number-number-boolean)([Number](TopLevel.Number.md), [Number](TopLevel.Number.md), [Boolean](TopLevel.Boolean.md)) | Writes a 32-bit floating point number into the byte array at the given offset. |
| [setFloat64](TopLevel.DataView.md#setfloat64number-number-boolean)([Number](TopLevel.Number.md), [Number](TopLevel.Number.md), [Boolean](TopLevel.Boolean.md)) | Writes a 64-bit floating point number into the byte array at the given offset. |
| [setInt16](TopLevel.DataView.md#setint16number-number-boolean)([Number](TopLevel.Number.md), [Number](TopLevel.Number.md), [Boolean](TopLevel.Boolean.md)) | Writes a 16-bit signed integer number into the byte array at the given offset. |
| [setInt32](TopLevel.DataView.md#setint32number-number-boolean)([Number](TopLevel.Number.md), [Number](TopLevel.Number.md), [Boolean](TopLevel.Boolean.md)) | Writes a 32-bit signed integer number into the byte array at the given offset. |
| [setInt8](TopLevel.DataView.md#setint8number-number)([Number](TopLevel.Number.md), [Number](TopLevel.Number.md)) | Writes an 8-bit signed integer number into the byte array at the given offset. |
| [setUint16](TopLevel.DataView.md#setuint16number-number-boolean)([Number](TopLevel.Number.md), [Number](TopLevel.Number.md), [Boolean](TopLevel.Boolean.md)) | Writes a 16-bit unsigned integer number into the byte array at the given offset. |
| [setUint32](TopLevel.DataView.md#setuint32number-number-boolean)([Number](TopLevel.Number.md), [Number](TopLevel.Number.md), [Boolean](TopLevel.Boolean.md)) | Writes a 32-bit unsigned integer number into the byte array at the given offset. |
| [setUint8](TopLevel.DataView.md#setuint8number-number)([Number](TopLevel.Number.md), [Number](TopLevel.Number.md)) | Writes an 8-bit unsigned integer number into the byte array at the given offset. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### buffer
- buffer: [ArrayBuffer](TopLevel.ArrayBuffer.md)
  - : The array buffer referenced by this view.


---

### byteLength
- byteLength: [Number](TopLevel.Number.md)
  - : The number of bytes in the array buffer used by this view.


---

### byteOffset
- byteOffset: [Number](TopLevel.Number.md)
  - : The start offset for this view within the array buffer.


---

## Constructor Details

### DataView(ArrayBuffer, Number, Number)
- DataView(buffer: [ArrayBuffer](TopLevel.ArrayBuffer.md), byteOffset: [Number](TopLevel.Number.md), byteLength: [Number](TopLevel.Number.md))
  - : Creates a data view on the given [ArrayBuffer](TopLevel.ArrayBuffer.md).

    **Parameters:**
    - buffer - The array buffer storage object.
    - byteOffset - Optional. The offset within the array buffer in bytes.
    - byteLength - Optional. The number of bytes visible to this view.


---

## Method Details

### getFloat32(Number, Boolean)
- getFloat32(byteOffset: [Number](TopLevel.Number.md), littleEndian: [Boolean](TopLevel.Boolean.md)): [Number](TopLevel.Number.md)
  - : Returns the 32-bit floating point number at the given offset.

    **Parameters:**
    - byteOffset - The offset within the view.
    - littleEndian - Optional. Default is false. Use true if the number is stored in little-endian format.


---

### getFloat64(Number, Boolean)
- getFloat64(byteOffset: [Number](TopLevel.Number.md), littleEndian: [Boolean](TopLevel.Boolean.md)): [Number](TopLevel.Number.md)
  - : Returns the 64-bit floating point number at the given offset.

    **Parameters:**
    - byteOffset - The offset within the view.
    - littleEndian - Optional. Default is false. Use true if the number is stored in little-endian format.


---

### getInt16(Number, Boolean)
- getInt16(byteOffset: [Number](TopLevel.Number.md), littleEndian: [Boolean](TopLevel.Boolean.md)): [Number](TopLevel.Number.md)
  - : Returns the 16-bit signed integer number at the given offset.

    **Parameters:**
    - byteOffset - The offset within the view.
    - littleEndian - Optional. Default is false. Use true if the number is stored in little-endian format.


---

### getInt32(Number, Boolean)
- getInt32(byteOffset: [Number](TopLevel.Number.md), littleEndian: [Boolean](TopLevel.Boolean.md)): [Number](TopLevel.Number.md)
  - : Returns the 32-bit signed integer number at the given offset.

    **Parameters:**
    - byteOffset - The offset within the view.
    - littleEndian - Optional. Default is false. Use true if the number is stored in little-endian format.


---

### getInt8(Number)
- getInt8(byteOffset: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Returns the 8-bit signed integer number at the given offset.

    **Parameters:**
    - byteOffset - The offset within the view.


---

### getUint16(Number, Boolean)
- getUint16(byteOffset: [Number](TopLevel.Number.md), littleEndian: [Boolean](TopLevel.Boolean.md)): [Number](TopLevel.Number.md)
  - : Returns the 16-bit unsigned integer number at the given offset.

    **Parameters:**
    - byteOffset - The offset within the view.
    - littleEndian - Optional. Default is false. Use true if the number is stored in little-endian format.


---

### getUint32(Number, Boolean)
- getUint32(byteOffset: [Number](TopLevel.Number.md), littleEndian: [Boolean](TopLevel.Boolean.md)): [Number](TopLevel.Number.md)
  - : Returns the 32-bit unsigned integer number at the given offset.

    **Parameters:**
    - byteOffset - The offset within the view.
    - littleEndian - Optional. Default is false. Use true if the number is stored in little-endian format.


---

### getUint8(Number)
- getUint8(byteOffset: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Returns the 8-bit unsigned integer number at the given offset.

    **Parameters:**
    - byteOffset - The offset within the view.


---

### setFloat32(Number, Number, Boolean)
- setFloat32(byteOffset: [Number](TopLevel.Number.md), value: [Number](TopLevel.Number.md), littleEndian: [Boolean](TopLevel.Boolean.md)): void
  - : Writes a 32-bit floating point number into the byte array at the given offset.

    **Parameters:**
    - byteOffset - The offset within the view.
    - value - The value to be written.
    - littleEndian - Optional. Default is false. Use true if the little-endian format is to be used.


---

### setFloat64(Number, Number, Boolean)
- setFloat64(byteOffset: [Number](TopLevel.Number.md), value: [Number](TopLevel.Number.md), littleEndian: [Boolean](TopLevel.Boolean.md)): void
  - : Writes a 64-bit floating point number into the byte array at the given offset.

    **Parameters:**
    - byteOffset - The offset within the view.
    - value - The value to be written.
    - littleEndian - Optional. Default is false. Use true if the little-endian format is to be used.


---

### setInt16(Number, Number, Boolean)
- setInt16(byteOffset: [Number](TopLevel.Number.md), value: [Number](TopLevel.Number.md), littleEndian: [Boolean](TopLevel.Boolean.md)): void
  - : Writes a 16-bit signed integer number into the byte array at the given offset.

    **Parameters:**
    - byteOffset - The offset within the view.
    - value - The value to be written.
    - littleEndian - Optional. Default is false. Use true if the little-endian format is to be used.


---

### setInt32(Number, Number, Boolean)
- setInt32(byteOffset: [Number](TopLevel.Number.md), value: [Number](TopLevel.Number.md), littleEndian: [Boolean](TopLevel.Boolean.md)): void
  - : Writes a 32-bit signed integer number into the byte array at the given offset.

    **Parameters:**
    - byteOffset - The offset within the view.
    - value - The value to be written.
    - littleEndian - Optional. Default is false. Use true if the little-endian format is to be used.


---

### setInt8(Number, Number)
- setInt8(byteOffset: [Number](TopLevel.Number.md), value: [Number](TopLevel.Number.md)): void
  - : Writes an 8-bit signed integer number into the byte array at the given offset.

    **Parameters:**
    - byteOffset - The offset within the view.
    - value - The value to be written.


---

### setUint16(Number, Number, Boolean)
- setUint16(byteOffset: [Number](TopLevel.Number.md), value: [Number](TopLevel.Number.md), littleEndian: [Boolean](TopLevel.Boolean.md)): void
  - : Writes a 16-bit unsigned integer number into the byte array at the given offset.

    **Parameters:**
    - byteOffset - The offset within the view.
    - value - The value to be written.
    - littleEndian - Optional. Default is false. Use true if the little-endian format is to be used.


---

### setUint32(Number, Number, Boolean)
- setUint32(byteOffset: [Number](TopLevel.Number.md), value: [Number](TopLevel.Number.md), littleEndian: [Boolean](TopLevel.Boolean.md)): void
  - : Writes a 32-bit unsigned integer number into the byte array at the given offset.

    **Parameters:**
    - byteOffset - The offset within the view.
    - value - The value to be written.
    - littleEndian - Optional. Default is false. Use true if the little-endian format is to be used.


---

### setUint8(Number, Number)
- setUint8(byteOffset: [Number](TopLevel.Number.md), value: [Number](TopLevel.Number.md)): void
  - : Writes an 8-bit unsigned integer number into the byte array at the given offset.

    **Parameters:**
    - byteOffset - The offset within the view.
    - value - The value to be written.


---

<!-- prettier-ignore-end -->
