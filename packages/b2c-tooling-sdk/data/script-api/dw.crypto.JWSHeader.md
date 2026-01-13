<!-- prettier-ignore-start -->
# Class JWSHeader

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.crypto.JWSHeader](dw.crypto.JWSHeader.md)

This class represents an immutable header of a JWS (JSON Web Signature) object.


## Property Summary

| Property | Description |
| --- | --- |
| [algorithm](#algorithm): [String](TopLevel.String.md) `(read-only)` | Get the value of the algorithm parameter (`alg`). |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getAlgorithm](dw.crypto.JWSHeader.md#getalgorithm)() | Get the value of the algorithm parameter (`alg`). |
| static [parse](dw.crypto.JWSHeader.md#parseobject)([Object](TopLevel.Object.md)) | Convert the given Map or JavaScript object into a JWS header. |
| static [parseEncoded](dw.crypto.JWSHeader.md#parseencodedstring)([String](TopLevel.String.md)) | Parse the given string as a Base64URL-encoded JWS header. |
| static [parseJSON](dw.crypto.JWSHeader.md#parsejsonstring)([String](TopLevel.String.md)) | Parse the given string as a JWS header. |
| [toMap](dw.crypto.JWSHeader.md#tomap)() | Get a copy of these headers as a Map. |
| [toString](dw.crypto.JWSHeader.md#tostring)() | Get the content of the headers as a JSON String. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### algorithm
- algorithm: [String](TopLevel.String.md) `(read-only)`
  - : Get the value of the algorithm parameter (`alg`).


---

## Method Details

### getAlgorithm()
- getAlgorithm(): [String](TopLevel.String.md)
  - : Get the value of the algorithm parameter (`alg`).

    **Returns:**
    - Algorithm parameter from this header.


---

### parse(Object)
- static parse(map: [Object](TopLevel.Object.md)): [JWSHeader](dw.crypto.JWSHeader.md)
  - : Convert the given Map or JavaScript object into a JWS header.
      
      
      All keys correspond to JWS parameters. The algorithm parameter (`alg`) is required. See
      [JWS.verify(CertificateRef)](dw.crypto.JWS.md#verifycertificateref) for supported values.


    **Parameters:**
    - map - Map or object data to convert.

    **Returns:**
    - JWS Header.


---

### parseEncoded(String)
- static parseEncoded(base64encoded: [String](TopLevel.String.md)): [JWSHeader](dw.crypto.JWSHeader.md)
  - : Parse the given string as a Base64URL-encoded JWS header.
      
      
      The algorithm parameter (`alg`) is required. See [JWS.verify(CertificateRef)](dw.crypto.JWS.md#verifycertificateref) for supported
      values.


    **Parameters:**
    - base64encoded - Base64URL string to parse.

    **Returns:**
    - JWS Header.


---

### parseJSON(String)
- static parseJSON(json: [String](TopLevel.String.md)): [JWSHeader](dw.crypto.JWSHeader.md)
  - : Parse the given string as a JWS header.
      
      
      The algorithm parameter (`alg`) is required. See [JWS.verify(CertificateRef)](dw.crypto.JWS.md#verifycertificateref) for supported
      values.


    **Parameters:**
    - json - JSON string to parse.

    **Returns:**
    - JWS Header.


---

### toMap()
- toMap(): [Map](dw.util.Map.md)
  - : Get a copy of these headers as a Map.

    **Returns:**
    - Copy of the JWS headers.


---

### toString()
- toString(): [String](TopLevel.String.md)
  - : Get the content of the headers as a JSON String.

    **Returns:**
    - JSON String.


---

<!-- prettier-ignore-end -->
