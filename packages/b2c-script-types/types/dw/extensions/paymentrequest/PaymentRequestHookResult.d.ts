import Status = require('../../system/Status');
import URL = require('../../web/URL');

/**
 * Result of a hook handling a Payment Request request
 * @deprecated Salesforce Payments includes support for Google Pay
 */
declare class PaymentRequestHookResult {
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

export = PaymentRequestHookResult;
