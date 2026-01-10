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
| [getTransactionID](dw.order.PaymentTransaction.md#gettransactionid)() | Returns the payment service-specific transaction id. |
| [getType](dw.order.PaymentTransaction.md#gettype)() | Returns the value of the transaction type where the  value is one of TYPE\_AUTH, TYPE\_AUTH\_REVERSAL, TYPE\_CAPTURE  or TYPE\_CREDIT. |
| [setAccountID](dw.order.PaymentTransaction.md#setaccountidstring)([String](TopLevel.String.md)) | Sets the payment service-specific account id. |
| [setAccountType](dw.order.PaymentTransaction.md#setaccounttypestring)([String](TopLevel.String.md)) | Sets the payment service-specific account type. |
| [setAmount](dw.order.PaymentTransaction.md#setamountmoney)([Money](dw.value.Money.md)) | Sets the amount of the transaction. |
| [setPaymentProcessor](dw.order.PaymentTransaction.md#setpaymentprocessorpaymentprocessor)([PaymentProcessor](dw.order.PaymentProcessor.md)) | Sets the payment processor related to this payment transaction. |
| [setTransactionID](dw.order.PaymentTransaction.md#settransactionidstring)([String](TopLevel.String.md)) | Sets the payment service-specific transaction id. |
| [setType](dw.order.PaymentTransaction.md#settypestring)([String](TopLevel.String.md)) | Sets the value of the transaction type where permissible  values are TYPE\_AUTH, TYPE\_AUTH\_REVERSAL, TYPE\_CAPTURE or TYPE\_CREDIT. |

### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

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
