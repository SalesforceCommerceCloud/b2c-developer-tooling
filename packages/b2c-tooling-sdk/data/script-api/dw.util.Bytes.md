<!-- prettier-ignore-start -->
# Class Bytes

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.util.Bytes](dw.util.Bytes.md)

A simple immutable class representing an array of bytes, used for working
with binary data in a scripting context.


It acts as a view to [ArrayBuffer](TopLevel.ArrayBuffer.md). The buffer can be accessed through [asUint8Array()](dw.util.Bytes.md#asuint8array).

**Limitation:**
The size of the resulting byte representation is limited by the quota _api.jsArrayBufferSize_ that is defining the max size for a [ArrayBuffer](TopLevel.ArrayBuffer.md).



## Constant Summary

| Constant | Description |
| --- | --- |
| ~~[MAX_BYTES](#max_bytes): [Number](TopLevel.Number.md) = 10240~~ | The maximum number of bytes that a Bytes object can represent == 10KB |

## Property Summary

| Property | Description |
| --- | --- |
| [length](#length): [Number](TopLevel.Number.md) `(read-only)` | Returns the number of bytes represented by this object. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [Bytes](#bytesobject)([Object](TopLevel.Object.md)) | Construct a Bytes object from the given [ArrayBuffer](TopLevel.ArrayBuffer.md) or view. |
| [Bytes](#bytesstring)([String](TopLevel.String.md)) | Construct a Bytes object from the given string using the default  encoding. |
| [Bytes](#bytesstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Construct a Bytes object from the given string using the given encoding. |

## Method Summary

| Method | Description |
| --- | --- |
| [asUint8Array](dw.util.Bytes.md#asuint8array)() | Returns a [Uint8Array](TopLevel.Uint8Array.md) based on the [ArrayBuffer](TopLevel.ArrayBuffer.md) used for this Bytes object. |
| [byteAt](dw.util.Bytes.md#byteatnumber)([Number](TopLevel.Number.md)) | Returns the value of the byte at position index as an integer. |
| [bytesAt](dw.util.Bytes.md#bytesatnumber-number)([Number](TopLevel.Number.md), [Number](TopLevel.Number.md)) | Return a new Bytes object containing the subsequence of this object's bytes specified by the index and length  parameters. |
| [getLength](dw.util.Bytes.md#getlength)() | Returns the number of bytes represented by this object. |
| [intAt](dw.util.Bytes.md#intatnumber)([Number](TopLevel.Number.md)) | Absolute get method for reading a signed integer value (32 bit) in  network byte order(= big endian). |
| [reverse](dw.util.Bytes.md#reverse)() | Return a new Bytes object which has the same bytes as this one in reverse  order. |
| [shortAt](dw.util.Bytes.md#shortatnumber)([Number](TopLevel.Number.md)) | Absolute get method for reading a signed short value (16 bit) in network  byte order(= big endian). |
| [toString](dw.util.Bytes.md#tostring)() | Constructs a new String by decoding this array of bytes using the  default encoding. |
| [toString](dw.util.Bytes.md#tostringstring)([String](TopLevel.String.md)) | Constructs a new String by decoding this array of bytes using the  specified encoding. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### MAX_BYTES

- ~~MAX_BYTES: [Number](TopLevel.Number.md) = 10240~~
  - : The maximum number of bytes that a Bytes object can represent == 10KB

    **Deprecated:**
:::warning
No longer used by the Bytes class.
:::

---

## Property Details

### length
- length: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the number of bytes represented by this object.


---

## Constructor Details

### Bytes(Object)
- Bytes(arrayBufferOrView: [Object](TopLevel.Object.md))
  - : Construct a Bytes object from the given [ArrayBuffer](TopLevel.ArrayBuffer.md) or view. The bytes object also acts as a
      view on the underlying [ArrayBuffer](TopLevel.ArrayBuffer.md). If a view is given that makes only a part of the storage
      array visible then this Bytes object will also make only the same part visible. The storage data is not copied.


    **Parameters:**
    - arrayBufferOrView - An [ArrayBuffer](TopLevel.ArrayBuffer.md) or view to a buffer that is the storage.

    **API Version:**
:::note
Available from version 21.2.
:::

---

### Bytes(String)
- Bytes(string: [String](TopLevel.String.md))
  - : Construct a Bytes object from the given string using the default
      encoding. Convenience for Bytes( string, "UTF-8" ).


    **Parameters:**
    - string - The string to encode into a Bytes object, must not be null.

    **Throws:**
    - IllegalArgumentException - If the encoded byte sequence exceeds the              maximum number of bytes.


---

### Bytes(String, String)
- Bytes(string: [String](TopLevel.String.md), encoding: [String](TopLevel.String.md))
  - : Construct a Bytes object from the given string using the given encoding.
      This method always replaces malformed input and unmappable character
      sequences with encoding defaults.


    **Parameters:**
    - string - The string to encode into a Bytes object, must not be null.
    - encoding - The name of a supported encoding, or null in which case             the default encoding (UTF-8) is used.

    **Throws:**
    - IllegalArgumentException - If the named encoding is not supported              or if the encoded byte sequence exceeds the maximum number of              bytes.


---

## Method Details

### asUint8Array()
- asUint8Array(): [Object](TopLevel.Object.md)
  - : Returns a [Uint8Array](TopLevel.Uint8Array.md) based on the [ArrayBuffer](TopLevel.ArrayBuffer.md) used for this Bytes object.
      Changes to the returned [ArrayBuffer](TopLevel.ArrayBuffer.md) will be visible in the Bytes object.


    **Returns:**
    - A newly created [Uint8Array](TopLevel.Uint8Array.md) based on the existing [ArrayBuffer](TopLevel.ArrayBuffer.md).

    **API Version:**
:::note
Available from version 21.2.
:::

---

### byteAt(Number)
- byteAt(index: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Returns the value of the byte at position index as an integer. If index
      is out of range an exception is thrown. The byte is interpreted as signed
      and so the value returned will always be between -128 and +127.


    **Parameters:**
    - index - The index of the byte.

    **Returns:**
    - The byte value at the specified index.

    **Throws:**
    - IndexOutOfBoundsException - If the index argument is negative or              not less than the length of this byte array.


---

### bytesAt(Number, Number)
- bytesAt(index: [Number](TopLevel.Number.md), length: [Number](TopLevel.Number.md)): [Bytes](dw.util.Bytes.md)
  - : Return a new Bytes object containing the subsequence of this object's bytes specified by the index and length
      parameters. The returned object is a new view onto the same data, no data is copied.


    **Parameters:**
    - index - The initial index for the new view, inclusive.
    - length - The number of bytes visible in the new view.

    **Returns:**
    - a new Bytes object representing a subsequence of this Bytes object.

    **Throws:**
    - ArrayIndexOutOfBoundsException - If index < 0 or index > getLength() or index + length >              getLength()
    - IllegalArgumentException - If length < 0


---

### getLength()
- getLength(): [Number](TopLevel.Number.md)
  - : Returns the number of bytes represented by this object.

    **Returns:**
    - The number of bytes.


---

### intAt(Number)
- intAt(index: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Absolute get method for reading a signed integer value (32 bit) in
      network byte order(= big endian).


    **Parameters:**
    - index - The byte index at which to read the number.

    **Returns:**
    - The read number.

    **Throws:**
    - IndexOutOfBoundsException - If index is negative or not smaller              than the number of bytes minus three.


---

### reverse()
- reverse(): [Bytes](dw.util.Bytes.md)
  - : Return a new Bytes object which has the same bytes as this one in reverse
      order.


    **Returns:**
    - a new Bytes object representing the reverse of this Bytes object.


---

### shortAt(Number)
- shortAt(index: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Absolute get method for reading a signed short value (16 bit) in network
      byte order(= big endian).


    **Parameters:**
    - index - The byte index at which to read the number.

    **Returns:**
    - The read number.

    **Throws:**
    - IndexOutOfBoundsException - If index is negative or not smaller              than the number of bytes minus one.


---

### toString()
- toString(): [String](TopLevel.String.md)
  - : Constructs a new String by decoding this array of bytes using the
      default encoding. Convenience for toString( "UTF-8" ).
      **Limitation:**
      The method is protected by the quota _api.jsStringLength_ that prevents creation of too long strings.


    **Returns:**
    - A String representing the decoded array of bytes.


---

### toString(String)
- toString(encoding: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Constructs a new String by decoding this array of bytes using the
      specified encoding.
      **Limitation:**
      The method is protected by the quota _api.jsStringLength_ that prevents creation of too long strings.


    **Parameters:**
    - encoding - The name of a supported encoding.

    **Returns:**
    - A String representing the decoded array of bytes.

    **Throws:**
    - IllegalArgumentException - If the named encoding is not supported.


---

<!-- prettier-ignore-end -->
