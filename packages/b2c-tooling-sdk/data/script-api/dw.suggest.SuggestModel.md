<!-- prettier-ignore-start -->
# Class SuggestModel

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.suggest.SuggestModel](dw.suggest.SuggestModel.md)

The Suggest model provides methods and functions
to access search suggestions.


The search suggestion feature basically covers two functional areas.
First is just to suggest words, based on the users input,
utilizing spell correction or prediction (also known as auto completion).
The second functional area is also often referred to as search-as-you-type,
where, based on the users input, specific items are
already looked up, before the user actually has completed typing a word
or even fired up the search.


This model combines both functional areas and provides access to both - the
suggested words and the items found while using the predicted words.


This model supports various types of items that are being suggested, like
products, categories, brands, content pages as well merchant provided search phrases.
For each type, there is a [Suggestions](dw.suggest.Suggestions.md) implementation
available and accessible through this model: [ProductSuggestions](dw.suggest.ProductSuggestions.md),
[CategorySuggestions](dw.suggest.CategorySuggestions.md), [BrandSuggestions](dw.suggest.BrandSuggestions.md), [ContentSuggestions](dw.suggest.ContentSuggestions.md),
and [CustomSuggestions](dw.suggest.CustomSuggestions.md).


For each type of suggestions, the actual suggested items (like
products) can by obtained, and, on the other hand, a list of terms
is provided which were used to lookup the found items.
The terms can be used to present a advanced user experience in the
storefront, e.g. show auto completed words, spell corrections and so on.
The SuggestModel script API will always create suggestions with Autocorrections
regardless of the value of "Search Autocorrections" search preference.



## Constant Summary

