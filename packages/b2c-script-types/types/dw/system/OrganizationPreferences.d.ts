import ExtensibleObject = require('../object/ExtensibleObject');
import CustomAttributes = require('../object/CustomAttributes');

declare global {
    module ICustomAttributes {
        interface OrganizationPreferences extends CustomAttributes {
        }
    }
}

/**
 * OrganizationPreferences is a container for custom global (i.e.
 * organization-level) attributes. The object corresponds with system object
 * definition "OrganizationPreferences". It has no system attributes and exists
 * only as a place for merchants to define custom attributes which need to be
 * available to all of their sites.
 * 
 * An instance is obtained by calling dw.system.System.getPreferences.
 * Once an instance of the container is obtained, it is possible to read/write
 * organization preference values by using the usual syntax for
 * dw.object.ExtensibleObject instances. For example:
 * 
 * ```
 * var orgPrefs : OrganizationPreferences = dw.system.System.getPreferences();
 * var myOrgPrefValue : String = orgPrefs.getCustom()["myOrgPref"];
 * ```
 * 
 * Note: this class allows access to sensitive security-related data.
 * Pay special attention to PCI DSS v3. requirements 2, 4, and 12.
 * 
 * Commerce Cloud Digital defines many organization-level preferences, relating to
 * locale, timezone, geolocations, etc, which can be managed within the
 * "Global Preferences" module of the Business Manager, but these preferences
 * are not accessible through this object.
 */
declare class OrganizationPreferences extends ExtensibleObject<ICustomAttributes.OrganizationPreferences> {
    private constructor();
}

export = OrganizationPreferences;
