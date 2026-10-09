<!-- prettier-ignore-start -->
# Class PaymentTransaction

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)
      - [dw.order.PaymentTransaction](dw.order.PaymentTransaction.md)

The PaymentTransaction class represents a payment transaction.


## Constant Summary

| Constant | Description |
| --- | --- |
| [POST_AUTH_FRAUD_DECISION_GUARANTEED](#post_auth_fraud_decision_guaranteed): [String](TopLevel.String.md) = "GUARANTEED" | Constant indicating a fraud provider post-authorization decision to guarantee a payment transaction. |
| [POST_AUTH_FRAUD_DECISION_NOT_GUARANTEED](#post_auth_fraud_decision_not_guaranteed): [String](TopLevel.String.md) = "NOT_GUARANTEED" | Constant indicating a fraud provider post-authorization decision to not guarantee a payment transaction. |
| [POST_AUTH_FRAUD_DECISION_NOT_REVIEWED](#post_auth_fraud_decision_not_reviewed): [String](TopLevel.String.md) = "NOT_REVIEWED" | Constant indicating a fraud provider did not review a payment transaction post-authorization. |
| [POST_AUTH_FRAUD_DECISION_PENDING](#post_auth_fraud_decision_pending): [String](TopLevel.String.md) = "PENDING" | Constant representing a pending asynchronous post-authorization fraud decision. |
| [PRE_AUTH_FRAUD_DECISION_APPROVED](#pre_auth_fraud_decision_approved): [String](TopLevel.String.md) = "APPROVED" | Constant indicating a fraud provider pre-authorization decision to approve a payment transaction. |
| [PRE_AUTH_FRAUD_DECISION_CHALLENGE](#pre_auth_fraud_decision_challenge): [String](TopLevel.String.md) = "CHALLENGE" | Constant indicating a fraud provider pre-authorization decision to challenge a payment transaction. |
| [PRE_AUTH_FRAUD_DECISION_DECLINED](#pre_auth_fraud_decision_declined): [String](TopLevel.String.md) = "DECLINED" | Constant representing a fraud provider pre-authorization decision to decline a payment transaction. |
| [PRE_AUTH_FRAUD_DECISION_NOT_REVIEWED](#pre_auth_fraud_decision_not_reviewed): [String](TopLevel.String.md) = "NOT_REVIEWED" | Constant indicating a fraud provider did not review a payment transaction pre-authorization. |
| [STATUS_AUTHORIZATIONVOIDED](#status_authorizationvoided): [Number](TopLevel.Number.md) = 4 | Status constant: authorization voided or canceled. |
| [STATUS_AUTHORIZED](#status_authorized): [Number](TopLevel.Number.md) = 1 | Status constant: authorization successful. |
| [STATUS_CAPTURED](#status_captured): [Number](TopLevel.Number.md) = 3 | Status constant: wholly captured. |
| [STATUS_CAPTUREVOIDED](#status_capturevoided): [Number](TopLevel.Number.md) = 5 | Status constant: capture voided. |
| [STATUS_CREATED](#status_created): [Number](TopLevel.Number.md) = 0 | Status constant: newly created, not yet processed. |
| [STATUS_MARKED](#status_marked): [Number](TopLevel.Number.md) = 6 | Status constant: marked for batch settlement. |
| [STATUS_PARTCAPTURED](#status_partcaptured): [Number](TopLevel.Number.md) = 2 | Status constant: partly but not wholly captured. |
| [STATUS_PENDING](#status_pending): [Number](TopLevel.Number.md) = 8 | Status constant: pending payment processing. |
| [STATUS_SETTLED](#status_settled): [Number](TopLevel.Number.md) = 7 | Status constant: batch settlement confirmed. |
| [TYPE_AUTH](#type_auth): [String](TopLevel.String.md) = "AUTH" | Constant representing the authorization type of payment transaction. |
| [TYPE_AUTH_REVERSAL](#type_auth_reversal): [String](TopLevel.String.md) = "AUTH_REVERSAL" | Constant representing the authorization reversal type of payment transaction. |
| [TYPE_CAPTURE](#type_capture): [String](TopLevel.String.md) = "CAPTURE" | Constant representing the capture type of payment transaction. |
| [TYPE_CREDIT](#type_credit): [String](TopLevel.String.md) = "CREDIT" | Constant representing the credit type of payment transaction. |

## Property Summary

| Property | Description |
| --- | --- |
| [accountID](#accountid): [String](TopLevel.String.md) | Returns the payment service-specific account id. |
| [accountType](#accounttype): [String](TopLevel.String.md) | Returns the payment service-specific account type. |
| [amount](#amount): [Money](dw.value.Money.md) | Returns the amount of the transaction. |
| [paymentInstrument](#paymentinstrument): [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md) `(read-only)` | Returns the payment instrument related to this payment transaction. |
| [paymentProcessor](#paymentprocessor): [PaymentProcessor](dw.order.PaymentProcessor.md) | Returns the payment processor related to this payment transaction. |
| [postAuthFraudDecision](#postauthfrauddecision): [String](TopLevel.String.md) | Returns the post-authorization fraud decision, or `null` if not set. |
| [preAuthFraudDecision](#preauthfrauddecision): [String](TopLevel.String.md) | Returns the pre-authorization fraud decision, or `null` if not set. |
| [status](#status): [Number](TopLevel.Number.md) | Returns the status of this payment transaction. |
| [transactionDetails](#transactiondetails): [SalesforceTransactionDetails](dw.extensions.payments.SalesforceTransactionDetails.md) | Returns the transaction details for this payment transaction, or `null` if none have been set. |
| [transactionID](#transactionid): [String](TopLevel.String.md) | Returns the payment service-specific transaction id. |
| [type](#type): [EnumValue](dw.value.EnumValue.md) | Returns the value of the transaction type where the  value is one of TYPE\_AUTH, TYPE\_AUTH\_REVERSAL, TYPE\_CAPTURE  or TYPE\_CREDIT. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getAccountID](dw.order.PaymentTransaction.md#getaccountid)() | Returns the payment service-specific account id. |
| [getAccountType](dw.order.PaymentTransaction.md#getaccounttype)() | Returns the payment service-specific account type. |
| [getAmount](dw.order.PaymentTransaction.md#getamount)() | Returns the amount of the transaction. |
| [getPaymentInstrument](dw.order.PaymentTransaction.md#getpaymentinstrument)() | Returns the payment instrument related to this payment transaction. |
| [getPaymentProcessor](dw.order.PaymentTransaction.md#getpaymentprocessor)() | Returns the payment processor related to this payment transaction. |
| [getPostAuthFraudDecision](dw.order.PaymentTransaction.md#getpostauthfrauddecision)() | Returns the post-authorization fraud decision, or `null` if not set. |
| [getPreAuthFraudDecision](dw.order.PaymentTransaction.md#getpreauthfrauddecision)() | Returns the pre-authorization fraud decision, or `null` if not set. |
| [getStatus](dw.order.PaymentTransaction.md#getstatus)() | Returns the status of this payment transaction. |
| [getTransactionDetails](dw.order.PaymentTransaction.md#gettransactiondetails)() | Returns the transaction details for this payment transaction, or `null` if none have been set. |
| [getTransactionID](dw.order.PaymentTransaction.md#gettransactionid)() | Returns the payment service-specific transaction id. |
| [getType](dw.order.PaymentTransaction.md#gettype)() | Returns the value of the transaction type where the  value is one of TYPE\_AUTH, TYPE\_AUTH\_REVERSAL, TYPE\_CAPTURE  or TYPE\_CREDIT. |
| [setAccountID](dw.order.PaymentTransaction.md#setaccountidstring)([String](TopLevel.String.md)) | Sets the payment service-specific account id. |
| [setAccountType](dw.order.PaymentTransaction.md#setaccounttypestring)([String](TopLevel.String.md)) | Sets the payment service-specific account type. |
| [setAmount](dw.order.PaymentTransaction.md#setamountmoney)([Money](dw.value.Money.md)) | Sets the amount of the transaction. |
| [setPaymentProcessor](dw.order.PaymentTransaction.md#setpaymentprocessorpaymentprocessor)([PaymentProcessor](dw.order.PaymentProcessor.md)) | Sets the payment processor related to this payment transaction. |
| [setPostAuthFraudDecision](dw.order.PaymentTransaction.md#setpostauthfrauddecisionstring)([String](TopLevel.String.md)) | Sets the post-authorization fraud decision. |
| [setPreAuthFraudDecision](dw.order.PaymentTransaction.md#setpreauthfrauddecisionstring)([String](TopLevel.String.md)) | Sets the pre-authorization fraud decision. |
| [setStatus](dw.order.PaymentTransaction.md#setstatusnumber)([Number](TopLevel.Number.md)) | Sets the status of this payment transaction. |
| [setTransactionDetails](dw.order.PaymentTransaction.md#settransactiondetailssalesforcetransactiondetails)([SalesforceTransactionDetails](dw.extensions.payments.SalesforceTransactionDetails.md)) | Sets the transaction details on this payment transaction. |
| [setTransactionID](dw.order.PaymentTransaction.md#settransactionidstring)([String](TopLevel.String.md)) | Sets the payment service-specific transaction id. |
| [setType](dw.order.PaymentTransaction.md#settypestring)([String](TopLevel.String.md)) | Sets the value of the transaction type where permissible  values are TYPE\_AUTH, TYPE\_AUTH\_REVERSAL, TYPE\_CAPTURE or TYPE\_CREDIT. |

### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### POST_AUTH_FRAUD_DECISION_GUARANTEED

- POST_AUTH_FRAUD_DECISION_GUARANTEED: [String](TopLevel.String.md) = "GUARANTEED"
  - : Constant indicating a fraud provider post-authorization decision to guarantee a payment transaction.


---

### POST_AUTH_FRAUD_DECISION_NOT_GUARANTEED

- POST_AUTH_FRAUD_DECISION_NOT_GUARANTEED: [String](TopLevel.String.md) = "NOT_GUARANTEED"
  - : Constant indicating a fraud provider post-authorization decision to not guarantee a payment transaction.


---

### POST_AUTH_FRAUD_DECISION_NOT_REVIEWED

- POST_AUTH_FRAUD_DECISION_NOT_REVIEWED: [String](TopLevel.String.md) = "NOT_REVIEWED"
  - : Constant indicating a fraud provider did not review a payment transaction post-authorization.


---

### POST_AUTH_FRAUD_DECISION_PENDING

- POST_AUTH_FRAUD_DECISION_PENDING: [String](TopLevel.String.md) = "PENDING"
  - : Constant representing a pending asynchronous post-authorization fraud decision.


---

### PRE_AUTH_FRAUD_DECISION_APPROVED

- PRE_AUTH_FRAUD_DECISION_APPROVED: [String](TopLevel.String.md) = "APPROVED"
  - : Constant indicating a fraud provider pre-authorization decision to approve a payment transaction.


---

### PRE_AUTH_FRAUD_DECISION_CHALLENGE

- PRE_AUTH_FRAUD_DECISION_CHALLENGE: [String](TopLevel.String.md) = "CHALLENGE"
  - : Constant indicating a fraud provider pre-authorization decision to challenge a payment transaction.


---

### PRE_AUTH_FRAUD_DECISION_DECLINED

- PRE_AUTH_FRAUD_DECISION_DECLINED: [String](TopLevel.String.md) = "DECLINED"
  - : Constant representing a fraud provider pre-authorization decision to decline a payment transaction.


---

### PRE_AUTH_FRAUD_DECISION_NOT_REVIEWED

- PRE_AUTH_FRAUD_DECISION_NOT_REVIEWED: [String](TopLevel.String.md) = "NOT_REVIEWED"
  - : Constant indicating a fraud provider did not review a payment transaction pre-authorization.


---

### STATUS_AUTHORIZATIONVOIDED

- STATUS_AUTHORIZATIONVOIDED: [Number](TopLevel.Number.md) = 4
  - : Status constant: authorization voided or canceled.


---

### STATUS_AUTHORIZED

- STATUS_AUTHORIZED: [Number](TopLevel.Number.md) = 1
  - : Status constant: authorization successful.


---

### STATUS_CAPTURED

- STATUS_CAPTURED: [Number](TopLevel.Number.md) = 3
  - : Status constant: wholly captured.


---

### STATUS_CAPTUREVOIDED

- STATUS_CAPTUREVOIDED: [Number](TopLevel.Number.md) = 5
  - : Status constant: capture voided.


---

### STATUS_CREATED

- STATUS_CREATED: [Number](TopLevel.Number.md) = 0
  - : Status constant: newly created, not yet processed.


---

### STATUS_MARKED

- STATUS_MARKED: [Number](TopLevel.Number.md) = 6
  - : Status constant: marked for batch settlement.


---

### STATUS_PARTCAPTURED

- STATUS_PARTCAPTURED: [Number](TopLevel.Number.md) = 2
  - : Status constant: partly but not wholly captured.


---

### STATUS_PENDING

- STATUS_PENDING: [Number](TopLevel.Number.md) = 8
  - : Status constant: pending payment processing.


---

### STATUS_SETTLED

- STATUS_SETTLED: [Number](TopLevel.Number.md) = 7
  - : Status constant: batch settlement confirmed.


---

### TYPE_AUTH

- TYPE_AUTH: [String](TopLevel.String.md) = "AUTH"
  - : Constant representing the authorization type of payment transaction.


---

### TYPE_AUTH_REVERSAL

- TYPE_AUTH_REVERSAL: [String](TopLevel.String.md) = "AUTH_REVERSAL"
  - : Constant representing the authorization reversal type of payment transaction.


---

### TYPE_CAPTURE

- TYPE_CAPTURE: [String](TopLevel.String.md) = "CAPTURE"
  - : Constant representing the capture type of payment transaction.


---

### TYPE_CREDIT

- TYPE_CREDIT: [String](TopLevel.String.md) = "CREDIT"
  - : Constant representing the credit type of payment transaction.


---

## Property Details

### accountID
- accountID: [String](TopLevel.String.md)
  - : Returns the payment service-specific account id.


---

### accountType
- accountType: [String](TopLevel.String.md)
  - : Returns the payment service-specific account type.


---

### amount
- amount: [Money](dw.value.Money.md)
  - : Returns the amount of the transaction.


---

### paymentInstrument
- paymentInstrument: [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md) `(read-only)`
  - : Returns the payment instrument related to this payment transaction.


---

### paymentProcessor
- paymentProcessor: [PaymentProcessor](dw.order.PaymentProcessor.md)
  - : Returns the payment processor related to this payment transaction.


---

### postAuthFraudDecision
- postAuthFraudDecision: [String](TopLevel.String.md)
  - : Returns the post-authorization fraud decision, or `null` if not set.

    **See Also:**
    - [POST_AUTH_FRAUD_DECISION_NOT_REVIEWED](dw.order.PaymentTransaction.md#post_auth_fraud_decision_not_reviewed)
    - [POST_AUTH_FRAUD_DECISION_GUARANTEED](dw.order.PaymentTransaction.md#post_auth_fraud_decision_guaranteed)
    - [POST_AUTH_FRAUD_DECISION_NOT_GUARANTEED](dw.order.PaymentTransaction.md#post_auth_fraud_decision_not_guaranteed)
    - [POST_AUTH_FRAUD_DECISION_PENDING](dw.order.PaymentTransaction.md#post_auth_fraud_decision_pending)


---

### preAuthFraudDecision
- preAuthFraudDecision: [String](TopLevel.String.md)
  - : Returns the pre-authorization fraud decision, or `null` if not set.

    **See Also:**
    - [PRE_AUTH_FRAUD_DECISION_NOT_REVIEWED](dw.order.PaymentTransaction.md#pre_auth_fraud_decision_not_reviewed)
    - [PRE_AUTH_FRAUD_DECISION_APPROVED](dw.order.PaymentTransaction.md#pre_auth_fraud_decision_approved)
    - [PRE_AUTH_FRAUD_DECISION_CHALLENGE](dw.order.PaymentTransaction.md#pre_auth_fraud_decision_challenge)
    - [PRE_AUTH_FRAUD_DECISION_DECLINED](dw.order.PaymentTransaction.md#pre_auth_fraud_decision_declined)


---

### status
- status: [Number](TopLevel.Number.md)
  - : Returns the status of this payment transaction.

    **See Also:**
    - [STATUS_CREATED](dw.order.PaymentTransaction.md#status_created)
    - [STATUS_AUTHORIZED](dw.order.PaymentTransaction.md#status_authorized)
    - [STATUS_PARTCAPTURED](dw.order.PaymentTransaction.md#status_partcaptured)
    - [STATUS_CAPTURED](dw.order.PaymentTransaction.md#status_captured)
    - [STATUS_AUTHORIZATIONVOIDED](dw.order.PaymentTransaction.md#status_authorizationvoided)
    - [STATUS_CAPTUREVOIDED](dw.order.PaymentTransaction.md#status_capturevoided)
    - [STATUS_MARKED](dw.order.PaymentTransaction.md#status_marked)
    - [STATUS_SETTLED](dw.order.PaymentTransaction.md#status_settled)
    - [STATUS_PENDING](dw.order.PaymentTransaction.md#status_pending)


---

### transactionDetails
- transactionDetails: [SalesforceTransactionDetails](dw.extensions.payments.SalesforceTransactionDetails.md)
  - : Returns the transaction details for this payment transaction, or `null` if none have been set.


---

### transactionID
- transactionID: [String](TopLevel.String.md)
  - : Returns the payment service-specific transaction id.


---

### type
- type: [EnumValue](dw.value.EnumValue.md)
  - : Returns the value of the transaction type where the
      value is one of TYPE\_AUTH, TYPE\_AUTH\_REVERSAL, TYPE\_CAPTURE
      or TYPE\_CREDIT.



---

## Method Details

### getAccountID()
- getAccountID(): [String](TopLevel.String.md)
  - : Returns the payment service-specific account id.

    **Returns:**
    - the payment service-specific account id.


---

### getAccountType()
- getAccountType(): [String](TopLevel.String.md)
  - : Returns the payment service-specific account type.

    **Returns:**
    - the payment service-specific account type.


---

### getAmount()
- getAmount(): [Money](dw.value.Money.md)
  - : Returns the amount of the transaction.

    **Returns:**
    - the amount of the transaction.


---

### getPaymentInstrument()
- getPaymentInstrument(): [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md)
  - : Returns the payment instrument related to this payment transaction.

    **Returns:**
    - the order payment instrument related to this payment transaction.


---

### getPaymentProcessor()
- getPaymentProcessor(): [PaymentProcessor](dw.order.PaymentProcessor.md)
  - : Returns the payment processor related to this payment transaction.

    **Returns:**
    - the payment processor related to this payment transaction.


---

### getPostAuthFraudDecision()
- getPostAuthFraudDecision(): [String](TopLevel.String.md)
  - : Returns the post-authorization fraud decision, or `null` if not set.

    **Returns:**
    - the post-auth fraud decision

    **See Also:**
    - [POST_AUTH_FRAUD_DECISION_NOT_REVIEWED](dw.order.PaymentTransaction.md#post_auth_fraud_decision_not_reviewed)
    - [POST_AUTH_FRAUD_DECISION_GUARANTEED](dw.order.PaymentTransaction.md#post_auth_fraud_decision_guaranteed)
    - [POST_AUTH_FRAUD_DECISION_NOT_GUARANTEED](dw.order.PaymentTransaction.md#post_auth_fraud_decision_not_guaranteed)
    - [POST_AUTH_FRAUD_DECISION_PENDING](dw.order.PaymentTransaction.md#post_auth_fraud_decision_pending)


---

### getPreAuthFraudDecision()
- getPreAuthFraudDecision(): [String](TopLevel.String.md)
  - : Returns the pre-authorization fraud decision, or `null` if not set.

    **Returns:**
    - the pre-auth fraud decision

    **See Also:**
    - [PRE_AUTH_FRAUD_DECISION_NOT_REVIEWED](dw.order.PaymentTransaction.md#pre_auth_fraud_decision_not_reviewed)
    - [PRE_AUTH_FRAUD_DECISION_APPROVED](dw.order.PaymentTransaction.md#pre_auth_fraud_decision_approved)
    - [PRE_AUTH_FRAUD_DECISION_CHALLENGE](dw.order.PaymentTransaction.md#pre_auth_fraud_decision_challenge)
    - [PRE_AUTH_FRAUD_DECISION_DECLINED](dw.order.PaymentTransaction.md#pre_auth_fraud_decision_declined)


---

### getStatus()
- getStatus(): [Number](TopLevel.Number.md)
  - : Returns the status of this payment transaction.

    **Returns:**
    - the status of this payment transaction.

    **See Also:**
    - [STATUS_CREATED](dw.order.PaymentTransaction.md#status_created)
    - [STATUS_AUTHORIZED](dw.order.PaymentTransaction.md#status_authorized)
    - [STATUS_PARTCAPTURED](dw.order.PaymentTransaction.md#status_partcaptured)
    - [STATUS_CAPTURED](dw.order.PaymentTransaction.md#status_captured)
    - [STATUS_AUTHORIZATIONVOIDED](dw.order.PaymentTransaction.md#status_authorizationvoided)
    - [STATUS_CAPTUREVOIDED](dw.order.PaymentTransaction.md#status_capturevoided)
    - [STATUS_MARKED](dw.order.PaymentTransaction.md#status_marked)
    - [STATUS_SETTLED](dw.order.PaymentTransaction.md#status_settled)
    - [STATUS_PENDING](dw.order.PaymentTransaction.md#status_pending)


---

### getTransactionDetails()
- getTransactionDetails(): [SalesforceTransactionDetails](dw.extensions.payments.SalesforceTransactionDetails.md)
  - : Returns the transaction details for this payment transaction, or `null` if none have been set.

    **Returns:**
    - transaction details, or `null` if none have been set


---

### getTransactionID()
- getTransactionID(): [String](TopLevel.String.md)
  - : Returns the payment service-specific transaction id.

    **Returns:**
    - the payment service-specific transaction id.


---

### getType()
- getType(): [EnumValue](dw.value.EnumValue.md)
  - : Returns the value of the transaction type where the
      value is one of TYPE\_AUTH, TYPE\_AUTH\_REVERSAL, TYPE\_CAPTURE
      or TYPE\_CREDIT.


    **Returns:**
    - the value of the transaction type where the
      value is one of TYPE\_AUTH, TYPE\_AUTH\_REVERSAL, TYPE\_CAPTURE
      or TYPE\_CREDIT.



---

### setAccountID(String)
- setAccountID(accountID: [String](TopLevel.String.md)): void
  - : Sets the payment service-specific account id.

    **Parameters:**
    - accountID - the payment service-specific account id.


---

### setAccountType(String)
- setAccountType(accountType: [String](TopLevel.String.md)): void
  - : Sets the payment service-specific account type.

    **Parameters:**
    - accountType - the payment service-specific account type.


---

### setAmount(Money)
- setAmount(amount: [Money](dw.value.Money.md)): void
  - : Sets the amount of the transaction.

    **Parameters:**
    - amount - the amount of the transaction.


---

### setPaymentProcessor(PaymentProcessor)
- setPaymentProcessor(paymentProcessor: [PaymentProcessor](dw.order.PaymentProcessor.md)): void
  - : Sets the payment processor related to this payment transaction.

    **Parameters:**
    - paymentProcessor - the payment processor related to this payment transaction.


---

### setPostAuthFraudDecision(String)
- setPostAuthFraudDecision(postAuthFraudDecision: [String](TopLevel.String.md)): void
  - : Sets the post-authorization fraud decision.

    **Parameters:**
    - postAuthFraudDecision - the post-auth fraud decision

    **See Also:**
    - [POST_AUTH_FRAUD_DECISION_NOT_REVIEWED](dw.order.PaymentTransaction.md#post_auth_fraud_decision_not_reviewed)
    - [POST_AUTH_FRAUD_DECISION_GUARANTEED](dw.order.PaymentTransaction.md#post_auth_fraud_decision_guaranteed)
    - [POST_AUTH_FRAUD_DECISION_NOT_GUARANTEED](dw.order.PaymentTransaction.md#post_auth_fraud_decision_not_guaranteed)
    - [POST_AUTH_FRAUD_DECISION_PENDING](dw.order.PaymentTransaction.md#post_auth_fraud_decision_pending)


---

### setPreAuthFraudDecision(String)
- setPreAuthFraudDecision(preAuthFraudDecision: [String](TopLevel.String.md)): void
  - : Sets the pre-authorization fraud decision.

    **Parameters:**
    - preAuthFraudDecision - the pre-auth fraud decision

    **See Also:**
    - [PRE_AUTH_FRAUD_DECISION_NOT_REVIEWED](dw.order.PaymentTransaction.md#pre_auth_fraud_decision_not_reviewed)
    - [PRE_AUTH_FRAUD_DECISION_APPROVED](dw.order.PaymentTransaction.md#pre_auth_fraud_decision_approved)
    - [PRE_AUTH_FRAUD_DECISION_CHALLENGE](dw.order.PaymentTransaction.md#pre_auth_fraud_decision_challenge)
    - [PRE_AUTH_FRAUD_DECISION_DECLINED](dw.order.PaymentTransaction.md#pre_auth_fraud_decision_declined)


---

### setStatus(Number)
- setStatus(status: [Number](TopLevel.Number.md)): void
  - : Sets the status of this payment transaction.

    **Parameters:**
    - status - the status to set

    **Throws:**
    - Exception - if the value is not one of the constants

    **See Also:**
    - [STATUS_CREATED](dw.order.PaymentTransaction.md#status_created)
    - [STATUS_AUTHORIZED](dw.order.PaymentTransaction.md#status_authorized)
    - [STATUS_PARTCAPTURED](dw.order.PaymentTransaction.md#status_partcaptured)
    - [STATUS_CAPTURED](dw.order.PaymentTransaction.md#status_captured)
    - [STATUS_AUTHORIZATIONVOIDED](dw.order.PaymentTransaction.md#status_authorizationvoided)
    - [STATUS_CAPTUREVOIDED](dw.order.PaymentTransaction.md#status_capturevoided)
    - [STATUS_MARKED](dw.order.PaymentTransaction.md#status_marked)
    - [STATUS_SETTLED](dw.order.PaymentTransaction.md#status_settled)
    - [STATUS_PENDING](dw.order.PaymentTransaction.md#status_pending)


---

### setTransactionDetails(SalesforceTransactionDetails)
- setTransactionDetails(transactionDetails: [SalesforceTransactionDetails](dw.extensions.payments.SalesforceTransactionDetails.md)): void
  - : Sets the transaction details on this payment transaction.

    **Parameters:**
    - transactionDetails - the transaction details to set, or `null` to clear


---

### setTransactionID(String)
- setTransactionID(transactionID: [String](TopLevel.String.md)): void
  - : Sets the payment service-specific transaction id.

    **Parameters:**
    - transactionID - the payment service-specific transaction id.


---

### setType(String)
- setType(type: [String](TopLevel.String.md)): void
  - : Sets the value of the transaction type where permissible
      values are TYPE\_AUTH, TYPE\_AUTH\_REVERSAL, TYPE\_CAPTURE or TYPE\_CREDIT.


    **Parameters:**
    - type - the value of the transaction type where the  value is one of TYPE\_AUTH, TYPE\_AUTH\_REVERSAL, TYPE\_CAPTURE or TYPE\_CREDIT.


---

<!-- prettier-ignore-end -->
