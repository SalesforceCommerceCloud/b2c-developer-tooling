<!-- prettier-ignore-start -->
# Class SuggestedTerms

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.suggest.SuggestedTerms](dw.suggest.SuggestedTerms.md)

This container represents a list of suggested terms, all belonging to a
particular single original term of the users input search phrase.

Each user input term of the search phrase
is being processed separately by the suggestion engine. For each
original term, a list of terms will be suggested, either completed terms,
corrected terms or even the exact term if they are known to the engine as they are.

A instance of this class refers to the original unmodified term, as well as
to a list of [SuggestedTerm](dw.suggest.SuggestedTerm.md)s objects representing a single suggested term.



## Property Summary

| Property | Description |
| --- | --- |
| [empty](#empty): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns true if this set of suggested terms is empty. |
| [firstTerm](#firstterm): [SuggestedTerm](dw.suggest.SuggestedTerm.md) `(read-only)` | This method returns the suggested term which is considered best matching  with the original term. |
| [originalTerm](#originalterm): [String](TopLevel.String.md) `(read-only)` | Returns the original term of the user input, for which this instance  provides a list of suggested terms. |
| [terms](#terms): [Iterator](dw.util.Iterator.md) `(read-only)` | Returns the list of [SuggestedTerm](dw.suggest.SuggestedTerm.md)s suggested for the original term. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getFirstTerm](dw.suggest.SuggestedTerms.md#getfirstterm)() | This method returns the suggested term which is considered best matching  with the original term. |
| [getOriginalTerm](dw.suggest.SuggestedTerms.md#getoriginalterm)() | Returns the original term of the user input, for which this instance  provides a list of suggested terms. |
| [getTerms](dw.suggest.SuggestedTerms.md#getterms)() | Returns the list of [SuggestedTerm](dw.suggest.SuggestedTerm.md)s suggested for the original term. |
| [isEmpty](dw.suggest.SuggestedTerms.md#isempty)() | Returns true if this set of suggested terms is empty. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### empty
- empty: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns true if this set of suggested terms is empty.


---

### firstTerm
- firstTerm: [SuggestedTerm](dw.suggest.SuggestedTerm.md) `(read-only)`
  - : This method returns the suggested term which is considered best matching
      with the original term. See [getTerms()](dw.suggest.SuggestedTerms.md#getterms) for a note on ordering of
      suggested terms.


    **See Also:**
    - [getOriginalTerm()](dw.suggest.SuggestedTerms.md#getoriginalterm)
    - [getTerms()](dw.suggest.SuggestedTerms.md#getterms)


---

### originalTerm
- originalTerm: [String](TopLevel.String.md) `(read-only)`
  - : Returns the original term of the user input, for which this instance
      provides a list of suggested terms. Suggested terms can either be corrected,
      or completed or exact matching.



---

### terms
- terms: [Iterator](dw.util.Iterator.md) `(read-only)`
  - : Returns the list of [SuggestedTerm](dw.suggest.SuggestedTerm.md)s suggested for the original term.

    **See Also:**
    - [getOriginalTerm()](dw.suggest.SuggestedTerms.md#getoriginalterm)
    - [isEmpty()](dw.suggest.SuggestedTerms.md#isempty)


---

## Method Details

### getFirstTerm()
- getFirstTerm(): [SuggestedTerm](dw.suggest.SuggestedTerm.md)
  - : This method returns the suggested term which is considered best matching
      with the original term. See [getTerms()](dw.suggest.SuggestedTerms.md#getterms) for a note on ordering of
      suggested terms.


    **Returns:**
    - the best matching term

    **See Also:**
    - [getOriginalTerm()](dw.suggest.SuggestedTerms.md#getoriginalterm)
    - [getTerms()](dw.suggest.SuggestedTerms.md#getterms)


---

### getOriginalTerm()
- getOriginalTerm(): [String](TopLevel.String.md)
  - : Returns the original term of the user input, for which this instance
      provides a list of suggested terms. Suggested terms can either be corrected,
      or completed or exact matching.


    **Returns:**
    - the original unmodified term of the user input search phrase


---

### getTerms()
- getTerms(): [Iterator](dw.util.Iterator.md)
  - : Returns the list of [SuggestedTerm](dw.suggest.SuggestedTerm.md)s suggested for the original term.

    **Returns:**
    - a iterator of suggested terms, might be empty

    **See Also:**
    - [getOriginalTerm()](dw.suggest.SuggestedTerms.md#getoriginalterm)
    - [isEmpty()](dw.suggest.SuggestedTerms.md#isempty)


---

### isEmpty()
- isEmpty(): [Boolean](TopLevel.Boolean.md)
  - : Returns true if this set of suggested terms is empty.

    **Returns:**
    - true if no suggested term is contained in this set, false otherwise


---

<!-- prettier-ignore-end -->
