<!-- prettier-ignore-start -->
# Class ContentSearchModel

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.catalog.SearchModel](dw.catalog.SearchModel.md)
    - [dw.content.ContentSearchModel](dw.content.ContentSearchModel.md)

The class is the central interface to a content search result and a content
search refinement. It also provides utility methods to generate a search URL.



## Constant Summary

| Constant | Description |
| --- | --- |
| [CONTENTID_PARAMETER](#contentid_parameter): [String](TopLevel.String.md) = "cid" | URL Parameter for the content ID |
| [FOLDERID_PARAMETER](#folderid_parameter): [String](TopLevel.String.md) = "fdid" | URL Parameter for the folder ID |

## Property Summary

| Property | Description |
| --- | --- |
| [content](#content): [Iterator](dw.util.Iterator.md) `(read-only)` | Returns an Iterator containing all Content Assets that are the result of the  search. |
| [contentID](#contentid): [String](TopLevel.String.md) | Returns the content ID against which the search results apply. |
| [deepestCommonFolder](#deepestcommonfolder): [Folder](dw.content.Folder.md) `(read-only)` | Returns the deepest common folder of all content assets in the search result. |
| [filteredByFolder](#filteredbyfolder): [Boolean](TopLevel.Boolean.md) | The method returns true, if the content search result is filtered by the folder and it is not subsequently  possible to search for content assets that belong to no folder (e.g. |
| [folder](#folder): [Folder](dw.content.Folder.md) `(read-only)` | Returns the folder against which the search results apply. |
| [folderID](#folderid): [String](TopLevel.String.md) | Returns the folder ID against which the search results apply. |
| [folderSearch](#foldersearch): [Boolean](TopLevel.Boolean.md) `(read-only)` | The method returns true, if this is a pure search for a folder. |
| [pageMetaTags](#pagemetatags): [Array](TopLevel.Array.md) `(read-only)` | Returns all page meta tags, defined for this instance for which content can be generated. |
| [recursiveFolderSearch](#recursivefoldersearch): [Boolean](TopLevel.Boolean.md) | Get the flag that determines if the folder search will  be recursive. |
| [refinedByFolder](#refinedbyfolder): [Boolean](TopLevel.Boolean.md) `(read-only)` | The method returns true, if the search is refined by a folder. |
| [refinedFolderSearch](#refinedfoldersearch): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if this is a folder search and is refined with further  criteria, like a name refinement or an attribute refinement. |
| [refinements](#refinements): [ContentSearchRefinements](dw.content.ContentSearchRefinements.md) `(read-only)` | Returns the set of search refinements used in this search. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [ContentSearchModel](#contentsearchmodel)() | Constructs a new ContentSearchModel. |

## Method Summary

| Method | Description |
| --- | --- |
| [getContent](dw.content.ContentSearchModel.md#getcontent)() | Returns an Iterator containing all Content Assets that are the result of the  search. |
| [getContentID](dw.content.ContentSearchModel.md#getcontentid)() | Returns the content ID against which the search results apply. |
| [getDeepestCommonFolder](dw.content.ContentSearchModel.md#getdeepestcommonfolder)() | Returns the deepest common folder of all content assets in the search result. |
| [getFolder](dw.content.ContentSearchModel.md#getfolder)() | Returns the folder against which the search results apply. |
| [getFolderID](dw.content.ContentSearchModel.md#getfolderid)() | Returns the folder ID against which the search results apply. |
| [getPageMetaTag](dw.content.ContentSearchModel.md#getpagemetatagstring)([String](TopLevel.String.md)) | Returns the page meta tag for the specified id. |
| [getPageMetaTags](dw.content.ContentSearchModel.md#getpagemetatags)() | Returns all page meta tags, defined for this instance for which content can be generated. |
| [getRefinements](dw.content.ContentSearchModel.md#getrefinements)() | Returns the set of search refinements used in this search. |
| [isFilteredByFolder](dw.content.ContentSearchModel.md#isfilteredbyfolder)() | The method returns true, if the content search result is filtered by the folder and it is not subsequently  possible to search for content assets that belong to no folder (e.g. |
| [isFolderSearch](dw.content.ContentSearchModel.md#isfoldersearch)() | The method returns true, if this is a pure search for a folder. |
| [isRecursiveFolderSearch](dw.content.ContentSearchModel.md#isrecursivefoldersearch)() | Get the flag that determines if the folder search will  be recursive. |
| [isRefinedByFolder](dw.content.ContentSearchModel.md#isrefinedbyfolder)() | The method returns true, if the search is refined by a folder. |
| [isRefinedFolderSearch](dw.content.ContentSearchModel.md#isrefinedfoldersearch)() | Identifies if this is a folder search and is refined with further  criteria, like a name refinement or an attribute refinement. |
| [search](dw.content.ContentSearchModel.md#search)() | Execute the search. |
| [setContentID](dw.content.ContentSearchModel.md#setcontentidstring)([String](TopLevel.String.md)) | Sets the contentID used in this search. |
| [setFilteredByFolder](dw.content.ContentSearchModel.md#setfilteredbyfolderboolean)([Boolean](TopLevel.Boolean.md)) | Set a flag to indicate if the search is filtered by the folder. |
| [setFolderID](dw.content.ContentSearchModel.md#setfolderidstring)([String](TopLevel.String.md)) | Sets the folderID used in this search. |
| [setRecursiveFolderSearch](dw.content.ContentSearchModel.md#setrecursivefoldersearchboolean)([Boolean](TopLevel.Boolean.md)) | Set a flag to indicate if the search in folder should be recursive. |
| static [urlForContent](dw.content.ContentSearchModel.md#urlforcontenturl-string)([URL](dw.web.URL.md), [String](TopLevel.String.md)) | Returns an URL that you can use to execute a query for a specific  Content. |
| static [urlForContent](dw.content.ContentSearchModel.md#urlforcontentstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Returns an URL that you can use to execute a query for a specific  Content. |
| static [urlForFolder](dw.content.ContentSearchModel.md#urlforfolderurl-string)([URL](dw.web.URL.md), [String](TopLevel.String.md)) | Returns an URL that you can use to execute a query for a specific  Folder. |
| static [urlForFolder](dw.content.ContentSearchModel.md#urlforfolderstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Returns an URL that you can use to execute a query for a specific  Folder. |
| static [urlForRefine](dw.content.ContentSearchModel.md#urlforrefineurl-string-string)([URL](dw.web.URL.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Returns an URL that you can use to execute a query for a specific  attribute name-value pair. |
| static [urlForRefine](dw.content.ContentSearchModel.md#urlforrefinestring-string-string)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Returns an URL that you can use to execute a query for a specific  attribute name-value pair. |
| [urlRefineFolder](dw.content.ContentSearchModel.md#urlrefinefolderurl-string)([URL](dw.web.URL.md), [String](TopLevel.String.md)) | Returns an URL that you can use to re-execute the query using the  specified URL and folder refinement. |
| [urlRefineFolder](dw.content.ContentSearchModel.md#urlrefinefolderstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Returns an URL that you can use to re-execute the query using the  specified pipeline action and folder refinement. |
| [urlRelaxFolder](dw.content.ContentSearchModel.md#urlrelaxfolderurl)([URL](dw.web.URL.md)) | Returns an URL that you can use to re-execute the query with no folder  refinement. |
| [urlRelaxFolder](dw.content.ContentSearchModel.md#urlrelaxfolderstring)([String](TopLevel.String.md)) | Returns an URL that you can use to re-execute the query with no folder  refinement. |

### Methods inherited from class SearchModel

[addRefinementValues](dw.catalog.SearchModel.md#addrefinementvaluesstring-string), [canRelax](dw.catalog.SearchModel.md#canrelax), [getCount](dw.catalog.SearchModel.md#getcount), [getRefinementMaxValue](dw.catalog.SearchModel.md#getrefinementmaxvaluestring), [getRefinementMinValue](dw.catalog.SearchModel.md#getrefinementminvaluestring), [getRefinementValue](dw.catalog.SearchModel.md#getrefinementvaluestring), [getRefinementValues](dw.catalog.SearchModel.md#getrefinementvaluesstring), [getSearchPhrase](dw.catalog.SearchModel.md#getsearchphrase), [getSearchRedirect](dw.catalog.SearchModel.md#getsearchredirectstring), [getSortingCondition](dw.catalog.SearchModel.md#getsortingconditionstring), [isEmptyQuery](dw.catalog.SearchModel.md#isemptyquery), [isRefinedByAttribute](dw.catalog.SearchModel.md#isrefinedbyattribute), [isRefinedByAttribute](dw.catalog.SearchModel.md#isrefinedbyattributestring), [isRefinedByAttributeValue](dw.catalog.SearchModel.md#isrefinedbyattributevaluestring-string), [isRefinedSearch](dw.catalog.SearchModel.md#isrefinedsearch), [isRefinementByValueRange](dw.catalog.SearchModel.md#isrefinementbyvaluerangestring), [isRefinementByValueRange](dw.catalog.SearchModel.md#isrefinementbyvaluerangestring-string-string), [removeRefinementValues](dw.catalog.SearchModel.md#removerefinementvaluesstring-string), [search](dw.catalog.SearchModel.md#search), [setRefinementValueRange](dw.catalog.SearchModel.md#setrefinementvaluerangestring-string-string), [setRefinementValues](dw.catalog.SearchModel.md#setrefinementvaluesstring-string), [setSearchPhrase](dw.catalog.SearchModel.md#setsearchphrasestring), [setSortingCondition](dw.catalog.SearchModel.md#setsortingconditionstring-number), [url](dw.catalog.SearchModel.md#urlurl), [url](dw.catalog.SearchModel.md#urlstring), [urlDefaultSort](dw.catalog.SearchModel.md#urldefaultsorturl), [urlDefaultSort](dw.catalog.SearchModel.md#urldefaultsortstring), [urlRefineAttribute](dw.catalog.SearchModel.md#urlrefineattributeurl-string-string), [urlRefineAttribute](dw.catalog.SearchModel.md#urlrefineattributestring-string-string), [urlRefineAttributeValue](dw.catalog.SearchModel.md#urlrefineattributevalueurl-string-string), [urlRefineAttributeValue](dw.catalog.SearchModel.md#urlrefineattributevaluestring-string-string), [urlRefineAttributeValueRange](dw.catalog.SearchModel.md#urlrefineattributevaluerangestring-string-string-string), [urlRelaxAttribute](dw.catalog.SearchModel.md#urlrelaxattributeurl-string), [urlRelaxAttribute](dw.catalog.SearchModel.md#urlrelaxattributestring-string), [urlRelaxAttributeValue](dw.catalog.SearchModel.md#urlrelaxattributevalueurl-string-string), [urlRelaxAttributeValue](dw.catalog.SearchModel.md#urlrelaxattributevaluestring-string-string), [urlSort](dw.catalog.SearchModel.md#urlsorturl-string-number), [urlSort](dw.catalog.SearchModel.md#urlsortstring-string-number)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### CONTENTID_PARAMETER

- CONTENTID_PARAMETER: [String](TopLevel.String.md) = "cid"
  - : URL Parameter for the content ID


---

### FOLDERID_PARAMETER

- FOLDERID_PARAMETER: [String](TopLevel.String.md) = "fdid"
  - : URL Parameter for the folder ID


---

## Property Details

### content
- content: [Iterator](dw.util.Iterator.md) `(read-only)`
  - : Returns an Iterator containing all Content Assets that are the result of the
      search.



---

### contentID
- contentID: [String](TopLevel.String.md)
  - : Returns the content ID against which the search results apply.


---

### deepestCommonFolder
- deepestCommonFolder: [Folder](dw.content.Folder.md) `(read-only)`
  - : Returns the deepest common folder of all content assets in the search result.


---

### filteredByFolder
- filteredByFolder: [Boolean](TopLevel.Boolean.md)
  - : The method returns true, if the content search result is filtered by the folder and it is not subsequently
      possible to search for content assets that belong to no folder (e.g. those for Page Designer).



---

### folder
- folder: [Folder](dw.content.Folder.md) `(read-only)`
  - : Returns the folder against which the search results apply.


---

### folderID
- folderID: [String](TopLevel.String.md)
  - : Returns the folder ID against which the search results apply.


---

### folderSearch
- folderSearch: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : The method returns true, if this is a pure search for a folder. The
      method checks, that a folder ID is specified and no search phrase is
      specified.



---

### pageMetaTags
- pageMetaTags: [Array](TopLevel.Array.md) `(read-only)`
  - : Returns all page meta tags, defined for this instance for which content can be generated.
      
      
      The meta tag content is generated based on the content listing page meta tag context and rules.
      The rules are obtained from the current folder context or inherited from the parent folder,
      up to the root folder.



---

### recursiveFolderSearch
- recursiveFolderSearch: [Boolean](TopLevel.Boolean.md)
  - : Get the flag that determines if the folder search will
      be recursive.



---

### refinedByFolder
- refinedByFolder: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : The method returns true, if the search is refined by a folder.
      The method checks, that a folder ID is specified.



---

### refinedFolderSearch
- refinedFolderSearch: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if this is a folder search and is refined with further
      criteria, like a name refinement or an attribute refinement.



---

### refinements
- refinements: [ContentSearchRefinements](dw.content.ContentSearchRefinements.md) `(read-only)`
  - : Returns the set of search refinements used in this search.


---

## Constructor Details

### ContentSearchModel()
- ContentSearchModel()
  - : Constructs a new ContentSearchModel.


---

## Method Details

### getContent()
- getContent(): [Iterator](dw.util.Iterator.md)
  - : Returns an Iterator containing all Content Assets that are the result of the
      search.


    **Returns:**
    - an Iterator containing all Content Assets that are the result of the
              search.



---

### getContentID()
- getContentID(): [String](TopLevel.String.md)
  - : Returns the content ID against which the search results apply.

    **Returns:**
    - the content ID against which the search results apply.


---

### getDeepestCommonFolder()
- getDeepestCommonFolder(): [Folder](dw.content.Folder.md)
  - : Returns the deepest common folder of all content assets in the search result.

    **Returns:**
    - the deepest common folder of all content assets in the search result of this search model.


---

### getFolder()
- getFolder(): [Folder](dw.content.Folder.md)
  - : Returns the folder against which the search results apply.

    **Returns:**
    - the folder against which the search results apply.


---

### getFolderID()
- getFolderID(): [String](TopLevel.String.md)
  - : Returns the folder ID against which the search results apply.

    **Returns:**
    - the folder ID against which the search results apply.


---

### getPageMetaTag(String)
- getPageMetaTag(id: [String](TopLevel.String.md)): [PageMetaTag](dw.web.PageMetaTag.md)
  - : Returns the page meta tag for the specified id.
      
      
      The meta tag content is generated based on the content listing page meta tag context and rule.
      The rule is obtained from the current folder context or inherited from the parent folder,
      up to the root folder.
      
      
      Null will be returned if the meta tag is undefined on the current instance, or if no rule can be found for the
      current context, or if the rule resolves to an empty string.


    **Parameters:**
    - id - the ID to get the page meta tag for

    **Returns:**
    - page meta tag containing content generated based on rules


---

### getPageMetaTags()
- getPageMetaTags(): [Array](TopLevel.Array.md)
  - : Returns all page meta tags, defined for this instance for which content can be generated.
      
      
      The meta tag content is generated based on the content listing page meta tag context and rules.
      The rules are obtained from the current folder context or inherited from the parent folder,
      up to the root folder.


    **Returns:**
    - page meta tags defined for this instance, containing content generated based on rules


---

### getRefinements()
- getRefinements(): [ContentSearchRefinements](dw.content.ContentSearchRefinements.md)
  - : Returns the set of search refinements used in this search.

    **Returns:**
    - the set of search refinements used in this search.


---

### isFilteredByFolder()
- isFilteredByFolder(): [Boolean](TopLevel.Boolean.md)
  - : The method returns true, if the content search result is filtered by the folder and it is not subsequently
      possible to search for content assets that belong to no folder (e.g. those for Page Designer).


    **Returns:**
    - True if this is filtered by the folder of the content asset.


---

### isFolderSearch()
- isFolderSearch(): [Boolean](TopLevel.Boolean.md)
  - : The method returns true, if this is a pure search for a folder. The
      method checks, that a folder ID is specified and no search phrase is
      specified.


    **Returns:**
    - True if this is a folder search.


---

### isRecursiveFolderSearch()
- isRecursiveFolderSearch(): [Boolean](TopLevel.Boolean.md)
  - : Get the flag that determines if the folder search will
      be recursive.


    **Returns:**
    - true if the folder search will be recursive, false otherwise


---

### isRefinedByFolder()
- isRefinedByFolder(): [Boolean](TopLevel.Boolean.md)
  - : The method returns true, if the search is refined by a folder.
      The method checks, that a folder ID is specified.


    **Returns:**
    - true, if the search is refined by a folder, false otherwise.


---

### isRefinedFolderSearch()
- isRefinedFolderSearch(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if this is a folder search and is refined with further
      criteria, like a name refinement or an attribute refinement.


    **Returns:**
    - true if this is a folder search and is refined with further
              criteria, false otherwise.



---

### search()
- search(): [SearchStatus](dw.system.SearchStatus.md)
  - : Execute the search.

    **Returns:**
    - the searchStatus object with search status code and description of search result.


---

### setContentID(String)
- setContentID(contentID: [String](TopLevel.String.md)): void
  - : Sets the contentID used in this search.

    **Parameters:**
    - contentID - the contentID used in this search.


---

### setFilteredByFolder(Boolean)
- setFilteredByFolder(filteredByFolder: [Boolean](TopLevel.Boolean.md)): void
  - : Set a flag to indicate if the search is filtered by the folder. Must be set to false to return content assets that
      do not belong to any folder.


    **Parameters:**
    - filteredByFolder - filter the search result by folder


---

### setFolderID(String)
- setFolderID(folderID: [String](TopLevel.String.md)): void
  - : Sets the folderID used in this search.

    **Parameters:**
    - folderID - the folderID used in this search.


---

### setRecursiveFolderSearch(Boolean)
- setRecursiveFolderSearch(recurse: [Boolean](TopLevel.Boolean.md)): void
  - : Set a flag to indicate if the search in folder should be recursive.

    **Parameters:**
    - recurse - recurse the folder in the search


---

### urlForContent(URL, String)
- static urlForContent(url: [URL](dw.web.URL.md), cid: [String](TopLevel.String.md)): [URL](dw.web.URL.md)
  - : Returns an URL that you can use to execute a query for a specific
      Content. The passed url can be either a full url or just the name for a
      pipeline. In the later case a relative URL is created.


    **Parameters:**
    - url - the URL to use when constructing the new URL.
    - cid - the content id.

    **Returns:**
    - an URL that you can use to execute a query for a specific
              Content. The passed url can be either a full url or just the name
              for a pipeline. In the later case a relative URL is created.



---

### urlForContent(String, String)
- static urlForContent(action: [String](TopLevel.String.md), cid: [String](TopLevel.String.md)): [URL](dw.web.URL.md)
  - : Returns an URL that you can use to execute a query for a specific
      Content. The passed action is used to build an initial url. All search
      specific attributes are appended.


    **Parameters:**
    - action - the pipeline action to use.
    - cid - the content id.

    **Returns:**
    - an URL that you can use to execute a query for a specific
              Content. The passed action is used to build an initial url. All
              search specific attributes are appended.



---

### urlForFolder(URL, String)
- static urlForFolder(url: [URL](dw.web.URL.md), fid: [String](TopLevel.String.md)): [URL](dw.web.URL.md)
  - : Returns an URL that you can use to execute a query for a specific
      Folder.


    **Parameters:**
    - url - the URL to use in constructing the new URL.
    - fid - the id of the Folder to use.

    **Returns:**
    - an URL that you can use to execute a query for a specific
              Folder.



---

### urlForFolder(String, String)
- static urlForFolder(action: [String](TopLevel.String.md), fid: [String](TopLevel.String.md)): [URL](dw.web.URL.md)
  - : Returns an URL that you can use to execute a query for a specific
      Folder.


    **Parameters:**
    - action - the pipeline action to use.
    - fid - the id of the Folder to use.

    **Returns:**
    - an URL that you can use to execute a query for a specific
              Folder.



---

### urlForRefine(URL, String, String)
- static urlForRefine(url: [URL](dw.web.URL.md), name: [String](TopLevel.String.md), value: [String](TopLevel.String.md)): [URL](dw.web.URL.md)
  - : Returns an URL that you can use to execute a query for a specific
      attribute name-value pair.


    **Parameters:**
    - url - the URL to use when constructing the new URL.
    - name - the name of the attribute.
    - value - the value for the attribute.

    **Returns:**
    - an URL that you can use to execute a query for a specific
              attribute name-value pair.



---

### urlForRefine(String, String, String)
- static urlForRefine(action: [String](TopLevel.String.md), name: [String](TopLevel.String.md), value: [String](TopLevel.String.md)): [URL](dw.web.URL.md)
  - : Returns an URL that you can use to execute a query for a specific
      attribute name-value pair.


    **Parameters:**
    - action - the pipeline action to use.
    - name - the name of the attribute.
    - value - the value for the attribute.

    **Returns:**
    - an URL that you can use to execute a query for a specific
              attribute name-value pair.



---

### urlRefineFolder(URL, String)
- urlRefineFolder(url: [URL](dw.web.URL.md), refineFolderID: [String](TopLevel.String.md)): [URL](dw.web.URL.md)
  - : Returns an URL that you can use to re-execute the query using the
      specified URL and folder refinement.


    **Parameters:**
    - url - the existing URL to use when constructing the new URL.
    - refineFolderID - the ID of the folder refinement to use.

    **Returns:**
    - an URL that you can use to re-execute the query using the
              specified URL and folder refinement.



---

### urlRefineFolder(String, String)
- urlRefineFolder(action: [String](TopLevel.String.md), refineFolderID: [String](TopLevel.String.md)): [URL](dw.web.URL.md)
  - : Returns an URL that you can use to re-execute the query using the
      specified pipeline action and folder refinement.


    **Parameters:**
    - action - the action to use.
    - refineFolderID - the folder ID to use as a refinement.

    **Returns:**
    - an URL that you can use to re-execute the exact same query using
              the specified pipeline action and folder refinement.



---

### urlRelaxFolder(URL)
- urlRelaxFolder(url: [URL](dw.web.URL.md)): [URL](dw.web.URL.md)
  - : Returns an URL that you can use to re-execute the query with no folder
      refinement.


    **Parameters:**
    - url - the existing URL to use when constructing the new URL.

    **Returns:**
    - an URL that you can use to re-execute the query with no folder
              refinement.



---

### urlRelaxFolder(String)
- urlRelaxFolder(action: [String](TopLevel.String.md)): [URL](dw.web.URL.md)
  - : Returns an URL that you can use to re-execute the query with no folder
      refinement.


    **Parameters:**
    - action - the pipeline action to use in the URL.

    **Returns:**
    - an URL that you can use to re-execute the query with no folder
              refinement.



---

<!-- prettier-ignore-end -->
