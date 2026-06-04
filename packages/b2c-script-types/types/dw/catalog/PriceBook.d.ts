import ExtensibleObject = require('../object/ExtensibleObject');
import CustomAttributes = require('../object/CustomAttributes');

declare global {
    module ICustomAttributes {
        interface PriceBook extends CustomAttributes {
        }
    }
}

/**
 * Represents a price book.
 */
declare class PriceBook extends ExtensibleObject<ICustomAttributes.PriceBook> {
    /**
     * Returns the ID of the price book.
     */
    readonly ID: string;
    /**
     * Returns the currency code of the price book.
     */
    readonly currencyCode: string;
    /**
     * Returns the description of the price book.
     */
    readonly description: string;
    /**
     * Returns the display name of the price book.
     */
    readonly displayName: string;
    /**
     * Returns the online status of the price book. The online status
     * is calculated from the online status flag and the onlineFrom
     * onlineTo dates defined for the price book.
     */
    readonly online: boolean;
    /**
     * Returns the online status flag of the price book.
     */
    readonly onlineFlag: boolean;
    /**
     * Returns the date from which the price book is online or valid.
     */
    readonly onlineFrom: Date;
    /**
     * Returns the date until which the price book is online or valid.
     */
    readonly onlineTo: Date;
    /**
     * Returns the parent price book.
     */
    readonly parentPriceBook: PriceBook;
    private constructor();
    /**
     * Returns the currency code of the price book.
     */
    getCurrencyCode(): string;
    /**
     * Returns the description of the price book.
     */
    getDescription(): string;
    /**
     * Returns the display name of the price book.
     */
    getDisplayName(): string;
    /**
     * Returns the ID of the price book.
     */
    getID(): string;
    /**
     * Returns the online status flag of the price book.
     */
    getOnlineFlag(): boolean;
    /**
     * Returns the date from which the price book is online or valid.
     */
    getOnlineFrom(): Date;
    /**
     * Returns the date until which the price book is online or valid.
     */
    getOnlineTo(): Date;
    /**
     * Returns the parent price book.
     */
    getParentPriceBook(): PriceBook;
    /**
     * Returns the online status of the price book. The online status
     * is calculated from the online status flag and the onlineFrom
     * onlineTo dates defined for the price book.
     */
    isOnline(): boolean;
}

export = PriceBook;
