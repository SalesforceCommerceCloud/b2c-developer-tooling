import Customer = require('../customer/Customer');
import Currency = require('../util/Currency');
import ClickStream = require('../web/ClickStream');
import CustomAttributes = require('../object/CustomAttributes');
import SourceCodeInfo = require('../campaign/SourceCodeInfo');
import Forms = require('../web/Forms');
import Status = require('./Status');

/**
 * Represents a session in B2C Commerce. The session has some well-defined
 * attributes like the current authenticated customer or the click stream, but also
 * supports storing custom values in the session.
 * 
 * The Digital session handling works in the following way:
 * 
 * -
 * A session is created in Digital on the first user click. This is guaranteed even if
 * B2C Commerce caches the HTML pages. It is not guaranteed when the pages are cached by a CDN.
 * 
 * -
 * A session is identified with a unique ID, called the session ID.
 * 
 * -
 * When a session is created, the application server calls the pipeline OnSession-Start. It can
 * be used to pre-initialize the session, before the actual request hits the server.
 * 
 * -
 * Digital uses session stickiness and always routes requests within a single session to the same
 * application server.
 * 
 * -
 * Session data is also stored in a persistent location.
 * 
 * -
 * In case of a fail-over situation, requests are re-routed to another application server, which then
 * loads the session data from the persistent storage.
 * 
 * -
 * There are two session timeouts. A soft timeout occurs 30 minutes after the last request has been made.
 * The soft timeout logs out and clears all privacy data, but it is still possible to use the session ID
 * to reopen the session. A hard timeout renders a session ID invalid after six hours, even if the session
 * is still in use. The hard timeout prevents a session from being reopened. For example, if the session ID
 * is pasted into a URL after the hard timeout, the session doesn't reopen.
 * 
 * Certain rules apply for what and how much data can be stored in a session:
 * 
 * -
 * All primitive types (boolean, number, string, Number, String, Boolean, Date) are supported.
 * 
 * -
 * All B2C Commerce value types (Money, Quantity, Decimal, Calendar) are supported.
 * 
 * -
 * Strings are limited to 2000 characters.
 * 
 * -
 * No other types can be stored in a session. In particular, persistent objects,
 * collections, and scripted objects cannot be stored in a session. B2C Commerce
 * will report unsupported values with a deprecation message in the log files.
 * An unsupported value will be stored in the session, but the results are undefined.
 * Since version compatibility mode 19.10 unsupported types will no longer be accepted,
 * and an exception will be thrown.
 * 
 * -
 * There is a 10 KB size limit for the overall serialized session.
 */
