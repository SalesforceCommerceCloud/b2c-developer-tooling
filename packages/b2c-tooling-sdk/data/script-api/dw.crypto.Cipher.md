<!-- prettier-ignore-start -->
# Class Cipher

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.crypto.Cipher](dw.crypto.Cipher.md)

This class allows access to encryption services offered through the Java
Cryptography Architecture (JCA). At this time the implementation of the
encryption/decryption methods is based on the default JCE provider of the JDK.
See the Java documentation for a reference guide to the underlying security
provider and information about the Secure Sockets Extension. 

You can find a good overview of the essential purposes of cryptography and
some common implementations in the Wikipedia article on cryptography.
Also see the website of the National Institute of Standards and Technology.
The format of various files used to hold keys, certificate signing requests,
and the like, as well as some related algorithms, are defined in the PKCS series of
documents published by RSALabs (the research arm of RSA Security).

Many internet standards documenting security protocols and concepts are described
in documents originally described as "Request For Comment" and thus widely known
as RFCs. Many of them are available on the Internet FAQ Archives website.


dw.crypto.Cipher is intentionally an Adapter to the full cryptography power supplied
in the security provider implementation.


**Note:** this class handles sensitive security-related data.
Pay special attention to PCI DSS v3 requirements 2, 4, and 12.



## Constant Summary