| Constant | Description |
| --- | --- |
| [MAX_SUGGESTIONS](#max_suggestions): [Number](TopLevel.Number.md) = 10 | The maximum number of suggestions that can be obtain from this model: `10` |

## Property Summary

| Property | Description |
| --- | --- |
| [brandSuggestions](#brandsuggestions): [BrandSuggestions](dw.suggest.BrandSuggestions.md) `(read-only)` | Returns a [BrandSuggestions](dw.suggest.BrandSuggestions.md) container for the current search phrase. |
| [categorySuggestions](#categorysuggestions): [CategorySuggestions](dw.suggest.CategorySuggestions.md) `(read-only)` | Returns a [CategorySuggestions](dw.suggest.CategorySuggestions.md) container for the current search phrase. |
| [contentSuggestions](#contentsuggestions): [ContentSuggestions](dw.suggest.ContentSuggestions.md) `(read-only)` | Returns a [ContentSuggestions](dw.suggest.ContentSuggestions.md) container for the current search phrase. |
| [customSuggestions](#customsuggestions): [CustomSuggestions](dw.suggest.CustomSuggestions.md) `(read-only)` | Returns a [CustomSuggestions](dw.suggest.CustomSuggestions.md) container for the current search phrase. |
| [effectiveSearchMode](#effectivesearchmode): [String](TopLevel.String.md) `(read-only)` | Returns the effective search mode that was used for the last suggestion execution. |
| [filteredByFolder](#filteredbyfolder): [Boolean](TopLevel.Boolean.md) | The method returns true, if the search suggestions are filtered by the folder. |
| [popularSearchPhrases](#popularsearchphrases): [Iterator](dw.util.Iterator.md) `(read-only)` | Use this method to obtain a list of search phrases  that currently are very popular among all users across the Site. |
| [productSuggestions](#productsuggestions): [ProductSuggestions](dw.suggest.ProductSuggestions.md) `(read-only)` | Returns a [ProductSuggestions](dw.suggest.ProductSuggestions.md) container for the current search phrase. |
| [recentSearchPhrases](#recentsearchphrases): [Iterator](dw.util.Iterator.md) `(read-only)` | Use this method to obtain a list of personalized search phrases  that the current user entered recently. |
| [searchMode](#searchmode): [String](TopLevel.String.md) | Returns the search mode that was requested for the next suggestion execution via [setSearchMode(String)](dw.suggest.SuggestModel.md#setsearchmodestring),  or {@code null} if no mode was explicitly requested. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [SuggestModel](#suggestmodel)() | Constructs a new SuggestModel. |

## Method Summary

| Method | Description |
| --- | --- |
| [addRefinementValues](dw.suggest.SuggestModel.md#addrefinementvaluesstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Adds a refinement for product suggestions. |
| [getBrandSuggestions](dw.suggest.SuggestModel.md#getbrandsuggestions)() | Returns a [BrandSuggestions](dw.suggest.BrandSuggestions.md) container for the current search phrase. |
| [getCategorySuggestions](dw.suggest.SuggestModel.md#getcategorysuggestions)() | Returns a [CategorySuggestions](dw.suggest.CategorySuggestions.md) container for the current search phrase. |
| [getContentSuggestions](dw.suggest.SuggestModel.md#getcontentsuggestions)() | Returns a [ContentSuggestions](dw.suggest.ContentSuggestions.md) container for the current search phrase. |
| [getCustomSuggestions](dw.suggest.SuggestModel.md#getcustomsuggestions)() | Returns a [CustomSuggestions](dw.suggest.CustomSuggestions.md) container for the current search phrase. |
| [getEffectiveSearchMode](dw.suggest.SuggestModel.md#geteffectivesearchmode)() | Returns the effective search mode that was used for the last suggestion execution. |
| [getPopularSearchPhrases](dw.suggest.SuggestModel.md#getpopularsearchphrases)() | Use this method to obtain a list of search phrases  that currently are very popular among all users across the Site. |
| [getProductSuggestions](dw.suggest.SuggestModel.md#getproductsuggestions)() | Returns a [ProductSuggestions](dw.suggest.ProductSuggestions.md) container for the current search phrase. |
| [getRecentSearchPhrases](dw.suggest.SuggestModel.md#getrecentsearchphrases)() | Use this method to obtain a list of personalized search phrases  that the current user entered recently. |
| [getSearchMode](dw.suggest.SuggestModel.md#getsearchmode)() | Returns the search mode that was requested for the next suggestion execution via [setSearchMode(String)](dw.suggest.SuggestModel.md#setsearchmodestring),  or {@code null} if no mode was explicitly requested. |
| [isFilteredByFolder](dw.suggest.SuggestModel.md#isfilteredbyfolder)() | The method returns true, if the search suggestions are filtered by the folder. |
| [removeRefinementValues](dw.suggest.SuggestModel.md#removerefinementvaluesstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Removes a refinement. |
| [setCategoryID](dw.suggest.SuggestModel.md#setcategoryidstring)([String](TopLevel.String.md)) | Apply a category ID to filter product, brand and category suggestions. |
| [setFilteredByFolder](dw.suggest.SuggestModel.md#setfilteredbyfolderboolean)([Boolean](TopLevel.Boolean.md)) | Set a flag to indicate if the search suggestions filter for elements that do not belong to a folder. |
| [setMaxSuggestions](dw.suggest.SuggestModel.md#setmaxsuggestionsnumber)([Number](TopLevel.Number.md)) | Use this method to setup the maximum number of returned suggested  items. |
| [setRefinementValues](dw.suggest.SuggestModel.md#setrefinementvaluesstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Sets product suggestion refinement values for an attribute. |
| [setSearchMode](dw.suggest.SuggestModel.md#setsearchmodestring)([String](TopLevel.String.md)) | Sets the search mode for the next suggestion execution. |
| [setSearchPhrase](dw.suggest.SuggestModel.md#setsearchphrasestring)([String](TopLevel.String.md)) | Sets the user input search phrase. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### MAX_SUGGESTIONS

- MAX_SUGGESTIONS: [Number](TopLevel.Number.md) = 10
  - : The maximum number of suggestions that can be obtain from this model: `10`


---

## Property Details

### brandSuggestions
- brandSuggestions: [BrandSuggestions](dw.suggest.BrandSuggestions.md) `(read-only)`
  - : Returns a [BrandSuggestions](dw.suggest.BrandSuggestions.md) container for the current search phrase.
      The [BrandSuggestions](dw.suggest.BrandSuggestions.md) container provides access to the found brands (if any) and
      the terms suggested by the system with respect to the known product brands in the catalog.


    **See Also:**
    - [setMaxSuggestions(Number)](dw.suggest.SuggestModel.md#setmaxsuggestionsnumber)
    - [setSearchPhrase(String)](dw.suggest.SuggestModel.md#setsearchphrasestring)


---

### categorySuggestions
- categorySuggestions: [CategorySuggestions](dw.suggest.CategorySuggestions.md) `(read-only)`
  - : Returns a [CategorySuggestions](dw.suggest.CategorySuggestions.md) container for the current search phrase.
      The [CategorySuggestions](dw.suggest.CategorySuggestions.md) container provides access to the found categories (if any) and
      the terms suggested by the system with respect to the known categories in the catalog.


    **See Also:**
    - [setMaxSuggestions(Number)](dw.suggest.SuggestModel.md#setmaxsuggestionsnumber)
    - [setSearchPhrase(String)](dw.suggest.SuggestModel.md#setsearchphrasestring)


---

### contentSuggestions
- contentSuggestions: [ContentSuggestions](dw.suggest.ContentSuggestions.md) `(read-only)`
  - : Returns a [ContentSuggestions](dw.suggest.ContentSuggestions.md) container for the current search phrase.
      The [ContentSuggestions](dw.suggest.ContentSuggestions.md) container provides access to the found content pages (if any) and
      the terms suggested by the system with respect to the known content in the library.


    **See Also:**
    - [setMaxSuggestions(Number)](dw.suggest.SuggestModel.md#setmaxsuggestionsnumber)
    - [setSearchPhrase(String)](dw.suggest.SuggestModel.md#setsearchphrasestring)


---

### customSuggestions
- customSuggestions: [CustomSuggestions](dw.suggest.CustomSuggestions.md) `(read-only)`
  - : Returns a [CustomSuggestions](dw.suggest.CustomSuggestions.md) container for the current search phrase.
      The [CustomSuggestions](dw.suggest.CustomSuggestions.md) container provides access to matching
      custom phrases (if any) and the terms suggested
      by the system with respect to the merchant provided custom phrases.


    **See Also:**
    - [setMaxSuggestions(Number)](dw.suggest.SuggestModel.md#setmaxsuggestionsnumber)
    - [setSearchPhrase(String)](dw.suggest.SuggestModel.md#setsearchphrasestring)


---

### effectiveSearchMode
- effectiveSearchMode: [String](TopLevel.String.md) `(read-only)`
  - : Returns the effective search mode that was used for the last suggestion execution. This reflects the actual
      matching approach that ran, which may differ from the requested mode if a fallback occurred. Returns {@code null}
      if no suggestions have been executed yet.



---

### filteredByFolder
- filteredByFolder: [Boolean](TopLevel.Boolean.md)
  - : The method returns true, if the search suggestions are filtered by the folder. If this returns true it is not
      possible for search suggestions to contain Page Designer content as it belongs to no folder.



---

### popularSearchPhrases
- popularSearchPhrases: [Iterator](dw.util.Iterator.md) `(read-only)`
  - : Use this method to obtain a list of search phrases
      that currently are very popular among all users across the Site.
      
      The search phrases are specific to the region (based on user's IP address),
      language (locale) and the user's browser type (agent).



---

### productSuggestions
- productSuggestions: [ProductSuggestions](dw.suggest.ProductSuggestions.md) `(read-only)`
  - : Returns a [ProductSuggestions](dw.suggest.ProductSuggestions.md) container for the current search phrase.
      The [ProductSuggestions](dw.suggest.ProductSuggestions.md) container provides access to the found products (if any) and
      the terms suggested by the system with respect to the known products in the catalog.


    **See Also:**
    - [setMaxSuggestions(Number)](dw.suggest.SuggestModel.md#setmaxsuggestionsnumber)
    - [setSearchPhrase(String)](dw.suggest.SuggestModel.md#setsearchphrasestring)


---

### recentSearchPhrases
- recentSearchPhrases: [Iterator](dw.util.Iterator.md) `(read-only)`
  - : Use this method to obtain a list of personalized search phrases
      that the current user entered recently.
      
      The user is being identified by the CQuotient tracking cookie.



---

### searchMode
- searchMode: [String](TopLevel.String.md)
  - : Returns the search mode that was requested for the next suggestion execution via [setSearchMode(String)](dw.suggest.SuggestModel.md#setsearchmodestring),
      or {@code null} if no mode was explicitly requested. This reflects the caller's requested preference, not the
      mode that actually ran — the requested mode is non-authoritative and {@code "semantic"} may still be demoted to
      {@code "lexical"} by the search router. Use [getEffectiveSearchMode()](dw.suggest.SuggestModel.md#geteffectivesearchmode) to obtain the mode that was
      actually used.



---

## Constructor Details

### SuggestModel()
- SuggestModel()
  - : Constructs a new SuggestModel.


---

## Method Details

### addRefinementValues(String, String)
- addRefinementValues(attributeID: [String](TopLevel.String.md), values: [String](TopLevel.String.md)): void
  - : Adds a refinement for product suggestions.
      The method can be called to add an additional query
      parameter specified as name-value pair. The values string may encode
      multiple values delimited by the pipe symbol ('|').


    **Parameters:**
    - attributeID - The ID of the refinement attribute.
    - values - the refinement value to set


---

### getBrandSuggestions()
- getBrandSuggestions(): [BrandSuggestions](dw.suggest.BrandSuggestions.md)
  - : Returns a [BrandSuggestions](dw.suggest.BrandSuggestions.md) container for the current search phrase.
      The [BrandSuggestions](dw.suggest.BrandSuggestions.md) container provides access to the found brands (if any) and
      the terms suggested by the system with respect to the known product brands in the catalog.


    **Returns:**
    - a brand suggestions container for the current search phrase,
               returns `null` for insufficient search input


    **See Also:**
    - [setMaxSuggestions(Number)](dw.suggest.SuggestModel.md#setmaxsuggestionsnumber)
    - [setSearchPhrase(String)](dw.suggest.SuggestModel.md#setsearchphrasestring)


---

### getCategorySuggestions()
- getCategorySuggestions(): [CategorySuggestions](dw.suggest.CategorySuggestions.md)
  - : Returns a [CategorySuggestions](dw.suggest.CategorySuggestions.md) container for the current search phrase.
      The [CategorySuggestions](dw.suggest.CategorySuggestions.md) container provides access to the found categories (if any) and
      the terms suggested by the system with respect to the known categories in the catalog.


    **Returns:**
    - a category suggestions container for the current search phrase,
               returns `null` for insufficient search input


    **See Also:**
    - [setMaxSuggestions(Number)](dw.suggest.SuggestModel.md#setmaxsuggestionsnumber)
    - [setSearchPhrase(String)](dw.suggest.SuggestModel.md#setsearchphrasestring)


---

### getContentSuggestions()
- getContentSuggestions(): [ContentSuggestions](dw.suggest.ContentSuggestions.md)
  - : Returns a [ContentSuggestions](dw.suggest.ContentSuggestions.md) container for the current search phrase.
      The [ContentSuggestions](dw.suggest.ContentSuggestions.md) container provides access to the found content pages (if any) and
      the terms suggested by the system with respect to the known content in the library.


    **Returns:**
    - a content suggestions container for the current search phrase,
               returns `null` for insufficient search input


    **See Also:**
    - [setMaxSuggestions(Number)](dw.suggest.SuggestModel.md#setmaxsuggestionsnumber)
    - [setSearchPhrase(String)](dw.suggest.SuggestModel.md#setsearchphrasestring)


---

### getCustomSuggestions()
- getCustomSuggestions(): [CustomSuggestions](dw.suggest.CustomSuggestions.md)
  - : Returns a [CustomSuggestions](dw.suggest.CustomSuggestions.md) container for the current search phrase.
      The [CustomSuggestions](dw.suggest.CustomSuggestions.md) container provides access to matching
      custom phrases (if any) and the terms suggested
      by the system with respect to the merchant provided custom phrases.


    **Returns:**
    - a custom suggestions container for the current search phrase,
               returns `null` for insufficient search input


    **See Also:**
    - [setMaxSuggestions(Number)](dw.suggest.SuggestModel.md#setmaxsuggestionsnumber)
    - [setSearchPhrase(String)](dw.suggest.SuggestModel.md#setsearchphrasestring)


---

### getEffectiveSearchMode()
- getEffectiveSearchMode(): [String](TopLevel.String.md)
  - : Returns the effective search mode that was used for the last suggestion execution. This reflects the actual
      matching approach that ran, which may differ from the requested mode if a fallback occurred. Returns {@code null}
      if no suggestions have been executed yet.


    **Returns:**
    - {@code "semantic"} if the query ran against the external search provider, {@code "lexical"} if it ran
              against the native search, or {@code null} if no suggestions have been executed yet



---

### getPopularSearchPhrases()
- getPopularSearchPhrases(): [Iterator](dw.util.Iterator.md)
  - : Use this method to obtain a list of search phrases
      that currently are very popular among all users across the Site.
      
      The search phrases are specific to the region (based on user's IP address),
      language (locale) and the user's browser type (agent).


    **Returns:**
    - a list of personalized popular search phrases


---

### getProductSuggestions()
- getProductSuggestions(): [ProductSuggestions](dw.suggest.ProductSuggestions.md)
  - : Returns a [ProductSuggestions](dw.suggest.ProductSuggestions.md) container for the current search phrase.
      The [ProductSuggestions](dw.suggest.ProductSuggestions.md) container provides access to the found products (if any) and
      the terms suggested by the system with respect to the known products in the catalog.


    **Returns:**
    - a product suggestions container for the current search phrase,
               returns `null` for insufficient search input


    **See Also:**
    - [setMaxSuggestions(Number)](dw.suggest.SuggestModel.md#setmaxsuggestionsnumber)
    - [setSearchPhrase(String)](dw.suggest.SuggestModel.md#setsearchphrasestring)


---

### getRecentSearchPhrases()
- getRecentSearchPhrases(): [Iterator](dw.util.Iterator.md)
  - : Use this method to obtain a list of personalized search phrases
      that the current user entered recently.
      
      The user is being identified by the CQuotient tracking cookie.


    **Returns:**
    - a list of recent search phrases of the current user


---

### getSearchMode()
- getSearchMode(): [String](TopLevel.String.md)
  - : Returns the search mode that was requested for the next suggestion execution via [setSearchMode(String)](dw.suggest.SuggestModel.md#setsearchmodestring),
      or {@code null} if no mode was explicitly requested. This reflects the caller's requested preference, not the
      mode that actually ran — the requested mode is non-authoritative and {@code "semantic"} may still be demoted to
      {@code "lexical"} by the search router. Use [getEffectiveSearchMode()](dw.suggest.SuggestModel.md#geteffectivesearchmode) to obtain the mode that was
      actually used.


    **Returns:**
    - {@code "semantic"} or {@code "lexical"} if a mode was requested, or {@code null} if no mode was requested


---

### isFilteredByFolder()
- isFilteredByFolder(): [Boolean](TopLevel.Boolean.md)
  - : The method returns true, if the search suggestions are filtered by the folder. If this returns true it is not
      possible for search suggestions to contain Page Designer content as it belongs to no folder.


    **Returns:**
    - True if search suggestions are filtered by the folder of the content asset.


---

### removeRefinementValues(String, String)
- removeRefinementValues(attributeID: [String](TopLevel.String.md), values: [String](TopLevel.String.md)): void
  - : Removes a refinement. The method can be called to remove previously added
      refinement values. The values string may encode multiple values delimited
      by the pipe symbol ('|').


    **Parameters:**
    - attributeID - The ID of the refinement attribute.
    - values - the refinement value to remove or null to remove all values


---

### setCategoryID(String)
- setCategoryID(categoryID: [String](TopLevel.String.md)): void
  - : Apply a category ID to filter product, brand and category suggestions.
      
      
      Suggested products, brands and categories, as well as corrected and completed
      terms are specific to the given category or one of it's sub categories.
      
      
      For example, in the specified category "television", the search term "pla"
      will be auto completed to "plasma" (instead of e.g. "player") and
      only televisions will be included in the list of suggested products.


    **Parameters:**
    - categoryID - the category to filter suggestions for


---

### setFilteredByFolder(Boolean)
- setFilteredByFolder(filteredByFolder: [Boolean](TopLevel.Boolean.md)): void
  - : Set a flag to indicate if the search suggestions filter for elements that do not belong to a folder.
      Must be set to false to return content assets that do not belong to any folder.


    **Parameters:**
    - filteredByFolder - filter the search suggestions by folder


---

### setMaxSuggestions(Number)
- setMaxSuggestions(maxSuggestions: [Number](TopLevel.Number.md)): void
  - : Use this method to setup the maximum number of returned suggested
      items. For example, set this to 3 in order to only retrieve the
      3 most relevant suggested products.
      
      
      The maximum number of suggestions that can be queried are defined as [MAX_SUGGESTIONS](dw.suggest.SuggestModel.md#max_suggestions).


    **Parameters:**
    - maxSuggestions - the number of suggested items to be returned by this model instance


---

### setRefinementValues(String, String)
- setRefinementValues(attributeID: [String](TopLevel.String.md), values: [String](TopLevel.String.md)): void
  - : Sets product suggestion refinement values for an attribute.
      The method can be called to set
      an additional query parameter specified as name-value pair. The value
      string may encode multiple values delimited by the pipe symbol ('|').
      Existing refinement values for the attribute will be removed.


    **Parameters:**
    - attributeID - The ID of the refinement attribute.
    - values - the refinement values to set (delimited by '|') or null to             remove all values


---

### setSearchMode(String)
- setSearchMode(mode: [String](TopLevel.String.md)): void
  - : Sets the search mode for the next suggestion execution. The mode influences the routing decision made by the
      search router, but is non-authoritative — {@code "semantic"} still runs the full routing cascade and may be
      demoted to {@code "lexical"} based on availability and query characteristics.


    **Parameters:**
    - mode - the search mode to request, either {@code "semantic"} or {@code "lexical"}

    **Throws:**
    - IllegalArgumentException - if the mode is not one of the allowed values


---

### setSearchPhrase(String)
- setSearchPhrase(searchPhrase: [String](TopLevel.String.md)): void
  - : Sets the user input search phrase. This search phrase is being processed
      by applying auto completion, spell correction and enhancement with alternative
      similar search terms.
      
      
      The resulting search phrase is used to lookup the actual items,
      like products or categories (search-as-you-type).
      
      
      In order to access the processed terms, one can use the
      [SearchPhraseSuggestions.getSuggestedTerms()](dw.suggest.SearchPhraseSuggestions.md#getsuggestedterms) method of each of the respective
      results returned by the methods in this model.


    **Parameters:**
    - searchPhrase - the user input search phrase

    **See Also:**
    - [SearchPhraseSuggestions.getSuggestedTerms()](dw.suggest.SearchPhraseSuggestions.md#getsuggestedterms)


---

<!-- prettier-ignore-end -->
