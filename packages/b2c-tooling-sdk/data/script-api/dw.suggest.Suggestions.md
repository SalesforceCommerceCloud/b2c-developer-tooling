<!-- prettier-ignore-start -->
# Class Suggestions

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.suggest.Suggestions](dw.suggest.Suggestions.md)

This is the base class for suggestions containers.
For each type of items, a sub class provides methods to
access the actual items.


See the sub classes for more specific information.



## All Known Subclasses
[BrandSuggestions](dw.suggest.BrandSuggestions.md), [CategorySuggestions](dw.suggest.CategorySuggestions.md), [ContentSuggestions](dw.suggest.ContentSuggestions.md), [CustomSuggestions](dw.suggest.CustomSuggestions.md), [ProductSuggestions](dw.suggest.ProductSuggestions.md)
## Property Summary

| Property | Description |
| --- | --- |
| [searchPhraseSuggestions](#searchphrasesuggestions): [SearchPhraseSuggestions](dw.suggest.SearchPhraseSuggestions.md) `(read-only)` | Returns the suggested search phrases that are associated to this suggestions. |
| ~~[suggestedPhrases](#suggestedphrases): [Iterator](dw.util.Iterator.md)~~ `(read-only)` | Returns a list of [SuggestedPhrase](dw.suggest.SuggestedPhrase.md) objects that relates to the  user input search phrase. |
| ~~[suggestedTerms](#suggestedterms): [Iterator](dw.util.Iterator.md)~~ `(read-only)` | Returns a list of [SuggestedTerms](dw.suggest.SuggestedTerms.md) objects. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getSearchPhraseSuggestions](dw.suggest.Suggestions.md#getsearchphrasesuggestions)() | Returns the suggested search phrases that are associated to this suggestions. |
| ~~[getSuggestedPhrases](dw.suggest.Suggestions.md#getsuggestedphrases)()~~ | Returns a list of [SuggestedPhrase](dw.suggest.SuggestedPhrase.md) objects that relates to the  user input search phrase. |
| ~~[getSuggestedTerms](dw.suggest.Suggestions.md#getsuggestedterms)()~~ | Returns a list of [SuggestedTerms](dw.suggest.SuggestedTerms.md) objects. |
| ~~[hasSuggestedPhrases](dw.suggest.Suggestions.md#hassuggestedphrases)()~~ | Returns whether this suggestions container has any suggested phrases. |
| ~~[hasSuggestedTerms](dw.suggest.Suggestions.md#hassuggestedterms)()~~ | Returns whether this suggestions container has any suggested terms. |
| [hasSuggestions](dw.suggest.Suggestions.md#hassuggestions)() | Returns whether this suggestions container has any suggested items, i.e. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### searchPhraseSuggestions
- searchPhraseSuggestions: [SearchPhraseSuggestions](dw.suggest.SearchPhraseSuggestions.md) `(read-only)`
  - : Returns the suggested search phrases that are associated to this suggestions.
      
      
      In contrast to the suggested items, the suggested phrases contains the corrected and
      completed versions of the original search phrase.



---

### suggestedPhrases
- ~~suggestedPhrases: [Iterator](dw.util.Iterator.md)~~ `(read-only)`
  - : Returns a list of [SuggestedPhrase](dw.suggest.SuggestedPhrase.md) objects that relates to the
      user input search phrase.


    **See Also:**
    - [hasSuggestedPhrases()](dw.suggest.Suggestions.md#hassuggestedphrases)

    **Deprecated:**
:::warning
Please use method [getSearchPhraseSuggestions()](dw.suggest.Suggestions.md#getsearchphrasesuggestions) to obtain the suggested search phrases.
:::

---

### suggestedTerms
- ~~suggestedTerms: [Iterator](dw.util.Iterator.md)~~ `(read-only)`
  - : Returns a list of [SuggestedTerms](dw.suggest.SuggestedTerms.md) objects. Each of the returned
      instances represents a set of terms suggested for a particular single term
      of the user input search phrase.


    **Deprecated:**
:::warning
Please use method [getSearchPhraseSuggestions()](dw.suggest.Suggestions.md#getsearchphrasesuggestions) to obtain the suggested search phrases.
:::

---

## Method Details

### getSearchPhraseSuggestions()
- getSearchPhraseSuggestions(): [SearchPhraseSuggestions](dw.suggest.SearchPhraseSuggestions.md)
  - : Returns the suggested search phrases that are associated to this suggestions.
      
      
      In contrast to the suggested items, the suggested phrases contains the corrected and
      completed versions of the original search phrase.


    **Returns:**
    - the suggested search phrases for this suggestions


---

### getSuggestedPhrases()
- ~~getSuggestedPhrases(): [Iterator](dw.util.Iterator.md)~~
  - : Returns a list of [SuggestedPhrase](dw.suggest.SuggestedPhrase.md) objects that relates to the
      user input search phrase.


    **Returns:**
    - a list of [SuggestedPhrase](dw.suggest.SuggestedPhrase.md)s

    **See Also:**
    - [hasSuggestedPhrases()](dw.suggest.Suggestions.md#hassuggestedphrases)

    **Deprecated:**
:::warning
Please use method [getSearchPhraseSuggestions()](dw.suggest.Suggestions.md#getsearchphrasesuggestions) to obtain the suggested search phrases.
:::

---

### getSuggestedTerms()
- ~~getSuggestedTerms(): [Iterator](dw.util.Iterator.md)~~
  - : Returns a list of [SuggestedTerms](dw.suggest.SuggestedTerms.md) objects. Each of the returned
      instances represents a set of terms suggested for a particular single term
      of the user input search phrase.


    **Returns:**
    - a list of [SuggestedTerms](dw.suggest.SuggestedTerms.md) for each term of the user input search phrase

    **Deprecated:**
:::warning
Please use method [getSearchPhraseSuggestions()](dw.suggest.Suggestions.md#getsearchphrasesuggestions) to obtain the suggested search phrases.
:::

---

### hasSuggestedPhrases()
- ~~hasSuggestedPhrases(): [Boolean](TopLevel.Boolean.md)~~
  - : Returns whether this suggestions container has any suggested phrases.
      
      
      Note that this method only looks for suggested phrases. It does not account
      for suggested terms or suggested objects. In other words,
      even if there are suggested terms or objects, this method
      will return false if this suggestions container has no phrases.


    **Returns:**
    - true only if there are phrases available

    **Deprecated:**
:::warning
Please use method [getSearchPhraseSuggestions()](dw.suggest.Suggestions.md#getsearchphrasesuggestions) to obtain the suggested search phrases.
:::

---

### hasSuggestedTerms()
- ~~hasSuggestedTerms(): [Boolean](TopLevel.Boolean.md)~~
  - : Returns whether this suggestions container has any suggested terms.
      
      
      Note that this method checks suggested terms only,
      but not suggested phrases or suggested objects.


    **Returns:**
    - true only if there are terms available

    **Deprecated:**
:::warning
Please use method [getSearchPhraseSuggestions()](dw.suggest.Suggestions.md#getsearchphrasesuggestions) to obtain the suggested search phrases.
:::

---

### hasSuggestions()
- hasSuggestions(): [Boolean](TopLevel.Boolean.md)
  - : Returns whether this suggestions container has any suggested items, i.e. products.
      
      
      Note that this method only looks for concrete suggested items. It does not account
      for suggested terms. In other words, even if there are suggested terms, this method
      will return false if no matching items, like products or categories, were found
      for the suggested terms.
      
      
      To find out whether there are suggested terms and how they match with respect to
      the original search phrase, one can use [getSuggestedTerms()](dw.suggest.Suggestions.md#getsuggestedterms) to obtain
      a list of [SuggestedTerms](dw.suggest.SuggestedTerms.md).


    **Returns:**
    - true only if there are items found using the suggested terms

    **See Also:**
    - [getSuggestedTerms()](dw.suggest.Suggestions.md#getsuggestedterms)
    - [SuggestedTerms.isEmpty()](dw.suggest.SuggestedTerms.md#isempty)


---

<!-- prettier-ignore-end -->
