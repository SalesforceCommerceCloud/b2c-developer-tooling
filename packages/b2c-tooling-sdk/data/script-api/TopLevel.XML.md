<!-- prettier-ignore-start -->
# Class XML

- [TopLevel.Object](TopLevel.Object.md)
  - [TopLevel.XML](TopLevel.XML.md)

The XML object contains functions and properties for working with XML
instances. The XML object implements the powerful XML-handling standards
defined in the ECMA-357 specification (known as "E4X").


Use the toXMLString() method to return a string representation of the XML
object regardless of whether the XML object has simple content or complex
content.


Do not create large XML objects in memory to avoid out-of-memory conditions.
When dealing with XML streams use [XMLStreamReader](dw.io.XMLStreamReader.md) and
[XMLStreamWriter](dw.io.XMLStreamWriter.md). The following example shows how:


```
var id : String = "p42";
var pname : String = "a product";

// use E4X syntax
var product : XML =
  <product id={id}>
    <name>{pname}</name>
    <shortdesc></shortdesc>
  </product>;

product.shortdesc = "a fine product";
product.longdesc = "this is a fine product";

var xmlString = product.toXMLString();

fileWriter.write(xmlString);
```





The code above will write the following to file:


```
<product id="p42">
  <name>a product</name>
  <shortdesc>a fine product</shortdesc>
  <longdesc>this is a fine product</longdesc>
</product>
```





Do not create large XML objects in memory to avoid out-of-memory conditions.
When dealing with XML streams use [XMLStreamReader](dw.io.XMLStreamReader.md) and
[XMLStreamWriter](dw.io.XMLStreamWriter.md).



## Property Summary

