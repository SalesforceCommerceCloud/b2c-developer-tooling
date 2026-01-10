<!-- prettier-ignore-start -->
# Class Customer

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.customer.Customer](dw.customer.Customer.md)

Represents a customer.


## Property Summary

| Property | Description |
| --- | --- |
| [CDPData](#cdpdata): [CustomerCDPData](dw.customer.CustomerCDPData.md) `(read-only)` | Returns the Salesforce CDP (Customer Data Platform) data for this customer. |
| [ID](#id): [String](TopLevel.String.md) `(read-only)` | Returns the unique, system generated ID of the customer. |
| [activeData](#activedata): [CustomerActiveData](dw.customer.CustomerActiveData.md) `(read-only)` | Returns the active data for this customer. |
| [addressBook](#addressbook): [AddressBook](dw.customer.AddressBook.md) `(read-only)` | Returns the address book for the profile of this customer,  or `null` if this customer has no profile, such as for an  anonymous customer. |
| [anonymous](#anonymous): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if the customer is anonymous. |
| [authenticated](#authenticated): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if the customer is authenticated. |
| [customerGroups](#customergroups): [Collection](dw.util.Collection.md) `(read-only)` | Returns the customer groups this customer is member of. |
| [externalProfiles](#externalprofiles): [Collection](dw.util.Collection.md) `(read-only)` | Returns a collection of any external profiles the customer may have |
| [externallyAuthenticated](#externallyauthenticated): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if the customer is externally authenticated. |
| [globalPartyID](#globalpartyid): [String](TopLevel.String.md) `(read-only)` | Returns the Global Party ID for the customer, if there is one. |
| [note](#note): [String](TopLevel.String.md) | Returns the note for this customer, or `null` if this customer has no note, such as for an anonymous  customer or when note has 0 length. |
| [orderHistory](#orderhistory): [OrderHistory](dw.customer.OrderHistory.md) `(read-only)` | Returns the customer order history. |
| [profile](#profile): [Profile](dw.customer.Profile.md) `(read-only)` | Returns the customer profile. |
| [registered](#registered): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if the customer is registered. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [createExternalProfile](dw.customer.Customer.md#createexternalprofilestring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Creates an externalProfile and attaches it to the list of external profiles for the customer |
| [getActiveData](dw.customer.Customer.md#getactivedata)() | Returns the active data for this customer. |
| [getAddressBook](dw.customer.Customer.md#getaddressbook)() | Returns the address book for the profile of this customer,  or `null` if this customer has no profile, such as for an  anonymous customer. |
| [getCDPData](dw.customer.Customer.md#getcdpdata)() | Returns the Salesforce CDP (Customer Data Platform) data for this customer. |
| [getCustomerGroups](dw.customer.Customer.md#getcustomergroups)() | Returns the customer groups this customer is member of. |
| [getExternalProfile](dw.customer.Customer.md#getexternalprofilestring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | A convenience method for finding an external profile among the customer's external profiles collection |
| [getExternalProfiles](dw.customer.Customer.md#getexternalprofiles)() | Returns a collection of any external profiles the customer may have |
| [getGlobalPartyID](dw.customer.Customer.md#getglobalpartyid)() | Returns the Global Party ID for the customer, if there is one. |
| [getID](dw.customer.Customer.md#getid)() | Returns the unique, system generated ID of the customer. |
| [getNote](dw.customer.Customer.md#getnote)() | Returns the note for this customer, or `null` if this customer has no note, such as for an anonymous  customer or when note has 0 length. |
| [getOrderHistory](dw.customer.Customer.md#getorderhistory)() | Returns the customer order history. |
| [getProductLists](dw.customer.Customer.md#getproductlistsnumber)([Number](TopLevel.Number.md)) | Returns the product lists of the specified type. |
| [getProfile](dw.customer.Customer.md#getprofile)() | Returns the customer profile. |
| [isAnonymous](dw.customer.Customer.md#isanonymous)() | Identifies if the customer is anonymous. |
| [isAuthenticated](dw.customer.Customer.md#isauthenticated)() | Identifies if the customer is authenticated. |
| [isExternallyAuthenticated](dw.customer.Customer.md#isexternallyauthenticated)() | Identifies if the customer is externally authenticated. |
| [isMemberOfAnyCustomerGroup](dw.customer.Customer.md#ismemberofanycustomergroupstring)([String...](TopLevel.String.md)) | Returns true if there exist [CustomerGroup](dw.customer.CustomerGroup.md) for all of the given IDs and the customer is member of at least one of that groups. |
| [isMemberOfCustomerGroup](dw.customer.Customer.md#ismemberofcustomergroupcustomergroup)([CustomerGroup](dw.customer.CustomerGroup.md)) | Returns true if the customer is member of the specified  [CustomerGroup](dw.customer.CustomerGroup.md). |
| [isMemberOfCustomerGroup](dw.customer.Customer.md#ismemberofcustomergroupstring)([String](TopLevel.String.md)) | Returns true if there is a [CustomerGroup](dw.customer.CustomerGroup.md) with such an ID and the customer is member of that group. |
| [isMemberOfCustomerGroups](dw.customer.Customer.md#ismemberofcustomergroupsstring)([String...](TopLevel.String.md)) | Returns true if there exist [CustomerGroup](dw.customer.CustomerGroup.md) for all of the given IDs and the customer is member of all that groups. |
| [isRegistered](dw.customer.Customer.md#isregistered)() | Identifies if the customer is registered. |
| [removeExternalProfile](dw.customer.Customer.md#removeexternalprofileexternalprofile)([ExternalProfile](dw.customer.ExternalProfile.md)) | Removes an external profile from the customer |
| [setNote](dw.customer.Customer.md#setnotestring)([String](TopLevel.String.md)) | Sets the note for this customer. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### CDPData
- CDPData: [CustomerCDPData](dw.customer.CustomerCDPData.md) `(read-only)`
  - : Returns the Salesforce CDP (Customer Data Platform) data for this customer.


---

### ID
- ID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the unique, system generated ID of the customer.


---

### activeData
- activeData: [CustomerActiveData](dw.customer.CustomerActiveData.md) `(read-only)`
  - : Returns the active data for this customer.


---

### addressBook
- addressBook: [AddressBook](dw.customer.AddressBook.md) `(read-only)`
  - : Returns the address book for the profile of this customer,
      or `null` if this customer has no profile, such as for an
      anonymous customer.



---

### anonymous
- anonymous: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if the customer is anonymous. An anonymous
      customer is the opposite of a registered customer.



---

### authenticated
- authenticated: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if the customer is authenticated. This method checks whether
      this customer is the customer associated with the session and than checks
      whether the session in an authenticated state.
      
      Note: The pipeline debugger will always show 'false' for this value
      regardless of whether the customer is authenticated or not.



---

### customerGroups
- customerGroups: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns the customer groups this customer is member of.
      
      - Result contains static customer groups in storefront and job session
      - Result contains dynamic customer groups in storefront  and job session.  Dynamic customer groups referring session or request data are not available  when processing the customer in a job session, or when this customer is not the customer assigned to the current session.  
      - Result contains system groups 'Everyone', 'Unregistered', 'Registered' for all customers in storefront and job sessions



---

### externalProfiles
- externalProfiles: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns a collection of any external profiles the customer may have


---

### externallyAuthenticated
- externallyAuthenticated: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if the customer is externally authenticated. An externally
      authenticated customer does not have the password stored in our system
      but logs in through an external OAuth provider (Google, Facebook, LinkedIn, etc.)



---

### globalPartyID
- globalPartyID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the Global Party ID for the customer, if there is one.
      Global Party ID is created by Customer 360 and identifies a person across multiple systems.



---

### note
- note: [String](TopLevel.String.md)
  - : Returns the note for this customer, or `null` if this customer has no note, such as for an anonymous
      customer or when note has 0 length.



---

### orderHistory
- orderHistory: [OrderHistory](dw.customer.OrderHistory.md) `(read-only)`
  - : Returns the customer order history.


---

### profile
- profile: [Profile](dw.customer.Profile.md) `(read-only)`
  - : Returns the customer profile.


---

### registered
- registered: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if the customer is registered. A registered customer
      may or may not be authenticated. This method checks whether
      the user has a profile.



---

## Method Details

### createExternalProfile(String, String)
- createExternalProfile(authenticationProviderId: [String](TopLevel.String.md), externalId: [String](TopLevel.String.md)): [ExternalProfile](dw.customer.ExternalProfile.md)
  - : Creates an externalProfile and attaches it to the list of external profiles for the customer

    **Parameters:**
    - authenticationProviderId - the authenticationProviderId for the externalProfile
    - externalId - the externalId for the external Profile

    **Returns:**
    - the new externalProfile


---

### getActiveData()
- getActiveData(): [CustomerActiveData](dw.customer.CustomerActiveData.md)
  - : Returns the active data for this customer.

    **Returns:**
    - the active data for this customer.


---

### getAddressBook()
- getAddressBook(): [AddressBook](dw.customer.AddressBook.md)
  - : Returns the address book for the profile of this customer,
      or `null` if this customer has no profile, such as for an
      anonymous customer.



---

### getCDPData()
- getCDPData(): [CustomerCDPData](dw.customer.CustomerCDPData.md)
  - : Returns the Salesforce CDP (Customer Data Platform) data for this customer.

    **Returns:**
    - the Salesforce CDP data for this customer.


---

### getCustomerGroups()
- getCustomerGroups(): [Collection](dw.util.Collection.md)
  - : Returns the customer groups this customer is member of.
      
      - Result contains static customer groups in storefront and job session
      - Result contains dynamic customer groups in storefront  and job session.  Dynamic customer groups referring session or request data are not available  when processing the customer in a job session, or when this customer is not the customer assigned to the current session.  
      - Result contains system groups 'Everyone', 'Unregistered', 'Registered' for all customers in storefront and job sessions


    **Returns:**
    - Collection of customer groups of this customer


---

### getExternalProfile(String, String)
- getExternalProfile(authenticationProviderId: [String](TopLevel.String.md), externalId: [String](TopLevel.String.md)): [ExternalProfile](dw.customer.ExternalProfile.md)
  - : A convenience method for finding an external profile among the customer's external profiles collection

    **Parameters:**
    - authenticationProviderId - the authenticationProviderId to look for
    - externalId - the externalId to look for

    **Returns:**
    - the externalProfile found among the customer's external profile or null if not found


---

### getExternalProfiles()
- getExternalProfiles(): [Collection](dw.util.Collection.md)
  - : Returns a collection of any external profiles the customer may have

    **Returns:**
    - a collection of any external profiles the customer may have


---

### getGlobalPartyID()
- getGlobalPartyID(): [String](TopLevel.String.md)
  - : Returns the Global Party ID for the customer, if there is one.
      Global Party ID is created by Customer 360 and identifies a person across multiple systems.


    **Returns:**
    - The global party ID


---

### getID()
- getID(): [String](TopLevel.String.md)
  - : Returns the unique, system generated ID of the customer.

    **Returns:**
    - the ID of the customer.


---

### getNote()
- getNote(): [String](TopLevel.String.md)
  - : Returns the note for this customer, or `null` if this customer has no note, such as for an anonymous
      customer or when note has 0 length.


    **Returns:**
    - the note for this customer.


---

### getOrderHistory()
- getOrderHistory(): [OrderHistory](dw.customer.OrderHistory.md)
  - : Returns the customer order history.

    **Returns:**
    - the customer order history.


---

### getProductLists(Number)
- getProductLists(type: [Number](TopLevel.Number.md)): [Collection](dw.util.Collection.md)
  - : Returns the product lists of the specified type.

    **Parameters:**
    - type - the type of product lists to return.

    **Returns:**
    - the product lists of the specified type.

    **See Also:**
    - [ProductList](dw.customer.ProductList.md)


---

### getProfile()
- getProfile(): [Profile](dw.customer.Profile.md)
  - : Returns the customer profile.

    **Returns:**
    - the customer profile.


---

### isAnonymous()
- isAnonymous(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if the customer is anonymous. An anonymous
      customer is the opposite of a registered customer.


    **Returns:**
    - true if the customer is anonymous, false otherwise.
      
      
      **Note:** this method handles sensitive security-related data.
      Pay special attention to PCI DSS v3. requirements 2, 4, and 12.



---

### isAuthenticated()
- isAuthenticated(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if the customer is authenticated. This method checks whether
      this customer is the customer associated with the session and than checks
      whether the session in an authenticated state.
      
      Note: The pipeline debugger will always show 'false' for this value
      regardless of whether the customer is authenticated or not.


    **Returns:**
    - true if the customer is authenticated, false otherwise.


---

### isExternallyAuthenticated()
- isExternallyAuthenticated(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if the customer is externally authenticated. An externally
      authenticated customer does not have the password stored in our system
      but logs in through an external OAuth provider (Google, Facebook, LinkedIn, etc.)


    **Returns:**
    - true if the customer is externally authenticated, false otherwise.
      
      
      **Note:** this method handles sensitive security-related data.
      Pay special attention to PCI DSS v3. requirements 2, 4, and 12.



---

### isMemberOfAnyCustomerGroup(String...)
- isMemberOfAnyCustomerGroup(groupIDs: [String...](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Returns true if there exist [CustomerGroup](dw.customer.CustomerGroup.md) for all of the given IDs and the customer is member of at least one of that groups.

    **Parameters:**
    - groupIDs - A list of unique semantic customer group IDs.

    **Returns:**
    - True if customer groups exist for the given IDs and the customer is member of at least one of that existing groups.
      False if none of customer groups exist or if the customer is not a member of any of that existing groups.



---

### isMemberOfCustomerGroup(CustomerGroup)
- isMemberOfCustomerGroup(group: [CustomerGroup](dw.customer.CustomerGroup.md)): [Boolean](TopLevel.Boolean.md)
  - : Returns true if the customer is member of the specified
      [CustomerGroup](dw.customer.CustomerGroup.md).


    **Parameters:**
    - group - Customer group

    **Returns:**
    - True if customer is member of the group, otherwise false.


---

### isMemberOfCustomerGroup(String)
- isMemberOfCustomerGroup(groupID: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Returns true if there is a [CustomerGroup](dw.customer.CustomerGroup.md) with such an ID and the customer is member of that group.

    **Parameters:**
    - groupID - The unique semantic customer group ID.

    **Returns:**
    - True if a customer group with such an ID exist and the customer is member of that group.
      False if no such customer group exist or, if the group exist, the customer is not member of that group.



---

### isMemberOfCustomerGroups(String...)
- isMemberOfCustomerGroups(groupIDs: [String...](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Returns true if there exist [CustomerGroup](dw.customer.CustomerGroup.md) for all of the given IDs and the customer is member of all that groups.

    **Parameters:**
    - groupIDs - A list of unique semantic customer group IDs.

    **Returns:**
    - True if customer groups exist for all of the given IDs and the customer is member of all that groups.
      False if there is at least one ID for which no customer group exist or, if all groups exist, the customer is not member of all that groups.



---

### isRegistered()
- isRegistered(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if the customer is registered. A registered customer
      may or may not be authenticated. This method checks whether
      the user has a profile.


    **Returns:**
    - true if the customer is registered, false otherwise.


---

### removeExternalProfile(ExternalProfile)
- removeExternalProfile(externalProfile: [ExternalProfile](dw.customer.ExternalProfile.md)): void
  - : Removes an external profile from the customer

    **Parameters:**
    - externalProfile - the externalProfile to be removed


---

### setNote(String)
- setNote(aValue: [String](TopLevel.String.md)): void
  - : Sets the note for this customer. This is a no-op for an anonymous customer.

    **Parameters:**
    - aValue - the value of the note


---

<!-- prettier-ignore-end -->
