import ExtensibleObject = require('../object/ExtensibleObject');
import CustomAttributes = require('../object/CustomAttributes');
import Collection = require('../util/Collection');
import Promotion = require('./Promotion');
import CustomerGroup = require('../customer/CustomerGroup');
import SourceCodeGroup = require('./SourceCodeGroup');
import Coupon = require('./Coupon');
import Store = require('../catalog/Store');
import StoreGroup = require('../catalog/StoreGroup');

declare global {
    module ICustomAttributes {
        interface Campaign extends CustomAttributes {
        }
    }
}

/**
 * A Campaign is a set of experiences (or site configurations) which may be
 * deployed as a single unit for a given time frame.  The system currently
 * supports 3 types of experience that may be assigned to a campaign:
 * 
 * - Promotions
 * - Slot Configurations
 * - Sorting Rules
 * 
 * This list may be extended in the future.
 * 
 * A campaign can have a start and end date or be open-ended.  It may also have
 * "qualifiers" which determine which customers the campaign applies to.
 * The currently supported qualifiers are:
 * 
 * - Customer groups (where "Everyone" is a possible customer group)
 * - Source codes
 * - Coupons
 * 
 * A campaign can have list of stores or store groups where it can be applicable to.
 */
declare class Campaign extends ExtensibleObject<ICustomAttributes.Campaign> {
    /**
     * Returns the unique campaign ID.
     */
    readonly ID: string;
    /**
     * Returns 'true' if the campaign is currently active, otherwise
     * 'false'.
     * 
     * A campaign is active if it is enabled and scheduled for now.
     */
    readonly active: boolean;
    /**
     * Returns true if campaign is applicable to store, otherwise false.
     */
    readonly applicableInStore: boolean;
    /**
     * Returns true if campaign is applicable to online site, otherwise false.
     */
    readonly applicableOnline: boolean;
    /**
     * Returns the coupons assigned to the campaign.
     */
    readonly coupons: Collection<Coupon>;
    /**
     * Returns the customer groups assigned to the campaign.
     */
    readonly customerGroups: Collection<CustomerGroup>;
    /**
     * Returns the internal description of the campaign.
     */
    readonly description: string;
    /**
     * Returns true if campaign is enabled, otherwise false.
     */
    readonly enabled: boolean;
    /**
     * Returns the end date of the campaign. If no end date is defined for the
     * campaign, null is returned. A campaign w/o end date will run forever.
     */
    readonly endDate: Date | null;
    /**
     * Returns promotions defined in this campaign in no particular order.
     */
    readonly promotions: Collection<Promotion>;
    /**
     * Returns the source codes assigned to the campaign.
     */
    readonly sourceCodeGroups: Collection<SourceCodeGroup>;
    /**
     * Returns the start date of the campaign. If no start date is defined for the
     * campaign, null is returned. A campaign w/o start date is immediately
     * effective.
     */
    readonly startDate: Date | null;
    /**
     * Returns store groups assigned to the campaign.
     */
    readonly storeGroups: Collection<StoreGroup>;
    /**
     * Returns stores assigned to the campaign.
     */
    readonly stores: Collection<Store>;
    private constructor();
    /**
     * Returns the coupons assigned to the campaign.
     */
    getCoupons(): Collection<Coupon>;
    /**
     * Returns the customer groups assigned to the campaign.
     */
    getCustomerGroups(): Collection<CustomerGroup>;
    /**
     * Returns the internal description of the campaign.
     */
    getDescription(): string;
    /**
     * Returns the end date of the campaign. If no end date is defined for the
     * campaign, null is returned. A campaign w/o end date will run forever.
     */
    getEndDate(): Date | null;
    /**
     * Returns the unique campaign ID.
     */
    getID(): string;
    /**
     * Returns promotions defined in this campaign in no particular order.
     */
    getPromotions(): Collection<Promotion>;
    /**
     * Returns the source codes assigned to the campaign.
     */
    getSourceCodeGroups(): Collection<SourceCodeGroup>;
    /**
     * Returns the start date of the campaign. If no start date is defined for the
     * campaign, null is returned. A campaign w/o start date is immediately
     * effective.
     */
    getStartDate(): Date | null;
    /**
     * Returns store groups assigned to the campaign.
     */
    getStoreGroups(): Collection<StoreGroup>;
    /**
     * Returns stores assigned to the campaign.
     */
    getStores(): Collection<Store>;
    /**
     * Returns 'true' if the campaign is currently active, otherwise
     * 'false'.
     * 
     * A campaign is active if it is enabled and scheduled for now.
     */
    isActive(): boolean;
    /**
     * Returns true if campaign is applicable to store, otherwise false.
     */
    isApplicableInStore(): boolean;
    /**
     * Returns true if campaign is applicable to online site, otherwise false.
     */
    isApplicableOnline(): boolean;
    /**
     * Returns true if campaign is enabled, otherwise false.
     */
    isEnabled(): boolean;
}

export = Campaign;
