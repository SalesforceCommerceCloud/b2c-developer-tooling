<!-- prettier-ignore-start -->
# Class Page

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.experience.Page](dw.experience.Page.md)



This class represents a page designer managed page. A page comprises of
multiple regions that hold components, which themselves again can have
regions holding components, i.e. spanning a hierarchical tree of components.




Using

- [PageMgr.renderPage(String, String)](dw.experience.PageMgr.md#renderpagestring-string)
- [PageMgr.renderPage(String, Map, String)](dw.experience.PageMgr.md#renderpagestring-map-string)

a page can be rendered. As such page implements a render function for creating
render output the render function of the page itself will also want to access
its various properties like the SEO title etc.




Apart from rendering to markup a page can also be serialized, i.e. transformed
into a json string using

- [PageMgr.serializePage(String, String)](dw.experience.PageMgr.md#serializepagestring-string)
- [PageMgr.serializePage(String, Map, String)](dw.experience.PageMgr.md#serializepagestring-map-string)


**See Also:**
- [Region](dw.experience.Region.md)
- [Component](dw.experience.Component.md)
- [PageMgr](dw.experience.PageMgr.md)


## Property Summary

| Property | Description |
| --- | --- |
| [ID](#id): [String](TopLevel.String.md) `(read-only)` | Returns the id of this page. |
| [aspectTypeID](#aspecttypeid): [String](TopLevel.String.md) `(read-only)` | Get the aspect type of the page. |
| [classificationFolder](#classificationfolder): [Folder](dw.content.Folder.md) `(read-only)` | Returns the classification [Folder](dw.content.Folder.md) associated with this page. |
| [description](#description): [String](TopLevel.String.md) `(read-only)` | Returns the description of this page. |
| [folders](#folders): [Collection](dw.util.Collection.md) `(read-only)` | Returns all folders to which this page is assigned. |
| [name](#name): [String](TopLevel.String.md) `(read-only)` | Returns the name of this page. |
| [pageDescription](#pagedescription): [String](TopLevel.String.md) `(read-only)` | Returns the SEO description of this page. |
| [pageKeywords](#pagekeywords): [String](TopLevel.String.md) `(read-only)` | Returns the SEO keywords of this page. |
| [pageTitle](#pagetitle): [String](TopLevel.String.md) `(read-only)` | Returns the SEO title of this page. |
| [searchWords](#searchwords): [String](TopLevel.String.md) `(read-only)` | Returns the search words of the page used for the search index. |
| [typeID](#typeid): [String](TopLevel.String.md) `(read-only)` | Returns the type id of this page. |
| [visible](#visible): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns `true` if the page is currently visible which is the case if:  <ul>   <li>page is published</li>   <li>the page is set to visible in the current locale</li>   <li>all visibility rules apply, requiring that    <ul>     <li>schedule matches</li>     <li>customer group matches</li>     <li>aspect attribute qualifiers match</li>     <li>campaign and promotion qualifiers match</li>    </ul>   </li>  </ul>  If any of these is not the case then `false` will be returned. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getAspectTypeID](dw.experience.Page.md#getaspecttypeid)() | Get the aspect type of the page. |
| [getAttribute](dw.experience.Page.md#getattributestring)([String](TopLevel.String.md)) | <p>Returns the raw attribute value identified by the specified attribute id. |
| [getClassificationFolder](dw.experience.Page.md#getclassificationfolder)() | Returns the classification [Folder](dw.content.Folder.md) associated with this page. |
| [getDescription](dw.experience.Page.md#getdescription)() | Returns the description of this page. |
| [getFolders](dw.experience.Page.md#getfolders)() | Returns all folders to which this page is assigned. |
| [getID](dw.experience.Page.md#getid)() | Returns the id of this page. |
| [getName](dw.experience.Page.md#getname)() | Returns the name of this page. |
| [getPageDescription](dw.experience.Page.md#getpagedescription)() | Returns the SEO description of this page. |
| [getPageKeywords](dw.experience.Page.md#getpagekeywords)() | Returns the SEO keywords of this page. |
| [getPageTitle](dw.experience.Page.md#getpagetitle)() | Returns the SEO title of this page. |
| [getRegion](dw.experience.Page.md#getregionstring)([String](TopLevel.String.md)) | Returns the page region that matches the given id. |
| [getSearchWords](dw.experience.Page.md#getsearchwords)() | Returns the search words of the page used for the search index. |
| [getTypeID](dw.experience.Page.md#gettypeid)() | Returns the type id of this page. |
| [hasVisibilityRules](dw.experience.Page.md#hasvisibilityrules)() | Returns `true` if the page has visibility rules (scheduling, customer groups, aspect attribute qualifiers,  campaign and promotion qualifiers) applied, otherwise `false`. |
| [isVisible](dw.experience.Page.md#isvisible)() | Returns `true` if the page is currently visible which is the case if:  <ul>   <li>page is published</li>   <li>the page is set to visible in the current locale</li>   <li>all visibility rules apply, requiring that    <ul>     <li>schedule matches</li>     <li>customer group matches</li>     <li>aspect attribute qualifiers match</li>     <li>campaign and promotion qualifiers match</li>    </ul>   </li>  </ul>  If any of these is not the case then `false` will be returned. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### ID
- ID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the id of this page.


---

### aspectTypeID
- aspectTypeID: [String](TopLevel.String.md) `(read-only)`
  - : Get the aspect type of the page.
      If an aspect type is set for this page (and is found in the deployed code version), then the page is treated as dynamic page during
      rendering and serialization.


    **See Also:**
    - [PageMgr.renderPage(String, Map, String)](dw.experience.PageMgr.md#renderpagestring-map-string)
    - [PageMgr.serializePage(String, Map, String)](dw.experience.PageMgr.md#serializepagestring-map-string)


---

### classificationFolder
- classificationFolder: [Folder](dw.content.Folder.md) `(read-only)`
  - : Returns the classification [Folder](dw.content.Folder.md) associated with this page.


---

### description
- description: [String](TopLevel.String.md) `(read-only)`
  - : Returns the description of this page.


---

### folders
- folders: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns all folders to which this page is assigned.


---

### name
- name: [String](TopLevel.String.md) `(read-only)`
  - : Returns the name of this page.


---

### pageDescription
- pageDescription: [String](TopLevel.String.md) `(read-only)`
  - : Returns the SEO description of this page.


---

### pageKeywords
- pageKeywords: [String](TopLevel.String.md) `(read-only)`
  - : Returns the SEO keywords of this page.


---

### pageTitle
- pageTitle: [String](TopLevel.String.md) `(read-only)`
  - : Returns the SEO title of this page.


---

### searchWords
- searchWords: [String](TopLevel.String.md) `(read-only)`
  - : Returns the search words of the page used for the search index.


---

### typeID
- typeID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the type id of this page.


---

### visible
- visible: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns `true` if the page is currently visible which is the case if:
      
      - page is published
      - the page is set to visible in the current locale
      - all visibility rules apply, requiring that    
        - schedule matches
        - customer group matches
        - aspect attribute qualifiers match
        - campaign and promotion qualifiers match
      
      
      If any of these is not the case then `false` will be returned.
      
      
      As visibility is driven by the merchant configured dynamic visibility rules, e.g. scheduling and custom segmentation, this
      call should NOT happen in a pagecached context outside of the processing induced by rendering/serialization (see the corresponding
      methods in [PageMgr](dw.experience.PageMgr.md)). 
      
      Use [hasVisibilityRules()](dw.experience.Page.md#hasvisibilityrules) prior to calling this method in order to check for the existence of visibility rules. If there are
      visibility rules then do not apply pagecaching. Otherwise the visibility decision making would end up in the pagecache and any subsequent
      call would just return from the pagecache instead of performing the [isVisible()](dw.experience.Page.md#isvisible) check again as desired.
      
      ```
      ...
      var page = PageMgr.getPage(pageID);
      if (page.hasVisibilityRules())
      {
          // pagecaching is NOT ok here
          if (page.isVisible())
          {
              response.writer.print(PageMgr.renderPage(pageID, {});
          }
      }
      else
      {
          // pagecaching is ok here, but requires a pagecache refresh if merchants start adding visibility rules to the page
      }
      ...
      ```


    **See Also:**
    - [isVisible()](dw.experience.Page.md#isvisible)


---

## Method Details

### getAspectTypeID()
- getAspectTypeID(): [String](TopLevel.String.md)
  - : Get the aspect type of the page.
      If an aspect type is set for this page (and is found in the deployed code version), then the page is treated as dynamic page during
      rendering and serialization.


    **Returns:**
    - the ID of the page's aspect type

    **See Also:**
    - [PageMgr.renderPage(String, Map, String)](dw.experience.PageMgr.md#renderpagestring-map-string)
    - [PageMgr.serializePage(String, Map, String)](dw.experience.PageMgr.md#serializepagestring-map-string)


---

### getAttribute(String)
- getAttribute(attributeID: [String](TopLevel.String.md)): [Object](TopLevel.Object.md)
  - : 
      Returns the raw attribute value identified by the specified attribute id.
      By raw attribute value we denote the unprocessed value as provided for the attribute
      driven by the type of the respective attribute definition:
      
      - `boolean`-> boolean
      - `category`-> string representing a catalog category ID
      - `custom`-> [Map](dw.util.Map.md)that originates from a stringified curly brackets {} JSON object
      - `cms_record`-> [Map](dw.util.Map.md)that originates from a stringified curly brackets {} JSON object whose entries must adhere to the `cmsrecord.json`schema
      - `enum`-> either string or integer
      - `file`-> string representing a file path within a library
      - `image`-> [Map](dw.util.Map.md)that originates from a stringified curly brackets {} JSON object whose entries must adhere to the `content/schema/image.json`schema
      - `integer`-> integer
      - `markup`-> string representing HTML markup
      - `page`-> string representing a page ID
      - `product`-> string representing a product SKU
      - `string`-> string
      - `text`-> string
      - `url`-> string representing a URL
      
      
      
      
      
      There is two places an attribute value can come from - either it was persisted at design time (e.g.
      by the merchant by editing a component in Page Designer) or it was injected in shape of an aspect attribute at rendering time
      through the execution of code. The persistent value, if existing, takes precedence over the injected aspect
      attribute one. Injection of a value through an aspect attribute will only occur if the page attribute's
      attribute definition was declared using the `"dynamic_lookup"` property and its aspect attribute alias matches
      the ID of the respective aspect attribute.
      
      
      
      Accessing the raw value can be helpful if render and serialization logic of the
      page needs to operate on these unprocessed values. An unprocessed value
      might be fundamentally different from its processed counterpart, the latter being
      provided through the content dictionary (see [PageScriptContext.getContent()](dw.experience.PageScriptContext.md#getcontent))
      when the render/serialize function of the page is invoked.


    **Parameters:**
    - attributeID - the id of the desired attribute

    **Returns:**
    - the unprocessed raw value of the desired attribute, or null if not found


---

### getClassificationFolder()
- getClassificationFolder(): [Folder](dw.content.Folder.md)
  - : Returns the classification [Folder](dw.content.Folder.md) associated with this page.

    **Returns:**
    - the classification [Folder](dw.content.Folder.md) if one is assigned, `null` otherwise.


---

### getDescription()
- getDescription(): [String](TopLevel.String.md)
  - : Returns the description of this page.

    **Returns:**
    - the page description


---

### getFolders()
- getFolders(): [Collection](dw.util.Collection.md)
  - : Returns all folders to which this page is assigned.

    **Returns:**
    - Collection of [Folder](dw.content.Folder.md) objects.


---

### getID()
- getID(): [String](TopLevel.String.md)
  - : Returns the id of this page.

    **Returns:**
    - the page id


---

### getName()
- getName(): [String](TopLevel.String.md)
  - : Returns the name of this page.

    **Returns:**
    - the page name


---

### getPageDescription()
- getPageDescription(): [String](TopLevel.String.md)
  - : Returns the SEO description of this page.

    **Returns:**
    - the page SEO description


---

### getPageKeywords()
- getPageKeywords(): [String](TopLevel.String.md)
  - : Returns the SEO keywords of this page.

    **Returns:**
    - the page SEO keywords


---

### getPageTitle()
- getPageTitle(): [String](TopLevel.String.md)
  - : Returns the SEO title of this page.

    **Returns:**
    - the page SEO title


---

### getRegion(String)
- getRegion(id: [String](TopLevel.String.md)): [Region](dw.experience.Region.md)
  - : Returns the page region that matches the given id.

    **Parameters:**
    - id - the id of the desired page region

    **Returns:**
    - the region, or null if not found.


---

### getSearchWords()
- getSearchWords(): [String](TopLevel.String.md)
  - : Returns the search words of the page used for the search index.

    **Returns:**
    - the page search words


---

### getTypeID()
- getTypeID(): [String](TopLevel.String.md)
  - : Returns the type id of this page.

    **Returns:**
    - the page type id


---

### hasVisibilityRules()
- hasVisibilityRules(): [Boolean](TopLevel.Boolean.md)
  - : Returns `true` if the page has visibility rules (scheduling, customer groups, aspect attribute qualifiers,
      campaign and promotion qualifiers) applied, otherwise `false`. Use this
      method prior to [isVisible()](dw.experience.Page.md#isvisible), so you do not call the latter in a pagecached context.


    **Returns:**
    - `true` if the page has visibility rules applied, otherwise `false`.


---

### isVisible()
- isVisible(): [Boolean](TopLevel.Boolean.md)
  - : Returns `true` if the page is currently visible which is the case if:
      
      - page is published
      - the page is set to visible in the current locale
      - all visibility rules apply, requiring that    
        - schedule matches
        - customer group matches
        - aspect attribute qualifiers match
        - campaign and promotion qualifiers match
      
      
      If any of these is not the case then `false` will be returned.
      
      
      As visibility is driven by the merchant configured dynamic visibility rules, e.g. scheduling and custom segmentation, this
      call should NOT happen in a pagecached context outside of the processing induced by rendering/serialization (see the corresponding
      methods in [PageMgr](dw.experience.PageMgr.md)). 
      
      Use [hasVisibilityRules()](dw.experience.Page.md#hasvisibilityrules) prior to calling this method in order to check for the existence of visibility rules. If there are
      visibility rules then do not apply pagecaching. Otherwise the visibility decision making would end up in the pagecache and any subsequent
      call would just return from the pagecache instead of performing the [isVisible()](dw.experience.Page.md#isvisible) check again as desired.
      
      ```
      ...
      var page = PageMgr.getPage(pageID);
      if (page.hasVisibilityRules())
      {
          // pagecaching is NOT ok here
          if (page.isVisible())
          {
              response.writer.print(PageMgr.renderPage(pageID, {});
          }
      }
      else
      {
          // pagecaching is ok here, but requires a pagecache refresh if merchants start adding visibility rules to the page
      }
      ...
      ```


    **Returns:**
    - `true` if the page is currently visible (published, visible in the current locale, and visibility rules apply), otherwise `false` (unpublished and/or visibility rules don't apply)

    **See Also:**
    - [isVisible()](dw.experience.Page.md#isvisible)


---

<!-- prettier-ignore-end -->
