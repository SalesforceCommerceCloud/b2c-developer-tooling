<!-- prettier-ignore-start -->
# Class Component

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.experience.Component](dw.experience.Component.md)

This class represents a page designer managed component as part of a
page. A component comprises of multiple regions that again hold components,
thus spanning a hierarchical tree of components. Using the [PageMgr.renderRegion(Region)](dw.experience.PageMgr.md#renderregionregion) or
[PageMgr.renderRegion(Region, RegionRenderSettings)](dw.experience.PageMgr.md#renderregionregion-regionrendersettings) a region can be rendered which
implicitly includes rendering of all contained visible components. All
content attributes (defined by the corresponding component type) can be
accessed, reading the accordant persisted values as provided by the content editor
who created this component.


**See Also:**
- [Page](dw.experience.Page.md)
- [Region](dw.experience.Region.md)
- [PageMgr](dw.experience.PageMgr.md)


## Property Summary

| Property | Description |
| --- | --- |
| [ID](#id): [String](TopLevel.String.md) `(read-only)` | Returns the id of this component. |
| [name](#name): [String](TopLevel.String.md) `(read-only)` | Returns the name of this component |
| [typeID](#typeid): [String](TopLevel.String.md) `(read-only)` | Returns the type id of this component. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getAttribute](dw.experience.Component.md#getattributestring)([String](TopLevel.String.md)) | <p>Returns the raw attribute value identified by the specified attribute id. |
| [getID](dw.experience.Component.md#getid)() | Returns the id of this component. |
| [getName](dw.experience.Component.md#getname)() | Returns the name of this component |
| [getRegion](dw.experience.Component.md#getregionstring)([String](TopLevel.String.md)) | Returns the component region that matches the given id. |
| [getTypeID](dw.experience.Component.md#gettypeid)() | Returns the type id of this component. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### ID
- ID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the id of this component.


---

### name
- name: [String](TopLevel.String.md) `(read-only)`
  - : Returns the name of this component


---

### typeID
- typeID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the type id of this component.


---

## Method Details

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
      attribute one. Injection of a value through an aspect attribute will only occur if the component attribute's
      attribute definition was declared using the `"dynamic_lookup"` property and its aspect attribute alias matches
      the ID of the respective aspect attribute.
      
      
      
      Accessing the raw value can be helpful if render and serialization logic of the
      component needs to operate on these unprocessed values. An unprocessed value
      might be fundamentally different from its processed counterpart, the latter being
      provided through the content dictionary (see [ComponentScriptContext.getContent()](dw.experience.ComponentScriptContext.md#getcontent))
      when the render/serialize function of the component is invoked.


    **Parameters:**
    - attributeID - the id of the desired attribute

    **Returns:**
    - the unprocessed raw value of the desired attribute, or null if not found


---

### getID()
- getID(): [String](TopLevel.String.md)
  - : Returns the id of this component.

    **Returns:**
    - the component id


---

### getName()
- getName(): [String](TopLevel.String.md)
  - : Returns the name of this component

    **Returns:**
    - the component name


---

### getRegion(String)
- getRegion(id: [String](TopLevel.String.md)): [Region](dw.experience.Region.md)
  - : Returns the component region that matches the given id.

    **Parameters:**
    - id - the id of the desired component region

    **Returns:**
    - the region, or null if not found.


---

### getTypeID()
- getTypeID(): [String](TopLevel.String.md)
  - : Returns the type id of this component.

    **Returns:**
    - the component type id


---

<!-- prettier-ignore-end -->
