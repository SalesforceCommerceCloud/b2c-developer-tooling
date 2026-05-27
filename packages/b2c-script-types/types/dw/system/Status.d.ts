import StatusItem = require('./StatusItem');
import List = require('../util/List');
import utilMap = require('../util/Map');

/**
 * A Status is used for communicating an API status code back to a client. A status
 * consists of multiple StatusItem. Most often a Status contains only one StatusItem.
 * For convenience, a message with parameters is formatted using standard
 * formatting patterns. If you want to display locale-specific messages in your
 * application, you should use the Status.getCode() as key for a resource bundle.
 */
declare class Status {
    /**
     * status value to indicate an ERROR status
     */
    static ERROR: number;
    /**
     * status value to indicate an OK status
     */
    static OK: number;
    /**
     * Returns the status code either of the first ERROR StatusItem or when there
     * is no ERROR StatusITEM, the first StatusItem in the overall list.
     * 
     * The status code is the unique identifier for the message and can be used by
     * client programs to check for a specific status and to generate a localized
     * message.
     */
    readonly code: string;
    /**
     * Returns the details either of the first ERROR StatusItem or when there
     * is no ERROR StatusItem, the first StatusItem in the overall list.
     */
    readonly details: utilMap<any, any>;
    /**
     * Checks if the status is an ERROR. The Status is an ERROR if one of the
     * contained StatusItems is an ERROR.
     */
    readonly error: boolean;
    /**
     * Returns all status items.
     */
    readonly items: List<StatusItem>;
    /**
     * Returns the message either of the first ERROR StatusItem or when there
     * is no ERROR StatusItem, the first StatusItem in the overall list.
     * 
     * Note: Custom code and client programs must not use this message to identify
     * a specific status. The getCode() must be used for that purpose. The actual
     * message can change from release to release.
     */
    readonly message: string;
    /**
     * Returns the parameters either of the first ERROR StatusItem or when there
     * is no ERROR StatusItem, the first StatusItem in the overall list.
     */
    readonly parameters: List<string>;
    /**
     * Returns the overall status. If all StatusItems are OK, the method returns
     * OK. If one StatusItem is an ERROR it returns ERROR.
     */
    readonly status: number;
    /**
     * Creates a Status object with no StatusItems.
     */
    constructor();
    /**
     * Creates a Status with a single StatusItem. The status is set to the given
     * value.
     */
    constructor(status: number);
    /**
     * Creates a Status with a single StatusItem. The StatusItem is initialized
     * with the given values.
     */
    constructor(status: number, code: string);
    /**
     * Creates a Status with a single StatusItem. The StatusItem is initialized
     * with the given values.
     */
    constructor(status: number, code: string, message: string, ...parameters: any[]);
    /**
     * Add detail information for the given key of the first ERROR StatusItem
     * or when there is no ERROR StatusItem, the first StatusItem in the overall list.
     */
    addDetail(key: string, value: any): void;
    /**
     * Adds an additional status item to this status instance.
     */
    addItem(item: StatusItem): void;
    /**
     * Returns the status code either of the first ERROR StatusItem or when there
     * is no ERROR StatusITEM, the first StatusItem in the overall list.
     * 
     * The status code is the unique identifier for the message and can be used by
     * client programs to check for a specific status and to generate a localized
     * message.
     */
    getCode(): string;
    /**
     * Returns the detail value for the given key of the first ERROR StatusItem
     * or when there is no ERROR StatusItem, the first StatusItem in the
     * overall list.
     */
    getDetail(key: string): any;
    /**
     * Returns the details either of the first ERROR StatusItem or when there
     * is no ERROR StatusItem, the first StatusItem in the overall list.
     */
    getDetails(): utilMap<any, any>;
    /**
     * Returns all status items.
     */
    getItems(): List<StatusItem>;
    /**
     * Returns the message either of the first ERROR StatusItem or when there
     * is no ERROR StatusItem, the first StatusItem in the overall list.
     * 
     * Note: Custom code and client programs must not use this message to identify
     * a specific status. The getCode() must be used for that purpose. The actual
     * message can change from release to release.
     */
    getMessage(): string;
    /**
     * Returns the parameters either of the first ERROR StatusItem or when there
     * is no ERROR StatusItem, the first StatusItem in the overall list.
     */
    getParameters(): List<string>;
    /**
     * Returns the overall status. If all StatusItems are OK, the method returns
     * OK. If one StatusItem is an ERROR it returns ERROR.
     */
    getStatus(): number;
    /**
     * Checks if the status is an ERROR. The Status is an ERROR if one of the
     * contained StatusItems is an ERROR.
     */
    isError(): boolean;
}

export = Status;
