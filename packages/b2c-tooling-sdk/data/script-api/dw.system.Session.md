<!-- prettier-ignore-start -->
# Class Session

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.system.Session](dw.system.Session.md)

Represents a session in B2C Commerce. The session has some well-defined
attributes like the current authenticated customer or the click stream, but also
supports storing custom values in the session.

The Digital session handling works in the following way:

- A session is created in Digital on the first user click. This is guaranteed even if  B2C Commerce caches the HTML pages. It is not guaranteed when the pages are cached by a CDN.  
- A session is identified with a unique ID, called the session ID.  
- When a session is created, the application server calls the pipeline OnSession-Start. It can  be used to pre-initialize the session, before the actual request hits the server.  
- Digital uses session stickiness and always routes requests within a single session to the same  application server.  
- Session data is also stored in a persistent location.  
- In case of a fail-over situation, requests are re-routed to another application server, which then  loads the session data from the persistent storage.  
- There are two session timeouts. A soft timeout occurs 30 minutes after the last request has been made.  The soft timeout logs out and clears all privacy data, but it is still possible to use the session ID  to reopen the session. A hard timeout renders a session ID invalid after six hours, even if the session  is still in use. The hard timeout prevents a session from being reopened. For example, if the session ID  is pasted into a URL after the hard timeout, the session doesn't reopen.  


Certain rules apply for what and how much data can be stored in a session:

- All primitive types (boolean, number, string, Number, String, Boolean, Date) are supported.  
- All B2C Commerce value types (Money, Quantity, Decimal, Calendar) are supported.  
- Strings are limited to 2000 characters.  
- No other types can be stored in a session. In particular, persistent objects,  collections, and scripted objects cannot be stored in a session. B2C Commerce  will report unsupported values with a deprecation message in the log files.  An unsupported value will be stored in the session, but the results are undefined.  Since version compatibility mode 19.10 unsupported types will no longer be accepted,  and an exception will be thrown.  
- There is a 10 KB size limit for the overall serialized session.  



## Property Summary

