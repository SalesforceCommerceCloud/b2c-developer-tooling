<!-- prettier-ignore-start -->
# Class FileWriter

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.io.Writer](dw.io.Writer.md)
    - [dw.io.FileWriter](dw.io.FileWriter.md)

Convenience class for writing character files.


Files are stored in a shared file system where multiple processes could
access the same file. The client code is responsible for ensuring that no
more than one process writes to a file at a given time.


**Note:** when this class is used with sensitive data, be careful in persisting sensitive information to disk.



## Property Summary

| Property | Description |
| --- | --- |
| [lineSeparator](#lineseparator): [String](TopLevel.String.md) | Get the current line separator (e.g. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [FileWriter](#filewriterfile)([File](dw.io.File.md)) | Constructs the writer for the specified file. |
| [FileWriter](#filewriterfile-boolean)([File](dw.io.File.md), [Boolean](TopLevel.Boolean.md)) | Constructs the writer for the specified file. |
| [FileWriter](#filewriterfile-string)([File](dw.io.File.md), [String](TopLevel.String.md)) | Constructs the writer for the specified file with the specified encoding. |
| [FileWriter](#filewriterfile-string-boolean)([File](dw.io.File.md), [String](TopLevel.String.md), [Boolean](TopLevel.Boolean.md)) | Constructs the writer for the specified file with the specified encoding. |

## Method Summary

| Method | Description |
| --- | --- |
| [close](dw.io.FileWriter.md#close)() | Closes the writer. |
| [getLineSeparator](dw.io.FileWriter.md#getlineseparator)() | Get the current line separator (e.g. |
| [setLineSeparator](dw.io.FileWriter.md#setlineseparatorstring)([String](TopLevel.String.md)) | Set the line separator (e.g. |
| [writeLine](dw.io.FileWriter.md#writelinestring)([String](TopLevel.String.md)) | Writes the specified line and appends the line separator. |

### Methods inherited from class Writer

[close](dw.io.Writer.md#close), [flush](dw.io.Writer.md#flush), [write](dw.io.Writer.md#writestring), [write](dw.io.Writer.md#writestring-number-number)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### lineSeparator
- lineSeparator: [String](TopLevel.String.md)
  - : Get the current line separator (e.g. '\n' or '\r\n'), if no value is set the system default '\n' will be used.


---

## Constructor Details

### FileWriter(File)
- FileWriter(file: [File](dw.io.File.md))
  - : Constructs the writer for the specified file. Uses "UTF-8" as encoding.
      
      
      To release system resources, close the writer by calling [close()](dw.io.FileWriter.md#close).


    **Parameters:**
    - file - the file object to write to.


---

### FileWriter(File, Boolean)
- FileWriter(file: [File](dw.io.File.md), append: [Boolean](TopLevel.Boolean.md))
  - : Constructs the writer for the specified file. Optional file append mode
      is supported. Uses "UTF-8" as encoding.
      
      
      To release system resources, close the writer by calling [close()](dw.io.FileWriter.md#close).


    **Parameters:**
    - file - the file object to write to.
    - append - flag, whether the file should be written in append mode


---

### FileWriter(File, String)
- FileWriter(file: [File](dw.io.File.md), encoding: [String](TopLevel.String.md))
  - : Constructs the writer for the specified file with the specified encoding.
      
      
      To release system resources, close the writer by calling [close()](dw.io.FileWriter.md#close).


    **Parameters:**
    - file - the file object to write to.
    - encoding - the character encoding to use.


---

### FileWriter(File, String, Boolean)
- FileWriter(file: [File](dw.io.File.md), encoding: [String](TopLevel.String.md), append: [Boolean](TopLevel.Boolean.md))
  - : Constructs the writer for the specified file with the specified encoding.
      Optional file append mode is supported.
      
      
      To release system resources, close the writer by calling [close()](dw.io.FileWriter.md#close).


    **Parameters:**
    - file - the file object to write to.
    - encoding - the character encoding to use.
    - append - flag indicating whether the file should be written in append mode.


---

## Method Details

### close()
- close(): void
  - : Closes the writer.


---

### getLineSeparator()
- getLineSeparator(): [String](TopLevel.String.md)
  - : Get the current line separator (e.g. '\n' or '\r\n'), if no value is set the system default '\n' will be used.


---

### setLineSeparator(String)
- setLineSeparator(lineSeparator: [String](TopLevel.String.md)): void
  - : Set the line separator (e.g. '\n' or '\r\n'), if no value is set the system default '\n' will be used.

    **Parameters:**
    - lineSeparator - that will be written at the end of each line


---

### writeLine(String)
- writeLine(str: [String](TopLevel.String.md)): void
  - : Writes the specified line and appends the line separator.

    **Parameters:**
    - str - the line to write to the file.


---

<!-- prettier-ignore-end -->
