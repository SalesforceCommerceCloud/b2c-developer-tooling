<!-- prettier-ignore-start -->
# Class Namespace

- [TopLevel.Object](TopLevel.Object.md)
  - [TopLevel.Namespace](TopLevel.Namespace.md)

Namespace objects represent XML namespaces and provide an
association between a namespace prefix and a Unique Resource
Identifier (URI). The prefix is either the undefined value
or a string value that may be used to reference the namespace
within the lexical representation of an XML value. When an
XML object containing a namespace with an undefined prefix is
encoded as XML by the method toXMLString(), the implementation
will automatically generate a prefix.
The URI is a string value used to uniquely identify the namespace.



## Property Summary

| Property | Description |
| --- | --- |
| [prefix](#prefix): [String](TopLevel.String.md) `(read-only)` | Returns the prefix of the Namespace object. |
| [uri](#uri): [String](TopLevel.String.md) `(read-only)` | Returns the Uniform Resource Identifier (URI) of the Namespace object. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [Namespace](#namespace)() | Constructs a simple namespace where the  _uri_ and _prefix_ properties are set to an empty string. |
| [Namespace](#namespaceobject)([Object](TopLevel.Object.md)) | Constructs a Namespace object and assigns values to the  _uri_ and _prefix_ properties based on the type  of _uriValue_. |
| [Namespace](#namespaceobject-object)([Object](TopLevel.Object.md), [Object](TopLevel.Object.md)) | Constructs a Namespace object and assigns values to the  _uri_ and _prefix_ properties. |

## Method Summary

| Method | Description |
| --- | --- |
| [getPrefix](TopLevel.Namespace.md#getprefix)() | Returns the prefix of the Namespace object. |
| [getUri](TopLevel.Namespace.md#geturi)() | Returns the Uniform Resource Identifier (URI) of the Namespace object. |
| [toString](TopLevel.Namespace.md#tostring)() | Returns a string representation of this Namespace object. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### prefix
- prefix: [String](TopLevel.String.md) `(read-only)`
  - : Returns the prefix of the Namespace object.


---

### uri
- uri: [String](TopLevel.String.md) `(read-only)`
  - : Returns the Uniform Resource Identifier (URI) of the Namespace object.


---

## Constructor Details

### Namespace()
- Namespace()
  - : Constructs a simple namespace where the
      _uri_ and _prefix_ properties are set to an empty string.
      A namespace with URI set to the empty string represents no namespace.
      No namespace is used in XML objects to explicitly specify
      that a name is not inside a namespace and may never be
      associated with a prefix other than the empty string.



---

### Namespace(Object)
- Namespace(uriValue: [Object](TopLevel.Object.md))
  - : Constructs a Namespace object and assigns values to the
      _uri_ and _prefix_ properties based on the type
      of _uriValue_. If _uriValue_ is a
      Namespace object, a copy of the Namespace is constructed.
      If _uriValue_ is a QName object, the _uri_ property is
      set to the QName object's _uri_ property.
      Otherwise, _uriValue_ is converted into a string and
      assigned to the _uri_ property.


    **Parameters:**
    - uriValue - the value to use when constructing the Namespace.


---

### Namespace(Object, Object)
- Namespace(prefixValue: [Object](TopLevel.Object.md), uriValue: [Object](TopLevel.Object.md))
  - : Constructs a Namespace object and assigns values to the
      _uri_ and _prefix_ properties.
      
      The value of the _prefixValue_ parameter is assigned to the
      _prefix_ property in the following manner:
      
      1. If undefined is passed, prefix is set to undefined.
      2. If the argument is a valid XML name, it is converted   to a string and assigned to the prefix property.
      3. If the argument is not a valid XML name, the prefix   property is set to undefined.
      
      The value of the _uriValue_ parameter is assigned
      to the _uri_ property in the following manner:
      
      1. If a QName object is passed for the uriValue parameter,   the uri property is set to the value of the QName object's uri property.
      2. If a QName object is not passed for the uriValue parameter,   the uriValue parameter is converted to a string and assigned to the uri property. 


    **Parameters:**
    - prefixValue - the prefix value to use when constructing the Namespace.
    - uriValue - the value to use when constructing the Namespace.


---

## Method Details

### getPrefix()
- getPrefix(): [String](TopLevel.String.md)
  - : Returns the prefix of the Namespace object.

    **Returns:**
    - the prefix of the Namespace object.


---

### getUri()
- getUri(): [String](TopLevel.String.md)
  - : Returns the Uniform Resource Identifier (URI) of the Namespace object.

    **Returns:**
    - the Uniform Resource Identifier (URI) of the Namespace object.


---

### toString()
- toString(): [String](TopLevel.String.md)
  - : Returns a string representation of this Namespace object.

    **Returns:**
    - a string representation of this Namespace object.


---

<!-- prettier-ignore-end -->
