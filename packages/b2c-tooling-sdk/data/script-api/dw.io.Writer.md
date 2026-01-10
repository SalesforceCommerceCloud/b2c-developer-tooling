<!-- prettier-ignore-start -->
# Class Writer

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.io.Writer](dw.io.Writer.md)

The class supports writing characters to a stream.


**Note:** when this class is used with sensitive data, be careful in persisting sensitive information to disk.



## All Known Subclasses
[FileWriter](dw.io.FileWriter.md), [PrintWriter](dw.io.PrintWriter.md), [StringWriter](dw.io.StringWriter.md)
## Constructor Summary

| Constructor | Description |
| --- | --- |
| [Writer](#writeroutputstream)([OutputStream](dw.io.OutputStream.md)) | Create a writer from a stream using UTF-8 character encoding. |
| [Writer](#writeroutputstream-string)([OutputStream](dw.io.OutputStream.md), [String](TopLevel.String.md)) | Create a writer from a stream using the specified character encoding. |

## Method Summary

| Method | Description |
| --- | --- |
| [close](dw.io.Writer.md#close)() | Closes the writer. |
| [flush](dw.io.Writer.md#flush)() | Flushes the buffer. |
| [write](dw.io.Writer.md#writestring)([String](TopLevel.String.md)) | Write the given string to the stream. |
| [write](dw.io.Writer.md#writestring-number-number)([String](TopLevel.String.md), [Number](TopLevel.Number.md), [Number](TopLevel.Number.md)) | Write the given string to the stream. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constructor Details

### Writer(OutputStream)
- Writer(stream: [OutputStream](dw.io.OutputStream.md))
  - : Create a writer from a stream using UTF-8 character encoding.

    **Parameters:**
    - stream - the output stream to use when creating the writer.


---

### Writer(OutputStream, String)
- Writer(stream: [OutputStream](dw.io.OutputStream.md), encoding: [String](TopLevel.String.md))
  - : Create a writer from a stream using the specified character encoding.

    **Parameters:**
    - stream - the output stream to use when creating the writer.
    - encoding - the encoding to use when creating the writer.


---

## Method Details

### close()
- close(): void
  - : Closes the writer.


---

### flush()
- flush(): void
  - : Flushes the buffer.


---

### write(String)
- write(str: [String](TopLevel.String.md)): void
  - : Write the given string to the stream.

    **Parameters:**
    - str - the string to write to the stream.


---

### write(String, Number, Number)
- write(str: [String](TopLevel.String.md), off: [Number](TopLevel.Number.md), len: [Number](TopLevel.Number.md)): void
  - : Write the given string to the stream.

    **Parameters:**
    - str - the string to write to the stream.
    - off - the offset from which to start writing characters to the stream.
    - len - the number of characters to write from the stream.


---

<!-- prettier-ignore-end -->
