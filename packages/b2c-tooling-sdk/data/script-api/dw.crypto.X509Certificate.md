<!-- prettier-ignore-start -->
# Class X509Certificate

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.crypto.CertificateRef](dw.crypto.CertificateRef.md)
    - [dw.crypto.X509Certificate](dw.crypto.X509Certificate.md)

Represents an X.509 public key certificate as defined in RFC 5280.


It provides access to the standard fields of an X.509 certificate including version, serial number, validity period,
distinguished names, and signature algorithm.



## Property Summary

| Property | Description |
| --- | --- |
| [issuerDN](#issuerdn): [String](TopLevel.String.md) `(read-only)` | Returns the X.500 distinguished name of the entity that signed this certificate. |
| [notAfter](#notafter): [Date](TopLevel.Date.md) `(read-only)` | Returns the end date of the certificate validity period. |
| [notBefore](#notbefore): [Date](TopLevel.Date.md) `(read-only)` | Returns the start date of the certificate validity period. |
| [serialNumber](#serialnumber): [String](TopLevel.String.md) `(read-only)` | Returns the certificate serial number in string format. |
| [sigAlgName](#sigalgname): [String](TopLevel.String.md) `(read-only)` | Returns the algorithm used to sign this certificate. |
| [subjectDN](#subjectdn): [String](TopLevel.String.md) `(read-only)` | Returns the X.500 distinguished name of the entity this certificate belongs to. |
| [version](#version): [Number](TopLevel.Number.md) `(read-only)` | Returns the X.509 certificate version number. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getIssuerDN](dw.crypto.X509Certificate.md#getissuerdn)() | Returns the X.500 distinguished name of the entity that signed this certificate. |
| [getNotAfter](dw.crypto.X509Certificate.md#getnotafter)() | Returns the end date of the certificate validity period. |
| [getNotBefore](dw.crypto.X509Certificate.md#getnotbefore)() | Returns the start date of the certificate validity period. |
| [getSerialNumber](dw.crypto.X509Certificate.md#getserialnumber)() | Returns the certificate serial number in string format. |
| [getSigAlgName](dw.crypto.X509Certificate.md#getsigalgname)() | Returns the algorithm used to sign this certificate. |
| [getSubjectDN](dw.crypto.X509Certificate.md#getsubjectdn)() | Returns the X.500 distinguished name of the entity this certificate belongs to. |
| [getVersion](dw.crypto.X509Certificate.md#getversion)() | Returns the X.509 certificate version number. |

### Methods inherited from class CertificateRef

[toString](dw.crypto.CertificateRef.md#tostring)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### issuerDN
- issuerDN: [String](TopLevel.String.md) `(read-only)`
  - : Returns the X.500 distinguished name of the entity that signed this certificate.


---

### notAfter
- notAfter: [Date](TopLevel.Date.md) `(read-only)`
  - : Returns the end date of the certificate validity period.


---

### notBefore
- notBefore: [Date](TopLevel.Date.md) `(read-only)`
  - : Returns the start date of the certificate validity period.


---

### serialNumber
- serialNumber: [String](TopLevel.String.md) `(read-only)`
  - : Returns the certificate serial number in string format. The serial number is a unique positive integer assigned
      by the CA to each certificate.



---

### sigAlgName
- sigAlgName: [String](TopLevel.String.md) `(read-only)`
  - : Returns the algorithm used to sign this certificate. The name follows the format defined in RFC 5280 (e.g.,
      "SHA256withRSA", "SHA384withECDSA").



---

### subjectDN
- subjectDN: [String](TopLevel.String.md) `(read-only)`
  - : Returns the X.500 distinguished name of the entity this certificate belongs to.


---

### version
- version: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the X.509 certificate version number.


---

## Method Details

### getIssuerDN()
- getIssuerDN(): [String](TopLevel.String.md)
  - : Returns the X.500 distinguished name of the entity that signed this certificate.

    **Returns:**
    - the issuer's X.500 distinguished name


---

### getNotAfter()
- getNotAfter(): [Date](TopLevel.Date.md)
  - : Returns the end date of the certificate validity period.

    **Returns:**
    - the date after which this certificate is not valid


---

### getNotBefore()
- getNotBefore(): [Date](TopLevel.Date.md)
  - : Returns the start date of the certificate validity period.

    **Returns:**
    - the date before which this certificate is not valid


---

### getSerialNumber()
- getSerialNumber(): [String](TopLevel.String.md)
  - : Returns the certificate serial number in string format. The serial number is a unique positive integer assigned
      by the CA to each certificate.


    **Returns:**
    - the certificate serial number as a string


---

### getSigAlgName()
- getSigAlgName(): [String](TopLevel.String.md)
  - : Returns the algorithm used to sign this certificate. The name follows the format defined in RFC 5280 (e.g.,
      "SHA256withRSA", "SHA384withECDSA").


    **Returns:**
    - the signature algorithm name


---

### getSubjectDN()
- getSubjectDN(): [String](TopLevel.String.md)
  - : Returns the X.500 distinguished name of the entity this certificate belongs to.

    **Returns:**
    - the subject's X.500 distinguished name


---

### getVersion()
- getVersion(): [Number](TopLevel.Number.md)
  - : Returns the X.509 certificate version number.

    **Returns:**
    - certificate version (typically 1, 2, or 3)


---

<!-- prettier-ignore-end -->
