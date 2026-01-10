<!-- prettier-ignore-start -->
# Class SystemObjectMgr

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.SystemObjectMgr](dw.object.SystemObjectMgr.md)

Manager class which provides methods for querying of system objects with
meta data using the Commerce Cloud Digital query language. See individual API methods for
details on the query language.


Note: Other manager classes such as [CustomerMgr](dw.customer.CustomerMgr.md),
[ProductMgr](dw.catalog.ProductMgr.md), etc provide more specific and fine-grained
querying methods that can not be achieved using the general query language.



The following system object types are supported:


- GiftCertificate
- SourceCodeGroup
- Store
- ProductList


Support for the following system object types is deprecated:


- Order
- Profile


Use the search methods from [CustomerMgr](dw.customer.CustomerMgr.md) and [OrderMgr](dw.order.OrderMgr.md),
respectively for querying these types.


To search for custom objects, use [CustomObjectMgr](dw.object.CustomObjectMgr.md).
**Note:** this class allows access to sensitive information through
operations that retrieve the Profile and Order objects.
Pay attention to appropriate legal and regulatory requirements related to this data.



## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| static [describe](dw.object.SystemObjectMgr.md#describestring)([String](TopLevel.String.md)) | Returns the object type definition for the given system object type. |
| static [getAllSystemObjects](dw.object.SystemObjectMgr.md#getallsystemobjectsstring)([String](TopLevel.String.md)) | Returns all system objects of a specific type. |
| static [querySystemObject](dw.object.SystemObjectMgr.md#querysystemobjectstring-string-object)([String](TopLevel.String.md), [String](TopLevel.String.md), [Object...](TopLevel.Object.md)) | <p>  Searches for a single system object instance. |
| static [querySystemObjects](dw.object.SystemObjectMgr.md#querysystemobjectsstring-map-string)([String](TopLevel.String.md), [Map](dw.util.Map.md), [String](TopLevel.String.md)) | <p>  Searches for system object instances. |
| static [querySystemObjects](dw.object.SystemObjectMgr.md#querysystemobjectsstring-string-string-object)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Object...](TopLevel.Object.md)) | <p>  Searches for system object instances. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Method Details

### describe(String)
- static describe(type: [String](TopLevel.String.md)): [ObjectTypeDefinition](dw.object.ObjectTypeDefinition.md)
  - : Returns the object type definition for the given system object type.
      
      This method can be used for all system object types that are derived from ExtensibleObject.


    **Parameters:**
    - type - system object type whose type definition should be returned

    **Returns:**
    - the matching object type definition or `null` in case no
               such type definition exists.



---

### getAllSystemObjects(String)
- static getAllSystemObjects(type: [String](TopLevel.String.md)): [SeekableIterator](dw.util.SeekableIterator.md)
  - : Returns all system objects of a specific type.
      The following system object types are supported:
      
      - GiftCertificate
      - Order
      - Profile
      - SourceCodeGroup
      - Store
      - ProductList
      
      
      
      The method throws an exception in case of another system type.
      
      
      
      It is strongly recommended to call `close()` on the returned SeekableIterator
      if not all of its elements are being retrieved. This will ensure the proper cleanup of system resources.


    **Parameters:**
    - type - The name of the system object type.                If a matching type definition cannot be found for the given type a                MetaDataException will be thrown.

    **Returns:**
    - SeekableIterator containing all system objects of a specific type.

    **See Also:**
    - [SeekableIterator.close()](dw.util.SeekableIterator.md#close)


---

### querySystemObject(String, String, Object...)
- static querySystemObject(type: [String](TopLevel.String.md), queryString: [String](TopLevel.String.md), args: [Object...](TopLevel.Object.md)): [PersistentObject](dw.object.PersistentObject.md)
  - : 
      
      Searches for a single system object instance. The following system object types are supported:
      
      
      - GiftCertificate
      - Order
      - Profile
      - SourceCodeGroup
      - Store
      - ProductList
      
      
      
      
      
      The method throws an exception in case of another system type.
      
      
      
      
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
      
      
      
      
      If there is more than one object matching the specified query criteria, the result is not deterministic. In order
      to retrieve a single object from a sorted result set it is recommended to use the following code:
      `querySystemObjects("", "custom.myAttr asc", null).first()`. The method `first()` returns
      only the next element and closes the iterator.
      
      
      
      
      It is strongly recommended to call `close()` on the returned SeekableIterator if not all of its
      elements are being processed. This will enable the cleanup of system resources.
      
      
      
      
      This method does not consider locale specific attributes. It returns all objects by checking the default
      non-localizable attributes. Any locale specific filtering after fetching the objects must be done by other custom
      code.
      
      Example: For store objects, such a locale specific filtering can be:
      
      - Get the store objects using this method with non-localized attributes query.
      - Access the `store.getCustom("myattr")`. It returns the localized value of the attribute.


    **Parameters:**
    - type - the system object type for the query.
    - queryString - the actual query.
    - args - optional parameters for the queryString.

    **Returns:**
    - the system object defined by `type` which was found when executing the
              `queryString`.


    **See Also:**
    - [SeekableIterator.close()](dw.util.SeekableIterator.md#close)


---

### querySystemObjects(String, Map, String)
- static querySystemObjects(type: [String](TopLevel.String.md), queryAttributes: [Map](dw.util.Map.md), sortString: [String](TopLevel.String.md)): [SeekableIterator](dw.util.SeekableIterator.md)
  - : 
      
      Searches for system object instances. The following system object types are supported:
      
      
      - GiftCertificate
      - Order
      - Profile
      - SourceCodeGroup
      - Store
      - ProductList
      
      
      
      
      
      The method throws an exception in case of another system type.
      
      
      
      
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
      
      Example: For store objects, such a locale specific filtering can be:
      
      - Get the store objects using this method with non-localized attributes query.
      - Access the `store.getCustom("myattr")`. It returns the localized value of the attribute.


    **Parameters:**
    - type - the system object type for the query.
    - queryAttributes - key-value pairs, which define the query.
    - sortString - an optional sorting or null if no sorting is necessary.

    **Returns:**
    - SeekableIterator containing the result set of the query.

    **See Also:**
    - [SeekableIterator.close()](dw.util.SeekableIterator.md#close)


---

### querySystemObjects(String, String, String, Object...)
- static querySystemObjects(type: [String](TopLevel.String.md), queryString: [String](TopLevel.String.md), sortString: [String](TopLevel.String.md), args: [Object...](TopLevel.Object.md)): [SeekableIterator](dw.util.SeekableIterator.md)
  - : 
      
      Searches for system object instances. The following system object types are supported:
      
      
      - GiftCertificate
      - Order
      - Profile
      - SourceCodeGroup
      - Store
      - ProductList
      
      
      
      
      
      The method throws an exception in case of another system type.
      
      
      
      
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
      easily done by providing the 'type' of the system object and the 'sortString' in combination with an empty
      'queryString', e.g. `querySystemObjects("sample", "", "ID asc")`
      
      
      
      
      It is strongly recommended to call `close()` on the returned SeekableIterator if not all of its
      elements are being retrieved. This will ensure the proper cleanup of system resources.
      
      
      
      
      This method does not consider locale specific attributes. It returns all objects by checking the default
      non-localizable attributes. Any locale specific filtering after fetching the objects must be done by other custom
      code.
      
      Example: For store objects, such a locale specific filtering can be:
      
      - Get the store objects using this method with non-localized attributes query.
      - Access the `store.getCustom("myattr")`. It returns the localized value of the attribute.


    **Parameters:**
    - type - the system object type for the query.
    - queryString - the actual query.
    - sortString - an optional sorting or null if no sorting is necessary.
    - args - optional parameters for the queryString.

    **Returns:**
    - SeekableIterator containing the result set of the query.

    **See Also:**
    - [SeekableIterator.close()](dw.util.SeekableIterator.md#close)


---

<!-- prettier-ignore-end -->
