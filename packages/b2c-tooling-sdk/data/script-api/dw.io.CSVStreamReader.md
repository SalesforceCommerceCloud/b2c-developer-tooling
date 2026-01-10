<!-- prettier-ignore-start -->
# Class CSVStreamReader

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.io.CSVStreamReader](dw.io.CSVStreamReader.md)

The class supports reading a CSV file. The reader supports handling CSV
entries where the separator is contained in quotes and also CSV entries where
a quoted entry contains newline characters.



## Constructor Summary

| Constructor | Description |
| --- | --- |
| [CSVStreamReader](#csvstreamreaderreader)([Reader](dw.io.Reader.md)) | Creates a new CSVReader with a ',' as separator character and a '"' as  quote character. |
| [CSVStreamReader](#csvstreamreaderreader-string)([Reader](dw.io.Reader.md), [String](TopLevel.String.md)) | Creates a new CSVReader with the specified separator character and a '"'  as quote character. |
| [CSVStreamReader](#csvstreamreaderreader-string-string)([Reader](dw.io.Reader.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Creates a new CSVReader with the specified separator character and the  specified quote character. |
| [CSVStreamReader](#csvstreamreaderreader-string-string-number)([Reader](dw.io.Reader.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Creates a new CSVReader. |

## Method Summary

| Method | Description |
| --- | --- |
| [close](dw.io.CSVStreamReader.md#close)() | Closes the underlying reader. |
| [readAll](dw.io.CSVStreamReader.md#readall)() | Returns a list of lines representing the entire CSV file. |
| [readNext](dw.io.CSVStreamReader.md#readnext)() | Returns the next line from the input stream. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constructor Details

### CSVStreamReader(Reader)
- CSVStreamReader(ioreader: [Reader](dw.io.Reader.md))
  - : Creates a new CSVReader with a ',' as separator character and a '"' as
      quote character. The reader doesn't skip any header lines.


    **Parameters:**
    - ioreader - the reader to use.


---

### CSVStreamReader(Reader, String)
- CSVStreamReader(ioreader: [Reader](dw.io.Reader.md), separator: [String](TopLevel.String.md))
  - : Creates a new CSVReader with the specified separator character and a '"'
      as quote character. The reader doesn't skip any header lines.


    **Parameters:**
    - ioreader - the reader to use.
    - separator - a string, which represents the separator character.


---

### CSVStreamReader(Reader, String, String)
- CSVStreamReader(ioreader: [Reader](dw.io.Reader.md), separator: [String](TopLevel.String.md), quote: [String](TopLevel.String.md))
  - : Creates a new CSVReader with the specified separator character and the
      specified quote character. The reader doesn't skip any header lines.


    **Parameters:**
    - ioreader - the reader to use.
    - separator - a string, which represents the separator character.
    - quote - a string, which represents the quote character.


---

### CSVStreamReader(Reader, String, String, Number)
- CSVStreamReader(ioreader: [Reader](dw.io.Reader.md), separator: [String](TopLevel.String.md), quote: [String](TopLevel.String.md), skip: [Number](TopLevel.Number.md))
  - : Creates a new CSVReader. The separator character, the quote character and
      the number of header lines can be specified in the call.


    **Parameters:**
    - ioreader - the reader to use.
    - separator - a string, which represents the separator character.
    - quote - a string, which represents the quote character.
    - skip - the number of lines to skip at the beginning of the file.


---

## Method Details

### close()
- close(): void
  - : Closes the underlying reader.


---

### readAll()
- readAll(): [List](dw.util.List.md)
  - : Returns a list of lines representing the entire CSV file. Each line is a
      array of strings.
      
      
      Using this method on large feeds is inherently unsafe and may lead to an
      out-of-memory condition. Instead use method [readNext()](dw.io.CSVStreamReader.md#readnext) and
      process entries line by line.


    **Returns:**
    - a list of lines representing the entire CSV file.


---

### readNext()
- readNext(): [String\[\]](TopLevel.String.md)
  - : Returns the next line from the input stream. The line is returned as an
      array of strings. The method returns null if the end of the stream is
      reached.


    **Returns:**
    - the next line from the input stream as an array of strings.


---

<!-- prettier-ignore-end -->
