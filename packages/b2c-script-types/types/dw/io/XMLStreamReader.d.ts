import Reader = require('./Reader');

/**
 * The XMLStreamReader allows forward, read-only access to XML.  It is designed
 * to be the lowest level and most efficient way to read XML data.
 * 
 * The XMLStreamReader is designed to iterate over XML using
 * next() and hasNext().  The data can be accessed using methods such as getEventType(),
 * getNamespaceURI(), getLocalName() and getText();
 * 
 * The next method causes the reader to read the next parse event.
 * The next() method returns an integer which identifies the type of event just read.
 * 
 * The event type can be determined using getEventType.
 * 
 * Parsing events are defined as the XML Declaration, a DTD,
 * start tag, character data, white space, end tag, comment,
 * or processing instruction.  An attribute or namespace event may be encountered
 * at the root level of a document as the result of a query operation.
 * 
 * The following table describes which methods are valid in what state.
 * If a method is called in an invalid state the method will throw a
 * java.lang.IllegalStateException.
 * 
 * Valid methods for each state
 * 
 * Event Type
 * Valid Methods
 * 
 * All States
 * getProperty(), hasNext(), require(), close(),
 * getNamespaceURI(), isStartElement(),
 * isEndElement(), isCharacters(), isWhiteSpace(),
 * getNamespaceContext(), getEventType(),getLocation(),
 * hasText(), hasName()
 * 
 * START_ELEMENT
 * next(), getName(), getLocalName(), hasName(), getPrefix(),
 * getAttributeXXX(), isAttributeSpecified(),
 * getNamespaceXXX(),
 * getElementText(), nextTag(), getXMLObject()
 * 
 * ATTRIBUTE
 * next(), nextTag()
 * getAttributeXXX(), isAttributeSpecified(),
 * 
 * NAMESPACE
 * next(), nextTag()
 * getNamespaceXXX()
 * 
 * END_ELEMENT
 * next(), getName(), getLocalName(), hasName(), getPrefix(),
 * getNamespaceXXX(), nextTag()
 * 
 * CHARACTERS
 * next(), getTextXXX(), nextTag()
 * 
 * CDATA
 * next(), getTextXXX(), nextTag()
 * 
 * COMMENT
 * next(), getTextXXX(), nextTag()
 * 
 * SPACE
 * next(), getTextXXX(), nextTag()
 * 
 * START_DOCUMENT
 * next(), getEncoding(), getVersion(), isStandalone(), standaloneSet(),
 * getCharacterEncodingScheme(), nextTag()
 * 
 * END_DOCUMENT
 * close()
 * 
 * PROCESSING_INSTRUCTION
 * next(), getPITarget(), getPIData(), nextTag()
 * 
 * ENTITY_REFERENCE
 * next(), getLocalName(), getText(), nextTag()
 * 
 * DTD
 * next(), getText(), nextTag()
 * 
 * The following is a code sample to read an XML file containing multiple
 * "myobject" sub-elements.  Only one myObject instance is kept in memory at
 * any given time to keep memory consumption low:
 * @example
 * var fileReader : FileReader = new FileReader(file, "UTF-8");
 * var xmlStreamReader : XMLStreamReader = new XMLStreamReader(fileReader);
 * 
 * while (xmlStreamReader.hasNext())
 * {
 * if (xmlStreamReader.next() == XMLStreamConstants.START_ELEMENT)
 * {
 * var localElementName : String = xmlStreamReader.getLocalName();
 * if (localElementName == "myobject")
 * {
 * // read single "myobject" as XML
 * var myObject : XML = xmlStreamReader.getXMLObject();
 * 
 * // process myObject
 * }
 * }
 * }
 * 
 * xmlStreamReader.close();
 * fileReader.close();
 */
