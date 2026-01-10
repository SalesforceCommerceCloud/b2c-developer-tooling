<!-- prettier-ignore-start -->
# Class MessageDigest

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.crypto.MessageDigest](dw.crypto.MessageDigest.md)

This class provides the functionality of a message digest algorithm, such as
MD5 or SHA. Message digests are secure one-way hash functions that take
arbitrary-sized data and output a fixed-length hash value. This
implementation offers only stateless digest() methods. A Bytes object or
String is passed to a digest() method and the computed hash is returned.


**Note:** this class handles sensitive security-related data.
Pay special attention to PCI DSS v3. requirements 2, 4, and 12.



## Constant Summary

| Constant | Description |
| --- | --- |
| ~~[DIGEST_MD2](#digest_md2): [String](TopLevel.String.md) = "MD2"~~ | Constant representing the MD2 algorithm. |
| ~~[DIGEST_MD5](#digest_md5): [String](TopLevel.String.md) = "MD5"~~ | Constant representing the MD5 algorithm. |
| ~~[DIGEST_SHA](#digest_sha): [String](TopLevel.String.md) = "SHA"~~ | Constant representing the SHA algorithm. |
| ~~[DIGEST_SHA_1](#digest_sha_1): [String](TopLevel.String.md) = "SHA-1"~~ | Constant representing the SHA 1 algorithm. |
| [DIGEST_SHA_256](#digest_sha_256): [String](TopLevel.String.md) = "SHA-256" | Constant representing the SHA 256 algorithm |
| [DIGEST_SHA_512](#digest_sha_512): [String](TopLevel.String.md) = "SHA-512" | Constant representing the SHA 512 algorithm |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [MessageDigest](#messagedigeststring)([String](TopLevel.String.md)) | Construct a MessageDigest with the specified algorithm name. |

## Method Summary

| Method | Description |
| --- | --- |
| [digest](dw.crypto.MessageDigest.md#digest)() | Completes the hash computation by performing final operations such as  padding. |
| ~~[digest](dw.crypto.MessageDigest.md#digeststring)([String](TopLevel.String.md))~~ | Digests the passed string and returns a computed hash value as a string. |
| ~~[digest](dw.crypto.MessageDigest.md#digeststring-bytes)([String](TopLevel.String.md), [Bytes](dw.util.Bytes.md))~~ | Computes the hash value for the passed array of bytes. |
| [digestBytes](dw.crypto.MessageDigest.md#digestbytesbytes)([Bytes](dw.util.Bytes.md)) | Computes the hash value for the passed [Bytes](dw.util.Bytes.md). |
| [updateBytes](dw.crypto.MessageDigest.md#updatebytesbytes)([Bytes](dw.util.Bytes.md)) | Updates the digest using the passed [Bytes](dw.util.Bytes.md). |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### DIGEST_MD2

- ~~DIGEST_MD2: [String](TopLevel.String.md) = "MD2"~~
  - : Constant representing the MD2 algorithm.

    **Deprecated:**
:::warning
This algorithm is obsolete and and has been deprecated. Please use SHA-256 or SHA-512.
:::

---

### DIGEST_MD5

- ~~DIGEST_MD5: [String](TopLevel.String.md) = "MD5"~~
  - : Constant representing the MD5 algorithm.

    **Deprecated:**
:::warning
This algorithm is obsolete and and has been deprecated. Please use SHA-256 or SHA-512.
:::

---

### DIGEST_SHA

- ~~DIGEST_SHA: [String](TopLevel.String.md) = "SHA"~~
  - : Constant representing the SHA algorithm.

    **Deprecated:**
:::warning
This algorithm is obsolete and and has been deprecated. Please use SHA-256 or SHA-512.
:::

---

### DIGEST_SHA_1

- ~~DIGEST_SHA_1: [String](TopLevel.String.md) = "SHA-1"~~
  - : Constant representing the SHA 1 algorithm.

    **Deprecated:**
:::warning
This algorithm is obsolete and and has been deprecated. Please use SHA-256 or SHA-512.
:::

---

### DIGEST_SHA_256

- DIGEST_SHA_256: [String](TopLevel.String.md) = "SHA-256"
  - : Constant representing the SHA 256 algorithm


---

### DIGEST_SHA_512

- DIGEST_SHA_512: [String](TopLevel.String.md) = "SHA-512"
  - : Constant representing the SHA 512 algorithm


---

## Constructor Details

### MessageDigest(String)
- MessageDigest(algorithm: [String](TopLevel.String.md))
  - : Construct a MessageDigest with the specified algorithm name. The
      supported algorithms are:
      
      
      - SHA-256
      - SHA-512


    **Parameters:**
    - algorithm - The standard name of the digest algorithm, must not be         null and must be a supported algorithm.


---

## Method Details

### digest()
- digest(): [Bytes](dw.util.Bytes.md)
  - : Completes the hash computation by performing final operations such as
      padding.
      
      The binary representation of the message is typically derived from a
      string and the resulting hash is typically converted with base64 back
      into a string. Example:
      
      `
       Encoding.toBase64( digest() );
       `


    **Returns:**
    - The resulting hash value.


---

### digest(String)
- ~~digest(input: [String](TopLevel.String.md)): [String](TopLevel.String.md)~~
  - : Digests the passed string and returns a computed hash value as a string.
      The passed String is first encoded into a sequence of bytes using the
      platform's default encoding. The digest then performs any prerequisite
      padding, before computing the hash value. The hash is then converted into
      a string by converting all digits to hexadecimal.


    **Parameters:**
    - input - The value to hash as String, must not be null.

    **Returns:**
    - The resulting hash value as hex-encoded string.

    **Deprecated:**
:::warning
Deprecated because the conversion of the input to bytes using
            the default platform encoding and the hex-encoded return
            value are not generally appropriate.

:::

---

### digest(String, Bytes)
- ~~digest(algorithm: [String](TopLevel.String.md), input: [Bytes](dw.util.Bytes.md)): [Bytes](dw.util.Bytes.md)~~
  - : Computes the hash value for the passed array of bytes. The algorithm
      argument is optional. If null, then the algorithm established at
      construction time is used.
      
      The binary representation of the message is typically derived from a
      string and the resulting hash is typically converted with base64 back
      into a string. Example:
      
      `
       Encoding.toBase64( digest( "MD5", new Bytes( "my password", "UTF-8" ) ) );
       `


    **Parameters:**
    - algorithm - The standard name of the digest algorithm, or null if             the algorithm passed at construction time is to be used.             The algorithm must be a supported algorithm.
    - input - The value to hash, must not be null.

    **Returns:**
    - The resulting hash value.

    **Deprecated:**
:::warning
Deprecated because the digest algorithm should be the one
            set in the constructor.

:::

---

### digestBytes(Bytes)
- digestBytes(input: [Bytes](dw.util.Bytes.md)): [Bytes](dw.util.Bytes.md)
  - : Computes the hash value for the passed [Bytes](dw.util.Bytes.md).
      
      The binary representation of the message is typically derived from a
      string and the resulting hash is typically converted with base64 back
      into a string. Example:
      
      `
       Encoding.toBase64( digest( new Bytes( "my password", "UTF-8" ) ) );
       `


    **Parameters:**
    - input - The value to hash, must not be null.

    **Returns:**
    - The resulting hash value.


---

### updateBytes(Bytes)
- updateBytes(input: [Bytes](dw.util.Bytes.md)): void
  - : Updates the digest using the passed [Bytes](dw.util.Bytes.md).

    **Parameters:**
    - input - The value to hash, must not be null.


---

<!-- prettier-ignore-end -->
