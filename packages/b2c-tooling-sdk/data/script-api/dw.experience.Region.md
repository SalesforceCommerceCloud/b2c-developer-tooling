<!-- prettier-ignore-start -->
# Class Region

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.experience.Region](dw.experience.Region.md)

This class represents a region which serves as container of components.
Using the [PageMgr.renderRegion(Region)](dw.experience.PageMgr.md#renderregionregion) or [PageMgr.renderRegion(Region, RegionRenderSettings)](dw.experience.PageMgr.md#renderregionregion-regionrendersettings)
a region can be rendered.


**See Also:**
- [Page](dw.experience.Page.md)
- [Component](dw.experience.Component.md)
- [PageMgr](dw.experience.PageMgr.md)


## Property Summary

| Property | Description |
| --- | --- |
| [ID](#id): [String](TopLevel.String.md) `(read-only)` | Returns the id of this region. |
| [size](#size): [Number](TopLevel.Number.md) `(read-only)` | Returns the number of components that would be rendered by this region  when calling [PageMgr.renderRegion(Region)](dw.experience.PageMgr.md#renderregionregion) or [PageMgr.renderRegion(Region, RegionRenderSettings)](dw.experience.PageMgr.md#renderregionregion-regionrendersettings). |
| [visibleComponents](#visiblecomponents): [Collection](dw.util.Collection.md) `(read-only)` | Returns the components that would be rendered by this region  when calling [PageMgr.renderRegion(Region)](dw.experience.PageMgr.md#renderregionregion) or [PageMgr.renderRegion(Region, RegionRenderSettings)](dw.experience.PageMgr.md#renderregionregion-regionrendersettings). |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getID](dw.experience.Region.md#getid)() | Returns the id of this region. |
| [getSize](dw.experience.Region.md#getsize)() | Returns the number of components that would be rendered by this region  when calling [PageMgr.renderRegion(Region)](dw.experience.PageMgr.md#renderregionregion) or [PageMgr.renderRegion(Region, RegionRenderSettings)](dw.experience.PageMgr.md#renderregionregion-regionrendersettings). |
| [getVisibleComponents](dw.experience.Region.md#getvisiblecomponents)() | Returns the components that would be rendered by this region  when calling [PageMgr.renderRegion(Region)](dw.experience.PageMgr.md#renderregionregion) or [PageMgr.renderRegion(Region, RegionRenderSettings)](dw.experience.PageMgr.md#renderregionregion-regionrendersettings). |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### ID
- ID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the id of this region.


---

### size
- size: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the number of components that would be rendered by this region
      when calling [PageMgr.renderRegion(Region)](dw.experience.PageMgr.md#renderregionregion) or [PageMgr.renderRegion(Region, RegionRenderSettings)](dw.experience.PageMgr.md#renderregionregion-regionrendersettings).
      
      
      Due to its time and customer group depending nature this call should NOT happen in a pagecached context
      outside of the processing induced by the above mentioned render methods.



---

### visibleComponents
- visibleComponents: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns the components that would be rendered by this region
      when calling [PageMgr.renderRegion(Region)](dw.experience.PageMgr.md#renderregionregion) or [PageMgr.renderRegion(Region, RegionRenderSettings)](dw.experience.PageMgr.md#renderregionregion-regionrendersettings).
      
      
      As visibility is driven by the merchant configured dynamic visibility rules, e.g. scheduling and custom segmentation, this
      call should NOT happen in a pagecached context outside of the processing induced by the above mentioned render methods.



---

## Method Details

### getID()
- getID(): [String](TopLevel.String.md)
  - : Returns the id of this region.

    **Returns:**
    - the region id


---

### getSize()
- getSize(): [Number](TopLevel.Number.md)
  - : Returns the number of components that would be rendered by this region
      when calling [PageMgr.renderRegion(Region)](dw.experience.PageMgr.md#renderregionregion) or [PageMgr.renderRegion(Region, RegionRenderSettings)](dw.experience.PageMgr.md#renderregionregion-regionrendersettings).
      
      
      Due to its time and customer group depending nature this call should NOT happen in a pagecached context
      outside of the processing induced by the above mentioned render methods.


    **Returns:**
    - the number of visible (i.e. renderable or serializable) components in this region


---

### getVisibleComponents()
- getVisibleComponents(): [Collection](dw.util.Collection.md)
  - : Returns the components that would be rendered by this region
      when calling [PageMgr.renderRegion(Region)](dw.experience.PageMgr.md#renderregionregion) or [PageMgr.renderRegion(Region, RegionRenderSettings)](dw.experience.PageMgr.md#renderregionregion-regionrendersettings).
      
      
      As visibility is driven by the merchant configured dynamic visibility rules, e.g. scheduling and custom segmentation, this
      call should NOT happen in a pagecached context outside of the processing induced by the above mentioned render methods.


    **Returns:**
    - the visible (i.e. renderable or serializable) components in this region


---

<!-- prettier-ignore-end -->
