<!-- prettier-ignore-start -->
# Class ProductListMgr

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.customer.ProductListMgr](dw.customer.ProductListMgr.md)

ProductListMgr provides methods for retrieving, creating, searching for, and
removing product lists.



## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| static [createProductList](dw.customer.ProductListMgr.md#createproductlistcustomer-number)([Customer](dw.customer.Customer.md), [Number](TopLevel.Number.md)) | Creates a new instance of a product list, of the specified type. |
| ~~static [getProductList](dw.customer.ProductListMgr.md#getproductlistprofile-number)([Profile](dw.customer.Profile.md), [Number](TopLevel.Number.md))~~ | Returns the first product list belonging to the customer with the  specified profile. |
| static [getProductList](dw.customer.ProductListMgr.md#getproductliststring)([String](TopLevel.String.md)) | Gets the product list by its ID. |
| static [getProductLists](dw.customer.ProductListMgr.md#getproductlistscustomer-number)([Customer](dw.customer.Customer.md), [Number](TopLevel.Number.md)) | Retrieve all product lists of the specified type owned by the  specified customer. |
| static [getProductLists](dw.customer.ProductListMgr.md#getproductlistscustomer-number-string)([Customer](dw.customer.Customer.md), [Number](TopLevel.Number.md), [String](TopLevel.String.md)) | Retrieve all the product lists of the specified type and event type  belonging to the specified customer. |
| static [getProductLists](dw.customer.ProductListMgr.md#getproductlistscustomeraddress)([CustomerAddress](dw.customer.CustomerAddress.md)) | Returns the collection of product lists that have the specified address  as the shipping address. |
| static [queryProductLists](dw.customer.ProductListMgr.md#queryproductlistsmap-string)([Map](dw.util.Map.md), [String](TopLevel.String.md)) | <p>Searches for product list instances. |
| static [queryProductLists](dw.customer.ProductListMgr.md#queryproductlistsstring-string-object)([String](TopLevel.String.md), [String](TopLevel.String.md), [Object...](TopLevel.Object.md)) | <p>Searches for product list instances. |
| static [removeProductList](dw.customer.ProductListMgr.md#removeproductlistproductlist)([ProductList](dw.customer.ProductList.md)) | Removes the specified product list from the system. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Method Details

### createProductList(Customer, Number)
- static createProductList(customer: [Customer](dw.customer.Customer.md), type: [Number](TopLevel.Number.md)): [ProductList](dw.customer.ProductList.md)
  - : Creates a new instance of a product list, of the specified type.

    **Parameters:**
    - customer - The customer owning the product list, must not be null.
    - type - The type of list (e.g. wish list, gift registry). The types             are defined as constants within             [ProductList](dw.customer.ProductList.md).

    **Returns:**
    - the new list instance.


---

### getProductList(Profile, Number)
- ~~static getProductList(profile: [Profile](dw.customer.Profile.md), type: [Number](TopLevel.Number.md)): [ProductList](dw.customer.ProductList.md)~~
  - : Returns the first product list belonging to the customer with the
      specified profile.


    **Parameters:**
    - profile - The profile of the customer whose product list is to be retrieved.
    - type - The type of list (e.g. wish list, gift registry). The types             are defined as constants within             [ProductList](dw.customer.ProductList.md).

    **Returns:**
    - the product list, or null if none exists.

    **Deprecated:**
:::warning
Use [getProductLists(Customer, Number)](dw.customer.ProductListMgr.md#getproductlistscustomer-number) or [getProductLists(Customer, Number, String)](dw.customer.ProductListMgr.md#getproductlistscustomer-number-string) instead.
:::

---

### getProductList(String)
- static getProductList(ID: [String](TopLevel.String.md)): [ProductList](dw.customer.ProductList.md)
  - : Gets the product list by its ID.

    **Parameters:**
    - ID - The product list ID.

    **Returns:**
    - the ProductList instance, or null if a list with the specified
              UUID doesn't exist.



---

### getProductLists(Customer, Number)
- static getProductLists(customer: [Customer](dw.customer.Customer.md), type: [Number](TopLevel.Number.md)): [Collection](dw.util.Collection.md)
  - : Retrieve all product lists of the specified type owned by the
      specified customer.


    **Parameters:**
    - customer - The customer used for the query, must not be null.
    - type - The type of list used for the query. The types are defined as             constants within [ProductList](dw.customer.ProductList.md).

    **Returns:**
    - the unsorted collection of ProductList instances of the specified
              type belonging to the specified customer.



---

### getProductLists(Customer, Number, String)
- static getProductLists(customer: [Customer](dw.customer.Customer.md), type: [Number](TopLevel.Number.md), eventType: [String](TopLevel.String.md)): [Collection](dw.util.Collection.md)
  - : Retrieve all the product lists of the specified type and event type
      belonging to the specified customer.


    **Parameters:**
    - customer - The customer used for the query, must not be null.
    - type - The type of list used for the query. The types are defined as             constants within [ProductList](dw.customer.ProductList.md).
    - eventType - The event type used for the query, must not be null.

    **Returns:**
    - the unsorted collection of ProductList instances of the specified
              type and event type belonging to the specified customer.



---

### getProductLists(CustomerAddress)
- static getProductLists(customerAddress: [CustomerAddress](dw.customer.CustomerAddress.md)): [Collection](dw.util.Collection.md)
  - : Returns the collection of product lists that have the specified address
      as the shipping address.


    **Parameters:**
    - customerAddress - the address to test, must not be null.

    **Returns:**
    - the unsorted collection of ProductList instances using this
              address.



---

### queryProductLists(Map, String)
- static queryProductLists(queryAttributes: [Map](dw.util.Map.md), sortString: [String](TopLevel.String.md)): [SeekableIterator](dw.util.SeekableIterator.md)
  - : 
      Searches for product list instances.
      
      
      
      The search can be configured with a map, which key-value pairs are
      converted into a query expression. The key-value pairs are turned into a
      sequence of '=' or 'like' conditions, which are combined with AND
      statements.
      
      
      
      Example:
      
      A map with the key/value pairs: _'name'/'tom\*', 'age'/66_
      will be converted as follows: `"name like 'tom*' and age = 66"`
      
      
      
      The identifier for an **attribute**  to use in a query condition is always the
      ID of the  attribute as defined in the type definition. For custom defined attributes
      the prefix custom is required in the search term (e.g. `custom.color = {1}`),
      while for system attributes no prefix is used (e.g. `name = {4}`).
      
      
      
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
      
      
      Note, that some system attributes are not queryable by default regardless of the
      actual value type code.
      
      
      
      
      The **sorting** parameter is optional and may contain a comma separated list of
      attribute names to sort by. Each sort attribute name may be followed by an
      optional sort direction specifier ('asc' | 'desc'). Default sorting directions is
      ascending, if no direction was specified.
      
      Example: `age desc, name`
      
      Please note that specifying a localized custom attribute as the sorting attribute is
      currently not supported.
      
      
      
      It is strongly recommended to call `close()` on the returned SeekableIterator
      if not all of its elements are being retrieved. This will ensure the proper cleanup of system resources.


    **Parameters:**
    - queryAttributes - key-value pairs, which define the query.
    - sortString - an optional sorting or null if no sorting is necessary.

    **Returns:**
    - SeekableIterator containing the result set of the query.

    **See Also:**
    - [SeekableIterator.close()](dw.util.SeekableIterator.md#close)


---

### queryProductLists(String, String, Object...)
- static queryProductLists(queryString: [String](TopLevel.String.md), sortString: [String](TopLevel.String.md), args: [Object...](TopLevel.Object.md)): [SeekableIterator](dw.util.SeekableIterator.md)
  - : 
      Searches for product list instances.
      
      
      
      The search can be configured using a simple query language, which
      provides most common filter and operator functionality.
      
      
      
      The identifier for an **attribute**  to use in a query condition is always the
      ID of the  attribute as defined in the type definition. For custom defined attributes
      the prefix custom is required in the search term (e.g. `custom.color = {1}`),
      while for system attributes no prefix is used (e.g. `name = {4}`).
      
      
      
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
      
      
      Note, that some system attributes are not queryable by default regardless of the
      actual value type code.
      
      
      
      
      The following **operators** are supported in a condition:
      
      - `=`Equals - All types; supports NULL value (`thumbnail = NULL`)
      - `!=`Not equals - All types; supports NULL value (`thumbnail != NULL`)
      - `<`Less than  - Integer, Number and Date types only
      - `>`Greater than - Integer, Number and Date types only
      - `<=`Less or equals than - Integer, Number and Date types only
      - `>=`Greater or equals than  - Integer, Number and Date types only
      - `LIKE`Like - String types and Email only; use if leading or trailing  wildcards will be used to support substring search(`custom.country LIKE 'US*'`)
      - `ILIKE`Caseindependent Like - String types and Email only, use to support  case insensitive query (`custom.country ILIKE 'usa'`), does also support wildcards for  substring matching
      
      
      
      
      Conditions can be combined using logical expressions 'AND', 'OR' and 'NOT'
      and nested using parenthesis e.g.
      `gender = {1} AND (age >= {2} OR (NOT profession LIKE {3}))`.
      
      
      
      
      The query language provides a placeholder syntax to pass objects as
      additional search parameters. Each passed object is related to a
      placeholder in the query string. The placeholder must be an Integer that
      is surrounded by braces. The first Integer value must be '0', the second
      '1' and so on, e.g.
      `querySystemObjects("sample", "age = {0} or creationDate >= {1}", 18, date)`
      
      
      
      
      The **sorting** parameter is optional and may contain a comma separated list of
      attribute names to sort by. Each sort attribute name may be followed by an
      optional sort direction specifier ('asc' | 'desc'). Default sorting directions is
      ascending, if no direction was specified.
      
      Example: `age desc, name`
      
      Please note that specifying a localized custom attribute as the sorting attribute is
      currently not supported.
      
      
      
      Sometimes it is desired to get all instances with a special sorting condition.
      This can be easily done by providing the 'sortString' in combination with
      an empty 'queryString', e.g. `querySystemObjects("sample", "", "ID asc")`
      
      
      
      It is strongly recommended to call `close()` on the returned SeekableIterator
      if not all of its elements are being retrieved. This will ensure the proper cleanup of system resources.


    **Parameters:**
    - queryString - the actual query.
    - sortString - an optional sorting or null if no sorting is necessary.
    - args - optional parameters for the queryString.

    **Returns:**
    - SeekableIterator containing the result set of the query.

    **See Also:**
    - [SeekableIterator.close()](dw.util.SeekableIterator.md#close)


---

### removeProductList(ProductList)
- static removeProductList(productList: [ProductList](dw.customer.ProductList.md)): void
  - : Removes the specified product list from the system.

    **Parameters:**
    - productList - The list to remove, must not be null.


---

<!-- prettier-ignore-end -->
