<!-- prettier-ignore-start -->
# Class CMSRecord

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.experience.cms.CMSRecord](dw.experience.cms.CMSRecord.md)

This class represents a Salesforce CMS record, exposing its:

- `id`, see [getID()](dw.experience.cms.CMSRecord.md#getid)
- `type`, see [getType()](dw.experience.cms.CMSRecord.md#gettype)
- `attributes`, see [getAttributes()](dw.experience.cms.CMSRecord.md#getattributes)

The `attributes` are key value pairs:

- the key being the attribute id as given in the `type.attribute_definitions`entries
- the value being a DWScript API object resolved from the raw attribute value based on the attribute type as given in the `type.attribute_definitions`entries          (similar to how [ComponentScriptContext.getContent()](dw.experience.ComponentScriptContext.md#getcontent)exposes the raw attribute value of a [Component.getAttribute(String)](dw.experience.Component.md#getattributestring)in shape of a DWScript API object based on the attribute type)



## Property Summary

| Property | Description |
| --- | --- |
| [ID](#id): [String](TopLevel.String.md) `(read-only)` | Return the id of the Salesforce CMS record. |
| [attributes](#attributes): [Map](dw.util.Map.md) `(read-only)` | Return the Salesforce CMS record attributes as key value pairs:  <ul>      <li>the key being the attribute id as given in the `[getType()](dw.experience.cms.CMSRecord.md#gettype).attribute_definitions` entries</li>      <li>the value being a DWScript API object resolved from the raw attribute value based on the attribute type as given in the `[getType()](dw.experience.cms.CMSRecord.md#gettype).attribute_definitions` entries          (similar to how [ComponentScriptContext.getContent()](dw.experience.ComponentScriptContext.md#getcontent) exposes the raw attribute value of a [Component.getAttribute(String)](dw.experience.Component.md#getattributestring) in shape of a DWScript API object based on the attribute type)</li>  </ul>   The attributes are also conveniently accessible through named property support. |
| [type](#type): [Map](dw.util.Map.md) `(read-only)` | Return the type of the Salesforce CMS record sufficing the `content/schema/cmsrecord.json#/definitions/cms_content_type` schema. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getAttributes](dw.experience.cms.CMSRecord.md#getattributes)() | Return the Salesforce CMS record attributes as key value pairs:  <ul>      <li>the key being the attribute id as given in the `[getType()](dw.experience.cms.CMSRecord.md#gettype).attribute_definitions` entries</li>      <li>the value being a DWScript API object resolved from the raw attribute value based on the attribute type as given in the `[getType()](dw.experience.cms.CMSRecord.md#gettype).attribute_definitions` entries          (similar to how [ComponentScriptContext.getContent()](dw.experience.ComponentScriptContext.md#getcontent) exposes the raw attribute value of a [Component.getAttribute(String)](dw.experience.Component.md#getattributestring) in shape of a DWScript API object based on the attribute type)</li>  </ul>   The attributes are also conveniently accessible through named property support. |
| [getID](dw.experience.cms.CMSRecord.md#getid)() | Return the id of the Salesforce CMS record. |
| [getType](dw.experience.cms.CMSRecord.md#gettype)() | Return the type of the Salesforce CMS record sufficing the `content/schema/cmsrecord.json#/definitions/cms_content_type` schema. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### ID
- ID: [String](TopLevel.String.md) `(read-only)`
  - : Return the id of the Salesforce CMS record.


---

### attributes
- attributes: [Map](dw.util.Map.md) `(read-only)`
  - : Return the Salesforce CMS record attributes as key value pairs:
      
      - the key being the attribute id as given in the `[getType()](dw.experience.cms.CMSRecord.md#gettype).attribute_definitions`entries
      - the value being a DWScript API object resolved from the raw attribute value based on the attribute type as given in the `[getType()](dw.experience.cms.CMSRecord.md#gettype).attribute_definitions`entries          (similar to how [ComponentScriptContext.getContent()](dw.experience.ComponentScriptContext.md#getcontent)exposes the raw attribute value of a [Component.getAttribute(String)](dw.experience.Component.md#getattributestring)in shape of a DWScript API object based on the attribute type)
      
      
      The attributes are also conveniently accessible through named property support. That means if `myCmsRecord.getAttributes().get('foo')` yields value `'bar'`,
      then `myCmsRecord.foo` will give the same results.



---

### type
- type: [Map](dw.util.Map.md) `(read-only)`
  - : Return the type of the Salesforce CMS record sufficing the `content/schema/cmsrecord.json#/definitions/cms_content_type` schema. Properties
      can be accessed accordingly:
      
      - `getType().id : string`
      - `getType().name : string`
      - `getType().attribute_definitions : Map`(see `content/schema/attributedefinition.json`)



---

## Method Details

### getAttributes()
- getAttributes(): [Map](dw.util.Map.md)
  - : Return the Salesforce CMS record attributes as key value pairs:
      
      - the key being the attribute id as given in the `[getType()](dw.experience.cms.CMSRecord.md#gettype).attribute_definitions`entries
      - the value being a DWScript API object resolved from the raw attribute value based on the attribute type as given in the `[getType()](dw.experience.cms.CMSRecord.md#gettype).attribute_definitions`entries          (similar to how [ComponentScriptContext.getContent()](dw.experience.ComponentScriptContext.md#getcontent)exposes the raw attribute value of a [Component.getAttribute(String)](dw.experience.Component.md#getattributestring)in shape of a DWScript API object based on the attribute type)
      
      
      The attributes are also conveniently accessible through named property support. That means if `myCmsRecord.getAttributes().get('foo')` yields value `'bar'`,
      then `myCmsRecord.foo` will give the same results.


    **Returns:**
    - the cms record attributes


---

### getID()
- getID(): [String](TopLevel.String.md)
  - : Return the id of the Salesforce CMS record.

    **Returns:**
    - the id of the Salesforce CMS record


---

### getType()
- getType(): [Map](dw.util.Map.md)
  - : Return the type of the Salesforce CMS record sufficing the `content/schema/cmsrecord.json#/definitions/cms_content_type` schema. Properties
      can be accessed accordingly:
      
      - `getType().id : string`
      - `getType().name : string`
      - `getType().attribute_definitions : Map`(see `content/schema/attributedefinition.json`)


    **Returns:**
    - the type of the cms record


---

<!-- prettier-ignore-end -->
