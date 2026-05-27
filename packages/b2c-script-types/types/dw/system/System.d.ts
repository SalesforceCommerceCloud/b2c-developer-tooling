import OrganizationPreferences = require('./OrganizationPreferences');
import Calendar = require('../util/Calendar');

/**
 * Represents the Commerce Cloud Digital server instance. An application server instance is configured to be of one of three types,
 * "development system", "staging system" or "production system".
 */
declare class System {
    /**
     * Represents the development system.
     */
    static readonly DEVELOPMENT_SYSTEM: number;
    /**
     * Represents the production system.
     */
    static readonly PRODUCTION_SYSTEM: number;
    /**
     * Represents the staging system.
     */
    static readonly STAGING_SYSTEM: number;
    /**
     * Returns a new Calendar object in the time zone of the
     * current instance.
     */
    static readonly calendar: Calendar;
    /**
     * Returns the compatibility mode of the custom code version that is currently active. The compatibility mode is
     * returned as a number, e.g. compatibility mode "15.5" is returned as 1505.
     */
    static readonly compatibilityMode: number;
    /**
     * Returns instance hostname.
     */
    static readonly instanceHostname: string;
    /**
     * Returns the instance time zone. The instance time zone is the time zone in which global actions like jobs or
     * reporting are specified in the system. Keep in mind that the instance time zone is cached at the current session.
     * Changes will affect only new sessions.
     */
    static readonly instanceTimeZone: string;
    /**
     * Returns the type of the instance. An application server instance is configured to be of one of three types,
     * "development system", "staging system" or "production system".
     * 
     * This method returns a constant representing the instance type of this
     * application server.
     * @see DEVELOPMENT_SYSTEM
     * @see PRODUCTION_SYSTEM
     * @see STAGING_SYSTEM
     */
    static readonly instanceType: number;
    /**
     * This method returns a container of all global preferences of this
     * organization (instance).
     */
    static readonly preferences: OrganizationPreferences;
    private constructor();
    /**
     * Returns a new Calendar object in the time zone of the
     * current instance.
     */
    static getCalendar(): Calendar;
    /**
     * Returns the compatibility mode of the custom code version that is currently active. The compatibility mode is
     * returned as a number, e.g. compatibility mode "15.5" is returned as 1505.
     */
    static getCompatibilityMode(): number;
    /**
     * Returns instance hostname.
     */
    static getInstanceHostname(): string;
    /**
     * Returns the instance time zone. The instance time zone is the time zone in which global actions like jobs or
     * reporting are specified in the system. Keep in mind that the instance time zone is cached at the current session.
     * Changes will affect only new sessions.
     */
    static getInstanceTimeZone(): string;
    /**
     * Returns the type of the instance. An application server instance is configured to be of one of three types,
     * "development system", "staging system" or "production system".
     * 
     * This method returns a constant representing the instance type of this
     * application server.
     * @see DEVELOPMENT_SYSTEM
     * @see PRODUCTION_SYSTEM
     * @see STAGING_SYSTEM
     */
    static getInstanceType(): number;
    /**
     * This method returns a container of all global preferences of this
     * organization (instance).
     */
    static getPreferences(): OrganizationPreferences;
}

export = System;
