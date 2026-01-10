<!-- prettier-ignore-start -->
# Class JWE

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.crypto.JWE](dw.crypto.JWE.md)

This class represents a JSON Web Encryption (JWE) object.


**Note:** this class handles sensitive security-related data.
Pay special attention to PCI DSS v3 requirements 2, 4, and 12.



## Property Summary

| Property | Description |
| --- | --- |
| [algorithm](#algorithm): [String](TopLevel.String.md) `(read-only)` | Get the algorithm (`alg`) from the header. |
| [encryptionMethod](#encryptionmethod): [String](TopLevel.String.md) `(read-only)` | Get the encryption method (`enc`) from the header. |
| [headerMap](#headermap): [Map](dw.util.Map.md) `(read-only)` | Get a copy of the JWE headers as a Map. |
| [keyID](#keyid): [String](TopLevel.String.md) `(read-only)` | Get the key id (`kid`) from the header. |
| [payload](#payload): [String](TopLevel.String.md) `(read-only)` | Get the decrypted payload. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [JWE](#jwejweheader-string)([JWEHeader](dw.crypto.JWEHeader.md), [String](TopLevel.String.md)) | Construct a new JWE for encryption. |
| [JWE](#jwejweheader-bytes)([JWEHeader](dw.crypto.JWEHeader.md), [Bytes](dw.util.Bytes.md)) | Construct a new JWE for encryption. |

## Method Summary

| Method | Description |
| --- | --- |
| [decrypt](dw.crypto.JWE.md#decryptkeyref)([KeyRef](dw.crypto.KeyRef.md)) | Decrypt the payload of this JWE object. |
| [encrypt](dw.crypto.JWE.md#encryptcertificateref)([CertificateRef](dw.crypto.CertificateRef.md)) | Encrypt the payload of this JWE object. |
| [getAlgorithm](dw.crypto.JWE.md#getalgorithm)() | Get the algorithm (`alg`) from the header. |
| [getEncryptionMethod](dw.crypto.JWE.md#getencryptionmethod)() | Get the encryption method (`enc`) from the header. |
| [getHeaderMap](dw.crypto.JWE.md#getheadermap)() | Get a copy of the JWE headers as a Map. |
| [getKeyID](dw.crypto.JWE.md#getkeyid)() | Get the key id (`kid`) from the header. |
| [getPayload](dw.crypto.JWE.md#getpayload)() | Get the decrypted payload. |
| static [parse](dw.crypto.JWE.md#parsestring)([String](TopLevel.String.md)) | Parse a JSON Web Encryption (JWE) object from its compact serialization format. |
| [serialize](dw.crypto.JWE.md#serialize)() | Get this JWE in compact serialization form. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### algorithm
- algorithm: [String](TopLevel.String.md) `(read-only)`
  - : Get the algorithm (`alg`) from the header.


---

### encryptionMethod
- encryptionMethod: [String](TopLevel.String.md) `(read-only)`
  - : Get the encryption method (`enc`) from the header.


---

### headerMap
- headerMap: [Map](dw.util.Map.md) `(read-only)`
  - : Get a copy of the JWE headers as a Map.


---

### keyID
- keyID: [String](TopLevel.String.md) `(read-only)`
  - : Get the key id (`kid`) from the header.


---

### payload
- payload: [String](TopLevel.String.md) `(read-only)`
  - : Get the decrypted payload.


---

## Constructor Details

### JWE(JWEHeader, String)
- JWE(header: [JWEHeader](dw.crypto.JWEHeader.md), payload: [String](TopLevel.String.md))
  - : Construct a new JWE for encryption.

    **Parameters:**
    - header - JWE header. This must include a valid algorithm (`alg`) and encryption method (`enc`). See      [decrypt(KeyRef)](dw.crypto.JWE.md#decryptkeyref) for a list of supported algorithms.
    - payload - Content that will be encrypted.


---

### JWE(JWEHeader, Bytes)
- JWE(header: [JWEHeader](dw.crypto.JWEHeader.md), payload: [Bytes](dw.util.Bytes.md))
  - : Construct a new JWE for encryption.

    **Parameters:**
    - header - JWE header. This must include a valid algorithm (`alg`) and encryption method      (`enc`). See [decrypt(KeyRef)](dw.crypto.JWE.md#decryptkeyref) for a list of supported algorithms.
    - payload - Content that will be encrypted.


---

## Method Details

### decrypt(KeyRef)
- decrypt(privateKey: [KeyRef](dw.crypto.KeyRef.md)): void
  - : Decrypt the payload of this JWE object.
      
      
      Elliptic Curve (EC) and RSA keys are both supported.
      
      
      Supported EC key management algorithms:
      
      - ECDH-ES
      - ECDH-ES+A128KW
      - ECDH-ES+A192KW
      - ECDH-ES+A256KW
      
      Supported EC curves:
      
      - P-256
      - P-384
      - P-521
      
      Supported RSA key management algorithms:
      
      - RSA-OAEP-256
      - RSA-OAEP-384
      - RSA-OAEP-512
      
      Supported content encryption algorithms:
      
      - A128CBC-HS256
      - A128CBC-HS384
      - A128CBC-HS512
      - A128GCM
      - A192GCM
      - A256GCM


    **Parameters:**
    - privateKey - Reference to private `RSA` or `EC` key to use for decryption.


---

### encrypt(CertificateRef)
- encrypt(publicKey: [CertificateRef](dw.crypto.CertificateRef.md)): void
  - : Encrypt the payload of this JWE object.
      
      
      Elliptic Curve (EC) and RSA keys are both supported.
      
      
      See [decrypt(KeyRef)](dw.crypto.JWE.md#decryptkeyref) for the list of supported algorithms and encryption methods.


    **Parameters:**
    - publicKey - Reference to public `RSA` or `EC` key to use for decryption.


---

### getAlgorithm()
- getAlgorithm(): [String](TopLevel.String.md)
  - : Get the algorithm (`alg`) from the header.

    **Returns:**
    - Value of the algorithm or null if missing.


---

### getEncryptionMethod()
- getEncryptionMethod(): [String](TopLevel.String.md)
  - : Get the encryption method (`enc`) from the header.

    **Returns:**
    - Value of the encryption method or null if missing.


---

### getHeaderMap()
- getHeaderMap(): [Map](dw.util.Map.md)
  - : Get a copy of the JWE headers as a Map.

    **Returns:**
    - Copy of the JWE headers.


---

### getKeyID()
- getKeyID(): [String](TopLevel.String.md)
  - : Get the key id (`kid`) from the header.

    **Returns:**
    - Value of the key id or null if missing.


---

### getPayload()
- getPayload(): [String](TopLevel.String.md)
  - : Get the decrypted payload.

    **Returns:**
    - Payload or null if the payload is encrypted.


---

### parse(String)
- static parse(jwe: [String](TopLevel.String.md)): [JWE](dw.crypto.JWE.md)
  - : Parse a JSON Web Encryption (JWE) object from its compact serialization format.

    **Parameters:**
    - jwe - JWE in compact serialization format.

    **Returns:**
    - JWE object.


---

### serialize()
- serialize(): [String](TopLevel.String.md)
  - : Get this JWE in compact serialization form.

    **Returns:**
    - Compact serialized object.


---

<!-- prettier-ignore-end -->
