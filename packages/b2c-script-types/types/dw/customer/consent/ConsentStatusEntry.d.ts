/**
 * Represents the consent status for a specific channel and contact point.
 * 
 * This class provides information about the shopper's consent status (OPT_IN, OPT_OUT)
 * for a particular marketing communication channel.
 */
declare class ConsentStatusEntry {
    /**
     * Returns the channel type for this consent status entry.
     */
    readonly channel: string;
    /**
     * Returns the contact point value (email address or phone number) for this consent entry.
     */
    readonly contactPointValue: string;
    /**
     * Returns the consent status.
     */
    readonly status: string;
    private constructor();
    /**
     * Returns the channel type for this consent status entry.
     */
    getChannel(): string;
    /**
     * Returns the contact point value (email address or phone number) for this consent entry.
     */
    getContactPointValue(): string;
    /**
     * Returns the consent status.
     */
    getStatus(): string;
}

export = ConsentStatusEntry;
