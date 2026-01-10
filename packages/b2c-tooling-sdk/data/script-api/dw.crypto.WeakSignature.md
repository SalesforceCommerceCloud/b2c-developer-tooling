<!-- prettier-ignore-start -->
# Class WeakSignature

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.crypto.WeakSignature](dw.crypto.WeakSignature.md)

This API provides access to Deprecated algorithms.


See [Signature](dw.crypto.Signature.md) for full documentation. WeakSignature is simply a drop-in replacement that **only** supports
deprecated algorithms. This is helpful when you need to deal with weak algorithms for backward compatibility
purposes, but Signature should always be used for new development and for anything intended to be secure.




This class allows access to signature services offered through the Java Cryptography Architecture (JCA). At this time
the signature/verification implementation of the methods is based on the default RSA JCE provider of the JDK -
sun.security.rsa.SunRsaSign




dw.crypto.WeakSignature is an adapter to the security provider implementation and only covers one digest algorithm:

- SHA1withRSA





**Note:** this class handles sensitive security-related data. Pay special attention to PCI DSS v3. requirements 2,
4, 12, and other relevant requirements.



## Constructor Summary

| Constructor | Description |
| --- | --- |
| [WeakSignature](#weaksignature)() |  |

## Method Summary

| Method | Description |
| --- | --- |
| [isDigestAlgorithmSupported](dw.crypto.WeakSignature.md#isdigestalgorithmsupportedstring)([String](TopLevel.String.md)) | Checks to see if a digest algorithm is supported |
| [sign](dw.crypto.WeakSignature.md#signstring-keyref-string)([String](TopLevel.String.md), [KeyRef](dw.crypto.KeyRef.md), [String](TopLevel.String.md)) | Signs a string and returns a string |
| [sign](dw.crypto.WeakSignature.md#signstring-string-string)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Signs a string and returns a string |
| [signBytes](dw.crypto.WeakSignature.md#signbytesbytes-keyref-string)([Bytes](dw.util.Bytes.md), [KeyRef](dw.crypto.KeyRef.md), [String](TopLevel.String.md)) | Signs bytes and returns bytes |
| [signBytes](dw.crypto.WeakSignature.md#signbytesbytes-string-string)([Bytes](dw.util.Bytes.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Signs bytes and returns bytes |
| [verifyBytesSignature](dw.crypto.WeakSignature.md#verifybytessignaturebytes-bytes-certificateref-string)([Bytes](dw.util.Bytes.md), [Bytes](dw.util.Bytes.md), [CertificateRef](dw.crypto.CertificateRef.md), [String](TopLevel.String.md)) | Verifies a signature supplied as bytes |
| [verifyBytesSignature](dw.crypto.WeakSignature.md#verifybytessignaturebytes-bytes-string-string)([Bytes](dw.util.Bytes.md), [Bytes](dw.util.Bytes.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Verifies a signature supplied as bytes |
| [verifySignature](dw.crypto.WeakSignature.md#verifysignaturestring-string-certificateref-string)([String](TopLevel.String.md), [String](TopLevel.String.md), [CertificateRef](dw.crypto.CertificateRef.md), [String](TopLevel.String.md)) | Verifies a signature supplied as string |
| [verifySignature](dw.crypto.WeakSignature.md#verifysignaturestring-string-string-string)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Verifies a signature supplied as string |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constructor Details

### WeakSignature()
- WeakSignature()
  - : 


---

## Method Details

### isDigestAlgorithmSupported(String)
- isDigestAlgorithmSupported(digestAlgorithm: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Checks to see if a digest algorithm is supported

    **Parameters:**
    - digestAlgorithm - the digest algorithm name

    **Returns:**
    - a boolean indicating success (true) or failure (false)


---

### sign(String, KeyRef, String)
- sign(contentToSign: [String](TopLevel.String.md), privateKey: [KeyRef](dw.crypto.KeyRef.md), digestAlgorithm: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Signs a string and returns a string

    **Parameters:**
    - contentToSign - base64 encoded content to sign
    - privateKey - a reference to a private key entry in the keystore
    - digestAlgorithm - must be one of the currently supported ones

    **Returns:**
    - the base64 encoded signature


---

### sign(String, String, String)
- sign(contentToSign: [String](TopLevel.String.md), privateKey: [String](TopLevel.String.md), digestAlgorithm: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Signs a string and returns a string

    **Parameters:**
    - contentToSign - base64 encoded content to sign
    - privateKey - base64 encoded private key
    - digestAlgorithm - must be one of the currently supported ones

    **Returns:**
    - the base64 encoded signature


---

### signBytes(Bytes, KeyRef, String)
- signBytes(contentToSign: [Bytes](dw.util.Bytes.md), privateKey: [KeyRef](dw.crypto.KeyRef.md), digestAlgorithm: [String](TopLevel.String.md)): [Bytes](dw.util.Bytes.md)
  - : Signs bytes and returns bytes

    **Parameters:**
    - contentToSign - transformed with UTF-8 encoding into a byte stream
    - privateKey - a reference to a private key entry in the keystore
    - digestAlgorithm - must be one of the currently supported ones

    **Returns:**
    - signature


---

### signBytes(Bytes, String, String)
- signBytes(contentToSign: [Bytes](dw.util.Bytes.md), privateKey: [String](TopLevel.String.md), digestAlgorithm: [String](TopLevel.String.md)): [Bytes](dw.util.Bytes.md)
  - : Signs bytes and returns bytes

    **Parameters:**
    - contentToSign - transformed with UTF-8 encoding into a byte stream
    - privateKey - base64 encoded private key
    - digestAlgorithm - must be one of the currently supported ones

    **Returns:**
    - signature


---

### verifyBytesSignature(Bytes, Bytes, CertificateRef, String)
- verifyBytesSignature(signature: [Bytes](dw.util.Bytes.md), contentToVerify: [Bytes](dw.util.Bytes.md), certificate: [CertificateRef](dw.crypto.CertificateRef.md), digestAlgorithm: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Verifies a signature supplied as bytes

    **Parameters:**
    - signature - signature to check as bytes
    - contentToVerify - as bytes
    - certificate - a reference to a trusted certificate
    - digestAlgorithm - must be one of the currently supported ones

    **Returns:**
    - a boolean indicating success (true) or failure (false)


---

### verifyBytesSignature(Bytes, Bytes, String, String)
- verifyBytesSignature(signature: [Bytes](dw.util.Bytes.md), contentToVerify: [Bytes](dw.util.Bytes.md), publicKey: [String](TopLevel.String.md), digestAlgorithm: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Verifies a signature supplied as bytes

    **Parameters:**
    - signature - signature to check as bytes
    - contentToVerify - as bytes
    - publicKey - base64 encoded public key
    - digestAlgorithm - must be one of the currently supported ones

    **Returns:**
    - a boolean indicating success (true) or failure (false)


---

### verifySignature(String, String, CertificateRef, String)
- verifySignature(signature: [String](TopLevel.String.md), contentToVerify: [String](TopLevel.String.md), certificate: [CertificateRef](dw.crypto.CertificateRef.md), digestAlgorithm: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Verifies a signature supplied as string

    **Parameters:**
    - signature - base64 encoded signature
    - contentToVerify - base64 encoded content to verify
    - certificate - a reference to a trusted certificate
    - digestAlgorithm - must be one of the currently supported ones

    **Returns:**
    - a boolean indicating success (true) or failure (false)


---

### verifySignature(String, String, String, String)
- verifySignature(signature: [String](TopLevel.String.md), contentToVerify: [String](TopLevel.String.md), publicKey: [String](TopLevel.String.md), digestAlgorithm: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Verifies a signature supplied as string

    **Parameters:**
    - signature - base64 encoded signature
    - contentToVerify - base64 encoded content to verify
    - publicKey - base64 encoded public key
    - digestAlgorithm - must be one of the currently supported ones

    **Returns:**
    - a boolean indicating success (true) or failure (false)


---

<!-- prettier-ignore-end -->
