import XMLList = require('./XMLList');
import Namespace = require('./Namespace');

/**
 * The XML object contains functions and properties for working with XML
 * instances. The XML object implements the powerful XML-handling standards
 * defined in the ECMA-357 specification (known as "E4X").
 * 
 * Use the toXMLString() method to return a string representation of the XML
 * object regardless of whether the XML object has simple content or complex
 * content.
 * 
 * Do not create large XML objects in memory to avoid out-of-memory conditions.
 * When dealing with XML streams use dw.io.XMLStreamReader and
 * dw.io.XMLStreamWriter. The following example shows how:
 * 
 * ```
 * var id : String = "p42";
 * var pname : String = "a product";
 * 
 * // use E4X syntax
 * var product : XML =
 * <product id={id}>
 * <name>{pname}</name>
 * <shortdesc></shortdesc>
 * </product>;
 * 
 * product.shortdesc = "a fine product";
 * product.longdesc = "this is a fine product";
 * 
 * var xmlString = product.toXMLString();
 * 
 * fileWriter.write(xmlString);
 * ```
 * 
 * The code above will write the following to file:
 * 
 * ```
 * <product id="p42">
 * <name>a product</name>
 * <shortdesc>a fine product</shortdesc>
 * <longdesc>this is a fine product</longdesc>
 * </product>
 * ```
 * 
 * Do not create large XML objects in memory to avoid out-of-memory conditions.
 * When dealing with XML streams use dw.io.XMLStreamReader and
 * dw.io.XMLStreamWriter.
 */
