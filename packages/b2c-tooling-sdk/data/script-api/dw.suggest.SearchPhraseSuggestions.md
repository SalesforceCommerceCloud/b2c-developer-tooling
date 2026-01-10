<!-- prettier-ignore-start -->
# Class SearchPhraseSuggestions

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.suggest.SearchPhraseSuggestions](dw.suggest.SearchPhraseSuggestions.md)

The search phrase suggestions contain a list of suggested search phrases
(see [SuggestedPhrase](dw.suggest.SuggestedPhrase.md))
as well as, for each of the search phrase terms, a list with corrected and
completed alternative terms.



## Property Summary

| Property | Description |
| --- | --- |
| [suggestedPhrases](#suggestedphrases): [Iterator](dw.util.Iterator.md) `(read-only)` | Returns a list of [SuggestedPhrase](dw.suggest.SuggestedPhrase.md) objects that relates to the  user input search phrase. |
| [suggestedTerms](#suggestedterms): [Iterator](dw.util.Iterator.md) `(read-only)` | Returns a list of [SuggestedTerms](dw.suggest.SuggestedTerms.md) objects. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getSuggestedPhrases](dw.suggest.SearchPhraseSuggestions.md#getsuggestedphrases)() | Returns a list of [SuggestedPhrase](dw.suggest.SuggestedPhrase.md) objects that relates to the  user input search phrase. |
| [getSuggestedTerms](dw.suggest.SearchPhraseSuggestions.md#getsuggestedterms)() | Returns a list of [SuggestedTerms](dw.suggest.SuggestedTerms.md) objects. |
| [hasSuggestedPhrases](dw.suggest.SearchPhraseSuggestions.md#hassuggestedphrases)() | Returns whether this suggestions container has any suggested phrases. |
| [hasSuggestedTerms](dw.suggest.SearchPhraseSuggestions.md#hassuggestedterms)() | Returns whether this suggestions container has any suggested terms. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### suggestedPhrases
- suggestedPhrases: [Iterator](dw.util.Iterator.md) `(read-only)`
  - : Returns a list of [SuggestedPhrase](dw.suggest.SuggestedPhrase.md) objects that relates to the
      user input search phrase.


    **See Also:**
    - [hasSuggestedPhrases()](dw.suggest.SearchPhraseSuggestions.md#hassuggestedphrases)


---

### suggestedTerms
- suggestedTerms: [Iterator](dw.util.Iterator.md) `(read-only)`
  - : Returns a list of [SuggestedTerms](dw.suggest.SuggestedTerms.md) objects. Each of the returned
      instances represents a set of terms suggested for a particular single term
      of the user input search phrase.


    **See Also:**
    - [hasSuggestedTerms()](dw.suggest.SearchPhraseSuggestions.md#hassuggestedterms)


---

## Method Details

### getSuggestedPhrases()
- getSuggestedPhrases(): [Iterator](dw.util.Iterator.md)
  - : Returns a list of [SuggestedPhrase](dw.suggest.SuggestedPhrase.md) objects that relates to the
      user input search phrase.


    **Returns:**
    - a list of [SuggestedPhrase](dw.suggest.SuggestedPhrase.md)s

    **See Also:**
    - [hasSuggestedPhrases()](dw.suggest.SearchPhraseSuggestions.md#hassuggestedphrases)


---

### getSuggestedTerms()
- getSuggestedTerms(): [Iterator](dw.util.Iterator.md)
  - : Returns a list of [SuggestedTerms](dw.suggest.SuggestedTerms.md) objects. Each of the returned
      instances represents a set of terms suggested for a particular single term
      of the user input search phrase.


    **Returns:**
    - a list of [SuggestedTerms](dw.suggest.SuggestedTerms.md) for each term of the user input search phrase

    **See Also:**
    - [hasSuggestedTerms()](dw.suggest.SearchPhraseSuggestions.md#hassuggestedterms)


---

### hasSuggestedPhrases()
- hasSuggestedPhrases(): [Boolean](TopLevel.Boolean.md)
  - : Returns whether this suggestions container has any suggested phrases.
      
      
      Note that this method only looks for suggested phrases. It does not account
      for suggested terms.


    **Returns:**
    - true only if there are phrases available


---

### hasSuggestedTerms()
- hasSuggestedTerms(): [Boolean](TopLevel.Boolean.md)
  - : Returns whether this suggestions container has any suggested terms.
      
      
      Note that this method checks suggested terms only,
      but not suggested phrases.


    **Returns:**
    - true only if there are terms available


---

<!-- prettier-ignore-end -->