declare class XMLStreamReader {
    /**
     * Get the data section of a processing instruction.
     */
    readonly PIData: string | null;
    /**
     * Get the target of a processing instruction.
     */
    readonly PITarget: string | null;
    /**
     * Reads a sub-tree of the XML document and parses it as XML object.
     * 
     * The stream must be positioned on a START_ELEMENT. Do not call the method
     * when the stream is positioned at document's root element. This would
     * cause the whole document to be parsed into a single XML what may lead to
     * an out-of-memory condition. Instead use #next() to navigate to
     * sub-elements and invoke getXMLObject() there. Do not keep references to
     * more than the currently processed XML to keep memory consumption low. The
     * method reads the stream up to the matching END_ELEMENT. When the method
     * returns the current event is the END_ELEMENT event.
     * @deprecated Use readXMLObject
     */
    readonly XMLObject: any;
    /**
     * Returns the count of attributes on this START_ELEMENT,
     * this method is only valid on a START_ELEMENT or ATTRIBUTE.  This
     * count excludes namespace definitions.  Attribute indices are
     * zero-based.
     */
    readonly attributeCount: number;
    /**
     * Returns the character encoding declared on the XML declaration
     * Returns null if none was declared.
     */
    readonly characterEncodingScheme: string | null;
    /**
     * Identifies if the cursor points to a character data event.
     */
    readonly characters: boolean;
    /**
     * Returns the column number where the current event ends or -1 if none is
     * available.
     */
    readonly columnNumber: number;
    /**
     * Reads the content of a text-only element, an exception is thrown if this is not a text-only element. This method
     * always returns coalesced content.
     * 
     * Precondition: the current event is START_ELEMENT.
     * 
     * Postcondition: the current event is the corresponding END_ELEMENT.
     * 
     * The method does the following (implementations are free to be optimized but must do equivalent processing):
     * @example
     * if ( getEventType() != XMLStreamConstants.START_ELEMENT )
     * {
     * throw new XMLStreamException( "parser must be on START_ELEMENT to read next text", getLocation() );
     * }
     * int eventType = next();
     * StringBuffer content = new StringBuffer();
     * while ( eventType != XMLStreamConstants.END_ELEMENT )
     * {
     * if ( eventType == XMLStreamConstants.CHARACTERS || eventType == XMLStreamConstants.CDATA
     * || eventType == XMLStreamConstants.SPACE || eventType == XMLStreamConstants.ENTITY_REFERENCE )
     * {
     * buf.append( getText() );
     * }
     * else if ( eventType == XMLStreamConstants.PROCESSING_INSTRUCTION || eventType == XMLStreamConstants.COMMENT )
     * {
     * // skipping
     * }
     * else if ( eventType == XMLStreamConstants.END_DOCUMENT )
     * {
     * throw new XMLStreamException( "unexpected end of document when reading element text content", this );
     * }
     * else if ( eventType == XMLStreamConstants.START_ELEMENT )
     * {
     * throw new XMLStreamException( "element text content may not contain START_ELEMENT", getLocation() );
     * }
     * else
     * {
     * throw new XMLStreamException( "Unexpected event type " + eventType, getLocation() );
     * }
     * eventType = next();
     * }
     * return buf.toString();
     * @deprecated Use readElementText
     */
    readonly elementText: string;
    /**
     * Return input encoding if known or null if unknown.
     */
    readonly encoding: string | null;
    /**
     * Identifies if the cursor points to an end tag.
     */
    readonly endElement: boolean;
    /**
     * Returns an integer code that indicates the type
     * of the event the cursor is pointing to.
     */
    readonly eventType: number;
    /**
     * Returns the line number where the current event ends or -1 if none is
     * available.
     */
    readonly lineNumber: number;
    /**
     * Returns the (local) name of the current event.
     * For START_ELEMENT or END_ELEMENT returns the (local) name of the current element.
     * For ENTITY_REFERENCE it returns entity name.
     * The current event must be START_ELEMENT or END_ELEMENT,
     * or ENTITY_REFERENCE.
     */
    readonly localName: string;
    /**
     * Returns the count of namespaces declared on this START_ELEMENT or END_ELEMENT,
     * this method is only valid on a START_ELEMENT, END_ELEMENT or NAMESPACE. On
     * an END_ELEMENT the count is of the namespaces that are about to go
     * out of scope.  This is the equivalent of the information reported
     * by SAX callback for an end element event.
     */
    readonly namespaceCount: number;
    /**
     * If the current event is a START_ELEMENT or END_ELEMENT  this method
     * returns the URI of the prefix or the default namespace.
     * Returns null if the event does not have a prefix.
     */
    readonly namespaceURI: string | null;
    /**
     * Returns the prefix of the current event or null if the event does not have a prefix
     */
    readonly prefix: string | null;
    /**
     * Get the standalone declaration from the xml declaration.
     */
    readonly standalone: boolean;
    /**
     * Identifies if the cursor points to a start tag.
     */
    readonly startElement: boolean;
    /**
     * Returns the current value of the parse event as a string,
     * this returns the string value of a CHARACTERS event,
     * returns the value of a COMMENT, the replacement value
     * for an ENTITY_REFERENCE, the string value of a CDATA section,
     * the string value for a SPACE event,
     * or the String value of the internal subset of the DTD.
     * If an ENTITY_REFERENCE has been resolved, any character data
     * will be reported as CHARACTERS events.
     */
    readonly text: string | null;
    /**
     * Returns the length of the sequence of characters for this
     * Text event within the text character array.
     */
    readonly textLength: number;
    /**
     * Returns the offset into the text character array where the first
     * character (of this text event) is stored.
     */
    readonly textStart: number;
    /**
     * Get the xml version declared on the xml declaration.
     * Returns null if none was declared.
     */
    readonly version: string | null;
    /**
     * Identifies if the cursor points to a character data event
     * that consists of all whitespace.
     */
    readonly whiteSpace: boolean;
    /**
     * Constructs the stream readon on behalf of the reader.
     */
    constructor(reader: Reader);
    /**
     * Frees any resources associated with this Reader.  This method does not close the
     * underlying reader.
     */
    close(): void;
    /**
     * Returns the count of attributes on this START_ELEMENT,
     * this method is only valid on a START_ELEMENT or ATTRIBUTE.  This
     * count excludes namespace definitions.  Attribute indices are
     * zero-based.
     */
    getAttributeCount(): number;
    /**
     * Returns the localName of the attribute at the provided
     * index.
     */
    getAttributeLocalName(index: number): string;
    /**
     * Returns the namespace of the attribute at the provided
     * index.
     */
    getAttributeNamespace(index: number): string;
    /**
     * Returns the prefix of this attribute at the
     * provided index.
     */
    getAttributePrefix(index: number): string;
    /**
     * Returns the XML type of the attribute at the provided
     * index.
     */
    getAttributeType(index: number): string;
    /**
     * Returns the normalized attribute value of the
     * attribute with the namespace and localName
     * If the namespaceURI is null the namespace
     * is not checked for equality
     */
    getAttributeValue(namespaceURI: string, localName: string): string | null;
    /**
     * Returns the value of the attribute at the
     * index.
     */
    getAttributeValue(index: number): string;
    /**
     * Returns the character encoding declared on the XML declaration
     * Returns null if none was declared.
     */
    getCharacterEncodingScheme(): string | null;
    /**
     * Returns the column number where the current event ends or -1 if none is
     * available.
     */
    getColumnNumber(): number;
    /**
     * Reads the content of a text-only element, an exception is thrown if this is not a text-only element. This method
     * always returns coalesced content.
     * 
     * Precondition: the current event is START_ELEMENT.
     * 
     * Postcondition: the current event is the corresponding END_ELEMENT.
     * 
     * The method does the following (implementations are free to be optimized but must do equivalent processing):
     * @example
     * if ( getEventType() != XMLStreamConstants.START_ELEMENT )
     * {
     * throw new XMLStreamException( "parser must be on START_ELEMENT to read next text", getLocation() );
     * }
     * int eventType = next();
     * StringBuffer content = new StringBuffer();
     * while ( eventType != XMLStreamConstants.END_ELEMENT )
     * {
     * if ( eventType == XMLStreamConstants.CHARACTERS || eventType == XMLStreamConstants.CDATA
     * || eventType == XMLStreamConstants.SPACE || eventType == XMLStreamConstants.ENTITY_REFERENCE )
     * {
     * buf.append( getText() );
     * }
     * else if ( eventType == XMLStreamConstants.PROCESSING_INSTRUCTION || eventType == XMLStreamConstants.COMMENT )
     * {
     * // skipping
     * }
     * else if ( eventType == XMLStreamConstants.END_DOCUMENT )
     * {
     * throw new XMLStreamException( "unexpected end of document when reading element text content", this );
     * }
     * else if ( eventType == XMLStreamConstants.START_ELEMENT )
     * {
     * throw new XMLStreamException( "element text content may not contain START_ELEMENT", getLocation() );
     * }
     * else
     * {
     * throw new XMLStreamException( "Unexpected event type " + eventType, getLocation() );
     * }
     * eventType = next();
     * }
     * return buf.toString();
     * @deprecated Use readElementText
     */
    getElementText(): string;
    /**
     * Return input encoding if known or null if unknown.
     */
    getEncoding(): string | null;
    /**
     * Returns an integer code that indicates the type
     * of the event the cursor is pointing to.
     */
    getEventType(): number;
    /**
     * Returns the line number where the current event ends or -1 if none is
     * available.
     */
    getLineNumber(): number;
    /**
     * Returns the (local) name of the current event.
     * For START_ELEMENT or END_ELEMENT returns the (local) name of the current element.
     * For ENTITY_REFERENCE it returns entity name.
     * The current event must be START_ELEMENT or END_ELEMENT,
     * or ENTITY_REFERENCE.
     */
    getLocalName(): string;
    /**
     * Returns the count of namespaces declared on this START_ELEMENT or END_ELEMENT,
     * this method is only valid on a START_ELEMENT, END_ELEMENT or NAMESPACE. On
     * an END_ELEMENT the count is of the namespaces that are about to go
     * out of scope.  This is the equivalent of the information reported
     * by SAX callback for an end element event.
     */
    getNamespaceCount(): number;
    /**
     * Returns the prefix for the namespace declared at the
     * index.  Returns null if this is the default namespace
     * declaration.
     */
    getNamespacePrefix(index: number): string | null;
    /**
     * Return the uri for the given prefix.
     * The uri returned depends on the current state of the processor.
     * 
     * NOTE:The 'xml' prefix is bound as defined in
     * Namespaces in XML
     * specification to "http://www.w3.org/XML/1998/namespace".
     * 
     * NOTE: The 'xmlns' prefix must be resolved to following namespace
     * http://www.w3.org/2000/xmlns/
     */
    getNamespaceURI(prefix: string): string | null;
    /**
     * Returns the uri for the namespace declared at the
     * index.
     */
    getNamespaceURI(index: number): string;
    /**
     * If the current event is a START_ELEMENT or END_ELEMENT  this method
     * returns the URI of the prefix or the default namespace.
     * Returns null if the event does not have a prefix.
     */
    getNamespaceURI(): string | null;
    /**
     * Get the data section of a processing instruction.
     */
    getPIData(): string | null;
    /**
     * Get the target of a processing instruction.
     */
    getPITarget(): string | null;
    /**
     * Returns the prefix of the current event or null if the event does not have a prefix
     */
    getPrefix(): string | null;
    /**
     * Returns the current value of the parse event as a string,
     * this returns the string value of a CHARACTERS event,
     * returns the value of a COMMENT, the replacement value
     * for an ENTITY_REFERENCE, the string value of a CDATA section,
     * the string value for a SPACE event,
     * or the String value of the internal subset of the DTD.
     * If an ENTITY_REFERENCE has been resolved, any character data
     * will be reported as CHARACTERS events.
     */
    getText(): string | null;
    /**
     * Returns the length of the sequence of characters for this
     * Text event within the text character array.
     */
    getTextLength(): number;
    /**
     * Returns the offset into the text character array where the first
     * character (of this text event) is stored.
     */
    getTextStart(): number;
    /**
     * Get the xml version declared on the xml declaration.
     * Returns null if none was declared.
     */
    getVersion(): string | null;
    /**
     * Reads a sub-tree of the XML document and parses it as XML object.
     * 
     * The stream must be positioned on a START_ELEMENT. Do not call the method
     * when the stream is positioned at document's root element. This would
     * cause the whole document to be parsed into a single XML what may lead to
     * an out-of-memory condition. Instead use #next() to navigate to
     * sub-elements and invoke getXMLObject() there. Do not keep references to
     * more than the currently processed XML to keep memory consumption low. The
     * method reads the stream up to the matching END_ELEMENT. When the method
     * returns the current event is the END_ELEMENT event.
     * @deprecated Use readXMLObject
     */
    getXMLObject(): any;
    /**
     * Identifies if the current event has a name (is a START_ELEMENT or END_ELEMENT)
     */
    hasName(): boolean;
    /**
     * Returns true if there are more parsing events and false
     * if there are no more events.  This method will return
     * false if the current state of the XMLStreamReader is
     * END_DOCUMENT
     */
    hasNext(): boolean;
    /**
     * Indicates if the current event has text.
     * The following events have text:
     * CHARACTERS,DTD ,ENTITY_REFERENCE, COMMENT, SPACE.
     */
    hasText(): boolean;
    /**
     * Identifies if this
     * attribute was created by default.
     */
    isAttributeSpecified(index: number): boolean;
    /**
     * Identifies if the cursor points to a character data event.
     */
    isCharacters(): boolean;
    /**
     * Identifies if the cursor points to an end tag.
     */
    isEndElement(): boolean;
    /**
     * Get the standalone declaration from the xml declaration.
     */
    isStandalone(): boolean;
    /**
     * Identifies if the cursor points to a start tag.
     */
    isStartElement(): boolean;
    /**
     * Identifies if the cursor points to a character data event
     * that consists of all whitespace.
     */
    isWhiteSpace(): boolean;
    /**
     * Get next parsing event - a processor may return all contiguous
     * character data in a single chunk, or it may split it into several chunks.
     * If the property javax.xml.stream.isCoalescing is set to true
     * element content must be coalesced and only one CHARACTERS event
     * must be returned for contiguous element content or
     * CDATA Sections.
     * 
     * By default entity references must be
     * expanded and reported transparently to the application.
     * An exception will be thrown if an entity reference cannot be expanded.
     * If element content is empty (i.e. content is "") then no CHARACTERS event will be reported.
     * 
     * Given the following XML:
     * 
     * <foo><!--description-->content text<!&#91;CDATA&#91;<greeting>Hello</greeting>&#93;&#93;>other content</foo>
     * 
     * The behavior of calling next() when being on foo will be:
     * 
     * 1- the comment (COMMENT)
     * 
     * 2- then the characters section (CHARACTERS)
     * 
     * 3- then the CDATA section (another CHARACTERS)
     * 
     * 4- then the next characters section (another CHARACTERS)
     * 
     * 5- then the END_ELEMENT
     * 
     * NOTE: empty element (such as <tag/>) will be reported
     * with  two separate events: START_ELEMENT, END_ELEMENT - This preserves
     * parsing equivalency of empty element to <tag></tag>.
     * 
     * This method will throw an IllegalStateException if it is called after hasNext() returns false.
     */
    next(): number;
    /**
     * Skips any white space (isWhiteSpace() returns true), COMMENT,
     * or PROCESSING_INSTRUCTION,
     * until a START_ELEMENT or END_ELEMENT is reached.
     * If other than white space characters, COMMENT, PROCESSING_INSTRUCTION, START_ELEMENT, END_ELEMENT
     * are encountered, an exception is thrown. This method should
     * be used when processing element-only content separated by white space.
     * 
     * Precondition: none
     * 
     * Postcondition: the current event is START_ELEMENT or END_ELEMENT
     * and cursor may have moved over any whitespace event.
     * 
     * Essentially it does the following (implementations are free to optimized
     * but must do equivalent processing):
     * @example
     * int eventType = next();
     * while ( (eventType == XMLStreamConstants.CHARACTERS && isWhiteSpace() )
     * || (eventType == XMLStreamConstants.CDATA && isWhiteSpace())
     * || eventType == XMLStreamConstants.SPACE
     * || eventType == XMLStreamConstants.PROCESSING_INSTRUCTION
     * || eventType == XMLStreamConstants.COMMENT )
     * {
     * eventType = next();
     * }
     * if ( eventType != XMLStreamConstants.START_ELEMENT && eventType != XMLStreamConstants.END_ELEMENT )
     * {
     * throw new String XMLStreamException( "expected start or end tag", getLocation() );
     * }
     * return eventType;
     */
    nextTag(): number;
    /**
     * Reads the content of a text-only element, an exception is thrown if this is not a text-only element. This method
     * always returns coalesced content.
     * 
     * Precondition: the current event is START_ELEMENT.
     * 
     * Postcondition: the current event is the corresponding END_ELEMENT.
     * 
     * The method does the following (implementations are free to be optimized but must do equivalent processing):
     * @example
     * if ( getEventType() != XMLStreamConstants.START_ELEMENT )
     * {
     * throw new XMLStreamException( "parser must be on START_ELEMENT to read next text", getLocation() );
     * }
     * int eventType = next();
     * StringBuffer content = new StringBuffer();
     * while ( eventType != XMLStreamConstants.END_ELEMENT )
     * {
     * if ( eventType == XMLStreamConstants.CHARACTERS || eventType == XMLStreamConstants.CDATA
     * || eventType == XMLStreamConstants.SPACE || eventType == XMLStreamConstants.ENTITY_REFERENCE )
     * {
     * buf.append( getText() );
     * }
     * else if ( eventType == XMLStreamConstants.PROCESSING_INSTRUCTION || eventType == XMLStreamConstants.COMMENT )
     * {
     * // skipping
     * }
     * else if ( eventType == XMLStreamConstants.END_DOCUMENT )
     * {
     * throw new XMLStreamException( "unexpected end of document when reading element text content", this );
     * }
     * else if ( eventType == XMLStreamConstants.START_ELEMENT )
     * {
     * throw new XMLStreamException( "element text content may not contain START_ELEMENT", getLocation() );
     * }
     * else
     * {
     * throw new XMLStreamException( "Unexpected event type " + eventType, getLocation() );
     * }
     * eventType = next();
     * }
     * return buf.toString();
     */
    readElementText(): string;
    /**
     * Reads a sub-tree of the XML document and parses it as XML object.
     * 
     * The stream must be positioned on a START_ELEMENT. Do not call the method
     * when the stream is positioned at document's root element. This would
     * cause the whole document to be parsed into a single XML what may lead to
     * an out-of-memory condition. Instead use #next() to navigate to
     * sub-elements and invoke getXMLObject() there. Do not keep references to
     * more than the currently processed XML to keep memory consumption low. The
     * method reads the stream up to the matching END_ELEMENT. When the method
     * returns the current event is the END_ELEMENT event.
     */
    readXMLObject(): any;
    /**
     * Test if the current event is of the given type and if the namespace and name match the current
     * namespace and name of the current event.  If the namespaceURI is null it is not checked for equality,
     * if the localName is null it is not checked for equality.
     */
    require(type: number, namespaceURI: string | null, localName: string | null): void;
    /**
     * Identifies if standalone was set in the document.
     */
    standaloneSet(): boolean;
}

export = XMLStreamReader;
