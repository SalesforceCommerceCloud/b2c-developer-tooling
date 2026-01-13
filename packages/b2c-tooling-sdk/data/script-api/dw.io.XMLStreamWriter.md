<!-- prettier-ignore-start -->
# Class XMLStreamWriter

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.io.XMLStreamWriter](dw.io.XMLStreamWriter.md)

The XMLStreamWriter can be used to write small and large XML feeds.


**Note:** when this class is used with sensitive data, be careful in persisting sensitive information to disk.



The XMLStreamWriter does not perform well-formedness checking on its input.
However the writeCharacters method escapes '&' , '<' and '>'. For attribute
values the writeAttribute method escapes the above characters plus '"' to
ensure that all character content and attribute values are well formed.


The following example illustrates how to use this class:


```
var fileWriter : FileWriter = new FileWriter(file, "UTF-8");
var xsw : XMLStreamWriter = new XMLStreamWriter(fileWriter);

xsw.writeStartDocument();
xsw.writeStartElement("products");
  xsw.writeStartElement("product");
  xsw.writeAttribute("id", "p42");
    xsw.writeStartElement("name");
      xsw.writeCharacters("blue t-shirt");
    xsw.writeEndElement();
    xsw.writeStartElement("rating");
      xsw.writeCharacters("2.0");
    xsw.writeEndElement();
  xsw.writeEndElement();
xsw.writeEndElement();
xsw.writeEndDocument();

xsw.close();
fileWriter.close();
```





The code above will write the following to file:


```
<?xml version="1.0" ?>
<products>
  <product id="p42">
    <name>a blue t-shirt</name>
    <rating>2.0</rating>
  </product>
</products>
```


Note:  This output has been formatted for readability. See
[XMLIndentingStreamWriter](dw.io.XMLIndentingStreamWriter.md).



## All Known Subclasses
[XMLIndentingStreamWriter](dw.io.XMLIndentingStreamWriter.md)
## Property Summary

