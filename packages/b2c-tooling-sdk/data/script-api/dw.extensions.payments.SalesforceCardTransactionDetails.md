<!-- prettier-ignore-start -->
# Class SalesforceCardTransactionDetails

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.extensions.payments.SalesforceTransactionDetails](dw.extensions.payments.SalesforceTransactionDetails.md)
    - [dw.extensions.payments.SalesforceCardTransactionDetails](dw.extensions.payments.SalesforceCardTransactionDetails.md)

Payment transaction details for credit card payments, including those via wallets like Apple Pay and Google Pay.


## Constant Summary

| Constant | Description |
| --- | --- |
| [AVS_RESULT_MATCH](#avs_result_match): [String](TopLevel.String.md) = "Y" | Constant representing an AVS full match (address and zip). |
| [AVS_RESULT_NOT_SUPPORTED](#avs_result_not_supported): [String](TopLevel.String.md) = "S" | Constant representing an AVS not-supported result. |
| [AVS_RESULT_NO_MATCH](#avs_result_no_match): [String](TopLevel.String.md) = "N" | Constant representing an AVS no-match result. |
| [AVS_RESULT_PARTIAL_MATCH_ADDRESS](#avs_result_partial_match_address): [String](TopLevel.String.md) = "A" | Constant representing an AVS partial match on address only. |
| [AVS_RESULT_PARTIAL_MATCH_ZIP](#avs_result_partial_match_zip): [String](TopLevel.String.md) = "Z" | Constant representing an AVS partial match on zip code only. |
| [AVS_RESULT_RETRY](#avs_result_retry): [String](TopLevel.String.md) = "R" | Constant representing an AVS retry result. |
| [AVS_RESULT_UNAVAILABLE](#avs_result_unavailable): [String](TopLevel.String.md) = "U" | Constant representing an AVS unavailable result. |
| [CVC_RESULT_MATCH](#cvc_result_match): [String](TopLevel.String.md) = "MATCH" | Constant representing a CVC match result. |
| [CVC_RESULT_NOT_PROCESSED](#cvc_result_not_processed): [String](TopLevel.String.md) = "NOT_PROCESSED" | Constant representing a CVC not-processed result. |
| [CVC_RESULT_NO_MATCH](#cvc_result_no_match): [String](TopLevel.String.md) = "NO_MATCH" | Constant representing a CVC no-match result. |
| [CVC_RESULT_UNAVAILABLE](#cvc_result_unavailable): [String](TopLevel.String.md) = "UNAVAILABLE" | Constant representing a CVC unavailable result. |
| [THREE_DS_RESULT_ATTEMPTED](#three_ds_result_attempted): [String](TopLevel.String.md) = "ATTEMPTED" | Constant representing a 3D Secure attempted result. |
| [THREE_DS_RESULT_AUTHENTICATED](#three_ds_result_authenticated): [String](TopLevel.String.md) = "AUTHENTICATED" | Constant representing a 3D Secure authenticated result. |
| [THREE_DS_RESULT_FAILED](#three_ds_result_failed): [String](TopLevel.String.md) = "FAILED" | Constant representing a 3D Secure failed result. |
| [THREE_DS_RESULT_REJECTED](#three_ds_result_rejected): [String](TopLevel.String.md) = "REJECTED" | Constant representing a 3D Secure rejected result. |
| [THREE_DS_RESULT_UNAVAILABLE](#three_ds_result_unavailable): [String](TopLevel.String.md) = "UNAVAILABLE" | Constant representing a 3D Secure unavailable result. |
| [THREE_DS_VERSION_V1](#three_ds_version_v1): [String](TopLevel.String.md) = "V1" | Constant representing 3D Secure version 1. |
| [THREE_DS_VERSION_V2](#three_ds_version_v2): [String](TopLevel.String.md) = "V2" | Constant representing 3D Secure version 2. |

## Property Summary

| Property | Description |
| --- | --- |
| [avsResult](#avsresult): [String](TopLevel.String.md) | Returns the AVS verification result, or `null` if not set. |
| [cvcResult](#cvcresult): [String](TopLevel.String.md) | Returns the CVC verification result, or `null` if not set. |
| [electronicCommerceIndicator](#electroniccommerceindicator): [String](TopLevel.String.md) | Returns the Electronic Commerce Indicator value, or `null` if not set. |
| [threeDSResult](#threedsresult): [String](TopLevel.String.md) | Returns the 3D Secure authentication result, or `null` if not set. |
| [threeDSTransactionId](#threedstransactionid): [String](TopLevel.String.md) | Returns the 3D Secure transaction identifier, or `null` if not set. |
| [threeDSVersion](#threedsversion): [String](TopLevel.String.md) | Returns the 3D Secure protocol version, or `null` if not set. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [SalesforceCardTransactionDetails](#salesforcecardtransactiondetails)() | Constructs an empty card transaction details object. |

## Method Summary

| Method | Description |
| --- | --- |
| [getAvsResult](dw.extensions.payments.SalesforceCardTransactionDetails.md#getavsresult)() | Returns the AVS verification result, or `null` if not set. |
| [getCvcResult](dw.extensions.payments.SalesforceCardTransactionDetails.md#getcvcresult)() | Returns the CVC verification result, or `null` if not set. |
| [getElectronicCommerceIndicator](dw.extensions.payments.SalesforceCardTransactionDetails.md#getelectroniccommerceindicator)() | Returns the Electronic Commerce Indicator value, or `null` if not set. |
| [getThreeDSResult](dw.extensions.payments.SalesforceCardTransactionDetails.md#getthreedsresult)() | Returns the 3D Secure authentication result, or `null` if not set. |
| [getThreeDSTransactionId](dw.extensions.payments.SalesforceCardTransactionDetails.md#getthreedstransactionid)() | Returns the 3D Secure transaction identifier, or `null` if not set. |
| [getThreeDSVersion](dw.extensions.payments.SalesforceCardTransactionDetails.md#getthreedsversion)() | Returns the 3D Secure protocol version, or `null` if not set. |
| [setAvsResult](dw.extensions.payments.SalesforceCardTransactionDetails.md#setavsresultstring)([String](TopLevel.String.md)) | Sets the AVS verification result. |
| [setCvcResult](dw.extensions.payments.SalesforceCardTransactionDetails.md#setcvcresultstring)([String](TopLevel.String.md)) | Sets the CVC verification result. |
| [setElectronicCommerceIndicator](dw.extensions.payments.SalesforceCardTransactionDetails.md#setelectroniccommerceindicatorstring)([String](TopLevel.String.md)) | Sets the Electronic Commerce Indicator value. |
| [setThreeDSResult](dw.extensions.payments.SalesforceCardTransactionDetails.md#setthreedsresultstring)([String](TopLevel.String.md)) | Sets the 3D Secure authentication result. |
| [setThreeDSTransactionId](dw.extensions.payments.SalesforceCardTransactionDetails.md#setthreedstransactionidstring)([String](TopLevel.String.md)) | Sets the 3D Secure transaction identifier. |
| [setThreeDSVersion](dw.extensions.payments.SalesforceCardTransactionDetails.md#setthreedsversionstring)([String](TopLevel.String.md)) | Sets the 3D Secure protocol version. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### AVS_RESULT_MATCH

- AVS_RESULT_MATCH: [String](TopLevel.String.md) = "Y"
  - : Constant representing an AVS full match (address and zip).


---

### AVS_RESULT_NOT_SUPPORTED

- AVS_RESULT_NOT_SUPPORTED: [String](TopLevel.String.md) = "S"
  - : Constant representing an AVS not-supported result.


---

### AVS_RESULT_NO_MATCH

- AVS_RESULT_NO_MATCH: [String](TopLevel.String.md) = "N"
  - : Constant representing an AVS no-match result.


---

### AVS_RESULT_PARTIAL_MATCH_ADDRESS

- AVS_RESULT_PARTIAL_MATCH_ADDRESS: [String](TopLevel.String.md) = "A"
  - : Constant representing an AVS partial match on address only.


---

### AVS_RESULT_PARTIAL_MATCH_ZIP

- AVS_RESULT_PARTIAL_MATCH_ZIP: [String](TopLevel.String.md) = "Z"
  - : Constant representing an AVS partial match on zip code only.


---

### AVS_RESULT_RETRY

- AVS_RESULT_RETRY: [String](TopLevel.String.md) = "R"
  - : Constant representing an AVS retry result.


---

### AVS_RESULT_UNAVAILABLE

- AVS_RESULT_UNAVAILABLE: [String](TopLevel.String.md) = "U"
  - : Constant representing an AVS unavailable result.


---

### CVC_RESULT_MATCH

- CVC_RESULT_MATCH: [String](TopLevel.String.md) = "MATCH"
  - : Constant representing a CVC match result.


---

### CVC_RESULT_NOT_PROCESSED

- CVC_RESULT_NOT_PROCESSED: [String](TopLevel.String.md) = "NOT_PROCESSED"
  - : Constant representing a CVC not-processed result.


---

### CVC_RESULT_NO_MATCH

- CVC_RESULT_NO_MATCH: [String](TopLevel.String.md) = "NO_MATCH"
  - : Constant representing a CVC no-match result.


---

### CVC_RESULT_UNAVAILABLE

- CVC_RESULT_UNAVAILABLE: [String](TopLevel.String.md) = "UNAVAILABLE"
  - : Constant representing a CVC unavailable result.


---

### THREE_DS_RESULT_ATTEMPTED

- THREE_DS_RESULT_ATTEMPTED: [String](TopLevel.String.md) = "ATTEMPTED"
  - : Constant representing a 3D Secure attempted result.


---

### THREE_DS_RESULT_AUTHENTICATED

- THREE_DS_RESULT_AUTHENTICATED: [String](TopLevel.String.md) = "AUTHENTICATED"
  - : Constant representing a 3D Secure authenticated result.


---

### THREE_DS_RESULT_FAILED

- THREE_DS_RESULT_FAILED: [String](TopLevel.String.md) = "FAILED"
  - : Constant representing a 3D Secure failed result.


---

### THREE_DS_RESULT_REJECTED

- THREE_DS_RESULT_REJECTED: [String](TopLevel.String.md) = "REJECTED"
  - : Constant representing a 3D Secure rejected result.


---

### THREE_DS_RESULT_UNAVAILABLE

- THREE_DS_RESULT_UNAVAILABLE: [String](TopLevel.String.md) = "UNAVAILABLE"
  - : Constant representing a 3D Secure unavailable result.


---

### THREE_DS_VERSION_V1

- THREE_DS_VERSION_V1: [String](TopLevel.String.md) = "V1"
  - : Constant representing 3D Secure version 1.


---

### THREE_DS_VERSION_V2

- THREE_DS_VERSION_V2: [String](TopLevel.String.md) = "V2"
  - : Constant representing 3D Secure version 2.


---

## Property Details

### avsResult
- avsResult: [String](TopLevel.String.md)
  - : Returns the AVS verification result, or `null` if not set.

    **See Also:**
    - [AVS_RESULT_MATCH](dw.extensions.payments.SalesforceCardTransactionDetails.md#avs_result_match)
    - [AVS_RESULT_NO_MATCH](dw.extensions.payments.SalesforceCardTransactionDetails.md#avs_result_no_match)
    - [AVS_RESULT_PARTIAL_MATCH_ADDRESS](dw.extensions.payments.SalesforceCardTransactionDetails.md#avs_result_partial_match_address)
    - [AVS_RESULT_PARTIAL_MATCH_ZIP](dw.extensions.payments.SalesforceCardTransactionDetails.md#avs_result_partial_match_zip)
    - [AVS_RESULT_UNAVAILABLE](dw.extensions.payments.SalesforceCardTransactionDetails.md#avs_result_unavailable)
    - [AVS_RESULT_NOT_SUPPORTED](dw.extensions.payments.SalesforceCardTransactionDetails.md#avs_result_not_supported)
    - [AVS_RESULT_RETRY](dw.extensions.payments.SalesforceCardTransactionDetails.md#avs_result_retry)


---

### cvcResult
- cvcResult: [String](TopLevel.String.md)
  - : Returns the CVC verification result, or `null` if not set.

    **See Also:**
    - [CVC_RESULT_MATCH](dw.extensions.payments.SalesforceCardTransactionDetails.md#cvc_result_match)
    - [CVC_RESULT_NO_MATCH](dw.extensions.payments.SalesforceCardTransactionDetails.md#cvc_result_no_match)
    - [CVC_RESULT_NOT_PROCESSED](dw.extensions.payments.SalesforceCardTransactionDetails.md#cvc_result_not_processed)
    - [CVC_RESULT_UNAVAILABLE](dw.extensions.payments.SalesforceCardTransactionDetails.md#cvc_result_unavailable)


---

### electronicCommerceIndicator
- electronicCommerceIndicator: [String](TopLevel.String.md)
  - : Returns the Electronic Commerce Indicator value, or `null` if not set.


---

### threeDSResult
- threeDSResult: [String](TopLevel.String.md)
  - : Returns the 3D Secure authentication result, or `null` if not set.

    **See Also:**
    - [THREE_DS_RESULT_AUTHENTICATED](dw.extensions.payments.SalesforceCardTransactionDetails.md#three_ds_result_authenticated)
    - [THREE_DS_RESULT_ATTEMPTED](dw.extensions.payments.SalesforceCardTransactionDetails.md#three_ds_result_attempted)
    - [THREE_DS_RESULT_FAILED](dw.extensions.payments.SalesforceCardTransactionDetails.md#three_ds_result_failed)
    - [THREE_DS_RESULT_REJECTED](dw.extensions.payments.SalesforceCardTransactionDetails.md#three_ds_result_rejected)
    - [THREE_DS_RESULT_UNAVAILABLE](dw.extensions.payments.SalesforceCardTransactionDetails.md#three_ds_result_unavailable)


---

### threeDSTransactionId
- threeDSTransactionId: [String](TopLevel.String.md)
  - : Returns the 3D Secure transaction identifier, or `null` if not set.


---

### threeDSVersion
- threeDSVersion: [String](TopLevel.String.md)
  - : Returns the 3D Secure protocol version, or `null` if not set.

    **See Also:**
    - [THREE_DS_VERSION_V1](dw.extensions.payments.SalesforceCardTransactionDetails.md#three_ds_version_v1)
    - [THREE_DS_VERSION_V2](dw.extensions.payments.SalesforceCardTransactionDetails.md#three_ds_version_v2)


---

## Constructor Details

### SalesforceCardTransactionDetails()
- SalesforceCardTransactionDetails()
  - : Constructs an empty card transaction details object.


---

## Method Details

### getAvsResult()
- getAvsResult(): [String](TopLevel.String.md)
  - : Returns the AVS verification result, or `null` if not set.

    **Returns:**
    - the AVS result

    **See Also:**
    - [AVS_RESULT_MATCH](dw.extensions.payments.SalesforceCardTransactionDetails.md#avs_result_match)
    - [AVS_RESULT_NO_MATCH](dw.extensions.payments.SalesforceCardTransactionDetails.md#avs_result_no_match)
    - [AVS_RESULT_PARTIAL_MATCH_ADDRESS](dw.extensions.payments.SalesforceCardTransactionDetails.md#avs_result_partial_match_address)
    - [AVS_RESULT_PARTIAL_MATCH_ZIP](dw.extensions.payments.SalesforceCardTransactionDetails.md#avs_result_partial_match_zip)
    - [AVS_RESULT_UNAVAILABLE](dw.extensions.payments.SalesforceCardTransactionDetails.md#avs_result_unavailable)
    - [AVS_RESULT_NOT_SUPPORTED](dw.extensions.payments.SalesforceCardTransactionDetails.md#avs_result_not_supported)
    - [AVS_RESULT_RETRY](dw.extensions.payments.SalesforceCardTransactionDetails.md#avs_result_retry)


---

### getCvcResult()
- getCvcResult(): [String](TopLevel.String.md)
  - : Returns the CVC verification result, or `null` if not set.

    **Returns:**
    - the CVC result

    **See Also:**
    - [CVC_RESULT_MATCH](dw.extensions.payments.SalesforceCardTransactionDetails.md#cvc_result_match)
    - [CVC_RESULT_NO_MATCH](dw.extensions.payments.SalesforceCardTransactionDetails.md#cvc_result_no_match)
    - [CVC_RESULT_NOT_PROCESSED](dw.extensions.payments.SalesforceCardTransactionDetails.md#cvc_result_not_processed)
    - [CVC_RESULT_UNAVAILABLE](dw.extensions.payments.SalesforceCardTransactionDetails.md#cvc_result_unavailable)


---

### getElectronicCommerceIndicator()
- getElectronicCommerceIndicator(): [String](TopLevel.String.md)
  - : Returns the Electronic Commerce Indicator value, or `null` if not set.

    **Returns:**
    - the ECI value


---

### getThreeDSResult()
- getThreeDSResult(): [String](TopLevel.String.md)
  - : Returns the 3D Secure authentication result, or `null` if not set.

    **Returns:**
    - the 3DS result

    **See Also:**
    - [THREE_DS_RESULT_AUTHENTICATED](dw.extensions.payments.SalesforceCardTransactionDetails.md#three_ds_result_authenticated)
    - [THREE_DS_RESULT_ATTEMPTED](dw.extensions.payments.SalesforceCardTransactionDetails.md#three_ds_result_attempted)
    - [THREE_DS_RESULT_FAILED](dw.extensions.payments.SalesforceCardTransactionDetails.md#three_ds_result_failed)
    - [THREE_DS_RESULT_REJECTED](dw.extensions.payments.SalesforceCardTransactionDetails.md#three_ds_result_rejected)
    - [THREE_DS_RESULT_UNAVAILABLE](dw.extensions.payments.SalesforceCardTransactionDetails.md#three_ds_result_unavailable)


---

### getThreeDSTransactionId()
- getThreeDSTransactionId(): [String](TopLevel.String.md)
  - : Returns the 3D Secure transaction identifier, or `null` if not set.

    **Returns:**
    - the 3DS transaction ID


---

### getThreeDSVersion()
- getThreeDSVersion(): [String](TopLevel.String.md)
  - : Returns the 3D Secure protocol version, or `null` if not set.

    **Returns:**
    - the 3DS version

    **See Also:**
    - [THREE_DS_VERSION_V1](dw.extensions.payments.SalesforceCardTransactionDetails.md#three_ds_version_v1)
    - [THREE_DS_VERSION_V2](dw.extensions.payments.SalesforceCardTransactionDetails.md#three_ds_version_v2)


---

### setAvsResult(String)
- setAvsResult(avsResult: [String](TopLevel.String.md)): void
  - : Sets the AVS verification result.

    **Parameters:**
    - avsResult - the AVS result

    **See Also:**
    - [AVS_RESULT_MATCH](dw.extensions.payments.SalesforceCardTransactionDetails.md#avs_result_match)
    - [AVS_RESULT_NO_MATCH](dw.extensions.payments.SalesforceCardTransactionDetails.md#avs_result_no_match)
    - [AVS_RESULT_PARTIAL_MATCH_ADDRESS](dw.extensions.payments.SalesforceCardTransactionDetails.md#avs_result_partial_match_address)
    - [AVS_RESULT_PARTIAL_MATCH_ZIP](dw.extensions.payments.SalesforceCardTransactionDetails.md#avs_result_partial_match_zip)
    - [AVS_RESULT_UNAVAILABLE](dw.extensions.payments.SalesforceCardTransactionDetails.md#avs_result_unavailable)
    - [AVS_RESULT_NOT_SUPPORTED](dw.extensions.payments.SalesforceCardTransactionDetails.md#avs_result_not_supported)
    - [AVS_RESULT_RETRY](dw.extensions.payments.SalesforceCardTransactionDetails.md#avs_result_retry)


---

### setCvcResult(String)
- setCvcResult(cvcResult: [String](TopLevel.String.md)): void
  - : Sets the CVC verification result.

    **Parameters:**
    - cvcResult - the CVC result

    **See Also:**
    - [CVC_RESULT_MATCH](dw.extensions.payments.SalesforceCardTransactionDetails.md#cvc_result_match)
    - [CVC_RESULT_NO_MATCH](dw.extensions.payments.SalesforceCardTransactionDetails.md#cvc_result_no_match)
    - [CVC_RESULT_NOT_PROCESSED](dw.extensions.payments.SalesforceCardTransactionDetails.md#cvc_result_not_processed)
    - [CVC_RESULT_UNAVAILABLE](dw.extensions.payments.SalesforceCardTransactionDetails.md#cvc_result_unavailable)


---

### setElectronicCommerceIndicator(String)
- setElectronicCommerceIndicator(electronicCommerceIndicator: [String](TopLevel.String.md)): void
  - : Sets the Electronic Commerce Indicator value.

    **Parameters:**
    - electronicCommerceIndicator - the ECI value


---

### setThreeDSResult(String)
- setThreeDSResult(threeDSResult: [String](TopLevel.String.md)): void
  - : Sets the 3D Secure authentication result.

    **Parameters:**
    - threeDSResult - the 3DS result

    **See Also:**
    - [THREE_DS_RESULT_AUTHENTICATED](dw.extensions.payments.SalesforceCardTransactionDetails.md#three_ds_result_authenticated)
    - [THREE_DS_RESULT_ATTEMPTED](dw.extensions.payments.SalesforceCardTransactionDetails.md#three_ds_result_attempted)
    - [THREE_DS_RESULT_FAILED](dw.extensions.payments.SalesforceCardTransactionDetails.md#three_ds_result_failed)
    - [THREE_DS_RESULT_REJECTED](dw.extensions.payments.SalesforceCardTransactionDetails.md#three_ds_result_rejected)
    - [THREE_DS_RESULT_UNAVAILABLE](dw.extensions.payments.SalesforceCardTransactionDetails.md#three_ds_result_unavailable)


---

### setThreeDSTransactionId(String)
- setThreeDSTransactionId(threeDSTransactionId: [String](TopLevel.String.md)): void
  - : Sets the 3D Secure transaction identifier.

    **Parameters:**
    - threeDSTransactionId - the 3DS transaction ID


---

### setThreeDSVersion(String)
- setThreeDSVersion(threeDSVersion: [String](TopLevel.String.md)): void
  - : Sets the 3D Secure protocol version.

    **Parameters:**
    - threeDSVersion - the 3DS version

    **See Also:**
    - [THREE_DS_VERSION_V1](dw.extensions.payments.SalesforceCardTransactionDetails.md#three_ds_version_v1)
    - [THREE_DS_VERSION_V2](dw.extensions.payments.SalesforceCardTransactionDetails.md#three_ds_version_v2)


---

<!-- prettier-ignore-end -->
