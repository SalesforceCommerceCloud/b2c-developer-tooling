import XML = require('./XML');

/**
 * An XMLList object is an ordered collection of properties.
 * A XMLList object represents a XML document, an XML fragment,
 * or an arbitrary collection of XML objects.
 * An individual XML object is the same thing as an XMLList
 * containing only that XML object. All operations available
 * for the XML object are also available for an XMLList object
 * that contains exactly one XML object.
 */
declare class XMLList {
    /**
     * Returns this XMLList object.
     */
    valueOf(): XMLList;
    /**
     * Creates a new XMLList object using the
     * specified value.
     */
    constructor(value: any);
    /**
     * Returns the attribute associated with this XMLList object that
     * is identified by the specified name.
     */
    attribute(attributeName: string): XMLList;
    /**
     * Returns an XMList of the attributes in this XMLList Object.
     */
    attributes(): XMLList;
    /**
     * Returns the children of the XMLList object based on the specified
     * property name.
     */
    child(propertyName: any): XMLList;
    /**
     * Returns an XMLList containing the children of this XMLList object, maintaing
     * the sequence in which they appear.
     */
    children(): XMLList;
    /**
     * Returns the properties of the XMLList object that contain comments.
     */
    comments(): XMLList;
    /**
     * Returns true if this XMLList object contains the specified
     * XML object, false otherwise.
     */
    contains(value: XML): boolean;
    /**
     * Returns a deep copy of the this XMLList object.
     */
    copy(): XMLList;
    /**
     * Calls the descendants() method of each XML object in this XMLList
     * object and returns an XMLList containing the
     * results concatenated in order.
     */
    descendants(): XMLList;
    /**
     * Calls the descendants(name) method of each XML object in this XMLList
     * object and returns an XMLList containing the
     * results concatenated in order.
     */
    descendants(name: string): XMLList;
    /**
     * Calls the elements() method in each XML object in this XMLList
     * object and returns an XMLList containing the results concatenated in order.
     */
    elements(): XMLList;
    /**
     * Calls the elements(name) method in each of the XML objects in
     * this XMLList object and returns an XMLList containing the results
     * concatenated in order. name can be a
     * QName, String, or any other data type that will be converted
     * to a string prior to performing the search for elements of that
     * name.
     * 
     * To list all objects use * for the value of name.
     */
    elements(name: any): XMLList;
    /**
     * Returns a Boolean value indicating whether
     * this XMLList object contains complex content. An XMLList object is considered
     * to contain complex content if it is not empty, contains a single XML item
     * with complex content or contains elements.
     */
    hasComplexContent(): boolean;
    /**
     * Returns a Boolean value indicating whether this object has the
     * property specified by prop.
     */
    hasOwnProperty(prop: string): boolean;
    /**
     * Returns a Boolean value indicating whether this XML object contains
     * simple content. An XMLList object is considered to contain simple
     * content if it is empty, contains a single XML item with simple
     * content or contains no elements.
     */
    hasSimpleContent(): boolean;
    /**
     * Returns the number of children in this XMLList
     * object.
     */
    length(): number;
    /**
     * Puts all text nodes in this XMLList, all the XML objects it
     * contains and the descendents of all the XML objects it
     * contains into a normal form by merging adjacent text nodes
     * and eliminating empty text nodes.
     */
    normalize(): XMLList;
    /**
     * Returns the parent of the XMLList object
     * or null if the XMLList object does not have
     * a parent.
     */
    parent(): any | null;
    /**
     * Calls the processingInstructions() method of each XML object
     * in this XMLList object and returns an XMList containing the results
     * in order.
     */
    processingInstructions(): XMLList;
    /**
     * Calls the processingInstructions(name) method of each XML object
     * in this XMLList object and returns an XMList containing the results
     * in order.
     */
    processingInstructions(name: string): XMLList;
    /**
     * Returns a Boolean indicating whether the specified
     * property will be included in the set of properties iterated
     * over when this XML object is used in a for..in statement.
     */
    propertyIsEnumerable(property: string): boolean;
    /**
     * Calls the text() method of each XML object contained
     * in this XMLList object and returns an XMLList containing
     * the results concatenated in order.
     */
    text(): XMLList;
    /**
     * Returns the String representation of this XMLList object.
     */
    toString(): string;
    /**
     * Returns an XML-encoded String representation of the XMLList object
     * by calling the toXMLString method on each property contained
     * within this XMLList object.
     */
    toXMLString(): string;
}

export = XMLList;
