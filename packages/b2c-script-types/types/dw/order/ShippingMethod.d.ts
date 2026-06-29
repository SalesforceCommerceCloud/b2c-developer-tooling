import ExtensibleObject = require('../object/ExtensibleObject');
import CustomAttributes = require('../object/CustomAttributes');
import Collection = require('../util/Collection');
import CustomerGroup = require('../customer/CustomerGroup');

declare global {
    module ICustomAttributes {
        interface ShippingMethod extends CustomAttributes {
        }
    }
}

/**
 * ShippingMethod represents how the shipment will be shipped.
 */
declare class ShippingMethod extends ExtensibleObject<ICustomAttributes.ShippingMethod> {
    /**
     * Returns the ID of the shipping method.
     */
    readonly ID: string;
    /**
     * Returns the base shipping method or null if undefined.
     */
    readonly baseMethod: ShippingMethod | null;
    /**
     * Returns the currency code associated with the shipping method
     */
    readonly currencyCode: string;
    /**
     * Returns the customer groups assigned to the shipping method.
     * Assigned ids that do not belong to an existing customer group are ignored.
     */
    readonly customerGroups: Collection<CustomerGroup>;
    /**
     * Returns 'true' if the shipping method is marked as 'default' for the current session's currency.
     * Otherwise 'false' is returned.
     */
    readonly defaultMethod: boolean;
    /**
     * Returns the dependent shipping methods of this shipping method,
     * regardless of the online status of the methods.
     * 
     * Dependent shipping methods have this method as their base method.
     */
    readonly dependentMethods: Collection<ShippingMethod>;
    /**
     * Returns the description of the shipping method as specified in the current locale or
     * null if it could not be found.
     */
    readonly description: string | null;
    /**
     * Returns the display name of the shipping method in the current locale or
     * null if it could not be found.
     */
    readonly displayName: string | null;
    /**
     * Returns true if shipping method is online, false otherwise
     */
    readonly online: boolean;
    /**
     * Returns the tax class id of the shipping method.
     */
    readonly taxClassID: string;
    private constructor();
    /**
     * Returns the base shipping method or null if undefined.
     */
    getBaseMethod(): ShippingMethod | null;
    /**
     * Returns the currency code associated with the shipping method
     */
    getCurrencyCode(): string;
    /**
     * Returns the customer groups assigned to the shipping method.
     * Assigned ids that do not belong to an existing customer group are ignored.
     */
    getCustomerGroups(): Collection<CustomerGroup>;
    /**
     * Returns the dependent shipping methods of this shipping method,
     * regardless of the online status of the methods.
     * 
     * Dependent shipping methods have this method as their base method.
     */
    getDependentMethods(): Collection<ShippingMethod>;
    /**
     * Returns the description of the shipping method as specified in the current locale or
     * null if it could not be found.
     */
    getDescription(): string | null;
    /**
     * Returns the display name of the shipping method in the current locale or
     * null if it could not be found.
     */
    getDisplayName(): string | null;
    /**
     * Returns the ID of the shipping method.
     */
    getID(): string;
    /**
     * Returns the tax class id of the shipping method.
     */
    getTaxClassID(): string;
    /**
     * Returns 'true' if the shipping method is marked as 'default' for the current session's currency.
     * Otherwise 'false' is returned.
     */
    isDefaultMethod(): boolean;
    /**
     * Returns true if shipping method is online, false otherwise
     */
    isOnline(): boolean;
}

export = ShippingMethod;
