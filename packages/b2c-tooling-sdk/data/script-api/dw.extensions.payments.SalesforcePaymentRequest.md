<!-- prettier-ignore-start -->
# Class SalesforcePaymentRequest

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.extensions.payments.SalesforcePaymentRequest](dw.extensions.payments.SalesforcePaymentRequest.md)



Salesforce Payments request for a shopper to make payment. See Salesforce Payments documentation for how to
gain access and configure it for use on your sites.




A request is required to render payment methods and/or express checkout buttons using `<ispayment>`
or `<isbuynow>`. You can call methods on the payment request to configure which payment methods
and/or express checkout buttons may be presented, and customize their visual presentation.




When used with `<isbuynow>` you must provide the necessary data to prepare the shopper basket to buy
the product, and the necessary payment request options for the browser payment app.



## Constant Summary

| Constant | Description |
| --- | --- |
| [ELEMENT_AFTERPAY_CLEARPAY_MESSAGE](#element_afterpay_clearpay_message): [String](TopLevel.String.md) = "afterpayClearpayMessage" | Element for the Stripe Afterpay/Clearpay message `"afterpayClearpayMessage"`. |
| [ELEMENT_CARD_CVC](#element_card_cvc): [String](TopLevel.String.md) = "cardCvc" | Element for the Stripe credit card CVC field `"cardCvc"`. |
| [ELEMENT_CARD_EXPIRY](#element_card_expiry): [String](TopLevel.String.md) = "cardExpiry" | Element for the Stripe credit card expiration date field `"cardExpiry"`. |
| [ELEMENT_CARD_NUMBER](#element_card_number): [String](TopLevel.String.md) = "cardNumber" | Element for the Stripe credit card number field `"cardNumber"`. |
| [ELEMENT_EPS_BANK](#element_eps_bank): [String](TopLevel.String.md) = "epsBank" | Element for the Stripe EPS bank selection field `"epsBank"`. |
| [ELEMENT_IBAN](#element_iban): [String](TopLevel.String.md) = "iban" | Element for the Stripe IBAN field `"iban"`. |
| [ELEMENT_IDEAL_BANK](#element_ideal_bank): [String](TopLevel.String.md) = "idealBank" | Element for the Stripe iDEAL bank selection field `"idealBank"`. |
| [ELEMENT_PAYMENT_REQUEST_BUTTON](#element_payment_request_button): [String](TopLevel.String.md) = "paymentRequestButton" | Element for the Stripe payment request button `"paymentRequestButton"`. |
| [ELEMENT_TYPE_AFTERPAY_CLEARPAY](#element_type_afterpay_clearpay): [String](TopLevel.String.md) = "afterpay_clearpay" | Element type name for Afterpay. |
| [ELEMENT_TYPE_AFTERPAY_CLEARPAY_MESSAGE](#element_type_afterpay_clearpay_message): [String](TopLevel.String.md) = "afterpayclearpaymessage" | Element type name for Afterpay/Clearpay message. |
| [ELEMENT_TYPE_APPLEPAY](#element_type_applepay): [String](TopLevel.String.md) = "applepay" | Element type name for Apple Pay payment request buttons. |
| [ELEMENT_TYPE_BANCONTACT](#element_type_bancontact): [String](TopLevel.String.md) = "bancontact" | Element type name for Bancontact. |
| [ELEMENT_TYPE_CARD](#element_type_card): [String](TopLevel.String.md) = "card" | Element type name for credit cards. |
| [ELEMENT_TYPE_EPS](#element_type_eps): [String](TopLevel.String.md) = "eps" | Element type name for EPS. |
| [ELEMENT_TYPE_IDEAL](#element_type_ideal): [String](TopLevel.String.md) = "ideal" | Element type name for iDEAL. |
| [ELEMENT_TYPE_PAYMENTREQUEST](#element_type_paymentrequest): [String](TopLevel.String.md) = "paymentrequest" | Element type name for other payment request buttons besides Apple Pay, like Google Pay. |
| [ELEMENT_TYPE_PAYPAL](#element_type_paypal): [String](TopLevel.String.md) = "paypal" | Element type name for PayPal in multi-step checkout. |
| [ELEMENT_TYPE_PAYPAL_EXPRESS](#element_type_paypal_express): [String](TopLevel.String.md) = "paypalexpress" | Element type name for PayPal in express checkout. |
| [ELEMENT_TYPE_PAYPAL_MESSAGE](#element_type_paypal_message): [String](TopLevel.String.md) = "paypalmessage" | Element type name for the PayPal messages component. |
| [ELEMENT_TYPE_SEPA_DEBIT](#element_type_sepa_debit): [String](TopLevel.String.md) = "sepa_debit" | Element type name for SEPA debit. |
| [ELEMENT_TYPE_VENMO](#element_type_venmo): [String](TopLevel.String.md) = "venmo" | Element type name for Venmo in multi-step checkout. |
| [ELEMENT_TYPE_VENMO_EXPRESS](#element_type_venmo_express): [String](TopLevel.String.md) = "venmoexpress" | Element type name for Venmo in express checkout. |
| [PAYPAL_SHIPPING_PREFERENCE_GET_FROM_FILE](#paypal_shipping_preference_get_from_file): [String](TopLevel.String.md) = "GET_FROM_FILE" | PayPal application context `shipping_preference` value `"GET_FROM_FILE"`, to use the  customer-provided shipping address on the PayPal site. |
| [PAYPAL_SHIPPING_PREFERENCE_NO_SHIPPING](#paypal_shipping_preference_no_shipping): [String](TopLevel.String.md) = "NO_SHIPPING" | PayPal application context `shipping_preference` value `"NO_SHIPPING"`, to redact the  shipping address from the PayPal site. |
| [PAYPAL_SHIPPING_PREFERENCE_SET_PROVIDED_ADDRESS](#paypal_shipping_preference_set_provided_address): [String](TopLevel.String.md) = "SET_PROVIDED_ADDRESS" | PayPal application context `shipping_preference` value `"SET_PROVIDED_ADDRESS"`, to use the  merchant-provided address. |
| [PAYPAL_USER_ACTION_CONTINUE](#paypal_user_action_continue): [String](TopLevel.String.md) = "CONTINUE" | PayPal application context `user_action` value `"CONTINUE"`. |
| [PAYPAL_USER_ACTION_PAY_NOW](#paypal_user_action_pay_now): [String](TopLevel.String.md) = "PAY_NOW" | PayPal application context `user_action` value `"PAY_NOW"`. |

## Property Summary

| Property | Description |
| --- | --- |
| [ID](#id): [String](TopLevel.String.md) `(read-only)` | Returns the identifier of this payment request. |
| [basketData](#basketdata): [Object](TopLevel.Object.md) | Returns a JS object containing the data used to prepare the shopper basket when a Buy Now button is tapped. |
| [billingDetails](#billingdetails): [Object](TopLevel.Object.md) | Returns a JS object containing the billing details to use when a Stripe PaymentMethod is created. |
| [cardCaptureAutomatic](#cardcaptureautomatic): [Boolean](TopLevel.Boolean.md) | Returns `true` if the credit card payment should be automatically captured at the time of the sale, or  `false` if the credit card payment should be captured later. |
| [exclude](#exclude): [Set](dw.util.Set.md) `(read-only)` | <p>  Returns a set containing the element types to be explicitly excluded from mounted components. |
| [include](#include): [Set](dw.util.Set.md) `(read-only)` | <p>  Returns a set containing the specific element types to include in mounted components. |
| [selector](#selector): [String](TopLevel.String.md) `(read-only)` | Returns the DOM element selector where to mount payment methods and/or express checkout buttons. |
| [setupFutureUsage](#setupfutureusage): [Boolean](TopLevel.Boolean.md) | Returns `true` if the payment method should be always saved for future use off session, or  `false` if the payment method should be only saved for future use on session when appropriate. |
| [statementDescriptor](#statementdescriptor): [String](TopLevel.String.md) | Returns the complete description that appears on your customers' statements for payments made by this request, or  `null` if the default statement descriptor for your account will be used. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [SalesforcePaymentRequest](#salesforcepaymentrequeststring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Constructs a payment request using the given identifiers. |

## Method Summary

| Method | Description |
| --- | --- |
| [addExclude](dw.extensions.payments.SalesforcePaymentRequest.md#addexcludestring)([String](TopLevel.String.md)) | <p>  Adds the given element type to explicitly exclude from mounted components. |
| [addInclude](dw.extensions.payments.SalesforcePaymentRequest.md#addincludestring)([String](TopLevel.String.md)) | <p>  Adds the given element type to include in mounted components. |
| static [calculatePaymentRequestOptions](dw.extensions.payments.SalesforcePaymentRequest.md#calculatepaymentrequestoptionsbasket-object)([Basket](dw.order.Basket.md), [Object](TopLevel.Object.md)) | <p>  Returns a JS object containing the payment request options to use when a Pay Now button is tapped, in the  appropriate format for use in client side JavaScript, with data calculated from the given basket. |
| static [format](dw.extensions.payments.SalesforcePaymentRequest.md#formatobject)([Object](TopLevel.Object.md)) | <p>  Returns a JS object containing the payment request options to use when a Buy Now button is tapped, in the  appropriate format for use in client side JavaScript. |
| [getBasketData](dw.extensions.payments.SalesforcePaymentRequest.md#getbasketdata)() | Returns a JS object containing the data used to prepare the shopper basket when a Buy Now button is tapped. |
| [getBillingDetails](dw.extensions.payments.SalesforcePaymentRequest.md#getbillingdetails)() | Returns a JS object containing the billing details to use when a Stripe PaymentMethod is created. |
| [getCardCaptureAutomatic](dw.extensions.payments.SalesforcePaymentRequest.md#getcardcaptureautomatic)() | Returns `true` if the credit card payment should be automatically captured at the time of the sale, or  `false` if the credit card payment should be captured later. |
| [getExclude](dw.extensions.payments.SalesforcePaymentRequest.md#getexclude)() | <p>  Returns a set containing the element types to be explicitly excluded from mounted components. |
| [getID](dw.extensions.payments.SalesforcePaymentRequest.md#getid)() | Returns the identifier of this payment request. |
| [getInclude](dw.extensions.payments.SalesforcePaymentRequest.md#getinclude)() | <p>  Returns a set containing the specific element types to include in mounted components. |
| [getSelector](dw.extensions.payments.SalesforcePaymentRequest.md#getselector)() | Returns the DOM element selector where to mount payment methods and/or express checkout buttons. |
| [getSetupFutureUsage](dw.extensions.payments.SalesforcePaymentRequest.md#getsetupfutureusage)() | Returns `true` if the payment method should be always saved for future use off session, or  `false` if the payment method should be only saved for future use on session when appropriate. |
| [getStatementDescriptor](dw.extensions.payments.SalesforcePaymentRequest.md#getstatementdescriptor)() | Returns the complete description that appears on your customers' statements for payments made by this request, or  `null` if the default statement descriptor for your account will be used. |
| [setBasketData](dw.extensions.payments.SalesforcePaymentRequest.md#setbasketdataobject)([Object](TopLevel.Object.md)) | <p>  Sets the data used to prepare the shopper basket when a Buy Now button is tapped. |
| [setBillingDetails](dw.extensions.payments.SalesforcePaymentRequest.md#setbillingdetailsobject)([Object](TopLevel.Object.md)) | Sets the billing details to use when a Stripe PaymentMethod is created. |
| [setCardCaptureAutomatic](dw.extensions.payments.SalesforcePaymentRequest.md#setcardcaptureautomaticboolean)([Boolean](TopLevel.Boolean.md)) | Sets if the credit card payment should be automatically captured at the time of the sale. |
| [setOptions](dw.extensions.payments.SalesforcePaymentRequest.md#setoptionsobject)([Object](TopLevel.Object.md)) | <p>  Sets the payment request options to use when a Buy Now button is tapped. |
| [setPayPalButtonsOptions](dw.extensions.payments.SalesforcePaymentRequest.md#setpaypalbuttonsoptionsobject)([Object](TopLevel.Object.md)) | Sets the the options to pass into the `paypal.Buttons` call. |
| [setPayPalShippingPreference](dw.extensions.payments.SalesforcePaymentRequest.md#setpaypalshippingpreferencestring)([String](TopLevel.String.md)) | Sets the PayPal order application context `shipping_preference` value. |
| [setPayPalUserAction](dw.extensions.payments.SalesforcePaymentRequest.md#setpaypaluseractionstring)([String](TopLevel.String.md)) | Sets the PayPal order application context `user_action` value. |
| [setReturnController](dw.extensions.payments.SalesforcePaymentRequest.md#setreturncontrollerstring)([String](TopLevel.String.md)) | Sets the controller to which to redirect when the shopper returns from a 3rd party payment website. |
| [setSavePaymentMethodEnabled](dw.extensions.payments.SalesforcePaymentRequest.md#setsavepaymentmethodenabledboolean)([Boolean](TopLevel.Boolean.md)) | Sets if mounted components may provide a control for the shopper to save their payment method for later use. |
| [setSetupFutureUsage](dw.extensions.payments.SalesforcePaymentRequest.md#setsetupfutureusageboolean)([Boolean](TopLevel.Boolean.md)) | Sets if the payment method should be always saved for future use off session. |
| [setStatementDescriptor](dw.extensions.payments.SalesforcePaymentRequest.md#setstatementdescriptorstring)([String](TopLevel.String.md)) | Sets the complete description that appears on your customers' statements for payments made by this request. |
| [setStripeCreateElementOptions](dw.extensions.payments.SalesforcePaymentRequest.md#setstripecreateelementoptionsstring-object)([String](TopLevel.String.md), [Object](TopLevel.Object.md)) | Sets the the options to pass into the Stripe `elements.create` call for the given element type. |
| [setStripeElementsOptions](dw.extensions.payments.SalesforcePaymentRequest.md#setstripeelementsoptionsobject)([Object](TopLevel.Object.md)) | Sets the the options to pass into the `stripe.elements` call. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### ELEMENT_AFTERPAY_CLEARPAY_MESSAGE

- ELEMENT_AFTERPAY_CLEARPAY_MESSAGE: [String](TopLevel.String.md) = "afterpayClearpayMessage"
  - : Element for the Stripe Afterpay/Clearpay message `"afterpayClearpayMessage"`.


---

### ELEMENT_CARD_CVC

- ELEMENT_CARD_CVC: [String](TopLevel.String.md) = "cardCvc"
  - : Element for the Stripe credit card CVC field `"cardCvc"`.


---

### ELEMENT_CARD_EXPIRY

- ELEMENT_CARD_EXPIRY: [String](TopLevel.String.md) = "cardExpiry"
  - : Element for the Stripe credit card expiration date field `"cardExpiry"`.


---

### ELEMENT_CARD_NUMBER

- ELEMENT_CARD_NUMBER: [String](TopLevel.String.md) = "cardNumber"
  - : Element for the Stripe credit card number field `"cardNumber"`.


---

### ELEMENT_EPS_BANK

- ELEMENT_EPS_BANK: [String](TopLevel.String.md) = "epsBank"
  - : Element for the Stripe EPS bank selection field `"epsBank"`.


---

### ELEMENT_IBAN

- ELEMENT_IBAN: [String](TopLevel.String.md) = "iban"
  - : Element for the Stripe IBAN field `"iban"`.


---

### ELEMENT_IDEAL_BANK

- ELEMENT_IDEAL_BANK: [String](TopLevel.String.md) = "idealBank"
  - : Element for the Stripe iDEAL bank selection field `"idealBank"`.


---

### ELEMENT_PAYMENT_REQUEST_BUTTON

- ELEMENT_PAYMENT_REQUEST_BUTTON: [String](TopLevel.String.md) = "paymentRequestButton"
  - : Element for the Stripe payment request button `"paymentRequestButton"`.


---

### ELEMENT_TYPE_AFTERPAY_CLEARPAY

- ELEMENT_TYPE_AFTERPAY_CLEARPAY: [String](TopLevel.String.md) = "afterpay_clearpay"
  - : Element type name for Afterpay.


---

### ELEMENT_TYPE_AFTERPAY_CLEARPAY_MESSAGE

- ELEMENT_TYPE_AFTERPAY_CLEARPAY_MESSAGE: [String](TopLevel.String.md) = "afterpayclearpaymessage"
  - : Element type name for Afterpay/Clearpay message.


---

### ELEMENT_TYPE_APPLEPAY

- ELEMENT_TYPE_APPLEPAY: [String](TopLevel.String.md) = "applepay"
  - : Element type name for Apple Pay payment request buttons.


---

### ELEMENT_TYPE_BANCONTACT

- ELEMENT_TYPE_BANCONTACT: [String](TopLevel.String.md) = "bancontact"
  - : Element type name for Bancontact.


---

### ELEMENT_TYPE_CARD

- ELEMENT_TYPE_CARD: [String](TopLevel.String.md) = "card"
  - : Element type name for credit cards.


---

### ELEMENT_TYPE_EPS

- ELEMENT_TYPE_EPS: [String](TopLevel.String.md) = "eps"
  - : Element type name for EPS.


---

### ELEMENT_TYPE_IDEAL

- ELEMENT_TYPE_IDEAL: [String](TopLevel.String.md) = "ideal"
  - : Element type name for iDEAL.


---

### ELEMENT_TYPE_PAYMENTREQUEST

- ELEMENT_TYPE_PAYMENTREQUEST: [String](TopLevel.String.md) = "paymentrequest"
  - : Element type name for other payment request buttons besides Apple Pay, like Google Pay.


---

### ELEMENT_TYPE_PAYPAL

- ELEMENT_TYPE_PAYPAL: [String](TopLevel.String.md) = "paypal"
  - : Element type name for PayPal in multi-step checkout.


---

### ELEMENT_TYPE_PAYPAL_EXPRESS

- ELEMENT_TYPE_PAYPAL_EXPRESS: [String](TopLevel.String.md) = "paypalexpress"
  - : Element type name for PayPal in express checkout.


---

### ELEMENT_TYPE_PAYPAL_MESSAGE

- ELEMENT_TYPE_PAYPAL_MESSAGE: [String](TopLevel.String.md) = "paypalmessage"
  - : Element type name for the PayPal messages component.


---

### ELEMENT_TYPE_SEPA_DEBIT

- ELEMENT_TYPE_SEPA_DEBIT: [String](TopLevel.String.md) = "sepa_debit"
  - : Element type name for SEPA debit.


---

### ELEMENT_TYPE_VENMO

- ELEMENT_TYPE_VENMO: [String](TopLevel.String.md) = "venmo"
  - : Element type name for Venmo in multi-step checkout.


---

### ELEMENT_TYPE_VENMO_EXPRESS

- ELEMENT_TYPE_VENMO_EXPRESS: [String](TopLevel.String.md) = "venmoexpress"
  - : Element type name for Venmo in express checkout.


---

### PAYPAL_SHIPPING_PREFERENCE_GET_FROM_FILE

- PAYPAL_SHIPPING_PREFERENCE_GET_FROM_FILE: [String](TopLevel.String.md) = "GET_FROM_FILE"
  - : PayPal application context `shipping_preference` value `"GET_FROM_FILE"`, to use the
      customer-provided shipping address on the PayPal site.



---

### PAYPAL_SHIPPING_PREFERENCE_NO_SHIPPING

- PAYPAL_SHIPPING_PREFERENCE_NO_SHIPPING: [String](TopLevel.String.md) = "NO_SHIPPING"
  - : PayPal application context `shipping_preference` value `"NO_SHIPPING"`, to redact the
      shipping address from the PayPal site. Recommended for digital goods.



---

### PAYPAL_SHIPPING_PREFERENCE_SET_PROVIDED_ADDRESS

- PAYPAL_SHIPPING_PREFERENCE_SET_PROVIDED_ADDRESS: [String](TopLevel.String.md) = "SET_PROVIDED_ADDRESS"
  - : PayPal application context `shipping_preference` value `"SET_PROVIDED_ADDRESS"`, to use the
      merchant-provided address. The customer cannot change this address on the PayPal site.



---

### PAYPAL_USER_ACTION_CONTINUE

- PAYPAL_USER_ACTION_CONTINUE: [String](TopLevel.String.md) = "CONTINUE"
  - : PayPal application context `user_action` value `"CONTINUE"`. Use this option when the final
      amount is not known when the checkout flow is initiated and you want to redirect the customer to the merchant
      page without processing the payment.



---

### PAYPAL_USER_ACTION_PAY_NOW

- PAYPAL_USER_ACTION_PAY_NOW: [String](TopLevel.String.md) = "PAY_NOW"
  - : PayPal application context `user_action` value `"PAY_NOW"`. Use this option when the final
      amount is known when the checkout is initiated and you want to process the payment immediately when the customer
      clicks Pay Now.



---

## Property Details

### ID
- ID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the identifier of this payment request.


---

### basketData
- basketData: [Object](TopLevel.Object.md)
  - : Returns a JS object containing the data used to prepare the shopper basket when a Buy Now button is tapped.

    **See Also:**
    - [setBasketData(Object)](dw.extensions.payments.SalesforcePaymentRequest.md#setbasketdataobject)


---

### billingDetails
- billingDetails: [Object](TopLevel.Object.md)
  - : Returns a JS object containing the billing details to use when a Stripe PaymentMethod is created.

    **See Also:**
    - [setBillingDetails(Object)](dw.extensions.payments.SalesforcePaymentRequest.md#setbillingdetailsobject)


---

### cardCaptureAutomatic
- cardCaptureAutomatic: [Boolean](TopLevel.Boolean.md)
  - : Returns `true` if the credit card payment should be automatically captured at the time of the sale, or
      `false` if the credit card payment should be captured later.



---

### exclude
- exclude: [Set](dw.util.Set.md) `(read-only)`
  - : 
      
      Returns a set containing the element types to be explicitly excluded from mounted components. See the element
      type constants in this class for the full list of supported element types.
      
      
      
      
      Note: if an element type is both explicitly included and excluded, it will not be presented.


    **See Also:**
    - [addExclude(String)](dw.extensions.payments.SalesforcePaymentRequest.md#addexcludestring)


---

### include
- include: [Set](dw.util.Set.md) `(read-only)`
  - : 
      
      Returns a set containing the specific element types to include in mounted components. If the set is
      empty then all applicable and enabled element types will be included by default. See the element type constants
      in this class for the full list of supported element types.
      
      
      
      
      Note: if an element type is both explicitly included and excluded, it will not be presented.


    **See Also:**
    - [addInclude(String)](dw.extensions.payments.SalesforcePaymentRequest.md#addincludestring)


---

### selector
- selector: [String](TopLevel.String.md) `(read-only)`
  - : Returns the DOM element selector where to mount payment methods and/or express checkout buttons.


---

### setupFutureUsage
- setupFutureUsage: [Boolean](TopLevel.Boolean.md)
  - : Returns `true` if the payment method should be always saved for future use off session, or
      `false` if the payment method should be only saved for future use on session when appropriate.



---

### statementDescriptor
- statementDescriptor: [String](TopLevel.String.md)
  - : Returns the complete description that appears on your customers' statements for payments made by this request, or
      `null` if the default statement descriptor for your account will be used.



---

## Constructor Details

### SalesforcePaymentRequest(String, String)
- SalesforcePaymentRequest(id: [String](TopLevel.String.md), selector: [String](TopLevel.String.md))
  - : Constructs a payment request using the given identifiers.

    **Parameters:**
    - id - identifier for payment request
    - selector - DOM element selector where to mount payment methods and/or express checkout buttons

    **Throws:**
    - Exception - if id or selector is null


---

## Method Details

### addExclude(String)
- addExclude(elementType: [String](TopLevel.String.md)): void
  - : 
      
      Adds the given element type to explicitly exclude from mounted components. It is not necessary to explicitly
      exclude element types that are not enabled for the site, or are not applicable for the current shopper and/or
      their basket. See the element type constants in this class for the full list of supported element types.
      
      
      
      
      Note: if an element type is both explicitly included and excluded, it will not be presented.


    **Parameters:**
    - elementType - element type

    **See Also:**
    - [getExclude()](dw.extensions.payments.SalesforcePaymentRequest.md#getexclude)


---

### addInclude(String)
- addInclude(elementType: [String](TopLevel.String.md)): void
  - : 
      
      Adds the given element type to include in mounted components. Call this method to include only a specific list of
      element types to be presented when applicable and enabled for the site. See the element type constants in this
      class for the full list of supported element types.
      
      
      
      
      Note: if an element type is both explicitly included and excluded, it will not be presented.


    **Parameters:**
    - elementType - element type

    **See Also:**
    - [getInclude()](dw.extensions.payments.SalesforcePaymentRequest.md#getinclude)


---

### calculatePaymentRequestOptions(Basket, Object)
- static calculatePaymentRequestOptions(basket: [Basket](dw.order.Basket.md), options: [Object](TopLevel.Object.md)): [Object](TopLevel.Object.md)
  - : 
      
      Returns a JS object containing the payment request options to use when a Pay Now button is tapped, in the
      appropriate format for use in client side JavaScript, with data calculated from the given basket. This method is
      provided as a convenience to calculate updated payment request options when the shopper basket has changed. Data
      in the given `options` object like `total`, `displayItems`, and
      `shippingOptions` will be replaced in the returned object by values recalculated from the given
      `basket` and applicable shipping methods.
      
      
      
      
      The following example shows the resulting output for a basket and sample options.
      
      
      
      ```
      SalesforcePaymentRequest.calculatePaymentRequestOptions(basket, {
         requestPayerName: true,
         requestPayerEmail: true,
         requestPayerPhone: false,
         requestShipping: true
      });
      ```
      
      
      
      returns
      
      
      
      ```
      {
         currency: 'gbp',
         total: {
             label: 'Total',
             amount: '2644'
         },
         displayItems: [{
             label: 'Subtotal',
             amount: '1919'
         }, {
             label: 'Tax',
             amount: '126'
         }, {
             label: 'Ground',
             amount: '599'
         }],
         requestPayerName: true,
         requestPayerEmail: true,
         requestPayerPhone: false,
         requestShipping: true,
         shippingOptions: [{
             id: 'GBP001',
             label: 'Ground',
             detail: 'Order received within 7-10 business days',
             amount: '599'
         },{
             id: 'GBP002',
             label: 'Express',
             detail: 'Order received within 2-4 business days',
             amount: '999'
         }]
      }
      ```


    **Parameters:**
    - options - JS object containing payment request options in B2C Commerce API standard format

    **Returns:**
    - JS object containing equivalent payment request options in Stripe JS API format


---

### format(Object)
- static format(options: [Object](TopLevel.Object.md)): [Object](TopLevel.Object.md)
  - : 
      
      Returns a JS object containing the payment request options to use when a Buy Now button is tapped, in the
      appropriate format for use in client side JavaScript. This method is provided as a convenience to adjust values
      in B2C Commerce API standard formats to their equivalents as expected by Stripe JS APIs. The following example
      shows options set in B2C Commerce API format, and the resulting output.
      
      
      
      ```
      SalesforcePaymentRequest.format({
         currency: 'GBP',
         total: {
             label: 'Total',
             amount: '26.44'
         },
         displayItems: [{
             label: 'Subtotal',
             amount: '19.19'
         }, {
             label: 'Tax',
             amount: '1.26'
         }, {
             label: 'Ground',
             amount: '5.99'
         }],
         requestPayerPhone: false,
         shippingOptions: [{
             id: 'GBP001',
             label: 'Ground',
             detail: 'Order received within 7-10 business days',
             amount: '5.99'
         }]
      });
      ```
      
      
      
      returns
      
      
      
      ```
      {
         currency: 'gbp',
         total: {
             label: 'Total',
             amount: '2644'
         },
         displayItems: [{
             label: 'Subtotal',
             amount: '1919'
         }, {
             label: 'Tax',
             amount: '126'
         }, {
             label: 'Ground',
             amount: '599'
         }],
         requestPayerPhone: false,
         shippingOptions: [{
             id: 'GBP001',
             label: 'Ground',
             detail: 'Order received within 7-10 business days',
             amount: '599'
         }]
      }
      ```


    **Parameters:**
    - options - JS object containing payment request options in B2C Commerce API standard format

    **Returns:**
    - JS object containing equivalent payment request options in Stripe JS API format


---

### getBasketData()
- getBasketData(): [Object](TopLevel.Object.md)
  - : Returns a JS object containing the data used to prepare the shopper basket when a Buy Now button is tapped.

    **Returns:**
    - JS object containing the basket data

    **See Also:**
    - [setBasketData(Object)](dw.extensions.payments.SalesforcePaymentRequest.md#setbasketdataobject)


---

### getBillingDetails()
- getBillingDetails(): [Object](TopLevel.Object.md)
  - : Returns a JS object containing the billing details to use when a Stripe PaymentMethod is created.

    **Returns:**
    - JS object containing the billing details

    **See Also:**
    - [setBillingDetails(Object)](dw.extensions.payments.SalesforcePaymentRequest.md#setbillingdetailsobject)


---

### getCardCaptureAutomatic()
- getCardCaptureAutomatic(): [Boolean](TopLevel.Boolean.md)
  - : Returns `true` if the credit card payment should be automatically captured at the time of the sale, or
      `false` if the credit card payment should be captured later.


    **Returns:**
    - `true` if the credit card payment should be automatically captured at the time of the sale,
      `false` if the credit card payment should be captured later.



---

### getExclude()
- getExclude(): [Set](dw.util.Set.md)
  - : 
      
      Returns a set containing the element types to be explicitly excluded from mounted components. See the element
      type constants in this class for the full list of supported element types.
      
      
      
      
      Note: if an element type is both explicitly included and excluded, it will not be presented.


    **Returns:**
    - set of element types

    **See Also:**
    - [addExclude(String)](dw.extensions.payments.SalesforcePaymentRequest.md#addexcludestring)


---

### getID()
- getID(): [String](TopLevel.String.md)
  - : Returns the identifier of this payment request.

    **Returns:**
    - payment request identifier


---

### getInclude()
- getInclude(): [Set](dw.util.Set.md)
  - : 
      
      Returns a set containing the specific element types to include in mounted components. If the set is
      empty then all applicable and enabled element types will be included by default. See the element type constants
      in this class for the full list of supported element types.
      
      
      
      
      Note: if an element type is both explicitly included and excluded, it will not be presented.


    **Returns:**
    - set of element types

    **See Also:**
    - [addInclude(String)](dw.extensions.payments.SalesforcePaymentRequest.md#addincludestring)


---

### getSelector()
- getSelector(): [String](TopLevel.String.md)
  - : Returns the DOM element selector where to mount payment methods and/or express checkout buttons.

    **Returns:**
    - DOM element selector


---

### getSetupFutureUsage()
- getSetupFutureUsage(): [Boolean](TopLevel.Boolean.md)
  - : Returns `true` if the payment method should be always saved for future use off session, or
      `false` if the payment method should be only saved for future use on session when appropriate.


    **Returns:**
    - `true` if the payment method should be always saved for future use off session,
      `false` if the payment method should be only saved for future use on session when appropriate.



---

### getStatementDescriptor()
- getStatementDescriptor(): [String](TopLevel.String.md)
  - : Returns the complete description that appears on your customers' statements for payments made by this request, or
      `null` if the default statement descriptor for your account will be used.


    **Returns:**
    - statement descriptor for payments made by this request, or `null` if the account default will
              be used



---

### setBasketData(Object)
- setBasketData(basketData: [Object](TopLevel.Object.md)): void
  - : 
      
      Sets the data used to prepare the shopper basket when a Buy Now button is tapped. For convenience this method
      accepts a JS object to set all of the following properties at once:
      
      
      
      - `sku`- SKU of the product to add exclusively to the basket (required)
      - `quantity`- integer quantity of the product, default is 1
      - `shippingMethod`- ID of the shipping method to set on the shipment, default is the site default  shipping method for the basket currency
      - `options`- JS array containing one JS object per selected product option, default is no selected options  
        - `id`- product option ID
        - `valueId`- product option value ID
      
      
      
      The following example shows how to set all of the supported basket data.
      
      
      
        ```
        request.setBasketData({
           sku: 'tv-pdp-6010fdM',
           quantity: 1,
           shippingMethod: '001',
           options: [{
               id: 'tvWarranty',
               valueId: '000'
           }]
        });
        ```


    **Parameters:**
    - basketData - JS object containing the basket data

    **See Also:**
    - [getBasketData()](dw.extensions.payments.SalesforcePaymentRequest.md#getbasketdata)


---

### setBillingDetails(Object)
- setBillingDetails(billingDetails: [Object](TopLevel.Object.md)): void
  - : Sets the billing details to use when a Stripe PaymentMethod is created. For convenience this method accepts a
      JS object to set all details at once. The following example shows how to set details including address.
      
      
      
      ```
      request.setBillingDetails({
         address: {
             city: 'Wien',
             country: 'AT',
             line1: 'Opernring 2',
             postal_code: '1010'
         },
         email: 'jhummel@salesforce.com',
         name: 'Johann Hummel'
      });
      ```
      
      
      
      For more information on the available billing details see the Stripe create PaymentMethod API
      documentation.


    **Parameters:**
    - billingDetails - JS object containing the billing details


---

### setCardCaptureAutomatic(Boolean)
- setCardCaptureAutomatic(cardCaptureAutomatic: [Boolean](TopLevel.Boolean.md)): void
  - : Sets if the credit card payment should be automatically captured at the time of the sale.

    **Parameters:**
    - cardCaptureAutomatic - `true` if the credit card payment should be automatically captured at the time of the sale,             or `false` if the credit card payment should be captured later.


---

### setOptions(Object)
- setOptions(options: [Object](TopLevel.Object.md)): void
  - : 
      
      Sets the payment request options to use when a Buy Now button is tapped. For convenience this method accepts a
      JS object to set all options at once. The following example shows how to set options including currency,
      labels, and amounts, in B2C Commerce API format.
      
      
      
      ```
      request.setOptions({
         currency: 'GBP',
         total: {
             label: 'Total',
             amount: '26.44'
         },
         displayItems: [{
             label: 'Subtotal',
             amount: '19.19'
         }, {
             label: 'Tax',
             amount: '1.26'
         }, {
             label: 'Ground',
             amount: '5.99'
         }],
         requestPayerPhone: false,
         shippingOptions: [{
             id: 'GBP001',
             label: 'Ground',
             detail: 'Order received within 7-10 business days',
             amount: '5.99'
         }]
      });
      ```
      
      
      
      The `total` option must match the total that will result from preparing the shopper basket using the
      data provided to [setBasketData(Object)](dw.extensions.payments.SalesforcePaymentRequest.md#setbasketdataobject) in this request. The `id` of each JS object in the
      `shippingOptions` array must equal the ID of the corresponding site shipping method that the shopper
      may select in the browser payment app.
      
      
      
      
      For more information on the available payment request options see the Stripe Payment Request object API
      documentation.
      
      
      
      
      Note: The Stripe Payment Request `country` option will be set automatically to the country of the
      Salesforce Payments account associated with the Commerce Cloud instance and is not included here.


    **Parameters:**
    - options - JS object containing the payment request options


---

### setPayPalButtonsOptions(Object)
- setPayPalButtonsOptions(options: [Object](TopLevel.Object.md)): void
  - : Sets the the options to pass into the `paypal.Buttons` call. For more information see the PayPal
      Buttons API documentation.


    **Parameters:**
    - options - JS object containing the options


---

### setPayPalShippingPreference(String)
- setPayPalShippingPreference(shippingPreference: [String](TopLevel.String.md)): void
  - : Sets the PayPal order application context `shipping_preference` value. For more information see the
      PayPal Orders API documentation.


    **Parameters:**
    - shippingPreference - constant indicating the shipping preference

    **See Also:**
    - [PAYPAL_SHIPPING_PREFERENCE_GET_FROM_FILE](dw.extensions.payments.SalesforcePaymentRequest.md#paypal_shipping_preference_get_from_file)
    - [PAYPAL_SHIPPING_PREFERENCE_NO_SHIPPING](dw.extensions.payments.SalesforcePaymentRequest.md#paypal_shipping_preference_no_shipping)
    - [PAYPAL_SHIPPING_PREFERENCE_SET_PROVIDED_ADDRESS](dw.extensions.payments.SalesforcePaymentRequest.md#paypal_shipping_preference_set_provided_address)


---

### setPayPalUserAction(String)
- setPayPalUserAction(userAction: [String](TopLevel.String.md)): void
  - : Sets the PayPal order application context `user_action` value. For more information see the PayPal
      Orders API documentation.


    **Parameters:**
    - userAction - constant indicating the user action

    **See Also:**
    - [PAYPAL_USER_ACTION_CONTINUE](dw.extensions.payments.SalesforcePaymentRequest.md#paypal_user_action_continue)
    - [PAYPAL_USER_ACTION_PAY_NOW](dw.extensions.payments.SalesforcePaymentRequest.md#paypal_user_action_pay_now)


---

### setReturnController(String)
- setReturnController(returnController: [String](TopLevel.String.md)): void
  - : Sets the controller to which to redirect when the shopper returns from a 3rd party payment website. Default is
      the controller for the current page.


    **Parameters:**
    - returnController - return controller, such as `"Cart-Show"`


---

### setSavePaymentMethodEnabled(Boolean)
- setSavePaymentMethodEnabled(savePaymentMethodEnabled: [Boolean](TopLevel.Boolean.md)): void
  - : Sets if mounted components may provide a control for the shopper to save their payment method for later use. When
      set to `false` no control will be provided. When set to `true` a control may be provided,
      if applicable for the shopper and presented payment method, but is not guaranteed.


    **Parameters:**
    - savePaymentMethodEnabled - if mounted components may provide a control for the shopper to save their payment             method


---

### setSetupFutureUsage(Boolean)
- setSetupFutureUsage(setupFutureUsage: [Boolean](TopLevel.Boolean.md)): void
  - : Sets if the payment method should be always saved for future use off session.

    **Parameters:**
    - setupFutureUsage - `true` if the payment method should be always saved for future use off             session, or `false` if the payment method should be only saved for future use on session             when appropriate.


---

### setStatementDescriptor(String)
- setStatementDescriptor(statementDescriptor: [String](TopLevel.String.md)): void
  - : Sets the complete description that appears on your customers' statements for payments made by this request. Set
      this to `null` to use the default statement descriptor for your account.


    **Parameters:**
    - statementDescriptor - statement descriptor for payments made by this request, or `null` to use             the account default


---

### setStripeCreateElementOptions(String, Object)
- setStripeCreateElementOptions(element: [String](TopLevel.String.md), options: [Object](TopLevel.Object.md)): void
  - : Sets the the options to pass into the Stripe `elements.create` call for the given element type. For
      more information see the Stripe Elements API documentation.


    **Parameters:**
    - element - name of the Stripe element whose creation to configure
    - options - JS object containing the options

    **See Also:**
    - [ELEMENT_AFTERPAY_CLEARPAY_MESSAGE](dw.extensions.payments.SalesforcePaymentRequest.md#element_afterpay_clearpay_message)
    - [ELEMENT_CARD_CVC](dw.extensions.payments.SalesforcePaymentRequest.md#element_card_cvc)
    - [ELEMENT_CARD_EXPIRY](dw.extensions.payments.SalesforcePaymentRequest.md#element_card_expiry)
    - [ELEMENT_CARD_NUMBER](dw.extensions.payments.SalesforcePaymentRequest.md#element_card_number)
    - [ELEMENT_EPS_BANK](dw.extensions.payments.SalesforcePaymentRequest.md#element_eps_bank)
    - [ELEMENT_IBAN](dw.extensions.payments.SalesforcePaymentRequest.md#element_iban)
    - [ELEMENT_IDEAL_BANK](dw.extensions.payments.SalesforcePaymentRequest.md#element_ideal_bank)
    - [ELEMENT_PAYMENT_REQUEST_BUTTON](dw.extensions.payments.SalesforcePaymentRequest.md#element_payment_request_button)


---

### setStripeElementsOptions(Object)
- setStripeElementsOptions(options: [Object](TopLevel.Object.md)): void
  - : Sets the the options to pass into the `stripe.elements` call. For more information see the Stripe
      Elements API documentation.


    **Parameters:**
    - options - JS object containing the options


---

<!-- prettier-ignore-end -->
