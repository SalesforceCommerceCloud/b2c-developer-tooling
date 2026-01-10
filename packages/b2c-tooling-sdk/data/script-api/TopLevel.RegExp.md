<!-- prettier-ignore-start -->
# Class RegExp

- [TopLevel.Object](TopLevel.Object.md)
  - [TopLevel.RegExp](TopLevel.RegExp.md)

The RegExp object is a static object that generates instances of a regular
expression for pattern matching and monitors all regular expressions in the
current window or frame. Consult ECMA standards for the format of the pattern
strings supported by these regular expressions.



## Property Summary

| Property | Description |
| --- | --- |
| [global](#global): [Boolean](TopLevel.Boolean.md) | If the regular expression instance has the _g_ modifier, then  this property is set to true. |
| [ignoreCase](#ignorecase): [Boolean](TopLevel.Boolean.md) | If the regular expression instance has the _i_ modifier, then  this property is set to true. |
| [lastIndex](#lastindex): [Number](TopLevel.Number.md) | This is the zero-based index value of the character within the  String where the next search for the pattern begins. |
| [multiline](#multiline): [Boolean](TopLevel.Boolean.md) | If a search extends across multiple lines of test, the _multiline_  property is set to true. |
| [source](#source): [String](TopLevel.String.md) | A String version of the characters used to create the regular  expression. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [RegExp](#regexpstring)([String](TopLevel.String.md)) | Constructs the regular expression using the specified  pattern. |
| [RegExp](#regexpstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Constructs the regular expression using the specified  pattern and attributes. |

## Method Summary

| Method | Description |
| --- | --- |
| [exec](TopLevel.RegExp.md#execstring)([String](TopLevel.String.md)) | Performs a search through the specified parameter for the  current regular expression and returns an array of match  information if successful. |
| [test](TopLevel.RegExp.md#teststring)([String](TopLevel.String.md)) | Returns true if there is a match of the regular expression anywhere in the  specified parameter. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### global
- global: [Boolean](TopLevel.Boolean.md)
  - : If the regular expression instance has the _g_ modifier, then
      this property is set to true.



---

### ignoreCase
- ignoreCase: [Boolean](TopLevel.Boolean.md)
  - : If the regular expression instance has the _i_ modifier, then
      this property is set to true.



---

### lastIndex
- lastIndex: [Number](TopLevel.Number.md)
  - : This is the zero-based index value of the character within the
      String where the next search for the pattern begins. In a new
      search, the value is zero.



---

### multiline
- multiline: [Boolean](TopLevel.Boolean.md)
  - : If a search extends across multiple lines of test, the _multiline_
      property is set to true.



---

### source
- source: [String](TopLevel.String.md)
  - : A String version of the characters used to create the regular
      expression. The value does not include the forward slash delimiters that
      surround the expression.



---

## Constructor Details

### RegExp(String)
- RegExp(pattern: [String](TopLevel.String.md))
  - : Constructs the regular expression using the specified
      pattern.


    **Parameters:**
    - pattern - the regular expression pattern to use.


---

### RegExp(String, String)
- RegExp(pattern: [String](TopLevel.String.md), attributes: [String](TopLevel.String.md))
  - : Constructs the regular expression using the specified
      pattern and attributes. See the class documentation for more information
      on the pattern and attributes.


    **Parameters:**
    - pattern - the regular expression pattern to use.
    - attributes - one or more attributes that control  how the regular expression is executed.


---

## Method Details

### exec(String)
- exec(string: [String](TopLevel.String.md)): [Array](TopLevel.Array.md)
  - : Performs a search through the specified parameter for the
      current regular expression and returns an array of match
      information if successful. Returns null if the search produces
      no results.


    **Parameters:**
    - string - the String to apply the regular expression.

    **Returns:**
    - an array of match information if successful, null otherwise.


---

### test(String)
- test(string: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Returns true if there is a match of the regular expression anywhere in the
      specified parameter. No additional information is
      available about the results of the search.


    **Parameters:**
    - string - the String to apply the regular expression.

    **Returns:**
    - true if there is a match of the regular expression anywhere in the
      specified parameter, false otherwise.



---

<!-- prettier-ignore-end -->