declare class XML {
    /**
     * Returns this XML object.
     */
    valueOf(): XML;
    /**
     * The ignoreComments property determines whether or not XML comments are
     * ignored when XML objects parse the source XML data.
     */
    static ignoreComments: boolean;
    /**
     * The ignoreProcessingInstructions property determines whether or not XML
     * processing instructions are ignored when XML objects parse the source XML data.
     */
    static ignoreProcessingInstructions: boolean;
    /**
     * The ignoreWhitespace property determines whether or not white space
     * characters at the beginning and end of text nodes are ignored during parsing.
     */
    static ignoreWhitespace: boolean;
    /**
     * The prettyIndent property determines the amount of indentation applied by
     * the toString() and toXMLString() methods when the XML.prettyPrinting
     * property is set to true.
     */
    static prettyIndent: number;
    /**
     * The prettyPrinting property determines whether the toString() and toXMLString()
     * methods normalize white space characters between some tags.
     */
    static prettyPrinting: boolean;
    /**
     * Creates a new XML object.
     */
    constructor();
    /**
     * Creates a new XML object.
     * You must use the constructor to create an XML object before you
     * call any of the methods of the XML class.
     * Use the toXMLString() method to return a string representation
     * of the XML object regardless of whether the XML object has simple
     * content or complex content.
     */
    constructor(value: any);
    /**
     * Returns a new Object with the following properties set to the default values:
     * ignoreComments, ignoreProcessingInstructions, ignoreWhitespace, prettyIndent,
     * and prettyPrinting. The default values are as follows:
     * 
     * - ignoreComments = true
     * - ignoreProcessingInstructions = true
     * - ignoreWhitespace = true
     * - prettyIndent = 2
     * - prettyPrinting = true
     * 
     * Be aware that this method does not apply the settings to an existing instance
     * of an XML object. Instead, this method returns an Object containing the
     * default settings.
     */
    static defaultSettings(): any;
    /**
     * Restores the default settings for the following XML
     * properties:
     * 
     * - XML.ignoreComments = true
     * - XML.ignoreProcessingInstructions = true
     * - XML.ignoreWhitespace = true
     * - XML.prettyIndent = 2
     * - XML.prettyPrinting = true
     */
    static setSettings(): void;
    /**
     * Updates the collection of global XML properties:
     * ignoreComments, ignoreProcessingInstructions, ignoreWhitespace,
     * prettyPrinting, prettyIndent, and prettyPrinting.
     */
    static setSettings(settings: any): void;
    /**
     * Returns the collection of global XML properties:
     * ignoreComments, ignoreProcessingInstructions, ignoreWhitespace,
     * prettyPrinting, prettyIndent, and prettyPrinting.
     */
    static settings(): any;
    /**
     * Adds a namespace to the set of in-scope namespaces for the XML object.
     * If the namespace already exists in the in-scope namespaces for the XML
     * object, then the prefix of the existing namespace is set to undefined.
     * If ns is a Namespace instance, it is used directly.
     * However, if ns is a QName instance, the input parameter's URI is used
     * to create a new namespace. If ns is not a Namespace or QName instance,
     * ns is converted to a String and a namespace is created from the String.
     */
    addNamespace(ns: any): XML;
    /**
     * Appends the specified child to the end of the object's properties.
     * child should be a XML object, an XMLList object or any other
     * data type that will then be converted to a String.
     */
    appendChild(child: any): XML;
    /**
     * Returns the attribute associated with this XML object that
     * is identified by the specified name.
     */
    attribute(attributeName: string): XMLList;
    /**
     * Returns an XMList of the attributes in this XML Object.
     */
    attributes(): XMLList;
    /**
     * Returns the children of the XML object based on the specified
     * property name.
     */
    child(propertyName: any): XMLList;
    /**
     * Identifies the zero-based index of this XML object within
     * the context of its parent, or -1 if this object has no parent.
     */
    childIndex(): number;
    /**
     * Returns an XMLList containing the children of this XML object, maintaing
     * the sequence in which they appear.
     */
    children(): XMLList;
    /**
     * Returns the properties of the XML object that contain comments.
     */
    comments(): XMLList;
    /**
     * Returns true if this XML object contains the specified
     * XML object, false otherwise.
     */
    contains(value: XML): boolean;
    /**
     * Returns a copy of the this XML object including
     * duplicate copies of the entire tree of nodes.
     * The copied XML object has no parent.
     */
    copy(): XML;
    /**
     * Returns all descendents of the XML object.
     */
    descendants(): XMLList;
    /**
     * Returns all descendents of the XML object that
     * have the specified name parameter. To return all descendents,
     * use * as the name parameter.
     */
    descendants(name: string): XMLList;
    /**
     * Returns a list of all of the elements of the XML object.
     */
    elements(): XMLList;
    /**
     * Returns a list of the elements of the XML object using the
     * specified name to constrain the list. name can be a
     * QName, String, or any other data type that will be converted
     * to a string prior to performing the search for elements of that
     * name.
     * 
     * To list all objects use * for the value of name.
     */
    elements(name: any): XMLList;
    /**
     * Returns a Boolean value indicating whether
     * this XML object contains complex content. An XML object is considered
     * to contain complex content if it represents an XML element that has
     * child elements. XML objects representing attributes, comments, processing
     * instructions and text nodes do not have complex content. The existence of
     * attributes, comments, processing instructions and text nodes within an XML
     * object is not significant in determining if it has complex content.
     */
    hasComplexContent(): boolean;
    /**
     * Returns a Boolean value indicating whether this object has the
     * property specified by prop.
     */
    hasOwnProperty(prop: string): boolean;
    /**
     * Returns a Boolean value indicating whether this XML object contains
     * simple content. An XML object is considered to contain simple
     * content if it represents a text node, represents an attribute node
     * or if it represents an XML element that has no child elements. XML
     * objects representing comments and processing instructions do not
     * have simple content. The existence of attributes, comments,
     * processing instructions and text nodes within an XML object is not
     * significant in determining if it has simple content.
     */
    hasSimpleContent(): boolean;
    /**
     * Returns an Array of Namespace objects representing the namespaces
     * in scope for this XML object in the context of its parent. If the
     * parent of this XML object is modified, the associated namespace
     * declarations may change. The set of namespaces returned by this
     * method may be a super set of the namespaces used by this value
     */
    inScopeNamespaces(): any[];
    /**
     * Inserts the specified child2 after the specified child1
     * in this XML object and returns this XML object. If child1 is null,
     * inserts child2 before all children of
     * this XML object. If child1 does not exist
     * in this XML object, it returns without modifying this XML object.
     */
    insertChildAfter(child1: any, child2: any): XML;
    /**
     * Inserts the specified child2 before the specified child1
     * in this XML object and returns this XML object. If child1 is null,
     * inserts child2 after all children of
     * this XML object. If child1 does not exist
     * in this XML object, it returns without modifying this XML object.
     */
    insertChildBefore(child1: any, child2: any): XML;
    /**
     * Returns a value of 1 for XML objects.
     */
    length(): number;
    /**
     * Returns the local name portion of the qualified name of the XML object.
     */
    localName(): any | null;
    /**
     * Returns the qualified name for the XML object.
     */
    name(): any | null;
    /**
     * Returns the namespace associated with the qualified name
     * of this XML object.
     */
    namespace(): any;
    /**
     * Returns the namespace that matches the specified prefix and
     * that is in scope for the XML object. if there is no such
     * namespace, the method returns undefined.
     */
    namespace(prefix: string): any;
    /**
     * Returns an Array of namespace declarations associated
     * with the XML Obnject in the context of its parent.
     */
    namespaceDeclarations(): any[];
    /**
     * Returns the type of the XML object, such
     * as text, comment, processing-instruction,
     * or attribute.
     */
    nodeKind(): string;
    /**
     * Merges adjacent text nodes and eliminates and eliminates
     * empty text nodes for this XML object and all its
     * descendents.
     */
    normalize(): XML;
    /**
     * Returns the parent of the XML object
     * or null if the XML object does not have
     * a parent.
     */
    parent(): any | null;
    /**
     * Inserts the specified child into this XML object
     * prior to its existing XML properties and then returns
     * this XML object.
     */
    prependChild(value: any): XML;
    /**
     * Returns an XMLList containing all the children of this XML object
     * that are processing-instructions.
     */
    processingInstructions(): XMLList;
    /**
     * Returns an XMLList containing all the children of this XML object
     * that are processing-instructions with the specified name. If you
     * use * for the name, all processing-instructions are returned.
     */
    processingInstructions(name: string): XMLList;
    /**
     * Returns a Boolean indicating whether the specified
     * property will be included in the set of properties iterated
     * over when this XML object is used in a for..in statement.
     */
    propertyIsEnumerable(property: string): boolean;
    /**
     * Removes the specified namespace from the in scope namespaces
     * of this object and all its descendents, then returns a copy of
     * this XML object. This method will not remove a namespace from
     * an object when it is referenced by that object's QName or
     * the ONames of that object's attributes.
     */
    removeNamespace(ns: Namespace): XML;
    /**
     * Replaces the XML properties of this XML object specified by
     * propertyName with value and returns this
     * updated XML object. If this XML object contains no properties
     * that match propertyName, the replace method returns without
     * modifying this XML object.
     * 
     * The propertyName parameter may be a numeric property name,
     * an unqualified name for a set of XML elements, a qualified
     * name for a set of XML elements or the properties wildcard *.
     * 
     * When the propertyName parameter is an unqualified name,
     * it identifies XML elements in the default namespace. The value
     * parameter may be an XML object, XMLList object or any value
     * that may be converted to a String.
     */
    replace(propertyName: string, value: any): XML;
    /**
     * Replaces the XML properties of this XML object
     * with a new set of XML properties from value.
     */
    setChildren(value: any): XML;
    /**
     * Replaces the local name of this XML object with
     * a string constructed from the specified name.
     */
    setLocalName(name: string): void;
    /**
     * Replaces the name of this XML object with a
     * QName or AttributeName constructed from the specified
     * name.
     */
    setName(name: string): void;
    /**
     * Replaces the namespace associated with the name of
     * this XML object with the specified namespace.
     */
    setNamespace(ns: Namespace): void;
    /**
     * Returns an XMLList containing all XML properties of
     * this XML object that represent XML text nodes.
     */
    text(): XMLList;
    /**
     * Returns the String representation of the XML object. If the object contains
     * simple content, this method returns a String with tag, attributes, and
     * namespace declarations removed. However, if the object contains complex
     * content, this method returns an XML encoded String representing the entire
     * XML object. If you want to return the entire XML object regardless of
     * content complexity, use the toXMLString() method.
     */
    toString(): string;
    /**
     * Returns a XML-encoded String representation of the XML object, including tag and
     * attributed delimiters.
     */
    toXMLString(): string;
}

export = XML;
