import utilMap = require('../util/Map');
import List = require('../util/List');

/**
 * A StatusItem holds all the status information. Multi StatusItems are bundled
 * together into a Status.
 */
declare class StatusItem {
    /**
     * The status code is the unique identifier for the message and can be used by
     * client programs to check for a specific status and to generate a localized
     * message.
     */
    code: string;
    /**
     * Returns the optional details for this StatusItem.
     */
    readonly details: utilMap<any, any>;
    /**
     * Returns whether this Status Item represents and error.
     */
    readonly error: boolean;
    /**
     * Returns the default human readable message for this Status.
     * 
     * Note: Custom code and client programs must not use this message to identify
     * a specific status. The getCode() must be used for that purpose. The actual
     * message can change from release to release.
     */
    message: string;
    /**
     * Returns the parameters to construct a custom message.
     */
    parameters: List<string>;
    /**
     * Returns the status.
     */
    status: number;
    /**
     * Constructs a new OK StatusItem.
     */
    constructor();
    /**
     * Constructs a new StatusItem with the given status.
     */
    constructor(status: number);
    /**
     * Constructs a new StatusItem with the given status and code.
     */
    constructor(status: number, code: string);
    /**
     * Constructs a new StatusItem with the given values.
     */
    constructor(status: number, code: string, message: string, ...parameters: any[]);
    /**
     * Add an additional detail to this StatusItem.
     */
    addDetail(key: string, value: any): void;
    /**
     * The status code is the unique identifier for the message and can be used by
     * client programs to check for a specific status and to generate a localized
     * message.
     */
    getCode(): string;
    /**
     * Returns the optional details for this StatusItem.
     */
    getDetails(): utilMap<any, any>;
    /**
     * Returns the default human readable message for this Status.
     * 
     * Note: Custom code and client programs must not use this message to identify
     * a specific status. The getCode() must be used for that purpose. The actual
     * message can change from release to release.
     */
    getMessage(): string;
    /**
     * Returns the parameters to construct a custom message.
     */
    getParameters(): List<string>;
    /**
     * Returns the status.
     */
    getStatus(): number;
    /**
     * Returns whether this Status Item represents and error.
     */
    isError(): boolean;
    /**
     * Method to set the status code.
     * The status code is the unique identifier for the message and can be used by
     * client programs to check for a specific status and to generate a localized
     * message.
     */
    setCode(code: string): void;
    /**
     * Sets the default human readable message for this Status.
     */
    setMessage(message: string): void;
    /**
     * Sets the parameters for a custom message.
     */
    setParameters(parameters: any[]): void;
    /**
     * Set the status.
     */
    setStatus(status: number): void;
}

export = StatusItem;
