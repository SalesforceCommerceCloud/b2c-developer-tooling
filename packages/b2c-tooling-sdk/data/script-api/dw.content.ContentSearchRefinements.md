<!-- prettier-ignore-start -->
# Class ContentSearchRefinements

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.catalog.SearchRefinements](dw.catalog.SearchRefinements.md)
    - [dw.content.ContentSearchRefinements](dw.content.ContentSearchRefinements.md)

This class provides an interface to refinement options for the content asset
search. In a typical usage, the client application UI displays the search
refinements along with the search results and allows customers to "refine"
the results (i.e. limit the results that are shown) by specifying additional
criteria, or "relax" (i.e. broaden) the results after previously refining.
The two types of content search refinements are:


- **Refine By Folder:**Limit the content assets to those assigned to  specific child/ancestor folder of the search folder.
- **Refine By Attribute:**Limit the content assets to those with  specific values for a given attribute. Values may be grouped into "buckets"  so that a given set of values are represented as a single refinement option.


Rendering a content search refinement UI typically begins with iterating the
refinement definitions for the search result. Call
[SearchRefinements.getRefinementDefinitions()](dw.catalog.SearchRefinements.md#getrefinementdefinitions) or
[SearchRefinements.getAllRefinementDefinitions()](dw.catalog.SearchRefinements.md#getallrefinementdefinitions) to
retrieve the appropriate collection of refinement definitions. For each
definition, display the available refinement values by calling
[getAllRefinementValues(ContentSearchRefinementDefinition)](dw.content.ContentSearchRefinements.md#getallrefinementvaluescontentsearchrefinementdefinition). Depending
on the type of the refinement definition, the application must use slightly
different logic to display the refinement widgets. For all 2 types, methods
in [ContentSearchModel](dw.content.ContentSearchModel.md) are used to generate URLs to render
hyperlinks in the UI. When clicked, these links trigger a call to the Search
pipelet which in turn applies the appropriate filters to the native search
result.



## Property Summary

| Property | Description |
| --- | --- |
| [folderRefinementDefinition](#folderrefinementdefinition): [ContentSearchRefinementDefinition](dw.content.ContentSearchRefinementDefinition.md) `(read-only)` | Returns the appropriate folder refinement definition based on the search  result. |
| [matchingFolders](#matchingfolders): [Collection](dw.util.Collection.md) `(read-only)` | Returns a collection of matching folders. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getAllRefinementValues](dw.content.ContentSearchRefinements.md#getallrefinementvaluescontentsearchrefinementdefinition)([ContentSearchRefinementDefinition](dw.content.ContentSearchRefinementDefinition.md)) | Returns a sorted collection of refinement values for the given refinement  definition. |
| [getFolderHits](dw.content.ContentSearchRefinements.md#getfolderhitsfolder)([Folder](dw.content.Folder.md)) | Returns the number of search hits for the passed folder object. |
| [getFolderRefinementDefinition](dw.content.ContentSearchRefinements.md#getfolderrefinementdefinition)() | Returns the appropriate folder refinement definition based on the search  result. |
| [getMatchingFolders](dw.content.ContentSearchRefinements.md#getmatchingfolders)() | Returns a collection of matching folders. |
| [getNextLevelFolderRefinementValues](dw.content.ContentSearchRefinements.md#getnextlevelfolderrefinementvaluesfolder)([Folder](dw.content.Folder.md)) | Returns folder refinement values based on the current search result  filtered such that only folder refinements representing children of the  given folder are present. |
| [getRefinementValue](dw.content.ContentSearchRefinements.md#getrefinementvaluecontentsearchrefinementdefinition-string)([ContentSearchRefinementDefinition](dw.content.ContentSearchRefinementDefinition.md), [String](TopLevel.String.md)) | Returns the refinement value (incl. |
| [getRefinementValue](dw.content.ContentSearchRefinements.md#getrefinementvaluestring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Returns the refinement value (incl. |
| [getRefinementValues](dw.content.ContentSearchRefinements.md#getrefinementvaluescontentsearchrefinementdefinition)([ContentSearchRefinementDefinition](dw.content.ContentSearchRefinementDefinition.md)) | Returns a collection of refinement values for the given refinement  definition. |

### Methods inherited from class SearchRefinements

[getAllRefinementDefinitions](dw.catalog.SearchRefinements.md#getallrefinementdefinitions), [getAllRefinementValues](dw.catalog.SearchRefinements.md#getallrefinementvaluesstring), [getAllRefinementValues](dw.catalog.SearchRefinements.md#getallrefinementvaluesstring-number-number), [getRefinementDefinitions](dw.catalog.SearchRefinements.md#getrefinementdefinitions), [getRefinementValues](dw.catalog.SearchRefinements.md#getrefinementvaluesstring-number-number)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### folderRefinementDefinition
- folderRefinementDefinition: [ContentSearchRefinementDefinition](dw.content.ContentSearchRefinementDefinition.md) `(read-only)`
  - : Returns the appropriate folder refinement definition based on the search
      result. The folder refinement definition returned will be the first that
      can be found traversing the folder tree upward starting at the deepest
      common folder of the search result.



---

### matchingFolders
- matchingFolders: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns a collection of matching folders.


---

## Method Details

### getAllRefinementValues(ContentSearchRefinementDefinition)
- getAllRefinementValues(definition: [ContentSearchRefinementDefinition](dw.content.ContentSearchRefinementDefinition.md)): [Collection](dw.util.Collection.md)
  - : Returns a sorted collection of refinement values for the given refinement
      definition. The returned collection includes all refinement values for
      which the hit count is greater than 0 within the search result when the
      passed refinement definitions is excluded from filtering the search hits
      but all other refinement filters are still applied. This is useful for
      rendering broadening options for the refinement definitions that the
      search is already refined by. It is important to note that this method
      does NOT return refinement values independent of the search result.


    **Parameters:**
    - definition - The refinement definition to return refinement values             for.

    **Returns:**
    - The collection of ContentSearchRefinementValue instances sorted
              according to the settings of the definition.



---

### getFolderHits(Folder)
- getFolderHits(folder: [Folder](dw.content.Folder.md)): [Number](TopLevel.Number.md)
  - : Returns the number of search hits for the passed folder object.

    **Parameters:**
    - folder - Folder object.

    **Returns:**
    - Number of search hits.


---

### getFolderRefinementDefinition()
- getFolderRefinementDefinition(): [ContentSearchRefinementDefinition](dw.content.ContentSearchRefinementDefinition.md)
  - : Returns the appropriate folder refinement definition based on the search
      result. The folder refinement definition returned will be the first that
      can be found traversing the folder tree upward starting at the deepest
      common folder of the search result.


    **Returns:**
    - The folder refinement definition or `null` if none can
              be found.



---

### getMatchingFolders()
- getMatchingFolders(): [Collection](dw.util.Collection.md)
  - : Returns a collection of matching folders.

    **Returns:**
    - Collection of matching folders.


---

### getNextLevelFolderRefinementValues(Folder)
- getNextLevelFolderRefinementValues(folder: [Folder](dw.content.Folder.md)): [Collection](dw.util.Collection.md)
  - : Returns folder refinement values based on the current search result
      filtered such that only folder refinements representing children of the
      given folder are present. If no folder is given, the method uses the
      library's root folder. The refinement value content counts represent all
      hits contained in the library tree starting at the corresponding child
      folder.


    **Parameters:**
    - folder - The folder to return child folder refinement values for.

    **Returns:**
    - The refinement values for all child folders of the given folder.


---

### getRefinementValue(ContentSearchRefinementDefinition, String)
- getRefinementValue(definition: [ContentSearchRefinementDefinition](dw.content.ContentSearchRefinementDefinition.md), value: [String](TopLevel.String.md)): [ContentSearchRefinementValue](dw.content.ContentSearchRefinementValue.md)
  - : Returns the refinement value (incl. content hit count) for the given
      refinement definition and the given (selected) value.


    **Parameters:**
    - definition - The definition to return the refinement for.
    - value - The value to return the refinement value for.

    **Returns:**
    - The refinement value.


---

### getRefinementValue(String, String)
- getRefinementValue(name: [String](TopLevel.String.md), value: [String](TopLevel.String.md)): [ContentSearchRefinementValue](dw.content.ContentSearchRefinementValue.md)
  - : Returns the refinement value (incl. content hit count) for the given
      attribute refinement and the given (selected) value.


    **Parameters:**
    - name - The name of the refinement attribute.
    - value - The value to return the refinement value for.

    **Returns:**
    - The refinement value.


---

### getRefinementValues(ContentSearchRefinementDefinition)
- getRefinementValues(definition: [ContentSearchRefinementDefinition](dw.content.ContentSearchRefinementDefinition.md)): [Collection](dw.util.Collection.md)
  - : Returns a collection of refinement values for the given refinement
      definition. The returned refinement values only include those that are
      part of the actual search result (i.e. hit count will always be > 0).


    **Parameters:**
    - definition - The refinement definition to return refinement values for.

    **Returns:**
    - The collection of refinement values sorted according to the
              settings of the definition.



---

<!-- prettier-ignore-end -->
