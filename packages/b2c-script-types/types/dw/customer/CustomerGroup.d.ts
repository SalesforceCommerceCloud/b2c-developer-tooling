import ExtensibleObject = require('../object/ExtensibleObject');
import CustomAttributes = require('../object/CustomAttributes');
import Customer = require('./Customer');

declare global {
    module ICustomAttributes {
        interface CustomerGroup extends CustomAttributes {
        }
    }
}

/**
 * CustomerGroups provide a means to segment customers by various criteria. A
 * merchant can then provide different site experiences (e.g. promotions,
 * prices, sorting rules) to each customer segment. Customer groups can consist
 * of either an explicit list of customers or a business rule that dynamically
 * determines whether a customer is a member. The former type is called
 * "explicit" and the latter type is called "dynamic".
 * 
 * - Explicit customer group: Consists of an explicit list of
 * customers. Only registered customers can be member of such a group.
 * isRuleBased==false.
 * - Dynamic customer group: Memberships are evaluated by a business
 * rule that is attached to the customer group. Registered as well as anonymous
 * customers can be member of such a group. isRuleBased==true.
 * 
 * Note: this class might allow access to sensitive personal and private
 * information, depending on how you segment your customers and the names given to
 * your custoemer groups. Pay attention to appropriate legal and regulatory requirements
 * when developing with this data.
 */
declare class CustomerGroup extends ExtensibleObject<ICustomAttributes.CustomerGroup> {
    /**
     * Returns the unique ID of the customer group.
     */
    readonly ID: string;
    /**
     * Gets the value of the description of the customer group.
     */
    readonly description: string;
    /**
     * Returns true if the group determines the membership of customers
     * based on rules. Returns false if the group provides explicit assignement
     * of customers.
     */
    readonly ruleBased: boolean;
    private constructor();
    /**
     * Assigns the specified customer to this group.
     * 
     * The customer must be registered and the group must not be rule-based.
     */
    assignCustomer(customer: Customer): void;
    /**
     * Gets the value of the description of the customer group.
     */
    getDescription(): string;
    /**
     * Returns the unique ID of the customer group.
     */
    getID(): string;
    /**
     * Returns true if the group determines the membership of customers
     * based on rules. Returns false if the group provides explicit assignement
     * of customers.
     */
    isRuleBased(): boolean;
    /**
     * Unassigns the specified customer from this group.
     * 
     * The customer must be registered and the group must not be rule-based.
     */
    unassignCustomer(customer: Customer): void;
}

export = CustomerGroup;
