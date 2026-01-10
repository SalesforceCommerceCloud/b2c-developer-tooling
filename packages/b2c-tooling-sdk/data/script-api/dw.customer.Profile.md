<!-- prettier-ignore-start -->
# Class Profile

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)
      - [dw.customer.EncryptedObject](dw.customer.EncryptedObject.md)
        - [dw.customer.Profile](dw.customer.Profile.md)

The class represents a customer profile. It also provides access to the
customers address book and credentials.


**Note:** this class handles sensitive security-related data.
Pay special attention to PCI DSS v3. requirements 2, 4, and 12.



## Property Summary

| Property | Description |
| --- | --- |
| [addressBook](#addressbook): [AddressBook](dw.customer.AddressBook.md) `(read-only)` | Returns the customer's address book. |
| [birthday](#birthday): [Date](TopLevel.Date.md) | Returns the customer's birthday as a date. |
| [companyName](#companyname): [String](TopLevel.String.md) | Returns the customer's company name. |
| [credentials](#credentials): [Credentials](dw.customer.Credentials.md) `(read-only)` | Returns the customer's credentials. |
| [customer](#customer): [Customer](dw.customer.Customer.md) `(read-only)` | Returns the customer object related to this profile. |
| [customerNo](#customerno): [String](TopLevel.String.md) `(read-only)` | Returns the customer's number, which is a number used to identify the Customer. |
| [email](#email): [String](TopLevel.String.md) | Returns the customer's email address. |
| [fax](#fax): [String](TopLevel.String.md) | Returns the fax number to use for the customer. |
| [female](#female): [Boolean](TopLevel.Boolean.md) `(read-only)` | Indicates that the customer is female when set to true. |
| [firstName](#firstname): [String](TopLevel.String.md) | Returns the customer's first name. |
| [gender](#gender): [EnumValue](dw.value.EnumValue.md) | Returns the customer's gender. |
| [jobTitle](#jobtitle): [String](TopLevel.String.md) | Returns the customer's job title. |
| [lastLoginTime](#lastlogintime): [Date](TopLevel.Date.md) `(read-only)` | Returns the last login time of the customer. |
| [lastName](#lastname): [String](TopLevel.String.md) | Returns the customer's last name. |
| [lastVisitTime](#lastvisittime): [Date](TopLevel.Date.md) `(read-only)` | Returns the last visit time of the customer. |
| [male](#male): [Boolean](TopLevel.Boolean.md) `(read-only)` | Indicates that the customer is male when set to true. |
| [nextBirthday](#nextbirthday): [Date](TopLevel.Date.md) `(read-only)` | Returns the upcoming customer's birthday as a date. |
| [phoneBusiness](#phonebusiness): [String](TopLevel.String.md) | Returns the business phone number to use for the customer. |
| [phoneHome](#phonehome): [String](TopLevel.String.md) | Returns the phone number to use for the customer. |
| [phoneMobile](#phonemobile): [String](TopLevel.String.md) | Returns the mobile phone number to use for the customer. |
| [preferredLocale](#preferredlocale): [String](TopLevel.String.md) | Returns the customer's preferred locale. |
| [previousLoginTime](#previouslogintime): [Date](TopLevel.Date.md) `(read-only)` | Returns the time the customer logged in prior to the current login. |
| [previousVisitTime](#previousvisittime): [Date](TopLevel.Date.md) `(read-only)` | Returns the time the customer visited the store prior to the current visit. |
| [salutation](#salutation): [String](TopLevel.String.md) | Returns the salutation to use for the customer. |
| [secondName](#secondname): [String](TopLevel.String.md) | Returns the customer's second name. |
| [suffix](#suffix): [String](TopLevel.String.md) | Returns the customer's suffix, such as "Jr." or "Sr.". |
| [taxID](#taxid): [String](TopLevel.String.md) | Returns the tax ID value. |
| [taxIDMasked](#taxidmasked): [String](TopLevel.String.md) `(read-only)` | Returns the masked value of the tax ID. |
| [taxIDType](#taxidtype): [EnumValue](dw.value.EnumValue.md) | Returns the tax ID type. |
| [title](#title): [String](TopLevel.String.md) | Returns the customer's title, such as "Mrs" or "Mr". |
| [wallet](#wallet): [Wallet](dw.customer.Wallet.md) `(read-only)` | Returns the wallet of this customer. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getAddressBook](dw.customer.Profile.md#getaddressbook)() | Returns the customer's address book. |
| [getBirthday](dw.customer.Profile.md#getbirthday)() | Returns the customer's birthday as a date. |
| [getCompanyName](dw.customer.Profile.md#getcompanyname)() | Returns the customer's company name. |
| [getCredentials](dw.customer.Profile.md#getcredentials)() | Returns the customer's credentials. |
| [getCustomer](dw.customer.Profile.md#getcustomer)() | Returns the customer object related to this profile. |
| [getCustomerNo](dw.customer.Profile.md#getcustomerno)() | Returns the customer's number, which is a number used to identify the Customer. |
| [getEmail](dw.customer.Profile.md#getemail)() | Returns the customer's email address. |
| [getFax](dw.customer.Profile.md#getfax)() | Returns the fax number to use for the customer. |
| [getFirstName](dw.customer.Profile.md#getfirstname)() | Returns the customer's first name. |
| [getGender](dw.customer.Profile.md#getgender)() | Returns the customer's gender. |
| [getJobTitle](dw.customer.Profile.md#getjobtitle)() | Returns the customer's job title. |
| [getLastLoginTime](dw.customer.Profile.md#getlastlogintime)() | Returns the last login time of the customer. |
| [getLastName](dw.customer.Profile.md#getlastname)() | Returns the customer's last name. |
| [getLastVisitTime](dw.customer.Profile.md#getlastvisittime)() | Returns the last visit time of the customer. |
| [getNextBirthday](dw.customer.Profile.md#getnextbirthday)() | Returns the upcoming customer's birthday as a date. |
| [getPhoneBusiness](dw.customer.Profile.md#getphonebusiness)() | Returns the business phone number to use for the customer. |
| [getPhoneHome](dw.customer.Profile.md#getphonehome)() | Returns the phone number to use for the customer. |
| [getPhoneMobile](dw.customer.Profile.md#getphonemobile)() | Returns the mobile phone number to use for the customer. |
| [getPreferredLocale](dw.customer.Profile.md#getpreferredlocale)() | Returns the customer's preferred locale. |
| [getPreviousLoginTime](dw.customer.Profile.md#getpreviouslogintime)() | Returns the time the customer logged in prior to the current login. |
| [getPreviousVisitTime](dw.customer.Profile.md#getpreviousvisittime)() | Returns the time the customer visited the store prior to the current visit. |
| [getSalutation](dw.customer.Profile.md#getsalutation)() | Returns the salutation to use for the customer. |
| [getSecondName](dw.customer.Profile.md#getsecondname)() | Returns the customer's second name. |
| [getSuffix](dw.customer.Profile.md#getsuffix)() | Returns the customer's suffix, such as "Jr." or "Sr.". |
| [getTaxID](dw.customer.Profile.md#gettaxid)() | Returns the tax ID value. |
| [getTaxIDMasked](dw.customer.Profile.md#gettaxidmasked)() | Returns the masked value of the tax ID. |
| [getTaxIDType](dw.customer.Profile.md#gettaxidtype)() | Returns the tax ID type. |
| [getTitle](dw.customer.Profile.md#gettitle)() | Returns the customer's title, such as "Mrs" or "Mr". |
| [getWallet](dw.customer.Profile.md#getwallet)() | Returns the wallet of this customer. |
| [isFemale](dw.customer.Profile.md#isfemale)() | Indicates that the customer is female when set to true. |
| [isMale](dw.customer.Profile.md#ismale)() | Indicates that the customer is male when set to true. |
| [setBirthday](dw.customer.Profile.md#setbirthdaydate)([Date](TopLevel.Date.md)) | Sets the customer's birthday as a date. |
| [setCompanyName](dw.customer.Profile.md#setcompanynamestring)([String](TopLevel.String.md)) | Sets the customer's company name. |
| [setEmail](dw.customer.Profile.md#setemailstring)([String](TopLevel.String.md)) | Sets the customer's email address. |
| [setFax](dw.customer.Profile.md#setfaxstring)([String](TopLevel.String.md)) | Sets the fax number to use for the customer. |
| [setFirstName](dw.customer.Profile.md#setfirstnamestring)([String](TopLevel.String.md)) | Sets the customer's first name. |
| [setGender](dw.customer.Profile.md#setgendernumber)([Number](TopLevel.Number.md)) | Sets the customer's gender. |
| [setJobTitle](dw.customer.Profile.md#setjobtitlestring)([String](TopLevel.String.md)) | Sets the customer's job title. |
| [setLastName](dw.customer.Profile.md#setlastnamestring)([String](TopLevel.String.md)) | Sets the customer's last name. |
| [setPhoneBusiness](dw.customer.Profile.md#setphonebusinessstring)([String](TopLevel.String.md)) | Sets the business phone number to use for the customer. |
| [setPhoneHome](dw.customer.Profile.md#setphonehomestring)([String](TopLevel.String.md)) | Sets the phone number to use for the customer. |
| [setPhoneMobile](dw.customer.Profile.md#setphonemobilestring)([String](TopLevel.String.md)) | Sets the mobile phone number to use for the customer. |
| [setPreferredLocale](dw.customer.Profile.md#setpreferredlocalestring)([String](TopLevel.String.md)) | Sets the customer's preferred locale. |
| ~~[setSaluation](dw.customer.Profile.md#setsaluationstring)([String](TopLevel.String.md))~~ | Sets the salutation to use for the customer. |
| [setSalutation](dw.customer.Profile.md#setsalutationstring)([String](TopLevel.String.md)) | Sets the salutation to use for the customer. |
| [setSecondName](dw.customer.Profile.md#setsecondnamestring)([String](TopLevel.String.md)) | Sets the customer's second name. |
| [setSuffix](dw.customer.Profile.md#setsuffixstring)([String](TopLevel.String.md)) | Sets the the customer's suffix. |
| [setTaxID](dw.customer.Profile.md#settaxidstring)([String](TopLevel.String.md)) | Sets the tax ID value. |
| [setTaxIDType](dw.customer.Profile.md#settaxidtypestring)([String](TopLevel.String.md)) | Sets the tax ID type. |
| [setTitle](dw.customer.Profile.md#settitlestring)([String](TopLevel.String.md)) | Sets the customer's title. |

### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### addressBook
- addressBook: [AddressBook](dw.customer.AddressBook.md) `(read-only)`
  - : Returns the customer's address book.


---

### birthday
- birthday: [Date](TopLevel.Date.md)
  - : Returns the customer's birthday as a date.


---

### companyName
- companyName: [String](TopLevel.String.md)
  - : Returns the customer's company name.


---

### credentials
- credentials: [Credentials](dw.customer.Credentials.md) `(read-only)`
  - : Returns the customer's credentials.


---

### customer
- customer: [Customer](dw.customer.Customer.md) `(read-only)`
  - : Returns the customer object related to this profile.


---

### customerNo
- customerNo: [String](TopLevel.String.md) `(read-only)`
  - : Returns the customer's number, which is a number used to identify the Customer.


---

### email
- email: [String](TopLevel.String.md)
  - : Returns the customer's email address.


---

### fax
- fax: [String](TopLevel.String.md)
  - : Returns the fax number to use for the customer.
      The length is restricted to 32 characters.



---

### female
- female: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Indicates that the customer is female when set to true.


---

### firstName
- firstName: [String](TopLevel.String.md)
  - : Returns the customer's first name.


---

### gender
- gender: [EnumValue](dw.value.EnumValue.md)
  - : Returns the customer's gender.


---

### jobTitle
- jobTitle: [String](TopLevel.String.md)
  - : Returns the customer's job title.


---

### lastLoginTime
- lastLoginTime: [Date](TopLevel.Date.md) `(read-only)`
  - : Returns the last login time of the customer.


---

### lastName
- lastName: [String](TopLevel.String.md)
  - : Returns the customer's last name.


---

### lastVisitTime
- lastVisitTime: [Date](TopLevel.Date.md) `(read-only)`
  - : Returns the last visit time of the customer.


---

### male
- male: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Indicates that the customer is male when set to true.


---

### nextBirthday
- nextBirthday: [Date](TopLevel.Date.md) `(read-only)`
  - : Returns the upcoming customer's birthday as a date.
      If the customer already had birthday this year the method returns the birthday of the next year.
      Otherwise its birthday in this year.
      If the customer has not set a birthday this method returns null.



---

### phoneBusiness
- phoneBusiness: [String](TopLevel.String.md)
  - : Returns the business phone number to use for the customer.


---

### phoneHome
- phoneHome: [String](TopLevel.String.md)
  - : Returns the phone number to use for the customer.


---

### phoneMobile
- phoneMobile: [String](TopLevel.String.md)
  - : Returns the mobile phone number to use for the customer.


---

### preferredLocale
- preferredLocale: [String](TopLevel.String.md)
  - : Returns the customer's preferred locale.


---

### previousLoginTime
- previousLoginTime: [Date](TopLevel.Date.md) `(read-only)`
  - : Returns the time the customer logged in prior to the current login.


---

### previousVisitTime
- previousVisitTime: [Date](TopLevel.Date.md) `(read-only)`
  - : Returns the time the customer visited the store prior to the current visit.


---

### salutation
- salutation: [String](TopLevel.String.md)
  - : Returns the salutation to use for the customer.


---

### secondName
- secondName: [String](TopLevel.String.md)
  - : Returns the customer's second name.


---

### suffix
- suffix: [String](TopLevel.String.md)
  - : Returns the customer's suffix, such as "Jr." or "Sr.".


---

### taxID
- taxID: [String](TopLevel.String.md)
  - : Returns the tax ID value. The value is returned either plain
      text if the current context allows plain text access, or
      if it's not allowed, the ID value will be returned masked.
      The following criteria must be met in order to have plain text access:
      
      
      
      - the method call must happen in the context of a storefront request;
      - the current customer must be registered and authenticated;
      - it is the profile of the current customer;
      - and the current protocol is HTTPS.



---

### taxIDMasked
- taxIDMasked: [String](TopLevel.String.md) `(read-only)`
  - : Returns the masked value of the tax ID.


---

### taxIDType
- taxIDType: [EnumValue](dw.value.EnumValue.md)
  - : Returns the tax ID type.


---

### title
- title: [String](TopLevel.String.md)
  - : Returns the customer's title, such as "Mrs" or "Mr".


---

### wallet
- wallet: [Wallet](dw.customer.Wallet.md) `(read-only)`
  - : Returns the wallet of this customer.


---

## Method Details

### getAddressBook()
- getAddressBook(): [AddressBook](dw.customer.AddressBook.md)
  - : Returns the customer's address book.

    **Returns:**
    - the customer's address book.


---

### getBirthday()
- getBirthday(): [Date](TopLevel.Date.md)
  - : Returns the customer's birthday as a date.

    **Returns:**
    - the customer's birthday as a date.


---

### getCompanyName()
- getCompanyName(): [String](TopLevel.String.md)
  - : Returns the customer's company name.

    **Returns:**
    - the customer's company name.


---

### getCredentials()
- getCredentials(): [Credentials](dw.customer.Credentials.md)
  - : Returns the customer's credentials.

    **Returns:**
    - the customer's credentials.


---

### getCustomer()
- getCustomer(): [Customer](dw.customer.Customer.md)
  - : Returns the customer object related to this profile.

    **Returns:**
    - customer object related to profile.


---

### getCustomerNo()
- getCustomerNo(): [String](TopLevel.String.md)
  - : Returns the customer's number, which is a number used to identify the Customer.

    **Returns:**
    - the customer's number.


---

### getEmail()
- getEmail(): [String](TopLevel.String.md)
  - : Returns the customer's email address.

    **Returns:**
    - the customer's email address.


---

### getFax()
- getFax(): [String](TopLevel.String.md)
  - : Returns the fax number to use for the customer.
      The length is restricted to 32 characters.


    **Returns:**
    - the fax mobile phone number to use for the customer.


---

### getFirstName()
- getFirstName(): [String](TopLevel.String.md)
  - : Returns the customer's first name.

    **Returns:**
    - the customer's first name.


---

### getGender()
- getGender(): [EnumValue](dw.value.EnumValue.md)
  - : Returns the customer's gender.

    **Returns:**
    - the customer's gender.


---

### getJobTitle()
- getJobTitle(): [String](TopLevel.String.md)
  - : Returns the customer's job title.

    **Returns:**
    - the customer's job title.


---

### getLastLoginTime()
- getLastLoginTime(): [Date](TopLevel.Date.md)
  - : Returns the last login time of the customer.

    **Returns:**
    - the time, when the customer was last logged in.


---

### getLastName()
- getLastName(): [String](TopLevel.String.md)
  - : Returns the customer's last name.

    **Returns:**
    - the customer's last name.


---

### getLastVisitTime()
- getLastVisitTime(): [Date](TopLevel.Date.md)
  - : Returns the last visit time of the customer.

    **Returns:**
    - the time, when the customer has visited the storefront the
              last time (with enabled remember me functionality).



---

### getNextBirthday()
- getNextBirthday(): [Date](TopLevel.Date.md)
  - : Returns the upcoming customer's birthday as a date.
      If the customer already had birthday this year the method returns the birthday of the next year.
      Otherwise its birthday in this year.
      If the customer has not set a birthday this method returns null.


    **Returns:**
    - the customer's next birthday as a date.


---

### getPhoneBusiness()
- getPhoneBusiness(): [String](TopLevel.String.md)
  - : Returns the business phone number to use for the customer.

    **Returns:**
    - the business phone number to use for the customer.


---

### getPhoneHome()
- getPhoneHome(): [String](TopLevel.String.md)
  - : Returns the phone number to use for the customer.

    **Returns:**
    - the phone number to use for the customer.


---

### getPhoneMobile()
- getPhoneMobile(): [String](TopLevel.String.md)
  - : Returns the mobile phone number to use for the customer.

    **Returns:**
    - the mobile phone number to use for the customer.


---

### getPreferredLocale()
- getPreferredLocale(): [String](TopLevel.String.md)
  - : Returns the customer's preferred locale.

    **Returns:**
    - the customer's preferred locale.


---

### getPreviousLoginTime()
- getPreviousLoginTime(): [Date](TopLevel.Date.md)
  - : Returns the time the customer logged in prior to the current login.

    **Returns:**
    - the time the customer logged in prior to the current login.


---

### getPreviousVisitTime()
- getPreviousVisitTime(): [Date](TopLevel.Date.md)
  - : Returns the time the customer visited the store prior to the current visit.

    **Returns:**
    - the time the customer visited the store prior to the current visit.


---

### getSalutation()
- getSalutation(): [String](TopLevel.String.md)
  - : Returns the salutation to use for the customer.

    **Returns:**
    - the salutation to use for the customer.


---

### getSecondName()
- getSecondName(): [String](TopLevel.String.md)
  - : Returns the customer's second name.

    **Returns:**
    - the customer's second name.


---

### getSuffix()
- getSuffix(): [String](TopLevel.String.md)
  - : Returns the customer's suffix, such as "Jr." or "Sr.".

    **Returns:**
    - the customer's suffix.


---

### getTaxID()
- getTaxID(): [String](TopLevel.String.md)
  - : Returns the tax ID value. The value is returned either plain
      text if the current context allows plain text access, or
      if it's not allowed, the ID value will be returned masked.
      The following criteria must be met in order to have plain text access:
      
      
      
      - the method call must happen in the context of a storefront request;
      - the current customer must be registered and authenticated;
      - it is the profile of the current customer;
      - and the current protocol is HTTPS.


    **Returns:**
    - the tax ID value


---

### getTaxIDMasked()
- getTaxIDMasked(): [String](TopLevel.String.md)
  - : Returns the masked value of the tax ID.

    **Returns:**
    - the masked value of the tax ID


---

### getTaxIDType()
- getTaxIDType(): [EnumValue](dw.value.EnumValue.md)
  - : Returns the tax ID type.

    **Returns:**
    - the tax ID type


---

### getTitle()
- getTitle(): [String](TopLevel.String.md)
  - : Returns the customer's title, such as "Mrs" or "Mr".

    **Returns:**
    - the customer's title.


---

### getWallet()
- getWallet(): [Wallet](dw.customer.Wallet.md)
  - : Returns the wallet of this customer.

    **Returns:**
    - the wallet of this customer.


---

### isFemale()
- isFemale(): [Boolean](TopLevel.Boolean.md)
  - : Indicates that the customer is female when set to true.

    **Returns:**
    - true if the customer is a female, false otherwise.


---

### isMale()
- isMale(): [Boolean](TopLevel.Boolean.md)
  - : Indicates that the customer is male when set to true.

    **Returns:**
    - true if the customer is a male, false otherwise.


---

### setBirthday(Date)
- setBirthday(aValue: [Date](TopLevel.Date.md)): void
  - : Sets the customer's birthday as a date.

    **Parameters:**
    - aValue - the customer's birthday as a date.


---

### setCompanyName(String)
- setCompanyName(aValue: [String](TopLevel.String.md)): void
  - : Sets the customer's company name.

    **Parameters:**
    - aValue - the customer's company name.


---

### setEmail(String)
- setEmail(aValue: [String](TopLevel.String.md)): void
  - : Sets the customer's email address.

    **Parameters:**
    - aValue - the customer's email address.


---

### setFax(String)
- setFax(number: [String](TopLevel.String.md)): void
  - : Sets the fax number to use for the customer.
      The length is restricted to 32 characters.


    **Parameters:**
    - number - the fax number to use for the customer.


---

### setFirstName(String)
- setFirstName(aValue: [String](TopLevel.String.md)): void
  - : Sets the customer's first name.

    **Parameters:**
    - aValue - the customer's first name.


---

### setGender(Number)
- setGender(aValue: [Number](TopLevel.Number.md)): void
  - : Sets the customer's gender.

    **Parameters:**
    - aValue - the customer's gender.


---

### setJobTitle(String)
- setJobTitle(aValue: [String](TopLevel.String.md)): void
  - : Sets the customer's job title.

    **Parameters:**
    - aValue - the customer's job title.


---

### setLastName(String)
- setLastName(aValue: [String](TopLevel.String.md)): void
  - : Sets the customer's last name.

    **Parameters:**
    - aValue - the customer's last name.


---

### setPhoneBusiness(String)
- setPhoneBusiness(number: [String](TopLevel.String.md)): void
  - : Sets the business phone number to use for the customer.
      The length is restricted to 32 characters.


    **Parameters:**
    - number - the business phone number to use for the customer.


---

### setPhoneHome(String)
- setPhoneHome(number: [String](TopLevel.String.md)): void
  - : Sets the phone number to use for the customer.
      The length is restricted to 32 characters.


    **Parameters:**
    - number - the phone number to use for the customer.


---

### setPhoneMobile(String)
- setPhoneMobile(number: [String](TopLevel.String.md)): void
  - : Sets the mobile phone number to use for the customer.
      The length is restricted to 32 characters.


    **Parameters:**
    - number - the mobile phone number to use for the customer.


---

### setPreferredLocale(String)
- setPreferredLocale(aValue: [String](TopLevel.String.md)): void
  - : Sets the customer's preferred locale.

    **Parameters:**
    - aValue - the customer's preferred locale.


---

### setSaluation(String)
- ~~setSaluation(salutation: [String](TopLevel.String.md)): void~~
  - : Sets the salutation to use for the customer.

    **Parameters:**
    - salutation - the salutation to use for the customer.

    **Deprecated:**
:::warning
Use [setSalutation(String)](dw.customer.Profile.md#setsalutationstring)
:::

---

### setSalutation(String)
- setSalutation(salutation: [String](TopLevel.String.md)): void
  - : Sets the salutation to use for the customer.

    **Parameters:**
    - salutation - the salutation to use for the customer.


---

### setSecondName(String)
- setSecondName(aValue: [String](TopLevel.String.md)): void
  - : Sets the customer's second name.

    **Parameters:**
    - aValue - the customer's second name.


---

### setSuffix(String)
- setSuffix(aValue: [String](TopLevel.String.md)): void
  - : Sets the the customer's suffix.

    **Parameters:**
    - aValue - the customer's suffix.


---

### setTaxID(String)
- setTaxID(taxID: [String](TopLevel.String.md)): void
  - : Sets the tax ID value. The value can be set if the current context
      allows write access.
      The current context allows write access if the currently
      logged in user owns this profile and the connection is secured.


    **Parameters:**
    - taxID - the tax ID value to set


---

### setTaxIDType(String)
- setTaxIDType(taxIdType: [String](TopLevel.String.md)): void
  - : Sets the tax ID type.

    **Parameters:**
    - taxIdType - the tax ID type to set


---

### setTitle(String)
- setTitle(aValue: [String](TopLevel.String.md)): void
  - : Sets the customer's title.

    **Parameters:**
    - aValue - the customer's title.


---

<!-- prettier-ignore-end -->
