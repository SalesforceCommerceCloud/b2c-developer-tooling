import Collection = require('../../util/Collection');
import MarketingConsentSubscription = require('./MarketingConsentSubscription');
import List = require('../../util/List');

/**
 * Provides static helper methods for managing shopper marketing consent subscriptions.
 * 
 * This API enables retrieving and updating marketing consent preferences.
 * Consent subscriptions define communication categories (e.g., "Newsletter", "Product Updates")
 * and the channels (EMAIL, SMS, WHATSAPP) through which marketing communications can be sent.
 * 
 * Prerequisites:
 * 
 * - The Marketing Consent feature must be enabled and configured
 * - For consent status retrieval, the current request must have a customer context
 * 
 * Example usage:
 * @example
 * `
 * var ShopperConsentMgr = require('dw/customer/consent/ShopperConsentMgr');
 * 
 * // Get all subscriptions for the current site
 * var subscriptions = ShopperConsentMgr.getSubscriptions();
 * 
 * for each (var sub in subscriptions) {
 * trace('Subscription: ' + sub.subscriptionId + ' - ' + sub.title);
 * trace('Available channels: ' + sub.channels.join(', '));
 * }
 * 
 * // Get subscriptions with consent status (for authenticated customers)
 * var subsWithStatus = ShopperConsentMgr.getSubscriptions(null, true);
 * 
 * // Update consent for a specific subscription
 * ShopperConsentMgr.updateSubscription(
 * 'customer@example.com',
 * 'newsletter-subscription',
 * 'EMAIL',
 * 'OPT_IN'
 * );
 * `
 * @see MarketingConsentSubscription
 * @see ConsentStatusEntry
 */
declare class ShopperConsentMgr {
    /**
     * Retrieves marketing consent subscriptions for the current site.
     * 
     * This method returns all available consent subscriptions without consent status information.
     * @throws ShopperConsentException if the consent feature is not enabled or retrieval fails.
     */
    static readonly subscriptions: Collection<MarketingConsentSubscription>;
    private constructor();
    /**
     * Retrieves marketing consent subscriptions for the current site.
     * 
     * This method returns all available consent subscriptions without consent status information.
     * @throws ShopperConsentException if the consent feature is not enabled or retrieval fails.
     */
    static getSubscriptions(): Collection<MarketingConsentSubscription>;
    /**
     * Retrieves marketing consent subscriptions for the current site with optional filtering and status.
     * 
     * Use this method to retrieve subscriptions filtered by tags and optionally include
     * the current consent status for authenticated customers.
     * @throws ShopperConsentException if the consent feature is not enabled, retrieval fails, or consent status retrieval fails.
     */
    static getSubscriptions(tags: List<any>, includeConsentStatus: boolean): Collection<MarketingConsentSubscription>;
    /**
     * Updates consent status for a subscription.
     * 
     * This method updates the consent status in Salesforce Core for the specified
     * contact point and subscription channel combination.
     * @throws ShopperConsentException if the consent feature is not enabled or update fails.
     */
    static updateSubscription(contactPointValue: string, subscriptionId: string, channel: string, status: string): void;
}

export = ShopperConsentMgr;
