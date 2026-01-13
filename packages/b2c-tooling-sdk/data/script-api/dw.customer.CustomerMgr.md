<!-- prettier-ignore-start -->
# Class CustomerMgr

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.customer.CustomerMgr](dw.customer.CustomerMgr.md)

Provides helper methods for managing customers and customer
profiles.
**Note:** this class allows access to sensitive information through
operations that retrieve the Profile object.
Pay attention to appropriate legal and regulatory requirements related to this data.



## Property Summary

| Property | Description |
| --- | --- |
| [customerGroups](#customergroups): [Collection](dw.util.Collection.md) `(read-only)` | Returns the customer groups of the current site. |
| [passwordConstraints](#passwordconstraints): [CustomerPasswordConstraints](dw.customer.CustomerPasswordConstraints.md) `(read-only)` | Returns an instance of [CustomerPasswordConstraints](dw.customer.CustomerPasswordConstraints.md)  for the customer list assigned to the current site. |
| [registeredCustomerCount](#registeredcustomercount): [Number](TopLevel.Number.md) `(read-only)` | Returns the number of registered customers in the system. |
| [siteCustomerList](#sitecustomerlist): [CustomerList](dw.customer.CustomerList.md) `(read-only)` | Returns the customer list of the current site. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| static [authenticateCustomer](dw.customer.CustomerMgr.md#authenticatecustomerstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | This method authenticates a customer using the supplied login and password. |
| static [createCustomer](dw.customer.CustomerMgr.md#createcustomerstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Creates a new Customer using the supplied login, password. |
| static [createCustomer](dw.customer.CustomerMgr.md#createcustomerstring-string-string)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Creates a new Customer using the supplied login, password, and a customerNo. |
| static [createExternallyAuthenticatedCustomer](dw.customer.CustomerMgr.md#createexternallyauthenticatedcustomerstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Given an authentication provider Id and an external Id: creates a Customer record in the system if one does not  exist already for the same 'authenticationProviderId' and 'externalId' pair. |
| static [describeProfileType](dw.customer.CustomerMgr.md#describeprofiletype)() | Returns the meta data for profiles. |
| static [getCustomerByCustomerNumber](dw.customer.CustomerMgr.md#getcustomerbycustomernumberstring)([String](TopLevel.String.md)) | Returns the customer with the specified customer number. |
| static [getCustomerByLogin](dw.customer.CustomerMgr.md#getcustomerbyloginstring)([String](TopLevel.String.md)) | Returns the customer for the specified login name. |
| static [getCustomerByToken](dw.customer.CustomerMgr.md#getcustomerbytokenstring)([String](TopLevel.String.md)) | Returns the customer associated with the specified password reset token. |
| static [getCustomerGroup](dw.customer.CustomerMgr.md#getcustomergroupstring)([String](TopLevel.String.md)) | Returns the customer group with the specified ID or null if group  does not exists. |
| static [getCustomerGroups](dw.customer.CustomerMgr.md#getcustomergroups)() | Returns the customer groups of the current site. |
| static [getCustomerList](dw.customer.CustomerMgr.md#getcustomerliststring)([String](TopLevel.String.md)) | Returns the customer list identified by the specified ID. |
| static [getExternallyAuthenticatedCustomerProfile](dw.customer.CustomerMgr.md#getexternallyauthenticatedcustomerprofilestring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Given an authentication provider Id and external Id returns the Customer Profile  in our system. |
| static [getPasswordConstraints](dw.customer.CustomerMgr.md#getpasswordconstraints)() | Returns an instance of [CustomerPasswordConstraints](dw.customer.CustomerPasswordConstraints.md)  for the customer list assigned to the current site. |
| static [getProfile](dw.customer.CustomerMgr.md#getprofilestring)([String](TopLevel.String.md)) | Returns the profile with the specified customer number. |
| static [getRegisteredCustomerCount](dw.customer.CustomerMgr.md#getregisteredcustomercount)() | Returns the number of registered customers in the system. |
| static [getSiteCustomerList](dw.customer.CustomerMgr.md#getsitecustomerlist)() | Returns the customer list of the current site. |
| static [isAcceptablePassword](dw.customer.CustomerMgr.md#isacceptablepasswordstring)([String](TopLevel.String.md)) | Checks if the given password matches the password constraints (for example password length) of  the current site's assigned customerlist. |
| static [isPasswordExpired](dw.customer.CustomerMgr.md#ispasswordexpiredstring)([String](TopLevel.String.md)) | Checks if the password for the given customer is expired |
| static [loginCustomer](dw.customer.CustomerMgr.md#logincustomerauthenticationstatus-boolean)([AuthenticationStatus](dw.customer.AuthenticationStatus.md), [Boolean](TopLevel.Boolean.md)) | This method logs in the authenticated customer (from a previous authenticateCustomer() call). |
| ~~static [loginCustomer](dw.customer.CustomerMgr.md#logincustomerstring-string-boolean)([String](TopLevel.String.md), [String](TopLevel.String.md), [Boolean](TopLevel.Boolean.md))~~ | This method authenticates the current session using the supplied login and password. |
| static [loginExternallyAuthenticatedCustomer](dw.customer.CustomerMgr.md#loginexternallyauthenticatedcustomerstring-string-boolean)([String](TopLevel.String.md), [String](TopLevel.String.md), [Boolean](TopLevel.Boolean.md)) | Logs in externally authenticated customer if it has already been created in the system and the profile is not disabled or locked |
| static [logoutCustomer](dw.customer.CustomerMgr.md#logoutcustomerboolean)([Boolean](TopLevel.Boolean.md)) | Logs out the customer currently logged into the storefront. |
| static [processProfiles](dw.customer.CustomerMgr.md#processprofilesfunction-string-object)([Function](TopLevel.Function.md), [String](TopLevel.String.md), [Object...](TopLevel.Object.md)) | Executes a user-definable function on a set of customer profiles. |
| ~~static [queryProfile](dw.customer.CustomerMgr.md#queryprofilestring-object)([String](TopLevel.String.md), [Object...](TopLevel.Object.md))~~ | <p/>Searches for a single profile instance. |
| ~~static [queryProfiles](dw.customer.CustomerMgr.md#queryprofilesmap-string)([Map](dw.util.Map.md), [String](TopLevel.String.md))~~ | <p/>Searches for profile instances. |
| ~~static [queryProfiles](dw.customer.CustomerMgr.md#queryprofilesstring-string-object)([String](TopLevel.String.md), [String](TopLevel.String.md), [Object...](TopLevel.Object.md))~~ | Searches for profile instances. |
| static [removeCustomer](dw.customer.CustomerMgr.md#removecustomercustomer)([Customer](dw.customer.Customer.md)) | Logs out the supplied customer and deletes the customer record. |
| static [removeCustomerTrackingData](dw.customer.CustomerMgr.md#removecustomertrackingdatacustomer)([Customer](dw.customer.Customer.md)) | Removes (asynchronously) tracking data for this customer (from external systems or data stores). |
| static [searchProfile](dw.customer.CustomerMgr.md#searchprofilestring-object)([String](TopLevel.String.md), [Object...](TopLevel.Object.md)) | <p/>Searches for a single profile instance. |
| static [searchProfiles](dw.customer.CustomerMgr.md#searchprofilesmap-string)([Map](dw.util.Map.md), [String](TopLevel.String.md)) | <p/>Searches for profile instances. |
| static [searchProfiles](dw.customer.CustomerMgr.md#searchprofilesstring-string-object)([String](TopLevel.String.md), [String](TopLevel.String.md), [Object...](TopLevel.Object.md)) | Searches for profile instances. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### customerGroups
- customerGroups: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns the customer groups of the current site.


---

### passwordConstraints
- passwordConstraints: [CustomerPasswordConstraints](dw.customer.CustomerPasswordConstraints.md) `(read-only)`
  - : Returns an instance of [CustomerPasswordConstraints](dw.customer.CustomerPasswordConstraints.md)
      for the customer list assigned to the current site.



---

### registeredCustomerCount
- registeredCustomerCount: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the number of registered customers in the system. This number can be used for reporting
      purposes.



---

### siteCustomerList
- siteCustomerList: [CustomerList](dw.customer.CustomerList.md) `(read-only)`
  - : Returns the customer list of the current site.


---

## Method Details

### authenticateCustomer(String, String)
- static authenticateCustomer(login: [String](TopLevel.String.md), password: [String](TopLevel.String.md)): [AuthenticationStatus](dw.customer.AuthenticationStatus.md)
  - : This method authenticates a customer using the supplied login and password. It will not log in the customer into
      the current session, but returns only a status indicating success or failure (with different error codes for the failure cases).
      Upon successful authentication (status code 'AUTH\_OK') the status object also holds the authenticated customer.
      To continue the login process, call the loginCustomer(AuthenticationStatus, boolean) method.
      
      This method verifies that the password for the customer is not expired. If it is expired the authentication will fail, with a status code of
      ERROR\_PASSWORD\_EXPIRED. This allows the storefront to require the customer to change the password, and then the login can proceed.


    **Parameters:**
    - login - Login name, must not be null.
    - password - Password, must not be null.

    **Returns:**
    - the status of the authentication process


---

### createCustomer(String, String)
- static createCustomer(login: [String](TopLevel.String.md), password: [String](TopLevel.String.md)): [Customer](dw.customer.Customer.md)
  - : Creates a new Customer using the supplied login, password. The system automatically assigns a customer number based on
      the customer sequence numbers configured for the site or organization. The number is guaranteed to be unique, but is not guaranteed to be sequential.
      It can be higher or lower than a previously created number. As a result, sorting customers by customer number is not guaranteed to sort them in their
      order of creation.
      
      
      The method throws an exception if any of the following conditions are encountered:
      
      - A Customer with the supplied Login already exists
      - The Login is not acceptable.
      - The Password is not acceptable.
      - The system cannot create the Customer.
      
      
      
      A valid login name is between 1 and 256 characters in length (not counting leading or trailing whitespace), and may contain only the
      following characters:
      
      - alphanumeric (Unicode letters or decimal digits)
      - space
      - period
      - dash
      - underscore
      - @
      
      
      
      Note: a storefront can be customized to provide further constraints on characters in a login name, but it cannot remove any constraints described above.
      
      
      If customers are created using this Script API call then any updated to the customer records should be done through Script API calls as well.
      The customer records created with Script API call should not be updated with OCAPI calls as the email validation is handled
      differently in these calls and may result in InvalidEmailException.


    **Parameters:**
    - login - The unique login name associated with the new customer and its profile, must not be null. If login is already in use, an exception will be thrown.
    - password - Customer plain customer password, which is encrypted before it is stored at the profile, must not be null.

    **Returns:**
    - customer The new customer object.


---

### createCustomer(String, String, String)
- static createCustomer(login: [String](TopLevel.String.md), password: [String](TopLevel.String.md), customerNo: [String](TopLevel.String.md)): [Customer](dw.customer.Customer.md)
  - : Creates a new Customer using the supplied login, password, and a customerNo. If the customerNo is not specified,
      the system automatically assigns a customer number based on the customer sequence numbers configured for the site or organization. An automatically assigned
      number is guaranteed to be unique, but is not guaranteed to be sequential. It can be higher or lower than a previously created number. As a result, sorting
      customers by customer number is not guaranteed to sort them in their order of creation.
      
      
      The method throws an exception if any of the following conditions are encountered:
      
      - A Customer with the supplied Login already exists
      - A Customer with the explicitly provided or calculated customer number already exists.
      - The Login is not acceptable.
      - The Password is not acceptable.
      - The system cannot create the Customer.
      
      
      
      A valid login name is between 1 and 256 characters in length (not counting leading or trailing whitespace), and may contain only the
      following characters:
      
      - alphanumeric (Unicode letters or decimal digits)
      - space
      - period
      - dash
      - underscore
      - @
      
      
      
      Note: a storefront can be customized to provide further constraints on characters in a login name, but it cannot remove any constraints described above.
      
      
      A valid CustomerNo is between 1 and 100 characters in length (not counting leading or trailing whitespace). Commerce Cloud Digital recommends that a CustomerNo only
      contain characters valid for URLs.
      
      
      If customers are created using this Script API call then any updated to the customer records should be done through Script API calls as well.
      The customer records created with Script API call should not be updated with OCAPI calls as the email validation is handled
      differently in these calls and may result in InvalidEmailException.


    **Parameters:**
    - login - The unique login name associated with the new customer and its profile, must not be null. If login is already in use, an exception will be thrown.
    - password - Customer plain customer password, which is encrypted before it is stored at the profile, must not be null.
    - customerNo - The unique customerNo can be null, the system will then automatically assign a new value. If provided explicitly,  the system will make sure that no other customer uses the same value and will throw an exception otherwise.

    **Returns:**
    - customer The new customer object.


---

### createExternallyAuthenticatedCustomer(String, String)
- static createExternallyAuthenticatedCustomer(authenticationProviderId: [String](TopLevel.String.md), externalId: [String](TopLevel.String.md)): [Customer](dw.customer.Customer.md)
  - : Given an authentication provider Id and an external Id: creates a Customer record in the system if one does not
      exist already for the same 'authenticationProviderId' and 'externalId' pair. If one already exists - it is returned.


    **Parameters:**
    - authenticationProviderId - the Id of the authentication provider as configured in Commerce Cloud Digital.
    - externalId - the Id of the customer at the authentication provider. Each authentication provider generates  these in a different way, they are unique within their system

    **Returns:**
    - On success: the created customer. On failure - null


---

### describeProfileType()
- static describeProfileType(): [ObjectTypeDefinition](dw.object.ObjectTypeDefinition.md)
  - : Returns the meta data for profiles.

    **Returns:**
    - the meta data for profiles.


---

### getCustomerByCustomerNumber(String)
- static getCustomerByCustomerNumber(customerNumber: [String](TopLevel.String.md)): [Customer](dw.customer.Customer.md)
  - : Returns the customer with the specified customer number. If no customer with this customer number exists, null is returned.

    **Parameters:**
    - customerNumber - the customer number associated with the customer, must not be null.

    **Returns:**
    - The customer if found, null otherwise


---

### getCustomerByLogin(String)
- static getCustomerByLogin(login: [String](TopLevel.String.md)): [Customer](dw.customer.Customer.md)
  - : Returns the customer for the specified login name. If no customer with this login name exists, null is returned.

    **Parameters:**
    - login - the unique login name associated with the customer, must not be null.

    **Returns:**
    - The customer if found, null otherwise


---

### getCustomerByToken(String)
- static getCustomerByToken(token: [String](TopLevel.String.md)): [Customer](dw.customer.Customer.md)
  - : Returns the customer associated with the specified password reset token. A valid token is one that is associated
      with a customer record and is not expired. Such a token can be generated by
      [Credentials.createResetPasswordToken()](dw.customer.Credentials.md#createresetpasswordtoken). If the passed token is valid, the associated customer
      is returned. Otherwise `null` is returned


    **Parameters:**
    - token - password reset token

    **Returns:**
    - The customer associated with the token. `Null` if the token is invalid.


---

### getCustomerGroup(String)
- static getCustomerGroup(id: [String](TopLevel.String.md)): [CustomerGroup](dw.customer.CustomerGroup.md)
  - : Returns the customer group with the specified ID or null if group
      does not exists.


    **Parameters:**
    - id - the customer group identifier.

    **Returns:**
    - Customer group for ID or null


---

### getCustomerGroups()
- static getCustomerGroups(): [Collection](dw.util.Collection.md)
  - : Returns the customer groups of the current site.

    **Returns:**
    - Customer groups of current site.


---

### getCustomerList(String)
- static getCustomerList(id: [String](TopLevel.String.md)): [CustomerList](dw.customer.CustomerList.md)
  - : Returns the customer list identified by the specified ID.
      Returns null if no customer list with the specified id exists.
      
      
      Note: Typically the ID of an automatically created customer
      list is equal to the ID of the site.


    **Parameters:**
    - id - The ID of the customer list.

    **Returns:**
    - The CustomerList, or null if not found.


---

### getExternallyAuthenticatedCustomerProfile(String, String)
- static getExternallyAuthenticatedCustomerProfile(authenticationProviderId: [String](TopLevel.String.md), externalId: [String](TopLevel.String.md)): [Profile](dw.customer.Profile.md)
  - : Given an authentication provider Id and external Id returns the Customer Profile
      in our system.


    **Parameters:**
    - authenticationProviderId - the Id of the authentication provider as configured in Commerce Cloud Digital.
    - externalId - the Id of the customer at the authentication provider.  Each authentication provider generates these in a different way, they  are unique within their system

    **Returns:**
    - The Profile of the customer if found, null otherwise


---

### getPasswordConstraints()
- static getPasswordConstraints(): [CustomerPasswordConstraints](dw.customer.CustomerPasswordConstraints.md)
  - : Returns an instance of [CustomerPasswordConstraints](dw.customer.CustomerPasswordConstraints.md)
      for the customer list assigned to the current site.


    **Returns:**
    - customer password constraints for current site


---

### getProfile(String)
- static getProfile(customerNumber: [String](TopLevel.String.md)): [Profile](dw.customer.Profile.md)
  - : Returns the profile with the specified customer number.

    **Parameters:**
    - customerNumber - the customer number of the customer of the to be retrieved profile

    **Returns:**
    - Profile for specified customer number


---

### getRegisteredCustomerCount()
- static getRegisteredCustomerCount(): [Number](TopLevel.Number.md)
  - : Returns the number of registered customers in the system. This number can be used for reporting
      purposes.


    **Returns:**
    - the number of registered customers in the system.


---

### getSiteCustomerList()
- static getSiteCustomerList(): [CustomerList](dw.customer.CustomerList.md)
  - : Returns the customer list of the current site.

    **Returns:**
    - The customer list assigned to the current site.


---

### isAcceptablePassword(String)
- static isAcceptablePassword(password: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Checks if the given password matches the password constraints (for example password length) of
      the current site's assigned customerlist.


    **Parameters:**
    - password - the to be checked password

    **Returns:**
    - true if the given password matches all required criteria


---

### isPasswordExpired(String)
- static isPasswordExpired(login: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Checks if the password for the given customer is expired

    **Parameters:**
    - login - the login for the customer to be checked

    **Returns:**
    - true if the password is expired


---

### loginCustomer(AuthenticationStatus, Boolean)
- static loginCustomer(authStatus: [AuthenticationStatus](dw.customer.AuthenticationStatus.md), rememberMe: [Boolean](TopLevel.Boolean.md)): [Customer](dw.customer.Customer.md)
  - : This method logs in the authenticated customer (from a previous authenticateCustomer() call). If a different customer is currently authenticated in the session, then this
      customer is "logged out" and all privacy-relevant data and all form data are deleted. If the previous authentication was not successful, then null is returned and no changes
      to the session are made.
      
      
       If the input value "RememberMe" is set to true, this method stores a cookie on the customer's machine which will be used to identify the customer when the next
      session is initiated.  The cookie is set to expire in 180 days (i.e. 6 months). Note that a customer who is remembered is not automatically authenticated and will
      have to explicitly log in to access any personal information.


    **Parameters:**
    - authStatus - the authentication status from the previous authenticateCustomer call
    - rememberMe - Boolean value indicating if the customer wants to be remembered on the current computer.  If a value of true is supplied a cookie identifying  the customer is stored upon successful login.  If a value of false, or a null value, is supplied, then no cookie is stored and any existing cookie is removed.

    **Returns:**
    - Customer successfully authenticated customer. Null if the authentication status was not indicating success of the authentication.


---

### loginCustomer(String, String, Boolean)
- ~~static loginCustomer(login: [String](TopLevel.String.md), password: [String](TopLevel.String.md), rememberMe: [Boolean](TopLevel.Boolean.md)): [Customer](dw.customer.Customer.md)~~
  - : This method authenticates the current session using the supplied login and password. If a different customer is currently authenticated in the session, then this
      customer is "logged out" and her/his privacy and form data are deleted. If the authentication with the given credentials fails, then null is returned and no changes
      to the session are made. The authentication will be sucessful even when the password of the customer is already expired (according to the customer list settings).
      
      
       If the input value "RememberMe" is set to true, this method stores a cookie on the customer's machine which will be used to identify the customer when the next
      session is initiated.  The cookie is set to expire in 180 days (i.e. 6 months). Note that a customer who is remembered is not automatically authenticated and will
      have to explicitly log in to access any personal information.


    **Parameters:**
    - login - Login name, must not be null.
    - password - Password, must not be null.
    - rememberMe - Boolean value indicating if the customer wants to be remembered on the current computer.  If a value of true is supplied a cookie identifying  the customer is stored upon successful login.  If a value of false, or a null value, is supplied, then no cookie is stored and any existing cookie is removed.

    **Returns:**
    - Customer successfully authenticated customer. Null if the authentication with the given credentials fails.

    **Deprecated:**
:::warning
use authenticateCustomer(login, password) and loginCustomer(authStatus, rememberMe) instead since they correctly check for expired passwords
:::

---

### loginExternallyAuthenticatedCustomer(String, String, Boolean)
- static loginExternallyAuthenticatedCustomer(authenticationProviderId: [String](TopLevel.String.md), externalId: [String](TopLevel.String.md), rememberMe: [Boolean](TopLevel.Boolean.md)): [Customer](dw.customer.Customer.md)
  - : Logs in externally authenticated customer if it has already been created in the system and the profile is not disabled or locked

    **Parameters:**
    - authenticationProviderId - the Id of the authentication provider as configured in Commerce Cloud Digital.
    - externalId - the Id of the customer at the authentication provider.
    - rememberMe - whether to drop the remember me cookie

    **Returns:**
    - Customer if found in the system and not disabled or locked.
      [getExternallyAuthenticatedCustomerProfile(String, String)](dw.customer.CustomerMgr.md#getexternallyauthenticatedcustomerprofilestring-string)



---

### logoutCustomer(Boolean)
- static logoutCustomer(rememberMe: [Boolean](TopLevel.Boolean.md)): [Customer](dw.customer.Customer.md)
  - : Logs out the customer currently logged into the storefront. The boolean value "RememberMe" indicates, if the customer would like to be remembered on the current
      browser. If a value of true is supplied, the customer authentication state is set to "not logged in" and additionally the following session data is removed: the customer
      session private data, the form status data, dictionary information of interaction continue nodes, basket reference information, the secure token cookie. If the value is set
      to false or null, the complete session dictionary is cleaned up. The customer and anonymous cookie are removed and a new session cookie is set.


    **Parameters:**
    - rememberMe - Boolean value indicating if the customer wants to be remembered on the current browser. If a value of true is supplied, the customer authentication state  is set to "not logged in" and additionally the following session data is removed: the customer session private data, the form status data, dictionary information of interaction  continue nodes, basket reference information, the secure token cookie. If the value is set to false or null, the complete session dictionary is cleaned up. The customer and anonymous  cookie are removed and a new session cookie is set.

    **Returns:**
    - the new customer identity after logout. If rememberMe is true, null is returned.


---

### processProfiles(Function, String, Object...)
- static processProfiles(processFunction: [Function](TopLevel.Function.md), queryString: [String](TopLevel.String.md), args: [Object...](TopLevel.Object.md)): void
  - : Executes a user-definable function on a set of customer profiles. This method is intended to be used in batch processes and jobs,
      since it allows efficient processing of large result sets (which might take a while to process).
      
      First, a search with the given parameters is executed. Then the given function is executed once for each profile of the search result.
      The profile is handed over as the only parameter to this function.
      
      
      The search can be configured using a simple query language, which
      provides most common filter and operator functionality.
      
      For a description of this query language, see the [queryProfile(String, Object...)](dw.customer.CustomerMgr.md#queryprofilestring-object) method.
      
      The callback function will be supplied with a single argument of type 'Profile'. When the callback function defines
      additional arguments, they will be undefined when the function is called. When the callback function doesn't define
      any arguments at all, it will be called anyway (no error will happen, but the function won't get a profile as parameter).
      
      Error during execution of the callback function will be logged, and execution will continue with the next element from the
      result set.
      
      This method can be used as in this example (which counts the number of men):
      
      
      ```
              var count=0;
              function callback(profile: Profile)
              {
                  count++;
                  dw.system.Logger.debug("customer found: "+profile.customerNo)
              }
             CustomerMgr.processProfiles(callback, "gender=1");
             dw.system.Logger.debug("found "+count+" men in customer list");
      ```


    **Parameters:**
    - processFunction - the function to execute for each profile
    - queryString - the query string to use when searching for a profile.
    - args - the query string arguments.


---

### queryProfile(String, Object...)
- ~~static queryProfile(queryString: [String](TopLevel.String.md), args: [Object...](TopLevel.Object.md)): [Profile](dw.customer.Profile.md)~~
  - : 
      Searches for a single profile instance.
      
      
      The search can be configured using a simple query language, which
      provides most common filter and operator functionality.
      
      
      The identifier for an **attribute**  to use in a query condition is always the
      ID of the  attribute as defined in the type definition. For custom defined attributes
      the prefix custom is required in the search term (e.g. `custom.color = {1}`),
      while for system attributes no prefix is used (e.g. `name = {4}`).
      
      
      Supported attribute value **types** with sample expression values:
      - _String_`'String', 'Str*', 'Strin?'`
      - _Integer_`1, 3E4`
      - _Number_`1.0, 3.99E5`
      - _Date_`yyyy-MM-dd e.g. 2007-05-31 (Default TimeZone = UTC)`
      - _DateTime_`yyyy-MM-dd'T'hh:mm:ss+Z e.g. 2007-05-31T00:00+Z (Z TimeZone = UTC) or 2007-05-31T00:00:00`
      - _Boolean_`true, false`
      - _Email_`'search@demandware.com', '*@demandware.com'`
      - _Set of String_`'String', 'Str*', 'Strin?'`
      - _Set of Integer_`1, 3E4`
      - _Set of Number_`1.0, 3.99E5`
      - _Enum of String_`'String', 'Str*', 'Strin?'`
      - _Enum of Integer_`1, 3E4`
      
      
      The following types of attributes are not queryable:
      
      - _Image_
      - _HTML_
      - _Text_
      - _Quantity_
      - _Password_
      
      
      Note, that some system attributes are not queryable by default regardless of the
      actual value type code.
      
      
      
      The following **operators** are supported in a condition:
      
      - `=`Equals - All types; supports NULL value (`thumbnail = NULL`)
      - `!=`Not equals - All types; supports NULL value (`thumbnail != NULL`)
      - `<`Less than  - Integer, Number and Date types only
      - `>`Greater than - Integer, Number and Date types only
      - `<=`Less or equals than - Integer, Number and Date types only
      - `>=`Greater or equals than  - Integer, Number and Date types only
      - `LIKE`Like - String types and Email only; use if leading or trailing  wildcards will be used to support substring search(`custom.country LIKE 'US*'`)
      - `ILIKE`Caseindependent Like - String types and Email only, use to support  case insensitive query (`custom.country ILIKE 'usa'`), does also support wildcards for  substring matching
      
      
      
      Conditions can be combined using logical expressions 'AND', 'OR' and 'NOT'
      and nested using parenthesis e.g.
      `gender = {1} AND (age >= {2} OR (NOT profession LIKE {3}))`.
      
      
      
      The query language provides a placeholder syntax to pass objects as
      additional search parameters. Each passed object is related to a
      placeholder in the query string. The placeholder must be an Integer that
      is surrounded by braces. The first Integer value must be '0', the second
      '1' and so on, e.g.
      `querySystemObjects("sample", "age = {0} or creationDate >= {1}", 18, date)`
      
      
      If there is more than one object matching the specified query criteria, the
      result is not deterministic. In order to retrieve a single object from a sorted result
      set it is recommended to use the following code:
      `queryProfiles("", "custom.myAttr asc", null).first()`.
      The method `first()` returns only the next element and closes the
      iterator.
      
      
      
      
      **This method is deprecated and will be removed in a future release.**
      One of the following methods should be used instead:
      [searchProfile(String, Object...)](dw.customer.CustomerMgr.md#searchprofilestring-object),
      [searchProfiles(Map, String)](dw.customer.CustomerMgr.md#searchprofilesmap-string) and
      [searchProfiles(String, String, Object...)](dw.customer.CustomerMgr.md#searchprofilesstring-string-object) to search for customers and
      [processProfiles(Function, String, Object...)](dw.customer.CustomerMgr.md#processprofilesfunction-string-object) to search and process customers in jobs.


    **Parameters:**
    - queryString - the query string to use when searching for a profile.
    - args - the query string arguments.

    **Returns:**
    - the profile which was found when executing the `queryString`.

    **Deprecated:**
:::warning
use [searchProfile(String, Object...)](dw.customer.CustomerMgr.md#searchprofilestring-object) instead.
:::

---

### queryProfiles(Map, String)
- ~~static queryProfiles(queryAttributes: [Map](dw.util.Map.md), sortString: [String](TopLevel.String.md)): [SeekableIterator](dw.util.SeekableIterator.md)~~
  - : 
      Searches for profile instances.
      
      
      The search can be configured with a map, which key-value pairs are
      converted into a query expression. The key-value pairs are turned into a
      sequence of '=' or 'like' conditions, which are combined with AND
      statements.
      
      
      Example:
      
      A map with the key/value pairs: _'name'/'tom\*', 'age'/66_
      will be converted as follows: `"name like 'tom*' and age = 66"`
      
      
      The identifier for an **attribute**  to use in a query condition is always the
      ID of the  attribute as defined in the type definition. For custom defined attributes
      the prefix custom is required in the search term (e.g. `custom.color = {1}`),
      while for system attributes no prefix is used (e.g. `name = {4}`).
      
      
      Supported attribute value **types** with sample expression values:
      - _String_`'String', 'Str*', 'Strin?'`
      - _Integer_`1, 3E4`
      - _Number_`1.0, 3.99E5`
      - _Date_`yyyy-MM-dd e.g. 2007-05-31 (Default TimeZone = UTC)`
      - _DateTime_`yyyy-MM-dd'T'hh:mm:ss+Z e.g. 2007-05-31T00:00+Z (Z TimeZone = UTC) or 2007-05-31T00:00:00`
      - _Boolean_`true, false`
      - _Email_`'search@demandware.com', '*@demandware.com'`
      - _Set of String_`'String', 'Str*', 'Strin?'`
      - _Set of Integer_`1, 3E4`
      - _Set of Number_`1.0, 3.99E5`
      - _Enum of String_`'String', 'Str*', 'Strin?'`
      - _Enum of Integer_`1, 3E4`
      
      
      The following types of attributes are not queryable:
      
      - _Image_
      - _HTML_
      - _Text_
      - _Quantity_
      - _Password_
      
      
      Note, that some system attributes are not queryable by default regardless of the
      actual value type code.
      
      
      
      The **sorting** parameter is optional and may contain a comma separated list of
      attribute names to sort by. Each sort attribute name may be followed by an
      optional sort direction specifier ('asc' | 'desc'). Default sorting directions is
      ascending, if no direction was specified.
      
      Example: `age desc, name`
      
      Please note that specifying a localized custom attribute as the sorting attribute is
      currently not supported.
      
      
      It is strongly recommended to call `close()` on the returned SeekableIterator
      if not all of its elements are being retrieved. This will ensure the proper cleanup of system resources.
      See [SeekableIterator.close()](dw.util.SeekableIterator.md#close)
      
      
      
      
      **This method is deprecated and will be removed in a future release.**
      One of the following methods should be used instead:
      [searchProfile(String, Object...)](dw.customer.CustomerMgr.md#searchprofilestring-object),
      [searchProfiles(Map, String)](dw.customer.CustomerMgr.md#searchprofilesmap-string) and
      [searchProfiles(String, String, Object...)](dw.customer.CustomerMgr.md#searchprofilesstring-string-object) to search for customers and
      [processProfiles(Function, String, Object...)](dw.customer.CustomerMgr.md#processprofilesfunction-string-object) to search and process customers in jobs.


    **Parameters:**
    - queryAttributes - key-value pairs that define the query.
    - sortString - an optional sorting or null if no sorting is necessary.

    **Returns:**
    - SeekableIterator containing the result set of the query.

    **Deprecated:**
:::warning
use [searchProfiles(Map, String)](dw.customer.CustomerMgr.md#searchprofilesmap-string) instead.
:::

---

### queryProfiles(String, String, Object...)
- ~~static queryProfiles(queryString: [String](TopLevel.String.md), sortString: [String](TopLevel.String.md), args: [Object...](TopLevel.Object.md)): [SeekableIterator](dw.util.SeekableIterator.md)~~
  - : Searches for profile instances.
      
      
      The search can be configured using a simple query language, which
      provides most common filter and operator functionality.
      
      For a description of this query language, see the [queryProfile(String, Object...)](dw.customer.CustomerMgr.md#queryprofilestring-object) method.
      
      
      
      **This method is deprecated and will be removed in a future release.**
      One of the following methods should be used instead:
      [searchProfile(String, Object...)](dw.customer.CustomerMgr.md#searchprofilestring-object),
      [searchProfiles(Map, String)](dw.customer.CustomerMgr.md#searchprofilesmap-string) and
      [searchProfiles(String, String, Object...)](dw.customer.CustomerMgr.md#searchprofilesstring-string-object) to search for customers and
      [processProfiles(Function, String, Object...)](dw.customer.CustomerMgr.md#processprofilesfunction-string-object) to search and process customers in jobs.


    **Parameters:**
    - queryString - the actual query.
    - sortString - an optional sorting or null if no sorting is necessary.
    - args - optional parameters for the query string.

    **Returns:**
    - SeekableIterator containing the result set of the query.

    **Deprecated:**
:::warning
use [searchProfiles(String, String, Object...)](dw.customer.CustomerMgr.md#searchprofilesstring-string-object) instead.
:::

---

### removeCustomer(Customer)
- static removeCustomer(customer: [Customer](dw.customer.Customer.md)): void
  - : Logs out the supplied customer and deletes the customer record. The customer must be a registered customer and the customer must currently be logged in. The customer must be
      logged in for security reasons to ensure that only the customer itself can remove itself from the system. While logout the customers session is reset to an anonymous session and, if present, the "Remember me" cookie of the customer is removed.
      Deleting the customer record includes the customer credentials, profile, address-book with all addresses, customer payment instruments, product lists and memberships in
      customer groups. Orders placed by this customer won't be deleted. If the supplied customer is not a registered customer or is not logged in, the API throws an exception


    **Parameters:**
    - customer - The customer to remove, must not be null.


---

### removeCustomerTrackingData(Customer)
- static removeCustomerTrackingData(customer: [Customer](dw.customer.Customer.md)): void
  - : Removes (asynchronously) tracking data for this customer (from external systems or data stores). This will not remove the
      customer from the database, nor will it prevent tracking to start again in the future for this customer.
      
      The customer is identified by login / email /customerNo / cookie when its a registered customer, and by cookie
      when its an anonymous customer.


    **Parameters:**
    - customer - the customer


---

### searchProfile(String, Object...)
- static searchProfile(queryString: [String](TopLevel.String.md), args: [Object...](TopLevel.Object.md)): [Profile](dw.customer.Profile.md)
  - : 
      Searches for a single profile instance.
      
      
      The search can be configured using a simple query language, which
      provides most common filter and operator functionality.
      
      
      The identifier for an **attribute** to use in a query condition is always the
      ID of the attribute as defined in the type definition. For custom defined attributes
      the prefix custom is required in the search term (e.g. `custom.color = {1}`),
      while for system attributes no prefix is used (e.g. `name = {4}`).
      
      
      Supported attribute value **types** with sample expression values:
      - _String_`'String', 'Str*', 'Strin?'`
      - _Integer_`1, 3E4`
      - _Number_`1.0, 3.99E5`
      - _Date_`yyyy-MM-dd e.g. 2007-05-31 (Default TimeZone = UTC)`
      - _DateTime_`yyyy-MM-dd'T'hh:mm:ss+Z e.g. 2007-05-31T00:00+Z (Z TimeZone = UTC) or 2007-05-31T00:00:00`
      - _Boolean_`true, false`
      - _Email_`'search@demandware.com', '*@demandware.com'`
      - _Set of String_`'String', 'Str*', 'Strin?'`
      - _Set of Integer_`1, 3E4`
      - _Set of Number_`1.0, 3.99E5`
      - _Enum of String_`'String', 'Str*', 'Strin?'`
      - _Enum of Integer_`1, 3E4`
      
      
      The following types of attributes are not queryable:
      
      - _Image_
      - _HTML_
      - _Text_
      - _Quantity_
      - _Password_
      
      
      Note, that some system attributes are not queryable by default regardless of the
      actual value type code.
      
      
      
      The following **operators** are supported in a condition:
      
      - `=`Equals - All types; supports NULL value (`thumbnail = NULL`)
      - `!=`Not equals - All types; supports NULL value (`thumbnail != NULL`)
      - `<`Less than  - Integer, Number and Date types only
      - `>`Greater than - Integer, Number and Date types only
      - `<=`Less or equals than - Integer, Number and Date types only
      - `>=`Greater or equals than  - Integer, Number and Date types only
      - `LIKE`Like - String types and Email only; use if leading or trailing  wildcards will be used to support substring search(`custom.country LIKE 'US*'`)
      - `ILIKE`Caseindependent Like - String types and Email only, use to support  case insensitive query (`custom.country ILIKE 'usa'`), does also support wildcards for  substring matching
      
      
      
      Conditions can be combined using logical expressions 'AND', 'OR' and 'NOT'
      and nested using parenthesis e.g.
      `gender = {1} AND (age >= {2} OR (NOT profession LIKE {3}))`.
      
      
      
      The query language provides a placeholder syntax to pass objects as
      additional search parameters. Each passed object is related to a
      placeholder in the query string. The placeholder must be an Integer that
      is surrounded by braces. The first Integer value must be '0', the second
      '1' and so on, e.g.
      `querySystemObjects("sample", "age = {0} or creationDate >= {1}", 18, date)`
      
      
      
      If there is more than one object matching the specified query criteria, the
      result is not deterministic. In order to retrieve a single object from a sorted result
      set it is recommended to use the following code:
      `queryProfiles("", "custom.myAttr asc", null).first()`.
      The method `first()` returns only the next element and closes the
      iterator.
      
      
      If the customer search API is configured to use the new Search Service, these differences apply:
      
      
      - Search may match and return documents with missing (NULL) values in search fields, depending on      how the query is structured, potentially leading to broader result sets. For example, a query like      `custom.searchField != "some value"`also returns documents where `custom.searchField`is NULL — whereas in relational databases, such documents are excluded.
      - Newly created customers might not be found immediately via the search service, and changes to existing      customers might also not be in effect immediately (there is a slight delay in updating the index)
      - Wildcards are filtered from the query (\*, %, +) and replaced by spaces
      - LIKE and ILIKE queries are executed as fulltext queries (working on whole words), not as substring searches
      - LIKE queries are always case insensitive
      - Using logical operators may change the execution of LIKE/ILIKE clauses to exact string comparison, depending on how they are combined
      - Using logical operators may result in degraded performance, depending on how they are combined


    **Parameters:**
    - queryString - the query string to use when searching for a profile.
    - args - the query string arguments.

    **Returns:**
    - the profile which was found when executing the `queryString`.


---

### searchProfiles(Map, String)
- static searchProfiles(queryAttributes: [Map](dw.util.Map.md), sortString: [String](TopLevel.String.md)): [SeekableIterator](dw.util.SeekableIterator.md)
  - : 
      Searches for profile instances.
      
      
      The search can be configured with a map, which key-value pairs are
      converted into a query expression. The key-value pairs are turned into a
      sequence of '=' or 'like' conditions, which are combined with AND
      statements.
      
      
      Example:
      
      A map with the key/value pairs: _'name'/'tom\*', 'age'/66_
      will be converted as follows: `"name like 'tom*' and age = 66"`
      
      
      The identifier for an **attribute**  to use in a query condition is always the
      ID of the  attribute as defined in the type definition. For custom defined attributes
      the prefix custom is required in the search term (e.g. `custom.color = {1}`),
      while for system attributes no prefix is used (e.g. `name = {4}`).
      
      
      Supported attribute value **types** with sample expression values:
      - _String_`'String', 'Str*', 'Strin?'`
      - _Integer_`1, 3E4`
      - _Number_`1.0, 3.99E5`
      - _Date_`yyyy-MM-dd e.g. 2007-05-31 (Default TimeZone = UTC)`
      - _DateTime_`yyyy-MM-dd'T'hh:mm:ss+Z e.g. 2007-05-31T00:00+Z (Z TimeZone = UTC) or 2007-05-31T00:00:00`
      - _Boolean_`true, false`
      - _Email_`'search@demandware.com', '*@demandware.com'`
      - _Set of String_`'String', 'Str*', 'Strin?'`
      - _Set of Integer_`1, 3E4`
      - _Set of Number_`1.0, 3.99E5`
      - _Enum of String_`'String', 'Str*', 'Strin?'`
      - _Enum of Integer_`1, 3E4`
      
      
      The following types of attributes are not queryable:
      
      - _Image_
      - _HTML_
      - _Text_
      - _Quantity_
      - _Password_
      
      
      Note, that some system attributes are not queryable by default regardless of the
      actual value type code.
      
      
      
      The **sorting** parameter is optional and may contain a comma separated list of
      attribute names to sort by. Each sort attribute name may be followed by an
      optional sort direction specifier ('asc' | 'desc'). Default sorting directions is
      ascending, if no direction was specified.
      
      Example: `age desc, name`
      
      Please note that specifying a localized custom attribute as the sorting attribute is
      currently not supported.
      
      
      It is strongly recommended to call `close()` on the returned SeekableIterator
      if not all of its elements are being retrieved. This will ensure the proper cleanup of system resources.
      
      [SeekableIterator.close()](dw.util.SeekableIterator.md#close)
      
      
      If the customer search API is configured to use the new Search Service, these differences apply:
      
      
      - Search may match and return documents with missing (NULL) values in search fields, depending on      how the query is structured, potentially leading to broader result sets. For example, a query like      `custom.searchField != "some value"`also returns documents where `custom.searchField`is NULL — whereas in relational databases, such documents are excluded.
      - Newly created customers might not be found immediately via the search service, and changes to existing      customers might also not be in effect immediately (there is a slight delay in updating the index)
      - Wildcards are filtered from the query (\*, %, +) and replaced by spaces
      - LIKE and ILIKE queries are executed as fulltext queries (working on whole words), not as substring searches
      - LIKE queries are always case insensitive
      - Using logical operators may change the execution of LIKE/ILIKE clauses to exact string comparison, depending on how they are combined
      - Using logical operators may result in degraded performance, depending on how they are combined
      - The search returns only the first 1000 hits from the search result


    **Parameters:**
    - queryAttributes - key-value pairs that define the query.
    - sortString - an optional sorting or null if no sorting is necessary.

    **Returns:**
    - SeekableIterator containing the result set of the query.


---

### searchProfiles(String, String, Object...)
- static searchProfiles(queryString: [String](TopLevel.String.md), sortString: [String](TopLevel.String.md), args: [Object...](TopLevel.Object.md)): [SeekableIterator](dw.util.SeekableIterator.md)
  - : Searches for profile instances.
      
      
      The search can be configured using a simple query language, which
      provides most common filter and operator functionality.
      
      For a description of this query language, see the [searchProfile(String, Object...)](dw.customer.CustomerMgr.md#searchprofilestring-object) method.
      
      
      If the customer search API is configured to use the new Search Service, these differences apply:
      
      
      - Search may match and return documents with missing (NULL) values in search fields, depending on      how the query is structured, potentially leading to broader result sets. For example, a query like      `custom.searchField != "some value"`also returns documents where `custom.searchField`is NULL — whereas in relational databases, such documents are excluded.
      - Newly created customers might not be found immediately via the search service, and changes to existing      customers might also not be in effect immediately (there is a slight delay in updating the index)
      - Wildcards are filtered from the query (\*, %, +) and replaced by spaces
      - LIKE and ILIKE queries are executed as fulltext queries (working on whole words), not as substring searches
      - LIKE queries are always case insensitive
      - Using logical operators may change the execution of LIKE/ILIKE clauses to exact string comparison, depending on how they are combined
      - Using logical operators may result in degraded performance, depending on how they are combined
      - The search returns only the first 1000 hits from the search result


    **Parameters:**
    - queryString - the actual query.
    - sortString - an optional sorting or null if no sorting is necessary.
    - args - optional parameters for the query string.

    **Returns:**
    - SeekableIterator containing the result set of the query.


---

<!-- prettier-ignore-end -->
