/**
 * Utility class for working with SOAP web services.  This class provides
 * methods for setting SOAP headers and a set of constants representing the
 * supported header names.
 * 
 * If you want to use ws-security features, such as signing and encryption,
 * with your RPC-style SOAP web service, use this class to construct a HashMap with
 * security constants and values.
 * 
 * Note: this method handles sensitive security-related data.
 * Pay special attention to PCI DSS v3. requirements 2, 4, and 12.
 * The following example configures the ws-security actions taken for the request and response to a web service.
 * @example
 * `
 * importPackage( dw.system );
 * importPackage( dw.util );
 * importPackage( dw.rpc );
 * 
 * function execute( args : PipelineDictionary ) : Number
 * {
 * var WSU_NS : String = "http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd";
 * 
 * try
 * {
 * 
 * // define a map with all the secrets
 * var secretsMap   : Map = new HashMap();
 * secretsMap.put("myclientkey", "ckpass");
 * secretsMap.put("myservicekey", "ckpass");
 * secretsMap.put("username", "password");
 * 
 * var requestCfg   : Map = new HashMap();
 * 
 * // define the ws actions to be performed
 * requestCfg.put(SOAPUtil.WS_ACTION, SOAPUtil.WS_USERNAME_TOKEN + " " +
 * SOAPUtil.WS_TIMESTAMP + " " +
 * SOAPUtil.WS_SIGNATURE + " " +
 * SOAPUtil.WS_ENCRYPT);
 * requestCfg.put(SOAPUtil.WS_USER, "username");
 * requestCfg.put(SOAPUtil.WS_PASSWORD_TYPE, SOAPUtil.WS_PW_DIGEST );
 * requestCfg.put(SOAPUtil.WS_SIG_DIGEST_ALGO, "http://www.w3.org/2001/04/xmlenc#sha256" );
 * 
 * // define signature properties
 * // the keystore file has the basename of the WSDL file and the
 * // file extension based on the keystore type (e.g. HelloWorld.jks).
 * // The keystore file has to be placed beside the WSDL file.
 * requestCfg.put(SOAPUtil.WS_SIG_PROP_KEYSTORE_TYPE, "jks");
 * requestCfg.put(SOAPUtil.WS_SIG_PROP_KEYSTORE_PW, "cspass");
 * requestCfg.put(SOAPUtil.WS_SIG_PROP_KEYSTORE_ALIAS, "myclientkey");
 * 
 * requestCfg.put(SOAPUtil.WS_SIGNATURE_USER, "myclientkey");
 * 
 * // define enrcryption properties
 * requestCfg.put(SOAPUtil.WS_ENC_PROP_KEYSTORE_TYPE, "jks");
 * requestCfg.put(SOAPUtil.WS_ENC_PROP_KEYSTORE_PW, "cspass");
 * requestCfg.put(SOAPUtil.WS_ENC_PROP_KEYSTORE_ALIAS, "myservicekey");
 * 
 * requestCfg.put(SOAPUtil.WS_ENCRYPTION_USER, "myservicekey");
 * requestCfg.put(SOAPUtil.WS_SIGNATURE_PARTS, "{Element}{http://schemas.xmlsoap.org/soap/envelope/}Body");
 * requestCfg.put(SOAPUtil.WS_ENCRYPTION_PARTS,"{Element}{" + WSU_NS + "}
 * Timestamp;"+"{Content}{http://schemas.xmlsoap.org/soap/envelope/}Body");
 * 
 * // set the secrets for the callback
 * requestCfg.put(SOAPUtil.WS_SECRETS_MAP, secretsMap);
 * 
 * var responseCfg : Map = new HashMap();
 * 
 * // define the ws actions to be performed for the response
 * responseCfg.put(SOAPUtil.WS_ACTION, SOAPUtil.WS_TIMESTAMP + " " +
 * SOAPUtil.WS_SIGNATURE + " " +
 * SOAPUtil.WS_ENCRYPT);
 * 
 * // define signature properties
 * responseCfg.put(SOAPUtil.WS_SIG_PROP_KEYSTORE_TYPE, "jks");
 * responseCfg.put(SOAPUtil.WS_SIG_PROP_KEYSTORE_PW, "cspass");
 * responseCfg.put(SOAPUtil.WS_SIG_PROP_KEYSTORE_ALIAS, "myservicekey");
 * 
 * responseCfg.put(SOAPUtil.WS_SIGNATURE_USER, "myservicekey");
 * 
 * // define decryption properties
 * responseCfg.put(SOAPUtil.WS_ENC_PROP_KEYSTORE_TYPE, "jks");
 * responseCfg.put(SOAPUtil.WS_ENC_PROP_KEYSTORE_PW, "cspass");
 * responseCfg.put(SOAPUtil.WS_ENC_PROP_KEYSTORE_ALIAS, "myclientkey");
 * 
 * responseCfg.put(SOAPUtil.WS_ENCRYPTION_USER, "myclientkey");
 * 
 * // set the secrets for the callback
 * responseCfg.put(SOAPUtil.WS_SECRETS_MAP, secretsMap);
 * 
 * // get the service and stub
 * var helloWorldService : WebReference = webreferences.HelloWorld;
 * var stub : Stub = helloWorldService.defaultService;
 * // set the security
 * SOAPUtil.setWSSecurityConfig(stub, requestCfg, responseCfg);
 * //var h : Hello = new helloWorldService.Hello();
 * var h = new helloWorldService.com.support.ws.security.test.Hello2();
 * 
 * h.setName('Send Text from client Axis ...');
 * 
 * // call the web service
 * var response  = stub.hello2(h);
 * //var response = stub.hello(h);
 * var result = response.getHello2Return();
 * 
 * args.OutStr = result;
 * Logger.error("Hello World We Are SIGNED old version Send Text from client ...", result);
 * 
 * return PIPELET_NEXT;
 * 
 * }
 * catch (e)
 * {
 * Logger.error("Error in helloWorldRpc.ds is: " + e);
 * return PIPELET_ERROR;
 * }
 * 
 * }
 * `
 * @see dw.rpc.Stub
 * @see dw.rpc.WebReference
 * @deprecated This class is deprecated, please use webreferences2 instead (see also dw.ws.WSUtil).
 */
