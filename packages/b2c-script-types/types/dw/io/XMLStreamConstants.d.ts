/**
 * Useful constants for working with XML streams.
 */
declare class XMLStreamConstants {
    /**
     * Represents an attribute in an element.
     */
    static readonly ATTRIBUTE = 10;
    /**
     * Represents a CDATA section in an element.
     */
    static readonly CDATA = 12;
    /**
     * Represents the character data in an XML document.
     */
    static readonly CHARACTERS = 4;
    /**
     * Represents a comment in an XML document.
     */
    static readonly COMMENT = 5;
    /**
     * Represents the document type definition.
     */
    static readonly DTD = 11;
    /**
     * Represents the end of an XML document.
     */
    static readonly END_DOCUMENT = 8;
    /**
     * Represents the end of an element in an XML document.
     */
    static readonly END_ELEMENT = 2;
    /**
     * Represents the entity declaration in an XML document.
     */
    static readonly ENTITY_DECLARATION = 15;
    /**
     * Represents an entity reference in an XML document.
     */
    static readonly ENTITY_REFERENCE = 9;
    /**
     * Represents a namespace declaration in an XML document.
     */
    static readonly NAMESPACE = 13;
    /**
     * Represents the notation declaration in an XML document.
     */
    static readonly NOTATION_DECLARATION = 14;
    /**
     * Represents processing instruction in an XML document.
     */
    static readonly PROCESSING_INSTRUCTION = 3;
    /**
     * Represents a space in an XML document.
     */
    static readonly SPACE = 6;
    /**
     * Represents the start of an XML document.
     */
    static readonly START_DOCUMENT = 7;
    /**
     * Represents the start of an element in an XML document.
     */
    static readonly START_ELEMENT = 1;
    private constructor();
}

export = XMLStreamConstants;
