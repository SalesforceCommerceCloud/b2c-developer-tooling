<!-- prettier-ignore-start -->
# Class SOAPUtil

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.rpc.SOAPUtil](dw.rpc.SOAPUtil.md)

Utility class for working with SOAP web services.  This class provides
methods for setting SOAP headers and a set of constants representing the
supported header names.

If you want to use ws-security features, such as signing and encryption,
with your RPC-style SOAP web service, use this class to construct a HashMap with
security constants and values.

**Note:** this method handles sensitive security-related data.
Pay special attention to PCI DSS v3. requirements 2, 4, and 12.
The following example configures the ws-security actions taken for the request and response to a web service.
 

```
importPackage( dw.system );
importPackage( dw.util );
importPackage( dw.rpc );


function execute( args : PipelineDictionary ) : Number
{
    var WSU_NS : String = "http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd";

    try
    {

    // define a map with all the secrets
    var secretsMap   : Map = new HashMap();
    secretsMap.put("myclientkey", "ckpass");
    secretsMap.put("myservicekey", "ckpass");
    secretsMap.put("username", "password");

    var requestCfg   : Map = new HashMap();

    // define the ws actions to be performed
    requestCfg.put(SOAPUtil.WS_ACTION, SOAPUtil.WS_USERNAME_TOKEN + " " +
                                       SOAPUtil.WS_TIMESTAMP + " " +
                                       SOAPUtil.WS_SIGNATURE + " " +
                                       SOAPUtil.WS_ENCRYPT);
    requestCfg.put(SOAPUtil.WS_USER, "username");
    requestCfg.put(SOAPUtil.WS_PASSWORD_TYPE, SOAPUtil.WS_PW_DIGEST );
    requestCfg.put(SOAPUtil.WS_SIG_DIGEST_ALGO, "http://www.w3.org/2001/04/xmlenc#sha256" );

    // define signature properties
    // the keystore file has the basename of the WSDL file and the
    // file extension based on the keystore type (e.g. HelloWorld.jks).
    // The keystore file has to be placed beside the WSDL file.
    requestCfg.put(SOAPUtil.WS_SIG_PROP_KEYSTORE_TYPE, "jks");
    requestCfg.put(SOAPUtil.WS_SIG_PROP_KEYSTORE_PW, "cspass");
    requestCfg.put(SOAPUtil.WS_SIG_PROP_KEYSTORE_ALIAS, "myclientkey");

    requestCfg.put(SOAPUtil.WS_SIGNATURE_USER, "myclientkey");

    // define enrcryption properties
    requestCfg.put(SOAPUtil.WS_ENC_PROP_KEYSTORE_TYPE, "jks");
    requestCfg.put(SOAPUtil.WS_ENC_PROP_KEYSTORE_PW, "cspass");
    requestCfg.put(SOAPUtil.WS_ENC_PROP_KEYSTORE_ALIAS, "myservicekey");

    requestCfg.put(SOAPUtil.WS_ENCRYPTION_USER, "myservicekey");
    requestCfg.put(SOAPUtil.WS_SIGNATURE_PARTS, "{Element}{http://schemas.xmlsoap.org/soap/envelope/}Body");
    requestCfg.put(SOAPUtil.WS_ENCRYPTION_PARTS,"{Element}{" + WSU_NS + "}
     Timestamp;"+"{Content}{http://schemas.xmlsoap.org/soap/envelope/}Body");

    // set the secrets for the callback
    requestCfg.put(SOAPUtil.WS_SECRETS_MAP, secretsMap);

    var responseCfg : Map = new HashMap();

    // define the ws actions to be performed for the response
    responseCfg.put(SOAPUtil.WS_ACTION, SOAPUtil.WS_TIMESTAMP + " " +
                                        SOAPUtil.WS_SIGNATURE + " " +
                                        SOAPUtil.WS_ENCRYPT);

    // define signature properties
    responseCfg.put(SOAPUtil.WS_SIG_PROP_KEYSTORE_TYPE, "jks");
    responseCfg.put(SOAPUtil.WS_SIG_PROP_KEYSTORE_PW, "cspass");
    responseCfg.put(SOAPUtil.WS_SIG_PROP_KEYSTORE_ALIAS, "myservicekey");

    responseCfg.put(SOAPUtil.WS_SIGNATURE_USER, "myservicekey");

    // define decryption properties
    responseCfg.put(SOAPUtil.WS_ENC_PROP_KEYSTORE_TYPE, "jks");
    responseCfg.put(SOAPUtil.WS_ENC_PROP_KEYSTORE_PW, "cspass");
    responseCfg.put(SOAPUtil.WS_ENC_PROP_KEYSTORE_ALIAS, "myclientkey");

    responseCfg.put(SOAPUtil.WS_ENCRYPTION_USER, "myclientkey");

    // set the secrets for the callback
    responseCfg.put(SOAPUtil.WS_SECRETS_MAP, secretsMap);

    // get the service and stub
    var helloWorldService : WebReference = webreferences.HelloWorld;
    var stub : Stub = helloWorldService.defaultService;
    // set the security
    SOAPUtil.setWSSecurityConfig(stub, requestCfg, responseCfg);
        //var h : Hello = new helloWorldService.Hello();
        var h = new helloWorldService.com.support.ws.security.test.Hello2();

        h.setName('Send Text from client Axis ...');

        // call the web service
        var response  = stub.hello2(h);
        //var response = stub.hello(h);
        var result = response.getHello2Return();


    args.OutStr = result;
    Logger.error("Hello World We Are SIGNED old version Send Text from client ...", result);

    return PIPELET_NEXT;

    }
    catch (e)
    {
        Logger.error("Error in helloWorldRpc.ds is: " + e);
        return PIPELET_ERROR;
    }

}
```


