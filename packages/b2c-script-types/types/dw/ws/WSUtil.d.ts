/**
 * A utility class for performing SOAP-based operations for Web Services
 * for use with dw.ws.WebReference2. This class provides
 * methods for setting SOAP headers and a set of constants representing the
 * well-known supported header names. You also use this class to set connection and request
 * timeout values for Web Service calls.
 * @see dw.ws.WebReference2
 * @see dw.ws.Port
 */
declare class WSUtil {
    /**
     * This key identifier method is used when the X.509 Certificate is included in the message.
     * The certificate is Base-64 encoded and included in the request via a BinarySecurityToken element
     * @see WS_ENC_KEY_ID
     * @see WS_SIG_KEY_ID
     */
    static readonly KEY_ID_TYPE_DIRECT_REFERENCE = "DirectReference";
    /**
     * This Key Identifier method only applies for Encryption. Unlike the previous methods
     * it refers to the way the EncryptedData references the EncryptedKey Element,
     * rather than the way the EncryptedKey Element refers to the public key.
     * @see WS_ENC_KEY_ID
     */
    static readonly KEY_ID_TYPE_ENC_KEY_SHA1 = "EncryptedKeySHA1";
    /**
     * This key identifier method means that the Issuer Name and Serial Number of a X.509
     * Certificate is included directly in the KeyInfo Element.
     * @see WS_ENC_KEY_ID
     * @see WS_SIG_KEY_ID
     */
    static readonly KEY_ID_TYPE_ISSUE_SERIAL = "IssuerSerial";
    /**
     * This Key Identifier method refers to a Certificate via a Base-64 encoding of the
     * Subject Key Identifier.
     * @see WS_ENC_KEY_ID
     * @see WS_SIG_KEY_ID
     */
    static readonly KEY_ID_TYPE_SKI_IDENTIFIER = "SKIKeyIdentifier";
    /**
     * This Key Identifier method refers to the Certificate via a SHA-1 Thumbprint.
     * The certificate may or may not be included in the request.
     * @see WS_ENC_KEY_ID
     * @see WS_SIG_KEY_ID
     */
    static readonly KEY_ID_TYPE_THUMBPRINT = "Thumbprint";
    /**
     * This key identifier method is similar to KEY_ID_TYPE_DIRECT_REFERENCE, in that the certificate is
     * included in the request. However, instead of referring to a certificate, the certificate is
     * included directly in the KeyInfo element.
     * @see WS_ENC_KEY_ID
     * @see WS_SIG_KEY_ID
     */
    static readonly KEY_ID_TYPE_X509_KEY_IDENTIFIER = "X509KeyIdentifier";
    /**
     * WS-Security action property name.
     * Allowed property values are WS_NO_SECURITY, WS_TIMESTAMP, WS_ENCRYPT,
     * WS_SIGNATURE, WS_USERNAME_TOKEN or a space separated list of these values.
     */
    static readonly WS_ACTION = "action";
    /**
     * WS-Security action: Encrypt the message.
     * The encryption specific parameters define how to encrypt.
     */
    static readonly WS_ENCRYPT = "Encrypt";
    /**
     * WS-Security Encryption: Defines which parts of the request shall be encrypted.
     */
    static readonly WS_ENCRYPTION_PARTS = "encryptionParts";
    /**
     * WS-Security Encryption: The user's name for encryption.
     */
    static readonly WS_ENCRYPTION_USER = "encryptionUser";
    /**
     * Defines which key identifier type to use for encryption. Permissible
     * values are:
     * 
     * - `KEY_ID_TYPE_ISSUE_SERIAL`  (default value)
     * - `KEY_ID_TYPE_DIRECT_REFERENCE`
     * - `KEY_ID_TYPE_X509_KEY_IDENTIFIER`
     * - `KEY_ID_TYPE_THUMBPRINT`
     * - `KEY_ID_TYPE_SKI_IDENTIFIER`
     * - `KEY_ID_TYPE_ENC_KEY_SHA1`
     * @see KEY_ID_TYPE_ISSUE_SERIAL
     * @see KEY_ID_TYPE_DIRECT_REFERENCE
     * @see KEY_ID_TYPE_X509_KEY_IDENTIFIER
     * @see KEY_ID_TYPE_THUMBPRINT
     * @see KEY_ID_TYPE_SKI_IDENTIFIER
     * @see KEY_ID_TYPE_ENC_KEY_SHA1
     */
    static readonly WS_ENC_KEY_ID = "encryptionKeyIdentifier";
    /**
     * WS-Security Encryption: The encryption and decryption keystore alias name
     */
    static readonly WS_ENC_PROP_KEYSTORE_ALIAS = "__EncryptionPropKeystoreAlias";
    /**
     * WS-Security Encryption: The encryption and decryption keystore password
     */
    static readonly WS_ENC_PROP_KEYSTORE_PW = "__EncryptionPropKeystorePassword";
    /**
     * WS-Security Encryption: The signature keystore type ( jks, pkcs12, or managed ).
     * 
     * The default is jks.
     * 
     * The "managed" type will resolve aliases against the names of certificates and keys in Business Manager.
     * 
     * Note: For non-managed types, the keystore file has the basename of the WSDL file and the
     * file extension based on the keystore type (e.g. MyService.jks).
     * The keystore file has to be placed in the same cartridge directory
     * as the WSDL file.
     */
    static readonly WS_ENC_PROP_KEYSTORE_TYPE = "__EncryptionPropKeystoreType";
    /**
     * WS-Security action: No security.
     */
    static readonly WS_NO_SECURITY = "NoSecurity";
    /**
     * WS-Security password type: Parameter for UsernameToken action to define the encoding
     * of the password. Allowed values are PW_DIGEST or PW_TEXT.
     */
    static readonly WS_PASSWORD_TYPE = "passwordType";
    /**
     * WS-Security password type "digest": Use a password digest to send the password information.
     */
    static readonly WS_PW_DIGEST = "PasswordDigest";
    /**
     * WS-Security password type "text": Send the password information in clear.
     */
    static readonly WS_PW_TEXT = "PasswordText";
    /**
     * A secrets map with the username and password entries needed to create the password
     * callback object.
     */
    static readonly WS_SECRETS_MAP = "__SecretsMap";
    /**
     * WS-Security action: Sign the message.
     * The signature specific parameters define how to sign and which keys
     * to use.
     */
    static readonly WS_SIGNATURE = "Signature";
    /**
     * WS-Security Signature: Defines which parts of the request shall be signed.
     */
    static readonly WS_SIGNATURE_PARTS = "signatureParts";
    /**
     * WS-Security Signature: The user's name for signature.
     */
    static readonly WS_SIGNATURE_USER = "signatureUser";
    /**
     * WS-Security Signature: Defines which signature digest algorithm to use.
     */
    static readonly WS_SIG_DIGEST_ALGO = "signatureDigestAlgorithm";
    /**
     * Defines which key identifier type to use for signature.
     * 
     * Permissible values are:
     * 
     * - `KEY_ID_TYPE_ISSUE_SERIAL`
     * - `KEY_ID_TYPE_DIRECT_REFERENCE` (default value)
     * - `KEY_ID_TYPE_X509_KEY_ID_IDENTIFIER`
     * - `KEY_ID_TYPE_THUMBPRINT`
     * - `KEY_ID_TYPE_SKI_IDENTIFIER`
     * @see KEY_ID_TYPE_ISSUE_SERIAL
     * @see KEY_ID_TYPE_DIRECT_REFERENCE
     * @see KEY_ID_TYPE_X509_KEY_IDENTIFIER
     * @see KEY_ID_TYPE_THUMBPRINT
     * @see KEY_ID_TYPE_SKI_IDENTIFIER
     */
    static readonly WS_SIG_KEY_ID = "signatureKeyIdentifier";
    /**
     * WS-Security Signature: The signature keystore alias name.
     */
    static readonly WS_SIG_PROP_KEYSTORE_ALIAS = "__SignaturePropKeystoreAlias";
    /**
     * WS-Security Signature: The signature keystore password.
     */
    static readonly WS_SIG_PROP_KEYSTORE_PW = "__SignaturePropKeystorePassword";
    /**
     * WS-Security: The signature keystore type ( jks, pkcs12, or managed ).
     * 
     * The default is jks.
     * 
     * The "managed" type will resolve aliases against the names of certificates and keys in Business Manager.
     * 
     * Note: For non-managed types, the keystore file has the basename of the WSDL file and the
     * file extension based on the keystore type (e.g. MyService.jks).
     * The keystore file has to be placed in the same cartridge directory
     * as the WSDL file.
     */
    static readonly WS_SIG_PROP_KEYSTORE_TYPE = "__SignaturePropKeystoreType";
    /**
     * WS-Security action: Add a timestamp to the security header.
     */
    static readonly WS_TIMESTAMP = "Timestamp";
    /**
     * WS-Security user name.
     */
    static readonly WS_USER = "user";
    /**
     * WS-Security action: Add a UsernameToken identification.
     */
    static readonly WS_USERNAME_TOKEN = "UsernameToken";
    private constructor();
    /**
     * Adds a header element to the SOAP Header. Each header element should be XML and
     * it should typically contain a namespace URI.
     */
    static addSOAPHeader(port: any, xml: any, mustUnderstand: boolean, actor: string): void;
    /**
     * Adds a header element to the SOAP Header. Each header element should be XML and
     * it should typically contain a namespace URI.
     */
    static addSOAPHeader(port: any, xml: string, mustUnderstand: boolean, actor: string): void;
    /**
     * Removes all SOAP header elements from the port's request context.
     * @see dw.ws.WebReference2
     * @see dw.ws.Port
     */
    static clearSOAPHeaders(port: any): void;
    /**
     * Creates an jakarta.xml.ws.Holder instance that wraps the specified element. When a WSDL operation is
     * defined to have an input and output message using the same type, the operation may require the operation's
     * object to be wrapped in a holder.
     */
    static createHolder(element: any): any;
    /**
     * Returns the connection timeout value for the port.
     * @see dw.ws.WebReference2
     * @see dw.ws.Port
     */
    static getConnectionTimeout(port: any): number;
    /**
     * Returns an HTTP request header property value using the specified key. Null is returned
     * if the key does not represent an HTTP header property.
     */
    static getHTTPRequestHeader(port: any, key: string): string | null;
    /**
     * Returns the value of the SOAP request property using the specified key on a port
     * returned from one of the WebReference2 getService methods. The property
     * keys are defined as constants in dw.ws.Port.
     * @see dw.ws.WebReference2
     * @see dw.ws.Port
     */
    static getProperty(key: string, port: any): any;
    /**
     * Returns the read timeout value for a request made on the specified port.
     * If the request exceeds the timeout value, an error is thrown.
     * @see dw.ws.WebReference2
     * @see dw.ws.Port
     */
    static getRequestTimeout(port: any): number;
    /**
     * Returns the property value using the specified key and on a port returned from one of
     * the WebReference2 getService methods.
     * @see dw.ws.WebReference2
     * @see dw.ws.Port
     */
    static getResponseProperty(key: string, port: any): any;
    /**
     * Returns true if the HTTP request may be chunked, false otherwise
     */
    static isAllowChunking(port: any): boolean;
    /**
     * Indicate that HTTP chunked Transfer-Encoding may be used.
     * 
     * The default behavior is true. If false then the request will not
     * be chunked and the Content-Length will always be sent.
     */
    static setAllowChunking(port: any, allow: boolean): void;
    /**
     * Sets the connection timeout for the port.
     * @see dw.ws.WebReference2
     * @see dw.ws.Port
     */
    static setConnectionTimeout(timeoutInMilliseconds: number, port: any): void;
    /**
     * Sets an HTTP request header property using the specified key and value.
     */
    static setHTTPRequestHeader(port: any, key: string, value: string): void;
    /**
     * Set the SOAP request property using the specified key and value on a port
     * returned from one of the WebReference2 getService() methods. The property
     * keys are defined as constants in dw.ws.Port.
     * @see dw.ws.WebReference2
     * @see dw.ws.Port
     */
    static setProperty(key: string, value: any, port: any): void;
    /**
     * Sets the read timeout value for a request made on the specified port.
     * If the request exceeds the timeout value, an error is thrown.
     * @see dw.ws.WebReference2
     * @see dw.ws.Port
     */
    static setRequestTimeout(timeoutInMilliseconds: number, port: any): void;
    /**
     * Set the user name and password to use with Basic authentication. For stronger
     * authentication, use the setWSSecurityConfig method.
     * @see setWSSecurityConfig
     * @see dw.ws.WebReference2
     * @see dw.ws.Port
     */
    static setUserNamePassword(userName: string, password: string, port: any): void;
    /**
     * Set the WS-Security configuration for the request and response based on the
     * constants defined (see above).
     * @see dw.ws.WebReference2
     * @see dw.ws.Port
     */
    static setWSSecurityConfig(port: any, requestConfigMap: any, responseConfigMap: any): void;
}

export = WSUtil;
