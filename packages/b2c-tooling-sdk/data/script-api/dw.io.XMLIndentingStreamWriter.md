<!-- prettier-ignore-start -->
# Class XMLIndentingStreamWriter

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.io.XMLStreamWriter](dw.io.XMLStreamWriter.md)
    - [dw.io.XMLIndentingStreamWriter](dw.io.XMLIndentingStreamWriter.md)

A XMLIndentingStreamWriter writes the XML output formatted for good
readability.


**Note:** when this class is used with sensitive data, be careful
in persisting sensitive information to disk.



## Property Summary

| Property | Description |
| --- | --- |
| [indent](#indent): [String](TopLevel.String.md) | Returns the indent. |
| [newLine](#newline): [String](TopLevel.String.md) | Returns the string that is used for a new line character. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [XMLIndentingStreamWriter](#xmlindentingstreamwriterwriter)([Writer](dw.io.Writer.md)) | Constructs the writer for the specified writer. |

## Method Summary

| Method | Description |
| --- | --- |
| [getIndent](dw.io.XMLIndentingStreamWriter.md#getindent)() | Returns the indent. |
| [getNewLine](dw.io.XMLIndentingStreamWriter.md#getnewline)() | Returns the string that is used for a new line character. |
| [setIndent](dw.io.XMLIndentingStreamWriter.md#setindentstring)([String](TopLevel.String.md)) | Specifies a string that will be used as identing characters. |
| [setNewLine](dw.io.XMLIndentingStreamWriter.md#setnewlinestring)([String](TopLevel.String.md)) | Sets the string that is used for a new line character. |

### Methods inherited from class XMLStreamWriter

[close](dw.io.XMLStreamWriter.md#close), [flush](dw.io.XMLStreamWriter.md#flush), [getDefaultNamespace](dw.io.XMLStreamWriter.md#getdefaultnamespace), [getPrefix](dw.io.XMLStreamWriter.md#getprefixstring), [setDefaultNamespace](dw.io.XMLStreamWriter.md#setdefaultnamespacestring), [setPrefix](dw.io.XMLStreamWriter.md#setprefixstring-string), [writeAttribute](dw.io.XMLStreamWriter.md#writeattributestring-string), [writeAttribute](dw.io.XMLStreamWriter.md#writeattributestring-string-string), [writeAttribute](dw.io.XMLStreamWriter.md#writeattributestring-string-string-string), [writeCData](dw.io.XMLStreamWriter.md#writecdatastring), [writeCharacters](dw.io.XMLStreamWriter.md#writecharactersstring), [writeComment](dw.io.XMLStreamWriter.md#writecommentstring), [writeDTD](dw.io.XMLStreamWriter.md#writedtdstring), [writeDefaultNamespace](dw.io.XMLStreamWriter.md#writedefaultnamespacestring), [writeEmptyElement](dw.io.XMLStreamWriter.md#writeemptyelementstring), [writeEmptyElement](dw.io.XMLStreamWriter.md#writeemptyelementstring-string), [writeEmptyElement](dw.io.XMLStreamWriter.md#writeemptyelementstring-string-string), [writeEndDocument](dw.io.XMLStreamWriter.md#writeenddocument), [writeEndElement](dw.io.XMLStreamWriter.md#writeendelement), [writeEntityRef](dw.io.XMLStreamWriter.md#writeentityrefstring), [writeNamespace](dw.io.XMLStreamWriter.md#writenamespacestring-string), [writeProcessingInstruction](dw.io.XMLStreamWriter.md#writeprocessinginstructionstring), [writeProcessingInstruction](dw.io.XMLStreamWriter.md#writeprocessinginstructionstring-string), [writeRaw](dw.io.XMLStreamWriter.md#writerawstring), [writeStartDocument](dw.io.XMLStreamWriter.md#writestartdocument), [writeStartDocument](dw.io.XMLStreamWriter.md#writestartdocumentstring), [writeStartDocument](dw.io.XMLStreamWriter.md#writestartdocumentstring-string), [writeStartElement](dw.io.XMLStreamWriter.md#writestartelementstring), [writeStartElement](dw.io.XMLStreamWriter.md#writestartelementstring-string), [writeStartElement](dw.io.XMLStreamWriter.md#writestartelementstring-string-string)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### indent
- indent: [String](TopLevel.String.md)
  - : Returns the indent.


---

### newLine
- newLine: [String](TopLevel.String.md)
  - : Returns the string that is used for a new line character. The
      default is the normal new line character.



---

## Constructor Details

### XMLIndentingStreamWriter(Writer)
- XMLIndentingStreamWriter(writer: [Writer](dw.io.Writer.md))
  - : Constructs the writer for the specified writer.

    **Parameters:**
    - writer - the writer to use.


---

## Method Details

### getIndent()
- getIndent(): [String](TopLevel.String.md)
  - : Returns the indent.

    **Returns:**
    - Returns the indent.


---

### getNewLine()
- getNewLine(): [String](TopLevel.String.md)
  - : Returns the string that is used for a new line character. The
      default is the normal new line character.


    **Returns:**
    - the new line.


---

### setIndent(String)
- setIndent(indent: [String](TopLevel.String.md)): void
  - : Specifies a string that will be used as identing characters. The
      default are two space characters.


    **Parameters:**
    - indent - The indent to set.


---

### setNewLine(String)
- setNewLine(newLine: [String](TopLevel.String.md)): void
  - : Sets the string that is used for a new line character.

    **Parameters:**
    - newLine - The newLine to set.


---

<!-- prettier-ignore-end -->