declare class Session {
    /**
     * Returns the current click stream if this is an HTTP session, null otherwise.
     */
    readonly clickStream: ClickStream | null;
    /**
     * Get the currency associated with the current session. The session
     * currency is established at session construction time and is typically
     * equal to the site default currency. In the case of a multi-currency site,
     * the session currency may be different than the site default currency.
     */
    currency: Currency;
    /**
     * Returns the session's custom attributes. The
     * attributes are stored for the lifetime of the session and are not
     * cleared when the customer logs out.
     */
    readonly custom: CustomAttributes;
    /**
     * Returns the customer associated with this storefront session. The method
     * always returns `null` if called for a non-storefront session
     * (e.g., within a job or within Business Manager). For a storefront
     * session, the method always returns a customer. The returned customer
     * may be anonymous if the customer could not be identified via the
     * customer cookie.
     */
    readonly customer: Customer | null;
    /**
     * Identifies whether the customer associated with this session
     * is authenticated. This call is equivalent to customer.isAuthenticated().
     */
    readonly customerAuthenticated: boolean;
    /**
     * Identifies whether the customer associated with this session
     * is externally authenticated.
     */
    readonly customerExternallyAuthenticated: boolean;
    /**
     * Returns the forms object that provides access to all current forms of a customer in the session.
     */
    readonly forms: Forms;
    /**
     * Returns information on the last source code handled by the session.
     * This may or may not be the session's active source code, e.g., the
     * last received source code was inactive and therefore was not
     * set as the session's active source code.
     */
    readonly lastReceivedSourceCodeInfo: SourceCodeInfo;
    /**
     * Returns the session's custom privacy attributes.
     * The attributes are stored for the lifetime of the session and are
     * automatically cleared when the customer logs out.
     */
    readonly privacy: CustomAttributes;
    /**
     * Returns the unique session id. This can safely be used as an identifier
     * against external systems.
     */
    readonly sessionID: string;
    /**
     * Returns information on the session's active source-code.
     */
    readonly sourceCodeInfo: SourceCodeInfo;
    /**
     * Returns whether the tracking allowed flag is set in the session.
     * The value for newly created sessions defaults to the Site Preference "TrackingAllowed" unless
     * a cookie named "dw_dnt" is found in which case the cookie value takes precedence.
     */
    trackingAllowed: boolean;
    /**
     * Identifies whether the agent user associated with this session
     * is authenticated.
     */
    readonly userAuthenticated: boolean;
    /**
     * Returns the current agent user name associated with this session.
     * 
     * Note: this class allows access to sensitive security-related data.
     * Pay special attention to PCI DSS v3 requirements 2, 4, and 12.
     */
    readonly userName: string;
    private constructor();
    /**
     * Generates a new guest session signature.
     * 
     * This is intended for guest authentication with the Shopper Login and API Access Service (SLAS).
     */
    generateGuestSessionSignature(): string;
    /**
     * Generates a new registered session signature.
     * 
     * This is intended for use with registered session-bridge call of Shopper Login and API Access Service (SLAS).
     */
    generateRegisteredSessionSignature(): string;
    /**
     * Returns the current click stream if this is an HTTP session, null otherwise.
     */
    getClickStream(): ClickStream | null;
    /**
     * Get the currency associated with the current session. The session
     * currency is established at session construction time and is typically
     * equal to the site default currency. In the case of a multi-currency site,
     * the session currency may be different than the site default currency.
     */
    getCurrency(): Currency;
    /**
     * Returns the session's custom attributes. The
     * attributes are stored for the lifetime of the session and are not
     * cleared when the customer logs out.
     */
    getCustom(): CustomAttributes;
    /**
     * Returns the customer associated with this storefront session. The method
     * always returns `null` if called for a non-storefront session
     * (e.g., within a job or within Business Manager). For a storefront
     * session, the method always returns a customer. The returned customer
     * may be anonymous if the customer could not be identified via the
     * customer cookie.
     */
    getCustomer(): Customer | null;
    /**
     * Returns the forms object that provides access to all current forms of a customer in the session.
     */
    getForms(): Forms;
    /**
     * Returns information on the last source code handled by the session.
     * This may or may not be the session's active source code, e.g., the
     * last received source code was inactive and therefore was not
     * set as the session's active source code.
     */
    getLastReceivedSourceCodeInfo(): SourceCodeInfo;
    /**
     * Returns the session's custom privacy attributes.
     * The attributes are stored for the lifetime of the session and are
     * automatically cleared when the customer logs out.
     */
    getPrivacy(): CustomAttributes;
    /**
     * Returns the unique session id. This can safely be used as an identifier
     * against external systems.
     */
    getSessionID(): string;
    /**
     * Returns information on the session's active source-code.
     */
    getSourceCodeInfo(): SourceCodeInfo;
    /**
     * Returns the current agent user name associated with this session.
     * 
     * Note: this class allows access to sensitive security-related data.
     * Pay special attention to PCI DSS v3 requirements 2, 4, and 12.
     */
    getUserName(): string;
    /**
     * Identifies whether the customer associated with this session
     * is authenticated. This call is equivalent to customer.isAuthenticated().
     */
    isCustomerAuthenticated(): boolean;
    /**
     * Identifies whether the customer associated with this session
     * is externally authenticated.
     */
    isCustomerExternallyAuthenticated(): boolean;
    /**
     * Returns whether the tracking allowed flag is set in the session.
     * The value for newly created sessions defaults to the Site Preference "TrackingAllowed" unless
     * a cookie named "dw_dnt" is found in which case the cookie value takes precedence.
     */
    isTrackingAllowed(): boolean;
    /**
     * Identifies whether the agent user associated with this session
     * is authenticated.
     */
    isUserAuthenticated(): boolean;
    /**
     * Sets the session currency.
     */
    setCurrency(newCurrency: Currency): void;
    /**
     * Applies the specified source code to the current session and basket. This API processes the source code exactly as if it
     * were supplied on the URL query string, with the additional benefit of returning error information. If no input
     * parameter is passed, then the active source code in the session and basket is removed. If a basket exists, and the modification fails,
     * then the session is not written to either. This method may open and commit a transaction, if none is currently active.
     */
    setSourceCode(sourceCode: string): Status;
    /**
     * Sets the tracking allowed flag for the session. If tracking is not allowed, multiple services
     * depending on tracking will be restricted or disabled: Predictive Intelligence recommendations,
     * Active Data, Analytics of the customer behavior in the storefront.
     * Additionally, collected clicks in the session click stream will be cleared.
     * Setting this property to either value also results in setting a session-scoped cookie named "dw_dnt"
     * (1=DoNotTrack; 0=Track)
     */
    setTrackingAllowed(trackingAllowed: boolean): void;
}

export = Session;
