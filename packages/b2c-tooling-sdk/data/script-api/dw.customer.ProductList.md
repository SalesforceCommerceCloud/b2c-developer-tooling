<!-- prettier-ignore-start -->
# Class ProductList

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)
      - [dw.customer.ProductList](dw.customer.ProductList.md)

Represents a list of products (and optionally a gift certificate) that is
typically maintained by a customer.  This class can be used to implement
a number of different storefront features, e.g. shopping list, wish list and gift registry.
A product list is always owned by a customer. The owner can be anonymous or a registered customer.
The owner can be the person for which items from that list will be purchased (wish list).
Or it can be a person who maintains the list, for example a gift registry, on behalf of the bridal couple.
Each product list can have a registrant and a co-registrant. A registrant is typically associated with an event related product list
such as a gift registry. It holds information about a person associated with the
event such as a bride or groom.
A shipping address can be associated with this product list to ship the items,
e.g. to an event location. A post-event shipping address can be associated to
ship items to which could not be delivered on event date.
The product list can also hold information about the event date and event location.



## Constant Summary

| Constant | Description |
| --- | --- |
| [EXPORT_STATUS_EXPORTED](#export_status_exported): [Number](TopLevel.Number.md) = 1 | Constant for when Export Status is Exported |
| [EXPORT_STATUS_NOTEXPORTED](#export_status_notexported): [Number](TopLevel.Number.md) = 0 | Constant for when Export Status is Not Exported |
| [TYPE_CUSTOM_1](#type_custom_1): [Number](TopLevel.Number.md) = 100 | Constant representing a custom list type attribute. |
| [TYPE_CUSTOM_2](#type_custom_2): [Number](TopLevel.Number.md) = 101 | Constant representing a custom list type attribute. |
| [TYPE_CUSTOM_3](#type_custom_3): [Number](TopLevel.Number.md) = 102 | Constant representing a custom list type attribute. |
| [TYPE_GIFT_REGISTRY](#type_gift_registry): [Number](TopLevel.Number.md) = 11 | Constant representing the gift registry type attribute. |
| [TYPE_SHOPPING_LIST](#type_shopping_list): [Number](TopLevel.Number.md) = 12 | Constant representing the shopping list type attribute. |
| [TYPE_WISH_LIST](#type_wish_list): [Number](TopLevel.Number.md) = 10 | Constant representing the wish list registry type attribute. |

## Property Summary

| Property | Description |
| --- | --- |
| [ID](#id): [String](TopLevel.String.md) `(read-only)` | Returns the unique system generated ID of the object. |
| [anonymous](#anonymous): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns true if this product list is owned by an anonymous customer. |
| [coRegistrant](#coregistrant): [ProductListRegistrant](dw.customer.ProductListRegistrant.md) `(read-only)` | Returns the ProductListRegistrant assigned to the coRegistrant attribute or null  if this list has no co-registrant. |
| [currentShippingAddress](#currentshippingaddress): [CustomerAddress](dw.customer.CustomerAddress.md) `(read-only)` | This is a helper method typically used with an event related list. |
| [description](#description): [String](TopLevel.String.md) | Returns a description text that, for example, explains the purpose of this product list. |
| [eventCity](#eventcity): [String](TopLevel.String.md) | For event related uses (e.g. |
| [eventCountry](#eventcountry): [String](TopLevel.String.md) | For event related uses (e.g. |
| [eventDate](#eventdate): [Date](TopLevel.Date.md) | For event related uses (e.g. |
| [eventState](#eventstate): [String](TopLevel.String.md) | For event related uses (e.g. |
| [eventType](#eventtype): [String](TopLevel.String.md) | For event related uses (e.g. |
| [exportStatus](#exportstatus): [EnumValue](dw.value.EnumValue.md) `(read-only)` | Returns the export status of the product list.<br/>  Possible values are: [EXPORT_STATUS_NOTEXPORTED](dw.customer.ProductList.md#export_status_notexported),  [EXPORT_STATUS_EXPORTED](dw.customer.ProductList.md#export_status_exported). |
| [giftCertificateItem](#giftcertificateitem): [ProductListItem](dw.customer.ProductListItem.md) `(read-only)` | Returns the item in the list that represents a gift certificate. |
| [items](#items): [Collection](dw.util.Collection.md) `(read-only)` | Returns a collection containing all items in the list. |
| [lastExportTime](#lastexporttime): [Date](TopLevel.Date.md) `(read-only)` | Returns the date where this product list has been exported successfully  the last time. |
| [name](#name): [String](TopLevel.String.md) | Returns the name of this product list given by its owner. |
| [owner](#owner): [Customer](dw.customer.Customer.md) `(read-only)` | Returns the customer that created and owns the product list. |
| [postEventShippingAddress](#posteventshippingaddress): [CustomerAddress](dw.customer.CustomerAddress.md) | Returns the shipping address for purchases made after the event date. |
| [productItems](#productitems): [Collection](dw.util.Collection.md) `(read-only)` | Returns a collection containing all items in the list that reference products. |
| [public](#public): [Boolean](TopLevel.Boolean.md) | A flag, typically used to determine if the object is searchable  by other customers. |
| [publicItems](#publicitems): [Collection](dw.util.Collection.md) `(read-only)` | Returns a collection containing all items in the list that are flagged as public. |
| [purchases](#purchases): [Collection](dw.util.Collection.md) `(read-only)` | Returns the aggregated purchases from all the individual items. |
| [registrant](#registrant): [ProductListRegistrant](dw.customer.ProductListRegistrant.md) `(read-only)` | Returns the ProductListRegistrant assigned to the registrant attribute or null  if this list has no registrant. |
| [shippingAddress](#shippingaddress): [CustomerAddress](dw.customer.CustomerAddress.md) | Return the address that should be used as the shipping address for purchases  made from the list. |
| [type](#type): [Number](TopLevel.Number.md) `(read-only)` | Returns an int representing the type of object (e.g. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [createCoRegistrant](dw.customer.ProductList.md#createcoregistrant)() | Create a ProductListRegistrant and assign it to the coRegistrant attribute  of the list. |
| [createGiftCertificateItem](dw.customer.ProductList.md#creategiftcertificateitem)() | Create an item in the list that represents a gift certificate. |
| [createProductItem](dw.customer.ProductList.md#createproductitemproduct)([Product](dw.catalog.Product.md)) | Create an item in the list that references the specified product. |
| [createRegistrant](dw.customer.ProductList.md#createregistrant)() | Create a ProductListRegistrant and assign it to the registrant attribute  of the list. |
| [getCoRegistrant](dw.customer.ProductList.md#getcoregistrant)() | Returns the ProductListRegistrant assigned to the coRegistrant attribute or null  if this list has no co-registrant. |
| [getCurrentShippingAddress](dw.customer.ProductList.md#getcurrentshippingaddress)() | This is a helper method typically used with an event related list. |
| [getDescription](dw.customer.ProductList.md#getdescription)() | Returns a description text that, for example, explains the purpose of this product list. |
| [getEventCity](dw.customer.ProductList.md#geteventcity)() | For event related uses (e.g. |
| [getEventCountry](dw.customer.ProductList.md#geteventcountry)() | For event related uses (e.g. |
| [getEventDate](dw.customer.ProductList.md#geteventdate)() | For event related uses (e.g. |
| [getEventState](dw.customer.ProductList.md#geteventstate)() | For event related uses (e.g. |
| [getEventType](dw.customer.ProductList.md#geteventtype)() | For event related uses (e.g. |
| [getExportStatus](dw.customer.ProductList.md#getexportstatus)() | Returns the export status of the product list.<br/>  Possible values are: [EXPORT_STATUS_NOTEXPORTED](dw.customer.ProductList.md#export_status_notexported),  [EXPORT_STATUS_EXPORTED](dw.customer.ProductList.md#export_status_exported). |
| [getGiftCertificateItem](dw.customer.ProductList.md#getgiftcertificateitem)() | Returns the item in the list that represents a gift certificate. |
| [getID](dw.customer.ProductList.md#getid)() | Returns the unique system generated ID of the object. |
| [getItem](dw.customer.ProductList.md#getitemstring)([String](TopLevel.String.md)) | Returns the item from the list that has the specified ID. |
| [getItems](dw.customer.ProductList.md#getitems)() | Returns a collection containing all items in the list. |
| [getLastExportTime](dw.customer.ProductList.md#getlastexporttime)() | Returns the date where this product list has been exported successfully  the last time. |
| [getName](dw.customer.ProductList.md#getname)() | Returns the name of this product list given by its owner. |
| [getOwner](dw.customer.ProductList.md#getowner)() | Returns the customer that created and owns the product list. |
| [getPostEventShippingAddress](dw.customer.ProductList.md#getposteventshippingaddress)() | Returns the shipping address for purchases made after the event date. |
| [getProductItems](dw.customer.ProductList.md#getproductitems)() | Returns a collection containing all items in the list that reference products. |
| [getPublicItems](dw.customer.ProductList.md#getpublicitems)() | Returns a collection containing all items in the list that are flagged as public. |
| [getPurchases](dw.customer.ProductList.md#getpurchases)() | Returns the aggregated purchases from all the individual items. |
| [getRegistrant](dw.customer.ProductList.md#getregistrant)() | Returns the ProductListRegistrant assigned to the registrant attribute or null  if this list has no registrant. |
| [getShippingAddress](dw.customer.ProductList.md#getshippingaddress)() | Return the address that should be used as the shipping address for purchases  made from the list. |
| [getType](dw.customer.ProductList.md#gettype)() | Returns an int representing the type of object (e.g. |
| [isAnonymous](dw.customer.ProductList.md#isanonymous)() | Returns true if this product list is owned by an anonymous customer. |
| [isPublic](dw.customer.ProductList.md#ispublic)() | A flag, typically used to determine if the object is searchable  by other customers. |
| [removeCoRegistrant](dw.customer.ProductList.md#removecoregistrant)() | Removes the ProductListRegistrant assigned to the coRegistrant attribute. |
| [removeItem](dw.customer.ProductList.md#removeitemproductlistitem)([ProductListItem](dw.customer.ProductListItem.md)) | Removes the specified item from the list. |
| [removeRegistrant](dw.customer.ProductList.md#removeregistrant)() | Removes the ProductListRegistrant assigned to the registrant attribute. |
| [setDescription](dw.customer.ProductList.md#setdescriptionstring)([String](TopLevel.String.md)) | Set the description of this product list. |
| [setEventCity](dw.customer.ProductList.md#seteventcitystring)([String](TopLevel.String.md)) | Set the event city to which this product list is related. |
| [setEventCountry](dw.customer.ProductList.md#seteventcountrystring)([String](TopLevel.String.md)) | Set the event country to which this product list is related. |
| [setEventDate](dw.customer.ProductList.md#seteventdatedate)([Date](TopLevel.Date.md)) | Set the date of the event to which this product list is related. |
| [setEventState](dw.customer.ProductList.md#seteventstatestring)([String](TopLevel.String.md)) | Set the event state to which this product list is related. |
| [setEventType](dw.customer.ProductList.md#seteventtypestring)([String](TopLevel.String.md)) | Set the event type for which this product list was created by the owner. |
| [setName](dw.customer.ProductList.md#setnamestring)([String](TopLevel.String.md)) | Set the name of this product list. |
| [setPostEventShippingAddress](dw.customer.ProductList.md#setposteventshippingaddresscustomeraddress)([CustomerAddress](dw.customer.CustomerAddress.md)) | This is typically used by an event related list (e.g. |
| [setPublic](dw.customer.ProductList.md#setpublicboolean)([Boolean](TopLevel.Boolean.md)) | Makes this product list visible to other customers or hides it. |
| [setShippingAddress](dw.customer.ProductList.md#setshippingaddresscustomeraddress)([CustomerAddress](dw.customer.CustomerAddress.md)) | Associate an address, used as the shipping address for purchases  made from the list. |

### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### EXPORT_STATUS_EXPORTED

- EXPORT_STATUS_EXPORTED: [Number](TopLevel.Number.md) = 1
  - : Constant for when Export Status is Exported


---

### EXPORT_STATUS_NOTEXPORTED

- EXPORT_STATUS_NOTEXPORTED: [Number](TopLevel.Number.md) = 0
  - : Constant for when Export Status is Not Exported


---

### TYPE_CUSTOM_1

- TYPE_CUSTOM_1: [Number](TopLevel.Number.md) = 100
  - : Constant representing a custom list type attribute.


---

### TYPE_CUSTOM_2

- TYPE_CUSTOM_2: [Number](TopLevel.Number.md) = 101
  - : Constant representing a custom list type attribute.


---

### TYPE_CUSTOM_3

- TYPE_CUSTOM_3: [Number](TopLevel.Number.md) = 102
  - : Constant representing a custom list type attribute.


---

### TYPE_GIFT_REGISTRY

- TYPE_GIFT_REGISTRY: [Number](TopLevel.Number.md) = 11
  - : Constant representing the gift registry type attribute.


---

### TYPE_SHOPPING_LIST

- TYPE_SHOPPING_LIST: [Number](TopLevel.Number.md) = 12
  - : Constant representing the shopping list type attribute.


---

### TYPE_WISH_LIST

- TYPE_WISH_LIST: [Number](TopLevel.Number.md) = 10
  - : Constant representing the wish list registry type attribute.


---

## Property Details

### ID
- ID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the unique system generated ID of the object.


---

### anonymous
- anonymous: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns true if this product list is owned by an anonymous customer.


---

### coRegistrant
- coRegistrant: [ProductListRegistrant](dw.customer.ProductListRegistrant.md) `(read-only)`
  - : Returns the ProductListRegistrant assigned to the coRegistrant attribute or null
      if this list has no co-registrant.



---

### currentShippingAddress
- currentShippingAddress: [CustomerAddress](dw.customer.CustomerAddress.md) `(read-only)`
  - : This is a helper method typically used with an event related list.
      It provides the appropriate shipping address based on the eventDate.
      If the current date is after the eventDate, then the postEventShippingAddress
      is returned, otherwise the shippingAddress is returned.  If the eventDate
      is null, then null is returned.



---

### description
- description: [String](TopLevel.String.md)
  - : Returns a description text that, for example, explains the purpose of this product list.


---

### eventCity
- eventCity: [String](TopLevel.String.md)
  - : For event related uses (e.g. gift registry), this holds the event city.


---

### eventCountry
- eventCountry: [String](TopLevel.String.md)
  - : For event related uses (e.g. gift registry), this holds the event country.


---

### eventDate
- eventDate: [Date](TopLevel.Date.md)
  - : For event related uses (e.g. gift registry), this holds the date
      of the event.



---

### eventState
- eventState: [String](TopLevel.String.md)
  - : For event related uses (e.g. gift registry), this holds the event state.


---

### eventType
- eventType: [String](TopLevel.String.md)
  - : For event related uses (e.g. gift registry), this holds the type
      of event, e.g. Wedding, Baby Shower.



---

### exportStatus
- exportStatus: [EnumValue](dw.value.EnumValue.md) `(read-only)`
  - : Returns the export status of the product list.
      
      Possible values are: [EXPORT_STATUS_NOTEXPORTED](dw.customer.ProductList.md#export_status_notexported),
      [EXPORT_STATUS_EXPORTED](dw.customer.ProductList.md#export_status_exported).



---

### giftCertificateItem
- giftCertificateItem: [ProductListItem](dw.customer.ProductListItem.md) `(read-only)`
  - : Returns the item in the list that represents a gift certificate.


---

### items
- items: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns a collection containing all items in the list.


---

### lastExportTime
- lastExportTime: [Date](TopLevel.Date.md) `(read-only)`
  - : Returns the date where this product list has been exported successfully
      the last time.



---

### name
- name: [String](TopLevel.String.md)
  - : Returns the name of this product list given by its owner.


---

### owner
- owner: [Customer](dw.customer.Customer.md) `(read-only)`
  - : Returns the customer that created and owns the product list.


---

### postEventShippingAddress
- postEventShippingAddress: [CustomerAddress](dw.customer.CustomerAddress.md)
  - : Returns the shipping address for purchases made after the event date.


---

### productItems
- productItems: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns a collection containing all items in the list that reference products.


---

### public
- public: [Boolean](TopLevel.Boolean.md)
  - : A flag, typically used to determine if the object is searchable
      by other customers.



---

### publicItems
- publicItems: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns a collection containing all items in the list that are flagged as public.


---

### purchases
- purchases: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns the aggregated purchases from all the individual items.


---

### registrant
- registrant: [ProductListRegistrant](dw.customer.ProductListRegistrant.md) `(read-only)`
  - : Returns the ProductListRegistrant assigned to the registrant attribute or null
      if this list has no registrant.



---

### shippingAddress
- shippingAddress: [CustomerAddress](dw.customer.CustomerAddress.md)
  - : Return the address that should be used as the shipping address for purchases
      made from the list.



---

### type
- type: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns an int representing the type of object (e.g. wish list,
      gift registry). This is set at object creation time.



---

## Method Details

### createCoRegistrant()
- createCoRegistrant(): [ProductListRegistrant](dw.customer.ProductListRegistrant.md)
  - : Create a ProductListRegistrant and assign it to the coRegistrant attribute
      of the list.  An exception is thrown if the list already has a coRegistrant
      assigned to it.


    **Returns:**
    - the created ProductListRegistrant instance.

    **Throws:**
    - CreateException - if one already exists


---

### createGiftCertificateItem()
- createGiftCertificateItem(): [ProductListItem](dw.customer.ProductListItem.md)
  - : Create an item in the list that represents a gift certificate.
      A list may only contain a single gift certificate, so an exception
      is thrown if one already exists in the list.


    **Returns:**
    - the created item.

    **Throws:**
    - CreateException - if a gift certificate item already exists in the list.


---

### createProductItem(Product)
- createProductItem(product: [Product](dw.catalog.Product.md)): [ProductListItem](dw.customer.ProductListItem.md)
  - : Create an item in the list that references the specified product.

    **Parameters:**
    - product - the product to use to create the list item.

    **Returns:**
    - the created item.


---

### createRegistrant()
- createRegistrant(): [ProductListRegistrant](dw.customer.ProductListRegistrant.md)
  - : Create a ProductListRegistrant and assign it to the registrant attribute
      of the list.  An exception is thrown if the list already has a registrant
      assigned to it.


    **Returns:**
    - the created ProductListRegistrant instance.

    **Throws:**
    - CreateException - if one already exists


---

### getCoRegistrant()
- getCoRegistrant(): [ProductListRegistrant](dw.customer.ProductListRegistrant.md)
  - : Returns the ProductListRegistrant assigned to the coRegistrant attribute or null
      if this list has no co-registrant.


    **Returns:**
    - the ProductListRegistrant assigned to the coRegistrant attribute or null
      if this list has no co-registrant.



---

### getCurrentShippingAddress()
- getCurrentShippingAddress(): [CustomerAddress](dw.customer.CustomerAddress.md)
  - : This is a helper method typically used with an event related list.
      It provides the appropriate shipping address based on the eventDate.
      If the current date is after the eventDate, then the postEventShippingAddress
      is returned, otherwise the shippingAddress is returned.  If the eventDate
      is null, then null is returned.


    **Returns:**
    - the appropriate address, as described above.


---

### getDescription()
- getDescription(): [String](TopLevel.String.md)
  - : Returns a description text that, for example, explains the purpose of this product list.

    **Returns:**
    - a description text explaining the purpose of this product list.
      Returns an empty string if the description is not set.



---

### getEventCity()
- getEventCity(): [String](TopLevel.String.md)
  - : For event related uses (e.g. gift registry), this holds the event city.

    **Returns:**
    - the event city. The event city or an empty string if no event city is set.


---

### getEventCountry()
- getEventCountry(): [String](TopLevel.String.md)
  - : For event related uses (e.g. gift registry), this holds the event country.

    **Returns:**
    - the event country. The event country or an empty string if no event country is set.


---

### getEventDate()
- getEventDate(): [Date](TopLevel.Date.md)
  - : For event related uses (e.g. gift registry), this holds the date
      of the event.


    **Returns:**
    - the date of the event.


---

### getEventState()
- getEventState(): [String](TopLevel.String.md)
  - : For event related uses (e.g. gift registry), this holds the event state.

    **Returns:**
    - the event state. The event state or an empty string if no event state is set.


---

### getEventType()
- getEventType(): [String](TopLevel.String.md)
  - : For event related uses (e.g. gift registry), this holds the type
      of event, e.g. Wedding, Baby Shower.


    **Returns:**
    - the type of event. Returns an empty string, if not set.


---

### getExportStatus()
- getExportStatus(): [EnumValue](dw.value.EnumValue.md)
  - : Returns the export status of the product list.
      
      Possible values are: [EXPORT_STATUS_NOTEXPORTED](dw.customer.ProductList.md#export_status_notexported),
      [EXPORT_STATUS_EXPORTED](dw.customer.ProductList.md#export_status_exported).


    **Returns:**
    - Product list export status


---

### getGiftCertificateItem()
- getGiftCertificateItem(): [ProductListItem](dw.customer.ProductListItem.md)
  - : Returns the item in the list that represents a gift certificate.

    **Returns:**
    - the gift certificate item, or null if it doesn't exist.


---

### getID()
- getID(): [String](TopLevel.String.md)
  - : Returns the unique system generated ID of the object.

    **Returns:**
    - the ID of object.


---

### getItem(String)
- getItem(ID: [String](TopLevel.String.md)): [ProductListItem](dw.customer.ProductListItem.md)
  - : Returns the item from the list that has the specified ID.

    **Parameters:**
    - ID - the product list item identifier.

    **Returns:**
    - the specified item, or null if it's not found in the list.


---

### getItems()
- getItems(): [Collection](dw.util.Collection.md)
  - : Returns a collection containing all items in the list.

    **Returns:**
    - all items.


---

### getLastExportTime()
- getLastExportTime(): [Date](TopLevel.Date.md)
  - : Returns the date where this product list has been exported successfully
      the last time.


    **Returns:**
    - The time of the last successful export or null if this product list
      was not exported yet.



---

### getName()
- getName(): [String](TopLevel.String.md)
  - : Returns the name of this product list given by its owner.

    **Returns:**
    - the name of this product list. Returns an empty string if the name is not set.


---

### getOwner()
- getOwner(): [Customer](dw.customer.Customer.md)
  - : Returns the customer that created and owns the product list.

    **Returns:**
    - Owning customer


---

### getPostEventShippingAddress()
- getPostEventShippingAddress(): [CustomerAddress](dw.customer.CustomerAddress.md)
  - : Returns the shipping address for purchases made after the event date.

    **Returns:**
    - the shipping address for purchases made after the event date.
      Returns null if no post-event shipping address is associated.



---

### getProductItems()
- getProductItems(): [Collection](dw.util.Collection.md)
  - : Returns a collection containing all items in the list that reference products.

    **Returns:**
    - all product items.


---

### getPublicItems()
- getPublicItems(): [Collection](dw.util.Collection.md)
  - : Returns a collection containing all items in the list that are flagged as public.

    **Returns:**
    - all public items.


---

### getPurchases()
- getPurchases(): [Collection](dw.util.Collection.md)
  - : Returns the aggregated purchases from all the individual items.

    **Returns:**
    - purchases


---

### getRegistrant()
- getRegistrant(): [ProductListRegistrant](dw.customer.ProductListRegistrant.md)
  - : Returns the ProductListRegistrant assigned to the registrant attribute or null
      if this list has no registrant.


    **Returns:**
    - the ProductListRegistrant assigned to the registrant attribute or null
      if this list has no registrant.



---

### getShippingAddress()
- getShippingAddress(): [CustomerAddress](dw.customer.CustomerAddress.md)
  - : Return the address that should be used as the shipping address for purchases
      made from the list.


    **Returns:**
    - the shipping address. The shipping address of this list or null
      if no address is associated.



---

### getType()
- getType(): [Number](TopLevel.Number.md)
  - : Returns an int representing the type of object (e.g. wish list,
      gift registry). This is set at object creation time.


    **Returns:**
    - the type of object.


---

### isAnonymous()
- isAnonymous(): [Boolean](TopLevel.Boolean.md)
  - : Returns true if this product list is owned by an anonymous customer.

    **Returns:**
    - true if the owner of this product list is anonymous, false otherwise.


---

### isPublic()
- isPublic(): [Boolean](TopLevel.Boolean.md)
  - : A flag, typically used to determine if the object is searchable
      by other customers.


    **Returns:**
    - true if the product list is public. False otherwise.


---

### removeCoRegistrant()
- removeCoRegistrant(): void
  - : Removes the ProductListRegistrant assigned to the coRegistrant attribute.


---

### removeItem(ProductListItem)
- removeItem(item: [ProductListItem](dw.customer.ProductListItem.md)): void
  - : Removes the specified item from the list.  This will also cause
      all purchase information associated with that item to be removed.


    **Parameters:**
    - item - The item to remove.


---

### removeRegistrant()
- removeRegistrant(): void
  - : Removes the ProductListRegistrant assigned to the registrant attribute.


---

### setDescription(String)
- setDescription(description: [String](TopLevel.String.md)): void
  - : Set the description of this product list.

    **Parameters:**
    - description - The description of this product list.  The description can have up to 256 characters, longer descriptions get truncated.  If an empty string is provided, the description gets set to null.


---

### setEventCity(String)
- setEventCity(eventCity: [String](TopLevel.String.md)): void
  - : Set the event city to which this product list is related.

    **Parameters:**
    - eventCity - The event city can have up to 256 characters, longer event city get truncated.  If an empty string is provided, the event city gets set to null.


---

### setEventCountry(String)
- setEventCountry(eventCountry: [String](TopLevel.String.md)): void
  - : Set the event country to which this product list is related.

    **Parameters:**
    - eventCountry - The event country can have up to 256 characters, longer event country get truncated.  If an empty string is provided, the event country gets set to null.


---

### setEventDate(Date)
- setEventDate(eventDate: [Date](TopLevel.Date.md)): void
  - : Set the date of the event to which this product list is related.

    **Parameters:**
    - eventDate - The event date or null if no event date should be available.


---

### setEventState(String)
- setEventState(eventState: [String](TopLevel.String.md)): void
  - : Set the event state to which this product list is related.

    **Parameters:**
    - eventState - The event state can have up to 256 characters, longer event state get truncated.  If an empty string is provided, the event state gets set to null.


---

### setEventType(String)
- setEventType(eventType: [String](TopLevel.String.md)): void
  - : Set the event type for which this product list was created by the owner.

    **Parameters:**
    - eventType - The event type can have up to 256 characters, longer event type get truncated.  If an empty string is provided, the event type gets set to null.


---

### setName(String)
- setName(name: [String](TopLevel.String.md)): void
  - : Set the name of this product list.

    **Parameters:**
    - name - The name of this product list.  The name can have up to 256 characters, longer names get truncated.  If an empty string is provided, the name gets set to null.


---

### setPostEventShippingAddress(CustomerAddress)
- setPostEventShippingAddress(address: [CustomerAddress](dw.customer.CustomerAddress.md)): void
  - : This is typically used by an event related list (e.g. gift registry) to
      specify a shipping address for purchases made after the event date.


    **Parameters:**
    - address - The shipping address.


---

### setPublic(Boolean)
- setPublic(flag: [Boolean](TopLevel.Boolean.md)): void
  - : Makes this product list visible to other customers or hides it.

    **Parameters:**
    - flag - If true, this product list becomes visible to other customers.  If false, this product list can only be seen and searched by its owner.


---

### setShippingAddress(CustomerAddress)
- setShippingAddress(address: [CustomerAddress](dw.customer.CustomerAddress.md)): void
  - : Associate an address, used as the shipping address for purchases
      made from the list.


    **Parameters:**
    - address - The shipping address.


---

<!-- prettier-ignore-end -->
