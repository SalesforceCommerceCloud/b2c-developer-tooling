<!-- prettier-ignore-start -->
# Class WeakMac

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.crypto.WeakMac](dw.crypto.WeakMac.md)

This API provides access to Deprecated algorithms.


See [Mac](dw.crypto.Mac.md) for full documentation. WeakMac is simply a drop-in replacement that **only** supports
deprecated algorithms. This is helpful when you need to deal with weak algorithms for backward
compatibility purposes, but Mac should always be used for new development and for anything intended to be secure.


This class provides the functionality of a "Message Authentication Code" (MAC) algorithm.
A MAC provides a way to check the integrity of information transmitted over or
stored in an unreliable medium, based on a secret key.
Typically, message authentication codes are used between two parties
that share a secret key in order to validate information transmitted between these parties.
A MAC mechanism that is based on cryptographic hash functions is referred to as HMAC.
HMAC can be used with any cryptographic hash function, e.g., SHA256,
in combination with a secret shared key. HMAC is specified in RFC 2104.


**Note:** this class handles sensitive security-related data.
Pay special attention to PCI DSS v3. requirements 2, 4, and 12.



## Constant Summary

| Constant | Description |
| --- | --- |
| [HMAC_MD5](#hmac_md5): [String](TopLevel.String.md) = "HmacMD5" | Constant representing the HMAC-MD5 keyed-hashing algorithm as defined in RFC 2104 "HMAC: Keyed-Hashing for Message Authentication" (February 1997). |
| [HMAC_SHA_1](#hmac_sha_1): [String](TopLevel.String.md) = "HmacSHA1" | Constant representing the HmacSHA1 algorithms as defined in RFC 2104 "HMAC: Keyed-Hashing for Message Authentication" (February 1997)  with SHA-1 as the message digest algorithm. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [WeakMac](#weakmacstring)([String](TopLevel.String.md)) | Construct a Mac encryption instance with the specified algorithm name. |

## Method Summary

| Method | Description |
| --- | --- |
| [digest](dw.crypto.WeakMac.md#digestbytes-bytes)([Bytes](dw.util.Bytes.md), [Bytes](dw.util.Bytes.md)) | Computes the hash value for the passed bytes input using the passed secret key. |
| [digest](dw.crypto.WeakMac.md#digeststring-bytes)([String](TopLevel.String.md), [Bytes](dw.util.Bytes.md)) | Computes the hash value for the passed string input using the passed secret key. |
| [digest](dw.crypto.WeakMac.md#digeststring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Computes the hash value for the passed string input using the passed secret key. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### HMAC_MD5

- HMAC_MD5: [String](TopLevel.String.md) = "HmacMD5"
  - : Constant representing the HMAC-MD5 keyed-hashing algorithm as defined in RFC 2104 "HMAC: Keyed-Hashing for Message Authentication" (February 1997).
      This algorithm uses as MD5 cryptographic hash function.
      
      
      This algorithm is obsolete. Do not use it for any sensitive data



---

### HMAC_SHA_1

- HMAC_SHA_1: [String](TopLevel.String.md) = "HmacSHA1"
  - : Constant representing the HmacSHA1 algorithms as defined in RFC 2104 "HMAC: Keyed-Hashing for Message Authentication" (February 1997)
      with SHA-1 as the message digest algorithm.
      
      
      This algorithm is obsolete. Do not use it for any sensitive data



---

## Constructor Details

### WeakMac(String)
- WeakMac(algorithm: [String](TopLevel.String.md))
  - : Construct a Mac encryption instance with the specified algorithm name. The
      supported algorithms are:
      
      
      - HmacMD5
      - HmacSHA1


    **Parameters:**
    - algorithm - the standard name of the digest algorithm, must not be             null.

    **Throws:**
    - NullArgumentException - if algorithm is null.
    - IllegalArgumentException - if the specified algorithm name is not              supported.


---

## Method Details

### digest(Bytes, Bytes)
- digest(input: [Bytes](dw.util.Bytes.md), key: [Bytes](dw.util.Bytes.md)): [Bytes](dw.util.Bytes.md)
  - : Computes the hash value for the passed bytes input using the passed secret key.

    **Parameters:**
    - input - The bytes to calculate a RFC 2104 compliant HMAC hash value.
    - key - The secret key as byte array ready for use with the algorithm.           The key's format depends on the chosen algorithm and the           keys are assumed to be correctly formulated for the algorithm           used, for example that the lengths are correct.           Keys are _not_ checked for validity.           Only such keys that have no key parameters associated with them.

    **Returns:**
    - The resulting hash value as bytes.

    **Throws:**
    - IllegalArgumentException - if algorithm is not null and the              specified algorithm name is not supported.


---

### digest(String, Bytes)
- digest(input: [String](TopLevel.String.md), key: [Bytes](dw.util.Bytes.md)): [Bytes](dw.util.Bytes.md)
  - : Computes the hash value for the passed string input using the passed secret key.
      Given input will be first converted with UTF-8 encoding into a byte array.
      The resulting hash is typically converted with base64 back into a string.


    **Parameters:**
    - input - A string to calculate a RFC 2104 compliant HMAC hash value for.
    - key - The secret key as bytes ready for use with the algorithm.           The key's format depends on the chosen algorithm and the           keys are assumed to be correctly formulated for the algorithm           used, for example that the lengths are correct.           Keys are _not_ checked for validity.           Only such keys that have no key parameters associated with them.

    **Returns:**
    - The resulting hash value as bytes.

    **Throws:**
    - IllegalArgumentException - if algorithm is not null and the              specified algorithm name is not supported.


---

### digest(String, String)
- digest(input: [String](TopLevel.String.md), key: [String](TopLevel.String.md)): [Bytes](dw.util.Bytes.md)
  - : Computes the hash value for the passed string input using the passed secret key.
      Given input and the given key will be first converted with UTF-8 encoding into a byte array.
      The resulting hash is typically converted with base64 back into a string.


    **Parameters:**
    - input - A string to calculate a RFC 2104 compliant HMAC hash value for.
    - key - The secret key ready for use with the algorithm.           The key's format depends on the chosen algorithm and the           keys are assumed to be correctly formulated for the algorithm           used, for example that the lengths are correct.           Keys are _not_ checked for validity.           Only such keys that have no key parameters associated with them.

    **Returns:**
    - The resulting hash value as bytes.

    **Throws:**
    - IllegalArgumentException - if algorithm is not null and the              specified algorithm name is not supported.


---

<!-- prettier-ignore-end -->
