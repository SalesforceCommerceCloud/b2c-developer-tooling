<!-- prettier-ignore-start -->
# Class Campaign

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)
      - [dw.campaign.Campaign](dw.campaign.Campaign.md)

A Campaign is a set of experiences (or site configurations) which may be
deployed as a single unit for a given time frame.  The system currently
supports 3 types of experience that may be assigned to a campaign:


- Promotions
- Slot Configurations
- Sorting Rules


This list may be extended in the future.


A campaign can have a start and end date or be open-ended.  It may also have
"qualifiers" which determine which customers the campaign applies to.
The currently supported qualifiers are:


- Customer groups (where "Everyone" is a possible customer group)
- Source codes
- Coupons


A campaign can have list of stores or store groups where it can be applicable to.



## Property Summary

| Property | Description |
| --- | --- |
| [ID](#id): [String](TopLevel.String.md) `(read-only)` | Returns the unique campaign ID. |
| [active](#active): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns 'true' if the campaign is currently active, otherwise  'false'. |
| [applicableInStore](#applicableinstore): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns true if campaign is applicable to store, otherwise false. |
| [applicableOnline](#applicableonline): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns true if campaign is applicable to online site, otherwise false. |
| [coupons](#coupons): [Collection](dw.util.Collection.md) `(read-only)` | Returns the coupons assigned to the campaign. |
| [customerGroups](#customergroups): [Collection](dw.util.Collection.md) `(read-only)` | Returns the customer groups assigned to the campaign. |
| [description](#description): [String](TopLevel.String.md) `(read-only)` | Returns the internal description of the campaign. |
| [enabled](#enabled): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns true if campaign is enabled, otherwise false. |
| [endDate](#enddate): [Date](TopLevel.Date.md) `(read-only)` | Returns the end date of the campaign. |
| [promotions](#promotions): [Collection](dw.util.Collection.md) `(read-only)` | Returns promotions defined in this campaign in no particular order. |
| [sourceCodeGroups](#sourcecodegroups): [Collection](dw.util.Collection.md) `(read-only)` | Returns the source codes assigned to the campaign. |
| [startDate](#startdate): [Date](TopLevel.Date.md) `(read-only)` | Returns the start date of the campaign. |
| [storeGroups](#storegroups): [Collection](dw.util.Collection.md) `(read-only)` | Returns store groups assigned to the campaign. |
| [stores](#stores): [Collection](dw.util.Collection.md) `(read-only)` | Returns stores assigned to the campaign. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getCoupons](dw.campaign.Campaign.md#getcoupons)() | Returns the coupons assigned to the campaign. |
| [getCustomerGroups](dw.campaign.Campaign.md#getcustomergroups)() | Returns the customer groups assigned to the campaign. |
| [getDescription](dw.campaign.Campaign.md#getdescription)() | Returns the internal description of the campaign. |
| [getEndDate](dw.campaign.Campaign.md#getenddate)() | Returns the end date of the campaign. |
| [getID](dw.campaign.Campaign.md#getid)() | Returns the unique campaign ID. |
| [getPromotions](dw.campaign.Campaign.md#getpromotions)() | Returns promotions defined in this campaign in no particular order. |
| [getSourceCodeGroups](dw.campaign.Campaign.md#getsourcecodegroups)() | Returns the source codes assigned to the campaign. |
| [getStartDate](dw.campaign.Campaign.md#getstartdate)() | Returns the start date of the campaign. |
| [getStoreGroups](dw.campaign.Campaign.md#getstoregroups)() | Returns store groups assigned to the campaign. |
| [getStores](dw.campaign.Campaign.md#getstores)() | Returns stores assigned to the campaign. |
| [isActive](dw.campaign.Campaign.md#isactive)() | Returns 'true' if the campaign is currently active, otherwise  'false'. |
| [isApplicableInStore](dw.campaign.Campaign.md#isapplicableinstore)() | Returns true if campaign is applicable to store, otherwise false. |
| [isApplicableOnline](dw.campaign.Campaign.md#isapplicableonline)() | Returns true if campaign is applicable to online site, otherwise false. |
| [isEnabled](dw.campaign.Campaign.md#isenabled)() | Returns true if campaign is enabled, otherwise false. |

### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### ID
- ID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the unique campaign ID.


---

### active
- active: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns 'true' if the campaign is currently active, otherwise
      'false'. 
      
      A campaign is active if it is enabled and scheduled for _now_.



---

### applicableInStore
- applicableInStore: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns true if campaign is applicable to store, otherwise false.


---

### applicableOnline
- applicableOnline: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns true if campaign is applicable to online site, otherwise false.


---

### coupons
- coupons: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns the coupons assigned to the campaign.


---

### customerGroups
- customerGroups: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns the customer groups assigned to the campaign.


---

### description
- description: [String](TopLevel.String.md) `(read-only)`
  - : Returns the internal description of the campaign.


---

### enabled
- enabled: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns true if campaign is enabled, otherwise false.


---

### endDate
- endDate: [Date](TopLevel.Date.md) `(read-only)`
  - : Returns the end date of the campaign. If no end date is defined for the
      campaign, null is returned. A campaign w/o end date will run forever.



---

### promotions
- promotions: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns promotions defined in this campaign in no particular order.


---

### sourceCodeGroups
- sourceCodeGroups: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns the source codes assigned to the campaign.


---

### startDate
- startDate: [Date](TopLevel.Date.md) `(read-only)`
  - : Returns the start date of the campaign. If no start date is defined for the
      campaign, null is returned. A campaign w/o start date is immediately
      effective.



---

### storeGroups
- storeGroups: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns store groups assigned to the campaign.


---

### stores
- stores: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns stores assigned to the campaign.


---

## Method Details

### getCoupons()
- getCoupons(): [Collection](dw.util.Collection.md)
  - : Returns the coupons assigned to the campaign.

    **Returns:**
    - All coupons assigned to the campaign.


---

### getCustomerGroups()
- getCustomerGroups(): [Collection](dw.util.Collection.md)
  - : Returns the customer groups assigned to the campaign.

    **Returns:**
    - Customer groups assigned to campaign.


---

### getDescription()
- getDescription(): [String](TopLevel.String.md)
  - : Returns the internal description of the campaign.

    **Returns:**
    - Internal description of campaign.


---

### getEndDate()
- getEndDate(): [Date](TopLevel.Date.md)
  - : Returns the end date of the campaign. If no end date is defined for the
      campaign, null is returned. A campaign w/o end date will run forever.


    **Returns:**
    - End date of campaign.


---

### getID()
- getID(): [String](TopLevel.String.md)
  - : Returns the unique campaign ID.

    **Returns:**
    - ID of the campaign.


---

### getPromotions()
- getPromotions(): [Collection](dw.util.Collection.md)
  - : Returns promotions defined in this campaign in no particular order.

    **Returns:**
    - All promotions defined in campaign.


---

### getSourceCodeGroups()
- getSourceCodeGroups(): [Collection](dw.util.Collection.md)
  - : Returns the source codes assigned to the campaign.

    **Returns:**
    - All source code groups assigned to campaign.


---

### getStartDate()
- getStartDate(): [Date](TopLevel.Date.md)
  - : Returns the start date of the campaign. If no start date is defined for the
      campaign, null is returned. A campaign w/o start date is immediately
      effective.


    **Returns:**
    - Start date of campaign.


---

### getStoreGroups()
- getStoreGroups(): [Collection](dw.util.Collection.md)
  - : Returns store groups assigned to the campaign.

    **Returns:**
    - All store groups assigned to the campaign.


---

### getStores()
- getStores(): [Collection](dw.util.Collection.md)
  - : Returns stores assigned to the campaign.

    **Returns:**
    - All stores assigned to the campaign.


---

### isActive()
- isActive(): [Boolean](TopLevel.Boolean.md)
  - : Returns 'true' if the campaign is currently active, otherwise
      'false'. 
      
      A campaign is active if it is enabled and scheduled for _now_.


    **Returns:**
    - true of campaign is active, otherwise false.


---

### isApplicableInStore()
- isApplicableInStore(): [Boolean](TopLevel.Boolean.md)
  - : Returns true if campaign is applicable to store, otherwise false.

    **Returns:**
    - true if campaign is applicable to store, otherwise false.


---

### isApplicableOnline()
- isApplicableOnline(): [Boolean](TopLevel.Boolean.md)
  - : Returns true if campaign is applicable to online site, otherwise false.

    **Returns:**
    - true if campaign is applicable to online site, otherwise false.


---

### isEnabled()
- isEnabled(): [Boolean](TopLevel.Boolean.md)
  - : Returns true if campaign is enabled, otherwise false.

    **Returns:**
    - true if campaign is enabled, otherwise false.


---

<!-- prettier-ignore-end -->
