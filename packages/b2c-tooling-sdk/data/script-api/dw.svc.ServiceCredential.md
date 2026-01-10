<!-- prettier-ignore-start -->
# Class ServiceCredential

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)
      - [dw.customer.EncryptedObject](dw.customer.EncryptedObject.md)
        - [dw.svc.ServiceCredential](dw.svc.ServiceCredential.md)

Configuration object for Service Credentials.


## Constant Summary

| Constant | Description |
| --- | --- |
| ~~[ENCRYPTION_ALGORITHM_RSA](#encryption_algorithm_rsa): [String](TopLevel.String.md) = "RSA"~~ | Constant for specification of the public key encryption algorithm RSA. |

## Property Summary

| Property | Description |
| --- | --- |
| [ID](#id): [String](TopLevel.String.md) `(read-only)` | Returns the unique Credential ID. |
| [URL](#url): [String](TopLevel.String.md) `(read-only)` | Return the URL. |
| [password](#password): [String](TopLevel.String.md) `(read-only)` | Returns the Password in plain text. |
| [user](#user): [String](TopLevel.String.md) `(read-only)` | Returns the User ID. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| ~~[getEncryptedPassword](dw.svc.ServiceCredential.md#getencryptedpasswordstring-certificateref)([String](TopLevel.String.md), [CertificateRef](dw.crypto.CertificateRef.md))~~ | Encrypts the password from this object with the given algorithm  and the public key taken from a certificate in the keystore. |
| [getID](dw.svc.ServiceCredential.md#getid)() | Returns the unique Credential ID. |
| [getPassword](dw.svc.ServiceCredential.md#getpassword)() | Returns the Password in plain text. |
| [getURL](dw.svc.ServiceCredential.md#geturl)() | Return the URL. |
| [getUser](dw.svc.ServiceCredential.md#getuser)() | Returns the User ID. |

### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### ENCRYPTION_ALGORITHM_RSA

- ~~ENCRYPTION_ALGORITHM_RSA: [String](TopLevel.String.md) = "RSA"~~
  - : Constant for specification of the public key encryption algorithm RSA.

    **See Also:**
    - [getEncryptedPassword(String, CertificateRef)](dw.svc.ServiceCredential.md#getencryptedpasswordstring-certificateref)

    **Deprecated:**
:::warning
Use [Cipher](dw.crypto.Cipher.md) to encrypt data as needed.
:::

---

## Property Details

### ID
- ID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the unique Credential ID.


---

### URL
- URL: [String](TopLevel.String.md) `(read-only)`
  - : Return the URL.


---

### password
- password: [String](TopLevel.String.md) `(read-only)`
  - : Returns the Password in plain text.


---

### user
- user: [String](TopLevel.String.md) `(read-only)`
  - : Returns the User ID.


---

## Method Details

### getEncryptedPassword(String, CertificateRef)
- ~~getEncryptedPassword(algorithm: [String](TopLevel.String.md), publicKey: [CertificateRef](dw.crypto.CertificateRef.md)): [String](TopLevel.String.md)~~
  - : Encrypts the password from this object with the given algorithm
      and the public key taken from a certificate in the keystore.
      Returned is the base64-encoded representation of the result. 
      
      See also [Cipher.encrypt(String, CertificateRef, String, String, Number)](dw.crypto.Cipher.md#encryptstring-certificateref-string-string-number---variant-2) on how to generate RSA key pairs.


    **Parameters:**
    - algorithm - The algorithm to be used for the encryption of this password.             Currently only "RSA" is supported.
    - publicKey - A reference to a trusted certificate entry containing             the public key in the keystore.

    **Returns:**
    - the base64-encoded representation of the password.

    **Deprecated:**
:::warning
Use [Cipher](dw.crypto.Cipher.md) to encrypt data as needed.
:::

---

### getID()
- getID(): [String](TopLevel.String.md)
  - : Returns the unique Credential ID.

    **Returns:**
    - unique Credential ID.


---

### getPassword()
- getPassword(): [String](TopLevel.String.md)
  - : Returns the Password in plain text.

    **Returns:**
    - Password.


---

### getURL()
- getURL(): [String](TopLevel.String.md)
  - : Return the URL.

    **Returns:**
    - URL.


---

### getUser()
- getUser(): [String](TopLevel.String.md)
  - : Returns the User ID.

    **Returns:**
    - User ID.


---

<!-- prettier-ignore-end -->