| Property | Description |
| --- | --- |
| [defaultNamespace](#defaultnamespace): [String](TopLevel.String.md) | Returns the current default name space. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [XMLStreamWriter](#xmlstreamwriterwriter)([Writer](dw.io.Writer.md)) | Constructs the XMLStreamWriter for a writer. |

## Method Summary

| Method | Description |
| --- | --- |
| [close](dw.io.XMLStreamWriter.md#close)() | Close this writer and free any resources associated with the  writer. |
| [flush](dw.io.XMLStreamWriter.md#flush)() | Write any cached data to the underlying output mechanism. |
| [getDefaultNamespace](dw.io.XMLStreamWriter.md#getdefaultnamespace)() | Returns the current default name space. |
| [getPrefix](dw.io.XMLStreamWriter.md#getprefixstring)([String](TopLevel.String.md)) | Gets the prefix the URI is bound to. |
| [setDefaultNamespace](dw.io.XMLStreamWriter.md#setdefaultnamespacestring)([String](TopLevel.String.md)) | Binds a URI to the default namespace. |
| [setPrefix](dw.io.XMLStreamWriter.md#setprefixstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Sets the prefix the uri is bound to. |
| [writeAttribute](dw.io.XMLStreamWriter.md#writeattributestring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Writes an attribute to the output stream without  a prefix. |
| [writeAttribute](dw.io.XMLStreamWriter.md#writeattributestring-string-string)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Writes an attribute to the output stream. |
| [writeAttribute](dw.io.XMLStreamWriter.md#writeattributestring-string-string-string)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Writes an attribute to the output stream. |
| [writeCData](dw.io.XMLStreamWriter.md#writecdatastring)([String](TopLevel.String.md)) | Writes a CData section. |
| [writeCharacters](dw.io.XMLStreamWriter.md#writecharactersstring)([String](TopLevel.String.md)) | Write text to the output. |
| [writeComment](dw.io.XMLStreamWriter.md#writecommentstring)([String](TopLevel.String.md)) | Writes an XML comment with the data enclosed. |
| [writeDTD](dw.io.XMLStreamWriter.md#writedtdstring)([String](TopLevel.String.md)) | Write a DTD section. |
| [writeDefaultNamespace](dw.io.XMLStreamWriter.md#writedefaultnamespacestring)([String](TopLevel.String.md)) | Writes the default namespace to the stream. |
| [writeEmptyElement](dw.io.XMLStreamWriter.md#writeemptyelementstring)([String](TopLevel.String.md)) | Writes an empty element tag to the output. |
| [writeEmptyElement](dw.io.XMLStreamWriter.md#writeemptyelementstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Writes an empty element tag to the output. |
| [writeEmptyElement](dw.io.XMLStreamWriter.md#writeemptyelementstring-string-string)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Writes an empty element tag to the output. |
| [writeEndDocument](dw.io.XMLStreamWriter.md#writeenddocument)() | Closes any start tags and writes corresponding end tags. |
| [writeEndElement](dw.io.XMLStreamWriter.md#writeendelement)() | Writes an end tag to the output relying on the internal  state of the writer to determine the prefix and local name  of the event. |
| [writeEntityRef](dw.io.XMLStreamWriter.md#writeentityrefstring)([String](TopLevel.String.md)) | Writes an entity reference. |
| [writeNamespace](dw.io.XMLStreamWriter.md#writenamespacestring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Writes a namespace to the output stream. |
| [writeProcessingInstruction](dw.io.XMLStreamWriter.md#writeprocessinginstructionstring)([String](TopLevel.String.md)) | Writes a processing instruction. |
| [writeProcessingInstruction](dw.io.XMLStreamWriter.md#writeprocessinginstructionstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Writes a processing instruction. |
| [writeRaw](dw.io.XMLStreamWriter.md#writerawstring)([String](TopLevel.String.md)) | Writes the given string directly into the output stream. |
| [writeStartDocument](dw.io.XMLStreamWriter.md#writestartdocument)() | Write the XML Declaration. |
| [writeStartDocument](dw.io.XMLStreamWriter.md#writestartdocumentstring)([String](TopLevel.String.md)) | Write the XML Declaration. |
| [writeStartDocument](dw.io.XMLStreamWriter.md#writestartdocumentstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Write the XML Declaration. |
| [writeStartElement](dw.io.XMLStreamWriter.md#writestartelementstring)([String](TopLevel.String.md)) | Writes a start tag to the output. |
| [writeStartElement](dw.io.XMLStreamWriter.md#writestartelementstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Writes a start tag to the output. |
| [writeStartElement](dw.io.XMLStreamWriter.md#writestartelementstring-string-string)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Writes a start tag to the output. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### defaultNamespace
- defaultNamespace: [String](TopLevel.String.md)
  - : Returns the current default name space.


---

## Constructor Details

### XMLStreamWriter(Writer)
- XMLStreamWriter(writer: [Writer](dw.io.Writer.md))
  - : Constructs the XMLStreamWriter for a writer.

    **Parameters:**
    - writer - the writer for which the XMLStreamWriter is constructed.


---

## Method Details

### close()
- close(): void
  - : Close this writer and free any resources associated with the
      writer.  This method does not close the underlying writer.



---

### flush()
- flush(): void
  - : Write any cached data to the underlying output mechanism.


---

### getDefaultNamespace()
- getDefaultNamespace(): [String](TopLevel.String.md)
  - : Returns the current default name space.

    **Returns:**
    - the current default name space.


---

### getPrefix(String)
- getPrefix(uri: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Gets the prefix the URI is bound to.

    **Parameters:**
    - uri - the URI to use.

    **Returns:**
    - the prefix or null.


---

### setDefaultNamespace(String)
- setDefaultNamespace(uri: [String](TopLevel.String.md)): void
  - : Binds a URI to the default namespace.
      This URI is bound
      in the scope of the current START\_ELEMENT / END\_ELEMENT pair.
      If this method is called before a START\_ELEMENT has been written
      the uri is bound in the root scope.


    **Parameters:**
    - uri - the uri to bind to the default namespace, may be null.


---

### setPrefix(String, String)
- setPrefix(prefix: [String](TopLevel.String.md), uri: [String](TopLevel.String.md)): void
  - : Sets the prefix the uri is bound to.  This prefix is bound
      in the scope of the current START\_ELEMENT / END\_ELEMENT pair.
      If this method is called before a START\_ELEMENT has been written
      the prefix is bound in the root scope.


    **Parameters:**
    - prefix - the prefix to bind to the uri, may not be null.
    - uri - the uri to bind to the prefix, may be null.


---

### writeAttribute(String, String)
- writeAttribute(localName: [String](TopLevel.String.md), value: [String](TopLevel.String.md)): void
  - : Writes an attribute to the output stream without
      a prefix.


    **Parameters:**
    - localName - the local name of the attribute.
    - value - the value of the attribute.


---

### writeAttribute(String, String, String)
- writeAttribute(namespaceURI: [String](TopLevel.String.md), localName: [String](TopLevel.String.md), value: [String](TopLevel.String.md)): void
  - : Writes an attribute to the output stream.

    **Parameters:**
    - namespaceURI - the uri of the prefix for this attribute.
    - localName - the local name of the attribute.
    - value - the value of the attribute.


---

### writeAttribute(String, String, String, String)
- writeAttribute(prefix: [String](TopLevel.String.md), namespaceURI: [String](TopLevel.String.md), localName: [String](TopLevel.String.md), value: [String](TopLevel.String.md)): void
  - : Writes an attribute to the output stream.

    **Parameters:**
    - prefix - the prefix for this attribute.
    - namespaceURI - the uri of the prefix for this attribute.
    - localName - the local name of the attribute.
    - value - the value of the attribute.


---

### writeCData(String)
- writeCData(data: [String](TopLevel.String.md)): void
  - : Writes a CData section.

    **Parameters:**
    - data - the data contained in the CData Section, may not be null.


---

### writeCharacters(String)
- writeCharacters(text: [String](TopLevel.String.md)): void
  - : Write text to the output.

    **Parameters:**
    - text - the value to write.


---

### writeComment(String)
- writeComment(data: [String](TopLevel.String.md)): void
  - : Writes an XML comment with the data enclosed.

    **Parameters:**
    - data - the data contained in the comment, may be null.


---

### writeDTD(String)
- writeDTD(dtd: [String](TopLevel.String.md)): void
  - : Write a DTD section.  This string represents the entire doctypedecl production
      from the XML 1.0 specification.


    **Parameters:**
    - dtd - the DTD to be written.


---

### writeDefaultNamespace(String)
- writeDefaultNamespace(namespaceURI: [String](TopLevel.String.md)): void
  - : Writes the default namespace to the stream.

    **Parameters:**
    - namespaceURI - the uri to bind the default namespace to.


---

### writeEmptyElement(String)
- writeEmptyElement(localName: [String](TopLevel.String.md)): void
  - : Writes an empty element tag to the output.

    **Parameters:**
    - localName - local name of the tag, may not be null.


---

### writeEmptyElement(String, String)
- writeEmptyElement(namespaceURI: [String](TopLevel.String.md), localName: [String](TopLevel.String.md)): void
  - : Writes an empty element tag to the output.

    **Parameters:**
    - namespaceURI - the uri to bind the tag to, may not be null.
    - localName - local name of the tag, may not be null.


---

### writeEmptyElement(String, String, String)
- writeEmptyElement(prefix: [String](TopLevel.String.md), localName: [String](TopLevel.String.md), namespaceURI: [String](TopLevel.String.md)): void
  - : Writes an empty element tag to the output.

    **Parameters:**
    - prefix - the prefix of the tag, may not be null.
    - localName - local name of the tag, may not be null.
    - namespaceURI - the uri to bind the tag to, may not be null.


---

### writeEndDocument()
- writeEndDocument(): void
  - : Closes any start tags and writes corresponding end tags.


---

### writeEndElement()
- writeEndElement(): void
  - : Writes an end tag to the output relying on the internal
      state of the writer to determine the prefix and local name
      of the event.



---

### writeEntityRef(String)
- writeEntityRef(name: [String](TopLevel.String.md)): void
  - : Writes an entity reference.

    **Parameters:**
    - name - the name of the entity.


---

### writeNamespace(String, String)
- writeNamespace(prefix: [String](TopLevel.String.md), namespaceURI: [String](TopLevel.String.md)): void
  - : Writes a namespace to the output stream.
      If the prefix argument to this method is the empty string,
      "xmlns", or null this method will delegate to writeDefaultNamespace.


    **Parameters:**
    - prefix - the prefix to bind this namespace to.
    - namespaceURI - the uri to bind the prefix to.


---

### writeProcessingInstruction(String)
- writeProcessingInstruction(target: [String](TopLevel.String.md)): void
  - : Writes a processing instruction.

    **Parameters:**
    - target - the target of the processing instruction, may not be null.


---

### writeProcessingInstruction(String, String)
- writeProcessingInstruction(target: [String](TopLevel.String.md), data: [String](TopLevel.String.md)): void
  - : Writes a processing instruction.

    **Parameters:**
    - target - the target of the processing instruction, may not be null.
    - data - the data contained in the processing instruction, may not be null.


---

### writeRaw(String)
- writeRaw(raw: [String](TopLevel.String.md)): void
  - : Writes the given string directly into the output stream. No checks
      regarding the correctness of the XML are done. The caller must ensure
      that the final result is a correct XML.


    **Parameters:**
    - raw - the string to write to the output stream.


---

### writeStartDocument()
- writeStartDocument(): void
  - : Write the XML Declaration. Defaults the XML version to 1.0, and the encoding to utf-8


---

### writeStartDocument(String)
- writeStartDocument(version: [String](TopLevel.String.md)): void
  - : Write the XML Declaration. Defaults the XML version to 1.0

    **Parameters:**
    - version - version of the xml document.


---

### writeStartDocument(String, String)
- writeStartDocument(encoding: [String](TopLevel.String.md), version: [String](TopLevel.String.md)): void
  - : Write the XML Declaration.  Note that the encoding parameter does
      not set the actual encoding of the underlying output.  That must
      be set when the instance of the XMLStreamWriter is created using the
      XMLOutputFactory.


    **Parameters:**
    - encoding - encoding of the xml declaration.
    - version - version of the xml document.


---

### writeStartElement(String)
- writeStartElement(localName: [String](TopLevel.String.md)): void
  - : Writes a start tag to the output.  All writeStartElement methods
      open a new scope in the internal namespace context.  Writing the
      corresponding EndElement causes the scope to be closed.


    **Parameters:**
    - localName - local name of the tag, may not be null.


---

### writeStartElement(String, String)
- writeStartElement(namespaceURI: [String](TopLevel.String.md), localName: [String](TopLevel.String.md)): void
  - : Writes a start tag to the output.

    **Parameters:**
    - namespaceURI - the namespaceURI of the prefix to use, may not be null.
    - localName - local name of the tag, may not be null.


---

### writeStartElement(String, String, String)
- writeStartElement(prefix: [String](TopLevel.String.md), localName: [String](TopLevel.String.md), namespaceURI: [String](TopLevel.String.md)): void
  - : Writes a start tag to the output.

    **Parameters:**
    - prefix - the prefix of the tag, may not be null.
    - localName - local name of the tag, may not be null.
    - namespaceURI - the uri to bind the prefix to, may not be null.


---

<!-- prettier-ignore-end -->
