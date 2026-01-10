<!-- prettier-ignore-start -->
# Class CSVStreamWriter

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.io.CSVStreamWriter](dw.io.CSVStreamWriter.md)

The class writes a CSV file.


**Note:** when this class is used with sensitive data, be careful in persisting sensitive information to disk.



## Constructor Summary

| Constructor | Description |
| --- | --- |
| [CSVStreamWriter](#csvstreamwriterwriter)([Writer](dw.io.Writer.md)) | Create a new CSVStreamWriter with a ',' as separator and '"'  as quote character. |
| [CSVStreamWriter](#csvstreamwriterwriter-string)([Writer](dw.io.Writer.md), [String](TopLevel.String.md)) | Create a new CSVStreamWriter with the specified separator and '"'  as quote character. |
| [CSVStreamWriter](#csvstreamwriterwriter-string-string)([Writer](dw.io.Writer.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Create a new CSVStreamWriter with the specified separator and the  specified quote character. |

## Method Summary

| Method | Description |
| --- | --- |
| [close](dw.io.CSVStreamWriter.md#close)() | Closes the underlying writer. |
| [writeNext](dw.io.CSVStreamWriter.md#writenextstring)([String...](TopLevel.String.md)) | Write a single line to the CSV file. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constructor Details

### CSVStreamWriter(Writer)
- CSVStreamWriter(writer: [Writer](dw.io.Writer.md))
  - : Create a new CSVStreamWriter with a ',' as separator and '"'
      as quote character.


    **Parameters:**
    - writer - the writer to use.


---

### CSVStreamWriter(Writer, String)
- CSVStreamWriter(writer: [Writer](dw.io.Writer.md), separator: [String](TopLevel.String.md))
  - : Create a new CSVStreamWriter with the specified separator and '"'
      as quote character.


    **Parameters:**
    - writer - the writer to use.
    - separator - the separator to use.


---

### CSVStreamWriter(Writer, String, String)
- CSVStreamWriter(writer: [Writer](dw.io.Writer.md), separator: [String](TopLevel.String.md), quote: [String](TopLevel.String.md))
  - : Create a new CSVStreamWriter with the specified separator and the
      specified quote character.


    **Parameters:**
    - writer - the writer to use.
    - separator - the separator to use.
    - quote - the quote to use.


---

## Method Details

### close()
- close(): void
  - : Closes the underlying writer.


---

### writeNext(String...)
- writeNext(line: [String...](TopLevel.String.md)): void
  - : Write a single line to the CSV file.

    **Parameters:**
    - line - an array of strings.


---

<!-- prettier-ignore-end -->