**See Also:**
- [Stub](dw.rpc.Stub.md)
- [WebReference](dw.rpc.WebReference.md)

**Deprecated:**
:::warning
This class is deprecated, please use webreferences2 instead (see also [WSUtil](dw.ws.WSUtil.md)).
:::

## Constant Summary

| Constant | Description |
| --- | --- |
| ~~[WS_ACTION](#ws_action): [String](TopLevel.String.md) = "action"~~ | WS-Security action property name. |
| ~~[WS_ENCRYPT](#ws_encrypt): [String](TopLevel.String.md) = "Encrypt"~~ | WS-Security action: encrypt the message. |
| ~~[WS_ENCRYPTION_PARTS](#ws_encryption_parts): [String](TopLevel.String.md) = "encryptionParts"~~ | WS-Security encryption: defines which parts of the request are encrypted. |
| ~~[WS_ENCRYPTION_USER](#ws_encryption_user): [String](TopLevel.String.md) = "encryptionUser"~~ | WS-Security encryption: the user's name for encryption. |
| ~~[WS_ENC_PROP_KEYSTORE_ALIAS](#ws_enc_prop_keystore_alias): [String](TopLevel.String.md) = "__EncryptionPropKeystoreAlias"~~ | WS-Security encryption: the encryption/decryption keystore alias name |
| ~~[WS_ENC_PROP_KEYSTORE_PW](#ws_enc_prop_keystore_pw): [String](TopLevel.String.md) = "__EncryptionPropKeystorePassword"~~ | WS-Security encryption: the encryption/decryption keystore password |
| ~~[WS_ENC_PROP_KEYSTORE_TYPE](#ws_enc_prop_keystore_type): [String](TopLevel.String.md) = "__EncryptionPropKeystoreType"~~ | WS-Security encryption: the encryption/decryption keystore type ( jks or pkcs12 ),                          default is jks. |
| ~~[WS_NO_SECURITY](#ws_no_security): [String](TopLevel.String.md) = "NoSecurity"~~ | WS-Security action: no security |
| ~~[WS_PASSWORD_TYPE](#ws_password_type): [String](TopLevel.String.md) = "passwordType"~~ | WS-Security password type: parameter for UsernameToken action to define the encoding  of the password. |
| ~~[WS_PW_DIGEST](#ws_pw_digest): [String](TopLevel.String.md) = "PasswordDigest"~~ | WS-Security password of type digest: use a password digest to send the password information. |
| ~~[WS_PW_TEXT](#ws_pw_text): [String](TopLevel.String.md) = "PasswordText"~~ | WS-Security password of type text: send the password information in clear text. |
| ~~[WS_SECRETS_MAP](#ws_secrets_map): [String](TopLevel.String.md) = "__SecretsMap"~~ | A secrets map with the username/password entries is needed to create the password  callback object. |
| ~~[WS_SIGNATURE](#ws_signature): [String](TopLevel.String.md) = "Signature"~~ | WS-Security action: sign the message. |
| ~~[WS_SIGNATURE_PARTS](#ws_signature_parts): [String](TopLevel.String.md) = "signatureParts"~~ | WS-Security signature: defines which parts of the request are signed. |
| ~~[WS_SIGNATURE_USER](#ws_signature_user): [String](TopLevel.String.md) = "signatureUser"~~ | WS-Security signature: the user's name for signature. |
| ~~[WS_SIG_DIGEST_ALGO](#ws_sig_digest_algo): [String](TopLevel.String.md) = "signatureDigestAlgorithm"~~ | WS-Security signature: sets the signature digest algorithm to use. |
| ~~[WS_SIG_PROP_KEYSTORE_ALIAS](#ws_sig_prop_keystore_alias): [String](TopLevel.String.md) = "__SignaturePropKeystoreAlias"~~ | WS-Security signature: the signature keystore alias name |
| ~~[WS_SIG_PROP_KEYSTORE_PW](#ws_sig_prop_keystore_pw): [String](TopLevel.String.md) = "__SignaturePropKeystorePassword"~~ | WS-Security signature: the signature keystore password. |
| ~~[WS_SIG_PROP_KEYSTORE_TYPE](#ws_sig_prop_keystore_type): [String](TopLevel.String.md) = "__SignaturePropKeystoreType"~~ | WS-Security: the signature keystore type ( jks or pkcs12 ). |
| ~~[WS_TIMESTAMP](#ws_timestamp): [String](TopLevel.String.md) = "Timestamp"~~ | WS-Security action: add a timestamp to the security header. |
| ~~[WS_USER](#ws_user): [String](TopLevel.String.md) = "user"~~ | WS-Security user name. |
| ~~[WS_USERNAME_TOKEN](#ws_username_token): [String](TopLevel.String.md) = "UsernameToken"~~ | WS-Security action: add a UsernameToken identification. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [SOAPUtil](#soaputil)() |  |

## Method Summary

| Method | Description |
| --- | --- |
| ~~static [getHTTPRequestHeader](dw.rpc.SOAPUtil.md#gethttprequestheaderobject-string)([Object](TopLevel.Object.md), [String](TopLevel.String.md))~~ | Returns an HTTP request header property value using the specified key. |
| ~~static [getHTTPResponseHeader](dw.rpc.SOAPUtil.md#gethttpresponseheaderobject-string)([Object](TopLevel.Object.md), [String](TopLevel.String.md))~~ | Returns an HTTP response header property value using the specified key. |
| ~~static [setHTTPRequestHeader](dw.rpc.SOAPUtil.md#sethttprequestheaderobject-string-string)([Object](TopLevel.Object.md), [String](TopLevel.String.md), [String](TopLevel.String.md))~~ | Sets an HTTP request header property using the specified key and value. |
| ~~static [setHeader](dw.rpc.SOAPUtil.md#setheaderobject-string)([Object](TopLevel.Object.md), [String](TopLevel.String.md))~~ | Sets a new SOAPHeaderElement in the SOAP request with the namespace of  the XML content. |
| ~~static [setHeader](dw.rpc.SOAPUtil.md#setheaderobject-string-boolean)([Object](TopLevel.Object.md), [String](TopLevel.String.md), [Boolean](TopLevel.Boolean.md))~~ | Sets a new SOAPHeaderElement in the SOAP request  with the namespace of  the XML content. |
| ~~static [setHeader](dw.rpc.SOAPUtil.md#setheaderobject-string-string-object)([Object](TopLevel.Object.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Object](TopLevel.Object.md))~~ | Creates a new SOAPHeaderElement with the name and namespace and places  the given XML into it. |
| ~~static [setHeader](dw.rpc.SOAPUtil.md#setheaderobject-string-string-object-boolean)([Object](TopLevel.Object.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Object](TopLevel.Object.md), [Boolean](TopLevel.Boolean.md))~~ | Creates a new SOAPHeaderElement with the name and namespace and places  the given XML into it. |
| ~~static [setHeader](dw.rpc.SOAPUtil.md#setheaderobject-string-string-object-boolean-string)([Object](TopLevel.Object.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Object](TopLevel.Object.md), [Boolean](TopLevel.Boolean.md), [String](TopLevel.String.md))~~ | Creates a new SOAPHeaderElement with the name and namespace and places  the given XML into it. |
| ~~static [setHeader](dw.rpc.SOAPUtil.md#setheaderobject-string-string-string)([Object](TopLevel.Object.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md))~~ | Creates a new SOAPHeaderElement with the name and namespace and places  the given XML into it. |
| ~~static [setHeader](dw.rpc.SOAPUtil.md#setheaderobject-string-string-string-boolean)([Object](TopLevel.Object.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Boolean](TopLevel.Boolean.md))~~ | Creates a new SOAPHeaderElement with the name and namespace and places  the given XML into it. |
| ~~static [setHeader](dw.rpc.SOAPUtil.md#setheaderobject-string-string-string-boolean-string)([Object](TopLevel.Object.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Boolean](TopLevel.Boolean.md), [String](TopLevel.String.md))~~ | Creates a new SOAPHeaderElement with the name and namespace and places  the given XML into it. |
| ~~static [setWSSecurityConfig](dw.rpc.SOAPUtil.md#setwssecurityconfigobject-object-object)([Object](TopLevel.Object.md), [Object](TopLevel.Object.md), [Object](TopLevel.Object.md))~~ | Sets the WS-Security configuration for the request and response based on the  constants defined. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### WS_ACTION

- ~~WS_ACTION: [String](TopLevel.String.md) = "action"~~
  - : WS-Security action property name.
      Allowed property values are WS\_NO\_SECURITY, WS\_TIMESTAMP, WS\_ENCRYPT, WS\_SIGNATURE, WS\_USERNAME\_TOKEN or
      a space separated String with multiple values.


    **Deprecated:**
:::warning
use webreferences2 instead
:::

---

### WS_ENCRYPT

- ~~WS_ENCRYPT: [String](TopLevel.String.md) = "Encrypt"~~
  - : WS-Security action: encrypt the message.
      The encryption-specific parameters define how to encrypt, which keys
      to use, and other parameters.


    **Deprecated:**
:::warning
use webreferences2 instead
:::

---

### WS_ENCRYPTION_PARTS

- ~~WS_ENCRYPTION_PARTS: [String](TopLevel.String.md) = "encryptionParts"~~
  - : WS-Security encryption: defines which parts of the request are encrypted.

    **Deprecated:**
:::warning
use webreferences2 instead
:::

---

### WS_ENCRYPTION_USER

- ~~WS_ENCRYPTION_USER: [String](TopLevel.String.md) = "encryptionUser"~~
  - : WS-Security encryption: the user's name for encryption.

    **Deprecated:**
:::warning
use webreferences2 instead
:::

---

### WS_ENC_PROP_KEYSTORE_ALIAS

- ~~WS_ENC_PROP_KEYSTORE_ALIAS: [String](TopLevel.String.md) = "__EncryptionPropKeystoreAlias"~~
  - : WS-Security encryption: the encryption/decryption keystore alias name

    **Deprecated:**
:::warning
use webreferences2 instead
:::

---

### WS_ENC_PROP_KEYSTORE_PW

- ~~WS_ENC_PROP_KEYSTORE_PW: [String](TopLevel.String.md) = "__EncryptionPropKeystorePassword"~~
  - : WS-Security encryption: the encryption/decryption keystore password

    **Deprecated:**
:::warning
use webreferences2 instead
:::

---

### WS_ENC_PROP_KEYSTORE_TYPE

- ~~WS_ENC_PROP_KEYSTORE_TYPE: [String](TopLevel.String.md) = "__EncryptionPropKeystoreType"~~
  - : WS-Security encryption: the encryption/decryption keystore type ( jks or pkcs12 ),
                              default is jks.
      
      **Note:** the keystore file must have the basename of the WSDL file and the
      file extension based on the keystore type. For example: MyService.jks.
      The keystore file must be placed in the same cartridge directory
      as the WSDL file.


    **Deprecated:**
:::warning
use webreferences2 instead
:::

---

### WS_NO_SECURITY

- ~~WS_NO_SECURITY: [String](TopLevel.String.md) = "NoSecurity"~~
  - : WS-Security action: no security

    **Deprecated:**
:::warning
use webreferences2 instead
:::

---

### WS_PASSWORD_TYPE

- ~~WS_PASSWORD_TYPE: [String](TopLevel.String.md) = "passwordType"~~
  - : WS-Security password type: parameter for UsernameToken action to define the encoding
      of the password. Allowed values are PW\_DIGEST or PW\_TEXT.


    **Deprecated:**
:::warning
use webreferences2 instead
:::

---

### WS_PW_DIGEST

- ~~WS_PW_DIGEST: [String](TopLevel.String.md) = "PasswordDigest"~~
  - : WS-Security password of type digest: use a password digest to send the password information.

    **Deprecated:**
:::warning
use webreferences2 instead
:::

---

### WS_PW_TEXT

- ~~WS_PW_TEXT: [String](TopLevel.String.md) = "PasswordText"~~
  - : WS-Security password of type text: send the password information in clear text.

    **Deprecated:**
:::warning
use webreferences2 instead
:::

---

### WS_SECRETS_MAP

- ~~WS_SECRETS_MAP: [String](TopLevel.String.md) = "__SecretsMap"~~
  - : A secrets map with the username/password entries is needed to create the password
      callback object.


    **Deprecated:**
:::warning
use webreferences2 instead
:::

---

### WS_SIGNATURE

- ~~WS_SIGNATURE: [String](TopLevel.String.md) = "Signature"~~
  - : WS-Security action: sign the message.
      The signature-specific parameters define how to sign, which keys
      to use, and other parameters.


    **Deprecated:**
:::warning
use webreferences2 instead
:::

---

### WS_SIGNATURE_PARTS

- ~~WS_SIGNATURE_PARTS: [String](TopLevel.String.md) = "signatureParts"~~
  - : WS-Security signature: defines which parts of the request are signed.

    **Deprecated:**
:::warning
use webreferences2 instead
:::

---

### WS_SIGNATURE_USER

- ~~WS_SIGNATURE_USER: [String](TopLevel.String.md) = "signatureUser"~~
  - : WS-Security signature: the user's name for signature.

    **Deprecated:**
:::warning
use webreferences2 instead
:::

---

### WS_SIG_DIGEST_ALGO

- ~~WS_SIG_DIGEST_ALGO: [String](TopLevel.String.md) = "signatureDigestAlgorithm"~~
  - : WS-Security signature: sets the signature digest algorithm to use.

    **Deprecated:**
:::warning
use webreferences2 instead
:::

---

### WS_SIG_PROP_KEYSTORE_ALIAS

- ~~WS_SIG_PROP_KEYSTORE_ALIAS: [String](TopLevel.String.md) = "__SignaturePropKeystoreAlias"~~
  - : WS-Security signature: the signature keystore alias name

    **Deprecated:**
:::warning
use webreferences2 instead
:::

---

### WS_SIG_PROP_KEYSTORE_PW

- ~~WS_SIG_PROP_KEYSTORE_PW: [String](TopLevel.String.md) = "__SignaturePropKeystorePassword"~~
  - : WS-Security signature: the signature keystore password.

    **Deprecated:**
:::warning
use webreferences2 instead
:::

---

### WS_SIG_PROP_KEYSTORE_TYPE

- ~~WS_SIG_PROP_KEYSTORE_TYPE: [String](TopLevel.String.md) = "__SignaturePropKeystoreType"~~
  - : WS-Security: the signature keystore type ( jks or pkcs12 ). The default is jks.
      
      **Note:** The keystore file must have the basename of the WSDL file and the
      file extension of the keystore type. For example: MyService.jks.
      The keystore file must be placed in the same cartridge directory
      as the WSDL file.


    **Deprecated:**
:::warning
use webreferences2 instead
:::

---

### WS_TIMESTAMP

- ~~WS_TIMESTAMP: [String](TopLevel.String.md) = "Timestamp"~~
  - : WS-Security action: add a timestamp to the security header.

    **Deprecated:**
:::warning
use webreferences2 instead
:::

---

### WS_USER

- ~~WS_USER: [String](TopLevel.String.md) = "user"~~
  - : WS-Security user name.

    **Deprecated:**
:::warning
use webreferences2 instead
:::

---

### WS_USERNAME_TOKEN

- ~~WS_USERNAME_TOKEN: [String](TopLevel.String.md) = "UsernameToken"~~
  - : WS-Security action: add a UsernameToken identification.

    **Deprecated:**
:::warning
use webreferences2 instead
:::

---

## Constructor Details

### SOAPUtil()
- SOAPUtil()
  - : 


---

## Method Details

### getHTTPRequestHeader(Object, String)
- ~~static getHTTPRequestHeader(svc: [Object](TopLevel.Object.md), key: [String](TopLevel.String.md)): [String](TopLevel.String.md)~~
  - : Returns an HTTP request header property value using the specified key. Null is returned
      if the key does not represent an HTTP header property.


    **Parameters:**
    - svc - a service stub returned from getService().
    - key - the header property key.

    **Returns:**
    - an HTTP request header property value using the specified key or null.

    **Deprecated:**
:::warning
use webreferences2 instead
:::

---

### getHTTPResponseHeader(Object, String)
- ~~static getHTTPResponseHeader(svc: [Object](TopLevel.Object.md), key: [String](TopLevel.String.md)): [String](TopLevel.String.md)~~
  - : Returns an HTTP response header property value using the specified key. Null is returned
      if the key does not represent an HTTP response header property.


    **Parameters:**
    - svc - a service stub returned from getService().
    - key - the header property key.

    **Returns:**
    - an HTTP response header property value using the specified key or null.

    **Deprecated:**
:::warning
use webreferences2 instead
:::

---

### setHTTPRequestHeader(Object, String, String)
- ~~static setHTTPRequestHeader(svc: [Object](TopLevel.Object.md), key: [String](TopLevel.String.md), value: [String](TopLevel.String.md)): void~~
  - : Sets an HTTP request header property using the specified key and value.

    **Parameters:**
    - svc - a service stub returned from getService().
    - key - the header property key.
    - value - the header property value. If the value is null, the property  identified by the key is removed from the HTTP request header.

    **Deprecated:**
:::warning
use webreferences2 instead
:::

---

### setHeader(Object, String)
- ~~static setHeader(svc: [Object](TopLevel.Object.md), xml: [String](TopLevel.String.md)): void~~
  - : Sets a new SOAPHeaderElement in the SOAP request with the namespace of
      the XML content.


    **Parameters:**
    - svc - a service stub returned from getService()
    - xml - a string with arbitrary XML content

    **Deprecated:**
:::warning
use webreferences2 instead
:::

---

### setHeader(Object, String, Boolean)
- ~~static setHeader(svc: [Object](TopLevel.Object.md), xml: [String](TopLevel.String.md), mustUnderstand: [Boolean](TopLevel.Boolean.md)): void~~
  - : Sets a new SOAPHeaderElement in the SOAP request  with the namespace of
      the XML content.


    **Parameters:**
    - svc - a service stub returned from getService()
    - xml - a string with arbitrary XML content
    - mustUnderstand - sets the SOAP header attribute 'mustUnderstand'

    **Deprecated:**
:::warning
use webreferences2 instead
:::

---

### setHeader(Object, String, String, Object)
- ~~static setHeader(svc: [Object](TopLevel.Object.md), namespace: [String](TopLevel.String.md), name: [String](TopLevel.String.md), xml: [Object](TopLevel.Object.md)): void~~
  - : Creates a new SOAPHeaderElement with the name and namespace and places
      the given XML into it.


    **Parameters:**
    - svc - a service stub returned from getService()
    - namespace - the namespace of the header element
    - name - the element name for the header element
    - xml - a E4X XML object

    **Deprecated:**
:::warning
use webreferences2 instead
:::

---

### setHeader(Object, String, String, Object, Boolean)
- ~~static setHeader(svc: [Object](TopLevel.Object.md), namespace: [String](TopLevel.String.md), name: [String](TopLevel.String.md), xml: [Object](TopLevel.Object.md), mustUnderstand: [Boolean](TopLevel.Boolean.md)): void~~
  - : Creates a new SOAPHeaderElement with the name and namespace and places
      the given XML into it.


    **Parameters:**
    - svc - a service stub returned from getService()
    - namespace - the namespace of the header element
    - name - the element name for the header element
    - xml - a E4X XML object
    - mustUnderstand - sets the SOAP header attribute mustUnderstand

    **Deprecated:**
:::warning
use webreferences2 instead
:::

---

### setHeader(Object, String, String, Object, Boolean, String)
- ~~static setHeader(svc: [Object](TopLevel.Object.md), namespace: [String](TopLevel.String.md), name: [String](TopLevel.String.md), xml: [Object](TopLevel.Object.md), mustUnderstand: [Boolean](TopLevel.Boolean.md), actor: [String](TopLevel.String.md)): void~~
  - : Creates a new SOAPHeaderElement with the name and namespace and places
      the given XML into it.
      
      
      ```
      var usernameToken : XML =
        <wsse:UsernameToken xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
            <wsse:Username>{merchantID}</wsse:Username>
            <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">
                {merchantPassword}
            </wsse:Password>
        </wsse:UsernameToken>
      SOAPUtil.setHeader( service, "http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd",
       "Security", usernameToken, true, null
      ```


    **Parameters:**
    - svc - a service stub returned from getService()
    - namespace - the namespace of the header element
    - name - the element name for the header element
    - xml - a E4X XML object
    - mustUnderstand - sets the SOAP header attribute 'mustUnderstand'
    - actor - the SOAP actor, which should be set for this header element. null removes any actor.

    **Deprecated:**
:::warning
use webreferences2 instead
:::

---

### setHeader(Object, String, String, String)
- ~~static setHeader(svc: [Object](TopLevel.Object.md), namespace: [String](TopLevel.String.md), name: [String](TopLevel.String.md), xml: [String](TopLevel.String.md)): void~~
  - : Creates a new SOAPHeaderElement with the name and namespace and places
      the given XML into it.


    **Parameters:**
    - svc - a service stub returned from getService()
    - namespace - the namespace of the header element
    - name - the element name for the header element
    - xml - a string with arbitrary XML content

    **Deprecated:**
:::warning
use webreferences2 instead
:::

---

### setHeader(Object, String, String, String, Boolean)
- ~~static setHeader(svc: [Object](TopLevel.Object.md), namespace: [String](TopLevel.String.md), name: [String](TopLevel.String.md), xml: [String](TopLevel.String.md), mustUnderstand: [Boolean](TopLevel.Boolean.md)): void~~
  - : Creates a new SOAPHeaderElement with the name and namespace and places
      the given XML into it.


    **Parameters:**
    - svc - a service stub returned from getService()
    - namespace - the namespace of the header element
    - name - the element name for the header element
    - xml - a string with arbitrary XML content
    - mustUnderstand - sets the SOAP header attribute mustUnderstand

    **Deprecated:**
:::warning
use webreferences2 instead
:::

---

### setHeader(Object, String, String, String, Boolean, String)
- ~~static setHeader(svc: [Object](TopLevel.Object.md), namespace: [String](TopLevel.String.md), name: [String](TopLevel.String.md), xml: [String](TopLevel.String.md), mustUnderstand: [Boolean](TopLevel.Boolean.md), actor: [String](TopLevel.String.md)): void~~
  - : Creates a new SOAPHeaderElement with the name and namespace and places
      the given XML into it.


    **Parameters:**
    - svc - a service stub returned from getService()
    - namespace - the namespace of the header element
    - name - the element name for the header element
    - xml - a string with arbitrary XML content
    - mustUnderstand - sets the SOAP header attribute mustUnderstand
    - actor - the SOAP actor, which should be set for this header element. null removes any actor.

    **Deprecated:**
:::warning
use webreferences2 instead
:::

---

### setWSSecurityConfig(Object, Object, Object)
- ~~static setWSSecurityConfig(svc: [Object](TopLevel.Object.md), requestConfigMap: [Object](TopLevel.Object.md), responseConfigMap: [Object](TopLevel.Object.md)): void~~
  - : Sets the WS-Security configuration for the request and response based on the
      constants defined.


    **Parameters:**
    - svc - a service stub returned from getService()
    - requestConfigMap - the WS-Security request config
    - responseConfigMap - the WS-Security response config

    **Deprecated:**
:::warning
use webreferences2 instead
:::

---

<!-- prettier-ignore-end -->
