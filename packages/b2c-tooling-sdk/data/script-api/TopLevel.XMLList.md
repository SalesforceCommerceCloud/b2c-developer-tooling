<!-- prettier-ignore-start -->
# Class XMLList

- [TopLevel.Object](TopLevel.Object.md)
  - [TopLevel.XMLList](TopLevel.XMLList.md)

An XMLList object is an ordered collection of properties.
A XMLList object represents a XML document, an XML fragment,
or an arbitrary collection of XML objects.
An individual XML object is the same thing as an XMLList
containing only that XML object. All operations available
for the XML object are also available for an XMLList object
that contains exactly one XML object.



## Constructor Summary

| Constructor | Description |
| --- | --- |
| [XMLList](#xmllistobject)([Object](TopLevel.Object.md)) | Creates a new XMLList object using the  specified _value_. |

## Method Summary

| Method | Description |
| --- | --- |
| [attribute](TopLevel.XMLList.md#attributestring)([String](TopLevel.String.md)) | Returns the attribute associated with this XMLList object that  is identified by the specified name. |
| [attributes](TopLevel.XMLList.md#attributes)() | Returns an XMList of the attributes in this XMLList Object. |
| [child](TopLevel.XMLList.md#childobject)([Object](TopLevel.Object.md)) | Returns the children of the XMLList object based on the specified  property name. |
| [children](TopLevel.XMLList.md#children)() | Returns an XMLList containing the children of this XMLList object, maintaing  the sequence in which they appear. |
| [comments](TopLevel.XMLList.md#comments)() | Returns the properties of the XMLList object that contain comments. |
| [contains](TopLevel.XMLList.md#containsxml)([XML](TopLevel.XML.md)) | Returns true if this XMLList object contains the specified  XML object, false otherwise. |
| [copy](TopLevel.XMLList.md#copy)() | Returns a deep copy of the this XMLList object. |
| [descendants](TopLevel.XMLList.md#descendants)() | Calls the _descendants()_ method of each XML object in this XMLList  object and returns an XMLList containing the  results concatenated in order. |
| [descendants](TopLevel.XMLList.md#descendantsstring)([String](TopLevel.String.md)) | Calls the _descendants(name)_ method of each XML object in this XMLList  object and returns an XMLList containing the  results concatenated in order. |
| [elements](TopLevel.XMLList.md#elements)() | Calls the _elements()_ method in each XML object in this XMLList  object and returns an XMLList containing the results concatenated in order. |
| [elements](TopLevel.XMLList.md#elementsobject)([Object](TopLevel.Object.md)) | Calls the _elements(name)_ method in each of the XML objects in  this XMLList object and returns an XMLList containing the results  concatenated in order. |
| [hasComplexContent](TopLevel.XMLList.md#hascomplexcontent)() | Returns a Boolean value indicating whether  this XMLList object contains complex content. |
| [hasOwnProperty](TopLevel.XMLList.md#hasownpropertystring)([String](TopLevel.String.md)) | Returns a Boolean value indicating whether this object has the  property specified by _prop_. |
| [hasSimpleContent](TopLevel.XMLList.md#hassimplecontent)() | Returns a Boolean value indicating whether this XML object contains  simple content. |
| [length](TopLevel.XMLList.md#length)() | Returns the number of children in this XMLList  object. |
| [normalize](TopLevel.XMLList.md#normalize)() | Puts all text nodes in this XMLList, all the XML objects it  contains and the descendents of all the XML objects it  contains into a normal form by merging adjacent text nodes  and eliminating empty text nodes. |
| [parent](TopLevel.XMLList.md#parent)() | Returns the parent of the XMLList object  or null if the XMLList object does not have  a parent. |
| [processingInstructions](TopLevel.XMLList.md#processinginstructions)() | Calls the _processingInstructions()_ method of each XML object  in this XMLList object and returns an XMList containing the results  in order. |
| [processingInstructions](TopLevel.XMLList.md#processinginstructionsstring)([String](TopLevel.String.md)) | Calls the _processingInstructions(name)_ method of each XML object  in this XMLList object and returns an XMList containing the results  in order. |
| [propertyIsEnumerable](TopLevel.XMLList.md#propertyisenumerablestring)([String](TopLevel.String.md)) | Returns a Boolean indicating whether the specified  _property_ will be included in the set of properties iterated  over when this XML object is used in a _for..in_ statement. |
| [text](TopLevel.XMLList.md#text)() | Calls the _text()_ method of each XML object contained  in this XMLList object and returns an XMLList containing  the results concatenated in order. |
| [toString](TopLevel.XMLList.md#tostring)() | Returns the String representation of this XMLList object. |
| [toXMLString](TopLevel.XMLList.md#toxmlstring)() | Returns an XML-encoded String representation of the XMLList object  by calling the _toXMLString_ method on each property contained  within this XMLList object. |
| [valueOf](TopLevel.XMLList.md#valueof)() | Returns this XMLList object. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constructor Details

### XMLList(Object)
- XMLList(value: [Object](TopLevel.Object.md))
  - : Creates a new XMLList object using the
      specified _value_.


    **Parameters:**
    - value - the value to use.


---

## Method Details

### attribute(String)
- attribute(attributeName: [String](TopLevel.String.md)): [XMLList](TopLevel.XMLList.md)
  - : Returns the attribute associated with this XMLList object that
      is identified by the specified name.


    **Parameters:**
    - attributeName - the name of the attribute.

    **Returns:**
    - the value of the attribute as either an XMLList or an empty XMLList


---

### attributes()
- attributes(): [XMLList](TopLevel.XMLList.md)
  - : Returns an XMList of the attributes in this XMLList Object.

    **Returns:**
    - an XMList of the attributes in this XMLList Object.


---

### child(Object)
- child(propertyName: [Object](TopLevel.Object.md)): [XMLList](TopLevel.XMLList.md)
  - : Returns the children of the XMLList object based on the specified
      property name.


    **Parameters:**
    - propertyName - the property name representing the  children of this XMLList object.

    **Returns:**
    - an XMLList of children that match the property name
      parameter.



---

### children()
- children(): [XMLList](TopLevel.XMLList.md)
  - : Returns an XMLList containing the children of this XMLList object, maintaing
      the sequence in which they appear.


    **Returns:**
    - an XMLList containing the children of this XMLList object.


---

### comments()
- comments(): [XMLList](TopLevel.XMLList.md)
  - : Returns the properties of the XMLList object that contain comments.

    **Returns:**
    - properties of the XMLList object that contain comments.


---

### contains(XML)
- contains(value: [XML](TopLevel.XML.md)): [Boolean](TopLevel.Boolean.md)
  - : Returns true if this XMLList object contains the specified
      XML object, false otherwise.


    **Parameters:**
    - value - the object to locate in this XMLList object.

    **Returns:**
    - true if this XMLList object contains the specified
      XML object, false otherwise.



---

### copy()
- copy(): [XMLList](TopLevel.XMLList.md)
  - : Returns a deep copy of the this XMLList object.

    **Returns:**
    - the deep copy of the object.


---

### descendants()
- descendants(): [XMLList](TopLevel.XMLList.md)
  - : Calls the _descendants()_ method of each XML object in this XMLList
      object and returns an XMLList containing the
      results concatenated in order.


    **Returns:**
    - a list of all descendents of the XML objects in this XMLList object.


---

### descendants(String)
- descendants(name: [String](TopLevel.String.md)): [XMLList](TopLevel.XMLList.md)
  - : Calls the _descendants(name)_ method of each XML object in this XMLList
      object and returns an XMLList containing the
      results concatenated in order.


    **Parameters:**
    - name - the name of the element to match. To return all descendents,  use \* as the _name_ parameter.

    **Returns:**
    - a list of all descendents of the XML objects in this XMLList
      constrained by the _name_ parameter.



---

### elements()
- elements(): [XMLList](TopLevel.XMLList.md)
  - : Calls the _elements()_ method in each XML object in this XMLList
      object and returns an XMLList containing the results concatenated in order.



---

### elements(Object)
- elements(name: [Object](TopLevel.Object.md)): [XMLList](TopLevel.XMLList.md)
  - : Calls the _elements(name)_ method in each of the XML objects in
      this XMLList object and returns an XMLList containing the results
      concatenated in order. _name_ can be a
      QName, String, or any other data type that will be converted
      to a string prior to performing the search for elements of that
      name.
      
      To list all objects use \* for the value of _name_.


    **Parameters:**
    - name - the name of the elements to return.

    **Returns:**
    - a list of all elements of the XML objects in this XMLList
      constrained by the _name_ parameter.



---

### hasComplexContent()
- hasComplexContent(): [Boolean](TopLevel.Boolean.md)
  - : Returns a Boolean value indicating whether
      this XMLList object contains complex content. An XMLList object is considered
      to contain complex content if it is not empty, contains a single XML item
      with complex content or contains elements.


    **Returns:**
    - a Boolean value indicating whether this XMLList object contains complex content.


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
      simple content. An XMLList object is considered to contain simple
      content if it is empty, contains a single XML item with simple
      content or contains no elements.


    **Returns:**
    - a Boolean value indicating whether this XML object contains
      simple content.



---

### length()
- length(): [Number](TopLevel.Number.md)
  - : Returns the number of children in this XMLList
      object.


    **Returns:**
    - the number of children in this XMLList
      object.



---

### normalize()
- normalize(): [XMLList](TopLevel.XMLList.md)
  - : Puts all text nodes in this XMLList, all the XML objects it
      contains and the descendents of all the XML objects it
      contains into a normal form by merging adjacent text nodes
      and eliminating empty text nodes.


    **Returns:**
    - the XMLList object containing normailzed objects.


---

### parent()
- parent(): [Object](TopLevel.Object.md)
  - : Returns the parent of the XMLList object
      or null if the XMLList object does not have
      a parent.


    **Returns:**
    - the parent of the XMLList object
      or null if the XMLList object does not have
      a parent.



---

### processingInstructions()
- processingInstructions(): [XMLList](TopLevel.XMLList.md)
  - : Calls the _processingInstructions()_ method of each XML object
      in this XMLList object and returns an XMList containing the results
      in order.


    **Returns:**
    - an XMLList contaiing the result of calling the
      _processingInstructions()_ method of each XML object
      in this XMLList object.



---

### processingInstructions(String)
- processingInstructions(name: [String](TopLevel.String.md)): [XMLList](TopLevel.XMLList.md)
  - : Calls the _processingInstructions(name)_ method of each XML object
      in this XMLList object and returns an XMList containing the results
      in order.


    **Parameters:**
    - name - the name representing the processing-instructions  you want to retreive.

    **Returns:**
    - an XMLList containing the result of calling the
      _processingInstructions(name)_ method of each XML object
      in this XMLList object.



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

### text()
- text(): [XMLList](TopLevel.XMLList.md)
  - : Calls the _text()_ method of each XML object contained
      in this XMLList object and returns an XMLList containing
      the results concatenated in order.


    **Returns:**
    - the concatenated results of calling the _text()_
      method of every XML object contained in this XMLList.



---

### toString()
- toString(): [String](TopLevel.String.md)
  - : Returns the String representation of this XMLList object.

    **Returns:**
    - the String representation of this XMLList object.


---

### toXMLString()
- toXMLString(): [String](TopLevel.String.md)
  - : Returns an XML-encoded String representation of the XMLList object
      by calling the _toXMLString_ method on each property contained
      within this XMLList object.


    **Returns:**
    - an XML-encoded String representation of the XMLList object
      by calling the _toXMLString_ method on each property contained
      within this XMLList object.



---

### valueOf()
- valueOf(): [XMLList](TopLevel.XMLList.md)
  - : Returns this XMLList object.

    **Returns:**
    - this XMLList object.


---

<!-- prettier-ignore-end -->