| Property | Description |
| --- | --- |
| [clickStream](#clickstream): [ClickStream](dw.web.ClickStream.md) `(read-only)` | Returns the current click stream if this is an HTTP session, null otherwise. |
| [currency](#currency): [Currency](dw.util.Currency.md) | Get the currency associated with the current session. |
| [custom](#custom): [CustomAttributes](dw.object.CustomAttributes.md) `(read-only)` | Returns the session's custom attributes. |
| [customer](#customer): [Customer](dw.customer.Customer.md) `(read-only)` | Returns the customer associated with this storefront session. |
| [customerAuthenticated](#customerauthenticated): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies whether the customer associated with this session  is authenticated. |
| [customerExternallyAuthenticated](#customerexternallyauthenticated): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies whether the customer associated with this session  is externally authenticated. |
| [forms](#forms): [Forms](dw.web.Forms.md) `(read-only)` | Returns the forms object that provides access to all current forms of a customer in the session. |
| [lastReceivedSourceCodeInfo](#lastreceivedsourcecodeinfo): [SourceCodeInfo](dw.campaign.SourceCodeInfo.md) `(read-only)` | Returns information on the last source code handled by the session. |
| [privacy](#privacy): [CustomAttributes](dw.object.CustomAttributes.md) `(read-only)` | Returns the session's custom privacy attributes. |
| [sessionID](#sessionid): [String](TopLevel.String.md) `(read-only)` | Returns the unique session id. |
| [sourceCodeInfo](#sourcecodeinfo): [SourceCodeInfo](dw.campaign.SourceCodeInfo.md) `(read-only)` | Returns information on the session's active source-code. |
| [trackingAllowed](#trackingallowed): [Boolean](TopLevel.Boolean.md) | Returns whether the tracking allowed flag is set in the session. |
| [userAuthenticated](#userauthenticated): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies whether the agent user associated with this session  is authenticated. |
| [userName](#username): [String](TopLevel.String.md) `(read-only)` | Returns the current agent user name associated with this session. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [generateGuestSessionSignature](dw.system.Session.md#generateguestsessionsignature)() | Generates a new guest session signature. |
| [generateRegisteredSessionSignature](dw.system.Session.md#generateregisteredsessionsignature)() | Generates a new registered session signature. |
| [getClickStream](dw.system.Session.md#getclickstream)() | Returns the current click stream if this is an HTTP session, null otherwise. |
| [getCurrency](dw.system.Session.md#getcurrency)() | Get the currency associated with the current session. |
| [getCustom](dw.system.Session.md#getcustom)() | Returns the session's custom attributes. |
| [getCustomer](dw.system.Session.md#getcustomer)() | Returns the customer associated with this storefront session. |
| [getForms](dw.system.Session.md#getforms)() | Returns the forms object that provides access to all current forms of a customer in the session. |
| [getLastReceivedSourceCodeInfo](dw.system.Session.md#getlastreceivedsourcecodeinfo)() | Returns information on the last source code handled by the session. |
| [getPrivacy](dw.system.Session.md#getprivacy)() | Returns the session's custom privacy attributes. |
| [getSessionID](dw.system.Session.md#getsessionid)() | Returns the unique session id. |
| [getSourceCodeInfo](dw.system.Session.md#getsourcecodeinfo)() | Returns information on the session's active source-code. |
| [getUserName](dw.system.Session.md#getusername)() | Returns the current agent user name associated with this session. |
| [isCustomerAuthenticated](dw.system.Session.md#iscustomerauthenticated)() | Identifies whether the customer associated with this session  is authenticated. |
| [isCustomerExternallyAuthenticated](dw.system.Session.md#iscustomerexternallyauthenticated)() | Identifies whether the customer associated with this session  is externally authenticated. |
| [isTrackingAllowed](dw.system.Session.md#istrackingallowed)() | Returns whether the tracking allowed flag is set in the session. |
| [isUserAuthenticated](dw.system.Session.md#isuserauthenticated)() | Identifies whether the agent user associated with this session  is authenticated. |
| [setCurrency](dw.system.Session.md#setcurrencycurrency)([Currency](dw.util.Currency.md)) | Sets the session currency. |
| [setSourceCode](dw.system.Session.md#setsourcecodestring)([String](TopLevel.String.md)) | Applies the specified source code to the current session and basket. |
| [setTrackingAllowed](dw.system.Session.md#settrackingallowedboolean)([Boolean](TopLevel.Boolean.md)) | Sets the tracking allowed flag for the session. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### clickStream
- clickStream: [ClickStream](dw.web.ClickStream.md) `(read-only)`
  - : Returns the current click stream if this is an HTTP session, null otherwise.


---

### currency
- currency: [Currency](dw.util.Currency.md)
  - : Get the currency associated with the current session. The session
      currency is established at session construction time and is typically
      equal to the site default currency. In the case of a multi-currency site,
      the session currency may be different than the site default currency.



---

### custom
- custom: [CustomAttributes](dw.object.CustomAttributes.md) `(read-only)`
  - : Returns the session's custom attributes. The
      attributes are stored for the lifetime of the session and are not
      cleared when the customer logs out.



---

### customer
- customer: [Customer](dw.customer.Customer.md) `(read-only)`
  - : Returns the customer associated with this storefront session. The method
      always returns `null` if called for a non-storefront session
      (e.g., within a job or within Business Manager). For a storefront
      session, the method always returns a customer. The returned customer
      may be anonymous if the customer could not be identified via the
      customer cookie.



---

### customerAuthenticated
- customerAuthenticated: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies whether the customer associated with this session
      is authenticated. This call is equivalent to customer.isAuthenticated().



---

### customerExternallyAuthenticated
- customerExternallyAuthenticated: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies whether the customer associated with this session
      is externally authenticated.



---

### forms
- forms: [Forms](dw.web.Forms.md) `(read-only)`
  - : Returns the forms object that provides access to all current forms of a customer in the session.


---

### lastReceivedSourceCodeInfo
- lastReceivedSourceCodeInfo: [SourceCodeInfo](dw.campaign.SourceCodeInfo.md) `(read-only)`
  - : Returns information on the last source code handled by the session.
      This may or may not be the session's active source code, e.g., the
      last received source code was inactive and therefore was not
      set as the session's active source code.



---

### privacy
- privacy: [CustomAttributes](dw.object.CustomAttributes.md) `(read-only)`
  - : Returns the session's custom privacy attributes.
      The attributes are stored for the lifetime of the session and are
      automatically cleared when the customer logs out.



---

### sessionID
- sessionID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the unique session id. This can safely be used as an identifier
      against external systems.



---

### sourceCodeInfo
- sourceCodeInfo: [SourceCodeInfo](dw.campaign.SourceCodeInfo.md) `(read-only)`
  - : Returns information on the session's active source-code.


---

### trackingAllowed
- trackingAllowed: [Boolean](TopLevel.Boolean.md)
  - : Returns whether the tracking allowed flag is set in the session.
      The value for newly created sessions defaults to the Site Preference "TrackingAllowed" unless
      a cookie named "dw\_dnt" is found in which case the cookie value takes precedence.



---

### userAuthenticated
- userAuthenticated: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies whether the agent user associated with this session
      is authenticated.



---

### userName
- userName: [String](TopLevel.String.md) `(read-only)`
  - : Returns the current agent user name associated with this session.
      
      
      **Note:** this class allows access to sensitive security-related data.
      Pay special attention to PCI DSS v3 requirements 2, 4, and 12.



---

## Method Details

### generateGuestSessionSignature()
- generateGuestSessionSignature(): [String](TopLevel.String.md)
  - : Generates a new guest session signature.
      
      
      This is intended for guest authentication with the Shopper Login and API Access Service (SLAS).


    **Returns:**
    - A new signed session token.


---

### generateRegisteredSessionSignature()
- generateRegisteredSessionSignature(): [String](TopLevel.String.md)
  - : Generates a new registered session signature.
      
      
      This is intended for use with registered session-bridge call of Shopper Login and API Access Service (SLAS).


    **Returns:**
    - A new signed session token for registered dwsid.


---

### getClickStream()
- getClickStream(): [ClickStream](dw.web.ClickStream.md)
  - : Returns the current click stream if this is an HTTP session, null otherwise.

    **Returns:**
    - the current click stream if this is an HTTP session, null otherwise.


---

### getCurrency()
- getCurrency(): [Currency](dw.util.Currency.md)
  - : Get the currency associated with the current session. The session
      currency is established at session construction time and is typically
      equal to the site default currency. In the case of a multi-currency site,
      the session currency may be different than the site default currency.


    **Returns:**
    - the currency associated with this storefront session, never null.


---

### getCustom()
- getCustom(): [CustomAttributes](dw.object.CustomAttributes.md)
  - : Returns the session's custom attributes. The
      attributes are stored for the lifetime of the session and are not
      cleared when the customer logs out.


    **Returns:**
    - the session's custom attributes.


---

### getCustomer()
- getCustomer(): [Customer](dw.customer.Customer.md)
  - : Returns the customer associated with this storefront session. The method
      always returns `null` if called for a non-storefront session
      (e.g., within a job or within Business Manager). For a storefront
      session, the method always returns a customer. The returned customer
      may be anonymous if the customer could not be identified via the
      customer cookie.


    **Returns:**
    - the customer associated with this storefront session.


---

### getForms()
- getForms(): [Forms](dw.web.Forms.md)
  - : Returns the forms object that provides access to all current forms of a customer in the session.

    **Returns:**
    - the forms.


---

### getLastReceivedSourceCodeInfo()
- getLastReceivedSourceCodeInfo(): [SourceCodeInfo](dw.campaign.SourceCodeInfo.md)
  - : Returns information on the last source code handled by the session.
      This may or may not be the session's active source code, e.g., the
      last received source code was inactive and therefore was not
      set as the session's active source code.


    **Returns:**
    - source code information for the last received source code.


---

### getPrivacy()
- getPrivacy(): [CustomAttributes](dw.object.CustomAttributes.md)
  - : Returns the session's custom privacy attributes.
      The attributes are stored for the lifetime of the session and are
      automatically cleared when the customer logs out.


    **Returns:**
    - the session's custom privacy attributes.


---

### getSessionID()
- getSessionID(): [String](TopLevel.String.md)
  - : Returns the unique session id. This can safely be used as an identifier
      against external systems.


    **Returns:**
    - the unique identifier for the session.


---

### getSourceCodeInfo()
- getSourceCodeInfo(): [SourceCodeInfo](dw.campaign.SourceCodeInfo.md)
  - : Returns information on the session's active source-code.

    **Returns:**
    - the session's source-code information.


---

### getUserName()
- getUserName(): [String](TopLevel.String.md)
  - : Returns the current agent user name associated with this session.
      
      
      **Note:** this class allows access to sensitive security-related data.
      Pay special attention to PCI DSS v3 requirements 2, 4, and 12.


    **Returns:**
    - the current agent user name associated with this session.


---

### isCustomerAuthenticated()
- isCustomerAuthenticated(): [Boolean](TopLevel.Boolean.md)
  - : Identifies whether the customer associated with this session
      is authenticated. This call is equivalent to customer.isAuthenticated().


    **Returns:**
    - true if the customer is authenticated, false otherwise.


---

### isCustomerExternallyAuthenticated()
- isCustomerExternallyAuthenticated(): [Boolean](TopLevel.Boolean.md)
  - : Identifies whether the customer associated with this session
      is externally authenticated.


    **Returns:**
    - true if the customer is authenticated, false otherwise.


---

### isTrackingAllowed()
- isTrackingAllowed(): [Boolean](TopLevel.Boolean.md)
  - : Returns whether the tracking allowed flag is set in the session.
      The value for newly created sessions defaults to the Site Preference "TrackingAllowed" unless
      a cookie named "dw\_dnt" is found in which case the cookie value takes precedence.


    **Returns:**
    - true if the tracking allowed flag is set in the session, false otherwise.


---

### isUserAuthenticated()
- isUserAuthenticated(): [Boolean](TopLevel.Boolean.md)
  - : Identifies whether the agent user associated with this session
      is authenticated.


    **Returns:**
    - true if the agent user is authenticated, false otherwise.


---

### setCurrency(Currency)
- setCurrency(newCurrency: [Currency](dw.util.Currency.md)): void
  - : Sets the session currency.

    **Parameters:**
    - newCurrency - the new currency to use. Must not be null. Method will             throw an exception if a currency not allowed by the current site             is passed.


---

### setSourceCode(String)
- setSourceCode(sourceCode: [String](TopLevel.String.md)): [Status](dw.system.Status.md)
  - : Applies the specified source code to the current session and basket. This API processes the source code exactly as if it
      were supplied on the URL query string, with the additional benefit of returning error information. If no input
      parameter is passed, then the active source code in the session and basket is removed. If a basket exists, and the modification fails,
      then the session is not written to either. This method may open and commit a transaction, if none is currently active.


    **Parameters:**
    - sourceCode - the source code to set as active in the session and basket. If a null parameter is passed, then the active             source code in the session is removed.

    **Returns:**
    - an OK status if the source code was applied, otherwise an ERROR status. In the latter case, the possible
              error codes are: CODE\_INVALID and CODE\_INACTIVE. See documentation for
              [SourceCodeStatusCodes](dw.campaign.SourceCodeStatusCodes.md) for further descriptions.



---

### setTrackingAllowed(Boolean)
- setTrackingAllowed(trackingAllowed: [Boolean](TopLevel.Boolean.md)): void
  - : Sets the tracking allowed flag for the session. If tracking is not allowed, multiple services
      depending on tracking will be restricted or disabled: Predictive Intelligence recommendations,
      Active Data, Analytics of the customer behavior in the storefront.
      Additionally, collected clicks in the session click stream will be cleared.
      Setting this property to either value also results in setting a session-scoped cookie named "dw\_dnt"
      (1=DoNotTrack; 0=Track)


    **Parameters:**
    - trackingAllowed - true if tracking is allowed, false otherwise.


---

<!-- prettier-ignore-end -->
