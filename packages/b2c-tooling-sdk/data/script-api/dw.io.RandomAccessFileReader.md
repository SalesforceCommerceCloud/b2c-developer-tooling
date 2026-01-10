<!-- prettier-ignore-start -->
# Class RandomAccessFileReader

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.io.RandomAccessFileReader](dw.io.RandomAccessFileReader.md)

Instances of this class support reading from a random access file. A random
access file behaves like a large array of bytes stored in the file system.
There is a kind of cursor, or index into the implied array, called the file
pointer. Read operations read bytes starting at the file pointer and advance
the file pointer past the bytes read. The file pointer can be read by the
getPosition method and set by the setPosition method.



## Constant Summary

| Constant | Description |
| --- | --- |
| [MAX_READ_BYTES](#max_read_bytes): [Number](TopLevel.Number.md) = 10240 | The maximum number of bytes that a single call to [readBytes(Number)](dw.io.RandomAccessFileReader.md#readbytesnumber) can return == 10KB |

## Property Summary

| Property | Description |
| --- | --- |
| [position](#position): [Number](TopLevel.Number.md) | Returns the current offset in this file. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [RandomAccessFileReader](#randomaccessfilereaderfile)([File](dw.io.File.md)) | Construct a reader for random read access to the provided file. |

## Method Summary

| Method | Description |
| --- | --- |
| [close](dw.io.RandomAccessFileReader.md#close)() | Closes this random access file reader and releases any system resources  associated with the stream. |
| [getPosition](dw.io.RandomAccessFileReader.md#getposition)() | Returns the current offset in this file. |
| [length](dw.io.RandomAccessFileReader.md#length)() | Returns the length of this file. |
| [readByte](dw.io.RandomAccessFileReader.md#readbyte)() | Reads a signed eight-bit value from the file starting from the current  file pointer. |
| [readBytes](dw.io.RandomAccessFileReader.md#readbytesnumber)([Number](TopLevel.Number.md)) | Reads up to n bytes from the file starting at the current file pointer. |
| [setPosition](dw.io.RandomAccessFileReader.md#setpositionnumber)([Number](TopLevel.Number.md)) | Sets the file-pointer offset, measured from the beginning of this file,  at which the next read occurs. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### MAX_READ_BYTES

- MAX_READ_BYTES: [Number](TopLevel.Number.md) = 10240
  - : The maximum number of bytes that a single call to [readBytes(Number)](dw.io.RandomAccessFileReader.md#readbytesnumber) can return == 10KB


---

## Property Details

### position
- position: [Number](TopLevel.Number.md)
  - : Returns the current offset in this file.


---

## Constructor Details

### RandomAccessFileReader(File)
- RandomAccessFileReader(file: [File](dw.io.File.md))
  - : Construct a reader for random read access to the provided file.
      
      
      To release system resources, close the reader by calling [close()](dw.io.RandomAccessFileReader.md#close).


    **Parameters:**
    - file - The file to be read. Must not be null.

    **Throws:**
    - IOException - If the given file object does not denote an existing              regular file


---

## Method Details

### close()
- close(): void
  - : Closes this random access file reader and releases any system resources
      associated with the stream.


    **Throws:**
    - IOException - if an I/O error occurs.


---

### getPosition()
- getPosition(): [Number](TopLevel.Number.md)
  - : Returns the current offset in this file.

    **Returns:**
    - the offset from the beginning of the file, in bytes, at which the
              next read occurs.


    **Throws:**
    - IOException - if an I/O error occurs.


---

### length()
- length(): [Number](TopLevel.Number.md)
  - : Returns the length of this file.

    **Returns:**
    - the length of this file, measured in bytes.

    **Throws:**
    - IOException - if an I/O error occurs.


---

### readByte()
- readByte(): [Number](TopLevel.Number.md)
  - : Reads a signed eight-bit value from the file starting from the current
      file pointer. Since the byte is interpreted as signed, the value returned
      will always be between -128 and +127.


    **Returns:**
    - the next byte of this file as a signed eight-bit byte.

    **Throws:**
    - IOException - if an I/O error occurs or if this file has reached              the end.


---

### readBytes(Number)
- readBytes(numBytes: [Number](TopLevel.Number.md)): [Bytes](dw.util.Bytes.md)
  - : Reads up to n bytes from the file starting at the current file pointer.
      If there are fewer than n bytes remaining in the file, then as many bytes
      as possible are read. If no bytes remain in the file, then null is
      returned.


    **Parameters:**
    - numBytes - The number of bytes to read. Must be non-negative and             smaller than [MAX_READ_BYTES](dw.io.RandomAccessFileReader.md#max_read_bytes) or an exception             will be thrown.

    **Returns:**
    - A Bytes object representing the read bytes or null if no bytes
              were read.


    **Throws:**
    - IOException - if an I/O error occurs.
    - IllegalArgumentException - if numBytes< 0 or numBytes > MAX\_READ\_BYTES.


---

### setPosition(Number)
- setPosition(position: [Number](TopLevel.Number.md)): void
  - : Sets the file-pointer offset, measured from the beginning of this file,
      at which the next read occurs. The offset may be set beyond the end of
      the file.


    **Parameters:**
    - position - the offset position, measured in bytes from the beginning             of the file, at which to set the file pointer

    **Throws:**
    - IOException - if position is less than 0 or if an I/O error occurs.


---

<!-- prettier-ignore-end -->