| Constant | Description |
| --- | --- |
| [CHAR_ENCODING](#char_encoding): [String](TopLevel.String.md) = "UTF8" | Strings containing keys, plain texts, cipher texts etc. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [Cipher](#cipher)() |  |

## Method Summary

| Method | Description |
| --- | --- |
| [decryptBytes](dw.crypto.Cipher.md#decryptbytesbytes-keyref-string-string-number---variant-1)([Bytes](dw.util.Bytes.md), [KeyRef](dw.crypto.KeyRef.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Alternative method to [decryptBytes(Bytes, String, String, String, Number)](dw.crypto.Cipher.md#decryptbytesbytes-string-string-string-number---variant-1), which allows  to use a key in the keystore for the decryption. |
| [decryptBytes](dw.crypto.Cipher.md#decryptbytesbytes-string-string-string-number---variant-1)([Bytes](dw.util.Bytes.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Lower-level decryption API. |
| [decryptBytes](dw.crypto.Cipher.md#decryptbytesbytes-keyref-string-string-number---variant-2)([Bytes](dw.util.Bytes.md), [KeyRef](dw.crypto.KeyRef.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Alternative method to [decryptBytes(Bytes, String, String, String, Number)](dw.crypto.Cipher.md#decryptbytesbytes-string-string-string-number---variant-2), which allows  to use a key in the keystore for the decryption. |
| [decryptBytes](dw.crypto.Cipher.md#decryptbytesbytes-string-string-string-number---variant-2)([Bytes](dw.util.Bytes.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Lower-level decryption API. |
| [decryptBytes](dw.crypto.Cipher.md#decryptbytesbytes-keyref-string-string-number---variant-3)([Bytes](dw.util.Bytes.md), [KeyRef](dw.crypto.KeyRef.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Alternative method to [decryptBytes(Bytes, String, String, String, Number)](dw.crypto.Cipher.md#decryptbytesbytes-string-string-string-number---variant-3), which allows  to use a key in the keystore for the decryption. |
| [decryptBytes](dw.crypto.Cipher.md#decryptbytesbytes-string-string-string-number---variant-3)([Bytes](dw.util.Bytes.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Lower-level decryption API. |
| [decrypt](dw.crypto.Cipher.md#decryptstring-keyref-string-string-number---variant-1)([String](TopLevel.String.md), [KeyRef](dw.crypto.KeyRef.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Alternative method to [decrypt(String, String, String, String, Number)](dw.crypto.Cipher.md#decryptstring-string-string-string-number---variant-1), which allows  to use a key in the keystore for the decryption. |
| [decrypt](dw.crypto.Cipher.md#decryptstring-string-string-string-number---variant-1)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Decrypts the passed Base-64 encoded message using the passed key and  applying the transformations described by the passed parameters. |
| [decrypt](dw.crypto.Cipher.md#decryptstring-keyref-string-string-number---variant-2)([String](TopLevel.String.md), [KeyRef](dw.crypto.KeyRef.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Alternative method to [decrypt(String, String, String, String, Number)](dw.crypto.Cipher.md#decryptstring-string-string-string-number---variant-2), which allows  to use a key in the keystore for the decryption. |
| [decrypt](dw.crypto.Cipher.md#decryptstring-string-string-string-number---variant-2)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Decrypts the passed Base-64 encoded message using the passed key and  applying the transformations described by the passed parameters. |
| [decrypt](dw.crypto.Cipher.md#decryptstring-keyref-string-string-number---variant-3)([String](TopLevel.String.md), [KeyRef](dw.crypto.KeyRef.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Alternative method to [decrypt(String, String, String, String, Number)](dw.crypto.Cipher.md#decryptstring-string-string-string-number---variant-3), which allows  to use a key in the keystore for the decryption. |
| [decrypt](dw.crypto.Cipher.md#decryptstring-string-string-string-number---variant-3)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Decrypts the passed Base-64 encoded message using the passed key and  applying the transformations described by the passed parameters. |
| [encryptBytes](dw.crypto.Cipher.md#encryptbytesbytes-certificateref-string-string-number---variant-1)([Bytes](dw.util.Bytes.md), [CertificateRef](dw.crypto.CertificateRef.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Alternative method to [encryptBytes(Bytes, String, String, String, Number)](dw.crypto.Cipher.md#encryptbytesbytes-string-string-string-number---variant-1), which allows  to use a key in the keystore for the encryption. |
| [encryptBytes](dw.crypto.Cipher.md#encryptbytesbytes-string-string-string-number---variant-1)([Bytes](dw.util.Bytes.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Lower-level encryption API. |
| [encryptBytes](dw.crypto.Cipher.md#encryptbytesbytes-certificateref-string-string-number---variant-2)([Bytes](dw.util.Bytes.md), [CertificateRef](dw.crypto.CertificateRef.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Alternative method to [encryptBytes(Bytes, String, String, String, Number)](dw.crypto.Cipher.md#encryptbytesbytes-string-string-string-number---variant-2), which allows  to use a key in the keystore for the encryption. |
| [encryptBytes](dw.crypto.Cipher.md#encryptbytesbytes-string-string-string-number---variant-2)([Bytes](dw.util.Bytes.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Lower-level encryption API. |
| [encryptBytes](dw.crypto.Cipher.md#encryptbytesbytes-certificateref-string-string-number---variant-3)([Bytes](dw.util.Bytes.md), [CertificateRef](dw.crypto.CertificateRef.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Alternative method to [encryptBytes(Bytes, String, String, String, Number)](dw.crypto.Cipher.md#encryptbytesbytes-string-string-string-number---variant-3), which allows  to use a key in the keystore for the encryption. |
| [encryptBytes](dw.crypto.Cipher.md#encryptbytesbytes-string-string-string-number---variant-3)([Bytes](dw.util.Bytes.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Lower-level encryption API. |
| [encrypt](dw.crypto.Cipher.md#encryptstring-certificateref-string-string-number---variant-1)([String](TopLevel.String.md), [CertificateRef](dw.crypto.CertificateRef.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Alternative method to  [encrypt(String, String, String, String, Number)](dw.crypto.Cipher.md#encryptstring-string-string-string-number---variant-1), which allows you to  use a key in the keystore for encryption. |
| [encrypt](dw.crypto.Cipher.md#encryptstring-string-string-string-number---variant-1)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Encrypt the passed message by using the specified key and applying the  transformations described by the specified parameters. |
| [encrypt](dw.crypto.Cipher.md#encryptstring-certificateref-string-string-number---variant-2)([String](TopLevel.String.md), [CertificateRef](dw.crypto.CertificateRef.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Alternative method to  [encrypt(String, String, String, String, Number)](dw.crypto.Cipher.md#encryptstring-string-string-string-number---variant-2), which allows you to  use a key in the keystore for encryption. |
| [encrypt](dw.crypto.Cipher.md#encryptstring-string-string-string-number---variant-2)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Encrypt the passed message by using the specified key and applying the  transformations described by the specified parameters. |
| [encrypt](dw.crypto.Cipher.md#encryptstring-certificateref-string-string-number---variant-3)([String](TopLevel.String.md), [CertificateRef](dw.crypto.CertificateRef.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Alternative method to  [encrypt(String, String, String, String, Number)](dw.crypto.Cipher.md#encryptstring-string-string-string-number---variant-3), which allows you to  use a key in the keystore for encryption. |
| [encrypt](dw.crypto.Cipher.md#encryptstring-string-string-string-number---variant-3)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Encrypt the passed message by using the specified key and applying the  transformations described by the specified parameters. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### CHAR_ENCODING

- CHAR_ENCODING: [String](TopLevel.String.md) = "UTF8"
  - : Strings containing keys, plain texts, cipher texts etc. are internally
      converted into byte arrays using this encoding (currently UTF8).



---

## Constructor Details

### Cipher()
- Cipher()
  - : 


---

## Method Details

### decryptBytes(Bytes, KeyRef, String, String, Number) - Variant 1
- decryptBytes(encryptedBytes: [Bytes](dw.util.Bytes.md), privateKey: [KeyRef](dw.crypto.KeyRef.md), transformation: [String](TopLevel.String.md), saltOrIV: [String](TopLevel.String.md), iterations: [Number](TopLevel.Number.md)): [Bytes](dw.util.Bytes.md)
  - : Alternative method to [decryptBytes(Bytes, String, String, String, Number)](dw.crypto.Cipher.md#decryptbytesbytes-string-string-string-number---variant-1), which allows
      to use a key in the keystore for the decryption.


    **Parameters:**
    - encryptedBytes - (see [decryptBytes(Bytes, String, String, String, Number)](dw.crypto.Cipher.md#decryptbytesbytes-string-string-string-number---variant-1))
    - privateKey - A reference to a private key in the key store.
    - transformation - (see [decryptBytes(Bytes, String, String, String, Number)](dw.crypto.Cipher.md#decryptbytesbytes-string-string-string-number---variant-1))
    - saltOrIV - (see [decryptBytes(Bytes, String, String, String, Number)](dw.crypto.Cipher.md#decryptbytesbytes-string-string-string-number---variant-1))
    - iterations - (see [decryptBytes(Bytes, String, String, String, Number)](dw.crypto.Cipher.md#decryptbytesbytes-string-string-string-number---variant-1))

    **Returns:**
    - (see [decryptBytes(Bytes, String, String, String, Number)](dw.crypto.Cipher.md#decryptbytesbytes-string-string-string-number---variant-1))

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
      parameters.
      
      
      Typical usage:
      
      
      ```
      var base64Msg : String = "some_encoded_encrypted_message";
      var charset : String = "UTF8";  // or "windows-1252", etc.
      
      var encryptedBytes : Bytes = Encoding.fromBase64(base64Msg);
      var messageBytes : Bytes = Cipher.decryptBytes(encryptedBytes, key, transformation, salt, iterations);
      var message : String = messageBytes.toString(charset);
      ```


    **Parameters:**
    - encryptedBytes - The bytes to decrypt.
    - key - The key to use for decryption.
    - transformation - The transformation used to originally encrypt.
    - saltOrIV - the salt or IV to use.
    - iterations - the iterations to use.

    **Returns:**
    - The decrypted bytes.

    **See Also:**
    - [decrypt(String, String, String, String, Number)](dw.crypto.Cipher.md#decryptstring-string-string-string-number---variant-1)

    **API Version:**
:::note
No longer available as of version 15.5.
Under some conditions this method allowed a non-Base64 encrypted value for the salt parameter.
:::

---

### decryptBytes(Bytes, KeyRef, String, String, Number) - Variant 2
- decryptBytes(encryptedBytes: [Bytes](dw.util.Bytes.md), privateKey: [KeyRef](dw.crypto.KeyRef.md), transformation: [String](TopLevel.String.md), saltOrIV: [String](TopLevel.String.md), iterations: [Number](TopLevel.Number.md)): [Bytes](dw.util.Bytes.md)
  - : Alternative method to [decryptBytes(Bytes, String, String, String, Number)](dw.crypto.Cipher.md#decryptbytesbytes-string-string-string-number---variant-2), which allows
      to use a key in the keystore for the decryption.


    **Parameters:**
    - encryptedBytes - (see [decryptBytes(Bytes, String, String, String, Number)](dw.crypto.Cipher.md#decryptbytesbytes-string-string-string-number---variant-2))
    - privateKey - A reference to a private key in the key store.
    - transformation - (see [decryptBytes(Bytes, String, String, String, Number)](dw.crypto.Cipher.md#decryptbytesbytes-string-string-string-number---variant-2))
    - saltOrIV - (see [decryptBytes(Bytes, String, String, String, Number)](dw.crypto.Cipher.md#decryptbytesbytes-string-string-string-number---variant-2))
    - iterations - (see [decryptBytes(Bytes, String, String, String, Number)](dw.crypto.Cipher.md#decryptbytesbytes-string-string-string-number---variant-2))

    **Returns:**
    - (see [decryptBytes(Bytes, String, String, String, Number)](dw.crypto.Cipher.md#decryptbytesbytes-string-string-string-number---variant-2))

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
      parameters.
      
      
      Typical usage:
      
      
      ```
      var base64Msg : String = "some_encoded_encrypted_message";
      var charset : String = "UTF8";  // or "windows-1252", etc.
      
      var encryptedBytes : Bytes = Encoding.fromBase64(base64Msg);
      var messageBytes : Bytes = Cipher.decryptBytes(encryptedBytes, key, transformation, salt, iterations);
      var message : String = messageBytes.toString(charset);
      ```


    **Parameters:**
    - encryptedBytes - The bytes to decrypt.
    - key - The key to use for decryption.
    - transformation - The transformation used to originally encrypt.
    - saltOrIV - the salt or IV to use.
    - iterations - the iterations to use.

    **Returns:**
    - The decrypted bytes.

    **See Also:**
    - [decrypt(String, String, String, String, Number)](dw.crypto.Cipher.md#decryptstring-string-string-string-number---variant-2)

    **API Version:**
:::note
Available from version 15.5.
No longer available as of version 16.2.
Requires Base64-encryption for the salt parameter.
:::

---

### decryptBytes(Bytes, KeyRef, String, String, Number) - Variant 3
- decryptBytes(encryptedBytes: [Bytes](dw.util.Bytes.md), privateKey: [KeyRef](dw.crypto.KeyRef.md), transformation: [String](TopLevel.String.md), saltOrIV: [String](TopLevel.String.md), iterations: [Number](TopLevel.Number.md)): [Bytes](dw.util.Bytes.md)
  - : Alternative method to [decryptBytes(Bytes, String, String, String, Number)](dw.crypto.Cipher.md#decryptbytesbytes-string-string-string-number---variant-3), which allows
      to use a key in the keystore for the decryption.


    **Parameters:**
    - encryptedBytes - (see [decryptBytes(Bytes, String, String, String, Number)](dw.crypto.Cipher.md#decryptbytesbytes-string-string-string-number---variant-3))
    - privateKey - A reference to a private key in the key store.
    - transformation - (see [decryptBytes(Bytes, String, String, String, Number)](dw.crypto.Cipher.md#decryptbytesbytes-string-string-string-number---variant-3))
    - saltOrIV - (see [decryptBytes(Bytes, String, String, String, Number)](dw.crypto.Cipher.md#decryptbytesbytes-string-string-string-number---variant-3))
    - iterations - (see [decryptBytes(Bytes, String, String, String, Number)](dw.crypto.Cipher.md#decryptbytesbytes-string-string-string-number---variant-3))

    **Returns:**
    - (see [decryptBytes(Bytes, String, String, String, Number)](dw.crypto.Cipher.md#decryptbytesbytes-string-string-string-number---variant-3))

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
      parameters.
      
      
      Typical usage:
      
      
      ```
      var base64Msg : String = "some_encoded_encrypted_message";
      var charset : String = "UTF8";  // or "windows-1252", etc.
      
      var encryptedBytes : Bytes = Encoding.fromBase64(base64Msg);
      var messageBytes : Bytes = Cipher.decryptBytes(encryptedBytes, key, transformation, salt, iterations);
      var message : String = messageBytes.toString(charset);
      ```


    **Parameters:**
    - encryptedBytes - The bytes to decrypt.
    - key - The key to use for decryption.
    - transformation - The transformation used to originally encrypt.
    - saltOrIV - the salt or IV to use.
    - iterations - the iterations to use.

    **Returns:**
    - The decrypted bytes.

    **See Also:**
    - [decrypt(String, String, String, String, Number)](dw.crypto.Cipher.md#decryptstring-string-string-string-number---variant-3)

    **API Version:**
:::note
Available from version 16.2.
Does not use a default initialization vector.
:::

---

### decrypt(String, KeyRef, String, String, Number) - Variant 1
- decrypt(base64Msg: [String](TopLevel.String.md), privateKey: [KeyRef](dw.crypto.KeyRef.md), transformation: [String](TopLevel.String.md), saltOrIV: [String](TopLevel.String.md), iterations: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Alternative method to [decrypt(String, String, String, String, Number)](dw.crypto.Cipher.md#decryptstring-string-string-string-number---variant-1), which allows
      to use a key in the keystore for the decryption.
      
      
      
      Note: Only asymmetric (public/private key pair) algorithms can be used
      with this method, since only those keys can be added to a keystore.


    **Parameters:**
    - base64Msg - (see [decrypt(String, String, String, String, Number)](dw.crypto.Cipher.md#decryptstring-string-string-string-number---variant-1))
    - privateKey - A reference to a private key in the key store.
    - transformation - (see [decrypt(String, String, String, String, Number)](dw.crypto.Cipher.md#decryptstring-string-string-string-number---variant-1))
    - saltOrIV - (see [decrypt(String, String, String, String, Number)](dw.crypto.Cipher.md#decryptstring-string-string-string-number---variant-1))
    - iterations - (see [decrypt(String, String, String, String, Number)](dw.crypto.Cipher.md#decryptstring-string-string-string-number---variant-1))

    **Returns:**
    - (see [decrypt(String, String, String, String, Number)](dw.crypto.Cipher.md#decryptstring-string-string-string-number---variant-1))

    **API Version:**
:::note
No longer available as of version 15.5.
Under some conditions this method allowed a non-Base64 encrypted value for the salt parameter.
:::

---

### decrypt(String, String, String, String, Number) - Variant 1
- decrypt(base64Msg: [String](TopLevel.String.md), key: [String](TopLevel.String.md), transformation: [String](TopLevel.String.md), saltOrIV: [String](TopLevel.String.md), iterations: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Decrypts the passed Base-64 encoded message using the passed key and
      applying the transformations described by the passed parameters.
      
      
      Decryption is the process of getting back the original data from the
      cipher-text using a decryption key.


    **Parameters:**
    - base64Msg - the base64 encoded cipher bytes
    - key - When using a _symmetric_ cryptographic algorithm, use the same key to encrypt and decrypt.           If the cryptographic algorithm is _symmetric_           (for example, AES)           or _asymmetric_ (for example, RSA), the key needs to be passed as a           base64-encoded string. The only exception is the _symmetric_ cryptographic           algorithms _Password Based Encryption_ (PBE). With PBE the key needs           to be passed as plain string (_without_ any encoding). Note that for RSA the           key length should be at least 2048 bits.
    - transformation - The transformation has to be in _"algorithm/mode/padding"_ format. See           the corresponding encrypt method for supported transformations.
    - saltOrIV - Initialization value appropriate for the algorithm, this might           be a Binary Salt or AlgorithmParameter or InitializationVector           (see the corresponding encrypt method for details).           Should be appropriate for the algorithm being used. If this value is           null, a default initialization value will be used by the engine.           The same value used to Encrypt needs to be supplied to the           Decrypt function for many algorithms to successfully decrypt           the data, so it is best practice to specify an appropriate value.
    - iterations - The number of passes to make when turning a passphrase into a key.           This is only applicable for some types of algorithm.           Password Based Encryption (PBE) algorithms use this parameter,           and Block Encryption algorithms do not.           If this value is relevant to the algorithm it would be best           practice to supply it, as the same value would be needed to           decrypt the data that was used to encrypt the data.

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
  - : Alternative method to [decrypt(String, String, String, String, Number)](dw.crypto.Cipher.md#decryptstring-string-string-string-number---variant-2), which allows
      to use a key in the keystore for the decryption.
      
      
      
      Note: Only asymmetric (public/private key pair) algorithms can be used
      with this method, since only those keys can be added to a keystore.


    **Parameters:**
    - base64Msg - (see [decrypt(String, String, String, String, Number)](dw.crypto.Cipher.md#decryptstring-string-string-string-number---variant-2))
    - privateKey - A reference to a private key in the key store.
    - transformation - (see [decrypt(String, String, String, String, Number)](dw.crypto.Cipher.md#decryptstring-string-string-string-number---variant-2))
    - saltOrIV - (see [decrypt(String, String, String, String, Number)](dw.crypto.Cipher.md#decryptstring-string-string-string-number---variant-2))
    - iterations - (see [decrypt(String, String, String, String, Number)](dw.crypto.Cipher.md#decryptstring-string-string-string-number---variant-2))

    **Returns:**
    - (see [decrypt(String, String, String, String, Number)](dw.crypto.Cipher.md#decryptstring-string-string-string-number---variant-2))

    **API Version:**
:::note
Available from version 15.5.
No longer available as of version 16.2.
Requires Base64-encryption for the salt parameter.
:::

---

### decrypt(String, String, String, String, Number) - Variant 2
- decrypt(base64Msg: [String](TopLevel.String.md), key: [String](TopLevel.String.md), transformation: [String](TopLevel.String.md), saltOrIV: [String](TopLevel.String.md), iterations: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Decrypts the passed Base-64 encoded message using the passed key and
      applying the transformations described by the passed parameters.
      
      
      Decryption is the process of getting back the original data from the
      cipher-text using a decryption key.


    **Parameters:**
    - base64Msg - the base64 encoded cipher bytes
    - key - When using a _symmetric_ cryptographic algorithm, use the same key to encrypt and decrypt.           If the cryptographic algorithm is _symmetric_           (for example, AES)           or _asymmetric_ (for example, RSA), the key needs to be passed as           a base64-encoded string. The only exception is the _symmetric_ cryptographic           algorithms _Password Based Encryption_ (PBE). With PBE the key needs           to be passed as plain string (_without_ any encoding).
    - transformation - The transformation has to be in _"algorithm/mode/padding"_ format. See           the corresponding encrypt method for supported transformations.
    - saltOrIV - Initialization value appropriate for the algorithm, this might           be a Binary Salt or AlgorithmParameter or InitializationVector           (see the corresponding encrypt method for details).           Should be appropriate for the algorithm being used. If this value is           null, a default initialization value will be used by the engine.           The same value used to Encrypt needs to be supplied to the           Decrypt function for many algorithms to successfully decrypt           the data, so it is best practice to specify an appropriate value.
    - iterations - The number of passes to make when turning a passphrase into a key.           This is only applicable for some types of algorithm.           Password Based Encryption (PBE) algorithms use this parameter,           and Block Encryption algorithms do not.           If this value is relevant to the algorithm it would be best           practice to supply it, as the same value would be needed to           decrypt the data that was used to encrypt the data.

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
  - : Alternative method to [decrypt(String, String, String, String, Number)](dw.crypto.Cipher.md#decryptstring-string-string-string-number---variant-3), which allows
      to use a key in the keystore for the decryption.
      
      
      
      Note: Only asymmetric (public/private key pair) algorithms can be used
      with this method, since only those keys can be added to a keystore.


    **Parameters:**
    - base64Msg - (see [decrypt(String, String, String, String, Number)](dw.crypto.Cipher.md#decryptstring-string-string-string-number---variant-3))
    - privateKey - A reference to a private key in the key store.
    - transformation - (see [decrypt(String, String, String, String, Number)](dw.crypto.Cipher.md#decryptstring-string-string-string-number---variant-3))
    - saltOrIV - (see [decrypt(String, String, String, String, Number)](dw.crypto.Cipher.md#decryptstring-string-string-string-number---variant-3))
    - iterations - (see [decrypt(String, String, String, String, Number)](dw.crypto.Cipher.md#decryptstring-string-string-string-number---variant-3))

    **Returns:**
    - (see [decrypt(String, String, String, String, Number)](dw.crypto.Cipher.md#decryptstring-string-string-string-number---variant-3))

    **API Version:**
:::note
Available from version 16.2.
Does not use a default initialization vector.
:::

---

### decrypt(String, String, String, String, Number) - Variant 3
- decrypt(base64Msg: [String](TopLevel.String.md), key: [String](TopLevel.String.md), transformation: [String](TopLevel.String.md), saltOrIV: [String](TopLevel.String.md), iterations: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Decrypts the passed Base-64 encoded message using the passed key and
      applying the transformations described by the passed parameters.
      
      
      Decryption is the process of getting back the original data from the
      cipher-text using a decryption key.


    **Parameters:**
    - base64Msg - the base64 encoded cipher bytes
    - key - When using a _symmetric_ cryptographic algorithm, use the same key to encrypt and decrypt.           If the cryptographic algorithm is _symmetric_           (for example, AES)           or _asymmetric_ (for example, RSA), the key needs to be passed as a           base64-encoded string. The only exception is the _symmetric_ cryptographic           algorithms _Password Based Encryption_ (PBE). With PBE the key needs           to be passed as plain string (_without_ any encoding).
    - transformation - The transformation has to be in _"algorithm/mode/padding"_ format. See           the corresponding encrypt method for supported transformations.
    - saltOrIV - Initialization value appropriate for the algorithm, this might           be a Binary Salt or AlgorithmParameter or InitializationVector           (see the corresponding encrypt method for details).           Should be appropriate for the algorithm being used.           The same value used to Encrypt needs to be supplied to the           Decrypt function for many algorithms to successfully decrypt           the data, so it is best practice to specify an appropriate value.
    - iterations - The number of passes to make when turning a passphrase into a key.           This is only applicable for some types of algorithm.           Password Based Encryption (PBE) algorithms use this parameter,           and Block Encryption algorithms do not.           If this value is relevant to the algorithm it would be best           practice to supply it, as the same value would be needed to           decrypt the data that was used to encrypt the data.

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
  - : Alternative method to [encryptBytes(Bytes, String, String, String, Number)](dw.crypto.Cipher.md#encryptbytesbytes-string-string-string-number---variant-1), which allows
      to use a key in the keystore for the encryption.
      
      
      
      Note: Only asymmetric (public/private key pair) algorithms can be used
      with this method, since only those keys can be added to a keystore.


    **Parameters:**
    - messageBytes - (see [encryptBytes(Bytes, String, String, String, Number)](dw.crypto.Cipher.md#encryptbytesbytes-string-string-string-number---variant-1))
    - publicKey - A reference to a public key.
    - transformation - (see [encryptBytes(Bytes, String, String, String, Number)](dw.crypto.Cipher.md#encryptbytesbytes-string-string-string-number---variant-1))
    - saltOrIV - (see [encryptBytes(Bytes, String, String, String, Number)](dw.crypto.Cipher.md#encryptbytesbytes-string-string-string-number---variant-1))
    - iterations - (see [encryptBytes(Bytes, String, String, String, Number)](dw.crypto.Cipher.md#encryptbytesbytes-string-string-string-number---variant-1))

    **Returns:**
    - (see [encryptBytes(Bytes, String, String, String, Number)](dw.crypto.Cipher.md#encryptbytesbytes-string-string-string-number---variant-1))

    **API Version:**
:::note
No longer available as of version 15.5.
Under some conditions this method allowed a non-Base64 encrypted value for the salt parameter.
:::

---

### encryptBytes(Bytes, String, String, String, Number) - Variant 1
- encryptBytes(messageBytes: [Bytes](dw.util.Bytes.md), key: [String](TopLevel.String.md), transformation: [String](TopLevel.String.md), saltOrIV: [String](TopLevel.String.md), iterations: [Number](TopLevel.Number.md)): [Bytes](dw.util.Bytes.md)
  - : Lower-level encryption API. Encrypts the passed bytes by using the
      specified key and applying the transformations described by the specified
      parameters.
      
      
      Typical usage:
      
      
      ```
      var message : String = "some_message";
      var charset : String = "UTF8"; // or "windows-1252", etc.
      
      // encrypt the message
      var messageBytes : Bytes = new Bytes(message, charset);
      var encryptedBytes : Bytes = Cipher.encryptBytes(messageBytes, key, transformation, salt, iterations);
      var encrypted : String = Encoding.toBase64(encryptedBytes);
      ```


    **Parameters:**
    - messageBytes - The bytes to encrypt.
    - key - The key to use for encryption.
    - transformation - The transformation to apply.
    - saltOrIV - Initialization value appropriate for the algorithm.
    - iterations - The number of passes to make when turning a passphrase             into a key.

    **Returns:**
    - the encrypted bytes.

    **See Also:**
    - [encrypt(String, String, String, String, Number)](dw.crypto.Cipher.md#encryptstring-string-string-string-number---variant-1)

    **API Version:**
:::note
No longer available as of version 15.5.
Under some conditions this method allowed a non-Base64 encrypted value for the salt parameter.
:::

---

### encryptBytes(Bytes, CertificateRef, String, String, Number) - Variant 2
- encryptBytes(messageBytes: [Bytes](dw.util.Bytes.md), publicKey: [CertificateRef](dw.crypto.CertificateRef.md), transformation: [String](TopLevel.String.md), saltOrIV: [String](TopLevel.String.md), iterations: [Number](TopLevel.Number.md)): [Bytes](dw.util.Bytes.md)
  - : Alternative method to [encryptBytes(Bytes, String, String, String, Number)](dw.crypto.Cipher.md#encryptbytesbytes-string-string-string-number---variant-2), which allows
      to use a key in the keystore for the encryption.
      
      
      
      Note: Only asymmetric (public/private key pair) algorithms can be used
      with this method, since only those keys can be added to a keystore.


    **Parameters:**
    - messageBytes - (see [encryptBytes(Bytes, String, String, String, Number)](dw.crypto.Cipher.md#encryptbytesbytes-string-string-string-number---variant-2))
    - publicKey - A reference to a public key.
    - transformation - (see [encryptBytes(Bytes, String, String, String, Number)](dw.crypto.Cipher.md#encryptbytesbytes-string-string-string-number---variant-2))
    - saltOrIV - (see [encryptBytes(Bytes, String, String, String, Number)](dw.crypto.Cipher.md#encryptbytesbytes-string-string-string-number---variant-2))
    - iterations - (see [encryptBytes(Bytes, String, String, String, Number)](dw.crypto.Cipher.md#encryptbytesbytes-string-string-string-number---variant-2))

    **Returns:**
    - (see [encryptBytes(Bytes, String, String, String, Number)](dw.crypto.Cipher.md#encryptbytesbytes-string-string-string-number---variant-2))

    **API Version:**
:::note
Available from version 15.5.
No longer available as of version 16.2.
Requires Base64-encryption for the salt parameter.
:::

---

### encryptBytes(Bytes, String, String, String, Number) - Variant 2
- encryptBytes(messageBytes: [Bytes](dw.util.Bytes.md), key: [String](TopLevel.String.md), transformation: [String](TopLevel.String.md), saltOrIV: [String](TopLevel.String.md), iterations: [Number](TopLevel.Number.md)): [Bytes](dw.util.Bytes.md)
  - : Lower-level encryption API. Encrypts the passed bytes by using the
      specified key and applying the transformations described by the specified
      parameters.
      
      
      Typical usage:
      
      
      ```
      var message : String = "some_message";
      var charset : String = "UTF8"; // or "windows-1252", etc.
      
      // encrypt the message
      var messageBytes : Bytes = new Bytes(message, charset);
      var encryptedBytes : Bytes = Cipher.encryptBytes(messageBytes, key, transformation, salt, iterations);
      var encrypted : String = Encoding.toBase64(encryptedBytes);
      ```


    **Parameters:**
    - messageBytes - The bytes to encrypt.
    - key - The key to use for encryption.
    - transformation - The transformation to apply.
    - saltOrIV - Initialization value appropriate for the algorithm.
    - iterations - The number of passes to make when turning a passphrase             into a key.

    **Returns:**
    - the encrypted bytes.

    **See Also:**
    - [encrypt(String, String, String, String, Number)](dw.crypto.Cipher.md#encryptstring-string-string-string-number---variant-2)

    **API Version:**
:::note
Available from version 15.5.
No longer available as of version 16.2.
Requires Base64-encryption for the salt parameter.
:::

---

### encryptBytes(Bytes, CertificateRef, String, String, Number) - Variant 3
- encryptBytes(messageBytes: [Bytes](dw.util.Bytes.md), publicKey: [CertificateRef](dw.crypto.CertificateRef.md), transformation: [String](TopLevel.String.md), saltOrIV: [String](TopLevel.String.md), iterations: [Number](TopLevel.Number.md)): [Bytes](dw.util.Bytes.md)
  - : Alternative method to [encryptBytes(Bytes, String, String, String, Number)](dw.crypto.Cipher.md#encryptbytesbytes-string-string-string-number---variant-3), which allows
      to use a key in the keystore for the encryption.
      
      
      
      Note: Only asymmetric (public/private key pair) algorithms can be used
      with this method, since only those keys can be added to a keystore.


    **Parameters:**
    - messageBytes - (see [encryptBytes(Bytes, String, String, String, Number)](dw.crypto.Cipher.md#encryptbytesbytes-string-string-string-number---variant-3))
    - publicKey - A reference to a public key.
    - transformation - (see [encryptBytes(Bytes, String, String, String, Number)](dw.crypto.Cipher.md#encryptbytesbytes-string-string-string-number---variant-3))
    - saltOrIV - (see [encryptBytes(Bytes, String, String, String, Number)](dw.crypto.Cipher.md#encryptbytesbytes-string-string-string-number---variant-3))
    - iterations - (see [encryptBytes(Bytes, String, String, String, Number)](dw.crypto.Cipher.md#encryptbytesbytes-string-string-string-number---variant-3))

    **Returns:**
    - (see [encryptBytes(Bytes, String, String, String, Number)](dw.crypto.Cipher.md#encryptbytesbytes-string-string-string-number---variant-3))

    **API Version:**
:::note
Available from version 16.2.
Does not use a default initialization vector.
:::

---

### encryptBytes(Bytes, String, String, String, Number) - Variant 3
- encryptBytes(messageBytes: [Bytes](dw.util.Bytes.md), key: [String](TopLevel.String.md), transformation: [String](TopLevel.String.md), saltOrIV: [String](TopLevel.String.md), iterations: [Number](TopLevel.Number.md)): [Bytes](dw.util.Bytes.md)
  - : Lower-level encryption API. Encrypts the passed bytes by using the
      specified key and applying the transformations described by the specified
      parameters.
      
      
      Typical usage:
      
      
      ```
      var message : String = "some_message";
      var charset : String = "UTF8"; // or "windows-1252", etc.
      
      // encrypt the message
      var messageBytes : Bytes = new Bytes(message, charset);
      var encryptedBytes : Bytes = Cipher.encryptBytes(messageBytes, key, transformation, salt, iterations);
      var encrypted : String = Encoding.toBase64(encryptedBytes);
      ```


    **Parameters:**
    - messageBytes - The bytes to encrypt.
    - key - The key to use for encryption.
    - transformation - The transformation to apply.
    - saltOrIV - Initialization value appropriate for the algorithm.
    - iterations - The number of passes to make when turning a passphrase             into a key.

    **Returns:**
    - the encrypted bytes.

    **See Also:**
    - [encrypt(String, String, String, String, Number)](dw.crypto.Cipher.md#encryptstring-string-string-string-number---variant-3)

    **API Version:**
:::note
Available from version 16.2.
Does not use a default initialization vector.
:::

---

### encrypt(String, CertificateRef, String, String, Number) - Variant 1
- encrypt(message: [String](TopLevel.String.md), publicKey: [CertificateRef](dw.crypto.CertificateRef.md), transformation: [String](TopLevel.String.md), saltOrIV: [String](TopLevel.String.md), iterations: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Alternative method to
      [encrypt(String, String, String, String, Number)](dw.crypto.Cipher.md#encryptstring-string-string-string-number---variant-1), which allows you to
      use a key in the keystore for encryption.
      
      
      Note: Only asymmetric (public/private key pair) algorithms can be used
      with this method, since only those keys can be added to a keystore.
      
      
      For asymmetric algorithms a private/public key pair is required.
      Commerce Cloud Digital only allows you to add private keys in the format \*.p12 and \*.pfx.
      You can assign private keys an extra password in Business Manager. Public keys
      can only be imported as trusted certificates in the format \*.crt, \*.pem,
      \*.der, and \*.cer.
      
      
      Key pairs for asymmetric ciphers can be generated with an arbitrary tool.
      One of the most popular options is the open source tool OpenSSL.
      OpenSSL has a command-line syntax and is available on major platforms.
      
      
      The following steps are involved in **creating an RSA key pair:**
      
      1. Generate a public and a non-protected private key ( \*.crt and \*.key ).


    **Parameters:**
    - message - (see [encrypt(String, String, String, String, Number)](dw.crypto.Cipher.md#encryptstring-string-string-string-number---variant-1))
    - publicKey - A reference to a public key.
    - transformation - (see [encrypt(String, String, String, String, Number)](dw.crypto.Cipher.md#encryptstring-string-string-string-number---variant-1))
    - saltOrIV - (see [encrypt(String, String, String, String, Number)](dw.crypto.Cipher.md#encryptstring-string-string-string-number---variant-1))
    - iterations - (see [encrypt(String, String, String, String, Number)](dw.crypto.Cipher.md#encryptstring-string-string-string-number---variant-1))

    **Returns:**
    - (see [encrypt(String, String, String, String, Number)](dw.crypto.Cipher.md#encryptstring-string-string-string-number---variant-1))

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
      
      
      Encryption is the process of converting normal data or plain text to
      something incomprehensible or cipher-text by applying transformations,
      which are the operation (or set of operations) to be performed on given input
      to produce some output. A transformation always includes the name of a
      cryptographic algorithm (for example, RSA) and may be followed by a mode and padding scheme.
      The supported algorithms are listed in the parameter description below.
      
      
      The cryptographic algorithms can be partitioned into _symmetric_
      and _asymmetric_ (or public key/private key).
      
      
      **Symmetric** or "secret key" algorithms use the same key to encrypt
      and to decrypt the data. Symmetric algorithms are what most people think
      of as codes: using a well-known algorithm and a secret key to encode information,
      which can be decoded using the same algorithm and the same key. The algorithm
      is not secret, the secrecy is inherent to guarding the key. A significant
      problem with symmetric ciphers is that it is difficult to transfer the keys
      themselves securely. Symmetric algorithms include _password-based_ algorithms.
      
      
      **AES with key length of 256 bits is the preferred choice for symmetric encryption going forward.
       Please consider switching to it if you are using any other scheme or if using AES with a
       shorter key length. The rest of the symmetric algorithms will be deprecated in the future.**
      
      
      **Asymmetric** or "public key" cryptography uses a public/private key pair, and then publishes the public key.
      Only the holder of the private key will be able to decrypt.
      The public key and private key together are also called a "key pair".
      Data encrypted with one key can only be decrypted using the other key
      from the pair, and it is not possible to deduce one key from the other.
      This helps to solve the key distribution problem since it is possible to
      publicise one of the keys widely (the "public key") and keep the other
      a closely guarded secret (the "private key"). Many partners can then
      send data encrypted with the public key, but only the holder of the
      corresponding private key can decrypt it.
      
      
      Key pairs for asymmetric ciphers can be generated with an arbitrary tool.
      One of the most popular options is the open source tool OpenSSL.
      OpenSSL has a command-line syntax and is available on major platforms.
      
      
      The following steps are involved in **creating an RSA key pair:**
      
      1. Generate an RSA private key with keylength of 2048 bits. Store this key in a safe place.
      
         ```
         openssl genrsa -out rsaprivatekey.pem 2048
         ```
      
      2. Generate a public key from the private key. You use the public key to encrypt messages with Cipher.encrypt. OpenSSL saves the key PEM-encoded; this means the key is saved with a base64 encoding. After you removed the header and footer lines you can pass the content directly to the API method.
      
         ```
         openssl rsa -in rsaprivatekey.pem -out publickey.pem -pubout
         ```
      
      3. Generate a private key in PKCS\#8 format. You use that key to decrypt messages with Cipher.decrypt. OpenSSL saves the key PEM-encoded; this means the key is saved with a base64 encoding. After you removed the header and footer lines you can pass the content directly to the API method.
      
         ```
         openssl pkcs8 -topk8 -in rsaprivatekey.pem -out privatekey.pem -nocrypt
         ```
      
      
      
      
      **Modes**
      
      The following modes of operation are block cipher operations that
      are used with some algorithms.
      
      - "NONE" no mode
      - "CBC" Cipher Block Chaining (defined in FIPS PUB 81)
      - "CTR" Counter mode or Segmented Integer Counter mode (defined in FIPS PUB 81)
      - "CTS" CipherText Streaming mode
      - "CFB" Cipher Feedback Mode,  can be referred to with key  length referenced as "CFB8","CFB16","CFB24".."CFB64" (defined in FIPS PUB 81)
      - "ECB" Electronic Cook book  as defined in: The National  Institute of Standards and Technology (NIST) Federal Information  Processing Standard (FIPS) PUB 81, "DES Modes of Operation,"  U.S. Department of Commerce, Dec 1980.
      - "OFB" Output Feedback Mode, can be referred to with key  length referenced as "OFB8","OFB16","OFB24".."OFB64" (defined in FIPS PUB 81)
      - "PCBC" Propagating Cipher Block Chaining (defined in Kerberos V4)
      
      
      
      **Paddings**
      
      - "NoPadding": No padding.
      - OAEPWith<digest>And<mgf>Padding: 
      Optimal Asymmetric Encryption  Padding scheme defined in PKCS\#1, where <digest>should be replaced  by the message digest and <mgf>by the mask generation function.  
      Examples: OAEPWITHSHA-256ANDMGF1PADDING, OAEPWITHSHA-384ANDMGF1PADDING, OAEPWITHSHA-512ANDMGF1PADDING
      - ISO10126PADDING: the ISO10126-2:1991 DEA padding scheme
      - PKCS1Padding: Public Key Cryptography Standard \#1, a standard  for padding from RSA Laboratories that can encrypt messages up  to 11 bytes smaller than the modulus size in bytes.
      - PKCS5Padding: Public Key Cryptography Standard \#1, a standard  for padding from RSA Laboratories, "PKCS\#5: Password-Based Encryption Standard," version 1.5, November 1993.
      - SSL3Padding: The padding scheme defined in the SSL Protocol Version 3.0, November 18, 1996, section 5.2.3.2 (CBC block cipher)


    **Parameters:**
    - message - A string to encrypt (will be first converted with UTF-8 encoding           into a byte stream)
    - key - A string ready for use with the algorithm.           The key's format depends on the algorithm specified and the           keys are assumed to be correctly formulated for the algorithm           used, for example that the lengths are correct.           Keys are _not_ checked for validity.            The cryptographic algorithms can be partitioned into _symmetric_           and _asymmetric_ (or public key/private key). Symmetric algorithms           include _password-based_ algorithms.           Symmetric keys are usually a base64-encoded array of bytes.           Asymmetric keys are "key pairs" with a public key and a private key.           To encrypt using asymmetric algorithms, provide the public key.           To decrypt using asymmetric algorithms, provide the private key from           the same pair in PKCS\#8 format, base64-encoded.           See class documentation on how to generate a key pair.           If the cryptographic algorithm is _symmetric_           (for example, AES)           or _asymmetric_ (for example, RSA), the key needs to be passed as a           base64-encoded string. The only exception is the _symmetric_ cryptographic           algorithms _Password Based Encryption_ (PBE). With PBE the key needs           to be passed as plain string (_without_ any encoding).
    - transformation - The transformation has to be in _"algorithm/mode/padding"_ format.           Symmetric or "secret key" algorithms use the same key to encrypt           and to decrypt the data. Asymmetric or "public key" cryptography           uses a public/private key pair, and then publishes the public key.           Only the holder of the private key will be able to decrypt.           The public key and private key are also known as a "key pair".            Supported Symmetric transformations include:                       <li>"AES" or Rijndael, Advanced Encryption Standard as specified by NIST           **AES with key length of 256 is the preferred choice for symmetric encryption**           Keysizes: 128, 192, or 256           Modes: "ECB","CBC","PCBC","CTR","CTS","CFB","CFB8","CFB16","CFB24".."CFB64", "OFB","OFB8","OFB16","OFB24".."OFB64"           Padding: "PKCS5Padding"           </li>           </ul>            Note that ARCFOUR, Blowfish, DES, RC2, DESede, DESedeWrap, PBEWithMD5AndDES, PBEWithMD5AndTripleDES1,           PBEWithSHA1AndDESede and PBEWithSHA1AndRC2\_40 transformations have been deprecated. Also, PKCS5Padding is           the only supported Padding. NOPADDING and ISO10126PADDING have been deprecated.            Supported Asymmetric transformations include:                       <li>"RSA"           Mode: "ECB"           Padding: "OAEPWITHSHA-256ANDMGF1PADDING", "OAEPWITHSHA-384ANDMGF1PADDING", "OAEPWITHSHA-512ANDMGF1PADDING"           </li>           </ul>            Note that for RSA the key length should be at least 2048 bits. Also, the following Padding options           have been deprecated: NOPADDING, PKCS1PADDING, OAEPWITHMD5ANDMGF1PADDING,OAEPWITHSHA1ANDMGF1PADDING and           OAEPWITHSHA-1ANDMGF1PADDING.
    - saltOrIV - Initialization value appropriate for the algorithm, this might           be a Binary Salt or AlgorithmParameter or InitializationVector.           (As binary values cannot be passed, the equivalent Base64 String           should be passed for any binary salt value).            Should be appropriate for the algorithm being used. If this value is           null, a default initialization value will be used by the engine.           The same value used to Encrypt needs to be supplied to the           Decrypt function for many algorithms to successfully decrypt           the data, so it is best practice to specify an appropriate value.            Requirements for the size and generation of DES initialization           vectors (IV) are derived from FIPS 74 and FIPS 81 from the National           Institute of Standards and Technology. CBC mode requires an IV           with length 64 bits; CFB uses 48-64 bits; OFB uses 64 bits.           If the IV is to be used with DES in the OFB mode, then it is not           acceptable for the IV to remain fixed for multiple encryptions,           if the same key is used for those encryptions.            For Block Encryption algorithms this is the encoded Base64           String equivalent to the a random number to use as a "salt"           to use with the algorithm.           The algorithm must contain a Feedback Mode other than ECB.           This must be a binary value that is exactly the same size           as the algorithm block size.           RC5 uses an optional 8-byte initialization vector (IV),           but only in feedback mode (see CFB above).           For Password Based Encryption algorithms, the salt is the encoded           Base64 String equivalent to a random number value to transform the           password into a key. PBE derives an encryption key from a password.           In order to make the task of getting from password to key very           time-consuming for an attacker, most PBE implementations will           mix in a random number, known as a salt, to create the key. The salt           value and the iteration count are then combined into a           PBEParameterSpecification to initialize the cipher.            The PKCS\#5 spec from RSA Labs defines the parameters for           password-based encryption (PBE).           The RSA algorithm requires a salt with length as defined in PKCS\#1.
    - iterations - The number of passes to make when turning a passphrase into a key.           This is only applicable for some types of algorithm.           Password Based Encryption (PBE) algorithms use this parameter,           and Block Encryption algorithms do not.           If this value is relevant to the algorithm it would be best           practice to supply it, as the same value would be needed to           decrypt the data.

    **Returns:**
    - the encrypted message encoded as a String using base 64 encoding.

    **API Version:**
:::note
No longer available as of version 15.5.
Under some conditions this method allowed a non-Base64 encrypted value for the salt parameter.
:::

---

### encrypt(String, CertificateRef, String, String, Number) - Variant 2
- encrypt(message: [String](TopLevel.String.md), publicKey: [CertificateRef](dw.crypto.CertificateRef.md), transformation: [String](TopLevel.String.md), saltOrIV: [String](TopLevel.String.md), iterations: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Alternative method to
      [encrypt(String, String, String, String, Number)](dw.crypto.Cipher.md#encryptstring-string-string-string-number---variant-2), which allows you to
      use a key in the keystore for encryption.
      
      
      Note: Only asymmetric (public/private key pair) algorithms can be used
      with this method, since only those keys can be added to a keystore.
      
      
      For asymmetric algorithms a private/public key pair is required.
      Commerce Cloud Digital only allows you to add private keys in the format \*.p12 and \*.pfx.
      You can assign private keys an extra password in Business Manager. Public keys
      can only be imported as trusted certificates in the format \*.crt, \*.pem,
      \*.der, and \*.cer.
      
      
      Key pairs for asymmetric ciphers can be generated with an arbitrary tool.
      One of the most popular options is the open source tool OpenSSL.
      OpenSSL has a command-line syntax and is available on major platforms.
      
      
      The following steps are involved in **creating an RSA key pair:**
      
      1. Generate a public and a non-protected private key ( \*.crt and \*.key ).
      
         ```
         openssl req -x509 -newkey rsa:2048 -keyout nopass.key -out nopass.crt -days 365 -nodes
         ```
      
      2. Generate a keystore that contains the public and private keys ( \*.p12 ).
      
         ```
         openssl pkcs12 -export -out nopass.p12 -inkey nopass.key -in nopass.crt
         ```
      
      
      To import a private or public key into the Digital keystore, navigate to
      **Administration > Operations > Private Keys and Certificates**
      Use a .p12 file to import a private key and a \*.crt to import a public key.
      
      
      Typical usage:
      
      
      ```
      var plain : String = "some_plain_text";
      var publicKeyRef = new CertificateRef("rsa-certificate-2048");
      var cipher : Cipher = new Cipher();
      var encrypted : String = cipher.encrypt(plain, publicKeyRef, "RSA", null, 0);
      ```


    **Parameters:**
    - message - (see [encrypt(String, String, String, String, Number)](dw.crypto.Cipher.md#encryptstring-string-string-string-number---variant-2))
    - publicKey - A reference to a public key.
    - transformation - (see [encrypt(String, String, String, String, Number)](dw.crypto.Cipher.md#encryptstring-string-string-string-number---variant-2))
    - saltOrIV - (see [encrypt(String, String, String, String, Number)](dw.crypto.Cipher.md#encryptstring-string-string-string-number---variant-2))
    - iterations - (see [encrypt(String, String, String, String, Number)](dw.crypto.Cipher.md#encryptstring-string-string-string-number---variant-2))

    **Returns:**
    - (see [encrypt(String, String, String, String, Number)](dw.crypto.Cipher.md#encryptstring-string-string-string-number---variant-2))

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
      
      
      Encryption is the process of converting normal data or plain text to
      something incomprehensible or cipher-text by applying transformations,
      which are the operation (or set of operations) to be performed on given input
      to produce some output. A transformation always includes the name of a
      cryptographic algorithm (for example, RSA) and may be followed by a mode and padding scheme.
      The supported algorithms are listed in the parameter description below.
      
      The cryptographic algorithms can be partitioned into _symmetric_
      and _asymmetric_ (or public key/private key).
      
      
      **Symmetric** or "secret key" algorithms use the same key to encrypt
      and to decrypt the data. Symmetric algorithms are what most people think
      of as codes: using a well-known algorithm and a secret key to encode information,
      which can be decoded using the same algorithm and the same key. The algorithm
      is not secret, the secrecy is inherent to guarding the key. A significant
      problem with symmetric ciphers is that it is difficult to transfer the keys
      themselves securely. Symmetric algorithms include _password-based_ algorithms.
      
      
      **AES with key length of 256 bits is the preferred choice for symmetric encryption going forward.
       Please consider switching to it if you are using any other scheme or if using AES with a
       shorter key length. The rest of the symmetric algorithms will be deprecated in the future.**
      
      
      **Asymmetric** or "public key" cryptography uses a public/private key pair, and then publishes the public key.
      Only the holder of the private key will be able to decrypt.
      The public key and private key together are also called a "key pair".
      Data encrypted with one key can only be decrypted using the other key
      from the pair, and it is not possible to deduce one key from the other.
      This helps to solve the key distribution problem since it is possible to
      publicise one of the keys widely (the "public key") and keep the other
      a closely guarded secret (the "private key"). Many partners can then
      send data encrypted with the public key, but only the holder of the
      corresponding private key can decrypt it.
      
      
      Key pairs for asymmetric ciphers can be generated with an arbitrary tool.
      One of the most popular options is the open source tool OpenSSL.
      OpenSSL has a command-line syntax and is available on major platforms.
      
      
      The following steps are involved in **creating an RSA key pair:**
      
      1. Generate an RSA private key with keylength of 2048 bits. Store this key in a safe place.
      
         ```
         openssl genrsa -out rsaprivatekey.pem 2048
         ```
      
      2. Generate a public key from the private key. You use the public key to encrypt messages with Cipher.encrypt. OpenSSL saves the key PEM-encoded; this means the key is saved with a base64 encoding. After you removed the header and footer lines you can pass the content directly to the API method.
      
         ```
         openssl rsa -in rsaprivatekey.pem -out publickey.pem -pubout
         ```
      
      3. Generate a private key in PKCS\#8 format. You use that key to decrypt messages with Cipher.decrypt. OpenSSL saves the key PEM-encoded; this means the key is saved with a base64 encoding. After you removed the header and footer lines you can pass the content directly to the API method.
      
         ```
         openssl pkcs8 -topk8 -in rsaprivatekey.pem -out privatekey.pem -nocrypt
         ```
      
      
      
      
      **Modes**
      
      The following modes of operation are block cipher operations that
      are used with some algorithms.
      
      - "NONE" no mode
      - "CBC" Cipher Block Chaining (defined in FIPS PUB 81)
      - "CTR" Counter mode or Segmented Integer Counter mode (defined in FIPS PUB 81)
      - "CTS" CipherText Streaming mode
      - "CFB" Cipher Feedback Mode,  can be referred to with key  length referenced as "CFB8","CFB16","CFB24".."CFB64" (defined in FIPS PUB 81)
      - "ECB" Electronic Cook book  as defined in: The National  Institute of Standards and Technology (NIST) Federal Information  Processing Standard (FIPS) PUB 81, "DES Modes of Operation,"  U.S. Department of Commerce, Dec 1980.
      - "OFB" Output Feedback Mode, can be referred to with key  length referenced as "OFB8","OFB16","OFB24".."OFB64" (defined in FIPS PUB 81)
      - "PCBC" Propagating Cipher Block Chaining (defined in Kerberos V4)
      
      
      
      **Paddings**
      
      - "NoPadding": No padding.
      - OAEPWith<digest>And<mgf>Padding: 
      Optimal Asymmetric Encryption  Padding scheme defined in PKCS\#1, where <digest>should be replaced  by the message digest and <mgf>by the mask generation function.  
      Examples: OAEPWITHSHA-256ANDMGF1PADDING, OAEPWITHSHA-384ANDMGF1PADDING, OAEPWITHSHA-512ANDMGF1PADDING
      - ISO10126PADDING: the ISO10126-2:1991 DEA padding scheme
      - PKCS1Padding: Public Key Cryptography Standard \#1, a standard  for padding from RSA Laboratories that can encrypt messages up  to 11 bytes smaller than the modulus size in bytes.
      - PKCS5Padding: Public Key Cryptography Standard \#1, a standard  for padding from RSA Laboratories, "PKCS\#5: Password-Based Encryption Standard," version 1.5, November 1993.
      - SSL3Padding: The padding scheme defined in the SSL Protocol Version 3.0, November 18, 1996, section 5.2.3.2 (CBC block cipher)


    **Parameters:**
    - message - A string to encrypt (will be first converted with UTF-8 encoding           into a byte stream)
    - key - A string ready for use with the algorithm.           The key's format depends on the algorithm specified and the           keys are assumed to be correctly formulated for the algorithm           used, for example that the lengths are correct.           Keys are _not_ checked for validity.            The cryptographic algorithms can be partitioned into _symmetric_           and _asymmetric_ (or public key/private key). Symmetric algorithms           include _password-based_ algorithms.           Symmetric keys are usually a base64-encoded array of bytes.           Asymmetric keys are "key pairs" with a public key and a private key.           To encrypt using asymmetric algorithms, provide the public key.           To decrypt using asymmetric algorithms, provide the private key from           the same pair in PKCS\#8 format, base64-encoded.           See class documentation on how to generate a key pair.           If the cryptographic algorithm is _symmetric_           (for example, AES)           or _asymmetric_ (for example, RSA), the key needs to be passed as a           base64-encoded string. The only exception is the _symmetric_ cryptographic           algorithms _Password Based Encryption_ (PBE). With PBE the key needs           to be passed as plain string (_without_ any encoding).
    - transformation - The transformation  has to be in _"algorithm/mode/padding"_ format.           Symmetric or "secret key" algorithms use the same key to encrypt           and to decrypt the data. Asymmetric or "public key" cryptography           uses a public/private key pair, and then publishes the public key.           Only the holder of the private key will be able to decrypt.           The public key and private key are also known as a "key pair".            Supported Symmetric transformations include:                       <li>"AES" or Rijndael, Advanced Encryption Standard as specified by NIST           **AES with key length of 256 is the preferred choice for symmetric encryption**           Keysizes: 128, 192, or 256           Modes: "ECB","CBC","PCBC","CTR","CTS","CFB","CFB8","CFB16","CFB24".."CFB64", "OFB","OFB8","OFB16","OFB24".."OFB64"           Padding: "PKCS5Padding"           </li>           </ul>            Note that ARCFOUR, Blowfish, DES, RC2, DESede, DESedeWrap, PBEWithMD5AndDES, PBEWithMD5AndTripleDES1,           PBEWithSHA1AndDESede and PBEWithSHA1AndRC2\_40 transformations have been deprecated. Also, PKCS5Padding is           the only supported Padding. NOPADDING and ISO10126PADDING have been deprecated.            Supported Asymmetric transformations include:                       <li>"RSA"           Mode: "ECB"           Padding: "OAEPWITHSHA-256ANDMGF1PADDING", "OAEPWITHSHA-384ANDMGF1PADDING", "OAEPWITHSHA-512ANDMGF1PADDING"           </li>           </ul>            Note that for RSA the key length should be at least 2048 bits. Also, the following Padding options           have been deprecated: NOPADDING, PKCS1PADDING, OAEPWITHMD5ANDMGF1PADDING, OAEPWITHSHA1ANDMGF1PADDING and           OAEPWITHSHA-1ANDMGF1PADDING.
    - saltOrIV - Initialization value appropriate for the algorithm, this might           be a Binary Salt or AlgorithmParameter or InitializationVector.           (As binary values cannot be passed, the equivalent Base64 String           should be passed for any binary salt value).            Should be appropriate for the algorithm being used. If this value is           null, a default initialization value will be used by the engine.           The same value used to Encrypt needs to be supplied to the           Decrypt function for many algorithms to successfully decrypt           the data, so it is best practice to specify an appropriate value.            Requirements for the size and generation of DES initialization           vectors (IV) are derived from FIPS 74 and FIPS 81 from the National           Institute of Standards and Technology. CBC mode requires an IV           with length 64 bits; CFB uses 48-64 bits; OFB uses 64 bits.           If the IV is to be used with DES in the OFB mode, then it is not           acceptable for the IV to remain fixed for multiple encryptions,           if the same key is used for those encryptions.            For Block Encryption algorithms this is the encoded Base64           String equivalent to the a random number to use as a "salt"           to use with the algorithm.           The algorithm must contain a Feedback Mode other than ECB.           This must be a binary value that is exactly the same size           as the algorithm block size.           RC5 uses an optional 8-byte initialization vector (IV),           but only in feedback mode (see CFB above).           For Password Based Encryption algorithms, the salt is the encoded           Base64 String equivalent to a random number value to transform the           password into a key. PBE derives an encryption key from a password.           In order to make the task of getting from password to key very           time-consuming for an attacker, most PBE implementations will           mix in a random number, known as a salt, to create the key. The salt           value and the iteration count are then combined into a           PBEParameterSpecification to initialize the cipher.            The PKCS\#5 spec from RSA Labs defines the parameters for           password-based encryption (PBE).           The RSA algorithm requires a salt with length as defined in PKCS\#1.           DSA has a specific initialization that uses three integers to           build a DSAParameterSpec (a prime, a sub-prime and a base).           To use this algorithm you should use the JCE or another           provider to supply a DSAParameterSpec and then supply the           Base64 equivalent string as the "salt". Please see the           documentation from the provider for additional restrictions.
    - iterations - The number of passes to make when turning a passphrase into a key.           This is only applicable for some types of algorithm.           Password Based Encryption (PBE) algorithms use this parameter,           and Block Encryption algorithms do not.           If this value is relevant to the algorithm it would be best           practice to supply it, as the same value would be needed to           decrypt the data.

    **Returns:**
    - the encrypted message encoded as a String using base 64 encoding.

    **API Version:**
:::note
Available from version 15.5.
No longer available as of version 16.2.
Requires Base64-encryption for the salt parameter.
:::

---

### encrypt(String, CertificateRef, String, String, Number) - Variant 3
- encrypt(message: [String](TopLevel.String.md), publicKey: [CertificateRef](dw.crypto.CertificateRef.md), transformation: [String](TopLevel.String.md), saltOrIV: [String](TopLevel.String.md), iterations: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Alternative method to
      [encrypt(String, String, String, String, Number)](dw.crypto.Cipher.md#encryptstring-string-string-string-number---variant-3), which allows you to
      use a key in the keystore for encryption.
      
      
      Note: Only asymmetric (public/private key pair) algorithms can be used
      with this method, since only those keys can be added to a keystore.
      
      
      For asymmetric algorithms a private/public key pair is required.
      Commerce Cloud Digital only allows you to add private keys in the format \*.p12 and \*.pfx.
      You can assign private keys an extra password in Business Manager. Public keys
      can only be imported as trusted certificates in the format \*.crt, \*.pem,
      \*.der, and \*.cer.
      
      
      Key pairs for asymmetric ciphers can be generated with an arbitrary tool.
      One of the most popular options is the open source tool OpenSSL.
      OpenSSL has a command-line syntax and is available on major platforms.
      
      
      The following steps are involved in **creating an RSA key pair:**
      
      1. Generate a public and a non-protected private key ( \*.crt and \*.key ).
      
         ```
         openssl req -x509 -newkey rsa:2048 -keyout nopass.key -out nopass.crt -days 365 -nodes
         ```
      
      2. Generate a keystore that contains the public and private keys ( \*.p12 ).
      
         ```
         openssl pkcs12 -export -out nopass.p12 -inkey nopass.key -in nopass.crt
         ```
      
      
      To import a private or public key into the Digital keystore, navigate to
      **Administration > Operations > Private Keys and Certificates**
      Use a .p12 file to import a private key and a \*.crt to import a public key.
      
      
      Typical usage:
      
      
      ```
      var plain : String = "some_plain_text";
      var publicKeyRef = new CertificateRef("rsa-certificate-2048");
      var cipher : Cipher = new Cipher();
      var encrypted : String = cipher.encrypt(plain, publicKeyRef, "RSA", null, 0);
      ```


    **Parameters:**
    - message - (see [encrypt(String, String, String, String, Number)](dw.crypto.Cipher.md#encryptstring-string-string-string-number---variant-3))
    - publicKey - A reference to a public key.
    - transformation - (see [encrypt(String, String, String, String, Number)](dw.crypto.Cipher.md#encryptstring-string-string-string-number---variant-3))
    - saltOrIV - (see [encrypt(String, String, String, String, Number)](dw.crypto.Cipher.md#encryptstring-string-string-string-number---variant-3))
    - iterations - (see [encrypt(String, String, String, String, Number)](dw.crypto.Cipher.md#encryptstring-string-string-string-number---variant-3))

    **Returns:**
    - (see [encrypt(String, String, String, String, Number)](dw.crypto.Cipher.md#encryptstring-string-string-string-number---variant-3))

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
      
      
      Encryption is the process of converting normal data or plain text to
      something incomprehensible or cipher-text by applying transformations,
      which are the operation (or set of operations) to be performed on given input
      to produce some output. A transformation always includes the name of a
      cryptographic algorithm (for example, RSA) and may be followed by a mode and padding scheme.
      The supported algorithms are listed in the parameter description below.
      
      The cryptographic algorithms can be partitioned into _symmetric_
      and _asymmetric_ (or public key/private key).
      
      
      **Symmetric** or "secret key" algorithms use the same key to encrypt
      and to decrypt the data. Symmetric algorithms are what most people think
      of as codes: using a well-known algorithm and a secret key to encode information,
      which can be decoded using the same algorithm and the same key. The algorithm
      is not secret, the secrecy is inherent to guarding the key. A significant
      problem with symmetric ciphers is that it is difficult to transfer the keys
      themselves securely. Symmetric algorithms include _password-based_ algorithms.
      
      **AES with key length of 256 bits is the preferred choice for symmetric encryption going forward.
       Please consider switching to it if you are using any other scheme or if using AES with a
       shorter key length. The rest of the symmetric algorithms will be deprecated in the future.**
      
      
      **Asymmetric** or "public key" cryptography uses a public/private key pair, and then publishes the public key.
      Only the holder of the private key will be able to decrypt.
      The public key and private key together are also called a "key pair".
      Data encrypted with one key can only be decrypted using the other key
      from the pair, and it is not possible to deduce one key from the other.
      This helps to solve the key distribution problem since it is possible to
      publicise one of the keys widely (the "public key") and keep the other
      a closely guarded secret (the "private key"). Many partners can then
      send data encrypted with the public key, but only the holder of the
      corresponding private key can decrypt it.
      
      
      Key pairs for asymmetric ciphers can be generated with an arbitrary tool.
      One of the most popular options is the open source tool OpenSSL.
      OpenSSL has a command-line syntax and is available on major platforms.
      
      
      The following steps are involved in **creating an RSA key pair:**
      
      1. Generate an RSA private key with keylength of 2048 bits. Store this key in a safe place.
      
         ```
         openssl genrsa -out rsaprivatekey.pem 2048
         ```
      
      2. Generate a public key from the private key. You use the public key to encrypt messages with Cipher.encrypt. OpenSSL saves the key PEM-encoded; this means the key is saved with a base64 encoding. After you removed the header and footer lines you can pass the content directly to the API method.
      
         ```
         openssl rsa -in rsaprivatekey.pem -out publickey.pem -pubout
         ```
      
      3. Generate a private key in PKCS\#8 format. You use that key to decrypt messages with Cipher.decrypt. OpenSSL saves the key PEM-encoded; this means the key is saved with a base64 encoding. After you removed the header and footer lines you can pass the content directly to the API method.
      
         ```
         openssl pkcs8 -topk8 -in rsaprivatekey.pem -out privatekey.pem -nocrypt
         ```
      
      
      
      
      **Modes**
      
      The following modes of operation are block cipher operations that
      are used with some algorithms.
      
      - "NONE" no mode
      - "CBC" Cipher Block Chaining (defined in FIPS PUB 81)
      - "CTR" Counter mode or Segmented Integer Counter mode (defined in FIPS PUB 81)
      - "CTS" CipherText Streaming mode
      - "CFB" Cipher Feedback Mode,  can be referred to with key  length referenced as "CFB8","CFB16","CFB24".."CFB64" (defined in FIPS PUB 81)
      - "ECB" Electronic Cook book  as defined in: The National  Institute of Standards and Technology (NIST) Federal Information  Processing Standard (FIPS) PUB 81, "DES Modes of Operation,"  U.S. Department of Commerce, Dec 1980.
      - "GCM" Galois/Counter Mode (defined in NIST SP 800-38D)
      - "OFB" Output Feedback Mode, can be referred to with key  length referenced as "OFB8","OFB16","OFB24".."OFB64" (defined in FIPS PUB 81)
      - "PCBC" Propagating Cipher Block Chaining (defined in Kerberos V4)
      
      
      
      **Paddings**
      
      - "NoPadding": No padding.
      - OAEPWith<digest>And<mgf>Padding: 
      Optimal Asymmetric Encryption  Padding scheme defined in PKCS\#1, where <digest>should be replaced  by the message digest and <mgf>by the mask generation function.  
      Examples: OAEPWITHSHA-256ANDMGF1PADDING, OAEPWITHSHA-384ANDMGF1PADDING, OAEPWITHSHA-512ANDMGF1PADDING
      - ISO10126PADDING: the ISO10126-2:1991 DEA padding scheme
      - PKCS1Padding: Public Key Cryptography Standard \#1, a standard  for padding from RSA Laboratories that can encrypt messages up  to 11 bytes smaller than the modulus size in bytes.
      - PKCS5Padding: Public Key Cryptography Standard \#1, a standard  for padding from RSA Laboratories, "PKCS\#5: Password-Based Encryption Standard," version 1.5, November 1993.
      - SSL3Padding: The padding scheme defined in the SSL Protocol Version 3.0, November 18, 1996, section 5.2.3.2 (CBC block cipher)


    **Parameters:**
    - message - A string to encrypt (will be first converted with UTF-8 encoding           into a byte stream)
    - key - A string ready for use with the algorithm.           The key's format depends on the algorithm specified and the           keys are assumed to be correctly formulated for the algorithm           used, for example that the lengths are correct.           Keys are _not_ checked for validity.            The cryptographic algorithms can be partitioned into _symmetric_           and _asymmetric_ (or public key/private key). Symmetric algorithms           include _password-based_ algorithms.           Symmetric keys are usually a base64-encoded array of bytes.           Asymmetric keys are "key pairs" with a public key and a private key.           To encrypt using asymmetric algorithms, provide the public key.           To decrypt using asymmetric algorithms, provide the private key from           the same pair in PKCS\#8 format, base64-encoded.           See class documentation on how to generate a key pair.           If the cryptographic algorithm is _symmetric_           (for example, AES)           or _asymmetric_ (for example, RSA), the key needs to be passed as a           base64-encoded string. The only exception is the _symmetric_ cryptographic           algorithms _Password Based Encryption_ (PBE). With PBE the key needs           to be passed as plain string (_without_ any encoding).
    - transformation - The transformation has to be in _"algorithm/mode/padding"_ format.           Symmetric or "secret key" algorithms use the same key to encrypt           and to decrypt the data. Asymmetric or "public key" cryptography           uses a public/private key pair, and then publishes the public key.           Only the holder of the private key will be able to decrypt.           The public key and private key are also known as a "key pair".            Supported Symmetric transformations include:                       <li>"AES" or Rijndael, Advanced Encryption Standard as specified by NIST           **AES with key length of 256 is the preferred choice for symmetric encryption**           Keysizes: 128, 192, or 256           Modes: "GCM","ECB","CBC","PCBC","CTR","CTS","CFB","CFB8","CFB16","CFB24".."CFB64", "OFB","OFB8","OFB16","OFB24".."OFB64"           Padding: "PKCS5Padding" or "NoPadding" (GCM only)           </li>           </ul>            Note that ARCFOUR, Blowfish, DES, RC2, DESede, DESedeWrap, PBEWithMD5AndDES, PBEWithMD5AndTripleDES1,           PBEWithSHA1AndDESede and PBEWithSHA1AndRC2\_40 transformations have been deprecated. PKCS5Padding is           the only supported Padding for most modes. NOPADDING is only supported for GCM, and ISO10126PADDING has been deprecated.            Supported Asymmetric transformations include:                       <li>"RSA"           Mode: "ECB"           Padding: "OAEPWITHSHA-256ANDMGF1PADDING", "OAEPWITHSHA-384ANDMGF1PADDING", "OAEPWITHSHA-512ANDMGF1PADDING"           </li>           </ul>            Note that for RSA the key length should be at least 2048 bits. Also, the following Padding options have           been deprecated: NOPADDING, PKCS1PADDING, OAEPWITHMD5ANDMGF1PADDING, OAEPWITHSHA1ANDMGF1PADDING and OAEPWITHSHA-1ANDMGF1PADDING.
    - saltOrIV - Initialization value appropriate for the algorithm, this might           be a Binary Salt or AlgorithmParameter or InitializationVector.           (As binary values cannot be passed, the equivalent Base64 String           should be passed for any binary salt value).            Should be appropriate for the algorithm being used.           The same value used to Encrypt needs to be supplied to the           Decrypt function for many algorithms to successfully decrypt           the data, so it is best practice to specify an appropriate value.            Requirements for the size and generation of DES initialization           vectors (IV) are derived from FIPS 74 and FIPS 81 from the National           Institute of Standards and Technology. CBC mode requires an IV           with length 64 bits; CFB uses 48-64 bits; OFB uses 64 bits; GCM uses 96 bits.           If the IV is to be used with DES in the OFB mode, then it is not           acceptable for the IV to remain fixed for multiple encryptions,           if the same key is used for those encryptions.            For Block Encryption algorithms this is the encoded Base64           String equivalent to the a random number to use as a "salt"           to use with the algorithm.           The algorithm must contain a Feedback Mode other than ECB.           This must be a binary value that is exactly the same size           as the algorithm block size.           RC5 uses an optional 8-byte initialization vector (IV),           but only in feedback mode (see CFB above).           For Password Based Encryption algorithms, the salt is the encoded           Base64 String equivalent to a random number value to transform the           password into a key. PBE derives an encryption key from a password.           In order to make the task of getting from password to key very           time-consuming for an attacker, most PBE implementations will           mix in a random number, known as a salt, to create the key. The salt           value and the iteration count are then combined into a           PBEParameterSpecification to initialize the cipher.            The PKCS\#5 spec from RSA Labs defines the parameters for           password-based encryption (PBE).           The RSA algorithm requires a salt with length as defined in PKCS\#1.           DSA has a specific initialization that uses three integers to           build a DSAParameterSpec (a prime, a sub-prime and a base).           To use this algorithm you should use the JCE or another           provider to supply a DSAParameterSpec and then supply the           Base64 equivalent string as the "salt". Please see the           documentation from the provider for additional restrictions.           For GCM the base64-encoded initialization vector may be optionally suffixed           with a vertical pipe followed by the number of bits in the tag length. If not           present then the tag length will be 128 bits. This syntax is only supported           for the GCM mode.
    - iterations - The number of passes to make when turning a passphrase into a key.           This is only applicable for some types of algorithm.           Password Based Encryption (PBE) algorithms use this parameter,           and Block Encryption algorithms do not.           If this value is relevant to the algorithm it would be best           practice to supply it, as the same value would be needed to           decrypt the data.

    **Returns:**
    - the encrypted message encoded as a String using base 64 encoding.

    **API Version:**
:::note
Available from version 16.2.
Does not use a default initialization vector.
:::

---

<!-- prettier-ignore-end -->
