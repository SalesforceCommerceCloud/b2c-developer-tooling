<!-- prettier-ignore-start -->
# Class SalesforceCardPaymentDetails

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.extensions.payments.SalesforcePaymentDetails](dw.extensions.payments.SalesforcePaymentDetails.md)
    - [dw.extensions.payments.SalesforceCardPaymentDetails](dw.extensions.payments.SalesforceCardPaymentDetails.md)

Details to a payment of type [SalesforcePaymentDetails.TYPE_CARD](dw.extensions.payments.SalesforcePaymentDetails.md#type_card).


## Constant Summary

| Constant | Description |
| --- | --- |
| [BRAND_AMEX](#brand_amex): [String](TopLevel.String.md) = "amex" | Card brand constant: American Express. |
| [BRAND_DINERS](#brand_diners): [String](TopLevel.String.md) = "diners" | Card brand constant: Diners Club. |
| [BRAND_DISCOVER](#brand_discover): [String](TopLevel.String.md) = "discover" | Card brand constant: Discover. |
| [BRAND_JCB](#brand_jcb): [String](TopLevel.String.md) = "jcb" | Card brand constant: JCB. |
| [BRAND_MASTERCARD](#brand_mastercard): [String](TopLevel.String.md) = "mastercard" | Card brand constant: Mastercard. |
| [BRAND_UNIONPAY](#brand_unionpay): [String](TopLevel.String.md) = "unionpay" | Card brand constant: UnionPay. |
| [BRAND_UNKNOWN](#brand_unknown): [String](TopLevel.String.md) = "unknown" | Card brand constant: unknown or unrecognized brand. |
| [BRAND_VISA](#brand_visa): [String](TopLevel.String.md) = "visa" | Card brand constant: Visa. |
| [FUNDING_TYPE_CREDIT](#funding_type_credit): [String](TopLevel.String.md) = "CREDIT" | Card funding type constant: credit card. |
| [FUNDING_TYPE_DEBIT](#funding_type_debit): [String](TopLevel.String.md) = "DEBIT" | Card funding type constant: debit card. |
| [FUNDING_TYPE_PREPAID](#funding_type_prepaid): [String](TopLevel.String.md) = "PREPAID" | Card funding type constant: prepaid card. |
| [TOKEN_TYPE_GATEWAY](#token_type_gateway): [String](TopLevel.String.md) = "GATEWAY" | Token type constant: gateway token. |
| [TOKEN_TYPE_NETWORK](#token_type_network): [String](TopLevel.String.md) = "NETWORK" | Token type constant: network token. |
| [WALLET_TYPE_APPLE_PAY](#wallet_type_apple_pay): [String](TopLevel.String.md) = "apple_pay" | Wallet type constant: Apple Pay. |
| [WALLET_TYPE_GOOGLE_PAY](#wallet_type_google_pay): [String](TopLevel.String.md) = "google_pay" | Wallet type constant: Google Pay. |

## Property Summary

| Property | Description |
| --- | --- |
| [bin](#bin): [String](TopLevel.String.md) | Returns the Bank Identification Number (BIN), which is the first 6 to 8 digits of the card number, or  `null` if not known. |
| [brand](#brand): [String](TopLevel.String.md) | Returns the card brand, or `null` if not known. |
| [dpanLast4](#dpanlast4): [String](TopLevel.String.md) | Returns the last 4 digits of the Device PAN (DPAN) for tokenized wallet payments, or `null` if not  applicable or not known. |
| [expirationMonth](#expirationmonth): [Number](TopLevel.Number.md) | Returns the card expiration month (1-12), or `null` if not known. |
| [expirationYear](#expirationyear): [Number](TopLevel.Number.md) | Returns the card expiration year as a 4-digit integer, such as `2028`, or `null` if not  known. |
| [fundingType](#fundingtype): [String](TopLevel.String.md) | Returns the card funding type, or `null` if not known. |
| [issuingCountry](#issuingcountry): [String](TopLevel.String.md) | Returns the ISO-3166-1 alpha-2 country code of the card issuing bank, or `null` if not known. |
| [last4](#last4): [String](TopLevel.String.md) | Returns the last 4 digits of the card number, or `null` if not known. |
| [token](#token): [String](TopLevel.String.md) | Returns the reference token, or `null` if not known. |
| [tokenType](#tokentype): [String](TopLevel.String.md) | Returns the type of token backing the reference token, or `null` if not known. |
| [walletType](#wallettype): [String](TopLevel.String.md) | Returns the type of wallet used to make the card payment, or `null` if no wallet was used. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [SalesforceCardPaymentDetails](#salesforcecardpaymentdetails)() | Constructs an empty card payment details object. |

## Method Summary

| Method | Description |
| --- | --- |
| [getBin](dw.extensions.payments.SalesforceCardPaymentDetails.md#getbin)() | Returns the Bank Identification Number (BIN), which is the first 6 to 8 digits of the card number, or  `null` if not known. |
| [getBrand](dw.extensions.payments.SalesforceCardPaymentDetails.md#getbrand)() | Returns the card brand, or `null` if not known. |
| [getDpanLast4](dw.extensions.payments.SalesforceCardPaymentDetails.md#getdpanlast4)() | Returns the last 4 digits of the Device PAN (DPAN) for tokenized wallet payments, or `null` if not  applicable or not known. |
| [getExpirationMonth](dw.extensions.payments.SalesforceCardPaymentDetails.md#getexpirationmonth)() | Returns the card expiration month (1-12), or `null` if not known. |
| [getExpirationYear](dw.extensions.payments.SalesforceCardPaymentDetails.md#getexpirationyear)() | Returns the card expiration year as a 4-digit integer, such as `2028`, or `null` if not  known. |
| [getFundingType](dw.extensions.payments.SalesforceCardPaymentDetails.md#getfundingtype)() | Returns the card funding type, or `null` if not known. |
| [getIssuingCountry](dw.extensions.payments.SalesforceCardPaymentDetails.md#getissuingcountry)() | Returns the ISO-3166-1 alpha-2 country code of the card issuing bank, or `null` if not known. |
| [getLast4](dw.extensions.payments.SalesforceCardPaymentDetails.md#getlast4)() | Returns the last 4 digits of the card number, or `null` if not known. |
| [getToken](dw.extensions.payments.SalesforceCardPaymentDetails.md#gettoken)() | Returns the reference token, or `null` if not known. |
| [getTokenType](dw.extensions.payments.SalesforceCardPaymentDetails.md#gettokentype)() | Returns the type of token backing the reference token, or `null` if not known. |
| [getWalletType](dw.extensions.payments.SalesforceCardPaymentDetails.md#getwallettype)() | Returns the type of wallet used to make the card payment, or `null` if no wallet was used. |
| [setBin](dw.extensions.payments.SalesforceCardPaymentDetails.md#setbinstring)([String](TopLevel.String.md)) | Sets the Bank Identification Number (BIN), which is the first 6 to 8 digits of the card number. |
| [setBrand](dw.extensions.payments.SalesforceCardPaymentDetails.md#setbrandstring)([String](TopLevel.String.md)) | Sets the card brand. |
| [setDpanLast4](dw.extensions.payments.SalesforceCardPaymentDetails.md#setdpanlast4string)([String](TopLevel.String.md)) | Sets the last 4 digits of the Device PAN (DPAN) for tokenized wallet payments. |
| [setExpirationMonth](dw.extensions.payments.SalesforceCardPaymentDetails.md#setexpirationmonthnumber)([Number](TopLevel.Number.md)) | Sets the card expiration month (1-12). |
| [setExpirationYear](dw.extensions.payments.SalesforceCardPaymentDetails.md#setexpirationyearnumber)([Number](TopLevel.Number.md)) | Sets the card expiration year as a 4-digit integer, such as `2028`. |
| [setFundingType](dw.extensions.payments.SalesforceCardPaymentDetails.md#setfundingtypestring)([String](TopLevel.String.md)) | Sets the card funding type. |
| [setIssuingCountry](dw.extensions.payments.SalesforceCardPaymentDetails.md#setissuingcountrystring)([String](TopLevel.String.md)) | Sets the ISO-3166-1 alpha-2 country code of the card issuing bank. |
| [setLast4](dw.extensions.payments.SalesforceCardPaymentDetails.md#setlast4string)([String](TopLevel.String.md)) | Sets the last 4 digits of the card number. |
| [setToken](dw.extensions.payments.SalesforceCardPaymentDetails.md#settokenstring)([String](TopLevel.String.md)) | Sets the reference token. |
| [setTokenType](dw.extensions.payments.SalesforceCardPaymentDetails.md#settokentypestring)([String](TopLevel.String.md)) | Sets the type of token backing the reference token. |
| [setWalletType](dw.extensions.payments.SalesforceCardPaymentDetails.md#setwallettypestring)([String](TopLevel.String.md)) | Sets the type of wallet used to make the card payment. |

### Methods inherited from class SalesforcePaymentDetails

[getType](dw.extensions.payments.SalesforcePaymentDetails.md#gettype)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### BRAND_AMEX

- BRAND_AMEX: [String](TopLevel.String.md) = "amex"
  - : Card brand constant: American Express.


---

### BRAND_DINERS

- BRAND_DINERS: [String](TopLevel.String.md) = "diners"
  - : Card brand constant: Diners Club.


---

### BRAND_DISCOVER

- BRAND_DISCOVER: [String](TopLevel.String.md) = "discover"
  - : Card brand constant: Discover.


---

### BRAND_JCB

- BRAND_JCB: [String](TopLevel.String.md) = "jcb"
  - : Card brand constant: JCB.


---

### BRAND_MASTERCARD

- BRAND_MASTERCARD: [String](TopLevel.String.md) = "mastercard"
  - : Card brand constant: Mastercard.


---

### BRAND_UNIONPAY

- BRAND_UNIONPAY: [String](TopLevel.String.md) = "unionpay"
  - : Card brand constant: UnionPay.


---

### BRAND_UNKNOWN

- BRAND_UNKNOWN: [String](TopLevel.String.md) = "unknown"
  - : Card brand constant: unknown or unrecognized brand.


---

### BRAND_VISA

- BRAND_VISA: [String](TopLevel.String.md) = "visa"
  - : Card brand constant: Visa.


---

### FUNDING_TYPE_CREDIT

- FUNDING_TYPE_CREDIT: [String](TopLevel.String.md) = "CREDIT"
  - : Card funding type constant: credit card.


---

### FUNDING_TYPE_DEBIT

- FUNDING_TYPE_DEBIT: [String](TopLevel.String.md) = "DEBIT"
  - : Card funding type constant: debit card.


---

### FUNDING_TYPE_PREPAID

- FUNDING_TYPE_PREPAID: [String](TopLevel.String.md) = "PREPAID"
  - : Card funding type constant: prepaid card.


---

### TOKEN_TYPE_GATEWAY

- TOKEN_TYPE_GATEWAY: [String](TopLevel.String.md) = "GATEWAY"
  - : Token type constant: gateway token.


---

### TOKEN_TYPE_NETWORK

- TOKEN_TYPE_NETWORK: [String](TopLevel.String.md) = "NETWORK"
  - : Token type constant: network token.


---

### WALLET_TYPE_APPLE_PAY

- WALLET_TYPE_APPLE_PAY: [String](TopLevel.String.md) = "apple_pay"
  - : Wallet type constant: Apple Pay.


---

### WALLET_TYPE_GOOGLE_PAY

- WALLET_TYPE_GOOGLE_PAY: [String](TopLevel.String.md) = "google_pay"
  - : Wallet type constant: Google Pay.


---

## Property Details

### bin
- bin: [String](TopLevel.String.md)
  - : Returns the Bank Identification Number (BIN), which is the first 6 to 8 digits of the card number, or
      `null` if not known. This is _not_ the full card number (PAN).



---

### brand
- brand: [String](TopLevel.String.md)
  - : Returns the card brand, or `null` if not known.

    **See Also:**
    - [BRAND_AMEX](dw.extensions.payments.SalesforceCardPaymentDetails.md#brand_amex)
    - [BRAND_DINERS](dw.extensions.payments.SalesforceCardPaymentDetails.md#brand_diners)
    - [BRAND_DISCOVER](dw.extensions.payments.SalesforceCardPaymentDetails.md#brand_discover)
    - [BRAND_JCB](dw.extensions.payments.SalesforceCardPaymentDetails.md#brand_jcb)
    - [BRAND_MASTERCARD](dw.extensions.payments.SalesforceCardPaymentDetails.md#brand_mastercard)
    - [BRAND_UNIONPAY](dw.extensions.payments.SalesforceCardPaymentDetails.md#brand_unionpay)
    - [BRAND_VISA](dw.extensions.payments.SalesforceCardPaymentDetails.md#brand_visa)
    - [BRAND_UNKNOWN](dw.extensions.payments.SalesforceCardPaymentDetails.md#brand_unknown)


---

### dpanLast4
- dpanLast4: [String](TopLevel.String.md)
  - : Returns the last 4 digits of the Device PAN (DPAN) for tokenized wallet payments, or `null` if not
      applicable or not known. The DPAN is a device-specific token card number used by wallets such as Apple Pay and
      Google Pay. It is distinct from the funding card's actual card number (PAN). The DPAN is a separate number that
      identifies the tokenized representation on the device.



---

### expirationMonth
- expirationMonth: [Number](TopLevel.Number.md)
  - : Returns the card expiration month (1-12), or `null` if not known.


---

### expirationYear
- expirationYear: [Number](TopLevel.Number.md)
  - : Returns the card expiration year as a 4-digit integer, such as `2028`, or `null` if not
      known.



---

### fundingType
- fundingType: [String](TopLevel.String.md)
  - : Returns the card funding type, or `null` if not known.

    **See Also:**
    - [FUNDING_TYPE_CREDIT](dw.extensions.payments.SalesforceCardPaymentDetails.md#funding_type_credit)
    - [FUNDING_TYPE_DEBIT](dw.extensions.payments.SalesforceCardPaymentDetails.md#funding_type_debit)
    - [FUNDING_TYPE_PREPAID](dw.extensions.payments.SalesforceCardPaymentDetails.md#funding_type_prepaid)


---

### issuingCountry
- issuingCountry: [String](TopLevel.String.md)
  - : Returns the ISO-3166-1 alpha-2 country code of the card issuing bank, or `null` if not known.


---

### last4
- last4: [String](TopLevel.String.md)
  - : Returns the last 4 digits of the card number, or `null` if not known.


---

### token
- token: [String](TopLevel.String.md)
  - : Returns the reference token, or `null` if not known. This is _not_ the card number (PAN). It is an
      opaque identifier referencing the card.



---

### tokenType
- tokenType: [String](TopLevel.String.md)
  - : Returns the type of token backing the reference token, or `null` if not known.

    **See Also:**
    - [TOKEN_TYPE_NETWORK](dw.extensions.payments.SalesforceCardPaymentDetails.md#token_type_network)
    - [TOKEN_TYPE_GATEWAY](dw.extensions.payments.SalesforceCardPaymentDetails.md#token_type_gateway)


---

### walletType
- walletType: [String](TopLevel.String.md)
  - : Returns the type of wallet used to make the card payment, or `null` if no wallet was used.

    **See Also:**
    - [WALLET_TYPE_APPLE_PAY](dw.extensions.payments.SalesforceCardPaymentDetails.md#wallet_type_apple_pay)
    - [WALLET_TYPE_GOOGLE_PAY](dw.extensions.payments.SalesforceCardPaymentDetails.md#wallet_type_google_pay)


---

## Constructor Details

### SalesforceCardPaymentDetails()
- SalesforceCardPaymentDetails()
  - : Constructs an empty card payment details object.


---

## Method Details

### getBin()
- getBin(): [String](TopLevel.String.md)
  - : Returns the Bank Identification Number (BIN), which is the first 6 to 8 digits of the card number, or
      `null` if not known. This is _not_ the full card number (PAN).


    **Returns:**
    - BIN (first 6-8 digits of the card number)


---

### getBrand()
- getBrand(): [String](TopLevel.String.md)
  - : Returns the card brand, or `null` if not known.

    **Returns:**
    - card brand

    **See Also:**
    - [BRAND_AMEX](dw.extensions.payments.SalesforceCardPaymentDetails.md#brand_amex)
    - [BRAND_DINERS](dw.extensions.payments.SalesforceCardPaymentDetails.md#brand_diners)
    - [BRAND_DISCOVER](dw.extensions.payments.SalesforceCardPaymentDetails.md#brand_discover)
    - [BRAND_JCB](dw.extensions.payments.SalesforceCardPaymentDetails.md#brand_jcb)
    - [BRAND_MASTERCARD](dw.extensions.payments.SalesforceCardPaymentDetails.md#brand_mastercard)
    - [BRAND_UNIONPAY](dw.extensions.payments.SalesforceCardPaymentDetails.md#brand_unionpay)
    - [BRAND_VISA](dw.extensions.payments.SalesforceCardPaymentDetails.md#brand_visa)
    - [BRAND_UNKNOWN](dw.extensions.payments.SalesforceCardPaymentDetails.md#brand_unknown)


---

### getDpanLast4()
- getDpanLast4(): [String](TopLevel.String.md)
  - : Returns the last 4 digits of the Device PAN (DPAN) for tokenized wallet payments, or `null` if not
      applicable or not known. The DPAN is a device-specific token card number used by wallets such as Apple Pay and
      Google Pay. It is distinct from the funding card's actual card number (PAN). The DPAN is a separate number that
      identifies the tokenized representation on the device.


    **Returns:**
    - last 4 digits of the device PAN for tokenized wallet payments


---

### getExpirationMonth()
- getExpirationMonth(): [Number](TopLevel.Number.md)
  - : Returns the card expiration month (1-12), or `null` if not known.

    **Returns:**
    - card expiration month (1-12)


---

### getExpirationYear()
- getExpirationYear(): [Number](TopLevel.Number.md)
  - : Returns the card expiration year as a 4-digit integer, such as `2028`, or `null` if not
      known.


    **Returns:**
    - card expiration year (4-digit)


---

### getFundingType()
- getFundingType(): [String](TopLevel.String.md)
  - : Returns the card funding type, or `null` if not known.

    **Returns:**
    - card funding type

    **See Also:**
    - [FUNDING_TYPE_CREDIT](dw.extensions.payments.SalesforceCardPaymentDetails.md#funding_type_credit)
    - [FUNDING_TYPE_DEBIT](dw.extensions.payments.SalesforceCardPaymentDetails.md#funding_type_debit)
    - [FUNDING_TYPE_PREPAID](dw.extensions.payments.SalesforceCardPaymentDetails.md#funding_type_prepaid)


---

### getIssuingCountry()
- getIssuingCountry(): [String](TopLevel.String.md)
  - : Returns the ISO-3166-1 alpha-2 country code of the card issuing bank, or `null` if not known.

    **Returns:**
    - issuing country code, such as `"US"`


---

### getLast4()
- getLast4(): [String](TopLevel.String.md)
  - : Returns the last 4 digits of the card number, or `null` if not known.

    **Returns:**
    - last 4 digits of the card number


---

### getToken()
- getToken(): [String](TopLevel.String.md)
  - : Returns the reference token, or `null` if not known. This is _not_ the card number (PAN). It is an
      opaque identifier referencing the card.


    **Returns:**
    - reference token


---

### getTokenType()
- getTokenType(): [String](TopLevel.String.md)
  - : Returns the type of token backing the reference token, or `null` if not known.

    **Returns:**
    - token type

    **See Also:**
    - [TOKEN_TYPE_NETWORK](dw.extensions.payments.SalesforceCardPaymentDetails.md#token_type_network)
    - [TOKEN_TYPE_GATEWAY](dw.extensions.payments.SalesforceCardPaymentDetails.md#token_type_gateway)


---

### getWalletType()
- getWalletType(): [String](TopLevel.String.md)
  - : Returns the type of wallet used to make the card payment, or `null` if no wallet was used.

    **Returns:**
    - wallet type, or `null` if no wallet was used

    **See Also:**
    - [WALLET_TYPE_APPLE_PAY](dw.extensions.payments.SalesforceCardPaymentDetails.md#wallet_type_apple_pay)
    - [WALLET_TYPE_GOOGLE_PAY](dw.extensions.payments.SalesforceCardPaymentDetails.md#wallet_type_google_pay)


---

### setBin(String)
- setBin(bin: [String](TopLevel.String.md)): void
  - : Sets the Bank Identification Number (BIN), which is the first 6 to 8 digits of the card number. Do not set the
      full card number (PAN).


    **Parameters:**
    - bin - BIN (first 6-8 digits of the card number)


---

### setBrand(String)
- setBrand(brand: [String](TopLevel.String.md)): void
  - : Sets the card brand.

    **Parameters:**
    - brand - card brand

    **See Also:**
    - [BRAND_AMEX](dw.extensions.payments.SalesforceCardPaymentDetails.md#brand_amex)
    - [BRAND_DINERS](dw.extensions.payments.SalesforceCardPaymentDetails.md#brand_diners)
    - [BRAND_DISCOVER](dw.extensions.payments.SalesforceCardPaymentDetails.md#brand_discover)
    - [BRAND_JCB](dw.extensions.payments.SalesforceCardPaymentDetails.md#brand_jcb)
    - [BRAND_MASTERCARD](dw.extensions.payments.SalesforceCardPaymentDetails.md#brand_mastercard)
    - [BRAND_UNIONPAY](dw.extensions.payments.SalesforceCardPaymentDetails.md#brand_unionpay)
    - [BRAND_VISA](dw.extensions.payments.SalesforceCardPaymentDetails.md#brand_visa)
    - [BRAND_UNKNOWN](dw.extensions.payments.SalesforceCardPaymentDetails.md#brand_unknown)


---

### setDpanLast4(String)
- setDpanLast4(dpanLast4: [String](TopLevel.String.md)): void
  - : Sets the last 4 digits of the Device PAN (DPAN) for tokenized wallet payments. Do not set the card number (PAN).
      The DPAN is a separate number that identifies the tokenized representation on the device.


    **Parameters:**
    - dpanLast4 - last 4 digits of the device PAN for tokenized wallet payments


---

### setExpirationMonth(Number)
- setExpirationMonth(expirationMonth: [Number](TopLevel.Number.md)): void
  - : Sets the card expiration month (1-12).

    **Parameters:**
    - expirationMonth - card expiration month (1-12)


---

### setExpirationYear(Number)
- setExpirationYear(expirationYear: [Number](TopLevel.Number.md)): void
  - : Sets the card expiration year as a 4-digit integer, such as `2028`.

    **Parameters:**
    - expirationYear - card expiration year (4-digit)


---

### setFundingType(String)
- setFundingType(fundingType: [String](TopLevel.String.md)): void
  - : Sets the card funding type.

    **Parameters:**
    - fundingType - card funding type

    **See Also:**
    - [FUNDING_TYPE_CREDIT](dw.extensions.payments.SalesforceCardPaymentDetails.md#funding_type_credit)
    - [FUNDING_TYPE_DEBIT](dw.extensions.payments.SalesforceCardPaymentDetails.md#funding_type_debit)
    - [FUNDING_TYPE_PREPAID](dw.extensions.payments.SalesforceCardPaymentDetails.md#funding_type_prepaid)


---

### setIssuingCountry(String)
- setIssuingCountry(issuingCountry: [String](TopLevel.String.md)): void
  - : Sets the ISO-3166-1 alpha-2 country code of the card issuing bank.

    **Parameters:**
    - issuingCountry - issuing country code, such as `"US"`


---

### setLast4(String)
- setLast4(last4: [String](TopLevel.String.md)): void
  - : Sets the last 4 digits of the card number.

    **Parameters:**
    - last4 - last 4 digits of the card number


---

### setToken(String)
- setToken(token: [String](TopLevel.String.md)): void
  - : Sets the reference token. Do not set the card number (PAN). This is an opaque identifier referencing the card.

    **Parameters:**
    - token - reference token


---

### setTokenType(String)
- setTokenType(tokenType: [String](TopLevel.String.md)): void
  - : Sets the type of token backing the reference token.

    **Parameters:**
    - tokenType - token type

    **See Also:**
    - [TOKEN_TYPE_NETWORK](dw.extensions.payments.SalesforceCardPaymentDetails.md#token_type_network)
    - [TOKEN_TYPE_GATEWAY](dw.extensions.payments.SalesforceCardPaymentDetails.md#token_type_gateway)


---

### setWalletType(String)
- setWalletType(walletType: [String](TopLevel.String.md)): void
  - : Sets the type of wallet used to make the card payment.

    **Parameters:**
    - walletType - wallet type

    **See Also:**
    - [WALLET_TYPE_APPLE_PAY](dw.extensions.payments.SalesforceCardPaymentDetails.md#wallet_type_apple_pay)
    - [WALLET_TYPE_GOOGLE_PAY](dw.extensions.payments.SalesforceCardPaymentDetails.md#wallet_type_google_pay)


---

<!-- prettier-ignore-end -->
