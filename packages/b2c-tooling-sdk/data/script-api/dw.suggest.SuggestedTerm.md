<!-- prettier-ignore-start -->
# Class SuggestedTerm

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.suggest.SuggestedTerm](dw.suggest.SuggestedTerm.md)

A single suggested term.

Each user input term of the search phrase
is being processed separately by the suggestion engine. For each
original term, a list of terms will be suggested, either completed terms,
corrected terms or even the exact term if it is known to the engine.


Each suggested term is represented by a instance of this class. The list of suggested terms
belonging to a single original term is represented by a instance of [SuggestedTerms](dw.suggest.SuggestedTerms.md) class.


The suggested term value can either be the completed version of the original term,
the corrected version of the original term or exactly the original term.



## Property Summary

| Property | Description |
| --- | --- |
| [additional](#additional): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns whether this suggested term is a additional term that has no corresponding term in the original search phrase. |
| [completed](#completed): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns whether this suggested term is a auto completed version of the original term. |
| [corrected](#corrected): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns whether this suggested term is a corrected version of the original term. |
| [exactMatch](#exactmatch): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns whether this suggested term is exactly matching the original term. |
| [value](#value): [String](TopLevel.String.md) `(read-only)` | Returns this suggested term as String value. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getValue](dw.suggest.SuggestedTerm.md#getvalue)() | Returns this suggested term as String value. |
| [isAdditional](dw.suggest.SuggestedTerm.md#isadditional)() | Returns whether this suggested term is a additional term that has no corresponding term in the original search phrase. |
| [isCompleted](dw.suggest.SuggestedTerm.md#iscompleted)() | Returns whether this suggested term is a auto completed version of the original term. |
| [isCorrected](dw.suggest.SuggestedTerm.md#iscorrected)() | Returns whether this suggested term is a corrected version of the original term. |
| [isExactMatch](dw.suggest.SuggestedTerm.md#isexactmatch)() | Returns whether this suggested term is exactly matching the original term. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### additional
- additional: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns whether this suggested term is a additional term that has no corresponding term in the original search phrase.


---

### completed
- completed: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns whether this suggested term is a auto completed version of the original term.
      In other words, this method returns true if the original term is a prefix of this suggested term.



---

### corrected
- corrected: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns whether this suggested term is a corrected version of the original term.


---

### exactMatch
- exactMatch: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns whether this suggested term is exactly matching the original term.


---

### value
- value: [String](TopLevel.String.md) `(read-only)`
  - : Returns this suggested term as String value.


---

## Method Details

### getValue()
- getValue(): [String](TopLevel.String.md)
  - : Returns this suggested term as String value.

    **Returns:**
    - the string representation of this suggested term


---

### isAdditional()
- isAdditional(): [Boolean](TopLevel.Boolean.md)
  - : Returns whether this suggested term is a additional term that has no corresponding term in the original search phrase.

    **Returns:**
    - `true` if this suggested term is a additional term, `false` otherwise


---

### isCompleted()
- isCompleted(): [Boolean](TopLevel.Boolean.md)
  - : Returns whether this suggested term is a auto completed version of the original term.
      In other words, this method returns true if the original term is a prefix of this suggested term.


    **Returns:**
    - `true` if this suggested term is evaluated by auto completion, `false` otherwise


---

### isCorrected()
- isCorrected(): [Boolean](TopLevel.Boolean.md)
  - : Returns whether this suggested term is a corrected version of the original term.

    **Returns:**
    - `true` if this suggested term is a corrected version of the original term, `false` otherwise


---

### isExactMatch()
- isExactMatch(): [Boolean](TopLevel.Boolean.md)
  - : Returns whether this suggested term is exactly matching the original term.

    **Returns:**
    - `true` if this suggested term exactly matches the original term, `false` otherwise


---

<!-- prettier-ignore-end -->
