<!-- prettier-ignore-start -->
# Class Reader

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.io.Reader](dw.io.Reader.md)

The class supports reading characters from a stream.


## All Known Subclasses
[FileReader](dw.io.FileReader.md)
## Property Summary

| Property | Description |
| --- | --- |
| ~~[lines](#lines): [List](dw.util.List.md)~~ `(read-only)` | The method reads the whole input stream, parses it and returns a list of strings. |
| ~~[string](#string): [String](TopLevel.String.md)~~ `(read-only)` | The method reads the whole input stream as one string and returns it. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [Reader](#readerstring)([String](TopLevel.String.md)) | Creates a reader from a string. |
| [Reader](#readerinputstream)([InputStream](dw.io.InputStream.md)) | Create a reader from a stream using UTF-8 character encoding. |
| [Reader](#readerinputstream-string)([InputStream](dw.io.InputStream.md), [String](TopLevel.String.md)) | Create a reader from a stream using the specified character encoding. |

## Method Summary

| Method | Description |
| --- | --- |
| [close](dw.io.Reader.md#close)() | Closes the reader. |
| ~~[getLines](dw.io.Reader.md#getlines)()~~ | The method reads the whole input stream, parses it and returns a list of strings. |
| ~~[getString](dw.io.Reader.md#getstring)()~~ | The method reads the whole input stream as one string and returns it. |
| [read](dw.io.Reader.md#read)() | Reads a single character from the stream. |
| ~~[read](dw.io.Reader.md#readnumber)([Number](TopLevel.Number.md))~~ | Reads multiple characters from the stream as string. |
| [readLine](dw.io.Reader.md#readline)() | Reads the next line. |
| [readLines](dw.io.Reader.md#readlines)() | The method reads the whole input stream, parses it and returns a list of strings. |
| [readN](dw.io.Reader.md#readnnumber)([Number](TopLevel.Number.md)) | Reads n characters from the stream as string. |
| [readString](dw.io.Reader.md#readstring)() | The method reads the whole input stream as one string and returns it. |
| [ready](dw.io.Reader.md#ready)() | Identifies if this stream is ready to be read. |
| [skip](dw.io.Reader.md#skipnumber)([Number](TopLevel.Number.md)) | Skips the specified number of characters in the stream. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### lines
- ~~lines: [List](dw.util.List.md)~~ `(read-only)`
  - : The method reads the whole input stream, parses it and returns a list of strings.
      
      
      Using this method on large feeds is inherently unsafe and may lead to an out-of-memory condition. Instead use
      method [readLine()](dw.io.Reader.md#readline) and process one line at a time.


    **Deprecated:**
:::warning
Use [readLines()](dw.io.Reader.md#readlines)
:::

---

### string
- ~~string: [String](TopLevel.String.md)~~ `(read-only)`
  - : The method reads the whole input stream as one string and returns it.
      
      
      Using this method is unsafe if the length of the input stream is not known and may lead to an out-of-memory
      condition. Instead use method [readN(Number)](dw.io.Reader.md#readnnumber).


    **Deprecated:**
:::warning
Use [readString()](dw.io.Reader.md#readstring)
:::

---

## Constructor Details

### Reader(String)
- Reader(source: [String](TopLevel.String.md))
  - : Creates a reader from a string.

    **Parameters:**
    - source - the source string.


---

### Reader(InputStream)
- Reader(stream: [InputStream](dw.io.InputStream.md))
  - : Create a reader from a stream using UTF-8 character encoding.

    **Parameters:**
    - stream - the input stream to use.


---

### Reader(InputStream, String)
- Reader(stream: [InputStream](dw.io.InputStream.md), encoding: [String](TopLevel.String.md))
  - : Create a reader from a stream using the specified character encoding.

    **Parameters:**
    - stream - the input stream to use.
    - encoding - the encoding to use.


---

## Method Details

### close()
- close(): void
  - : Closes the reader.


---

### getLines()
- ~~getLines(): [List](dw.util.List.md)~~
  - : The method reads the whole input stream, parses it and returns a list of strings.
      
      
      Using this method on large feeds is inherently unsafe and may lead to an out-of-memory condition. Instead use
      method [readLine()](dw.io.Reader.md#readline) and process one line at a time.


    **Returns:**
    - a list of strings

    **Deprecated:**
:::warning
Use [readLines()](dw.io.Reader.md#readlines)
:::

---

### getString()
- ~~getString(): [String](TopLevel.String.md)~~
  - : The method reads the whole input stream as one string and returns it.
      
      
      Using this method is unsafe if the length of the input stream is not known and may lead to an out-of-memory
      condition. Instead use method [readN(Number)](dw.io.Reader.md#readnnumber).


    **Returns:**
    - a string, which represents the whole content of the InputStream

    **Throws:**
    - IOException - if something went wrong while reading from the underlying stream

    **Deprecated:**
:::warning
Use [readString()](dw.io.Reader.md#readstring)
:::

---

### read()
- read(): [String](TopLevel.String.md)
  - : Reads a single character from the stream. The method returns null if the end of the stream is reached.

    **Returns:**
    - a single character in a string, or null if the end of the stream is reached


---

### read(Number)
- ~~read(length: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)~~
  - : Reads multiple characters from the stream as string. The actual number of characters that were read can be
      determined from the length of the returned string. If the end of the stream is reached and no more characters can
      be read, the method exits with an exception.


    **Parameters:**
    - length - the number of characters to read.

    **Returns:**
    - a string whose length is controlled by the length parameter. The actual number of characters that were
              read can be determined from the length of the returned string.


    **Throws:**
    - an - exception if the stream is exhausted

    **Deprecated:**
:::warning
use [readN(Number)](dw.io.Reader.md#readnnumber) instead which does not throw an exception if the stream is exhausted
:::

---

### readLine()
- readLine(): [String](TopLevel.String.md)
  - : Reads the next line.

    **Returns:**
    - A String containing the contents of the line, not including any line termination characters, or null if
              the end of the stream has been reached.



---

### readLines()
- readLines(): [List](dw.util.List.md)
  - : The method reads the whole input stream, parses it and returns a list of strings.
      
      
      Using this method on large feeds is inherently unsafe and may lead to an out-of-memory condition. Instead use
      method [readLine()](dw.io.Reader.md#readline) and process one line at a time.


    **Returns:**
    - a list of strings


---

### readN(Number)
- readN(n: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Reads n characters from the stream as string. The actual number of characters that were read can be determined
      from the length of the returned string. If the end of the stream is reached and no more characters can be read,
      the method returns null.


    **Parameters:**
    - n - the number of characters to read

    **Returns:**
    - a string whose maximum length is controlled by the n parameter, or null if the end of the stream is
              reached and no more characters can be read



---

### readString()
- readString(): [String](TopLevel.String.md)
  - : The method reads the whole input stream as one string and returns it.
      
      
      Using this method is unsafe if the length of the input stream is not known and may lead to an out-of-memory
      condition. Instead use method [readN(Number)](dw.io.Reader.md#readnnumber).


    **Returns:**
    - a string, which represents the whole content of the InputStream

    **Throws:**
    - IOException - if something went wrong while reading from the underlying stream


---

### ready()
- ready(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if this stream is ready to be read.

    **Returns:**
    - true guarantees that the stream is ready to read without waiting for input. A false
      response means that the stream may or may not block to wait for input. Note that returning
      false does not guarantee that the next read() will block.



---

### skip(Number)
- skip(n: [Number](TopLevel.Number.md)): void
  - : Skips the specified number of characters in the stream.

    **Parameters:**
    - n - the number of characters to skip.


---

<!-- prettier-ignore-end -->
