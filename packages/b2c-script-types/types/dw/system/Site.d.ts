import List = require('../util/List');
import SitePreferences = require('./SitePreferences');
import Calendar = require('../util/Calendar');
import PageMetaTag = require('../web/PageMetaTag');

/**
 * This class represents a site in Commerce Cloud Digital and provides access to
 * several site-level configuration values which are managed from within the
 * Business Manager. It is only possible to get a reference to the current site
 * as determined by the current request. The static method
 * dw.system.Site.getCurrent returns a reference to the current site.
 */
declare class Site {
    /**
     * Constant that represents the Site under maintenance/offline
     */
    static readonly SITE_STATUS_MAINTENANCE = 3;
    /**
     * Constant that represents the Site is Online
     */
    static readonly SITE_STATUS_ONLINE = 1;
    /**
     * Constant that represents the Site is in preview mode or online/password (protected)
     */
    static readonly SITE_STATUS_PROTECTED = 5;
    /**
     * Returns the ID of the site.
     */
    readonly ID: string;
    /**
     * Whether oms is active in the current site. This depends on a general
     * property which states whether oms is active for the server,
     * and a site-dependent preference whether oms is available for the current site.
     * @deprecated
     */
    readonly OMSEnabled: boolean;
    /**
     * Returns all sites.
     */
    static readonly allSites: List<Site>;
    /**
     * Returns the allowed currencies of the current site as a collection of
     * currency codes.
     */
    readonly allowedCurrencies: List<string>;
    /**
     * Returns the allowed locales of the current site as a collection of
     * locale ID's.
     */
    readonly allowedLocales: List<string>;
    /**
     * Returns a new Calendar object in the time zone of the
     * current site.
     */
    static readonly calendar: Calendar;
    /**
     * Returns the default currency code for the current site.
     * @deprecated Use getDefaultCurrency method instead,
     */
    readonly currencyCode: string;
    /**
     * Returns the current site.
     */
    static readonly current: Site;
    /**
     * Returns the default currency code for the current site.
     */
    readonly defaultCurrency: string;
    /**
     * Return default locale for the site.
     */
    readonly defaultLocale: string;
    /**
     * Returns the Einstein site Id. Typically this is a concatenation of the realm, underscore character and the site id.
     * It can be overwritten by support users to help with realm moves to continue using the Einstein data from the old realm.
     * Used when making calls to the Einstein APIs.
     */
    readonly einsteinSiteID: string;
    /**
     * Returns the configured HTTP host name. If no host name
     * is configured the method returns the instance hostname.
     */
    readonly httpHostName: string;
    /**
     * Returns the configured HTTPS host name. If no host name
     * is configured the method returns the HTTP host name or the instance hostname, if
     * that is not configured as well.
     */
    readonly httpsHostName: string;
    /**
     * Returns a descriptive name for the site.
     */
    readonly name: string;
    /**
     * Returns all page meta tags, defined for this instance for which content can be generated.
     * 
     * The meta tag content is generated based on the home page meta tag context and rules.
     * The rules are obtained from the current repository domain.
     */
    readonly pageMetaTags: Array<PageMetaTag>;
    /**
     * This method returns a container of all site preferences of this site.
     */
    readonly preferences: SitePreferences;
    /**
     * Returns the status of this site.
     * 
     * Possible values are SITE_STATUS_ONLINE, SITE_STATUS_MAINTENANCE, SITE_STATUS_PROTECTED
     */
    readonly status: number;
    /**
     * Returns the code for the time zone in which the storefront is
     * running.
     */
    readonly timezone: string;
    /**
     * Returns time zone offset in which the storefront is running.
     */
    readonly timezoneOffset: number;
    private constructor();
    /**
     * Returns all sites.
     */
    static getAllSites(): List<Site>;
    /**
     * Returns a new Calendar object in the time zone of the
     * current site.
     */
    static getCalendar(): Calendar;
    /**
     * Returns the current site.
     */
    static getCurrent(): Site;
    /**
     * Returns the allowed currencies of the current site as a collection of
     * currency codes.
     */
    getAllowedCurrencies(): List<string>;
    /**
     * Returns the allowed locales of the current site as a collection of
     * locale ID's.
     */
    getAllowedLocales(): List<string>;
    /**
     * Returns the default currency code for the current site.
     * @deprecated Use getDefaultCurrency method instead,
     */
    getCurrencyCode(): string;
    /**
     * Returns a custom preference value. If the preference does not exist the
     * method returns null.  This method is simply a shortcut method for
     * accessing the value for a custom attribute defined on the
     * dw.system.SitePreferences object.
     * @example
     * // Method #1
     * var mySitePrefValue1 : String =  dw.system.Site.getCurrent().
     * getCustomPreferenceValue("mySitePref");
     * 
     * // Method #2
     * var sitePrefs : SitePreferences = dw.system.Site.getCurrent().getPreferences();
     * var mySitePrefValue2 : String = sitePrefs.getCustom()["mySitePref"];
     */
    getCustomPreferenceValue(name: string): any | null;
    /**
     * Returns the default currency code for the current site.
     */
    getDefaultCurrency(): string;
    /**
     * Return default locale for the site.
     */
    getDefaultLocale(): string;
    /**
     * Returns the Einstein site Id. Typically this is a concatenation of the realm, underscore character and the site id.
     * It can be overwritten by support users to help with realm moves to continue using the Einstein data from the old realm.
     * Used when making calls to the Einstein APIs.
     */
    getEinsteinSiteID(): string;
    /**
     * Returns the configured HTTP host name. If no host name
     * is configured the method returns the instance hostname.
     */
    getHttpHostName(): string;
    /**
     * Returns the configured HTTPS host name. If no host name
     * is configured the method returns the HTTP host name or the instance hostname, if
     * that is not configured as well.
     */
    getHttpsHostName(): string;
    /**
     * Returns the ID of the site.
     */
    getID(): string;
    /**
     * Returns a descriptive name for the site.
     */
    getName(): string;
    /**
     * Returns the page meta tag for the specified id.
     * 
     * The meta tag content is generated based on the home page meta tag context and rule.
     * The rule is obtained from the current repository domain.
     * 
     * Null will be returned if the meta tag is undefined on the current instance, or if no rule can be found for the
     * current context, or if the rule resolves to an empty string.
     */
    getPageMetaTag(id: string): PageMetaTag | null;
    /**
     * Returns all page meta tags, defined for this instance for which content can be generated.
     * 
     * The meta tag content is generated based on the home page meta tag context and rules.
     * The rules are obtained from the current repository domain.
     */
    getPageMetaTags(): Array<PageMetaTag>;
    /**
     * This method returns a container of all site preferences of this site.
     */
    getPreferences(): SitePreferences;
    /**
     * Returns the status of this site.
     * 
     * Possible values are SITE_STATUS_ONLINE, SITE_STATUS_MAINTENANCE, SITE_STATUS_PROTECTED
     */
    getStatus(): number;
    /**
     * Returns the code for the time zone in which the storefront is
     * running.
     */
    getTimezone(): string;
    /**
     * Returns time zone offset in which the storefront is running.
     */
    getTimezoneOffset(): number;
    /**
     * Whether oms is active in the current site. This depends on a general
     * property which states whether oms is active for the server,
     * and a site-dependent preference whether oms is available for the current site.
     * @deprecated
     */
    isOMSEnabled(): boolean;
    /**
     * The method sets a value for a custom preference. The type of the value
     * must match with the declared type of the preference definition.
     */
    setCustomPreferenceValue(name: string, value: any): void;
}

export = Site;
