import CustomerList = require('./CustomerList');
import ObjectTypeDefinition = require('../object/ObjectTypeDefinition');
import CustomerPasswordConstraints = require('./CustomerPasswordConstraints');
import Profile = require('./Profile');
import SeekableIterator = require('../util/SeekableIterator');
import utilMap = require('../util/Map');
import Collection = require('../util/Collection');
import CustomerGroup = require('./CustomerGroup');
import Customer = require('./Customer');
import AuthenticationStatus = require('./AuthenticationStatus');

/**
 * Provides helper methods for managing customers and customer
 * profiles.
 * Note: this class allows access to sensitive information through
 * operations that retrieve the Profile object.
 * Pay attention to appropriate legal and regulatory requirements related to this data.
 */
declare class CustomerMgr {
    /**
     * Returns the customer groups of the current site.
     */
    static readonly customerGroups: Collection<CustomerGroup>;
    /**
     * Returns an instance of CustomerPasswordConstraints
     * for the customer list assigned to the current site.
     */
    static readonly passwordConstraints: CustomerPasswordConstraints;
    /**
     * Returns the number of registered customers in the system. This number can be used for reporting
     * purposes.
     */
    static readonly registeredCustomerCount: number;
    /**
     * Returns the customer list of the current site.
     */
    static readonly siteCustomerList: CustomerList;
    private constructor();
    /**
     * This method authenticates a customer using the supplied login and password. It will not log in the customer into
     * the current session, but returns only a status indicating success or failure (with different error codes for the failure cases).
     * Upon successful authentication (status code 'AUTH_OK') the status object also holds the authenticated customer.
     * To continue the login process, call the loginCustomer(AuthenticationStatus, boolean) method.
     * 
     * This method verifies that the password for the customer is not expired. If it is expired the authentication will fail, with a status code of
     * ERROR_PASSWORD_EXPIRED. This allows the storefront to require the customer to change the password, and then the login can proceed.
     */
    static authenticateCustomer(login: string, password: string): AuthenticationStatus;
    /**
     * Creates a new Customer using the supplied login, password. The system automatically assigns a customer number based on
     * the customer sequence numbers configured for the site or organization. The number is guaranteed to be unique, but is not guaranteed to be sequential.
     * It can be higher or lower than a previously created number. As a result, sorting customers by customer number is not guaranteed to sort them in their
     * order of creation.
     * 
     * The method throws an exception if any of the following conditions are encountered:
     * 
     * - A Customer with the supplied Login already exists
     * - The Login is not acceptable.
     * - The Password is not acceptable.
     * - The system cannot create the Customer.
     * 
     * A valid login name is between 1 and 256 characters in length (not counting leading or trailing whitespace), and may contain only the
     * following characters:
     * 
     * - alphanumeric (Unicode letters or decimal digits)
     * - space
     * - period
     * - dash
     * - underscore
     * - @
     * 
     * Note: a storefront can be customized to provide further constraints on characters in a login name, but it cannot remove any constraints described above.
     * 
     * If customers are created using this Script API call then any updated to the customer records should be done through Script API calls as well.
     * The customer records created with Script API call should not be updated with OCAPI calls as the email validation is handled
     * differently in these calls and may result in InvalidEmailException.
     */
    static createCustomer(login: string, password: string): Customer;
    /**
     * Creates a new Customer using the supplied login, password, and a customerNo. If the customerNo is not specified,
     * the system automatically assigns a customer number based on the customer sequence numbers configured for the site or organization. An automatically assigned
     * number is guaranteed to be unique, but is not guaranteed to be sequential. It can be higher or lower than a previously created number. As a result, sorting
     * customers by customer number is not guaranteed to sort them in their order of creation.
     * 
     * The method throws an exception if any of the following conditions are encountered:
     * 
     * - A Customer with the supplied Login already exists
     * - A Customer with the explicitly provided or calculated customer number already exists.
     * - The Login is not acceptable.
     * - The Password is not acceptable.
     * - The system cannot create the Customer.
     * 
     * A valid login name is between 1 and 256 characters in length (not counting leading or trailing whitespace), and may contain only the
     * following characters:
     * 
     * - alphanumeric (Unicode letters or decimal digits)
     * - space
     * - period
     * - dash
     * - underscore
     * - @
     * 
     * Note: a storefront can be customized to provide further constraints on characters in a login name, but it cannot remove any constraints described above.
     * 
     * A valid CustomerNo is between 1 and 100 characters in length (not counting leading or trailing whitespace). Commerce Cloud Digital recommends that a CustomerNo only
     * contain characters valid for URLs.
     * 
     * If customers are created using this Script API call then any updated to the customer records should be done through Script API calls as well.
     * The customer records created with Script API call should not be updated with OCAPI calls as the email validation is handled
     * differently in these calls and may result in InvalidEmailException.
     */
    static createCustomer(login: string, password: string, customerNo: string): Customer;
    /**
     * Given an authentication provider Id and an external Id: creates a Customer record in the system if one does not
     * exist already for the same 'authenticationProviderId' and 'externalId' pair. If one already exists - it is returned.
     */
    static createExternallyAuthenticatedCustomer(authenticationProviderId: string, externalId: string): Customer;
    /**
     * Returns the meta data for profiles.
     */
    static describeProfileType(): ObjectTypeDefinition;
    /**
     * Returns the customer with the specified customer number. If no customer with this customer number exists, null is returned.
     */
    static getCustomerByCustomerNumber(customerNumber: string): Customer | null;
    /**
     * Returns the customer for the specified login name. If no customer with this login name exists, null is returned.
     */
    static getCustomerByLogin(login: string): Customer | null;
    /**
     * Returns the customer associated with the specified password reset token. A valid token is one that is associated
     * with a customer record and is not expired. Such a token can be generated by
     * dw.customer.Credentials.createResetPasswordToken. If the passed token is valid, the associated customer
     * is returned. Otherwise `null` is returned
     */
    static getCustomerByToken(token: string): Customer | null;
    /**
     * Returns the customer group with the specified ID or null if group
     * does not exists.
     */
    static getCustomerGroup(id: string): CustomerGroup | null;
    /**
     * Returns the customer groups of the current site.
     */
    static getCustomerGroups(): Collection<CustomerGroup>;
    /**
     * Returns the customer list identified by the specified ID.
     * Returns null if no customer list with the specified id exists.
     * 
     * Note: Typically the ID of an automatically created customer
     * list is equal to the ID of the site.
     */
    static getCustomerList(id: string): CustomerList | null;
    /**
     * Given an authentication provider Id and external Id returns the Customer Profile
     * in our system.
     */
    static getExternallyAuthenticatedCustomerProfile(authenticationProviderId: string, externalId: string): Profile | null;
    /**
     * Returns an instance of CustomerPasswordConstraints
     * for the customer list assigned to the current site.
     */
    static getPasswordConstraints(): CustomerPasswordConstraints;
    /**
     * Returns the profile with the specified customer number.
     */
    static getProfile(customerNumber: string): Profile;
    /**
     * Returns the number of registered customers in the system. This number can be used for reporting
     * purposes.
     */
    static getRegisteredCustomerCount(): number;
    /**
     * Returns the customer list of the current site.
     */
    static getSiteCustomerList(): CustomerList;
    /**
     * Checks if the given password matches the password constraints (for example password length) of
     * the current site's assigned customerlist.
     */
    static isAcceptablePassword(password: string): boolean;
    /**
     * Checks if the password for the given customer is expired
     */
    static isPasswordExpired(login: string): boolean;
    /**
     * This method authenticates the current session using the supplied login and password. If a different customer is currently authenticated in the session, then this
     * customer is "logged out" and her/his privacy and form data are deleted. If the authentication with the given credentials fails, then null is returned and no changes
     * to the session are made. The authentication will be sucessful even when the password of the customer is already expired (according to the customer list settings).
     * 
     * If the input value "RememberMe" is set to true, this method stores a cookie on the customer's machine which will be used to identify the customer when the next
     * session is initiated.  The cookie is set to expire in 180 days (i.e. 6 months). Note that a customer who is remembered is not automatically authenticated and will
     * have to explicitly log in to access any personal information.
     * @deprecated use authenticateCustomer(login, password) and loginCustomer(authStatus, rememberMe) instead since they correctly check for expired passwords
     */
    static loginCustomer(login: string, password: string, rememberMe: boolean): Customer | null;
    /**
     * This method logs in the authenticated customer (from a previous authenticateCustomer() call). If a different customer is currently authenticated in the session, then this
     * customer is "logged out" and all privacy-relevant data and all form data are deleted. If the previous authentication was not successful, then null is returned and no changes
     * to the session are made.
     * 
     * If the input value "RememberMe" is set to true, this method stores a cookie on the customer's machine which will be used to identify the customer when the next
     * session is initiated.  The cookie is set to expire in 180 days (i.e. 6 months). Note that a customer who is remembered is not automatically authenticated and will
     * have to explicitly log in to access any personal information.
     */
    static loginCustomer(authStatus: AuthenticationStatus, rememberMe: boolean): Customer | null;
    /**
     * Logs in externally authenticated customer if it has already been created in the system and the profile is not disabled or locked
     */
    static loginExternallyAuthenticatedCustomer(authenticationProviderId: string, externalId: string, rememberMe: boolean): Customer;
    /**
     * Logs out the customer currently logged into the storefront. The boolean value "RememberMe" indicates, if the customer would like to be remembered on the current
     * browser. If a value of true is supplied, the customer authentication state is set to "not logged in" and additionally the following session data is removed: the customer
     * session private data, the form status data, dictionary information of interaction continue nodes, basket reference information, the secure token cookie. If the value is set
     * to false or null, the complete session dictionary is cleaned up. The customer and anonymous cookie are removed and a new session cookie is set.
     */
    static logoutCustomer(rememberMe: boolean): Customer | null;
    /**
     * Executes a user-definable function on a set of customer profiles. This method is intended to be used in batch processes and jobs,
     * since it allows efficient processing of large result sets (which might take a while to process).
     * 
     * First, a search with the given parameters is executed. Then the given function is executed once for each profile of the search result.
     * The profile is handed over as the only parameter to this function.
     * 
     * The search can be configured using a simple query language, which
     * provides most common filter and operator functionality.
     * 
     * For a description of this query language, see the queryProfile method.
     * 
     * The callback function will be supplied with a single argument of type 'Profile'. When the callback function defines
     * additional arguments, they will be undefined when the function is called. When the callback function doesn't define
     * any arguments at all, it will be called anyway (no error will happen, but the function won't get a profile as parameter).
     * 
     * Error during execution of the callback function will be logged, and execution will continue with the next element from the
     * result set.
     * 
     * This method can be used as in this example (which counts the number of men):
     * @example
     * var count=0;
     * function callback(profile: Profile)
     * {
     * count++;
     * dw.system.Logger.debug("customer found: "+profile.customerNo)
     * }
     * CustomerMgr.processProfiles(callback, "gender=1");
     * dw.system.Logger.debug("found "+count+" men in customer list");
     */
    static processProfiles(processFunction: Function, queryString: string, ...args: any[]): void;
    /**
     * 
     * Searches for a single profile instance.
     * 
     * The search can be configured using a simple query language, which
     * provides most common filter and operator functionality.
     * 
     * The identifier for an attribute  to use in a query condition is always the
     * ID of the  attribute as defined in the type definition. For custom defined attributes
     * the prefix custom is required in the search term (e.g. `custom.color = {1}`),
     * while for system attributes no prefix is used (e.g. `name = {4}`).
     * 
     * Supported attribute value types with sample expression values:
     * - String `'String', 'Str*', 'Strin?'`
     * - Integer `1, 3E4`
     * - Number `1.0, 3.99E5`
     * - Date `yyyy-MM-dd e.g. 2007-05-31 (Default TimeZone = UTC)`
     * - DateTime `yyyy-MM-dd'T'hh:mm:ss+Z e.g. 2007-05-31T00:00+Z (Z TimeZone = UTC) or 2007-05-31T00:00:00`
     * - Boolean `true, false`
     * - Email `'search@demandware.com', '*@demandware.com'`
     * - Set of String `'String', 'Str*', 'Strin?'`
     * - Set of Integer `1, 3E4`
     * - Set of Number `1.0, 3.99E5`
     * - Enum of String `'String', 'Str*', 'Strin?'`
     * - Enum of Integer `1, 3E4`
     * 
     * The following types of attributes are not queryable:
     * 
     * - Image
     * - HTML
     * - Text
     * - Quantity
     * - Password
     * 
     * Note, that some system attributes are not queryable by default regardless of the
     * actual value type code.
     * 
     * The following operators are supported in a condition:
     * 
     * - `=` Equals - All types; supports NULL value (`thumbnail = NULL`)
     * - `!=` Not equals - All types; supports NULL value (`thumbnail != NULL`)
     * - `<` Less than  - Integer, Number and Date types only
     * - `>` Greater than - Integer, Number and Date types only
     * - `<=` Less or equals than - Integer, Number and Date types only
     * - `>=` Greater or equals than  - Integer, Number and Date types only
     * - `LIKE` Like - String types and Email only; use if leading or trailing
     * wildcards will be used to support substring search(`custom.country LIKE 'US*'`)
     * - `ILIKE` Caseindependent Like - String types and Email only, use to support
     * case insensitive query (`custom.country ILIKE 'usa'`), does also support wildcards for
     * substring matching
     * 
     * Conditions can be combined using logical expressions 'AND', 'OR' and 'NOT'
     * and nested using parenthesis e.g.
     * `gender = {1} AND (age >= {2} OR (NOT profession LIKE {3}))`.
     * 
     * The query language provides a placeholder syntax to pass objects as
     * additional search parameters. Each passed object is related to a
     * placeholder in the query string. The placeholder must be an Integer that
     * is surrounded by braces. The first Integer value must be '0', the second
     * '1' and so on, e.g.
     * `querySystemObjects("sample", "age = {0} or creationDate >= {1}", 18, date)`
     * 
     * If there is more than one object matching the specified query criteria, the
     * result is not deterministic. In order to retrieve a single object from a sorted result
     * set it is recommended to use the following code:
     * `queryProfiles("", "custom.myAttr asc", null).first()`.
     * The method `first()` returns only the next element and closes the
     * iterator.
     * 
     * This method is deprecated and will be removed in a future release.
     * One of the following methods should be used instead:
     * searchProfile,
     * searchProfiles and
     * searchProfiles to search for customers and
     * processProfiles to search and process customers in jobs.
     * @deprecated use searchProfile instead.
     */
    static queryProfile(queryString: string, ...args: any[]): Profile;
    /**
     * Searches for profile instances.
     * 
     * The search can be configured using a simple query language, which
     * provides most common filter and operator functionality.
     * 
     * For a description of this query language, see the queryProfile method.
     * 
     * This method is deprecated and will be removed in a future release.
     * One of the following methods should be used instead:
     * searchProfile,
     * searchProfiles and
     * searchProfiles to search for customers and
     * processProfiles to search and process customers in jobs.
     * @deprecated use searchProfiles instead.
     */
    static queryProfiles(queryString: string, sortString: string | null, ...args: any[]): SeekableIterator<Profile>;
    /**
     * 
     * Searches for profile instances.
     * 
     * The search can be configured with a map, which key-value pairs are
     * converted into a query expression. The key-value pairs are turned into a
     * sequence of '=' or 'like' conditions, which are combined with AND
     * statements.
     * 
     * Example:
     * 
     * A map with the key/value pairs: 'name'/'tom*', 'age'/66
     * will be converted as follows: `"name like 'tom*' and age = 66"`
     * 
     * The identifier for an attribute  to use in a query condition is always the
     * ID of the  attribute as defined in the type definition. For custom defined attributes
     * the prefix custom is required in the search term (e.g. `custom.color = {1}`),
     * while for system attributes no prefix is used (e.g. `name = {4}`).
     * 
     * Supported attribute value types with sample expression values:
     * - String `'String', 'Str*', 'Strin?'`
     * - Integer `1, 3E4`
     * - Number `1.0, 3.99E5`
     * - Date `yyyy-MM-dd e.g. 2007-05-31 (Default TimeZone = UTC)`
     * - DateTime `yyyy-MM-dd'T'hh:mm:ss+Z e.g. 2007-05-31T00:00+Z (Z TimeZone = UTC) or 2007-05-31T00:00:00`
     * - Boolean `true, false`
     * - Email `'search@demandware.com', '*@demandware.com'`
     * - Set of String `'String', 'Str*', 'Strin?'`
     * - Set of Integer `1, 3E4`
     * - Set of Number `1.0, 3.99E5`
     * - Enum of String `'String', 'Str*', 'Strin?'`
     * - Enum of Integer `1, 3E4`
     * 
     * The following types of attributes are not queryable:
     * 
     * - Image
     * - HTML
     * - Text
     * - Quantity
     * - Password
     * 
     * Note, that some system attributes are not queryable by default regardless of the
     * actual value type code.
     * 
     * The sorting parameter is optional and may contain a comma separated list of
     * attribute names to sort by. Each sort attribute name may be followed by an
     * optional sort direction specifier ('asc' | 'desc'). Default sorting directions is
     * ascending, if no direction was specified.
     * 
     * Example: `age desc, name`
     * 
     * Please note that specifying a localized custom attribute as the sorting attribute is
     * currently not supported.
     * 
     * It is strongly recommended to call `close()` on the returned SeekableIterator
     * if not all of its elements are being retrieved. This will ensure the proper cleanup of system resources.
     * See dw.util.SeekableIterator.close
     * 
     * This method is deprecated and will be removed in a future release.
     * One of the following methods should be used instead:
     * searchProfile,
     * searchProfiles and
     * searchProfiles to search for customers and
     * processProfiles to search and process customers in jobs.
     * @deprecated use searchProfiles instead.
     */
    static queryProfiles(queryAttributes: utilMap<any, any>, sortString: string | null): SeekableIterator<Profile>;
    /**
     * Logs out the supplied customer and deletes the customer record. The customer must be a registered customer and the customer must currently be logged in. The customer must be
     * logged in for security reasons to ensure that only the customer itself can remove itself from the system. While logout the customers session is reset to an anonymous session and, if present, the "Remember me" cookie of the customer is removed.
     * Deleting the customer record includes the customer credentials, profile, address-book with all addresses, customer payment instruments, product lists and memberships in
     * customer groups. Orders placed by this customer won't be deleted. If the supplied customer is not a registered customer or is not logged in, the API throws an exception
     */
    static removeCustomer(customer: Customer): void;
    /**
     * Removes (asynchronously) tracking data for this customer (from external systems or data stores). This will not remove the
     * customer from the database, nor will it prevent tracking to start again in the future for this customer.
     * 
     * The customer is identified by login / email /customerNo / cookie when its a registered customer, and by cookie
     * when its an anonymous customer.
     */
    static removeCustomerTrackingData(customer: Customer): void;
    /**
     * 
     * Searches for a single profile instance.
     * 
     * The search can be configured using a simple query language, which
     * provides most common filter and operator functionality.
     * 
     * The identifier for an attribute to use in a query condition is always the
     * ID of the attribute as defined in the type definition. For custom defined attributes
     * the prefix custom is required in the search term (e.g. `custom.color = {1}`),
     * while for system attributes no prefix is used (e.g. `name = {4}`).
     * 
     * Supported attribute value types with sample expression values:
     * - String `'String', 'Str*', 'Strin?'`
     * - Integer `1, 3E4`
     * - Number `1.0, 3.99E5`
     * - Date `yyyy-MM-dd e.g. 2007-05-31 (Default TimeZone = UTC)`
     * - DateTime `yyyy-MM-dd'T'hh:mm:ss+Z e.g. 2007-05-31T00:00+Z (Z TimeZone = UTC) or 2007-05-31T00:00:00`
     * - Boolean `true, false`
     * - Email `'search@demandware.com', '*@demandware.com'`
     * - Set of String `'String', 'Str*', 'Strin?'`
     * - Set of Integer `1, 3E4`
     * - Set of Number `1.0, 3.99E5`
     * - Enum of String `'String', 'Str*', 'Strin?'`
     * - Enum of Integer `1, 3E4`
     * 
     * The following types of attributes are not queryable:
     * 
     * - Image
     * - HTML
     * - Text
     * - Quantity
     * - Password
     * 
     * Note, that some system attributes are not queryable by default regardless of the
     * actual value type code.
     * 
     * The following operators are supported in a condition:
     * 
     * - `=` Equals - All types; supports NULL value (`thumbnail = NULL`)
     * - `!=` Not equals - All types; supports NULL value (`thumbnail != NULL`)
     * - `<` Less than  - Integer, Number and Date types only
     * - `>` Greater than - Integer, Number and Date types only
     * - `<=` Less or equals than - Integer, Number and Date types only
     * - `>=` Greater or equals than  - Integer, Number and Date types only
     * - `LIKE` Like - String types and Email only; use if leading or trailing
     * wildcards will be used to support substring search(`custom.country LIKE 'US*'`)
     * - `ILIKE` Caseindependent Like - String types and Email only, use to support
     * case insensitive query (`custom.country ILIKE 'usa'`), does also support wildcards for
     * substring matching
     * 
     * Conditions can be combined using logical expressions 'AND', 'OR' and 'NOT'
     * and nested using parenthesis e.g.
     * `gender = {1} AND (age >= {2} OR (NOT profession LIKE {3}))`.
     * 
     * The query language provides a placeholder syntax to pass objects as
     * additional search parameters. Each passed object is related to a
     * placeholder in the query string. The placeholder must be an Integer that
     * is surrounded by braces. The first Integer value must be '0', the second
     * '1' and so on, e.g.
     * `querySystemObjects("sample", "age = {0} or creationDate >= {1}", 18, date)`
     * 
     * If there is more than one object matching the specified query criteria, the
     * result is not deterministic. In order to retrieve a single object from a sorted result
     * set it is recommended to use the following code:
     * `queryProfiles("", "custom.myAttr asc", null).first()`.
     * The method `first()` returns only the next element and closes the
     * iterator.
     * 
     * If the customer search API is configured to use the new Search Service, these differences apply:
     * 
     * - Search may match and return documents with missing (NULL) values in search fields, depending on
     * how the query is structured, potentially leading to broader result sets. For example, a query like
     * `custom.searchField != "some value"` also returns documents where `custom.searchField`
     * is NULL — whereas in relational databases, such documents are excluded.
     * - Newly created customers might not be found immediately via the search service, and changes to existing
     * customers might also not be in effect immediately (there is a slight delay in updating the index)
     * - Wildcards are filtered from the query (*, %, +) and replaced by spaces
     * - LIKE and ILIKE queries are executed as fulltext queries (working on whole words), not as substring searches
     * - LIKE queries are always case insensitive
     * - Using logical operators may change the execution of LIKE/ILIKE clauses to exact string comparison, depending on how they are combined
     * - Using logical operators may result in degraded performance, depending on how they are combined
     */
    static searchProfile(queryString: string, ...args: any[]): Profile;
    /**
     * Searches for profile instances.
     * 
     * The search can be configured using a simple query language, which
     * provides most common filter and operator functionality.
     * 
     * For a description of this query language, see the searchProfile method.
     * 
     * If the customer search API is configured to use the new Search Service, these differences apply:
     * 
     * - Search may match and return documents with missing (NULL) values in search fields, depending on
     * how the query is structured, potentially leading to broader result sets. For example, a query like
     * `custom.searchField != "some value"` also returns documents where `custom.searchField`
     * is NULL — whereas in relational databases, such documents are excluded.
     * - Newly created customers might not be found immediately via the search service, and changes to existing
     * customers might also not be in effect immediately (there is a slight delay in updating the index)
     * - Wildcards are filtered from the query (*, %, +) and replaced by spaces
     * - LIKE and ILIKE queries are executed as fulltext queries (working on whole words), not as substring searches
     * - LIKE queries are always case insensitive
     * - Using logical operators may change the execution of LIKE/ILIKE clauses to exact string comparison, depending on how they are combined
     * - Using logical operators may result in degraded performance, depending on how they are combined
     * - The search returns only the first 1000 hits from the search result
     */
    static searchProfiles(queryString: string, sortString: string | null, ...args: any[]): SeekableIterator<Profile>;
    /**
     * 
     * Searches for profile instances.
     * 
     * The search can be configured with a map, which key-value pairs are
     * converted into a query expression. The key-value pairs are turned into a
     * sequence of '=' or 'like' conditions, which are combined with AND
     * statements.
     * 
     * Example:
     * 
     * A map with the key/value pairs: 'name'/'tom*', 'age'/66
     * will be converted as follows: `"name like 'tom*' and age = 66"`
     * 
     * The identifier for an attribute  to use in a query condition is always the
     * ID of the  attribute as defined in the type definition. For custom defined attributes
     * the prefix custom is required in the search term (e.g. `custom.color = {1}`),
     * while for system attributes no prefix is used (e.g. `name = {4}`).
     * 
     * Supported attribute value types with sample expression values:
     * - String `'String', 'Str*', 'Strin?'`
     * - Integer `1, 3E4`
     * - Number `1.0, 3.99E5`
     * - Date `yyyy-MM-dd e.g. 2007-05-31 (Default TimeZone = UTC)`
     * - DateTime `yyyy-MM-dd'T'hh:mm:ss+Z e.g. 2007-05-31T00:00+Z (Z TimeZone = UTC) or 2007-05-31T00:00:00`
     * - Boolean `true, false`
     * - Email `'search@demandware.com', '*@demandware.com'`
     * - Set of String `'String', 'Str*', 'Strin?'`
     * - Set of Integer `1, 3E4`
     * - Set of Number `1.0, 3.99E5`
     * - Enum of String `'String', 'Str*', 'Strin?'`
     * - Enum of Integer `1, 3E4`
     * 
     * The following types of attributes are not queryable:
     * 
     * - Image
     * - HTML
     * - Text
     * - Quantity
     * - Password
     * 
     * Note, that some system attributes are not queryable by default regardless of the
     * actual value type code.
     * 
     * The sorting parameter is optional and may contain a comma separated list of
     * attribute names to sort by. Each sort attribute name may be followed by an
     * optional sort direction specifier ('asc' | 'desc'). Default sorting directions is
     * ascending, if no direction was specified.
     * 
     * Example: `age desc, name`
     * 
     * Please note that specifying a localized custom attribute as the sorting attribute is
     * currently not supported.
     * 
     * It is strongly recommended to call `close()` on the returned SeekableIterator
     * if not all of its elements are being retrieved. This will ensure the proper cleanup of system resources.
     * 
     * dw.util.SeekableIterator.close
     * 
     * If the customer search API is configured to use the new Search Service, these differences apply:
     * 
     * - Search may match and return documents with missing (NULL) values in search fields, depending on
     * how the query is structured, potentially leading to broader result sets. For example, a query like
     * `custom.searchField != "some value"` also returns documents where `custom.searchField`
     * is NULL — whereas in relational databases, such documents are excluded.
     * - Newly created customers might not be found immediately via the search service, and changes to existing
     * customers might also not be in effect immediately (there is a slight delay in updating the index)
     * - Wildcards are filtered from the query (*, %, +) and replaced by spaces
     * - LIKE and ILIKE queries are executed as fulltext queries (working on whole words), not as substring searches
     * - LIKE queries are always case insensitive
     * - Using logical operators may change the execution of LIKE/ILIKE clauses to exact string comparison, depending on how they are combined
     * - Using logical operators may result in degraded performance, depending on how they are combined
     * - The search returns only the first 1000 hits from the search result
     */
    static searchProfiles(queryAttributes: utilMap<any, any>, sortString: string | null): SeekableIterator<Profile>;
}

export = CustomerMgr;
