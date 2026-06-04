import Collection = require('../../util/Collection');
import ConsentStatusEntry = require('./ConsentStatusEntry');

/**
 * Represents a marketing consent subscription for a shopper.
 * 
 * A marketing consent subscription defines a communication preference category (e.g., "Newsletter", "Product Updates")
 * with associated channels (EMAIL, SMS, WHATSAPP) through which the shopper can receive marketing communications.
 * 
 * Example usage:
 * @example
 * `
 * var subscriptions = dw.customer.consent.ShopperConsentMgr.getSubscriptions();
 * for each (var sub in subscriptions) {
 * trace('Subscription: ' + sub.subscriptionId + ' - ' + sub.title);
 * trace('Channels: ' + sub.channels);
 * }
 * `
 */
declare class MarketingConsentSubscription {
    /**
     * Returns the available channels for this subscription.
     * 
     * Channels represent the communication methods (EMAIL, SMS, WHATSAPP) available for this subscription.
     */
    readonly channels: string[];
    /**
     * Returns whether consent is required for this subscription.
     */
    readonly consentRequired: boolean;
    /**
     * Returns the consent status entries for this subscription.
     * 
     * This is only populated when the 'includeConsentStatus' parameter is true in the getSubscriptions call, and the
     * customer is authenticated.
     */
    readonly consentStatus: Collection<ConsentStatusEntry> | null;
    /**
     * Returns the consent type for this subscription.
     */
    readonly consentType: string;
    /**
     * Returns the default consent status for this subscription.
     */
    readonly defaultStatus: string;
    /**
     * Returns the unique identifier for this subscription.
     */
    readonly subscriptionId: string;
    /**
     * Returns the localized subtitle of this subscription.
     */
    readonly subtitle: string;
    /**
     * Returns the tags associated with this subscription.
     * 
     * Tags can be used to categorize and filter subscriptions.
     */
    readonly tags: string[];
    /**
     * Returns the localized title of this subscription.
     */
    readonly title: string;
    private constructor();
    /**
     * Returns the available channels for this subscription.
     * 
     * Channels represent the communication methods (EMAIL, SMS, WHATSAPP) available for this subscription.
     */
    getChannels(): string[];
    /**
     * Returns whether consent is required for this subscription.
     */
    getConsentRequired(): boolean;
    /**
     * Returns the consent status entries for this subscription.
     * 
     * This is only populated when the 'includeConsentStatus' parameter is true in the getSubscriptions call, and the
     * customer is authenticated.
     */
    getConsentStatus(): Collection<ConsentStatusEntry> | null;
    /**
     * Returns the consent type for this subscription.
     */
    getConsentType(): string;
    /**
     * Returns the default consent status for this subscription.
     */
    getDefaultStatus(): string;
    /**
     * Returns the unique identifier for this subscription.
     */
    getSubscriptionId(): string;
    /**
     * Returns the localized subtitle of this subscription.
     */
    getSubtitle(): string;
    /**
     * Returns the tags associated with this subscription.
     * 
     * Tags can be used to categorize and filter subscriptions.
     */
    getTags(): string[];
    /**
     * Returns the localized title of this subscription.
     */
    getTitle(): string;
}

export = MarketingConsentSubscription;