| Property | Description |
| --- | --- |
| [ignoreComments](#ignorecomments): [Boolean](TopLevel.Boolean.md) | The ignoreComments property determines whether or not XML comments are  ignored when XML objects parse the source XML data. |
| [ignoreProcessingInstructions](#ignoreprocessinginstructions): [Boolean](TopLevel.Boolean.md) | The ignoreProcessingInstructions property determines whether or not XML  processing instructions are ignored when XML objects parse the source XML data. |
| [ignoreWhitespace](#ignorewhitespace): [Boolean](TopLevel.Boolean.md) | The ignoreWhitespace property determines whether or not white space  characters at the beginning and end of text nodes are ignored during parsing. |
| [prettyIndent](#prettyindent): [Number](TopLevel.Number.md) | The prettyIndent property determines the amount of indentation applied by  the toString() and toXMLString() methods when the XML.prettyPrinting  property is set to true. |
| [prettyPrinting](#prettyprinting): [Boolean](TopLevel.Boolean.md) | The prettyPrinting property determines whether the toString() and toXMLString()  methods normalize white space characters between some tags. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [XML](#xml)() | Creates a new XML object. |
| [XML](#xmlobject)([Object](TopLevel.Object.md)) | Creates a new XML object. |

## Method Summary

| Method | Description |
| --- | --- |
| [addNamespace](TopLevel.XML.md#addnamespaceobject)([Object](TopLevel.Object.md)) | Adds a namespace to the set of in-scope namespaces for the XML object. |
| [appendChild](TopLevel.XML.md#appendchildobject)([Object](TopLevel.Object.md)) | Appends the specified child to the end of the object's properties. |
| [attribute](TopLevel.XML.md#attributestring)([String](TopLevel.String.md)) | Returns the attribute associated with this XML object that  is identified by the specified name. |
| [attributes](TopLevel.XML.md#attributes)() | Returns an XMList of the attributes in this XML Object. |
| [child](TopLevel.XML.md#childobject)([Object](TopLevel.Object.md)) | Returns the children of the XML object based on the specified  property name. |
| [childIndex](TopLevel.XML.md#childindex)() | Identifies the zero-based index of this XML object within  the context of its parent, or -1 if this object has no parent. |
| [children](TopLevel.XML.md#children)() | Returns an XMLList containing the children of this XML object, maintaing  the sequence in which they appear. |
| [comments](TopLevel.XML.md#comments)() | Returns the properties of the XML object that contain comments. |
| [contains](TopLevel.XML.md#containsxml)([XML](TopLevel.XML.md)) | Returns true if this XML object contains the specified  XML object, false otherwise. |
| [copy](TopLevel.XML.md#copy)() | Returns a copy of the this XML object including  duplicate copies of the entire tree of nodes. |
| static [defaultSettings](TopLevel.XML.md#defaultsettings)() | Returns a new Object with the following properties set to the default values:  ignoreComments, ignoreProcessingInstructions, ignoreWhitespace, prettyIndent,  and prettyPrinting. |
| [descendants](TopLevel.XML.md#descendants)() | Returns all descendents of the XML object. |
| [descendants](TopLevel.XML.md#descendantsstring)([String](TopLevel.String.md)) | Returns all descendents of the XML object that  have the specified name parameter. |
| [elements](TopLevel.XML.md#elements)() | Returns a list of all of the elements of the XML object. |
| [elements](TopLevel.XML.md#elementsobject)([Object](TopLevel.Object.md)) | Returns a list of the elements of the XML object using the  specified name to constrain the list. |
| [hasComplexContent](TopLevel.XML.md#hascomplexcontent)() | Returns a Boolean value indicating whether  this XML object contains complex content. |
| [hasOwnProperty](TopLevel.XML.md#hasownpropertystring)([String](TopLevel.String.md)) | Returns a Boolean value indicating whether this object has the  property specified by _prop_. |
| [hasSimpleContent](TopLevel.XML.md#hassimplecontent)() | Returns a Boolean value indicating whether this XML object contains  simple content. |
| [inScopeNamespaces](TopLevel.XML.md#inscopenamespaces)() | Returns an Array of Namespace objects representing the namespaces  in scope for this XML object in the context of its parent. |
| [insertChildAfter](TopLevel.XML.md#insertchildafterobject-object)([Object](TopLevel.Object.md), [Object](TopLevel.Object.md)) | Inserts the specified _child2_ after the specified _child1_  in this XML object and returns this XML object. |
| [insertChildBefore](TopLevel.XML.md#insertchildbeforeobject-object)([Object](TopLevel.Object.md), [Object](TopLevel.Object.md)) | Inserts the specified _child2_ before the specified _child1_  in this XML object and returns this XML object. |
| [length](TopLevel.XML.md#length)() | Returns a value of 1 for XML objects. |
| [localName](TopLevel.XML.md#localname)() | Returns the local name portion of the qualified name of the XML object. |
| [name](TopLevel.XML.md#name)() | Returns the qualified name for the XML object. |
| [namespace](TopLevel.XML.md#namespace)() | Returns the namespace associated with the qualified name  of this XML object. |
| [namespace](TopLevel.XML.md#namespacestring)([String](TopLevel.String.md)) | Returns the namespace that matches the specified prefix and  that is in scope for the XML object. |
| [namespaceDeclarations](TopLevel.XML.md#namespacedeclarations)() | Returns an Array of namespace declarations associated  with the XML Obnject in the context of its parent. |
| [nodeKind](TopLevel.XML.md#nodekind)() | Returns the type of the XML object, such  as _text_, _comment_, _processing-instruction_,  or _attribute_. |
| [normalize](TopLevel.XML.md#normalize)() | Merges adjacent text nodes and eliminates and eliminates  empty text nodes for this XML object and all its  descendents. |
| [parent](TopLevel.XML.md#parent)() | Returns the parent of the XML object  or null if the XML object does not have  a parent. |
| [prependChild](TopLevel.XML.md#prependchildobject)([Object](TopLevel.Object.md)) | Inserts the specified child into this XML object  prior to its existing XML properties and then returns  this XML object. |
| [processingInstructions](TopLevel.XML.md#processinginstructions)() | Returns an XMLList containing all the children of this XML object  that are processing-instructions. |
| [processingInstructions](TopLevel.XML.md#processinginstructionsstring)([String](TopLevel.String.md)) | Returns an XMLList containing all the children of this XML object  that are processing-instructions with the specified _name_. |
| [propertyIsEnumerable](TopLevel.XML.md#propertyisenumerablestring)([String](TopLevel.String.md)) | Returns a Boolean indicating whether the specified  _property_ will be included in the set of properties iterated  over when this XML object is used in a _for..in_ statement. |
| [removeNamespace](TopLevel.XML.md#removenamespacenamespace)([Namespace](TopLevel.Namespace.md)) | Removes the specified namespace from the in scope namespaces  of this object and all its descendents, then returns a copy of  this XML object. |
| [replace](TopLevel.XML.md#replacestring-object)([String](TopLevel.String.md), [Object](TopLevel.Object.md)) | Replaces the XML properties of this XML object specified by  _propertyName_ with _value_ and returns this  updated XML object. |
| [setChildren](TopLevel.XML.md#setchildrenobject)([Object](TopLevel.Object.md)) | Replaces the XML properties of this XML object  with a new set of XML properties from _value_. |
| [setLocalName](TopLevel.XML.md#setlocalnamestring)([String](TopLevel.String.md)) | Replaces the local name of this XML object with  a string constructed from the specified _name_. |
| [setName](TopLevel.XML.md#setnamestring)([String](TopLevel.String.md)) | Replaces the name of this XML object with a  QName or AttributeName constructed from the specified  _name_. |
| [setNamespace](TopLevel.XML.md#setnamespacenamespace)([Namespace](TopLevel.Namespace.md)) | Replaces the namespace associated with the name of  this XML object with the specified _namespace_. |
| static [setSettings](TopLevel.XML.md#setsettings)() | Restores the default settings for the following XML  properties:  <ul>  <li>XML.ignoreComments = true</li>  <li>XML.ignoreProcessingInstructions = true</li>  <li>XML.ignoreWhitespace = true</li>  <li>XML.prettyIndent = 2</li>  <li>XML.prettyPrinting = true</li>  </ul> |
| static [setSettings](TopLevel.XML.md#setsettingsobject)([Object](TopLevel.Object.md)) | Updates the collection of global XML properties:  ignoreComments, ignoreProcessingInstructions, ignoreWhitespace,  prettyPrinting, prettyIndent, and prettyPrinting. |
| static [settings](TopLevel.XML.md#settings)() | Returns the collection of global XML properties:  ignoreComments, ignoreProcessingInstructions, ignoreWhitespace,  prettyPrinting, prettyIndent, and prettyPrinting. |
| [text](TopLevel.XML.md#text)() | Returns an XMLList containing all XML properties of  this XML object that represent XML text nodes. |
| [toString](TopLevel.XML.md#tostring)() | Returns the String representation of the XML object. |
| [toXMLString](TopLevel.XML.md#toxmlstring)() | Returns a XML-encoded String representation of the XML object, including tag and  attributed delimiters. |
| [valueOf](TopLevel.XML.md#valueof)() | Returns this XML object. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### ignoreComments
- ignoreComments: [Boolean](TopLevel.Boolean.md)
  - : The ignoreComments property determines whether or not XML comments are
      ignored when XML objects parse the source XML data.



---

### ignoreProcessingInstructions
- ignoreProcessingInstructions: [Boolean](TopLevel.Boolean.md)
  - : The ignoreProcessingInstructions property determines whether or not XML
      processing instructions are ignored when XML objects parse the source XML data.



---

### ignoreWhitespace
- ignoreWhitespace: [Boolean](TopLevel.Boolean.md)
  - : The ignoreWhitespace property determines whether or not white space
      characters at the beginning and end of text nodes are ignored during parsing.



---

### prettyIndent
- prettyIndent: [Number](TopLevel.Number.md)
  - : The prettyIndent property determines the amount of indentation applied by
      the toString() and toXMLString() methods when the XML.prettyPrinting
      property is set to true.



---

### prettyPrinting
- prettyPrinting: [Boolean](TopLevel.Boolean.md)
  - : The prettyPrinting property determines whether the toString() and toXMLString()
      methods normalize white space characters between some tags.



---

## Constructor Details

### XML()
- XML()
  - : Creates a new XML object.


---

### XML(Object)
- XML(value: [Object](TopLevel.Object.md))
  - : Creates a new XML object.
      You must use the constructor to create an XML object before you
      call any of the methods of the XML class.
      Use the toXMLString() method to return a string representation
      of the XML object regardless of whether the XML object has simple
      content or complex content.


    **Parameters:**
    - value - any Object that can be converted to XML via  the top-level XML() function.


---

## Method Details

### addNamespace(Object)
- addNamespace(ns: [Object](TopLevel.Object.md)): [XML](TopLevel.XML.md)
  - : Adds a namespace to the set of in-scope namespaces for the XML object.
      If the namespace already exists in the in-scope namespaces for the XML
      object, then the prefix of the existing namespace is set to _undefined_.
      If _ns_ is a Namespace instance, it is used directly.
      However, if _ns_ is a QName instance, the input parameter's URI is used
      to create a new namespace. If _ns_ is not a Namespace or QName instance,
      _ns_ is converted to a String and a namespace is created from the String.


    **Parameters:**
    - ns - the namespace to add to the XML object.

    **Returns:**
    - a new XML object, with the namespace added.


---

### appendChild(Object)
- appendChild(child: [Object](TopLevel.Object.md)): [XML](TopLevel.XML.md)
  - : Appends the specified child to the end of the object's properties.
      _child_ should be a XML object, an XMLList object or any other
      data type that will then be converted to a String.


    **Parameters:**
    - child - the object to append to this XML object.

    **Returns:**
    - the XML object with the child appended.


---

### attribute(String)
- attribute(attributeName: [String](TopLevel.String.md)): [XMLList](TopLevel.XMLList.md)
  - : Returns the attribute associated with this XML object that
      is identified by the specified name.


    **Parameters:**
    - attributeName - the name of the attribute.

    **Returns:**
    - the value of the attribute as either an XMLList or an empty XMLList


---

### attributes()
- attributes(): [XMLList](TopLevel.XMLList.md)
  - : Returns an XMList of the attributes in this XML Object.

    **Returns:**
    - an XMList of the attributes in this XML Object.


---

### child(Object)
- child(propertyName: [Object](TopLevel.Object.md)): [XMLList](TopLevel.XMLList.md)
  - : Returns the children of the XML object based on the specified
      property name.


    **Parameters:**
    - propertyName - the property name representing the  children of this XML object.

    **Returns:**
    - an XMLList of children that match the property name
      parameter.



---

### childIndex()
- childIndex(): [Number](TopLevel.Number.md)
  - : Identifies the zero-based index of this XML object within
      the context of its parent, or -1 if this object has no parent.


    **Returns:**
    - the index of this XML object in the context of
      its parent, or -1 if this object has no parent.



---

### children()
- children(): [XMLList](TopLevel.XMLList.md)
  - : Returns an XMLList containing the children of this XML object, maintaing
      the sequence in which they appear.


    **Returns:**
    - an XMLList containing the children of this XML object.


---

### comments()
- comments(): [XMLList](TopLevel.XMLList.md)
  - : Returns the properties of the XML object that contain comments.

    **Returns:**
    - properties of the XML object that contain comments.


---

### contains(XML)
- contains(value: [XML](TopLevel.XML.md)): [Boolean](TopLevel.Boolean.md)
  - : Returns true if this XML object contains the specified
      XML object, false otherwise.


    **Parameters:**
    - value - the object to locate in this XML object.

    **Returns:**
    - true if this XML object contains the specified
      XML object, false otherwise.



---

### copy()
- copy(): [XML](TopLevel.XML.md)
  - : Returns a copy of the this XML object including
      duplicate copies of the entire tree of nodes.
      The copied XML object has no parent.


    **Returns:**
    - the copy of the object.


---

### defaultSettings()
- static defaultSettings(): [Object](TopLevel.Object.md)
  - : Returns a new Object with the following properties set to the default values:
      ignoreComments, ignoreProcessingInstructions, ignoreWhitespace, prettyIndent,
      and prettyPrinting. The default values are as follows:
      
      - ignoreComments = true
      - ignoreProcessingInstructions = true
      - ignoreWhitespace = true
      - prettyIndent = 2
      - prettyPrinting = true
      
      
      Be aware that this method does not apply the settings to an existing instance
      of an XML object. Instead, this method returns an Object containing the
      default settings.


    **Returns:**
    - an Object with properties set to the default settings.


---

### descendants()
- descendants(): [XMLList](TopLevel.XMLList.md)
  - : Returns all descendents of the XML object.

    **Returns:**
    - a list of all descendents of the XML object.


---

### descendants(String)
- descendants(name: [String](TopLevel.String.md)): [XMLList](TopLevel.XMLList.md)
  - : Returns all descendents of the XML object that
      have the specified name parameter. To return all descendents,
      use \* as the _name_ parameter.


    **Parameters:**
    - name - the name of the element to match. To return all descendents,  use \* as the _name_ parameter.

    **Returns:**
    - a list of all descendents constrained by the name parameter.


---

### elements()
- elements(): [XMLList](TopLevel.XMLList.md)
  - : Returns a list of all of the elements of the XML object.


---

### elements(Object)
- elements(name: [Object](TopLevel.Object.md)): [XMLList](TopLevel.XMLList.md)
  - : Returns a list of the elements of the XML object using the
      specified name to constrain the list. _name_ can be a
      QName, String, or any other data type that will be converted
      to a string prior to performing the search for elements of that
      name.
      
      To list all objects use \* for the value of _name_.


    **Parameters:**
    - name - the name of the elements to return or an  \* to return all elements.

    **Returns:**
    - a list of the elements of the XML object using the
      specified name to constrain the list.



---

### hasComplexContent()
- hasComplexContent(): [Boolean](TopLevel.Boolean.md)
  - : Returns a Boolean value indicating whether
      this XML object contains complex content. An XML object is considered
      to contain complex content if it represents an XML element that has
      child elements. XML objects representing attributes, comments, processing
      instructions and text nodes do not have complex content. The existence of
      attributes, comments, processing instructions and text nodes within an XML
      object is not significant in determining if it has complex content.


    **Returns:**
    - a Boolean value indicating whether this XML object contains complex content.


---

### hasOwnProperty(String)
- hasOwnProperty(prop: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Returns a Boolean value indicating whether this object has the
      property specified by _prop_.


    **Parameters:**
    - prop - the property to locate.

    **Returns:**
    - true if the property exists, false otherwise.


---

### hasSimpleContent()
- hasSimpleContent(): [Boolean](TopLevel.Boolean.md)
  - : Returns a Boolean value indicating whether this XML object contains
      simple content. An XML object is considered to contain simple
      content if it represents a text node, represents an attribute node
      or if it represents an XML element that has no child elements. XML
      objects representing comments and processing instructions do not
      have simple content. The existence of attributes, comments,
      processing instructions and text nodes within an XML object is not
      significant in determining if it has simple content.


    **Returns:**
    - a Boolean value indicating whether this XML object contains
      simple content.



---

### inScopeNamespaces()
- inScopeNamespaces(): [Array](TopLevel.Array.md)
  - : Returns an Array of Namespace objects representing the namespaces
      in scope for this XML object in the context of its parent. If the
      parent of this XML object is modified, the associated namespace
      declarations may change. The set of namespaces returned by this
      method may be a super set of the namespaces used by this value


    **Returns:**
    - an Array of Namespace objects representing the namespaces
      in scope for this XML object in the context of its parent.



---

### insertChildAfter(Object, Object)
- insertChildAfter(child1: [Object](TopLevel.Object.md), child2: [Object](TopLevel.Object.md)): [XML](TopLevel.XML.md)
  - : Inserts the specified _child2_ after the specified _child1_
      in this XML object and returns this XML object. If _child1_ is null,
      inserts _child2_ before all children of
      this XML object. If _child1_ does not exist
      in this XML object, it returns without modifying this XML object.


    **Parameters:**
    - child1 - the child after which _child2_ is inserted.
    - child2 - the child to insert into this XML object.

    **Returns:**
    - the updated XML object.


---

### insertChildBefore(Object, Object)
- insertChildBefore(child1: [Object](TopLevel.Object.md), child2: [Object](TopLevel.Object.md)): [XML](TopLevel.XML.md)
  - : Inserts the specified _child2_ before the specified _child1_
      in this XML object and returns this XML object. If _child1_ is null,
      inserts _child2_ after all children of
      this XML object. If _child1_ does not exist
      in this XML object, it returns without modifying this XML object.


    **Parameters:**
    - child1 - the child before which _child2_ is inserted.
    - child2 - the child to insert into this XML object.

    **Returns:**
    - the updated XML object.


---

### length()
- length(): [Number](TopLevel.Number.md)
  - : Returns a value of 1 for XML objects.

    **Returns:**
    - the value of 1.


---

### localName()
- localName(): [Object](TopLevel.Object.md)
  - : Returns the local name portion of the qualified name of the XML object.

    **Returns:**
    - the local name as either a String or null.


---

### name()
- name(): [Object](TopLevel.Object.md)
  - : Returns the qualified name for the XML object.

    **Returns:**
    - the qualified name as either a QName or null.


---

### namespace()
- namespace(): [Object](TopLevel.Object.md)
  - : Returns the namespace associated with the qualified name
      of this XML object.


    **Returns:**
    - the namespace associated with the qualified name
      of this XML object.



---

### namespace(String)
- namespace(prefix: [String](TopLevel.String.md)): [Object](TopLevel.Object.md)
  - : Returns the namespace that matches the specified prefix and
      that is in scope for the XML object. if there is no such
      namespace, the method returns undefined.


    **Parameters:**
    - prefix - the prefix to use when attempting to  locate a namespace.

    **Returns:**
    - the namespace that matches the specified prefix and
      that is in scope for the XML object. If specified
      namespace does not exist, the method returns undefined.



---

### namespaceDeclarations()
- namespaceDeclarations(): [Array](TopLevel.Array.md)
  - : Returns an Array of namespace declarations associated
      with the XML Obnject in the context of its parent.


    **Returns:**
    - an Array of namespace declarations associated
      with the XML Obnject in the context of its parent.



---

### nodeKind()
- nodeKind(): [String](TopLevel.String.md)
  - : Returns the type of the XML object, such
      as _text_, _comment_, _processing-instruction_,
      or _attribute_.


    **Returns:**
    - the type of the XML object.


---

### normalize()
- normalize(): [XML](TopLevel.XML.md)
  - : Merges adjacent text nodes and eliminates and eliminates
      empty text nodes for this XML object and all its
      descendents.


    **Returns:**
    - the normalized XML object.


---

### parent()
- parent(): [Object](TopLevel.Object.md)
  - : Returns the parent of the XML object
      or null if the XML object does not have
      a parent.


    **Returns:**
    - the parent of the XML object
      of null if the XML object does not have
      a parent.



---

### prependChild(Object)
- prependChild(value: [Object](TopLevel.Object.md)): [XML](TopLevel.XML.md)
  - : Inserts the specified child into this XML object
      prior to its existing XML properties and then returns
      this XML object.


    **Parameters:**
    - value - the child to prepend to this  XML object.

    **Returns:**
    - the XML object updated with the prepended child.


---

### processingInstructions()
- processingInstructions(): [XMLList](TopLevel.XMLList.md)
  - : Returns an XMLList containing all the children of this XML object
      that are processing-instructions.


    **Returns:**
    - an XMLList containing all the children of this XML object
      that are processing-instructions.



---

### processingInstructions(String)
- processingInstructions(name: [String](TopLevel.String.md)): [XMLList](TopLevel.XMLList.md)
  - : Returns an XMLList containing all the children of this XML object
      that are processing-instructions with the specified _name_. If you
      use \* for the name, all processing-instructions are returned.


    **Parameters:**
    - name - the name representing the processing-instructions  you want to retreive.

    **Returns:**
    - an XMLList containing all the children of this XML object
      that are processing-instructions with the specified _name_.



---

### propertyIsEnumerable(String)
- propertyIsEnumerable(property: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Returns a Boolean indicating whether the specified
      _property_ will be included in the set of properties iterated
      over when this XML object is used in a _for..in_ statement.


    **Parameters:**
    - property - the property to test.

    **Returns:**
    - true when the property can be iterated in a _for..in_
      statement, false otherwise.



---

### removeNamespace(Namespace)
- removeNamespace(ns: [Namespace](TopLevel.Namespace.md)): [XML](TopLevel.XML.md)
  - : Removes the specified namespace from the in scope namespaces
      of this object and all its descendents, then returns a copy of
      this XML object. This method will not remove a namespace from
      an object when it is referenced by that object's QName or
      the ONames of that object's attributes.


    **Parameters:**
    - ns - the namespace to remove.

    **Returns:**
    - a copy of this XML object with the namespace removed.


---

### replace(String, Object)
- replace(propertyName: [String](TopLevel.String.md), value: [Object](TopLevel.Object.md)): [XML](TopLevel.XML.md)
  - : Replaces the XML properties of this XML object specified by
      _propertyName_ with _value_ and returns this
      updated XML object. If this XML object contains no properties
      that match _propertyName_, the replace method returns without
      modifying this XML object.
      
      The _propertyName_ parameter may be a numeric property name,
      an unqualified name for a set of XML elements, a qualified
      name for a set of XML elements or the properties wildcard \*.
      
      When the _propertyName_ parameter is an unqualified name,
      it identifies XML elements in the default namespace. The _value_
      parameter may be an XML object, XMLList object or any value
      that may be converted to a String.


    **Parameters:**
    - propertyName - a numeric property name,  an unqualified name for a set of XML elements, a qualified  name for a set of XML elements or the properties wildcard \*.
    - value - an XML object, XMLList object or any value  that may be converted to a String.

    **Returns:**
    - the updated XML object.


---

### setChildren(Object)
- setChildren(value: [Object](TopLevel.Object.md)): [XML](TopLevel.XML.md)
  - : Replaces the XML properties of this XML object
      with a new set of XML properties from _value_.


    **Parameters:**
    - value - a single XML object or an XMLList.

    **Returns:**
    - the updated XML object.


---

### setLocalName(String)
- setLocalName(name: [String](TopLevel.String.md)): void
  - : Replaces the local name of this XML object with
      a string constructed from the specified _name_.


    **Parameters:**
    - name - the new local name.


---

### setName(String)
- setName(name: [String](TopLevel.String.md)): void
  - : Replaces the name of this XML object with a
      QName or AttributeName constructed from the specified
      _name_.


    **Parameters:**
    - name - the new name of this XML object.


---

### setNamespace(Namespace)
- setNamespace(ns: [Namespace](TopLevel.Namespace.md)): void
  - : Replaces the namespace associated with the name of
      this XML object with the specified _namespace_.


    **Parameters:**
    - ns - the namespace to associated with the  name of thix XML object.


---

### setSettings()
- static setSettings(): void
  - : Restores the default settings for the following XML
      properties:
      
      - XML.ignoreComments = true
      - XML.ignoreProcessingInstructions = true
      - XML.ignoreWhitespace = true
      - XML.prettyIndent = 2
      - XML.prettyPrinting = true



---

### setSettings(Object)
- static setSettings(settings: [Object](TopLevel.Object.md)): void
  - : Updates the collection of global XML properties:
      ignoreComments, ignoreProcessingInstructions, ignoreWhitespace,
      prettyPrinting, prettyIndent, and prettyPrinting.


    **Parameters:**
    - settings - an object with each of the following properties:  ignoreComments, ignoreProcessingInstructions, ignoreWhitespace,  prettyIndent, and prettyPrinting.


---

### settings()
- static settings(): [Object](TopLevel.Object.md)
  - : Returns the collection of global XML properties:
      ignoreComments, ignoreProcessingInstructions, ignoreWhitespace,
      prettyPrinting, prettyIndent, and prettyPrinting.


    **Returns:**
    - an object with each of the following properties:
      ignoreComments, ignoreProcessingInstructions, ignoreWhitespace,
      prettyIndent, and prettyPrinting.



---

### text()
- text(): [XMLList](TopLevel.XMLList.md)
  - : Returns an XMLList containing all XML properties of
      this XML object that represent XML text nodes.


    **Returns:**
    - an XMLList containing all XML properties of
      this XML object that represent XML text nodes.



---

### toString()
- toString(): [String](TopLevel.String.md)
  - : Returns the String representation of the XML object. If the object contains
       simple content, this method returns a String with tag, attributes, and
       namespace declarations removed. However, if the object contains complex
       content, this method returns an XML encoded String representing the entire
       XML object. If you want to return the entire XML object regardless of
       content complexity, use the _toXMLString()_ method.


    **Returns:**
    - the String representation of the XML object.


---

### toXMLString()
- toXMLString(): [String](TopLevel.String.md)
  - : Returns a XML-encoded String representation of the XML object, including tag and
      attributed delimiters.


    **Returns:**
    - the string representation of the XML object.


---

### valueOf()
- valueOf(): [XML](TopLevel.XML.md)
  - : Returns this XML object.

    **Returns:**
    - this XML object.


---

<!-- prettier-ignore-end -->
