<!-- prettier-ignore-start -->
# Class WSUtil

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.ws.WSUtil](dw.ws.WSUtil.md)

A utility class for performing SOAP-based operations for Web Services
for use with [WebReference2](dw.ws.WebReference2.md). This class provides
methods for setting SOAP headers and a set of constants representing the
well-known supported header names. You also use this class to set connection and request
timeout values for Web Service calls.


**See Also:**
- [WebReference2](dw.ws.WebReference2.md)
- [Port](dw.ws.Port.md)


## Constant Summary

| Constant | Description |
| --- | --- |
| [KEY_ID_TYPE_DIRECT_REFERENCE](#key_id_type_direct_reference): [String](TopLevel.String.md) = "DirectReference" | This key identifier method is used when the X.509 Certificate is included in the message. |
| [KEY_ID_TYPE_ENC_KEY_SHA1](#key_id_type_enc_key_sha1): [String](TopLevel.String.md) = "EncryptedKeySHA1" | This Key Identifier method only applies for Encryption. |
| [KEY_ID_TYPE_ISSUE_SERIAL](#key_id_type_issue_serial): [String](TopLevel.String.md) = "IssuerSerial" | This key identifier method means that the Issuer Name and Serial Number of a X.509  Certificate is included directly in the KeyInfo Element. |
| [KEY_ID_TYPE_SKI_IDENTIFIER](#key_id_type_ski_identifier): [String](TopLevel.String.md) = "SKIKeyIdentifier" | This Key Identifier method refers to a Certificate via a Base-64 encoding of the  Subject Key Identifier. |
| [KEY_ID_TYPE_THUMBPRINT](#key_id_type_thumbprint): [String](TopLevel.String.md) = "Thumbprint" | This Key Identifier method refers to the Certificate via a SHA-1 Thumbprint. |
| [KEY_ID_TYPE_X509_KEY_IDENTIFIER](#key_id_type_x509_key_identifier): [String](TopLevel.String.md) = "X509KeyIdentifier" | This key identifier method is similar to KEY\_ID\_TYPE\_DIRECT\_REFERENCE, in that the certificate is  included in the request. |
| [WS_ACTION](#ws_action): [String](TopLevel.String.md) = "action" | WS-Security action property name. |
| [WS_ENCRYPT](#ws_encrypt): [String](TopLevel.String.md) = "Encrypt" | WS-Security action: Encrypt the message. |
| [WS_ENCRYPTION_PARTS](#ws_encryption_parts): [String](TopLevel.String.md) = "encryptionParts" | WS-Security Encryption: Defines which parts of the request shall be encrypted. |
| [WS_ENCRYPTION_USER](#ws_encryption_user): [String](TopLevel.String.md) = "encryptionUser" | WS-Security Encryption: The user's name for encryption. |
| [WS_ENC_KEY_ID](#ws_enc_key_id): [String](TopLevel.String.md) = "encryptionKeyIdentifier" | Defines which key identifier type to use for encryption. |
| [WS_ENC_PROP_KEYSTORE_ALIAS](#ws_enc_prop_keystore_alias): [String](TopLevel.String.md) = "__EncryptionPropKeystoreAlias" | WS-Security Encryption: The encryption and decryption keystore alias name |
| [WS_ENC_PROP_KEYSTORE_PW](#ws_enc_prop_keystore_pw): [String](TopLevel.String.md) = "__EncryptionPropKeystorePassword" | WS-Security Encryption: The encryption and decryption keystore password |
| [WS_ENC_PROP_KEYSTORE_TYPE](#ws_enc_prop_keystore_type): [String](TopLevel.String.md) = "__EncryptionPropKeystoreType" | WS-Security Encryption: The signature keystore type ( jks, pkcs12, or managed ). |
| [WS_NO_SECURITY](#ws_no_security): [String](TopLevel.String.md) = "NoSecurity" | WS-Security action: No security. |
| [WS_PASSWORD_TYPE](#ws_password_type): [String](TopLevel.String.md) = "passwordType" | WS-Security password type: Parameter for UsernameToken action to define the encoding  of the password. |
| [WS_PW_DIGEST](#ws_pw_digest): [String](TopLevel.String.md) = "PasswordDigest" | WS-Security password type "digest": Use a password digest to send the password information. |
| [WS_PW_TEXT](#ws_pw_text): [String](TopLevel.String.md) = "PasswordText" | WS-Security password type "text": Send the password information in clear. |
| [WS_SECRETS_MAP](#ws_secrets_map): [String](TopLevel.String.md) = "__SecretsMap" | A secrets map with the username and password entries needed to create the password  callback object. |
| [WS_SIGNATURE](#ws_signature): [String](TopLevel.String.md) = "Signature" | WS-Security action: Sign the message. |
| [WS_SIGNATURE_PARTS](#ws_signature_parts): [String](TopLevel.String.md) = "signatureParts" | WS-Security Signature: Defines which parts of the request shall be signed. |
| [WS_SIGNATURE_USER](#ws_signature_user): [String](TopLevel.String.md) = "signatureUser" | WS-Security Signature: The user's name for signature. |
| [WS_SIG_DIGEST_ALGO](#ws_sig_digest_algo): [String](TopLevel.String.md) = "signatureDigestAlgorithm" | WS-Security Signature: Defines which signature digest algorithm to use. |
| [WS_SIG_KEY_ID](#ws_sig_key_id): [String](TopLevel.String.md) = "signatureKeyIdentifier" | Defines which key identifier type to use for signature. |
| [WS_SIG_PROP_KEYSTORE_ALIAS](#ws_sig_prop_keystore_alias): [String](TopLevel.String.md) = "__SignaturePropKeystoreAlias" | WS-Security Signature: The signature keystore alias name. |
| [WS_SIG_PROP_KEYSTORE_PW](#ws_sig_prop_keystore_pw): [String](TopLevel.String.md) = "__SignaturePropKeystorePassword" | WS-Security Signature: The signature keystore password. |
| [WS_SIG_PROP_KEYSTORE_TYPE](#ws_sig_prop_keystore_type): [String](TopLevel.String.md) = "__SignaturePropKeystoreType" | WS-Security: The signature keystore type ( jks, pkcs12, or managed ). |
| [WS_TIMESTAMP](#ws_timestamp): [String](TopLevel.String.md) = "Timestamp" | WS-Security action: Add a timestamp to the security header. |
| [WS_USER](#ws_user): [String](TopLevel.String.md) = "user" | WS-Security user name. |
| [WS_USERNAME_TOKEN](#ws_username_token): [String](TopLevel.String.md) = "UsernameToken" | WS-Security action: Add a UsernameToken identification. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [WSUtil](#wsutil)() |  |

## Method Summary

| Method | Description |
| --- | --- |
| static [addSOAPHeader](dw.ws.WSUtil.md#addsoapheaderobject-object-boolean-string)([Object](TopLevel.Object.md), [Object](TopLevel.Object.md), [Boolean](TopLevel.Boolean.md), [String](TopLevel.String.md)) | Adds a header element to the SOAP Header. |
| static [addSOAPHeader](dw.ws.WSUtil.md#addsoapheaderobject-string-boolean-string)([Object](TopLevel.Object.md), [String](TopLevel.String.md), [Boolean](TopLevel.Boolean.md), [String](TopLevel.String.md)) | Adds a header element to the SOAP Header. |
| static [clearSOAPHeaders](dw.ws.WSUtil.md#clearsoapheadersobject)([Object](TopLevel.Object.md)) | Removes all SOAP header elements from the port's request context. |
| static [createHolder](dw.ws.WSUtil.md#createholderobject)([Object](TopLevel.Object.md)) | Creates an javax.xml.ws.Holder instance that wraps the specified element. |
| static [getConnectionTimeout](dw.ws.WSUtil.md#getconnectiontimeoutobject)([Object](TopLevel.Object.md)) | Returns the connection timeout value for the port. |
| static [getHTTPRequestHeader](dw.ws.WSUtil.md#gethttprequestheaderobject-string)([Object](TopLevel.Object.md), [String](TopLevel.String.md)) | Returns an HTTP request header property value using the specified key. |
| static [getProperty](dw.ws.WSUtil.md#getpropertystring-object)([String](TopLevel.String.md), [Object](TopLevel.Object.md)) | Returns the value of the SOAP request property using the specified key on a port  returned from one of the WebReference2 getService methods. |
| static [getRequestTimeout](dw.ws.WSUtil.md#getrequesttimeoutobject)([Object](TopLevel.Object.md)) | Returns the read timeout value for a request made on the specified port. |
| static [getResponseProperty](dw.ws.WSUtil.md#getresponsepropertystring-object)([String](TopLevel.String.md), [Object](TopLevel.Object.md)) | Returns the property value using the specified key and on a port returned from one of  the WebReference2 getService methods. |
| static [isAllowChunking](dw.ws.WSUtil.md#isallowchunkingobject)([Object](TopLevel.Object.md)) | Returns true if the HTTP request may be chunked, false otherwise |
| static [setAllowChunking](dw.ws.WSUtil.md#setallowchunkingobject-boolean)([Object](TopLevel.Object.md), [Boolean](TopLevel.Boolean.md)) | Indicate that HTTP chunked Transfer-Encoding may be used. |
| static [setConnectionTimeout](dw.ws.WSUtil.md#setconnectiontimeoutnumber-object)([Number](TopLevel.Number.md), [Object](TopLevel.Object.md)) | Sets the connection timeout for the port. |
| static [setHTTPRequestHeader](dw.ws.WSUtil.md#sethttprequestheaderobject-string-string)([Object](TopLevel.Object.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Sets an HTTP request header property using the specified key and value. |
| static [setProperty](dw.ws.WSUtil.md#setpropertystring-object-object)([String](TopLevel.String.md), [Object](TopLevel.Object.md), [Object](TopLevel.Object.md)) | Set the SOAP request property using the specified key and value on a port  returned from one of the WebReference2 getService() methods. |
| static [setRequestTimeout](dw.ws.WSUtil.md#setrequesttimeoutnumber-object)([Number](TopLevel.Number.md), [Object](TopLevel.Object.md)) | Sets the read timeout value for a request made on the specified port. |
| static [setUserNamePassword](dw.ws.WSUtil.md#setusernamepasswordstring-string-object)([String](TopLevel.String.md), [String](TopLevel.String.md), [Object](TopLevel.Object.md)) | Set the user name and password to use with Basic authentication. |
| static [setWSSecurityConfig](dw.ws.WSUtil.md#setwssecurityconfigobject-object-object)([Object](TopLevel.Object.md), [Object](TopLevel.Object.md), [Object](TopLevel.Object.md)) | Set the WS-Security configuration for the request and response based on the  constants defined (see above). |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### KEY_ID_TYPE_DIRECT_REFERENCE

- KEY_ID_TYPE_DIRECT_REFERENCE: [String](TopLevel.String.md) = "DirectReference"
  - : This key identifier method is used when the X.509 Certificate is included in the message.
      The certificate is Base-64 encoded and included in the request via a BinarySecurityToken element


    **See Also:**
    - [WS_ENC_KEY_ID](dw.ws.WSUtil.md#ws_enc_key_id)
    - [WS_SIG_KEY_ID](dw.ws.WSUtil.md#ws_sig_key_id)


---

### KEY_ID_TYPE_ENC_KEY_SHA1

- KEY_ID_TYPE_ENC_KEY_SHA1: [String](TopLevel.String.md) = "EncryptedKeySHA1"
  - : This Key Identifier method only applies for Encryption. Unlike the previous methods
      it refers to the way the EncryptedData references the EncryptedKey Element,
      rather than the way the EncryptedKey Element refers to the public key.


    **See Also:**
    - [WS_ENC_KEY_ID](dw.ws.WSUtil.md#ws_enc_key_id)


---

### KEY_ID_TYPE_ISSUE_SERIAL

- KEY_ID_TYPE_ISSUE_SERIAL: [String](TopLevel.String.md) = "IssuerSerial"
  - : This key identifier method means that the Issuer Name and Serial Number of a X.509
      Certificate is included directly in the KeyInfo Element.


    **See Also:**
    - [WS_ENC_KEY_ID](dw.ws.WSUtil.md#ws_enc_key_id)
    - [WS_SIG_KEY_ID](dw.ws.WSUtil.md#ws_sig_key_id)


---

### KEY_ID_TYPE_SKI_IDENTIFIER

- KEY_ID_TYPE_SKI_IDENTIFIER: [String](TopLevel.String.md) = "SKIKeyIdentifier"
  - : This Key Identifier method refers to a Certificate via a Base-64 encoding of the
      Subject Key Identifier.


    **See Also:**
    - [WS_ENC_KEY_ID](dw.ws.WSUtil.md#ws_enc_key_id)
    - [WS_SIG_KEY_ID](dw.ws.WSUtil.md#ws_sig_key_id)


---

### KEY_ID_TYPE_THUMBPRINT

- KEY_ID_TYPE_THUMBPRINT: [String](TopLevel.String.md) = "Thumbprint"
  - : This Key Identifier method refers to the Certificate via a SHA-1 Thumbprint.
      The certificate may or may not be included in the request.


    **See Also:**
    - [WS_ENC_KEY_ID](dw.ws.WSUtil.md#ws_enc_key_id)
    - [WS_SIG_KEY_ID](dw.ws.WSUtil.md#ws_sig_key_id)


---

### KEY_ID_TYPE_X509_KEY_IDENTIFIER

- KEY_ID_TYPE_X509_KEY_IDENTIFIER: [String](TopLevel.String.md) = "X509KeyIdentifier"
  - : This key identifier method is similar to KEY\_ID\_TYPE\_DIRECT\_REFERENCE, in that the certificate is
      included in the request. However, instead of referring to a certificate, the certificate is
      included directly in the KeyInfo element.


    **See Also:**
    - [WS_ENC_KEY_ID](dw.ws.WSUtil.md#ws_enc_key_id)
    - [WS_SIG_KEY_ID](dw.ws.WSUtil.md#ws_sig_key_id)


---

### WS_ACTION

- WS_ACTION: [String](TopLevel.String.md) = "action"
  - : WS-Security action property name.
      Allowed property values are WS\_NO\_SECURITY, WS\_TIMESTAMP, WS\_ENCRYPT,
      WS\_SIGNATURE, WS\_USERNAME\_TOKEN or a space separated list of these values.



---

### WS_ENCRYPT

- WS_ENCRYPT: [String](TopLevel.String.md) = "Encrypt"
  - : WS-Security action: Encrypt the message.
      The encryption specific parameters define how to encrypt.



---

### WS_ENCRYPTION_PARTS

- WS_ENCRYPTION_PARTS: [String](TopLevel.String.md) = "encryptionParts"
  - : WS-Security Encryption: Defines which parts of the request shall be encrypted.


---

### WS_ENCRYPTION_USER

- WS_ENCRYPTION_USER: [String](TopLevel.String.md) = "encryptionUser"
  - : WS-Security Encryption: The user's name for encryption.


---

### WS_ENC_KEY_ID

- WS_ENC_KEY_ID: [String](TopLevel.String.md) = "encryptionKeyIdentifier"
  - : Defines which key identifier type to use for encryption. Permissible
      values are:
      
      - `KEY_ID_TYPE_ISSUE_SERIAL`(default value)
      - `KEY_ID_TYPE_DIRECT_REFERENCE`
      - `KEY_ID_TYPE_X509_KEY_IDENTIFIER`
      - `KEY_ID_TYPE_THUMBPRINT`
      - `KEY_ID_TYPE_SKI_IDENTIFIER`
      - `KEY_ID_TYPE_ENC_KEY_SHA1`


    **See Also:**
    - [KEY_ID_TYPE_ISSUE_SERIAL](dw.ws.WSUtil.md#key_id_type_issue_serial)
    - [KEY_ID_TYPE_DIRECT_REFERENCE](dw.ws.WSUtil.md#key_id_type_direct_reference)
    - [KEY_ID_TYPE_X509_KEY_IDENTIFIER](dw.ws.WSUtil.md#key_id_type_x509_key_identifier)
    - [KEY_ID_TYPE_THUMBPRINT](dw.ws.WSUtil.md#key_id_type_thumbprint)
    - [KEY_ID_TYPE_SKI_IDENTIFIER](dw.ws.WSUtil.md#key_id_type_ski_identifier)
    - [KEY_ID_TYPE_ENC_KEY_SHA1](dw.ws.WSUtil.md#key_id_type_enc_key_sha1)


---

### WS_ENC_PROP_KEYSTORE_ALIAS

- WS_ENC_PROP_KEYSTORE_ALIAS: [String](TopLevel.String.md) = "__EncryptionPropKeystoreAlias"
  - : WS-Security Encryption: The encryption and decryption keystore alias name


---

### WS_ENC_PROP_KEYSTORE_PW

- WS_ENC_PROP_KEYSTORE_PW: [String](TopLevel.String.md) = "__EncryptionPropKeystorePassword"
  - : WS-Security Encryption: The encryption and decryption keystore password


---

### WS_ENC_PROP_KEYSTORE_TYPE

- WS_ENC_PROP_KEYSTORE_TYPE: [String](TopLevel.String.md) = "__EncryptionPropKeystoreType"
  - : WS-Security Encryption: The signature keystore type ( jks, pkcs12, or managed ).
      
      
      The default is jks.
      
      
      The "managed" type will resolve aliases against the names of certificates and keys in Business Manager.
      
      
      Note: For non-managed types, the keystore file has the basename of the WSDL file and the
      file extension based on the keystore type (e.g. MyService.jks).
      The keystore file has to be placed in the same cartridge directory
      as the WSDL file.



---

### WS_NO_SECURITY

- WS_NO_SECURITY: [String](TopLevel.String.md) = "NoSecurity"
  - : WS-Security action: No security.


---

### WS_PASSWORD_TYPE

- WS_PASSWORD_TYPE: [String](TopLevel.String.md) = "passwordType"
  - : WS-Security password type: Parameter for UsernameToken action to define the encoding
      of the password. Allowed values are PW\_DIGEST or PW\_TEXT.



---

### WS_PW_DIGEST

- WS_PW_DIGEST: [String](TopLevel.String.md) = "PasswordDigest"
  - : WS-Security password type "digest": Use a password digest to send the password information.


---

### WS_PW_TEXT

- WS_PW_TEXT: [String](TopLevel.String.md) = "PasswordText"
  - : WS-Security password type "text": Send the password information in clear.


---

### WS_SECRETS_MAP

- WS_SECRETS_MAP: [String](TopLevel.String.md) = "__SecretsMap"
  - : A secrets map with the username and password entries needed to create the password
      callback object.



---

### WS_SIGNATURE

- WS_SIGNATURE: [String](TopLevel.String.md) = "Signature"
  - : WS-Security action: Sign the message.
      The signature specific parameters define how to sign and which keys
      to use.



---

### WS_SIGNATURE_PARTS

- WS_SIGNATURE_PARTS: [String](TopLevel.String.md) = "signatureParts"
  - : WS-Security Signature: Defines which parts of the request shall be signed.


---

### WS_SIGNATURE_USER

- WS_SIGNATURE_USER: [String](TopLevel.String.md) = "signatureUser"
  - : WS-Security Signature: The user's name for signature.


---

### WS_SIG_DIGEST_ALGO

- WS_SIG_DIGEST_ALGO: [String](TopLevel.String.md) = "signatureDigestAlgorithm"
  - : WS-Security Signature: Defines which signature digest algorithm to use.


---

### WS_SIG_KEY_ID

- WS_SIG_KEY_ID: [String](TopLevel.String.md) = "signatureKeyIdentifier"
  - : Defines which key identifier type to use for signature.
      
      Permissible values are:
      
      - `KEY_ID_TYPE_ISSUE_SERIAL`
      - `KEY_ID_TYPE_DIRECT_REFERENCE`(default value)
      - `KEY_ID_TYPE_X509_KEY_ID_IDENTIFIER`
      - `KEY_ID_TYPE_THUMBPRINT`
      - `KEY_ID_TYPE_SKI_IDENTIFIER`


    **See Also:**
    - [KEY_ID_TYPE_ISSUE_SERIAL](dw.ws.WSUtil.md#key_id_type_issue_serial)
    - [KEY_ID_TYPE_DIRECT_REFERENCE](dw.ws.WSUtil.md#key_id_type_direct_reference)
    - [KEY_ID_TYPE_X509_KEY_IDENTIFIER](dw.ws.WSUtil.md#key_id_type_x509_key_identifier)
    - [KEY_ID_TYPE_THUMBPRINT](dw.ws.WSUtil.md#key_id_type_thumbprint)
    - [KEY_ID_TYPE_SKI_IDENTIFIER](dw.ws.WSUtil.md#key_id_type_ski_identifier)


---

### WS_SIG_PROP_KEYSTORE_ALIAS

- WS_SIG_PROP_KEYSTORE_ALIAS: [String](TopLevel.String.md) = "__SignaturePropKeystoreAlias"
  - : WS-Security Signature: The signature keystore alias name.


---

### WS_SIG_PROP_KEYSTORE_PW

- WS_SIG_PROP_KEYSTORE_PW: [String](TopLevel.String.md) = "__SignaturePropKeystorePassword"
  - : WS-Security Signature: The signature keystore password.


---

### WS_SIG_PROP_KEYSTORE_TYPE

- WS_SIG_PROP_KEYSTORE_TYPE: [String](TopLevel.String.md) = "__SignaturePropKeystoreType"
  - : WS-Security: The signature keystore type ( jks, pkcs12, or managed ).
      
      
      The default is jks.
      
      
      The "managed" type will resolve aliases against the names of certificates and keys in Business Manager.
      
      
      Note: For non-managed types, the keystore file has the basename of the WSDL file and the
      file extension based on the keystore type (e.g. MyService.jks).
      The keystore file has to be placed in the same cartridge directory
      as the WSDL file.



---

### WS_TIMESTAMP

- WS_TIMESTAMP: [String](TopLevel.String.md) = "Timestamp"
  - : WS-Security action: Add a timestamp to the security header.


---

### WS_USER

- WS_USER: [String](TopLevel.String.md) = "user"
  - : WS-Security user name.


---

### WS_USERNAME_TOKEN

- WS_USERNAME_TOKEN: [String](TopLevel.String.md) = "UsernameToken"
  - : WS-Security action: Add a UsernameToken identification.


---

## Constructor Details

### WSUtil()
- WSUtil()
  - : 


---

## Method Details

### addSOAPHeader(Object, Object, Boolean, String)
- static addSOAPHeader(port: [Object](TopLevel.Object.md), xml: [Object](TopLevel.Object.md), mustUnderstand: [Boolean](TopLevel.Boolean.md), actor: [String](TopLevel.String.md)): void
  - : Adds a header element to the SOAP Header. Each header element should be XML and
      it should typically contain a namespace URI.


    **Parameters:**
    - port - the port.
    - xml - the header element XML. The XML should contain a namespace URI.
    - mustUnderstand - directs target endpoint to validate payload.
    - actor - an URI that identifies that intended recipient of this header element.


---

### addSOAPHeader(Object, String, Boolean, String)
- static addSOAPHeader(port: [Object](TopLevel.Object.md), xml: [String](TopLevel.String.md), mustUnderstand: [Boolean](TopLevel.Boolean.md), actor: [String](TopLevel.String.md)): void
  - : Adds a header element to the SOAP Header. Each header element should be XML and
      it should typically contain a namespace URI.


    **Parameters:**
    - port - the port.
    - xml - the header element XML as a String. The XML should contain a namespace URI.
    - mustUnderstand - directs target endpoint to validate payload.
    - actor - an URI that identifies that intended recipient of this header element.


---

### clearSOAPHeaders(Object)
- static clearSOAPHeaders(port: [Object](TopLevel.Object.md)): void
  - : Removes all SOAP header elements from the port's request context.

    **Parameters:**
    - port - a port returned from one of the WebReference2 getService methods.

    **See Also:**
    - [WebReference2](dw.ws.WebReference2.md)
    - [Port](dw.ws.Port.md)


---

### createHolder(Object)
- static createHolder(element: [Object](TopLevel.Object.md)): [Object](TopLevel.Object.md)
  - : Creates an javax.xml.ws.Holder instance that wraps the specified element. When a WSDL operation is
      defined to have an input and output message using the same type, the operation may require the operation's
      object to be wrapped in a holder.


    **Parameters:**
    - element - the element to be wrapped in the Holder.

    **Returns:**
    - the holder.


---

### getConnectionTimeout(Object)
- static getConnectionTimeout(port: [Object](TopLevel.Object.md)): [Number](TopLevel.Number.md)
  - : Returns the connection timeout value for the port.

    **Parameters:**
    - port - a port returned from one of the WebReference2 getService methods.

    **Returns:**
    - the connection timeout value.

    **See Also:**
    - [WebReference2](dw.ws.WebReference2.md)
    - [Port](dw.ws.Port.md)


---

### getHTTPRequestHeader(Object, String)
- static getHTTPRequestHeader(port: [Object](TopLevel.Object.md), key: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Returns an HTTP request header property value using the specified key. Null is returned
      if the key does not represent an HTTP header property.


    **Parameters:**
    - port - a port returned from one of the WebReference2 getService methods.
    - key - the header property key.

    **Returns:**
    - an HTTP request header property value using the specified key or null.


---

### getProperty(String, Object)
- static getProperty(key: [String](TopLevel.String.md), port: [Object](TopLevel.Object.md)): [Object](TopLevel.Object.md)
  - : Returns the value of the SOAP request property using the specified key on a port
      returned from one of the WebReference2 getService methods. The property
      keys are defined as constants in [Port](dw.ws.Port.md).


    **Parameters:**
    - key - the key to use.
    - port - the port on which the property is set.

    **Returns:**
    - the property using the specified key and port.

    **See Also:**
    - [WebReference2](dw.ws.WebReference2.md)
    - [Port](dw.ws.Port.md)


---

### getRequestTimeout(Object)
- static getRequestTimeout(port: [Object](TopLevel.Object.md)): [Number](TopLevel.Number.md)
  - : Returns the read timeout value for a request made on the specified port.
      If the request exceeds the timeout value, an error is thrown.


    **Parameters:**
    - port - a port returned from one of the WebReference2 getService methods.

    **Returns:**
    - the request timeout value for the port.

    **See Also:**
    - [WebReference2](dw.ws.WebReference2.md)
    - [Port](dw.ws.Port.md)


---

### getResponseProperty(String, Object)
- static getResponseProperty(key: [String](TopLevel.String.md), port: [Object](TopLevel.Object.md)): [Object](TopLevel.Object.md)
  - : Returns the property value using the specified key and on a port returned from one of
      the WebReference2 getService methods.


    **Parameters:**
    - key - the key to use.
    - port - the port on which the property is set

    **Returns:**
    - the property using the specified key and port.

    **See Also:**
    - [WebReference2](dw.ws.WebReference2.md)
    - [Port](dw.ws.Port.md)


---

### isAllowChunking(Object)
- static isAllowChunking(port: [Object](TopLevel.Object.md)): [Boolean](TopLevel.Boolean.md)
  - : Returns true if the HTTP request may be chunked, false otherwise

    **Parameters:**
    - port - a port returned from one of the WebReference2 getService methods.

    **Returns:**
    - returns true if the HTTP request may be chunked and false otherwise


---

### setAllowChunking(Object, Boolean)
- static setAllowChunking(port: [Object](TopLevel.Object.md), allow: [Boolean](TopLevel.Boolean.md)): void
  - : Indicate that HTTP chunked Transfer-Encoding may be used.
      
      
      The default behavior is true. If false then the request will not
      be chunked and the Content-Length will always be sent.


    **Parameters:**
    - port - a port returned from one of the WebReference2 getService methods.
    - allow - true to enable chunking, false otherwise


---

### setConnectionTimeout(Number, Object)
- static setConnectionTimeout(timeoutInMilliseconds: [Number](TopLevel.Number.md), port: [Object](TopLevel.Object.md)): void
  - : Sets the connection timeout for the port.

    **Parameters:**
    - timeoutInMilliseconds - the connection timeout.
    - port - a port returned from one of the WebReference2 getService methods.

    **See Also:**
    - [WebReference2](dw.ws.WebReference2.md)
    - [Port](dw.ws.Port.md)


---

### setHTTPRequestHeader(Object, String, String)
- static setHTTPRequestHeader(port: [Object](TopLevel.Object.md), key: [String](TopLevel.String.md), value: [String](TopLevel.String.md)): void
  - : Sets an HTTP request header property using the specified key and value.

    **Parameters:**
    - port - a port returned from one of the WebReference2 getService methods.
    - key - the header property key.
    - value - the header property value. If the value is null, the property  identified by the key is removed from the HTTP request header.


---

### setProperty(String, Object, Object)
- static setProperty(key: [String](TopLevel.String.md), value: [Object](TopLevel.Object.md), port: [Object](TopLevel.Object.md)): void
  - : Set the SOAP request property using the specified key and value on a port
      returned from one of the WebReference2 getService() methods. The property
      keys are defined as constants in [Port](dw.ws.Port.md).


    **Parameters:**
    - key - the key to use.
    - value - the value.
    - port - the port on which the property is set.

    **See Also:**
    - [WebReference2](dw.ws.WebReference2.md)
    - [Port](dw.ws.Port.md)


---

### setRequestTimeout(Number, Object)
- static setRequestTimeout(timeoutInMilliseconds: [Number](TopLevel.Number.md), port: [Object](TopLevel.Object.md)): void
  - : Sets the read timeout value for a request made on the specified port.
      If the request exceeds the timeout value, an error is thrown.


    **Parameters:**
    - timeoutInMilliseconds - the timeout.
    - port - a port returned from one of the WebReference2 getService methods.

    **See Also:**
    - [WebReference2](dw.ws.WebReference2.md)
    - [Port](dw.ws.Port.md)


---

### setUserNamePassword(String, String, Object)
- static setUserNamePassword(userName: [String](TopLevel.String.md), password: [String](TopLevel.String.md), port: [Object](TopLevel.Object.md)): void
  - : Set the user name and password to use with Basic authentication. For stronger
      authentication, use the [setWSSecurityConfig(Object, Object, Object)](dw.ws.WSUtil.md#setwssecurityconfigobject-object-object) method.


    **Parameters:**
    - userName - the user name.
    - password - the password.
    - port - a port returned from one of the WebReference2 getService methods.

    **See Also:**
    - [setWSSecurityConfig(Object, Object, Object)](dw.ws.WSUtil.md#setwssecurityconfigobject-object-object)
    - [WebReference2](dw.ws.WebReference2.md)
    - [Port](dw.ws.Port.md)


---

### setWSSecurityConfig(Object, Object, Object)
- static setWSSecurityConfig(port: [Object](TopLevel.Object.md), requestConfigMap: [Object](TopLevel.Object.md), responseConfigMap: [Object](TopLevel.Object.md)): void
  - : Set the WS-Security configuration for the request and response based on the
      constants defined (see above).


    **Parameters:**
    - port - a port returned from one of the WebReference2 getService methods.
    - requestConfigMap - the WS-Security request configuration.
    - responseConfigMap - the WS-Security response configuration.

    **See Also:**
    - [WebReference2](dw.ws.WebReference2.md)
    - [Port](dw.ws.Port.md)


---

<!-- prettier-ignore-end -->
