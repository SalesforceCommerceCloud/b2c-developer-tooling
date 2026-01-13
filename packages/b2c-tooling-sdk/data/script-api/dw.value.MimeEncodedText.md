<!-- prettier-ignore-start -->
# Class MimeEncodedText

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.value.MimeEncodedText](dw.value.MimeEncodedText.md)

Container for an arbitrary text string its mime type, and encoding


## Property Summary

| Property | Description |
| --- | --- |
| [encoding](#encoding): [String](TopLevel.String.md) `(read-only)` | Returns the encoding of the text. |
| [mimeType](#mimetype): [String](TopLevel.String.md) `(read-only)` | Returns the mime type of the text. |
| [text](#text): [String](TopLevel.String.md) `(read-only)` | Returns the text. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [MimeEncodedText](#mimeencodedtextstring-string-string)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Creates a new MimeEncodedText with explicit values for mime type and  encoding. |
| [MimeEncodedText](#mimeencodedtextstring)([String](TopLevel.String.md)) | Creates a new MimeEncodedText with the given String as text, mime type of  "text/plain;charset=UTF-8" and encoding of "UTF-8" |

## Method Summary

| Method | Description |
| --- | --- |
| [getEncoding](dw.value.MimeEncodedText.md#getencoding)() | Returns the encoding of the text. |
| [getMimeType](dw.value.MimeEncodedText.md#getmimetype)() | Returns the mime type of the text. |
| [getText](dw.value.MimeEncodedText.md#gettext)() | Returns the text. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### encoding
- encoding: [String](TopLevel.String.md) `(read-only)`
  - : Returns the encoding of the text. Encoding is set at creation time and
      can't be changed afterwards



---

### mimeType
- mimeType: [String](TopLevel.String.md) `(read-only)`
  - : Returns the mime type of the text. Mime type is set at creation time and
      can't be changed afterwards.



---

### text
- text: [String](TopLevel.String.md) `(read-only)`
  - : Returns the text. Text is set at creation time and can't be changed
      afterwards.



---

## Constructor Details

### MimeEncodedText(String, String, String)
- MimeEncodedText(text: [String](TopLevel.String.md), mimeType: [String](TopLevel.String.md), encoding: [String](TopLevel.String.md))
  - : Creates a new MimeEncodedText with explicit values for mime type and
      encoding.


    **Parameters:**
    - text - text to be stored
    - mimeType - mime type of the text. For example, "text/plain" or             "text/html"
    - encoding - Encoding of the text. For example, "UTF-8" or "ISO-8859-1"


---

### MimeEncodedText(String)
- MimeEncodedText(text: [String](TopLevel.String.md))
  - : Creates a new MimeEncodedText with the given String as text, mime type of
      "text/plain;charset=UTF-8" and encoding of "UTF-8"


    **Parameters:**
    - text - text to be stored


---

## Method Details

### getEncoding()
- getEncoding(): [String](TopLevel.String.md)
  - : Returns the encoding of the text. Encoding is set at creation time and
      can't be changed afterwards


    **Returns:**
    - encoding of the text


---

### getMimeType()
- getMimeType(): [String](TopLevel.String.md)
  - : Returns the mime type of the text. Mime type is set at creation time and
      can't be changed afterwards.


    **Returns:**
    - the MimeType of the text


---

### getText()
- getText(): [String](TopLevel.String.md)
  - : Returns the text. Text is set at creation time and can't be changed
      afterwards.


    **Returns:**
    - text stored


---

<!-- prettier-ignore-end -->
