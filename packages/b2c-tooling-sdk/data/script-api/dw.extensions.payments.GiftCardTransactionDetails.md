<!-- prettier-ignore-start -->
# Class GiftCardTransactionDetails

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.extensions.payments.SalesforceTransactionDetails](dw.extensions.payments.SalesforceTransactionDetails.md)
    - [dw.extensions.payments.GiftCardTransactionDetails](dw.extensions.payments.GiftCardTransactionDetails.md)

Payment transaction details for gift card payments. Used for Salesforce Payments and third-party gift card providers.
Capture and refund forensic fields only: not a copy of card CVC/AVS/3DS.


Each payment transaction holds at most one `GiftCardTransactionDetails` instance. These fields describe
the outcome of the latest capture or refund for that instrument; a later refund replaces any prior capture values.
`approvalCode` is for a successful outcome; `reasonCode` is for errors only.



## Constant Summary

| Constant | Description |
| --- | --- |
| [REASON_CODE_DECLINED](#reason_code_declined): [String](TopLevel.String.md) = "DECLINED" | Provider-normalized reason code indicating a declined request. |
| [REASON_CODE_INSUFFICIENT_FUNDS](#reason_code_insufficient_funds): [String](TopLevel.String.md) = "INSUFFICIENT_FUNDS" | Provider-normalized reason code indicating insufficient funds. |

## Property Summary

| Property | Description |
| --- | --- |
| [approvalCode](#approvalcode): [String](TopLevel.String.md) | Returns the approval code from the latest successful capture or refund for this payment transaction, or  `null` if not set. |
| [processorResponseText](#processorresponsetext): [String](TopLevel.String.md) | Returns the human-readable processor response text, or `null` if not set. |
| [reasonCode](#reasoncode): [String](TopLevel.String.md) | Returns the platform-normalized reason code for an error, or `null` if not set. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [GiftCardTransactionDetails](#giftcardtransactiondetails)() | Constructs an empty gift card transaction details object. |

## Method Summary

| Method | Description |
| --- | --- |
| [getApprovalCode](dw.extensions.payments.GiftCardTransactionDetails.md#getapprovalcode)() | Returns the approval code from the latest successful capture or refund for this payment transaction, or  `null` if not set. |
| [getProcessorResponseText](dw.extensions.payments.GiftCardTransactionDetails.md#getprocessorresponsetext)() | Returns the human-readable processor response text, or `null` if not set. |
| [getReasonCode](dw.extensions.payments.GiftCardTransactionDetails.md#getreasoncode)() | Returns the platform-normalized reason code for an error, or `null` if not set. |
| [setApprovalCode](dw.extensions.payments.GiftCardTransactionDetails.md#setapprovalcodestring)([String](TopLevel.String.md)) | Sets the approval code for the latest successful capture or refund. |
| [setProcessorResponseText](dw.extensions.payments.GiftCardTransactionDetails.md#setprocessorresponsetextstring)([String](TopLevel.String.md)) | Sets the human-readable processor response text. |
| [setReasonCode](dw.extensions.payments.GiftCardTransactionDetails.md#setreasoncodestring)([String](TopLevel.String.md)) | Sets the platform-normalized reason code for an error. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### REASON_CODE_DECLINED

- REASON_CODE_DECLINED: [String](TopLevel.String.md) = "DECLINED"
  - : Provider-normalized reason code indicating a declined request.


---

### REASON_CODE_INSUFFICIENT_FUNDS

- REASON_CODE_INSUFFICIENT_FUNDS: [String](TopLevel.String.md) = "INSUFFICIENT_FUNDS"
  - : Provider-normalized reason code indicating insufficient funds.


---

## Property Details

### approvalCode
- approvalCode: [String](TopLevel.String.md)
  - : Returns the approval code from the latest successful capture or refund for this payment transaction, or
      `null` if not set. A refund that writes new details replaces any prior capture approval code.



---

### processorResponseText
- processorResponseText: [String](TopLevel.String.md)
  - : Returns the human-readable processor response text, or `null` if not set. The language and localization of
      this text are provider-defined and may vary by provider integration.



---

### reasonCode
- reasonCode: [String](TopLevel.String.md)
  - : Returns the platform-normalized reason code for an error, or `null` if not set. Leave unset on a
      successful capture or refund.


    **See Also:**
    - [REASON_CODE_DECLINED](dw.extensions.payments.GiftCardTransactionDetails.md#reason_code_declined)
    - [REASON_CODE_INSUFFICIENT_FUNDS](dw.extensions.payments.GiftCardTransactionDetails.md#reason_code_insufficient_funds)


---

## Constructor Details

### GiftCardTransactionDetails()
- GiftCardTransactionDetails()
  - : Constructs an empty gift card transaction details object.


---

## Method Details

### getApprovalCode()
- getApprovalCode(): [String](TopLevel.String.md)
  - : Returns the approval code from the latest successful capture or refund for this payment transaction, or
      `null` if not set. A refund that writes new details replaces any prior capture approval code.


    **Returns:**
    - approval code


---

### getProcessorResponseText()
- getProcessorResponseText(): [String](TopLevel.String.md)
  - : Returns the human-readable processor response text, or `null` if not set. The language and localization of
      this text are provider-defined and may vary by provider integration.


    **Returns:**
    - processor response text


---

### getReasonCode()
- getReasonCode(): [String](TopLevel.String.md)
  - : Returns the platform-normalized reason code for an error, or `null` if not set. Leave unset on a
      successful capture or refund.


    **Returns:**
    - reason code

    **See Also:**
    - [REASON_CODE_DECLINED](dw.extensions.payments.GiftCardTransactionDetails.md#reason_code_declined)
    - [REASON_CODE_INSUFFICIENT_FUNDS](dw.extensions.payments.GiftCardTransactionDetails.md#reason_code_insufficient_funds)


---

### setApprovalCode(String)
- setApprovalCode(approvalCode: [String](TopLevel.String.md)): void
  - : Sets the approval code for the latest successful capture or refund. A refund that writes new details replaces any
      prior capture approval code.


    **Parameters:**
    - approvalCode - approval code


---

### setProcessorResponseText(String)
- setProcessorResponseText(processorResponseText: [String](TopLevel.String.md)): void
  - : Sets the human-readable processor response text.

    **Parameters:**
    - processorResponseText - processor response text


---

### setReasonCode(String)
- setReasonCode(reasonCode: [String](TopLevel.String.md)): void
  - : Sets the platform-normalized reason code for an error. Do not set this on a successful capture or refund.

    **Parameters:**
    - reasonCode - reason code

    **See Also:**
    - [REASON_CODE_DECLINED](dw.extensions.payments.GiftCardTransactionDetails.md#reason_code_declined)
    - [REASON_CODE_INSUFFICIENT_FUNDS](dw.extensions.payments.GiftCardTransactionDetails.md#reason_code_insufficient_funds)


---

<!-- prettier-ignore-end -->
