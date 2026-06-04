/**
 * A class with several utility methods for Date objects.
 * @deprecated See each method for additional information.
 */
declare class DateUtils {
    private constructor();
    /**
     * Returns the current time stamp in the time zone of the
     * instance.
     * @deprecated Use dw.system.System.getCalendar instead.
     */
    static nowForInstance(): Date;
    /**
     * Returns the current timestamp in the time zone of the
     * current site.
     * @deprecated Use dw.system.Site.getCalendar instead.
     */
    static nowForSite(): Date;
    /**
     * Returns the current time stamp in UTC.
     * @deprecated Create a new dw.util.Calendar object and set
     * the time zone "UTC" instead.
     */
    static nowInUTC(): Date;
}

export = DateUtils;
