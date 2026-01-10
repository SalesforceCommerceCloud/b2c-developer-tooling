<!-- prettier-ignore-start -->
# Class JWS

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.crypto.JWS](dw.crypto.JWS.md)

This class represents a JSON Web Signature (JWS) object.


**Note:** this class handles sensitive security-related data.
Pay special attention to PCI DSS v3 requirements 2, 4, and 12.



## Property Summary

| Property | Description |
| --- | --- |
| [algorithm](#algorithm): [String](TopLevel.String.md) `(read-only)` | Get the algorithm (`alg`) from the header. |
| [header](#header): [JWSHeader](dw.crypto.JWSHeader.md) `(read-only)` | Get a copy of the JWS header. |
| [headerMap](#headermap): [Map](dw.util.Map.md) `(read-only)` | Get a copy of the JWS header as a Map. |
| [payload](#payload): [String](TopLevel.String.md) `(read-only)` | Get the payload from this object. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [JWS](#jwsjwsheader-string)([JWSHeader](dw.crypto.JWSHeader.md), [String](TopLevel.String.md)) | Construct a new JWS for signing. |
| [JWS](#jwsjwsheader-bytes)([JWSHeader](dw.crypto.JWSHeader.md), [Bytes](dw.util.Bytes.md)) | Construct a new JWS for signing. |

## Method Summary

| Method | Description |
| --- | --- |
| [getAlgorithm](dw.crypto.JWS.md#getalgorithm)() | Get the algorithm (`alg`) from the header. |
| [getHeader](dw.crypto.JWS.md#getheader)() | Get a copy of the JWS header. |
| [getHeaderMap](dw.crypto.JWS.md#getheadermap)() | Get a copy of the JWS header as a Map. |
| [getPayload](dw.crypto.JWS.md#getpayload)() | Get the payload from this object. |
| static [parse](dw.crypto.JWS.md#parsestring)([String](TopLevel.String.md)) | Parse a JSON Web Signature (JWS) object from its compact serialization format. |
| static [parse](dw.crypto.JWS.md#parsestring-bytes)([String](TopLevel.String.md), [Bytes](dw.util.Bytes.md)) | Parse a JSON Web Signature (JWS) object from its compact serialization format. |
| static [parse](dw.crypto.JWS.md#parsestring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Parse a JSON Web Signature (JWS) object from its compact serialization format. |
| [serialize](dw.crypto.JWS.md#serializeboolean)([Boolean](TopLevel.Boolean.md)) | Get this JWS in compact serialization form. |
| [sign](dw.crypto.JWS.md#signkeyref)([KeyRef](dw.crypto.KeyRef.md)) | Sign the payload using the given private key. |
| [verify](dw.crypto.JWS.md#verifycertificateref)([CertificateRef](dw.crypto.CertificateRef.md)) | Verifies the signature of the payload. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### algorithm
- algorithm: [String](TopLevel.String.md) `(read-only)`
  - : Get the algorithm (`alg`) from the header.


---

### header
- header: [JWSHeader](dw.crypto.JWSHeader.md) `(read-only)`
  - : Get a copy of the JWS header.


---

### headerMap
- headerMap: [Map](dw.util.Map.md) `(read-only)`
  - : Get a copy of the JWS header as a Map.


---

### payload
- payload: [String](TopLevel.String.md) `(read-only)`
  - : Get the payload from this object.
      
      
      This is available even if the signature has not been verified.



---

## Constructor Details

### JWS(JWSHeader, String)
- JWS(header: [JWSHeader](dw.crypto.JWSHeader.md), payload: [String](TopLevel.String.md))
  - : Construct a new JWS for signing.

    **Parameters:**
    - header - JWS header. This must include a valid algorithm (`alg`). See      [verify(CertificateRef)](dw.crypto.JWS.md#verifycertificateref) for a list of supported algorithms.
    - payload - Content that will be signed.


---

### JWS(JWSHeader, Bytes)
- JWS(header: [JWSHeader](dw.crypto.JWSHeader.md), payload: [Bytes](dw.util.Bytes.md))
  - : Construct a new JWS for signing.

    **Parameters:**
    - header - JWS header. This must include a valid algorithm (`alg`). See      [verify(CertificateRef)](dw.crypto.JWS.md#verifycertificateref) for a list of supported algorithms.
    - payload - Content that will be signed.


---

## Method Details

### getAlgorithm()
- getAlgorithm(): [String](TopLevel.String.md)
  - : Get the algorithm (`alg`) from the header.

    **Returns:**
    - Value of the algorithm or null if missing.


---

### getHeader()
- getHeader(): [JWSHeader](dw.crypto.JWSHeader.md)
  - : Get a copy of the JWS header.

    **Returns:**
    - Copy of the JWS header.


---

### getHeaderMap()
- getHeaderMap(): [Map](dw.util.Map.md)
  - : Get a copy of the JWS header as a Map.

    **Returns:**
    - Copy of the JWS header.


---

### getPayload()
- getPayload(): [String](TopLevel.String.md)
  - : Get the payload from this object.
      
      
      This is available even if the signature has not been verified.


    **Returns:**
    - UTF-8 encoded payload.


---

### parse(String)
- static parse(jws: [String](TopLevel.String.md)): [JWS](dw.crypto.JWS.md)
  - : Parse a JSON Web Signature (JWS) object from its compact serialization format.

    **Parameters:**
    - jws - JWS in compact serialization format.

    **Returns:**
    - JWS object.


---

### parse(String, Bytes)
- static parse(jws: [String](TopLevel.String.md), payload: [Bytes](dw.util.Bytes.md)): [JWS](dw.crypto.JWS.md)
  - : Parse a JSON Web Signature (JWS) object from its compact serialization format.

    **Parameters:**
    - jws - JWS without a payload in compact serialization format.
    - payload - Detached payload

    **Returns:**
    - JWS object.


---

### parse(String, String)
- static parse(jws: [String](TopLevel.String.md), payload: [String](TopLevel.String.md)): [JWS](dw.crypto.JWS.md)
  - : Parse a JSON Web Signature (JWS) object from its compact serialization format.

    **Parameters:**
    - jws - JWS without a payload in compact serialization format.
    - payload - Detached payload

    **Returns:**
    - JWS object.


---

### serialize(Boolean)
- serialize(detachPayload: [Boolean](TopLevel.Boolean.md)): [String](TopLevel.String.md)
  - : Get this JWS in compact serialization form.

    **Parameters:**
    - detachPayload - true for a detached payload compliant with RFC-7797, or false to serialize the payload      too.

    **Returns:**
    - Compact serialized object.


---

### sign(KeyRef)
- sign(keyRef: [KeyRef](dw.crypto.KeyRef.md)): void
  - : Sign the payload using the given private key.
      
      
      The key type and size must match the algorithm given in the JWS header.


    **Parameters:**
    - keyRef - Reference to the private key.

    **Throws:**
    - Exception - if there is an error while signing the payload.


---

### verify(CertificateRef)
- verify(certificateRef: [CertificateRef](dw.crypto.CertificateRef.md)): [Boolean](TopLevel.Boolean.md)
  - : Verifies the signature of the payload.
      
      
      If the `x5c` header parameter is present, then that certificate chain will be used to verify the
      signature and the given `certificateRef` must be its root certificate. If this parameter is not
      present then the given `certificateRef` will be used to directly verify the signature.
      
      
      The following algorithms are supported:
      
      - ES256
      - ES256K
      - ES384
      - ES512
      - RS256
      - RS384
      - RS512
      - PS256
      - PS384
      - PS512


    **Parameters:**
    - certificateRef - Reference to the certificate to use for verification.

    **Returns:**
    - a boolean indicating success (true) or failure (false).

    **Throws:**
    - Exception - if there is an error while processing the certificate (for example if the `x5c`      is not signed by the given certificate) or the algorithm is unsupported.


---

<!-- prettier-ignore-end -->
