<!-- prettier-ignore-start -->
# Class global

- [TopLevel.Object](TopLevel.Object.md)
  - [TopLevel.global](TopLevel.global.md)

The global object is a pre-defined object that serves as a placeholder for the global
properties and functions of JavaScript. All other predefined objects, functions, and
properties are accessible through the global object.



## Constant Summary

| Constant | Description |
| --- | --- |
| [Infinity](#infinity): [Number](TopLevel.Number.md) | representation for Infinity as an Integer |
| [NaN](#nan): [Number](TopLevel.Number.md) | representation for Not a Number as an Integer |
| [PIPELET_ERROR](#pipelet_error): [Number](TopLevel.Number.md) | represents an error during pipelet execution |
| [PIPELET_NEXT](#pipelet_next): [Number](TopLevel.Number.md) | represents the next pipelet to fire |
| [slotcontent](#slotcontent): [Object](TopLevel.Object.md) | Provides access to the SlotContent object. |
| [undefined](#undefined): [Object](TopLevel.Object.md) | representation for undefined |
| [webreferences2](#webreferences2): [Object](TopLevel.Object.md) | Provides access to WSDL definition files in a Cartridge's webreferences2  folder. |

## Property Summary

| Property | Description |
| --- | --- |
| [customer](#customer): [Customer](dw.customer.Customer.md) | The current customer or null if this request is not associated with any customer. |
| [exports](#exports): [Object](TopLevel.Object.md) | References the [module.exports](TopLevel.Module.md#exports) property of the current module. |
| [globalThis](#globalthis): [Object](TopLevel.Object.md) | Provides access to the global scope object containing all built-in functions and classes. |
| [module](#module): [Module](TopLevel.Module.md) | An object representing the current module. |
| [request](#request): [Request](dw.system.Request.md) | The current request. |
| [response](#response): [Response](dw.system.Response.md) | The current response. |
| [session](#session): [Session](dw.system.Session.md) | The current session. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| static [decodeURI](TopLevel.global.md#decodeuristring)([String](TopLevel.String.md)) | Unescapes characters in a URI component. |
| static [decodeURIComponent](TopLevel.global.md#decodeuricomponentstring)([String](TopLevel.String.md)) | Unescapes characters in a URI component. |
| static [empty](TopLevel.global.md#emptyobject)([Object](TopLevel.Object.md)) | The method tests, whether the given object is empty. |
| static [encodeURI](TopLevel.global.md#encodeuristring)([String](TopLevel.String.md)) | Escapes characters in a URI. |
| static [encodeURIComponent](TopLevel.global.md#encodeuricomponentstring)([String](TopLevel.String.md)) | Escapes characters in a URI component. |
| static [escape](TopLevel.global.md#escapestring)([String](TopLevel.String.md)) | Encodes a String. |
| ~~static [eval](TopLevel.global.md#evalstring)([String](TopLevel.String.md))~~ | Execute JavaScript code from a String. |
| static [importClass](TopLevel.global.md#importclassobject)([Object](TopLevel.Object.md)) | Import the specified class and make it  available at the top level. |
| static [importPackage](TopLevel.global.md#importpackageobject)([Object](TopLevel.Object.md)) | Import all the classes in the specified package  available at the top level. |
| static [importScript](TopLevel.global.md#importscriptstring)([String](TopLevel.String.md)) | Imports all functions from the specified script. |
| static [isFinite](TopLevel.global.md#isfinitenumber)([Number](TopLevel.Number.md)) | Returns true if the specified Number is finite. |
| static [isNaN](TopLevel.global.md#isnanobject)([Object](TopLevel.Object.md)) | Test the specified value to determine if it  is not a Number. |
| static [isXMLName](TopLevel.global.md#isxmlnamestring)([String](TopLevel.String.md)) | Determines whether the specified string is a valid name for an  XML element or attribute. |
| static [parseFloat](TopLevel.global.md#parsefloatstring)([String](TopLevel.String.md)) | Parses a String into an float Number. |
| static [parseInt](TopLevel.global.md#parseintstring-number)([String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Parses a String into an integer Number using the  specified radix. |
| static [parseInt](TopLevel.global.md#parseintstring---variant-1)([String](TopLevel.String.md)) | Parses a String into an integer Number.  This function is a short form for the call to [parseInt(String, Number)](TopLevel.global.md#parseintstring-number) with automatic determination of the radix. |
| static [parseInt](TopLevel.global.md#parseintstring---variant-2)([String](TopLevel.String.md)) | Parses a String into an integer Number. |
| static [require](TopLevel.global.md#requirestring)([String](TopLevel.String.md)) | The require() function supports loading of modules in JavaScript. |
| static [trace](TopLevel.global.md#tracestring-object)([String](TopLevel.String.md), [Object...](TopLevel.Object.md)) | Formats and prints the message using the specified params and returns  the formatted message. |
| static [unescape](TopLevel.global.md#unescapestring)([String](TopLevel.String.md)) | Decode an escaped String. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### Infinity

- Infinity: [Number](TopLevel.Number.md)
  - : representation for Infinity as an Integer


---

### NaN

- NaN: [Number](TopLevel.Number.md)
  - : representation for Not a Number as an Integer


---

### PIPELET_ERROR

- PIPELET_ERROR: [Number](TopLevel.Number.md)
  - : represents an error during pipelet execution


---

### PIPELET_NEXT

- PIPELET_NEXT: [Number](TopLevel.Number.md)
  - : represents the next pipelet to fire


---

### slotcontent

- slotcontent: [Object](TopLevel.Object.md)
  - : Provides access to the SlotContent object.  Available only in ISML
      templates that are defined as the Slot's template.  For example,
      <isprint value="${slotcontent.callout}"> will print out the callout message
      of the active Slot.


    **See Also:**
    - [SlotContent](dw.campaign.SlotContent.md)


---

### undefined

- undefined: [Object](TopLevel.Object.md)
  - : representation for undefined


---

### webreferences2

- webreferences2: [Object](TopLevel.Object.md)
  - : Provides access to WSDL definition files in a Cartridge's webreferences2
      folder. For example, webreferences2.mywebservice loads the
      mywebservice.wsdl file and returns an instance of dw.ws.WebReference2.
      The WebReference2 instance enables you to access the actual web service
      via the WebReference2.getDefaultService() method.


    **See Also:**
    - [WebReference2](dw.ws.WebReference2.md)


---

## Property Details

### customer
- customer: [Customer](dw.customer.Customer.md)
  - : The current customer or null if this request is not associated with any customer.


---

### exports
- exports: [Object](TopLevel.Object.md)
  - : References the [module.exports](TopLevel.Module.md#exports) property of the current module. Available only in scripts that were loaded
      as CommonJS module using the [require(String)](TopLevel.global.md#requirestring) function.


    **See Also:**
    - [Module.exports](TopLevel.Module.md#exports)


---

### globalThis
- globalThis: [Object](TopLevel.Object.md)
  - : Provides access to the global scope object containing all built-in functions and classes.


---

### module
- module: [Module](TopLevel.Module.md)
  - : An object representing the current module. Available only in scripts that were loaded
      as CommonJS module using the [require(String)](TopLevel.global.md#requirestring) function.


    **See Also:**
    - [Module](TopLevel.Module.md)


---

### request
- request: [Request](dw.system.Request.md)
  - : The current request.


---

### response
- response: [Response](dw.system.Response.md)
  - : The current response.


---

### session
- session: [Session](dw.system.Session.md)
  - : The current session.


---

## Method Details

### decodeURI(String)
- static decodeURI(uri: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Unescapes characters in a URI component.

    **Parameters:**
    - uri - a string that contains an encoded URI or other text to be decoded.

    **Returns:**
    - A copy of _uri_ with any hexadecimal escape sequences replaced with the
      characters they represent



---

### decodeURIComponent(String)
- static decodeURIComponent(uriComponent: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Unescapes characters in a URI component.

    **Parameters:**
    - uriComponent - a string that contains an encoded URI component or other text to be decoded.

    **Returns:**
    - A copy of _uriComponent_ with any hexadecimal escape sequences replaced with the
      characters they represent



---

### empty(Object)
- static empty(obj: [Object](TopLevel.Object.md)): [Boolean](TopLevel.Boolean.md)
  - : The method tests, whether the given object is empty. The interpretation
      of empty is the following.
      - null is always empty
      - undefined is always empty
      - a string with zero length is empty
      - an array with no elements is empty
      - a collection with no elements is empty


    **Parameters:**
    - obj - the object to be thested

    **Returns:**
    - true if the object is interpreted as being empty


---

### encodeURI(String)
- static encodeURI(uri: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Escapes characters in a URI.

    **Parameters:**
    - uri - a String that contains the URI or other text to be encoded.

    **Returns:**
    - a copy of _uri_ with certain characters replaced by
      hexadecimal escape sequences.



---

### encodeURIComponent(String)
- static encodeURIComponent(uriComponent: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Escapes characters in a URI component.

    **Parameters:**
    - uriComponent - a String that contains a portion of a URI or other text to be encoded.

    **Returns:**
    - a copy of _uriComponent_ with certain characters replaced by
      hexadecimal escape sequences.



---

### escape(String)
- static escape(s: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Encodes a String.

    **Parameters:**
    - s - the String to be encoded.

    **Returns:**
    - a copy of _s_ where characters have been replace by
      hexadecimal escape sequences.



---

### eval(String)
- ~~static eval(code: [String](TopLevel.String.md)): [Object](TopLevel.Object.md)~~
  - : Execute JavaScript code from a String.

    **Parameters:**
    - code - a String that contains the JavaScript expression to be  evaluated or the statements to be executed.

    **Returns:**
    - the value of the executed call or null.

    **Deprecated:**
:::warning
The eval() function is deprecated, because it's potential security risk for server side code injection.
:::

---

### importClass(Object)
- static importClass(classPath: [Object](TopLevel.Object.md)): void
  - : Import the specified class and make it
      available at the top level. It's equivalent in effect to the
      Java import declaration.


    **Parameters:**
    - classPath - the fully qualified class path.


---

### importPackage(Object)
- static importPackage(packagePath: [Object](TopLevel.Object.md)): void
  - : Import all the classes in the specified package
      available at the top level. It's equivalent in effect to the
      Java import declaration.


    **Parameters:**
    - packagePath - the fully qualified package path.


---

### importScript(String)
- static importScript(scriptPath: [String](TopLevel.String.md)): void
  - : Imports all functions from the specified script. Variables are not imported
      from the script and must be accessed through helper functions.
      
      The script path has the following syntax: \[cartridgename:\]scriptname, where
      cartridgename identifies a cartridge where the script file is located. If
      cartridgename is omitted the script file is loaded from the same cartridge
      in which the importing component is located.
      
      Examples:
      importScript( 'example.ds' ) imports the script file example.ds from the same cartridge
      importScript( 'abc:example.ds' ) imports the script file example.ds from the cartridge 'abc'


    **Parameters:**
    - scriptPath - the path to the script.


---

### isFinite(Number)
- static isFinite(number: [Number](TopLevel.Number.md)): [Boolean](TopLevel.Boolean.md)
  - : Returns true if the specified Number is finite.

    **Parameters:**
    - number - the Number to test.

    **Returns:**
    - true if the specified Number is finite,
      false otherwise.



---

### isNaN(Object)
- static isNaN(object: [Object](TopLevel.Object.md)): [Boolean](TopLevel.Boolean.md)
  - : Test the specified value to determine if it
      is not a Number.


    **Parameters:**
    - object - the Object to be tested as a number

    **Returns:**
    - True if the object is not a number


---

### isXMLName(String)
- static isXMLName(name: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Determines whether the specified string is a valid name for an
      XML element or attribute.


    **Parameters:**
    - name - the String specified

    **Returns:**
    - True if the string is a valid name


---

### parseFloat(String)
- static parseFloat(s: [String](TopLevel.String.md)): [Number](TopLevel.Number.md)
  - : Parses a String into an float Number.

    **Parameters:**
    - s - the String to parse.

    **Returns:**
    - Returns the float as a Number.


---

### parseInt(String, Number)
- static parseInt(s: [String](TopLevel.String.md), radix: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Parses a String into an integer Number using the
      specified radix.


    **Parameters:**
    - s - the String to parse.
    - radix - the radix to use.

    **Returns:**
    - Returns the integer as a Number.


---

### parseInt(String) - Variant 1
- static parseInt(s: [String](TopLevel.String.md)): [Number](TopLevel.Number.md)
  - : Parses a String into an integer Number.
      
      This function is a short form for the call to [parseInt(String, Number)](TopLevel.global.md#parseintstring-number) with automatic determination of the radix.
      If the string starts with "0x" or "0X" then the radix is 16. If the string starts with "0" the the radix is 8. In all other cases the radix is 10.


    **Parameters:**
    - s - the String to parse.

    **Returns:**
    - Returns the integer as a Number.

    **API Version:**
:::note
No longer available as of version 16.1.
:::

---

### parseInt(String) - Variant 2
- static parseInt(s: [String](TopLevel.String.md)): [Number](TopLevel.Number.md)
  - : Parses a String into an integer Number.
      This function is a short form for the call to [parseInt(String, Number)](TopLevel.global.md#parseintstring-number) with automatic determination of the radix.
      If the string starts with "0x" or "0X" then the radix is 16. In all other cases the radix is 10.


    **Parameters:**
    - s - the String to parse.

    **Returns:**
    - Returns the integer as a Number.

    **API Version:**
:::note
Available from version 16.1.
ECMAScript 5 compliance: removed support for octal numbers.
:::

---

### require(String)
- static require(path: [String](TopLevel.String.md)): [Module](TopLevel.Module.md)
  - : The require() function supports loading of modules in JavaScript. The function works similar to the require() function
      in CommonJS. The general module loading works the same way, but the exact path lookup is slightly different
      and better fits into Demandware concepts. Here are the details for the lookup:
      
      - If the module name starts with "./" or "../" then load it relative to the current module. The module can be a file or a directory. A file  extension is acknowledged, but not required. If it's a directory a 'package.json' or a 'main' file is expected.  If the 'package.json' does not contain a main entry, then default to main file in the directory.  Access to parent files can't go beyond the cartridges directory. Access to other cartridges is explicitly allowed.
      - If the module name starts with "~/" it's a path relative to the current cartridge.
      - If the module name starts with "&#42;/" try to find the module in all cartridges that are assigned to the current site.
      - A module with the name "dw" or which starts with "dw/" references Demandware built-in functions and classes.  For example `var u = require( 'dw/util' );`loads the classes in the util package, which can be then used like  `var h = new u.HashMap();`
      - A module, which doesn't start with "./" or "../" is resolved as top level module.  
        - The module name is used to find a folder in the top cartridge directory, typically a cartridge itself, but it can also be a simple folder.
        - If nothing is found, the module name is used to look into a special folder called "modules" in the top cartridge directory. That folder    can be used by a developer to manage different modules. For example a developer could drop a module like "less.js" just into that folder.
      
      If the require function is used to reference a file then an optional file extension is used to determine the content of the file. Currently
      supported are the extensions ordered by priority:
      
        - js - JavaScript file
        - ds - Demandware Script file
        - json - JSON file


    **Parameters:**
    - path - the path to the JavaScript module.

    **Returns:**
    - an object with the exported functions and properties.


---

### trace(String, Object...)
- static trace(msg: [String](TopLevel.String.md), params: [Object...](TopLevel.Object.md)): void
  - : Formats and prints the message using the specified params and returns
      the formatted message. The format message is a Java MessageFormat
      expression. Printing happens in the script log output.


    **Parameters:**
    - msg - the message to format.
    - params - one, or multiple parameters that are used  to format the message.


---

### unescape(String)
- static unescape(string: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Decode an escaped String.

    **Parameters:**
    - string - the String to decode.

    **Returns:**
    - a copy of the String where hexadecimal character sequences
      are replace by Unicode characters.



---

<!-- prettier-ignore-end -->
