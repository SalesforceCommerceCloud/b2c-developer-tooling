import ExtensibleObject = require('../object/ExtensibleObject');
import CustomAttributes = require('../object/CustomAttributes');

declare global {
    module ICustomAttributes {
        interface SitePreferences extends CustomAttributes {
        }
    }
}

/**
 * SitePreferences is a container for custom site-level attributes. The object
 * corresponds with system object type "SitePreferences". It has no system
 * attributes and exists only as a place for merchants to define custom
 * attributes which need to be available for each site.
 * 
 * Logically there is only one SitePreferences instance per site. The instance
 * is obtained by calling dw.system.Site.getPreferences. Once an
 * instance of the container is obtained, it is possible to read/write site
 * preference values by using the usual syntax for
 * dw.object.ExtensibleObject instances. For example:
 * 
 * ```
 * var sitePrefs : SitePreferences = dw.system.Site.getCurrent().getPreferences();
 * var mySitePrefValue : String = sitePrefs.getCustom()["mySitePref"];
 * ```
 * 
 * Note: this class allows access to sensitive security-related data.
 * Pay special attention to PCI DSS v3. requirements 2, 4, and 12.
 * 
 * Commerce Cloud Digital defines many site-level preferences, relating to
 * baskets, timezone, locales, customers, etc, which can be managed within the
 * "Site Preferences" module of the Business Manager, but these preferences are
 * not accessible through this object. (SourceCodeURLParameterName is the one
 * exception to this rule.)
 */
declare class SitePreferences extends ExtensibleObject<ICustomAttributes.SitePreferences> {
    /**
     * Returns the name of the source code url paremeter configured for the
     * site.
     */
    readonly sourceCodeURLParameterName: string;
    private constructor();
    /**
     * Returns the name of the source code url paremeter configured for the
     * site.
     */
    getSourceCodeURLParameterName(): string;
}

export = SitePreferences;
