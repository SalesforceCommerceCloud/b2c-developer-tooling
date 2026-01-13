<!-- prettier-ignore-start -->
# Class JSON

- [TopLevel.Object](TopLevel.Object.md)
  - [TopLevel.JSON](TopLevel.JSON.md)

The JSON object is a single object that contains two functions, parse and stringify,
that are used to parse and construct JSON texts. The JSON Data Interchange Format is
described in RFC 4627.



## Constructor Summary

| Constructor | Description |
| --- | --- |
| [JSON](#json)() |  |

## Method Summary

| Method | Description |
| --- | --- |
| static [parse](TopLevel.JSON.md#parsestring)([String](TopLevel.String.md)) | The parse function parses a JSON text (a JSON formatted string) and produces an ECMAScript  value. |
| static [parse](TopLevel.JSON.md#parsestring-function)([String](TopLevel.String.md), [Function](TopLevel.Function.md)) | The parse function parses a JSON text (a JSON formatted string) and produces an ECMAScript  value. |
| static [stringify](TopLevel.JSON.md#stringifyobject)([Object](TopLevel.Object.md)) | The stringify function produces a JSON formatted string that captures information  from a JavaScript value. |
| static [stringify](TopLevel.JSON.md#stringifyobject-object)([Object](TopLevel.Object.md), [Object](TopLevel.Object.md)) | The stringify function produces a JSON formatted string that captures information  from a JavaScript value. |
| static [stringify](TopLevel.JSON.md#stringifyobject-object-string)([Object](TopLevel.Object.md), [Object](TopLevel.Object.md), [String](TopLevel.String.md)) | The stringify function produces a JSON formatted string that captures information  from a JavaScript value. |
| static [stringify](TopLevel.JSON.md#stringifyobject-object-number)([Object](TopLevel.Object.md), [Object](TopLevel.Object.md), [Number](TopLevel.Number.md)) | The stringify function produces a JSON formatted string that captures information  from a JavaScript value. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constructor Details

### JSON()
- JSON()
  - : 


---

## Method Details

### parse(String)
- static parse(json: [String](TopLevel.String.md)): [Object](TopLevel.Object.md)
  - : The parse function parses a JSON text (a JSON formatted string) and produces an ECMAScript
      value. The JSON format is a restricted form of ECMAScript literal. JSON objects are realized
      as ECMAScript objects. JSON Arrays are realized as ECMAScript arrays. JSON strings, numbers,
      booleans, and null are realized as ECMAScript strings, numbers, booleans, and null.


    **Parameters:**
    - json - a JSON formatted string

    **Returns:**
    - the object produced from the JSON string


---

### parse(String, Function)
- static parse(json: [String](TopLevel.String.md), reviver: [Function](TopLevel.Function.md)): [Object](TopLevel.Object.md)
  - : The parse function parses a JSON text (a JSON formatted string) and produces an ECMAScript
      value. The JSON format is a restricted form of ECMAScript literal. JSON objects are realized
      as ECMAScript objects. JSON Arrays are realized as ECMAScript arrays. JSON strings, numbers,
      booleans, and null are realized as ECMAScript strings, numbers, booleans, and null.
      
      The optional reviver parameter is a function that takes two parameters, (key, value). It can
      filter and transform the results. It is called with each of the key/value pairs produced by the
      parse, and its return value is used instead of the original value. If it returns what it
      received, the structure is not modified. If it returns undefined then the member is deleted
      from the result.


    **Parameters:**
    - json - a JSON formatted string
    - reviver - a function, which is called with each key, value pair during parsing

    **Returns:**
    - the object produced from the JSON string


---

### stringify(Object)
- static stringify(value: [Object](TopLevel.Object.md)): [String](TopLevel.String.md)
  - : The stringify function produces a JSON formatted string that captures information
      from a JavaScript value. The value parameter is a JavaScript value is usually an
      object or array, although it can also be a string, boolean, number or null.
      
      Note: Stringifying API objects is not supported.


    **Parameters:**
    - value - the value which is stringified

    **Returns:**
    - the JSON string


---

### stringify(Object, Object)
- static stringify(value: [Object](TopLevel.Object.md), replacer: [Object](TopLevel.Object.md)): [String](TopLevel.String.md)
  - : The stringify function produces a JSON formatted string that captures information
      from a JavaScript value. The value parameter is a JavaScript value is usually an
      object or array, although it can also be a string, boolean, number or null. The
      optional replacer parameter is either a function that alters the way objects and
      arrays are stringified, or an array of strings that acts as an allowlist for selecting
      the keys that will be stringified.
      
      Note: Stringifying API objects is not supported.


    **Parameters:**
    - value - the value which is stringified
    - replacer - either a function, which is called with a key and value as parameter, or an array with an allowlist

    **Returns:**
    - the JSON string


---

### stringify(Object, Object, String)
- static stringify(value: [Object](TopLevel.Object.md), replacer: [Object](TopLevel.Object.md), space: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : The stringify function produces a JSON formatted string that captures information
      from a JavaScript value. The value parameter is a JavaScript value is usually an
      object or array, although it can also be a string, boolean, number or null. The
      optional replacer parameter is either a function that alters the way objects and
      arrays are stringified, or an array of strings that acts as an allowlist for selecting
      the keys that will be stringified. The optional space parameter is a string or number
      that allows the result to have white space injected into it to improve human readability.
      
      Note: Stringifying API objects is not supported.


    **Parameters:**
    - value - the value which is stringified
    - replacer - either a function, which is called with a key and value as parameter, or an array with an allowlist
    - space - a string for indentation

    **Returns:**
    - the JSON string


---

### stringify(Object, Object, Number)
- static stringify(value: [Object](TopLevel.Object.md), replacer: [Object](TopLevel.Object.md), space: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : The stringify function produces a JSON formatted string that captures information
      from a JavaScript value. The value parameter is a JavaScript value is usually an
      object or array, although it can also be a string, boolean, number or null. The
      optional replacer parameter is either a function that alters the way objects and
      arrays are stringified, or an array of strings that acts as an allowlist for selecting
      the keys that will be stringified. The optional space parameter is a string or number
      that allows the result to have white space injected into it to improve human readability.
      
      Note: Stringifying API objects is not supported.


    **Parameters:**
    - value - the value which is stringified
    - replacer - either a function, which is called with a key and value as parameter, or an array with an allowlist
    - space - the number of space for indenting

    **Returns:**
    - the JSON string


---

<!-- prettier-ignore-end -->
