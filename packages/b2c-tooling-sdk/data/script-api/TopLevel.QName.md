<!-- prettier-ignore-start -->
# Class QName

- [TopLevel.Object](TopLevel.Object.md)
  - [TopLevel.QName](TopLevel.QName.md)

QName objects are used to represent qualified names of XML 
elements and attributes. Each QName object has a local name 
of type string and a namespace URI of type string or null. 
When the namespace URI is null, this qualified name matches 
any namespace.

If the QName of an XML element is specified without identifying a 
namespace (i.e., as an unqualified identifier), the uri property 
of the associated QName will be set to the in-scope default 
namespace. If the QName of an XML attribute is 
specified without identifying a namespace, the uri property of 
the associated QName will be the empty string representing no namespace.



## Property Summary

| Property | Description |
| --- | --- |
| [localName](#localname): [String](TopLevel.String.md) `(read-only)` | Returns the local name of the QName object. |
| [uri](#uri): [String](TopLevel.String.md) `(read-only)` | Returns the Uniform Resource Identifier (URI) of the QName object. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [QName](#qname)() | Constructs a QName object where _localName_  is set to an empty String. |
| [QName](#qnameqname)([QName](TopLevel.QName.md)) | Constructs a QName object that is a copy of the specified  _qname_. |
| [QName](#qnamenamespace-qname)([Namespace](TopLevel.Namespace.md), [QName](TopLevel.QName.md)) | Creates a QName object with a uri from a Namespace object and  a localName from a QName object. |

## Method Summary

| Method | Description |
| --- | --- |
| [getLocalName](TopLevel.QName.md#getlocalname)() | Returns the local name of the QName object. |
| [getUri](TopLevel.QName.md#geturi)() | Returns the Uniform Resource Identifier (URI) of the QName object. |
| [toString](TopLevel.QName.md#tostring)() | Returns a string composed of the URI, and the local name for the QName   object, separated by "::". |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### localName
- localName: [String](TopLevel.String.md) `(read-only)`
  - : Returns the local name of the QName object.


---

### uri
- uri: [String](TopLevel.String.md) `(read-only)`
  - : Returns the Uniform Resource Identifier (URI) of the QName object.


---

## Constructor Details

### QName()
- QName()
  - : Constructs a QName object where _localName_
      is set to an empty String.



---

### QName(QName)
- QName(qname: [QName](TopLevel.QName.md))
  - : Constructs a QName object that is a copy of the specified
      _qname_. If the argument is not
      a QName object, the argument is converted to a string and assigned
      to the localName property of the new QName instance.


    **Parameters:**
    - qname - the QName from which this QName will   be constructed.


---

### QName(Namespace, QName)
- QName(uri: [Namespace](TopLevel.Namespace.md), localName: [QName](TopLevel.QName.md))
  - : Creates a QName object with a uri from a Namespace object and
      a localName from a QName object. If either argument is not
      the expected data type, the argument is converted to a string
      and assigned to the corresponding property of the new QName object.


    **Parameters:**
    - uri - a Namespace object from which to copy the uri value.  An argument of any other type is converted to a string.
    - localName - a QName object from which to copy the  localName value. An argument of any other type is converted to a string.


---

## Method Details

### getLocalName()
- getLocalName(): [String](TopLevel.String.md)
  - : Returns the local name of the QName object.

    **Returns:**
    - the local name of the QName object.


---

### getUri()
- getUri(): [String](TopLevel.String.md)
  - : Returns the Uniform Resource Identifier (URI) of the QName object.

    **Returns:**
    - the Uniform Resource Identifier (URI) of the QName object.


---

### toString()
- toString(): [String](TopLevel.String.md)
  - : Returns a string composed of the URI, and the local name for the QName 
      object, separated by "::". The format depends on the uri property of 
      the QName object:
      If uri == ""
            toString returns localName
      else if uri == null 
            toString returns \*::localName
      else
         toString returns uri::localNam


    **Returns:**
    - a string composed of the URI, and the local name for the QName 
      object, separated by "::".



---

<!-- prettier-ignore-end -->
