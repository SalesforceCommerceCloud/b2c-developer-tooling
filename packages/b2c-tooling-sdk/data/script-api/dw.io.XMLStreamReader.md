<!-- prettier-ignore-start -->
# Class XMLStreamReader

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.io.XMLStreamReader](dw.io.XMLStreamReader.md)

The XMLStreamReader allows forward, read-only access to XML.  It is designed
to be the lowest level and most efficient way to read XML data.


 The XMLStreamReader is designed to iterate over XML using
next() and hasNext().  The data can be accessed using methods such as getEventType(),
getNamespaceURI(), getLocalName() and getText();



 The [next()](dw.io.XMLStreamReader.md#next) method causes the reader to read the next parse event.
The next() method returns an integer which identifies the type of event just read.


 The event type can be determined using [getEventType()](dw.io.XMLStreamReader.md#geteventtype).


 Parsing events are defined as the XML Declaration, a DTD,
start tag, character data, white space, end tag, comment,
or processing instruction.  An attribute or namespace event may be encountered
at the root level of a document as the result of a query operation.



The following table describes which methods are valid in what state.
If a method is called in an invalid state the method will throw a
java.lang.IllegalStateException.


|           Valid methods for each state         |
| --- |
| Event Type | Valid Methods |
|  All States   |  getProperty(), hasNext(), require(), close(),             getNamespaceURI(), isStartElement(),             isEndElement(), isCharacters(), isWhiteSpace(),             getNamespaceContext(), getEventType(),getLocation(),             hasText(), hasName()         |
|  START\_ELEMENT   |  next(), getName(), getLocalName(), hasName(), getPrefix(),             getAttributeXXX(), isAttributeSpecified(),             getNamespaceXXX(),             getElementText(), nextTag(), getXMLObject()         |
|  ATTRIBUTE   |  next(), nextTag()             getAttributeXXX(), isAttributeSpecified(),         |
|  NAMESPACE   |  next(), nextTag()             getNamespaceXXX()         |
|  END\_ELEMENT   |  next(), getName(), getLocalName(), hasName(), getPrefix(),             getNamespaceXXX(), nextTag()        |
|  CHARACTERS   |  next(), getTextXXX(), nextTag()  |
|  CDATA   |  next(), getTextXXX(), nextTag()  |
|  COMMENT   |  next(), getTextXXX(), nextTag()  |
|  SPACE   |  next(), getTextXXX(), nextTag()  |
|  START\_DOCUMENT   |  next(), getEncoding(), getVersion(), isStandalone(), standaloneSet(),             getCharacterEncodingScheme(), nextTag() |
|  END\_DOCUMENT   |  close() |
|  PROCESSING\_INSTRUCTION   |  next(), getPITarget(), getPIData(), nextTag()  |
|  ENTITY\_REFERENCE   |  next(), getLocalName(), getText(), nextTag()  |
|  DTD   |  next(), getText(), nextTag()  |





The following is a code sample to read an XML file containing multiple
"myobject" sub-elements.  Only one myObject instance is kept in memory at
any given time to keep memory consumption low:


```
var fileReader : FileReader = new FileReader(file, "UTF-8");
var xmlStreamReader : XMLStreamReader = new XMLStreamReader(fileReader);

while (xmlStreamReader.hasNext())
{
  if (xmlStreamReader.next() == XMLStreamConstants.START_ELEMENT)
  {
    var localElementName : String = xmlStreamReader.getLocalName();
    if (localElementName == "myobject")
    {
      // read single "myobject" as XML
      var myObject : XML = xmlStreamReader.getXMLObject();

      // process myObject
    }
  }
}

xmlStreamReader.close();
fileReader.close();
```



## Property Summary

| Property | Description |
| --- | --- |
| [PIData](#pidata): [String](TopLevel.String.md) `(read-only)` | Get the data section of a processing instruction. |
| [PITarget](#pitarget): [String](TopLevel.String.md) `(read-only)` | Get the target of a processing instruction. |
| ~~[XMLObject](#xmlobject): [Object](TopLevel.Object.md)~~ `(read-only)` | Reads a sub-tree of the XML document and parses it as XML object. |
| [attributeCount](#attributecount): [Number](TopLevel.Number.md) `(read-only)` | Returns the count of attributes on this START\_ELEMENT,  this method is only valid on a START\_ELEMENT or ATTRIBUTE. |
| [characterEncodingScheme](#characterencodingscheme): [String](TopLevel.String.md) `(read-only)` | Returns the character encoding declared on the XML declaration  Returns null if none was declared. |
| [characters](#characters): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if the cursor points to a character data event. |
| [columnNumber](#columnnumber): [Number](TopLevel.Number.md) `(read-only)` | Returns the column number where the current event ends or -1 if none is  available. |
| ~~[elementText](#elementtext): [String](TopLevel.String.md)~~ `(read-only)` | Reads the content of a text-only element, an exception is thrown if this is not a text-only element. |
| [encoding](#encoding): [String](TopLevel.String.md) `(read-only)` | Return input encoding if known or null if unknown. |
| [endElement](#endelement): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if the cursor points to an end tag. |
| [eventType](#eventtype): [Number](TopLevel.Number.md) `(read-only)` | Returns an integer code that indicates the type  of the event the cursor is pointing to. |
| [lineNumber](#linenumber): [Number](TopLevel.Number.md) `(read-only)` | Returns the line number where the current event ends or -1 if none is  available. |
| [localName](#localname): [String](TopLevel.String.md) `(read-only)` | Returns the (local) name of the current event. |
| [namespaceCount](#namespacecount): [Number](TopLevel.Number.md) `(read-only)` | Returns the count of namespaces declared on this START\_ELEMENT or END\_ELEMENT,  this method is only valid on a START\_ELEMENT, END\_ELEMENT or NAMESPACE. |
| [namespaceURI](#namespaceuri): [String](TopLevel.String.md) `(read-only)` | If the current event is a START\_ELEMENT or END\_ELEMENT  this method  returns the URI of the prefix or the default namespace. |
| [prefix](#prefix): [String](TopLevel.String.md) `(read-only)` | Returns the prefix of the current event or null if the event does not have a prefix |
| [standalone](#standalone): [Boolean](TopLevel.Boolean.md) `(read-only)` | Get the standalone declaration from the xml declaration. |
| [startElement](#startelement): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if the cursor points to a start tag. |
| [text](#text): [String](TopLevel.String.md) `(read-only)` | Returns the current value of the parse event as a string,  this returns the string value of a CHARACTERS event,  returns the value of a COMMENT, the replacement value  for an ENTITY\_REFERENCE, the string value of a CDATA section,  the string value for a SPACE event,  or the String value of the internal subset of the DTD. |
| [textLength](#textlength): [Number](TopLevel.Number.md) `(read-only)` | Returns the length of the sequence of characters for this  Text event within the text character array. |
| [textStart](#textstart): [Number](TopLevel.Number.md) `(read-only)` | Returns the offset into the text character array where the first  character (of this text event) is stored. |
| [version](#version): [String](TopLevel.String.md) `(read-only)` | Get the xml version declared on the xml declaration. |
| [whiteSpace](#whitespace): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if the cursor points to a character data event  that consists of all whitespace. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [XMLStreamReader](#xmlstreamreaderreader)([Reader](dw.io.Reader.md)) | Constructs the stream readon on behalf of the reader. |

## Method Summary

| Method | Description |
| --- | --- |
| [close](dw.io.XMLStreamReader.md#close)() | Frees any resources associated with this Reader. |
| [getAttributeCount](dw.io.XMLStreamReader.md#getattributecount)() | Returns the count of attributes on this START\_ELEMENT,  this method is only valid on a START\_ELEMENT or ATTRIBUTE. |
| [getAttributeLocalName](dw.io.XMLStreamReader.md#getattributelocalnamenumber)([Number](TopLevel.Number.md)) | Returns the localName of the attribute at the provided  index. |
| [getAttributeNamespace](dw.io.XMLStreamReader.md#getattributenamespacenumber)([Number](TopLevel.Number.md)) | Returns the namespace of the attribute at the provided  index. |
| [getAttributePrefix](dw.io.XMLStreamReader.md#getattributeprefixnumber)([Number](TopLevel.Number.md)) | Returns the prefix of this attribute at the  provided index. |
| [getAttributeType](dw.io.XMLStreamReader.md#getattributetypenumber)([Number](TopLevel.Number.md)) | Returns the XML type of the attribute at the provided  index. |
| [getAttributeValue](dw.io.XMLStreamReader.md#getattributevaluenumber)([Number](TopLevel.Number.md)) | Returns the value of the attribute at the  index. |
| [getAttributeValue](dw.io.XMLStreamReader.md#getattributevaluestring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Returns the normalized attribute value of the  attribute with the namespace and localName  If the namespaceURI is null the namespace  is not checked for equality |
| [getCharacterEncodingScheme](dw.io.XMLStreamReader.md#getcharacterencodingscheme)() | Returns the character encoding declared on the XML declaration  Returns null if none was declared. |
| [getColumnNumber](dw.io.XMLStreamReader.md#getcolumnnumber)() | Returns the column number where the current event ends or -1 if none is  available. |
| ~~[getElementText](dw.io.XMLStreamReader.md#getelementtext)()~~ | Reads the content of a text-only element, an exception is thrown if this is not a text-only element. |
| [getEncoding](dw.io.XMLStreamReader.md#getencoding)() | Return input encoding if known or null if unknown. |
| [getEventType](dw.io.XMLStreamReader.md#geteventtype)() | Returns an integer code that indicates the type  of the event the cursor is pointing to. |
| [getLineNumber](dw.io.XMLStreamReader.md#getlinenumber)() | Returns the line number where the current event ends or -1 if none is  available. |
| [getLocalName](dw.io.XMLStreamReader.md#getlocalname)() | Returns the (local) name of the current event. |
| [getNamespaceCount](dw.io.XMLStreamReader.md#getnamespacecount)() | Returns the count of namespaces declared on this START\_ELEMENT or END\_ELEMENT,  this method is only valid on a START\_ELEMENT, END\_ELEMENT or NAMESPACE. |
| [getNamespacePrefix](dw.io.XMLStreamReader.md#getnamespaceprefixnumber)([Number](TopLevel.Number.md)) | Returns the prefix for the namespace declared at the  index. |
| [getNamespaceURI](dw.io.XMLStreamReader.md#getnamespaceuri)() | If the current event is a START\_ELEMENT or END\_ELEMENT  this method  returns the URI of the prefix or the default namespace. |
| [getNamespaceURI](dw.io.XMLStreamReader.md#getnamespaceurinumber)([Number](TopLevel.Number.md)) | Returns the uri for the namespace declared at the  index. |
| [getNamespaceURI](dw.io.XMLStreamReader.md#getnamespaceuristring)([String](TopLevel.String.md)) | Return the uri for the given prefix. |
| [getPIData](dw.io.XMLStreamReader.md#getpidata)() | Get the data section of a processing instruction. |
| [getPITarget](dw.io.XMLStreamReader.md#getpitarget)() | Get the target of a processing instruction. |
| [getPrefix](dw.io.XMLStreamReader.md#getprefix)() | Returns the prefix of the current event or null if the event does not have a prefix |
| [getText](dw.io.XMLStreamReader.md#gettext)() | Returns the current value of the parse event as a string,  this returns the string value of a CHARACTERS event,  returns the value of a COMMENT, the replacement value  for an ENTITY\_REFERENCE, the string value of a CDATA section,  the string value for a SPACE event,  or the String value of the internal subset of the DTD. |
| [getTextLength](dw.io.XMLStreamReader.md#gettextlength)() | Returns the length of the sequence of characters for this  Text event within the text character array. |
| [getTextStart](dw.io.XMLStreamReader.md#gettextstart)() | Returns the offset into the text character array where the first  character (of this text event) is stored. |
| [getVersion](dw.io.XMLStreamReader.md#getversion)() | Get the xml version declared on the xml declaration. |
| ~~[getXMLObject](dw.io.XMLStreamReader.md#getxmlobject)()~~ | Reads a sub-tree of the XML document and parses it as XML object. |
| [hasName](dw.io.XMLStreamReader.md#hasname)() | Identifies if the current event has a name (is a START\_ELEMENT or END\_ELEMENT) |
| [hasNext](dw.io.XMLStreamReader.md#hasnext)() | Returns true if there are more parsing events and false  if there are no more events. |
| [hasText](dw.io.XMLStreamReader.md#hastext)() | Indicates if the current event has text. |
| [isAttributeSpecified](dw.io.XMLStreamReader.md#isattributespecifiednumber)([Number](TopLevel.Number.md)) | Identifies if this  attribute was created by default. |
| [isCharacters](dw.io.XMLStreamReader.md#ischaracters)() | Identifies if the cursor points to a character data event. |
| [isEndElement](dw.io.XMLStreamReader.md#isendelement)() | Identifies if the cursor points to an end tag. |
| [isStandalone](dw.io.XMLStreamReader.md#isstandalone)() | Get the standalone declaration from the xml declaration. |
| [isStartElement](dw.io.XMLStreamReader.md#isstartelement)() | Identifies if the cursor points to a start tag. |
| [isWhiteSpace](dw.io.XMLStreamReader.md#iswhitespace)() | Identifies if the cursor points to a character data event  that consists of all whitespace. |
| [next](dw.io.XMLStreamReader.md#next)() | Get next parsing event - a processor may return all contiguous  character data in a single chunk, or it may split it into several chunks. |
| [nextTag](dw.io.XMLStreamReader.md#nexttag)() | Skips any white space (isWhiteSpace() returns true), COMMENT,  or PROCESSING\_INSTRUCTION,  until a START\_ELEMENT or END\_ELEMENT is reached. |
| [readElementText](dw.io.XMLStreamReader.md#readelementtext)() | Reads the content of a text-only element, an exception is thrown if this is not a text-only element. |
| [readXMLObject](dw.io.XMLStreamReader.md#readxmlobject)() | Reads a sub-tree of the XML document and parses it as XML object. |
| [require](dw.io.XMLStreamReader.md#requirenumber-string-string)([Number](TopLevel.Number.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Test if the current event is of the given type and if the namespace and name match the current  namespace and name of the current event. |
| [standaloneSet](dw.io.XMLStreamReader.md#standaloneset)() | Identifies if standalone was set in the document. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### PIData
- PIData: [String](TopLevel.String.md) `(read-only)`
  - : Get the data section of a processing instruction.


---

### PITarget
- PITarget: [String](TopLevel.String.md) `(read-only)`
  - : Get the target of a processing instruction.


---

### XMLObject
- ~~XMLObject: [Object](TopLevel.Object.md)~~ `(read-only)`
  - : Reads a sub-tree of the XML document and parses it as XML object.
      
      
      The stream must be positioned on a START\_ELEMENT. Do not call the method
      when the stream is positioned at document's root element. This would
      cause the whole document to be parsed into a single XML what may lead to
      an out-of-memory condition. Instead use \#next() to navigate to
      sub-elements and invoke getXMLObject() there. Do not keep references to
      more than the currently processed XML to keep memory consumption low. The
      method reads the stream up to the matching END\_ELEMENT. When the method
      returns the current event is the END\_ELEMENT event.


    **Deprecated:**
:::warning
Use [readXMLObject()](dw.io.XMLStreamReader.md#readxmlobject)
:::

---

### attributeCount
- attributeCount: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the count of attributes on this START\_ELEMENT,
      this method is only valid on a START\_ELEMENT or ATTRIBUTE.  This
      count excludes namespace definitions.  Attribute indices are
      zero-based.



---

### characterEncodingScheme
- characterEncodingScheme: [String](TopLevel.String.md) `(read-only)`
  - : Returns the character encoding declared on the XML declaration
      Returns null if none was declared.



---

### characters
- characters: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if the cursor points to a character data event.


---

### columnNumber
- columnNumber: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the column number where the current event ends or -1 if none is
      available.



---

### elementText
- ~~elementText: [String](TopLevel.String.md)~~ `(read-only)`
  - : Reads the content of a text-only element, an exception is thrown if this is not a text-only element. This method
      always returns coalesced content. 
      
      Precondition: the current event is START\_ELEMENT. 
      
      Postcondition: the current event is the corresponding END\_ELEMENT. 
      
      The method does the following (implementations are free to be optimized but must do equivalent processing):
      
      
      ```
      if ( getEventType() != XMLStreamConstants.START_ELEMENT )
      {
          throw new XMLStreamException( "parser must be on START_ELEMENT to read next text", getLocation() );
      }
      int eventType = next();
      StringBuffer content = new StringBuffer();
      while ( eventType != XMLStreamConstants.END_ELEMENT )
      {
          if ( eventType == XMLStreamConstants.CHARACTERS || eventType == XMLStreamConstants.CDATA
              || eventType == XMLStreamConstants.SPACE || eventType == XMLStreamConstants.ENTITY_REFERENCE )
          {
              buf.append( getText() );
          }
          else if ( eventType == XMLStreamConstants.PROCESSING_INSTRUCTION || eventType == XMLStreamConstants.COMMENT )
          {
              // skipping
          }
          else if ( eventType == XMLStreamConstants.END_DOCUMENT )
          {
              throw new XMLStreamException( "unexpected end of document when reading element text content", this );
          }
          else if ( eventType == XMLStreamConstants.START_ELEMENT )
          {
              throw new XMLStreamException( "element text content may not contain START_ELEMENT", getLocation() );
          }
          else
          {
              throw new XMLStreamException( "Unexpected event type " + eventType, getLocation() );
          }
          eventType = next();
      }
      return buf.toString();
      ```


    **Deprecated:**
:::warning
Use [readElementText()](dw.io.XMLStreamReader.md#readelementtext)
:::

---

### encoding
- encoding: [String](TopLevel.String.md) `(read-only)`
  - : Return input encoding if known or null if unknown.


---

### endElement
- endElement: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if the cursor points to an end tag.


---

### eventType
- eventType: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns an integer code that indicates the type
      of the event the cursor is pointing to.



---

### lineNumber
- lineNumber: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the line number where the current event ends or -1 if none is
      available.



---

### localName
- localName: [String](TopLevel.String.md) `(read-only)`
  - : Returns the (local) name of the current event.
      For START\_ELEMENT or END\_ELEMENT returns the (local) name of the current element.
      For ENTITY\_REFERENCE it returns entity name.
      The current event must be START\_ELEMENT or END\_ELEMENT,
      or ENTITY\_REFERENCE.



---

### namespaceCount
- namespaceCount: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the count of namespaces declared on this START\_ELEMENT or END\_ELEMENT,
      this method is only valid on a START\_ELEMENT, END\_ELEMENT or NAMESPACE. On
      an END\_ELEMENT the count is of the namespaces that are about to go
      out of scope.  This is the equivalent of the information reported
      by SAX callback for an end element event.



---

### namespaceURI
- namespaceURI: [String](TopLevel.String.md) `(read-only)`
  - : If the current event is a START\_ELEMENT or END\_ELEMENT  this method
      returns the URI of the prefix or the default namespace.
      Returns null if the event does not have a prefix.



---

### prefix
- prefix: [String](TopLevel.String.md) `(read-only)`
  - : Returns the prefix of the current event or null if the event does not have a prefix


---

### standalone
- standalone: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Get the standalone declaration from the xml declaration.


---

### startElement
- startElement: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if the cursor points to a start tag.


---

### text
- text: [String](TopLevel.String.md) `(read-only)`
  - : Returns the current value of the parse event as a string,
      this returns the string value of a CHARACTERS event,
      returns the value of a COMMENT, the replacement value
      for an ENTITY\_REFERENCE, the string value of a CDATA section,
      the string value for a SPACE event,
      or the String value of the internal subset of the DTD.
      If an ENTITY\_REFERENCE has been resolved, any character data
      will be reported as CHARACTERS events.



---

### textLength
- textLength: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the length of the sequence of characters for this
      Text event within the text character array.



---

### textStart
- textStart: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the offset into the text character array where the first
      character (of this text event) is stored.



---

### version
- version: [String](TopLevel.String.md) `(read-only)`
  - : Get the xml version declared on the xml declaration.
      Returns null if none was declared.



---

### whiteSpace
- whiteSpace: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if the cursor points to a character data event
      that consists of all whitespace.



---

## Constructor Details

### XMLStreamReader(Reader)
- XMLStreamReader(reader: [Reader](dw.io.Reader.md))
  - : Constructs the stream readon on behalf of the reader.

    **Parameters:**
    - reader - the reader to use.


---

## Method Details

### close()
- close(): void
  - : Frees any resources associated with this Reader.  This method does not close the
      underlying reader.



---

### getAttributeCount()
- getAttributeCount(): [Number](TopLevel.Number.md)
  - : Returns the count of attributes on this START\_ELEMENT,
      this method is only valid on a START\_ELEMENT or ATTRIBUTE.  This
      count excludes namespace definitions.  Attribute indices are
      zero-based.


    **Returns:**
    - returns the number of attributes.


---

### getAttributeLocalName(Number)
- getAttributeLocalName(index: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Returns the localName of the attribute at the provided
      index.


    **Parameters:**
    - index - the position of the attribute.

    **Returns:**
    - the local name of the attribute.


---

### getAttributeNamespace(Number)
- getAttributeNamespace(index: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Returns the namespace of the attribute at the provided
      index.


    **Parameters:**
    - index - the position of the attribute

    **Returns:**
    - the namespace URI (can be null)


---

### getAttributePrefix(Number)
- getAttributePrefix(index: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Returns the prefix of this attribute at the
      provided index.


    **Parameters:**
    - index - the position of the attribute.

    **Returns:**
    - the prefix of the attribute.


---

### getAttributeType(Number)
- getAttributeType(index: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Returns the XML type of the attribute at the provided
      index.


    **Parameters:**
    - index - the position of the attribute.

    **Returns:**
    - the XML type of the attribute.


---

### getAttributeValue(Number)
- getAttributeValue(index: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Returns the value of the attribute at the
      index.


    **Parameters:**
    - index - the position of the attribute.

    **Returns:**
    - the attribute value.


---

### getAttributeValue(String, String)
- getAttributeValue(namespaceURI: [String](TopLevel.String.md), localName: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Returns the normalized attribute value of the
      attribute with the namespace and localName
      If the namespaceURI is null the namespace
      is not checked for equality


    **Parameters:**
    - namespaceURI - the namespace of the attribute
    - localName - the local name of the attribute, cannot be null

    **Returns:**
    - returns the value of the attribute or null if not found.


---

### getCharacterEncodingScheme()
- getCharacterEncodingScheme(): [String](TopLevel.String.md)
  - : Returns the character encoding declared on the XML declaration
      Returns null if none was declared.


    **Returns:**
    - the encoding declared in the document or null.


---

### getColumnNumber()
- getColumnNumber(): [Number](TopLevel.Number.md)
  - : Returns the column number where the current event ends or -1 if none is
      available.


    **Returns:**
    - the column number or -1.


---

### getElementText()
- ~~getElementText(): [String](TopLevel.String.md)~~
  - : Reads the content of a text-only element, an exception is thrown if this is not a text-only element. This method
      always returns coalesced content. 
      
      Precondition: the current event is START\_ELEMENT. 
      
      Postcondition: the current event is the corresponding END\_ELEMENT. 
      
      The method does the following (implementations are free to be optimized but must do equivalent processing):
      
      
      ```
      if ( getEventType() != XMLStreamConstants.START_ELEMENT )
      {
          throw new XMLStreamException( "parser must be on START_ELEMENT to read next text", getLocation() );
      }
      int eventType = next();
      StringBuffer content = new StringBuffer();
      while ( eventType != XMLStreamConstants.END_ELEMENT )
      {
          if ( eventType == XMLStreamConstants.CHARACTERS || eventType == XMLStreamConstants.CDATA
              || eventType == XMLStreamConstants.SPACE || eventType == XMLStreamConstants.ENTITY_REFERENCE )
          {
              buf.append( getText() );
          }
          else if ( eventType == XMLStreamConstants.PROCESSING_INSTRUCTION || eventType == XMLStreamConstants.COMMENT )
          {
              // skipping
          }
          else if ( eventType == XMLStreamConstants.END_DOCUMENT )
          {
              throw new XMLStreamException( "unexpected end of document when reading element text content", this );
          }
          else if ( eventType == XMLStreamConstants.START_ELEMENT )
          {
              throw new XMLStreamException( "element text content may not contain START_ELEMENT", getLocation() );
          }
          else
          {
              throw new XMLStreamException( "Unexpected event type " + eventType, getLocation() );
          }
          eventType = next();
      }
      return buf.toString();
      ```


    **Deprecated:**
:::warning
Use [readElementText()](dw.io.XMLStreamReader.md#readelementtext)
:::

---

### getEncoding()
- getEncoding(): [String](TopLevel.String.md)
  - : Return input encoding if known or null if unknown.

    **Returns:**
    - the encoding of this instance or null


---

### getEventType()
- getEventType(): [Number](TopLevel.Number.md)
  - : Returns an integer code that indicates the type
      of the event the cursor is pointing to.


    **Returns:**
    - an integer code that indicates the type
      of the event the cursor is pointing to.



---

### getLineNumber()
- getLineNumber(): [Number](TopLevel.Number.md)
  - : Returns the line number where the current event ends or -1 if none is
      available.


    **Returns:**
    - the line number or -1.


---

### getLocalName()
- getLocalName(): [String](TopLevel.String.md)
  - : Returns the (local) name of the current event.
      For START\_ELEMENT or END\_ELEMENT returns the (local) name of the current element.
      For ENTITY\_REFERENCE it returns entity name.
      The current event must be START\_ELEMENT or END\_ELEMENT,
      or ENTITY\_REFERENCE.


    **Returns:**
    - the local name.


---

### getNamespaceCount()
- getNamespaceCount(): [Number](TopLevel.Number.md)
  - : Returns the count of namespaces declared on this START\_ELEMENT or END\_ELEMENT,
      this method is only valid on a START\_ELEMENT, END\_ELEMENT or NAMESPACE. On
      an END\_ELEMENT the count is of the namespaces that are about to go
      out of scope.  This is the equivalent of the information reported
      by SAX callback for an end element event.


    **Returns:**
    - returns the number of namespace declarations on this specific element.


---

### getNamespacePrefix(Number)
- getNamespacePrefix(index: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Returns the prefix for the namespace declared at the
      index.  Returns null if this is the default namespace
      declaration.


    **Parameters:**
    - index - the position of the namespace declaration.

    **Returns:**
    - returns the namespace prefix.


---

### getNamespaceURI()
- getNamespaceURI(): [String](TopLevel.String.md)
  - : If the current event is a START\_ELEMENT or END\_ELEMENT  this method
      returns the URI of the prefix or the default namespace.
      Returns null if the event does not have a prefix.


    **Returns:**
    - the URI bound to this elements prefix, the default namespace, or null.


---

### getNamespaceURI(Number)
- getNamespaceURI(index: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Returns the uri for the namespace declared at the
      index.


    **Parameters:**
    - index - the position of the namespace declaration.

    **Returns:**
    - returns the namespace uri.


---

### getNamespaceURI(String)
- getNamespaceURI(prefix: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Return the uri for the given prefix.
      The uri returned depends on the current state of the processor.
      
      
      **NOTE:**The 'xml' prefix is bound as defined in
      [Namespaces in XML](http://www.w3.org/TR/REC-xml-names/\#ns-using)
      specification to "http://www.w3.org/XML/1998/namespace".
      
      
      **NOTE:** The 'xmlns' prefix must be resolved to following namespace
      [http://www.w3.org/2000/xmlns/](http://www.w3.org/2000/xmlns/)


    **Parameters:**
    - prefix - The prefix to lookup, may not be null

    **Returns:**
    - the uri bound to the given prefix or null if it is not bound


---

### getPIData()
- getPIData(): [String](TopLevel.String.md)
  - : Get the data section of a processing instruction.

    **Returns:**
    - the data or null.


---

### getPITarget()
- getPITarget(): [String](TopLevel.String.md)
  - : Get the target of a processing instruction.

    **Returns:**
    - the target or null.


---

### getPrefix()
- getPrefix(): [String](TopLevel.String.md)
  - : Returns the prefix of the current event or null if the event does not have a prefix

    **Returns:**
    - the prefix or null.


---

### getText()
- getText(): [String](TopLevel.String.md)
  - : Returns the current value of the parse event as a string,
      this returns the string value of a CHARACTERS event,
      returns the value of a COMMENT, the replacement value
      for an ENTITY\_REFERENCE, the string value of a CDATA section,
      the string value for a SPACE event,
      or the String value of the internal subset of the DTD.
      If an ENTITY\_REFERENCE has been resolved, any character data
      will be reported as CHARACTERS events.


    **Returns:**
    - the current text or null.


---

### getTextLength()
- getTextLength(): [Number](TopLevel.Number.md)
  - : Returns the length of the sequence of characters for this
      Text event within the text character array.


    **Returns:**
    - the length of the sequence of characters for this
      Text event within the text character array.



---

### getTextStart()
- getTextStart(): [Number](TopLevel.Number.md)
  - : Returns the offset into the text character array where the first
      character (of this text event) is stored.


    **Returns:**
    - the offset into the text character array where the first
      character (of this text event) is stored.



---

### getVersion()
- getVersion(): [String](TopLevel.String.md)
  - : Get the xml version declared on the xml declaration.
      Returns null if none was declared.


    **Returns:**
    - the XML version or null.


---

### getXMLObject()
- ~~getXMLObject(): [Object](TopLevel.Object.md)~~
  - : Reads a sub-tree of the XML document and parses it as XML object.
      
      
      The stream must be positioned on a START\_ELEMENT. Do not call the method
      when the stream is positioned at document's root element. This would
      cause the whole document to be parsed into a single XML what may lead to
      an out-of-memory condition. Instead use \#next() to navigate to
      sub-elements and invoke getXMLObject() there. Do not keep references to
      more than the currently processed XML to keep memory consumption low. The
      method reads the stream up to the matching END\_ELEMENT. When the method
      returns the current event is the END\_ELEMENT event.


    **Deprecated:**
:::warning
Use [readXMLObject()](dw.io.XMLStreamReader.md#readxmlobject)
:::

---

### hasName()
- hasName(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if the current event has a name (is a START\_ELEMENT or END\_ELEMENT)

    **Returns:**
    - true if the current event has a name, false otherwise.


---

### hasNext()
- hasNext(): [Boolean](TopLevel.Boolean.md)
  - : Returns true if there are more parsing events and false
      if there are no more events.  This method will return
      false if the current state of the XMLStreamReader is
      END\_DOCUMENT


    **Returns:**
    - true if there are more events, false otherwise


---

### hasText()
- hasText(): [Boolean](TopLevel.Boolean.md)
  - : Indicates if the current event has text.
      The following events have text:
      CHARACTERS,DTD ,ENTITY\_REFERENCE, COMMENT, SPACE.


    **Returns:**
    - true if the current event has text, false otherwise.


---

### isAttributeSpecified(Number)
- isAttributeSpecified(index: [Number](TopLevel.Number.md)): [Boolean](TopLevel.Boolean.md)
  - : Identifies if this
      attribute was created by default.


    **Parameters:**
    - index - the position of the attribute.

    **Returns:**
    - true if this is a default attribute, false otherwise.


---

### isCharacters()
- isCharacters(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if the cursor points to a character data event.

    **Returns:**
    - true if the cursor points to character data, false otherwise.


---

### isEndElement()
- isEndElement(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if the cursor points to an end tag.

    **Returns:**
    - true if the cursor points to an end tag, false otherwise.


---

### isStandalone()
- isStandalone(): [Boolean](TopLevel.Boolean.md)
  - : Get the standalone declaration from the xml declaration.

    **Returns:**
    - true if this is standalone, or false otherwise.


---

### isStartElement()
- isStartElement(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if the cursor points to a start tag.

    **Returns:**
    - true if the cursor points to a start tag, false otherwise.


---

### isWhiteSpace()
- isWhiteSpace(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if the cursor points to a character data event
      that consists of all whitespace.


    **Returns:**
    - true if the cursor points to all whitespace, false otherwise.


---

### next()
- next(): [Number](TopLevel.Number.md)
  - : Get next parsing event - a processor may return all contiguous
      character data in a single chunk, or it may split it into several chunks.
      If the property javax.xml.stream.isCoalescing is set to true
      element content must be coalesced and only one CHARACTERS event
      must be returned for contiguous element content or
      CDATA Sections.
      
      By default entity references must be
      expanded and reported transparently to the application.
      An exception will be thrown if an entity reference cannot be expanded.
      If element content is empty (i.e. content is "") then no CHARACTERS event will be reported.
      
      
      Given the following XML:
      
      <foo><!--description-->content text<!&#91;CDATA&#91;<greeting>Hello</greeting>&#93;&#93;>other content</foo>
      
      The behavior of calling next() when being on foo will be:
      
      1- the comment (COMMENT)
      
      2- then the characters section (CHARACTERS)
      
      3- then the CDATA section (another CHARACTERS)
      
      4- then the next characters section (another CHARACTERS)
      
      5- then the END\_ELEMENT
      
      
      
      **NOTE:** empty element (such as <tag/>) will be reported
       with  two separate events: START\_ELEMENT, END\_ELEMENT - This preserves
        parsing equivalency of empty element to <tag></tag>.
      
      This method will throw an IllegalStateException if it is called after hasNext() returns false.


    **Returns:**
    - the integer code corresponding to the current parse event


---

### nextTag()
- nextTag(): [Number](TopLevel.Number.md)
  - : Skips any white space (isWhiteSpace() returns true), COMMENT,
      or PROCESSING\_INSTRUCTION,
      until a START\_ELEMENT or END\_ELEMENT is reached.
      If other than white space characters, COMMENT, PROCESSING\_INSTRUCTION, START\_ELEMENT, END\_ELEMENT
      are encountered, an exception is thrown. This method should
      be used when processing element-only content separated by white space.
      
      
       Precondition: none
      
       Postcondition: the current event is START\_ELEMENT or END\_ELEMENT
      and cursor may have moved over any whitespace event.
      
      
      Essentially it does the following (implementations are free to optimized
      but must do equivalent processing):
      
      
      ```
      int eventType = next();
      while ( (eventType == XMLStreamConstants.CHARACTERS && isWhiteSpace() )
            || (eventType == XMLStreamConstants.CDATA && isWhiteSpace())
            || eventType == XMLStreamConstants.SPACE
            || eventType == XMLStreamConstants.PROCESSING_INSTRUCTION
            || eventType == XMLStreamConstants.COMMENT )
      {
          eventType = next();
      }
      if ( eventType != XMLStreamConstants.START_ELEMENT && eventType != XMLStreamConstants.END_ELEMENT )
      {
          throw new String XMLStreamException( "expected start or end tag", getLocation() );
      }
      return eventType;
      ```


    **Returns:**
    - the event type of the element read (START\_ELEMENT or END\_ELEMENT)


---

### readElementText()
- readElementText(): [String](TopLevel.String.md)
  - : Reads the content of a text-only element, an exception is thrown if this is not a text-only element. This method
      always returns coalesced content. 
      
      Precondition: the current event is START\_ELEMENT. 
      
      Postcondition: the current event is the corresponding END\_ELEMENT. 
      
      The method does the following (implementations are free to be optimized but must do equivalent processing):
      
      
      ```
      if ( getEventType() != XMLStreamConstants.START_ELEMENT )
      {
          throw new XMLStreamException( "parser must be on START_ELEMENT to read next text", getLocation() );
      }
      int eventType = next();
      StringBuffer content = new StringBuffer();
      while ( eventType != XMLStreamConstants.END_ELEMENT )
      {
          if ( eventType == XMLStreamConstants.CHARACTERS || eventType == XMLStreamConstants.CDATA
              || eventType == XMLStreamConstants.SPACE || eventType == XMLStreamConstants.ENTITY_REFERENCE )
          {
              buf.append( getText() );
          }
          else if ( eventType == XMLStreamConstants.PROCESSING_INSTRUCTION || eventType == XMLStreamConstants.COMMENT )
          {
              // skipping
          }
          else if ( eventType == XMLStreamConstants.END_DOCUMENT )
          {
              throw new XMLStreamException( "unexpected end of document when reading element text content", this );
          }
          else if ( eventType == XMLStreamConstants.START_ELEMENT )
          {
              throw new XMLStreamException( "element text content may not contain START_ELEMENT", getLocation() );
          }
          else
          {
              throw new XMLStreamException( "Unexpected event type " + eventType, getLocation() );
          }
          eventType = next();
      }
      return buf.toString();
      ```



---

### readXMLObject()
- readXMLObject(): [Object](TopLevel.Object.md)
  - : Reads a sub-tree of the XML document and parses it as XML object.
      
      
      The stream must be positioned on a START\_ELEMENT. Do not call the method
      when the stream is positioned at document's root element. This would
      cause the whole document to be parsed into a single XML what may lead to
      an out-of-memory condition. Instead use \#next() to navigate to
      sub-elements and invoke getXMLObject() there. Do not keep references to
      more than the currently processed XML to keep memory consumption low. The
      method reads the stream up to the matching END\_ELEMENT. When the method
      returns the current event is the END\_ELEMENT event.



---

### require(Number, String, String)
- require(type: [Number](TopLevel.Number.md), namespaceURI: [String](TopLevel.String.md), localName: [String](TopLevel.String.md)): void
  - : Test if the current event is of the given type and if the namespace and name match the current
      namespace and name of the current event.  If the namespaceURI is null it is not checked for equality,
      if the localName is null it is not checked for equality.


    **Parameters:**
    - type - the event type
    - namespaceURI - the uri of the event, may be null
    - localName - the localName of the event, may be null


---

### standaloneSet()
- standaloneSet(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if standalone was set in the document.

    **Returns:**
    - true if standalone was set in the document, false otherwise.


---

<!-- prettier-ignore-end -->
