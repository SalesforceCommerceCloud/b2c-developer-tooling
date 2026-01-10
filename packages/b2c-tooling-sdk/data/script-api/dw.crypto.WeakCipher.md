<!-- prettier-ignore-start -->
# Class WeakCipher

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.crypto.WeakCipher](dw.crypto.WeakCipher.md)

This API provides access to Deprecated algorithms.


See [Cipher](dw.crypto.Cipher.md) for full documentation. WeakCipher is simply a drop-in replacement that **only** supports
deprecated algorithms and key lengths. This is helpful when you need to deal with weak algorithms for backward
compatibility purposes, but Cipher should always be used for new development and for anything intended to be secure.


**Note:** this class handles sensitive security-related data. Pay special attention to PCI DSS v3 requirements 2,
4, and 12.



## Constant Summary

| Constant | Description |
| --- | --- |
| [CHAR_ENCODING](#char_encoding): [String](TopLevel.String.md) = "UTF8" | Strings containing keys, plain texts, cipher texts etc. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [WeakCipher](#weakcipher)() |  |

## Method Summary

| Method | Description |
| --- | --- |
| [decryptBytes](dw.crypto.WeakCipher.md#decryptbytesbytes-keyref-string-string-number---variant-1)([Bytes](dw.util.Bytes.md), [KeyRef](dw.crypto.KeyRef.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Alternative method to [decryptBytes(Bytes, String, String, String, Number)](dw.crypto.WeakCipher.md#decryptbytesbytes-string-string-string-number---variant-1), which allows to use a key in  the keystore for the decryption. |
| [decryptBytes](dw.crypto.WeakCipher.md#decryptbytesbytes-string-string-string-number---variant-1)([Bytes](dw.util.Bytes.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Lower-level decryption API. |
| [decryptBytes](dw.crypto.WeakCipher.md#decryptbytesbytes-keyref-string-string-number---variant-2)([Bytes](dw.util.Bytes.md), [KeyRef](dw.crypto.KeyRef.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Alternative method to [decryptBytes(Bytes, String, String, String, Number)](dw.crypto.WeakCipher.md#decryptbytesbytes-string-string-string-number---variant-2), which allows to use a key in  the keystore for the decryption. |
| [decryptBytes](dw.crypto.WeakCipher.md#decryptbytesbytes-string-string-string-number---variant-2)([Bytes](dw.util.Bytes.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Lower-level decryption API. |
| [decryptBytes](dw.crypto.WeakCipher.md#decryptbytesbytes-keyref-string-string-number---variant-3)([Bytes](dw.util.Bytes.md), [KeyRef](dw.crypto.KeyRef.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Alternative method to [decryptBytes(Bytes, String, String, String, Number)](dw.crypto.WeakCipher.md#decryptbytesbytes-string-string-string-number---variant-3), which allows to use a key in  the keystore for the decryption. |
| [decryptBytes](dw.crypto.WeakCipher.md#decryptbytesbytes-string-string-string-number---variant-3)([Bytes](dw.util.Bytes.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Lower-level decryption API. |
| [decrypt](dw.crypto.WeakCipher.md#decryptstring-keyref-string-string-number---variant-1)([String](TopLevel.String.md), [KeyRef](dw.crypto.KeyRef.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Alternative method to [decrypt(String, String, String, String, Number)](dw.crypto.WeakCipher.md#decryptstring-string-string-string-number---variant-1), which allows using a key in the  keystore for the decryption. |
| [decrypt](dw.crypto.WeakCipher.md#decryptstring-string-string-string-number---variant-1)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Decrypts the message using the given parameters. |
| [decrypt](dw.crypto.WeakCipher.md#decryptstring-keyref-string-string-number---variant-2)([String](TopLevel.String.md), [KeyRef](dw.crypto.KeyRef.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Alternative method to [decrypt(String, String, String, String, Number)](dw.crypto.WeakCipher.md#decryptstring-string-string-string-number---variant-2), which allows using a key in the  keystore for the decryption. |
| [decrypt](dw.crypto.WeakCipher.md#decryptstring-string-string-string-number---variant-2)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Decrypts the message using the given parameters. |
| [decrypt](dw.crypto.WeakCipher.md#decryptstring-keyref-string-string-number---variant-3)([String](TopLevel.String.md), [KeyRef](dw.crypto.KeyRef.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Alternative method to [decrypt(String, String, String, String, Number)](dw.crypto.WeakCipher.md#decryptstring-string-string-string-number---variant-3), which allows using a key in the  keystore for the decryption. |
| [decrypt](dw.crypto.WeakCipher.md#decryptstring-string-string-string-number---variant-3)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Decrypts the message using the given parameters. |
| [encryptBytes](dw.crypto.WeakCipher.md#encryptbytesbytes-certificateref-string-string-number---variant-1)([Bytes](dw.util.Bytes.md), [CertificateRef](dw.crypto.CertificateRef.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Alternative method to [encryptBytes(Bytes, String, String, String, Number)](dw.crypto.WeakCipher.md#encryptbytesbytes-string-string-string-number---variant-1), which allows  to use a key in the keystore for the encryption. |
| [encryptBytes](dw.crypto.WeakCipher.md#encryptbytesbytes-string-string-string-number---variant-1)([Bytes](dw.util.Bytes.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Lower-level encryption API. |
| [encryptBytes](dw.crypto.WeakCipher.md#encryptbytesbytes-certificateref-string-string-number---variant-2)([Bytes](dw.util.Bytes.md), [CertificateRef](dw.crypto.CertificateRef.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Alternative method to [encryptBytes(Bytes, String, String, String, Number)](dw.crypto.WeakCipher.md#encryptbytesbytes-string-string-string-number---variant-2), which allows  to use a key in the keystore for the encryption. |
| [encryptBytes](dw.crypto.WeakCipher.md#encryptbytesbytes-string-string-string-number---variant-2)([Bytes](dw.util.Bytes.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Lower-level encryption API. |
| [encryptBytes](dw.crypto.WeakCipher.md#encryptbytesbytes-certificateref-string-string-number---variant-3)([Bytes](dw.util.Bytes.md), [CertificateRef](dw.crypto.CertificateRef.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Alternative method to [encryptBytes(Bytes, String, String, String, Number)](dw.crypto.WeakCipher.md#encryptbytesbytes-string-string-string-number---variant-3), which allows  to use a key in the keystore for the encryption. |
| [encryptBytes](dw.crypto.WeakCipher.md#encryptbytesbytes-string-string-string-number---variant-3)([Bytes](dw.util.Bytes.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Lower-level encryption API. |
| [encrypt](dw.crypto.WeakCipher.md#encryptstring-certificateref-string-string-number---variant-1)([String](TopLevel.String.md), [CertificateRef](dw.crypto.CertificateRef.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Encrypt the passed message by using the specified key and applying the  transformations described by the specified parameters. |
| [encrypt](dw.crypto.WeakCipher.md#encryptstring-string-string-string-number---variant-1)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Encrypt the passed message by using the specified key and applying the  transformations described by the specified parameters. |
| [encrypt](dw.crypto.WeakCipher.md#encryptstring-certificateref-string-string-number---variant-2)([String](TopLevel.String.md), [CertificateRef](dw.crypto.CertificateRef.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Encrypt the passed message by using the specified key and applying the  transformations described by the specified parameters. |
| [encrypt](dw.crypto.WeakCipher.md#encryptstring-string-string-string-number---variant-2)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Encrypt the passed message by using the specified key and applying the  transformations described by the specified parameters. |
| [encrypt](dw.crypto.WeakCipher.md#encryptstring-certificateref-string-string-number---variant-3)([String](TopLevel.String.md), [CertificateRef](dw.crypto.CertificateRef.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Encrypt the passed message by using the specified key and applying the  transformations described by the specified parameters. |
| [encrypt](dw.crypto.WeakCipher.md#encryptstring-string-string-string-number---variant-3)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Encrypt the passed message by using the specified key and applying the  transformations described by the specified parameters. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### CHAR_ENCODING

- CHAR_ENCODING: [String](TopLevel.String.md) = "UTF8"
  - : Strings containing keys, plain texts, cipher texts etc. are internally
      converted into byte arrays using this encoding (currently UTF8).



---

## Constructor Details

### WeakCipher()
- WeakCipher()
  - : 


---

## Method Details

### decryptBytes(Bytes, KeyRef, String, String, Number) - Variant 1
- decryptBytes(encryptedBytes: [Bytes](dw.util.Bytes.md), privateKey: [KeyRef](dw.crypto.KeyRef.md), transformation: [String](TopLevel.String.md), saltOrIV: [String](TopLevel.String.md), iterations: [Number](TopLevel.Number.md)): [Bytes](dw.util.Bytes.md)
  - : Alternative method to [decryptBytes(Bytes, String, String, String, Number)](dw.crypto.WeakCipher.md#decryptbytesbytes-string-string-string-number---variant-1), which allows to use a key in
      the keystore for the decryption. See [Cipher.decryptBytes(Bytes, KeyRef, String, String, Number)](dw.crypto.Cipher.md#decryptbytesbytes-keyref-string-string-number---variant-1) for full
      documentation.


    **Parameters:**
    - encryptedBytes - The bytes to decrypt.
    - privateKey - A reference to a private key in the key store.
    - transformation - The transformation used to originally encrypt.
    - saltOrIV - the salt or IV to use.
    - iterations - the iterations to use.

    **Returns:**
    - The decrypted bytes.

    **API Version:**
:::note
No longer available as of version 15.5.
Under some conditions this method allowed a non-Base64 encrypted value for the salt parameter.
:::

---

### decryptBytes(Bytes, String, String, String, Number) - Variant 1
- decryptBytes(encryptedBytes: [Bytes](dw.util.Bytes.md), key: [String](TopLevel.String.md), transformation: [String](TopLevel.String.md), saltOrIV: [String](TopLevel.String.md), iterations: [Number](TopLevel.Number.md)): [Bytes](dw.util.Bytes.md)
  - : Lower-level decryption API. Decrypts the passed bytes using the specified
      key and applying the transformations described by the specified
      parameters. See [Cipher.decryptBytes(Bytes, String, String, String, Number)](dw.crypto.Cipher.md#decryptbytesbytes-string-string-string-number---variant-1) for full
      documentation.


    **Parameters:**
    - encryptedBytes - The bytes to decrypt.
    - key - The key to use for decryption.
    - transformation - The transformation used to originally encrypt.
    - saltOrIV - the salt or IV to use.
    - iterations - the iterations to use.

    **Returns:**
    - The decrypted bytes.

    **See Also:**
    - [decrypt(String, String, String, String, Number)](dw.crypto.WeakCipher.md#decryptstring-string-string-string-number---variant-1)

    **API Version:**
:::note
No longer available as of version 15.5.
Under some conditions this method allowed a non-Base64 encrypted value for the salt parameter.
:::

---

### decryptBytes(Bytes, KeyRef, String, String, Number) - Variant 2
- decryptBytes(encryptedBytes: [Bytes](dw.util.Bytes.md), privateKey: [KeyRef](dw.crypto.KeyRef.md), transformation: [String](TopLevel.String.md), saltOrIV: [String](TopLevel.String.md), iterations: [Number](TopLevel.Number.md)): [Bytes](dw.util.Bytes.md)
  - : Alternative method to [decryptBytes(Bytes, String, String, String, Number)](dw.crypto.WeakCipher.md#decryptbytesbytes-string-string-string-number---variant-2), which allows to use a key in
      the keystore for the decryption. See [Cipher.decryptBytes(Bytes, KeyRef, String, String, Number)](dw.crypto.Cipher.md#decryptbytesbytes-keyref-string-string-number---variant-2) for full
      documentation.


    **Parameters:**
    - encryptedBytes - The bytes to decrypt.
    - privateKey - A reference to a private key in the key store.
    - transformation - The transformation used to originally encrypt.
    - saltOrIV - the salt or IV to use.
    - iterations - the iterations to use.

    **Returns:**
    - The decrypted bytes.

    **API Version:**
:::note
Available from version 15.5.
No longer available as of version 16.2.
Requires Base64-encryption for the salt parameter.
:::

---

### decryptBytes(Bytes, String, String, String, Number) - Variant 2
- decryptBytes(encryptedBytes: [Bytes](dw.util.Bytes.md), key: [String](TopLevel.String.md), transformation: [String](TopLevel.String.md), saltOrIV: [String](TopLevel.String.md), iterations: [Number](TopLevel.Number.md)): [Bytes](dw.util.Bytes.md)
  - : Lower-level decryption API. Decrypts the passed bytes using the specified
      key and applying the transformations described by the specified
      parameters. See [Cipher.decryptBytes(Bytes, String, String, String, Number)](dw.crypto.Cipher.md#decryptbytesbytes-string-string-string-number---variant-2) for full
      documentation.


    **Parameters:**
    - encryptedBytes - The bytes to decrypt.
    - key - The key to use for decryption.
    - transformation - The transformation used to originally encrypt.
    - saltOrIV - the salt or IV to use.
    - iterations - the iterations to use.

    **Returns:**
    - The decrypted bytes.

    **See Also:**
    - [decrypt(String, String, String, String, Number)](dw.crypto.WeakCipher.md#decryptstring-string-string-string-number---variant-2)

    **API Version:**
:::note
Available from version 15.5.
No longer available as of version 16.2.
Requires Base64-encryption for the salt parameter.
:::

---

### decryptBytes(Bytes, KeyRef, String, String, Number) - Variant 3
- decryptBytes(encryptedBytes: [Bytes](dw.util.Bytes.md), privateKey: [KeyRef](dw.crypto.KeyRef.md), transformation: [String](TopLevel.String.md), saltOrIV: [String](TopLevel.String.md), iterations: [Number](TopLevel.Number.md)): [Bytes](dw.util.Bytes.md)
  - : Alternative method to [decryptBytes(Bytes, String, String, String, Number)](dw.crypto.WeakCipher.md#decryptbytesbytes-string-string-string-number---variant-3), which allows to use a key in
      the keystore for the decryption. See [Cipher.decryptBytes(Bytes, KeyRef, String, String, Number)](dw.crypto.Cipher.md#decryptbytesbytes-keyref-string-string-number---variant-3) for full
      documentation.


    **Parameters:**
    - encryptedBytes - The bytes to decrypt.
    - privateKey - A reference to a private key in the key store.
    - transformation - The transformation used to originally encrypt.
    - saltOrIV - the salt or IV to use.
    - iterations - the iterations to use.

    **Returns:**
    - The decrypted bytes.

    **API Version:**
:::note
Available from version 16.2.
Does not use a default initialization vector.
:::

---

### decryptBytes(Bytes, String, String, String, Number) - Variant 3
- decryptBytes(encryptedBytes: [Bytes](dw.util.Bytes.md), key: [String](TopLevel.String.md), transformation: [String](TopLevel.String.md), saltOrIV: [String](TopLevel.String.md), iterations: [Number](TopLevel.Number.md)): [Bytes](dw.util.Bytes.md)
  - : Lower-level decryption API. Decrypts the passed bytes using the specified
      key and applying the transformations described by the specified
      parameters. See [Cipher.decryptBytes(Bytes, String, String, String, Number)](dw.crypto.Cipher.md#decryptbytesbytes-string-string-string-number---variant-3) for full
      documentation.


    **Parameters:**
    - encryptedBytes - The bytes to decrypt.
    - key - The key to use for decryption.
    - transformation - The transformation used to originally encrypt.
    - saltOrIV - the salt or IV to use.
    - iterations - the iterations to use.

    **Returns:**
    - The decrypted bytes.

    **See Also:**
    - [decrypt(String, String, String, String, Number)](dw.crypto.WeakCipher.md#decryptstring-string-string-string-number---variant-3)

    **API Version:**
:::note
Available from version 16.2.
Does not use a default initialization vector.
:::

---

### decrypt(String, KeyRef, String, String, Number) - Variant 1
- decrypt(base64Msg: [String](TopLevel.String.md), privateKey: [KeyRef](dw.crypto.KeyRef.md), transformation: [String](TopLevel.String.md), saltOrIV: [String](TopLevel.String.md), iterations: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Alternative method to [decrypt(String, String, String, String, Number)](dw.crypto.WeakCipher.md#decryptstring-string-string-string-number---variant-1), which allows using a key in the
      keystore for the decryption. See [Cipher.decrypt(String, KeyRef, String, String, Number)](dw.crypto.Cipher.md#decryptstring-keyref-string-string-number---variant-1) for full
      documentation.


    **Parameters:**
    - base64Msg - the base64 encoded data to decrypt
    - privateKey - A reference to a private key in the key store.
    - transformation - Transformation in _"algorithm/mode/padding"_ format.
    - saltOrIV - Initialization value appropriate for the algorithm.
    - iterations - The number of passes to make when turning a passphrase into a key, if applicable

    **Returns:**
    - the original plaintext message.

    **API Version:**
:::note
No longer available as of version 15.5.
Under some conditions this method allowed a non-Base64 encrypted value for the salt parameter.
:::

---

### decrypt(String, String, String, String, Number) - Variant 1
- decrypt(base64Msg: [String](TopLevel.String.md), key: [String](TopLevel.String.md), transformation: [String](TopLevel.String.md), saltOrIV: [String](TopLevel.String.md), iterations: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Decrypts the message using the given parameters. See
      [Cipher.decrypt(String, String, String, String, Number)](dw.crypto.Cipher.md#decryptstring-string-string-string-number---variant-1) for full documentation.


    **Parameters:**
    - base64Msg - the base64 encoded data to decrypt
    - key - The decryption key
    - transformation - Transformation in _"algorithm/mode/padding"_ format.
    - saltOrIV - Initialization value appropriate for the algorithm.
    - iterations - The number of passes to make when turning a passphrase into a key, if applicable

    **Returns:**
    - the original plaintext message.

    **API Version:**
:::note
No longer available as of version 15.5.
Under some conditions this method allowed a non-Base64 encrypted value for the salt parameter.
:::

---

### decrypt(String, KeyRef, String, String, Number) - Variant 2
- decrypt(base64Msg: [String](TopLevel.String.md), privateKey: [KeyRef](dw.crypto.KeyRef.md), transformation: [String](TopLevel.String.md), saltOrIV: [String](TopLevel.String.md), iterations: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Alternative method to [decrypt(String, String, String, String, Number)](dw.crypto.WeakCipher.md#decryptstring-string-string-string-number---variant-2), which allows using a key in the
      keystore for the decryption. See [Cipher.decrypt(String, KeyRef, String, String, Number)](dw.crypto.Cipher.md#decryptstring-keyref-string-string-number---variant-2) for full
      documentation.


    **Parameters:**
    - base64Msg - the base64 encoded data to decrypt
    - privateKey - A reference to a private key in the key store.
    - transformation - Transformation in _"algorithm/mode/padding"_ format.
    - saltOrIV - Initialization value appropriate for the algorithm.
    - iterations - The number of passes to make when turning a passphrase into a key, if applicable

    **Returns:**
    - the original plaintext message.

    **API Version:**
:::note
Available from version 15.5.
No longer available as of version 16.2.
Requires Base64-encryption for the salt parameter.
:::

---

### decrypt(String, String, String, String, Number) - Variant 2
- decrypt(base64Msg: [String](TopLevel.String.md), key: [String](TopLevel.String.md), transformation: [String](TopLevel.String.md), saltOrIV: [String](TopLevel.String.md), iterations: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Decrypts the message using the given parameters. See
      [Cipher.decrypt(String, String, String, String, Number)](dw.crypto.Cipher.md#decryptstring-string-string-string-number---variant-2) for full documentation.


    **Parameters:**
    - base64Msg - the base64 encoded data to decrypt
    - key - The decryption key
    - transformation - Transformation in _"algorithm/mode/padding"_ format.
    - saltOrIV - Initialization value appropriate for the algorithm.
    - iterations - The number of passes to make when turning a passphrase into a key, if applicable

    **Returns:**
    - the original plaintext message.

    **API Version:**
:::note
Available from version 15.5.
No longer available as of version 16.2.
Requires Base64-encryption for the salt parameter.
:::

---

### decrypt(String, KeyRef, String, String, Number) - Variant 3
- decrypt(base64Msg: [String](TopLevel.String.md), privateKey: [KeyRef](dw.crypto.KeyRef.md), transformation: [String](TopLevel.String.md), saltOrIV: [String](TopLevel.String.md), iterations: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Alternative method to [decrypt(String, String, String, String, Number)](dw.crypto.WeakCipher.md#decryptstring-string-string-string-number---variant-3), which allows using a key in the
      keystore for the decryption. See [Cipher.decrypt(String, KeyRef, String, String, Number)](dw.crypto.Cipher.md#decryptstring-keyref-string-string-number---variant-3) for full
      documentation.


    **Parameters:**
    - base64Msg - the base64 encoded data to decrypt
    - privateKey - A reference to a private key in the key store.
    - transformation - Transformation in _"algorithm/mode/padding"_ format.
    - saltOrIV - Initialization value appropriate for the algorithm.
    - iterations - The number of passes to make when turning a passphrase into a key, if applicable

    **Returns:**
    - the original plaintext message.

    **API Version:**
:::note
Available from version 16.2.
Does not use a default initialization vector.
:::

---

### decrypt(String, String, String, String, Number) - Variant 3
- decrypt(base64Msg: [String](TopLevel.String.md), key: [String](TopLevel.String.md), transformation: [String](TopLevel.String.md), saltOrIV: [String](TopLevel.String.md), iterations: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Decrypts the message using the given parameters. See
      [Cipher.decrypt(String, String, String, String, Number)](dw.crypto.Cipher.md#decryptstring-string-string-string-number---variant-3) for full documentation.


    **Parameters:**
    - base64Msg - the base64 encoded data to decrypt
    - key - The decryption key
    - transformation - Transformation in _"algorithm/mode/padding"_ format.
    - saltOrIV - Initialization value appropriate for the algorithm.
    - iterations - The number of passes to make when turning a passphrase into a key, if applicable

    **Returns:**
    - the original plaintext message.

    **API Version:**
:::note
Available from version 16.2.
Does not use a default initialization vector.
:::

---

### encryptBytes(Bytes, CertificateRef, String, String, Number) - Variant 1
- encryptBytes(messageBytes: [Bytes](dw.util.Bytes.md), publicKey: [CertificateRef](dw.crypto.CertificateRef.md), transformation: [String](TopLevel.String.md), saltOrIV: [String](TopLevel.String.md), iterations: [Number](TopLevel.Number.md)): [Bytes](dw.util.Bytes.md)
  - : Alternative method to [encryptBytes(Bytes, String, String, String, Number)](dw.crypto.WeakCipher.md#encryptbytesbytes-string-string-string-number---variant-1), which allows
      to use a key in the keystore for the encryption. See [Cipher.encryptBytes(Bytes, CertificateRef, String, String, Number)](dw.crypto.Cipher.md#encryptbytesbytes-certificateref-string-string-number---variant-1) for full documentation.


    **Parameters:**
    - messageBytes - The bytes to encrypt.
    - publicKey - A reference to a public key
    - transformation - Transformation in _"algorithm/mode/padding"_ format.
    - saltOrIV - Initialization value appropriate for the algorithm.
    - iterations - The number of passes to make when turning a passphrase into a key.

    **Returns:**
    - the encrypted bytes.

    **See Also:**
    - [encrypt(String, CertificateRef, String, String, Number)](dw.crypto.WeakCipher.md#encryptstring-certificateref-string-string-number---variant-1)

    **API Version:**
:::note
No longer available as of version 15.5.
Under some conditions this method allowed a non-Base64 encrypted value for the salt parameter.
:::

---

### encryptBytes(Bytes, String, String, String, Number) - Variant 1
- encryptBytes(messageBytes: [Bytes](dw.util.Bytes.md), key: [String](TopLevel.String.md), transformation: [String](TopLevel.String.md), saltOrIV: [String](TopLevel.String.md), iterations: [Number](TopLevel.Number.md)): [Bytes](dw.util.Bytes.md)
  - : Lower-level encryption API. Encrypts the passed bytes by using the specified key and applying the transformations
      described by the specified parameters. See [Cipher.encryptBytes(Bytes, String, String, String, Number)](dw.crypto.Cipher.md#encryptbytesbytes-string-string-string-number---variant-1)
      for full documentation.


    **Parameters:**
    - messageBytes - The bytes to encrypt.
    - key - The key to use for encryption.
    - transformation - Transformation in _"algorithm/mode/padding"_ format.
    - saltOrIV - Initialization value appropriate for the algorithm.
    - iterations - The number of passes to make when turning a passphrase into a key.

    **Returns:**
    - the encrypted bytes.

    **See Also:**
    - [encrypt(String, String, String, String, Number)](dw.crypto.WeakCipher.md#encryptstring-string-string-string-number---variant-1)

    **API Version:**
:::note
No longer available as of version 15.5.
Under some conditions this method allowed a non-Base64 encrypted value for the salt parameter.
:::

---

### encryptBytes(Bytes, CertificateRef, String, String, Number) - Variant 2
- encryptBytes(messageBytes: [Bytes](dw.util.Bytes.md), publicKey: [CertificateRef](dw.crypto.CertificateRef.md), transformation: [String](TopLevel.String.md), saltOrIV: [String](TopLevel.String.md), iterations: [Number](TopLevel.Number.md)): [Bytes](dw.util.Bytes.md)
  - : Alternative method to [encryptBytes(Bytes, String, String, String, Number)](dw.crypto.WeakCipher.md#encryptbytesbytes-string-string-string-number---variant-2), which allows
      to use a key in the keystore for the encryption. See [Cipher.encryptBytes(Bytes, CertificateRef, String, String, Number)](dw.crypto.Cipher.md#encryptbytesbytes-certificateref-string-string-number---variant-2) for full documentation.


    **Parameters:**
    - messageBytes - The bytes to encrypt.
    - publicKey - A reference to a public key.
    - transformation - Transformation in _"algorithm/mode/padding"_ format.
    - saltOrIV - Initialization value appropriate for the algorithm.
    - iterations - The number of passes to make when turning a passphrase into a key.

    **Returns:**
    - the encrypted bytes.

    **See Also:**
    - [encrypt(String, CertificateRef, String, String, Number)](dw.crypto.WeakCipher.md#encryptstring-certificateref-string-string-number---variant-2)

    **API Version:**
:::note
Available from version 15.5.
No longer available as of version 16.2.
Requires Base64-encryption for the salt parameter.
:::

---

### encryptBytes(Bytes, String, String, String, Number) - Variant 2
- encryptBytes(messageBytes: [Bytes](dw.util.Bytes.md), key: [String](TopLevel.String.md), transformation: [String](TopLevel.String.md), saltOrIV: [String](TopLevel.String.md), iterations: [Number](TopLevel.Number.md)): [Bytes](dw.util.Bytes.md)
  - : Lower-level encryption API. Encrypts the passed bytes by using the specified key and applying the transformations
      described by the specified parameters. See [Cipher.encryptBytes(Bytes, String, String, String, Number)](dw.crypto.Cipher.md#encryptbytesbytes-string-string-string-number---variant-2)
      for full documentation.


    **Parameters:**
    - messageBytes - The bytes to encrypt.
    - key - The key to use for encryption.
    - transformation - Transformation in _"algorithm/mode/padding"_ format.
    - saltOrIV - Initialization value appropriate for the algorithm.
    - iterations - The number of passes to make when turning a passphrase into a key.

    **Returns:**
    - the encrypted bytes.

    **See Also:**
    - [encrypt(String, String, String, String, Number)](dw.crypto.WeakCipher.md#encryptstring-string-string-string-number---variant-2)

    **API Version:**
:::note
Available from version 15.5.
No longer available as of version 16.2.
Requires Base64-encryption for the salt parameter.
:::

---

### encryptBytes(Bytes, CertificateRef, String, String, Number) - Variant 3
- encryptBytes(messageBytes: [Bytes](dw.util.Bytes.md), publicKey: [CertificateRef](dw.crypto.CertificateRef.md), transformation: [String](TopLevel.String.md), saltOrIV: [String](TopLevel.String.md), iterations: [Number](TopLevel.Number.md)): [Bytes](dw.util.Bytes.md)
  - : Alternative method to [encryptBytes(Bytes, String, String, String, Number)](dw.crypto.WeakCipher.md#encryptbytesbytes-string-string-string-number---variant-3), which allows
      to use a key in the keystore for the encryption. See [Cipher.encryptBytes(Bytes, CertificateRef, String, String, Number)](dw.crypto.Cipher.md#encryptbytesbytes-certificateref-string-string-number---variant-3) for full documentation.


    **Parameters:**
    - messageBytes - The bytes to encrypt.
    - publicKey - A reference to a public key.
    - transformation - Transformation in _"algorithm/mode/padding"_ format.
    - saltOrIV - Initialization value appropriate for the algorithm.
    - iterations - The number of passes to make when turning a passphrase into a key.

    **Returns:**
    - the encrypted bytes.

    **See Also:**
    - [encrypt(String, CertificateRef, String, String, Number)](dw.crypto.WeakCipher.md#encryptstring-certificateref-string-string-number---variant-3)

    **API Version:**
:::note
Available from version 16.2.
Does not use a default initialization vector.
:::

---

### encryptBytes(Bytes, String, String, String, Number) - Variant 3
- encryptBytes(messageBytes: [Bytes](dw.util.Bytes.md), key: [String](TopLevel.String.md), transformation: [String](TopLevel.String.md), saltOrIV: [String](TopLevel.String.md), iterations: [Number](TopLevel.Number.md)): [Bytes](dw.util.Bytes.md)
  - : Lower-level encryption API. Encrypts the passed bytes by using the specified key and applying the transformations
      described by the specified parameters. See [Cipher.encryptBytes(Bytes, String, String, String, Number)](dw.crypto.Cipher.md#encryptbytesbytes-string-string-string-number---variant-3)
      for full documentation.


    **Parameters:**
    - messageBytes - The bytes to encrypt.
    - key - The key to use for encryption.
    - transformation - Transformation in _"algorithm/mode/padding"_ format.
    - saltOrIV - Initialization value appropriate for the algorithm.
    - iterations - The number of passes to make when turning a passphrase into a key.

    **Returns:**
    - the encrypted bytes.

    **See Also:**
    - [encrypt(String, String, String, String, Number)](dw.crypto.WeakCipher.md#encryptstring-string-string-string-number---variant-3)

    **API Version:**
:::note
Available from version 16.2.
Does not use a default initialization vector.
:::

---

### encrypt(String, CertificateRef, String, String, Number) - Variant 1
- encrypt(message: [String](TopLevel.String.md), publicKey: [CertificateRef](dw.crypto.CertificateRef.md), transformation: [String](TopLevel.String.md), saltOrIV: [String](TopLevel.String.md), iterations: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Encrypt the passed message by using the specified key and applying the
      transformations described by the specified parameters.
      
      See [Cipher.encrypt(String, CertificateRef, String, String, Number)](dw.crypto.Cipher.md#encryptstring-certificateref-string-string-number---variant-1) for full documentation.


    **Parameters:**
    - message - Message to encrypt (this will be converted to UTF-8 first)
    - publicKey - A reference to a public key
    - transformation - Transformation in _"algorithm/mode/padding"_ format
    - saltOrIV - Initialization value appropriate for the algorithm
    - iterations - The number of passes to make when turning a passphrase into a key, if applicable

    **Returns:**
    - Base64-encoded encrypted data

    **API Version:**
:::note
No longer available as of version 15.5.
Under some conditions this method allowed a non-Base64 encrypted value for the salt parameter.
:::

---

### encrypt(String, String, String, String, Number) - Variant 1
- encrypt(message: [String](TopLevel.String.md), key: [String](TopLevel.String.md), transformation: [String](TopLevel.String.md), saltOrIV: [String](TopLevel.String.md), iterations: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Encrypt the passed message by using the specified key and applying the
      transformations described by the specified parameters.
      
      See [Cipher.encrypt(String, String, String, String, Number)](dw.crypto.Cipher.md#encryptstring-string-string-string-number---variant-1) for full documentation.


    **Parameters:**
    - message - Message to encrypt (this will be converted to UTF-8 first)
    - key - Key
    - transformation - Transformation in _"algorithm/mode/padding"_ format
    - saltOrIV - Initialization value appropriate for the algorithm
    - iterations - The number of passes to make when turning a passphrase into a key, if applicable

    **Returns:**
    - Base64-encoded encrypted data

    **API Version:**
:::note
No longer available as of version 15.5.
Under some conditions this method allowed a non-Base64 encrypted value for the salt parameter.
:::

---

### encrypt(String, CertificateRef, String, String, Number) - Variant 2
- encrypt(message: [String](TopLevel.String.md), publicKey: [CertificateRef](dw.crypto.CertificateRef.md), transformation: [String](TopLevel.String.md), saltOrIV: [String](TopLevel.String.md), iterations: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Encrypt the passed message by using the specified key and applying the
      transformations described by the specified parameters.
      
      See [Cipher.encrypt(String, CertificateRef, String, String, Number)](dw.crypto.Cipher.md#encryptstring-certificateref-string-string-number---variant-2) for full documentation.


    **Parameters:**
    - message - Message to encrypt (this will be converted to UTF-8 first)
    - publicKey - A reference to a public key
    - transformation - Transformation in _"algorithm/mode/padding"_ format
    - saltOrIV - Initialization value appropriate for the algorithm
    - iterations - The number of passes to make when turning a passphrase into a key, if applicable

    **Returns:**
    - Base64-encoded encrypted data

    **API Version:**
:::note
Available from version 15.5.
No longer available as of version 16.2.
Requires Base64-encryption for the salt parameter.
:::

---

### encrypt(String, String, String, String, Number) - Variant 2
- encrypt(message: [String](TopLevel.String.md), key: [String](TopLevel.String.md), transformation: [String](TopLevel.String.md), saltOrIV: [String](TopLevel.String.md), iterations: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Encrypt the passed message by using the specified key and applying the
      transformations described by the specified parameters.
      
      See [Cipher.encrypt(String, String, String, String, Number)](dw.crypto.Cipher.md#encryptstring-string-string-string-number---variant-2) for full documentation.


    **Parameters:**
    - message - Message to encrypt (this will be converted to UTF-8 first)
    - key - Key
    - transformation - Transformation in _"algorithm/mode/padding"_ format
    - saltOrIV - Initialization value appropriate for the algorithm
    - iterations - The number of passes to make when turning a passphrase into a key, if applicable

    **Returns:**
    - Base64-encoded encrypted data

    **API Version:**
:::note
Available from version 15.5.
No longer available as of version 16.2.
Requires Base64-encryption for the salt parameter.
:::

---

### encrypt(String, CertificateRef, String, String, Number) - Variant 3
- encrypt(message: [String](TopLevel.String.md), publicKey: [CertificateRef](dw.crypto.CertificateRef.md), transformation: [String](TopLevel.String.md), saltOrIV: [String](TopLevel.String.md), iterations: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Encrypt the passed message by using the specified key and applying the
      transformations described by the specified parameters.
      
      See [Cipher.encrypt(String, CertificateRef, String, String, Number)](dw.crypto.Cipher.md#encryptstring-certificateref-string-string-number---variant-3) for full documentation.


    **Parameters:**
    - message - Message to encrypt (this will be converted to UTF-8 first)
    - publicKey - A reference to a public key
    - transformation - Transformation in _"algorithm/mode/padding"_ format
    - saltOrIV - Initialization value appropriate for the algorithm
    - iterations - The number of passes to make when turning a passphrase into a key, if applicable

    **Returns:**
    - Base64-encoded encrypted data

    **API Version:**
:::note
Available from version 16.2.
Does not use a default initialization vector.
:::

---

### encrypt(String, String, String, String, Number) - Variant 3
- encrypt(message: [String](TopLevel.String.md), key: [String](TopLevel.String.md), transformation: [String](TopLevel.String.md), saltOrIV: [String](TopLevel.String.md), iterations: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Encrypt the passed message by using the specified key and applying the
      transformations described by the specified parameters.
      
      See [Cipher.encrypt(String, String, String, String, Number)](dw.crypto.Cipher.md#encryptstring-string-string-string-number---variant-3) for full documentation.


    **Parameters:**
    - message - Message to encrypt (this will be converted to UTF-8 first)
    - key - Key
    - transformation - Transformation in _"algorithm/mode/padding"_ format
    - saltOrIV - Initialization value appropriate for the algorithm
    - iterations - The number of passes to make when turning a passphrase into a key, if applicable

    **Returns:**
    - Base64-encoded encrypted data

    **API Version:**
:::note
Available from version 16.2.
Does not use a default initialization vector.
:::

---

<!-- prettier-ignore-end -->
