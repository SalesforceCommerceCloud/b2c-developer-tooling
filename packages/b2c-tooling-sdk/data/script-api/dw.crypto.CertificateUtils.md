<!-- prettier-ignore-start -->
# Class CertificateUtils

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.crypto.CertificateUtils](dw.crypto.CertificateUtils.md)

Utilities for managing certificates and keys.


## Constructor Summary

| Constructor | Description |
| --- | --- |
| [CertificateUtils](#certificateutils)() |  |

## Method Summary

| Method | Description |
| --- | --- |
| static [getCertificate](dw.crypto.CertificateUtils.md#getcertificatecertificateref)([CertificateRef](dw.crypto.CertificateRef.md)) | Gets the certificate from the given certificate reference. |
| static [getCertificate](dw.crypto.CertificateUtils.md#getcertificatekeyref)([KeyRef](dw.crypto.KeyRef.md)) | Gets the public certificate from the given private key reference. |
| static [getEncodedCertificate](dw.crypto.CertificateUtils.md#getencodedcertificatecertificateref)([CertificateRef](dw.crypto.CertificateRef.md)) | Encode the certificate to the base64-encoded DER format. |
| static [getEncodedPublicKey](dw.crypto.CertificateUtils.md#getencodedpublickeycertificateref)([CertificateRef](dw.crypto.CertificateRef.md)) | Gets the public key from the given certificate reference. |
| static [parseEncodedCertificate](dw.crypto.CertificateUtils.md#parseencodedcertificatestring)([String](TopLevel.String.md)) | Parse the certificate from the base64-encoded DER format. |
| static [parseEncodedPublicKey](dw.crypto.CertificateUtils.md#parseencodedpublickeystring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Parse the public key from the given key in X.509 SubjectPublicKeyInfo format. |
| static [parsePublicKeyFromJWK](dw.crypto.CertificateUtils.md#parsepublickeyfromjwkstring)([String](TopLevel.String.md)) | Parse the public key from the given base64-encoded JWK string. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constructor Details

### CertificateUtils()
- CertificateUtils()
  - : 


---

## Method Details

### getCertificate(CertificateRef)
- static getCertificate(certificateRef: [CertificateRef](dw.crypto.CertificateRef.md)): [X509Certificate](dw.crypto.X509Certificate.md)
  - : Gets the certificate from the given certificate reference.

    **Parameters:**
    - certificateRef - the certificate reference

    **Returns:**
    - The X509Certificate

    **Throws:**
    - Exception - if the reference is invalid or does not refer to an X.509 certificate


---

### getCertificate(KeyRef)
- static getCertificate(keyRef: [KeyRef](dw.crypto.KeyRef.md)): [X509Certificate](dw.crypto.X509Certificate.md)
  - : Gets the public certificate from the given private key reference.

    **Parameters:**
    - keyRef - the key reference

    **Returns:**
    - The X509Certificate

    **Throws:**
    - Exception - if the reference is invalid or there is no X.509 certificate


---

### getEncodedCertificate(CertificateRef)
- static getEncodedCertificate(certificateRef: [CertificateRef](dw.crypto.CertificateRef.md)): [String](TopLevel.String.md)
  - : Encode the certificate to the base64-encoded DER format.

    **Parameters:**
    - certificateRef - the certificate to encode

    **Returns:**
    - base64-encoded DER certificate


---

### getEncodedPublicKey(CertificateRef)
- static getEncodedPublicKey(certificateRef: [CertificateRef](dw.crypto.CertificateRef.md)): [String](TopLevel.String.md)
  - : Gets the public key from the given certificate reference.
      
      
      It is exported in the standard X.509 SubjectPublicKeyInfo format and base64-encoded.


    **Parameters:**
    - certificateRef - the certificate reference with the public key to encode

    **Returns:**
    - The encoded public key


---

### parseEncodedCertificate(String)
- static parseEncodedCertificate(certificate: [String](TopLevel.String.md)): [CertificateRef](dw.crypto.CertificateRef.md)
  - : Parse the certificate from the base64-encoded DER format.

    **Parameters:**
    - certificate - The encoded certificate

    **Returns:**
    - Reference to the parsed certificate


---

### parseEncodedPublicKey(String, String)
- static parseEncodedPublicKey(algorithm: [String](TopLevel.String.md), encodedKey: [String](TopLevel.String.md)): [CertificateRef](dw.crypto.CertificateRef.md)
  - : Parse the public key from the given key in X.509 SubjectPublicKeyInfo format.
      
      
      The resulting reference contains only the public key. It can be used for cryptographic operations, but not
      anything that requires the full certificate.


    **Parameters:**
    - algorithm - The public key algorithm, either `EC` or `RSA`
    - encodedKey - The encoded key

    **Returns:**
    - Reference to the public key


---

### parsePublicKeyFromJWK(String)
- static parsePublicKeyFromJWK(jwk: [String](TopLevel.String.md)): [CertificateRef](dw.crypto.CertificateRef.md)
  - : Parse the public key from the given base64-encoded JWK string.
      
      
      This returns the public key portion of the JWK, not the `x5c` certificate chain.
      
      
      Only RSA and EC keys are supported.
      
      
      
      
      The resulting reference contains only the public key. It can be used for cryptographic operations, but not
      anything that requires the full certificate.


    **Parameters:**
    - jwk - Encoded JWK

    **Returns:**
    - Reference to the public key


---

<!-- prettier-ignore-end -->
