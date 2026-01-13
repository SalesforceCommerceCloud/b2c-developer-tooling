<!-- prettier-ignore-start -->
# Class CustomerAddress

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)
      - [dw.customer.CustomerAddress](dw.customer.CustomerAddress.md)

The Address class represents a customer's address.


**Note:** this class allows access to sensitive personal and private information.
Pay attention to appropriate legal and regulatory requirements.



## Property Summary

| Property | Description |
| --- | --- |
| [ID](#id): [String](TopLevel.String.md) | Returns the name of the address. |
| [address1](#address1): [String](TopLevel.String.md) | Returns the customer's first address. |
| [address2](#address2): [String](TopLevel.String.md) | Returns the customer's second address value. |
| [city](#city): [String](TopLevel.String.md) | Returns the customer's city. |
| [companyName](#companyname): [String](TopLevel.String.md) | Returns the customer's company name. |
| [countryCode](#countrycode): [EnumValue](dw.value.EnumValue.md) | Returns the customer's country code. |
| [firstName](#firstname): [String](TopLevel.String.md) | Returns the customer's first name. |
| [fullName](#fullname): [String](TopLevel.String.md) `(read-only)` | Returns a concatenation of the customer's first, middle,  and last names and its suffix. |
| [jobTitle](#jobtitle): [String](TopLevel.String.md) | Returns the customer's job title. |
| [lastName](#lastname): [String](TopLevel.String.md) | Returns the customer's last name. |
| [phone](#phone): [String](TopLevel.String.md) | Returns the customer's phone number. |
| [postBox](#postbox): [String](TopLevel.String.md) | Returns the customer's post box. |
| [postalCode](#postalcode): [String](TopLevel.String.md) | Returns the customer's postal code. |
| [salutation](#salutation): [String](TopLevel.String.md) | Returns the customer's salutation. |
| [secondName](#secondname): [String](TopLevel.String.md) | Returns the customer's second name. |
| [stateCode](#statecode): [String](TopLevel.String.md) | Returns the customer's state. |
| [suffix](#suffix): [String](TopLevel.String.md) | Returns the customer's suffix. |
| [suite](#suite): [String](TopLevel.String.md) | Returns the customer's suite. |
| [title](#title): [String](TopLevel.String.md) | Returns the customer's title. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getAddress1](dw.customer.CustomerAddress.md#getaddress1)() | Returns the customer's first address. |
| [getAddress2](dw.customer.CustomerAddress.md#getaddress2)() | Returns the customer's second address value. |
| [getCity](dw.customer.CustomerAddress.md#getcity)() | Returns the customer's city. |
| [getCompanyName](dw.customer.CustomerAddress.md#getcompanyname)() | Returns the customer's company name. |
| [getCountryCode](dw.customer.CustomerAddress.md#getcountrycode)() | Returns the customer's country code. |
| [getFirstName](dw.customer.CustomerAddress.md#getfirstname)() | Returns the customer's first name. |
| [getFullName](dw.customer.CustomerAddress.md#getfullname)() | Returns a concatenation of the customer's first, middle,  and last names and its suffix. |
| [getID](dw.customer.CustomerAddress.md#getid)() | Returns the name of the address. |
| [getJobTitle](dw.customer.CustomerAddress.md#getjobtitle)() | Returns the customer's job title. |
| [getLastName](dw.customer.CustomerAddress.md#getlastname)() | Returns the customer's last name. |
| [getPhone](dw.customer.CustomerAddress.md#getphone)() | Returns the customer's phone number. |
| [getPostBox](dw.customer.CustomerAddress.md#getpostbox)() | Returns the customer's post box. |
| [getPostalCode](dw.customer.CustomerAddress.md#getpostalcode)() | Returns the customer's postal code. |
| [getSalutation](dw.customer.CustomerAddress.md#getsalutation)() | Returns the customer's salutation. |
| [getSecondName](dw.customer.CustomerAddress.md#getsecondname)() | Returns the customer's second name. |
| [getStateCode](dw.customer.CustomerAddress.md#getstatecode)() | Returns the customer's state. |
| [getSuffix](dw.customer.CustomerAddress.md#getsuffix)() | Returns the customer's suffix. |
| [getSuite](dw.customer.CustomerAddress.md#getsuite)() | Returns the customer's suite. |
| [getTitle](dw.customer.CustomerAddress.md#gettitle)() | Returns the customer's title. |
| [isEquivalentAddress](dw.customer.CustomerAddress.md#isequivalentaddressobject)([Object](TopLevel.Object.md)) | Returns true if the specified address is equivalent to  this address. |
| [setAddress1](dw.customer.CustomerAddress.md#setaddress1string)([String](TopLevel.String.md)) | Sets the value of the customer's first address. |
| [setAddress2](dw.customer.CustomerAddress.md#setaddress2string)([String](TopLevel.String.md)) | Sets the customer's second address value. |
| [setCity](dw.customer.CustomerAddress.md#setcitystring)([String](TopLevel.String.md)) | Sets the customer's city. |
| [setCompanyName](dw.customer.CustomerAddress.md#setcompanynamestring)([String](TopLevel.String.md)) | Sets the customer's company name. |
| [setCountryCode](dw.customer.CustomerAddress.md#setcountrycodestring)([String](TopLevel.String.md)) | Sets the customer's country code. |
| [setFirstName](dw.customer.CustomerAddress.md#setfirstnamestring)([String](TopLevel.String.md)) | Sets the customer's first name. |
| [setID](dw.customer.CustomerAddress.md#setidstring)([String](TopLevel.String.md)) | Sets the address name. |
| [setJobTitle](dw.customer.CustomerAddress.md#setjobtitlestring)([String](TopLevel.String.md)) | Sets the customer's job title. |
| [setLastName](dw.customer.CustomerAddress.md#setlastnamestring)([String](TopLevel.String.md)) | Sets the customer's last name. |
| [setPhone](dw.customer.CustomerAddress.md#setphonestring)([String](TopLevel.String.md)) | Sets the customer's phone number. |
| [setPostBox](dw.customer.CustomerAddress.md#setpostboxstring)([String](TopLevel.String.md)) | Sets the customer's post box. |
| [setPostalCode](dw.customer.CustomerAddress.md#setpostalcodestring)([String](TopLevel.String.md)) | Sets the customer's postal code. |
| ~~[setSaluation](dw.customer.CustomerAddress.md#setsaluationstring)([String](TopLevel.String.md))~~ | Sets the customer's salutation. |
| [setSalutation](dw.customer.CustomerAddress.md#setsalutationstring)([String](TopLevel.String.md)) | Sets the customer's salutation. |
| [setSecondName](dw.customer.CustomerAddress.md#setsecondnamestring)([String](TopLevel.String.md)) | Sets the customer's second name. |
| [setStateCode](dw.customer.CustomerAddress.md#setstatecodestring)([String](TopLevel.String.md)) | Sets the customer's state. |
| [setSuffix](dw.customer.CustomerAddress.md#setsuffixstring)([String](TopLevel.String.md)) | Sets the customer's suffix. |
| [setSuite](dw.customer.CustomerAddress.md#setsuitestring)([String](TopLevel.String.md)) | Sets the customer's suite. |
| [setTitle](dw.customer.CustomerAddress.md#settitlestring)([String](TopLevel.String.md)) | Sets the customer's title. |

### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### ID
- ID: [String](TopLevel.String.md)
  - : Returns the name of the address.


---

### address1
- address1: [String](TopLevel.String.md)
  - : Returns the customer's first address.


---

### address2
- address2: [String](TopLevel.String.md)
  - : Returns the customer's second address value.


---

### city
- city: [String](TopLevel.String.md)
  - : Returns the customer's city.


---

### companyName
- companyName: [String](TopLevel.String.md)
  - : Returns the customer's company name.


---

### countryCode
- countryCode: [EnumValue](dw.value.EnumValue.md)
  - : Returns the customer's country code. Commerce Cloud Digital supports two-character
      country codes per ISO 3166-1 alpha-2. See
      [http://www.iso.org/iso/country\_codes/iso\_3166-faqs/iso\_3166\_faqs\_general.htm](http://www.iso.org/iso/country\_codes/iso\_3166-faqs/iso\_3166\_faqs\_general.htm)
      for additional information.



---

### firstName
- firstName: [String](TopLevel.String.md)
  - : Returns the customer's first name.


---

### fullName
- fullName: [String](TopLevel.String.md) `(read-only)`
  - : Returns a concatenation of the customer's first, middle,
      and last names and its suffix.



---

### jobTitle
- jobTitle: [String](TopLevel.String.md)
  - : Returns the customer's job title.


---

### lastName
- lastName: [String](TopLevel.String.md)
  - : Returns the customer's last name.


---

### phone
- phone: [String](TopLevel.String.md)
  - : Returns the customer's phone number.


---

### postBox
- postBox: [String](TopLevel.String.md)
  - : Returns the customer's post box.


---

### postalCode
- postalCode: [String](TopLevel.String.md)
  - : Returns the customer's postal code.


---

### salutation
- salutation: [String](TopLevel.String.md)
  - : Returns the customer's salutation.


---

### secondName
- secondName: [String](TopLevel.String.md)
  - : Returns the customer's second name.


---

### stateCode
- stateCode: [String](TopLevel.String.md)
  - : Returns the customer's state.


---

### suffix
- suffix: [String](TopLevel.String.md)
  - : Returns the customer's suffix.


---

### suite
- suite: [String](TopLevel.String.md)
  - : Returns the customer's suite.


---

### title
- title: [String](TopLevel.String.md)
  - : Returns the customer's title.


---

## Method Details

### getAddress1()
- getAddress1(): [String](TopLevel.String.md)
  - : Returns the customer's first address.

    **Returns:**
    - the first address value.


---

### getAddress2()
- getAddress2(): [String](TopLevel.String.md)
  - : Returns the customer's second address value.

    **Returns:**
    - the value of the second address.


---

### getCity()
- getCity(): [String](TopLevel.String.md)
  - : Returns the customer's city.

    **Returns:**
    - the customer's city.


---

### getCompanyName()
- getCompanyName(): [String](TopLevel.String.md)
  - : Returns the customer's company name.

    **Returns:**
    - the company name.


---

### getCountryCode()
- getCountryCode(): [EnumValue](dw.value.EnumValue.md)
  - : Returns the customer's country code. Commerce Cloud Digital supports two-character
      country codes per ISO 3166-1 alpha-2. See
      [http://www.iso.org/iso/country\_codes/iso\_3166-faqs/iso\_3166\_faqs\_general.htm](http://www.iso.org/iso/country\_codes/iso\_3166-faqs/iso\_3166\_faqs\_general.htm)
      for additional information.


    **Returns:**
    - the two-digit country code.


---

### getFirstName()
- getFirstName(): [String](TopLevel.String.md)
  - : Returns the customer's first name.

    **Returns:**
    - the customer first name.


---

### getFullName()
- getFullName(): [String](TopLevel.String.md)
  - : Returns a concatenation of the customer's first, middle,
      and last names and its suffix.


    **Returns:**
    - a concatenation of the customer's first, middle,
      and last names and its suffix.



---

### getID()
- getID(): [String](TopLevel.String.md)
  - : Returns the name of the address.

    **Returns:**
    - the address name.


---

### getJobTitle()
- getJobTitle(): [String](TopLevel.String.md)
  - : Returns the customer's job title.

    **Returns:**
    - the job title.


---

### getLastName()
- getLastName(): [String](TopLevel.String.md)
  - : Returns the customer's last name.

    **Returns:**
    - the last name.


---

### getPhone()
- getPhone(): [String](TopLevel.String.md)
  - : Returns the customer's phone number.

    **Returns:**
    - the phone number.


---

### getPostBox()
- getPostBox(): [String](TopLevel.String.md)
  - : Returns the customer's post box.

    **Returns:**
    - the post box.


---

### getPostalCode()
- getPostalCode(): [String](TopLevel.String.md)
  - : Returns the customer's postal code.

    **Returns:**
    - the postal code.


---

### getSalutation()
- getSalutation(): [String](TopLevel.String.md)
  - : Returns the customer's salutation.

    **Returns:**
    - the salutation.


---

### getSecondName()
- getSecondName(): [String](TopLevel.String.md)
  - : Returns the customer's second name.

    **Returns:**
    - the second name.


---

### getStateCode()
- getStateCode(): [String](TopLevel.String.md)
  - : Returns the customer's state.

    **Returns:**
    - the state.


---

### getSuffix()
- getSuffix(): [String](TopLevel.String.md)
  - : Returns the customer's suffix.

    **Returns:**
    - the suffix.


---

### getSuite()
- getSuite(): [String](TopLevel.String.md)
  - : Returns the customer's suite.

    **Returns:**
    - the suite.


---

### getTitle()
- getTitle(): [String](TopLevel.String.md)
  - : Returns the customer's title.

    **Returns:**
    - the title.


---

### isEquivalentAddress(Object)
- isEquivalentAddress(address: [Object](TopLevel.Object.md)): [Boolean](TopLevel.Boolean.md)
  - : Returns true if the specified address is equivalent to
      this address. An equivalent address is an address whose
      core attributes contain the same values. The core attributes
      are:
      
      - address1
      - address2
      - city
      - companyName
      - countryCode
      - firstName
      - lastName
      - postalCode
      - postBox
      - stateCode


    **Parameters:**
    - address - the address to test.

    **Returns:**
    - true if the specified address is equivalent to
      this address, false otherwise.



---

### setAddress1(String)
- setAddress1(value: [String](TopLevel.String.md)): void
  - : Sets the value of the customer's first address.

    **Parameters:**
    - value - The value to set.


---

### setAddress2(String)
- setAddress2(value: [String](TopLevel.String.md)): void
  - : Sets the customer's second address value.

    **Parameters:**
    - value - The value to set.


---

### setCity(String)
- setCity(city: [String](TopLevel.String.md)): void
  - : Sets the customer's city.

    **Parameters:**
    - city - the customer's city to set.


---

### setCompanyName(String)
- setCompanyName(companyName: [String](TopLevel.String.md)): void
  - : Sets the customer's company name.

    **Parameters:**
    - companyName - the name of the company.


---

### setCountryCode(String)
- setCountryCode(countryCode: [String](TopLevel.String.md)): void
  - : Sets the customer's country code. Commerce Cloud Digital supports two-character
      country codes per ISO 3166-1 alpha-2. See
      [http://www.iso.org/iso/country\_codes/iso\_3166-faqs/iso\_3166\_faqs\_general.htm](http://www.iso.org/iso/country\_codes/iso\_3166-faqs/iso\_3166\_faqs\_general.htm)
      for additional information.


    **Parameters:**
    - countryCode - the country code, must be no more than 2 characters or                     will be truncated.


---

### setFirstName(String)
- setFirstName(firstName: [String](TopLevel.String.md)): void
  - : Sets the customer's first name.

    **Parameters:**
    - firstName - the customer's first  name to set.


---

### setID(String)
- setID(value: [String](TopLevel.String.md)): void
  - : Sets the address name.

    **Parameters:**
    - value - the name to use.


---

### setJobTitle(String)
- setJobTitle(jobTitle: [String](TopLevel.String.md)): void
  - : Sets the customer's job title.

    **Parameters:**
    - jobTitle - The jobTitle to set.


---

### setLastName(String)
- setLastName(lastName: [String](TopLevel.String.md)): void
  - : Sets the customer's last name.

    **Parameters:**
    - lastName - The last name to set.


---

### setPhone(String)
- setPhone(phoneNumber: [String](TopLevel.String.md)): void
  - : Sets the customer's phone number. The length is restricted to 32 characters.

    **Parameters:**
    - phoneNumber - The phone number to set.


---

### setPostBox(String)
- setPostBox(postBox: [String](TopLevel.String.md)): void
  - : Sets the customer's post box.

    **Parameters:**
    - postBox - The post box to set.


---

### setPostalCode(String)
- setPostalCode(postalCode: [String](TopLevel.String.md)): void
  - : Sets the customer's postal code.

    **Parameters:**
    - postalCode - The postal code to set.


---

### setSaluation(String)
- ~~setSaluation(value: [String](TopLevel.String.md)): void~~
  - : Sets the customer's salutation.

    **Parameters:**
    - value - the salutation.

    **Deprecated:**
:::warning
Use [setSalutation(String)](dw.customer.CustomerAddress.md#setsalutationstring)
:::

---

### setSalutation(String)
- setSalutation(value: [String](TopLevel.String.md)): void
  - : Sets the customer's salutation.

    **Parameters:**
    - value - the salutation.


---

### setSecondName(String)
- setSecondName(secondName: [String](TopLevel.String.md)): void
  - : Sets the customer's second name.

    **Parameters:**
    - secondName - The second name to set.


---

### setStateCode(String)
- setStateCode(state: [String](TopLevel.String.md)): void
  - : Sets the customer's state.

    **Parameters:**
    - state - The state to set.


---

### setSuffix(String)
- setSuffix(suffix: [String](TopLevel.String.md)): void
  - : Sets the customer's suffix.

    **Parameters:**
    - suffix - The suffix to set.


---

### setSuite(String)
- setSuite(value: [String](TopLevel.String.md)): void
  - : Sets the customer's suite. The length is restricted to 32 characters.

    **Parameters:**
    - value - the suite to set.


---

### setTitle(String)
- setTitle(title: [String](TopLevel.String.md)): void
  - : Sets the customer's title.

    **Parameters:**
    - title - The title to set.


---

<!-- prettier-ignore-end -->
