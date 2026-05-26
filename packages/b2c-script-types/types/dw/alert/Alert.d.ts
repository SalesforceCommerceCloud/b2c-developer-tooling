/**
 * This class represents a single system alert to be shown to a Business Manager user.
 */
declare class Alert {
    /**
     * String constant to denote the 'action required' priority.
     */
    static readonly PRIORITY_ACTION = "ACTION";
    /**
     * String constant to denote the 'informational' priority.
     */
    static readonly PRIORITY_INFO = "INFO";
    /**
     * String constant to denote the 'warning' priority.
     */
    static readonly PRIORITY_WARN = "WARN";
    /**
     * Returns the ID of the referenced alert description.
     */
    readonly alertDescriptorID: string;
    /**
     * Returns the ID of the referenced context object (or null, if no context object is assigned to this alert).
     */
    readonly contextObjectID: string | null;
    /**
     * Resolves the display message to be shown.
     * It refers to the message resource ID specified in the alert descriptor file ("message-resource-id") and the message provided
     * by the 'alerts.properties' resource bundle.
     * When the referenced message contains parameter placeholders (such as '{0}' and '{1}') they are replaced by the parameters stored with the alert.
     */
    readonly displayMessage: string;
    /**
     * Returns the priority assigned to the message.
     * One of the string constants defined in this class (PRIORITY_INFO, PRIORITY_WARN, PRIORITY_ACTION).
     */
    readonly priority: string;
    /**
     * The URL of the page where the user can resolve the alert, as provided in the
     * 'alerts.json' descriptor file.
     */
    readonly remediationURL: string;
    private constructor();
    /**
     * Returns the ID of the referenced alert description.
     */
    getAlertDescriptorID(): string;
    /**
     * Returns the ID of the referenced context object (or null, if no context object is assigned to this alert).
     */
    getContextObjectID(): string | null;
    /**
     * Resolves the display message to be shown.
     * It refers to the message resource ID specified in the alert descriptor file ("message-resource-id") and the message provided
     * by the 'alerts.properties' resource bundle.
     * When the referenced message contains parameter placeholders (such as '{0}' and '{1}') they are replaced by the parameters stored with the alert.
     */
    getDisplayMessage(): string;
    /**
     * Returns the priority assigned to the message.
     * One of the string constants defined in this class (PRIORITY_INFO, PRIORITY_WARN, PRIORITY_ACTION).
     */
    getPriority(): string;
    /**
     * The URL of the page where the user can resolve the alert, as provided in the
     * 'alerts.json' descriptor file.
     */
    getRemediationURL(): string;
}

export = Alert;
