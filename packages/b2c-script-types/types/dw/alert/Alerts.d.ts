import PersistentObject = require('../object/PersistentObject');
import List = require('../util/List');
import Alert = require('./Alert');

/**
 * 
 * Allow creation, removal, re-validation and retrieval of alerts that might get visible to Business Manager users.
 * 
 * The alerts have to be registered by the 'alerts.json' descriptor file in a cartridge assigned to the Business Manager site.
 * The descriptor file itself has to be defined in 'package.json' of that cartridge using a property 'alerts' and providing its path
 * that is relative to the 'package.json'.
 * The 'alert.json' descriptor files contain the 'alert descriptions', which are referenced by their ID throughout the API.
 * 
 * For example, the 'alerts.json' file could have the following content:
 * 
 * ```
 * {
 * "alerts": [
 * {
 * "alert-id": "missing_org_config",
 * "menu-action": "global-prefs_custom_prefs",
 * "message-resource-id": "global.missing_org_config",
 * "priority": "ACTION",
 * "remediation": {
 * "pipeline":"GlobalCustomPreferences",
 * "start-node":"View"
 * }
 * },
 * {
 * "alert-id":"promo_in_past",
 * "menu-action":"marketing_promotions",
 * "context-object-type":"Promotion",
 * "message-resource-id":"promotion.in_the_past",
 * "priority":"WARN",
 * "remediation": {
 * "pipeline":"ViewApplication",
 * "start-node":"BM",
 * "parameter":"screen=Promotion"
 * }
 * }
 * ]
 * }
 * ```
 * 
 * The referenced menu actions can be found in the 'bm_extensions.xml' file of a Business manager extension cartridge
 * (a sample file containing all current menu entries is provided when creating a new extension cartridge in Studio).
 */
declare class Alerts {
    private constructor();
    /**
     * Creates a new alert for the given ID.
     * If such an alert already exists, no new one is created, and the existing one is not modified.
     */
    static addAlert(alertDescriptorID: string, params: string[]): void;
    /**
     * Creates a new alert for the given ID and context object.
     * If such an alert already exists, no new one is created, and the existing one is not modified.
     * Multiple alerts for the same alert descriptor ID may exist, as long as they reference different objects.
     * To refer to the same alert afterwards (e.g. to remove the alert) the same object must be provided.
     */
    static addAlert(alertDescriptorID: string, contextObject: PersistentObject, params: string[]): void;
    /**
     * Creates a new alert for the given ID and ID of the context object.
     * If such an alert already exists, no new one is created, and the existing one is not modified.
     * Multiple alerts for the same alert descriptor ID may exist, as long as they reference different objects.
     * To refer to the same alert afterwards (e.g. to remove it) the same object ID must be provided.
     * 
     * Use this method when the alerts refers to an object which is not a PersistentObject.
     */
    static addAlert(alertDescriptorID: string, contextObjectID: string, params: string[]): void;
    /**
     * Retrieves all alerts for a set of alert descriptor ID.
     */
    static getAlerts(...alertDescriptorIDs: string[]): List<Alert>;
    /**
     * Retrieves all alerts for a set of alert descriptor ID and the given context object ID.
     */
    static getAlertsForContextObject(contextObjectID: string, ...alertDescriptorIDs: string[]): List<Alert>;
    /**
     * Retrieves all alerts for a set of alert descriptor ID and the given context object.
     */
    static getAlertsForContextObject(contextObject: PersistentObject, ...alertDescriptorIDs: string[]): List<Alert>;
    /**
     * Removes all alerts for the given alert descriptor ID. This method will remove also alert referencing
     * context objects, as long as they reference the same alert description.
     */
    static removeAlert(alertDescriptorID: string): void;
    /**
     * Removes the alert for the given alert description and context object.
     */
    static removeAlert(alertDescriptorID: string, contextObject: PersistentObject): void;
    /**
     * Removes the alert for the given alert description and context object ID.
     */
    static removeAlert(alertDescriptorID: string, contextObjectID: string): void;
    /**
     * Re-evaluates the process function, and creates or removes the respective alert.
     * The process function must return true when the alert should be created, and false when it should be removed.
     * When the process function states that the alert should be created, but it already exists, it is not created again. Instead, the existing
     * alert is updated with the supplied parameters.
     */
    static revalidateAlert(alertDescriptorID: string, processFunction: Function, params: string[]): void;
    /**
     * Re-evaluates the process function, and creates or removes the respective alert. The context object is handed as the only parameter to the process function.
     * The process function must return true when the alert should be created, and false when it should be removed.
     * When the process function states that the alert should be created, but it already exists, it is not created again. Instead, the existing
     * alert is updated with the supplied parameters.
     */
    static revalidateAlert(alertDescriptorID: string, contextObject: PersistentObject, processFunction: Function, params: string[]): void;
    /**
     * Re-evaluates the process function, and creates or removes the respective alert. When the optional
     * context object is supplied, it is handed as the only parameter to the process function (if its not supplied,
     * no parameter is given to the function).
     * The process function must return true when the alert should be created, and false when it should be removed.
     * When the process function states that the alert should be created, but it already exists, it is not created again. Instead, the existing
     * alert is updated with the supplied parameters.
     * Use this variant of the function when the context object is not a persistent object. In this case the ID to be assigned
     * to the alert must be supplied as an additional parameter. (Either both the context object and the ID must be provided, or none of them)
     */
    static revalidateAlert(alertDescriptorID: string, contextObject: any, contextObjectID: string, processFunction: Function, params: string[]): void;
}

export = Alerts;
