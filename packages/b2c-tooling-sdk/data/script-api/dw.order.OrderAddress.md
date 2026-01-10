<!-- prettier-ignore-start -->
# Class OrderAddress

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)
      - [dw.order.OrderAddress](dw.order.OrderAddress.md)

The Address class represents a customer's address.


**Note:** this class allows access to sensitive personal and private information.
Pay attention to appropriate legal and regulatory requirements.



## Property Summary

| Property | Description |
| --- | --- |
| [address1](#address1): [String](TopLevel.String.md) | Returns the customer's first address. |
| [address2](#address2): [String](TopLevel.String.md) | Returns the customer's second address. |
| [city](#city): [String](TopLevel.String.md) | Returns the Customer's City. |
| [companyName](#companyname): [String](TopLevel.String.md) | Returns the Customer's company name. |
| [countryCode](#countrycode): [EnumValue](dw.value.EnumValue.md) | Returns the customer's country code. |
| [firstName](#firstname): [String](TopLevel.String.md) | Returns the Customer's first name. |
| [fullName](#fullname): [String](TopLevel.String.md) `(read-only)` | Returns a concatenation of the Customer's first, middle,  and last names and it' suffix. |
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
| [getAddress1](dw.order.OrderAddress.md#getaddress1)() | Returns the customer's first address. |
| [getAddress2](dw.order.OrderAddress.md#getaddress2)() | Returns the customer's second address. |
| [getCity](dw.order.OrderAddress.md#getcity)() | Returns the Customer's City. |
| [getCompanyName](dw.order.OrderAddress.md#getcompanyname)() | Returns the Customer's company name. |
| [getCountryCode](dw.order.OrderAddress.md#getcountrycode)() | Returns the customer's country code. |
| [getFirstName](dw.order.OrderAddress.md#getfirstname)() | Returns the Customer's first name. |
| [getFullName](dw.order.OrderAddress.md#getfullname)() | Returns a concatenation of the Customer's first, middle,  and last names and it' suffix. |
| [getJobTitle](dw.order.OrderAddress.md#getjobtitle)() | Returns the customer's job title. |
| [getLastName](dw.order.OrderAddress.md#getlastname)() | Returns the customer's last name. |
| [getPhone](dw.order.OrderAddress.md#getphone)() | Returns the customer's phone number. |
| [getPostBox](dw.order.OrderAddress.md#getpostbox)() | Returns the customer's post box. |
| [getPostalCode](dw.order.OrderAddress.md#getpostalcode)() | Returns the customer's postal code. |
| [getSalutation](dw.order.OrderAddress.md#getsalutation)() | Returns the customer's salutation. |
| [getSecondName](dw.order.OrderAddress.md#getsecondname)() | Returns the customer's second name. |
| [getStateCode](dw.order.OrderAddress.md#getstatecode)() | Returns the customer's state. |
| [getSuffix](dw.order.OrderAddress.md#getsuffix)() | Returns the customer's suffix. |
| [getSuite](dw.order.OrderAddress.md#getsuite)() | Returns the customer's suite. |
| [getTitle](dw.order.OrderAddress.md#gettitle)() | Returns the customer's title. |
| [isEquivalentAddress](dw.order.OrderAddress.md#isequivalentaddressobject)([Object](TopLevel.Object.md)) | Returns true if the specified address is equivalent to  this address. |
| [setAddress1](dw.order.OrderAddress.md#setaddress1string)([String](TopLevel.String.md)) | Sets the customer's first address. |
| [setAddress2](dw.order.OrderAddress.md#setaddress2string)([String](TopLevel.String.md)) | Sets the customer's second address. |
| [setCity](dw.order.OrderAddress.md#setcitystring)([String](TopLevel.String.md)) | Sets the Customer's City. |
| [setCompanyName](dw.order.OrderAddress.md#setcompanynamestring)([String](TopLevel.String.md)) | Sets the Customer's company name. |
| [setCountryCode](dw.order.OrderAddress.md#setcountrycodestring)([String](TopLevel.String.md)) | Sets the Customer's country code. |
| [setFirstName](dw.order.OrderAddress.md#setfirstnamestring)([String](TopLevel.String.md)) | Sets the Customer's first name. |
| [setJobTitle](dw.order.OrderAddress.md#setjobtitlestring)([String](TopLevel.String.md)) | Sets the customer's job title. |
| [setLastName](dw.order.OrderAddress.md#setlastnamestring)([String](TopLevel.String.md)) | Sets the customer's last name. |
| [setPhone](dw.order.OrderAddress.md#setphonestring)([String](TopLevel.String.md)) | Sets the customer's phone number. |
| [setPostBox](dw.order.OrderAddress.md#setpostboxstring)([String](TopLevel.String.md)) | Sets the customer's post box. |
| [setPostalCode](dw.order.OrderAddress.md#setpostalcodestring)([String](TopLevel.String.md)) | Sets the customer's postal code. |
| ~~[setSaluation](dw.order.OrderAddress.md#setsaluationstring)([String](TopLevel.String.md))~~ | Sets the customer's salutation. |
| [setSalutation](dw.order.OrderAddress.md#setsalutationstring)([String](TopLevel.String.md)) | Sets the customer's salutation. |
| [setSecondName](dw.order.OrderAddress.md#setsecondnamestring)([String](TopLevel.String.md)) | Sets the customer's second name. |
| [setStateCode](dw.order.OrderAddress.md#setstatecodestring)([String](TopLevel.String.md)) | Sets the customer's state. |
| [setSuffix](dw.order.OrderAddress.md#setsuffixstring)([String](TopLevel.String.md)) | Sets the customer's suffix. |
| [setSuite](dw.order.OrderAddress.md#setsuitestring)([String](TopLevel.String.md)) | Sets the customer's suite. |
| [setTitle](dw.order.OrderAddress.md#settitlestring)([String](TopLevel.String.md)) | Sets the customer's title. |

### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### address1
- address1: [String](TopLevel.String.md)
  - : Returns the customer's first address.


---

### address2
- address2: [String](TopLevel.String.md)
  - : Returns the customer's second address.


---

### city
- city: [String](TopLevel.String.md)
  - : Returns the Customer's City.


---

### companyName
- companyName: [String](TopLevel.String.md)
  - : Returns the Customer's company name.


---

### countryCode
- countryCode: [EnumValue](dw.value.EnumValue.md)
  - : Returns the customer's country code.


---

### firstName
- firstName: [String](TopLevel.String.md)
  - : Returns the Customer's first name.


---

### fullName
- fullName: [String](TopLevel.String.md) `(read-only)`
  - : Returns a concatenation of the Customer's first, middle,
      and last names and it' suffix.



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
  - : Returns the customer's second address.

    **Returns:**
    - the second address value.


---

### getCity()
- getCity(): [String](TopLevel.String.md)
  - : Returns the Customer's City.

    **Returns:**
    - the Customer's city.


---

### getCompanyName()
- getCompanyName(): [String](TopLevel.String.md)
  - : Returns the Customer's company name.

    **Returns:**
    - the company name.


---

### getCountryCode()
- getCountryCode(): [EnumValue](dw.value.EnumValue.md)
  - : Returns the customer's country code.

    **Returns:**
    - the country code.


---

### getFirstName()
- getFirstName(): [String](TopLevel.String.md)
  - : Returns the Customer's first name.

    **Returns:**
    - the Customer first name.


---

### getFullName()
- getFullName(): [String](TopLevel.String.md)
  - : Returns a concatenation of the Customer's first, middle,
      and last names and it' suffix.


    **Returns:**
    - a concatenation of the Customer's first, middle,
      and last names and it' suffix.



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
    - the postBox.


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
    - the customer's salutation.


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
    - the customer's suite.


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
  - : Sets the customer's first address.

    **Parameters:**
    - value - The value to set.


---

### setAddress2(String)
- setAddress2(value: [String](TopLevel.String.md)): void
  - : Sets the customer's second address.

    **Parameters:**
    - value - The value to set.


---

### setCity(String)
- setCity(city: [String](TopLevel.String.md)): void
  - : Sets the Customer's City.

    **Parameters:**
    - city - the Customer's city to set.


---

### setCompanyName(String)
- setCompanyName(companyName: [String](TopLevel.String.md)): void
  - : Sets the Customer's company name.

    **Parameters:**
    - companyName - the name of the company.


---

### setCountryCode(String)
- setCountryCode(countryCode: [String](TopLevel.String.md)): void
  - : Sets the Customer's country code.

    **Parameters:**
    - countryCode - the country code.


---

### setFirstName(String)
- setFirstName(firstName: [String](TopLevel.String.md)): void
  - : Sets the Customer's first name.

    **Parameters:**
    - firstName - the customer's first  name to set.


---

### setJobTitle(String)
- setJobTitle(jobTitle: [String](TopLevel.String.md)): void
  - : Sets the customer's job title.

    **Parameters:**
    - jobTitle - The job title to set.


---

### setLastName(String)
- setLastName(lastName: [String](TopLevel.String.md)): void
  - : Sets the customer's last name.

    **Parameters:**
    - lastName - The last name to set.


---

### setPhone(String)
- setPhone(phoneNumber: [String](TopLevel.String.md)): void
  - : Sets the customer's phone number. The length is restricted to 256 characters.

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
    - value - the customer's salutation.

    **Deprecated:**
:::warning
Use [setSalutation(String)](dw.order.OrderAddress.md#setsalutationstring)
:::

---

### setSalutation(String)
- setSalutation(value: [String](TopLevel.String.md)): void
  - : Sets the customer's salutation.

    **Parameters:**
    - value - the customer's salutation.


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
  - : Sets the customer's suite. The length is restricted to 256 characters.

    **Parameters:**
    - value - the customer's suite.


---

### setTitle(String)
- setTitle(title: [String](TopLevel.String.md)): void
  - : Sets the customer's title.

    **Parameters:**
    - title - The title to set.


---

<!-- prettier-ignore-end -->
