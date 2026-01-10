<!-- prettier-ignore-start -->
# Class SecureRandom

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.crypto.SecureRandom](dw.crypto.SecureRandom.md)

The SecureRandom class provides a cryptographically strong random number generator (RNG).
See the Internet Engineering Task Force (IETF) RFC 1750: _Randomness Recommendations for
 Security_ for more information.]()


 Typical callers of SecureRandom invoke the following methods to retrieve random bytes:


```
     Bytes bytes...
     SecureRandom random = new SecureRandom();
     Bytes nextBytes = random.nextBytes(bytes);
```


or more convenient to get a Bytes with the demanded length


```
     int length = 32;
     SecureRandom random = new SecureRandom();
     Bytes nextBytes = random.nextBytes(length);
```


dw.crypto.SecureRandom is intentionally an adapter for generating cryptographic hard random numbers.



## Constructor Summary

| Constructor | Description |
| --- | --- |
| [SecureRandom](#securerandom)() | Instantiates a new secure random. |

## Method Summary

| Method | Description |
| --- | --- |
| [generateSeed](dw.crypto.SecureRandom.md#generateseednumber)([Number](TopLevel.Number.md)) | Returns the given number of seed bytes, computed using the seed  generation algorithm that this class uses to seed itself. |
| [nextBytes](dw.crypto.SecureRandom.md#nextbytesnumber)([Number](TopLevel.Number.md)) | Generates a user-specified number of random bytes. |
| [nextInt](dw.crypto.SecureRandom.md#nextint)() | Returns the next pseudorandom, uniformly distributed int value from this random number generator's sequence. |
| [nextInt](dw.crypto.SecureRandom.md#nextintnumber)([Number](TopLevel.Number.md)) | Returns a pseudorandom, uniformly distributed int value  between 0 (inclusive) and the specified value (exclusive), drawn from  this random number generator's sequence. |
| [nextNumber](dw.crypto.SecureRandom.md#nextnumber)() | Returns the next pseudorandom, uniformly distributed  Number value between 0.0 (inclusive) and 1.0 (exclusive) from this random number generator's sequence. |
| [setSeed](dw.crypto.SecureRandom.md#setseedbytes)([Bytes](dw.util.Bytes.md)) | Reseeds this random object. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constructor Details

### SecureRandom()
- SecureRandom()
  - : Instantiates a new secure random.


---

## Method Details

### generateSeed(Number)
- generateSeed(numBytes: [Number](TopLevel.Number.md)): [Bytes](dw.util.Bytes.md)
  - : Returns the given number of seed bytes, computed using the seed
      generation algorithm that this class uses to seed itself.  This
      call may be used to seed other random number generators.


    **Parameters:**
    - numBytes - the number of seed bytes to generate.

    **Returns:**
    - the seed bytes.


---

### nextBytes(Number)
- nextBytes(numBits: [Number](TopLevel.Number.md)): [Bytes](dw.util.Bytes.md)
  - : Generates a user-specified number of random bytes.
      
      
       If a call to `setSeed` had not occurred previously,
      the first call to this method forces this SecureRandom object
      to seed itself.  This self-seeding will not occur if
      `setSeed` was previously called.


    **Parameters:**
    - numBits - the demanded number of bits

    **Returns:**
    - a randomly filled [Bytes](dw.util.Bytes.md)


---

### nextInt()
- nextInt(): [Number](TopLevel.Number.md)
  - : Returns the next pseudorandom, uniformly distributed int value from this random number generator's sequence. The general
      contract of nextInt is that one int value is pseudorandomly generated and returned. All 2^32
      possible int values are produced with (approximately) equal probability.


    **Returns:**
    - the next pseudorandom, uniformly distributed int value from this random number generator's sequence


---

### nextInt(Number)
- nextInt(upperBound: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Returns a pseudorandom, uniformly distributed int value
      between 0 (inclusive) and the specified value (exclusive), drawn from
      this random number generator's sequence.


    **Parameters:**
    - upperBound - the bound on the random number to be returned.  Must be positive.

    **Returns:**
    - the next pseudorandom, uniformly distributed int value between 0 (inclusive) and upperBound (exclusive)
              from this random number generator's sequence


    **Throws:**
    - IllegalArgumentException - if n is not positive


---

### nextNumber()
- nextNumber(): [Number](TopLevel.Number.md)
  - : Returns the next pseudorandom, uniformly distributed
      Number value between 0.0 (inclusive) and 1.0 (exclusive) from this random number generator's sequence.


    **Returns:**
    - the next pseudorandom, uniformly distributed Number
              value between 0.0 and 1.0 from this random number generator's sequence



---

### setSeed(Bytes)
- setSeed(seed: [Bytes](dw.util.Bytes.md)): void
  - : Reseeds this random object. The given seed supplements, rather than replaces, the existing seed. Thus, repeated calls are guaranteed never to reduce randomness.

    **Parameters:**
    - seed - the seed.


---

<!-- prettier-ignore-end -->
