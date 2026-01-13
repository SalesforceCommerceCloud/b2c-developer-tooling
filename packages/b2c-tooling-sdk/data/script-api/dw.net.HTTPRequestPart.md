<!-- prettier-ignore-start -->
# Class HTTPRequestPart

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.net.HTTPRequestPart](dw.net.HTTPRequestPart.md)

This represents a part in a multi-part HTTP POST request.


A part always has a name and value. The value may be a String, Bytes, or the contents of a File.


A character encoding may be specified for any of these, and the content type and a file name may additionally be
specified for the Bytes and File types.


**Note:** when this class is used with sensitive data, be careful in persisting sensitive information.



## Property Summary

| Property | Description |
| --- | --- |
| [bytesValue](#bytesvalue): [Bytes](dw.util.Bytes.md) `(read-only)` | Get the Bytes value of the part. |
| [contentType](#contenttype): [String](TopLevel.String.md) `(read-only)` | Returns the content type of this part. |
| [encoding](#encoding): [String](TopLevel.String.md) `(read-only)` | Get the charset to be used to encode the string. |
| [fileName](#filename): [String](TopLevel.String.md) `(read-only)` | Get the file name to use when sending a file part. |
| [fileValue](#filevalue): [File](dw.io.File.md) `(read-only)` | Get the file value of the part. |
| [name](#name): [String](TopLevel.String.md) `(read-only)` | Get the name of the part. |
| [stringValue](#stringvalue): [String](TopLevel.String.md) `(read-only)` | Get the string value of the part. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [HTTPRequestPart](#httprequestpartstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Construct a part representing a simple string name/value pair. |
| [HTTPRequestPart](#httprequestpartstring-string-string)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Construct a part representing a simple string name/value pair. |
| [HTTPRequestPart](#httprequestpartstring-file)([String](TopLevel.String.md), [File](dw.io.File.md)) | Construct a part representing a name/File pair. |
| [HTTPRequestPart](#httprequestpartstring-bytes)([String](TopLevel.String.md), [Bytes](dw.util.Bytes.md)) | Construct a part representing a name/bytes pair. |
| [HTTPRequestPart](#httprequestpartstring-bytes-string-string-string)([String](TopLevel.String.md), [Bytes](dw.util.Bytes.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Construct a part representing a name/File pair. |
| [HTTPRequestPart](#httprequestpartstring-file-string-string)([String](TopLevel.String.md), [File](dw.io.File.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Construct a part representing a name/File pair. |
| [HTTPRequestPart](#httprequestpartstring-file-string-string-string)([String](TopLevel.String.md), [File](dw.io.File.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Construct a part representing a name/File pair. |

## Method Summary

| Method | Description |
| --- | --- |
| [getBytesValue](dw.net.HTTPRequestPart.md#getbytesvalue)() | Get the Bytes value of the part. |
| [getContentType](dw.net.HTTPRequestPart.md#getcontenttype)() | Returns the content type of this part. |
| [getEncoding](dw.net.HTTPRequestPart.md#getencoding)() | Get the charset to be used to encode the string. |
| [getFileName](dw.net.HTTPRequestPart.md#getfilename)() | Get the file name to use when sending a file part. |
| [getFileValue](dw.net.HTTPRequestPart.md#getfilevalue)() | Get the file value of the part. |
| [getName](dw.net.HTTPRequestPart.md#getname)() | Get the name of the part. |
| [getStringValue](dw.net.HTTPRequestPart.md#getstringvalue)() | Get the string value of the part. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### bytesValue
- bytesValue: [Bytes](dw.util.Bytes.md) `(read-only)`
  - : Get the Bytes value of the part.


---

### contentType
- contentType: [String](TopLevel.String.md) `(read-only)`
  - : Returns the content type of this part.


---

### encoding
- encoding: [String](TopLevel.String.md) `(read-only)`
  - : Get the charset to be used to encode the string.


---

### fileName
- fileName: [String](TopLevel.String.md) `(read-only)`
  - : Get the file name to use when sending a file part.


---

### fileValue
- fileValue: [File](dw.io.File.md) `(read-only)`
  - : Get the file value of the part.


---

### name
- name: [String](TopLevel.String.md) `(read-only)`
  - : Get the name of the part.


---

### stringValue
- stringValue: [String](TopLevel.String.md) `(read-only)`
  - : Get the string value of the part.


---

## Constructor Details

### HTTPRequestPart(String, String)
- HTTPRequestPart(name: [String](TopLevel.String.md), value: [String](TopLevel.String.md))
  - : Construct a part representing a simple string name/value pair. The HTTP
      message uses "US-ASCII" as the default character set for the part.


    **Parameters:**
    - name - The name of the part.
    - value - The string to post.


---

### HTTPRequestPart(String, String, String)
- HTTPRequestPart(name: [String](TopLevel.String.md), value: [String](TopLevel.String.md), encoding: [String](TopLevel.String.md))
  - : Construct a part representing a simple string name/value pair. The HTTP
      message uses the specified encoding or "US-ASCII" if null is passed
      for the part.


    **Parameters:**
    - name - The name of the part.
    - value - The string to post.
    - encoding - The charset to be used to encode the string, if null the             default is used.


---

### HTTPRequestPart(String, File)
- HTTPRequestPart(name: [String](TopLevel.String.md), file: [File](dw.io.File.md))
  - : Construct a part representing a name/File pair. The HTTP message will use
      "application/octet-stream" as the content type and "ISO-8859-1" as the character
      set for the part.


    **Parameters:**
    - name - The name of the file part
    - file - The file to post


---

### HTTPRequestPart(String, Bytes)
- HTTPRequestPart(name: [String](TopLevel.String.md), data: [Bytes](dw.util.Bytes.md))
  - : Construct a part representing a name/bytes pair. The HTTP message will use
      "application/octet-stream" as the content type without a character set.


    **Parameters:**
    - name - The name of the file part
    - data - The bytes to post


---

### HTTPRequestPart(String, Bytes, String, String, String)
- HTTPRequestPart(name: [String](TopLevel.String.md), data: [Bytes](dw.util.Bytes.md), contentType: [String](TopLevel.String.md), encoding: [String](TopLevel.String.md), fileName: [String](TopLevel.String.md))
  - : Construct a part representing a name/File pair.
      
      
      
      - If both contentType and encoding are null, then the part will be defaulted to use "application/octet-stream"  as the content-type without an encoding.    - If only the encoding is null, then the contentType will be used without an encoding.        - If only the contentType is null, then it will be defaulted to "text/plain".      


    **Parameters:**
    - name - The name of the file part
    - data - The bytes to post
    - contentType - The content type for this part, if null or blank the default is used.
    - encoding - the charset encoding for this part, if null or blank the default is used.
    - fileName - The file name to use in the Mime header, or null to not use one.


---

### HTTPRequestPart(String, File, String, String)
- HTTPRequestPart(name: [String](TopLevel.String.md), file: [File](dw.io.File.md), contentType: [String](TopLevel.String.md), encoding: [String](TopLevel.String.md))
  - : Construct a part representing a name/File pair.
      
      
      
      - If both contentType and encoding are null, then the part will be defaulted to use "application/octet-stream"  as the content-type and "ISO-8859-1" as the encoding.    - If only the encoding is null, then the contentType will be used without an encoding.        - If only the contentType is null, then it will be defaulted to "text/plain".      


    **Parameters:**
    - name - The name of the file part
    - file - The file to post
    - contentType - The content type for this part, if null or blank the default is used.
    - encoding - the charset encoding for this part, if null or blank the default is used


---

### HTTPRequestPart(String, File, String, String, String)
- HTTPRequestPart(name: [String](TopLevel.String.md), file: [File](dw.io.File.md), contentType: [String](TopLevel.String.md), encoding: [String](TopLevel.String.md), fileName: [String](TopLevel.String.md))
  - : Construct a part representing a name/File pair.
      
      
      
      - If both contentType and encoding are null, then the part will be defaulted to use "application/octet-stream"  as the content-type and "ISO-8859-1" as the encoding.    - If only the encoding is null, then the contentType will be used without an encoding.        - If only the contentType is null, then it will be defaulted to "text/plain".      


    **Parameters:**
    - name - The name of the file part
    - file - The file to post
    - contentType - The content type for this part, if null or blank the default is used.
    - encoding - the charset encoding for this part, if null or blank the default is used
    - fileName - The file name to use in the Mime header, or null to use the name of the given file.


---

## Method Details

### getBytesValue()
- getBytesValue(): [Bytes](dw.util.Bytes.md)
  - : Get the Bytes value of the part.

    **Returns:**
    - The Bytes value, or null if this part is not a Bytes part.


---

### getContentType()
- getContentType(): [String](TopLevel.String.md)
  - : Returns the content type of this part.

    **Returns:**
    - The content type, or null if content type was not specified.


---

### getEncoding()
- getEncoding(): [String](TopLevel.String.md)
  - : Get the charset to be used to encode the string.

    **Returns:**
    - The charset, or null if charset was not specified.


---

### getFileName()
- getFileName(): [String](TopLevel.String.md)
  - : Get the file name to use when sending a file part.

    **Returns:**
    - File name to use in the Mime header, or null for default behavior.


---

### getFileValue()
- getFileValue(): [File](dw.io.File.md)
  - : Get the file value of the part.

    **Returns:**
    - The file value, or null if this part is not a file part.


---

### getName()
- getName(): [String](TopLevel.String.md)
  - : Get the name of the part.

    **Returns:**
    - The part name, never null.


---

### getStringValue()
- getStringValue(): [String](TopLevel.String.md)
  - : Get the string value of the part.

    **Returns:**
    - The string value, or null if this part is not a string part.


---

<!-- prettier-ignore-end -->
