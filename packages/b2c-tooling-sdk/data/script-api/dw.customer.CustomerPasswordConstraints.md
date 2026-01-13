<!-- prettier-ignore-start -->
# Class CustomerPasswordConstraints

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.customer.CustomerPasswordConstraints](dw.customer.CustomerPasswordConstraints.md)

Provides access to the constraints of customer passwords. An instance of this class can be obtained via [CustomerMgr.getPasswordConstraints()](dw.customer.CustomerMgr.md#getpasswordconstraints).


## Property Summary

| Property | Description |
| --- | --- |
| [forceLetters](#forceletters): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns `true` if letters are enforced. |
| [forceMixedCase](#forcemixedcase): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns `true` if mixed case is enforced. |
| [forceNumbers](#forcenumbers): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns `true` if numbers are enforced. |
| [minLength](#minlength): [Number](TopLevel.Number.md) `(read-only)` | Returns the minimum length. |
| [minSpecialChars](#minspecialchars): [Number](TopLevel.Number.md) `(read-only)` | Returns the minimum number of special characters. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| static [getMinLength](dw.customer.CustomerPasswordConstraints.md#getminlength)() | Returns the minimum length. |
| static [getMinSpecialChars](dw.customer.CustomerPasswordConstraints.md#getminspecialchars)() | Returns the minimum number of special characters. |
| static [isForceLetters](dw.customer.CustomerPasswordConstraints.md#isforceletters)() | Returns `true` if letters are enforced. |
| static [isForceMixedCase](dw.customer.CustomerPasswordConstraints.md#isforcemixedcase)() | Returns `true` if mixed case is enforced. |
| static [isForceNumbers](dw.customer.CustomerPasswordConstraints.md#isforcenumbers)() | Returns `true` if numbers are enforced. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### forceLetters
- forceLetters: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns `true` if letters are enforced.


---

### forceMixedCase
- forceMixedCase: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns `true` if mixed case is enforced.


---

### forceNumbers
- forceNumbers: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns `true` if numbers are enforced.


---

### minLength
- minLength: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the minimum length.


---

### minSpecialChars
- minSpecialChars: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the minimum number of special characters.


---

## Method Details

### getMinLength()
- static getMinLength(): [Number](TopLevel.Number.md)
  - : Returns the minimum length.

    **Returns:**
    - the minimum length


---

### getMinSpecialChars()
- static getMinSpecialChars(): [Number](TopLevel.Number.md)
  - : Returns the minimum number of special characters.

    **Returns:**
    - the minimum number of special characters


---

### isForceLetters()
- static isForceLetters(): [Boolean](TopLevel.Boolean.md)
  - : Returns `true` if letters are enforced.

    **Returns:**
    - if letters are enforced


---

### isForceMixedCase()
- static isForceMixedCase(): [Boolean](TopLevel.Boolean.md)
  - : Returns `true` if mixed case is enforced.

    **Returns:**
    - if mixed case is enforced


---

### isForceNumbers()
- static isForceNumbers(): [Boolean](TopLevel.Boolean.md)
  - : Returns `true` if numbers are enforced.

    **Returns:**
    - if numbers are enforced


---

<!-- prettier-ignore-end -->
