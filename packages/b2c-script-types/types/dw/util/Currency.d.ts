/**
 * Represents a currency supported by the system.
 */
declare class Currency {
    /**
     * Gets the ISO 4217 mnemonic currency code of this currency.
     */
    readonly currencyCode: string;
    /**
     * Gets the default number of fraction digits used with this currency.
     * For example, the default number of fraction digits for the Euro is 2,
     * while for the Japanese Yen it's 0.
     */
    readonly defaultFractionDigits: number;
    /**
     * Gets a long name for this currency. e.g. "United States Dollar".
     * The returned name is the one stored in the system for this currency.
     * Currently only English names are available, but in the future
     * this method may return a locale-specific name.
     */
    readonly name: string;
    /**
     * Gets the symbol of this currency. e.g. "$" for the US Dollar.
     */
    readonly symbol: string;
    private constructor();
    /**
     * Returns a `Currency` instance for the given currency code,
     * or `null` if there is no such currency.
     */
    static getCurrency(currencyCode: string): Currency | null;
    /**
     * Gets the ISO 4217 mnemonic currency code of this currency.
     */
    getCurrencyCode(): string;
    /**
     * Gets the default number of fraction digits used with this currency.
     * For example, the default number of fraction digits for the Euro is 2,
     * while for the Japanese Yen it's 0.
     */
    getDefaultFractionDigits(): number;
    /**
     * Gets a long name for this currency. e.g. "United States Dollar".
     * The returned name is the one stored in the system for this currency.
     * Currently only English names are available, but in the future
     * this method may return a locale-specific name.
     */
    getName(): string;
    /**
     * Gets the symbol of this currency. e.g. "$" for the US Dollar.
     */
    getSymbol(): string;
    /**
     * Returns the ISO 4217 mnemonic currency code of this currency.
     */
    toString(): string;
}

export = Currency;
