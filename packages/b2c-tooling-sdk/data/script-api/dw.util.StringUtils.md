<!-- prettier-ignore-start -->
# Class StringUtils

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.util.StringUtils](dw.util.StringUtils.md)

String utility class.


## Constant Summary

| Constant | Description |
| --- | --- |
| [ENCODE_TYPE_HTML](#encode_type_html): [Number](TopLevel.Number.md) = 0 | String encoding type HTML. |
| ~~[ENCODE_TYPE_WML](#encode_type_wml): [Number](TopLevel.Number.md) = 2~~ | String encoding type WML. |
| [ENCODE_TYPE_XML](#encode_type_xml): [Number](TopLevel.Number.md) = 1 | String encoding type XML. |
| [TRUNCATE_CHAR](#truncate_char): [String](TopLevel.String.md) = "char" | String truncate mode 'char'. |
| [TRUNCATE_SENTENCE](#truncate_sentence): [String](TopLevel.String.md) = "sentence" | String truncate mode 'sentence'. |
| [TRUNCATE_WORD](#truncate_word): [String](TopLevel.String.md) = "word" | String truncate mode 'word'. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| static [decodeBase64](dw.util.StringUtils.md#decodebase64string)([String](TopLevel.String.md)) | Interprets a Base64 encoded string as byte stream of an UTF-8 encoded string. |
| static [decodeBase64](dw.util.StringUtils.md#decodebase64string-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Interprets a Base64 encoded string as the byte stream representation of a string. |
| static [decodeString](dw.util.StringUtils.md#decodestringstring-number)([String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Convert a given syntax-safe string to a string according to the  selected character entity encoding type. |
| static [encodeBase64](dw.util.StringUtils.md#encodebase64string)([String](TopLevel.String.md)) | Encodes the byte representation of the given string as Base64. |
| static [encodeBase64](dw.util.StringUtils.md#encodebase64string-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Encodes the byte representation of the given string as Base64. |
| static [encodeString](dw.util.StringUtils.md#encodestringstring-number)([String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Convert a given string to a syntax-safe string according to the  selected character entity encoding type. |
| static [format](dw.util.StringUtils.md#formatstring-object)([String](TopLevel.String.md), [Object...](TopLevel.Object.md)) | Returns a formatted string using the specified format and arguments. |
| static [formatCalendar](dw.util.StringUtils.md#formatcalendarcalendar)([Calendar](dw.util.Calendar.md)) | Formats a Calendar object with Calendar.INPUT\_DATE\_TIME\_PATTERN format  of the current request locale, for example "MM/dd/yyyy h:mm a" for the  locale en\_US. |
| static [formatCalendar](dw.util.StringUtils.md#formatcalendarcalendar-string)([Calendar](dw.util.Calendar.md), [String](TopLevel.String.md)) | Formats a Calendar object with the provided date format. |
| static [formatCalendar](dw.util.StringUtils.md#formatcalendarcalendar-string-number)([Calendar](dw.util.Calendar.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Formats a Calendar object with the date format defined by the provided locale  and Calendar pattern. |
| ~~static [formatDate](dw.util.StringUtils.md#formatdatedate)([Date](TopLevel.Date.md))~~ | Formats a date with the default date format of the current site. |
| ~~static [formatDate](dw.util.StringUtils.md#formatdatedate-string)([Date](TopLevel.Date.md), [String](TopLevel.String.md))~~ | Formats a date with the provided date format. |
| ~~static [formatDate](dw.util.StringUtils.md#formatdatedate-string-string)([Date](TopLevel.Date.md), [String](TopLevel.String.md), [String](TopLevel.String.md))~~ | Formats a date with the provided date format in specified locale. |
| static [formatInteger](dw.util.StringUtils.md#formatintegernumber)([Number](TopLevel.Number.md)) | Returns a formatted integer number using the default integer format of the current  site. |
| static [formatMoney](dw.util.StringUtils.md#formatmoneymoney)([Money](dw.value.Money.md)) | Formats a Money Object with the default money format of the current request locale. |
| static [formatNumber](dw.util.StringUtils.md#formatnumbernumber)([Number](TopLevel.Number.md)) | Returns a formatted number using the default number format of the current site. |
| static [formatNumber](dw.util.StringUtils.md#formatnumbernumber-string---variant-1)([Number](TopLevel.Number.md), [String](TopLevel.String.md)) | Returns a formatted string using the specified number and format. |
| static [formatNumber](dw.util.StringUtils.md#formatnumbernumber-string-string---variant-1)([Number](TopLevel.Number.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Returns a formatted number as a string using the specified number format in specified locale. |
| static [formatNumber](dw.util.StringUtils.md#formatnumbernumber-string---variant-2)([Number](TopLevel.Number.md), [String](TopLevel.String.md)) | Returns a formatted string using the specified number and format. |
| static [formatNumber](dw.util.StringUtils.md#formatnumbernumber-string-string---variant-2)([Number](TopLevel.Number.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Returns a formatted number as a string using the specified number format in specified locale. |
| static [garble](dw.util.StringUtils.md#garblestring-string-number)([String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Return a string in which specified number of characters in the suffix is not changed  and the rest of the characters replaced with specified character. |
| static [ltrim](dw.util.StringUtils.md#ltrimstring)([String](TopLevel.String.md)) | Returns the string with leading white space removed. |
| static [pad](dw.util.StringUtils.md#padstring-number)([String](TopLevel.String.md), [Number](TopLevel.Number.md)) | This method provides cell padding functionality to the template. |
| static [rtrim](dw.util.StringUtils.md#rtrimstring)([String](TopLevel.String.md)) | Returns the string with trailing white space removed. |
| static [stringToHtml](dw.util.StringUtils.md#stringtohtmlstring)([String](TopLevel.String.md)) | Convert a given string to an HTML-safe string. |
| ~~static [stringToWml](dw.util.StringUtils.md#stringtowmlstring)([String](TopLevel.String.md))~~ | Converts a given string to a WML-safe string. |
| static [stringToXml](dw.util.StringUtils.md#stringtoxmlstring)([String](TopLevel.String.md)) | Converts a given string to a XML-safe string. |
| static [trim](dw.util.StringUtils.md#trimstring)([String](TopLevel.String.md)) | Returns the string with leading and trailing white space removed. |
| static [truncate](dw.util.StringUtils.md#truncatestring-number-string-string)([String](TopLevel.String.md), [Number](TopLevel.Number.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Truncate the string to the specified length using specified truncate mode. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### ENCODE_TYPE_HTML

- ENCODE_TYPE_HTML: [Number](TopLevel.Number.md) = 0
  - : String encoding type HTML.

    **See Also:**
    - [encodeString(String, Number)](dw.util.StringUtils.md#encodestringstring-number)


---

### ENCODE_TYPE_WML

- ~~ENCODE_TYPE_WML: [Number](TopLevel.Number.md) = 2~~
  - : String encoding type WML.

    **See Also:**
    - [encodeString(String, Number)](dw.util.StringUtils.md#encodestringstring-number)

    **Deprecated:**
:::warning
Don't use this constant anymore.
:::

---

### ENCODE_TYPE_XML

- ENCODE_TYPE_XML: [Number](TopLevel.Number.md) = 1
  - : String encoding type XML.

    **See Also:**
    - [encodeString(String, Number)](dw.util.StringUtils.md#encodestringstring-number)


---

### TRUNCATE_CHAR

- TRUNCATE_CHAR: [String](TopLevel.String.md) = "char"
  - : String truncate mode 'char'. Truncate string to the nearest character. Default mode if no truncate mode is specified.

    **See Also:**
    - [truncate(String, Number, String, String)](dw.util.StringUtils.md#truncatestring-number-string-string)


---

### TRUNCATE_SENTENCE

- TRUNCATE_SENTENCE: [String](TopLevel.String.md) = "sentence"
  - : String truncate mode 'sentence'. Truncate string to the nearest sentence.

    **See Also:**
    - [truncate(String, Number, String, String)](dw.util.StringUtils.md#truncatestring-number-string-string)


---

### TRUNCATE_WORD

- TRUNCATE_WORD: [String](TopLevel.String.md) = "word"
  - : String truncate mode 'word'. Truncate string to the nearest word.

    **See Also:**
    - [truncate(String, Number, String, String)](dw.util.StringUtils.md#truncatestring-number-string-string)


---

## Method Details

### decodeBase64(String)
- static decodeBase64(base64: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Interprets a Base64 encoded string as byte stream of an UTF-8 encoded string.
      
      The method throws an IllegalArgumentException in case the encoding
      failed because of a mismatch between the input string and the character encoding.


    **Parameters:**
    - base64 - the Base64 encoded string - should not be empty or `null`.

    **Returns:**
    - the decoded string.


---

### decodeBase64(String, String)
- static decodeBase64(base64: [String](TopLevel.String.md), characterEncoding: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Interprets a Base64 encoded string as the byte stream representation of a string.
      The given character encoding is used for decoding the byte stream into the
      character representation.
      
      The method throws an IllegalArgumentException in case the encoding
      failed because of a mismatch between the input String and the character encoding.


    **Parameters:**
    - base64 - the Base64 encoded string - should not be empty or `null`.
    - characterEncoding - the character encoding to read the input string -                 should not be empty or `null`.

    **Returns:**
    - the decoded string.


---

### decodeString(String, Number)
- static decodeString(str: [String](TopLevel.String.md), type: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Convert a given syntax-safe string to a string according to the
      selected character entity encoding type.


    **Parameters:**
    - str - String to be decoded
    - type - decode type

    **Returns:**
    - decoded string


---

### encodeBase64(String)
- static encodeBase64(str: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Encodes the byte representation of the given string as Base64.
      The string is converted into the byte representation with UTF-8 encoding.
      
      The method throws an IllegalArgumentException in case the encoding
      failed because of a mismatch between the input string and the character encoding.


    **Parameters:**
    - str - the string to encode - should not be empty or `null`.

    **Returns:**
    - the encoded string.


---

### encodeBase64(String, String)
- static encodeBase64(str: [String](TopLevel.String.md), characterEncoding: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Encodes the byte representation of the given string as Base64.
      The string is converted into the byte representation using the given
      character encoding.
      
      The method throws an IllegalArgumentException in case the encoding
      failed because of a mismatch between the input string and the character encoding.


    **Parameters:**
    - str - the string to encode - should not be empty or `null`.
    - characterEncoding - the character encoding to read the input string -                should not be empty or `null`.

    **Returns:**
    - the encoded string.


---

### encodeString(String, Number)
- static encodeString(str: [String](TopLevel.String.md), type: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Convert a given string to a syntax-safe string according to the
      selected character entity encoding type.


    **Parameters:**
    - str - String to be encoded
    - type - encode type

    **Returns:**
    - encoded string


---

### format(String, Object...)
- static format(format: [String](TopLevel.String.md), args: [Object...](TopLevel.Object.md)): [String](TopLevel.String.md)
  - : Returns a formatted string using the specified format and arguments.
      The formatting string is a Java MessageFormat expression, e.g.
      format( "Message: {0}, {1}", "test", 10 ) would result in "Message: test, 10".
      
      If a Collection is passed as the only argument, the elements of this collection
      are used as arguments for the formatting.


    **Parameters:**
    - format - Java like formatting string.
    - args - optional list of arguments or a collection, which are included into the result string

    **Returns:**
    - the formatted result string.


---

### formatCalendar(Calendar)
- static formatCalendar(calendar: [Calendar](dw.util.Calendar.md)): [String](TopLevel.String.md)
  - : Formats a Calendar object with Calendar.INPUT\_DATE\_TIME\_PATTERN format
      of the current request locale, for example "MM/dd/yyyy h:mm a" for the
      locale en\_US. The used time zone is the time zone of the calendar object.


    **Parameters:**
    - calendar - the calendar object.

    **Returns:**
    - a string representation of the formatted calendar object.


---

### formatCalendar(Calendar, String)
- static formatCalendar(calendar: [Calendar](dw.util.Calendar.md), format: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Formats a Calendar object with the provided date format. The format is a
      Java date format, like "yyy-MM-dd". The used time zone is the time zone
      of the calendar object.


    **Parameters:**
    - calendar - the calendar object to be printed
    - format - the format to use.

    **Returns:**
    - a string representation of the formatted calendar object.


---

### formatCalendar(Calendar, String, Number)
- static formatCalendar(calendar: [Calendar](dw.util.Calendar.md), locale: [String](TopLevel.String.md), pattern: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Formats a Calendar object with the date format defined by the provided locale
      and Calendar pattern.  The locale can be for instance the request.getLocale().
      The used time  zone is the time zone of the calendar object.


    **Parameters:**
    - calendar - the calendar object to be printed
    - locale - the locale, which defines the date format to be used
    - pattern - the pattern is one of a calendar pattern e.g. SHORT\_DATE\_PATTERN                 as defined in the regional settings for the locale

    **Returns:**
    - a string representation of the formatted calendar object.


---

### formatDate(Date)
- ~~static formatDate(date: [Date](TopLevel.Date.md)): [String](TopLevel.String.md)~~
  - : Formats a date with the default date format of the current site.

    **Parameters:**
    - date - the date to format.

    **Returns:**
    - a string representation of the formatted date.

    **Deprecated:**
:::warning
Use [formatCalendar(Calendar, String)](dw.util.StringUtils.md#formatcalendarcalendar-string) instead.
:::

---

### formatDate(Date, String)
- ~~static formatDate(date: [Date](TopLevel.Date.md), format: [String](TopLevel.String.md)): [String](TopLevel.String.md)~~
  - : Formats a date with the provided date format. The format is the
      Java date format, like "yyyy-MM-DD". The locale of the calling context
      request is used in formatting.


    **Parameters:**
    - date - the date to format.
    - format - the format to use.

    **Returns:**
    - a string representation of the formatted date.

    **Deprecated:**
:::warning
Use [formatCalendar(Calendar, String)](dw.util.StringUtils.md#formatcalendarcalendar-string) instead.
:::

---

### formatDate(Date, String, String)
- ~~static formatDate(date: [Date](TopLevel.Date.md), format: [String](TopLevel.String.md), locale: [String](TopLevel.String.md)): [String](TopLevel.String.md)~~
  - : Formats a date with the provided date format in specified locale. The format is
      Java date format, like "yyyy-MM-DD".


    **Parameters:**
    - date - the date to format.
    - format - the format to use.
    - locale - the locale to use.

    **Returns:**
    - a string representation of the formatted date.

    **Deprecated:**
:::warning
Use [formatCalendar(Calendar, String)](dw.util.StringUtils.md#formatcalendarcalendar-string) instead.
:::

---

### formatInteger(Number)
- static formatInteger(number: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Returns a formatted integer number using the default integer format of the current
      site. The method can be also called to format a floating number as integer.


    **Parameters:**
    - number - the number to format.

    **Returns:**
    - a formatted an integer number with the default integer format of the current
      site.



---

### formatMoney(Money)
- static formatMoney(money: [Money](dw.value.Money.md)): [String](TopLevel.String.md)
  - : Formats a Money Object with the default money format of the current request locale.

    **Parameters:**
    - money - The Money instance that should be formatted.

    **Returns:**
    - The formatted String representation of the passed
                 money. In case of an error the string 'N/A' is returned.



---

### formatNumber(Number)
- static formatNumber(number: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Returns a formatted number using the default number format of the current site.
      
      Decimal and grouping separators are used as specified in the locales regional settings.


    **Parameters:**
    - number - the number to format.

    **Returns:**
    - a formatted number using the default number format of the current site.


---

### formatNumber(Number, String) - Variant 1
- static formatNumber(number: [Number](TopLevel.Number.md), format: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Returns a formatted string using the specified number and format. The format is
      Java number format, like "\#,\#\#\#.00". To format as an integer
      number provide "0" as format string. The locale of the calling context
      request is used in formatting.


    **Parameters:**
    - number - the number to format.
    - format - the format to use.

    **Returns:**
    - a formatted string using the specified number and format.

    **API Version:**
:::note
No longer available as of version 18.10.
:::

---

### formatNumber(Number, String, String) - Variant 1
- static formatNumber(number: [Number](TopLevel.Number.md), format: [String](TopLevel.String.md), locale: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Returns a formatted number as a string using the specified number format in specified locale. The format is
      Java number format, like "\#,\#\#\#.00". To format as an integer
      number provide "0" as format string.


    **Parameters:**
    - number - the number to format.
    - format - the format to use.
    - locale - the locale to use.

    **Returns:**
    - a formatted number as a string using the specified number format in specified locale.

    **API Version:**
:::note
No longer available as of version 18.10.
:::

---

### formatNumber(Number, String) - Variant 2
- static formatNumber(number: [Number](TopLevel.Number.md), format: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Returns a formatted string using the specified number and format. The format is
      Java number format, like "\#,\#\#\#.00". To format as an integer
      number provide "0" as format string. The locale of the calling context
      request is used in formatting.
      
      Decimal and grouping separators are used as specified in the locales regional settings (when configured, otherwise a fallback to the internal configuration is done).


    **Parameters:**
    - number - the number to format.
    - format - the format to use.

    **Returns:**
    - a formatted string using the specified number and format.

    **API Version:**
:::note
Available from version 18.10.
In prior versions this method did fall back to Java formatting rules, instead of using the definitions in regional settings.
:::

---

### formatNumber(Number, String, String) - Variant 2
- static formatNumber(number: [Number](TopLevel.Number.md), format: [String](TopLevel.String.md), locale: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Returns a formatted number as a string using the specified number format in specified locale. The format is
      Java number format, like "\#,\#\#\#.00". To format as an integer
      number provide "0" as format string.
      
      Decimal and grouping separators are used as specified in the locales regional settings (when configured, otherwise a fallback to the internal configuration is done).


    **Parameters:**
    - number - the number to format.
    - format - the format to use.
    - locale - the locale to use.

    **Returns:**
    - a formatted number as a string using the specified number format in specified locale.

    **API Version:**
:::note
Available from version 18.10.
In prior versions this method did fall back to Java formatting rules, instead of using the definitions in regional settings.
:::

---

### garble(String, String, Number)
- static garble(str: [String](TopLevel.String.md), replaceChar: [String](TopLevel.String.md), suffixLength: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Return a string in which specified number of characters in the suffix is not changed
      and the rest of the characters replaced with specified character.


    **Parameters:**
    - str - String to garble
    - replaceChar - character to use as a replacement
    - suffixLength - length of the suffix

    **Returns:**
    - the garbled string.


---

### ltrim(String)
- static ltrim(str: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Returns the string with leading white space removed.

    **Parameters:**
    - str - the String to remove characters from.

    **Returns:**
    - the string with leading white space removed.


---

### pad(String, Number)
- static pad(str: [String](TopLevel.String.md), width: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : This method provides cell padding functionality to the template.

    **Parameters:**
    - str - the string to process
    - width - The absolute value of this number defines the                       width of the cell. A possitive number forces left,                       a negative number right alignment.                       A '0' doesn't change the string.

    **Returns:**
    - the processed string.


---

### rtrim(String)
- static rtrim(str: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Returns the string with trailing white space removed.

    **Parameters:**
    - str - the String to remove characters from.

    **Returns:**
    - the string with trailing white space removed.


---

### stringToHtml(String)
- static stringToHtml(str: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Convert a given string to an HTML-safe string.
      This method substitutes characters that conflict with HTML syntax
      (<,>,&,") and characters that are beyond the ASCII
      chart (Unicode 160-255) to HTML 3.2 named character entities.


    **Parameters:**
    - str - String to be converted.

    **Returns:**
    - converted string.


---

### stringToWml(String)
- ~~static stringToWml(str: [String](TopLevel.String.md)): [String](TopLevel.String.md)~~
  - : Converts a given string to a WML-safe string.
      This method substitutes characters that conflict with WML syntax
      (<,>,&,&apos;,"$) to WML named character entities.


    **Parameters:**
    - str - String to be converted.

    **Returns:**
    - the converted string.

    **Deprecated:**
:::warning
Don't use this method anymore
:::

---

### stringToXml(String)
- static stringToXml(str: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Converts a given string to a XML-safe string.
      This method substitutes characters that conflict with XML syntax
      (<,>,&,&apos;,") to XML named character entities.


    **Parameters:**
    - str - String to be converted.

    **Returns:**
    - the converted string.


---

### trim(String)
- static trim(str: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Returns the string with leading and trailing white space removed.

    **Parameters:**
    - str - the string to trim.

    **Returns:**
    - the string with leading and trailing white space removed.


---

### truncate(String, Number, String, String)
- static truncate(str: [String](TopLevel.String.md), maxLength: [Number](TopLevel.Number.md), mode: [String](TopLevel.String.md), suffix: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Truncate the string to the specified length using specified truncate mode. Optionally,
      append suffix to truncated string.


    **Parameters:**
    - str - string to truncate
    - maxLength - maximum length of the truncated string, not including suffix
    - mode - truncate mode (TRUNCATE\_CHAR, TRUNCATE\_WORD, TRUNCATE\_SENTENCE), if null TRUNCATE\_CHAR is assumed
    - suffix - suffix append to the truncated string

    **Returns:**
    - the truncated string.


---

<!-- prettier-ignore-end -->
