/**
 * Represents a Locale supported by the system.
 */
declare class Locale {
    /**
     * Returns the String representation of the localeID.
     * 
     * Combines the language and the country key, concatenated with "_".
     * For example: "en_US". This attribute is the primary key of the class.
     */
    readonly ID: string;
    /**
     * Returns the uppercase ISO 3166 3-letter country/region code for this Locale.
     * If no country has been specified for this Locale, this value is an empty string.
     */
    readonly ISO3Country: string;
    /**
     * Returns the 3-letter ISO 639 language code for this Locale.
     * If no language has been specified for this Locale, this value is an empty string.
     */
    readonly ISO3Language: string;
    /**
     * Returns the uppercase ISO 3166 2-letter country/region code for this Locale.
     * If no country has been specified for this Locale, this value is an empty string.
     */
    readonly country: string;
    /**
     * Returns the display name of this Locale's country, in this Locale's language,
     * not in the session locale's language.
     * If no country has been specified for this Locale, this value is an empty string.
     */
    readonly displayCountry: string;
    /**
     * Returns the display name of this Locale's language, in this Locale's language,
     * not in the session locale's language.
     * If no country has been specified for this Locale, this value is an empty string.
     */
    readonly displayLanguage: string;
    /**
     * Returns the display name of this Locale, in this Locale's language,
     * not in the session locale's language.
     * If no display name has been specified for this Locale, this value is an empty string.
     */
    readonly displayName: string;
    /**
     * Returns the lowercase ISO 639 language code for this Locale.
     * If no language has been specified for this Locale, this value is an empty string.
     */
    readonly language: string;
    private constructor();
    /**
     * Returns a Locale instance for the given localeId, or
     * `null` if no such Locale could be found.
     */
    static getLocale(localeId: string): Locale | null;
    /**
     * Returns the uppercase ISO 3166 2-letter country/region code for this Locale.
     * If no country has been specified for this Locale, this value is an empty string.
     */
    getCountry(): string;
    /**
     * Returns the display name of this Locale's country, in this Locale's language,
     * not in the session locale's language.
     * If no country has been specified for this Locale, this value is an empty string.
     */
    getDisplayCountry(): string;
    /**
     * Returns the display name of this Locale's language, in this Locale's language,
     * not in the session locale's language.
     * If no country has been specified for this Locale, this value is an empty string.
     */
    getDisplayLanguage(): string;
    /**
     * Returns the display name of this Locale, in this Locale's language,
     * not in the session locale's language.
     * If no display name has been specified for this Locale, this value is an empty string.
     */
    getDisplayName(): string;
    /**
     * Returns the String representation of the localeID.
     * 
     * Combines the language and the country key, concatenated with "_".
     * For example: "en_US". This attribute is the primary key of the class.
     */
    getID(): string;
    /**
     * Returns the uppercase ISO 3166 3-letter country/region code for this Locale.
     * If no country has been specified for this Locale, this value is an empty string.
     */
    getISO3Country(): string;
    /**
     * Returns the 3-letter ISO 639 language code for this Locale.
     * If no language has been specified for this Locale, this value is an empty string.
     */
    getISO3Language(): string;
    /**
     * Returns the lowercase ISO 639 language code for this Locale.
     * If no language has been specified for this Locale, this value is an empty string.
     */
    getLanguage(): string;
    /**
     * Returns the String representation of the localeID.
     * 
     * Combines the language and the country key, concatenated with "_".
     * For example: "en_US". This attribute is the primary key of the class.
     */
    toString(): string;
}

export = Locale;
