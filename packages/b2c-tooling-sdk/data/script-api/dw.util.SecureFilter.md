<!-- prettier-ignore-start -->
# Class SecureFilter

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.util.SecureFilter](dw.util.SecureFilter.md)

SecureFilter contains many methods for manipulating untrusted data Strings
into RFC-Compliant Strings for a given context by removing "bad" data from
the untrusted data.



## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| static [forHtmlContent](dw.util.SecureFilter.md#forhtmlcontentstring)([String](TopLevel.String.md)) | <p>  Filters illegal characters from a given input for use in a general HTML  context. |
| static [forHtmlInDoubleQuoteAttribute](dw.util.SecureFilter.md#forhtmlindoublequoteattributestring)([String](TopLevel.String.md)) | <p>  Filters illegal characters from a given input for use in an HTML  Attribute guarded by a double quote. |
| static [forHtmlInSingleQuoteAttribute](dw.util.SecureFilter.md#forhtmlinsinglequoteattributestring)([String](TopLevel.String.md)) | <p>  Filters illegal characters from a given input for use in an HTML  Attribute guarded by a single quote. |
| static [forHtmlUnquotedAttribute](dw.util.SecureFilter.md#forhtmlunquotedattributestring)([String](TopLevel.String.md)) | <p>  Filters illegal characters from a given input for use in an HTML  Attribute left unguarded. |
| static [forJSONValue](dw.util.SecureFilter.md#forjsonvaluestring)([String](TopLevel.String.md)) | <p>  Filters illegal characters from a given input for use in a JSON Object  Value to prevent escaping into a trusted context. |
| static [forJavaScriptInAttribute](dw.util.SecureFilter.md#forjavascriptinattributestring)([String](TopLevel.String.md)) | <p>  Filters illegal characters from a given input for use in JavaScript  inside an HTML attribute. |
| static [forJavaScriptInBlock](dw.util.SecureFilter.md#forjavascriptinblockstring)([String](TopLevel.String.md)) | <p>  Filters illegal characters from a given input for use in JavaScript  inside an HTML block. |
| static [forJavaScriptInHTML](dw.util.SecureFilter.md#forjavascriptinhtmlstring)([String](TopLevel.String.md)) | <p>  Filters illegal characters from a given input for use in JavaScript  inside an HTML context. |
| static [forJavaScriptInSource](dw.util.SecureFilter.md#forjavascriptinsourcestring)([String](TopLevel.String.md)) | <p>  Filters illegal characters from a given input for use in JavaScript  inside a JavaScript source file. |
| static [forUriComponent](dw.util.SecureFilter.md#foruricomponentstring)([String](TopLevel.String.md)) | <p>  Filters illegal characters from a given input for use as a component  of a URI. |
| static [forUriComponentStrict](dw.util.SecureFilter.md#foruricomponentstrictstring)([String](TopLevel.String.md)) | <p>  Filters illegal characters from a given input for use as a component  of a URI. |
| static [forXmlCommentContent](dw.util.SecureFilter.md#forxmlcommentcontentstring)([String](TopLevel.String.md)) | <p>  Filters illegal characters from a given input for use in an XML  comments. |
| static [forXmlContent](dw.util.SecureFilter.md#forxmlcontentstring)([String](TopLevel.String.md)) | <p>  Filters illegal characters from a given input for use in a general XML  context. |
| static [forXmlInDoubleQuoteAttribute](dw.util.SecureFilter.md#forxmlindoublequoteattributestring)([String](TopLevel.String.md)) | <p>  Filters illegal characters from a given input for use in an XML  attribute guarded by a double quote. |
| static [forXmlInSingleQuoteAttribute](dw.util.SecureFilter.md#forxmlinsinglequoteattributestring)([String](TopLevel.String.md)) | <p>  Filters illegal characters from a given input for use in an XML  attribute guarded by a single quote. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Method Details

### forHtmlContent(String)
- static forHtmlContent(input: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : 
      
      Filters illegal characters from a given input for use in a general HTML
      context. E.g. text content and text attributes. This method takes the
      UNION of allowed characters among all contexts, so may be more
      imprecise that the more specific contexts. Generally, this method is
      preferred unless you specifically understand the context in which
      untrusted data will be output.
      
      
      
      **Example Usage:**
      
      ```
      <div>${SecureFilter.forHtmlContent(unsafeData)}</div>
      
      <input value="${SecureFilter.forHtmlContent(unsafeData)}" />
      ```
      
      
      **Flow:**
      
      - Allow AlphaNumerics and some Special characters
      - Remove all other characters


    **Parameters:**
    - input - untrusted input to be filtered, if necessary

    **Returns:**
    - a properly filtered string for the given input


---

### forHtmlInDoubleQuoteAttribute(String)
- static forHtmlInDoubleQuoteAttribute(input: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : 
      
      Filters illegal characters from a given input for use in an HTML
      Attribute guarded by a double quote. This method is preferred if you
      understand exactly how the output of this will be used in the HTML
      document.
      
      
      
      **Example Usage:**
      
      ```
      <div id="${SecureFilter.forHtmlInDoubleQuoteAttribute(unsafeData)}"></div>
      ```
      
      
      **Flow:**
      
      - Allow AlphaNumerics and some Special characters
      - Remove all other characters


    **Parameters:**
    - input - untrusted input to be filtered, if necessary

    **Returns:**
    - a properly filtered string for the given input


---

### forHtmlInSingleQuoteAttribute(String)
- static forHtmlInSingleQuoteAttribute(input: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : 
      
      Filters illegal characters from a given input for use in an HTML
      Attribute guarded by a single quote. This method is preferred if you
      understand exactly how the output of this will be used in the HTML
      document.
      
      
      
      **Example Usage:**
      
      ```
      <div id='${SecureFilter.forHtmlInSingleQuoteAttribute(unsafeData)}'></div>
      ```
      
      
      **Flow:**
      
      - Allow AlphaNumerics and some Special characters
      - Remove all other characters


    **Parameters:**
    - input - untrusted input to be filterd, if necessary

    **Returns:**
    - a properly filtered string for the given input


---

### forHtmlUnquotedAttribute(String)
- static forHtmlUnquotedAttribute(input: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : 
      
      Filters illegal characters from a given input for use in an HTML
      Attribute left unguarded. This method is preferred if you understand
      exactly how the output of this will be used in the HTML document.
      
      
      
      **Example Usage:**
      
      ```
      <div id=${SecureFilter.forHtmlUnquotedAttribute(unsafeData)}></div>
      ```
      
      
      **Flow:**
      
      - Allow AlphaNumerics and some Special characters
      - Remove all other characters


    **Parameters:**
    - input - untrusted input to be filtered, if necessary

    **Returns:**
    - a properly filtered string for the given input


---

### forJSONValue(String)
- static forJSONValue(input: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : 
      
      Filters illegal characters from a given input for use in a JSON Object
      Value to prevent escaping into a trusted context.
      
      
      
      **Example Usage:**
      
      ```
      var json = {"trusted_data" : SecureFilter.forJSONValue(unsafeData)};
      return JSON.stringify(json);
      ```
      
      
      **Flow:**
      
      - Allow AlphaNumerics
      - Remove all other characters


    **Parameters:**
    - input - ed input to be filtered, if necessary

    **Returns:**
    - a properly filtered string for the given input


---

### forJavaScriptInAttribute(String)
- static forJavaScriptInAttribute(input: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : 
      
      Filters illegal characters from a given input for use in JavaScript
      inside an HTML attribute. This method is preferred if you understand
      exactly how the output of the will be used in the page
      
      
      
      **Example Usage:**
      
      ```
      <button onclick="alert('${SecureFilter.forJavaScriptInAttribute(unsafeData)}');">
      ```
      
      
      **Flow:**
      
      - Allow AlphaNumerics and some Special characters
      - Remove all other characters


    **Parameters:**
    - input - untrusted input to be filtered, if necessary

    **Returns:**
    - a properly filtered string for the given input


---

### forJavaScriptInBlock(String)
- static forJavaScriptInBlock(input: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : 
      
      Filters illegal characters from a given input for use in JavaScript
      inside an HTML block. This method is preferred if you understand
      exactly how the output of the will be used in the page
      
      
      
      **Example Usage:**
      
      ```
      <script type="text/javascript">
          var data = "${SecureFilter.forJavaScriptInBlock(unsafeData)}";
      </script>
      ```
      
      
      **Flow:**
      
      - Allow AlphaNumerics and some Special characters
      - Remove all other characters


    **Parameters:**
    - input - untrusted input to be filtered, if necessary

    **Returns:**
    - a properly filtered string for the given input


---

### forJavaScriptInHTML(String)
- static forJavaScriptInHTML(input: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : 
      
      Filters illegal characters from a given input for use in JavaScript
      inside an HTML context. This method takes the UNION of allowed
      characters among the other contexts, so may be more imprecise that the
      more specific contexts. Generally, this method is preferred unless you
      specifically understand the context in which untrusted data will be
      output.
      
      
      
      **Example Usage:**
      
      ```
      <script type="text/javascript">
          var data = "${SecureFilter.forJavaScriptInHTML(unsafeData)}";
      </script>
      
      <button onclick="alert('${SecureFilter.forJavaScriptInHTML(unsafeData)}');">
      ```
      
      
      **Flow:**
      
      - Allow AlphaNumerics and some Special characters
      - Remove all other characters


    **Parameters:**
    - input - untrusted input to be filtered, if necessary

    **Returns:**
    - a properly filtered string for the given input


---

### forJavaScriptInSource(String)
- static forJavaScriptInSource(input: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : 
      
      Filters illegal characters from a given input for use in JavaScript
      inside a JavaScript source file. This method is preferred if you
      understand exactly how the output of the will be used in the page
      
      
      
      **Example Usage:**
      
      ```
      <...inside foobar.js...>
      var data = "${SecureFilter.forJavaScriptInSource(unsafeData)}";
      ```
      
      
      **Flow:**
      
      - Allow AlphaNumerics and some Special characters
      - Remove all other characters


    **Parameters:**
    - input - untrusted input to be filtered, if necessary

    **Returns:**
    - a properly filtered string for the given input


---

### forUriComponent(String)
- static forUriComponent(input: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : 
      
      Filters illegal characters from a given input for use as a component
      of a URI. This is equivalent to javascript's filterURIComponent and
      does a realistic job of encoding.
      
      
      
      **Example Usage:**
      
      ```
      <a href="http://host.com?value=${SecureFilter.forUriComponent(unsafeData)}"/>
      ```
      
      
      **Allows:**
      
      ```
      A-Z, a-z, 0-9, -, _, ., ~, !, *, ', (, )
      ```
      
      
      **Flow:**
      
      - Allow AlphaNumerics and some Special characters
      - Remove all other characters


    **Parameters:**
    - input - untrusted input to be filtered, if necessary

    **Returns:**
    - a properly filtered string for the given input


---

### forUriComponentStrict(String)
- static forUriComponentStrict(input: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : 
      
      Filters illegal characters from a given input for use as a component
      of a URI. This is a strict filter and fully complies with RFC3986.
      
      
      
      **Example Usage:**
      
      ```
      <a href="http://host.com?value=${SecureFilter.forUriComponentStrict(unsafeData)}"/>
      ```
      
      
      **Allows:**
      
      ```
      A-Z, a-z, 0-9, -, _, ., ~
      ```
      
      
      **Flow:**
      
      - Allow AlphaNumerics and some Special characters
      - Remove all other characters


    **Parameters:**
    - input - untrusted input to be filtered, if necessary

    **Returns:**
    - a properly filtered string for the given input


---

### forXmlCommentContent(String)
- static forXmlCommentContent(input: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : 
      
      Filters illegal characters from a given input for use in an XML
      comments. This method is preferred if you understand the context in
      which untrusted data will be output.
      
      
      
      **Note: It is recommended that you use a real parser, as this method
       can be misused, but is left here if a parser is unavailable to you**
      
      
      **Example Usage:**
      
      ```
      <!-- ${SecureFilter.forXmlCommentContent(unsafeData)} -->
      ```
      
      
      **Flow:**
      
      - Allow AlphaNumerics and some Special characters
      - Remove all other characters


    **Parameters:**
    - input - untrusted input to be filtered, if necessary

    **Returns:**
    - a properly filtered string for the given input


---

### forXmlContent(String)
- static forXmlContent(input: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : 
      
      Filters illegal characters from a given input for use in a general XML
      context. E.g. text content and text attributes. This method takes the
      UNION of allowed characters between the other contexts, so may be more
      imprecise that the more specific contexts. Generally, this method is
      preferred unless you specifically understand the context in which
      untrusted data will be output.
      
      
      
      **Note: It is recommended that you use a real parser, as this method
       can be misused, but is left here if a parser is unavailable to you**
      
      
      **Example Usage:**
      
      ```
      <foo>${SecureFilter.forXmlContent(unsafeData)}</foo>
      
      <bar attr="${SecureFilter.forXmlContent(unsafeData)}"></bar>
      ```
      
      
      **Flow:**
      
      - Allow AlphaNumerics and some Special characters
      - Remove all other characters


    **Parameters:**
    - input - untrusted input to be filtered, if necessary

    **Returns:**
    - a properly filtered string for the given input


---

### forXmlInDoubleQuoteAttribute(String)
- static forXmlInDoubleQuoteAttribute(input: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : 
      
      Filters illegal characters from a given input for use in an XML
      attribute guarded by a double quote. This method is preferred if you
      understand the context in which untrusted data will be output.
      
      
      
      **Note: It is recommended that you use a real parser, as this method
       can be misused, but is left here if a parser is unavailable to you**
      
      
      **Example Usage:**
      
      ```
      <bar attr="${SecureFilter.forXmlInDoubleQuoteAttribute(unsafeData)}"></bar>
      ```
      
      
      **Flow:**
      
      - Allow AlphaNumerics and some Special characters
      - Remove all other characters


    **Parameters:**
    - input - untrusted input to be filtered, if necessary

    **Returns:**
    - a properly filtered string for the given input


---

### forXmlInSingleQuoteAttribute(String)
- static forXmlInSingleQuoteAttribute(input: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : 
      
      Filters illegal characters from a given input for use in an XML
      attribute guarded by a single quote. This method is preferred if you
      understand the context in which untrusted data will be output.
      
      
      
      **Note: It is recommended that you use a real parser, as this method
       can be misused, but is left here if a parser is unavailable to you**
      
      
      **Example Usage:**
      
      ```
      <bar attr='${SecureFilter.forXmlInSingleQuoteAttribute(unsafeData)}'></bar>
      ```
      
      
      **Flow:**
      
      - Allow AlphaNumerics and some Special characters
      - Remove all other characters


    **Parameters:**
    - input - untrusted input to be filtered, if necessary

    **Returns:**
    - a properly filtered string for the given input


---

<!-- prettier-ignore-end -->
