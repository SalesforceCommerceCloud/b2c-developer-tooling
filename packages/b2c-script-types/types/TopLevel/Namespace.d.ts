/**
 * Namespace objects represent XML namespaces and provide an
 * association between a namespace prefix and a Unique Resource
 * Identifier (URI). The prefix is either the undefined value
 * or a string value that may be used to reference the namespace
 * within the lexical representation of an XML value. When an
 * XML object containing a namespace with an undefined prefix is
 * encoded as XML by the method toXMLString(), the implementation
 * will automatically generate a prefix.
 * The URI is a string value used to uniquely identify the namespace.
 */
declare class Namespace {
    /**
     * The prefix of the namespace.
     */
    readonly prefix: string;
    /**
     * The Uniform Resource Identifier (URI) of the namespace.
     */
    readonly uri: string;
    /**
     * Constructs a simple namespace where the
     * uri and prefix properties are set to an empty string.
     * A namespace with URI set to the empty string represents no namespace.
     * No namespace is used in XML objects to explicitly specify
     * that a name is not inside a namespace and may never be
     * associated with a prefix other than the empty string.
     */
    constructor();
    /**
     * Constructs a Namespace object and assigns values to the
     * uri and prefix properties based on the type
     * of uriValue. If uriValue is a
     * Namespace object, a copy of the Namespace is constructed.
     * If uriValue is a QName object, the uri property is
     * set to the QName object's uri property.
     * Otherwise, uriValue is converted into a string and
     * assigned to the uri property.
     */
    constructor(uriValue: any);
    /**
     * Constructs a Namespace object and assigns values to the
     * uri and prefix properties.
     * 
     * The value of the prefixValue parameter is assigned to the
     * prefix property in the following manner:
     * 
     * - If undefined is passed, prefix is set to undefined.
     * - If the argument is a valid XML name, it is converted
     * to a string and assigned to the prefix property.
     * - If the argument is not a valid XML name, the prefix
     * property is set to undefined.
     * 
     * The value of the uriValue parameter is assigned
     * to the uri property in the following manner:
     * 
     * - If a QName object is passed for the uriValue parameter,
     * the uri property is set to the value of the QName object's uri property.
     * - If a QName object is not passed for the uriValue parameter,
     * the uriValue parameter is converted to a string and assigned to the uri property.
     */
    constructor(prefixValue: any, uriValue: any);
    /**
     * Returns the prefix of the Namespace object.
     */
    getPrefix(): string;
    /**
     * Returns the Uniform Resource Identifier (URI) of the Namespace object.
     */
    getUri(): string;
    /**
     * Returns a string representation of this Namespace object.
     */
    toString(): string;
}

export = Namespace;
