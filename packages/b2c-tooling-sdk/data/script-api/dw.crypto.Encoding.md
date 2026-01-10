<!-- prettier-ignore-start -->
# Class Encoding

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.crypto.Encoding](dw.crypto.Encoding.md)

Utility class which handles several common character encodings.


## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| static [fromBase64](dw.crypto.Encoding.md#frombase64string)([String](TopLevel.String.md)) | Decode the given string which represents a sequence of characters encoded in base-64 to a byte array. |
| static [fromHex](dw.crypto.Encoding.md#fromhexstring)([String](TopLevel.String.md)) | Converts a String representing hexadecimal values into an array of bytes  of those same values. |
| static [fromURI](dw.crypto.Encoding.md#fromuristring)([String](TopLevel.String.md)) | Decodes a URL safe string into its original form. |
| static [fromURI](dw.crypto.Encoding.md#fromuristring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Decodes a URL safe string into its original form using the specified  encoding. |
| static [toBase64](dw.crypto.Encoding.md#tobase64bytes)([Bytes](dw.util.Bytes.md)) | Convert the given byte array to a string encoded in base-64. |
| static [toBase64URL](dw.crypto.Encoding.md#tobase64urlbytes)([Bytes](dw.util.Bytes.md)) | Convert the given byte array to a string encoded in base-64 for URLs. |
| static [toHex](dw.crypto.Encoding.md#tohexbytes)([Bytes](dw.util.Bytes.md)) | Converts an array of bytes into a string representing the hexadecimal  values of each byte in order. |
| static [toURI](dw.crypto.Encoding.md#touristring)([String](TopLevel.String.md)) | Encodes a string into its URL safe form according to the  "application/x-www-form-urlencoded" encoding scheme using the default  encoding. |
| static [toURI](dw.crypto.Encoding.md#touristring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Encodes a string into its URL safe form according to the  "application/x-www-form-urlencoded" encoding scheme using the specified  encoding. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Method Details

### fromBase64(String)
- static fromBase64(string: [String](TopLevel.String.md)): [Bytes](dw.util.Bytes.md)
  - : Decode the given string which represents a sequence of characters encoded in base-64 to a byte array. This
      operation supports both the base-64 and base-64 for URL formats. Characters not in the base-64 alphabet are
      ignored. An exception is thrown if a null value is passed.
      
      
      Note: This decoding operation is limited to the maximum number of bytes that a Bytes object can hold. See
      [Bytes](dw.util.Bytes.md).


    **Parameters:**
    - string - A string consisting of characters in base-64 alphabet to decode.

    **Returns:**
    - The decoded array of bytes.


---

### fromHex(String)
- static fromHex(string: [String](TopLevel.String.md)): [Bytes](dw.util.Bytes.md)
  - : Converts a String representing hexadecimal values into an array of bytes
      of those same values. The returned byte array will be half the length of
      the passed, as it takes two characters to represent any given byte. An
      exception is thrown if the passed string has an odd number of character
      or if any characters in the string are not valid hexadecimal characters.
      An exception is thrown if a null value is passed.
      
      Note: This decoding operation is limited to the maximum number of bytes
      that a Bytes object can hold. See [Bytes](dw.util.Bytes.md).


    **Parameters:**
    - string - A string containing only hex characters to decode.

    **Returns:**
    - The decoded array of bytes.


---

### fromURI(String)
- static fromURI(string: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Decodes a URL safe string into its original form. Escaped characters are
      converted back to their original representation. An exception is thrown
      if URL decoding is unsuccessful or if null is passed.


    **Parameters:**
    - string - The string to decode.

    **Returns:**
    - The decoded string.


---

### fromURI(String, String)
- static fromURI(string: [String](TopLevel.String.md), encoding: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Decodes a URL safe string into its original form using the specified
      encoding. Escaped characters are converted back to their original
      representation. An exception is thrown if URL decoding is unsuccessful or
      if the specified encoding is unsupported or if null is passed for either
      argument.


    **Parameters:**
    - string - The string to decode.
    - encoding - The name of a supported encoding.

    **Returns:**
    - The decoded string.


---

### toBase64(Bytes)
- static toBase64(bytes: [Bytes](dw.util.Bytes.md)): [String](TopLevel.String.md)
  - : Convert the given byte array to a string encoded in base-64.  This method
      does not chunk the data by adding line breaks.  An exception is thrown
      if a null value is passed.


    **Parameters:**
    - bytes - The array of bytes to encode.

    **Returns:**
    - The encoded string containing only Base64 characters.


---

### toBase64URL(Bytes)
- static toBase64URL(bytes: [Bytes](dw.util.Bytes.md)): [String](TopLevel.String.md)
  - : Convert the given byte array to a string encoded in base-64 for URLs.  This method does not chunk the data by
      adding line breaks and it does not add any padding.  An exception is thrown if a null value is passed.


    **Parameters:**
    - bytes - The array of bytes to encode.

    **Returns:**
    - The encoded string containing only Base64URL characters.


---

### toHex(Bytes)
- static toHex(bytes: [Bytes](dw.util.Bytes.md)): [String](TopLevel.String.md)
  - : Converts an array of bytes into a string representing the hexadecimal
      values of each byte in order. The returned string will be double the
      length of the passed array, as it takes two characters to represent any
      given byte. An exception is thrown if a null value is passed.


    **Parameters:**
    - bytes - The array of bytes to encode.

    **Returns:**
    - The encoded string containing only hex characters.


---

### toURI(String)
- static toURI(string: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Encodes a string into its URL safe form according to the
      "application/x-www-form-urlencoded" encoding scheme using the default
      encoding. Unsafe characters are escaped. An exception is thrown if a null
      value is passed.


    **Parameters:**
    - string - The string to encode.

    **Returns:**
    - The encoded string.


---

### toURI(String, String)
- static toURI(string: [String](TopLevel.String.md), encoding: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Encodes a string into its URL safe form according to the
      "application/x-www-form-urlencoded" encoding scheme using the specified
      encoding. Unsafe characters are escaped. An exception is thrown if the
      specified encoding is unsupported. An exception is thrown if either
      argument is null.


    **Parameters:**
    - string - The string to encode.
    - encoding - The name of a supported encoding.

    **Returns:**
    - The encoded string.


---

<!-- prettier-ignore-end -->