declare class SOAPUtil {
    /**
     * WS-Security action property name.
     * Allowed property values are WS_NO_SECURITY, WS_TIMESTAMP, WS_ENCRYPT, WS_SIGNATURE, WS_USERNAME_TOKEN or
     * a space separated String with multiple values.
     * @deprecated use webreferences2 instead
     */
    static readonly WS_ACTION = "action";
    /**
     * WS-Security action: encrypt the message.
     * The encryption-specific parameters define how to encrypt, which keys
     * to use, and other parameters.
     * @deprecated use webreferences2 instead
     */
    static readonly WS_ENCRYPT = "Encrypt";
    /**
     * WS-Security encryption: defines which parts of the request are encrypted.
     * @deprecated use webreferences2 instead
     */
    static readonly WS_ENCRYPTION_PARTS = "encryptionParts";
    /**
     * WS-Security encryption: the user's name for encryption.
     * @deprecated use webreferences2 instead
     */
    static readonly WS_ENCRYPTION_USER = "encryptionUser";
    /**
     * WS-Security encryption: the encryption/decryption keystore alias name
     * @deprecated use webreferences2 instead
     */
    static readonly WS_ENC_PROP_KEYSTORE_ALIAS = "__EncryptionPropKeystoreAlias";
    /**
     * WS-Security encryption: the encryption/decryption keystore password
     * @deprecated use webreferences2 instead
     */
    static readonly WS_ENC_PROP_KEYSTORE_PW = "__EncryptionPropKeystorePassword";
    /**
     * WS-Security encryption: the encryption/decryption keystore type ( jks or pkcs12 ),
     * default is jks.
     * 
     * Note: the keystore file must have the basename of the WSDL file and the
     * file extension based on the keystore type. For example: MyService.jks.
     * The keystore file must be placed in the same cartridge directory
     * as the WSDL file.
     * @deprecated use webreferences2 instead
     */
    static readonly WS_ENC_PROP_KEYSTORE_TYPE = "__EncryptionPropKeystoreType";
    /**
     * WS-Security action: no security
     * @deprecated use webreferences2 instead
     */
    static readonly WS_NO_SECURITY = "NoSecurity";
    /**
     * WS-Security password type: parameter for UsernameToken action to define the encoding
     * of the password. Allowed values are PW_DIGEST or PW_TEXT.
     * @deprecated use webreferences2 instead
     */
    static readonly WS_PASSWORD_TYPE = "passwordType";
    /**
     * WS-Security password of type digest: use a password digest to send the password information.
     * @deprecated use webreferences2 instead
     */
    static readonly WS_PW_DIGEST = "PasswordDigest";
    /**
     * WS-Security password of type text: send the password information in clear text.
     * @deprecated use webreferences2 instead
     */
    static readonly WS_PW_TEXT = "PasswordText";
    /**
     * A secrets map with the username/password entries is needed to create the password
     * callback object.
     * @deprecated use webreferences2 instead
     */
    static readonly WS_SECRETS_MAP = "__SecretsMap";
    /**
     * WS-Security action: sign the message.
     * The signature-specific parameters define how to sign, which keys
     * to use, and other parameters.
     * @deprecated use webreferences2 instead
     */
    static readonly WS_SIGNATURE = "Signature";
    /**
     * WS-Security signature: defines which parts of the request are signed.
     * @deprecated use webreferences2 instead
     */
    static readonly WS_SIGNATURE_PARTS = "signatureParts";
    /**
     * WS-Security signature: the user's name for signature.
     * @deprecated use webreferences2 instead
     */
    static readonly WS_SIGNATURE_USER = "signatureUser";
    /**
     * WS-Security signature: sets the signature digest algorithm to use.
     * @deprecated use webreferences2 instead
     */
    static readonly WS_SIG_DIGEST_ALGO = "signatureDigestAlgorithm";
    /**
     * WS-Security signature: the signature keystore alias name
     * @deprecated use webreferences2 instead
     */
    static readonly WS_SIG_PROP_KEYSTORE_ALIAS = "__SignaturePropKeystoreAlias";
    /**
     * WS-Security signature: the signature keystore password.
     * @deprecated use webreferences2 instead
     */
    static readonly WS_SIG_PROP_KEYSTORE_PW = "__SignaturePropKeystorePassword";
    /**
     * WS-Security: the signature keystore type ( jks or pkcs12 ). The default is jks.
     * 
     * Note: The keystore file must have the basename of the WSDL file and the
     * file extension of the keystore type. For example: MyService.jks.
     * The keystore file must be placed in the same cartridge directory
     * as the WSDL file.
     * @deprecated use webreferences2 instead
     */
    static readonly WS_SIG_PROP_KEYSTORE_TYPE = "__SignaturePropKeystoreType";
    /**
     * WS-Security action: add a timestamp to the security header.
     * @deprecated use webreferences2 instead
     */
    static readonly WS_TIMESTAMP = "Timestamp";
    /**
     * WS-Security user name.
     * @deprecated use webreferences2 instead
     */
    static readonly WS_USER = "user";
    /**
     * WS-Security action: add a UsernameToken identification.
     * @deprecated use webreferences2 instead
     */
    static readonly WS_USERNAME_TOKEN = "UsernameToken";
    private constructor();
    /**
     * Returns an HTTP request header property value using the specified key. Null is returned
     * if the key does not represent an HTTP header property.
     * @deprecated use webreferences2 instead
     */
    static getHTTPRequestHeader(svc: any, key: string): string | null;
    /**
     * Returns an HTTP response header property value using the specified key. Null is returned
     * if the key does not represent an HTTP response header property.
     * @deprecated use webreferences2 instead
     */
    static getHTTPResponseHeader(svc: any, key: string): string | null;
    /**
     * Sets an HTTP request header property using the specified key and value.
     * @deprecated use webreferences2 instead
     */
    static setHTTPRequestHeader(svc: any, key: string, value: string): void;
    /**
     * Sets a new SOAPHeaderElement in the SOAP request with the namespace of
     * the XML content.
     * @deprecated use webreferences2 instead
     */
    static setHeader(svc: any, xml: string): void;
    /**
     * Sets a new SOAPHeaderElement in the SOAP request  with the namespace of
     * the XML content.
     * @deprecated use webreferences2 instead
     */
    static setHeader(svc: any, xml: string, mustUnderstand: boolean): void;
    /**
     * Creates a new SOAPHeaderElement with the name and namespace and places
     * the given XML into it.
     * @deprecated use webreferences2 instead
     */
    static setHeader(svc: any, namespace: string, name: string, xml: string): void;
    /**
     * Creates a new SOAPHeaderElement with the name and namespace and places
     * the given XML into it.
     * @deprecated use webreferences2 instead
     */
    static setHeader(svc: any, namespace: string, name: string, xml: string, mustUnderstand: boolean): void;
    /**
     * Creates a new SOAPHeaderElement with the name and namespace and places
     * the given XML into it.
     * @deprecated use webreferences2 instead
     */
    static setHeader(svc: any, namespace: string, name: string, xml: string, mustUnderstand: boolean, actor: string): void;
    /**
     * Creates a new SOAPHeaderElement with the name and namespace and places
     * the given XML into it.
     * @deprecated use webreferences2 instead
     */
    static setHeader(svc: any, namespace: string, name: string, xml: any): void;
    /**
     * Creates a new SOAPHeaderElement with the name and namespace and places
     * the given XML into it.
     * @deprecated use webreferences2 instead
     */
    static setHeader(svc: any, namespace: string, name: string, xml: any, mustUnderstand: boolean): void;
    /**
     * Creates a new SOAPHeaderElement with the name and namespace and places
     * the given XML into it.
     * @example
     * `
     * var usernameToken : XML =
     * <wsse:UsernameToken xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
     * <wsse:Username>{merchantID}</wsse:Username>
     * <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">
     * {merchantPassword}
     * </wsse:Password>
     * </wsse:UsernameToken>
     * SOAPUtil.setHeader( service, "http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd",
     * "Security", usernameToken, true, null
     * `
     * @deprecated use webreferences2 instead
     */
    static setHeader(svc: any, namespace: string, name: string, xml: any, mustUnderstand: boolean, actor: string): void;
    /**
     * Sets the WS-Security configuration for the request and response based on the
     * constants defined.
     * @deprecated use webreferences2 instead
     */
    static setWSSecurityConfig(svc: any, requestConfigMap: any, responseConfigMap: any): void;
}

export = SOAPUtil;
