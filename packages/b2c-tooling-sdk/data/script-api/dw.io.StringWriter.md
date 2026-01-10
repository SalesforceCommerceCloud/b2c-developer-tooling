<!-- prettier-ignore-start -->
# Class StringWriter

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.io.Writer](dw.io.Writer.md)
    - [dw.io.StringWriter](dw.io.StringWriter.md)

A Writer that can be used to generate a String.


In most cases it is not necessary to use StringWriter. If the final
destination of the output is a file, use [FileWriter](dw.io.FileWriter.md) directly.
This will help to reduce memory usage. If you wish to transfer a feed to a
remote FTP, SFTP or WebDAV server, first write the feed to the file system
using FileWriter and optionally [CSVStreamWriter](dw.io.CSVStreamWriter.md) or
[XMLStreamWriter](dw.io.XMLStreamWriter.md), then upload the file with
[FTPClient.putBinary(String, File)](dw.net.FTPClient.md#putbinarystring-file),
[SFTPClient.putBinary(String, File)](dw.net.SFTPClient.md#putbinarystring-file), or
[WebDAVClient.put(String, File)](dw.net.WebDAVClient.md#putstring-file).


**Note:** when this class is used with sensitive data, be careful in persisting sensitive information to disk.



## Constructor Summary

| Constructor | Description |
| --- | --- |
| [StringWriter](#stringwriter)() | Creates a new StringWriter. |

## Method Summary

| Method | Description |
| --- | --- |
| [toString](dw.io.StringWriter.md#tostring)() | Returns a string representation of this writer. |
| [write](dw.io.StringWriter.md#writestring)([String](TopLevel.String.md)) | Write the given string to the stream. |
| [write](dw.io.StringWriter.md#writestring-number-number)([String](TopLevel.String.md), [Number](TopLevel.Number.md), [Number](TopLevel.Number.md)) | Write the given string to the stream. |

### Methods inherited from class Writer

[close](dw.io.Writer.md#close), [flush](dw.io.Writer.md#flush), [write](dw.io.Writer.md#writestring), [write](dw.io.Writer.md#writestring-number-number)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constructor Details

### StringWriter()
- StringWriter()
  - : Creates a new StringWriter.


---

## Method Details

### toString()
- toString(): [String](TopLevel.String.md)
  - : Returns a string representation of this writer.

    **Returns:**
    - a string representation of this writer.


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
    - off - the offset from which to start writing characters to the             stream.
    - len - the number of characters to write from the stream.


---

<!-- prettier-ignore-end -->
