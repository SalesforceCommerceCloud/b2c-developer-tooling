import Writer = require('./Writer');

/**
 * The XMLStreamWriter can be used to write small and large XML feeds.
 * 
 * Note: when this class is used with sensitive data, be careful in persisting sensitive information to disk.
 * 
 * The XMLStreamWriter does not perform well-formedness checking on its input.
 * However the writeCharacters method escapes '&' , '<' and '>'. For attribute
 * values the writeAttribute method escapes the above characters plus '"' to
 * ensure that all character content and attribute values are well formed.
 * 
 * The following example illustrates how to use this class:
 * 
 * ```
 * var fileWriter : FileWriter = new FileWriter(file, "UTF-8");
 * var xsw : XMLStreamWriter = new XMLStreamWriter(fileWriter);
 * 
 * xsw.writeStartDocument();
 * xsw.writeStartElement("products");
 * xsw.writeStartElement("product");
 * xsw.writeAttribute("id", "p42");
 * xsw.writeStartElement("name");
 * xsw.writeCharacters("blue t-shirt");
 * xsw.writeEndElement();
 * xsw.writeStartElement("rating");
 * xsw.writeCharacters("2.0");
 * xsw.writeEndElement();
 * xsw.writeEndElement();
 * xsw.writeEndElement();
 * xsw.writeEndDocument();
 * 
 * xsw.close();
 * fileWriter.close();
 * ```
 * 
 * The code above will write the following to file:
 * 
 * ```
 * <?xml version="1.0" ?>
 * <products>
 * <product id="p42">
 * <name>a blue t-shirt</name>
 * <rating>2.0</rating>
 * </product>
 * </products>
 * ```
 * 
 * Note:  This output has been formatted for readability. See
 * dw.io.XMLIndentingStreamWriter.
 */
declare class XMLStreamWriter {
    /**
     * Returns the current default name space.
     */
    defaultNamespace: string;
    /**
     * Constructs the XMLStreamWriter for a writer.
     */
    constructor(writer: Writer);
    /**
     * Close this writer and free any resources associated with the
     * writer.  This method does not close the underlying writer.
     */
    close(): void;
    /**
     * Write any cached data to the underlying output mechanism.
     */
    flush(): void;
    /**
     * Returns the current default name space.
     */
    getDefaultNamespace(): string;
    /**
     * Gets the prefix the URI is bound to.
     */
    getPrefix(uri: string): string | null;
    /**
     * Binds a URI to the default namespace.
     * This URI is bound
     * in the scope of the current START_ELEMENT / END_ELEMENT pair.
     * If this method is called before a START_ELEMENT has been written
     * the uri is bound in the root scope.
     */
    setDefaultNamespace(uri: string | null): void;
    /**
     * Sets the prefix the uri is bound to.  This prefix is bound
     * in the scope of the current START_ELEMENT / END_ELEMENT pair.
     * If this method is called before a START_ELEMENT has been written
     * the prefix is bound in the root scope.
     */
    setPrefix(prefix: string, uri: string | null): void;
    /**
     * Writes an attribute to the output stream without
     * a prefix.
     */
    writeAttribute(localName: string, value: string): void;
    /**
     * Writes an attribute to the output stream.
     */
    writeAttribute(prefix: string, namespaceURI: string, localName: string, value: string): void;
    /**
     * Writes an attribute to the output stream.
     */
    writeAttribute(namespaceURI: string, localName: string, value: string): void;
    /**
     * Writes a CData section.
     */
    writeCData(data: string): void;
    /**
     * Write text to the output.
     */
    writeCharacters(text: string): void;
    /**
     * Writes an XML comment with the data enclosed.
     */
    writeComment(data: string | null): void;
    /**
     * Write a DTD section.  This string represents the entire doctypedecl production
     * from the XML 1.0 specification.
     */
    writeDTD(dtd: string): void;
    /**
     * Writes the default namespace to the stream.
     */
    writeDefaultNamespace(namespaceURI: string): void;
    /**
     * Writes an empty element tag to the output.
     */
    writeEmptyElement(namespaceURI: string, localName: string): void;
    /**
     * Writes an empty element tag to the output.
     */
    writeEmptyElement(prefix: string, localName: string, namespaceURI: string): void;
    /**
     * Writes an empty element tag to the output.
     */
    writeEmptyElement(localName: string): void;
    /**
     * Closes any start tags and writes corresponding end tags.
     */
    writeEndDocument(): void;
    /**
     * Writes an end tag to the output relying on the internal
     * state of the writer to determine the prefix and local name
     * of the event.
     */
    writeEndElement(): void;
    /**
     * Writes an entity reference.
     */
    writeEntityRef(name: string): void;
    /**
     * Writes a namespace to the output stream.
     * If the prefix argument to this method is the empty string,
     * "xmlns", or null this method will delegate to writeDefaultNamespace.
     */
    writeNamespace(prefix: string, namespaceURI: string): void;
    /**
     * Writes a processing instruction.
     */
    writeProcessingInstruction(target: string): void;
    /**
     * Writes a processing instruction.
     */
    writeProcessingInstruction(target: string, data: string): void;
    /**
     * Writes the given string directly into the output stream. No checks
     * regarding the correctness of the XML are done. The caller must ensure
     * that the final result is a correct XML.
     */
    writeRaw(raw: string): void;
    /**
     * Write the XML Declaration. Defaults the XML version to 1.0, and the encoding to utf-8
     */
    writeStartDocument(): void;
    /**
     * Write the XML Declaration. Defaults the XML version to 1.0
     */
    writeStartDocument(version: string): void;
    /**
     * Write the XML Declaration.  Note that the encoding parameter does
     * not set the actual encoding of the underlying output.  That must
     * be set when the instance of the XMLStreamWriter is created using the
     * XMLOutputFactory.
     */
    writeStartDocument(encoding: string, version: string): void;
    /**
     * Writes a start tag to the output.  All writeStartElement methods
     * open a new scope in the internal namespace context.  Writing the
     * corresponding EndElement causes the scope to be closed.
     */
    writeStartElement(localName: string): void;
    /**
     * Writes a start tag to the output.
     */
    writeStartElement(namespaceURI: string, localName: string): void;
    /**
     * Writes a start tag to the output.
     */
    writeStartElement(prefix: string, localName: string, namespaceURI: string): void;
}

export = XMLStreamWriter;
