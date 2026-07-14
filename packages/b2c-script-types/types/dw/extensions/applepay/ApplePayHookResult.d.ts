import Status = require('../../system/Status');
import URL = require('../../web/URL');

/**
 * 
 * 
 * Result of a hook handling an Apple Pay request.
 * 
 * Use the constants in this type to indicate specific error reasons to be provided
 * to Apple Pay JS. For example, the following code creates a dw.system.Status
 * that indicates the shipping contact information provided by Apple Pay is invalid:
 * 
 * ```
 * var ApplePayHookResult = require('dw/extensions/applepay/ApplePayHookResult');
 * var Status = require('dw/system/Status');
 * 
 * var error = new Status(Status.ERROR);
 * error.addDetail(ApplePayHookResult.STATUS_REASON_DETAIL_KEY, ApplePayHookResult.REASON_SHIPPING_CONTACT);
 * ```
 * 
 * If a specific error reason is not provided, the generic Apple Pay `STATUS_FAILURE`
 * reason will be used when necessary.
 */
declare class ApplePayHookResult {
    /**
     * Error reason code representing an invalid billing address.
     */
    static readonly REASON_BILLING_ADDRESS = "InvalidBillingPostalAddress";
    /**
     * Error reason code representing an error or failure not otherwise specified.
     */
    static readonly REASON_FAILURE = "Failure";
    /**
     * Error reason code representing the PIN is incorrect.
     */
    static readonly REASON_PIN_INCORRECT = "PINIncorrect";
    /**
     * Error reason code representing a PIN lockout.
     */
    static readonly REASON_PIN_LOCKOUT = "PINLockout";
    /**
     * Error reason code representing a PIN is required.
     */
    static readonly REASON_PIN_REQUIRED = "PINRequired";
    /**
     * Error reason code representing an invalid shipping address.
     */
    static readonly REASON_SHIPPING_ADDRESS = "InvalidShippingPostalAddress";
    /**
     * Error reason code representing invalid shipping contact information.
     */
    static readonly REASON_SHIPPING_CONTACT = "InvalidShippingContact";
    /**
     * Key for the detail to be used in dw.system.Status objects to indicate
     * the reason to communicate to Apple Pay for errors.
     */
    static readonly STATUS_REASON_DETAIL_KEY = "reason";
    /**
     * Detail to the JS custom event to dispatch in response to this result.
     */
    readonly eventDetail: Object;
    /**
     * Name of the JS custom event to dispatch in response to this result.
     */
    readonly eventName: string;
    /**
     * URL to navigate to in response to this result.
     */
    readonly redirect: URL;
    /**
     * Status describing the outcome of this result.
     */
    readonly status: Status;
    /**
     * Constructs a result with the given outcome information.
     */
    constructor(status: Status, redirect: URL);
    /**
     * Detail to the JS custom event to dispatch in response to this result.
     */
    getEventDetail(): Object;
    /**
     * Name of the JS custom event to dispatch in response to this result.
     */
    getEventName(): string;
    /**
     * URL to navigate to in response to this result.
     */
    getRedirect(): URL;
    /**
     * Status describing the outcome of this result.
     */
    getStatus(): Status;
    /**
     * Sets the name of the JS custom event to dispatch in response to this result.
     */
    setEvent(name: string): void;
    /**
     * Sets the name and detail of the JS custom event to dispatch in response to this result.
     */
    setEvent(name: string, detail: Object): void;
}

export = ApplePayHookResult;
