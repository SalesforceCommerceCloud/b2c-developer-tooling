import ExtensibleObject = require('../object/ExtensibleObject');
import CustomAttributes = require('../object/CustomAttributes');

declare global {
    module ICustomAttributes {
        interface ProductListRegistrant extends CustomAttributes {
        }
    }
}

/**
 * A ProductListRegistrant is typically associated with an event related product list
 * such as a gift registry. It holds information about a person associated with the
 * event such as a bride or groom.
 */
declare class ProductListRegistrant extends ExtensibleObject<ICustomAttributes.ProductListRegistrant> {
    /**
     * Returns the email address of the registrant or null.
     */
    email: string | null;
    /**
     * Returns the first name of the registrant or null.
     */
    firstName: string | null;
    /**
     * Returns the last name of the registrant or null.
     */
    lastName: string | null;
    /**
     * Returns the role of the registrant or null. The role of a registrant
     * can be for example the bride of a bridal couple.
     */
    role: string | null;
    private constructor();
    /**
     * Returns the email address of the registrant or null.
     */
    getEmail(): string | null;
    /**
     * Returns the first name of the registrant or null.
     */
    getFirstName(): string | null;
    /**
     * Returns the last name of the registrant or null.
     */
    getLastName(): string | null;
    /**
     * Returns the role of the registrant or null. The role of a registrant
     * can be for example the bride of a bridal couple.
     */
    getRole(): string | null;
    /**
     * Sets the email address of the registrant.
     */
    setEmail(email: string): void;
    /**
     * Sets the first name of the registrant.
     */
    setFirstName(firstName: string): void;
    /**
     * Sets the last name of the registrant.
     */
    setLastName(lastName: string): void;
    /**
     * Sets the role of the registrant.
     */
    setRole(role: string): void;
}

export = ProductListRegistrant;
