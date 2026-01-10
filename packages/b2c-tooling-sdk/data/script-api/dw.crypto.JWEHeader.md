<!-- prettier-ignore-start -->
# Class JWEHeader

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.crypto.JWEHeader](dw.crypto.JWEHeader.md)

This class represents an immutable header of a JWE (JSON Web Encryption) object.


## Property Summary

| Property | Description |
| --- | --- |
| [algorithm](#algorithm): [String](TopLevel.String.md) `(read-only)` | Get the value of the algorithm parameter (`alg`). |
| [encryptionAlgorithm](#encryptionalgorithm): [String](TopLevel.String.md) `(read-only)` | Get the value of the encryption algorithm parameter (`enc`). |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getAlgorithm](dw.crypto.JWEHeader.md#getalgorithm)() | Get the value of the algorithm parameter (`alg`). |
| [getEncryptionAlgorithm](dw.crypto.JWEHeader.md#getencryptionalgorithm)() | Get the value of the encryption algorithm parameter (`enc`). |
| static [parse](dw.crypto.JWEHeader.md#parseobject)([Object](TopLevel.Object.md)) | Convert the given Map or JavaScript object into a JWE header. |
| static [parseEncoded](dw.crypto.JWEHeader.md#parseencodedstring)([String](TopLevel.String.md)) | Parse the given string as a Base64URL-encoded JWE header. |
| static [parseJSON](dw.crypto.JWEHeader.md#parsejsonstring)([String](TopLevel.String.md)) | Parse the given string as a JWE header. |
| [toMap](dw.crypto.JWEHeader.md#tomap)() | Get a copy of these headers as a Map. |
| [toString](dw.crypto.JWEHeader.md#tostring)() | Get the content of the headers as a JSON String. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### algorithm
- algorithm: [String](TopLevel.String.md) `(read-only)`
  - : Get the value of the algorithm parameter (`alg`).


---

### encryptionAlgorithm
- encryptionAlgorithm: [String](TopLevel.String.md) `(read-only)`
  - : Get the value of the encryption algorithm parameter (`enc`).


---

## Method Details

### getAlgorithm()
- getAlgorithm(): [String](TopLevel.String.md)
  - : Get the value of the algorithm parameter (`alg`).

    **Returns:**
    - Algorithm parameter from this header.


---

### getEncryptionAlgorithm()
- getEncryptionAlgorithm(): [String](TopLevel.String.md)
  - : Get the value of the encryption algorithm parameter (`enc`).

    **Returns:**
    - Encryption algorithm parameter from this header.


---

### parse(Object)
- static parse(map: [Object](TopLevel.Object.md)): [JWEHeader](dw.crypto.JWEHeader.md)
  - : Convert the given Map or JavaScript object into a JWE header.
      
      
      All keys correspond to JWE parameters. The algorithm (`alg`) and encryption method
      (`enc`) parameters are required. See [JWE.decrypt(KeyRef)](dw.crypto.JWE.md#decryptkeyref) for supported values.


    **Parameters:**
    - map - Map or object data to convert.

    **Returns:**
    - JWE Header.


---

### parseEncoded(String)
- static parseEncoded(base64encoded: [String](TopLevel.String.md)): [JWEHeader](dw.crypto.JWEHeader.md)
  - : Parse the given string as a Base64URL-encoded JWE header.
      
      
      The algorithm (`alg`) and encryption method (`enc`) parameters are required. See
      [JWE.decrypt(KeyRef)](dw.crypto.JWE.md#decryptkeyref) for supported values.


    **Parameters:**
    - base64encoded - Base64URL string to parse.

    **Returns:**
    - JWE Header.


---

### parseJSON(String)
- static parseJSON(json: [String](TopLevel.String.md)): [JWEHeader](dw.crypto.JWEHeader.md)
  - : Parse the given string as a JWE header.
      
      
      The algorithm (`alg`) and encryption method (`enc`) parameters are required. See
      [JWE.decrypt(KeyRef)](dw.crypto.JWE.md#decryptkeyref) for supported values.


    **Parameters:**
    - json - JSON string to parse.

    **Returns:**
    - JWE Header.


---

### toMap()
- toMap(): [Map](dw.util.Map.md)
  - : Get a copy of these headers as a Map.

    **Returns:**
    - Copy of the JWE headers.


---

### toString()
- toString(): [String](TopLevel.String.md)
  - : Get the content of the headers as a JSON String.

    **Returns:**
    - JSON String.


---

<!-- prettier-ignore-end -->
