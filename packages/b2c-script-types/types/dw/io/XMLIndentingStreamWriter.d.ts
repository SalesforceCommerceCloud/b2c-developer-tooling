import XMLStreamWriter = require('./XMLStreamWriter');
import Writer = require('./Writer');

/**
 * A XMLIndentingStreamWriter writes the XML output formatted for good
 * readability.
 * 
 * Note: when this class is used with sensitive data, be careful
 * in persisting sensitive information to disk.
 */
declare class XMLIndentingStreamWriter extends XMLStreamWriter {
    /**
     * Returns the indent.
     */
    indent: string;
    /**
     * Returns the string that is used for a new line character. The
     * default is the normal new line character.
     */
    newLine: string;
    /**
     * Constructs the writer for the specified writer.
     */
    constructor(writer: Writer);
    /**
     * Returns the indent.
     */
    getIndent(): string;
    /**
     * Returns the string that is used for a new line character. The
     * default is the normal new line character.
     */
    getNewLine(): string;
    /**
     * Specifies a string that will be used as identing characters. The
     * default are two space characters.
     */
    setIndent(indent: string): void;
    /**
     * Sets the string that is used for a new line character.
     */
    setNewLine(newLine: string): void;
}

export = XMLIndentingStreamWriter;
