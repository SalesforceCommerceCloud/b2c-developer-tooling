/**
 * This class represents a port to a Service Endpoint Interface. This
 * class provides access to operations the service provides. Use the
 * WSUtil class to perform operations on the port such as setting
 * timeout values and configuring security.
 * 
 * Developers should set a low timeout to ensure responsiveness
 * of the site and avoid thread exhaustion (see dw.ws.WSUtil.setRequestTimeout).
 * The default request timeout is 15 minutes when the web reference is used in a job,
 * and 2 minutes otherwise. If the timeout of the calling script is lower,
 * the script timeout is used.
 * @see dw.ws.WSUtil
 */
declare abstract class Port {
    /**
     * Property constant for controlling the content type encoding of an outgoing message.
     * @see dw.ws.WSUtil.setProperty
     */
    static readonly ENCODING = "org.apache.cxf.message.Message.ENCODING";
    /**
     * The target service endpoint address. When using this property, the URI
     * scheme for the endpoint address specification must correspond to the
     * protocol/transport binding for the binding in use.
     * @see dw.ws.WSUtil.setProperty
     */
    static readonly ENDPOINT_ADDRESS_PROPERTY = "jakarta.xml.ws.service.endpoint.address";
    /**
     * Password for authentication. This property is used with the USERNAME_PROPERTY.
     * You can also use the  dw.ws.WSUtil.setUserNamePassword method instead of using these
     * properties.
     * @see dw.ws.WSUtil.setUserNamePassword
     * @see dw.ws.WSUtil.setProperty
     */
    static readonly PASSWORD_PROPERTY = "jakarta.xml.ws.security.auth.password";
    /**
     * This boolean property is used by a service client to indicate whether or not it wants to
     * participate in a session with a service endpoint. If this property is set to true, the service client indicates
     * that it wants the session to be maintained. If set to false, the session is not maintained. The default value
     * for this property is false.
     * @see dw.ws.WSUtil.setProperty
     */
    static readonly SESSION_MAINTAIN_PROPERTY = "jakarta.xml.ws.session.maintain";
    /**
     * User name for authentication. This property is used with the PASSWORD_PROPERTY.
     * You can also use the dw.ws.WSUtil.setUserNamePassword method instead of using these
     * properties.
     * @see dw.ws.WSUtil.setUserNamePassword
     * @see dw.ws.WSUtil.setProperty
     */
    static readonly USERNAME_PROPERTY = "jakarta.xml.ws.security.auth.username";
    private constructor();
}

export = Port;
