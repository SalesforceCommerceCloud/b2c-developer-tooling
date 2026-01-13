<!-- prettier-ignore-start -->
# Class ContentSuggestions

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.suggest.Suggestions](dw.suggest.Suggestions.md)
    - [dw.suggest.ContentSuggestions](dw.suggest.ContentSuggestions.md)

The content suggestion container provides access to
content pages found using the suggested terms as search criteria.
The method [getSuggestedContent()](dw.suggest.ContentSuggestions.md#getsuggestedcontent) can be used to
get the list of found content pages.


Furthermore the list of suggested terms, after processing
the original user input search query, is accessible
through [SearchPhraseSuggestions.getSuggestedTerms()](dw.suggest.SearchPhraseSuggestions.md#getsuggestedterms) method.



## Property Summary

| Property | Description |
| --- | --- |
| [suggestedContent](#suggestedcontent): [Iterator](dw.util.Iterator.md) `(read-only)` | This method returns a list of content pages which were found  using the suggested terms as search criteria. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getSuggestedContent](dw.suggest.ContentSuggestions.md#getsuggestedcontent)() | This method returns a list of content pages which were found  using the suggested terms as search criteria. |

### Methods inherited from class Suggestions

[getSearchPhraseSuggestions](dw.suggest.Suggestions.md#getsearchphrasesuggestions), [getSuggestedPhrases](dw.suggest.Suggestions.md#getsuggestedphrases), [getSuggestedTerms](dw.suggest.Suggestions.md#getsuggestedterms), [hasSuggestedPhrases](dw.suggest.Suggestions.md#hassuggestedphrases), [hasSuggestedTerms](dw.suggest.Suggestions.md#hassuggestedterms), [hasSuggestions](dw.suggest.Suggestions.md#hassuggestions)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### suggestedContent
- suggestedContent: [Iterator](dw.util.Iterator.md) `(read-only)`
  - : This method returns a list of content pages which were found
      using the suggested terms as search criteria.
      The content lookup is being executed in the current library and locale.


    **See Also:**
    - [Suggestions.hasSuggestions()](dw.suggest.Suggestions.md#hassuggestions)


---

## Method Details

### getSuggestedContent()
- getSuggestedContent(): [Iterator](dw.util.Iterator.md)
  - : This method returns a list of content pages which were found
      using the suggested terms as search criteria.
      The content lookup is being executed in the current library and locale.


    **Returns:**
    - a iterator containing a [SuggestedContent](dw.suggest.SuggestedContent.md) instance for
               each found content, the iterator might be empty


    **See Also:**
    - [Suggestions.hasSuggestions()](dw.suggest.Suggestions.md#hassuggestions)


---

<!-- prettier-ignore-end -->
