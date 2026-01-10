<!-- prettier-ignore-start -->
# Class ProductSuggestions

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.suggest.Suggestions](dw.suggest.Suggestions.md)
    - [dw.suggest.ProductSuggestions](dw.suggest.ProductSuggestions.md)

The product suggestion container provides access to
products found using the suggested terms.
The method [getSuggestedProducts()](dw.suggest.ProductSuggestions.md#getsuggestedproducts) can be used to
get the list of found products.


Furthermore the list of suggested terms, after processing
the original user input search query, is accessible
through [SearchPhraseSuggestions.getSuggestedTerms()](dw.suggest.SearchPhraseSuggestions.md#getsuggestedterms) method.



## Property Summary

| Property | Description |
| --- | --- |
| [suggestedProducts](#suggestedproducts): [Iterator](dw.util.Iterator.md) `(read-only)` | This method returns a list of products which were found  using the suggested terms as search criteria. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getSuggestedProducts](dw.suggest.ProductSuggestions.md#getsuggestedproducts)() | This method returns a list of products which were found  using the suggested terms as search criteria. |

### Methods inherited from class Suggestions

[getSearchPhraseSuggestions](dw.suggest.Suggestions.md#getsearchphrasesuggestions), [getSuggestedPhrases](dw.suggest.Suggestions.md#getsuggestedphrases), [getSuggestedTerms](dw.suggest.Suggestions.md#getsuggestedterms), [hasSuggestedPhrases](dw.suggest.Suggestions.md#hassuggestedphrases), [hasSuggestedTerms](dw.suggest.Suggestions.md#hassuggestedterms), [hasSuggestions](dw.suggest.Suggestions.md#hassuggestions)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### suggestedProducts
- suggestedProducts: [Iterator](dw.util.Iterator.md) `(read-only)`
  - : This method returns a list of products which were found
      using the suggested terms as search criteria.
      The product lookup is being executed in the current catalog and locale.


    **See Also:**
    - [Suggestions.hasSuggestions()](dw.suggest.Suggestions.md#hassuggestions)


---

## Method Details

### getSuggestedProducts()
- getSuggestedProducts(): [Iterator](dw.util.Iterator.md)
  - : This method returns a list of products which were found
      using the suggested terms as search criteria.
      The product lookup is being executed in the current catalog and locale.


    **Returns:**
    - a iterator containing a [SuggestedProduct](dw.suggest.SuggestedProduct.md) instance for
               each found product, the iterator might be empty


    **See Also:**
    - [Suggestions.hasSuggestions()](dw.suggest.Suggestions.md#hassuggestions)


---

<!-- prettier-ignore-end -->
