import Namespace = require('./Namespace');

/**
 * QName objects are used to represent qualified names of XML
 * elements and attributes. Each QName object has a local name
 * of type string and a namespace URI of type string or null.
 * When the namespace URI is null, this qualified name matches
 * any namespace.
 * 
 * If the QName of an XML element is specified without identifying a
 * namespace (i.e., as an unqualified identifier), the uri property
 * of the associated QName will be set to the in-scope default
 * namespace. If the QName of an XML attribute is
 * specified without identifying a namespace, the uri property of
 * the associated QName will be the empty string representing no namespace.
 */
declare class QName {
    /**
     * The local name of the QName.
     */
    readonly localName: string;
    /**
     * The Uniform Resource Identifier (URI) of the namespace.
     */
    readonly uri: string;
    /**
     * Constructs a QName object where localName
     * is set to an empty String.
     */
    constructor();
    /**
     * Constructs a QName object that is a copy of the specified
     * qname. If the argument is not
     * a QName object, the argument is converted to a string and assigned
     * to the localName property of the new QName instance.
     */
    constructor(qname: QName);
    /**
     * Creates a QName object with a uri from a Namespace object and
     * a localName from a QName object. If either argument is not
     * the expected data type, the argument is converted to a string
     * and assigned to the corresponding property of the new QName object.
     */
    constructor(uri: Namespace, localName: QName);
    /**
     * Returns the local name of the QName object.
     */
    getLocalName(): string;
    /**
     * Returns the Uniform Resource Identifier (URI) of the QName object.
     */
    getUri(): string;
    /**
     * Returns a string composed of the URI, and the local name for the QName
     * object, separated by "::". The format depends on the uri property of
     * the QName object:
     * If uri == ""
     * toString returns localName
     * else if uri == null
     * toString returns *::localName
     * else
     * toString returns uri::localNam
     */
    toString(): string;
}

export = QName;
