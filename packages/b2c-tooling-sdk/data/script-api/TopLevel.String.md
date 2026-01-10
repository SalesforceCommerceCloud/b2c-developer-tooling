<!-- prettier-ignore-start -->
# Class String

- [TopLevel.Object](TopLevel.Object.md)
  - [TopLevel.String](TopLevel.String.md)

The String object represents any sequence of zero or more characters that are to be
treated strictly as text.



## Property Summary

| Property | Description |
| --- | --- |
| [length](#length): [Number](TopLevel.Number.md) | The length of the String object. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [String](#string)() | Constructs the String. |
| [String](#stringnumber)([Number](TopLevel.Number.md)) | Constructs the String from the specified  Number object. |
| [String](#stringstring)([String](TopLevel.String.md)) | Constructs a new String from the specified  String object. |

## Method Summary

| Method | Description |
| --- | --- |
| [charAt](TopLevel.String.md#charatnumber)([Number](TopLevel.Number.md)) | Returns a string containing the character at position _index_. |
| [charCodeAt](TopLevel.String.md#charcodeatnumber)([Number](TopLevel.Number.md)) | Returns the UTF-16 code unit at the given position index. |
| [codePointAt](TopLevel.String.md#codepointatnumber)([Number](TopLevel.Number.md)) | Returns the Unicode code point at the given position index. |
| [concat](TopLevel.String.md#concatstring)([String...](TopLevel.String.md)) | Returns a new String created by concatenating the string arguments together. |
| [endsWith](TopLevel.String.md#endswithstring)([String](TopLevel.String.md)) | Tests if this string ends with a given string. |
| [endsWith](TopLevel.String.md#endswithstring-number)([String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Tests if this string ends with a given string. |
| [equals](TopLevel.String.md#equalsobject)([Object](TopLevel.Object.md)) | Returns true if this string is equal to the string representation of the  passed objects. |
| [equalsIgnoreCase](TopLevel.String.md#equalsignorecaseobject)([Object](TopLevel.Object.md)) | Returns true if this string is equal to the string representation of the  passed objects. |
| static [fromCharCode](TopLevel.String.md#fromcharcodenumber)([Number...](TopLevel.Number.md)) | Returns a new String from one or more UTF-16 code units. |
| static [fromCodePoint](TopLevel.String.md#fromcodepointnumber)([Number...](TopLevel.Number.md)) | Returns a new String from one or more characters with Unicode code points. |
| [includes](TopLevel.String.md#includesstring)([String](TopLevel.String.md)) | Returns if _substring_ is contained in this String object. |
| [includes](TopLevel.String.md#includesstring-number)([String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Returns if _substring_ is contained in this String object. |
| [indexOf](TopLevel.String.md#indexofstring)([String](TopLevel.String.md)) | Returns the index of _substring_ in this String object. |
| [indexOf](TopLevel.String.md#indexofstring-number)([String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Returns the index of _substring_ in this String object using  the specified _start_ value as the location to begin searching. |
| [lastIndexOf](TopLevel.String.md#lastindexofstring)([String](TopLevel.String.md)) | Returns the last index of _substring_ in this String object. |
| [lastIndexOf](TopLevel.String.md#lastindexofstring-number)([String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Returns the last index of _substring_ in this String object,  using the specified _start_ position as the location from which  to begin the search. |
| [localeCompare](TopLevel.String.md#localecomparestring)([String](TopLevel.String.md)) | Returns a number indicating whether the current String sorts before, the same as,  or after the parameter _other_, based on browser and system-dependent  string localization. |
| [match](TopLevel.String.md#matchregexp)([RegExp](TopLevel.RegExp.md)) | Returns an array of strings that match the regular expression  _regexp_. |
| [normalize](TopLevel.String.md#normalize)() | Returns the normalized form of this Unicode string. |
| [normalize](TopLevel.String.md#normalizestring)([String](TopLevel.String.md)) | Returns the normalized form of this Unicode string according to the standard as described in [https://unicode.org/reports/tr15/](https://unicode.org/reports/tr15/). |
| [padEnd](TopLevel.String.md#padendnumber)([Number](TopLevel.Number.md)) | Appends space characters to the current string to ensure the resulting string reaches the given target length. |
| [padEnd](TopLevel.String.md#padendnumber-string)([Number](TopLevel.Number.md), [String](TopLevel.String.md)) | Appends a string (possibly multiple times) to the current string to ensure the resulting string reaches the given target length. |
| [padStart](TopLevel.String.md#padstartnumber)([Number](TopLevel.Number.md)) | Prepends space characters to the current string to ensure the resulting string reaches the given target length. |
| [padStart](TopLevel.String.md#padstartnumber-string)([Number](TopLevel.Number.md), [String](TopLevel.String.md)) | Prepends a string (possibly multiple times) to the current string to ensure the resulting string reaches the given target length. |
| static [raw](TopLevel.String.md#rawobject-string)([Object](TopLevel.Object.md), [String...](TopLevel.String.md)) | The static `String.raw()` method is a tag function of template literals. |
| [repeat](TopLevel.String.md#repeatnumber)([Number](TopLevel.Number.md)) | Returns a new string repeating this string the given number of times. |
| [replace](TopLevel.String.md#replaceregexp-function)([RegExp](TopLevel.RegExp.md), [Function](TopLevel.Function.md)) | Returns a new String that results when matches of the _regexp_  parameter are replaced by using the specified _function_. |
| [replace](TopLevel.String.md#replaceregexp-string)([RegExp](TopLevel.RegExp.md), [String](TopLevel.String.md)) | Returns a new String that results when matches of the _regexp_  parameter are replaced by the _replacement_ parameter. |
| [replace](TopLevel.String.md#replacestring-function)([String](TopLevel.String.md), [Function](TopLevel.Function.md)) | Returns a new String that results when matches of the _literal_  parameter are replaced by using the specified _function_. |
| ~~[replace](TopLevel.String.md#replacestring-function-string)([String](TopLevel.String.md), [Function](TopLevel.Function.md), [String](TopLevel.String.md))~~ | Returns a new String that results when matches of the _literal_  parameter are replaced by using the specified _function_. |
| [replace](TopLevel.String.md#replacestring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Returns a new String that results when matches of the _literal_  parameter are replaced by the _replacement_ parameter. |
| ~~[replace](TopLevel.String.md#replacestring-string-string)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md))~~ | Returns a new String that results when matches of the _literal_  parameter are replaced by the _replacement_ parameter. |
| [search](TopLevel.String.md#searchregexp)([RegExp](TopLevel.RegExp.md)) | Searches for a match between the passed regular expression and this  string and returns the zero-based index of the match, or -1 if no match  is found. |
| [slice](TopLevel.String.md#slicenumber-number)([Number](TopLevel.Number.md), [Number](TopLevel.Number.md)) | Returns a substring of the current String where the  specified _start_ and _end_ locations are used  to delimit the String. |
| [split](TopLevel.String.md#splitregexp)([RegExp](TopLevel.RegExp.md)) | Returns an array of String instances created by splitting the current  String based on the regular expression. |
| [split](TopLevel.String.md#splitregexp-number)([RegExp](TopLevel.RegExp.md), [Number](TopLevel.Number.md)) | Returns an array of String instances created by splitting the current  String based on the regular expression and limited in size by the _limit_  parameter. |
| [split](TopLevel.String.md#splitstring)([String](TopLevel.String.md)) | Returns an array of String instances created by splitting the current  String based on the delimiter. |
| [split](TopLevel.String.md#splitstring-number)([String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Returns an array of String instances created by splitting the current  String based on the delimiter and limited in size by the _limit_  parameter. |
| [startsWith](TopLevel.String.md#startswithstring)([String](TopLevel.String.md)) | Tests if this string starts with a given string. |
| [startsWith](TopLevel.String.md#startswithstring-number)([String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Tests if this string starts with a given string. |
| [substr](TopLevel.String.md#substrnumber)([Number](TopLevel.Number.md)) | Creates and returns a new String by splitting the current string  at the specified _start_ location until the end of the String. |
| [substr](TopLevel.String.md#substrnumber-number)([Number](TopLevel.Number.md), [Number](TopLevel.Number.md)) | Creates and returns a new String by splitting the current string  at the specified _start_ location and limited by the _length_  value. |
| [substring](TopLevel.String.md#substringnumber)([Number](TopLevel.Number.md)) | Creates and returns a new String by splitting the current string  at the specified _from_ location until the end of the String. |
| [substring](TopLevel.String.md#substringnumber-number)([Number](TopLevel.Number.md), [Number](TopLevel.Number.md)) | Creates and returns a new String by splitting the current string  at the specified _from_ location until the specified _to_ location. |
| [toLocaleLowerCase](TopLevel.String.md#tolocalelowercase)() | Returns a copy of the current string in all lower-case letters. |
| [toLocaleUpperCase](TopLevel.String.md#tolocaleuppercase)() | Returns a copy of the current string in all upper-case letters. |
| [toLowerCase](TopLevel.String.md#tolowercase)() | Returns a copy of the current string in all lower-case letters. |
| [toString](TopLevel.String.md#tostring)() | Returns a String value of this object. |
| [toUpperCase](TopLevel.String.md#touppercase)() | Returns a copy of the current string in all upper-case letters. |
| [trim](TopLevel.String.md#trim)() | Removes white space characters at the start and the end of the string. |
| [trimEnd](TopLevel.String.md#trimend)() | Removes white space characters at the end of the string. |
| [trimLeft](TopLevel.String.md#trimleft)() | Removes white space characters at the start of the string. |
| [trimRight](TopLevel.String.md#trimright)() | Removes white space characters at the end of the string. |
| [trimStart](TopLevel.String.md#trimstart)() | Removes white space characters at the start of the string. |
| [valueOf](TopLevel.String.md#valueof)() | Returns a String value of this object. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### length
- length: [Number](TopLevel.Number.md)
  - : The length of the String object.


---

## Constructor Details

### String()
- String()
  - : Constructs the String.


---

### String(Number)
- String(num: [Number](TopLevel.Number.md))
  - : Constructs the String from the specified
      Number object.


    **Parameters:**
    - num - the number that will  be converted to a String.


---

### String(String)
- String(str: [String](TopLevel.String.md))
  - : Constructs a new String from the specified
      String object.


    **Parameters:**
    - str - the String that will  be converted to a new String.


---

## Method Details

### charAt(Number)
- charAt(index: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Returns a string containing the character at position _index_.
      You should use this method instead
      of substring when you need only a single character.


    **Parameters:**
    - index - the index at which the character string is located.

    **Returns:**
    - a string containing the character at position _index_.


---

### charCodeAt(Number)
- charCodeAt(index: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Returns the UTF-16 code unit at the given position index. If the position is invalid `NaN` is returned.

    **Parameters:**
    - index - The index of the code unit within the string.

    **Returns:**
    - a non-negative integer representing a UTF-16 code unit or `NaN` if the index is not valid.


---

### codePointAt(Number)
- codePointAt(index: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Returns the Unicode code point at the given position index. The index is a position within the string in UTF-16
      encoding. If the index points to the begin of a surrogate pair the only the code unit at the position is returned.
      If the index is invalid `undefined` is returned.


    **Parameters:**
    - index - The index of the starting code unit within the string.

    **Returns:**
    - The Unicode code point, an UTF-16 code unit or `undefined`.

    **API Version:**
:::note
Available from version 21.2.
:::

---

### concat(String...)
- concat(strings: [String...](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Returns a new String created by concatenating the string arguments together.

    **Parameters:**
    - strings - zero, one, or more String arguments

    **Returns:**
    - a new String created by concatenating the string arguments together.


---

### endsWith(String)
- endsWith(searchString: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Tests if this string ends with a given string.

    **Parameters:**
    - searchString - The characters to be searched for this string.

    **Returns:**
    - `true` if the search string was found else `false`

    **API Version:**
:::note
Available from version 21.2.
:::

---

### endsWith(String, Number)
- endsWith(searchString: [String](TopLevel.String.md), length: [Number](TopLevel.Number.md)): [Boolean](TopLevel.Boolean.md)
  - : Tests if this string ends with a given string.

    **Parameters:**
    - searchString - The characters to be searched for this string.
    - length - Assumes this string has only this given length.

    **Returns:**
    - `true` if the search string was found else `false`

    **API Version:**
:::note
Available from version 21.2.
:::

---

### equals(Object)
- equals(obj: [Object](TopLevel.Object.md)): [Boolean](TopLevel.Boolean.md)
  - : Returns true if this string is equal to the string representation of the
      passed objects.


    **Parameters:**
    - obj - another object, typically another string


---

### equalsIgnoreCase(Object)
- equalsIgnoreCase(obj: [Object](TopLevel.Object.md)): [Boolean](TopLevel.Boolean.md)
  - : Returns true if this string is equal to the string representation of the
      passed objects. The comparison is done case insensitive.


    **Parameters:**
    - obj - another object, typically another string


---

### fromCharCode(Number...)
- static fromCharCode(c: [Number...](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Returns a new String from one or more UTF-16 code units.

    **Parameters:**
    - c - zero, one, or more UTF-16 code units.


---

### fromCodePoint(Number...)
- static fromCodePoint(c: [Number...](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Returns a new String from one or more characters with Unicode code points.

    **Parameters:**
    - c - zero, one, or more code points.

    **API Version:**
:::note
Available from version 21.2.
:::

---

### includes(String)
- includes(substring: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Returns if _substring_ is contained in this String object.

    **Parameters:**
    - substring - the String to search for in this String.

    **Returns:**
    - `true` if _substring_ occurs within the current string, else `false`.

    **API Version:**
:::note
Available from version 21.2.
:::

---

### includes(String, Number)
- includes(substring: [String](TopLevel.String.md), start: [Number](TopLevel.Number.md)): [Boolean](TopLevel.Boolean.md)
  - : Returns if _substring_ is contained in this String object.

    **Parameters:**
    - substring - the String to search for in this String.
    - start - the location in the String from which to begin the search.

    **Returns:**
    - `true` if _substring_ occurs within the current string, else `false`.

    **API Version:**
:::note
Available from version 21.2.
:::

---

### indexOf(String)
- indexOf(substring: [String](TopLevel.String.md)): [Number](TopLevel.Number.md)
  - : Returns the index of _substring_ in this String object.
      If there is no match, _-1_ is returned.


    **Parameters:**
    - substring - the String to search for in this String.

    **Returns:**
    - the index of _substring_ or _-1_.


---

### indexOf(String, Number)
- indexOf(substring: [String](TopLevel.String.md), start: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Returns the index of _substring_ in this String object using
      the specified _start_ value as the location to begin searching.
      If there is no match, _-1_ is returned.


    **Parameters:**
    - substring - the String to search for in this String.
    - start - the location in the String from which to  begin the search.

    **Returns:**
    - the index of _substring_ or _-1_.


---

### lastIndexOf(String)
- lastIndexOf(substring: [String](TopLevel.String.md)): [Number](TopLevel.Number.md)
  - : Returns the last index of _substring_ in this String object.
      If there is no match, _-1_ is returned.


    **Parameters:**
    - substring - the String to search for in this String.

    **Returns:**
    - the last index of _substring_ or _-1_.


---

### lastIndexOf(String, Number)
- lastIndexOf(substring: [String](TopLevel.String.md), start: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Returns the last index of _substring_ in this String object,
      using the specified _start_ position as the location from which
      to begin the search.
      If there is no match, _-1_ is returned.


    **Parameters:**
    - substring - the String to search for in this String.
    - start - the location from which to begin the search.

    **Returns:**
    - the last index of _substring_ or _-1_.


---

### localeCompare(String)
- localeCompare(other: [String](TopLevel.String.md)): [Number](TopLevel.Number.md)
  - : Returns a number indicating whether the current String sorts before, the same as,
      or after the parameter _other_, based on browser and system-dependent
      string localization.


    **Parameters:**
    - other - the String to compare against this String.

    **Returns:**
    - a number indicating whether the current String sorts before, the same as,
      or after the parameter _other_.



---

### match(RegExp)
- match(regexp: [RegExp](TopLevel.RegExp.md)): [String\[\]](TopLevel.String.md)
  - : Returns an array of strings that match the regular expression
      _regexp_.


    **Parameters:**
    - regexp - the regular expression to use.

    **Returns:**
    - an array of strings that match the regular expression.


---

### normalize()
- normalize(): [String](TopLevel.String.md)
  - : Returns the normalized form of this Unicode string. Same as calling [normalize(String)](TopLevel.String.md#normalizestring) with parameter **'NFC'**.

    **Returns:**
    - The normalized form of this Unicode string.

    **API Version:**
:::note
Available from version 21.2.
:::

---

### normalize(String)
- normalize(form: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Returns the normalized form of this Unicode string according to the standard as described in [https://unicode.org/reports/tr15/](https://unicode.org/reports/tr15/).
      In a normalized string, identical text is replaced by identical sequences of code points.


    **Parameters:**
    - form - The normalization variant to use. Must be one of **'NFC'**, **'NFD'**, **'NFKC'**, **'NFKD'**.

    **Returns:**
    - The normalized form of this Unicode string.

    **API Version:**
:::note
Available from version 21.2.
:::

---

### padEnd(Number)
- padEnd(targetLength: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Appends space characters to the current string to ensure the resulting string reaches the given target length.

    **Parameters:**
    - targetLength - The length to be reached.

    **Returns:**
    - This string if the string length is already greater than or equal to the target length. Else a new string with the _targetLength_ ending with space characters.

    **API Version:**
:::note
Available from version 21.2.
:::

---

### padEnd(Number, String)
- padEnd(targetLength: [Number](TopLevel.Number.md), fillString: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Appends a string (possibly multiple times) to the current string to ensure the resulting string reaches the given target length.

    **Parameters:**
    - targetLength - The length to be reached.
    - fillString - The string providing the characters to be used for filling.

    **Returns:**
    - This string if the string length is already greater than or equal to the target length. Else a new string with the _targetLength_ with the (possibly multiple times) added and truncated _fillString_.

    **API Version:**
:::note
Available from version 21.2.
:::

---

### padStart(Number)
- padStart(targetLength: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Prepends space characters to the current string to ensure the resulting string reaches the given target length.

    **Parameters:**
    - targetLength - The length to be reached.

    **Returns:**
    - This string if the string length is already greater than or equal to the target length. Else a new string with the _targetLength_ starting with space characters.

    **API Version:**
:::note
Available from version 21.2.
:::

---

### padStart(Number, String)
- padStart(targetLength: [Number](TopLevel.Number.md), fillString: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Prepends a string (possibly multiple times) to the current string to ensure the resulting string reaches the given target length.

    **Parameters:**
    - targetLength - The length to be reached.
    - fillString - The string providing the characters to be used for filling.

    **Returns:**
    - This string if the string length is already greater than or equal to the target length. Else a new string with the _targetLength_ with the (possibly multiple times) added and truncated _fillString_.

    **API Version:**
:::note
Available from version 21.2.
:::

---

### raw(Object, String...)
- static raw(callSite: [Object](TopLevel.Object.md), substitutions: [String...](TopLevel.String.md)): [String](TopLevel.String.md)
  - : The static `String.raw()` method is a tag function of template literals.
      
      
      It can be used in different ways:
      
      ```
      String.raw`Hello\n${40+2}!`;
      // returns: Hello\n42!
      // \ is here not an escape character like in string literals
      
      String.raw({ raw: ['a', 'b', 'c'] }, '-', '.' );
      // returns: a-b.c
      ```


    **Parameters:**
    - callSite - A well-formed template call site object, like `{ raw: ['a', 'b', 'c'] }`.
    - substitutions - The substitution values.

    **Returns:**
    - A string constructed by the template with filled substitutions.

    **API Version:**
:::note
Available from version 22.7.
:::

---

### repeat(Number)
- repeat(count: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Returns a new string repeating this string the given number of times.

    **Parameters:**
    - count - The number of times this string should be repeated. Must be non-negative.

    **Returns:**
    - A new string repeating this string the given number of times.

    **API Version:**
:::note
Available from version 21.2.
:::

---

### replace(RegExp, Function)
- replace(regexp: [RegExp](TopLevel.RegExp.md), function: [Function](TopLevel.Function.md)): [String](TopLevel.String.md)
  - : Returns a new String that results when matches of the _regexp_
      parameter are replaced by using the specified _function_. The
      original String is not modified so you must capture the new String
      in a variable to preserve changes. When you specify a function as the
      second parameter, the function is invoked after the match has been performed.


    **Parameters:**
    - regexp - the regular expression to use.
    - function - a Function that operates on matches of  _regexp_ in the current String.

    **Returns:**
    - a new String that results when matches of the _regexp_
      parameter are replaced by the _function_.



---

### replace(RegExp, String)
- replace(regexp: [RegExp](TopLevel.RegExp.md), replacement: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Returns a new String that results when matches of the _regexp_
      parameter are replaced by the _replacement_ parameter. The
      original String is not modified so you must capture the new String
      in a variable to preserve changes. If regexp has the global flag set,
      all occurrences are replaced, if the global flag is not set only the
      first occurrence is replaced.


    **Parameters:**
    - regexp - the regular expression to use.
    - replacement - a String that is to take the place of all matches of  _regexp_ in the current String.

    **Returns:**
    - a new String that results when matches of the _regexp_
      parameter are replaced by the _replacement_.



---

### replace(String, Function)
- replace(literal: [String](TopLevel.String.md), function: [Function](TopLevel.Function.md)): [String](TopLevel.String.md)
  - : Returns a new String that results when matches of the _literal_
      parameter are replaced by using the specified _function_. The
      original String is not modified so you must capture the new String
      in a variable to preserve changes. When you specify a function as the
      second parameter, the function is invoked after the match has been
      performed.


    **Parameters:**
    - literal - the literal string to locate.
    - function - a Function that operates on the match of  _literal_ in the current String.

    **Returns:**
    - a new String that results when the first match of the _literal_
      parameter is replaced by the specified _function_.



---

### replace(String, Function, String)
- ~~replace(literal: [String](TopLevel.String.md), function: [Function](TopLevel.Function.md), flags: [String](TopLevel.String.md)): [String](TopLevel.String.md)~~
  - : Returns a new String that results when matches of the _literal_
      parameter are replaced by using the specified _function_. The
      original String is not modified so you must capture the new String
      in a variable to preserve changes. When you specify a function as the
      second parameter, the function is invoked after the match has been
      performed.


    **Parameters:**
    - literal - the literal string to locate.
    - function - a Function that operates on the match of  _literal_ in the current String.
    - flags - a String containing any combination of the Regular  Expression flags of g - global match, i - ignore case, m - match over  multiple lines.

    **Returns:**
    - a new String that results when the first match of the _literal_
      parameter is replaced by the specified _function_.


    **Deprecated:**
:::warning
Use [replace(RegExp, Function)](TopLevel.String.md#replaceregexp-function) instead.
:::
    **API Version:**
:::note
No longer available as of version 21.2.
:::

---

### replace(String, String)
- replace(literal: [String](TopLevel.String.md), replacement: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Returns a new String that results when matches of the _literal_
      parameter are replaced by the _replacement_ parameter. The
      original String is not modified so you must capture the new String
      in a variable to preserve changes. This method only replaces the first
      occurrence of the literal. To replace all occurrences see the polymorphic
      method with a regular expression as argument.


    **Parameters:**
    - literal - the literal string to locate.
    - replacement - a String that is to take the place of all matches of  _regexp_ in the current String.

    **Returns:**
    - a new String that results when the first match of the _literal_
      parameter is replaced by the _replacement_ parameter.



---

### replace(String, String, String)
- ~~replace(literal: [String](TopLevel.String.md), replacement: [String](TopLevel.String.md), flags: [String](TopLevel.String.md)): [String](TopLevel.String.md)~~
  - : Returns a new String that results when matches of the _literal_
      parameter are replaced by the _replacement_ parameter. The
      original String is not modified so you must capture the new String
      in a variable to preserve changes. This method only replaces the first
      occurrence of the literal. To replace all occurrences see the polymorphic
      method with a regular expression as argument. Note that if flags


    **Parameters:**
    - literal - the literal string to locate.
    - replacement - a String that is to take the place of all matches of  _regexp_ in the current String.
    - flags - a String containing any combination of the Regular  Expression flags of g - global match, i - ignore case, m - match over  multiple lines.

    **Returns:**
    - a new String that results when the first match of the _literal_
      parameter is replaced by the _replacement_ parameter.


    **Deprecated:**
:::warning
Use [replace(RegExp, String)](TopLevel.String.md#replaceregexp-string) instead.
:::
    **API Version:**
:::note
No longer available as of version 21.2.
:::

---

### search(RegExp)
- search(regexp: [RegExp](TopLevel.RegExp.md)): [Number](TopLevel.Number.md)
  - : Searches for a match between the passed regular expression and this
      string and returns the zero-based index of the match, or -1 if no match
      is found.


    **Parameters:**
    - regexp - the regular expression to use.

    **Returns:**
    - the zero-based indexed value of the first character in the
              current string that matches the pattern of the regular expression
              _regexp_, or -1 if no match is found.



---

### slice(Number, Number)
- slice(start: [Number](TopLevel.Number.md), end: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Returns a substring of the current String where the
      specified _start_ and _end_ locations are used
      to delimit the String.


    **Parameters:**
    - start - the start position in the current  String from which the slice will begin.
    - end - the end position in the current  String from which the slice will terminate.

    **Returns:**
    - the String between the _start_ and _end_ positions.


---

### split(RegExp)
- split(regexp: [RegExp](TopLevel.RegExp.md)): [String\[\]](TopLevel.String.md)
  - : Returns an array of String instances created by splitting the current
      String based on the regular expression.


    **Parameters:**
    - regexp - the regular expression to use to split the string.

    **Returns:**
    - an array of String instances created by splitting the current
      String based on the regular expression.



---

### split(RegExp, Number)
- split(regexp: [RegExp](TopLevel.RegExp.md), limit: [Number](TopLevel.Number.md)): [String\[\]](TopLevel.String.md)
  - : Returns an array of String instances created by splitting the current
      String based on the regular expression and limited in size by the _limit_
      parameter.


    **Parameters:**
    - regexp - the regular expression to use to split the string.
    - limit - controls the maximum number of items that will  be returned.

    **Returns:**
    - an array of String instances created by splitting the current
      String based on the regular expression and limited in size by the _limit_
      parameter.



---

### split(String)
- split(delimiter: [String](TopLevel.String.md)): [String\[\]](TopLevel.String.md)
  - : Returns an array of String instances created by splitting the current
      String based on the delimiter.


    **Parameters:**
    - delimiter - the delimiter to use to split the string.

    **Returns:**
    - an array of String instances created by splitting the current
      String based on the delimiter.



---

### split(String, Number)
- split(delimiter: [String](TopLevel.String.md), limit: [Number](TopLevel.Number.md)): [String\[\]](TopLevel.String.md)
  - : Returns an array of String instances created by splitting the current
      String based on the delimiter and limited in size by the _limit_
      parameter.


    **Parameters:**
    - delimiter - the delimiter to use to split the string.
    - limit - controls the maximum number of items that will  be returned.

    **Returns:**
    - an array of String instances created by splitting the current
      String based on the delimiter and limited in size by the _limit_
      parameter.



---

### startsWith(String)
- startsWith(searchString: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Tests if this string starts with a given string.

    **Parameters:**
    - searchString - The characters to be searched for this string.

    **Returns:**
    - `true` if the search string was found else `false`

    **API Version:**
:::note
Available from version 21.2.
:::

---

### startsWith(String, Number)
- startsWith(searchString: [String](TopLevel.String.md), position: [Number](TopLevel.Number.md)): [Boolean](TopLevel.Boolean.md)
  - : Tests if this string starts with a given string.

    **Parameters:**
    - searchString - The characters to be searched for this string.
    - position - The position in this string at which to begin searching for searchString.

    **Returns:**
    - `true` if the search string was found else `false`

    **API Version:**
:::note
Available from version 21.2.
:::

---

### substr(Number)
- substr(start: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Creates and returns a new String by splitting the current string
      at the specified _start_ location until the end of the String.


    **Parameters:**
    - start - the start position in the current string from which  the new string will be created.

    **Returns:**
    - a new String created by splitting the current string
      starting at the specified _start_ location until the end of the String.



---

### substr(Number, Number)
- substr(start: [Number](TopLevel.Number.md), length: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Creates and returns a new String by splitting the current string
      at the specified _start_ location and limited by the _length_
      value.


    **Parameters:**
    - start - the start position in the current string from which  the new string will be created.
    - length - controls the length of the new string.

    **Returns:**
    - a new String created by splitting the current string
      starting at the specified _start_ location and limited by the _length_
      value.



---

### substring(Number)
- substring(from: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Creates and returns a new String by splitting the current string
      at the specified _from_ location until the end of the String.


    **Parameters:**
    - from - the start position in the current string from which  the new string will be created.

    **Returns:**
    - a new String created by splitting the current string
      starting at the specified _from_ location until the end of the String.



---

### substring(Number, Number)
- substring(from: [Number](TopLevel.Number.md), to: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Creates and returns a new String by splitting the current string
      at the specified _from_ location until the specified _to_ location.


    **Parameters:**
    - from - the start position in the current string from which  the new string will be created.
    - to - the end position in the current string from which the  new string will be created.

    **Returns:**
    - a new String created by splitting the current string
      starting at the specified _from_ location until the specified
      _to_ location.
      value.



---

### toLocaleLowerCase()
- toLocaleLowerCase(): [String](TopLevel.String.md)
  - : Returns a copy of the current string in all lower-case letters.

    **Returns:**
    - a copy of the current string in all lower-case letters.


---

### toLocaleUpperCase()
- toLocaleUpperCase(): [String](TopLevel.String.md)
  - : Returns a copy of the current string in all upper-case letters.

    **Returns:**
    - a copy of the current string in all upper-case letters.


---

### toLowerCase()
- toLowerCase(): [String](TopLevel.String.md)
  - : Returns a copy of the current string in all lower-case letters.

    **Returns:**
    - a copy of the current string in all lower-case letters.


---

### toString()
- toString(): [String](TopLevel.String.md)
  - : Returns a String value of this object.

    **Returns:**
    - a String value of this object.


---

### toUpperCase()
- toUpperCase(): [String](TopLevel.String.md)
  - : Returns a copy of the current string in all upper-case letters.

    **Returns:**
    - a copy of the current string in all upper-case letters.


---

### trim()
- trim(): [String](TopLevel.String.md)
  - : Removes white space characters at the start and the end of the string.

    **Returns:**
    - A new string without leading and ending white space characters.


---

### trimEnd()
- trimEnd(): [String](TopLevel.String.md)
  - : Removes white space characters at the end of the string.

    **Returns:**
    - A new string without ending white space characters.

    **API Version:**
:::note
Available from version 21.2.
:::

---

### trimLeft()
- trimLeft(): [String](TopLevel.String.md)
  - : Removes white space characters at the start of the string.
      [trimStart()](TopLevel.String.md#trimstart) should be used instead of this.


    **Returns:**
    - A new string without leading white space characters.

    **API Version:**
:::note
Available from version 21.2.
:::

---

### trimRight()
- trimRight(): [String](TopLevel.String.md)
  - : Removes white space characters at the end of the string.
      [trimEnd()](TopLevel.String.md#trimend) should be used instead of this.


    **Returns:**
    - A new string without ending white space characters.

    **API Version:**
:::note
Available from version 21.2.
:::

---

### trimStart()
- trimStart(): [String](TopLevel.String.md)
  - : Removes white space characters at the start of the string.

    **Returns:**
    - A new string without leading white space characters.

    **API Version:**
:::note
Available from version 21.2.
:::

---

### valueOf()
- valueOf(): [String](TopLevel.String.md)
  - : Returns a String value of this object.

    **Returns:**
    - a String value of this object.


---

<!-- prettier-ignore-end -->
