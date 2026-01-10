<!-- prettier-ignore-start -->
# Class CertificateRef

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.crypto.CertificateRef](dw.crypto.CertificateRef.md)

This class is used as a reference to a certificate or public key.


**Note:** this class handles sensitive security-related data.
Pay special attention to PCI DSS v3. requirements 2, 4, and 12.



## All Known Subclasses
[X509Certificate](dw.crypto.X509Certificate.md)
## Constructor Summary

| Constructor | Description |
| --- | --- |
| [CertificateRef](#certificaterefstring)([String](TopLevel.String.md)) | Creates a `CertificateRef` from the passed alias as a reference to a certificate in Business Manager. |

## Method Summary

| Method | Description |
| --- | --- |
| [toString](dw.crypto.CertificateRef.md#tostring)() | Returns the string representation of this CertificateRef. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constructor Details

### CertificateRef(String)
- CertificateRef(alias: [String](TopLevel.String.md))
  - : Creates a `CertificateRef` from the passed alias as a reference to a certificate in Business Manager.
      No check is made whether the alias is actually valid until the time that this `CertificateRef` is
      used to resolve a certificate or public key.


    **Parameters:**
    - alias - an alias that should refer to a certificate in the keystore.


---

## Method Details

### toString()
- toString(): [String](TopLevel.String.md)
  - : Returns the string representation of this CertificateRef.

    **Returns:**
    - The string representation of this CertificateRef.


---

<!-- prettier-ignore-end -->
