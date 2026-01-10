<!-- prettier-ignore-start -->
# Class SecureEncoder

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.util.SecureEncoder](dw.util.SecureEncoder.md)

SecureEncoder contains many methods for manipulating untrusted data Strings
into RFC-Compliant Strings for a given context by encoding "bad" data into
the proper format.



## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| static [forHtmlContent](dw.util.SecureEncoder.md#forhtmlcontentstring)([String](TopLevel.String.md)) | <p>  Encodes a given input for use in a general HTML context. |
| static [forHtmlInDoubleQuoteAttribute](dw.util.SecureEncoder.md#forhtmlindoublequoteattributestring)([String](TopLevel.String.md)) | <p>  Encodes a given input for use in an HTML Attribute guarded by a double  quote. |
| static [forHtmlInSingleQuoteAttribute](dw.util.SecureEncoder.md#forhtmlinsinglequoteattributestring)([String](TopLevel.String.md)) | <p>  Encodes a given input for use in an HTML Attribute guarded by a single  quote. |
| static [forHtmlUnquotedAttribute](dw.util.SecureEncoder.md#forhtmlunquotedattributestring)([String](TopLevel.String.md)) | <p>  Encodes a given input for use in an HTML Attribute left unguarded. |
| static [forJSONValue](dw.util.SecureEncoder.md#forjsonvaluestring)([String](TopLevel.String.md)) | <p>  Encodes a given input for use in a JSON Object Value to prevent  escaping into a trusted context. |
| static [forJavaScriptInAttribute](dw.util.SecureEncoder.md#forjavascriptinattributestring)([String](TopLevel.String.md)) | <p>  Encodes a given input for use in JavaScript inside an HTML attribute. |
| static [forJavaScriptInBlock](dw.util.SecureEncoder.md#forjavascriptinblockstring)([String](TopLevel.String.md)) | <p>  Encodes a given input for use in JavaScript inside an HTML block. |
| static [forJavaScriptInHTML](dw.util.SecureEncoder.md#forjavascriptinhtmlstring)([String](TopLevel.String.md)) | <p>  Encodes a given input for use in JavaScript inside an HTML context. |
| static [forJavaScriptInSource](dw.util.SecureEncoder.md#forjavascriptinsourcestring)([String](TopLevel.String.md)) | <p>  Encodes a given input for use in JavaScript inside a JavaScript source  file. |
| static [forUriComponent](dw.util.SecureEncoder.md#foruricomponentstring)([String](TopLevel.String.md)) | <p>  Encodes a given input for use as a component of a URI. |
| static [forUriComponentStrict](dw.util.SecureEncoder.md#foruricomponentstrictstring)([String](TopLevel.String.md)) | <p>  Encodes a given input for use as a component of a URI. |
| static [forXmlCommentContent](dw.util.SecureEncoder.md#forxmlcommentcontentstring)([String](TopLevel.String.md)) | <p>  Encodes a given input for use in an XML comments. |
| static [forXmlContent](dw.util.SecureEncoder.md#forxmlcontentstring)([String](TopLevel.String.md)) | <p>  Encodes a given input for use in a general XML context. |
| static [forXmlInDoubleQuoteAttribute](dw.util.SecureEncoder.md#forxmlindoublequoteattributestring)([String](TopLevel.String.md)) | <p>  Encodes a given input for use in an XML attribute guarded by a double  quote. |
| static [forXmlInSingleQuoteAttribute](dw.util.SecureEncoder.md#forxmlinsinglequoteattributestring)([String](TopLevel.String.md)) | <p>  Encodes a given input for use in an XML attribute guarded by a single  quote. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Method Details

### forHtmlContent(String)
- static forHtmlContent(input: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : 
      
      Encodes a given input for use in a general HTML context. E.g.
      text content and text attributes. This method takes the UNION of allowed
      characters between the two context, so may be more imprecise that the
      more specific contexts. Generally, this method is preferred unless you
      specifically understand the context in which untrusted data will be
      output.
      
      
      
      **Example Usage:**
      
      ```
      <div>${SecureEncoder.forHtmlContent(unsafeData)}</div>
      
      <input value="${SecureEncoder.forHtmlContent(unsafeData)}" />
      ```
      
      
      **Flow:**
      
      - Allow AlphaNumerics and some Special characters
      - Replace Illegal Control Characters (Below 0x1F or between 0x7F and 0x9F)  with &\#xfffd;, the Unicode Replacement Character
      - Replace special HTML characters with their HTML Entity equivalents


    **Parameters:**
    - input - untrusted input to be encoded, if necessary

    **Returns:**
    - a properly encoded string for the given input


---

### forHtmlInDoubleQuoteAttribute(String)
- static forHtmlInDoubleQuoteAttribute(input: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : 
      
      Encodes a given input for use in an HTML Attribute guarded by a double
      quote. This method is preferred if you understand exactly how the output
      of this will be used in the HTML document.
      
      
      
      **Example Usage:**
      
      ```
      <div id="${SecureEncoder.forHtmlInDoubleQuoteAttribute(unsafeData)}"></div>
      ```
      
      
      **Flow:**
      
      - Allow AlphaNumerics and some Special characters
      - Replace Illegal Control Characters (Below 0x1F or between 0x7F and 0x9F)  with &\#xfffd;, the Unicode Replacement Character
      - Replace special HTML characters with their HTML Entity equivalents


    **Parameters:**
    - input - untrusted input to be encoded, if necessary

    **Returns:**
    - a properly encoded string for the given input


---

### forHtmlInSingleQuoteAttribute(String)
- static forHtmlInSingleQuoteAttribute(input: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : 
      
      Encodes a given input for use in an HTML Attribute guarded by a single
      quote. This method is preferred if you understand exactly how the output
      of this will be used in the HTML document.
      
      
      
      **Example Usage:**
      
      ```
      <div id='${SecureEncoder.forHtmlInSingleQuoteAttribute(unsafeData)}'></div>
      ```
      
      
      **Flow:**
      
      - Allow AlphaNumerics and some Special characters
      - Replace Illegal Control Characters (Below 0x1F or between 0x7F and 0x9F)  with &\#xfffd;, the Unicode Replacement Character
      - Replace special HTML characters with their HTML Entity equivalents


    **Parameters:**
    - input - untrusted input to be encoded, if necessary

    **Returns:**
    - a properly encoded string for the given input


---

### forHtmlUnquotedAttribute(String)
- static forHtmlUnquotedAttribute(input: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : 
      
      Encodes a given input for use in an HTML Attribute left unguarded.
      This method is preferred if you understand exactly how the output
      of this will be used in the HTML document.
      
      
      
      **Example Usage:**
      
      ```
      <div id=${SecureEncoder.forHtmlUnquotedAttribute(unsafeData)}></div>
      ```
      
      
      **Flow:**
      
      - Allow AlphaNumerics and some Special characters
      - Replace Illegal Control Characters (Below 0x1F or between 0x7F and 0x9F)  with &\#xfffd;, the Unicode Replacement Character
      - Replace special HTML characters with their HTML Entity equivalents


    **Parameters:**
    - input - untrusted input to be encoded, if necessary

    **Returns:**
    - a properly encoded string for the given input


---

### forJSONValue(String)
- static forJSONValue(input: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : 
      
      Encodes a given input for use in a JSON Object Value to prevent
      escaping into a trusted context.
      
      
      
      **Example Usage:**
      
      ```
      var json = {"trusted_data" : SecureEncoder.forJSONValue(unsafeData)};
      return JSON.stringify(json);
      ```
      
      
      **Flow:**
      
      - Allow AlphaNumerics
      - Slash escape certain illegal characters
      - Replace all other characters with their Hex Encoded  equivalents prepended with \\u


    **Parameters:**
    - input - untrusted input to be encoded, if necessary

    **Returns:**
    - a properly encoded string for the given input


---

### forJavaScriptInAttribute(String)
- static forJavaScriptInAttribute(input: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : 
      
      Encodes a given input for use in JavaScript inside an HTML attribute.
      This method is preferred if you understand exactly how the output
      of the will be used in the page
      
      
      
      **Example Usage:**
      
      ```
      <button onclick="alert('${SecureEncoder.forJavaScriptInAttribute(unsafeData)}');">
      ```
      
      
      **Flow:**
      
      - Allow AlphaNumerics and some Special characters
      - Slash escape certain illegal characters
      - Replace special JavaScript characters with their Hex Encoded  equivalents prepended with \\x for character codes under 128 and  \\u for character codes over 128


    **Parameters:**
    - input - untrusted input to be encoded, if necessary

    **Returns:**
    - a properly encoded string for the given input


---

### forJavaScriptInBlock(String)
- static forJavaScriptInBlock(input: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : 
      
      Encodes a given input for use in JavaScript inside an HTML block.
      This method is preferred if you understand exactly how the output
      of the will be used in the page
      
      
      
      **Example Usage:**
      
      ```
      <script type="text/javascript">
          var data = "${SecureEncoder.forJavaScriptInBlock(unsafeData)}";
      </script>
      ```
      
      
      **Flow:**
      
      - Allow AlphaNumerics and some Special characters
      - Slash escape certain illegal characters
      - Replace special JavaScript characters with their Hex Encoded  equivalents prepended with \\x for character codes under 128 and  \\u for character codes over 128


    **Parameters:**
    - input - untrusted input to be encoded, if necessary

    **Returns:**
    - a properly encoded string for the given input


---

### forJavaScriptInHTML(String)
- static forJavaScriptInHTML(input: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : 
      
      Encodes a given input for use in JavaScript inside an HTML context.
      This method takes the UNION of allowed characters among the other
      contexts, so may be more imprecise that the more specific contexts.
      Generally, this method is preferred unless you specifically understand
      the context in which untrusted data will be output.
      
      
      
      **Example Usage:**
      
      ```
      <script type="text/javascript">
          var data = "${SecureEncoder.forJavaScriptInHTML(unsafeData)}";
      </script>
      
      <button onclick="alert('${SecureEncoder.forJavaScriptInHTML(unsafeData)}');">
      ```
      
      
      **Flow:**
      
      - Allow AlphaNumerics and some Special characters
      - Slash escape certain illegal characters
      - Replace special JavaScript characters with their Hex Encoded  equivalents prepended with \\x for character codes under 128 and  \\u for character codes over 128


    **Parameters:**
    - input - untrusted input to be encoded, if necessary

    **Returns:**
    - a properly encoded string for the given input


---

### forJavaScriptInSource(String)
- static forJavaScriptInSource(input: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : 
      
      Encodes a given input for use in JavaScript inside a JavaScript source
      file. This method is preferred if you understand exactly how the output
      of the will be used in the page
      
      
      
      **Example Usage:**
      
      ```
      <...inside foobar.js...>
      var data = "${SecureEncoder.forJavaScriptInSource(unsafeData)}";
      ```
      
      
      **Flow:**
      
      - Allow AlphaNumerics and some Special characters
      - Slash escape certain illegal characters
      - Replace special JavaScript characters with their Hex Encoded  equivalents prepended with \\x for character codes under 128 and  \\u for character codes over 128


    **Parameters:**
    - input - untrusted input to be encoded, if necessary

    **Returns:**
    - a properly encoded string for the given input


---

### forUriComponent(String)
- static forUriComponent(input: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : 
      
      Encodes a given input for use as a component of a URI. This is
      equivalent to javascript's encodeURIComponent and does a realistic
      job of encoding.
      
      
      
      **Example Usage:**
      
      ```
      <a href="http://host.com?value=${SecureEncoder.forUriComponent(unsafeData)}"/>
      ```
      
      
      **Allows:**
      
      ```
      A-Z, a-z, 0-9, -, _, ., ~, !, *, ', (, )
      ```
      
      
      **Flow:**
      
      - Allow AlphaNumerics and some Special characters
      - Percent encode all other characters


    **Parameters:**
    - input - untrusted input to be encoded, if necessary

    **Returns:**
    - a properly encoded string for the given input


---

### forUriComponentStrict(String)
- static forUriComponentStrict(input: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : 
      
      Encodes a given input for use as a component of a URI. This is a strict
      encoder and fully complies with RFC3986.
      
      
      
      **Example Usage:**
      
      ```
      <a href="http://host.com?value=${SecureEncoder.forUriComponentStrict(unsafeData)}"/>
      ```
      
      
      **Allows:**
      
      ```
      A-Z, a-z, 0-9, -, _, ., ~
      ```
      
      
      **Flow:**
      
      - Allow AlphaNumerics and some Special characters
      - Percent encode all other characters


    **Parameters:**
    - input - untrusted input to be encoded, if necessary

    **Returns:**
    - a properly encoded string for the given input


---

### forXmlCommentContent(String)
- static forXmlCommentContent(input: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : 
      
      Encodes a given input for use in an XML comments.
      This method is preferred if you understand the context in which
      untrusted data will be output.
      
      
      
      **Note: It is recommended that you use a real parser, as this method
       can be misused, but is left here if a parser is unavailable to you**
      
      
      **Example Usage:**
      
      ```
      <!-- ${SecureEncoder.forXmlCommentContent(unsafeData)} -->
      ```
      
      
      **Flow:**
      
      - Allow AlphaNumerics and some Special characters
      - Replace Illegal Control Characters (Below 0x1F or between  0x7F and 0x84 or between 0x86 and 0x9F or between 0xFDD0 and 0xFDDF)  with an empty string
      - Replace special XML characters with their default XML Entity equivalents


    **Parameters:**
    - input - untrusted input to be encoded, if necessary

    **Returns:**
    - a properly encoded string for the given input


---

### forXmlContent(String)
- static forXmlContent(input: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : 
      
      Encodes a given input for use in a general XML context. E.g.
      text content and text attributes. This method takes the UNION of allowed
      characters between the other contexts, so may be more imprecise that the
      more specific contexts. Generally, this method is preferred unless you
      specifically understand the context in which untrusted data will be
      output.
      
      
      
      **Note: It is recommended that you use a real parser, as this method
       can be misused, but is left here if a parser is unavailable to you**
      
      
      **Example Usage:**
      
      ```
      <foo>${SecureEncoder.forXmlContent(unsafeData)}</foo>
      
      <bar attr="${SecureEncoder.forXmlContent(unsafeData)}"></bar>
      ```
      
      
      **Flow:**
      
      - Allow AlphaNumerics and some Special characters
      - Replace Illegal Control Characters (Below 0x1F or between  0x7F and 0x84 or between 0x86 and 0x9F or between 0xFDD0 and 0xFDDF)  with an empty string
      - Replace special XML characters with their default XML Entity equivalents


    **Parameters:**
    - input - untrusted input to be encoded, if necessary

    **Returns:**
    - a properly encoded string for the given input


---

### forXmlInDoubleQuoteAttribute(String)
- static forXmlInDoubleQuoteAttribute(input: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : 
      
      Encodes a given input for use in an XML attribute guarded by a double
      quote. This method is preferred if you understand the context in which
      untrusted data will be output.
      
      
      
      **Note: It is recommended that you use a real parser, as this method
       can be misused, but is left here if a parser is unavailable to you**
      
      
      **Example Usage:**
      
      ```
      <bar attr="${SecureEncoder.forXmlInDoubleQuoteAttribute(unsafeData)}"></bar>
      ```
      
      
      **Flow:**
      
      - Allow AlphaNumerics and some Special characters
      - Replace Illegal Control Characters (Below 0x1F or between  0x7F and 0x84 or between 0x86 and 0x9F or between 0xFDD0 and 0xFDDF)  with an empty string
      - Replace special XML characters with their default XML Entity equivalents


    **Parameters:**
    - input - untrusted input to be encoded, if necessary

    **Returns:**
    - a properly encoded string for the given input


---

### forXmlInSingleQuoteAttribute(String)
- static forXmlInSingleQuoteAttribute(input: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : 
      
      Encodes a given input for use in an XML attribute guarded by a single
      quote. This method is preferred if you understand the context in which
      untrusted data will be output.
      
      
      
      **Note: It is recommended that you use a real parser, as this method
       can be misused, but is left here if a parser is unavailable to you**
      
      
      **Example Usage:**
      
      ```
      <bar attr='${SecureEncoder.forXmlInSingleQuoteAttribute(unsafeData)}'></bar>
      ```
      
      
      **Flow:**
      
      - Allow AlphaNumerics and some Special characters
      - Replace Illegal Control Characters (Below 0x1F or between  0x7F and 0x84 or between 0x86 and 0x9F or between 0xFDD0 and 0xFDDF)  with an empty string
      - Replace special XML characters with their default XML Entity equivalents


    **Parameters:**
    - input - untrusted input to be encoded, if necessary

    **Returns:**
    - a properly encoded string for the given input


---

<!-- prettier-ignore-end -->
