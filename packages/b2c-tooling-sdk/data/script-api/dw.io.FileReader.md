<!-- prettier-ignore-start -->
# Class FileReader

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.io.Reader](dw.io.Reader.md)
    - [dw.io.FileReader](dw.io.FileReader.md)

File reader class.


## Constructor Summary

| Constructor | Description |
| --- | --- |
| [FileReader](#filereaderfile)([File](dw.io.File.md)) | Constructs the reader. |
| [FileReader](#filereaderfile-string)([File](dw.io.File.md), [String](TopLevel.String.md)) | Constructs the reader. |

## Method Summary

| Method | Description |
| --- | --- |
| [close](dw.io.FileReader.md#close)() | Closes the reader. |

### Methods inherited from class Reader

[close](dw.io.Reader.md#close), [getLines](dw.io.Reader.md#getlines), [getString](dw.io.Reader.md#getstring), [read](dw.io.Reader.md#read), [read](dw.io.Reader.md#readnumber), [readLine](dw.io.Reader.md#readline), [readLines](dw.io.Reader.md#readlines), [readN](dw.io.Reader.md#readnnumber), [readString](dw.io.Reader.md#readstring), [ready](dw.io.Reader.md#ready), [skip](dw.io.Reader.md#skipnumber)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constructor Details

### FileReader(File)
- FileReader(file: [File](dw.io.File.md))
  - : Constructs the reader.
      
      
      To release system resources, close the reader by calling [close()](dw.io.FileReader.md#close).


    **Parameters:**
    - file - the file object to read.


---

### FileReader(File, String)
- FileReader(file: [File](dw.io.File.md), encoding: [String](TopLevel.String.md))
  - : Constructs the reader.
      
      
      To release system resources, close the reader by calling [close()](dw.io.FileReader.md#close).


    **Parameters:**
    - file - the file object to read.
    - encoding - the character encoding to use.


---

## Method Details

### close()
- close(): void
  - : Closes the reader.


---

<!-- prettier-ignore-end -->
