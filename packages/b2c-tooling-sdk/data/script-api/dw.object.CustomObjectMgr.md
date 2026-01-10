<!-- prettier-ignore-start -->
# Class CustomObjectMgr

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.CustomObjectMgr](dw.object.CustomObjectMgr.md)

Manager class which provides methods for creating, retrieving, deleting,
and searching for custom objects.


To search for system objects, use [SystemObjectMgr](dw.object.SystemObjectMgr.md).



## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| static [createCustomObject](dw.object.CustomObjectMgr.md#createcustomobjectstring-number)([String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Returns a new custom object instance of the specified type, using the  given key value. |
| static [createCustomObject](dw.object.CustomObjectMgr.md#createcustomobjectstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Returns a new custom object instance of the specified type, using the  given key value. |
| static [describe](dw.object.CustomObjectMgr.md#describestring)([String](TopLevel.String.md)) | Returns the meta data for the given type. |
| static [getAllCustomObjects](dw.object.CustomObjectMgr.md#getallcustomobjectsstring)([String](TopLevel.String.md)) | Returns all custom objects of a specific type. |
| static [getCustomObject](dw.object.CustomObjectMgr.md#getcustomobjectstring-number)([String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Returns a custom object based on it's type and unique key. |
| static [getCustomObject](dw.object.CustomObjectMgr.md#getcustomobjectstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Returns a custom object based on it's type and unique key. |
| static [queryCustomObject](dw.object.CustomObjectMgr.md#querycustomobjectstring-string-object)([String](TopLevel.String.md), [String](TopLevel.String.md), [Object...](TopLevel.Object.md)) | <p/>  Searches for a single custom object instance. |
| static [queryCustomObjects](dw.object.CustomObjectMgr.md#querycustomobjectsstring-map-string)([String](TopLevel.String.md), [Map](dw.util.Map.md), [String](TopLevel.String.md)) | <p/>  Searches for custom object instances. |
| static [queryCustomObjects](dw.object.CustomObjectMgr.md#querycustomobjectsstring-string-string-object)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Object...](TopLevel.Object.md)) | Searches for custom object instances. |
| static [remove](dw.object.CustomObjectMgr.md#removecustomobject)([CustomObject](dw.object.CustomObject.md)) | Removes a given custom object. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Method Details

### createCustomObject(String, Number)
- static createCustomObject(type: [String](TopLevel.String.md), keyValue: [Number](TopLevel.Number.md)): [CustomObject](dw.object.CustomObject.md)
  - : Returns a new custom object instance of the specified type, using the
      given key value. Custom object keys need to be unique for custom object
      type.


    **Parameters:**
    - type - The unique name of the custom object type.
    - keyValue - The unique key value for the instance.

    **Returns:**
    - The newly created custom object instance.

    **Throws:**
    - IllegalArgumentException - if the given type is invalid


---

### createCustomObject(String, String)
- static createCustomObject(type: [String](TopLevel.String.md), keyValue: [String](TopLevel.String.md)): [CustomObject](dw.object.CustomObject.md)
  - : Returns a new custom object instance of the specified type, using the
      given key value. Custom object keys need to be unique for custom object
      type.


    **Parameters:**
    - type - The unique name of the custom object type.
    - keyValue - The unique key value for the instance.

    **Returns:**
    - The newly created custom object instance.

    **Throws:**
    - IllegalArgumentException - if the given type is invalid


---

### describe(String)
- static describe(type: [String](TopLevel.String.md)): [ObjectTypeDefinition](dw.object.ObjectTypeDefinition.md)
  - : Returns the meta data for the given type.

    **Parameters:**
    - type - the type whose meta data is returned.

    **Returns:**
    - the meta data for the given type.

    **Throws:**
    - IllegalArgumentException - if the given type is invalid


---

### getAllCustomObjects(String)
- static getAllCustomObjects(type: [String](TopLevel.String.md)): [SeekableIterator](dw.util.SeekableIterator.md)
  - : Returns all custom objects of a specific type.
      
      
      It is strongly recommended to call `close()` on the returned SeekableIterator
      if not all of its elements are being retrieved. This will ensure the proper cleanup of system resources.


    **Parameters:**
    - type - The name of the custom object type.

    **Throws:**
    - IllegalArgumentException - if the given type is invalid

    **See Also:**
    - [SeekableIterator.close()](dw.util.SeekableIterator.md#close)


---

### getCustomObject(String, Number)
- static getCustomObject(type: [String](TopLevel.String.md), keyValue: [Number](TopLevel.Number.md)): [CustomObject](dw.object.CustomObject.md)
  - : Returns a custom object based on it's type and unique key.

    **Parameters:**
    - type - The name of the custom object type.
    - keyValue - The unique key value.

    **Returns:**
    - The matching custom object instance or `null` in case
               no matching custom object instance could be found.


    **Throws:**
    - IllegalArgumentException - if the given type is invalid


---

### getCustomObject(String, String)
- static getCustomObject(type: [String](TopLevel.String.md), keyValue: [String](TopLevel.String.md)): [CustomObject](dw.object.CustomObject.md)
  - : Returns a custom object based on it's type and unique key.

    **Parameters:**
    - type - The name of the custom object type.
    - keyValue - The unique key value.

    **Returns:**
    - The matching custom object instance or `null` in case
               no matching custom object instance could be found.


    **Throws:**
    - IllegalArgumentException - if the given type is invalid


---

### queryCustomObject(String, String, Object...)
- static queryCustomObject(type: [String](TopLevel.String.md), queryString: [String](TopLevel.String.md), args: [Object...](TopLevel.Object.md)): [CustomObject](dw.object.CustomObject.md)
  - : 
      
      Searches for a single custom object instance.
      
      
      The search can be configured using a simple query language, which provides most common filter and operator
      functionality.
      
      
      The identifier for an **attribute** to use in a query condition is always the ID of the attribute as defined
      in the type definition. For custom defined attributes the prefix custom is required in the search term (e.g.
      `custom.color = {1}`), while for system attributes no prefix is used (e.g. `name = {4}`).
      
      
      Supported attribute value **types** with sample expression values:
      
      - _String_`'String', 'Str*', 'Strin?'`
      - _Integer_`1, 3E4`
      - _Number_`1.0, 3.99E5`
      - _Date_`yyyy-MM-dd e.g. 2007-05-31 (Default TimeZone = UTC)`
      - _DateTime_`yyyy-MM-dd'T'hh:mm:ss+Z e.g. 2007-05-31T00:00+Z (Z TimeZone = UTC) or 2007-05-31T00:00:00`
      - _Boolean_`true, false`
      - _Email_`'search@demandware.com', '*@demandware.com'`
      - _Set of String_`'String', 'Str*', 'Strin?'`
      - _Set of Integer_`1, 3E4`
      - _Set of Number_`1.0, 3.99E5`
      - _Enum of String_`'String', 'Str*', 'Strin?'`
      - _Enum of Integer_`1, 3E4`
      
      
      
      The following types of attributes are not queryable:
      
      
      - _Image_
      - _HTML_
      - _Text_
      - _Quantity_
      - _Password_
      
      
      
      Note, that some system attributes are not queryable by default regardless of the actual value type code.
      
      
      The following **operators** are supported in a condition:
      
      
      - `=`Equals - All types; supports NULL value (`thumbnail = NULL`)
      - `!=`Not equals - All types; supports NULL value (`thumbnail != NULL`)
      - `<`Less than - Integer, Number and Date types only
      - `>`Greater than - Integer, Number and Date types only
      - `<=`Less or equals than - Integer, Number and Date types only
      - `>=`Greater or equals than - Integer, Number and Date types only
      - `LIKE`Like - String types and Email only; use if leading or trailing wildcards will be used to  support substring search(`custom.country LIKE 'US*'`)
      - `ILIKE`Case-independent Like - String types and Email only, use to support case insensitive query  (`custom.country ILIKE 'usa'`), does also support wildcards for substring matching
      
      
      
      Conditions can be combined using logical expressions 'AND', 'OR' and 'NOT' and nested using parenthesis e.g.
      `gender = {1} AND (age >= {2} OR (NOT profession LIKE {3}))`.
      
      
      The query language provides a placeholder syntax to pass objects as additional search parameters. Each passed
      object is related to a placeholder in the query string. The placeholder must be an Integer that is surrounded by
      braces. The first Integer value must be '0', the second '1' and so on, e.g.
      `querySystemObjects("sample", "age = {0} or creationDate >= {1}", 18, date)`
      
      
      If there is more than one object matching the specified query criteria, the result is not deterministic. In order
      to retrieve a single object from a sorted result set it is recommended to use the following code:
      `queryCustomObjects("", "custom.myAttr asc", null).first()`. The method `first()` returns
      only the next element and closes the iterator.
      
      
      This method does not consider locale specific attributes. It returns all objects by checking the default
      non-localizable attributes. Any locale specific filtering after fetching the objects must be done by other custom
      code.
      
      Example:
      
      - Get the custom objects using this method with non-localized attributes query.
      - Access the `obj.getCustom("myattr")`. It returns the localized value of the attribute.


    **Parameters:**
    - type - the custom object type for the query.
    - queryString - the actual query.
    - args - optional parameters for the queryString.

    **Returns:**
    - the custom object defined by `type` which was found when executing the
              `queryString`.


    **Throws:**
    - IllegalArgumentException - if the given type is invalid


---

### queryCustomObjects(String, Map, String)
- static queryCustomObjects(type: [String](TopLevel.String.md), queryAttributes: [Map](dw.util.Map.md), sortString: [String](TopLevel.String.md)): [SeekableIterator](dw.util.SeekableIterator.md)
  - : 
      
      Searches for custom object instances.
      
      
      The search can be configured with a map, which key-value pairs are converted into a query expression. The
      key-value pairs are turned into a sequence of '=' or 'like' conditions, which are combined with AND statements.
      
      
      Example:
      
      A map with the key/value pairs: _'name'/'tom\*', 'age'/66_ will be converted as follows:
      `"name like 'tom*' and age = 66"`
      
      
      The identifier for an **attribute** to use in a query condition is always the ID of the attribute as defined
      in the type definition. For custom defined attributes the prefix custom is required in the search term (e.g.
      `custom.color = {1}`), while for system attributes no prefix is used (e.g. `name = {4}`).
      
      
      Supported attribute value **types** with sample expression values:
      
      - _String_`'String', 'Str*', 'Strin?'`
      - _Integer_`1, 3E4`
      - _Number_`1.0, 3.99E5`
      - _Date_`yyyy-MM-dd e.g. 2007-05-31 (Default TimeZone = UTC)`
      - _DateTime_`yyyy-MM-dd'T'hh:mm:ss+Z e.g. 2007-05-31T00:00+Z (Z TimeZone = UTC) or 2007-05-31T00:00:00`
      - _Boolean_`true, false`
      - _Email_`'search@demandware.com', '*@demandware.com'`
      - _Set of String_`'String', 'Str*', 'Strin?'`
      - _Set of Integer_`1, 3E4`
      - _Set of Number_`1.0, 3.99E5`
      - _Enum of String_`'String', 'Str*', 'Strin?'`
      - _Enum of Integer_`1, 3E4`
      
      
      
      The following types of attributes are not queryable:
      
      
      - _Image_
      - _HTML_
      - _Text_
      - _Quantity_
      - _Password_
      
      
      
      Note, that some system attributes are not queryable by default regardless of the actual value type code.
      
      
      The **sorting** parameter is optional and may contain a comma separated list of attribute names to sort by.
      Each sort attribute name may be followed by an optional sort direction specifier ('asc' | 'desc'). Default
      sorting directions is ascending, if no direction was specified.
      
      Example: `age desc, name`
      
      Please note that specifying a localized custom attribute as the sorting attribute is currently not supported.
      
      
      It is strongly recommended to call `close()` on the returned SeekableIterator if not all of its
      elements are being retrieved. This will ensure the proper cleanup of system resources.
      
      
      
      
      This method does not consider locale specific attributes. It returns all objects by checking the default
      non-localizable attributes. Any locale specific filtering after fetching the objects must be done by other custom
      code.
      
      Example:
      
      - Get the custom objects using this method with non-localized attributes query.
      - Access the `obj.getCustom("myattr")`. It returns the localized value of the attribute.


    **Parameters:**
    - type - the custom object type for the query.
    - queryAttributes - key-value pairs, which define the query.
    - sortString - an optional sorting or null if no sorting is necessary.

    **Returns:**
    - SeekableIterator containing the result set of the query.

    **Throws:**
    - IllegalArgumentException - if the given type is invalid

    **See Also:**
    - [SeekableIterator.close()](dw.util.SeekableIterator.md#close)


---

### queryCustomObjects(String, String, String, Object...)
- static queryCustomObjects(type: [String](TopLevel.String.md), queryString: [String](TopLevel.String.md), sortString: [String](TopLevel.String.md), args: [Object...](TopLevel.Object.md)): [SeekableIterator](dw.util.SeekableIterator.md)
  - : Searches for custom object instances.
      
      
      The search can be configured using a simple query language, which provides most common filter and operator
      functionality.
      
      
      The identifier for an **attribute** to use in a query condition is always the ID of the attribute as defined
      in the type definition. For custom defined attributes the prefix custom is required in the search term (e.g.
      `custom.color = {1}`), while for system attributes no prefix is used (e.g. `name = {4}`).
      
      
      Supported attribute value **types** with sample expression values:
      
      - _String_`'String', 'Str*', 'Strin?'`
      - _Integer_`1, 3E4`
      - _Number_`1.0, 3.99E5`
      - _Date_`yyyy-MM-dd e.g. 2007-05-31 (Default TimeZone = UTC)`
      - _DateTime_`yyyy-MM-dd'T'hh:mm:ss+Z e.g. 2007-05-31T00:00+Z (Z TimeZone = UTC) or 2007-05-31T00:00:00`
      - _Boolean_`true, false`
      - _Email_`'search@demandware.com', '*@demandware.com'`
      - _Set of String_`'String', 'Str*', 'Strin?'`
      - _Set of Integer_`1, 3E4`
      - _Set of Number_`1.0, 3.99E5`
      - _Enum of String_`'String', 'Str*', 'Strin?'`
      - _Enum of Integer_`1, 3E4`
      
      
      
      The following types of attributes are not queryable:
      
      
      - _Image_
      - _HTML_
      - _Text_
      - _Quantity_
      - _Password_
      
      
      
      Note, that some system attributes are not queryable by default regardless of the actual value type code.
      
      
      The following **operators** are supported in a condition:
      
      
      - `=`Equals - All types; supports NULL value (`thumbnail = NULL`)
      - `!=`Not equals - All types; supports NULL value (`thumbnail != NULL`)
      - `<`Less than - Integer, Number and Date types only
      - `>`Greater than - Integer, Number and Date types only
      - `<=`Less or equals than - Integer, Number and Date types only
      - `>=`Greater or equals than - Integer, Number and Date types only
      - `LIKE`Like - String types and Email only; use if leading or trailing wildcards will be used to  support substring search(`custom.country LIKE 'US*'`)
      - `ILIKE`Caseindependent Like - String types and Email only, use to support case insensitive query  (`custom.country ILIKE 'usa'`), does also support wildcards for substring matching
      
      
      
      Conditions can be combined using logical expressions 'AND', 'OR' and 'NOT' and nested using parenthesis e.g.
      `gender = {1} AND (age >= {2} OR (NOT profession LIKE {3}))`.
      
      
      The query language provides a placeholder syntax to pass objects as additional search parameters. Each passed
      object is related to a placeholder in the query string. The placeholder must be an Integer that is surrounded by
      braces. The first Integer value must be '0', the second '1' and so on, e.g.
      `querySystemObjects("sample", "age = {0} or creationDate >= {1}", 18, date)`
      
      
      The **sorting** parameter is optional and may contain a comma separated list of attribute names to sort by.
      Each sort attribute name may be followed by an optional sort direction specifier ('asc' | 'desc'). Default
      sorting directions is ascending, if no direction was specified.
      
      Example: `age desc, name`
      
      Please note that specifying a localized custom attribute as the sorting attribute is currently not supported.
      
      
      Sometimes it is desired to get all instances of specified type with a special sorting condition. This can be
      easily done by providing the 'type' of the custom object and the 'sortString' in combination with an empty
      'queryString', e.g. `queryCustomObjects("sample", "", "custom.myAttr asc")`
      
      
      It is strongly recommended to call `close()` on the returned SeekableIterator if not all of its
      elements are being retrieved. This will ensure the proper cleanup of system resources.
      
      
      
      
      This method does not consider locale specific attributes. It returns all objects by checking the default
      non-localizable attributes. Any locale specific filtering after fetching the objects must be done by other custom
      code.
      
      Example:
      
      - Get the custom objects using this method with non-localized attributes query.
      - Access the `obj.getCustom("myattr")`. It returns the localized value of the attribute.


    **Parameters:**
    - type - the custom object type for the query.
    - queryString - the actual query.
    - sortString - an optional sorting or null if no sorting is necessary.
    - args - optional parameters for the queryString.

    **Returns:**
    - SeekableIterator containing the result set of the query.

    **Throws:**
    - IllegalArgumentException - if the given type is invalid

    **See Also:**
    - [SeekableIterator.close()](dw.util.SeekableIterator.md#close)


---

### remove(CustomObject)
- static remove(object: [CustomObject](dw.object.CustomObject.md)): void
  - : Removes a given custom object.

    **Parameters:**
    - object - the custom object to remove, must not be null.


---

<!-- prettier-ignore-end -->
